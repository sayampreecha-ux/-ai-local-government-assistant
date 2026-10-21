import {readFileSync} from 'node:fs';
import vm from 'node:vm';
export const engineeringLabels=['ถอดแบบและจัดทำ BOQ','จัดทำราคากลางงานก่อสร้าง','จัดทำแบบรูปรายการงานก่อสร้าง','ตรวจแบบ / BOQ / ราคากลาง','ตรวจงานและตรวจรับก่อสร้าง','วิเคราะห์ปัญหาถนน / อาคาร / โครงสร้าง','🔍 ตรวจสอบค่า K'];
export const actionLabels={boq:engineeringLabels[0],price:engineeringLabels[1],drawing:engineeringLabels[2],review:engineeringLabels[3],inspection:engineeringLabels[4],structure:engineeringLabels[5],k:engineeringLabels[6],tor:'ร่าง TOR งานก่อสร้าง'};
export function readEngineeringMenu(){
 const source=readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js','utf8');
 const expression=source.match(/const WORK_CATALOG = ([\s\S]*?\n  \]\));/)[1];
 const catalog=vm.runInNewContext(expression);
 const tasks=catalog.find(c=>c.id==='engineering').tasks;
 const k=readFileSync('assets/js/ui/engineering-k-quick-action-v1.js','utf8');
 const kTask={label:actionLabels.k,prompt:k.match(/button.dataset.prompt = '([^']+)'/)[1]};
 const actions=Object.fromEntries(Object.entries(actionLabels).map(([key,label])=>[key,key==='k'?kTask:tasks.find(t=>t.label===label)||tasks.flatMap(t=>t.choices||[]).find(t=>t.label===label)]));
 return {catalog,tasks,actions};
}
