import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bridge = await readFile(new URL('../assets/js/ui/quick-action-guided-bridge-v1.js', import.meta.url), 'utf8');
const home = await readFile(new URL('../assets/js/home-v3.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const labels = [
  'ภาษีที่ดินและสิ่งปลูกสร้าง',
  'ภาษีป้าย',
  'การประเมินและอุทธรณ์ภาษี',
  'ภาษีค้างชำระและเร่งรัด',
  'แผนที่ภาษีและสำรวจทรัพย์สิน',
  'LTAX GIS / ONLINE',
  'New e-LAAS',
  'หนังสือแจ้งภาษี'
];

test('visible revenue category is in existing homepage catalog', () => {
  assert.match(bridge, /id: 'revenue'/);
  assert.match(bridge, /title: 'งานจัดเก็บรายได้ท้องถิ่น'/);
  assert.match(bridge, /'finance', 'revenue', 'planning'/);
  assert.match(index, /quick-actions/);
  assert.match(index, /quick-action-guided-bridge-v1\.js/);
  assert.match(bridge, /quickActions\.replaceChildren\(buildCatalog\(\)\)/);
});

test('eight correctly labeled revenue buttons fill only the existing composer', () => {
  const revenueStart = bridge.indexOf("id: 'revenue'");
  const nextCategory = bridge.indexOf("id: 'assistance'", revenueStart);
  const block = bridge.slice(revenueStart, nextCategory);
  assert.equal((block.match(/fillOnly: true/g) || []).length, 8);
  for (const label of labels) assert.ok(block.includes("label: '" + label + "'"), label);
  assert.match(bridge, /button\.dataset\.revenuePrompt = task\.prompt/);
  assert.match(bridge, /input\.value = task\.prompt/);
  assert.match(bridge, /input\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/);
  assert.match(bridge, /input\.focus\(\)/);
  assert.match(bridge, /else \{\s*button\.dataset\.prompt = task\.prompt;/);
  assert.doesNotMatch(block, /requestSubmit|submitPrompt|openResultPage|showModal/);
});

test('existing catalog accessibility and mobile one-open-at-a-time behavior preserved', () => {
  assert.match(bridge, /const trigger = document\.createElement\('button'\)/);
  assert.match(bridge, /trigger\.type = 'button'/);
  assert.match(bridge, /trigger\.setAttribute\('aria-controls', tasks\.id\)/);
  assert.match(bridge, /trigger\.setAttribute\('aria-expanded', 'false'\)/);
  assert.match(bridge, /trigger\.addEventListener\('click', toggleCategory\)/);
  assert.match(bridge, /trigger\.addEventListener\('keydown'/);
  assert.match(bridge, /event\.preventDefault\(\)/);
  assert.match(bridge, /trigger\.click\(\)/);
  assert.match(bridge, /groups\.querySelectorAll\('\.work-catalog-group'\)/);
  assert.match(bridge, /otherTasks\.hidden = true/);
  assert.match(bridge, /@media \(max-width:620px\)/);
});

test('no routing, gate, autoforward or auto-submit behavior changed', () => {
  assert.match(home, /const promptButtons = \[\.\.\.document\.querySelectorAll\('\[data-prompt\]'\)\]/);
  assert.match(home, /submitPrompt\(button\.dataset\.prompt\)/);
  assert.match(bridge, /button\.dataset\.revenuePrompt = task\.prompt/);
  assert.match(index, /id="chatForm"/);
  assert.match(index, /id="promptInput"/);
});
