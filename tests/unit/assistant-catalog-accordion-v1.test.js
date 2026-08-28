import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('home assistant catalog is collapsed by assistant with frequent-task lists', async () => {
  const source = await readFile('assets/js/ui/assistant-catalog-accordion-v1.js', 'utf8');
  assert.match(source, /assistant-catalog-toggle/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /work-catalog-tasks/);
  assert.match(source, /ผู้ช่วยงานราชการทั้งหมด/);
  assert.match(source, /กดเลือกผู้ช่วย แล้วเลือกงานใช้บ่อย/);
  assert.match(source, /collapseOthers/);
});

test('public-health assistant surfaces health-worker, maintenance-fund, guided temp-staff and mosquito tools', async () => {
  const source = await readFile('assets/js/ui/assistant-catalog-accordion-v1.js', 'utf8');
  const wizard = await readFile('temp-staff-wizard.html', 'utf8');
  assert.match(source, /เครื่องมือหมออนามัย/);
  assert.match(source, /gp008\.html#healthWorkerToolkitTask/);
  assert.match(source, /แผนและติดตามเงินบำรุง รพ\.สต\.\/สอน\./);
  assert.match(source, /maintenance-fund-plan\.html/);
  assert.match(source, /แผนลูกจ้างเงินบำรุง/);
  assert.match(source, /temp-staff-wizard\.html/);
  assert.match(source, /วันเพจลูกน้ำยุงลาย HI \/ CI/);
  assert.match(source, /mosquito-onepage\.html/);
  assert.match(wizard, /temp-staff-guided-wizard-v1\.js\?v=1\.0\.0/);
  assert.match(wizard, /แผนลูกจ้างชั่วคราวเงินบำรุง/);
});

test('existing mic asset loads the fresh accordion only on the home quick-action surface', async () => {
  const mic = await readFile('assets/js/mic.js', 'utf8');
  assert.match(mic, /document\.querySelector\('\.quick-actions'\)/);
  assert.match(mic, /assistantCatalogAccordionScript/);
  assert.match(mic, /assistant-catalog-accordion-v1\.js\?v=1\.0\.3/);
});