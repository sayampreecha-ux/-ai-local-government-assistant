const LOCK_TERMS = /\b(brand only|single brand|exact model|proprietary only|no equivalent)\b/i;

export function reviewTOR(specifications) {
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
  return {
    findings,
    specificationLockDetected: findings.some(({ specificationLock }) => specificationLock),
    completenessScore: findings.length
      ? findings.reduce((sum, item) => sum + Number(item.clear) + Number(item.measurable), 0) / (findings.length * 2)
      : 0,
  };
}
