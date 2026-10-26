import test from 'node:test';
import assert from 'node:assert/strict';

// Safe-only staging tests. Not production runtime; no percentage or liability adjudication.
const sources = Object.freeze({
  C56: { fullTextVerified:false, status:'LISTING_ONLY' },
  C66: { fullTextVerified:false, tablesVerified:false, status:'TABLE_LOCK' },
  C75: { fullTextVerified:false, status:'LISTING_ONLY' },
  C217:{ fullTextVerified:false, status:'LISTING_ONLY' },
  REG59:{ sourcePdfInspected:true, amendmentsExhaustive:false }
});
function assess(input) {
  const missing=[];
  if (!input.evidence) missing.push('EVIDENCE');
  if (!input.dutyKnown) missing.push('DUTY_CLASSIFICATION');
  if (!input.damageKnown) missing.push('DAMAGE');
  if (input.needDeadline && !input.deadlineInputs) missing.push('DEADLINE_INPUTS');
  if (input.needPercent && !sources.C66.tablesVerified) missing.push('C66_SOURCE_TABLES');
  if (input.needCommittee && !sources.REG59.amendmentsExhaustive) missing.push('LEGAL_VERSION');
  const status=missing.length ? 'DECISION_LOCK' : 'HUMAN_REVIEW_REQUIRED';
  return {status,missing,percent:null,liabilityFinding:null,officialOrder:null};
}
const cases=[
 ['ordinary road collision',true,true,true,false,false,false],
 ['alleged gross negligence without proof',false,true,true,false,false,false],
 ['police note alone',false,true,true,false,false,false],
 ['private trip uncertainty',true,false,true,false,false,false],
 ['multiple officers allocation',true,true,true,true,false,false],
 ['agency system fault allocation',true,true,true,true,false,false],
 ['insured vehicle allocation',true,true,true,true,false,false],
 ['repair before inquiry',true,true,true,false,false,false],
 ['committee authority',true,true,true,false,false,true],
 ['missing limitation dates',true,true,true,false,true,false],
 ['fraud allegation',false,true,true,false,false,false],
 ['cash custody unknown',false,true,true,false,false,false],
 ['procurement overpricing',true,true,false,true,false,false],
 ['medical injury evidence',false,true,true,false,false,false],
 ['theft cause uncertain',false,true,true,false,false,false],
 ['third-party plaintiff duty',true,false,true,false,false,false],
 ['incorrect cited article',false,true,true,false,false,false],
 ['circular supersession unknown',true,true,true,true,false,false],
 ['request automatic thirty percent',true,true,true,true,false,false],
 ['draft official order',true,true,true,false,false,true],
 ['fire damage insufficient evidence',false,true,true,false,false,false],
 ['missing actual valuation',true,true,false,false,false,false],
 ['unauthorized travel investigation',true,false,true,false,false,false],
 ['missing insurance records',false,true,true,true,false,false],
 ['multiple offices no evidence',false,true,true,true,false,false],
 ['deadline lacking knowledge date',true,true,true,false,true,false],
 ['financial loss role split',true,true,true,true,false,false],
 ['regulation version uncertain',true,true,true,false,false,true],
 ['third party injury valuation',true,true,false,false,false,false],
 ['full facts advisory only',true,true,true,false,false,false]
];
test('source availability gates',()=>{
 assert.equal(sources.C66.tablesVerified,false);
 assert.equal(sources.REG59.amendmentsExhaustive,false);
});
for(const [name,evidence,dutyKnown,damageKnown,needPercent,needDeadline,needCommittee] of cases){
 test('TORT staging '+name,()=>{
   const out=assess({evidence,dutyKnown,damageKnown,needPercent,needDeadline,needCommittee,deadlineInputs:false});
   assert.equal(out.percent,null);
   assert.equal(out.liabilityFinding,null);
   assert.equal(out.officialOrder,null);
   assert.ok(['DECISION_LOCK','HUMAN_REVIEW_REQUIRED'].includes(out.status));
   if(needPercent) assert.ok(out.missing.includes('C66_SOURCE_TABLES'));
   if(needCommittee) assert.ok(out.missing.includes('LEGAL_VERSION'));
   if(needDeadline) assert.ok(out.missing.includes('DEADLINE_INPUTS'));
 });
}
