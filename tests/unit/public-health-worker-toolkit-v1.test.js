import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadApi() {
  const source = await readFile('assets/js/features/public-health-worker-toolkit-v1.js', 'utf8');
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { api: context.window.GovPromptPublicHealthToolkit, source };
}

test('health worker toolbox exposes safe field calculators', async () => {
  const { api } = await loadApi();
  assert.ok(api);
  assert.equal(api.bmi(65, 165).toFixed(2), '23.88');
  assert.equal(api.coverage(240, 300).toFixed(2), '80.00');
  assert.equal(api.attackRate(25, 100).toFixed(2), '25.00');
  assert.equal(api.incidence(10, 20000, 100000).toFixed(2), '50.00');
  assert.equal(api.rate(1, 0), null);
});

test('toolbox includes practical primary-care work without diagnosis or prescribing', async () => {
  const { source } = await loadApi();
  for (const label of ['สรุปคัดกรอง NCD', 'รายงานเยี่ยมบ้าน', 'สรุปสอบสวนโรค/เหตุการณ์', 'รายงาน อสม.', 'อนามัยสิ่งแวดล้อม', 'สื่อสารความเสี่ยง/สุขศึกษา', 'แผนออกหน่วย/รณรงค์', 'รายงานประจำเดือน/วันเพจ', 'แม่และเด็ก', 'ผู้สูงอายุ/LTC', 'โรงเรียน/ศูนย์เด็กเล็ก', 'HI / CI ลูกน้ำยุงลาย']) {
    assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(source, /ไม่วินิจฉัยโรค/);
  assert.match(source, /ไม่สั่งยา/);
  assert.match(source, /PDPA/);
  assert.match(source, /ห้ามกรอกชื่อผู้ป่วย/);
});

test('GP008 loads toolbox and groups specialist tools under Other, not global home', async () => {
  const integration = await readFile('assets/js/core/context-integration.js', 'utf8');
  const placement = await readFile('assets/js/features/mosquito-public-health-placement-v1.js', 'utf8');
  const home = await readFile('assets/js/ui/status-copy.js', 'utf8');
  assert.match(integration, /moduleId !== 'GP008'/);
  assert.match(integration, /public-health-worker-toolkit-v1\.js\?v=1\.0\.0/);
  assert.match(placement, /health-worker-toolkit-task/);
  assert.match(placement, /อื่นๆ/);
  assert.doesNotMatch(home, /healthWorkerToolkitTask/);
});
