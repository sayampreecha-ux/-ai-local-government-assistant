import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const page = path => new URL(path, frontend).toString();

const files = Object.freeze([
  ['gp008.html', new URL('../gp008.html', import.meta.url)],
  ['temp-staff-wizard.html', new URL('../temp-staff-wizard.html', import.meta.url)],
  ['assets/js/mic.js', new URL('../assets/js/mic.js', import.meta.url)],
  ['assets/js/ui/assistant-catalog-accordion-v1.js', new URL('../assets/js/ui/assistant-catalog-accordion-v1.js', import.meta.url)],
  ['assets/js/core/context-integration.js', new URL('../assets/js/core/context-integration.js', import.meta.url)],
  ['assets/js/features/public-health-worker-toolkit-v1.js', new URL('../assets/js/features/public-health-worker-toolkit-v1.js', import.meta.url)],
  ['assets/js/features/temp-staff-maintenance-fund-v1.js', new URL('../assets/js/features/temp-staff-maintenance-fund-v1.js', import.meta.url)],
  ['assets/js/features/temp-staff-guided-wizard-v1.js', new URL('../assets/js/features/temp-staff-guided-wizard-v1.js', import.meta.url)],
  ['assets/js/features/temp-staff-guided-workflow-v2.js', new URL('../assets/js/features/temp-staff-guided-workflow-v2.js', import.meta.url)],
  ['assets/js/features/mosquito-public-health-placement-v1.js', new URL('../assets/js/features/mosquito-public-health-placement-v1.js', import.meta.url)]
]);

async function fetchText(path) {
  const url = new URL(page(path));
  url.searchParams.set('gp008-proof', Date.now().toString());
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'cache-control': 'no-cache, no-store', pragma: 'no-cache' }
  });
  assert.equal(response.ok, true, `${url}: HTTP ${response.status}`);
  return response.text();
}

for (const [path, localUrl] of files) {
  const [local, production] = await Promise.all([
    readFile(localUrl, 'utf8'),
    fetchText(path)
  ]);
  assert.equal(
    production.replace(/\r\n/g, '\n'),
    local.replace(/\r\n/g, '\n'),
    `production ${path} is stale or differs from main`
  );
}

const gp008 = await readFile(new URL('../gp008.html', import.meta.url), 'utf8');
const wizardPage = await readFile(new URL('../temp-staff-wizard.html', import.meta.url), 'utf8');
const mic = await readFile(new URL('../assets/js/mic.js', import.meta.url), 'utf8');
const catalog = await readFile(new URL('../assets/js/ui/assistant-catalog-accordion-v1.js', import.meta.url), 'utf8');
const context = await readFile(new URL('../assets/js/core/context-integration.js', import.meta.url), 'utf8');
const toolkit = await readFile(new URL('../assets/js/features/public-health-worker-toolkit-v1.js', import.meta.url), 'utf8');
const tempStaff = await readFile(new URL('../assets/js/features/temp-staff-maintenance-fund-v1.js', import.meta.url), 'utf8');
const guidedWizard = await readFile(new URL('../assets/js/features/temp-staff-guided-wizard-v1.js', import.meta.url), 'utf8');
const guidedWorkflow = await readFile(new URL('../assets/js/features/temp-staff-guided-workflow-v2.js', import.meta.url), 'utf8');

assert.match(gp008, /assets\/js\/core\/context-integration\.js/);
assert.match(wizardPage, /👥 แผนลูกจ้างชั่วคราวเงินบำรุง/);
assert.match(wizardPage, /temp-staff-guided-wizard-v1\.js\?v=1\.0\.0/);
assert.match(mic, /assistant-catalog-accordion-v1\.js\?v=1\.0\.10/);
assert.match(catalog, /เมนูเด่น/);
assert.match(catalog, /👥 แผนลูกจ้างเงินบำรุง/);
assert.match(catalog, /temp-staff-wizard\.html/);
assert.match(context, /public-health-worker-toolkit-v1\.js\?v=1\.0\.2/);
assert.match(toolkit, /เครื่องมือหมออนามัย/);
assert.match(toolkit, /สรุปคัดกรอง NCD/);
assert.match(toolkit, /รายงานเยี่ยมบ้าน/);
assert.match(toolkit, /อนามัยสิ่งแวดล้อม/);
assert.match(toolkit, /ผู้สูงอายุ\/LTC/);
assert.match(toolkit, /โรงเรียน\/ศูนย์เด็กเล็ก/);
assert.match(toolkit, /ไม่วินิจฉัยโรค ไม่สั่งยา/);
assert.match(toolkit, /PDPA/);
assert.match(tempStaff, /แผนลูกจ้างเงินบำรุง/);
assert.match(tempStaff, /Workload/);
assert.match(tempStaff, /FTE/);
assert.match(guidedWizard, /แบบกรอกทีละขั้น/);
assert.match(guidedWizard, /tsgwGenerate/);
assert.match(guidedWizard, /สรุปวิเคราะห์ค่างาน/);
assert.match(guidedWizard, /ร่างบันทึกขออนุมัติ/);
assert.match(guidedWizard, /ดาวน์โหลด Word/);

console.log('GP008 production proof passed: live public-health tools stay separate, and the standalone temp-staff wizard remains the single planning entry point.');