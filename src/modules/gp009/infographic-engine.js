export function createInfographic(input) {
  const panels = input.keyMessages.map((message, index) => ({ order: index + 1, heading: `Key message ${index + 1}`, text: message, icon: input.icons?.[index] ?? "information" }));
  return { title: input.subject, panels, sourceNote: input.sourceNote ?? "Official government information", maxPanelLength: Math.max(...panels.map(({ text }) => text.length)), concise: panels.every(({ text }) => text.length <= 160) };
}
