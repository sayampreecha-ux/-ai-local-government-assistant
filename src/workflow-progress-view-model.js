const STATUS_LABELS = Object.freeze({
  "blocked-missing-evidence": "ขาดข้อมูล/หลักฐาน",
  "blocked-official-source": "รอยืนยันแหล่งราชการ",
  "blocked-risk-review": "ต้องทบทวนความเสี่ยง",
  "awaiting-human-approval": "รอผู้มีอำนาจอนุมัติ",
  ready: "พร้อมดำเนินการขั้นนี้",
  complete: "เสร็จสิ้น",
  "workflow-ready": "พร้อมเริ่ม Workflow",
  "needs-official-evidence": "รอยืนยันแหล่งราชการ",
  "needs-intent": "ต้องระบุงานให้ชัดขึ้น"
});

const unique = (items = []) => [...new Set((Array.isArray(items) ? items : []).filter(Boolean).map(String))];

function primaryExecution(result = {}) {
  return result.citizenService || result.primary?.currentV4 || result.primary?.currentV3 || result.primary?.currentV2 || result.primary?.current || result.primary || null;
}

function stageSummary(execution = {}) {
  const stage = execution?.currentStage || execution?.execution?.currentStage || null;
  const completed = execution?.completedStages || execution?.state?.completedStages || [];
  return {
    id: stage?.id || null,
    title: stage?.title || null,
    completedCount: Array.isArray(completed) ? completed.length : 0
  };
}

function deriveMissing(execution = {}) {
  return unique([
    ...(execution?.missingEvidence || []),
    ...(execution?.missingOfficialEvidence || []).map((key) => `official:${key}`),
    ...(execution?.nextRequestedInputs || [])
  ]);
}

function deriveApproval(execution = {}) {
  const status = execution?.status;
  if (status !== "awaiting-human-approval") return null;
  return {
    required: true,
    stageId: execution?.currentStage?.id || null,
    stageTitle: execution?.currentStage?.title || null,
    action: "human-review-and-approve"
  };
}

function deriveDeliverables(execution = {}) {
  const required = execution?.requiredDeliverables || execution?.deliverablesReady || [];
  return unique(required).map((key) => ({ key, status: execution?.deliverablesReady?.includes?.(key) ? "ready" : "required" }));
}

export function buildWorkflowProgressView(result = {}) {
  const execution = primaryExecution(result);
  const status = execution?.status || result?.status || result?.primary?.status || "needs-intent";
  const stage = stageSummary(execution || {});
  const missing = deriveMissing(execution || {});
  const approval = deriveApproval(execution || {});
  const deliverables = deriveDeliverables(execution || {});
  const assessment = result?.evidenceAssessment || null;

  return {
    version: "1.0",
    workflowId: execution?.workflowId || result?.detection?.primaryWorkflowId || null,
    status,
    statusLabel: STATUS_LABELS[status] || status,
    currentStage: stage,
    missing,
    approval,
    deliverables,
    evidenceHealth: assessment ? {
      status: assessment.status || null,
      gapCount: Array.isArray(assessment.gaps) ? assessment.gaps.length : 0,
      highGapCount: Array.isArray(assessment.gaps) ? assessment.gaps.filter((g) => g.severity === "high").length : 0
    } : null,
    nextAction: approval
      ? "เสนอผู้มีอำนาจตรวจและอนุมัติ"
      : missing.length
        ? "เติมข้อมูลหรือหลักฐานที่ขาด"
        : status === "complete"
          ? "ปิดเรื่องและจัดเก็บ Audit Trail"
          : "ดำเนินการขั้นปัจจุบัน",
    governance: {
      humanApprovalRequired: Boolean(result?.governance?.humanApprovalRequired ?? execution?.governance?.humanApprovalRequired),
      failClosed: Boolean(result?.governance?.failClosed ?? execution?.governance?.failClosed),
      officialSourceFirst: Boolean(result?.governance?.officialSourceFirst ?? execution?.governance?.officialSourceFirst),
      piiMinimization: Boolean(result?.governance?.piiMinimization ?? execution?.governance?.piiMinimization)
    }
  };
}
