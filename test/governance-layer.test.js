import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager } from "../src/context-manager.js";
import { GovernanceLayer, validatePolicy } from "../src/governance-layer.js";

function allow(overrides = {}) {
  return {
    id: "allow-officer",
    version: "1.0.0",
    description: "Officers may execute prompts",
    effect: "allow",
    roles: ["officer"],
    actions: ["prompt:execute"],
    resources: ["prompt:GP001"],
    ...overrides,
  };
}

const principal = { id: "user-1", role: "officer" };
const request = {
  action: "prompt:execute",
  resource: "prompt:GP001",
  principal,
  payload: { text: "draft" },
};

test("allows matching role, action, and resource policies", () => {
  const layer = new GovernanceLayer(new ContextManager(), { policies: [allow()] });
  assert.equal(layer.evaluate(request).status, "allowed");
});

test("denies by default and gives deny policies precedence", () => {
  const layer = new GovernanceLayer(new ContextManager(), {
    policies: [
      allow(),
      allow({ id: "deny-user", effect: "deny", description: "Blocked" }),
    ],
  });
  assert.equal(layer.evaluate(request).status, "denied");
  assert.equal(layer.evaluate({ ...request, resource: "prompt:GP002" }).reason, "No matching allow policy");
});

test("runs validation pipeline before policies", () => {
  const layer = new GovernanceLayer(new ContextManager(), { policies: [allow()] });
  layer.addValidator("non-empty", ({ payload }) => ({
    valid: Boolean(payload.text),
    reason: "Text is required",
  }));
  assert.equal(layer.evaluate({ ...request, payload: { text: "" } }).reason, "Text is required");
});

test("applies safety denial rules", () => {
  const layer = new GovernanceLayer(new ContextManager(), {
    policies: [allow()],
    safetyRules: [{
      id: "no-secret",
      field: "payload.text",
      operator: "includes",
      value: "SECRET",
      effect: "deny",
      message: "Sensitive content blocked",
    }],
  });
  assert.equal(layer.evaluate({ ...request, payload: { text: "SECRET data" } }).status, "denied");
});

test("supports approval-required policies and resolution", () => {
  const layer = new GovernanceLayer(new ContextManager(), {
    policies: [allow({ requiresApproval: true })],
  });
  const decision = layer.evaluate(request);
  assert.equal(decision.status, "approval_required");
  const approval = layer.resolveApproval(
    decision.approvalId,
    { id: "chief-1", role: "approver" },
    true,
  );
  assert.equal(approval.status, "approved");
  assert.equal(layer.getApproval(decision.approvalId).approver.id, "chief-1");
});

test("authorizes every permission declared by a prompt", () => {
  const layer = new GovernanceLayer(new ContextManager(), { policies: [allow()] });
  const result = layer.authorizePrompt({
    moduleId: "GP001",
    metadata: { permissions: ["prompt:execute"] },
  }, principal);
  assert.equal(result.status, "allowed");
});

test("authorizes knowledge using its type as the resource", () => {
  const layer = new GovernanceLayer(new ContextManager(), {
    policies: [allow({ actions: ["knowledge:read"], resources: ["knowledge:law"] })],
  });
  assert.equal(layer.authorizeKnowledge({ id: "law-1", type: "law" }, principal).status, "allowed");
});

test("emits audit hooks and ContextManager transactions", () => {
  const contextManager = new ContextManager();
  const layer = new GovernanceLayer(contextManager, { policies: [allow()] });
  const events = [];
  layer.addAuditHook((event) => events.push(event));
  layer.evaluate(request);
  assert.equal(events[0].type, "governance.decision");
  assert.equal(contextManager.getContext().transactionHistory.at(-1).type, "governance.decision");
});

test("returns deeply immutable policy and safety snapshots", () => {
  const layer = new GovernanceLayer(new ContextManager(), { policies: [allow()] });
  const snapshot = layer.getPolicySnapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot[0].roles), true);
  assert.throws(() => snapshot[0].roles.push("admin"), TypeError);
});

test("validates policies and rejects duplicate versions", () => {
  const invalid = allow({ roles: [] });
  assert.throws(() => validatePolicy(invalid), /non-empty string array/);
  const layer = new GovernanceLayer(new ContextManager(), { policies: [allow()] });
  assert.throws(() => layer.registerPolicy(allow()), /Duplicate policy/);
});
