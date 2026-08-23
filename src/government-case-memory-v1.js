export const GOVERNMENT_CASE_MEMORY_VERSION = '1.1';
export const CASE_MEMORY_STORAGE_KEY = 'govprompt-v7-case-memory';
export const CASE_MEMORY_MAX_CASES = 20;

const ROUTING_HINT_BY_WORKFLOW = Object.freeze({
  'gov.citizen-service': 'ขออนุญาต บริการประชาชน',
  'gov.procurement': 'จัดซื้อจัดจ้าง',
  'gov.finance': 'การเงิน',
  'gov.legal': 'กฎหมาย',
  'gov.project': 'โครงการ',
  'gov.hr': 'อัตรากำลัง บุคคล',
  'gov.correspondence': 'หนังสือราชการ',
  'gov.engineering': 'งานช่าง',
  'gov.health': 'สาธารณสุข',
  'gov.education': 'การศึกษา',
  'gov.internal-audit': 'ตรวจสอบภายใน',
  'gov.executive': 'งานบริหาร',
  'gov.public-relations': 'ประชาสัมพันธ์',
  'gov.council': 'สภาท้องถิ่น',
  'gov.budget-draft': 'งบประมาณ'
});

const safeText = (value, max = 120) => String(value || '').normalize('NFKC').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const uniq = (values = []) => [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];

export function generateCaseId(now = Date.now(), random = Math.random()) {
  return `case-${Number(now).toString(36)}-${Math.floor(Number(random) * 1e9).toString(36)}`;
}

export function isResumeIntent(query = '') {
  const text = safeText(query, 500).toLowerCase();
  return /ทำต่อ|ต่อเรื่องเดิม|งานเดิม|เรื่องเดิม|เปิดเรื่องเดิม|resume|continue/.test(text);
}

export function buildRoutingHint(workflowIds = []) {
  return uniq(workflowIds).map((id) => ROUTING_HINT_BY_WORKFLOW[id]).filter(Boolean).join(' ');
}

function transitionLogFor(workflowId, completedStages = [], orderedStageIds = []) {
  const list = Array.isArray(completedStages) ? completedStages : [];
  return list.map((stageId, index) => ({
    type: 'stage-transition',
    workflowId,
    fromStageId: stageId,
    toStageId: orderedStageIds[index + 1] || null,
    actor: 'human',
    at: null
  }));
}

export function buildResumableWorkflowState({ workflowId, caseId, completedStages = [], orderedStageIds = [] } = {}) {
  const completed = uniq(completedStages);
  const currentStageId = orderedStageIds[completed.length] || null;
  return {
    schemaVersion: '2.0',
    workflowId: safeText(workflowId, 80),
    caseId: safeText(caseId, 100),
    status: currentStageId ? 'active' : 'complete',
    completedStages: completed,
    currentStageId,
    transitionLog: transitionLogFor(workflowId, completed, orderedStageIds)
  };
}

export function sanitizeCaseRecord(record = {}) {
  const workflowIds = uniq(record.workflowIds).slice(0, 12);
  const progress = (Array.isArray(record.progress) ? record.progress : []).slice(0, 12).map((item) => Object.freeze({
    workflowId: safeText(item?.workflowId, 80),
    currentStageId: safeText(item?.currentStageId, 100) || null,
    currentStageTitle: safeText(item?.currentStageTitle, 160) || null,
    completedStages: Object.freeze(uniq(item?.completedStages).slice(0, 64)),
    workflowStatus: safeText(item?.workflowStatus, 80),
    nextAction: safeText(item?.nextAction, 120),
    approvalRequired: Boolean(item?.approvalRequired),
    failClosed: Boolean(item?.failClosed)
  }));

  return Object.freeze({
    version: GOVERNMENT_CASE_MEMORY_VERSION,
    caseId: safeText(record.caseId, 100),
    title: safeText(record.title, 100) || 'เรื่องงานราชการ',
    workflowIds: Object.freeze(workflowIds),
    routingHint: safeText(record.routingHint || buildRoutingHint(workflowIds), 200),
    progress: Object.freeze(progress),
    status: safeText(record.status, 40) || 'active',
    createdAt: safeText(record.createdAt, 40),
    updatedAt: safeText(record.updatedAt, 40),
    privacy: Object.freeze({
      rawPromptStored: false,
      rawEvidenceStored: false,
      personalDataStored: false,
      secretsStored: false
    })
  });
}

export function upsertCaseMemory(cases = [], record = {}) {
  const sanitized = sanitizeCaseRecord(record);
  if (!sanitized.caseId) throw new Error('caseId is required');
  const next = (Array.isArray(cases) ? cases : []).filter((item) => item?.caseId !== sanitized.caseId);
  next.unshift(sanitized);
  return Object.freeze(next.slice(0, CASE_MEMORY_MAX_CASES));
}

export function resolveResumeCase(cases = [], query = '', workflowIds = []) {
  const list = Array.isArray(cases) ? cases : [];
  const requested = new Set(uniq(workflowIds));
  const compatible = list.filter((item) => {
    if (!requested.size) return true;
    return (item?.workflowIds || []).some((id) => requested.has(id));
  });
  if (!isResumeIntent(query)) return null;
  return compatible.find((item) => item?.status !== 'complete') || compatible[0] || null;
}

export function buildCaseTitle(workflows = []) {
  const active = (Array.isArray(workflows) ? workflows : []).find((item) => item?.currentStage?.title) || workflows?.[0];
  const workflowId = active?.workflowId || '';
  const label = ROUTING_HINT_BY_WORKFLOW[workflowId] || 'งานราชการ';
  return safeText(`${label}${active?.currentStage?.title ? ` · ${active.currentStage.title}` : ''}`, 100);
}
