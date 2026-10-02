import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCreativeImagePrompt,
  executeImageWorkflow,
  extractExplicitThaiText,
  recommendImageSize
} from '../assets/js/core/pr-image-workflow-v1.js';

test('builds safe retirement publicity prompt without requiring an upload', () => {
  const result = buildCreativeImagePrompt({ request: 'ทำภาพเกษียณให้สวยที่สุด อบอุ่น ภูมิฐาน' });
  assert.match(result.prompt, /ผู้ใช้จะแนบภาพใน AI ปลายทางโดยตรง/);
  assert.match(result.prompt, /รักษาใบหน้า/);
  assert.match(result.prompt, /ห้ามแต่งชื่อ ตำแหน่ง หน่วยงาน วันที่ ตัวเลข/);
  assert.equal(result.capability, 'prompt-only');
  assert.equal(result.size.width, 1080);
  assert.equal(result.size.height, 1350);
  assert.equal(result.thaiText, '');
});

test('keeps explicit Thai copy separate from visual prompt', () => {
  const request = 'ทำภาพแสดงความยินดี ข้อความ “ขอแสดงความยินดี”';
  const result = buildCreativeImagePrompt({ request });
  assert.equal(extractExplicitThaiText(request), 'ขอแสดงความยินดี');
  assert.equal(result.thaiText, 'ขอแสดงความยินดี');
});

test('recommends Facebook size from natural language', () => {
  assert.deepEqual(recommendImageSize('ทำสำหรับ Facebook'), {
    label: 'Facebook / งานประชาสัมพันธ์ทั่วไป', width: 1080, height: 1350, ratio: '4:5'
  });
});

test('workflow is always prompt-only and needs no image file or provider adapter', () => {
  const result = executeImageWorkflow({ request: 'ทำให้ดีที่สุด' });
  assert.equal(result.mode, 'prompt-only');
  assert.equal(result.bundle.capability, 'prompt-only');
  assert.match(result.bundle.prompt, /AI ที่รองรับการสร้าง\/แก้ไขภาพ/);
});
