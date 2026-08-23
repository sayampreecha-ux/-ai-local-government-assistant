import {
  CASE_MEMORY_STORAGE_KEY,
  sanitizeCaseRecord
} from '../../../src/government-case-memory-v1.js';

export const CASE_LIST_UI_VERSION = '1.0';

const safeText = (value, max = 160) => String(value || '').trim().slice(0, max);

function safeStorage(storage = null) {
  if (storage) return storage;
  try { return window.localStorage || null; } catch { return null; }
}

function toPersistedCase(item) {
  const sanitized = sanitizeCaseRecord(item);
  const { privacy, ...persisted } = sanitized;
  return persisted;
}

function persistCases(target, cases = []) {
  target.setItem(CASE_MEMORY_STORAGE_KEY, JSON.stringify((Array.isArray(cases) ? cases : []).map(toPersistedCase)));
}

export function readRememberedCases(storage = null) {
  const target = safeStorage(storage);
  if (!target) return [];
  try {
    const parsed = JSON.parse(target.getItem(CASE_MEMORY_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => sanitizeCaseRecord(item));
  } catch {
    return [];
  }
}

export function buildCaseListView(cases = []) {
  return Object.freeze((Array.isArray(cases) ? cases : [])
    .map((item) => sanitizeCaseRecord(item))
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .map((item) => Object.freeze({
      caseId: item.caseId,
      title: item.title,
      routingHint: item.routingHint,
      status: item.status,
      updatedAt: item.updatedAt,
      workflowIds: item.workflowIds,
      currentStageTitle: item.progress.find((p) => p.currentStageTitle)?.currentStageTitle || null,
      nextAction: item.progress.find((p) => p.nextAction)?.nextAction || null,
      approvalRequired: item.progress.some((p) => p.approvalRequired),
      failClosed: item.progress.some((p) => p.failClosed),
      privacy: item.privacy
    })));
}

export function prioritizeCase(cases = [], caseId = '') {
  const id = safeText(caseId, 100);
  const list = (Array.isArray(cases) ? cases : []).map((item) => sanitizeCaseRecord(item));
  const selected = list.find((item) => item.caseId === id);
  if (!selected) return Object.freeze(list);
  return Object.freeze([selected, ...list.filter((item) => item.caseId !== id)]);
}

export function prioritizeRememberedCase(caseId, storage = null) {
  const target = safeStorage(storage);
  if (!target) return false;
  try {
    const next = prioritizeCase(readRememberedCases(target), caseId);
    persistCases(target, next);
    return true;
  } catch {
    return false;
  }
}

export function forgetCase(caseId, storage = null) {
  const target = safeStorage(storage);
  if (!target) return false;
  const id = safeText(caseId, 100);
  try {
    const next = readRememberedCases(target).filter((item) => item.caseId !== id);
    persistCases(target, next);
    return true;
  } catch {
    return false;
  }
}

function injectStyles() {
  if (document.getElementById('gp-case-list-style')) return;
  const style = document.createElement('style');
  style.id = 'gp-case-list-style';
  style.textContent = `
    .gp-case-button{position:relative}.gp-case-count{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#8a6418;color:#fff;font-size:10px;font-weight:800}
    .gp-case-dialog{width:min(720px,calc(100% - 28px));max-height:min(760px,calc(100dvh - 36px));border:1px solid #d2dcd5;border-radius:22px;padding:0;background:#fff;color:#17231e;box-shadow:0 30px 90px rgba(0,0,0,.25)}.gp-case-dialog::backdrop{background:rgba(11,27,21,.54);backdrop-filter:blur(4px)}
    .gp-case-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 22px;border-bottom:1px solid #d2dcd5}.gp-case-head h2{margin:0;font-size:22px}.gp-case-head p{margin:4px 0 0;color:#4f5e56;font-size:12px}.gp-case-close{width:40px;height:40px;border:1px solid #d2dcd5;border-radius:12px;background:#fff;cursor:pointer}
    .gp-case-list{display:grid;gap:10px;padding:16px 18px 22px;overflow:auto}.gp-case-empty{padding:34px 18px;text-align:center;color:#4f5e56}.gp-case-card{padding:14px;border:1px solid #d2dcd5;border-radius:15px;background:#f9fbfa}.gp-case-card h3{margin:0 0 5px;font-size:15px;color:#12372a}.gp-case-meta,.gp-case-stage,.gp-case-next{margin:3px 0;color:#4f5e56;font-size:12px;line-height:1.55}.gp-case-flags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.gp-case-chip{padding:4px 7px;border-radius:999px;background:#e8f0eb;color:#174333;font-size:10px;font-weight:700}.gp-case-chip.warn{background:#fff1d7;color:#714c00}.gp-case-actions{display:flex;gap:8px;margin-top:11px}.gp-case-actions button{min-height:40px;padding:8px 12px;border-radius:10px;border:1px solid #d2dcd5;background:#fff;color:#12372a;font-weight:700;cursor:pointer}.gp-case-actions .primary{border-color:#12372a;background:#12372a;color:#fff}
    @media(max-width:620px){.gp-case-dialog{width:calc(100% - 12px);max-height:calc(100dvh - 12px)}.gp-case-actions{display:grid;grid-template-columns:1fr auto}.gp-case-actions button{min-height:46px}}
  `;
  document.head.append(style);
}

function formatDate(value) {
  if (!value) return 'ไม่ระบุเวลา';
  try { return new Date(value).toLocaleString('th-TH'); } catch { return 'ไม่ระบุเวลา'; }
}

function createCaseCard(item, { onResume, onForget }) {
  const card = document.createElement('article');
  card.className = 'gp-case-card';
  const title = document.createElement('h3');
  title.textContent = item.title || 'เรื่องงานราชการ';
  const meta = document.createElement('p');
  meta.className = 'gp-case-meta';
  meta.textContent = `${item.status === 'complete' ? 'เสร็จแล้ว' : 'งานค้าง'} · อัปเดต ${formatDate(item.updatedAt)}`;
  const stage = document.createElement('p');
  stage.className = 'gp-case-stage';
  stage.textContent = `ขั้นปัจจุบัน: ${item.currentStageTitle || 'รอตรวจสถานะ'}`;
  const next = document.createElement('p');
  next.className = 'gp-case-next';
  next.textContent = `งานถัดไป: ${item.nextAction || 'เปิดเคสเพื่อตรวจงานถัดไป'}`;
  const flags = document.createElement('div');
  flags.className = 'gp-case-flags';
  if (item.approvalRequired) {
    const chip = document.createElement('span'); chip.className = 'gp-case-chip warn'; chip.textContent = 'รอ Human Approval'; flags.append(chip);
  }
  if (item.failClosed) {
    const chip = document.createElement('span'); chip.className = 'gp-case-chip warn'; chip.textContent = 'ยังมี blocker'; flags.append(chip);
  }
  const privacyChip = document.createElement('span');
  privacyChip.className = 'gp-case-chip'; privacyChip.textContent = 'ไม่เก็บ Prompt/หลักฐานดิบ'; flags.append(privacyChip);
  const actions = document.createElement('div');
  actions.className = 'gp-case-actions';
  const resume = document.createElement('button');
  resume.type = 'button'; resume.className = 'primary'; resume.textContent = item.status === 'complete' ? 'เปิดดูเคส' : 'ทำต่อ';
  resume.addEventListener('click', () => onResume?.(item));
  const remove = document.createElement('button');
  remove.type = 'button'; remove.textContent = 'ลบ';
  remove.addEventListener('click', () => onForget?.(item));
  actions.append(resume, remove);
  card.append(title, meta, stage, next, flags, actions);
  return card;
}

export function initializeCaseListUI({ app = window.GovPrompt, storage = null } = {}) {
  if (typeof document === 'undefined' || document.getElementById('gpCaseDialog')) return;
  injectStyles();
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;

  const button = document.createElement('button');
  button.type = 'button'; button.className = 'gp-case-button'; button.setAttribute('aria-label', 'งานค้างและเคสเดิม');
  const label = document.createElement('span'); label.textContent = 'งานค้าง';
  const count = document.createElement('span'); count.className = 'gp-case-count';
  button.append(label, count);

  const dialog = document.createElement('dialog');
  dialog.id = 'gpCaseDialog'; dialog.className = 'gp-case-dialog'; dialog.setAttribute('aria-labelledby', 'gpCaseTitle');
  const head = document.createElement('div'); head.className = 'gp-case-head';
  const headText = document.createElement('div');
  const title = document.createElement('h2'); title.id = 'gpCaseTitle'; title.textContent = 'งานค้าง / เคสเดิม';
  const note = document.createElement('p'); note.textContent = 'เก็บเฉพาะสถานะ Workflow ในเบราว์เซอร์ ไม่เก็บ Prompt หรือหลักฐานดิบ';
  headText.append(title, note);
  const close = document.createElement('button'); close.type = 'button'; close.className = 'gp-case-close'; close.setAttribute('aria-label', 'ปิด'); close.textContent = '×';
  head.append(headText, close);
  const list = document.createElement('div'); list.className = 'gp-case-list';
  dialog.append(head, list); document.body.append(dialog);
  nav.append(button);

  const refresh = () => {
    const cases = buildCaseListView(readRememberedCases(storage));
    const active = cases.filter((item) => item.status !== 'complete');
    count.textContent = String(active.length);
    count.hidden = active.length === 0;
    list.replaceChildren();
    if (!cases.length) {
      const empty = document.createElement('div'); empty.className = 'gp-case-empty';
      const strong = document.createElement('strong'); strong.textContent = 'ยังไม่มีงานค้าง';
      const p = document.createElement('p'); p.textContent = 'เมื่อเริ่ม Workflow ระบบจะจำเฉพาะสถานะงานเพื่อให้กลับมาทำต่อได้';
      empty.append(strong, p); list.append(empty); return;
    }
    cases.forEach((item) => list.append(createCaseCard(item, {
      onResume: (selected) => {
        prioritizeRememberedCase(selected.caseId, storage);
        dialog.close();
        const input = document.getElementById('promptInput');
        const form = document.getElementById('chatForm');
        if (!input || !form) return;
        input.value = `ทำต่อ ${selected.routingHint || ''}`.trim();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        form.requestSubmit();
      },
      onForget: (selected) => {
        forgetCase(selected.caseId, storage);
        app?.toast?.('ลบสถานะเคสออกจากเบราว์เซอร์แล้ว');
        refresh();
      }
    })));
  };

  button.addEventListener('click', () => { refresh(); dialog.showModal(); });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  window.addEventListener('storage', (event) => { if (event.key === CASE_MEMORY_STORAGE_KEY) refresh(); });
  document.addEventListener('govprompt:case-memory-updated', refresh);
  refresh();
}

export default Object.freeze({ version: CASE_LIST_UI_VERSION, initializeCaseListUI, buildCaseListView, prioritizeCase });
