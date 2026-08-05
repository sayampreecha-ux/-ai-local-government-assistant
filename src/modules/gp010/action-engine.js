export function buildActions(input) {
  const actions = input.actionItems.map((action, index) => ({ id: action.id ?? `${input.meeting.id}-A${index + 1}`, description: action.description ?? "", owner: action.owner ?? null, dueDate: action.dueDate ?? null, status: action.status ?? "open", resolutionId: action.resolutionId ?? null, complete: Boolean(action.description && action.owner && action.dueDate) })).sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.id.localeCompare(b.id));
  return { actions, valid: actions.every(({ complete }) => complete), openCount: actions.filter(({ status }) => status !== "completed").length };
}
