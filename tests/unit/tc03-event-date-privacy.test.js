import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function boundary() {
  const listeners = {}, nodes = new Map();
  const form = {dataset:{},addEventListener(type, fn){listeners[type]=fn;},insertAdjacentElement(_,node){nodes.set(node.id,node);}};
  const input = {value:'',dispatchEvent(){},focus(){}};
  const document = {readyState:'complete',querySelector(){return null;},addEventListener(){},
    getElementById(id){return id==='chatForm'?form:id==='promptInput'?input:nodes.get(id);},
    createElement(){return {style:{},setAttribute(){}};}};
  const window = {GovPromptCore:{},setTimeout(){return 1;},clearTimeout(){},GovPrompt:{toast(){}}};
  const sandbox = {window,document,Event:class {}};
  for(const file of ['privacy-guard.js','privacy-submit-guard.js'])
    vm.runInNewContext(readFileSync('assets/js/core/'+file,'utf8'),sandbox);
  return {sanitize:window.GovPromptCore.sanitizeExternalContent,submit(value){
    input.value=value; let stopped=false;
    listeners.submit({preventDefault(){stopped=true;},stopImmediatePropagation(){}});
    return {stopped,value:input.value};
  }};
}
const events = ['เหตุเกิดวันที่ 12 มกราคม 2565','เหตุ เกิดวันที่ 12 มกราคม 2565','วันเกิดเหตุ 12 มกราคม 2565','วันที่เกิดเหตุ 12 มกราคม 2565','ยังไม่ทราบวันเกิดเหตุ','วันเริ่มไต่สวน 12 มกราคม 2565','วันชี้มูล 12 มกราคม 2565','วันรับสำนวน 12 มกราคม 2565','วันพ้นราชการ 12 มกราคม 2565','วันเกิดสิทธิ 12 มกราคม 2565'];
for(const fact of events) test('event stays intact at both privacy boundaries: '+fact,()=>{
 const gate=boundary(); const text='วิเคราะห์ ป.ป.ช. อบจ. '+fact+' คำวินิจฉัย 14/2569';
 const result=gate.sanitize(text);
 assert.equal(result.safeText,text); assert.equal(result.blocked,false); assert.equal(result.redactions.length,0);
 assert.deepEqual(gate.submit(text),{stopped:false,value:text});
});
for(const pii of ['วันเกิด 20 ธันวาคม 2515','วันเดือนปีเกิด 20 ธันวาคม 2515','เกิดวันที่ 20 ธันวาคม 2515','วันเกิด: 20/12/2515','เลขบัตรประชาชน 1234567890123','HN 123456','โทร 0812345678','token: private-test-value'])
 for(const order of ['before','after']) test('mixed event cannot exempt PII '+pii+' '+order,()=>{
  const gate=boundary(); const event='เหตุเกิดวันที่ 12 มกราคม 2565';
  const text=order==='before'?pii+'; '+event:event+'; '+pii;
  const result=gate.submit(text); assert.equal(result.stopped,true); assert.equal(result.value,'');
  const sanitized=gate.sanitize(text); assert.ok(sanitized.changed||sanitized.blocked);
  if(pii.startsWith('วัน')||pii.startsWith('เกิด')) assert.ok(sanitized.redactions.includes('วันเดือนปีเกิด'));
 });
test('standalone personal birthdays stay blocked on successive submits',()=>{
 const gate=boundary();
 for(const value of ['เกิดวันที่ 20 ธันวาคม 2515','วันเกิด 20 ธันวาคม 2515','วันเดือนปีเกิด 20 ธันวาคม 2515']) assert.equal(gate.submit(value).stopped,true);
 assert.equal(gate.submit('ยังไม่ทราบวันเกิดเหตุ').stopped,false);
 assert.equal(gate.submit('วันเกิด 20 ธันวาคม 2515').stopped,true);
});

// Regression for TC14: benign repeated whitespace must not trip the privacy submit gate.
test('TC14 without incident date permits prompt generation despite repeated spaces',()=>{
 const gate=boundary();
 const question='วิเคราะห์ ป.ป.ช. ไต่สวนเกิน 3 ปี ข้าราชการ เทศบาล พ้นราชการก่อนชี้มูล  คำวินิจฉัยศาลรัฐธรรมนูญที่ 14/2569 ผู้บังคับบัญชาต้องลงโทษหรือไม่ ไม่มีเอกสารต้นฉบับ';
 assert.deepEqual(gate.submit(question),{stopped:false,value:question});
});
test('TC14 whitespace cannot conceal personal birth date or credentials',()=>{
 for(const pii of ['วันเกิด 20 ธันวาคม 2515','เลขบัตรประชาชน 1234567890123','token: private-test-value']) {
  const gate=boundary();
  const result=gate.submit('วิเคราะห์ ป.ป.ช.  พ้นราชการก่อนชี้มูล  '+pii);
  assert.equal(result.stopped,true);
  assert.equal(result.value,'');
 }
});
