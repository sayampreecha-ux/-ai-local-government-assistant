import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const statusCopy = readFileSync(new URL('./assets/js/ui/status-copy.js', import.meta.url), 'utf8');

test('document formatting handoff is visible without adding a new menu', () => {
  assert.match(statusCopy, /จัดหน้าเอกสาร/);
  assert.match(statusCopy, /PDF\/Word\/PPTX/);
  assert.match(statusCopy, /สาระสำคัญ.*มติ.*ผู้รับผิดชอบ.*กำหนดส่ง/s);
  assert.match(statusCopy, /3–4 ประเด็นต่อสไลด์/);
});

test('document formatting stays evidence-first and does not overclaim export', () => {
  assert.match(statusCopy, /อ่านไฟล์ที่แนบก่อน/);
  assert.match(statusCopy, /ห้ามแต่งเติมข้อเท็จจริง/);
  assert.match(statusCopy, /ห้ามอ้างว่าส่งออกไฟล์แล้ว/);
});
