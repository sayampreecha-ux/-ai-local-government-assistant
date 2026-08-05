import { reviewTOR } from "./tor-engine.js";
import { analyzeCompetition } from "./competition-engine.js";
import { analyzeVendors } from "./vendor-engine.js";
import { analyzePricing } from "./pricing-engine.js";
import { recommendProcurementMethod } from "./procurement-engine.js";
import { assessProcurementRisk } from "./risk-engine.js";
import { buildComplianceChecklist } from "./compliance-engine.js";

export function runProcurementWorkflow(input, knowledge) {
  const tor = reviewTOR(input.specifications);
  const competition = analyzeCompetition({ tor, vendors: input.vendors, submissionDays: input.submissionDays });
  const vendors = analyzeVendors(input.vendors, input.qualificationCriteria);
  const pricing = analyzePricing(input.estimatedBudget, input.marketPrices);
  const procurement = recommendProcurementMethod({
    estimatedBudget: input.estimatedBudget,
    competition,
    requestedMethod: input.requestedMethod,
  });
  const risk = assessProcurementRisk({
    tor, competition, vendors, pricing, procurement, contractTerms: input.contractTerms,
  });
  const compliance = buildComplianceChecklist({
    input, tor, competition, vendors, pricing, procurement, knowledgeCount: knowledge.length,
  });
  return { template: input.template, tor, competition, vendors, pricing, procurement, risk, compliance };
}
