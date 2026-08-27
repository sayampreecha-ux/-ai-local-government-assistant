import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync('assets/js/core/guided-intake-v1.js', 'utf8');
const hookSource = readFileSync('assets/js/ui/pilot-feedback-ui.js', 'utf8');
const homeHtml = readFileSync('index.html', 'utf8');

function api() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.GovPromptGuidedIntake;
}

test('short TOR request is stopped for three critical intake questions', () => {
  const tool = api();
  const result = tool.assessQuery('ร่างtor', { transactionType: 'procurement' });
  assert.equal(tool.version, '1.1.1');
  assert.equal(result.ready, false);
  assert.equal(result.intent, 'procurement');
  assert.deepEqual([...result.missingFields], ['item', 'purpose', 'budget']);
  assert.equal(result.questions.length, 3);
  assert.match(result.questions[0], /ซื้อ จ้าง หรือก่อสร้างอะไร/);
  assert.match(result.questions[1], /นำไปใช้ทำอะไร/);
  assert.match(result.questions[2], /วงเงินโดยประมาณ/);
});

test('TOR first-success copy is limited to TOR requests and keeps governance guardrails', () => {
  const tool = api();
  assert.equal(tool.isTorRequest('ช่วยร่าง TOR หรือขอบเขตของงาน'), true);
  assert.equal(tool.isTorRequest('ช่วยตรวจขั้นตอน วิธีการ และเงื่อนไขการจัดซื้อจัดจ้างภาครัฐ'), false);
  assert.match(source, /ร่าง TOR ให้เริ่มง่าย — บอก GP 3 เรื่อง/);
  assert.match(source, /ไม่ต้องเขียน Prompt และยังไม่ต้องรู้สเปกทั้งหมด/);
  assert.match(source, /ล็อกสเปก\/การแข่งขัน/);
  assert.match(source, /ผู้ใช้ตรวจและอนุมัติก่อนใช้จริง/);
  assert.match(source, /ยังไม่ทราบ — ให้ GP ช่วยตั้งต้น/);
  assert.match(source, /assessment\.intent === 'procurement' && isTorRequest\(subject\)/);
});

test('short project and training requests are guided instead of handed off immediately', () => {
  const tool = api();
  for (const query of ['ทำโครงการ', 'อบรม']) {
    const result = tool.assessQuery(query, { transactionType: 'executive' });
    assert.equal(result.ready, false, query);
    assert.equal(result.intent, 'project', query);
    assert.deepEqual([...result.missingFields], ['topic', 'target', 'budget'], query);
  }
});

test('detailed project and TOR requests pass the intake gate', () => {
  const tool = api();
  const project = tool.assessQuery('ทำโครงการ NCD เพื่อคัดกรองสุขภาพผู้สูงอายุ กลุ่มเป้าหมาย 100 คน งบ 30,000 บาท');
  assert.equal(project.ready, true);
  const tor = tool.assessQuery('ร่าง TOR รถขุด เพื่อใช้ป้องกันและบรรเทาสาธารณภัย วงเงิน 5,000,000 บาท');
  assert.equal(tor.ready, true);
});

test('ordinary factual questions are not forced through guided intake', () => {
  const tool = api();
  assert.equal(tool.shouldGuide('ปลัด อบจ. เบิกค่าที่พักได้กี่บาท'), false);
  assert.equal(tool.assessQuery('ปลัด อบจ. เบิกค่าที่พักได้กี่บาท', { transactionType: 'finance' }).ready, true);
});

test('unknown fields can be explicitly acknowledged without fabrication', () => {
  const result = api().assessQuery('ทำโครงการ NCD กลุ่มเป้าหมายผู้สูงอายุ 100 คน', null, ['budget']);
  assert.equal(result.missingFields.includes('budget'), false);
});

test('guided intake stays memory-only and network-free, without duplicate lazy loading', () => {
  assert.doesNotMatch(source, /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/);
  assert.doesNotMatch(source, /\b(fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon)\b/);
  assert.doesNotMatch(hookSource, /guided-intake-v1\.js/);
});

test('home loads guided intake directly before bridge and home handler with fresh cache keys', () => {
  const intake = 'assets/js/core/guided-intake-v1.js?v=1.1.1';
  const bridge = 'assets/js/ui/quick-action-guided-bridge-v1.js?v=1.0.0';
  const home = 'assets/js/home-v3.js?v=6.2.0';
  const feedback = 'assets/js/ui/pilot-feedback-ui.js?v=1.1.1';
  assert.match(homeHtml, /guided-intake-v1\.js\?v=1\.1\.1/);
  assert.match(homeHtml, /pilot-feedback-ui\.js\?v=1\.1\.1/);
  assert.ok(homeHtml.indexOf(intake) < homeHtml.indexOf(bridge));
  assert.ok(homeHtml.indexOf(bridge) < homeHtml.indexOf(home));
  assert.ok(homeHtml.indexOf(home) < homeHtml.indexOf(feedback));
});
