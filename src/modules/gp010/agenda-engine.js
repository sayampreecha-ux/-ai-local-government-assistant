export function buildAgenda(input) {
  const items = input.agendaItems.map((item, index) => ({ id: item.id ?? `item-${index + 1}`, order: Number(item.order) || index + 1, title: item.title ?? "", presenter: item.presenter ?? null, minutesAllocated: Math.max(0, Number(item.minutesAllocated) || 0), documents: [...(item.documents ?? [])].sort(), decisionRequired: item.decisionRequired === true })).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return { items, complete: items.length > 0 && items.every(({ title, presenter }) => title && presenter), totalMinutes: items.reduce((sum, item) => sum + item.minutesAllocated, 0), decisionItems: items.filter(({ decisionRequired }) => decisionRequired).map(({ id }) => id) };
}
