export function analyzeCouncil({ agenda, motion, quorum, voting, meeting, bylaw, authority, compliance, crossModule }) {
  const factors = [
    ...(!agenda.valid ? ["agenda-defect"] : []), ...(!motion.valid ? ["motion-defect"] : []), ...(!quorum.met ? ["quorum-defect"] : []),
    ...(!voting.countValid ? ["vote-count-defect"] : []), ...(!voting.passed ? ["resolution-not-passed"] : []),
    ...(!meeting.complete ? ["meeting-workflow-incomplete"] : []), ...(!bylaw.valid ? ["bylaw-defect"] : []),
    ...(!authority.authorized ? ["authority-defect"] : []), ...Object.entries(crossModule).filter(([, value]) => value?.status !== "completed").map(([key]) => `${key}-review-incomplete`),
  ];
  const score = Math.min(1, factors.length * 0.15);
  return { resolutionValid: motion.valid && quorum.met && voting.passed && voting.countValid && authority.authorized, risk: { level: score >= 0.66 ? "high" : score >= 0.33 ? "medium" : "low", score, factors }, compliant: compliance.compliant, recommendation: factors.length ? "Correct procedural defects before certifying the resolution." : "Resolution may proceed to certification and implementation." };
}
