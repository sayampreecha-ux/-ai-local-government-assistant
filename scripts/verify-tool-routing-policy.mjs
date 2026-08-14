import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.runInNewContext(await readFile('assets/js/core/tool-routing-policy.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;

const cases = [
  { q: 'ช่วยร่างหนังสือราชการแจ้งกำหนดการประชุม', mode: 'ai-only', tools: ['ai-reasoning'] },
  { q: 'ช่วยสรุปข้อความนี้ให้ผู้บริหารอ่านง่าย', mode: 'ai-only', tools: ['ai-reasoning'] },
  { q: 'ช่วยร่างโพสต์ประชาสัมพันธ์กิจกรรม', mode: 'ai-only', tools: ['ai-reasoning'] },
  { q: 'ช่วยร่างอีเมลแจ้งประชุมให้สุภาพ', mode: 'ai-only', tools: ['ai-reasoning'], excludes: ['gmail'] },
  { q: 'ระเบียบล่าสุดเรื่องค่าเดินทางไปราชการยังใช้ฉบับไหน', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ช่วยตรวจ TOR โครงการถนนว่ามีความเสี่ยงล็อกสเปกไหม', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ตรวจ ที โอ อาร์ ว่าล็อกสเปกหรือไม่', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'จัดทำขอบเขตของงานจ้างปรับปรุงถนน', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'จัดซื้อคอมพิวเตอร์ควรใช้วิธีไหน', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ค่าแท็กซี่ไปราชการเบิกได้ไหม', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ถนนน้ำท่วมขาด จะใช้เงินสะสมซ่อม 5 แสนได้ไหม', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ขอใช้เงินสำรองจ่ายซ่อมถนนน้ำท่วมฉุกเฉิน', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ขาดราชการ 16 วันต้องดำเนินการอย่างไร', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'โอนย้ายข้าราชการท้องถิ่นต้องทำอย่างไร', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'เงินบำรุง รพ.สต. ซื้อวัสดุได้ไหม', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'การเปิดประชุมสภาท้องถิ่นต้องทำอย่างไร', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'สมาชิกสภามีส่วนได้เสียลงมติได้ไหม', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'หาอีเมลเดิมที่เคยส่งเรื่อง MOU ให้หน่อย', mode: 'user-data-first', tools: ['gmail', 'ai-reasoning'], excludes: ['web-search'] },
  { q: 'ช่วยสรุปอีเมลที่ได้รับจากเทศบาล', mode: 'user-data-first', tools: ['gmail', 'ai-reasoning'] },
  { q: 'หาไฟล์ TOR ที่เคยทำใน Google Drive', mode: 'user-data-first', tools: ['drive-files', 'ai-reasoning'], excludes: ['web-search'] },
  { q: 'เปิดเอกสารเดิมใน Drive เรื่องโครงการเศรษฐกิจพอเพียง', mode: 'user-data-first', tools: ['drive-files', 'ai-reasoning'] },
  { q: 'ช่วยสรุปเอกสารนี้', attachments: [{ name: 'report.pdf' }], mode: 'attachment-first', tools: ['attached-files', 'ai-reasoning'] },
  { q: 'ช่วยสรุป TOR ที่แนบ', attachments: [{ name: 'TOR.pdf' }], mode: 'attachment-first', tools: ['attached-files', 'ai-reasoning'], excludes: ['web-search'] },
  { q: 'ช่วยตรวจ TOR ที่แนบและระบุความเสี่ยง', attachments: [{ name: 'TOR.pdf' }], mode: 'attachment-first', tools: ['attached-files', 'web-search', 'ai-reasoning'] },
  { q: 'หาอีเมลล่าสุดที่ได้รับเรื่องระเบียบการเบิกจ่าย', mode: 'user-data-first', tools: ['gmail', 'ai-reasoning'], excludes: ['web-search'] }
];

for (const testCase of cases) {
  const plan = core.createToolRoutingPlan({ question: testCase.q, attachments: testCase.attachments || [] });
  assert.equal(plan.mode, testCase.mode, `${testCase.q}: wrong mode`);
  for (const tool of testCase.tools) assert.equal(plan.tools.includes(tool), true, `${testCase.q}: missing ${tool}`);
  for (const tool of testCase.excludes || []) assert.equal(plan.tools.includes(tool), false, `${testCase.q}: should not use ${tool}`);
  assert.equal(plan.tools.at(-1), 'ai-reasoning', `${testCase.q}: AI reasoning must finish the workflow`);
  assert.equal(plan.instructions.some(item => item.includes('Answer First')), true, `${testCase.q}: missing answer-first quality guidance`);
}

const draftingEmail = core.createToolRoutingPlan({ question: 'ช่วยร่างอีเมลแจ้งประชุมให้สุภาพ' });
assert.equal(draftingEmail.flags.wantsGmail, false, 'drafting an email must not imply Gmail retrieval');

const airfare = core.createToolRoutingPlan({ question: 'ค่าแท็กซี่ไปราชการเบิกได้ไหม' });
assert.equal(airfare.flags.needsPrimarySource, true, 'financial eligibility must require primary-source verification');
assert.equal(airfare.instructions.some(item => item.includes('เบิกได้ / เบิกไม่ได้ / มีเงื่อนไข')), true, 'finance guidance must lead with eligibility');

const reserveFund = core.createToolRoutingPlan({ question: 'ขอใช้เงินสำรองจ่ายซ่อมถนนน้ำท่วมฉุกเฉิน' });
assert.equal(reserveFund.flags.needsPrimarySource, true, 'reserve-fund use must require primary-source verification');
assert.equal(reserveFund.tools.includes('web-search'), true, 'reserve-fund use must search official current sources');

const draftingLetter = core.createToolRoutingPlan({ question: 'ช่วยร่างหนังสือราชการแจ้งกำหนดการประชุม' });
assert.equal(draftingLetter.instructions.some(item => item.includes('ร่างฉบับพร้อมใช้ก่อน')), true, 'official-letter guidance must draft first');

const tor = core.createToolRoutingPlan({ question: 'ช่วยตรวจ TOR โครงการถนนว่ามีความเสี่ยงล็อกสเปกไหม' });
assert.equal(tor.instructions.some(item => item.includes('เกณฑ์ตรวจรับ')), true, 'TOR guidance must include acceptance criteria');
assert.equal(tor.instructions.some(item => item.includes('ล็อกสเปก')), true, 'TOR guidance must surface lock-spec risk');

const thaiTor = core.createToolRoutingPlan({ question: 'ตรวจ ที โอ อาร์ ว่าล็อกสเปกหรือไม่' });
assert.equal(thaiTor.flags.needsPrimarySource, true, 'Thai TOR wording must require primary-source verification');
assert.equal(thaiTor.tools.includes('web-search'), true, 'Thai TOR wording must search official current sources');

const legal = core.createToolRoutingPlan({ question: 'ช่วยวิเคราะห์ข้อกฎหมายล่าสุดเรื่องอำนาจขององค์กรปกครองส่วนท้องถิ่น' });
assert.equal(legal.instructions.some(item => item.includes('ประเด็นกฎหมาย')), true, 'legal guidance must structure legal analysis');
assert.equal(legal.instructions.some(item => item.includes('ห้ามใส่เลขมาตรา')), true, 'legal guidance must prevent fabricated citations');

const procurement = core.createToolRoutingPlan({ question: 'ช่วยตรวจขั้นตอน วิธีการ และเงื่อนไขการจัดซื้อจัดจ้างภาครัฐ' });
assert.equal(procurement.instructions.some(item => item.includes('ลำดับขั้นปฏิบัติ')), true, 'procurement guidance must be procedural');
assert.equal(procurement.instructions.some(item => item.includes('การแข่งขันอย่างเป็นธรรม')), true, 'procurement guidance must include competition risk');

const attachedTor = core.createToolRoutingPlan({ question: 'ช่วยตรวจ TOR ที่แนบ', attachments: [{ name: 'TOR.pdf' }] });
assert.equal(attachedTor.tools[0], 'attached-files', 'attachments must be read before external search');
assert.equal(attachedTor.tools.includes('web-search'), true, 'compliance review of attached TOR must verify current primary sources');

const summarizeAttachedTor = core.createToolRoutingPlan({ question: 'ช่วยสรุป TOR ที่แนบ', attachments: [{ name: 'TOR.pdf' }] });
assert.equal(summarizeAttachedTor.tools.includes('web-search'), false, 'summarizing attached TOR must not search web without verification intent');
assert.equal(summarizeAttachedTor.flags.externalVerificationRequested, false, 'summary-only attachment task must not imply external verification');

const findDriveTor = core.createToolRoutingPlan({ question: 'หาไฟล์ TOR ที่เคยทำใน Google Drive' });
assert.equal(findDriveTor.tools.includes('web-search'), false, 'finding a user Drive file must not trigger unrelated web search');

const findLatestEmail = core.createToolRoutingPlan({ question: 'หาอีเมลล่าสุดที่ได้รับเรื่องระเบียบการเบิกจ่าย' });
assert.equal(findLatestEmail.tools.includes('web-search'), false, 'latest email means latest user data, not latest external law');

const formatted = core.formatToolRoutingInstructions(attachedTor);
assert.match(formatted, /ลำดับเครื่องมือ/);
assert.match(formatted, /attached-files/);
assert.match(formatted, /web-search/);
assert.match(formatted, /Answer First/);
assert.match(formatted, /ห้ามอ้างว่าได้ค้นหรือเปิดข้อมูลแล้ว/);

console.log(`GovPrompt v7 Tool Routing Policy verification passed: ${cases.length} routing cases + source-first and Thai primary-source regressions.`);
