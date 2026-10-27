import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../assets/js/core/prompt-composer.js',import.meta.url),'utf8');
function compose(task) {
 const window={GovPromptCore:{}};
 vm.runInNewContext(source,{window});
 return window.GovPromptCore.composeGovernancePrompt({task,routing:{routes:[]},quality:{}});
}
const cases=['สอบละเมิดเจ้าหน้าที่','ความรับผิดทางละเมิดของเจ้าหน้าที่','รถราชการชนเสียหาย','คำสั่งเรียกชดใช้','แต่งตั้งกรรมการสอบสวนละเมิด'];
for(const task of cases)test('tort handoff '+task,()=>{
 const prompt=compose(task);
 assert.match(prompt,/ชุดงานละเมิดระดับ 1/);
 assert.match(prompt,/ว66\/ว141/);
 assert.match(prompt,/NOT VERIFIED/);
 assert.match(prompt,/ร่างครบ 7 ส่วน/);
});
test('non-tort output unaffected',()=>{
 assert.doesNotMatch(compose('ร่างหนังสือเชิญประชุม'),/ชุดงานละเมิดระดับ 1/);
});
