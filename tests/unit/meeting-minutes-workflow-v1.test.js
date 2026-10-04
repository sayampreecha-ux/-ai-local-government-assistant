import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {
  buildWorkflowRuntimeView,
  buildWorkflowPromptBlock,
  isMeetingMinutesDraftRequest,
  resolveMeetingMinutesType
} from '../../assets/js/core/government-workflow-runtime-v5.js';

async function loadBrowserCore(files) {
  const sandbox = {
    window: { GovPromptCore: {} },
    location: { pathname: '/' },
    document: undefined
  };
  for (const file of files) {
    vm.runInNewContext(await readFile(file, 'utf8'), sandbox, { filename: file });
  }
  return sandbox.window.GovPromptCore;
}

async function loadRouter() {
  return loadBrowserCore([
    'assets/js/core/shared-context.js',
    'assets/js/core/prompt-registry.js',
    'assets/js/core/transaction-router.js',
    'assets/js/core/router-regression-overrides.js',
    'assets/js/core/hybrid-intent-classifier.js',
    'assets/js/core/router-real-query-hotfix.js'
  ]);
}

test('TEST 1: council meeting report drafts immediately without councilAuthority gate', () => {
  const view = buildWorkflowRuntimeView({ query: 'ทำรายงานประชุมสภา' });
  assert.equal(view.status, 'draft-available');
  assert.equal(view.primary.workflowId, 'gov.council');
  assert.equal(view.primary.workflowStatus, 'draft-available/facts-pending');
  assert.equal(view.primary.currentStage.id, 'minutes-draft');
  assert.equal(view.meetingMinutes.authorityGateRequiredForDraft, false);
  assert.ok(!view.primary.missingOfficialEvidence.includes('councilAuthority'));
});

test('TEST 2: audio request uses source-first policy and never claims audio support', async () => {
  const core = await loadBrowserCore(['assets/js/core/tool-routing-policy.js']);
  const plan = core.createToolRoutingPlan({ question: 'มีไฟล์เสียงประชุม ทำรายงานให้หน่อย' });
  assert.equal(plan.workflowId, 'gov.correspondence:meeting-minutes-draft');
  assert.equal(plan.flags.needsCurrentWeb, false);
  assert.ok(plan.instructions.some(line => /ตรวจว่า environment\/AI ปลายทางรองรับการอ่านเสียงจริง/.test(line)));
  assert.ok(plan.instructions.some(line => /ไม่เรียก Web Search/.test(line)));
});

test('TEST 3: transcript plus agenda remains draft-available and prompt says draft first', () => {
  const query = 'ทำรายงานการประชุม จาก transcript และระเบียบวาระที่ให้มาครบแล้ว';
  const view = buildWorkflowRuntimeView({ query });
  const block = buildWorkflowPromptBlock(view);
  assert.equal(view.status, 'draft-available');
  assert.equal(view.primary.workflowId, 'gov.correspondence');
  assert.equal(view.meetingMinutes.meetingType, 'general');
  assert.match(block, /โครงสร้างกรณีประชุมทั่วไป/);
  assert.match(block, /ถ้ามีข้อมูลพอ ให้สร้าง “ร่างรายงานการประชุม” ทันที/);
  assert.match(block, /Working Transcript/);
  assert.match(block, /Official-style Meeting Minutes/);
});

test('TEST 4: unidentified speakers must not be guessed', () => {
  const block = buildWorkflowPromptBlock(buildWorkflowRuntimeView({ query: 'ถอดประชุมและทำรายงานการประชุม' }));
  assert.match(block, /ห้ามระบุตัวบุคคลจากเสียง/);
  assert.match(block, /UNIDENTIFIED/);
  assert.match(block, /ผู้พูดที่ 1/);
});

test('TEST 5: missing vote count must not create numbers', () => {
  const block = buildWorkflowPromptBlock(buildWorkflowRuntimeView({ query: 'ทำรายงานการประชุม ที่ประชุมเห็นชอบตามที่เสนอ' }));
  assert.match(block, /ห้ามเติมจำนวนเสียง/);
  assert.match(block, /เห็นชอบตามที่เสนอ/);
});

test('TEST 6: unclear resolution must be UNVERIFIED and marked for review', () => {
  const block = buildWorkflowPromptBlock(buildWorkflowRuntimeView({ query: 'ทำรายงานการประชุม มติฟังไม่ชัด' }));
  assert.match(block, /\[ยังต้องตรวจสอบจากต้นฉบับ\]/);
  assert.match(block, /UNVERIFIED/);
  assert.match(block, /\[ฟังไม่ชัด\]/);
});

test('TEST 7: legality question exits draft mode and enters council Authority/Evidence Gate', async () => {
  const query = 'มตินี้ชอบด้วยกฎหมายไหม';
  assert.equal(isMeetingMinutesDraftRequest(query), false);
  const router = await loadRouter();
  assert.equal(router.routeRequest(query).primaryModule, 'GP013');
  const view = buildWorkflowRuntimeView({ query });
  assert.ok(view.workflowIds.includes('gov.council'));
  assert.notEqual(view.status, 'draft-available');
  assert.equal(view.primary.workflowId, 'gov.council');
  assert.equal(view.primary.currentStage.id, 'matter-authority');
  assert.ok(view.primary.missingEvidence.includes('councilAuthority'));
});

test('TEST 8: general meeting intents route to GP001 while council meeting intents route to GP013', async () => {
  const router = await loadRouter();
  for (const query of ['สรุปประชุม', 'ทำรายงานการประชุม', 'จัดรายงานประชุมจากบันทึกนี้', 'ทำรายงานการประชุมคณะกรรมการ']) {
    assert.equal(router.routeRequest(query).primaryModule, 'GP001', query);
    assert.equal(resolveMeetingMinutesType(query), 'general', query);
  }
  for (const query of ['ทำรายงานประชุมสภา', 'ทำรายงานการประชุมสภาท้องถิ่น', 'สรุปประชุมสภาเทศบาล', 'ถอดเสียงประชุมสภา อบต.']) {
    assert.equal(router.routeRequest(query).primaryModule, 'GP013', query);
    assert.equal(resolveMeetingMinutesType(query), 'council', query);
    const view = buildWorkflowRuntimeView({ query });
    assert.equal(view.primary.workflowId, 'gov.council', query);
    assert.equal(view.meetingMinutes.meetingType, 'council', query);
    assert.match(buildWorkflowPromptBlock(view), /โครงสร้างกรณีประชุมสภาท้องถิ่น/);
  }
});

test('TEST 9: mobile menu shows meeting action and preserves collapsed single-open navigation', async () => {
  const [bridge, accordion] = await Promise.all([
    readFile('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8'),
    readFile('assets/js/ui/assistant-catalog-accordion-v1.js', 'utf8')
  ]);
  assert.match(bridge, /📝 ทำรายงานการประชุม/);
  assert.match(bridge, /🏛️ ทำรายงานการประชุมสภาท้องถิ่น/);
  assert.doesNotMatch(bridge, /label: '📝 ทำรายงานการประชุม', description:/);
  assert.doesNotMatch(bridge, /label: '🏛️ ทำรายงานการประชุมสภาท้องถิ่น', description:/);
  assert.match(bridge, /forceIntake: false/);
  assert.match(accordion, /collapseOthers/);
  assert.match(accordion, /@media\(max-width:620px\)/);
  assert.match(accordion, /grid-template-columns:minmax\(0,1fr\)/);
});

test('TEST 10: desktop and iPad share the same meeting capability without duplicate module IDs', async () => {
  const [bridge, accordion, registry] = await Promise.all([
    readFile('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8'),
    readFile('assets/js/ui/assistant-catalog-accordion-v1.js', 'utf8'),
    readFile('assets/js/core/prompt-registry.js', 'utf8')
  ]);
  assert.equal((bridge.match(/label: '📝 ทำรายงานการประชุม'/g) || []).length, 1);
  assert.equal((bridge.match(/label: '🏛️ ทำรายงานการประชุมสภาท้องถิ่น'/g) || []).length, 1);
  assert.match(accordion, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(accordion, /@media\(max-width:959px\) and \(min-width:621px\)/);
  assert.match(registry, /\['GP012', 'ผู้ช่วยประชาสัมพันธ์', 'public-relations'\]/);
  assert.match(registry, /\['GP013', 'ผู้ช่วยงานสภาท้องถิ่น', 'council'\]/);
});

test('meeting-minutes output router selects official minutes contract', async () => {
  const core = await loadBrowserCore(['assets/js/core/output-router.js']);
  const output = core.routeOutput('ทำรายงานประชุมสภา', { moduleId: 'GP013' }, {});
  assert.equal(output.id, 'meeting_minutes');
  assert.equal(output.format, 'meeting-minutes');
  assert.ok(output.instructions.some(line => /VERIFIED, PARTIAL หรือ UNVERIFIED/.test(line)));
});
