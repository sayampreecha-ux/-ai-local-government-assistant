# Prompt Registry

## Purpose

`PromptRegistry` is the authoritative runtime catalog for GP001-GP012 prompt
definitions. A definition is addressed by `moduleId` and semantic `version`, making
prompt selection explicit, repeatable, and auditable.

## Definition contract

Every definition contains a prompt `template` plus metadata for `category`, `owner`,
`description`, `requiredInputs`, JSON-style `outputSchema`, and `permissions`.
Registration validates the full contract and verifies that every required input has
a matching `{{placeholder}}`. Registering the same module and version twice fails
without overwriting the existing definition.

The singleton registry starts with one baseline `1.0.0` definition for every module.
Domain owners can register additional versions at runtime. Resolving `latest` uses
numeric semantic-version ordering and returns a cloned definition so callers cannot
mutate registry state.

## Context integration

Runtime registration appends a `prompt.registered` transaction to ContextManager.
Successful rendering appends `prompt.resolved`, including module and version. Initial
baseline seeding is not recorded because it is application bootstrap rather than a
user transaction.

## Usage

```js
registerPrompt({
  moduleId: "GP001",
  version: "1.1.0",
  template: "Draft {{subject}} for {{audience}}",
  metadata: {
    category: "policy",
    owner: "policy-team",
    description: "Draft a policy document",
    requiredInputs: ["subject", "audience"],
    outputSchema: { type: "object" },
    permissions: ["policy:write"],
  },
});

const result = resolvePrompt("GP001", {
  subject: "AI governance",
  audience: "agencies",
});
```

For gradual migration, `register()` aliases `registerPrompt()`, `get()` aliases
`getPrompt()`, and an omitted version resolves to `latest`.
