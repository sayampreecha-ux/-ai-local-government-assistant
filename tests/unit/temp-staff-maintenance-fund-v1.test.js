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

test('GP008 loader includes maintenance-fund staff planner and safe in-browser exports', async () => {
  const integration = await readFile('assets/js/core/context-integration.js', 'utf8');
  const exportFallback = await readFile('assets/js/features/temp-staff-export-fallback-v1.js', 'utf8');
  assert.match(integration, /temp-staff-maintenance-fund-v1\.js\?v=1\.0\.0/);
  assert.match(integration, /temp-staff-export-fallback-v1\.js\?v=1\.0\.0/);
  assert.match(integration, /GovPromptTempStaffPlan/);
  assert.match(integration, /isPublicHealthPage/);
  assert.match(exportFallback, /event\.preventDefault\(\)/);
  assert.match(exportFallback, /application\/msword/);
  assert.match(exportFallback, /text\/csv/);
  assert.match(exportFallback, /ต้องตรวจหลักเกณฑ์/);
});

test('GP008 exposes a visible maintenance-fund staff planner entry and loads feature scripts directly', async () => {
  const gp008 = await readFile('gp008.html', 'utf8');
  assert.match(gp008, /id=["']tempStaffMaintenanceFundEntry["']/);
  assert.match(gp008, />👥 แผนลูกจ้างเงินบำรุง</);
  assert.match(gp008, /temp-staff-maintenance-fund-v1\.js\?v=1\.0\.1/);
  assert.match(gp008, /temp-staff-export-fallback-v1\.js\?v=1\.0\.1/);
  assert.match(gp008, /tempStaffMaintenanceFundTab/);
});