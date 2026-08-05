export function validateQualifications(candidate, position) {
  const possessed = new Set(candidate.qualifications ?? []);
  const required = [...(position.requiredQualifications ?? [])].sort();
  const missing = required.filter((item) => !possessed.has(item));
  return { valid: missing.length === 0, required, possessed: [...possessed].sort(), missing };
}
