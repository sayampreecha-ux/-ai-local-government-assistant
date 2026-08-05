export function validateAgenda(input) {
  const findings = input.agendaItems.map((item, index) => ({ index, title: item.title ?? "", complete: Boolean(item.title && item.documentsComplete), withinAuthority: item.withinAuthority !== false, urgent: item.urgent === true }));
  const noticeValid = Number(input.meeting.noticeDays) >= (Number(input.meeting.minimumNoticeDays) || 3) || input.meeting.emergency === true;
  return { findings, noticeValid, valid: noticeValid && findings.length > 0 && findings.every(({ complete, withinAuthority }) => complete && withinAuthority) };
}
