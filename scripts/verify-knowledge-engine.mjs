import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL };
vm.runInNewContext(await readFile('assets/js/core/citation-engine.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/knowledge-index.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/semantic-search.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/knowledge-engine.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;

assert.deepEqual(Array.from(core.DOCUMENT_FIELDS), [
  'title', 'source', 'issuingAgency', 'effectiveDate', 'version', 'category'
]);
assert.equal(Object.isFrozen(core.DOCUMENT_FIELDS), true);

const input = {
  id: 'test-document',
  title: ' ระเบียบทดสอบ ',
  source: ' https://example.go.th/document ',
  issuingAgency: ' หน่วยงานทดสอบ ',
  effectiveDate: '2026-01-15',
  version: '2.1',
  category: 'ระเบียบ'
};
const snapshot = structuredClone(input);
const document = core.createKnowledgeDocument(input);
assert.deepEqual(input, snapshot);
assert.equal(document.title, 'ระเบียบทดสอบ');
assert.equal(document.source, 'https://example.go.th/document');
assert.equal(document.citation.citationId, 'test-document');
assert.equal(document.citation.confidenceLevel, 'high');
assert.equal(Object.isFrozen(document), true);
assert.equal(Object.isFrozen(document.citation), true);
assert.throws(() => core.createKnowledgeDocument({}), /Missing document metadata/);
assert.throws(() => core.createKnowledgeDocument({ ...input, effectiveDate: '2026-02-30' }), /valid YYYY-MM-DD/);

assert.equal(core.compareVersions('2.9', '2.10') < 0, true);
assert.equal(core.checkDocumentVersion(document, '2.1').status, 'current');
assert.equal(core.checkDocumentVersion(document, '3.0').status, 'outdated');
assert.equal(core.checkDocumentVersion(document, '1.0').status, 'ahead');
assert.equal(core.checkDocumentVersion(document, '').status, 'unknown');
assert.equal(core.validateEffectiveDate(document, '2026-01-14').status, 'not-yet-effective');
assert.equal(core.validateEffectiveDate(document, '2026-01-15').status, 'effective');
assert.equal(core.validateEffectiveDate(document, 'invalid').status, 'invalid-reference-date');

const second = { ...input, id: 'second', title: 'ประกาศทดสอบ', category: 'ประกาศ', version: '1.0' };
const engine = core.createKnowledgeEngine([input, second]);
assert.equal(Object.isFrozen(engine), true);
assert.equal(Object.isFrozen(engine.documents), true);
assert.equal(engine.getDocument('test-document'), engine.documents[0]);
assert.equal(engine.searchDocuments({ query: 'ประกาศ' }).length, 1);
assert.equal(engine.searchDocuments({ category: 'ระเบียบ' }).length, 1);
assert.equal(engine.searchDocuments({ issuingAgency: 'หน่วยงานทดสอบ' }).length, 2);
assert.equal(engine.searchDocuments({ effectiveOn: '2025-12-31' }).length, 0);
assert.equal(engine.searchKnowledge({ query: 'ประกาศทดสอบ', asOf: '2026-02-01' })[0].title, 'ประกาศทดสอบ');
assert.equal(engine.semanticSearch('ประกาศทดสอบ', { asOf: '2026-02-01' })[0].title, 'ประกาศทดสอบ');
assert.equal(engine.getCitations().length, 2);
assert.equal(Object.isFrozen(engine.getCitations()), true);
const answer = engine.createAnswer('คำตอบ', ['test-document', 'second'], { asOf: '2026-02-01' });
assert.equal(answer.citations.length, 2);
assert.equal(answer.citations.every(citation => citation.citationId && citation.officialReference && citation.effectiveDate && citation.confidenceLevel), true);
assert.equal(Object.isFrozen(answer), true);
const versionedEngine = core.createKnowledgeEngine([
  { ...input, id: 'old', reference: 'ref-1', version: '1.0' },
  { ...input, id: 'new', reference: 'ref-1', version: '2.0' }
]);
assert.throws(() => versionedEngine.getCitations(['old'], { asOf: '2026-02-01' }), /Obsolete/);
assert.equal(versionedEngine.getCitations(['new'], { asOf: '2026-02-01' })[0].citationId, 'new');
assert.equal(core.knowledgeEngine.documents.length, 0);
const repositoryEngine = core.createKnowledgeEngineFromRepository({ documents: [{ ...input, agency: input.issuingAgency, issuingAgency: undefined }] });
assert.equal(repositoryEngine.documents[0].issuingAgency, input.issuingAgency.trim());
const loadedEngine = await core.loadKnowledgeRepository({ loadRepository: async () => ({ documents: [input] }) });
assert.equal(loadedEngine.documents.length, 1);
assert.throws(() => core.createKnowledgeEngineFromRepository({}), /loaded knowledge repository/);

const engineScripts = '<script src="assets/js/core/shared-context.js"></script><script src="assets/js/core/prompt-registry.js"></script><script src="assets/js/core/transaction-router.js"></script><script src="assets/js/core/context-integration.js"></script><script src="assets/js/core/document-loader.js"></script><script src="assets/js/core/citation-engine.js"></script><script src="assets/js/core/knowledge-index.js"></script><script src="assets/js/core/semantic-search.js"></script><script src="assets/js/core/knowledge-engine.js"></script>';
for (let index = 1; index <= 13; index += 1) {
  const file = `gp${String(index).padStart(3, '0')}.html`;
  const current = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');
  const baseline = execFileSync('git', ['show', `origin/main:${file}`], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  assert.equal(current.includes(engineScripts), true, `${file}: Knowledge Engine missing`);
  assert.equal(current.replace(engineScripts, ''), baseline, `${file}: Sprint 3.4 output behavior changed`);
}

console.log('Knowledge Engine verification passed for GP001-GP013 against origin/main baselines.');
