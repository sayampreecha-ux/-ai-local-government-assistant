import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL };
for (const file of ['citation-engine.js', 'knowledge-index.js', 'semantic-search.js']) {
  vm.runInNewContext(await readFile(`assets/js/core/${file}`, 'utf8'), sandbox, { filename: file });
}
const core = sandbox.window.GovPromptCore;
const documents = [
  {
    id: 'w79', title: 'หนังสือ ว79 การจัดซื้อจัดจ้าง', agency: 'กรมบัญชีกลาง', category: 'procurement', documentType: 'circular',
    effectiveDate: '2026-01-01', version: '2.0', keywords: ['ว79', 'จัดซื้อจัดจ้าง'], summary: 'แนวทางตามหนังสือ ว79',
    reference: 'ว79', sourceURL: 'https://cgd.go.th/w79', source: 'https://cgd.go.th/w79'
  },
  {
    id: 'tor', title: 'แนวทางจัดทำ Terms of Reference', agency: 'กรมบัญชีกลาง', category: 'procurement', documentType: 'directive',
    effectiveDate: '2025-01-01', version: '1.0', keywords: ['ขอบเขตของงาน'], summary: 'การจัดทำ TOR',
    reference: 'TOR-1', sourceURL: 'https://cgd.go.th/tor', source: 'https://cgd.go.th/tor'
  },
  {
    id: 'travel', title: 'หลักเกณฑ์ค่าเดินทาง', agency: 'กระทรวงการคลัง', category: 'finance', documentType: 'regulation',
    effectiveDate: '2024-01-01', version: '1.0', keywords: ['ค่าพาหนะ', 'ค่าเบี้ยเลี้ยง', 'ค่าที่พัก'], summary: 'ค่าใช้จ่ายเดินทางไปราชการ',
    reference: 'TRAVEL-1', sourceURL: 'https://mof.go.th/travel', source: 'https://mof.go.th/travel'
  },
  {
    id: 'maintenance', title: 'ระเบียบเงินบำรุง', agency: 'กระทรวงสาธารณสุข', category: 'public-health', documentType: 'regulation',
    effectiveDate: '2023-01-01', version: '1.0', keywords: ['เงินบำรุง'], summary: 'การใช้เงินบำรุง',
    reference: 'MOPH-1', sourceURL: 'https://moph.go.th/fund', source: 'https://moph.go.th/fund'
  },
  {
    id: 'pao', title: 'อำนาจองค์การบริหารส่วนจังหวัด', agency: 'กรมส่งเสริมการปกครองท้องถิ่น', category: 'laws', documentType: 'law',
    effectiveDate: '2022-01-01', version: '1.0', keywords: ['องค์การบริหารส่วนจังหวัด'], summary: 'อำนาจหน้าที่ อบจ.',
    reference: 'PAO-1', sourceURL: 'https://dla.go.th/pao', source: 'https://dla.go.th/pao'
  }
];

const index = core.createKnowledgeIndex(documents);
const semantic = core.createSemanticSearch(index);
assert.equal(Object.isFrozen(core.SYNONYM_GROUPS), true);
assert.equal(Object.isFrozen(semantic), true);
assert.equal(semantic.search('ว79', { asOf: '2026-08-01' })[0].citation.citationId, 'w79');
assert.equal(semantic.search('TOR', { asOf: '2026-08-01' })[0].citation.citationId, 'tor');
assert.equal(semantic.search('ค่าเดินทาง', { asOf: '2026-08-01' })[0].citation.citationId, 'travel');
assert.equal(semantic.search('เงินบำรุง', { asOf: '2026-08-01' })[0].citation.citationId, 'maintenance');
assert.equal(semantic.search('อบจ.', { asOf: '2026-08-01' })[0].citation.citationId, 'pao');
assert.equal(semantic.search('ค่าพาหนะ ค่าที่พัก', { asOf: '2026-08-01' })[0].citation.citationId, 'travel');
assert.equal(semantic.search('ค่าเดินทาง', { category: 'finance', asOf: '2026-08-01' }).length, 1);
assert.equal(semantic.search('ไม่พบคำนี้', { asOf: '2026-08-01' }).length, 0);
const result = semantic.search('TOR', { asOf: '2026-08-01' })[0];
assert.equal(result.semanticSimilarity > 0, true);
assert.equal(result.confidence, 'high');
assert.equal(Object.isFrozen(result), true);
assert.equal(Object.isFrozen(result.matchedTerms), true);

const semanticScript = '<script src="assets/js/core/shared-context.js"></script><script src="assets/js/core/prompt-registry.js"></script><script src="assets/js/core/transaction-router.js"></script><script src="assets/js/core/context-integration.js"></script><script src="assets/js/core/document-loader.js"></script><script src="assets/js/core/citation-engine.js"></script><script src="assets/js/core/knowledge-index.js"></script><script src="assets/js/core/semantic-search.js"></script><script src="assets/js/core/knowledge-engine.js"></script>';
for (let number = 1; number <= 13; number += 1) {
  const file = `gp${String(number).padStart(3, '0')}.html`;
  const current = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');
  const baseline = execFileSync('git', ['show', `12dc26760dd0badb283a665f3b58aa3aa976c713:${file}`], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  assert.equal(current.includes(semanticScript), true, `${file}: semantic search missing`);
  assert.equal(current.replace(semanticScript, ''), baseline, `${file}: Sprint 4.4 output changed`);
}

console.log('Semantic Knowledge Search verification passed for GP001-GP013 against origin/main baselines.');
