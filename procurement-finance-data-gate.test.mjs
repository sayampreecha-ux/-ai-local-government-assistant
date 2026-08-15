import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('./assets/js/core/privacy-submit-guard.js', import.meta.url), 'utf8');

function loadGate() {
  const window = { GovPromptCore: {} };
  const document = {
    readyState: 'loading',
    addEventListener() {},
    getElementById() { return null; }
  };
  const context = vm.createContext({
    window,
    document,
    console,
    Event: class Event {
      constructor(type, options = {}) { this.type = type; this.bubbles = Boolean(options.bubbles); }
    }
  });
  vm.runInContext(source, context, { filename: 'privacy-submit-guard.js' });
  return window.GovPromptCore.evaluateProcurementFinanceData;
}

const evaluate = loadGate();

test('public TOR / procurement announcement is ALLOW', () => {
  const result = evaluate('TOR โครงการจัดซื้อคอมพิวเตอร์ เผยแพร่แล้ว ราคากลางที่ประกาศ 1,000,000 บาท');
  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.classification, 'PUBLIC');
  assert.ok(result.riskCodes.includes('PUBLIC_PROCUREMENT_DOCUMENT'));
});

test('draft TOR with ordinary name and phone is SANITIZE', () => {
  const result = evaluate('เอกสารร่าง TOR ฉบับนี้ ผู้ประสานงาน นายสมชาย ใจดี โทร 0812345678');
  assert.equal(result.decision, 'SANITIZE');
  assert.equal(result.classification, 'INTERNAL_SANITIZABLE');
  assert.ok(result.riskCodes.includes('DRAFT_INTERNAL_DOCUMENT'));
  assert.ok(result.riskCodes.includes('PII_DETECTED'));
  assert.doesNotMatch(result.sanitizedText, /สมชาย|0812345678/);
  assert.match(result.sanitizedText, /\[ปกปิด/);
});

test('active pre-award bidder price is BLOCK', () => {
  const result = evaluate('จัดซื้อจัดจ้างอยู่ระหว่างพิจารณา ผู้ยื่นข้อเสนอ บริษัท A ราคาเสนอ 950000 บาท');
  assert.equal(result.decision, 'BLOCK');
  assert.equal(result.classification, 'RESTRICTED');
  assert.ok(result.riskCodes.includes('ACTIVE_BID_PRICE'));
  assert.equal(result.sanitizedText, '');
});

test('pre-award committee scoring is BLOCK', () => {
  const result = evaluate('ประกวดราคาอยู่ระหว่างประเมิน คะแนนกรรมการ 92 คะแนน ก่อนประกาศผู้ชนะ');
  assert.equal(result.decision, 'BLOCK');
  assert.ok(result.riskCodes.includes('PRE_AWARD_COMMITTEE_SCORE'));
});

test('aggregate budget and remaining balance is ALLOW', () => {
  const result = evaluate('งบประมาณโครงการ 2,000,000 บาท เบิกจ่าย 1,400,000 บาท คงเหลือ 600,000 บาท');
  assert.equal(result.decision, 'ALLOW');
  assert.ok(result.riskCodes.includes('AGGREGATE_BUDGET'));
});

test('bank account, personal payroll and tax data are BLOCK', async t => {
  await t.test('bank account', () => {
    const result = evaluate('การเงิน เลขบัญชี 123-4-56789-0 สำหรับโอนเงิน');
    assert.equal(result.decision, 'BLOCK');
    assert.ok(result.riskCodes.includes('BANK_ACCOUNT_DETECTED'));
  });
  await t.test('personal payroll', () => {
    const result = evaluate('เงินเดือนของ นายสมชาย ใจดี 45,000 บาท');
    assert.equal(result.decision, 'BLOCK');
    assert.ok(result.riskCodes.includes('PERSONAL_PAYROLL_OR_TAX'));
  });
  await t.test('personal tax id', () => {
    const result = evaluate('เลขประจำตัวผู้เสียภาษี: 1234567890123 ภาษีรายบุคคล');
    assert.equal(result.decision, 'BLOCK');
    assert.ok(result.riskCodes.includes('PERSONAL_PAYROLL_OR_TAX'));
  });
});

test('credential/token value is BLOCK', () => {
  const result = evaluate('API token: sk-example-secret-value');
  assert.equal(result.decision, 'BLOCK');
  assert.ok(result.riskCodes.includes('CREDENTIAL_OR_TOKEN'));
});

test('harmless public procurement control is ALLOW', () => {
  const result = evaluate('ประกาศผู้ชนะการเสนอราคาโครงการซ่อมถนน เผยแพร่ต่อสาธารณะแล้ว');
  assert.equal(result.decision, 'ALLOW');
  assert.ok(result.riskCodes.includes('PUBLIC_PROCUREMENT_DOCUMENT'));
});

test('conceptual procurement question is not mistaken for secret bid data', () => {
  const result = evaluate('ก่อนประกาศผล สามารถเปิดเผยราคาเสนอของผู้ยื่นข้อเสนอได้หรือไม่');
  assert.equal(result.decision, 'ALLOW');
  assert.ok(!result.riskCodes.includes('ACTIVE_BID_PRICE'));
});

test('government confidential and trade-secret payloads are BLOCK', async t => {
  await t.test('government confidential', () => {
    const result = evaluate('ชั้นความลับ: ลับมาก รายละเอียดโครงการภายใน');
    assert.equal(result.decision, 'BLOCK');
    assert.ok(result.riskCodes.includes('GOV_CONFIDENTIAL'));
  });
  await t.test('trade secret', () => {
    const result = evaluate('ความลับทางการค้า: สูตรต้นทุนเฉพาะของผู้เสนอราคา');
    assert.equal(result.decision, 'BLOCK');
    assert.ok(result.riskCodes.includes('TRADE_SECRET'));
  });
});
