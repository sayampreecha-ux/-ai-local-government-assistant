import { checkBudget } from "./budget-engine.js";
import { analyzeEligibility } from "./eligibility-engine.js";
import { analyzeTravel } from "./travel-engine.js";
import { analyzeAllowances } from "./allowance-engine.js";
import { analyzeReimbursement } from "./reimbursement-engine.js";
import { analyzeFinance } from "./finance-engine.js";
import { buildFinanceAuditChecklist } from "./audit-engine.js";
import { analyzeFinanceCompliance } from "./compliance-engine.js";

export function runFinanceWorkflow(input, knowledge, crossModule = {}) {
  const eligibility = analyzeEligibility(input);
  const budget = checkBudget(input);
  const travel = analyzeTravel(input.travel);
  const allowances = analyzeAllowances(input);
  const reimbursement = analyzeReimbursement(input.claims, input.receipts, eligibility);
  const finance = analyzeFinance(input, budget, eligibility, reimbursement, crossModule);
  const risk = finance.risk;
  const audit = buildFinanceAuditChecklist({ input, eligibility, budget, reimbursement, finance, knowledgeCount: knowledge.length });
  const compliance = analyzeFinanceCompliance({
    eligibility, budget, audit, legalReview: crossModule.legal, procurementReview: crossModule.procurement,
  });
  return { template: input.template, eligibility, budget, finance, travel, allowances, reimbursement, risk, audit, compliance };
}
