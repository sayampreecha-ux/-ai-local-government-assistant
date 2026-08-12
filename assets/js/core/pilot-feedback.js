(() => {
  'use strict';

  const STORAGE_KEY = 'govprompt-pilot-feedback-v1';
  const MAX_RECORDS = 100;
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

  function addFeedback({ moduleId, transactionType, verdict, issueCodes = [] } = {}) {
    const safeVerdict = verdict === 'up' ? 'up' : verdict === 'down' ? 'down' : '';
    if (!safeVerdict) return Object.freeze({ saved: false, reason: 'INVALID_VERDICT' });

    const allowedIssues = new Set(Object.values(ISSUE_CODES));
    const safeIssues = [...new Set((Array.isArray(issueCodes) ? issueCodes : []).filter(code => allowedIssues.has(code)))];
    const record = Object.freeze({
      at: new Date().toISOString(),
      moduleId: /^GP\d{3}$/.test(String(moduleId || '')) ? String(moduleId) : 'UNKNOWN',
      transactionType: String(transactionType || 'general').slice(0, 40),
      verdict: safeVerdict,
      issueCodes: Object.freeze(safeIssues)
    });

    const records = [record, ...readRecords()];
    return Object.freeze({ saved: writeRecords(records), record });
  }

  function summary() {
    const records = readRecords();
    const byModule = {};
    const issues = {};
    let up = 0;
    let down = 0;

    records.forEach(record => {
      if (record.verdict === 'up') up += 1;
      if (record.verdict === 'down') down += 1;
      byModule[record.moduleId] = (byModule[record.moduleId] || 0) + 1;
      (record.issueCodes || []).forEach(code => { issues[code] = (issues[code] || 0) + 1; });
    });

    return Object.freeze({
      total: records.length,
      up,
      down,
      satisfactionRate: records.length ? Number((up / records.length * 100).toFixed(1)) : 0,
      byModule: Object.freeze({ ...byModule }),
      issues: Object.freeze({ ...issues })
    });
  }

  function exportReport() {
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      privacy: 'No raw prompt, document content, name, email, IP, or free-text feedback is stored.',
      summary: summary(),
      records: readRecords()
    }, null, 2);
  }

  function clear() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.PILOT_FEEDBACK_ISSUES = ISSUE_CODES;
  window.GovPromptCore.addPilotFeedback = addFeedback;
  window.GovPromptCore.getPilotFeedbackSummary = summary;
  window.GovPromptCore.exportPilotFeedbackReport = exportReport;
  window.GovPromptCore.clearPilotFeedback = clear;
})();