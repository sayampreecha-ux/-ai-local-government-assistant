import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const gp008 = await readFile('gp008.html', 'utf8');
const context = await readFile('assets/js/core/context-integration.js', 'utf8');
const homeCss = await readFile('assets/css/home-v3.css', 'utf8');
const homeJs = await readFile('assets/js/home-v3.js', 'utf8');

test('GP008 specialist entries are unique and legacy temp-staff tabs are not statically duplicated', () => {
  assert.equal((gp008.match(/id=["']healthWorkerToolkitTask["']/g) || []).length, 1);
  assert.equal((gp008.match(/id=["']mosquitoOnepageTask["']/g) || []).length, 1);
  assert.equal((gp008.match(/id=["']publicHealthOtherToolsHeading["']/g) || []).length, 1);
  assert.doesNotMatch(gp008, /tempStaffGuidedWizardTab|tempStaffMaintenanceFundTab/);
});

test('GP008 fallback bootstrap uses the same current assets as the static production page', () => {
  assert.match(context, /mosquito-public-health-placement-v1\.js\?v=1\.0\.2/);
  assert.match(context, /public-health-worker-toolkit-v1\.js\?v=1\.0\.3/);
  assert.match(gp008, /mosquito-public-health-placement-v1\.js\?v=1\.0\.2/);
  assert.match(gp008, /public-health-worker-toolkit-v1\.js\?v=1\.0\.3/);
});

test('mobile home keeps quick actions scrollable and composer out of the fixed-button collision zone', () => {
  assert.match(homeCss, /@media\(max-width:620px\)/);
  assert.match(homeCss, /\.quick-actions\{[^}]*flex-wrap:nowrap[^}]*overflow-x:auto/s);
  assert.match(homeCss, /\.chat-main\.has-messages \.composer-region\{[^}]*position:sticky/s);
  assert.match(homeCss, /\.answer-actions\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s);
});

test('home delegates fresh public-source retrieval to the user AI instead of consuming live search automatically', () => {
  assert.match(homeJs, /mode: 'delegated-user-ai'/);
  assert.match(homeJs, /GovPrompt ไม่ค้นเว็บสดอัตโนมัติ/);
});
