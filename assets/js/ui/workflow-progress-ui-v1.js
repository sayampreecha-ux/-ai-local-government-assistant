export const WORKFLOW_PROGRESS_UI_VERSION = '1.1';

let latestView = null;
let observerStarted = false;

const STATUS_LABELS = Object.freeze({
  'blocked-missing-evidence': 'รอข้อมูล/หลักฐาน',
  'blocked-official-source': 'รอตรวจแหล่งราชการ',
  'blocked-risk-review': 'รอตรวจความเสี่ยง',
  'awaiting-human-approval': 'รอผู้มีอำนาจอนุมัติ',
  ready: 'พร้อมเดินขั้นถัดไป',
  complete: 'เสร็จสมบูรณ์'
});

const KEY_LABELS = Object.freeze({
  hrIntent: 'วัตถุประสงค์และประเภทงานบุคคลที่ต้องการ',
  facts: 'ข้อเท็จจริงและข้อมูลพื้นฐานที่เกี่ยวข้อง',
  missionAuthority: 'ภารกิจและอำนาจหน้าที่ของหน่วยงาน',
  needJustification: 'เหตุผลและความจำเป็นของภารกิจ/ตำแหน่ง',
  budget: 'วงเงินงบประมาณและแหล่งงบประมาณ',
  budgetSource: 'แหล่งงบประมาณ',
  workload: 'ข้อมูลปริมาณงานและภาระงาน',
  currentStaffing: 'กรอบอัตรากำลังและจำนวนผู้ครองตำแหน่งปัจจุบัน',
  positionCount: 'จำนวนอัตราและตำแหน่งที่ต้องการ',
  organization: 'ชื่อและประเภทหน่วยงาน',
  authority: 'อำนาจหน้าที่/ฐานอำนาจตามกฎหมาย',
  officialEvidence: 'หลักฐานจากแหล่งราชการที่ยืนยันได้',
  technicalNeed: 'ความต้องการใช้งานและเหตุผลทางเทคนิค',
  marketPrice: 'ข้อมูลราคาตลาด/ราคาที่ใช้ประกอบการพิจารณา',
  procurementMethod: 'วิธีการจัดซื้อจัดจ้างที่เหมาะสม',
  citizenRequest: 'รายละเอียดคำขอของประชาชน',
  serviceManual: 'คู่มือประชาชน/หลักเกณฑ์ของบริการ',
  requiredDocuments: 'เอกสารประกอบคำขอที่กำหนด',
  fee: 'ค่าธรรมเนียมตามหลักเกณฑ์',
  timeframe: 'ระยะเวลาดำเนินการตามหลักเกณฑ์',
  hrFactSummary: 'สรุปข้อเท็จจริงสำหรับงานบุคคล',
  needMemo: 'บันทึกเหตุผลและความจำเป็น',
  workforcePlanDraft: 'ร่างแผนอัตรากำลัง',
  torDraft: 'ร่างขอบเขตของงาน (TOR)',
  procurementMemo: 'ร่างบันทึกเสนอการจัดซื้อจัดจ้าง',
  priceComparison: 'ตารางเปรียบเทียบราคา',
  applicationChecklist: 'รายการตรวจสอบเอกสารคำขอ',
  serviceAdvice: 'คำแนะนำขั้นตอนการรับบริการ',
  decisionDraft: 'ร่างเอกสารเสนอผู้มีอำนาจพิจารณา'
});

function humanizeKey(value = '') {
  const key = String(value || '').trim();
  if (!key) return '';
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  const normalized = key.replace(/[._-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
  return normalized || key;
}

function uniq(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}

export function buildWorkflowProgressPanelModel(view) {
  const primary = view?.primary || null;
  if (!primary) return null;
  const missing = uniq([...(primary.missingEvidence || []), ...(primary.missingOfficialEvidence || [])]);
  const deliverables = (primary.deliverables || []).map((item) => ({
    key: String(item?.artifactKey || ''),
    status: String(item?.status || 'required')
  })).filter((item) => item.key);
  const completedCount = Array.isArray(primary.completedStages) ? primary.completedStages.length : 0;
  const workflowCount = Array.isArray(view?.workflows) ? view.workflows.length : 1;
  const status = String(primary.workflowStatus || view?.caseStatus || view?.status || 'unknown');
  return Object.freeze({
    workflowId: String(primary.workflowId || ''),
    stageId: String(primary.currentStage?.id || ''),
    stageTitle: String(primary.currentStage?.title || (status === 'complete' ? 'เสร็จสมบูรณ์' : 'กำลังเตรียมงาน')),
    status,
    statusLabel: STATUS_LABELS[status] || String(primary.actionLabel || 'กำลังดำเนินการ'),
    actionLabel: String(primary.actionLabel || ''),
    completedCount,
    workflowCount,
    missing,
    missingOfficial: uniq(primary.missingOfficialEvidence),
    deliverables,
    approvalRequired: Boolean(primary.approvalRequired),
    riskReviewRequired: Boolean(primary.riskReviewRequired),
    failClosed: Boolean(view?.governance?.failClosed || primary?.qualityGate?.status === 'blocked'),
    nextActions: uniq((view?.nextActions || []).map((item) => item?.actionLabel)),
    crossWorkflows: (view?.workflows || []).map((item) => ({
      workflowId: String(item?.workflowId || ''),
      stageTitle: String(item?.currentStage?.title || 'เสร็จแล้ว'),
      status: String(item?.workflowStatus || '')
    })).filter((item) => item.workflowId)
  });
}

function installStyles() {
  if (document.getElementById('workflow-progress-ui-styles')) return;
  const style = document.createElement('style');
  style.id = 'workflow-progress-ui-styles';
  style.textContent = `
.workflow-progress-panel{margin:12px 0 2px;padding:14px;border:1px solid var(--gdl-line,#d2dcd5);border-radius:16px;background:#f8fbf9;color:var(--gdl-ink,#17231e)}
.workflow-progress-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.workflow-progress-head strong{font-size:14px;color:var(--gdl-primary,#12372a)}
.workflow-progress-badge{flex:0 0 auto;padding:4px 8px;border-radius:999px;background:#e8f0eb;color:#174333;font-size:11px;font-weight:700}.workflow-progress-badge.blocked{background:#fff2df;color:#7a4f00}.workflow-progress-badge.approval{background:#eef1ff;color:#354a8c}
.workflow-progress-meta{margin-top:5px;color:var(--gdl-muted,#4f5e56);font-size:12px;line-height:1.55}.workflow-progress-track{height:7px;margin:11px 0 8px;border-radius:999px;background:#e2e9e4;overflow:hidden}.workflow-progress-track>span{display:block;height:100%;min-width:8%;border-radius:inherit;background:var(--gdl-primary,#12372a)}
.workflow-progress-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.workflow-progress-item{padding:9px 10px;border:1px solid #dde5df;border-radius:11px;background:#fff}.workflow-progress-item b{display:block;margin-bottom:3px;font-size:11px;color:#506158}.workflow-progress-item span{display:block;font-size:12px;line-height:1.5;overflow-wrap:anywhere}.workflow-progress-next{margin-top:10px;padding:9px 10px;border-radius:11px;background:#eef5f0;font-size:12px;line-height:1.55}.workflow-progress-next strong{color:var(--gdl-primary,#12372a)}
.workflow-progress-more{margin-top:9px}.workflow-progress-more summary{cursor:pointer;color:var(--gdl-primary,#12372a);font-size:12px;font-weight:700}.workflow-progress-more ul{margin:7px 0 0;padding-left:20px;color:#46564e;font-size:12px;line-height:1.6}
@media(max-width:620px){.workflow-progress-grid{grid-template-columns:1fr}.workflow-progress-head{display:block}.workflow-progress-badge{display:inline-block;margin-top:7px}}
`;
  document.head.appendChild(style);
}

function textNode(tag, text, className = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function renderInto(card, view) {
  if (!card || card.querySelector('[data-workflow-progress-panel]')) return;
  const model = buildWorkflowProgressPanelModel(view);
  if (!model) return;
  installStyles();
  const panel = document.createElement('section');
  panel.className = 'workflow-progress-panel';
  panel.dataset.workflowProgressPanel = 'true';
  panel.setAttribute('aria-label', 'สถานะขั้นตอนงานราชการ');

  const head = document.createElement('div');
  head.className = 'workflow-progress-head';
  const headText = document.createElement('div');
  headText.append(textNode('strong', `ขั้นปัจจุบัน: ${model.stageTitle}`));
  headText.append(textNode('div', `${model.workflowId}${model.workflowCount > 1 ? ` · ทำงานร่วม ${model.workflowCount} ขั้นตอนงาน` : ''}`, 'workflow-progress-meta'));
  const badge = textNode('span', model.statusLabel, 'workflow-progress-badge');
  if (model.failClosed || model.missing.length || model.riskReviewRequired) badge.classList.add('blocked');
  if (model.approvalRequired) badge.classList.add('approval');
  head.append(headText, badge);

  const track = document.createElement('div');
  track.className = 'workflow-progress-track';
  const bar = document.createElement('span');
  const roughTotal = Math.max(model.completedCount + 1, model.completedCount + model.missing.length + 2);
  const pct = model.status === 'complete' ? 100 : Math.max(8, Math.min(92, Math.round((model.completedCount / roughTotal) * 100)));
  bar.style.width = `${pct}%`;
  track.append(bar);

  const grid = document.createElement('div');
  grid.className = 'workflow-progress-grid';
  const missing = document.createElement('div');
  missing.className = 'workflow-progress-item';
  missing.append(textNode('b', 'ข้อมูล/หลักฐานที่ต้องเพิ่มเติม'), textNode('span', model.missing.length ? model.missing.slice(0, 5).map(humanizeKey).join(' • ') : 'ข้อมูลและหลักฐานที่จำเป็นครบแล้ว'));
  const deliverables = document.createElement('div');
  deliverables.className = 'workflow-progress-item';
  deliverables.append(textNode('b', 'ชิ้นงานที่จะจัดทำ'), textNode('span', model.deliverables.length ? model.deliverables.slice(0, 5).map((item) => humanizeKey(item.key)).join(' • ') : 'ยังไม่มีชิ้นงานที่ต้องจัดทำในขั้นนี้'));
  grid.append(missing, deliverables);

  const next = document.createElement('div');
  next.className = 'workflow-progress-next';
  const nextText = model.approvalRequired
    ? 'หยุดรอผู้มีอำนาจตรวจ/อนุมัติ — AI ไม่อนุมัติแทน'
    : model.riskReviewRequired
      ? 'ตรวจจุดเสี่ยงและยืนยันหลักฐานให้ครบก่อนดำเนินการต่อ'
      : model.actionLabel || model.nextActions[0] || 'ดำเนินการตามขั้นตอนถัดไป';
  next.append(textNode('strong', 'ทำต่อ: '), document.createTextNode(nextText));

  panel.append(head, track, grid, next);
  if (model.crossWorkflows.length > 1 || model.missingOfficial.length) {
    const details = document.createElement('details');
    details.className = 'workflow-progress-more';
    const summary = document.createElement('summary');
    summary.textContent = 'ดูขั้นตอนงานและหลักฐานราชการที่เกี่ยวข้อง';
    const list = document.createElement('ul');
    model.crossWorkflows.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.workflowId}: ${item.stageTitle}`;
      list.append(li);
    });
    model.missingOfficial.forEach((key) => {
      const li = document.createElement('li');
      li.textContent = `ต้องยืนยันจากแหล่งราชการ: ${humanizeKey(key)}`;
      list.append(li);
    });
    details.append(summary, list);
    panel.append(details);
  }

  const firstSection = card.querySelector('.answer-section');
  if (firstSection) firstSection.insertBefore(panel, firstSection.firstChild?.nextSibling || null);
  else card.prepend(panel);
}

function tryRenderLatest() {
  if (!latestView || typeof document === 'undefined') return;
  const cards = [...document.querySelectorAll('.answer-card')];
  const target = cards.reverse().find((card) => !card.querySelector('[data-workflow-progress-panel]'));
  if (target) renderInto(target, latestView);
}

function ensureObserver() {
  if (observerStarted || typeof document === 'undefined' || !document.body) return;
  observerStarted = true;
  const observer = new MutationObserver(() => tryRenderLatest());
  observer.observe(document.body, { childList: true, subtree: true });
}

export function publishWorkflowProgressView(view) {
  latestView = view || null;
  if (typeof document !== 'undefined') {
    ensureObserver();
    queueMicrotask(tryRenderLatest);
  }
  return buildWorkflowProgressPanelModel(view);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureObserver, { once: true });
  else ensureObserver();
}

export default Object.freeze({ version: WORKFLOW_PROGRESS_UI_VERSION, buildWorkflowProgressPanelModel, publishWorkflowProgressView });
