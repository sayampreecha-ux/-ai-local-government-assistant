import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const index = await readFile('index.html', 'utf8');
const worker = await readFile('service-worker.js', 'utf8');
const manifest = JSON.parse(await readFile('manifest.webmanifest', 'utf8'));

test('does not reference the removed simple handoff asset', () => {
  assert.doesNotMatch(index, /assets\/js\/ui\/simple-handoff-copy\.js/);
});

test('precache contains only assets present in the Pages source', async () => {
  const assets = [...worker.matchAll(/'\.\/(?!['/])([^']+)'/g)].map(match => match[1]);
  for (const asset of assets) await access(asset);
  assert.equal(assets.includes('assets/styles.css'), false);
  assert.equal(assets.includes('assets/app.js'), false);
  assert.equal(assets.some(asset => asset.startsWith('assets/icons/')), false);
});

test('web manifest has no references to absent icon files', () => {
  assert.equal('icons' in manifest, false);
  assert.match(index, /service-worker\.js\?v=6\.1\.1/);
  assert.match(worker, /APP_VERSION = '1\.3'/);
});
