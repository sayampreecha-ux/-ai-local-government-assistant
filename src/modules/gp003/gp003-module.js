import { GP003_KNOWLEDGE } from "./knowledge/index.js";
import { GP003_POLICIES, GP003_PROMPT, GP003_WORKFLOW } from "./definition.js";
import { formatGP003Output } from "./output-engine.js";
import { validateGP003Input, validateGP003Output } from "./validator.js";
import { runProcurementWorkflow } from "./workflow.js";

export class GP003Module {
  #core;

  constructor(core) {
    for (const name of ["contextManager", "router", "promptRegistry", "knowledgeRegistry", "governance", "observability"]) {
      if (!core?.[name]) throw new TypeError(`GP003 dependency is required: ${name}`);
    }
    this.#core = core;
    this.#bootstrap();
  }

  async execute(rawInput) {
    return this.#core.observability.runInTrace("gp003.execute", async () => {
      const stop = this.#core.observability.startTimer("gp003.execution.duration", { template: rawInput?.template ?? "unknown" });
      this.#core.observability.increment("gp003.requests.total");
      try {
        const input = validateGP003Input(rawInput);
        const route = this.#core.router.routeRequest(`GP003 procurement TOR: ${input.objective}`);
        if (route.primaryModule !== "GP003") throw new Error("Transaction Router did not select GP003");
        const knowledge = this.#core.knowledgeRegistry.search("", { language: input.language, minConfidence: 0.7 })
          .filter(({ id }) => id.startsWith("gp003-"));
        for (const entry of knowledge) {
          const authorization = this.#core.governance.authorizeKnowledge(entry, input.principal);
          if (authorization.status !== "allowed") throw new Error(`Knowledge authorization failed: ${entry.id}`);
        }
        const prompt = this.#core.promptRegistry.getPrompt("GP003", GP003_PROMPT.version);
        const authorization = this.#core.governance.authorizePrompt(prompt, input.principal, {
          estimatedBudget: input.estimatedBudget,
        });
        if (authorization.status !== "allowed") throw new Error("GP003 prompt authorization failed");
        const result = runProcurementWorkflow(input, knowledge);
        validateGP003Output(result);
        const resolvedPrompt = this.#core.promptRegistry.resolvePrompt("GP003", {
          objective: input.objective,
          budget: input.estimatedBudget,
          knowledge: knowledge.map(({ title }) => title).join("; "),
          template: input.template,
          outputFormat: input.outputFormat,
        }, { version: GP003_PROMPT.version });
        const audit = {
          promptVersion: resolvedPrompt.definition.version,
          knowledgeIds: knowledge.map(({ id }) => id),
          workflow: GP003_WORKFLOW,
          risk: result.risk,
        };
        const output = formatGP003Output(result, input.outputFormat, audit);
        this.#core.contextManager.updateContext((context) => ({
          workflowState: { module: "GP003", step: "completed", template: input.template },
          userSelections: { ...context.userSelections, gp003Template: input.template, gp003OutputFormat: input.outputFormat },
          procurementAndBudgetContext: {
            objective: input.objective,
            estimatedBudget: input.estimatedBudget,
            recommendedMethod: result.procurement.recommendedMethod,
            competitionLevel: result.competition.level,
            riskLevel: result.risk.level,
          },
          legalReferences: knowledge.map(({ id, title, metadata }) => ({
            id, title, authority: metadata.authority, version: metadata.version,
          })),
        }));
        this.#core.observability.increment("gp003.completed.total", 1, { template: input.template });
        this.#core.observability.emitAudit("gp003.completed", audit);
        stop("ok");
        return { status: "completed", moduleId: "GP003", promptVersion: GP003_PROMPT.version, analysis: result, output };
      } catch (error) {
        this.#core.observability.increment("gp003.failed.total");
        this.#core.observability.captureError(error, { moduleId: "GP003" });
        stop("error");
        throw error;
      }
    });
  }

  #bootstrap() {
    const { promptRegistry, knowledgeRegistry, governance } = this.#core;
    if (!promptRegistry.getPrompt("GP003", GP003_PROMPT.version)) promptRegistry.registerPrompt(GP003_PROMPT);
    for (const entry of GP003_KNOWLEDGE) {
      if (!knowledgeRegistry.getKnowledge(entry.id, entry.metadata.version)) knowledgeRegistry.registerKnowledge(entry);
    }
    const existing = new Set(governance.getPolicySnapshot().map(({ id, version }) => `${id}@${version}`));
    for (const policy of GP003_POLICIES) {
      if (!existing.has(`${policy.id}@${policy.version}`)) governance.registerPolicy(policy);
    }
  }
}
