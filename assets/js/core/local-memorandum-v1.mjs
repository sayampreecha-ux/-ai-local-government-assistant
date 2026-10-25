// Deterministic labelled-field parser, not general language understanding.
export const PLACEHOLDER = '[รอตรวจสอบ]';
export const labels = ['ส่วนราชการ','ที่','วันที่','เรื่อง','เรียน','เรื่องเดิม','ข้อเท็จจริง','ข้อพิจารณา','ข้อเสนอ','ผู้ลงนาม','ตำแหน่ง'];
const aliases = {'ชื่อผู้ลงนาม':'ผู้ลงนาม','ตำแหน่งผู้ลงนาม':'ตำแหน่ง'};
export function makeLocalMemoDraft(input) {
 const source=String(input??'').trim();
 validateSafety(source);
 if(!/(?:จัดทำ|ร่าง|ทำ|เขียน).{0,35}บันทึกข้อความ/.test(source) || /ไม่(?:ต้อง|ให้).{0,12}(?:จัดทำ|ร่าง|ทำ|เขียน)/.test(source))throw new Error('รองรับเฉพาะการร่างบันทึกข้อความใน V1');
 // Control notes are not facts or text to be signed. They cannot supply fields.
 const content=source.split(/\n[ \t]*(?:ข้อกำหนด|รายการตรวจทาน|รายการตรวจสอบ)[ \t]*[:：]?[ \t]*(?=\n|$)/u)[0];
 validateClaims(content);
 const matches=[...content.matchAll(new RegExp('(?:^|[\\n;；]|[ \\t]+)('+[...Object.keys(aliases),...labels].join('|')+')[ \\t]*[:：][ \\t]*','g'))];
 const values={};
 for(let i=0;i<matches.length;i++){
  const m=matches[i],key=aliases[m[1]]||m[1];if(key in values)throw new Error('พบช่องข้อมูลซ้ำ: '+key+' กรุณาตรวจและแยกช่องให้ชัด');
  values[key]=content.slice(m.index+m[0].length,matches[i+1]?.index??content.length).replace(/[ ;；]+$/,'').trim()||PLACEHOLDER;
 }
 // Free prose remains available for officer structuring; no guessed fields.
 if(!matches.length && !/^(?:จัดทำ|ร่าง|ทำ|เขียน)\s*บันทึกข้อความ$/.test(content.trim()))values['ข้อเท็จจริง']=content;
 return assembleMemo(values,matches.length?'labelled-fields':'verbatim-unstructured');
}

// Structured edits must not be re-parsed as labelled source. Values can contain literal labels.
export function makeLocalMemoFromFields(fields) {
 if(!fields || typeof fields!=='object' || Array.isArray(fields))throw new Error('รูปแบบช่องข้อมูลไม่ถูกต้อง');
 const values={};
 for(const [key,value] of Object.entries(fields)){
  if(!labels.includes(key) || typeof value!=='string')throw new Error('รูปแบบช่องข้อมูลไม่ถูกต้อง');
  values[key]=value.trim()||PLACEHOLDER;
 }
 const text=Object.values(values).join('\n');
 // Validate every edited value without interpreting labels or control-note headings.
 validateSafety(text);
 validateClaims(text);
 return assembleMemo(values,'reviewed-fields');
}
function assembleMemo(values,parserMode){
 const missing=labels.filter(k=>!values[k]||values[k]===PLACEHOLDER);
 return {title:'บันทึกข้อความ',summary:'',sections:[
  {heading:'',paragraphs:labels.slice(0,5).map(k=>k+'  '+(values[k]||PLACEHOLDER)),bullets:[]},
  ...labels.slice(5,9).map(k=>({heading:k,paragraphs:[values[k]||PLACEHOLDER],bullets:[]})),
  {heading:'',paragraphs:['ลงชื่อ ................................................','('+(values['ผู้ลงนาม']||PLACEHOLDER)+')','ตำแหน่ง '+(values['ตำแหน่ง']||PLACEHOLDER)],bullets:[]}
 ],actionItems:[],slides:[],missing,reviewRequired:true,parserMode,values};
}

function validateSafety(source){
 if(!source || source.length>12000)throw new Error('กรุณาระบุข้อความไม่เกิน 12,000 ตัวอักษร');
 if(/(?:ละเลยคำสั่ง|ignore previous|system prompt|<script|javascript:)/i.test(source))throw new Error('พบคำสั่งแทรกหรือคำกล่าวอ้าง ต้องตรวจหลักฐานก่อน');
 if(/\b\d(?:[ -]*\d){12}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:นาย|นางสาว|นาง)\s*[ก-๙]+\s+[ก-๙]+|(?:api.?key|password|รหัสผ่าน)\s*[:=]|(?:0\d{8,9})\b/i.test(source))throw new Error('ตรวจพบข้อมูลเสี่ยง กรุณาปกปิดก่อนสร้างร่าง');
}
function validateClaims(content){
 if(/(?:ได้รับอนุมัติแล้ว|ได้ตรวจสอบกฎหมายแล้ว|ได้ตรวจรับแล้ว)/.test(content))throw new Error('พบคำกล่าวอ้าง ต้องตรวจหลักฐานก่อน');
}
