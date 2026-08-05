export function detectConflicts(entries) {
  const conflicts = [];
  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
      const left = entries[leftIndex];
      const right = entries[rightIndex];
      const related = left.metadata.category === right.metadata.category ||
        left.metadata.tags.some((tag) => right.metadata.tags.includes(tag) && tag !== "government-law");
      if (!related || left.metadata.version === right.metadata.version) continue;
      const newer = left.metadata.effectiveDate >= right.metadata.effectiveDate ? left : right;
      const older = newer === left ? right : left;
      const higher = (left.metadata.hierarchy ?? 0) >= (right.metadata.hierarchy ?? 0) ? left : right;
      conflicts.push({
        left: left.id,
        right: right.id,
        newer: newer.id,
        older: older.id,
        higherAuthority: higher.id,
        resolution: newer === higher ? "newer-and-higher-prevails" : "legal-review-required",
      });
    }
  }
  return conflicts;
}
