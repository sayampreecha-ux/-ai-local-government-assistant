import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const sandbox = { window: {}, document: { readyState: 'loading', addEventListener() {} }, location: { pathname: '/index.html' } };
for (const file of ['shared-context', 'prompt-registry', 'transaction-router', 'output-router', 'tool-routing-policy', 'prompt-orchestrator', 'privacy-guard']) {
  vm.runInNewContext(readFileSync(`assets/js/core/${file}.js`, 'utf8'), sandbox);
}
const core = sandbox.window.GovPromptCore;
function handoff(question) {
  const context = core.createSharedContext({ facts: question, desiredOutput: question });
  const bundle = core.createGovernmentPrompt({ question, context, route: core.routeTransaction(context) });
  const prompt = bundle.prompt + '\n' + core.formatToolRoutingInstructions(core.createToolRoutingPlan({ question }));
  return { bundle, text: core.sanitizeExternalContent(prompt).safeText };
}
test('actual copied short finance prompt clarifies scope and contains no conflicting legacy instructions', () => {
  const { bundle, text } = handoff('เบิกค่าเช่า');
  assert.equal(bundle.casePrecedentGate.nextAction, 'CLARIFY_DECISIVE_SCOPE');
  assert.equal(bundle.casePrecedentGate.searchQueries.length, 0);
  assert.match(text, /ก่อนค้นเชิงลึก/);
  assert.doesNotMatch(text, /เบิกค่าเช่า เบิกค่าเช่า|Decision Gate: OFF|Multi-condition Gate: OFF/);
  assert.match(text, /เบิกได้ \/ เบิกไม่ได้ \/ มีเงื่อนไข \/ ยังยืนยันไม่ได้/);
  assert.doesNotMatch(text, /ให้ตรวจฉบับปัจจุบันล่าสุดก่อนฟันธง|เลือกต้นฉบับที่ยังมีผลและใหม่ที่สุด|วันเกิด \[ปกปิด\]/);
  for (const term of ['วันเกิดเหตุ', 'วันเกิดสิทธิหรือหน้าที่', 'วันอนุมัติ', 'วันคำสั่ง', 'วันมีผลกฎ']) assert.ok(text.includes(term), term);
});
test('specific facts search immediately, without duplicate exact phrases', () => {
  const { bundle, text } = handoff('ข้าราชการ อบจ. ขอเบิกค่าเช่าที่พักเดินทางไปราชการเมื่อปี 2565 มีสิทธิหรือไม่');
  assert.equal(bundle.casePrecedentGate.needsScopeClarification, false);
  assert.equal(bundle.casePrecedentGate.searchQueries.length, 4);
  assert.doesNotMatch(bundle.casePrecedentGate.searchQueries[1], /^"/);
  assert.match(text, /ฉบับที่มีผลกับบุคคล เหตุการณ์ และช่วงเวลาที่ต้องวินิจฉัย/);
});
test('privacy keeps legal dates but continues masking actual birthdays, including mixed input', () => {
  const dates = 'วันเกิดเหตุ 1 มกราคม 2560; วันเกิดสิทธิ 2 มกราคม 2560; วันเกิดหน้าที่ 3 มกราคม 2560; วันอนุมัติ 4 มกราคม 2560';
  const mixed = dates + '\nวันเกิด 1 มกราคม 2530\nวันเดือนปีเกิด: 02/02/2531\nเกิดวันที่ 3 มีนาคม 2532';
  const first = core.sanitizeExternalContent(mixed).safeText;
  assert.ok(first.includes(dates));
  for (const dob of ['1 มกราคม 2530', '02/02/2531', '3 มีนาคม 2532']) assert.ok(!first.includes(dob));
  assert.equal(core.sanitizeExternalContent(first).safeText, first);
});

test('short request with attached facts does not ask the user to repeat document scope', () => {
  const bundle = core.createGovernmentPrompt({ question: 'เบิกค่าเช่า', attachments: [{ name: 'facts.pdf' }] });
  assert.equal(bundle.casePrecedentGate.needsScopeClarification, false);
});
