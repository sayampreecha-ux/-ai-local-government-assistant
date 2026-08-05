import { ContextManager } from "../src/context-manager.js";
import { TransactionRouter } from "../src/transaction-router.js";
import { PromptRegistry } from "../src/prompt-registry.js";
import { KnowledgeRegistry } from "../src/knowledge-registry.js";
import { GovernanceLayer } from "../src/governance-layer.js";
import { Observability } from "../src/observability.js";
import { GP001Module } from "../src/modules/gp001/gp001-module.js";
import { GP002Module } from "../src/modules/gp002/gp002-module.js";
import { GP003Module } from "../src/modules/gp003/gp003-module.js";
import { GP004Module } from "../src/modules/gp004/gp004-module.js";
import { GP005Module } from "../src/modules/gp005/gp005-module.js";
import { GP006Module } from "../src/modules/gp006/gp006-module.js";
import { GP007Module } from "../src/modules/gp007/gp007-module.js";
import { GP008Module } from "../src/modules/gp008/gp008-module.js";
import { GP009Module } from "../src/modules/gp009/gp009-module.js";
import { GP010Module } from "../src/modules/gp010/gp010-module.js";

const contextManager = new ContextManager();
const core = {
  contextManager,
  router: new TransactionRouter(contextManager),
  promptRegistry: new PromptRegistry(contextManager),
  knowledgeRegistry: new KnowledgeRegistry(contextManager),
  governance: new GovernanceLayer(contextManager),
  observability: new Observability(contextManager),
};

const gp001 = new GP001Module(core);
const gp002 = new GP002Module(core);
const gp003 = new GP003Module(core);
const gp004 = new GP004Module({ ...core, lawCopilot: gp002, procurementCopilot: gp003 });
const gp005 = new GP005Module({ ...core, lawCopilot: gp002, procurementCopilot: gp003, financeCopilot: gp004 });
const gp006 = new GP006Module({ ...core, lawCopilot: gp002, financeCopilot: gp004, budgetCopilot: gp005 });
const gp007 = new GP007Module({ ...core, lawCopilot: gp002, budgetCopilot: gp005, hrCopilot: gp006 });
const gp008 = new GP008Module({ ...core, lawCopilot: gp002, procurementCopilot: gp003, financeCopilot: gp004, budgetCopilot: gp005, councilCopilot: gp007 });
const gp009 = new GP009Module({ ...core, lawCopilot: gp002, procurementCopilot: gp003, financeCopilot: gp004, budgetCopilot: gp005, councilCopilot: gp007, projectCopilot: gp008 });
const gp010 = new GP010Module({ ...core, gp001, gp002, gp003, gp004, gp005, gp006, gp007, gp008, gp009 });

const result = await gp010.execute({
  meeting: { id: "M-2026-001", title: "Management Meeting", date: "2026-01-01", chair: "Director" },
  asOfDate: "2026-01-10",
  agendaItems: [{ id: "A-1", order: 1, title: "Service plan", presenter: "Planning Unit", minutesAllocated: 30, decisionRequired: true }],
  participants: [{ id: "director", name: "Director", status: "present", required: true }],
  discussions: [{ agendaItemId: "A-1", summary: "Reviewed the service plan.", speakers: ["Director"], conclusion: "Approved" }],
  decisions: [{ id: "R-1", agendaItemId: "A-1", text: "Approve the service plan.", authority: "Director", effectiveDate: "2026-01-02" }],
  actionItems: [{ id: "ACT-1", description: "Publish the implementation plan.", owner: "Planning Unit", dueDate: "2026-01-15" }],
  template: "minutes",
  outputFormat: "api-response",
  principal: { id: "demo-secretary", role: "meeting-secretary" },
  language: "th",
});

console.log(JSON.stringify({ result, diagnostics: await core.observability.diagnostics() }, null, 2));
