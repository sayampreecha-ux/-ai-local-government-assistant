import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('GovPrompt home does not expose mosquito one-page as a global quick action', async () => {
  const source = await readFile('assets/js/ui/status-copy.js', 'utf8');
  assert.doesNotMatch(source, /mosquitoOnepageQuickAction/);
});

test('GP008 exposes mosquito one-page as a permanent sixteenth public-health task', async () => {
  const integration = await readFile('assets/js/core/context-integration.js', 'utf8');
  const feature = await readFile('assets/js/features/mosquito-survey-onepage-v1.js', 'utf8');
  const placement = await readFile('assets/js/features/mosquito-public-health-placement-v1.js', 'utf8');
  const gp008 = await readFile('gp008.html', 'utf8');
  const standalone = await readFile('mosquito-onepage.html', 'utf8');

  assert.match(integration, /function isPublicHealthPage\(moduleId\)/);
  assert.match(integration, /loadModuleFeature\(pageModuleId\)/);
  assert.match(feature, /🦟 วันเพจลูกน้ำยุงลาย/);

  assert.match(gp008, /data-module-id=["']GP008["']/i);
  assert.match(gp008, /id=["']publicHealthOtherToolsHeading["']/i);
  assert.match(gp008, /id=["']healthWorkerToolkitTask["']/i);
  assert.match(gp008, /id=["']mosquitoOnepageTask["']/i);
  assert.match(gp008, /href=["']mosquito-onepage\.html["']/i);
  assert.match(gp008, /วันเพจลูกน้ำยุงลาย HI CI/);
  assert.match(gp008, /House Index Container Index/);
  assert.match(gp008, /mosquito-public-health-placement-v1\.js\?v=1\.0\.2/);

  const staticTaskCount = (gp008.match(/class=["'][^"']*\btask\b[^"']*["']/g) || []).length;
  assert.equal(staticTaskCount, 16, 'GP008 must contain exactly 16 static task entries');

  assert.match(placement, /STATIC_MOSQUITO_ID = 'mosquitoOnepageTask'/);
  assert.match(placement, /querySelectorAll\('\.mosq-task'\)/);
  assert.match(placement, /dynamicEntry\.remove\(\)/);
  assert.match(placement, /tasks\.append\(heading, \.\.\.buttons\)/);
  assert.match(standalone, /mosquito-survey-onepage-v1\.js\?v=1\.0\.1/);
});
