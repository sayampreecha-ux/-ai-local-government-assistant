const MODULES = Object.freeze(
  Array.from({ length: 12 }, (_, index) => `GP${String(index + 1).padStart(3, "0")}`),
);

const LEGACY_KEYS = Object.freeze({
  currentModule: "activeModule",
  sessionData: "userSelections",
  documents: "uploadedDocumentReferences",
  legalContext: "legalReferences",
  procurementContext: "procurementAndBudgetContext",
  history: "transactionHistory",
});

function emptyContext() {
  return {
    activeModule: null,
    workflowState: {},
    userSelections: {},
    uploadedDocumentReferences: [],
    legalReferences: [],
    procurementAndBudgetContext: {},
    transactionHistory: [],
  };
}

function clone(value) {
  return structuredClone(value);
}

function normalizePatch(patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new TypeError("Context update must be an object");
  }

  const normalized = { ...patch };
  for (const [legacyKey, canonicalKey] of Object.entries(LEGACY_KEYS)) {
    if (legacyKey in normalized && !(canonicalKey in normalized)) {
      normalized[canonicalKey] = normalized[legacyKey];
    }
    delete normalized[legacyKey];
  }
  return normalized;
}

function withLegacyAliases(context) {
  const result = clone(context);
  for (const [legacyKey, canonicalKey] of Object.entries(LEGACY_KEYS)) {
    Object.defineProperty(result, legacyKey, {
      configurable: true,
      enumerable: false,
      get: () => result[canonicalKey],
    });
  }
  return result;
}

/** Central state boundary shared by GP001-GP012. */
export class ContextManager {
  #context;
  #listeners = new Set();

  constructor(initialContext = {}) {
    this.#context = { ...emptyContext(), ...normalizePatch(initialContext) };
    this.#validate(this.#context);
  }

  getContext() {
    return withLegacyAliases(this.#context);
  }

  updateContext(patchOrUpdater) {
    const current = this.getContext();
    const patch =
      typeof patchOrUpdater === "function" ? patchOrUpdater(current) : patchOrUpdater;
    const next = { ...this.#context, ...normalizePatch(patch) };
    this.#validate(next);
    this.#context = clone(next);
    this.#emit("context.updated");
    return this.getContext();
  }

  clearContext() {
    this.#context = emptyContext();
    this.#emit("context.cleared");
    return this.getContext();
  }

  switchModule(moduleId, workflowState) {
    if (!MODULES.includes(moduleId)) {
      throw new RangeError(`Unknown GovPrompt module: ${moduleId}`);
    }
    const previousModule = this.#context.activeModule;
    this.#context = {
      ...this.#context,
      activeModule: moduleId,
      workflowState:
        workflowState === undefined ? this.#context.workflowState : clone(workflowState),
      transactionHistory: [
        ...this.#context.transactionHistory,
        {
          type: "module.switch",
          from: previousModule,
          to: moduleId,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    this.#emit("module.switched");
    return this.getContext();
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("Listener must be a function");
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #emit(type) {
    const snapshot = this.getContext();
    for (const listener of this.#listeners) listener({ type, context: snapshot });
  }

  #validate(context) {
    if (context.activeModule !== null && !MODULES.includes(context.activeModule)) {
      throw new RangeError(`Unknown GovPrompt module: ${context.activeModule}`);
    }
    if (!Array.isArray(context.uploadedDocumentReferences)) {
      throw new TypeError("uploadedDocumentReferences must be an array");
    }
    if (!Array.isArray(context.legalReferences)) {
      throw new TypeError("legalReferences must be an array");
    }
    if (!Array.isArray(context.transactionHistory)) {
      throw new TypeError("transactionHistory must be an array");
    }
  }
}

export { MODULES };
