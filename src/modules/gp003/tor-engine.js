import { reviewServiceContract727 } from "./service-contract-727-engine.js";
import { reviewServiceContract9636 } from "./service-contract-9636-engine.js";

const LOCK_TERMS = /\b(brand only|single brand|exact model|proprietary only|no equivalent)\b/i;

export function reviewTOR(specifications, serviceContractInput = {}) {
  const findings = specifications.map((specification, index) => {
    const text = specification.requirement;
    const reasons = [
      ...(specification.brand && !specification.equivalentAllowed ? ["brand-without-equivalent"] : []),
      ...(LOCK_TERMS.test(text) ? ["restrictive-language"] : []),
      ...(specification.uniqueVendor === true ? ["single-vendor-capability"] : []),
    ];
    return {
      index,
      requirement: text,
      clear: text.trim().length >= 10,
      measurable: Boolean(specification.measurement || /\d/.test(text)),
      specificationLock: reasons.length > 0,
      lockReasons: reasons,
    };
  });
  const serviceContractReview = reviewServiceContract727(serviceContractInput);
  const travelTrainingReview = reviewServiceContract9636(serviceContractInput);
  return {
    findings,
    specificationLockDetected: findings.some(({ specificationLock }) => specificationLock),
    completenessScore: findings.length
      ? findings.reduce((sum, item) => sum + Number(item.clear) + Number(item.measurable), 0) / (findings.length * 2)
      : 0,
    serviceContractReview,
    travelTrainingReview,
  };
}
