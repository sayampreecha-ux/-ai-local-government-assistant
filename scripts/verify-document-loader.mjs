import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import vm from 'node:vm';

const categories = [
  'laws', 'regulations', 'directives', 'circulars', 'legal-opinions', 'procurement',
  'finance', 'personnel', 'engineering', 'public-health', 'council', 'planning'
];
for (const category of categories) await access(`knowledge/${category}`);
const index = JSON.parse(await readFile('knowledge/index.json', 'utf8'));
assert.equal(index.schemaVersion, '1.0');
assert.deepEqual(index.documents, []);

const sandbox = { window: {}, URL };
vm.runInNewContext(await readFile('assets/js/core/document-loader.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;
assert.deepEqual(Array.from(core.REPOSITORY_DOCUMENT_FIELDS), [
  'id', 'title', 'agency', 'category', 'effectiveDate', 'version',
  'keywords', 'summary', 'source', 'content'
]);

const valid = {
  id: 'regulation-test',
  title: ' ระเบียบทดสอบ ',
  agency: ' หน่วยงานทดสอบ ',
  category: 'regulations',
  effectiveDate: '2026-01-01',
  version: '1.0',
  keywords: [' ระเบียบ ', 'ท้องถิ่น', 'ระเบียบ'],
  summary: ' สรุป ',
  source: 'https://example.go.th/regulation',
  content: ' เนื้อหา '
};
const document = core.createRepositoryDocument(valid);
assert.equal(document.title, 'ระเบียบทดสอบ');
assert.deepEqual(Array.from(document.keywords), ['ระเบียบ', 'ท้องถิ่น']);
assert.equal(document.reference, valid.source);
assert.equal(document.sourceURL, valid.source);
assert.equal(Object.isFrozen(document), true);
assert.equal(Object.isFrozen(document.keywords), true);
assert.throws(() => core.createRepositoryDocument({}), /missing/);
assert.throws(() => core.createRepositoryDocument({ ...valid, effectiveDate: '2026-13-01' }), /effectiveDate/);

const fixtures = {
  'http://local/knowledge/index.json': { schemaVersion: '1.0', documents: ['regulations/test.json'] },
  'http://local/knowledge/regulations/test.json': valid
};
const loader = core.createDocumentLoader({
  indexUrl: 'http://local/knowledge/index.json',
  fetcher: async url => fixtures[url]
});
const repository = await loader.loadRepository();
assert.equal(repository.documents.length, 1);
assert.equal(repository.metadata.length, 1);
assert.equal('content' in repository.metadata[0], false);
assert.equal(loader.getDocument('regulation-test'), repository.documents[0]);
assert.equal(loader.getMetadata('regulation-test'), repository.metadata[0]);
assert.equal(Object.isFrozen(repository), true);
assert.equal(Object.isFrozen(repository.metadata), true);

await assert.rejects(
  core.createDocumentLoader({ fetcher: async () => ({ documents: [{ ...valid, id: 'same' }, { ...valid, id: 'same' }] }) }).loadRepository(),
  /Duplicate/
);
await assert.rejects(
  core.createDocumentLoader({ fetcher: async () => ({ documents: [{}] }) }).loadRepository(),
  /Invalid knowledge document/
);

const loaderScripts = '<script src="assets/js/core/document-loader.js"></script><script src="assets/js/core/citation-engine.js"></script>';
for (let index = 1; index <= 12; index += 1) {
  const file = `gp${String(index).padStart(3, '0')}.html`;
  const current = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');
  const baseline = execFileSync('git', ['show', `bdce7a5:${file}`], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  assert.equal(current.includes(loaderScripts), true, `${file}: document loader missing`);
  assert.equal(current.replace(loaderScripts, ''), baseline, `${file}: Sprint 4.1 output changed`);
}

console.log('Government Knowledge Repository document loader verification passed.');
