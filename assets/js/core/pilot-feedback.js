(() => {
  'use strict';

  const STORAGE_KEY = 'govprompt-pilot-feedback-v1';
  const USAGE_STORAGE_KEY = 'govprompt-local-usage-v1';
  const MAX_RECORDS = 100;
  const MAX_USAGE_DAYS = 30;
  const VALID_MODULES = Object.freeze(Array.from({ length: 13 }, (_, index) => `GP${String(index + 1).padStart(3, '0')}`));
  const VALID_MODULE_SET = new Set(VALID_MODULES);
  const ISSUE_CODES = Object.freeze({ ROUTE: 'route', ANSWER: 'answer', SEARCH: 'search', FORMAT: 'format', PRIVACY: 'privacy' });
  const ISSUE_LABELS = Object.freeze({ answer: 'ข้อมูลไม่ถูก/ไม่ครบ', search: 'แหล่งค้นไม่ตรง', format: 'รูปแบบไม่เหมาะ', route: 'เลือกหมวดไม่ตรง', privacy: 'ความเป็นส่วนตัว/ความปลอดภัย' });

  function readRecords() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECORDS) : [];
    } catch { return []; }
  }

  function writeRecords(records) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS))); return true; }
    catch { return false; }
  }

  function validModuleId(value) {
    const moduleId = String(value || '');
    return VALID_MODULE_SET.has(moduleId) ? moduleId : '';
  }

  function addFeedback({ moduleId, transactionType, verdict, issueCodes = [], expectedModuleId } = {}) {
    const safeVerdict = verdict === 'up' ? 'up' : verdict === 'down' ? 'down' : '';
    if (!safeVerdict) return Object.freeze({ saved: false, reason: 'INVALID_VERDICT' });
    const allowedIssues = new Set(Object.values(ISSUE_CODES));
    const safeIssues = [...new Set((Array.isArray(issueCodes) ? issueCodes : []).filter(code => allowedIssues.has(code)))];
    const actualModuleId = validModuleId(moduleId) || 'UNKNOWN';
    const routeCorrection = safeVerdict === 'down' && safeIssues.includes(ISSUE_CODES.ROUTE) ? validModuleId(expectedModuleId) : '';
    const record = {
      at: new Date().toISOString(),
      moduleId: actualModuleId,
      transactionType: String(transactionType || 'general').slice(0, 40),
      verdict: safeVerdict,
      issueCodes: Object.freeze(safeIssues)
    };
    if (routeCorrection) record.expectedModuleId = routeCorrection;
    Object.freeze(record);
    return Object.freeze({ saved: writeRecords([record, ...readRecords()]), record });
  }

  function summary() {
    const records = readRecords();
    const byModule = {}, issues = {}, routeCorrections = {};
    let up = 0, down = 0;
    records.forEach(record => {
      if (record.verdict === 'up') up += 1;
      if (record.verdict === 'down') down += 1;
      byModule[record.moduleId] = (byModule[record.moduleId] || 0) + 1;
      (record.issueCodes || []).forEach(code => { issues[code] = (issues[code] || 0) + 1; });
      if (record.issueCodes?.includes(ISSUE_CODES.ROUTE) && validModuleId(record.expectedModuleId)) {
        const pair = `${record.moduleId}→${record.expectedModuleId}`;
        routeCorrections[pair] = (routeCorrections[pair] || 0) + 1;
      }
    });
    return Object.freeze({ total: records.length, up, down, satisfactionRate: records.length ? Number((up / records.length * 100).toFixed(1)) : 0, byModule: Object.freeze({ ...byModule }), issues: Object.freeze({ ...issues }), routeCorrections: Object.freeze({ ...routeCorrections }) });
  }

  function clear() { try { sessionStorage.removeItem(STORAGE_KEY); } catch {} }

  function readLocalUsage() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
  }

  function trimUsageDays(byDay) {
    return Object.fromEntries(Object.entries(byDay || {}).sort(([a], [b]) => b.localeCompare(a)).slice(0, MAX_USAGE_DAYS));
  }

  function recordLocalUsage(route) {
    const moduleId = validModuleId(route?.moduleId);
    const transactionType = String(route?.transactionType || '').trim().toLowerCase();
    if (!moduleId || !/^[a-z0-9-]{1,40}$/.test(transactionType)) return false;
    const data = readLocalUsage();
    const today = new Date().toISOString().slice(0, 10);
    data.total = Number(data.total || 0) + 1;
    data.byModule = { ...(data.byModule || {}) };
    data.byTransaction = { ...(data.byTransaction || {}) };
    data.byDay = { ...(data.byDay || {}) };
    data.byModule[moduleId] = Number(data.byModule[moduleId] || 0) + 1;
    data.byTransaction[transactionType] = Number(data.byTransaction[transactionType] || 0) + 1;
    data.byDay[today] = Number(data.byDay[today] || 0) + 1;
    data.byDay = trimUsageDays(data.byDay);
    data.updatedAt = new Date().toISOString();
    try { localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data)); return true; }
    catch { return false; }
  }

  function localUsageSummary() {
    const data = readLocalUsage();
    return Object.freeze({
      total: Number(data.total || 0),
      byModule: Object.freeze({ ...(data.byModule || {}) }),
      byTransaction: Object.freeze({ ...(data.byTransaction || {}) }),
      byDay: Object.freeze(trimUsageDays(data.byDay)),
      updatedAt: data.updatedAt || null,
      scope: 'this-device-only',
      privacy: 'Stored only in this browser. No prompt text, answer text, file content, name, email, IP, cookie, fingerprint, or user identifier is recorded.'
    });
  }

  function exportReport() {
    return JSON.stringify({ generatedAt: new Date().toISOString(), privacy: 'No raw prompt, answer text, document content, name, email, IP, cookie, fingerprint, user identifier, or free-text feedback is stored.', usage: localUsageSummary(), summary: summary(), records: readRecords() }, null, 2);
  }

  function wrapRouteTransaction() {
    const core = window.GovPromptCore;
    const original = core?.routeTransaction;
    if (typeof original !== 'function' || original.__govpromptUsageWrapped) return;
    const wrapped = function wrappedRouteTransaction(...args) {
      const route = original.apply(this, args);
      recordLocalUsage(route);
      return route;
    };
    Object.defineProperty(wrapped, '__govpromptUsageWrapped', { value: true });
    core.routeTransaction = wrapped;
  }

  function routeMetaFor(node) {
    const label = node.querySelector('.route-label')?.textContent || '';
    const moduleId = label.match(/GP\d{3}/)?.[0] || 'UNKNOWN';
    return Object.freeze({ moduleId, transactionType: 'general' });
  }

  function disableGroup(group, message) {
    group.querySelectorAll('button').forEach(button => { button.disabled = true; });
    const status = document.createElement('span');
    status.className = 'pilot-feedback-status';
    status.textContent = message;
    group.append(status);
  }

  function installFeedbackOnCard(card) {
    if (!(card instanceof HTMLElement) || card.dataset.feedbackInstalled === '1') return;
    card.dataset.feedbackInstalled = '1';
    const group = document.createElement('div');
    group.className = 'pilot-feedback';
    group.setAttribute('aria-label', 'ให้ข้อเสนอแนะต่อผลลัพธ์นี้');
    group.innerHTML = '<span>ผลลัพธ์นี้ใช้ได้ไหม</span>';

    const up = document.createElement('button');
    up.type = 'button'; up.textContent = '👍 ใช้ได้';
    const down = document.createElement('button');
    down.type = 'button'; down.textContent = '👎 ต้องปรับปรุง';
    const issues = document.createElement('div');
    issues.className = 'pilot-feedback-issues'; issues.hidden = true;

    Object.entries(ISSUE_LABELS).forEach(([code, label]) => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = label; button.dataset.issueCode = code;
      button.addEventListener('click', () => {
        const result = addFeedback({ ...routeMetaFor(card), verdict: 'down', issueCodes: [code] });
        if (result.saved) disableGroup(group, 'ขอบคุณครับ รับข้อมูลแล้ว');
      }, { once: true });
      issues.append(button);
    });

    up.addEventListener('click', () => {
      const result = addFeedback({ ...routeMetaFor(card), verdict: 'up' });
      if (result.saved) disableGroup(group, 'ขอบคุณครับ');
    }, { once: true });
    down.addEventListener('click', () => { issues.hidden = false; down.setAttribute('aria-expanded', 'true'); }, { once: true });
    group.append(up, down, issues);
    card.append(group);
  }

  function installFeedbackUI() {
    const root = document.getElementById('conversation');
    if (!root) return false;
    const scan = () => root.querySelectorAll('.answer-card').forEach(installFeedbackOnCard);
    scan();
    new MutationObserver(scan).observe(root, { childList: true, subtree: true });
    return true;
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    PILOT_FEEDBACK_ISSUES: ISSUE_CODES,
    PILOT_FEEDBACK_MODULES: VALID_MODULES,
    addPilotFeedback: addFeedback,
    getPilotFeedbackSummary: summary,
    exportPilotFeedbackReport: exportReport,
    clearPilotFeedback: clear,
    recordLocalUsage,
    getLocalUsageSummary: localUsageSummary,
    installPilotFeedbackUI: installFeedbackUI
  });
  wrapRouteTransaction();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installFeedbackUI, { once: true });
  else installFeedbackUI();
})();