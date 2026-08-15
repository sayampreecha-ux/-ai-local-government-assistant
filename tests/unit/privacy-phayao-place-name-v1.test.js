import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function loadPrivacyGuard() {
  const source = await readFile('assets/js/core/privacy-guard.js', 'utf8');
  const window = {
    GovPromptCore: {},
    GovPrompt: { toast() {} }
  };
  const document = {
    readyState: 'complete',
    querySelector() { return null; },
    addEventListener() {}
  };
  vm.runInNewContext(source, { window, document, URL, console }, { filename: 'privacy-guard.js' });
  return window.GovPromptCore;
}

test('Thai place names ending with ยา are not misclassified as medication/health data', async () => {
  const core = await loadPrivacyGuard();
  for (const value of [
    'ทำร่างงบปี 70 อบจ.พะเยา',
    'วิเคราะห์งบประมาณเมืองพัทยา ปี 2570',
    'ตรวจแผนพัฒนาจังหวัดพระนครศรีอยุธยา'
  ]) {
    const result = core.sanitizeExternalContent(value);
    assert.equal(result.blocked, false, value);
    assert.deepEqual(Array.from(result.sensitiveContext), [], value);
    assert.equal(result.safeText, value, value);
  }
});

test('explicit medication and health contexts remain blocked', async () => {
  const core = await loadPrivacyGuard();
  for (const value of [
    'ผู้ป่วยใช้ยา amoxicillin',
    'ยาประจำ insulin',
    'ชื่อยา aspirin',
    'อาการป่วยและผลเลือด'
  ]) {
    const result = core.sanitizeExternalContent(value);
    assert.equal(result.blocked, true, value);
    assert.ok(Array.from(result.sensitiveContext).includes('ข้อมูลสุขภาพ/ความพิการ'), value);
  }
});

test('standalone medication token remains sensitive while substring inside a place name is safe', async () => {
  const core = await loadPrivacyGuard();
  assert.equal(core.detectSensitiveContext('ยา').includes('ข้อมูลสุขภาพ/ความพิการ'), true);
  assert.equal(core.detectSensitiveContext('พะเยา').includes('ข้อมูลสุขภาพ/ความพิการ'), false);
  assert.equal(core.detectSensitiveContext('พัทยา').includes('ข้อมูลสุขภาพ/ความพิการ'), false);
});
