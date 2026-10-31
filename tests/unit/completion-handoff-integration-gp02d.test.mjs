import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const home = readFileSync('assets/js/home-v3.js', 'utf8');
const helperStart = home.indexOf('  function completeDocumentHandoff(');
const routeStart = home.indexOf('\n  function addRouteResult(', helperStart);
assert.ok(helperStart >= 0 && routeStart > helperStart, 'expected handoff and router functions');
const ctx = {};
vm.runInNewContext(home.slice(helperStart, routeStart) + ';this.complete=completeDocumentHandoff;', ctx);
const callStart = home.indexOf('    if (!promptBundle.gp223) {', routeStart);
const next = home.indexOf('    if (!explicitDisciplineIntent)', callStart);
assert.ok(callStart > routeStart && next > callStart, 'bounded integration callsite must exist');
const integrated = new Function('promptBundle', 'workflowRuntime', 'originalRequest', 'completeDocumentHandoff',
  home.slice(callStart, next) + '\nreturn promptBundle.prompt;');
const base = 'SOURCE\\nEvidence Gate / Legal Version Gate / Decision Lock / Human Review';
const gp02 = 'จัดทำความเห็นทางกฎหมายเกี่ยวกับการโอนข้าราชการท้องถิ่น โดยยังไม่มีหลักเกณฑ์ต้นฉบับที่ยืนยันได้ ห้ามสมมติฐานกฎหมายหรือระยะเวลา ให้จัดทำความเห็นฉบับเต็มและแยกประเด็นที่ต้องตรวจสอบก่อนเสนอผู้มีอำนาจ';

for (const runtime of [null, {primary: {currentStage: {title: 'facts'}}}]) {
  test('GP02-D full legal opinion handoff with runtime ' + (runtime ? 'ready' : 'null'), () => {
    const result = integrated({prompt:base,gp223:false}, runtime, gp02, ctx.complete);
    assert.ok(result.startsWith(base));
    assert.ok(result.includes('[GP_DELIVERABLE_HANDOFF_V1]'));
    assert.match(result, /ชิ้นงานฉบับเต็ม/);
    assert.match(result, /Decision Lock/);
    assert.equal(ctx.complete(result,gp02),result);
  });
}
for (const q of ['ทำไมต้องทำแผน', 'อธิบายการจัดทำแผนสุขภาพ', 'ไม่ต้องจัดทำแผน ขอคำอธิบาย', 'ช่วยอธิบายการร่างความเห็น']) {
  test('advice or refusal preserves prompt: ' + q, () => {
    assert.equal(integrated({prompt:base,gp223:false},null,q,ctx.complete),base);
  });
}
test('GP223 is not modified', () => {
  assert.equal(integrated({prompt:base,gp223:true},null,gp02,ctx.complete),base);
});
test('Privacy Guard sanitizes before external copy and preview uses canonical prompt', () => {
  assert.match(home,/const external = prepareExternalPrompt\(promptBundle\.prompt\)/);
  assert.match(home,/copyText\(external\.safeText\)/);
  assert.match(home,/canonicalHandoffPrompts\.set\(card, promptBundle\.prompt\)/);
});
test('No legal decision overrides, and no fake document links', () => {
  const result = integrated({prompt:base,gp223:false},null,gp02,ctx.complete);
  assert.match(result,/Decision Lock/);
  assert.match(result,/ห้ามทำลิงก์ดาวน์โหลดปลอม/);
  assert.match(result,/Human Review/);
});
