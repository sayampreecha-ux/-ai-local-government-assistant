import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL };
for (const file of ['citation-engine.js', 'knowledge-index.js']) {
  vm.runInNewContext(await readFile(`assets/js/core/${file}`, 'utf8'), sandbox, { filename: file });
}
const core = sandbox.window.GovPromptCore;
const documents = [
  {
    id: 'finance-old', title: 'ระเบียบการเงิน', agency: 'กรมทดสอบ', category: 'finance', documentType: 'regulation',
    effectiveDate: '2024-01-01', version: '1.0', keywords: ['การเงิน', 'เบิกจ่าย'], summary: 'ฉบับเดิม',
    reference: 'กค 1/2567', sourceURL: 'https://finance.go.th/old', source: 'https://finance.go.th/old'
  },
  {
    id: 'finance-new', title: 'ระเบียบการเงิน', agency: 'กรมทดสอบ', category: 'finance', documentType: 'regulation',
    effectiveDate: '2026-01-01', version: '2.0', keywords: ['การเงิน', 'เบิกจ่าย', 'งบประมาณ'], summary: 'ฉบับใหม่',
    reference: 'กค 2/2569', sourceURL: 'https://finance.go.th/new', source: 'https://finance.go.th/new'
  },
  {
    id: 'health', title: 'แนวทางสุขภาพ', agency: 'กรมสุขภาพ', category: 'public-health', documentType: 'directive',
    effectiveDate: '2025-06-01', version: '1.0', keywords: ['สุขภาพ', 'ชุมชน'], summary: 'แนวทาง',
    reference: 'สธ 1/2568', sourceURL: 'https://health.go.th/guide', source: 'https://health.go.th/guide'
  },
  {
    id: 'unofficial', title: 'บทความการเงิน', agency: 'เอกชน', category: 'finance', documentType: 'article',
    effectiveDate: '2026-07-01', version: '1.0', keywords: ['การเงิน'], summary: 'บทความ',
    reference: 'บทความ', sourceURL: 'https://example.com/article', source: 'https://example.com/article'
  }
];

const index = core.createKnowledgeIndex(documents);
assert.equal(Object.isFrozen(index), true);
assert.equal(Object.isFrozen(index.records), true);
assert.equal(index.records.length, 4);
assert.equal(index.records[0].documentType, 'regulation');

assert.deepEqual(Array.from(index.exactSearch('ระเบียบการเงิน', { asOf: '2026-08-01' }), result => result.citation.citationId), ['finance-new', 'finance-old']);
assert.equal(index.keywordSearch('สุขภาพ', { asOf: '2026-08-01' })[0].citation.citationId, 'health');
assert.equal(index.categorySearch('finance', { asOf: '2026-08-01' }).length, 3);
assert.equal(index.agencySearch('กรมสุขภาพ', { asOf: '2026-08-01' }).length, 1);
assert.equal(index.keywordSearch(['การเงิน', 'งบประมาณ'], { asOf: '2026-08-01' })[0].citation.citationId, 'finance-new');
assert.equal(index.search({ documentType: 'directive', asOf: '2026-08-01' }).length, 1);
assert.equal(index.search({ keywords: ['การเงิน'], asOf: '2026-08-01' })[0].citation.sourceVerified, true);

const result = index.search({ query: 'ระเบียบการเงิน', asOf: '2026-08-01' })[0];
for (const field of ['title', 'summary', 'citation', 'confidence', 'source', 'effectiveDate']) {
  assert.equal(field in result, true, `missing result field ${field}`);
}
assert.equal(Object.isFrozen(result), true);

const indexScripts = '<script src="assets/js/core/knowledge-index.js"></script><script src="assets/js/core/semantic-search.js"></script>';
for (let number = 1; number <= 12; number += 1) {
  const file = `gp${String(number).padStart(3, '0')}.html`;
  const current = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');
  const baseline = execFileSync('git', ['show', `9f4bdae:${file}`], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  assert.equal(current.includes(indexScripts), true, `${file}: knowledge index missing`);
  assert.equal(current.replace(indexScripts, ''), baseline, `${file}: Sprint 4.3 output changed`);
}

console.log('Government Knowledge Index verification passed with GP001-GP012 unchanged.');
