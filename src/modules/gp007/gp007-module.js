import { GP007_KNOWLEDGE } from "./knowledge/index.js"; import { GP007_POLICIES, GP007_PROMPT, GP007_WORKFLOW } from "./definition.js"; import { validateGP007Input, validateGP007Output } from "./validator.js"; import { runCouncilWorkflow } from "./workflow.js"; import { formatGP007Output } from "./output-engine.js";
export class GP007Module {
  #core; #lawCopilot; #budgetCopilot; #hrCopilot;
  constructor(dependencies) { for (const name of ["contextManager", "router", "promptRegistry", "knowledgeRegistry", "governance", "observability", "lawCopilot", "budgetCopilot", "hrCopilot"]) if (!dependencies?.[name]) throw new TypeError(`GP007 dependency is required: ${name}`); this.#core = dependencies; this.#lawCopilot = dependencies.lawCopilot; this.#budgetCopilot = dependencies.budgetCopilot; this.#hrCopilot = dependencies.hrCopilot; this.#bootstrap(); }
  async execute(rawInput) {
    return this.#core.observability.runInTrace("gp007.execute", async () => {
      const stop = this.#core.observability.startTimer("gp007.execution.duration", { template: rawInput?.template ?? "unknown" }); this.#core.observability.increment("gp007.requests.total");
      try {
        const input = validateGP007Input(rawInput); const route = this.#core.router.routeRequest(`GP007 council meeting motion ${input.subject}`); if (route.primaryModule !== "GP007") throw new Error("Transaction Router did not select GP007");
        const knowledge = this.#core.knowledgeRegistry.search("", { language: input.language, minConfidence: 0.7 }).filter(({ id }) => id.startsWith("gp007-"));
        for (const entry of knowledge) if (this.#core.governance.authorizeKnowledge(entry, input.principal).status !== "allowed") throw new Error(`Knowledge authorization failed: ${entry.id}`);
        const crossModule = {};
        if (input.legalReviewInput) crossModule.legal = await this.#lawCopilot.execute(input.legalReviewInput);
        if (input.budgetReviewInput) crossModule.budget = await this.#budgetCopilot.execute(input.budgetReviewInput);
        if (input.hrReviewInput) crossModule.hr = await this.#hrCopilot.execute(input.hrReviewInput);
        this.#core.contextManager.switchModule("GP007"); const prompt = this.#core.promptRegistry.getPrompt("GP007", GP007_PROMPT.version);
        if (this.#core.governance.authorizePrompt(prompt, input.principal, { subject: input.subject }).status !== "allowed") throw new Error("GP007 prompt authorization failed");
        const result = runCouncilWorkflow(input, crossModule); validateGP007Output(result);
        const resolved = this.#core.promptRegistry.resolvePrompt("GP007", { councilType: input.councilType, subject: input.subject, knowledge: knowledge.map(({ title }) => title).join("; "), template: input.template, outputFormat: input.outputFormat }, { version: GP007_PROMPT.version });
        const audit = { promptVersion: resolved.definition.version, workflow: GP007_WORKFLOW, knowledgeIds: knowledge.map(({ id }) => id), linkedModules: Object.keys(crossModule), resolutionValid: result.council.resolutionValid, risk: result.council.risk };
        const output = formatGP007Output(result, input.outputFormat, audit);
        this.#core.contextManager.updateContext((context) => ({ workflowState: { module: "GP007", step: "completed", subject: input.subject }, userSelections: { ...context.userSelections, gp007Template: input.template, gp007CouncilType: input.councilType }, legalReferences: knowledge.map(({ id, title, metadata }) => ({ id, title, authority: metadata.authority, version: metadata.version })) }));
        this.#core.observability.increment("gp007.completed.total", 1, { template: input.template }); this.#core.observability.emitAudit("gp007.completed", audit); stop("ok"); return { status: "completed", moduleId: "GP007", promptVersion: GP007_PROMPT.version, analysis: result, output };
      } catch (error) { this.#core.observability.increment("gp007.failed.total"); this.#core.observability.captureError(error, { moduleId: "GP007" }); stop("error"); throw error; }
    });
  }
  #bootstrap() { const { promptRegistry, knowledgeRegistry, governance } = this.#core; if (!promptRegistry.getPrompt("GP007", GP007_PROMPT.version)) promptRegistry.registerPrompt(GP007_PROMPT); for (const entry of GP007_KNOWLEDGE) if (!knowledgeRegistry.getKnowledge(entry.id, entry.metadata.version)) knowledgeRegistry.registerKnowledge(entry); const existing = new Set(governance.getPolicySnapshot().map(({ id, version }) => `${id}@${version}`)); for (const policy of GP007_POLICIES) if (!existing.has(`${policy.id}@${policy.version}`)) governance.registerPolicy(policy); }
}
