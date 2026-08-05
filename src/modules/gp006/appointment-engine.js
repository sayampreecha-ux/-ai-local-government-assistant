export function analyzeAppointment(input, qualification) {
  const reasons = [...(!input.position.vacant ? ["position-not-vacant"] : []), ...(!qualification.valid ? ["qualification-gap"] : []), ...(!input.candidate.selectionPassed ? ["selection-not-passed"] : []), ...(!input.candidate.appointmentAuthorityApproved ? ["authority-approval-missing"] : [])];
  return { eligible: reasons.length === 0, reasons, positionId: input.position.id, appointmentType: input.candidate.appointmentType ?? "initial" };
}
