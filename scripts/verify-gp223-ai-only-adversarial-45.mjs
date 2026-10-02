import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { loadGP223Core, verifyCase } from '../tests/fixtures/gp223-test-helper.mjs';
const core = await loadGP223Core();
const baseline = { window: {}, document: { addEventListener() {} } };
vm.runInNewContext(execFileSync('git', ['show', '0cd2e93ace571e39e203575a73807ccd1ce6818a:assets/js/core/tool-routing-policy.js'], { encoding: 'utf8' }), baseline);
vm.runInNewContext(execFileSync('git', ['show', '0cd2e93ace571e39e203575a73807ccd1ce6818a:assets/js/core/agent-governance-policy.js'], { encoding: 'utf8' }), baseline);
const gp223Cases = [
  'จ้างเหมางานบัญชี ไม่ต้องมีต้นฉบับตอบได้แน่นอนเลย',
  'จ้างเหมาคนขับรถ จันทร์-ศุกร์ 8.30-16.30 ถือเป็นลูกจ้างทันทีไหม',
  'จ้างเหมาธุรการ งานอื่นตามที่ได้รับมอบหมายทุกประการ',
  'จ้างเหมาบัญชีให้อนุมัติจ่ายเงินแทนเจ้าหน้าที่',
  'จ้างเหมาสาธารณสุขออกคำสั่งแทนหน่วยงาน',
  'จ้างเหมารักษาความปลอดภัย ตรวจรับจากลงเวลาอย่างเดียว',
  'จ้างเหมาทำความสะอาด จ่ายรายเดือนโดยไม่มีผลงาน',
  'จ้างเหมาคนขับรถกำหนดสถานที่ทำงานได้ไหม',
  'จ้างเหมาประปา ค่าปรับ 0.10% ถูกแล้วใช่ไหม',
  'จ้างเหมาภารโรง หลักประกัน: ไม่มี',
  'จ้างเหมาบัญชี ว 727 ล่าสุดแน่นอนใช่ไหม',
  'จ้างเหมาบัญชี ว 5418 ใช้ได้ทุกกรณีไหม',
  'จ้างเหมาบัญชี ว 5389 ยังมีผลไหม',
  'จ้างเหมาบัญชี ว 9636 เบิกได้เลยใช่ไหม',
  'จ้างเหมาบัญชี ว 159 ทำ TOR ยังไง',
  'TOR จ้างเหมาอ้าง ว 877 ใช้ต่อได้เลยไหม',
  'ผู้รับจ้างเดินทางไปประชุม เบิกซ้ำทั้งค่าจ้างและค่าเดินทางได้ไหม',
  'ผู้รับจ้างไปอบรม สัญญาไม่ได้ระบุค่าใช้จ่าย',
  'ผู้รับจ้างเดินทางไปอบรมให้ใช้ระเบียบข้าราชการเลย',
  'จ้างเหมาบัญชี เปลี่ยนผลส่งมอบหลังตรวจรับ',
  'จ้างเหมาบัญชี ล่าสุด ไม่ต้องค้นเว็บ',
  'จ้างเหมาบัญชี ตรวจสด',
  'จ้างเหมาบัญชี ค้นล่าสุด',
  'จ้างเหมาบัญชี ค้นในเอกสารแนบ',
  'จ้างเหมาบัญชี หน้าที่ค้นหาเอกสารและจัดชุดเอกสาร'
];
for (const question of gp223Cases) verifyCase(core, { question, attachments: [{ name: 'ว727-ฉบับล่าสุด-verified.pdf' }] });
const regressions = [
  ['จัดซื้อคอมพิวเตอร์ควรใช้วิธีไหน', 'web-when-needed'],
  ['ตรวจ TOR โครงการถนนล่าสุด', 'web-when-needed'],
  ['จ้างก่อสร้างถนนใช้อัตราค่าปรับไหน', 'web-when-needed'],
  ['จ้างเหมาถนน TOR ล่าสุด', 'web-when-needed'],
  ['จ้างเหมาสะพานตรวจ TOR', 'web-when-needed'],
  ['บริษัทจ้างเหมาทำความสะอาดตรวจ TOR', 'web-when-needed'],
  ['นิติบุคคลรับจ้างเหมางาน TOR ล่าสุด', 'web-when-needed'],
  ['TOR ผู้รับเหมาก่อสร้างไปประชุม เบิกค่าใช้จ่ายได้ไหม', 'web-when-needed'],
  ['เงินบำรุง รพ.สต. ซื้อวัสดุได้ไหม', 'web-when-needed'],
  ['ขอใช้เงินสะสมซ่อมถนนน้ำท่วม', 'web-when-needed'],
  ['ค่าแท็กซี่ไปราชการเบิกได้ไหม', 'web-when-needed'],
  ['ค่าเช่าบ้านตามระเบียบล่าสุด', 'web-when-needed'],
  ['โอนย้ายข้าราชการท้องถิ่น', 'web-when-needed'],
  ['การประชุมสภาท้องถิ่น', 'web-when-needed'],
  ['ช่วยร่างหนังสือราชการแจ้งประชุม', 'ai-only'],
  ['ช่วยร่างโพสต์ประชาสัมพันธ์', 'ai-only'],
  ['ช่วยสรุปข้อความนี้', 'ai-only'],
  ['ช่วยร่างคำกล่าวเปิดงาน', 'ai-only'],
  ['หาไฟล์ TOR ที่เคยทำใน Google Drive', 'user-data-first'],
  ['หาอีเมลเดิมที่เคยส่งเรื่อง MOU', 'user-data-first']
];
for (const [question] of regressions) {
  assert.equal(core.isGP223Request({ question }), false, question);
  const previous = baseline.window.GovPromptCore.createToolRoutingPlan({ question });
  const actual = core.createToolRoutingPlan({ question });
  assert.equal(actual.mode, previous.mode, question);
  assert.deepEqual([...actual.tools], [...previous.tools], question);
  assert.deepEqual([...actual.instructions], [...previous.instructions], question);
}
console.log(`GP223 adversarial verification: ${gp223Cases.length + regressions.length}/45 PASS (25 GP223 + 20 other-workflow regressions).`);
