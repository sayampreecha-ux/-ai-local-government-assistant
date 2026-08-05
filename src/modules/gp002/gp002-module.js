import { GP002_KNOWLEDGE } from "./knowledge/index.js";
import { GP002_PDPA_RULE, GP002_POLICIES, GP002_PROMPT, GP002_WORKFLOW } from "./definition.js";
import { detectPersonalData } from "./PDPA-engine.js";
import { formatGP002Output } from "./output-engine.js";
import { validateGP002Input, validateGP002Output } from "./validator.js";
import { runLegalWorkflow } from "./workflow.js";

export class GP002Module {
  #core;

  constructor(core) {
    for (const name of ["contextManager", "router", "promptRegistry", "knowledgeRegistry", "governance", "observability"]) {
      if (!core?.[name]) throw new TypeError(`GP002 dependency is required: ${name}`);
    }
    this.#core = core;
    this.#bootstrap();
  }

  async execute(rawInput) {
    const { observability } = this.#core;
    return observability.runInTrace("gp002.execute", async () => {
      const stop = observability.startTimer("gp002.execution.duration", { template: rawInput?.template ?? "unknown" });
      observability.increment("gp002.requests.total");
      try {
        const input = validateGP002Input(rawInput);
        const route = this.#core.router.routeRequest(`GP002 government law: ${input.question}`);
        if (route.primaryModule !== "GP002") throw new Error("Transaction Router did not select GP002");
        const pdpaFindings = detectPersonalData({ facts: input.facts, question: input.question });
        const knowledge = this.#core.knowledgeRegistry.search("", { language: input.language, minConfidence: 0.7 })
          .filter(({ id }) => id.startsWith("gp002-"));
        for (const entry of knowledge) {
          const decision = this.#core.governance.authorizeKnowledge(entry, input.principal);
          if (decision.status !== "allowed") throw new Error(`Knowledge authorization failed: ${entry.id}`);
        }
        const analysis = runLegalWorkflow(input, knowledge);
        validateGP002Output(analysis);
        const prompt = this.#core.promptRegistry.getPrompt("GP002", GP002_PROMPT.version);
        const authorization = this.#core.governance.authorizePrompt(prompt, input.principal, {
          pdpaDetected: pdpaFindings.length > 0,
        });
        if (authorization.status !== "allowed") {
          observability.increment("gp002.approvals.required");
          observability.emitAudit("gp002.approval_required", {
            findingTypes: pdpaFindings.map(({ type }) => type),
            authorization,
          });
          stop("approval_required");
          return { status: "approval_required", authorization, pdpaFindings };
        }
        const resolvedPrompt = this.#core.promptRegistry.resolvePrompt("GP002", {
          analysisType: input.template,
          facts: input.facts,
          authorities: analysis.citations.citations.map(({ title }) => title).join("; "),
          outputFormat: input.outputFormat,
        }, { version: GP002_PROMPT.version });
        const audit = {
          promptVersion: resolvedPrompt.definition.version,
          knowledgeIds: knowledge.map(({ id }) => id),
          workflow: GP002_WORKFLOW,
        };
        const output = formatGP002Output(analysis, input.outputFormat, audit);
        this.#core.contextManager.updateContext((context) => ({
          workflowState: { module: "GP002", step: "completed", template: input.template },
          userSelections: { ...context.userSelections, gp002Template: input.template, gp002OutputFormat: input.outputFormat },
          legalReferences: analysis.citations.citations.map(({ id, title, authority, version }) => ({ id, title, authority, version })),
        }));
        observability.increment("gp002.completed.total", 1, { template: input.template, format: input.outputFormat });
        observability.emitAudit("gp002.completed", { ...audit, risk: analysis.risk });
        stop("ok");
        return { status: "completed", moduleId: "GP002", promptVersion: GP002_PROMPT.version, pdpaFindings, analysis, output };
      } catch (error) {
        observability.increment("gp002.failed.total");
        observability.captureError(error, { moduleId: "GP002" });
        stop("error");
        throw error;
      }
    });
  }

  #bootstrap() {
    const { promptRegistry, knowledgeRegistry, governance } = this.#core;
    if (!promptRegistry.getPrompt("GP002", GP002_PROMPT.version)) promptRegistry.registerPrompt(GP002_PROMPT);
    for (const entry of GP002_KNOWLEDGE) {
      if (!knowledgeRegistry.getKnowledge(entry.id, entry.metadata.version)) knowledgeRegistry.registerKnowledge(entry);
    }
    const policies = new Set(governance.getPolicySnapshot().map(({ id, version }) => `${id}@${version}`));
    for (const policy of GP002_POLICIES) {
      if (!policies.has(`${policy.id}@${policy.version}`)) governance.registerPolicy(policy);
    }
    const rules = new Set(governance.getSafetyRuleSnapshot().map(({ id }) => id));
    if (!rules.has(GP002_PDPA_RULE.id)) governance.registerSafetyRule(GP002_PDPA_RULE);
  }
}
