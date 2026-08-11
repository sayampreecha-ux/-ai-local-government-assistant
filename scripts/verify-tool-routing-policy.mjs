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
  { q: 'จัดซื้อคอมพิวเตอร์ควรใช้วิธีไหน', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ค่าแท็กซี่ไปราชการเบิกได้ไหม', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ถนนน้ำท่วมขาด จะใช้เงินสะสมซ่อม 5 แสนได้ไหม', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ขาดราชการ 16 วันต้องดำเนินการอย่างไร', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'โอนย้ายข้าราชการท้องถิ่นต้องทำอย่างไร', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'เงินบำรุง รพ.สต. ซื้อวัสดุได้ไหม', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'การเปิดประชุมสภาท้องถิ่นต้องทำอย่างไร', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'หาอีเมลเดิมที่เคยส่งเรื่อง MOU ให้หน่อย', mode: 'user-data-first', tools: ['gmail', 'ai-reasoning'], excludes: ['web-search'] },
  { q: 'ช่วยสรุปอีเมลที่ได้รับจากเทศบาล', mode: 'user-data-first', tools: ['gmail', 'ai-reasoning'] },
  { q: 'หาไฟล์ TOR ที่เคยทำใน Google Drive', mode: 'user-data-first', tools: ['drive-files', 'web-search', 'ai-reasoning'] },
  { q: 'เปิดเอกสารเดิมใน Drive เรื่องโครงการเศรษฐกิจพอเพียง', mode: 'user-data-first', tools: ['drive-files', 'ai-reasoning'] },
  { q: 'ช่วยสรุปเอกสารนี้', attachments: [{ name: 'report.pdf' }], mode: 'attachment-first', tools: ['attached-files', 'ai-reasoning'] },
  { q: 'ช่วยตรวจ TOR ที่แนบและระบุความเสี่ยง', attachments: [{ name: 'TOR.pdf' }], mode: 'attachment-first', tools: ['attached-files', 'web-search', 'ai-reasoning'] },
  { q: 'หาอีเมลล่าสุดที่ได้รับเรื่องระเบียบการเบิกจ่าย', mode: 'user-data-first', tools: ['gmail', 'web-search', 'ai-reasoning'] }
];

for (const testCase of cases) {
  const plan = core.createToolRoutingPlan({ question: testCase.q, attachments: testCase.attachments || [] });
  assert.equal(plan.mode, testCase.mode, `${testCase.q}: wrong mode`);
  for (const tool of testCase.tools) {
    assert.equal(plan.tools.includes(tool), true, `${testCase.q}: missing ${tool}`);
  }
  for (const tool of testCase.excludes || []) {
    assert.equal(plan.tools.includes(tool), false, `${testCase.q}: should not use ${tool}`);
  }
  assert.equal(plan.tools.at(-1), 'ai-reasoning', `${testCase.q}: AI reasoning must finish the workflow`);
}

const draftingEmail = core.createToolRoutingPlan({ question: 'ช่วยร่างอีเมลแจ้งประชุมให้สุภาพ' });
assert.equal(draftingEmail.flags.wantsGmail, false, 'drafting an email must not imply Gmail retrieval');

const airfare = core.createToolRoutingPlan({ question: 'ค่าแท็กซี่ไปราชการเบิกได้ไหม' });
assert.equal(airfare.flags.needsPrimarySource, true, 'financial eligibility must require primary-source verification');

const attachedTor = core.createToolRoutingPlan({ question: 'ช่วยตรวจ TOR ที่แนบ', attachments: [{ name: 'TOR.pdf' }] });
assert.equal(attachedTor.tools[0], 'attached-files', 'attachments must be read before external search');

const formatted = core.formatToolRoutingInstructions(attachedTor);
assert.match(formatted, /ลำดับเครื่องมือ/);
assert.match(formatted, /attached-files/);
assert.match(formatted, /web-search/);
assert.match(formatted, /ห้ามอ้างว่าได้ค้นหรือเปิดข้อมูลแล้ว/);

console.log(`GovPrompt v7 Tool Routing Policy verification passed: ${cases.length} routing cases.`);
