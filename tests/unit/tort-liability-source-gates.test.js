import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../../docs/knowledge/tort-liability-release-gates.json',import.meta.url),'utf8'));
test('release must be blocked until legal and deployment gates met',()=>{
 assert.equal(data.release_status,'BLOCKED_LEGAL_SOURCE_VERIFICATION');
 assert.ok(Object.values(data.release_gates).some(x=>x===false));
});
test('circular register contains 56,66,75,217',()=>{
 for(const id of ['C56','C66','C75','C217']) assert.equal(data.source_records.filter(x=>x.id===id).length,1);
});
test('no invented C66 tables or approved percentages',()=>{
 const c=data.source_records.find(x=>x.id==='C66');
 assert.equal(c.all_tables_verified,false);
 assert.deepEqual(c.approved_percentages,[]);
});
test('2559 amendment record keeps repealed clause 19 out of current claims',()=>{
 const r=data.source_records.find(x=>x.id==='REG2559');
 assert.ok(r.verified_amendments.includes('repeal 19'));
});
test('no current-version certification without actual review',()=>{
 for(const x of data.source_records.filter(x=>x.id.startsWith('REG')||x.id==='ACT2539'))
   assert.equal(x.current_version_verified,false);
});
