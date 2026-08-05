const KNOWLEDGE_TYPES = Object.freeze([
  "law",
  "regulation",
  "circular",
  "manual",
  "template",
  "faq",
  "dataset",
]);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function clone(value) {
  return structuredClone(value);
}

function assertString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function normalizeText(value) {
  return String(value).normalize("NFKC").toLocaleLowerCase();
}

function tokens(value) {
  return normalizeText(value).match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function validateKnowledgeDefinition(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    throw new TypeError("Knowledge definition must be an object");
  }
  for (const field of ["id", "title"]) assertString(definition[field], field);
  if (!KNOWLEDGE_TYPES.includes(definition.type)) {
    throw new RangeError(`type must be one of: ${KNOWLEDGE_TYPES.join(", ")}`);
  }
  if (definition.content === undefined && definition.reference === undefined) {
    throw new TypeError("content or reference is required");
  }

  const metadata = definition.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new TypeError("metadata must be an object");
  }
  for (const field of ["source", "authority", "version", "category", "language"]) {
    assertString(metadata[field], `metadata.${field}`);
  }
  if (!DATE_PATTERN.test(metadata.effectiveDate) || Number.isNaN(Date.parse(metadata.effectiveDate))) {
    throw new TypeError("metadata.effectiveDate must be a valid YYYY-MM-DD date");
  }
  if (!Array.isArray(metadata.tags) || metadata.tags.some((tag) => typeof tag !== "string" || !tag)) {
    throw new TypeError("metadata.tags must be an array of non-empty strings");
  }
  if (
    typeof metadata.confidence !== "number" ||
    !Number.isFinite(metadata.confidence) ||
    metadata.confidence < 0 ||
    metadata.confidence > 1
  ) {
    throw new RangeError("metadata.confidence must be between 0 and 1");
  }
  return true;
}

function sourceKey(definition) {
  return [
    definition.type,
    normalizeText(definition.metadata.authority),
    normalizeText(definition.metadata.source),
    normalizeText(definition.metadata.version),
  ].join("|");
}

/** Append-only government knowledge catalog with immutable reads. */
export class KnowledgeRegistry {
  #contextManager;
  #entries = new Map();
  #sourceKeys = new Set();

  constructor(contextManager, definitions = []) {
    if (!contextManager?.getContext || !contextManager?.updateContext) {
      throw new TypeError("KnowledgeRegistry requires a ContextManager-compatible instance");
    }
    this.#contextManager = contextManager;
    for (const definition of definitions) this.#store(definition, false);
  }

  registerKnowledge(definition) {
    return this.#store(definition, true);
  }

  getKnowledge(id, version = "latest") {
    assertString(id, "id");
    const history = this.#entries.get(id);
    if (!history?.length) return null;
    const entry =
      version === "latest"
        ? [...history].sort(
            (left, right) =>
              right.metadata.effectiveDate.localeCompare(left.metadata.effectiveDate) ||
              right.registeredAt.localeCompare(left.registeredAt),
          )[0]
        : history.find((candidate) => candidate.metadata.version === version);
    return entry ? clone(entry) : null;
  }

  getVersionHistory(id) {
    assertString(id, "id");
    return clone(this.#entries.get(id) ?? []);
  }

  search(query = "", filters = {}) {
    if (typeof query !== "string") throw new TypeError("query must be a string");
    const queryTokens = new Set(tokens(query));
    const requestedTags = filters.tags?.map(normalizeText) ?? [];
    if (filters.type && !KNOWLEDGE_TYPES.includes(filters.type)) {
      throw new RangeError("Unknown knowledge type filter");
    }

    const results = [...this.#entries.values()].flatMap((history) => history).filter((entry) => {
      const metadata = entry.metadata;
      return (
        (!filters.type || entry.type === filters.type) &&
        (!filters.category || normalizeText(metadata.category) === normalizeText(filters.category)) &&
        (!filters.language || normalizeText(metadata.language) === normalizeText(filters.language)) &&
        (!filters.authority || normalizeText(metadata.authority) === normalizeText(filters.authority)) &&
        (filters.minConfidence === undefined || metadata.confidence >= filters.minConfidence) &&
        requestedTags.every((tag) => metadata.tags.map(normalizeText).includes(tag))
      );
    }).map((entry) => {
      const searchable = tokens([
        entry.title,
        entry.type,
        entry.metadata.source,
        entry.metadata.authority,
        entry.metadata.category,
        ...entry.metadata.tags,
      ].join(" "));
      const matched = queryTokens.size === 0
        ? 0
        : [...queryTokens].filter((token) => searchable.includes(token)).length;
      return { entry, score: queryTokens.size === 0 ? 1 : matched / queryTokens.size };
    }).filter(({ score }) => score > 0).sort(
      (left, right) =>
        right.score - left.score ||
        right.entry.metadata.confidence - left.entry.metadata.confidence ||
        right.entry.metadata.effectiveDate.localeCompare(left.entry.metadata.effectiveDate),
    ).map(({ entry, score }) => ({ ...clone(entry), searchScore: score }));

    this.#record("knowledge.searched", { query, resultCount: results.length });
    return results;
  }

  // Compatibility aliases for earlier catalog integrations.
  register(definition) {
    return this.registerKnowledge(definition);
  }

  get(id, version) {
    return this.getKnowledge(id, version);
  }

  #store(definition, record) {
    validateKnowledgeDefinition(definition);
    const duplicateKey = sourceKey(definition);
    const history = this.#entries.get(definition.id) ?? [];
    if (history.some((entry) => entry.metadata.version === definition.metadata.version)) {
      throw new Error(`Duplicate knowledge version: ${definition.id}@${definition.metadata.version}`);
    }
    if (this.#sourceKeys.has(duplicateKey)) {
      throw new Error("Duplicate knowledge source and version");
    }

    const stored = { ...clone(definition), registeredAt: new Date().toISOString() };
    history.push(stored);
    this.#entries.set(stored.id, history);
    this.#sourceKeys.add(duplicateKey);
    if (record) {
      this.#record("knowledge.registered", {
        knowledgeId: stored.id,
        knowledgeType: stored.type,
        version: stored.metadata.version,
      });
    }
    return clone(stored);
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

export { KNOWLEDGE_TYPES };
