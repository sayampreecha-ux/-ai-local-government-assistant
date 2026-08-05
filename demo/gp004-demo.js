import { ContextManager } from "../src/context-manager.js";
import { TransactionRouter } from "../src/transaction-router.js";
import { PromptRegistry } from "../src/prompt-registry.js";
import { KnowledgeRegistry } from "../src/knowledge-registry.js";
import { GovernanceLayer } from "../src/governance-layer.js";
import { Observability } from "../src/observability.js";
import { GP002Module } from "../src/modules/gp002/gp002-module.js";
import { GP003Module } from "../src/modules/gp003/gp003-module.js";
import { GP004Module } from "../src/modules/gp004/gp004-module.js";

const contextManager = new ContextManager();
const core = {
  contextManager,
  router: new TransactionRouter(contextManager),
  promptRegistry: new PromptRegistry(contextManager),
  knowledgeRegistry: new KnowledgeRegistry(contextManager),
  governance: new GovernanceLayer(contextManager),
  observability: new Observability(contextManager),
};
const lawCopilot = new GP002Module(core);
const procurementCopilot = new GP003Module(core);
const gp004 = new GP004Module({ ...core, lawCopilot, procurementCopilot });

const result = await gp004.execute({
  purpose: "Reimburse approved official travel",
  financeType: "reimbursement",
  requestedAmount: 900,
  budgetAllocated: 10000,
  budgetCommitted: 1000,
  employee: { status: "local-government-officer" },
  approvals: ["supervisor"],
  documents: { budgetCertification: true },
  claims: [{ id: "claim-1", amount: 900, cap: 900, receiptId: "receipt-1" }],
  receipts: [{ id: "receipt-1" }],
  travel: { days: 1, distanceKm: 100, mode: "private-vehicle", lodgingRate: 0, subsistenceRate: 300 },
  template: "reimbursement-analysis",
  outputFormat: "api-response",
  principal: { id: "demo-finance-officer", role: "finance-officer" },
  language: "th",
});

console.log(JSON.stringify({ result, diagnostics: await core.observability.diagnostics() }, null, 2));
