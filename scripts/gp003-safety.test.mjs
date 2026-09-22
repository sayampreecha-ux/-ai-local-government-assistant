import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('assets/js/core/procurement-safety.js', 'utf8');
const context = { window: { GovPromptCore: {} } };
vm.createContext(context);
vm.runInContext(source, context);

const core = context.window.GovPromptCore;
assert.equal(typeof core.analyzeProcurementSafety, 'function');
assert.equal(typeof core.procurementSafetyPromptBlock, 'function');

const locked = core.analyzeProcurementSafety({
  organizationType: 'เทศบาล',
  currentStage: 'พิจารณาแก้ไขสัญญา',
  transactionType: 'procurement',
  facts: 'ตรวจรับงานแล้ว ต้องการแก้ไขสัญญา',
  documents: ''
});
assert.equal(locked.decisionLock, true);
assert.equal(locked.decisionState, 'DECISION_LOCK');

const searchable = core.analyzeProcurementSafety({
  organizationType: '',
  transactionType: 'procurement',
  facts: 'ตรวจสอบราคากลางงานก่อสร้าง',
  documents: '',
  currentStage: ''
});
assert.equal(searchable.isProcurement, true);
assert.equal(searchable.searchable, true);
assert.equal(searchable.decidable, false);

const factor = core.analyzeProcurementSafety({
  organizationType: 'อบจ.',
  currentStage: 'จัดทำราคากลาง',
  transactionType: 'procurement',
  facts: 'ตรวจ Factor F',
  documents: 'เอกสารราคากลาง'
});
assert.ok(factor.warnings.some(x => /Factor F/.test(x)));
assert.ok(factor.requiredEvidence.some(x => /Factor F/.test(x)));

const nonProcurement = core.analyzeProcurementSafety({
  organizationType: 'อบจ.',
  transactionType: 'public-relations',
  facts: 'เขียนข่าว',
  documents: 'ร่างข่าว'
});
assert.equal(nonProcurement.isProcurement, false);
assert.equal(nonProcurement.decisionLock, false);

console.log('GP003 safety tests: PASS');
