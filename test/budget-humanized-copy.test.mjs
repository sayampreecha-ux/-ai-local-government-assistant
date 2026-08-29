import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const statusCopy = readFileSync(new URL('../assets/js/ui/status-copy.js', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

test('budget evidence keys have plain Thai labels', () => {
  const expected = new Map([
    ['currentBudgetRule', 'หลักเกณฑ์งบประมาณฉบับปัจจุบัน'],
    ['baselineBudgetSource', 'แหล่งข้อมูลงบประมาณปีเดิม'],
    ['latestRevenueActualsSource', 'แหล่งข้อมูลรายรับจริงล่าสุด'],
    ['targetYearPlanSource', 'แหล่งข้อมูลแผนพัฒนาปีเป้าหมาย'],
    ['baselineBudget', 'ข้อมูลงบประมาณปีเดิม'],
    ['latestRevenueActuals', 'รายรับจริงล่าสุด'],
    ['targetYearPlan', 'แผนพัฒนาปีเป้าหมาย'],
    ['personnelObligations', 'ภาระบุคลากรและภาระผูกพัน'],
    ['budgetTotals', 'ยอดรวมรายรับและรายจ่าย']
  ]);
  for (const [key, label] of expected) {
    assert.match(statusCopy, new RegExp(`${key}:?\\s*['\"]${label}`));
  }
});

test('workflow and agent technical names are humanized', () => {
  assert.match(statusCopy, /'gov\.budget-draft': 'งานร่างงบประมาณ'/);
  assert.match(statusCopy, /'gov\.finance': 'งานการเงินและการคลัง'/);
  assert.match(statusCopy, /'Budget Draft Agent': 'ผู้ช่วยจัดทำร่างงบประมาณ'/);
  assert.match(statusCopy, /'Working Draft': 'ร่างทำงาน'/);
});

test('status-copy is idempotent and deduplicates repeated fallback evidence copy', () => {
  assert.match(statusCopy, /__GOVPROMPT_STATUS_COPY_V14__/);
  assert.match(statusCopy, /ข้อมูล\/หลักฐานเพิ่มเติมที่ต้องใช้ในขั้นตอนนี้/);
  assert.match(statusCopy, /new Set\(parts\)/);
});

test('service worker fetches status-copy network fresh', () => {
  assert.match(serviceWorker, /APP_VERSION = '\d+\.\d+'/);
  assert.match(serviceWorker, /\/assets\/js\/ui\/status-copy\.js/);
  assert.match(serviceWorker, /cache: 'no-store'/);
});
