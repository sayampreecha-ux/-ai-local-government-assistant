// Exercise the unchanged production DOCX generator with predetermined synthetic data.
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=await readFile('assets/js/core/document-studio-v1.js','utf8');
const sandbox={document:{addEventListener(){}},window:{},TextEncoder,Blob,console};
vm.runInNewContext(source+'\nglobalThis.__makeDocx=makeDocx;globalThis.__normalizeDoc=normalizeDoc;',sandbox);
const fixture={title:'บันทึกข้อความ',sections:[
 {paragraphs:['ส่วนราชการ กลุ่มงานพัฒนาบุคลากร หน่วยงานตัวอย่าง','ที่ ทดสอบ 001/2569','วันที่ 25 ตุลาคม 2569','เรื่อง ขอใช้ห้องประชุมเพื่อทบทวนขั้นตอนบริการ','เรียน หัวหน้าหน่วยงานตัวอย่าง']},
 {heading:'1. เรื่องเดิม',paragraphs:['[รอตรวจสอบ]']},
 {heading:'2. ข้อเท็จจริง',paragraphs:['ประสงค์จัดกิจกรรมวันที่ 5 พฤศจิกายน 2569 เวลา 09.00–12.00 น. ผู้เข้าร่วม 20 คน โดยไม่ขอใช้งบประมาณเพิ่มเติม']},
 {heading:'3. ข้อพิจารณา',paragraphs:['เสนอให้ตรวจสอบความพร้อมและการจองห้องประชุม [รอตรวจสอบ]']},
 {heading:'4. ข้อเสนอ',paragraphs:['จึงเรียนมาเพื่อโปรดพิจารณาอนุญาตให้ใช้ห้องประชุมและประสานผู้ดูแลอาคาร','ลงชื่อ [รอตรวจสอบ]','ตำแหน่ง [รอตรวจสอบ]']}
]};
const doc=sandbox.__normalizeDoc(fixture);const blob=sandbox.__makeDocx(doc);
assert.equal(blob.type,'application/zip');const bytes=Buffer.from(await blob.arrayBuffer());assert.equal(bytes.readUInt32LE(0),0x04034b50);
await mkdir('artifacts/pr346-release',{recursive:true});await writeFile('artifacts/pr346-release/generator-memo.docx',bytes);
await writeFile('artifacts/pr346-release/fixture.json',JSON.stringify(fixture,null,2));
console.log('PASS unchanged generator, synthetic fixture, 0 AI calls. Render/OOXML/edit checks are separate.');
