import { MODULES } from "./context-manager.js";

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function clone(value) {
  return structuredClone(value);
}

function assertString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function validateStringArray(value, field) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item)) {
    throw new TypeError(`${field} must be an array of non-empty strings`);
  }
}

export function validatePromptDefinition(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    throw new TypeError("Prompt definition must be an object");
  }
  if (!MODULES.includes(definition.moduleId)) {
    throw new RangeError("moduleId must be one of GP001-GP012");
  }
  assertString(definition.version, "version");
  if (!VERSION_PATTERN.test(definition.version)) {
    throw new TypeError("version must use semantic versioning");
  }
  assertString(definition.template, "template");

  const metadata = definition.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new TypeError("metadata must be an object");
  }
  for (const field of ["category", "owner", "description"]) {
    assertString(metadata[field], `metadata.${field}`);
  }
  validateStringArray(metadata.requiredInputs, "metadata.requiredInputs");
  validateStringArray(metadata.permissions, "metadata.permissions");
  if (!metadata.outputSchema || typeof metadata.outputSchema !== "object" || Array.isArray(metadata.outputSchema)) {
    throw new TypeError("metadata.outputSchema must be an object");
  }

  const placeholders = new Set(
    [...definition.template.matchAll(/{{\s*([\w.-]+)\s*}}/g)].map((match) => match[1]),
  );
  const missingPlaceholders = metadata.requiredInputs.filter((input) => !placeholders.has(input));
  if (missingPlaceholders.length) {
    throw new TypeError(`Required inputs missing from template: ${missingPlaceholders.join(", ")}`);
  }
  return true;
}

function compareVersions(left, right) {
  const parse = (version) => version.split("-")[0].split(".").map(Number);
  const a = parse(left);
  const b = parse(right);
  return b[0] - a[0] || b[1] - a[1] || b[2] - a[2] || right.localeCompare(left);
}

function defaultDefinition(moduleId) {
  return {
    moduleId,
    version: "1.0.0",
    template: `Process the following ${moduleId} request: {{request}}`,
    metadata: {
      category: "governance",
      owner: "governance-core",
      description: `Default prompt definition for ${moduleId}`,
      requiredInputs: ["request"],
      outputSchema: { type: "object", additionalProperties: true },
      permissions: ["prompt:execute"],
    },
  };
}

export const DEFAULT_PROMPTS = Object.freeze(MODULES.map(defaultDefinition));

/** Versioned runtime prompt catalog shared by all GovPrompt modules. */
export class PromptRegistry {
  #contextManager;
  #prompts = new Map();

  constructor(contextManager, definitions = DEFAULT_PROMPTS) {
    if (!contextManager?.getContext || !contextManager?.updateContext) {
      throw new TypeError("PromptRegistry requires a ContextManager-compatible instance");
    }
    this.#contextManager = contextManager;
    for (const definition of definitions) this.#store(definition, false);
  }

  registerPrompt(definition) {
    return this.#store(definition, true);
  }

  getPrompt(moduleId, version = "latest") {
    if (!MODULES.includes(moduleId)) throw new RangeError("Unknown GovPrompt module");
    const versions = this.#prompts.get(moduleId);
    if (!versions?.size) return null;
    const resolvedVersion =
      version === "latest"
        ? [...versions.keys()].sort(compareVersions)[0]
        : version;
    const prompt = versions.get(resolvedVersion);
    return prompt ? clone(prompt) : null;
  }

  listPrompts(moduleId) {
    if (moduleId !== undefined && !MODULES.includes(moduleId)) {
      throw new RangeError("Unknown GovPrompt module");
    }
    const modules = moduleId ? [moduleId] : MODULES;
    return modules.flatMap((id) =>
      [...(this.#prompts.get(id)?.values() ?? [])].map(clone),
    );
  }

  resolvePrompt(moduleId, inputs, options = {}) {
    const prompt = this.getPrompt(moduleId, options.version ?? "latest");
    if (!prompt) throw new Error(`Prompt not found: ${moduleId}@${options.version ?? "latest"}`);
    if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) {
      throw new TypeError("Prompt inputs must be an object");
    }
    const missing = prompt.metadata.requiredInputs.filter(
      (input) => !(input in inputs) || inputs[input] === undefined,
    );
    if (missing.length) throw new TypeError(`Missing required inputs: ${missing.join(", ")}`);

    const renderedPrompt = prompt.template.replace(
      /{{\s*([\w.-]+)\s*}}/g,
      (placeholder, key) => (key in inputs ? String(inputs[key]) : placeholder),
    );
    this.#record("prompt.resolved", { moduleId, version: prompt.version });
    return { definition: prompt, renderedPrompt };
  }

  // Legacy aliases retained for modules migrating from unversioned prompt stores.
  register(definition) {
    return this.registerPrompt(definition);
  }

  get(moduleId, version) {
    return this.getPrompt(moduleId, version);
  }

  #store(definition, record) {
    validatePromptDefinition(definition);
    const prompt = clone(definition);
    const versions = this.#prompts.get(prompt.moduleId) ?? new Map();
    if (versions.has(prompt.version)) {
      throw new Error(`Duplicate prompt: ${prompt.moduleId}@${prompt.version}`);
    }
    versions.set(prompt.version, prompt);
    this.#prompts.set(prompt.moduleId, versions);
    if (record) this.#record("prompt.registered", { moduleId: prompt.moduleId, version: prompt.version });
    return clone(prompt);
  }

  #record(type, details) {
    this.#contextManager.updateContext((context) => ({
      transactionHistory: [
        ...context.transactionHistory,
        { type, ...details, timestamp: new Date().toISOString() },
      ],
    }));
  }
}
