import { ContextManager } from "../src/context-manager.js";
import { TransactionRouter } from "../src/transaction-router.js";
import { PromptRegistry } from "../src/prompt-registry.js";
import { KnowledgeRegistry } from "../src/knowledge-registry.js";
import { GovernanceLayer } from "../src/governance-layer.js";
import { Observability } from "../src/observability.js";
import { GP002Module } from "../src/modules/gp002/gp002-module.js";

const contextManager = new ContextManager();
const core = {
  contextManager,
  router: new TransactionRouter(contextManager),
  promptRegistry: new PromptRegistry(contextManager),
  knowledgeRegistry: new KnowledgeRegistry(contextManager),
  governance: new GovernanceLayer(contextManager),
  observability: new Observability(contextManager),
};
const gp002 = new GP002Module(core);

const result = await gp002.execute({
  facts: "A local government authority plans to issue an administrative order.",
  question: "Which authority and legal hierarchy govern the proposed order?",
  template: "legal-opinion",
  outputFormat: "api-response",
  principal: { id: "demo-legal-officer", role: "legal-officer" },
  language: "th",
  asOfDate: "2026-08-05",
});

console.log(JSON.stringify({ result, diagnostics: await core.observability.diagnostics() }, null, 2));
