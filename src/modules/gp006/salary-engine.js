export function analyzeSalary(input) {
  const current = Number(input.salary.current) || 0; const step = Number(input.salary.increment) || 0; const maximum = Number(input.salary.maximum) || current;
  const eligible = input.salary.performanceEligible === true && !input.discipline.activeCase;
  return { current, increment: eligible ? Math.min(step, Math.max(0, maximum - current)) : 0, proposed: eligible ? Math.min(maximum, current + step) : current, maximum, eligible, capped: current + step > maximum };
}
