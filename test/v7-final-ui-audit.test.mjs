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

test('compact home keeps the composer in document flow and the catalog responsive', async () => {
  const index = await readFile('index.html', 'utf8');
  const accordion = await readFile('assets/js/ui/assistant-catalog-accordion-v1.js', 'utf8');
  assert.match(homeCss, /html:not\(\.result-route\) body\.app-shell \.composer-region\{[^}]*position:relative!important/s);
  assert.match(index, /catalog\.before\(composer\)/);
  assert.match(accordion, /@media\(max-width:620px\)[^`]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(homeCss, /html\.result-route\.result-intake \.composer-region\{[^}]*display:block!important/s);
});

test('home routes decision/legal requests through v8 evidence-first retrieval and decision lock', () => {
  assert.match(homeJs, /officialSearchConnector\.search/);
  assert.match(homeJs, /v8Assessment/);
  assert.match(homeJs, /Decision Lock ON/);
});
