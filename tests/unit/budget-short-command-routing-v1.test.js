import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function loadIntentFirstRouting() {
  const source = await readFile('assets/js/core/media-routing-overrides.js', 'utf8');
  const registry = [
    { moduleId:'GP002', transactionTypes:['legal'], title:'กฎหมายและข้อบัญญัติ' },
    { moduleId:'GP004', transactionTypes:['planning-budget'], title:'แผน โครงการ และงบประมาณ' },
    { moduleId:'GP005', transactionTypes:['finance'], title:'การเงินและการคลัง' },
    { moduleId:'GP012', transactionTypes:['public-relations'], title:'ประชาสัมพันธ์' }
  ];
  const baseRouteRequest = request => {
    const text = String(request || '');
    const moduleId = /เบิกค่าเดินทาง/.test(text) ? 'GP005' : /โพสต์/.test(text) ? 'GP012' : 'GP002';
    return Object.freeze({ primaryModule:moduleId, moduleId, modules:Object.freeze([moduleId]), transactionType:registry.find(item=>item.moduleId===moduleId)?.transactionTypes?.[0] || 'general', assistant:registry.find(item=>item.moduleId===moduleId), confidence:.8, fallback:false, ambiguous:false, reason:'stub-base' });
  };
  const core = {
    PROMPT_REGISTRY: registry,
    routeRequest: baseRouteRequest,
    routeTransaction(sharedContext) {
      const base = baseRouteRequest(sharedContext?.facts || '');
      return Object.freeze({ ...base, context:sharedContext });
    }
  };
  const window = { GovPromptCore:core, addEventListener(){} };
  vm.runInNewContext(source, { window, console }, { filename:'media-routing-overrides.js' });
  return window.GovPromptCore;
}

test('short Thai budget-draft commands route to GP004 planning-budget', async () => {
  const core = await loadIntentFirstRouting();
  for (const query of [
    'ทำร่างงบปี 70',
    'ร่างงบ ปี 2570',
    'จัดทำงบประมาณปี 2570'
  ]) {
    const route = core.routeRequest(query);
    assert.equal(route.primaryModule, 'GP004', query);
    assert.equal(route.transactionType, 'planning-budget', query);
    assert.equal(route.reason, 'intent-first:budget-draft', query);
  }
});

test('routeTransaction applies the same budget-draft guardrail', async () => {
  const core = await loadIntentFirstRouting();
  const query = 'ทำร่างงบปี 70';
  const route = core.routeTransaction({ facts:query, desiredOutput:query, specialFlags:[] });
  assert.equal(route.primaryModule, 'GP004');
  assert.equal(route.transactionType, 'planning-budget');
});

test('budget guardrail does not steal legal, finance, or media intents', async () => {
  const core = await loadIntentFirstRouting();
  assert.equal(core.routeRequest('หน่วยงานท้องถิ่นมีอำนาจทำโครงการได้ไหม').primaryModule, 'GP002');
  assert.equal(core.routeRequest('เบิกค่าเดินทางได้ไหม').primaryModule, 'GP005');
  assert.equal(core.routeRequest('ทำโพสต์ประชาสัมพันธ์โครงการ').primaryModule, 'GP012');
});
