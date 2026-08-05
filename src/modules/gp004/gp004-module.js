import { GP004_KNOWLEDGE } from "./knowledge/index.js";
import { GP004_POLICIES, GP004_PROMPT, GP004_WORKFLOW } from "./definition.js";
import { formatGP004Output } from "./output-engine.js";
import { validateGP004Input, validateGP004Output } from "./validator.js";
import { runFinanceWorkflow } from "./workflow.js";

export class GP004Module {
  #core;
  #lawCopilot;
  #procurementCopilot;

  constructor(dependencies) {
    for (const name of ["contextManager", "router", "promptRegistry", "knowledgeRegistry", "governance", "observability", "lawCopilot", "procurementCopilot"]) {
      if (!dependencies?.[name]) throw new TypeError(`GP004 dependency is required: ${name}`);
    }
    this.#core = dependencies;
    this.#lawCopilot = dependencies.lawCopilot;
    this.#procurementCopilot = dependencies.procurementCopilot;
    this.#bootstrap();
  }

  async execute(rawInput) {
    return this.#core.observability.runInTrace("gp004.execute", async () => {
      const stop = this.#core.observability.startTimer("gp004.execution.duration", { financeType: rawInput?.financeType ?? "unknown" });
      this.#core.observability.increment("gp004.requests.total");
      try {
        const input = validateGP004Input(rawInput);
        const route = this.#core.router.routeRequest(`GP004 finance budget reimbursement: ${input.purpose}`);
        if (route.primaryModule !== "GP004") throw new Error("Transaction Router did not select GP004");
        const knowledge = this.#core.knowledgeRegistry.search("", { language: input.language, minConfidence: 0.7 })
          .filter(({ id }) => id.startsWith("gp004-"));
        for (const entry of knowledge) {
          const decision = this.#core.governance.authorizeKnowledge(entry, input.principal);
          if (decision.status !== "allowed") throw new Error(`Knowledge authorization failed: ${entry.id}`);
        }
        const crossModule = {};
        if (input.legalReviewInput) crossModule.legal = await this.#lawCopilot.execute(input.legalReviewInput);
        if (input.procurementReviewInput) crossModule.procurement = await this.#procurementCopilot.execute(input.procurementReviewInput);
        this.#core.contextManager.switchModule("GP004");
        const prompt = this.#core.promptRegistry.getPrompt("GP004", GP004_PROMPT.version);
        const authorization = this.#core.governance.authorizePrompt(prompt, input.principal, { requestedAmount: input.requestedAmount });
        if (authorization.status !== "allowed") throw new Error("GP004 prompt authorization failed");
        const result = runFinanceWorkflow(input, knowledge, crossModule);
        validateGP004Output(result);
        const resolvedPrompt = this.#core.promptRegistry.resolvePrompt("GP004", {
          financeType: input.financeType, amount: input.requestedAmount, budget: input.budgetAllocated,
          knowledge: knowledge.map(({ title }) => title).join("; "), template: input.template, outputFormat: input.outputFormat,
        }, { version: GP004_PROMPT.version });
        const audit = { promptVersion: resolvedPrompt.definition.version, knowledgeIds: knowledge.map(({ id }) => id), workflow: GP004_WORKFLOW, linkedModules: Object.keys(crossModule), risk: result.risk };
        const output = formatGP004Output(result, input.outputFormat, audit);
        this.#core.contextManager.updateContext((context) => ({
          workflowState: { module: "GP004", step: "completed", financeType: input.financeType },
          userSelections: { ...context.userSelections, gp004Template: input.template, gp004OutputFormat: input.outputFormat },
          procurementAndBudgetContext: {
            ...context.procurementAndBudgetContext,
            financeType: input.financeType, requestedAmount: input.requestedAmount,
            budgetAllocated: input.budgetAllocated, budgetCommitted: input.budgetCommitted,
            budgetAvailable: result.budget.remainingAfterRequest, financialRisk: result.risk.level,
          },
          legalReferences: knowledge.map(({ id, title, metadata }) => ({ id, title, authority: metadata.authority, version: metadata.version })),
        }));
        this.#core.observability.increment("gp004.completed.total", 1, { financeType: input.financeType });
        this.#core.observability.emitAudit("gp004.completed", audit);
        stop("ok");
        return { status: "completed", moduleId: "GP004", promptVersion: GP004_PROMPT.version, analysis: result, output };
      } catch (error) {
        this.#core.observability.increment("gp004.failed.total");
        this.#core.observability.captureError(error, { moduleId: "GP004" });
        stop("error");
        throw error;
      }
    });
  }

  #bootstrap() {
    const { promptRegistry, knowledgeRegistry, governance } = this.#core;
    if (!promptRegistry.getPrompt("GP004", GP004_PROMPT.version)) promptRegistry.registerPrompt(GP004_PROMPT);
    for (const entry of GP004_KNOWLEDGE) {
      if (!knowledgeRegistry.getKnowledge(entry.id, entry.metadata.version)) knowledgeRegistry.registerKnowledge(entry);
    }
    const existing = new Set(governance.getPolicySnapshot().map(({ id, version }) => `${id}@${version}`));
    for (const policy of GP004_POLICIES) if (!existing.has(`${policy.id}@${policy.version}`)) governance.registerPolicy(policy);
  }
}
