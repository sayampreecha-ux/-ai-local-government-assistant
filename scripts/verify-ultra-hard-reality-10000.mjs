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
  ['P01','TOR รถขุด','procurement'],
  ['P02','TOR ถนนคอนกรีต','procurement'],
  ['P03','แบ่งซื้อแบ่งจ้าง','procurement'],
  ['P04','e-bidding ไม่มีผู้ยื่นข้อเสนอ','procurement'],
  ['P05','ผู้รับจ้างขอเปลี่ยนวัสดุ','procurement'],
  ['H01','ปลัดต้นไปปลัดกลาง','hr'],
  ['H02','ชก ขึ้น ชพ','hr'],
  ['H03','ลาป่วยเกินสามวัน','hr'],
  ['H04','โอนย้ายข้าราชการท้องถิ่น','hr'],
  ['H05','เลื่อนเงินเดือนผู้ถูกสอบวินัย','hr'],
  ['L01','อุทธรณ์คำสั่งทางปกครอง','legal'],
  ['L02','เปิดเผยชื่อผู้ร้องเรียน','legal'],
  ['L03','มอบอำนาจให้รองปลัด','legal'],
  ['L04','ผู้มีส่วนได้เสียร่วมพิจารณา','legal'],
  ['L05','การนับวันตามกฎหมาย','legal'],
  ['E01','ถนนทรุดระหว่างประกัน','engineering'],
  ['E02','ตรวจรับถนนลาดยาง','engineering'],
  ['E03','แบบก่อสร้างไม่มีวิศวกรเซ็น','engineering'],
  ['E04','งานเพิ่มนอกสัญญาก่อสร้าง','engineering'],
  ['E05','ขยายเวลาสัญญางานก่อสร้าง','engineering'],
  ['S01','ข้อมูลผู้ป่วยลงเพจ','health'],
  ['S02','เงินกองทุนสุขภาพซื้อครุภัณฑ์','health'],
  ['S03','ขยะติดเชื้อเก็บกี่วัน','health'],
  ['S04','รถพยาบาลรับบริจาคน้ำมัน','health'],
  ['S05','รพ.สต. เก็บค่าบริการเพิ่ม','health'],
  ['C01','สมาชิกมีส่วนได้เสียลงมติ','council'],
  ['C02','องค์ประชุมสภาท้องถิ่น','council'],
  ['C03','เสนอญัตติด่วนด้วยวาจา','council'],
  ['C04','ประชุมลับของสภา','council'],
  ['C05','ส่งหนังสือนัดประชุมสภา','council'],
  ['R01','หนังสือด่วนที่สุดส่งอีเมล','records'],
  ['R02','เก็บหนังสือราชการกี่ปี','records'],
  ['R03','ทำลายเอกสารราชการ','records'],
  ['PR1','โพสต์รูปเด็กลงเพจหน่วยงาน','pr'],
  ['PR2','แก้ข่าวประชาสัมพันธ์ผิด','pr']
].map(([id, text, domain]) => ({ id, text, domain }));
assert.equal(topics.length, 40);

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
  ['terse', q => `ขอสั้นๆ ${q} ที`]
].map(([id, apply]) => ({ id, apply }));
assert.equal(distortions.length, 10);

function expectedGoalFor(domain, behavior) {
  if (behavior === 'authority') return 'authority';
  if (behavior === 'deadline') return 'duration-deadline';
  if (behavior === 'rate') return 'amount-rate';
  if (behavior === 'risk') return 'compliance-risk';
  if (behavior === 'career' && domain === 'hr') return 'career-progression';
  if (behavior === 'current') return 'current-status';
  if (behavior === 'decision') return 'eligibility-decision';
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
      queryRelevance: 0.98,
      official: true,
      sourcePriority: 100
    }
  };
}

const results = [];
const failureKinds = new Map();
let seq = 0;
for (const topic of topics) {
  for (const distortion of distortions) {
    for (const behavior of behaviors) {
      seq += 1;
      const base = behavior.make(topic.text);
      const q = distortion.apply(base);
      const plan = core.createToolRoutingPlan({ question: q, attachments: behavior.attachments || [] });
      const goalIds = core.detectOfficialSearchUserGoals(q).map(g => g.id);
      const errors = [];

      for (const tool of behavior.required || []) if (!plan.tools.includes(tool)) errors.push(`missing-tool:${tool}`);
      for (const tool of behavior.forbidden || []) if (plan.tools.includes(tool)) errors.push(`unexpected-tool:${tool}`);
      if (behavior.first && plan.tools[0] !== behavior.first) errors.push(`wrong-first:${plan.tools[0] || 'none'}`);
      if (behavior.order && !inOrder(plan.tools, behavior.order)) errors.push(`wrong-order:${plan.tools.join('>')}`);
      if (behavior.noWeb && plan.flags?.explicitNoWeb !== true) errors.push('no-web-not-recognized');
      if (plan.tools.at(-1) !== 'ai-reasoning') errors.push('ai-not-final');

      const expectedGoal = expectedGoalFor(topic.domain, behavior.goal);
      if (expectedGoal && !goalIds.includes(expectedGoal)) errors.push(`missing-goal:${expectedGoal}`);

      if (behavior.evidence) {
        const pair = evidencePair(topic);
        const ranked = core.rankOfficialSearchResultsForOutcome([pair.bad, pair.good], q, core.detectOfficialSearchUserGoals(q));
        if (ranked[0]?.title !== pair.good.title) errors.push('evidence-distractor-won');
      }

      const pass = errors.length === 0;
      if (!pass) {
        for (const error of errors) failureKinds.set(error, (failureKinds.get(error) || 0) + 1);
      }
      results.push({ seq, id:`U${String(seq).padStart(5,'0')}`, topic:topic.id, domain:topic.domain, distortion:distortion.id, behavior:behavior.id, pass, q, tools:plan.tools.join(' > '), goals:goalIds.join(','), errors });
    }
  }
}

assert.equal(results.length, 10000, 'ultra-hard suite must contain exactly 10,000 independent cases');
const failed = results.filter(r => !r.pass);
const passed = results.length - failed.length;

const byBehavior = Object.fromEntries(behaviors.map(b => [b.id, { pass:0, fail:0 }]));
const byDistortion = Object.fromEntries(distortions.map(d => [d.id, { pass:0, fail:0 }]));
const byDomain = {};
for (const r of results) {
  byBehavior[r.behavior][r.pass ? 'pass' : 'fail'] += 1;
  byDistortion[r.distortion][r.pass ? 'pass' : 'fail'] += 1;
  byDomain[r.domain] ||= { pass:0, fail:0 };
  byDomain[r.domain][r.pass ? 'pass' : 'fail'] += 1;
}

console.log(`GovPrompt Ultra-Hard Reality 10,000: ${passed}/10000 passed; FAIL=${failed.length}`);
console.log('Behavior distribution:', byBehavior);
console.log('Distortion distribution:', byDistortion);
console.log('Domain distribution:', byDomain);
console.log('Failure clusters:', Object.fromEntries([...failureKinds.entries()].sort((a,b)=>b[1]-a[1])));

if (failed.length) {
  console.error('First 50 failures:');
  for (const r of failed.slice(0, 50)) {
    console.error(`${r.id} [${r.domain}/${r.distortion}/${r.behavior}] ${r.q}`);
    console.error(`  tools=${r.tools}`);
    console.error(`  goals=${r.goals}`);
    console.error(`  errors=${r.errors.join(';')}`);
  }
  process.exitCode = 1;
} else {
  console.log('GovPrompt Ultra-Hard Reality verification passed: 10,000 adversarial real-language cases across tool routing, no-web obedience, source ordering, goal detection and evidence-fit ranking.');
}
