import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sessionStore = new Map();
const localStore = new Map();
const makeStorage = store => ({
  getItem: key => store.has(key) ? store.get(key) : null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: key => store.delete(key)
});
const sandbox = {
  window: {},
  sessionStorage: makeStorage(sessionStore),
  localStorage: makeStorage(localStore),
  Date,
  JSON
};

vm.runInNewContext(await readFile('assets/js/core/pilot-feedback.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;

assert.equal(typeof core.addPilotFeedback, 'function');
assert.equal(typeof core.getPilotFeedbackSummary, 'function');
assert.equal(typeof core.getLocalPilotFeedbackSummary, 'function');
assert.equal(typeof core.exportPilotFeedbackReport, 'function');
assert.equal(core.PILOT_FEEDBACK_MODULES.length, 13);
assert.equal(core.PILOT_FEEDBACK_MODULES[0], 'GP001');
assert.equal(core.PILOT_FEEDBACK_MODULES.at(-1), 'GP013');
assert.equal(core.PILOT_FEEDBACK_ISSUES.PRIVACY, 'privacy');

let result = core.addPilotFeedback({ moduleId: 'GP012', transactionType: 'public-relations', verdict: 'up' });
assert.equal(result.saved, true);
assert.equal('expectedModuleId' in result.record, false, 'up vote must not carry route correction');

result = core.addPilotFeedback({
  moduleId: 'GP008',
  transactionType: 'general',
  verdict: 'down',
  issueCodes: ['route', 'search', 'search', 'free-text-not-allowed'],
  expectedModuleId: 'GP009'
});
assert.equal(result.saved, true);
assert.deepEqual([...result.record.issueCodes], ['route', 'search']);
assert.equal(result.record.expectedModuleId, 'GP009');

const invalidCorrection = core.addPilotFeedback({
  moduleId: 'GP003',
  transactionType: 'procurement',
  verdict: 'down',
  issueCodes: ['route'],
  expectedModuleId: 'GP999'
});
assert.equal(invalidCorrection.saved, true);
assert.equal('expectedModuleId' in invalidCorrection.record, false, 'invalid GP code must not be stored');

const nonRouteCorrection = core.addPilotFeedback({
  moduleId: 'GP005',
  transactionType: 'finance',
  verdict: 'down',
  issueCodes: ['answer'],
  expectedModuleId: 'GP004'
});
assert.equal(nonRouteCorrection.saved, true);
assert.equal('expectedModuleId' in nonRouteCorrection.record, false, 'correction is only valid for route issues');

const privacyFeedback = core.addPilotFeedback({
  moduleId: 'GP010',
  transactionType: 'internal-audit',
  verdict: 'down',
  issueCodes: ['privacy']
});
assert.equal(privacyFeedback.saved, true);
assert.deepEqual([...privacyFeedback.record.issueCodes], ['privacy']);

const summary = core.getPilotFeedbackSummary();
assert.equal(summary.total, 5);
assert.equal(summary.up, 1);
assert.equal(summary.down, 4);
assert.equal(summary.satisfactionRate, 20);
assert.equal(summary.issues.route, 2);
assert.equal(summary.issues.search, 1);
assert.equal(summary.issues.answer, 1);
assert.equal(summary.issues.privacy, 1);
assert.equal(summary.routeCorrections['GP008→GP009'], 1);
assert.equal(Object.keys(summary.routeCorrections).length, 1);

const aggregate = core.getLocalPilotFeedbackSummary();
assert.equal(aggregate.total, 5);
assert.equal(aggregate.up, 1);
assert.equal(aggregate.down, 4);
assert.equal(aggregate.satisfactionRate, 20);
assert.equal(aggregate.issues.privacy, 1);
assert.equal(aggregate.byModule.GP008, 1);
assert.match(aggregate.scope, /this-device-only/);

const persistedAggregate = [...localStore.values()].join('\n');
assert.doesNotMatch(persistedAggregate, /GP008→GP009|เลขบัตร|คำถามจริง|promptText|freeText|answerText/i, 'persistent aggregate must contain counters only');

const report = core.exportPilotFeedbackReport();
assert.match(report, /No raw prompt/);
assert.doesNotMatch(report, /GP008→GP009|เลขบัตร|คำถามจริง|promptText|freeText|answerText/i, 'export must not expose per-session route-correction detail or raw content');
assert.equal(sessionStore.size, 1, 'detailed feedback must remain session-only');
assert.equal(localStore.size, 1, 'only aggregate feedback counters should persist locally');

core.clearPilotFeedback();
assert.equal(core.getPilotFeedbackSummary().total, 0);
assert.equal(core.getLocalPilotFeedbackSummary().total, 5, 'clearing session detail must not erase aggregate counters');

console.log('GovPrompt pilot feedback verification passed: privacy-safe session detail + persistent aggregate counters, no raw prompt/answer/free text or identifiers.');