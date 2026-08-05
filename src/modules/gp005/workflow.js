import { analyzeBudget } from "./budget-engine.js";
import { analyzeAppropriation } from "./appropriation-engine.js";
import { analyzeTransfer } from "./transfer-engine.js";
import { analyzeReserve } from "./reserve-engine.js";
import { analyzeCommitment } from "./commitment-engine.js";
import { analyzeDevelopmentPlan } from "./development-plan-engine.js";
import { buildBudgetTimeline } from "./timeline-engine.js";
import { analyzeBudgetMetrics } from "./analytics-engine.js";
import { assessFiscalRisk } from "./risk-engine.js";
import { analyzeBudgetCompliance } from "./compliance-engine.js";

export function runBudgetWorkflow(input, knowledge, crossModule = {}) {
  const budget = analyzeBudget(input);
  const appropriation = analyzeAppropriation(input, budget);
  const transfer = analyzeTransfer(input);
  const reserve = analyzeReserve(input);
  const commitment = analyzeCommitment(input);
  const developmentPlan = analyzeDevelopmentPlan(input);
  const timeline = buildBudgetTimeline(input);
  const analytics = analyzeBudgetMetrics(input, budget, commitment);
  const risk = assessFiscalRisk({ budget, appropriation, transfer, reserve, commitment, developmentPlan, analytics, crossModule });
  const compliance = analyzeBudgetCompliance({ input, budget, appropriation, transfer, reserve, commitment, developmentPlan, risk, knowledgeCount: knowledge.length, crossModule });
  return { template: input.template, budget, appropriation, transfer, reserve, commitment, developmentPlan, timeline, analytics, risk, compliance, crossModule };
}
