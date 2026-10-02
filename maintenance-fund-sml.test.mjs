import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('./assets/js/features/maintenance-fund-sml-v1.js', import.meta.url), 'utf8');
const storage = new Map();
const context = {
  console,
  Intl,
  Math,
  Number,
  String,
  Date,
  Object,
  Array,
  JSON,
  setTimeout: () => 0,
  clearTimeout: () => {},
  URL,
  Blob: class {},
  requestAnimationFrame: fn => fn(),
  MutationObserver: class { observe() {} },
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  },
  document: {
    readyState: 'loading',
    addEventListener() {},
    getElementById() { return null; },
    querySelectorAll() { return []; },
    head: { appendChild() {} },
    createElement() { return { style: {}, appendChild() {}, remove() {}, click() {} }; },
    body: { appendChild() {} }
  }
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'maintenance-fund-sml-v1.js' });

const sml = context.window.GovPromptMaintenanceFundSML;

test('classifies RPHST/SOR S-M-L boundaries from responsibility population', () => {
  assert.equal(sml.classifyPopulation('').code, '');
  assert.equal(sml.classifyPopulation(1).code, 'S');
  assert.equal(sml.classifyPopulation(2999).code, 'S');
  assert.equal(sml.classifyPopulation(3000).code, 'M');
  assert.equal(sml.classifyPopulation(8000).code, 'M');
  assert.equal(sml.classifyPopulation(8001).code, 'L');
  assert.equal(sml.classifyPopulation(15000).code, 'L');
});

test('SML module keeps official-source and no-auto-budget guardrail', () => {
  assert.match(sml.SOURCE_URL, /moph\.go\.th/);
  assert.match(source, /ไม่ใช่วงเงินเงินบำรุงมาตรฐาน/);
  assert.match(source, /ไม่ควรนำขนาดไปกำหนดงบอัตโนมัติ/);
  assert.match(source, /เปรียบเทียบตามขนาด S \/ M \/ L/);
});
