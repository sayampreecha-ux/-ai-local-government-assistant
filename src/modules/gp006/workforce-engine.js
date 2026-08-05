export function analyzeWorkforce(input) {
  const authorized = Number(input.workforce.authorized) || 0; const filled = Number(input.workforce.filled) || 0;
  const forecastRetirements = Number(input.workforce.forecastRetirements) || 0; const plannedHires = Number(input.workforce.plannedHires) || 0;
  const projectedFilled = Math.max(0, filled - forecastRetirements + plannedHires);
  return { authorized, filled, vacancies: Math.max(0, authorized - filled), forecastRetirements, plannedHires, projectedFilled, projectedGap: Math.max(0, authorized - projectedFilled), overstaffed: projectedFilled > authorized };
}
