import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

export async function loadGP223Core() {
  const sandbox = { window: {}, document: { addEventListener() {}, readyState: 'loading' }, location: { pathname: '/index.html' } };
  for (const name of ['shared-context', 'prompt-registry', 'transaction-router', 'tool-routing-policy',
    'output-router', 'agent-governance-policy', 'prompt-orchestrator', 'gp223-natural-person-service']) {
    vm.runInNewContext(await readFile(`assets/js/core/${name}.js`, 'utf8'), sandbox, { filename: name });
  }
  return sandbox.window.GovPromptCore;
}

export const requiredCases = [
  { id: 1, question: 'ร่าง TOR จ้างเหมาบริการงานบัญชี', kind: 'none', expect: /ตาราง TOR งานบัญชี/ },
  { id: 2, question: 'จ้างเหมาคนขับรถต้องกำหนดเวลางานได้ไหม', kind: 'none', expect: /control\/subordination/ },
  { id: 3, question: 'ผู้รับจ้างเดินทางไปประชุมต่างจังหวัดเบิกได้ไหม', kind: 'travel', expect: /Travel Expense Gate/ },
  { id: 4, question: 'ผู้รับจ้างไปอบรมเบิกค่าใช้จ่ายได้ไหม', kind: 'training', expect: /External-Person Training Gate/ },
  { id: 5, question: 'TOR เดิมอ้าง ว 877 ใช้ต่อได้ไหม', kind: 'none', expect: /Legacy Citation \/ Supersession Check/ }
];

export function verifyCase(core, item) {
  const attachments = item.attachments || [];
  const args = { question: item.question, attachments, ...(item.workflowId ? { workflowId: item.workflowId } : {}) };
  const routing = core.createToolRoutingPlan(args);
  assert.equal(routing.mode, 'ai-only', item.question);
  assert.deepEqual([...routing.tools], ['ai-reasoning']);
  assert.equal(routing.flags.automaticLiveSearch, false);
  const context = core.createSharedContext({ facts: item.question });
  const result = core.createGovernmentPrompt({ ...args, context, route: core.routeTransaction(context) });
  assert.equal(result.gp223.canDraft, true);
  assert.equal(result.gp223.automaticLiveSearch, false);
  assert.equal(result.gp223.authorityStatus, 'UNVERIFIED');
  assert.equal(result.gp223.decisionLocks.every(lock => lock.blocksDraft === false), true);
  if (item.kind) assert.equal(result.gp223.expenseKind, item.kind);
  if (item.expect) assert.match(result.prompt, item.expect);
  assert.match(result.prompt, /Five-Document Consistency Gate/);
  assert.match(result.prompt, /ห้ามตัดสินจากมีเวลางานปัจจัยเดียว/);
  assert.match(result.prompt, /ห้ามแต่งเลขหนังสือ/);
  assert.match(result.prompt, /Decision Lock เฉพาะประเด็น/);
  assert.doesNotMatch(result.prompt, /8\. ค้นเอกสารที่เกี่ยวข้อง/);
  assert.doesNotMatch(result.prompt, /โหมดแนะนำ: web-when-needed|ลำดับเครื่องมือ:.*web-search/);
  assert.match(result.prompt, /ห้ามเปิด Modal\/Form GP223/);
  assert.match(result.prompt, /ว 727 ลงวันที่ 22 กันยายน 2569 — UNVERIFIED/);
  return result;
}
