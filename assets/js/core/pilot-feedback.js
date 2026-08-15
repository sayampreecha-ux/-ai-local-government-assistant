(() => {
  'use strict';

  const STORAGE_KEY = 'govprompt-pilot-feedback-v1';
  const USAGE_STORAGE_KEY = 'govprompt-local-usage-v1';
  const FEEDBACK_AGGREGATE_KEY = 'govprompt-local-feedback-summary-v1';
  const MAX_RECORDS = 100;
  const MAX_USAGE_DAYS = 30;
  const VALID_MODULES = Object.freeze(Array.from({ length: 13 }, (_, index) => `GP${String(index + 1).padStart(3, '0')}`));
  const VALID_MODULE_SET = new Set(VALID_MODULES);
  const ISSUE_CODES = Object.freeze({
    ROUTE: 'route',
    ANSWER: 'answer',
    SEARCH: 'search',
    FORMAT: 'format',
    PRIVACY: 'privacy'
  });

  function readRecords() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECORDS) : [];
    } catch {
      return [];
    }
  }

  function writeRecords(records) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
      return true;
    } catch {
      return false;
    }
  }

  function validModuleId(value) {
    const moduleId = String(value || '');
    return VALID_MODULE_SET.has(moduleId) ? moduleId : '';
  }

  function readLocalFeedbackAggregate() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FEEDBACK_AGGREGATE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function trimDays(byDay) {
    return Object.fromEntries(Object.entries(byDay || {}).sort(([a], [b]) => b.localeCompare(a)).slice(0, MAX_USAGE_DAYS));
  }

  function recordLocalFeedbackAggregate(record) {
    if (!record || !['up', 'down'].includes(record.verdict)) return false;
    const data = readLocalFeedbackAggregate();
    const today = new Date().toISOString().slice(0, 10);
    data.total = Number(data.total || 0) + 1;
    data.up = Number(data.up || 0) + (record.verdict === 'up' ? 1 : 0);
    data.down = Number(data.down || 0) + (record.verdict === 'down' ? 1 : 0);
    data.byModule = { ...(data.byModule || {}) };
    data.issues = { ...(data.issues || {}) };
    data.byDay = { ...(data.byDay || {}) };
    data.byModule[record.moduleId] = Number(data.byModule[record.moduleId] || 0) + 1;
    (record.issueCodes || []).forEach(code => { data.issues[code] = Number(data.issues[code] || 0) + 1; });
    data.byDay[today] = Number(data.byDay[today] || 0) + 1;
    data.byDay = trimDays(data.byDay);
    data.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(FEEDBACK_AGGREGATE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function addFeedback({ moduleId, transactionType, verdict, issueCodes = [], expectedModuleId } = {}) {
    const safeVerdict = verdict === 'up' ? 'up' : verdict === 'down' ? 'down' : '';
    if (!safeVerdict) return Object.freeze({ saved: false, reason: 'INVALID_VERDICT' });

    const allowedIssues = new Set(Object.values(ISSUE_CODES));
    const safeIssues = [...new Set((Array.isArray(issueCodes) ? issueCodes : []).filter(code => allowedIssues.has(code)))];
    const actualModuleId = validModuleId(moduleId) || 'UNKNOWN';
    const routeCorrection = safeVerdict === 'down' && safeIssues.includes(ISSUE_CODES.ROUTE)
      ? validModuleId(expectedModuleId)
      : '';

    const record = {
      at: new Date().toISOString(),
      moduleId: actualModuleId,
      transactionType: String(transactionType || 'general').slice(0, 40),
      verdict: safeVerdict,
      issueCodes: Object.freeze(safeIssues)
    };
    if (routeCorrection) record.expectedModuleId = routeCorrection;
    Object.freeze(record);

    const records = [record, ...readRecords()];
    const saved = writeRecords(records);
    if (saved) recordLocalFeedbackAggregate(record);
    return Object.freeze({ saved, record });
  }

  function summary() {
    const records = readRecords();
    const byModule = {};
    const issues = {};
    const routeCorrections = {};
    let up = 0;
    let down = 0;

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

    return Object.freeze({
      total: records.length,
      up,
      down,
      satisfactionRate: records.length ? Number((up / records.length * 100).toFixed(1)) : 0,
      byModule: Object.freeze({ ...byModule }),
      issues: Object.freeze({ ...issues }),
      routeCorrections: Object.freeze({ ...routeCorrections })
    });
  }

  function localFeedbackSummary() {
    const data = readLocalFeedbackAggregate();
    const total = Number(data.total || 0);
    const up = Number(data.up || 0);
    return Object.freeze({
      total,
      up,
      down: Number(data.down || 0),
      satisfactionRate: total ? Number((up / total * 100).toFixed(1)) : 0,
      byModule: Object.freeze({ ...(data.byModule || {}) }),
      issues: Object.freeze({ ...(data.issues || {}) }),
      byDay: Object.freeze(trimDays(data.byDay)),
      updatedAt: data.updatedAt || null,
      scope: 'this-device-only',
      privacy: 'Aggregate counters only. No prompt text, answer text, files, identifiers, route correction detail, or free-text feedback is persisted.'
    });
  }

  function clear() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }

  function readLocalUsage() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
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
    data.byDay = trimDays(data.byDay);
    data.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function localUsageSummary() {
    const data = readLocalUsage();
    return Object.freeze({
      total: Number(data.total || 0),
      byModule: Object.freeze({ ...(data.byModule || {}) }),
      byTransaction: Object.freeze({ ...(data.byTransaction || {}) }),
      byDay: Object.freeze(trimDays(data.byDay)),
      updatedAt: data.updatedAt || null,
      scope: 'this-device-only',
      privacy: 'Stored only in this browser. No prompt text, file content, name, email, IP, cookie, fingerprint, or user identifier is recorded.'
    });
  }

  function exportReport() {
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      privacy: 'No raw prompt, answer text, document content, name, email, IP, cookie, fingerprint, user identifier, or free-text feedback is stored.',
      usage: localUsageSummary(),
      feedbackAggregate: localFeedbackSummary(),
      currentSessionFeedback: summary()
    }, null, 2);
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

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.PILOT_FEEDBACK_ISSUES = ISSUE_CODES;
  window.GovPromptCore.PILOT_FEEDBACK_MODULES = VALID_MODULES;
  window.GovPromptCore.addPilotFeedback = addFeedback;
  window.GovPromptCore.getPilotFeedbackSummary = summary;
  window.GovPromptCore.getLocalPilotFeedbackSummary = localFeedbackSummary;
  window.GovPromptCore.exportPilotFeedbackReport = exportReport;
  window.GovPromptCore.clearPilotFeedback = clear;
  window.GovPromptCore.recordLocalUsage = recordLocalUsage;
  window.GovPromptCore.getLocalUsageSummary = localUsageSummary;
  wrapRouteTransaction();
})();