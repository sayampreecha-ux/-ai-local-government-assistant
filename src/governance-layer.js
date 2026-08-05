const POLICY_EFFECTS = Object.freeze(["allow", "deny"]);
const SAFETY_EFFECTS = Object.freeze(["deny", "require_approval"]);

function clone(value) {
  return structuredClone(value);
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

function assertString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function assertStringArray(value, field) {
  if (!Array.isArray(value) || !value.length || value.some((item) => typeof item !== "string" || !item)) {
    throw new TypeError(`${field} must be a non-empty string array`);
  }
}

function matches(patterns, value) {
  return patterns.includes("*") || patterns.includes(value);
}

function readPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

export function validatePolicy(policy) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    throw new TypeError("Policy must be an object");
  }
  for (const field of ["id", "version", "description"]) assertString(policy[field], field);
  if (!POLICY_EFFECTS.includes(policy.effect)) throw new RangeError("Invalid policy effect");
  assertStringArray(policy.roles, "roles");
  assertStringArray(policy.actions, "actions");
  assertStringArray(policy.resources, "resources");
  if (policy.requiresApproval !== undefined && typeof policy.requiresApproval !== "boolean") {
    throw new TypeError("requiresApproval must be boolean");
  }
  return true;
}

export function validateSafetyRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    throw new TypeError("Safety rule must be an object");
  }
  for (const field of ["id", "field", "operator", "message"]) assertString(rule[field], field);
  if (!SAFETY_EFFECTS.includes(rule.effect)) throw new RangeError("Invalid safety effect");
  if (!["equals", "includes"].includes(rule.operator)) throw new RangeError("Invalid safety operator");
  if (rule.value === undefined) throw new TypeError("Safety rule value is required");
  return true;
}

/** Deny-by-default policy, safety, validation, and approval boundary. */
export class GovernanceLayer {
  #contextManager;
  #policies = new Map();
  #safetyRules = new Map();
  #validators = new Map();
  #auditHooks = new Set();
  #approvals = new Map();
  #approvalSequence = 0;

  constructor(contextManager, options = {}) {
    if (!contextManager?.getContext || !contextManager?.updateContext) {
      throw new TypeError("GovernanceLayer requires a ContextManager-compatible instance");
    }
    this.#contextManager = contextManager;
    for (const policy of options.policies ?? []) this.registerPolicy(policy, { audit: false });
    for (const rule of options.safetyRules ?? []) this.registerSafetyRule(rule, { audit: false });
  }

  registerPolicy(policy, options = {}) {
    validatePolicy(policy);
    const key = `${policy.id}@${policy.version}`;
    if (this.#policies.has(key)) throw new Error(`Duplicate policy: ${key}`);
    const snapshot = deepFreeze(clone(policy));
    this.#policies.set(key, snapshot);
    if (options.audit !== false) this.#audit("policy.registered", { policyId: policy.id, version: policy.version });
    return snapshot;
  }

  getPolicySnapshot() {
    return deepFreeze(clone([...this.#policies.values()]));
  }

  registerSafetyRule(rule, options = {}) {
    validateSafetyRule(rule);
    if (this.#safetyRules.has(rule.id)) throw new Error(`Duplicate safety rule: ${rule.id}`);
    const snapshot = deepFreeze(clone(rule));
    this.#safetyRules.set(rule.id, snapshot);
    if (options.audit !== false) this.#audit("safety_rule.registered", { ruleId: rule.id });
    return snapshot;
  }

  getSafetyRuleSnapshot() {
    return deepFreeze(clone([...this.#safetyRules.values()]));
  }

  addValidator(name, validator) {
    assertString(name, "validator name");
    if (typeof validator !== "function") throw new TypeError("validator must be a function");
    if (this.#validators.has(name)) throw new Error(`Duplicate validator: ${name}`);
    this.#validators.set(name, validator);
    return () => this.#validators.delete(name);
  }

  addAuditHook(hook) {
    if (typeof hook !== "function") throw new TypeError("audit hook must be a function");
    this.#auditHooks.add(hook);
    return () => this.#auditHooks.delete(hook);
  }

  evaluate(request) {
    this.#validateRequest(request);
    const validation = this.#runValidation(request);
    if (!validation.valid) return this.#decision("denied", request, validation.reason, { validator: validation.validator });

    const safety = this.#evaluateSafety(request);
    if (safety?.effect === "deny") {
      return this.#decision("denied", request, safety.message, { safetyRuleId: safety.id });
    }

    const applicable = [...this.#policies.values()].filter(
      (policy) =>
        matches(policy.roles, request.principal.role) &&
        matches(policy.actions, request.action) &&
        matches(policy.resources, request.resource),
    );
    const denied = applicable.find((policy) => policy.effect === "deny");
    if (denied) return this.#decision("denied", request, denied.description, { policyId: denied.id });
    const allowed = applicable.find((policy) => policy.effect === "allow");
    if (!allowed) return this.#decision("denied", request, "No matching allow policy");
    if (safety?.effect === "require_approval" || allowed.requiresApproval) {
      return this.#createApproval(request, safety?.message ?? allowed.description, allowed.id, safety?.id);
    }
    return this.#decision("allowed", request, allowed.description, { policyId: allowed.id });
  }

  authorizePrompt(promptDefinition, principal, payload = {}) {
    if (!promptDefinition?.moduleId || !Array.isArray(promptDefinition.metadata?.permissions)) {
      throw new TypeError("Invalid prompt definition");
    }
    const decisions = promptDefinition.metadata.permissions.map((action) =>
      this.evaluate({ action, resource: `prompt:${promptDefinition.moduleId}`, principal, payload }),
    );
    return this.#aggregate(decisions);
  }

  authorizeKnowledge(knowledgeDefinition, principal, payload = {}) {
    if (!knowledgeDefinition?.type || !knowledgeDefinition?.id) {
      throw new TypeError("Invalid knowledge definition");
    }
    return this.evaluate({
      action: "knowledge:read",
      resource: `knowledge:${knowledgeDefinition.type}`,
      principal,
      payload: { ...payload, knowledgeId: knowledgeDefinition.id },
    });
  }

  resolveApproval(approvalId, approver, approved, note = "") {
    const approval = this.#approvals.get(approvalId);
    if (!approval) throw new Error(`Approval not found: ${approvalId}`);
    if (approval.status !== "pending") throw new Error("Approval is already resolved");
    assertString(approver?.id, "approver.id");
    assertString(approver?.role, "approver.role");
    if (typeof approved !== "boolean") throw new TypeError("approved must be boolean");
    const resolved = deepFreeze({
      ...clone(approval),
      status: approved ? "approved" : "rejected",
      approver: clone(approver),
      note: String(note),
      resolvedAt: new Date().toISOString(),
    });
    this.#approvals.set(approvalId, resolved);
    this.#audit("approval.resolved", { approvalId, status: resolved.status, approverId: approver.id });
    return resolved;
  }

  getApproval(approvalId) {
    const approval = this.#approvals.get(approvalId);
    return approval ? deepFreeze(clone(approval)) : null;
  }

  #aggregate(decisions) {
    const status = decisions.some(({ status }) => status === "denied")
      ? "denied"
      : decisions.some(({ status }) => status === "approval_required")
        ? "approval_required"
        : "allowed";
    return deepFreeze({ status, decisions: clone(decisions) });
  }

  #runValidation(request) {
    for (const [name, validator] of this.#validators) {
      const result = validator(clone(request));
      if (result === false) return { valid: false, validator: name, reason: `Validation failed: ${name}` };
      if (result && typeof result === "object" && result.valid === false) {
        return { valid: false, validator: name, reason: result.reason ?? `Validation failed: ${name}` };
      }
    }
    return { valid: true };
  }

  #evaluateSafety(request) {
    return [...this.#safetyRules.values()].find((rule) => {
      const actual = readPath(request, rule.field);
      return rule.operator === "equals"
        ? actual === rule.value
        : String(actual ?? "").includes(String(rule.value));
    });
  }

  #createApproval(request, reason, policyId, safetyRuleId) {
    const approvalId = `approval-${++this.#approvalSequence}`;
    const approval = deepFreeze({
      id: approvalId,
      status: "pending",
      request: clone(request),
      reason,
      policyId,
      safetyRuleId,
      createdAt: new Date().toISOString(),
    });
    this.#approvals.set(approvalId, approval);
    return this.#decision("approval_required", request, reason, { approvalId, policyId, safetyRuleId });
  }

  #decision(status, request, reason, details = {}) {
    const decision = deepFreeze({ status, reason, ...details });
    this.#audit("governance.decision", {
      status,
      reason,
      action: request.action,
      resource: request.resource,
      principalId: request.principal.id,
      ...details,
    });
    return decision;
  }

  #audit(type, details) {
    const event = deepFreeze({ type, ...clone(details), timestamp: new Date().toISOString() });
    this.#contextManager.updateContext((context) => ({
      transactionHistory: [...context.transactionHistory, event],
    }));
    for (const hook of this.#auditHooks) hook(clone(event));
  }

  #validateRequest(request) {
    if (!request || typeof request !== "object" || Array.isArray(request)) {
      throw new TypeError("Governance request must be an object");
    }
    assertString(request.action, "action");
    assertString(request.resource, "resource");
    assertString(request.principal?.id, "principal.id");
    assertString(request.principal?.role, "principal.role");
  }
}

export { POLICY_EFFECTS, SAFETY_EFFECTS };
