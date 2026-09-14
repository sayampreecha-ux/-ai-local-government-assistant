import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { applicableEvidence } from '../../scripts/fixtures/applicable-authority.mjs';

const sandbox = { window: {}, URL, Date, console,
  document: { readyState: 'loading', addEventListener() {} }, location: { pathname: '/index.html' } };
for (const file of ['shared-context', 'prompt-registry', 'transaction-router', 'output-router',
  'tool-routing-policy', 'prompt-orchestrator', 'privacy-guard', 'source-intelligence',
  'freshness-engine', 'official-source-registry', 'citation-engine', 'official-search-connector']) {
  vm.runInNewContext(readFileSync(`assets/js/core/${file}.js`, 'utf8'), sandbox);
}
const core = sandbox.window.GovPromptCore;
const questions = [
  'การเบิกจ่ายค่า K',
  'ค่า K เบิกได้ไหม',
  'ค่า K งานก่อสร้างปี 2569',
  'ค่าเช่าบ้านข้าราชการท้องถิ่น',
  'ย้ายจังหวัดแล้วยังเบิกค่าเช่าซื้อบ้านเดิมได้ไหม',
  'ค่าใช้จ่ายเดินทางไปราชการ',
  'แปรญัตติข้อบัญญัติงบประมาณได้ไหม',
  'อันนี้เบิกได้ไหม'
];
function copiedPrompt(question, context = {}) {
  const shared = core.createSharedContext({ facts: question, ...context });
  const bundle = core.createGovernmentPrompt({ question, context: shared, route: core.routeTransaction(shared) });
  return { ...bundle, copied: core.sanitizeExternalContent(bundle.prompt + '\n'
    + core.formatToolRoutingInstructions(core.createToolRoutingPlan({ question }))).safeText };
}
function fullEvidence(question = questions[0]) {
  const gate = core.buildCasePrecedentGate(question);
  return {
    retrievalCaseKey: gate.caseKey,
    applicableAuthority: applicableEvidence(),
    currentRule: 'VERIFIED', currentRuleChecks: [...gate.requiredCurrentRuleChecks],
    officialPrecedent: 'VERIFIED', searchLevelsCompleted: ['LEVEL_1_DIRECT_FACT_SEARCH'],
    precedentVerification: [...gate.requiredPrecedentVerification],
    caseMatch: 'ASSESSED', caseMatchLevel: 'HIGH MATCH', legalVersion: 'VERIFIED',
    newerOrConflictingAuthority: 'CHECKED_NONE_FOUND', contraryEvidenceCheck: 'CHECKED_NONE_FOUND',
    ruleInterpretationConfidence: 'SUFFICIENT'
  };
}

for (const [i, question] of questions.entries()) test(`required regression ${i + 1}: ${question}`, () => {
  const { casePrecedentGate: gate, copied } = copiedPrompt(question);
  assert.equal(gate.required, true);
  assert.equal(gate.searchable, i < 7);
  assert.equal(gate.decidable, false);
  assert.equal(gate.decisionLock, 'ON');
  assert.equal(gate.humanApprovalRequired, true);
  if (i < 7) {
    assert.equal(gate.needsScopeClarification, false);
    assert.equal(gate.nextAction, 'EXECUTE_CURRENT_RULE_CHECK');
    assert.ok(gate.searchQueries.length > 0);
    assert.notEqual(gate.workflowStatus, 'BLOCKED_MISSING_SCOPE');
    assert.doesNotMatch(copied, /nextAction=CLARIFY_DECISIVE_SCOPE|ก่อนค้นเชิงลึก:/);
    assert.ok(gate.ruleCaseMap.unknown.length > 0, 'missing facts must not prevent search');
    assert.match(copied, /ข้อมูลไม่พอสำหรับตัดสิน ไม่ได้หมายความว่าข้อมูลไม่พอสำหรับเริ่มค้น/);
    assert.match(copied, /ห้ามเลือกเอกสารใหม่ที่สุดโดยอัตโนมัติ/);
    assert.match(copied, /ตอบหลักทั่วไปที่ยืนยันแล้วก่อน/);
  } else {
    assert.equal(gate.needsScopeClarification, true);
    assert.equal(gate.workflowStatus, 'BLOCKED_MISSING_SCOPE');
    assert.equal(gate.nextAction, 'CLARIFY_DECISIVE_SCOPE');
    assert.equal(gate.searchQueries.length, 0);
  }
  for (const name of ['Decision Gate', 'Multi-condition Gate', 'Legal Version Gate', 'Evidence Gate',
    'Applicable Authority Check', 'Contrary Evidence Check', 'Human Approval']) assert.ok(copied.includes(name), name);
});

test('ambiguous actions stay ambiguous regardless of length or organization defaults', () => {
  for (const question of ['ทำแบบนี้ได้ไหม', 'ข้าราชการ อบจ. อันนี้เบิกได้ไหม', 'กรุณาช่วยตรวจสอบพิจารณาว่ากรณีนี้เบิกได้ไหมครับ']) {
    const gate = core.buildCasePrecedentGate(question, { organizationType: 'อบจ.', owningUnit: 'การคลัง' });
    assert.equal(gate.searchable, false, question);
    assert.equal(gate.nextAction, 'CLARIFY_DECISIVE_SCOPE', question);
  }
});

test('current facts resolve an elliptical question; attachment names require reading first', () => {
  const gate = core.buildCasePrecedentGate(questions[7], { facts: 'คำขอค่า K งานก่อสร้าง' });
  assert.equal(gate.searchable, true);
  assert.ok(gate.searchQueries.every(query => query.includes('ค่า K')));
  const documented = core.buildCasePrecedentGate(questions[7], {
    facts: questions[7], documents: 'คำขอค่าเช่าบ้านข้าราชการท้องถิ่น'
  });
  assert.equal(documented.searchable, true);
  assert.ok(documented.searchQueries.every(query => query.includes('ค่าเช่าบ้าน')));
  for (const context of [{ hasAttachments: true }, { documents: 'facts.pdf' }]) {
    const pending = core.buildCasePrecedentGate(questions[7], context);
    assert.equal(pending.searchable, false);
    assert.equal(pending.nextAction, 'READ_CURRENT_CASE_DOCUMENTS');
    assert.equal(pending.searchQueries.length, 0);
  }
});

test('each new case resets vocabulary; unrelated template/context terms cannot enter queries', () => {
  const oldFacts = 'การเดินทางไปราชการ การแต่งตั้ง การรับการคัดเลือก';
  const first = core.buildCasePrecedentGate(oldFacts);
  const second = core.buildCasePrecedentGate(questions[0], {
    facts: oldFacts, currentStage: 'การแต่งตั้ง', owningUnit: oldFacts,
    workflow: first, template: first.searchConcepts
  });
  assert.doesNotMatch(JSON.stringify(second.searchConcepts), /การเดินทางไปราชการ|การแต่งตั้ง|การรับการคัดเลือก/);
  const third = core.buildCasePrecedentGate(questions[3]);
  assert.doesNotMatch(JSON.stringify(third.searchConcepts), /ค่า K|งานก่อสร้าง|สัญญาแบบปรับราคาได้/);
  assert.equal(core.buildCasePrecedentGate(questions[7]).nextAction, 'CLARIFY_DECISIVE_SCOPE');
});

test('facts and documents belonging to this subject remain available for decision assessment', () => {
  const gate = core.buildCasePrecedentGate(questions[1], {
    facts: 'ข้าราชการ อบจ. ตรวจสัญญาก่อสร้างปี 2564',
    documents: 'สัญญาก่อสร้างระบุส่งมอบวันที่ 15 มกราคม 2565'
  });
  assert.match(gate.searchConcepts.factLanguage, /2564/);
  assert.match(gate.searchConcepts.factLanguage, /2565/);
  assert.equal(gate.ruleCaseMap.known.includes('TIME'), true);
  assert.equal(gate.ruleCaseMap.known.includes('WHO'), true);
});

test('identifier chaining uses opened current-case sources; stale evidence is reset', () => {
  const evidence = fullEvidence();
  const identifier = 'TEST-ONLY-DOCUMENT-REFERENCE';
  evidence.retrievalLeads = [{ type: 'documentNumber', value: identifier, sourceId: 'rule' }];
  const current = core.buildCasePrecedentGate(questions[0], {}, 'HIGH', evidence);
  assert.ok(current.identifierQueries.some(query => query.includes(identifier)));
  const other = core.buildCasePrecedentGate(questions[3], {}, 'HIGH', evidence);
  assert.doesNotMatch(JSON.stringify(other.searchConcepts), /TEST-ONLY-DOCUMENT-REFERENCE/);
  assert.equal(other.currentRule, 'NOT_VERIFIED');
  assert.equal(other.decisionLock, 'ON');
  evidence.applicableAuthority.sources[0].opened = false;
  assert.equal(core.buildCasePrecedentGate(questions[0], {}, 'HIGH', evidence).identifierQueries.length, 0);
});

test('general authority can be sufficient before personal timeline and facts are known', () => {
  const evidence = fullEvidence();
  delete evidence.applicableAuthority.reviews.TIME;
  delete evidence.applicableAuthority.reviews.FACT_MATCH;
  evidence.currentRuleChecks = evidence.currentRuleChecks.filter(key => key !== 'dateContextMatched');
  evidence.decisiveFacts = [
    { key: 'eventDate', status: 'MISSING', changesOutcome: true, question: 'เหตุเกิดเมื่อใด' },
    { key: 'name', status: 'MISSING', changesOutcome: false, question: 'ชื่ออะไร' }
  ];
  const gate = core.buildCasePrecedentGate(questions[0], {}, 'HIGH', evidence);
  assert.equal(gate.decisionSufficiency.authorityStatus, 'AUTHORITY_SUFFICIENT');
  assert.equal(gate.decisionSufficiency.factsStatus, 'FACTS_INSUFFICIENT');
  assert.equal(gate.workflowStatus, 'AUTHORITY_SUFFICIENT_FACTS_PENDING');
  assert.equal(gate.nextAction, 'EXPLAIN_RULE_THEN_ASK_DECISIVE_FACTS');
  assert.equal(gate.decisionLock, 'ON');
  assert.equal(gate.searchable, true);
  assert.deepEqual(gate.decisionSufficiency.missingDecisiveFacts.map(f => f.key).join(','), 'eventDate');
  assert.deepEqual([...gate.allowedFinalDecisions], ['⚠️ ได้โดยมีเงื่อนไข', '🔎 หลักฐานยังไม่พอที่จะฟันธง']);
});

test('complete evidence permits only the existing final statuses and still requires human approval', () => {
  const gate = core.buildCasePrecedentGate(questions[0], {}, 'HIGH', fullEvidence());
  assert.equal(gate.decisionSufficiency.authoritySufficient, true);
  assert.equal(gate.decisionSufficiency.factsSufficient, true);
  assert.equal(gate.decidable, true);
  assert.equal(gate.nextAction, 'HUMAN_REVIEW');
  assert.equal(gate.humanApprovalRequired, true);
  assert.deepEqual([...gate.allowedFinalDecisions], ['✅ ได้', '❌ ไม่ได้', '⚠️ ได้โดยมีเงื่อนไข', '🔎 หลักฐานยังไม่พอที่จะฟันธง']);
});

test('missing decisive facts cannot unlock through a previously verified authority review', () => {
  for (const fact of [{ status: 'MISSING' }, { status: 'KNOWN', value: '' }]) {
    const gate = core.buildCasePrecedentGate(questions[0], {}, 'HIGH', {
      ...fullEvidence(), decisiveFacts: [{ key: 'contractTerm', changesOutcome: true, ...fact }]
    });
    assert.equal(gate.decidable, false);
    assert.equal(gate.nextAction, 'EXPLAIN_RULE_THEN_ASK_DECISIVE_FACTS');
  }
});

for (const check of ['laterRuleSearch', 'temporaryMeasuresAndExceptions', 'expiryAndExtensions', 'scopeOfApplication', 'priorEventsEffect']) {
  test(`temporal review cannot be skipped: ${check}`, () => {
    const evidence = fullEvidence();
    evidence.currentRuleChecks = evidence.currentRuleChecks.filter(key => key !== check);
    const gate = core.buildCasePrecedentGate(questions[0], {}, 'HIGH', evidence);
    assert.equal(gate.decisionSufficiency.authoritySufficient, false);
    assert.equal(gate.decidable, false);
    assert.equal(gate.nextAction, 'EXECUTE_CURRENT_RULE_CHECK');
  });
}

test('legacy quality gates still independently prevent final decisions', () => {
  for (const patch of [
    { contraryEvidenceCheck: 'FOUND_UNRESOLVED' }, { caseMatchLevel: 'LOW MATCH' },
    { legalVersion: 'NOT_VERIFIED' }, { officialPrecedent: 'NOT_SEARCHED' },
    { ruleInterpretationConfidence: 'INSUFFICIENT' }, { newerOrConflictingAuthority: 'FOUND' },
    { unresolvedLeads: true }
  ]) {
    const gate = core.buildCasePrecedentGate(questions[0], {}, 'HIGH', { ...fullEvidence(), ...patch });
    assert.equal(gate.decisionLock, 'ON', JSON.stringify(patch));
  }
});

test('actual search connector does not add route vocabulary to provider requests', async () => {
  const originalRoute = core.routeRequest;
  try {
    core.routeRequest = () => ({ primaryModule: 'GP006', modules: ['GP006'] });
    const requests = [];
    const connector = core.createOfficialSearchConnector({ fetcher: async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return { ok: true, json: async () => ({ results: [] }) };
    } });
    await connector.search(questions[0]);
    assert.ok(requests.length > 0);
    for (const request of requests) {
      assert.match(request.query, /ค่า K/);
      assert.doesNotMatch(request.query, /เดินทาง|แต่งตั้ง|คัดเลือก|เลื่อนเงินเดือน|โอนย้าย/);
    }
  } finally { core.routeRequest = originalRoute; }
});

test('new retrieval flow preserves temporal applicability and contains no permanent legal answer', () => {
  const gate = core.buildCasePrecedentGate(questions[2]);
  assert.deepEqual([...gate.retrievalFlow], ['Current Rule', 'Later Rule/Amendment', 'Temporary Measure/Exception',
    'Expiry/Transition', 'Official Guidance/Precedent when relevant', 'Conflict Check',
    'Contrary Evidence Check', 'Applicable Rule', 'Decision Facts', 'Final Decision']);
  assert.ok(gate.searchQueries.some(query => /มาตรการชั่วคราว.*สิ้นสุด.*ขยายเวลา/.test(query)));
  assert.doesNotMatch(JSON.stringify(gate), /(?:2|4)\s*%|ว\s*\d{3,}/);
});
