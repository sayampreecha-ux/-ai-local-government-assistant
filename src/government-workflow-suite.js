const WORKFLOWS = Object.freeze({
  procurement: {
    id: "gov.procurement",
    keywords: ["จัดซื้อ", "จัดจ้าง", "ซื้อ", "เครื่องจักร", "รถขุด", "รถบรรทุก", "tor", "ราคากลาง", "e-bidding", "เฉพาะเจาะจง"],
    steps: ["mission-authority", "plan-budget", "need-analysis", "market-standard-price", "spec-tor", "competition-risk", "procurement-method", "reference-price", "approval", "publication", "bid-review", "contract", "inspection", "asset-maintenance"]
  },
  finance: {
    id: "gov.finance",
    keywords: ["เบิก", "เบิกจ่าย", "งบประมาณ", "เงินกู้", "กู้เงิน", "เงินสะสม", "ค่าใช้จ่าย", "การเงิน"],
    steps: ["authority", "funding-source", "budget-availability", "financial-condition", "approval", "supporting-documents", "payment", "accounting-record", "audit-trail"]
  },
  correspondence: {
    id: "gov.correspondence",
    keywords: ["หนังสือราชการ", "ร่างหนังสือ", "บันทึกข้อความ", "หนังสือภายนอก", "หนังสือภายใน"],
    steps: ["purpose", "recipient-authority", "facts", "references", "draft", "records-style-check", "pii-check", "approval-signature", "dispatch"]
  },
  legal: {
    id: "gov.legal",
    keywords: ["กฎหมาย", "ระเบียบ", "ข้อกฎหมาย", "อำนาจ", "หารือ", "คำพิพากษา", "วินัย"],
    steps: ["facts", "legal-issue", "official-source", "current-status", "rule-application", "risk", "options", "human-decision"]
  },
  project: {
    id: "gov.project",
    keywords: ["ทำโครงการ", "โครงการ", "จัดอบรม", "กิจกรรม", "ดำเนินโครงการ"],
    steps: ["mission-authority", "problem-need", "plan-linkage", "objective", "target", "activities", "budget", "procurement-dependency", "kpi", "risk", "approval", "evaluation"]
  },
  hr: {
    id: "gov.hr",
    keywords: ["บุคคล", "อัตรากำลัง", "เลื่อนขั้น", "เลื่อนเงินเดือน", "บรรจุ", "แต่งตั้ง", "โอน", "ย้าย"],
    steps: ["hr-intent", "facts", "current-rule", "eligibility", "workforce-impact", "financial-impact", "recommendation", "human-approval"]
  }
});

const HIGH_RISK = ["เงินกู้", "กู้เงิน", "เครื่องจักร", "e-bidding", "เฉพาะเจาะจง", "ยุบตำแหน่ง", "เพิ่มตำแหน่ง", "วินัย", "คำพิพากษา"];

function textOf(input = {}) {
  return String(input.query || input.question || input.text || input.intent || "").toLowerCase();
}

export function detectGovernmentWorkflows(input = {}) {
  const text = textOf(input);
  const matched = Object.values(WORKFLOWS).filter((wf) => wf.keywords.some((k) => text.includes(k.toLowerCase())));
  // Procurement projects normally need project + finance governance as dependencies.
  const ids = new Set(matched.map((x) => x.id));
  if (ids.has("gov.procurement")) { ids.add("gov.project"); ids.add("gov.finance"); }
  if (text.includes("เงินกู้") || text.includes("กู้เงิน")) { ids.add("gov.finance"); ids.add("gov.legal"); }
  return Object.values(WORKFLOWS).filter((wf) => ids.has(wf.id));
}

export function runGovernmentWorkflow(input = {}) {
  const text = textOf(input);
  const workflows = detectGovernmentWorkflows(input);
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const officialVerified = evidence.some((e) => e?.official === true && e?.verified === true);
  const highRisk = HIGH_RISK.some((term) => text.includes(term));
  const steps = workflows.flatMap((wf) => wf.steps.map((step) => ({ workflow: wf.id, step })));

  return {
    intent: workflows.map((w) => w.id),
    orchestration: workflows.length > 1 ? "cross-workflow" : workflows.length === 1 ? "single-workflow" : "unclassified",
    steps,
    governance: {
      officialSourceFirst: true,
      latestRuleVerificationRequired: highRisk,
      officialVerified,
      noFabrication: true,
      piiMinimization: true,
      auditTrailRequired: true,
      humanApprovalRequired: true,
      failClosed: highRisk && !officialVerified
    },
    status: workflows.length === 0 ? "needs-intent" : highRisk && !officialVerified ? "needs-official-evidence" : "workflow-ready",
    next: workflows.length === 0 ? ["clarify-task"] : highRisk && !officialVerified ? ["verify-official-source"] : steps.slice(0, 3)
  };
}

export { WORKFLOWS };
