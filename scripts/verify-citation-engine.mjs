import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL };
vm.runInNewContext(await readFile('assets/js/core/citation-engine.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;

const base = {
  id: 'law-v1',
  title: 'กฎหมายทดสอบ',
  agency: 'หน่วยงานทดสอบ',
  effectiveDate: '2025-01-01',
  version: '1.0',
  reference: 'เลขอ้างอิง 1/2568',
  sourceURL: 'https://example.go.th/law-v1'
};
const newer = { ...base, id: 'law-v2', version: '2.0', effectiveDate: '2026-01-01', sourceURL: 'https://example.go.th/law-v2' };
const other = { ...base, id: 'directive-v1', title: 'คำสั่งทดสอบ', reference: 'คำสั่ง 2/2568' };

assert.equal(core.verifySource(base).verified, true);
assert.equal(core.verifySource({ ...base, sourceURL: 'http://example.go.th/law' }).verified, false);
assert.equal(core.verifySource({ ...base, sourceURL: 'https://example.com/law' }).verified, false);
assert.throws(() => core.createCitation({ ...base, sourceURL: 'https://example.com/law' }), /Unverified/);

const citation = core.createCitation(base);
assert.equal(citation.citationId, 'law-v1');
assert.equal(citation.officialReference, 'เลขอ้างอิง 1/2568');
assert.equal(citation.effectiveDate, '2025-01-01');
assert.equal(citation.confidenceLevel, 'high');
assert.equal(citation.sourceVerified, true);
assert.equal(Object.isFrozen(citation), true);

const selected = core.selectNewestEffectiveVersions([base, newer, other], '2026-02-01');
assert.deepEqual(Array.from(selected, document => document.id), ['law-v2', 'directive-v1']);
assert.throws(() => core.rejectObsoleteVersion(base, [base, newer], '2026-02-01'), /Obsolete/);
assert.equal(core.rejectObsoleteVersion(newer, [base, newer], '2026-02-01'), newer);
assert.throws(() => core.rejectObsoleteVersion(newer, [newer], '2025-12-31'), /not effective/);

const citations = core.createCitations([base, newer, other], { asOf: '2026-02-01', confidenceLevel: 'medium' });
assert.equal(citations.length, 2);
assert.equal(citations[0].citationId, 'law-v2');
assert.equal(citations[0].confidenceLevel, 'medium');
assert.equal(Object.isFrozen(citations), true);

const citationScripts = '<script src="assets/js/core/shared-context.js"></script><script src="assets/js/core/prompt-registry.js"></script><script src="assets/js/core/transaction-router.js"></script><script src="assets/js/core/context-integration.js"></script><script src="assets/js/core/document-loader.js"></script><script src="assets/js/core/citation-engine.js"></script><script src="assets/js/core/knowledge-index.js"></script><script src="assets/js/core/semantic-search.js"></script><script src="assets/js/core/knowledge-engine.js"></script>';
for (let index = 1; index <= 13; index += 1) {
  const file = `gp${String(index).padStart(3, '0')}.html`;
  const current = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');
  const baseline = execFileSync('git', ['show', `origin/main:${file}`], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  assert.equal(current.includes(citationScripts), true, `${file}: citation engine missing`);
  assert.equal(current.replace(citationScripts, ''), baseline, `${file}: Sprint 4.2 output changed`);
}

console.log('Citation & Source Engine verification passed for GP001-GP013 against origin/main baselines.');
