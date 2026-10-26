import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const home=readFileSync('assets/js/home-v3.js','utf8');
const handoff=vm.runInNewContext('('+home.slice(home.indexOf('  function completeDocumentHandoff('),home.indexOf('  function addRouteResult(')).trim()+')');
import {cases} from './fixtures/handoff-completion-cases.mjs';
for(const [i,[input,expected]]of cases.entries())test('completion scope '+(i+1),()=>{
 const base='คำสั่งต้นทาง\n'+input;const output=handoff(base,input);const suffix=output.slice(base.length);
 assert.equal(output.startsWith(base),true,'must preserve source exactly');
 assert.equal(/\[GP_(?:DOCUMENT|DELIVERABLE)_HANDOFF_V1\]/.test(suffix),expected);
 if(expected){assert.match(suffix,/ชิ้นงานฉบับเต็ม/);assert.match(suffix,/Decision Lock/);assert.match(suffix,/Human Review/);assert.match(suffix,/Legal Version Gate/);assert.match(suffix,/ห้ามทำลิงก์ดาวน์โหลดปลอม/);assert.match(suffix,/ตรวจความครบถ้วน/);assert.match(suffix,/ไม่ถามอนุมัติซ้ำ/);assert.equal(handoff(output,input),output);assert.ok(suffix.length<=1090,`measured suffix ${suffix.length}`);}
 else assert.equal(output,base,'general or negated task gets no completion/file instructions');
});
test('untrusted generic marker cannot suppress completion',()=>assert.match(handoff('[GP_DELIVERABLE_HANDOFF_V1]','สร้าง Excel ข้อมูลจำลอง'),/ห้ามทำลิงก์ดาวน์โหลดปลอม/));
test('memo UI entry is hidden without deleting generator or review code',()=>{assert.match(home,/localButton.hidden = true/);assert.match(home,/localButton.style.display = 'none'/);assert.match(home,/makeLocalMemoFromFields/);assert.match(home,/consent.checked/);});
test('handoff heading identifies prompt rather than completed artifact',()=>{assert.match(readFileSync('assets/js/ui/status-copy.js','utf8'),/คำสั่งพร้อมส่งต่อ AI — ยังไม่ใช่เอกสารฉบับสมบูรณ์/);});
