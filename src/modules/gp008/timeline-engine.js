export function reviewProjectTimeline(milestones) {
  const sorted = [...milestones].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  const findings = sorted.map((milestone, index) => ({ id: milestone.id, start: milestone.start, end: milestone.end, validDates: Boolean(milestone.start && milestone.end && milestone.start <= milestone.end), overlapsPrevious: index > 0 && milestone.start < sorted[index - 1].end, dependencyMet: !milestone.dependsOn || sorted.slice(0, index).some(({ id }) => id === milestone.dependsOn) }));
  return { milestones: findings, valid: findings.length > 0 && findings.every(({ validDates, dependencyMet }) => validDates && dependencyMet), overlaps: findings.filter(({ overlapsPrevious }) => overlapsPrevious).map(({ id }) => id) };
}
