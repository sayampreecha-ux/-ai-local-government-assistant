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

let result = core.addPilotFeedback({ moduleId: 'GP012', transactionType: 'public-relations', verdict: 'up' });
assert.equal(result.saved, true);

result = core.addPilotFeedback({
  moduleId: 'GP003',
  transactionType: 'procurement',
  verdict: 'down',
  issueCodes: ['route', 'search', 'search', 'free-text-not-allowed']
});
assert.equal(result.saved, true);
assert.deepEqual([...result.record.issueCodes], ['route', 'search']);

const summary = core.getPilotFeedbackSummary();
assert.equal(summary.total, 2);
assert.equal(summary.up, 1);
assert.equal(summary.down, 1);
assert.equal(summary.satisfactionRate, 50);
assert.equal(summary.issues.route, 1);
assert.equal(summary.issues.search, 1);

const report = core.exportPilotFeedbackReport();
assert.match(report, /No raw prompt/);
assert.doesNotMatch(report, /เลขบัตร|คำถามจริง|promptText|freeText/i);
assert.equal(store.size, 1, 'pilot feedback should use session storage only');

core.clearPilotFeedback();
assert.equal(core.getPilotFeedbackSummary().total, 0);

console.log('GovPrompt pilot feedback verification passed: session-only, structured, no raw prompt/free text.');