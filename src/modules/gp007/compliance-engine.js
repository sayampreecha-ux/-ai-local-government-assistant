export function analyzeCouncilCompliance({ agenda, motion, quorum, voting, meeting, bylaw, authority, crossModule }) {
  const checklist = [
    ["agenda-valid", agenda.valid], ["motion-valid", motion.valid], ["quorum-met", quorum.met],
    ["vote-count-valid", voting.countValid], ["resolution-passed", voting.passed], ["meeting-workflow-complete", meeting.complete],
    ["bylaw-valid", bylaw.valid], ["authority-established", authority.authorized],
    ["linked-reviews-complete", Object.values(crossModule).every(({ status }) => status === "completed")],
  ].map(([item, passed]) => ({ item, passed }));
  return { checklist, passed: checklist.filter(({ passed }) => passed).length, total: checklist.length, compliant: checklist.every(({ passed }) => passed) };
}
