export const EVIDENCE_ASSESSMENT_VERSION = "1.0";

const REQUIRED_DIMENSIONS = Object.freeze([
  "baseline",
  "action",
  "output",
  "outcome",
  "kpi",
  "evidence",
  "owner",
  "deadline",
  "auditTrail"
]);

const keyOf = (value) => String(value?.key || value?.id || value?.type || "").trim();
const nonEmpty = (value) => value !== undefined && value !== null && !(typeof value === "string" && !value.trim());
const list = (value) => Array.isArray(value) ? value : value ? [value] : [];

function normalizeEvidenceItem(item = {}) {
  const key = keyOf(item);
  return {
    key,
    value: item.value,
    source: item.source || null,
    official: item.official === true,
    verified: item.verified === true,
    fresh: item.fresh !== false,
    valid: item.valid !== false,
    privacyClass: item.privacyClass || "unspecified",
    owner: item.owner || null,
    capturedAt: item.capturedAt || null,
    workflowId: item.workflowId || null,
    stageId: item.stageId || null
  };
}

export function createEvidenceSnapshot(input = {}) {
  const evidence = list(input.evidence).map(normalizeEvidenceItem).filter((item) => item.key && nonEmpty(item.value));
  const artifacts = list(input.artifacts).map((artifact) => ({
    key: keyOf(artifact),
    status: artifact.status || "unknown",
    workflowId: artifact.workflowId || null,
    stageId: artifact.stageId || null,
    owner: artifact.owner || null,
    createdAt: artifact.createdAt || null
  })).filter((artifact) => artifact.key);

  return {
    version: EVIDENCE_ASSESSMENT_VERSION,
    caseId: input.caseId || null,
    workflowIds: [...new Set(list(input.workflowIds).filter(Boolean))],
    baseline: input.baseline ?? null,
    action: input.action ?? null,
    output: input.output ?? null,
    outcome: input.outcome ?? null,
    kpi: input.kpi ?? null,
    owner: input.owner ?? null,
    deadline: input.deadline ?? null,
    evidence,
    artifacts,
    auditTrail: list(input.auditTrail),
    governance: {
      noFabrication: true,
      piiMinimization: true,
      evidenceBacked: true,
      humanValidationRequired: true
    }
  };
}

export function analyzeEvidenceGaps(snapshot = {}) {
  const gaps = [];
  for (const dimension of REQUIRED_DIMENSIONS) {
    if (dimension === "evidence") {
      if (!Array.isArray(snapshot.evidence) || snapshot.evidence.length === 0) gaps.push({ dimension, severity: "high", reason: "missing-evidence" });
      continue;
    }
    if (dimension === "auditTrail") {
      if (!Array.isArray(snapshot.auditTrail) || snapshot.auditTrail.length === 0) gaps.push({ dimension, severity: "medium", reason: "missing-audit-trail" });
      continue;
    }
    if (!nonEmpty(snapshot[dimension])) gaps.push({ dimension, severity: ["baseline", "outcome", "kpi", "owner"].includes(dimension) ? "high" : "medium", reason: `missing-${dimension}` });
  }

  const unverifiedOfficial = (snapshot.evidence || []).filter((item) => item.official && !item.verified);
  if (unverifiedOfficial.length) gaps.push({ dimension: "evidence", severity: "high", reason: "unverified-official-evidence", keys: unverifiedOfficial.map((item) => item.key) });

  const staleOfficial = (snapshot.evidence || []).filter((item) => item.official && item.fresh === false);
  if (staleOfficial.length) gaps.push({ dimension: "evidence", severity: "high", reason: "stale-official-evidence", keys: staleOfficial.map((item) => item.key) });

  return {
    complete: gaps.length === 0,
    gaps,
    highRiskGapCount: gaps.filter((gap) => gap.severity === "high").length,
    mediumRiskGapCount: gaps.filter((gap) => gap.severity === "medium").length
  };
}

export function buildImprovementActionPlan(snapshot = {}, gapAnalysis = analyzeEvidenceGaps(snapshot)) {
  return gapAnalysis.gaps.map((gap, index) => ({
    id: `GAP-${String(index + 1).padStart(3, "0")}`,
    dimension: gap.dimension,
    severity: gap.severity,
    issue: gap.reason,
    owner: snapshot.owner || null,
    deadline: snapshot.deadline || null,
    requiredEvidenceKeys: gap.keys || [],
    status: "open",
    humanReviewRequired: true
  }));
}

export function buildAssessmentPack(input = {}) {
  const snapshot = input.snapshot || createEvidenceSnapshot(input);
  const gapAnalysis = analyzeEvidenceGaps(snapshot);
  const actionPlan = buildImprovementActionPlan(snapshot, gapAnalysis);
  const verifiedOfficialEvidence = (snapshot.evidence || []).filter((item) => item.official && item.verified && item.fresh && item.valid);
  const evidenceReady = (snapshot.evidence || []).length > 0 && gapAnalysis.highRiskGapCount === 0;

  return {
    version: EVIDENCE_ASSESSMENT_VERSION,
    snapshot,
    gapAnalysis,
    actionPlan,
    assessmentReadiness: evidenceReady ? "ready-for-human-assessment" : "needs-evidence-improvement",
    reusableFor: ["workflow-review", "gap-analysis", "action-plan", "LPA", "ITA", "award-evidence-pack"],
    verifiedOfficialEvidenceKeys: verifiedOfficialEvidence.map((item) => item.key),
    governance: {
      noFabrication: true,
      piiMinimization: true,
      auditTrailRequired: true,
      humanApprovalRequired: true,
      scoringByAIWithoutCriteriaAllowed: false
    }
  };
}

export { REQUIRED_DIMENSIONS as EVIDENCE_ASSESSMENT_DIMENSIONS };
