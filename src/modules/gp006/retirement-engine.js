function ageOn(birthDate, asOfDate) {
  const birth = new Date(`${birthDate}T00:00:00Z`); const asOf = new Date(`${asOfDate}T00:00:00Z`);
  let age = asOf.getUTCFullYear() - birth.getUTCFullYear();
  if (asOf.getUTCMonth() < birth.getUTCMonth() || (asOf.getUTCMonth() === birth.getUTCMonth() && asOf.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}
export function analyzeRetirement(input) {
  if (!input.employee.birthDate) return { eligible: false, age: null, retirementAge: Number(input.employee.retirementAge) || 60, reason: "birth-date-missing" };
  if (!input.asOfDate) return { eligible: false, age: null, retirementAge: Number(input.employee.retirementAge) || 60, reason: "as-of-date-missing" };
  const retirementAge = Number(input.employee.retirementAge) || 60; const age = ageOn(input.employee.birthDate, input.asOfDate);
  return { eligible: age >= retirementAge, age, retirementAge, yearsRemaining: Math.max(0, retirementAge - age), reason: age >= retirementAge ? "retirement-age-reached" : "not-yet-eligible" };
}
