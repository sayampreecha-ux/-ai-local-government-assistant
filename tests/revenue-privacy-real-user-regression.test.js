import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/core/privacy-submit-guard.js', import.meta.url), 'utf8');
const sandbox = {
  window: { GovPromptCore: {} },
  document: { readyState: 'loading', addEventListener() {} }
};
vm.runInNewContext(source, sandbox);
const evaluate = sandbox.window.GovPromptCore.evaluateProcurementFinanceData;

test('R07 abstract PDPA tax-map publication question without personal values remains allowed by finance gate', () => {
  const question = 'อบต.ต้องการเผยแพร่ข้อมูลแผนที่ภาษีและทะเบียนทรัพย์สินบนเว็บไซต์ โดยมีชื่อเจ้าของที่ดิน เลขบัตรประชาชน และข้อมูลสิ่งปลูกสร้าง สามารถเผยแพร่ทั้งหมดได้หรือไม่ ต้องตรวจสอบกฎหมายและ PDPA อย่างไร?';
  const result = evaluate(question);
  assert.equal(result.riskCodes.includes('PERSONAL_PAYROLL_OR_TAX'), false);
  assert.notEqual(result.decision, 'BLOCK');
});
test('real national ID with tax reference remains blocked', () => {
  const result = evaluate('ข้อมูลภาษี เลขบัตรประชาชน 1234567890123');
  assert.equal(result.decision, 'BLOCK');
});
test('real tax identifier remains blocked', () => {
  const result = evaluate('ภาษี เลขประจำตัวผู้เสียภาษี 1234567890123');
  assert.equal(result.decision, 'BLOCK');
});
test('person-linked tax amount remains blocked', () => {
  const result = evaluate('ภาษีของนายสมชาย ใจดี จำนวน 42000 บาท');
  assert.equal(result.decision, 'BLOCK');
});
test('person-level tax amount without a name remains blocked', () => {
  const result = evaluate('ภาษีรายบุคคลยอดค้าง 2400 บาท');
  assert.equal(result.decision, 'BLOCK');
});
