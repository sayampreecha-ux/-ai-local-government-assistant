import { renderOfficialDocument, GP001_TEMPLATE_TYPES } from "./templates.js";
import {
  GP001_KNOWLEDGE,
  GP001_PDPA_RULE,
  GP001_POLICIES,
  GP001_PROMPT,
} from "./definitions.js";

const PDPA_PATTERNS = Object.freeze([
  { type: "national-id", pattern: /\b\d{13}\b/g },
  { type: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: "phone", pattern: /\b0\d{8,9}\b/g },
]);

function assertString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`);
}

export class GP001Module {
  #contextManager;
  #router;
  #promptRegistry;
  #knowledgeRegistry;
  #governance;
  #observability;
  #executor;

  constructor(dependencies, options = {}) {
    const required = [
      "contextManager", "router", "promptRegistry", "knowledgeRegistry", "governance", "observability",
    ];
    for (const name of required) {
      if (!dependencies?.[name]) throw new TypeError(`GP001 dependency is required: ${name}`);
    }
    this.#contextManager = dependencies.contextManager;
    this.#router = dependencies.router;
    this.#promptRegistry = dependencies.promptRegistry;
    this.#knowledgeRegistry = dependencies.knowledgeRegistry;
    this.#governance = dependencies.governance;
    this.#observability = dependencies.observability;
    this.#executor = options.executor ?? (({ input, legalReferences }) => renderOfficialDocument(input, legalReferences));
    this.#bootstrap();
  }

  async execute(rawInput) {
    return this.#observability.runInTrace("gp001.execute", async () => {
      const stop = this.#observability.startTimer("gp001.execution.duration", {
        templateType: rawInput?.templateType ?? "unknown",
      });
      this.#observability.increment("gp001.requests.total");
      try {
        const input = this.#validateInput(rawInput);
        const route = this.#router.routeRequest(`GP001 official letter: ${input.instructions}`);
        if (route.primaryModule !== "GP001") throw new Error("Transaction Router did not select GP001");

        const pdpaFindings = this.detectPDPA(input);
        const knowledge = this.#retrieveKnowledge(input, pdpaFindings.length > 0);
        this.#authorizeKnowledge(knowledge, input.principal);
        const legalReferences = this.#validateLegalKnowledge(knowledge, pdpaFindings.length > 0);
        const prompt = this.#promptRegistry.getPrompt("GP001", "2.0.0");
        const authorization = this.#governance.authorizePrompt(prompt, input.principal, {
          pdpaDetected: pdpaFindings.length > 0,
        });
        if (authorization.status !== "allowed") {
          this.#observability.increment("gp001.approvals.required");
          this.#observability.emitAudit("gp001.approval_required", {
            subject: input.subject,
            pdpaFindings: pdpaFindings.map(({ type }) => type),
            authorization,
          });
          stop("approval_required");
          return { status: "approval_required", authorization, pdpaFindings };
        }

        const resolvedPrompt = this.#promptRegistry.resolvePrompt("GP001", {
          letterType: input.templateType,
          language: input.language,
          instructions: input.instructions,
          knowledge: legalReferences.map(({ title }) => title).join("; "),
        }, { version: "2.0.0" });
        const document = await this.#executor({ input, legalReferences, resolvedPrompt });
        this.#validateOutput(document);
        this.#contextManager.updateContext((context) => ({
          workflowState: { module: "GP001", step: "completed", templateType: input.templateType },
          userSelections: { ...context.userSelections, gp001Template: input.templateType },
          uploadedDocumentReferences: [
            ...context.uploadedDocumentReferences,
            ...(input.uploadedDocumentReferences ?? []),
          ],
          legalReferences: legalReferences.map(({ id, title, metadata }) => ({
            id, title, version: metadata.version, authority: metadata.authority,
          })),
        }));
        this.#observability.increment("gp001.completed.total", 1, { templateType: input.templateType });
        this.#observability.emitAudit("gp001.completed", {
          templateType: input.templateType,
          subject: input.subject,
          promptVersion: resolvedPrompt.definition.version,
          knowledgeIds: legalReferences.map(({ id }) => id),
        });
        stop("ok");
        return {
          status: "completed",
          moduleId: "GP001",
          promptVersion: resolvedPrompt.definition.version,
          pdpaFindings,
          document,
        };
      } catch (error) {
        this.#observability.increment("gp001.failed.total");
        this.#observability.captureError(error, { moduleId: "GP001" });
        stop("error");
        throw error;
      }
    });
  }

  detectPDPA(input) {
    const text = [input.subject, input.instructions, ...(input.recipients ?? [])].join(" ");
    return PDPA_PATTERNS.flatMap(({ type, pattern }) =>
      [...text.matchAll(new RegExp(pattern.source, pattern.flags))].map((match) => ({
        type,
        maskedValue: `${match[0].slice(0, 2)}***${match[0].slice(-2)}`,
      })),
    );
  }

  #validateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("GP001 input must be an object");
    }
    assertString(input.subject, "subject");
    assertString(input.instructions, "instructions");
    assertString(input.principal?.id, "principal.id");
    assertString(input.principal?.role, "principal.role");
    if (!GP001_TEMPLATE_TYPES.includes(input.templateType)) throw new RangeError("Invalid templateType");
    if (!Array.isArray(input.recipients) || !input.recipients.length) {
      throw new TypeError("recipients must be a non-empty array");
    }
    input.recipients.forEach((recipient) => assertString(recipient, "recipient"));
    return {
      language: "th",
      uploadedDocumentReferences: [],
      ...structuredClone(input),
    };
  }

  #retrieveKnowledge(input, pdpaDetected) {
    const categories = new Set(["official-letter-standard"]);
    if (["order", "announcement"].includes(input.templateType)) categories.add("administrative-procedure");
    if (input.localGovernment) categories.add("local-government");
    if (pdpaDetected) categories.add("pdpa");
    return [...categories].flatMap((category) =>
      this.#knowledgeRegistry.search("", { category, language: input.language }),
    );
  }

  #authorizeKnowledge(entries, principal) {
    for (const entry of entries) {
      const decision = this.#governance.authorizeKnowledge(entry, principal);
      if (decision.status !== "allowed") {
        throw new Error(`Knowledge authorization failed: ${entry.id}`);
      }
    }
  }

  #validateLegalKnowledge(entries, pdpaDetected) {
    const categories = new Set(entries.map(({ metadata }) => metadata.category));
    if (!categories.has("official-letter-standard")) throw new Error("Official letter standard is required");
    if (pdpaDetected && !categories.has("pdpa")) throw new Error("PDPA knowledge is required");
    if (entries.some(({ metadata }) => metadata.confidence < 0.8)) {
      throw new Error("Legal knowledge confidence is below GP001 threshold");
    }
    return entries;
  }

  #validateOutput(output) {
    if (!output || typeof output !== "object" || Array.isArray(output)) throw new TypeError("Invalid GP001 output");
    const required = GP001_PROMPT.metadata.outputSchema.required;
    const missing = required.filter((field) => !(field in output));
    if (missing.length) throw new TypeError(`GP001 output missing: ${missing.join(", ")}`);
  }

  #bootstrap() {
    if (!this.#promptRegistry.getPrompt("GP001", GP001_PROMPT.version)) {
      this.#promptRegistry.registerPrompt(GP001_PROMPT);
    }
    for (const entry of GP001_KNOWLEDGE) {
      if (!this.#knowledgeRegistry.getKnowledge(entry.id, entry.metadata.version)) {
        this.#knowledgeRegistry.registerKnowledge(entry);
      }
    }
    const policyKeys = new Set(this.#governance.getPolicySnapshot().map(({ id, version }) => `${id}@${version}`));
    for (const policy of GP001_POLICIES) {
      if (!policyKeys.has(`${policy.id}@${policy.version}`)) this.#governance.registerPolicy(policy);
    }
    const safetyIds = new Set(this.#governance.getSafetyRuleSnapshot().map(({ id }) => id));
    if (!safetyIds.has(GP001_PDPA_RULE.id)) this.#governance.registerSafetyRule(GP001_PDPA_RULE);
  }
}
