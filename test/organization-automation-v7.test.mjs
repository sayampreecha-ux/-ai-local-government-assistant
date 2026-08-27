import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const [presetSource, configSource, moduleSource, html, home, trust, privacyNotice, serviceWorker] = await Promise.all([
  readFile('assets/js/core/output-format-presets-v1.js', 'utf8'),
  readFile('assets/js/core/automation-pilot-config-v1.js', 'utf8'),
  readFile('assets/js/organization-automation-v1.js', 'utf8'),
  readFile('automation-pilot.html', 'utf8'),
  readFile('assets/js/home-v3.js', 'utf8'),
  readFile('trust.html', 'utf8'),
  readFile('privacy-notice.html', 'utf8'),
  readFile('service-worker.js', 'utf8')
]);

function loadConfig() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(presetSource, sandbox);
  vm.runInContext(configSource, sandbox);
  return sandbox.window;
}

test('organization pilot exposes only the three approved workflows and ten formats', () => {
  const window = loadConfig();
  assert.deepEqual(
    Array.from(window.GOVPROMPT_AUTOMATION_PILOT.workflows, item => item.id),
    ['PROJECT_DAILY_BRIEF', 'DEADLINE_WATCH', 'TASK_WEEKLY_SUMMARY']
  );
  assert.deepEqual(
    Array.from(window.GOVPROMPT_AUTOMATION_PILOT.outputFormatIds),
    Array.from(window.GOVPROMPT_OUTPUT_FORMATS.formats, item => item.id)
  );
  assert.equal(window.GOVPROMPT_AUTOMATION_PILOT.outputFormatIds.length, 10);
});

test('human approval cannot be disabled in automation definitions', () => {
  const { GOVPROMPT_AUTOMATION_PILOT: config } = loadConfig();
  const valid = {
    name: 'สรุปงานประจำวัน',
    workflowType: 'PROJECT_DAILY_BRIEF',
    cadence: 'DAILY',
    runTime: '07:30',
    outputFormatId: 'easy-summary',
    requiresHumanApproval: true
  };
  assert.equal(config.validate(valid).ok, true);
  const disabled = config.validate({ ...valid, requiresHumanApproval: false });
  assert.equal(disabled.ok, false);
  assert.match(disabled.errors.join(' '), /ตรวจและอนุมัติ/);
});

test('pilot login is organization-only and contains no prefilled identity or public signup', () => {
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /บัญชีองค์กรที่ได้รับสิทธิ์เท่านั้น/);
  assert.match(html, /ไม่มีการเปิดสมัครสมาชิกสาธารณะ/);
  assert.doesNotMatch(html, /id="loginEmail"[^>]*\svalue=/);
  assert.doesNotMatch(html, /id="signup|data-action="signup|>\s*(?:สมัครสมาชิก|สร้างบัญชี)\s*</i);
  assert.doesNotMatch(moduleSource, /auth\.signUp\s*\(/);
  assert.match(home, /automation-pilot\.html/);
  assert.match(serviceWorker, /cache\.put\(request, copy\)/);
  assert.doesNotMatch(serviceWorker, /cache\.put\('\.\/index\.html', copy\)/);
});

test('browser client uses the pinned Supabase package and publishable RLS access only', async () => {
  assert.match(moduleSource, /from '@supabase\/supabase-js'/);
  assert.match(await readFile('package.json', 'utf8'), /"@supabase\/supabase-js": "2\.57\.4"/);
  assert.match(moduleSource, /sb_publishable_/);
  assert.doesNotMatch(moduleSource, /service[_-]?role|SUPABASE_SERVICE_ROLE|secret[_-]?key/i);
  assert.match(moduleSource, /organization_memberships/);
  assert.match(moduleSource, /\.eq\('organization_id', actor\.organizationId\)/);
  assert.match(moduleSource, /create_automation_definition/);
  assert.match(moduleSource, /set_automation_definition_status/);
  assert.match(moduleSource, /run_automation_now/);
  assert.match(moduleSource, /review_automation_run/);
});

test('reports remain drafts until review and downloads require APPROVED status', () => {
  assert.match(html, /ระบบสร้างเฉพาะฉบับร่างและหยุดรอเจ้าหน้าที่ตรวจ/);
  assert.match(moduleSource, /item\.status === 'WAITING_APPROVAL' && canReview\(item\)/);
  assert.match(moduleSource, /selectedRun\.status !== 'APPROVED'/);
  assert.match(moduleSource, /ดาวน์โหลดได้เฉพาะรายงานที่เจ้าหน้าที่อนุมัติแล้ว/);
  assert.match(moduleSource, /p_decision: decision/);
});

test('unapproved external delivery integrations are absent and disclosed', () => {
  assert.doesNotMatch(moduleSource, /gmail\.googleapis|drive\.googleapis|calendar\.googleapis|sheets\.googleapis|sendMail|publishReport/i);
  assert.match(html, /ไม่มีการส่งอีเมล เชื่อม Drive\/Sheets\/Calendar เผยแพร่ หรืออนุมัติแทน/);
  assert.match(trust, /Organization Automation Pilot/);
  assert.match(trust, /Row Level Security \(RLS\)/);
  assert.match(privacyNotice, /Supabase Auth/);
  assert.match(privacyNotice, /ไม่เชื่อม Gmail, Google Drive, Sheets หรือ Calendar/);
});
