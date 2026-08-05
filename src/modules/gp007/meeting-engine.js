export function buildMeetingWorkflow(input, agenda, quorum, voting) {
  const steps = [
    ["notice-issued", agenda.noticeValid], ["agenda-adopted", agenda.valid], ["quorum-confirmed", quorum.met],
    ["debate-recorded", input.meeting.minutesRecorded === true], ["vote-recorded", voting.countValid],
    ["resolution-numbered", Boolean(input.meeting.resolutionNumber)], ["minutes-approved", input.meeting.minutesApproved === true],
  ].map(([step, complete]) => ({ step, complete }));
  return { steps, complete: steps.every(({ complete }) => complete), resolutionNumber: input.meeting.resolutionNumber ?? null };
}
