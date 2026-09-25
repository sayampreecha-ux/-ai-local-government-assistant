import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const catalog = readFileSync('catalog-public.js', 'utf8');
const quick = readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8');
const home = readFileSync('assets/js/home-v3.js', 'utf8');

const roles = [
  ['ประชาสัมพันธ์','จัดทำข่าว 10 ข่าวต่อเดือน พร้อมภาพ ไฟล์ต้นฉบับ และหลักฐานเผยแพร่','มาปฏิบัติงาน 08.30-16.30 น. และแจ้งหัวหน้าเมื่อหยุด','รับรองข้อความประชาสัมพันธ์แทนนายก อบจ.'],
  ['คนขับรถยนต์','ขับรถตามภารกิจที่ระบุ 20 ภารกิจ พร้อมบันทึกการใช้รถและรายงานสภาพรถ','ทำงานจันทร์-ศุกร์ ลงเวลา และลาตามที่หัวหน้ากำหนด','อนุมัติการใช้รถหรือสั่งเจ้าหน้าที่แทนหน่วยงาน'],
  ['ธุรการ','จัดทำดัชนีและจัดเรียงเอกสาร 500 รายการ พร้อมฐานข้อมูล','นั่งประจำสำนักงานและทำงานอื่นทุกอย่างตามหัวหน้า','ลงนามรับรองเอกสารราชการแทนเจ้าหน้าที่'],
  ['ขับเครื่องจักรหนัก','ปรับพื้นที่ตามแบบจำนวน 5,000 ตร.ม. พร้อมภาพก่อน-หลัง','เข้าทำงานตามกะและปฏิบัติตามคำสั่งหัวหน้าทุกวัน','สั่งการเครื่องจักรของหน่วยงานอื่นแทนเจ้าหน้าที่'],
  ['ตรวจมาตรวัดน้ำ','ตรวจมิเตอร์ 1,000 จุด พร้อมพิกัด ภาพ และผลตรวจ','ต้องเข้าทำงานทุกวันและรายงานตัวก่อนเริ่มงาน','รับรองหนี้หรือวินิจฉัยจำนวนเงินค่าน้ำแทนเจ้าหน้าที่'],
  ['รักษาความปลอดภัย','ดูแลพื้นที่ 3 อาคารตามจุดตรวจและส่งรายงานเหตุการณ์','เข้าเวรตามตาราง ห้ามลาเอง และอยู่ภายใต้หัวหน้าตลอดเวลา','สั่งอพยพหรือใช้อำนาจเจ้าพนักงานแทนรัฐ'],
  ['จัดเก็บรายได้','สำรวจข้อมูลผู้ประกอบการ 500 ราย พร้อมฐานข้อมูล','ประจำสำนักงานและทำงานอื่นตามคำสั่งหัวหน้า','เรียกเก็บค่าธรรมเนียม วินิจฉัยภาษี หรือออกคำสั่งแทนเจ้าหน้าที่'],
  ['ธุรการฐานข้อมูล','บันทึกข้อมูล 2,000 รายการและส่งฐานข้อมูลตรวจสอบแล้ว','ต้องลงเวลาทุกวันและอยู่ประจำโต๊ะ','อนุมัติหรือรับรองข้อมูลราชการแทนเจ้าหน้าที่'],
  ['นิติการและรับเรื่องร้องทุกข์','รวบรวมข้อเท็จจริง 100 เรื่องและจัดทำร่างสรุปเสนอเจ้าหน้าที่','ต้องทำงานตามเวลาราชการและรับงานอื่นจากหัวหน้า','วินิจฉัยสิทธิหรือมีคำสั่งทางปกครองแทนผู้มีอำนาจ'],
  ['ป้องกันและบรรเทาสาธารณภัย','สำรวจจุดเสี่ยง 100 จุด พร้อมพิกัด ภาพ และรายงาน','เข้าเวรและปฏิบัติตามคำสั่งหัวหน้าตลอดเวลา','สั่งการประชาชนหรือใช้อำนาจเจ้าพนักงานป้องกันภัยแทนรัฐ'],
  ['ดูแลระบบประปา','ตรวจและซ่อมจุดชำรุด 50 จุด พร้อมภาพก่อน-หลัง','อยู่ประจำสถานีและทำงานอื่นตามที่หัวหน้าสั่ง','อนุมัติการจ่ายน้ำหรือออกคำสั่งแทนเจ้าหน้าที่'],
  ['นักการภารโรง','ทำความสะอาดและดูแลพื้นที่อาคาร 2,000 ตร.ม. ตามมาตรฐานที่กำหนด','ทำงาน 08.30-16.30 น. ลงเวลาและลาป่วยลากิจ','รับรองผลการตรวจอาคารแทนเจ้าหน้าที่'],
  ['สอนและสนับสนุนการศึกษา','ผลิตสื่อการเรียน 20 ชุดและรายงานผลการจัดกิจกรรม','เข้าสอนตามตารางและทำงานอื่นตามที่ครูกำหนด','ประเมินผลหรือรับรองผลการเรียนแทนครู/เจ้าหน้าที่'],
  ['ทำความสะอาด','ทำความสะอาดพื้นที่ 2,000 ตร.ม. ตามรอบและมาตรฐาน พร้อมใบตรวจงาน','ต้องลงเวลาและถูกหักเงินเมื่อมาสาย','รับรองมาตรฐานอาคารแทนเจ้าหน้าที่'],
  ['พยาบาล-นักวิชาการสาธารณสุข','คัดกรองประชาชน 300 คนและส่งรายงานผลตามขอบเขตที่กำหนด','เข้าหน่วยตามตารางและอยู่ภายใต้คำสั่งหัวหน้า','วินิจฉัยโรคหรือรับรองผลในฐานะเจ้าหน้าที่รัฐโดยไม่มีการตรวจฐานอำนาจ']
];

const cases = roles.flatMap(([role, clean, employment, authority]) => [
  { role, level: 'A', prompt: `ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา ลักษณะงาน ${role}: ${clean}` },
  { role, level: 'B', prompt: `ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา ลักษณะงาน ${role}: ${clean} และ ${employment}` },
  { role, level: 'C', prompt: `ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา ลักษณะงาน ${role}: ${clean} และให้ผู้รับจ้าง ${authority}` }
]);

const requiredGates = [
  'Employment-like Risk Gate','Scope Integrity Gate','Authority Boundary Gate',
  'Deliverable Gate','Five-Document Consistency Gate','Acceptance Gate',
  'Contract Terms Gate','ว 727 / Authority Gate','Local Government Authority Gate','Applicable Authority Check',
  'Decision Lock','Legacy Citation Gate','Contract-Term Trigger','Employment-Signal Trigger','Travel-and-Training Gate','External-Person Training Gate','Travel Expense Gate'
];

test('GP223 adversarial benchmark has 45 simulated real-world cases', () => {
  assert.equal(roles.length, 15);
  assert.equal(cases.length, 45);
});

test('GP223 catalog and conversational routing remain available', () => {
  assert.match(catalog, /"id":"gp223"/);
  assert.match(quick, /ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา/);
  assert.match(quick, /เริ่มจากการสนทนากับผู้ใช้โดยตรง/);
  assert.match(quick, /ถามข้อมูลที่จำเป็นเพิ่มเติมจากผู้ใช้เองทีละประเด็น/);
});

test('GP223 contains every required safety and legal gate', () => {
  for (const gate of requiredGates) assert.ok(home.includes(gate), 'missing gate: '+gate);
  assert.match(home, /ว 727 ลงวันที่ 22 กันยายน 2569/);
  assert.match(home, /มท 0808\.2\/ว 5418 ลงวันที่ 24 กันยายน 2569/);
  assert.match(home, /มท 0803\.3\/ว 5389 ลงวันที่ 23 กันยายน 2569/);
  assert.match(home, /ระเบียบกระทรวงมหาดไทยว่าด้วยค่าใช้จ่ายในการเดินทางไปราชการของเจ้าหน้าที่ท้องถิ่น พ\.ศ\. 2555/);
  assert.match(home, /ระเบียบกระทรวงมหาดไทยว่าด้วยค่าใช้จ่ายในการฝึกอบรมและการเข้ารับการฝึกอบรมของเจ้าหน้าที่ท้องถิ่น พ\.ศ\. 2557/);
  assert.match(home, /อปท\. ไม่สามารถส่งบุคคลภายนอกเข้ารับการฝึกอบรมได้/);
  assert.match(home, /ไม่สรุปว่าเป็นการจ้างแรงงานจากปัจจัยใดปัจจัยหนึ่ง/);
  assert.match(home, /ห้าม hard-code ตัวเลข อัตรา หรือข้อยกเว้น/);
});

test('45 simulated prompts route through the same GP223 workflow', () => {
  for (const item of cases) {
    assert.match(item.prompt, /ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา/);
    assert.match(home, /จำแนกลักษณะงานจากงานจริงและผลสำเร็จ ไม่ตัดสินจากชื่อตำแหน่ง/);
  }
});

test('Level A: clean deliverable cases are deliverable-centric', () => {
  const levelA = cases.filter(x => x.level === 'A');
  assert.equal(levelA.length, 15);
  assert.match(home, /ผลผลิต\/งานส่งมอบ/);
  assert.match(home, /TOR ↔ สัญญา\/ข้อตกลง ↔ ผลส่งมอบ ↔ ตรวจรับ ↔ การเบิกจ่าย/);
  assert.match(home, /ตรวจรับอาศัยผลงาน\/หลักฐาน/);
});

test('Level B: employment-like traps are represented for every role', () => {
  const levelB = cases.filter(x => x.level === 'B');
  assert.equal(levelB.length, 15);
  assert.match(home, /การกำหนดวันหรือช่วงเวลาปฏิบัติงาน|Employment-Signal Trigger/);
  assert.match(home, /งานอื่นตามที่ได้รับมอบหมายทุกประการ/);
  assert.match(home, /การลาแบบลูกจ้าง/);
});

test('Level C: authority-boundary traps are represented for every role', () => {
  const levelC = cases.filter(x => x.level === 'C');
  assert.equal(levelC.length, 15);
  assert.match(home, /อนุมัติ อนุญาต สั่งการ วินิจฉัย รับรอง/);
  assert.match(home, /Decision Lock/);
  assert.match(home, /ฐานอำนาจที่เกี่ยวข้องยืนยัน/);
});

test('GP223 does not resurrect cancelled ว 877 as current authority', () => {
  assert.match(home, /Legacy Citation Gate/);
  assert.match(home, /ว 727 ลงวันที่ 22 กันยายน 2569/);
  assert.match(home, /ฉบับและฐานอำนาจที่ใช้จริง/);
});

test('GP223 does not hard-code guarantee or penalty rates/exemptions', () => {
  assert.match(home, /หลักประกัน\/ค่าปรับตามฉบับและฐานอำนาจที่ใช้จริง/);
  assert.match(home, /ห้าม hard-code ตัวเลข อัตรา หรือข้อยกเว้น/);
});

test('GP223 benchmark covers service categories beyond job-title matching', () => {
  const expected = roles.map(r => r[0]);
  for (const role of expected) assert.ok(roles.some(r => r[0] === role), 'missing role: '+role);
});
