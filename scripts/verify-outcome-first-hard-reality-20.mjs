import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL, Date, console, fetch: async () => ({ ok: true, async json() { return { provider: 'test', searchedAt: '2026-08-14T00:00:00Z', results: [] }; } }), globalThis: {} };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/router-regression-overrides.js',
  'assets/js/core/hybrid-intent-classifier.js',
  'assets/js/core/source-intelligence.js',
  'assets/js/core/freshness-engine.js',
  'assets/js/core/official-source-registry.js',
  'assets/js/core/citation-engine.js',
  'assets/js/core/official-search-connector.js',
  'assets/js/core/outcome-first-search-policy.js',
  'assets/js/core/tool-routing-policy.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;

const cases = [
  { id:'H01', q:'ปลัดต้น 15 ปี ไปปลัดกลางได้ยัง', goals:['career-progression'], include:['web-search'], why:'HR career progression must verify official criteria' },
  { id:'H02', q:'ชก 4 ปีขึ้น ชพ ได้มั้ย', goals:['career-progression','eligibility-decision'], include:['web-search'], why:'Thai HR abbreviations + colloquial eligibility' },
  { id:'H03', q:'เงินบำรุงซื้อครุภัณฑ์ได้มั้ย', goals:['eligibility-decision'], include:['web-search'], why:'health fund spending decision needs primary source' },
  { id:'H04', q:'อาหารกลางวันประชุมเบิกได้ไหม', goals:['eligibility-decision'], include:['web-search'], exclude:['drive-files'], why:'อาหาร must not false-positive as หา Drive' },
  { id:'H05', q:'ร่าง TOR รถขุดให้หน่อย ไม่ต้องค้นเว็บ', include:['ai-reasoning'], exclude:['web-search'], explicitNoWeb:true, why:'draft + explicit no-web must be honored' },
  { id:'H06', q:'ใช้เอกสารนี้อย่างเดียว ตรวจ TOR ให้หน่อย', attachments:['tor.pdf'], include:['attached-files','ai-reasoning'], exclude:['web-search'], explicitNoWeb:true, why:'attachment-only instruction overrides compliance web' },
  { id:'H07', q:'เปิดไฟล์แนบ TOR แล้วเทียบกับระเบียบปัจจุบัน', attachments:['tor.pdf'], include:['attached-files','web-search','ai-reasoning'], order:['attached-files','web-search','ai-reasoning'], why:'attachment first then current official verification' },
  { id:'H08', q:'รบกวนหาไฟล์ TOR ถนนในไดรฟ์ ไม่ต้องค้นเว็บ', include:['drive-files','ai-reasoning'], exclude:['web-search'], why:'natural-prefix Drive retrieval stays user-data-first' },
  { id:'H09', q:'ผู้บริหารถามว่า หาเมลล่าสุดเรื่องระเบียบเบิกจ่าย', include:['gmail','ai-reasoning'], exclude:['web-search'], why:'latest email is not latest external regulation' },
  { id:'H10', q:'คำสั่งทางปกครองอุทธรณ์กี่วัน ใช้กฎล่าสุด', goals:['duration-deadline','current-status'], include:['web-search'], why:'deadline + current law status' },
  { id:'H11', q:'ระเบียบนี้ยังไช้อยุไหม', goals:['current-status'], include:['web-search'], why:'real typo should still express current-rule intent' },
  { id:'H12', q:'เบิกค่าแท็กซี่ได้มั้ย ล่าสุดเท่าไหร่', goals:['eligibility-decision','amount-rate','current-status'], include:['web-search'], why:'colloquial ได้มั้ย/เท่าไหร่ should preserve decision intent' },
  { id:'H13', q:'โพสต์ชื่อผู้ร้องเรียนลงเพจได้ไหม', goals:['eligibility-decision'], include:['web-search'], why:'PDPA/public disclosure decision needs current authority' },
  { id:'H14', q:'สมาชิกมีส่วนได้เสียลงมติได้ไหม', goals:['eligibility-decision'], include:['web-search'], why:'council conflict-of-interest decision' },
  { id:'H15', q:'ถนนทรุดระหว่างประกันใครรับผิดชอบ', goals:['authority'], include:['web-search'], why:'warranty responsibility should seek governing contract/rules' },
  { id:'H16', q:'ใครอนุมัติใช้เงินสะสมซ่อมถนน', goals:['authority'], include:['web-search'], why:'authority + reserve fund' },
  { id:'H17', q:'สรุปคำพิพากษาไฟล์แนบนี้ ไม่ค้นภายนอก', attachments:['judgment.pdf'], include:['attached-files','ai-reasoning'], exclude:['web-search'], explicitNoWeb:true, why:'summary-only attached judgment must not browse' },
  { id:'H18', q:'หาแบบก่อสร้างเดิมใน Drive แล้วตรวจว่าถูกระเบียบล่าสุดไหม', include:['drive-files','web-search','ai-reasoning'], order:['drive-files','web-search','ai-reasoning'], why:'retrieve user file then externally verify current rule' },
  { id:'H19', q:'ทำหนังสือแจ้งผลสอบคัดเลือก ไม่ต้องค้นเว็บ', include:['ai-reasoning'], exclude:['web-search'], explicitNoWeb:true, why:'ready draft should honor explicit no-web' },
  { id:'H20', q:'เรื่องนี้ทำได้ไหม', goals:['eligibility-decision'], include:['ai-reasoning'], exclude:['web-search'], why:'generic insufficient-context question must not browse automatically' }
];

function inOrder(actual, expected) {
  let last = -1;
  for (const item of expected) {
    const idx = actual.indexOf(item);
    if (idx < 0 || idx <= last) return false;
    last = idx;
  }
  return true;
}

const results = [];
for (const tc of cases) {
  const plan = core.createToolRoutingPlan({ question: tc.q, attachments: tc.attachments || [] });
  const goalIds = core.detectOfficialSearchUserGoals(tc.q).map(g => g.id);
  const errors = [];
  for (const tool of tc.include || []) if (!plan.tools.includes(tool)) errors.push(`missing tool ${tool}`);
  for (const tool of tc.exclude || []) if (plan.tools.includes(tool)) errors.push(`unexpected tool ${tool}`);
  for (const goal of tc.goals || []) if (!goalIds.includes(goal)) errors.push(`missing goal ${goal}`);
  if (tc.order && !inOrder(plan.tools, tc.order)) errors.push(`wrong tool order ${plan.tools.join(' > ')}`);
  if (tc.explicitNoWeb === true && plan.flags.explicitNoWeb !== true) errors.push('explicit no-web not recognized');
  results.push({ id:tc.id, pass:errors.length===0, query:tc.q, tools:plan.tools.join(' > '), goals:goalIds.join(','), why:tc.why, errors });
}

// Outcome evidence torture: relevant evidence must beat attractive but off-topic official evidence.
const evidenceTrials = [
  {
    q:'ปลัดต้นกี่ปีถึงจะเป็นปลัดกลางได้',
    good:{ title:'มาตรฐานกำหนดตำแหน่งและหลักเกณฑ์การเลื่อนระดับข้าราชการส่วนท้องถิ่น', snippet:'คุณสมบัติ ระยะเวลาดำรงตำแหน่ง การสอบคัดเลือก และการเลื่อนตำแหน่ง', queryRelevance:0.42, official:true, sourcePriority:90 },
    bad:{ title:'ข่าวประชุมผู้บริหารท้องถิ่นล่าสุด', snippet:'ปลัดท้องถิ่นร่วมประชุมประจำปี', queryRelevance:0.95, official:true, sourcePriority:100 }
  },
  {
    q:'เบิกค่าแท็กซี่ได้ไหม ล่าสุดเท่าไร',
    good:{ title:'หลักเกณฑ์ค่าใช้จ่ายในการเดินทางไปราชการ', snippet:'สิทธิ อัตรา ค่าเดินทาง พาหนะรับจ้าง เงื่อนไขการเบิกจ่าย', queryRelevance:0.45, official:true, sourcePriority:90 },
    bad:{ title:'ข่าวประชาสัมพันธ์อบรมการเงินล่าสุด', snippet:'กิจกรรมอบรมเจ้าหน้าที่การเงิน', queryRelevance:0.96, official:true, sourcePriority:100 }
  },
  {
    q:'TOR แบบนี้เสี่ยงล็อกสเปกไหม',
    good:{ title:'แนวทางกำหนดคุณลักษณะเฉพาะและการแข่งขันอย่างเป็นธรรม', snippet:'ข้อห้าม เงื่อนไข ความเสี่ยง การกำหนดยี่ห้อ คุณลักษณะเฉพาะ และการแข่งขัน', queryRelevance:0.40, official:true, sourcePriority:90 },
    bad:{ title:'ประกาศผลผู้ชนะจัดซื้อประจำเดือน', snippet:'รายชื่อผู้ชนะและวงเงินสัญญา', queryRelevance:0.97, official:true, sourcePriority:100 }
  }
];
for (const [index, trial] of evidenceTrials.entries()) {
  const goals = core.detectOfficialSearchUserGoals(trial.q);
  const ranked = core.rankOfficialSearchResultsForOutcome([trial.bad, trial.good], trial.q, goals);
  if (ranked[0]?.title !== trial.good.title) {
    results.push({ id:`E0${index+1}`, pass:false, query:trial.q, tools:'-', goals:goals.map(g=>g.id).join(','), why:'answer-fit must beat high lexical relevance distractor', errors:[`ranked wrong evidence first: ${ranked[0]?.title}`] });
  } else {
    results.push({ id:`E0${index+1}`, pass:true, query:trial.q, tools:'-', goals:goals.map(g=>g.id).join(','), why:'answer-fit beats distractor', errors:[] });
  }
}

const hard = results.filter(r => /^H/.test(r.id));
const evidence = results.filter(r => /^E/.test(r.id));
const failed = results.filter(r => !r.pass);
console.table(results.map(r => ({ id:r.id, status:r.pass?'PASS':'FAIL', query:r.query, tools:r.tools, goals:r.goals, errors:r.errors.join('; ') })));
console.log(`GovPrompt Hard Reality 20: ${hard.filter(r=>r.pass).length}/20 passed; FAIL=${hard.filter(r=>!r.pass).length}`);
console.log(`Outcome evidence torture: ${evidence.filter(r=>r.pass).length}/${evidence.length} passed`);
if (failed.length) {
  console.error(`Hard Reality failures: ${failed.length}`);
  for (const r of failed) console.error(`${r.id}: ${r.query} -> ${r.errors.join('; ')}`);
  process.exitCode = 1;
} else {
  console.log('GovPrompt Outcome-First Hard Reality verification passed: outcome/tool/evidence behavior survives adversarial real-language cases.');
}
