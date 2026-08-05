export function analyzeHR(input, analyses, crossModule) {
  const selected = analyses[input.action] ?? null;
  const gaps = [
    ...(!analyses.qualification.valid ? ["qualification-gap"] : []),
    ...(selected?.eligible === false ? [`${input.action}-ineligible`] : []),
    ...(!analyses.discipline.procedurallyValid && input.action === "discipline" ? ["disciplinary-due-process"] : []),
    ...Object.entries(crossModule).filter(([, value]) => value?.status !== "completed").map(([key]) => `${key}-review-incomplete`),
  ];
  const confidence = Math.max(0, 1 - gaps.length * 0.15);
  return { action: input.action, decision: gaps.length ? "review-required" : "eligible", gaps, confidence, recommendation: gaps.length ? "Resolve identified HR and linked-review gaps before approval." : "Proceed through the competent personnel authority." , crossModule };
}
