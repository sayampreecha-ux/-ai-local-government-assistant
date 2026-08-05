export function generateMinutes(input, agenda, attendance) {
  const sections = agenda.items.map((item) => { const discussion = input.discussions.find(({ agendaItemId }) => agendaItemId === item.id); return { agendaItemId: item.id, title: item.title, discussion: discussion?.summary ?? "No discussion recorded", speakers: [...(discussion?.speakers ?? [])].sort(), conclusion: discussion?.conclusion ?? null }; });
  return { meetingId: input.meeting.id, title: input.meeting.title, date: input.meeting.date, chair: input.meeting.chair ?? null, attendance, sections, complete: attendance.valid && sections.every(({ discussion }) => discussion !== "No discussion recorded") };
}
