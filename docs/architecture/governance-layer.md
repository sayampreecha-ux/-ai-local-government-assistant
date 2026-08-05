# Governance Layer

## Purpose

`GovernanceLayer` is the central deny-by-default decision point for GP001-GP012. It
combines validation, safety controls, role-based policy evaluation, prompt and
knowledge authorization, approval workflows, and audit emission behind one API.

## Decision pipeline

1. Validate the request and run registered validators in order.
2. Evaluate declarative safety rules against request fields.
3. Match policies by principal role, action, and resource.
4. Give explicit deny policies precedence over allow policies.
5. Return `approval_required` when a policy or safety rule requires human approval.
6. Emit the final decision to ContextManager and every registered audit hook.

Requests with no matching allow policy are denied. Policy patterns can use `*`, and
policies are versioned by `id@version`. Duplicate versions are rejected.

## Authorization resources

Prompt authorization evaluates every permission in a prompt definition against
`prompt:GPxxx`. Knowledge authorization evaluates `knowledge:read` against
`knowledge:<type>`. The aggregate prompt decision is denied if any permission is
denied and requires approval if any permission does.

## Approval workflow

Approval-required decisions create immutable pending records. `resolveApproval()`
records an approver identity, role, decision, note, and timestamp. Resolved requests
cannot be resolved again. Workflow orchestration remains outside the layer; the
layer owns the authorization record and audit trail.

## Immutability and auditing

Registered policies and safety rules are cloned and deeply frozen. Snapshot APIs
return new deeply frozen copies. Runtime functions used by validators and audit hooks
are intentionally excluded from snapshots. Policy registration, rule registration,
decisions, and approval resolution append events to shared transaction history.

```js
governanceLayer.registerPolicy({
  id: "officer-prompt-access",
  version: "1.0.0",
  description: "Officers may execute GP001 prompts",
  effect: "allow",
  roles: ["officer"],
  actions: ["prompt:execute"],
  resources: ["prompt:GP001"],
});

const decision = authorizePrompt(promptDefinition, {
  id: "user-1",
  role: "officer",
});
```
