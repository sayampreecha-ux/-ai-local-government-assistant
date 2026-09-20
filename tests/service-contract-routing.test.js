import test from 'node:test';
import assert from 'node:assert/strict';

function detectServiceContractIntent(text = '') {
  return [
    /จ้างเหมาบริการ/,
    /จ้างเหมา(?!ก่อสร้าง)/,
    /ผู้รับจ้างบริการ/,
    /ค่าจ้างเหมาบริการ/,
    /ตรวจรับ.{0,30}(?:จ้างเหมา|บริการ)/u,
    /บันทึกขออนุมัติ.{0,40}(?:จ้าง|บริการ)/u,
    /TOR.{0,40}(?:จ้างเหมา|บริการ)/iu
  ].some(pattern => pattern.test(String(text).trim()));
}

test('detects service-contract requests', () => {
  assert.equal(detectServiceContractIntent('ช่วยจัดทำ TOR จ้างเหมาบริการ'), true);
  assert.equal(detectServiceContractIntent('ตรวจรับงานจ้างเหมาบริการรายเดือน'), true);
});

test('does not classify unrelated procurement requests', () => {
  assert.equal(detectServiceContractIntent('จัดซื้อคอมพิวเตอร์'), false);
  assert.equal(detectServiceContractIntent('ก่อสร้างถนน'), false);
});
