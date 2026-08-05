export function draftResolutions(input, agenda) {
  const resolutions = input.decisions.map((decision, index) => ({ id: decision.id ?? `${input.meeting.id}-R${index + 1}`, agendaItemId: decision.agendaItemId, text: decision.text ?? "", authority: decision.authority ?? null, vote: decision.vote ?? null, effectiveDate: decision.effectiveDate ?? null, valid: Boolean(decision.text && decision.authority && agenda.items.some(({ id }) => id === decision.agendaItemId)) })).sort((a, b) => a.id.localeCompare(b.id));
  return { resolutions, valid: resolutions.every(({ valid }) => valid), count: resolutions.length };
}
