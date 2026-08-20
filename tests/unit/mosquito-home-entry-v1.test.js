import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('GovPrompt home does not expose mosquito one-page as a global quick action', async () => {
  const source = await readFile('assets/js/ui/status-copy.js', 'utf8');
  assert.doesNotMatch(source, /mosquitoOnepageQuickAction/);
});

test('mosquito one-page appears under Other in the public-health GP008 feature', async () => {
  const integration = await readFile('assets/js/core/context-integration.js', 'utf8');
  const feature = await readFile('assets/js/features/mosquito-survey-onepage-v1.js', 'utf8');
  const placement = await readFile('assets/js/features/mosquito-public-health-placement-v1.js', 'utf8');
  const html = await readFile('mosquito-onepage.html', 'utf8');
  assert.match(integration, /moduleId !== 'GP008'/);
  assert.match(integration, /mosquito-public-health-placement-v1\.js\?v=1\.0\.0/);
  assert.match(feature, /🦟 วันเพจลูกน้ำยุงลาย/);
  assert.match(placement, /textContent = 'อื่นๆ'/);
  assert.match(placement, /tasks\.append\(heading, button\)/);
  assert.match(html, /mosquito-survey-onepage-v1\.js\?v=1\.0\.1/);
});
