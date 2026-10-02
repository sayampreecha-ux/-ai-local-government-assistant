import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadApi() {
  const source = await readFile('assets/js/features/temp-staff-maintenance-fund-v1.js', 'utf8');
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { api: context.window.GovPromptTempStaffPlan, source };
}

test('temporary maintenance-fund staff planner calculates workload, FTE and budget without hardcoded FTE hours', async () => {
  const { api } = await loadApi();
  assert.ok(api);
  const hours = api.sumWorkloadHours([
    { quantity: 100, minutes: 30 },
    { quantity: 20, minutes: 60 }
  ]);
  assert.equal(hours, 70);
  assert.equal(api.fteRequired(hours, 1400), 0.05);
  assert.equal(api.fteRequired(hours, ''), null);
  assert.equal(api.fteGap(1.75, 1), 0.75);
  assert.equal(api.suggestedHeadcount(0.75), 1);
  assert.equal(api.annualBudget({ rate: 15000, headcount: 2, units: 12 }), 360000);
});

test('planner exposes all public-health staff groups and a safe official-work prompt', async () => {
  const { api, source } = await loadApi();
  assert.equal(api.positions.length, 29);
  assert.ok(api.positions.includes('พยาบาลวิชาชีพ'));
  assert.ok(api.positions.includes('พนักงานบริการ/ทำความสะอาด'));
  assert.match(source, /แผนลูกจ้างเงินบำรุง/);
  assert.match(source, /รายเดือน/);
  assert.match(source, /รายวัน/);
  assert.match(source, /รายคาบ/);

  const prompt = api.buildPrompt({
    agency: 'รพ.สต.ตัวอย่าง',
    position: 'พยาบาลวิชาชีพ',
    actualFte: '1',
    netHoursPerFte: '1400',
    workloadRows: [{ activity: 'เยี่ยมบ้าน', unit: 'ครั้ง', quantity: '100', minutes: '30' }],
    workloadHours: 50,
    requiredFte: 0.04,
    gapFte: -0.96,
    suggestedHeadcount: 0,
    employmentType: 'รายเดือน',
    proposedHeadcount: '0',
    rate: '',
    units: '',
    annualBudget: null,
    inSpendingPlan: false,
    alternatives: []
  });
  assert.match(prompt, /Workload/);
  assert.match(prompt, /FTE/);
  assert.match(prompt, /ตรวจหลักเกณฑ์กระทรวงสาธารณสุข/);
  assert.match(prompt, /ห้ามสมมติชั่วโมง FTE อัตราค่าจ้าง/);
  assert.match(prompt, /PDPA/);
});

test('GP008 does not auto-load the temp-staff planner; the standalone wizard remains the single entry point', async () => {
  const integration = await readFile('assets/js/core/context-integration.js', 'utf8');
  const gp008 = await readFile('gp008.html', 'utf8');
  const wizard = await readFile('temp-staff-wizard.html', 'utf8');
  const guided = await readFile('assets/js/features/temp-staff-guided-workflow-v2.js', 'utf8');

  assert.doesNotMatch(integration, /tempStaffMaintenanceFundFeatureScript|tempStaffMaintenanceFundExportScript|GovPromptTempStaffPlan/);
  assert.match(integration, /isPublicHealthPage/);
  assert.doesNotMatch(gp008, /tempStaffMaintenanceFundEntry|>👥 แผนลูกจ้างเงินบำรุง</);
  assert.doesNotMatch(gp008, /temp-staff-maintenance-fund-v1|temp-staff-export-fallback-v1|temp-staff-guided-workflow-v2/);
  assert.match(wizard, /temp-staff-guided-wizard-v1\.js\?v=1\.0\.0/);

  assert.match(guided, /STEP_LABELS/);
  assert.match(guided, /หน่วยบริการ/);
  assert.match(guided, /Workload \/ FTE/);
  assert.match(guided, /เหตุผลและทางเลือก/);
  assert.match(guided, /วงเงินและเงินบำรุง/);
  assert.match(guided, /ตรวจและสร้างเอกสาร/);
  assert.doesNotMatch(guided, /const\s+netHours\s*=\s*1400/);
});