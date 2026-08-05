export function analyzeMotion(input) {
  const reasons = [...(!input.motion.text ? ["motion-text-missing"] : []), ...(!input.motion.proposer ? ["proposer-missing"] : []), ...(!input.motion.seconder && input.motion.requiresSeconder !== false ? ["seconder-missing"] : []), ...(!input.motion.withinAgenda ? ["outside-agenda"] : [])];
  return { valid: reasons.length === 0, reasons, type: input.motion.type ?? "ordinary", budgetRelated: input.motion.budgetRelated === true, personnelRelated: input.motion.personnelRelated === true };
}
