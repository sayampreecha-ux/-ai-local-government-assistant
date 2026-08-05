import { MODULES } from "./context-manager.js";

const DEFAULT_OPTIONS = Object.freeze({
  confidenceThreshold: 0.45,
  multiModuleThreshold: 0.3,
  fallbackModule: "GP001",
});

const DEFAULT_DEFINITIONS = Object.freeze(
  Object.fromEntries(
    MODULES.map((moduleId) => [
      moduleId,
      {
        intents: [moduleId.toLowerCase(), moduleId.replace("GP", "gp ").toLowerCase()],
        weight: 1,
      },
    ]),
  ),
);

function tokenize(input) {
  return String(input)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

function validateModule(moduleId, fieldName) {
  if (!MODULES.includes(moduleId)) {
    throw new RangeError(`${fieldName} must be one of GP001-GP012`);
  }
}

function normalizeDefinition(moduleId, definition = {}) {
  validateModule(moduleId, "Module definition key");
  const intents = definition.intents ?? definition.keywords ?? [];
  if (!Array.isArray(intents)) throw new TypeError("Route intents must be an array");
  return {
    intents: intents.map((intent) => String(intent).toLocaleLowerCase()),
    weight: definition.weight ?? 1,
  };
}

/** Deterministic, configurable intent router for GovPrompt modules. */
export class TransactionRouter {
  #contextManager;
  #definitions;
  #options;

  constructor(contextManager, options = {}) {
    if (!contextManager?.getContext || !contextManager?.updateContext || !contextManager?.switchModule) {
      throw new TypeError("TransactionRouter requires a ContextManager-compatible instance");
    }

    const suppliedDefinitions = options.moduleDefinitions ?? options.routes;
    this.#definitions = Object.fromEntries(
      MODULES.map((moduleId) => [
        moduleId,
        normalizeDefinition(
          moduleId,
          suppliedDefinitions?.[moduleId] ?? DEFAULT_DEFINITIONS[moduleId],
        ),
      ]),
    );
    this.#options = { ...DEFAULT_OPTIONS, ...options };
    validateModule(this.#options.fallbackModule, "fallbackModule");
    this.#contextManager = contextManager;
  }

  detectIntent(request) {
    if (typeof request !== "string" || !request.trim()) {
      throw new TypeError("Routing request must be a non-empty string");
    }

    const normalized = request.normalize("NFKC").toLocaleLowerCase();
    const requestTokens = new Set(tokenize(normalized));
    const scores = MODULES.map((moduleId) => {
      const definition = this.#definitions[moduleId];
      let matchedWeight = 0;
      let totalWeight = 0;

      for (const intent of definition.intents) {
        const intentTokens = tokenize(intent);
        const weight = definition.weight / Math.max(intentTokens.length, 1);
        totalWeight += definition.weight;
        const phraseMatch = normalized.includes(intent);
        const tokenMatches = intentTokens.filter((token) => requestTokens.has(token)).length;
        matchedWeight += phraseMatch
          ? definition.weight
          : weight * tokenMatches;
      }

      const confidence = totalWeight === 0 ? 0 : Math.min(1, matchedWeight / totalWeight);
      return { moduleId, confidence, matched: confidence > 0 };
    });

    return scores.sort(
      (left, right) => right.confidence - left.confidence || left.moduleId.localeCompare(right.moduleId),
    );
  }

  routeRequest(request, options = {}) {
    const settings = { ...this.#options, ...options };
    const ranked = this.detectIntent(request);
    const qualifying = ranked.filter(
      ({ confidence }) => confidence >= settings.multiModuleThreshold,
    );
    const primaryCandidate = ranked[0];
    const usedFallback = primaryCandidate.confidence < settings.confidenceThreshold;
    const context = this.#contextManager.getContext();
    const fallbackModule = context.activeModule ?? settings.fallbackModule;
    validateModule(fallbackModule, "fallbackModule");

    const primaryModule = usedFallback ? fallbackModule : primaryCandidate.moduleId;
    const modules = usedFallback
      ? [primaryModule]
      : [primaryModule, ...qualifying.map(({ moduleId }) => moduleId)].filter(
          (moduleId, index, all) => all.indexOf(moduleId) === index,
        );
    const result = {
      primaryModule,
      modules,
      confidence: usedFallback ? 0 : primaryCandidate.confidence,
      usedFallback,
      scores: ranked.map(({ moduleId, confidence }) => ({ moduleId, confidence })),
    };

    this.#contextManager.updateContext((current) => ({
      transactionHistory: [
        ...current.transactionHistory,
        {
          type: "request.routed",
          request,
          primaryModule,
          modules,
          confidence: result.confidence,
          usedFallback,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
    this.#contextManager.switchModule(primaryModule);
    return result;
  }

  // Compatibility with the original router surface.
  route(request, options) {
    const result = this.routeRequest(request, options);
    return { ...result, module: result.primaryModule };
  }
}

export { DEFAULT_DEFINITIONS, DEFAULT_OPTIONS };
