import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const expectedIds = Object.freeze([
  'easy-summary',
  'step-by-step',
  'timeline',
  'comparison',
  'workflow',
  'checklist',
  'do-dont',
  'framework',
  'key-insights',
  'quick-guide'
]);

const [presetSource, sharedContextSource, outputRouterSource, orchestratorSource, index, home, registry] = await Promise.all([
  readFile('assets/js/core/output-format-presets-v1.js', 'utf8'),
  readFile('assets/js/core/shared-context.js', 'utf8'),
  readFile('assets/js/core/output-router.js', 'utf8'),
  readFile('assets/js/core/prompt-orchestrator.js', 'utf8'),
  readFile('index.html', 'utf8'),
  readFile('assets/js/home-v3.js', 'utf8'),
  readFile('assets/js/core/prompt-registry.js', 'utf8')
]);

function loadCore() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  for (const source of [presetSource, sharedContextSource, outputRouterSource, orchestratorSource]) {
    vm.runInContext(source, sandbox);
  }
  return sandbox.window.GovPromptCore;
}

test('v7 exposes exactly the ten approved output presentation presets', () => {
  const core = loadCore();
  assert.deepEqual(Array.from(core.OUTPUT_FORMAT_PRESETS, item => item.id), expectedIds);
  assert.equal(new Set(core.OUTPUT_FORMAT_PRESETS.map(item => item.id)).size, 10);
  assert.equal(Object.isFrozen(core.OUTPUT_FORMAT_PRESETS), true);
  for (const preset of core.OUTPUT_FORMAT_PRESETS) {
    assert.equal(Object.isFrozen(preset), true);
    assert.equal(Object.isFrozen(preset.structure), true);
    assert.ok(preset.label && preset.description && preset.structure.length >= 4);
  }
});

test('presentation blocks fail safely and retain government-work safeguards', () => {
  const core = loadCore();
  assert.equal(core.resolveOutputFormatPreset('auto'), null);
  assert.equal(core.resolveOutputFormatPreset('unknown-format'), null);
  const block = core.buildOutputFormatPresetBlock('timeline');
  assert.match(block, /Timeline/);
  assert.match(block, /\[ต้องตรวจสอบ\/เพิ่มเติม\]/);
  assert.match(block, /กฎหมาย การเงิน และพัสดุ/);
  assert.match(block, /ข้อมูลส่วนบุคคล/);
  assert.match(block, /Human Approval|อนุมัติ/);
  assert.match(block, /ไม่สร้างตราสัญลักษณ์หรือคำรับรอง/);
});

test('selected presentation augments rather than replaces the routed deliverable', () => {
  const core = loadCore();
  const question = 'ช่วยร่าง TOR สำหรับจัดซื้อครุภัณฑ์สำนักงาน';
  const context = core.createSharedContext({ facts: question, desiredOutput: question });
  const bundle = core.createGovernmentPrompt({ question, context, outputFormatId: 'comparison' });
  assert.equal(bundle.outputPlan.id, 'tor');
  assert.equal(bundle.outputFormatId, 'comparison');
  assert.equal(bundle.presentationPreset.id, 'comparison');
  assert.match(bundle.prompt, /ชิ้นงานหลักที่ Output Router เลือก/);
  assert.match(bundle.prompt, /รูปแบบการนำเสนอที่ผู้ใช้เลือก/);
  assert.match(bundle.prompt, /โดยไม่ลดทอนโครงสร้างบังคับของชิ้นงานหลัก/);
  assert.match(bundle.prompt, /งานกฎหมาย การเงิน พัสดุ และการเผยแพร่ทุกชิ้นต้องหยุดที่ฉบับร่าง/);

  const automatic = core.createGovernmentPrompt({ question, context, outputFormatId: 'auto' });
  assert.equal(automatic.outputFormatId, 'auto');
  assert.equal(automatic.presentationPreset, null);
  assert.match(automatic.prompt, /รูปแบบผลลัพธ์ที่ GovPrompt เลือกให้อัตโนมัติ/);
});

test('home exposes the presets as a composer choice without adding a homepage category', () => {
  const selector = index.match(/<select id="outputFormatSelect"[\s\S]*?<\/select>/)?.[0] || '';
  const ids = [...selector.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids, ['auto', ...expectedIds]);
  assert.ok(index.indexOf('output-format-presets-v1.js') < index.indexOf('prompt-orchestrator.js'));
  assert.ok(index.indexOf('prompt-orchestrator.js') < index.indexOf('home-v3.js'));
  assert.match(home, /outputFormatId: outputFormatSelect\?\.value \|\| 'auto'/);
  assert.match(home, /Workspace องค์กร/);
  assert.match(home, /govprompt-thailand-v6\/pilot\//);
  assert.doesNotMatch(home, /<strong>ศูนย์งานอัตโนมัติ<\/strong>/);

  const bottomNav = index.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.doesNotMatch(bottomNav, /automation-pilot|งานอัตโนมัติ/);
  assert.match(registry, /\['GP012',\s*'ผู้ช่วยประชาสัมพันธ์'/);
});
