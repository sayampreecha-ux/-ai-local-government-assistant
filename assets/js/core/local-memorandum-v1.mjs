// Deterministic labelled-field parser, not general language understanding.
export const PLACEHOLDER = '[รอตรวจสอบ]';
const labels = ['ส่วนราชการ','ที่','วันที่','เรื่อง','เรียน','เรื่องเดิม','ข้อเท็จจริง','ข้อพิจารณา','ข้อเสนอ','ผู้ลงนาม','ตำแหน่ง'];
const aliases = {'ชื่อผู้ลงนาม':'ผู้ลงนาม','ตำแหน่งผู้ลงนาม':'ตำแหน่ง'};
export function makeLocalMemoDraft(input) {
 const source=String(input??'').trim();
 if(!source || source.length>12000)throw new Error('กรุณาระบุข้อความไม่เกิน 12,000 ตัวอักษร');
 if(!/(?:จัดทำ|ร่าง|ทำ|เขียน).{0,35}บันทึกข้อความ/.test(source) || /ไม่(?:ต้อง|ให้).{0,12}(?:จัดทำ|ร่าง|ทำ|เขียน)/.test(source))throw new Error('รองรับเฉพาะการร่างบันทึกข้อความใน V1');
 if(/(?:ละเลยคำสั่ง|ignore previous|system prompt|<script|javascript:)/i.test(source))throw new Error('พบคำสั่งแทรกหรือคำกล่าวอ้าง ต้องตรวจหลักฐานก่อน');
 if(/\b\d(?:[ -]*\d){12}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:นาย|นางสาว|นาง)\s*[ก-๙]+\s+[ก-๙]+|(?:api.?key|password|รหัสผ่าน)\s*[:=]|(?:0\d{8,9})\b/i.test(source))throw new Error('ตรวจพบข้อมูลเสี่ยง กรุณาปกปิดก่อนสร้างร่าง');
 // Control notes are not facts or text to be signed. They cannot supply fields.
 const content=source.split(/\n[ \t]*(?:ข้อกำหนด|รายการตรวจทาน|รายการตรวจสอบ)[ \t]*[:：]?[ \t]*(?=\n|$)/u)[0];
 if(/(?:ได้รับอนุมัติแล้ว|ได้ตรวจสอบกฎหมายแล้ว|ได้ตรวจรับแล้ว)/.test(content))throw new Error('พบคำกล่าวอ้าง ต้องตรวจหลักฐานก่อน');
 const matches=[...content.matchAll(new RegExp('(?:^|[\\n;；]|[ \\t]+)('+[...Object.keys(aliases),...labels].join('|')+')[ \\t]*[:：][ \\t]*','g'))];
 const values={};
 for(let i=0;i<matches.length;i++){
  const m=matches[i],key=aliases[m[1]]||m[1];if(key in values)throw new Error('พบช่องข้อมูลซ้ำ: '+key+' กรุณาตรวจและแยกช่องให้ชัด');
  values[key]=content.slice(m.index+m[0].length,matches[i+1]?.index??content.length).replace(/[ ;；]+$/,'').trim()||PLACEHOLDER;
 }
 const missing=labels.filter(k=>!values[k]||values[k]===PLACEHOLDER);
 // Free prose is preserved verbatim for review rather than guessed into structured facts.
 if(!matches.length)values['ข้อเท็จจริง']=content;
 return {title:'บันทึกข้อความ',summary:'',sections:[
  {heading:'',paragraphs:labels.slice(0,5).map(k=>k+'  '+(values[k]||PLACEHOLDER)),bullets:[]},
  ...labels.slice(5,9).map(k=>({heading:k,paragraphs:[values[k]||PLACEHOLDER],bullets:[]})),
  {heading:'',paragraphs:['ลงชื่อ ................................................','('+(values['ผู้ลงนาม']||PLACEHOLDER)+')','ตำแหน่ง '+(values['ตำแหน่ง']||PLACEHOLDER)],bullets:[]}
 ],actionItems:[],slides:[],missing,reviewRequired:true,parserMode:matches.length?'labelled-fields':'verbatim-unstructured',values};
}
