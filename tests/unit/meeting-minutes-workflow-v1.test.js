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

test('TEST 2B: GovPrompt hands audio off to a capable downstream AI without adding internal audio storage or transcription', () => {
  const block = buildWorkflowPromptBlock(buildWorkflowRuntimeView({ query: 'มีไฟล์เสียงประชุม ทำรายงานให้หน่อย' }));
  assert.match(block, /แนบไฟล์เสียงกับ AI ปลายทางที่รองรับโดยตรงพร้อม Prompt นี้/);
  assert.match(block, /GovPrompt ไม่ต้องรับ อัปโหลด เก็บ หรือถอดเสียงแทน AI ปลายทาง/);
  assert.match(block, /Audio → Transcript/);
  assert.match(block, /Human Review/);
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

test('audio handoff requires an actual accessible attachment and preserves both output layers', () => {
  for (const query of ['ทำรายงานประชุมสภา มีไฟล์เสียง', 'ทำรายงานประชุมคณะกรรมการ มีไฟล์เสียง']) {
    const block = buildWorkflowPromptBlock(buildWorkflowRuntimeView({ query }));
    assert.match(block, /แนบไฟล์เสียงกับ AI ปลายทางโดยตรง/);
    assert.match(block, /ไม่ส่งไฟล์เสียงไปยัง AI ปลายทางโดยอัตโนมัติ/);
    assert.match(block, /ตรวจว่ามีไฟล์เสียงแนบจริง/);
    assert.match(block, /อ่านและถอดเสียงไฟล์นั้นได้จริง/);
    assert.match(block, /ห้ามอ้างว่าได้ฟังไฟล์หรือได้ถอดเสียง/);
    assert.match(block, /ห้ามสร้าง transcript จากชื่อไฟล์หรือ metadata/);
    assert.match(block, /ไม่แสดง metadata VERIFIED \/ PARTIAL \/ UNVERIFIED/);
    assert.match(block, /เฉพาะในชั้น 1 Review Evidence/);
    assert.match(block, /ห้ามสร้าง timestamp/);
    assert.match(block, /transcript จากเครื่องมือของ runtime/);
    assert.match(block, /ต้องตรวจสอบที่มาข้อมูล/);
    assert.match(block, /ไม่แยกตามประโยค วาระ หรือบุคคลที่ผู้บรรยายกล่าวถึง/);
    assert.match(block, /ห้ามสร้างผู้พูดที่ 2\/3 จากเนื้อหาบรรยาย/);
    assert.match(block, /ลบ VERIFIED \/ PARTIAL \/ UNVERIFIED ทุกตำแหน่งในชั้น 2/);
    assert.match(block, /ห้ามส่งเฉพาะฉบับสะอาด/);
    assert.match(block, /การแจ้งเรื่องหรือกล่าวถึงเรื่องหนึ่งไม่เท่ากับเสนอญัตติ/);
    assert.match(block, /ละหัวข้อนั้นในฉบับสะอาด/);
    assert.match(block, /แยกคำขอ\/ข้อเสนอของผู้พูดออกจากข้อสรุป\/มติ/);
    assert.match(block, /ห้ามอนุมานผู้เสนอจากผู้แจ้งเรื่อง/);
    assert.match(block, /placeholder และคำถามเพิ่มเติม/);
    assert.match(block, /ก่อนส่งคำตอบ ตรวจทุกชั้นและคำถามเพิ่มเติม/);
    assert.match(block, /AI ห้ามรับรองแทนที่ประชุม ลงนาม ลงมติ/);
  }
});

test('profiles keep original agendas and do not invent motions, votes, owners or deadlines', () => {
  const council = buildWorkflowPromptBlock(buildWorkflowRuntimeView({ query: 'ทำรายงานประชุมสภา อบจ.' }));
  assert.match(council, /ระเบียบวาระตามต้นฉบับ/);
  assert.doesNotMatch(council, /ระเบียบวาระที่ [1-5]/);
  for (const meeting of ['ผู้บริหาร', 'หัวหน้าส่วน', 'คณะกรรมการ', 'คณะอนุกรรมการ', 'คณะทำงาน', 'โครงการ', 'ประจำเดือน']) {
    const view = buildWorkflowRuntimeView({ query: `ทำรายงานประชุม${meeting}\nบันทึกย่อ: หารือแผนงาน` });
    assert.equal(view.meetingMinutes.meetingType, 'general');
    const block = buildWorkflowPromptBlock(view);
    assert.match(block, /ไม่เพิ่มญัตติหรือคะแนนเสียงเมื่อไม่มีหลักฐาน/);
    assert.match(block, /ข้อสั่งการ ผู้รับผิดชอบ deadline/);
    assert.match(block, /เรื่องติดตาม เท่าที่มีหลักฐาน/);
  }
});

test('explicit legal questions alongside minutes never receive the draft-only exemption', async () => {
  const core = await loadBrowserCore(['assets/js/core/tool-routing-policy.js']);
  for (const question of [
    'มตินี้ชอบด้วยกฎหมายหรือไม่',
    'ญัตตินี้เสนอได้หรือไม่',
    'คะแนนเสียงเพียงพอหรือไม่',
    'องค์ประชุมครบหรือไม่',
    'ประธานดำเนินการถูกต้องหรือไม่',
    'คณะกรรมการมีอำนาจมีมตินี้หรือไม่'
  ]) {
    const query = `ทำรายงานประชุมสภา แล้วตรวจว่า ${question}`;
    assert.equal(isMeetingMinutesDraftRequest(query), false, query);
    assert.equal(buildWorkflowRuntimeView({ query }).meetingMinutes, undefined, query);
    assert.ok(!core.createToolRoutingPlan({ question: query }).workflowId?.endsWith(':meeting-minutes-draft'), query);
  }
});

test('actual menu handoff text preserves general versus council profile', async () => {
  const bridge = await readFile('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8');
  const router = await loadRouter();
  for (const [title, profile, moduleId] of [
    ['ทำรายงานการประชุมทั่วไป', 'general', 'GP001'],
    ['ทำรายงานการประชุมสภาท้องถิ่น', 'council', 'GP013']
  ]) {
    const start = bridge.indexOf(`if (normalize(button.dataset.prompt) === normalize('${title}'))`);
    assert.ok(start >= 0);
    const handler = bridge.slice(start, bridge.indexOf('return;', start));
    const arrayStart = handler.indexOf('openResultPage([') + 'openResultPage('.length;
    const arrayEnd = handler.indexOf("].join('\\n')") + 1;
    const query = vm.runInNewContext(handler.slice(arrayStart, arrayEnd)).join('\n');
    const view = buildWorkflowRuntimeView({ query });
    assert.equal(view.meetingMinutes.meetingType, profile);
    assert.equal(router.routeRequest(query).primaryModule, moduleId);
    assert.match(handler, /forceIntake: false/);
  }
});
