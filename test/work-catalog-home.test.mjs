import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8');

test('home keeps exactly six primary work actions before the other-work catalog', () => {
  const primaryBlock = source.match(/const PRIMARY_ACTIONS = Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
  const labels = [...primaryBlock.matchAll(/label: '([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(labels, [
    'ร่างหนังสือ / บันทึก',
    'ทำโครงการ',
    'พัสดุ / TOR',
    'เบิกจ่าย / ค่าใช้จ่าย',
    'กฎหมาย / ระเบียบ',
    'งานบุคคล'
  ]);
  assert.match(source, /more\.textContent = 'งานอื่น ๆ'/);
});

test('other-work catalog covers core local-government domains and is searchable', () => {
  for (const title of [
    'บริหารและผู้บริหาร', 'สารบรรณและหนังสือราชการ', 'แผน โครงการ และงบประมาณ',
    'พัสดุและจัดซื้อจัดจ้าง', 'การเงิน การคลัง และเบิกจ่าย', 'งานบุคคล',
    'งานช่างและวิศวกรรม', 'สภาท้องถิ่น', 'สาธารณสุขและ รพ.สต.',
    'การศึกษา เยาวชน และการอบรม', 'ประชาสัมพันธ์และสื่อสาร', 'ตรวจสอบ ความเสี่ยง และธรรมาภิบาล'
  ]) assert.match(source, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(source, /search\.type = 'search'/);
  assert.match(source, /ค้นหางานที่ต้องการ/);
  assert.match(source, /button\.hidden = !visible/);
});

test('catalog selections reuse the guided-intake submit path instead of bypassing it', () => {
  assert.match(source, /button\.dataset\.prompt = task\.prompt/);
  assert.match(source, /input\.value = prompt/);
  assert.match(source, /form\.requestSubmit\(\)/);
  assert.doesNotMatch(source, /submitPrompt\s*\(/);
});

test('work catalog adds no persistence or network channel', () => {
  assert.doesNotMatch(source, /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/);
  assert.doesNotMatch(source, /\b(fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon)\b/);
});

test('catalog is mobile and accessibility aware', () => {
  assert.match(source, /aria-label', 'เปิดรายการงานอื่น ๆ ทั้งหมด'/);
  assert.match(source, /aria-label', 'ค้นหางานที่ต้องการ'/);
  assert.match(source, /@media\(max-width:620px\)/);
  assert.match(source, /font-size:16px/);
});
