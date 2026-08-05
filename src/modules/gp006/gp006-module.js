import { GP006_KNOWLEDGE } from "./knowledge/index.js";
import { GP006_POLICIES, GP006_PROMPT, GP006_WORKFLOW } from "./definition.js";
import { validateGP006Input, validateGP006Output } from "./validator.js";
import { runHRWorkflow } from "./workflow.js";
import { formatGP006Output } from "./output-engine.js";

export class GP006Module {
  #core; #lawCopilot; #financeCopilot; #budgetCopilot;
  constructor(dependencies) {
    for (const name of ["contextManager", "router", "promptRegistry", "knowledgeRegistry", "governance", "observability", "lawCopilot", "financeCopilot", "budgetCopilot"]) if (!dependencies?.[name]) throw new TypeError(`GP006 dependency is required: ${name}`);
    this.#core = dependencies; this.#lawCopilot = dependencies.lawCopilot; this.#financeCopilot = dependencies.financeCopilot; this.#budgetCopilot = dependencies.budgetCopilot; this.#bootstrap();
  }
  async execute(rawInput) {
    return this.#core.observability.runInTrace("gp006.execute", async () => {
      const stop = this.#core.observability.startTimer("gp006.execution.duration", { action: rawInput?.action ?? "unknown" }); this.#core.observability.increment("gp006.requests.total");
      try {
        const input = validateGP006Input(rawInput); const route = this.#core.router.routeRequest(`GP006 HR personnel ${input.action}`);
        if (route.primaryModule !== "GP006") throw new Error("Transaction Router did not select GP006");
        const knowledge = this.#core.knowledgeRegistry.search("", { language: input.language, minConfidence: 0.7 }).filter(({ id }) => id.startsWith("gp006-"));
        for (const entry of knowledge) if (this.#core.governance.authorizeKnowledge(entry, input.principal).status !== "allowed") throw new Error(`Knowledge authorization failed: ${entry.id}`);
        const crossModule = {};
        if (input.legalReviewInput) crossModule.legal = await this.#lawCopilot.execute(input.legalReviewInput);
        if (input.financeReviewInput) crossModule.finance = await this.#financeCopilot.execute(input.financeReviewInput);
        if (input.budgetReviewInput) crossModule.budget = await this.#budgetCopilot.execute(input.budgetReviewInput);
        this.#core.contextManager.switchModule("GP006");
        const prompt = this.#core.promptRegistry.getPrompt("GP006", GP006_PROMPT.version);
        if (this.#core.governance.authorizePrompt(prompt, input.principal, { action: input.action }).status !== "allowed") throw new Error("GP006 prompt authorization failed");
        const result = runHRWorkflow(input, crossModule); validateGP006Output(result);
        const resolved = this.#core.promptRegistry.resolvePrompt("GP006", { action: input.action, position: input.position.id, knowledge: knowledge.map(({ title }) => title).join("; "), template: input.template, outputFormat: input.outputFormat }, { version: GP006_PROMPT.version });
        const audit = { promptVersion: resolved.definition.version, workflow: GP006_WORKFLOW, knowledgeIds: knowledge.map(({ id }) => id), linkedModules: Object.keys(crossModule), decision: result.hr.decision };
        const output = formatGP006Output(result, input.outputFormat, audit);
        this.#core.contextManager.updateContext((context) => ({ workflowState: { module: "GP006", step: "completed", action: input.action }, userSelections: { ...context.userSelections, gp006Template: input.template, gp006Action: input.action }, legalReferences: knowledge.map(({ id, title, metadata }) => ({ id, title, authority: metadata.authority, version: metadata.version })) }));
        this.#core.observability.increment("gp006.completed.total", 1, { action: input.action }); this.#core.observability.emitAudit("gp006.completed", audit); stop("ok");
        return { status: "completed", moduleId: "GP006", promptVersion: GP006_PROMPT.version, analysis: result, output };
      } catch (error) { this.#core.observability.increment("gp006.failed.total"); this.#core.observability.captureError(error, { moduleId: "GP006" }); stop("error"); throw error; }
    });
  }
  #bootstrap() {
    const { promptRegistry, knowledgeRegistry, governance } = this.#core;
    if (!promptRegistry.getPrompt("GP006", GP006_PROMPT.version)) promptRegistry.registerPrompt(GP006_PROMPT);
    for (const entry of GP006_KNOWLEDGE) if (!knowledgeRegistry.getKnowledge(entry.id, entry.metadata.version)) knowledgeRegistry.registerKnowledge(entry);
    const existing = new Set(governance.getPolicySnapshot().map(({ id, version }) => `${id}@${version}`));
    for (const policy of GP006_POLICIES) if (!existing.has(`${policy.id}@${policy.version}`)) governance.registerPolicy(policy);
  }
}
