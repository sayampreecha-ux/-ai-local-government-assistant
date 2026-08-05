export function verifyQuorum(totalMembers, attendance) {
  const present = new Set(attendance.filter(({ present }) => present).map(({ memberId }) => memberId)).size;
  const required = Math.floor(totalMembers / 2) + 1;
  return { totalMembers, present, required, met: present >= required, attendanceRate: present / totalMembers };
}
