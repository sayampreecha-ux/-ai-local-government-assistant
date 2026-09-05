import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('home assistant catalog is a responsive one-page accordion with frequent-task lists', async () => {
  const source = await readFile('assets/js/ui/assistant-catalog-accordion-v1.js', 'utf8');
  assert.match(source, /assistant-catalog-toggle/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /work-catalog-tasks/);
  assert.match(source, /collapseOthers/);
  assert.match(source, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(source, /@media\(max-width:959px\).*repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(source, /@media\(max-width:620px\).*grid-column:1\/-1/s);
  assert.match(source, /min-height:48px/);
});

test('public-relations assistant keeps four simple jobs and direct image prompt entry', async () => {
  const source = await readFile('assets/js/ui/assistant-catalog-accordion-v1.js', 'utf8');
  assert.match(source, /เขียนข่าวประชาสัมพันธ์/);
  assert.match(source, /ทำโพสต์โซเชียล/);
  assert.match(source, /ทำอินโฟกราฟิก/);
  assert.match(source, /ทำภาพประชาสัมพันธ์/);
  assert.match(source, /gp012\.html\?mode=image-prompt/);
  assert.match(source, /prImageShortcut/);
});

test('public-health assistant keeps a clean five-entry landing menu', async () => {
  const source = await readFile('assets/js/ui/assistant-catalog-accordion-v1.js', 'utf8');
  const wizard = await readFile('temp-staff-wizard.html', 'utf8');
  assert.match(source, /เมนูเด่น/);
  assert.match(source, /keepPatterns/);
  assert.match(source, /งาน รพ\.สต\. \/ งานสุขภาพทั้งหมด/);
  assert.match(source, /data\.healthGateway|healthGateway/);
  assert.match(source, /window\.location\.assign\('gp008\.html'\)/);
  assert.match(source, /แผนเงินบำรุง รพ\.สต\.\/สอน\./);
  assert.match(source, /maintenance-fund-plan\.html/);
  assert.match(source, /แผนลูกจ้างเงินบำรุง/);
  assert.match(source, /temp-staff-wizard\.html/);
  assert.match(source, /healthFeaturedCurated/);
  assert.doesNotMatch(source, /mosquito-onepage\.html/);
  assert.match(wizard, /temp-staff-guided-wizard-v1\.js\?v=1\.0\.0/);
  assert.match(wizard, /แผนลูกจ้างชั่วคราวเงินบำรุง/);
});

test('existing mic asset loads the fresh accordion only on the home quick-action surface', async () => {
  const mic = await readFile('assets/js/mic.js', 'utf8');
  assert.match(mic, /document\.querySelector\('\.quick-actions'\)/);
  assert.match(mic, /assistantCatalogAccordionScript/);
  assert.match(mic, /assistant-catalog-accordion-v1\.js\?v=1\.1\.0/);
});
