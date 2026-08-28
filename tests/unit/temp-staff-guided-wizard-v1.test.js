import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadApi() {
  const source = await readFile('assets/js/features/temp-staff-guided-wizard-v1.js', 'utf8');
  class Observer { observe() {} disconnect() {} }
  const context = {
    window: { GovPromptTempStaffPlan: { positions: ['พยาบาลวิชาชีพ'] } },
    document: { getElementById: () => null, documentElement: {} },
    MutationObserver: Observer,
    setTimeout: () => {},
    console,
    Intl,
    Number,
    Math,
    Object,
    String,
    Array,
    Boolean
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { api: context.window.GovPromptTempStaffWizard, source };
}

test('guided wizard calculates workload, FTE gap and budget without inventing FTE basis', async () => {
  const { api } = await loadApi();
  const incomplete = api.calculate({ workloadRows: [{ activity: 'เยี่ยมบ้าน', quantity: 100, minutes: 30 }], actualFte: 1 });
  assert.equal(incomplete.workloadHours, 50);
  assert.equal(incomplete.requiredFte, null);

  const result = api.calculate({
    workloadRows: [{ activity: 'เยี่ยมบ้าน', quantity: 1000, minutes: 60 }],
    netHoursPerFte: 1000,
    actualFte: 0.5,
    rate: 10000,
    proposedHeadcount: 1,
    units: 12,
    fundBalance: 300000,
    avgIncome: 100000,
    essentialExpense: 120000
  });
  assert.equal(result.workloadHours, 1000);
  assert.equal(result.requiredFte, 1);
  assert.equal(result.gapFte, 0.5);
  assert.equal(result.suggestedHeadcount, 1);
  assert.equal(result.annualBudget, 120000);
  assert.equal(result.postBudgetBalance, 180000);
  assert.equal(result.projectedBalance, 160000);
});

test('guided wizard never treats its result as approval and generates both analysis and memo', async () => {
  const { api, source } = await loadApi();
  const input = {
    agency: 'รพ.สต.ตัวอย่าง', fiscalYear: '2570', population: '5000', annualServices: '12000', position: 'พยาบาลวิชาชีพ',
    workloadRows: [{ activity: 'บริการผู้ป่วย', unit: 'ครั้ง', quantity: '2000', minutes: '30' }],
    netHoursPerFte: '1000', actualFte: '0.5', redistribute: 'ไม่ได้/ไม่เพียงพอ', cluster: 'ไม่ได้', technology: 'ได้บางส่วน', outsource: 'ไม่เหมาะสม',
    employmentType: 'รายเดือน', proposedHeadcount: '1', rate: '10000', units: '12', fundBalance: '300000', avgIncome: '100000', essentialExpense: '120000', inSpendingPlan: true
  };
  const docs = api.buildDocuments(input);
  assert.match(docs.analysis, /สรุปวิเคราะห์ค่างาน/);
  assert.match(docs.memo, /บันทึกข้อความ/);
  assert.match(docs.memo, /ขอพิจารณาความเห็นชอบ/);
  assert.doesNotMatch(docs.decision.label, /อนุมัติแล้ว|อนุมัติให้จ้าง/);
  assert.match(source, /ไม่ใช่คำสั่งให้จ้าง/);
  assert.match(source, /ต้องตรวจหลักเกณฑ์/);
  assert.match(source, /ดาวน์โหลด Word/);
});
