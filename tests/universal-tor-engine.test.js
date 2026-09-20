import test from 'node:test';
import assert from 'node:assert/strict';

function detectTorIntent(text = '') {
  return /(?:TOR|ขอบเขตของงาน|ขอบเขตงาน|จัดทำทีโออาร์|ตรวจสอบทีโออาร์|จัดซื้อจัดจ้าง|จ้างเหมา|จัดซื้อ|งานก่อสร้าง)/i.test(String(text).trim());
}

function classify(text = '') {
  const value = String(text);
  if (/สาธารณสุข|อนามัย|ป้องกันโรค/.test(value)) return 'public-health';
  if (/กองช่าง|ก่อสร้าง|ถนน/.test(value)) return 'engineering';
  if (/กองคลัง|การเงินและบัญชี/.test(value)) return 'finance';
  return 'unconfirmed';
}

test('detects TOR requests across divisions', () => {
  assert.equal(detectTorIntent('จัดทำ TOR กองสาธารณสุข'), true);
  assert.equal(detectTorIntent('ตรวจสอบขอบเขตงานกองช่าง'), true);
  assert.equal(detectTorIntent('จัดซื้อวัสดุสำนักงานกองคลัง'), true);
});

test('classifies common divisions', () => {
  assert.equal(classify('กองสาธารณสุข'), 'public-health');
  assert.equal(classify('กองช่าง งานก่อสร้าง'), 'engineering');
  assert.equal(classify('กองคลัง การเงินและบัญชี'), 'finance');
});

test('does not classify unrelated conversation', () => {
  assert.equal(detectTorIntent('ขอคำอวยพรวันเกิด'), false);
});
