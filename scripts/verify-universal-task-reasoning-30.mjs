import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {} };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-orchestrator.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;
assert.equal(core.UNIVERSAL_TASK_REASONING_VERSION, '7.1');
assert.equal(typeof core.planUniversalTask, 'function');
assert.equal(typeof core.buildCasePrecedentGate, 'function');

const cases = [
  ['ร่างหนังสือขอความร่วมมือประชาสัมพันธ์โครงการ', 'draft', 'official-document', 'records'],
  ['ทำโครงการวันเด็ก', 'draft', 'project', 'education'],
  ['ทำโครงการบวชสามเณรภาคฤดูร้อน', 'draft', 'project', 'education'],
  ['ทำโครงการสัปดาห์วิทยาศาสตร์', 'draft', 'project', 'education'],
  ['จัดการแข่งขันกีฬาเยาวชน', 'plan', 'general-answer', 'education'],
  ['ร่าง TOR ซื้อรถส่วนกลาง', 'draft', 'procurement', 'procurement'],
  ['ตรวจ TOR ว่าล็อกสเปกไหม', 'verify', 'procurement', 'procurement'],
  ['วิเคราะห์ระเบียบเบิกค่าเดินทางล่าสุด', 'analyze', 'finance', 'finance'],
  ['เบิกค่าแท็กซี่ได้ไหม', 'analyze', 'finance', 'finance'],
  ['สรุปงบประมาณแต่ละโครงการเป็นตาราง', 'summarize', 'project', 'planning-budget'],
  ['ทำตารางรายการเบิกจ่าย', 'create', 'finance', 'finance'],
  ['ร่างคำกล่าวเปิดงานวันเด็ก', 'draft', 'speech', 'education'],
  ['ทำโปสเตอร์งานวันเด็ก', 'create', 'public-content', 'public-relations'],
  ['ทำปกวิสัยทัศน์ผู้บริหาร', 'create', 'public-content', 'public-relations'],
  ['เขียนวิสัยทัศน์ผู้บริหาร', 'draft', 'general-answer', 'executive'],
  ['วิเคราะห์ข้อกฎหมายการใช้เงินสะสม', 'analyze', 'finance', 'legal'],
  ['ตรวจเอกสารเบิกจ่ายก่อนเสนออนุมัติ', 'verify', 'finance', 'finance'],
  ['วางแผนซ่อมถนนหลังน้ำท่วม', 'plan', 'general-answer', 'engineering'],
  ['สรุปปัญหาหน้างานก่อสร้างเสนอผู้บริหาร', 'summarize', 'general-answer', 'engineering'],
  ['ร่างบันทึกขอเพิ่มอัตรากำลัง', 'draft', 'official-document', 'human-resources'],
  ['วิเคราะห์กรณีลาป่วยไม่มีใบรับรองแพทย์', 'analyze', 'general-answer', 'human-resources'],
  ['ทำโครงการส่งเสริมสุขภาพผู้สูงอายุ', 'draft', 'project', 'public-health'],
  ['ตรวจการจัดซื้อยาและเวชภัณฑ์', 'verify', 'procurement', 'public-health'],
  ['สรุปญัตติประชุมสภาท้องถิ่น', 'summarize', 'general-answer', 'council'],
  ['ร่างข่าวประชาสัมพันธ์เปิดศูนย์บริการ', 'draft', 'public-content', 'public-relations'],
  ['ตรวจสอบภายในเอกสารเบิกจ่ายมีความเสี่ยงอะไร', 'verify', 'finance', 'audit'],
  ['ทำ executive summary โครงการ 1 หน้า', 'summarize', 'project', 'executive'],
  ['คำนวณร้อยละผลการดำเนินงาน', 'calculate', 'general-answer', null],
  ['ระเบียบนี้ยังใช้ได้หรือไม่', 'analyze', 'legal-analysis', 'legal'],
  ['วันนี้ทำอะไรบ้าง', 'answer', 'general-answer', null]
];

for (const [question, action, deliverable, discipline] of cases) {
  const plan = core.planUniversalTask(question);
  assert.equal(plan.action, action, `${question}: action`);
  assert.equal(plan.deliverable, deliverable, `${question}: deliverable`);
  assert.equal(plan.routeIsAdvisory, true, `${question}: route advisory`);
  if (discipline) assert.ok(plan.disciplines.includes(discipline), `${question}: discipline ${discipline}`);
}

for (const question of ['ระเบียบนี้ยังใช้ได้หรือไม่', 'วิเคราะห์ระเบียบเบิกค่าเดินทางล่าสุด', 'ร่าง TOR ซื้อรถส่วนกลาง']) {
  assert.equal(core.planUniversalTask(question).evidenceMode, 'verify-current-primary-source', `${question}: evidence freshness`);
}

const context = core.createSharedContext({ facts: 'ทำโครงการบวชสามเณร', desiredOutput: 'ร่างโครงการพร้อมใช้' });
const bundle = core.createGovernmentPrompt({ question: 'ทำโครงการบวชสามเณร', route: null, context });
assert.equal(bundle.route.moduleId, 'GENERAL');
assert.equal(bundle.taskPlan.deliverable, 'project');
assert.ok(bundle.prompt.includes('GovPrompt Prompt Standard v7.1'));
assert.ok(bundle.prompt.includes('Universal Task Reasoning'));
assert.ok(bundle.prompt.includes('Router เป็นเพียงคำแนะนำ'));
assert.ok(bundle.prompt.includes('ส่งชิ้นงานหรือข้อสรุปที่ใช้ต่อได้ก่อน'));
assert.ok(bundle.prompt.includes('ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง'));

const precedentQuestion = 'ข้าราชการ อบจ. ผู้ผ่านการสรรหาสายงานผู้บริหาร เดินทางไปรายงานตัวครั้งแรกเพื่อเลือก อบจ. ที่ประสงค์จะได้รับการแต่งตั้ง เบิกค่าใช้จ่ายในการเดินทางได้หรือไม่ ตามข้อ 14(2) เรื่องรับการคัดเลือก';
const precedentContext = core.createSharedContext({ organizationType: 'องค์การบริหารส่วนจังหวัด', currentStage: 'รายงานตัวครั้งแรกเพื่อเลือก อบจ.', facts: precedentQuestion, desiredOutput: 'วินิจฉัยสิทธิเบิกค่าเดินทาง' });
const precedentBundle = core.createGovernmentPrompt({ question: precedentQuestion, route: null, context: precedentContext });
assert.equal(precedentBundle.casePrecedentGate.required, true);
assert.equal(precedentBundle.casePrecedentGate.status, 'blocked-pending-case-precedent-search');
assert.equal(precedentBundle.casePrecedentGate.interpretation_issue, true);
assert.equal(precedentBundle.casePrecedentGate.gateVersion, '3.1');
assert.equal(precedentBundle.casePrecedentGate.retrievalGateVersion, '1.0');
assert.equal(core.OFFICIAL_PRECEDENT_GATE_VERSION, '3.1');
assert.equal(core.OFFICIAL_AUTHORITY_RETRIEVAL_GATE_VERSION, '1.0');
assert.equal(core.PROMPT_STANDARD_VERSION, '7.8.0');
assert.equal(precedentBundle.casePrecedentGate.currentRule, 'NOT_VERIFIED');
assert.equal(precedentBundle.casePrecedentGate.officialPrecedent, 'NOT_SEARCHED');
assert.equal(precedentBundle.casePrecedentGate.caseMatch, 'NOT_ASSESSED');
assert.equal(precedentBundle.casePrecedentGate.legalVersion, 'NOT_VERIFIED');
assert.equal(precedentBundle.casePrecedentGate.newerOrConflictingAuthority, 'NOT_CHECKED');
assert.equal(precedentBundle.casePrecedentGate.contraryEvidenceCheck, 'NOT_CHECKED');
assert.equal(precedentBundle.casePrecedentGate.searchStatus, 'NOT_SEARCHED');
assert.equal(precedentBundle.casePrecedentGate.ruleInterpretationConfidence, 'NOT_ASSESSED');
assert.equal(precedentBundle.casePrecedentGate.decisionLock, 'ON');
assert.equal(precedentBundle.casePrecedentGate.workflowStatus, 'BLOCKED_CURRENT_RULE_CHECK');
assert.equal(precedentBundle.casePrecedentGate.nextAction, 'EXECUTE_CURRENT_RULE_CHECK');
assert.deepEqual([...precedentBundle.casePrecedentGate.requiredEvidence], ['currentRule', 'officialPrecedent', 'caseMatch', 'legalVersion', 'newerOrConflictingAuthority', 'contraryEvidenceCheck']);
assert.equal(precedentBundle.casePrecedentGate.searchQueries.length, 4);
assert.equal(precedentBundle.casePrecedentGate.searchLadder.length, 4);
assert.deepEqual(Object.keys(precedentBundle.casePrecedentGate.fingerprint), ['actor', 'organization', 'status_or_prior_event', 'current_stage', 'disputed_action', 'claim_or_power', 'legal_issue', 'applicable_rule', 'date_context']);
assert.ok(precedentBundle.casePrecedentGate.searchConcepts.factLanguage);
assert.ok(precedentBundle.casePrecedentGate.searchConcepts.legalLanguage);
assert.ok(precedentBundle.casePrecedentGate.searchConcepts.officialDocumentLanguage.length >= 3);
assert.deepEqual(Object.keys(precedentBundle.casePrecedentGate.ruleCaseMap.entries), ['WHO', 'ORG', 'BEFORE', 'STAGE', 'ACTION', 'RIGHT', 'RULE', 'TIME']);
assert.deepEqual([...precedentBundle.casePrecedentGate.retrievalLoop], ['SEARCH', 'EXTRACT_LEADS', 'FOLLOW_BEST_LEAD', 'UPDATE_SEARCH', 'VERIFY']);
assert.equal(precedentBundle.casePrecedentGate.leadTypes.length, 9);
assert.equal(precedentBundle.casePrecedentGate.hiddenDocumentRecovery.length, 5);
assert.deepEqual([...precedentBundle.casePrecedentGate.allowedFinalDecisions], ['⚠️ ได้โดยมีเงื่อนไข', '🔎 หลักฐานยังไม่พอที่จะฟันธง']);
assert.match(precedentBundle.prompt, /OFFICIAL AUTHORITY RETRIEVAL GATE/);
assert.match(precedentBundle.prompt, /SEARCH FOR THE CASE, NOT JUST THE WORDS/);
assert.match(precedentBundle.prompt, /CURRENT RULE FIRST/);
assert.match(precedentBundle.prompt, /MULTI-ANGLE \+ ADAPTIVE RETRIEVAL LOOP/);
assert.match(precedentBundle.prompt, /HIDDEN-DOCUMENT/);
assert.match(precedentBundle.prompt, /CONTRARY EVIDENCE/);
assert.match(precedentBundle.prompt, /หากมี Web Search ให้ค้นและเปิดหลักฐานเองทันที/);
assert.match(precedentBundle.prompt, /Query 4/);
assert.match(precedentBundle.prompt, /🔎 หลักฐานยังไม่พอที่จะฟันธง/);
assert.ok(precedentBundle.prompt.length < 16_500, `authority prompt is too long: ${precedentBundle.prompt.length}`);

const explicitPrecedent = core.buildCasePrecedentGate('ค้นหนังสือหารือกรณีเทียบเคียงเรื่องนี้', { facts: 'ผู้ใช้ขอแนววินิจฉัยจากหน่วยงานเจ้าของเรื่อง' }, 'HIGH');
assert.equal(explicitPrecedent.interpretation_issue, true);
assert.equal(explicitPrecedent.decisionLock, 'ON');
const interpretationAnalysis = core.buildCasePrecedentGate('วิเคราะห์กฎหมายเกี่ยวกับสิทธิเบิกค่าเดินทาง', {}, 'HIGH');
assert.equal(interpretationAnalysis.interpretation_issue, true);

const currentRuleChecks = ['law', 'rule', 'regulation', 'announcement', 'primaryDirective', 'amendments', 'repealOrReplacement', 'transitionalProvisions', 'effectiveDate', 'dateContextMatched'];
const precedentVerification = ['issuingAuthority', 'documentNumber', 'documentDate', 'title', 'consultedFacts', 'adjudicatedIssue', 'citedRules', 'reasoning', 'conclusion', 'officialSource'];
const levelOne = ['LEVEL_1_DIRECT_FACT_SEARCH'];
const levelOneToThree = ['LEVEL_1_DIRECT_FACT_SEARCH', 'LEVEL_2_LEGAL_OFFICIAL_LANGUAGE_SEARCH', 'LEVEL_3_PRECEDENT_INDEX_RECOVERY'];
const verifiedEvidence = {
  currentRule: 'VERIFIED',
  currentRuleChecks,
  officialPrecedent: 'VERIFIED',
  searchLevelsCompleted: levelOne,
  precedentVerification,
  caseMatch: 'ASSESSED',
  caseMatchLevel: 'HIGH MATCH',
  legalVersion: 'VERIFIED',
  newerOrConflictingAuthority: 'CHECKED_NONE_FOUND',
  contraryEvidenceCheck: 'CHECKED_NONE_FOUND',
  ruleInterpretationConfidence: 'SUFFICIENT'
};
const incompleteCurrentRule = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { currentRule: 'VERIFIED' });
assert.equal(incompleteCurrentRule.currentRule, 'NOT_VERIFIED');
assert.ok(incompleteCurrentRule.evidenceState.validationIssues.includes('CURRENT_RULE_CHECKLIST_INCOMPLETE'));

const currentRuleOnly = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { currentRule: 'VERIFIED', currentRuleChecks });
assert.equal(currentRuleOnly.currentRule, 'VERIFIED');
assert.equal(currentRuleOnly.officialPrecedent, 'NOT_SEARCHED');
assert.equal(currentRuleOnly.workflowStatus, 'BLOCKED_PRECEDENT_SEARCH');
assert.equal(currentRuleOnly.nextAction, 'EXECUTE_OFFICIAL_PRECEDENT_SEARCH');

const unlocked = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', verifiedEvidence);
assert.equal(unlocked.decisionLock, 'OFF');
assert.equal(unlocked.workflowStatus, 'READY_FOR_HUMAN_REVIEW');
assert.equal(unlocked.nextAction, 'HUMAN_REVIEW');
assert.equal(unlocked.humanApprovalRequired, true);

const unverifiedCandidate = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { ...verifiedEvidence, precedentVerification: [] });
assert.equal(unverifiedCandidate.officialPrecedent, 'FOUND_UNVERIFIED');
assert.equal(unverifiedCandidate.decisionLock, 'ON');
assert.equal(unverifiedCandidate.nextAction, 'VERIFY_PRECEDENT_CANDIDATE');
assert.ok(unverifiedCandidate.evidenceState.validationIssues.includes('PRECEDENT_VERIFICATION_INCOMPLETE'));

const incompleteNotFound = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', {
  ...verifiedEvidence,
  officialPrecedent: 'SEARCHED_NOT_FOUND',
  searchLevelsCompleted: levelOne,
  caseMatch: 'NOT_ASSESSED'
});
assert.equal(incompleteNotFound.officialPrecedent, 'SEARCH_INCOMPLETE');
assert.equal(incompleteNotFound.nextAction, 'CONTINUE_ADAPTIVE_PRECEDENT_SEARCH');

const unresolvedIdentifierLead = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', {
  ...verifiedEvidence,
  officialPrecedent: 'SEARCHED_NOT_FOUND',
  searchLevelsCompleted: levelOneToThree,
  identifierLeadDetected: true,
  caseMatch: 'NOT_ASSESSED'
});
assert.equal(unresolvedIdentifierLead.officialPrecedent, 'SEARCH_INCOMPLETE');

const searchedNotFoundUnlocked = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', {
  ...verifiedEvidence,
  officialPrecedent: 'SEARCHED_NOT_FOUND',
  searchLevelsCompleted: levelOneToThree,
  caseMatch: 'NOT_ASSESSED'
});
assert.equal(searchedNotFoundUnlocked.officialPrecedent, 'SEARCHED_NOT_FOUND');
assert.equal(searchedNotFoundUnlocked.caseMatch, 'NOT_ASSESSED');
assert.equal(searchedNotFoundUnlocked.decisionLock, 'OFF');

const identifierLeadCompleted = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', {
  ...verifiedEvidence,
  officialPrecedent: 'SEARCHED_NOT_FOUND',
  searchLevelsCompleted: [...levelOneToThree, 'LEVEL_4_IDENTIFIER_CITATION_CHAINING'],
  identifierLeadDetected: true,
  caseMatch: 'NOT_ASSESSED'
});
assert.equal(identifierLeadCompleted.officialPrecedent, 'SEARCHED_NOT_FOUND');
assert.equal(identifierLeadCompleted.decisionLock, 'OFF');

const hiddenDocumentIncomplete = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', {
  ...verifiedEvidence,
  hiddenDocumentRiskDetected: true,
  hiddenDocumentRecoveryCompleted: false
});
assert.equal(hiddenDocumentIncomplete.searchStatus, 'SEARCH_INCOMPLETE');
assert.equal(hiddenDocumentIncomplete.decisionLock, 'ON');
assert.equal(hiddenDocumentIncomplete.nextAction, 'EXECUTE_HIDDEN_DOCUMENT_RECOVERY');

const lowMatchLocked = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { ...verifiedEvidence, caseMatchLevel: 'LOW MATCH' });
assert.equal(lowMatchLocked.decisionLock, 'ON');
assert.equal(lowMatchLocked.nextAction, 'SEARCH_STRONGER_PRECEDENT_OR_LIMIT_CONCLUSION');

const insufficientConfidence = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { ...verifiedEvidence, ruleInterpretationConfidence: 'INSUFFICIENT' });
assert.equal(insufficientConfidence.decisionLock, 'ON');
assert.equal(insufficientConfidence.workflowStatus, 'BLOCKED_RULE_INTERPRETATION');

const unresolvedConflict = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { ...verifiedEvidence, newerOrConflictingAuthority: 'FOUND' });
assert.equal(unresolvedConflict.decisionLock, 'ON');
assert.equal(unresolvedConflict.workflowStatus, 'BLOCKED_AUTHORITY_CHECK');
const resolvedConflict = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { ...verifiedEvidence, newerOrConflictingAuthority: 'FOUND', authorityAnalysisComplete: true });
assert.equal(resolvedConflict.decisionLock, 'OFF');

const contraryNotChecked = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { ...verifiedEvidence, contraryEvidenceCheck: 'NOT_CHECKED' });
assert.equal(contraryNotChecked.decisionLock, 'ON');
assert.equal(contraryNotChecked.nextAction, 'EXECUTE_CONTRARY_EVIDENCE_CHECK');
const contraryUnresolved = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { ...verifiedEvidence, contraryEvidenceCheck: 'FOUND_UNRESOLVED' });
assert.equal(contraryUnresolved.decisionLock, 'ON');
assert.equal(contraryUnresolved.nextAction, 'RESOLVE_CONTRARY_EVIDENCE');
const contraryResolved = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { ...verifiedEvidence, contraryEvidenceCheck: 'FOUND_RESOLVED' });
assert.equal(contraryResolved.decisionLock, 'OFF');

const correctionRequired = core.buildCasePrecedentGate(precedentQuestion, precedentContext, 'HIGH', { ...verifiedEvidence, precedentContradictsPriorAnalysis: true });
assert.equal(correctionRequired.correctionRequired, true);
assert.equal(correctionRequired.workflowStatus, 'READY_FOR_CORRECTION_AND_HUMAN_REVIEW');
assert.equal(correctionRequired.nextAction, 'CORRECT_PRIOR_ANALYSIS_THEN_HUMAN_REVIEW');

const clearRuleBundle = core.createGovernmentPrompt({ question: 'สรุประเบียบค่าเดินทางฉบับนี้เป็นหัวข้อ', route: null, context: core.createSharedContext({ facts: 'สรุปเนื้อหาเอกสารที่แนบ', desiredOutput: 'สรุป' }) });
assert.equal(clearRuleBundle.casePrecedentGate.required, false);
assert.doesNotMatch(clearRuleBundle.prompt, /OFFICIAL AUTHORITY RETRIEVAL GATE/);

console.log(`GovPrompt Universal Task Reasoning v7.1 passed: ${cases.length} real-work cases.`);
