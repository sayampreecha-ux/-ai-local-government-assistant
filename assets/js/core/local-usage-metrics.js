(() => {
  'use strict';

  const STORAGE_KEY = 'govprompt-local-usage-v1';
  const VALID_MODULE = /^GP0(?:0[1-9]|1[0-3])$/;
  const VALID_TRANSACTION = /^[a-z0-9-]{1,40}$/;
  const MAX_DAYS = 30;

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  function write(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function trimDays(byDay) {
    return Object.fromEntries(Object.entries(byDay || {}).sort(([a], [b]) => b.localeCompare(a)).slice(0, MAX_DAYS));
  }

  function recordLocalUsage(route) {
    const moduleId = String(route?.moduleId || '').trim().toUpperCase();
    const transactionType = String(route?.transactionType || '').trim().toLowerCase();
    if (!VALID_MODULE.test(moduleId) || !VALID_TRANSACTION.test(transactionType)) return false;

    const data = read();
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
    return write(data);
  }

  function getLocalUsageSummary() {
    const data = read();
    return Object.freeze({
      total: Number(data.total || 0),
      byModule: Object.freeze({ ...(data.byModule || {}) }),
      byTransaction: Object.freeze({ ...(data.byTransaction || {}) }),
      byDay: Object.freeze(trimDays(data.byDay)),
      updatedAt: data.updatedAt || null,
      scope: 'this-device-only'
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.recordLocalUsage = recordLocalUsage;
  window.GovPromptCore.getLocalUsageSummary = getLocalUsageSummary;
})();
