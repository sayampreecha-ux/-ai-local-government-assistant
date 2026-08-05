export function validateAttendance(participants) {
  const ids = participants.map(({ id }) => id); const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index).filter((id, index, all) => all.indexOf(id) === index);
  const present = participants.filter(({ status }) => status === "present"); const requiredMissing = participants.filter(({ required, status }) => required && status !== "present").map(({ id }) => id);
  return { registered: participants.length, present: present.length, absent: participants.length - present.length, duplicates, requiredMissing, valid: duplicates.length === 0 && requiredMissing.length === 0, attendanceRate: participants.length ? present.length / participants.length : 0 };
}
