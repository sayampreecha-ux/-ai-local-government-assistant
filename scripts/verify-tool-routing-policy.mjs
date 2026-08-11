import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.runInNewContext(await readFile('assets/js/core/tool-routing-policy.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;

const drafting = core.createToolRoutingPlan({ question: 'ช่วยร่างหนังสือราชการแจ้งกำหนดการประชุม' });
assert.equal(drafting.mode, 'ai-only');
assert.deepEqual([...drafting.tools], ['ai-reasoning']);

const currentLaw = core.createToolRoutingPlan({ question: 'ระเบียบล่าสุดเรื่องเบิกค่าเดินทางไปราชการยังใช้ฉบับไหน' });
assert.equal(currentLaw.mode, 'web-when-needed');
assert.equal(currentLaw.tools.includes('web-search'), true);
assert.equal(currentLaw.flags.needsCurrentWeb, true);
assert.equal(currentLaw.flags.needsPrimarySource, true);

const gmail = core.createToolRoutingPlan({ question: 'หาอีเมลเดิมที่เคยส่งเรื่อง MOU ให้หน่อย' });
assert.equal(gmail.mode, 'user-data-first');
assert.equal(gmail.tools[0], 'gmail');
assert.equal(gmail.tools.includes('ai-reasoning'), true);

const drive = core.createToolRoutingPlan({ question: 'หาเอกสารเดิมใน Google Drive เรื่อง TOR' });
assert.equal(drive.mode, 'user-data-first');
assert.equal(drive.tools.includes('drive-files'), true);
assert.equal(drive.tools.includes('web-search'), true);

const attached = core.createToolRoutingPlan({ question: 'ช่วยสรุปเอกสารนี้', attachments: [{ name: 'report.pdf' }] });
assert.equal(attached.mode, 'attachment-first');
assert.equal(attached.tools[0], 'attached-files');

const formatted = core.formatToolRoutingInstructions(currentLaw);
assert.match(formatted, /ลำดับเครื่องมือ/);
assert.match(formatted, /web-search/);
assert.match(formatted, /ห้ามอ้างว่าได้ค้นหรือเปิดข้อมูลแล้ว/);

console.log('GovPrompt v7 Tool Routing Policy verification passed.');
