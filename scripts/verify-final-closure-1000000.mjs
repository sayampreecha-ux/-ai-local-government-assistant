import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = {
  window: {},
  URL,
  Date,
  console,
  location: { pathname: '/index.html' },
  fetch: async () => ({ ok: true, async json() { return { provider: 'test', searchedAt: '2026-08-14T00:00:00Z', results: [] }; } }),
  globalThis: {}
};

for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/router-regression-overrides.js',
  'assets/js/core/hybrid-intent-classifier.js',
  'assets/js/core/hybrid-real-world-overrides.js',
  'assets/js/core/education-event-routing-overrides.js',
  'assets/js/core/procurement-tor-routing-overrides.js',
  'assets/js/core/media-routing-overrides.js',
  'assets/js/core/router-real-query-hotfix.js',
  'assets/js/core/source-intelligence.js',
  'assets/js/core/freshness-engine.js',
  'assets/js/core/official-source-registry.js',
  'assets/js/core/citation-engine.js',
  'assets/js/core/official-search-connector.js',
  'assets/js/core/outcome-first-search-policy.js',
  'assets/js/core/tool-routing-policy.js',
  'assets/js/core/output-router.js',
  'assets/js/core/prompt-orchestrator.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;
assert.equal(typeof core.createToolRoutingPlan, 'function');
assert.equal(typeof core.detectOfficialSearchUserGoals, 'function');
assert.equal(typeof core.rankOfficialSearchResultsForOutcome, 'function');

const topics = [
  ['F01','เบิกค่าแท็กซี่ไปราชการ','finance'],
  ['F02','ค่าอาหารประชุม','finance'],
  ['F03','เงินยืมราชการ','finance'],
  ['F04','เงินสะสมซ่อมถนน','finance'],
  ['F05','เงินบำรุง รพ.สต. ซื้อครุภัณฑ์','finance'],
  ['F06','ค่าล่วงเวลาวันหยุด','finance'],
  ['F07','ค่าเช่าบ้านข้าราชการท้องถิ่น','finance'],
  ['F08','ค่าใช้จ่ายอบรม AI','finance'],
  ['F09','รับบริจาคเงินเข้าหน่วยงาน','finance'],
  ['F10','รับเงินผ่านคิวอาร์และออกใบเสร็จ','finance'],

  ['P01','TOR รถขุด','procurement'],
  ['P02','TOR ถนนคอนกรีต','procurement'],
  ['P03','แบ่งซื้อแบ่งจ้าง','procurement'],
  ['P04','e-bidding ไม่มีผู้ยื่นข้อเสนอ','procurement'],
  ['P05','ผู้รับจ้างขอเปลี่ยนวัสดุ','procurement'],
  ['P06','ราคากลางงานก่อสร้าง','procurement'],
  ['P07','กรรมการตรวจรับมีส่วนได้เสีย','procurement'],
  ['P08','แก้ไขสัญญาเพิ่มวงเงิน','procurement'],
  ['P09','คืนหลักประกันสัญญา','procurement'],
  ['P10','กำหนดยี่ห้อใน TOR','procurement'],

  ['H01','ปลัดต้นไปปลัดกลาง','hr',true],
  ['H02','ชก ขึ้น ชพ','hr',true],
  ['H03','ลาป่วยเกินสามวัน','hr'],
  ['H04','โอนย้ายข้าราชการท้องถิ่น','hr'],
  ['H05','เลื่อนเงินเดือนผู้ถูกสอบวินัย','hr'],
  ['H06','ทดลองงานไม่ผ่าน','hr'],
  ['H07','เกษียณอายุราชการ','hr'],
  ['H08','แต่งตั้งรักษาราชการแทน','hr'],
  ['H09','พนักงานจ้างขอลาออก','hr'],
  ['H10','บ้านพักข้าราชการไม่อยู่อาศัยจริง','hr'],

  ['L01','อุทธรณ์คำสั่งทางปกครอง','legal'],
  ['L02','เปิดเผยชื่อผู้ร้องเรียน','legal'],
  ['L03','มอบอำนาจให้รองปลัด','legal'],
  ['L04','ผู้มีส่วนได้เสียร่วมพิจารณา','legal'],
  ['L05','การนับวันตามกฎหมาย','legal'],
  ['L06','เรียกคืนเงินที่จ่ายเกิน','legal'],
  ['L07','ละเลยหน้าที่ของหน่วยงาน','legal'],
  ['L08','หนังสือเวียนกับระเบียบ','legal'],
  ['L09','ข้อบัญญัติท้องถิ่นขัดกฎกระทรวง','legal'],
  ['L10','อำนาจเรียกเก็บค่าธรรมเนียมขยะ','legal'],

  ['E01','ถนนทรุดระหว่างประกัน','engineering'],
  ['E02','ตรวจรับถนนลาดยาง','engineering'],
  ['E03','แบบก่อสร้างไม่มีวิศวกรเซ็น','engineering'],
  ['E04','งานเพิ่มนอกสัญญาก่อสร้าง','engineering'],
  ['E05','ขยายเวลาสัญญางานก่อสร้าง','engineering'],
  ['E06','ทดสอบความแน่นดิน','engineering'],
  ['E07','ความหนาถนนคอนกรีต','engineering'],
  ['E08','งานระบบระบายน้ำ','engineering'],
  ['E09','ไฟฟ้าสาธารณะ','engineering'],
  ['E10','เสาไฟโซลาร์เซลล์','engineering'],

  ['S01','ข้อมูลผู้ป่วยลงเพจ','health'],
  ['S02','เงินกองทุนสุขภาพซื้อครุภัณฑ์','health'],
  ['S03','ขยะติดเชื้อเก็บกี่วัน','health'],
  ['S04','รถพยาบาลรับบริจาคน้ำมัน','health'],
  ['S05','รพ.สต. เก็บค่าบริการเพิ่ม','health'],
  ['S06','เหตุรำคาญกลิ่นควัน','health'],
  ['S07','ผู้สัมผัสอาหารต้องอบรม','health'],
  ['S08','ตรวจคุณภาพน้ำประปา','health'],
  ['S09','อำนาจท้องถิ่นควบคุมโรค','health'],
  ['S10','ผู้ป่วยขอดูเวชระเบียน','health'],

  ['C01','สมาชิกมีส่วนได้เสียลงมติ','council'],
  ['C02','องค์ประชุมสภาท้องถิ่น','council'],
  ['C03','เสนอญัตติด่วนด้วยวาจา','council'],
  ['C04','ประชุมลับของสภา','council'],
  ['C05','ส่งหนังสือนัดประชุมสภา','council'],
  ['C06','ประธานสภาลงคะแนน','council'],
  ['C07','เรียกประชุมวิสามัญ','council'],
  ['C08','แปรญัตติงบประมาณ','council'],
  ['C09','ถอนญัตติหลังอภิปราย','council'],
  ['C10','ประชาชนเข้าฟังประชุมสภา','council'],

  ['R01','หนังสือด่วนที่สุดส่งอีเมล','records'],
  ['R02','เก็บหนังสือราชการกี่ปี','records'],
  ['R03','ทำลายเอกสารราชการ','records'],
  ['R04','เลขหนังสือออกซ้ำ','records'],
  ['R05','สำเนาคู่ฉบับลงลายมือชื่อ','records'],
  ['R06','หนังสือประทับตรา','records'],
  ['R07','ส่งสำเนาทางไลน์','records'],
  ['R08','หนังสือลับส่งอีเมล','records'],
  ['R09','รับหนังสือนอกเวลาราชการ','records'],
  ['R10','คำสั่งกับประกาศต่างกัน','records'],

  ['PR01','โพสต์รูปเด็กลงเพจหน่วยงาน','pr'],
  ['PR02','แก้ข่าวประชาสัมพันธ์ผิด','pr'],
  ['PR03','ประกาศเตือนภัยประชาชน','pr'],
  ['PR04','อินโฟกราฟิกงบประมาณ','pr'],
  ['PR05','ใช้ตราสัญลักษณ์ราชการบนโปสเตอร์','pr'],
  ['PR06','ตอบคอมเมนต์ร้องเรียนประชาชน','pr'],
  ['PR07','ข่าวกิจกรรมระบุวันเวลา','pr'],
  ['PR08','โพสต์ข้อมูลผู้ป่วยลงเฟซบุ๊ก','pr'],
  ['PR09','คลิปสั้นราชการมีคำบรรยาย','pr'],
  ['PR10','เผยแพร่ผลจัดซื้อบนเฟซบุ๊ก','pr'],

  ['PL01','แก้ไขแผนพัฒนาท้องถิ่น','planning'],
  ['PL02','กำหนดตัวชี้วัดโครงการ','planning'],
  ['PL03','โอนงบประมาณระหว่างหมวด','planning'],
  ['PL04','ตรวจฐานอำนาจโครงการ','planning'],
  ['PL05','ประชาคมก่อนทำโครงการ','planning'],
  ['PL06','ผลกระทบสิ่งแวดล้อมของโครงการ','planning'],
  ['PL07','แผนจัดซื้อจัดจ้างประจำปี','planning'],
  ['PL08','แก้ไขข้อบัญญัติงบประมาณ','planning'],
  ['PL09','ผูกพันงบประมาณข้ามปี','planning'],
  ['PL10','ประเมินผลโครงการหลังดำเนินการ','planning']
].map(([id, text, domain, career = false]) => ({ id, text, domain, career }));
assert.equal(topics.length, 100);

const distortions = [
  ['plain', q => q],
  ['colloquial', q => q.replaceAll('ได้ไหม','ได้มั้ย').replaceAll('เท่าไร','เท่าไหร่').replaceAll('หรือไม่','มั้ย')],
  ['typo-use', q => q.replaceAll('ใช้','ไช้').replaceAll('อยู่','อยุ').replaceAll('ไหม','มั้ย')],
  ['compact', q => q.replace(/\s+/g, '')],
  ['polite-noise', q => `พี่ช่วยดูให้หน่อยคับ ${q} เอาแบบชัวๆ`],
  ['role-prefix', q => `เจ้าหน้าที่ถามมาว่า ${q}`],
  ['boss-prefix', q => `ผู้บริหารถามด่วน ${q}`],
  ['punctuation', q => `...${q}???`],
  ['mixed-space', q => q.replace(/ /g, '  ') + ' ครับ'],
  ['terse', q => `ขอสั้นๆ ${q} ที`],
  ['newline', q => `ขอถาม\n${q}\nตอบให้ตรงประเด็น`],
  ['brackets', q => `[เคสจริง] ${q} [ด่วน]`],
  ['quote', q => `“${q}”`],
  ['slash', q => q.replace(/ /g, '/')],
  ['dash', q => `ด่วน—${q}—ขอคำตอบ`],
  ['repeat', q => `ถามจริง ถามจริง ${q}`],
  ['english-noise', q => `urgent case: ${q} pls`],
  ['emoji-noise', q => `⚠️ ${q} ✅`],
  ['long-prefix', q => `มีเรื่องจากหน้างานที่ต้องตัดสินใจวันนี้ รบกวนช่วยตรวจให้ชัดเจนว่า ${q}`],
  ['long-suffix', q => `${q} ขอใช้ตอบเจ้าหน้าที่และเสนอผู้บริหารต่อ ขอเฉพาะข้อสรุปที่ใช้ทำงานได้`]
].map(([id, apply]) => ({ id, apply }));
assert.equal(distortions.length, 20);

const variants = [
  ['v01', q => q],
  ['v02', q => `ขอถามตรงๆ ${q}`],
  ['v03', q => `เคสหน้างาน: ${q}`],
  ['v04', q => `${q} ตอบสั้นก่อน`],
  ['v05', q => `${q} เอาหลักฐานชัวร์ๆ`],
  ['v06', q => `มีคนถามว่า ${q}`],
  ['v07', q => `ด่วน ${q}`],
  ['v08', q => `[งานจริง] ${q}`],
  ['v09', q => `ก่อนตอบช่วยดูประเด็นนี้ ${q}`],
  ['v10', q => `${q} ตอบเฉพาะที่ถาม`],
  ['v11', q => `เจ้าหน้าที่จะทำต่อจากคำตอบนี้ ${q}`],
  ['v12', q => `ขอใช้เสนอผู้บริหาร: ${q}`],
  ['v13', q => `ช่วยเช็กให้หน่อย: ${q}`],
  ['v14', q => `คำถามจริงจากงาน: ${q}`],
  ['v15', q => `เอาเฉพาะประเด็นนี้: ${q}`],
  ['v16', q => `ไม่ต้องเกริ่น ${q}`],
  ['v17', q => `ขอคำตอบที่ตัดสินใจได้ ${q}`],
  ['v18', q => `สำหรับเจ้าหน้าที่ใหม่ ${q}`],
  ['v19', q => `กรณีนี้ต้องใช้วันนี้ ${q}`],
  ['v20', q => `ขอคำตอบแบบราชการแต่เข้าใจง่าย ${q}`]
].map(([id, apply]) => ({ id, apply }));
assert.equal(variants.length, 20);

function expectedGoalFor(topic, goal) {
  if (goal === 'authority') return 'authority';
  if (goal === 'deadline') return 'duration-deadline';
  if (goal === 'rate') return 'amount-rate';
  if (goal === 'risk') return 'compliance-risk';
  if (goal === 'career' && topic.career) return 'career-progression';
  if (goal === 'current') return 'current-status';
  if (goal === 'decision') return 'eligibility-decision';
  return null;
}

const behaviors = [
  { id:'current-decision', goal:'decision', make:t=>`${t} ทำได้ไหม ตรวจระเบียบหรือกฎหมายปัจจุบันก่อนตอบ`, required:['web-search','ai-reasoning'] },
  { id:'current-status', goal:'current', make:t=>`${t} ตอนนี้หลักเกณฑ์ยังใช้ไหม ขอฉบับล่าสุดจากราชการ`, required:['web-search','ai-reasoning'] },
  { id:'current-risk', goal:'risk', make:t=>`เรื่อง${t} เสี่ยงผิดระเบียบไหม เช็กฉบับล่าสุดก่อน`, required:['web-search','ai-reasoning'] },
  { id:'authority', goal:'authority', make:t=>`เรื่อง${t} ใครมีอำนาจอนุมัติหรือรับผิดชอบ ตรวจฐานอำนาจด้วย`, required:['web-search','ai-reasoning'] },
  { id:'deadline', goal:'deadline', make:t=>`เรื่อง${t} ต้องทำภายในกี่วัน ใช้หลักเกณฑ์ล่าสุด`, required:['web-search','ai-reasoning'] },
  { id:'rate', goal:'rate', make:t=>`เรื่อง${t} ได้เท่าไร อัตราปัจจุบันเท่าไหร่ ตรวจแหล่งราชการ`, required:['web-search','ai-reasoning'] },
  { id:'career', goal:'career', make:t=>`${t} ต้องกี่ปีถึงทำได้ ตรวจเกณฑ์ปัจจุบัน`, required:['web-search','ai-reasoning'] },
  { id:'draft-no-web', make:t=>`ร่างหนังสือเรื่อง${t}ให้พร้อมใช้ ไม่ต้องค้นเว็บ`, required:['ai-reasoning'], forbidden:['web-search'], noWeb:true },
  { id:'checklist-no-web', make:t=>`ทำ checklist เรื่อง${t}จากข้อมูลที่มี ยังไม่ต้องค้นเว็บ`, required:['ai-reasoning'], forbidden:['web-search'], noWeb:true },
  { id:'explain-no-web', make:t=>`อธิบายเรื่อง${t}จากข้อมูลนี้เท่านั้น ไม่ค้นภายนอก`, required:['ai-reasoning'], forbidden:['web-search'], noWeb:true },
  { id:'attachment-summary', make:t=>`สรุปไฟล์แนบเรื่อง${t} ใช้เอกสารนี้อย่างเดียว ไม่ค้นเพิ่ม`, attachments:['input.pdf'], required:['attached-files','ai-reasoning'], forbidden:['web-search','drive-files'], first:'attached-files', noWeb:true },
  { id:'attachment-extract', make:t=>`เปิดไฟล์แนบเรื่อง${t} ดึง 5 ประเด็นสำคัญ ไม่ค้นภายนอก`, attachments:['input.docx'], required:['attached-files','ai-reasoning'], forbidden:['web-search','drive-files'], first:'attached-files', noWeb:true },
  { id:'attachment-draft', make:t=>`ใช้เอกสารแนบเรื่อง${t} ร่างฉบับพร้อมใช้ ไม่ต้องค้นเว็บ`, attachments:['input.docx'], required:['attached-files','ai-reasoning'], forbidden:['web-search','drive-files'], first:'attached-files', noWeb:true },
  { id:'attachment-current', goal:'current', make:t=>`อ่านไฟล์แนบเรื่อง${t}ก่อน แล้วเทียบหลักเกณฑ์ปัจจุบันให้ด้วย`, attachments:['input.pdf'], required:['attached-files','web-search','ai-reasoning'], forbidden:['drive-files'], order:['attached-files','web-search','ai-reasoning'] },
  { id:'attachment-risk', goal:'risk', make:t=>`ตรวจเอกสารแนบเรื่อง${t} แล้วเช็กกฎหมายล่าสุดพร้อมชี้จุดเสี่ยง`, attachments:['input.pdf'], required:['attached-files','web-search','ai-reasoning'], forbidden:['drive-files'], order:['attached-files','web-search','ai-reasoning'] },
  { id:'drive-find', make:t=>`หาไฟล์เรื่อง${t}ที่เคยทำไว้ใน Google Drive ไม่ต้องค้นเว็บ`, required:['drive-files','ai-reasoning'], forbidden:['web-search'], first:'drive-files' },
  { id:'drive-summary', make:t=>`เปิดเอกสารเดิมใน Drive เรื่อง${t} แล้วสรุปจากไฟล์นั้น ไม่ค้นเว็บ`, required:['drive-files','ai-reasoning'], forbidden:['web-search'], first:'drive-files' },
  { id:'drive-current', goal:'current', make:t=>`หาไฟล์เดิมใน Google Drive เรื่อง${t} แล้วตรวจต่อว่าถูกหลักเกณฑ์ล่าสุดไหม`, required:['drive-files','web-search','ai-reasoning'], order:['drive-files','web-search','ai-reasoning'] },
  { id:'gmail-find', make:t=>`หาอีเมลล่าสุดที่ได้รับเรื่อง${t} แล้วสรุปเมลนั้น`, required:['gmail','ai-reasoning'], forbidden:['web-search'], first:'gmail' },
  { id:'gmail-old', make:t=>`ค้นเมลเดิมเรื่อง${t} แล้วบอกว่าต้องทำอะไรต่อจากเมล ไม่ต้องค้นเว็บ`, required:['gmail','ai-reasoning'], forbidden:['web-search'], first:'gmail' },
  { id:'gmail-current-law', goal:'current', make:t=>`หาเมลเรื่อง${t}ก่อน แล้วตรวจต่อกับระเบียบปัจจุบันว่าถูกไหม`, required:['gmail','web-search','ai-reasoning'], order:['gmail','web-search','ai-reasoning'] },
  { id:'latest-email-trap', make:t=>`ผู้บริหารถามว่า หาเมลล่าสุดเรื่อง${t}ให้หน่อย`, required:['gmail','ai-reasoning'], forbidden:['web-search'], first:'gmail' },
  { id:'natural-drive-prefix', make:t=>`รบกวนหาเอกสารเรื่อง${t}ในไดรฟ์ให้หน่อยครับ`, required:['drive-files','ai-reasoning'], forbidden:['web-search'], first:'drive-files' },
  { id:'explicit-no-web-overrides-risk', make:t=>`ตรวจความเสี่ยงเรื่อง${t}จากเอกสารที่ให้เท่านั้น ห้ามค้นเว็บ`, required:['ai-reasoning'], forbidden:['web-search'], noWeb:true },
  { id:'evidence-torture', goal:'decision', make:t=>`${t} ทำได้ไหม ขอหลักฐานราชการที่ตอบตรงเรื่อง`, required:['web-search','ai-reasoning'], evidence:true }
];
assert.equal(behaviors.length, 25);

function inOrder(actual, expected) {
  let last = -1;
  for (const item of expected) {
    const idx = actual.indexOf(item);
    if (idx < 0 || idx <= last) return false;
    last = idx;
  }
  return true;
}

function evidencePair(topic) {
  return {
    good: {
      title: `หลักเกณฑ์ ระเบียบ และเงื่อนไขทางราชการ: ${topic.text}`,
      snippet: `อำนาจ สิทธิ เงื่อนไข วิธีปฏิบัติ ข้อยกเว้น ระยะเวลา อัตรา และหลักเกณฑ์ที่เกี่ยวข้องกับ ${topic.text}`,
      queryRelevance: 0.46,
      official: true,
      sourcePriority: 90
    },
    bad: {
      title: `ข่าวประชาสัมพันธ์กิจกรรมล่าสุดเกี่ยวกับ ${topic.text}`,
      snippet: `ภาพกิจกรรม การประชุม การอบรม และข่าวทั่วไปของหน่วยงาน`,
      queryRelevance: 0.99,
      official: true,
      sourcePriority: 100
    }
  };
}

const failureKinds = new Map();
const byBehavior = Object.fromEntries(behaviors.map(b => [b.id, { pass:0, fail:0 }]));
const byDistortion = Object.fromEntries(distortions.map(d => [d.id, { pass:0, fail:0 }]));
const byDomain = {};
const byVariant = Object.fromEntries(variants.map(v => [v.id, { pass:0, fail:0 }]));
const firstFailures = [];
let total = 0;
let passed = 0;
let failed = 0;
const startedAt = Date.now();

for (const topic of topics) {
  for (const distortion of distortions) {
    for (const behavior of behaviors) {
      for (const variant of variants) {
        total += 1;
        const base = behavior.make(topic.text);
        const q = distortion.apply(variant.apply(base));
        const plan = core.createToolRoutingPlan({ question: q, attachments: behavior.attachments || [] });
        const goalIds = core.detectOfficialSearchUserGoals(q).map(g => g.id);
        const errors = [];

        for (const tool of behavior.required || []) if (!plan.tools.includes(tool)) errors.push(`missing-tool:${tool}`);
        for (const tool of behavior.forbidden || []) if (plan.tools.includes(tool)) errors.push(`unexpected-tool:${tool}`);
        if (behavior.first && plan.tools[0] !== behavior.first) errors.push(`wrong-first:${plan.tools[0] || 'none'}`);
        if (behavior.order && !inOrder(plan.tools, behavior.order)) errors.push(`wrong-order:${plan.tools.join('>')}`);
        if (behavior.noWeb && plan.flags?.explicitNoWeb !== true) errors.push('no-web-not-recognized');
        if (plan.tools.at(-1) !== 'ai-reasoning') errors.push('ai-not-final');

        const expectedGoal = expectedGoalFor(topic, behavior.goal);
        if (expectedGoal && !goalIds.includes(expectedGoal)) errors.push(`missing-goal:${expectedGoal}`);

        if (behavior.evidence) {
          const pair = evidencePair(topic);
          const ranked = core.rankOfficialSearchResultsForOutcome([pair.bad, pair.good], q, core.detectOfficialSearchUserGoals(q));
          if (ranked[0]?.title !== pair.good.title) errors.push('evidence-distractor-won');
        }

        const ok = errors.length === 0;
        byBehavior[behavior.id][ok ? 'pass' : 'fail'] += 1;
        byDistortion[distortion.id][ok ? 'pass' : 'fail'] += 1;
        byVariant[variant.id][ok ? 'pass' : 'fail'] += 1;
        byDomain[topic.domain] ||= { pass:0, fail:0 };
        byDomain[topic.domain][ok ? 'pass' : 'fail'] += 1;

        if (ok) {
          passed += 1;
        } else {
          failed += 1;
          for (const error of errors) failureKinds.set(error, (failureKinds.get(error) || 0) + 1);
          if (firstFailures.length < 100) {
            firstFailures.push({ id:`FC${String(total).padStart(7,'0')}`, domain:topic.domain, topic:topic.id, distortion:distortion.id, behavior:behavior.id, variant:variant.id, q, tools:plan.tools.join(' > '), goals:goalIds.join(','), errors });
          }
        }
      }
    }
  }
}

assert.equal(total, 1_000_000, 'final closure suite must execute exactly 1,000,000 cases');
const durationMs = Date.now() - startedAt;

console.log(`GovPrompt FINAL CLOSURE 1,000,000: ${passed}/${total} passed; FAIL=${failed}; durationMs=${durationMs}`);
console.log('Behavior distribution:', byBehavior);
console.log('Distortion distribution:', byDistortion);
console.log('Variant distribution:', byVariant);
console.log('Domain distribution:', byDomain);
console.log('Failure clusters:', Object.fromEntries([...failureKinds.entries()].sort((a,b)=>b[1]-a[1])));

if (failed) {
  console.error('First failures:');
  for (const r of firstFailures) {
    console.error(`${r.id} [${r.domain}/${r.topic}/${r.distortion}/${r.behavior}/${r.variant}] ${r.q}`);
    console.error(`  tools=${r.tools}`);
    console.error(`  goals=${r.goals}`);
    console.error(`  errors=${r.errors.join(';')}`);
  }
  process.exitCode = 1;
} else {
  console.log('GovPrompt FINAL CLOSURE passed: 1,000,000 deterministic adversarial real-use simulations across tool routing, explicit no-web obedience, attachment/Drive/Gmail source ordering, current-law verification, user-goal detection and outcome evidence-fit ranking.');
}
