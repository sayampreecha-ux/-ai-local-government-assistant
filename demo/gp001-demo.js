import {
  ContextManager,
  TransactionRouter,
  PromptRegistry,
  KnowledgeRegistry,
  GovernanceLayer,
  Observability,
  GP001Module,
} from "../src/index.js";

const contextManager = new ContextManager();
const dependencies = {
  contextManager,
  router: new TransactionRouter(contextManager),
  promptRegistry: new PromptRegistry(contextManager),
  knowledgeRegistry: new KnowledgeRegistry(contextManager),
  governance: new GovernanceLayer(contextManager),
  observability: new Observability(contextManager),
};
const gp001 = new GP001Module(dependencies);

const result = await gp001.execute({
  templateType: "internal-letter",
  subject: "Quarterly budget meeting",
  recipients: ["Finance Division"],
  instructions: "Invite the Finance Division to review quarterly budget execution",
  principal: { id: "demo-officer", role: "officer" },
  language: "th",
  localGovernment: true,
});

const diagnostics = await dependencies.observability.diagnostics();
console.log(JSON.stringify({ result, diagnostics }, null, 2));
