import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { revenueGuidance } from '../src/revenue-guidance.js';

const home = await readFile(new URL('../assets/js/home-v3.js', import.meta.url), 'utf8');
const scenarios = [
  ['R03','อบจ.พะเยาจะจัดเก็บรายได้จากผู้เข้าพักโรงแรม ต้องตรวจข้อบัญญัติและหลักเกณฑ์อะไรบ้าง','hotel'],
  ['R04','อบจ.พะเยาต้องการจัดเก็บรายได้จากน้ำมัน ก๊าซ และยาสูบ สามารถใช้อัตราเดียวกันทั้งหมดได้หรือไม่','fuel-tobacco'],
  ['R05','ประชาชนได้รับหนังสือแจ้งประเมินภาษีจากเทศบาล จะยื่นอุทธรณ์ภาษีอย่างไร','assessment-appeal'],
  ['R06','เทศบาลมีภาษีค้างชำระย้อนหลัง 3 ปี จะเร่งรัดภาษีอย่างไร','arrears'],
  ['R08','ข้อมูล LTAX ONLINE ไม่ตรงกับทะเบียนทรัพย์สิน','ltax'],
  ['R09','บันทึกรายรับภาษีใน New e-LAAS อย่างไร','elaas'],
  ['R10','ช่วยร่างหนังสือแจ้งภาษีโดยเว้นยอดค้างที่ไม่ทราบ','documents']
];
for (const [id, question, domain] of scenarios) test(id+' evidence domain is retained',()=>{
  const guidance = revenueGuidance(question);
  assert.equal(guidance?.domain,domain);
  assert.ok(guidance.missingEvidence.length > 0);
});
test('home passes evidence into revenue result UI without replacing document module',()=>{
  assert.match(home,/revenueMissingEvidence: revenue\.missingEvidence/);
  assert.match(home,/label\.textContent = promptBundle\.revenueGuidanceDomain/);
  assert.match(home,/revenue-result-evidence/);
  assert.match(home,/route\.moduleId/);
  assert.match(home,/promptBundle\.prompt \+ '\\n\\n' \+ revenueBlock/);
});
