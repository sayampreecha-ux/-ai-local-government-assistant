import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8');

test('home shows all twelve categories in frequent-use order without another-work opener', () => {
  const orderBlock = source.match(/const CATALOG_ORDER = Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
  const ids = [...orderBlock.matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(ids, [
    'pr', 'records', 'audit', 'finance', 'planning', 'procurement',
    'hr', 'executive', 'engineering', 'health', 'education', 'council'
  ]);
  assert.match(source, /12 หมวดงาน เรียงจากงานที่ใช้บ่อย/);
  assert.match(source, /quickActions\.replaceChildren\(buildCatalog\(\)\)/);
  assert.doesNotMatch(source, /data-work-catalog-open|งานอื่น ๆ/);
});

test('one-page catalog covers core local-government domains', () => {
  for (const title of [
    'บริหารและผู้บริหาร', 'สารบรรณและหนังสือราชการ', 'แผน โครงการ และงบประมาณ',
    'พัสดุและจัดซื้อจัดจ้าง', 'การเงิน การคลัง และเบิกจ่าย', 'งานบุคคล',
    'งานช่างและวิศวกรรม', 'สภาท้องถิ่น', 'สาธารณสุขและ รพ.สต.',
    'การศึกษา เยาวชน และการอบรม', 'ประชาสัมพันธ์และสื่อสาร', 'กฎหมาย ระเบียบ และตรวจสอบ'
  ]) assert.match(source, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(source, /ค้นและวิเคราะห์กฎหมาย \/ ระเบียบ/);
  assert.match(source, /section\.dataset\.categoryId = category\.id/);
});

test('catalog selections open the dedicated result route without bypassing the Home runner', () => {
  assert.match(source, /button\.dataset\.prompt = task\.prompt/);
  assert.match(source, /openResultPage\(prompt\)/);
  assert.match(source, /sessionStorage\.setItem\(RESULT_PROMPT_KEY, value\)/);
  assert.match(source, /window\.location\.assign\(target\.toString\(\)\)/);
  assert.doesNotMatch(source, /submitPrompt\s*\(/);
});

test('work catalog adds no durable persistence or network channel', () => {
  assert.doesNotMatch(source, /\b(localStorage|indexedDB|document\.cookie)\b/);
  assert.doesNotMatch(source, /\b(fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon)\b/);
});

test('catalog is mobile and accessibility aware', () => {
  assert.match(source, /button\.type = 'button'/);
  assert.match(source, /@media\(max-width:620px\)/);
  assert.match(source, /work-catalog-heading/);
});
