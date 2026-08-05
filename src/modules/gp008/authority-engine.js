export function validateProjectAuthority(input) {
  const reasons = [...(!input.authority.mandate ? ["mandate-missing"] : []), ...(!input.authority.competentAgency ? ["competent-agency-missing"] : []), ...(input.authority.councilApprovalRequired && !input.authority.councilApproved ? ["council-approval-missing"] : []), ...(input.authority.delegated && !input.authority.delegationInstrument ? ["delegation-instrument-missing"] : [])];
  return { authorized: reasons.length === 0, reasons, mandate: input.authority.mandate ?? null, competentAgency: input.authority.competentAgency ?? null };
}
