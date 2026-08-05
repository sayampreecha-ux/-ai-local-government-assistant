import { GP005_KNOWLEDGE } from "./knowledge/index.js";
import { GP005_POLICIES, GP005_PROMPT, GP005_WORKFLOW } from "./definition.js";
import { formatGP005Output } from "./output-engine.js";
import { validateGP005Input, validateGP005Output } from "./validator.js";
import { runBudgetWorkflow } from "./workflow.js";

export class GP005Module {
  #core;
  #lawCopilot;
  #procurementCopilot;
  #financeCopilot;

  constructor(dependencies) {
    for (const name of ["contextManager", "router", "promptRegistry", "knowledgeRegistry", "governance", "observability", "lawCopilot", "procurementCopilot", "financeCopilot"]) {
      if (!dependencies?.[name]) throw new TypeError(`GP005 dependency is required: ${name}`);
    }
    this.#core = dependencies;
    this.#lawCopilot = dependencies.lawCopilot;
    this.#procurementCopilot = dependencies.procurementCopilot;
    this.#financeCopilot = dependencies.financeCopilot;
    this.#bootstrap();
  }

  async execute(rawInput) {
    return this.#core.observability.runInTrace("gp005.execute", async () => {
      const stop = this.#core.observability.startTimer("gp005.execution.duration", { template: rawInput?.template ?? "unknown" });
      this.#core.observability.increment("gp005.requests.total");
      try {
        const input = validateGP005Input(rawInput);
        const route = this.#core.router.routeRequest(`GP005 budget appropriation: ${input.purpose}`);
        if (route.primaryModule !== "GP005") throw new Error("Transaction Router did not select GP005");
        const knowledge = this.#core.knowledgeRegistry.search("", { language: input.language, minConfidence: 0.7 }).filter(({ id }) => id.startsWith("gp005-"));
        for (const entry of knowledge) {
          const decision = this.#core.governance.authorizeKnowledge(entry, input.principal);
          if (decision.status !== "allowed") throw new Error(`Knowledge authorization failed: ${entry.id}`);
        }
        const crossModule = {};
        if (input.legalReviewInput) crossModule.legal = await this.#lawCopilot.execute(input.legalReviewInput);
        if (input.procurementReviewInput) crossModule.procurement = await this.#procurementCopilot.execute(input.procurementReviewInput);
        if (input.financeReviewInput) crossModule.finance = await this.#financeCopilot.execute(input.financeReviewInput);
        this.#core.contextManager.switchModule("GP005");
        const prompt = this.#core.promptRegistry.getPrompt("GP005", GP005_PROMPT.version);
        const authorization = this.#core.governance.authorizePrompt(prompt, input.principal, { requestedAmount: input.requestedAmount });
        if (authorization.status !== "allowed") throw new Error("GP005 prompt authorization failed");
        const result = runBudgetWorkflow(input, knowledge, crossModule);
        validateGP005Output(result);
        const resolvedPrompt = this.#core.promptRegistry.resolvePrompt("GP005", {
          request: input.requestedAmount, classification: input.classification, appropriation: input.allocated,
          knowledge: knowledge.map(({ title }) => title).join("; "), template: input.template, outputFormat: input.outputFormat,
        }, { version: GP005_PROMPT.version });
        const audit = { promptVersion: resolvedPrompt.definition.version, workflow: GP005_WORKFLOW, knowledgeIds: knowledge.map(({ id }) => id), linkedModules: Object.keys(crossModule), risk: result.risk };
        const output = formatGP005Output(result, input.outputFormat, audit);
        this.#core.contextManager.updateContext((context) => ({
          workflowState: { module: "GP005", step: "completed", template: input.template },
          userSelections: { ...context.userSelections, gp005Template: input.template, gp005OutputFormat: input.outputFormat },
          procurementAndBudgetContext: {
            ...context.procurementAndBudgetContext,
            budgetPurpose: input.purpose, classification: input.classification, allocated: input.allocated,
            spent: input.spent, committed: input.committed, requestedAmount: input.requestedAmount,
            available: result.budget.available, sufficient: result.budget.sufficient, fiscalRisk: result.risk.level,
          },
          legalReferences: knowledge.map(({ id, title, metadata }) => ({ id, title, authority: metadata.authority, version: metadata.version })),
        }));
        this.#core.observability.increment("gp005.completed.total", 1, { template: input.template });
        this.#core.observability.emitAudit("gp005.completed", audit);
        stop("ok");
        return { status: "completed", moduleId: "GP005", promptVersion: GP005_PROMPT.version, analysis: result, output };
      } catch (error) {
        this.#core.observability.increment("gp005.failed.total");
        this.#core.observability.captureError(error, { moduleId: "GP005" });
        stop("error");
        throw error;
      }
    });
  }

  #bootstrap() {
    const { promptRegistry, knowledgeRegistry, governance } = this.#core;
    if (!promptRegistry.getPrompt("GP005", GP005_PROMPT.version)) promptRegistry.registerPrompt(GP005_PROMPT);
    for (const entry of GP005_KNOWLEDGE) if (!knowledgeRegistry.getKnowledge(entry.id, entry.metadata.version)) knowledgeRegistry.registerKnowledge(entry);
    const existing = new Set(governance.getPolicySnapshot().map(({ id, version }) => `${id}@${version}`));
    for (const policy of GP005_POLICIES) if (!existing.has(`${policy.id}@${policy.version}`)) governance.registerPolicy(policy);
  }
}
