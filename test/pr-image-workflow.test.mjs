import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCreativeImagePrompt,
  detectImageCapability,
  executeImageWorkflow,
  extractExplicitThaiText,
  recommendImageSize
} from '../assets/js/core/pr-image-workflow-v1.js';

test('builds safe retirement publicity image fallback prompt without exposing filename', () => {
  const result = buildCreativeImagePrompt({ request: 'ทำภาพเกษียณให้สวยที่สุด อบอุ่น ภูมิฐาน', fileName: 'ชื่อบุคคล-ข้อมูลส่วนตัว.jpg' });
  assert.match(result.prompt, /รักษาใบหน้า/);
  assert.match(result.prompt, /ห้ามแต่งชื่อ ตำแหน่ง หน่วยงาน วันที่ ตัวเลข/);
  assert.match(result.prompt, /ข้อความภาษาไทยจริง/);
  assert.match(result.prompt, /ภาพต้นฉบับที่ผู้ใช้แนบ/);
  assert.equal(result.prompt.includes('ชื่อบุคคล-ข้อมูลส่วนตัว.jpg'), false);
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

test('falls back when no image capability adapter is installed', async () => {
  const file = { name: 'photo.jpg' };
  const result = await executeImageWorkflow({ file, request: 'ทำให้ดีที่สุด', scope: {} });
  assert.equal(result.mode, 'fallback');
  assert.equal(result.reason, 'IMAGE_CAPABILITY_UNAVAILABLE');
});

test('routes to direct image editing when capability is available', async () => {
  const file = { name: 'photo.jpg' };
  const scope = {
    GovPromptImageCapability: {
      enabled: true,
      async editImage(payload) {
        assert.equal(payload.file, file);
        assert.match(payload.instruction, /AI Creative Assistant/);
        return { imageUrl: 'blob:generated' };
      }
    }
  };
  assert.equal(detectImageCapability(scope).canEdit, true);
  const result = await executeImageWorkflow({ file, request: 'อบอุ่นขึ้น', scope });
  assert.equal(result.mode, 'direct');
  assert.equal(result.result.imageUrl, 'blob:generated');
});
