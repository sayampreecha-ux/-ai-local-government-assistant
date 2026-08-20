import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('GovPrompt home exposes mosquito one-page quick action', async () => {
  const source = await readFile('assets/js/ui/status-copy.js', 'utf8');
  assert.match(source, /mosquitoOnepageQuickAction/);
  assert.match(source, /🦟 วันเพจลูกน้ำยุงลาย/);
  assert.match(source, /mosquito-onepage\.html/);
});

test('standalone mosquito one-page page loads the calculator feature', async () => {
  const html = await readFile('mosquito-onepage.html', 'utf8');
  assert.match(html, /mosquito-survey-onepage-v1\.js\?v=1\.0\.1/);
  assert.match(html, /วันเพจผลสำรวจลูกน้ำยุงลาย/);
});
