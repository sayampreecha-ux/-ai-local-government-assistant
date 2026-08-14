import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { scenarios } from '../tests/fixtures/govprompt-simulated-work-200.mjs';

const sandbox = { window: {}, location: { pathname: '/index.html' } };
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
  'assets/js/core/tool-routing-policy.js',
  'assets/js/core/agent-governance-policy.js',
  'assets/js/core/output-router.js',
  'assets/js/core/prompt-orchestrator.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;

const A = (q, modules, mode, tools, output, attachments = []) => ({ q, modules: Array.isArray(modules) ? modules : [modules], mode, tools, output, attachments });
const extra = [
  // GP001 งานสารบรรณ / เอกสาร
  A('ร่างหนังสือแจ้งทุกกองให้ส่งข้อมูลผลการดำเนินงานภายในวันศุกร์', 'GP001', 'ai-only', ['ai-reasoning'], 'official_document'),
  A('ทำบันทึกข้อความเสนอผู้บริหารเพื่อทราบผลการประชุมเมื่อวาน', 'GP001', 'ai-only', ['ai-reasoning'], 'official_document'),
  A('ร่างหนังสือขอความร่วมมือเทศบาลส่งข้อมูลตลาดกลาง', 'GP001', 'ai-only', ['ai-reasoning'], 'official_document'),
  A('ช่วยสรุปหนังสือที่แนบให้เหลือ 1 หน้า', ['GP001','GP011'], 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'letter.pdf'}]),
  A('ช่วยตรวจถ้อยคำหนังสือราชการที่แนบให้สุภาพขึ้น', 'GP001', 'attachment-first', ['attached-files','ai-reasoning'], 'official_document', [{name:'draft.docx'}]),
  A('หาไฟล์หนังสือ MOU ตลาดกลางที่เคยทำใน Google Drive', ['GP001','GP002'], 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลล่าสุดที่เทศบาลส่งเรื่องนัดประชุม', 'GP001', 'user-data-first', ['gmail','ai-reasoning'], null),
  A('ร่างหนังสือตอบข้อหารือโดยยังไม่ใส่เลขหนังสือและวันที่', 'GP001', 'ai-only', ['ai-reasoning'], 'official_document'),
  A('ทำหนังสือแจ้งเลื่อนประชุม รพ.สต. 54 แห่ง', 'GP001', 'ai-only', ['ai-reasoning'], 'official_document'),
  A('สรุปเอกสารแนบเพื่อทำบันทึกเสนอผู้บริหาร', ['GP001','GP011'], 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'report.pdf'}]),

  // GP002 กฎหมาย
  A('อบจ.ทำ MOU ร่วมเทศบาลเพื่อบริหารตลาดกลางได้ไหม ตรวจข้อกฎหมายล่าสุดให้ด้วย', 'GP002', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('หนังสือสั่งการฉบับนี้ยังใช้ได้อยู่ไหม', 'GP002', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ข้อบัญญัติท้องถิ่นขัดกับกฎกระทรวงได้ไหม', 'GP002', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ช่วยสรุปคำพิพากษาที่แนบ ไม่ต้องค้นข้อมูลเพิ่ม', 'GP002', 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'judgment.pdf'}]),
  A('ช่วยตรวจคำพิพากษาที่แนบแล้วเทียบกับกฎหมายปัจจุบัน', 'GP002', 'attachment-first', ['attached-files','web-search','ai-reasoning'], 'analysis', [{name:'judgment.pdf'}]),
  A('หาไฟล์ข้อหารือเรื่องมอบอำนาจใน Drive', 'GP002', 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลเดิมเรื่องข้อหารือกฎหมายจากจังหวัด', 'GP002', 'user-data-first', ['gmail','ai-reasoning'], null),
  A('อปท.เปิดเผยชื่อผู้ร้องเรียนให้ผู้ถูกร้องทราบได้หรือไม่', 'GP002', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('คำสั่งทางปกครองออกผิดขั้นตอนสามารถแก้ไขภายหลังได้ไหม', 'GP002', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ช่วยวิเคราะห์ข้อกฎหมายโดยแยกเรื่องที่ยืนยันแล้วกับเรื่องที่ต้องค้นต้นฉบับ', 'GP002', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),

  // GP003 พัสดุ/TOR
  A('ร่าง TOR จัดซื้อคอมพิวเตอร์ 20 เครื่อง', 'GP003', 'web-when-needed', ['web-search','ai-reasoning'], 'tor'),
  A('ตรวจ TOR ที่แนบว่าล็อกสเปกหรือไม่', 'GP003', 'attachment-first', ['attached-files','web-search','ai-reasoning'], 'tor', [{name:'TOR.pdf'}]),
  A('สรุป TOR ที่แนบให้ผู้บริหารอ่าน 1 หน้า', 'GP003', 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'TOR.pdf'}]),
  A('e-bidding ไม่มีผู้ยื่นข้อเสนอควรทำอย่างไร', 'GP003', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ผู้รับจ้างส่งงานล่าช้าคิดค่าปรับอย่างไรตามหลักปัจจุบัน', 'GP003', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ซื้อวัสดุร้านเดิมหลายครั้งเสี่ยงแบ่งซื้อแบ่งจ้างไหม', 'GP003', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('หาไฟล์ TOR ถนนที่เคยทำใน Google Drive', 'GP003', 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลล่าสุดจากผู้รับจ้างเรื่องส่งมอบงาน', 'GP003', 'user-data-first', ['gmail','ai-reasoning'], null),
  A('จัดทำขอบเขตของงานจ้างปรับปรุงถนน พร้อมเกณฑ์ตรวจรับ', 'GP003', 'web-when-needed', ['web-search','ai-reasoning'], 'tor'),
  A('ตรวจคุณสมบัติผู้เสนอราคาใน TOR ว่าสูงเกินจำเป็นไหม', 'GP003', 'web-when-needed', ['web-search','ai-reasoning'], 'tor'),

  // GP004 แผน/งบประมาณ/โครงการ
  A('ทำโครงการอบรม AI เจ้าหน้าที่ งบ 300000 บาท', 'GP004', 'ai-only', ['ai-reasoning'], 'project'),
  A('ขอใช้เงินสำรองจ่ายซ่อมถนนน้ำท่วมฉุกเฉินได้ไหม', 'GP004', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ถนนน้ำท่วมขาดจะใช้เงินสะสมซ่อม 500000 บาทได้ไหม', 'GP004', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ร่างโครงการส่งเสริมอาชีพผู้สูงอายุ', ['GP004','GP008'], 'ai-only', ['ai-reasoning'], 'project'),
  A('ช่วยสรุปโครงการที่แนบเฉพาะสาระสำคัญ', 'GP004', 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'project.docx'}]),
  A('ตรวจโครงการที่แนบว่าฐานอำนาจและแหล่งงบถูกต้องตามปัจจุบันไหม', 'GP004', 'attachment-first', ['attached-files','web-search','ai-reasoning'], 'analysis', [{name:'project.docx'}]),
  A('หาไฟล์แผนพัฒนาท้องถิ่นฉบับที่เคยทำใน Drive', 'GP004', 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลเรื่องปรับแผนงบประมาณล่าสุด', 'GP004', 'user-data-first', ['gmail','ai-reasoning'], null),
  A('ช่วยทำกรอบเหตุผลความจำเป็นโครงการเครื่องจักรกล', 'GP004', 'ai-only', ['ai-reasoning'], 'project'),
  A('ตรวจว่าโครงการนี้อยู่ในภารกิจ อปท. หรือไม่', ['GP002','GP004'], 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),

  // GP005 การเงิน/เบิกจ่าย
  A('ค่าแท็กซี่พะเยาเชียงรายไปราชการเบิกได้ไหม', 'GP005', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ค่าทำปกเอกสารเบิกได้ไหม', 'GP005', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ตรวจเอกสารเบิกจ่ายก่อนเสนออนุมัติ', 'GP005', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ช่วยสรุปฎีกาเบิกจ่ายที่แนบ ไม่ต้องค้นเพิ่ม', 'GP005', 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'payment.pdf'}]),
  A('ตรวจฎีกาที่แนบว่าเบิกได้ตามระเบียบล่าสุดไหม', 'GP005', 'attachment-first', ['attached-files','web-search','ai-reasoning'], 'analysis', [{name:'payment.pdf'}]),
  A('หาไฟล์แนวทางเบิกค่าเดินทางที่เคยเก็บใน Drive', 'GP005', 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลล่าสุดที่ได้รับเรื่องระเบียบการเบิกจ่าย', 'GP005', 'user-data-first', ['gmail','ai-reasoning'], null),
  A('จัดเลี้ยงข้าวกล่องตำรวจในงานราชการเบิกได้ไหม', 'GP005', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('เบิกค่าอาหารประชุมกรณีประชุมครึ่งวันได้ไหม', 'GP005', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ช่วยทำ checklist เอกสารประกอบการเบิกค่าเดินทางราชการ', 'GP005', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),

  // GP006 บุคคล
  A('ลาป่วยเกินสามวันต้องมีใบรับรองแพทย์ไหม', 'GP006', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ขาดราชการ 16 วันต้องดำเนินการอย่างไร', 'GP006', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('โอนย้ายข้าราชการท้องถิ่นต้องทำอย่างไรตามหลักปัจจุบัน', 'GP006', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ร่างบันทึกขอเพิ่มอัตรากำลัง', 'GP006', 'ai-only', ['ai-reasoning'], 'official_document'),
  A('ช่วยสรุปประวัติการรับราชการจากเอกสารแนบ', 'GP006', 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'profile.pdf'}]),
  A('ตรวจคำสั่งเลื่อนเงินเดือนที่แนบว่ามีประเด็นกฎหมายไหม', 'GP006', 'attachment-first', ['attached-files','web-search','ai-reasoning'], 'analysis', [{name:'order.pdf'}]),
  A('หาไฟล์คำสั่งมอบหมายงานบุคคลใน Drive', 'GP006', 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลล่าสุดเรื่องขอโอนย้าย', 'GP006', 'user-data-first', ['gmail','ai-reasoning'], null),
  A('พนักงานส่วนท้องถิ่นถูกเพิกถอนคำสั่งบรรจุต้องทำอย่างไร', 'GP006', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ร่างหนังสือแจ้งผลการพิจารณาเรื่องบุคคลโดยไม่ใส่ข้อมูลส่วนบุคคลเกินจำเป็น', 'GP006', 'ai-only', ['ai-reasoning'], 'official_document'),

  // GP007 งานช่าง
  A('ถนนคอนกรีตแตกร้าวระหว่างประกันต้องทำอย่างไร', 'GP007', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('สรุปปัญหาหน้างานก่อสร้างเสนอผู้บริหาร', 'GP007', 'ai-only', ['ai-reasoning'], 'analysis'),
  A('ช่วยตรวจรายงานผลทดสอบความหนาแน่นดินที่แนบ', 'GP007', 'attachment-first', ['attached-files','ai-reasoning'], 'analysis', [{name:'soil-test.pdf'}]),
  A('ตรวจมาตรฐานความเรียบผิวถนนล่าสุดที่ใช้กับงานนี้', 'GP007', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('หาแบบก่อสร้างถนนโครงการเดิมใน Drive', 'GP007', 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลผู้ควบคุมงานล่าสุดเรื่องแก้ไขงาน', 'GP007', 'user-data-first', ['gmail','ai-reasoning'], null),
  A('ทำ checklist ตรวจรับงานถนนก่อนหมดประกัน', 'GP007', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ผู้รับจ้างขอเปลี่ยนวัสดุก่อสร้างจากแบบเดิมควรพิจารณาอะไร', ['GP003','GP007'], 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ร่างบันทึกแจ้งผู้รับจ้างเข้าซ่อมงานในระยะประกัน', 'GP007', 'ai-only', ['ai-reasoning'], 'official_document'),
  A('สรุปรูปถ่ายหน้างานและรายงานแนบเป็นประเด็นเสนอผู้บริหาร', 'GP007', 'attachment-first', ['attached-files','ai-reasoning'], 'analysis', [{name:'site-report.pdf'}]),

  // GP008 สาธารณสุข
  A('เงินบำรุง รพ.สต. ซื้อครุภัณฑ์ได้ไหม', 'GP008', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ทำโครงการส่งเสริมสุขภาพผู้สูงอายุ', 'GP008', 'ai-only', ['ai-reasoning'], 'project'),
  A('ช่วยตรวจโครงการผู้สูงอายุ รพ.สต. ที่แนบว่าใช้เงินบำรุงได้ไหม', 'GP008', 'attachment-first', ['attached-files','web-search','ai-reasoning'], 'analysis', [{name:'health-project.docx'}]),
  A('สรุปรายงานประชุม รพ.สต. 54 แห่งจากไฟล์แนบ', 'GP008', 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'meeting.pdf'}]),
  A('ร่างหนังสือแจ้ง รพ.สต. ส่งข้อมูลผลการดำเนินงาน', ['GP001','GP008'], 'ai-only', ['ai-reasoning'], 'official_document'),
  A('หาไฟล์แนวทางเงินบำรุง รพ.สต. ที่เคยเก็บใน Drive', 'GP008', 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลล่าสุดจาก รพ.สต. เรื่องเงินบำรุง', 'GP008', 'user-data-first', ['gmail','ai-reasoning'], null),
  A('รพ.สต. ใช้ข้อมูลผู้ป่วยจริงกับ AI ได้ไหม', 'GP008', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ช่วยทำ checklist PDPA ก่อนใช้ AI กับงานสาธารณสุข', 'GP008', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ร่างสรุปผู้บริหารผลอบรม AI บุคลากร รพ.สต.', ['GP008','GP011'], 'ai-only', ['ai-reasoning'], 'analysis'),

  // GP009/012 การศึกษา กีฬา PR
  A('จัดการแข่งขันกีฬาเยาวชน', 'GP009', 'ai-only', ['ai-reasoning'], 'project'),
  A('ทำโครงการสัปดาห์วิทยาศาสตร์สำหรับนักเรียน', 'GP009', 'ai-only', ['ai-reasoning'], 'project'),
  A('ร่างโพสต์ประชาสัมพันธ์การแข่งขันกีฬาเยาวชน', 'GP012', 'ai-only', ['ai-reasoning'], null),
  A('ทำข้อความเชิญชวนใช้ GovPrompt แบบกลางๆ ไม่ขายเกินไป', 'GP012', 'ai-only', ['ai-reasoning'], null),
  A('สรุปข่าวประชาสัมพันธ์จากเอกสารแนบให้พร้อมโพสต์', 'GP012', 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'news.docx'}]),
  A('หาไฟล์ภาพประชาสัมพันธ์เดิมใน Drive', 'GP012', 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลล่าสุดเรื่องกำหนดการวันเด็ก', ['GP009','GP012','GP001'], 'user-data-first', ['gmail','ai-reasoning'], null),
  A('ร่างคำกล่าวเปิดงานวันเด็ก', 'GP011', 'ai-only', ['ai-reasoning'], null),
  A('ทำ executive summary โครงการกีฬา 1 หน้าเสนอผู้บริหาร', 'GP011', 'ai-only', ['ai-reasoning'], 'analysis'),
  A('ทำโพสต์จากข้อมูลที่ให้ โดยไม่ค้นเว็บเพิ่ม', 'GP012', 'ai-only', ['ai-reasoning'], null),

  // GP010/011/013 ตรวจสอบ ผู้บริหาร สภา
  A('ตรวจสอบภายในเอกสารเบิกจ่ายมีความเสี่ยงอะไร', 'GP010', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ประเมินการควบคุมภายในงานพัสดุ', 'GP010', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('สรุปรายงานตรวจสอบภายในที่แนบให้ผู้บริหาร', ['GP010','GP011'], 'attachment-first', ['attached-files','ai-reasoning'], 'analysis', [{name:'audit.pdf'}]),
  A('ทำ executive summary ผลการดำเนินงาน 1 หน้า', 'GP011', 'ai-only', ['ai-reasoning'], 'analysis'),
  A('สรุปญัตติเสนอประชุมสภาท้องถิ่น', 'GP013', 'ai-only', ['ai-reasoning'], 'analysis'),
  A('ประชุมสภาท้องถิ่นต้องมีองค์ประชุมกี่คนตามกฎหมายปัจจุบัน', 'GP013', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('สมาชิกสภามีส่วนได้เสียลงมติได้ไหม', 'GP013', 'web-when-needed', ['web-search','ai-reasoning'], 'analysis'),
  A('ช่วยสรุปรายงานประชุมสภาที่แนบ ไม่ต้องค้นเพิ่ม', 'GP013', 'attachment-first', ['attached-files','ai-reasoning'], null, [{name:'council.pdf'}]),
  A('หาไฟล์รายงานประชุมสภาครั้งก่อนใน Drive', 'GP013', 'user-data-first', ['drive-files','ai-reasoning'], null),
  A('หาอีเมลล่าสุดเรื่องนัดประชุมสภา', 'GP013', 'user-data-first', ['gmail','ai-reasoning'], null),
];

assert.equal(scenarios.length, 200, 'baseline simulated work fixture must contain 200 cases');
assert.equal(extra.length, 100, 'real-case detail fixture must contain exactly 100 cases');

const failures = [];
let baselineRoutePass = 0;
for (const scenario of scenarios) {
  const route = core.routeRequest(scenario.userRequest, { multiModule: false });
  if (scenario.expectedModules.includes(route.primaryModule)) baselineRoutePass += 1;
  else failures.push({ id: scenario.id, q: scenario.userRequest, issue: 'baseline-route', expected: scenario.expectedModules, actual: route.primaryModule });
}

let detailPass = 0;
for (let i = 0; i < extra.length; i += 1) {
  const item = extra[i];
  const id = `REAL${String(i + 201).padStart(3, '0')}`;
  const route = core.routeRequest(item.q, { multiModule: false });
  const toolPlan = core.createToolRoutingPlan({ question: item.q, attachments: item.attachments });
  const context = core.createSharedContext({ facts: item.q, desiredOutput: item.q });
  const bundle = core.createGovernmentPrompt({ question: item.q, route, context });
  const output = core.routeOutput(item.q, { moduleId: route.primaryModule });

  const checks = {
    route: item.modules.includes(route.primaryModule),
    mode: toolPlan.mode === item.mode,
    requiredTools: item.tools.every(tool => toolPlan.tools.includes(tool)),
    aiFinishes: toolPlan.tools.at(-1) === 'ai-reasoning',
    answerFirst: bundle.prompt.includes('Answer First'),
    noCorruptAnswerFirst: !bundle.prompt.includes('รหัสผู้ป่วย [ปกปิด] First'),
    outputReady: Boolean(bundle.outputPlan?.label && bundle.outputPlan?.format),
    expectedOutput: !item.output || output.id === item.output,
    sourceOrder: !item.attachments.length || toolPlan.tools[0] === 'attached-files',
    noRedundantWeb: !['ai-only','user-data-first'].includes(item.mode) || !toolPlan.tools.includes('web-search'),
  };

  if (Object.values(checks).every(Boolean)) detailPass += 1;
  else failures.push({ id, q: item.q, issue: 'detail', expectedModules: item.modules, actualModule: route.primaryModule, expectedMode: item.mode, actualMode: toolPlan.mode, tools: toolPlan.tools, expectedOutput: item.output, actualOutput: output.id, checks });
}

const totalPass = baselineRoutePass + detailPass;
console.log(`GovPrompt Real-Case Quality Gate 300: ${totalPass}/300 passed`);
console.log(`  Baseline routing: ${baselineRoutePass}/200`);
console.log(`  Detailed E2E cases: ${detailPass}/100`);
if (failures.length) {
  console.log(`  Failures: ${failures.length}`);
  console.log(JSON.stringify(failures, null, 2));
}

assert.equal(baselineRoutePass, 200, `baseline regression: ${200 - baselineRoutePass} routing cases failed`);
assert.equal(detailPass, 100, `detailed E2E regression: ${100 - detailPass} cases failed`);
assert.equal(failures.length, 0, `${failures.length} total real-case quality failures`);
console.log('GovPrompt 300-case real-work quality gate passed: Router + Tool Routing + Prompt Engine + Output Router.');
