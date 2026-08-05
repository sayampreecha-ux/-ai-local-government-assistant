export function buildFollowup(input, actions) {
  const items = actions.actions.map((action) => ({ ...action, overdue: action.status !== "completed" && action.dueDate < input.asOfDate, reminderRequired: action.status !== "completed" && action.dueDate <= input.asOfDate, reminder: action.status !== "completed" ? `Action ${action.id} is due ${action.dueDate}` : null }));
  return { items, overdueCount: items.filter(({ overdue }) => overdue).length, reminderPackage: items.filter(({ reminderRequired }) => reminderRequired).map(({ id, owner, reminder }) => ({ actionId: id, owner, message: reminder })), allClosed: items.every(({ status }) => status === "completed") };
}
