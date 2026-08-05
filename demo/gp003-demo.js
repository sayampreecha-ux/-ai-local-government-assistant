import { ContextManager } from "../src/context-manager.js";
import { TransactionRouter } from "../src/transaction-router.js";
import { PromptRegistry } from "../src/prompt-registry.js";
import { KnowledgeRegistry } from "../src/knowledge-registry.js";
import { GovernanceLayer } from "../src/governance-layer.js";
import { Observability } from "../src/observability.js";
import { GP003Module } from "../src/modules/gp003/gp003-module.js";

const contextManager = new ContextManager();
const core = {
  contextManager,
  router: new TransactionRouter(contextManager),
  promptRegistry: new PromptRegistry(contextManager),
  knowledgeRegistry: new KnowledgeRegistry(contextManager),
  governance: new GovernanceLayer(contextManager),
  observability: new Observability(contextManager),
};
const gp003 = new GP003Module(core);

const result = await gp003.execute({
  objective: "Acquire municipal emergency-response equipment",
  estimatedBudget: 1200000,
  specifications: [
    { requirement: "Operational capacity shall be at least 100 units", measurement: "units" },
    { requirement: "Warranty shall be at least 24 months", measurement: "months" },
  ],
  vendors: [
    { id: "vendor-a", qualifications: ["license", "experience"] },
    { id: "vendor-b", qualifications: ["license", "experience"] },
    { id: "vendor-c", qualifications: ["license"] },
  ],
  qualificationCriteria: ["license", "experience"],
  marketPrices: [1150000, 1200000, 1250000],
  contractTerms: ["termination", "penalty"],
  documents: { budgetApproved: true, procurementPlan: true },
  submissionDays: 15,
  template: "procurement-opinion",
  outputFormat: "api-response",
  principal: { id: "demo-procurement-officer", role: "procurement-officer" },
  language: "th",
});

console.log(JSON.stringify({ result, diagnostics: await core.observability.diagnostics() }, null, 2));
