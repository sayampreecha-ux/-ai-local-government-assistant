export function analyzeCompetition({ tor, vendors, submissionDays }) {
  const penalties = [
    ...(tor.specificationLockDetected ? [{ code: "specification-lock", points: 45 }] : []),
    ...(vendors.length > 0 && vendors.length < 3 ? [{ code: "limited-vendor-pool", points: 25 }] : []),
    ...(submissionDays < 7 ? [{ code: "short-submission-window", points: 20 }] : []),
  ];
  const fairnessScore = Math.max(0, 100 - penalties.reduce((sum, item) => sum + item.points, 0));
  return {
    fairnessScore,
    level: fairnessScore >= 80 ? "fair" : fairnessScore >= 50 ? "review" : "restricted",
    penalties,
    recommendation: penalties.length ? "Revise restrictive conditions before publication." : "Competition conditions are proportionate.",
  };
}
