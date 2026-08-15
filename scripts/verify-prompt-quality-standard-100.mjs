import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const files = [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-orchestrator.js',
  'assets/js/core/prompt-quality-standard.js'
];

const sandbox = { window: {}, console };
sandbox.window.window = sandbox.window;
sandbox.window.GovPromptCore = {};
vm.createContext(sandbox);
for (const file of files) vm.runInContext(await readFile(file, 'utf8'), sandbox, { filename: file });

const core = sandbox.window.GovPromptCore;
assert.equal(core.PROMPT_QUALITY_STANDARD_VERSION, '7.2');
assert.equal(typeof core.createGovernmentPrompt, 'function');
assert.equal(typeof core.buildPromptQualityInstructions, 'function');

const genericRoute = Object.freeze({
  moduleId: 'GENERAL',
  assistant: Object.freeze({ moduleId: 'GENERAL', title: 'ผู้ช่วยงานราชการไทยแบบครอบคลุม' }),
  transactionType: 'general', modules: Object.freeze([]), confidence: 1, fallback: false, ambiguous: false
});

const groups = {
  finance: [
    'ค่าแท็กซี่ไปราชการเบิกได้ไหม','ค่าทำปกเอกสารเบิกได้ไหม','บรรจุครบ 6 เดือนมีสิทธิโบนัสดไหม','ใช้เงินสะสมซื้อรถได้หรือไม่','ค่าอาหารประชุมเบิกได้ไหม','เงินบำรุง รพ.สต. ใช้จัดอบรมได้ไหม','ค่าที่พักเกินอัตราเบิกอย่างไร','ค่าลงทะเบียนอบรมเบิกได้ไหม','ค่าซ่อมรถราชการเบิกจากหมวดใด','ค่าเช่าสถานที่จัดงานเบิกได้หรือไม่'
  ],
  procurement: [
    'ช่วยร่าง TOR จัดซื้อคอมพิวเตอร์','จัดซื้อเสาไฟฟ้าควรใช้วิธีใด','e-bidding ไม่มีผู้ยื่นต้องทำอย่างไร','แบ่งซื้อแบ่งจ้างดูอย่างไร','ตรวจ TOR รถบรรทุกน้ำ','ราคากลางต้องใช้ข้อมูลอะไร','ผู้ยื่นรายเดียวรับได้ไหม','แก้ TOR หลังประกาศได้หรือไม่','จัดจ้างที่ปรึกษา 2 ล้านบาทใช้วิธีใด','ขอ checklist ตรวจรับงานก่อสร้าง'
  ],
  hr: [
    'บรรจุใหม่มีสิทธิเลื่อนเงินเดือนไหม','ย้ายข้าราชการไปต่างจังหวัดทำอย่างไร','ขอวิเคราะห์คุณสมบัติปลัด อบจ.','พนักงานลาป่วยเกินกำหนดทำอย่างไร','วินัยไม่ร้ายแรงมีโทษอะไร','แต่งตั้งรักษาราชการแทนได้ไหม','ขอแนวทางประเมินทดลองงาน','เลื่อนระดับชำนาญการต้องมีเงื่อนไขอะไร','ขอร่างคำสั่งมอบหมายงานบุคคล','เพิกถอนคำสั่งบรรจุได้หรือไม่'
  ],
  records: [
    'ช่วยร่างหนังสือราชการเร่งรัดงาน','ร่างบันทึกข้อความขออนุมัติโครงการ','ร่างหนังสือเชิญประชุม','ร่างคำสั่งแต่งตั้งคณะกรรมการ','ร่างประกาศประชาสัมพันธ์','ร่างหนังสือตอบข้อหารือ','ช่วยทำหนังสือขอความอนุเคราะห์','ร่างหนังสือแจ้งผลการตรวจ','ทำบันทึกเสนอผู้บริหาร','ร่างหนังสือภายนอกถึงกระทรวง'
  ],
  legal: [
    'ระเบียบนี้ยังใช้บังคับอยู่ไหม','อบจ.มีอำนาจทำโครงการนี้หรือไม่','ช่วยวิเคราะห์ข้อกฎหมายเรื่องเช่าสนามกีฬา','หนังสือเวียนฉบับใหม่มีผลอย่างไร','คำพิพากษานี้ใช้กับกรณีเราได้ไหม','ข้อหารือกรมส่งเสริมฯ ใช้เป็นฐานได้หรือไม่','กฎหมายฉบับไหนมีศักดิ์สูงกว่า','บทเฉพาะกาลใช้กรณีนี้หรือไม่','มติคณะกรรมการขัดระเบียบทำอย่างไร','ตรวจว่าหลักเกณฑ์นี้ถูกยกเลิกหรือยัง'
  ],
  health: [
    'เงินบำรุง รพ.สต. ซื้อเวชภัณฑ์ได้ไหม','ร่างโครงการผู้สูงอายุ รพ.สต.','เบิกค่าตอบแทน อสม. ได้หรือไม่','ขอแนวทางถ่ายโอน รพ.สต.','จัดซื้อยาใช้ระเบียบใด','ขอร่างแผนบริการสุขภาพชุมชน','ข้อมูลผู้ป่วยส่งให้หน่วยงานอื่นได้ไหม','จัดอบรม AI ให้ รพ.สต. ใช้งบได้หรือไม่','ตรวจโครงการคัดกรองเบาหวาน','ร่างหนังสือแจ้งแนวทางเงินบำรุง'
  ],
  engineering: [
    'ถนนชำรุดซ่อมฉุกเฉินทำอย่างไร','ตรวจ TOR งานถนนคอนกรีต','งานก่อสร้างตรวจรับไม่ผ่านทำอย่างไร','ขอ checklist ควบคุมงานก่อสร้าง','ประมาณราคากลางถนนต้องมีอะไร','ผู้รับจ้างส่งงานล่าช้าทำอย่างไร','แก้แบบก่อสร้างระหว่างสัญญาได้ไหม','มาตรฐานความหนาแน่นดินตรวจอย่างไร','ขอร่างรายงานตรวจหน้างาน','สะพานชำรุดควรดำเนินการเร่งด่วนอย่างไร'
  ],
  pr: [
    'เขียนโพสต์ประชาสัมพันธ์โครงการ AI','ทำแคปชันเชิญประชุมประชาชน','ร่างข่าวเปิดงานกีฬา','ทำข้อความอินโฟกราฟิกป้องกัน PM2.5','เขียนโพสต์สรุปผลงาน อปท.','ร่างข้อความเชิญใช้ GovPrompt','ทำข่าวประชาสัมพันธ์ถนนเปิดใช้','เขียนแคปชันวันผู้สูงอายุ','ทำข้อความโปสเตอร์รับสมัครอบรม','ร่างโพสต์ชี้แจงข้อเท็จจริง'
  ],
  general: [
    'สรุปประชุมให้ผู้บริหาร 1 หน้า','วางแผนจัดกิจกรรมชุมชน','ทำ checklist เตรียมประชุม','เปรียบเทียบ 3 ทางเลือกให้หน่อย','สรุปเอกสารยาวเป็นหัวข้อ','ทำตารางแผนงาน 90 วัน','ช่วยคิด KPI โครงการ','ทำ executive brief','ช่วยวิเคราะห์ความเสี่ยงโครงการ','จัดลำดับงานเร่งด่วนประจำสัปดาห์'
  ],
  mixed: [
    'ร่างโครงการพร้อม TOR และงบประมาณ','วิเคราะห์กฎหมายและร่างหนังสือตอบ','จัดซื้อรถพร้อมวิเคราะห์แหล่งเงิน','โครงการ รพ.สต. ต้องตรวจเงินบำรุงและพัสดุ','งานก่อสร้างล่าช้าช่วยร่างหนังสือเร่งรัด','โบนัสข้าราชการช่วยตรวจสิทธิและร่างคำตอบ','จัดงานประชุมช่วยดูค่าใช้จ่ายและร่างหนังสือ','ทำโพสต์โครงการแต่ตรวจ PDPA ก่อน','ขอ TOR พร้อม checklist ความเสี่ยงร้องเรียน','วิเคราะห์อำนาจ อบจ. แล้วสรุปผู้บริหาร'
  ]
};

const cases = Object.entries(groups).flatMap(([group, questions]) => questions.map(question => ({ group, question })));
assert.equal(cases.length, 100, 'evaluation suite must contain exactly 100 cases');

const results = [];
for (const testCase of cases) {
  const result = core.createGovernmentPrompt({ question: testCase.question, route: genericRoute, context: { facts: testCase.question, desiredOutput: testCase.question } });
  const prompt = result.prompt;
  assert.match(prompt, /GovPrompt Prompt Quality Standard v7\.2/);
  assert.match(prompt, /Answer First/);
  assert.match(prompt, /ห้ามแต่งเลขมาตรา/);
  assert.match(prompt, /ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง/);
  assert.match(prompt, /PDPA/);
  assert.match(prompt, /Human Approval/);
  assert.equal(result.qualityStandard.version, '7.2');
  if (testCase.group === 'finance') assert.match(prompt, /เบิกได้ \/ เบิกไม่ได้ \/ มีเงื่อนไข/);
  if (testCase.group === 'procurement') assert.match(prompt, /แบ่งซื้อแบ่งจ้าง/);
  if (testCase.group === 'hr') assert.match(prompt, /งานบุคคล: แยกคุณสมบัติ/);
  if (testCase.group === 'records') assert.match(prompt, /ส่งฉบับพร้อมใช้ก่อน/);
  if (testCase.group === 'legal') assert.match(prompt, /ลำดับศักดิ์/);
  if (testCase.group === 'health') assert.match(prompt, /ข้อมูลสุขภาพเป็นข้อมูลอ่อนไหว/);
  if (testCase.group === 'engineering') assert.match(prompt, /มาตรฐานทางเทคนิค/);
  if (testCase.group === 'pr') assert.match(prompt, /พร้อมเผยแพร่/);
  results.push({ group: testCase.group, question: testCase.question, domains: result.qualityStandard.domains });
}

console.log(JSON.stringify({ standard: core.PROMPT_QUALITY_STANDARD.name, total: results.length, status: 'PASS', groups: Object.fromEntries(Object.entries(groups).map(([name, items]) => [name, items.length])) }, null, 2));
