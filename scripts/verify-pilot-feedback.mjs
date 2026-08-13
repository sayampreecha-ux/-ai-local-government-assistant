import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const store = new Map();
const sandbox = {
  window: {},
  sessionStorage: {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key)
  },
  Date,
  JSON
};

vm.runInNewContext(await readFile('assets/js/core/pilot-feedback.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;

assert.equal(typeof core.addPilotFeedback, 'function');
assert.equal(typeof core.getPilotFeedbackSummary, 'function');
assert.equal(typeof core.exportPilotFeedbackReport, 'function');
assert.equal(core.PILOT_FEEDBACK_MODULES.length, 13);
assert.equal(core.PILOT_FEEDBACK_MODULES[0], 'GP001');
assert.equal(core.PILOT_FEEDBACK_MODULES.at(-1), 'GP013');

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

const summary = core.getPilotFeedbackSummary();
assert.equal(summary.total, 4);
assert.equal(summary.up, 1);
assert.equal(summary.down, 3);
assert.equal(summary.satisfactionRate, 25);
assert.equal(summary.issues.route, 2);
assert.equal(summary.issues.search, 1);
assert.equal(summary.issues.answer, 1);
assert.equal(summary.routeCorrections['GP008→GP009'], 1);
assert.equal(Object.keys(summary.routeCorrections).length, 1);

const report = core.exportPilotFeedbackReport();
assert.match(report, /No raw prompt/);
assert.match(report, /GP008→GP009/);
assert.doesNotMatch(report, /เลขบัตร|คำถามจริง|promptText|freeText/i);
assert.equal(store.size, 1, 'pilot feedback should use session storage only');

core.clearPilotFeedback();
assert.equal(core.getPilotFeedbackSummary().total, 0);

console.log('GovPrompt pilot feedback verification passed: session-only structured feedback + GP001-GP013 route corrections, no raw prompt/free text.');