import { ContextManager } from "../src/context-manager.js";
import { TransactionRouter } from "../src/transaction-router.js";
import { PromptRegistry } from "../src/prompt-registry.js";
import { KnowledgeRegistry } from "../src/knowledge-registry.js";
import { GovernanceLayer } from "../src/governance-layer.js";
import { Observability } from "../src/observability.js";
import { GP002Module } from "../src/modules/gp002/gp002-module.js";
import { GP003Module } from "../src/modules/gp003/gp003-module.js";
import { GP004Module } from "../src/modules/gp004/gp004-module.js";
import { GP005Module } from "../src/modules/gp005/gp005-module.js";

const contextManager = new ContextManager();
const core = { contextManager, router: new TransactionRouter(contextManager), promptRegistry: new PromptRegistry(contextManager), knowledgeRegistry: new KnowledgeRegistry(contextManager), governance: new GovernanceLayer(contextManager), observability: new Observability(contextManager) };
const lawCopilot = new GP002Module(core);
const procurementCopilot = new GP003Module(core);
const financeCopilot = new GP004Module({ ...core, lawCopilot, procurementCopilot });
const gp005 = new GP005Module({ ...core, lawCopilot, procurementCopilot, financeCopilot });

const result = await gp005.execute({
  purpose: "Municipal development equipment", classification: "investment",
  allocated: 1000000, spent: 200000, committed: 100000, requestedAmount: 300000,
  ordinance: { approved: true, appropriatedAmount: 1000000, fiscalYear: 2026, approvedDate: "2025-09-01", effectiveDate: "2026-01-01" },
  developmentPlan: { projectId: "project-1", localProjectIds: ["project-1"], strategicProjectIds: ["project-1"], indicator: "service-capacity" },
  documents: { budgetCertification: true }, template: "budget-opinion", outputFormat: "api-response",
  principal: { id: "demo-budget-officer", role: "budget-officer" }, language: "th",
});
console.log(JSON.stringify({ result, diagnostics: await core.observability.diagnostics() }, null, 2));
