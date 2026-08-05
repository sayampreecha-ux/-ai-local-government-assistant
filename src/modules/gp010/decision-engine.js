export function buildDecisionRegister(input, resolutions) {
  const decisions = resolutions.resolutions.map((resolution) => ({ decisionId: resolution.id, subject: input.agendaItems.find(({ id }) => id === resolution.agendaItemId)?.title ?? resolution.agendaItemId, decision: resolution.text, authority: resolution.authority, effectiveDate: resolution.effectiveDate, status: resolution.valid ? "valid" : "invalid" }));
  return { decisions, validCount: decisions.filter(({ status }) => status === "valid").length, complete: resolutions.valid };
}
