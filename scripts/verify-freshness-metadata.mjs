import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL, Date };
for (const file of [
  'assets/js/core/knowledge-metadata.js',
  'assets/js/core/source-intelligence.js',
  'assets/js/core/freshness-engine.js'
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
}

const core = sandbox.window.GovPromptCore;
const records = [
  core.createKnowledgeMetadata({
    id: 'old', documentTitle: 'แนวทางค่าใช้จ่าย', documentNumber: 'ว 100', documentDate: '2026-01-01',
    issuingAgency: 'กรมบัญชีกลาง', category: 'หนังสือเวียน', keywords: ['ค่าใช้จ่าย'],
    sourceUrl: 'https://www.cgd.go.th/example/old', sourceType: 'circular', sourceLevel: 'primary',
    effectiveDate: '2026-01-01', status: 'superseded', supersededByDocumentId: 'new',
    lastVerifiedAt: '2026-08-01T00:00:00Z'
  }),
  core.createKnowledgeMetadata({
    id: 'new', documentTitle: 'แนวทางค่าใช้จ่าย', documentNumber: 'ว 100', documentDate: '2026-07-01',
    issuingAgency: 'กรมบัญชีกลาง', category: 'หนังสือเวียน', keywords: ['ค่าใช้จ่าย'],
    sourceUrl: 'https://www.cgd.go.th/example/new', sourceType: 'circular', sourceLevel: 'primary',
    effectiveDate: '2026-07-01', status: 'current', supersedesDocumentId: 'old',
    lastVerifiedAt: '2026-08-08T00:00:00Z'
  })
];

assert.equal(core.classifySource(records[1]).sourceLevel, 'primary');
assert.equal(core.sourcePriority(records[1]).priority > 100, true);
const resolved = core.resolveFreshness(records, { asOf: new Date('2026-08-08T00:00:00Z') });
assert.equal(resolved.current.length, 1);
assert.equal(resolved.current[0].id, 'new');
assert.equal(resolved.rejected.some(item => item.record.id === 'old'), true);
assert.equal(resolved.verifiedCurrent, true);
assert.equal(resolved.warning, '');

const uncertain = core.resolveFreshness([
  core.createKnowledgeMetadata({
    id: 'unknown', documentTitle: 'ข้อมูลสรุป', issuingAgency: 'เว็บไซต์ทั่วไป', sourceUrl: 'https://example.com/info',
    category: 'article', sourceType: 'article', sourceLevel: 'secondary', status: 'unknown'
  })
]);
assert.equal(uncertain.verifiedCurrent, false);
assert.equal(uncertain.warning, 'ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง');

console.log('GovPrompt v7 metadata and freshness verification passed.');
