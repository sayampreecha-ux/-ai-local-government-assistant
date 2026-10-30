import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const fixtures = JSON.parse(readFileSync('tests/fixtures/acceptance-65-20261026.json', 'utf8'));
const context = { window: { GovPromptCore: {} } };
vm.runInNewContext(readFileSync('assets/js/core/output-router.js','utf8'), context);
const routeOutput = context.window.GovPromptCore.routeOutput;
const home = readFileSync('assets/js/home-v3.js','utf8');
const begin = home.indexOf('  function completeDocumentHandoff(');
const end = home.indexOf('  function addRouteResult(', begin);
assert.ok(begin >= 0 && end > begin);
const handoff = vm.runInNewContext('(' + home.slice(begin,end).trim() + ')');

const outputs = [
  ['GP04-A', 'GP005', 'table'],
  ['GP05-E', 'GP006', 'table'],
  ['GP07-E', 'GP008', 'public_content'],
  ['GP08-A', 'GP011', 'schedule'],
  ['GP08-E', 'GP011', 'schedule'],
  ['GP10-C', 'GP001', 'public_content'],
  ['GP10-D', 'GP006', 'public_content'],
  ['GP13-A', 'GP011', 'table']
];
for (const [id, moduleId, expected] of outputs) {
  test('QA60 output ' + id, () => {
    const fixture = fixtures.find(row => row.id === id);
    assert.ok(fixture, id + ' missing from original fixture');
    const actual = routeOutput(fixture.input, { moduleId }, { facts: fixture.input });
    assert.equal(actual.id, expected, id);
    assert.ok(actual.instructions?.length, id + ' missing instructions');
  });
}
test('QA60 GP01-E retains DOCX handoff while declining slides', () => {
  const fixture = fixtures.find(row => row.id === 'GP01-E');
  assert.ok(fixture);
  const actual = handoff('SOURCE\n' + fixture.input, fixture.input);
  assert.match(actual, /GP_DOCUMENT_HANDOFF_V1/);
  assert.match(actual, /ห้ามทำลิงก์ดาวน์โหลดปลอม/);
  assert.equal(handoff(actual,fixture.input), actual);
});
for (const input of [
  'ไม่ต้องสร้าง Excel ขอคำอธิบายเท่านั้น',
  'ไม่ต้องร่างบันทึกข้อความ ขอเพียงอธิบายความหมาย',
  'ขอวิธีจัดทำ TOR',
  'ช่วยอธิบายวิธีร่างบันทึกข้อความ'
]) test('negative-control handoff: ' + input, () => {
  assert.equal(handoff('SOURCE',input), 'SOURCE');
});
test('tort quick-action keeps GP002 seven-part safety', () => {
  const result = routeOutput('ข้อมูลจำลองระหว่างปฏิบัติหน้าที่', {moduleId:'GP002', reason:'explicit-legal-tort-quick-action'});
  assert.equal(result.id,'tort-level1-document');
  assert.match(result.instructions.join(' '), /Decision Lock/);
});
