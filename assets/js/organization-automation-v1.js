import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://bswokqqhfuvmsomzulyl.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_ZRVlOTC0jJIaFxPJrqYpUA_ZgrTnHOZ';
const supabase = createClient(PROJECT_URL, PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

const config = window.GOVPROMPT_AUTOMATION_PILOT;
const formats = window.GOVPROMPT_OUTPUT_FORMATS;
const $ = id => document.getElementById(id);
const dayNames = Object.freeze(['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']);

let actor = null;
let automations = [];
let runs = [];
let selectedRun = null;

if (!config || !formats) throw new Error('GovPrompt automation configuration is unavailable');

function setStatus(id, message, kind = '') {
  const node = $(id);
  if (!node) return;
  node.textContent = message;
  node.className = `status ${kind}`.trim();
}

function friendlyError(error, fallback) {
  const code = String(error?.code || '');
  if (code === '42501') return 'บัญชีนี้ไม่มีสิทธิ์ดำเนินการในขอบเขตที่เลือก';
  if (code === 'PGRST116') return 'ไม่พบข้อมูลที่บัญชีนี้มีสิทธิ์เข้าถึง';
  return fallback;
}

function dateTime(value) {
  return value
    ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(value))
    : '-';
}

const timeLabel = value => `${String(value || '').slice(0, 5)} น.`;
const workflowLabel = id => config.workflows.find(item => item.id === id)?.label || id;
const formatLabel = id => formats.resolve(id).label;
const canManage = () => ['ORG_ADMIN', 'DIRECTOR'].includes(actor?.role);
const canReview = run => ['ORG_ADMIN', 'EXECUTIVE'].includes(actor?.role)
  || (actor?.role === 'DIRECTOR' && actor.departmentId === run.department_id);

function appendOption(select, value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function fillStaticOptions() {
  for (const item of config.workflows) appendOption($('workflowType'), item.id, item.label);
  for (const item of config.cadences) appendOption($('cadence'), item.id, item.label);
  for (const item of formats.formats) appendOption($('outputFormat'), item.id, `${item.icon} ${item.label}`);
}

async function resolveOrganizationContext() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  let { data: memberships, error } = await supabase
    .from('organization_memberships')
    .select('organization_id,department_id,role,active')
    .eq('user_id', session.user.id)
    .eq('active', true);
  if (error) throw error;

  if (!memberships?.length) {
    const { data: claim, error: claimError } = await supabase.rpc('claim_work_pilot_invite');
    if (claimError) throw claimError;
    if (claim?.ok) {
      ({ data: memberships, error } = await supabase
        .from('organization_memberships')
        .select('organization_id,department_id,role,active')
        .eq('user_id', session.user.id)
        .eq('active', true));
      if (error) throw error;
    }
  }

  return Object.freeze({ session, membership: memberships?.[0] || null });
}

async function boot() {
  try {
    const current = await resolveOrganizationContext();
    if (!current?.session) {
      $('app').classList.add('hidden');
      $('authCard').classList.remove('hidden');
      setStatus('authStatus', 'ยังไม่ได้เข้าสู่ระบบ');
      return;
    }
    if (!current.membership) {
      $('app').classList.add('hidden');
      $('authCard').classList.remove('hidden');
      setStatus('authStatus', 'เข้าสู่ระบบแล้ว แต่บัญชีนี้ยังไม่ได้รับสิทธิ์ในองค์กรนำร่อง', 'error');
      return;
    }

    actor = Object.freeze({
      userId: current.session.user.id,
      organizationId: current.membership.organization_id,
      departmentId: current.membership.department_id,
      role: current.membership.role
    });
    $('authCard').classList.add('hidden');
    $('app').classList.remove('hidden');
    $('createCard').classList.toggle('hidden', !canManage());
    setStatus('whoami', `พร้อมใช้งาน · ${actor.role} · ทุกผลลัพธ์ต้องผ่าน Human Approval`, 'ok');
    await loadAll();
  } catch (error) {
    const target = $('app').classList.contains('hidden') ? 'authStatus' : 'whoami';
    setStatus(target, friendlyError(error, 'เชื่อมระบบองค์กรไม่สำเร็จ กรุณาลองใหม่'), 'error');
  }
}

async function loadAll() {
  await loadDepartments();
  await Promise.all([loadAutomations(), loadRuns()]);
}

async function loadDepartments() {
  let query = supabase
    .from('departments')
    .select('id,name')
    .eq('organization_id', actor.organizationId)
    .eq('active', true)
    .order('name');
  if (actor.role === 'DIRECTOR' && actor.departmentId) query = query.eq('id', actor.departmentId);

  const { data, error } = await query;
  if (error) throw error;
  const select = $('department');
  select.replaceChildren();
  if (actor.role === 'ORG_ADMIN') appendOption(select, '', 'ทั้งองค์กร');
  for (const department of data || []) appendOption(select, department.id, department.name);
}

async function loadAutomations() {
  const { data, error } = await supabase
    .from('automation_definitions')
    .select('id,organization_id,department_id,name,workflow_type,cadence,run_time,day_of_week,timezone,output_format_id,status,next_run_at,last_run_at,created_at')
    .eq('organization_id', actor.organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  automations = data || [];
  renderAutomations();
}

function emptyRow(body, columns, message) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = columns;
  cell.textContent = message;
  cell.className = 'muted';
  row.appendChild(cell);
  body.appendChild(row);
}

function renderAutomations() {
  const body = $('automationRows');
  body.replaceChildren();
  for (const item of automations) {
    const row = document.createElement('tr');
    const schedule = item.cadence === 'WEEKLY'
      ? `ทุก${dayNames[item.day_of_week]} ${timeLabel(item.run_time)}`
      : `ทุกวัน ${timeLabel(item.run_time)}`;
    for (const value of [item.name, workflowLabel(item.workflow_type), schedule, dateTime(item.next_run_at)]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    }

    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${item.status}`;
    badge.textContent = config.statusLabel(item.status);
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    const action = document.createElement('td');
    const buttons = document.createElement('div');
    buttons.className = 'row-actions';
    const run = document.createElement('button');
    run.type = 'button';
    run.className = 'btn';
    run.textContent = 'ทดลองรันทันที';
    run.disabled = !canManage();
    run.addEventListener('click', () => runNow(item.id));
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn secondary';
    toggle.textContent = item.status === 'ACTIVE' ? 'หยุดชั่วคราว' : 'เปิดใช้งาน';
    toggle.disabled = !canManage();
    toggle.addEventListener('click', () => setAutomationStatus(item.id, item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'));
    buttons.append(run, toggle);
    action.appendChild(buttons);
    row.appendChild(action);
    body.appendChild(row);
  }
  if (!automations.length) emptyRow(body, 6, 'ยังไม่มีงานอัตโนมัติในขอบเขตที่คุณเข้าถึงได้');
  $('kTotal').textContent = String(automations.length);
  $('kActive').textContent = String(automations.filter(item => item.status === 'ACTIVE').length);
}

async function loadRuns() {
  const { data, error } = await supabase
    .from('automation_runs')
    .select('id,automation_id,organization_id,department_id,workflow_type,output_format_id,status,scheduled_for,generated_at,draft_output,reviewed_by_user_id,reviewed_at,review_note')
    .eq('organization_id', actor.organizationId)
    .order('generated_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  runs = data || [];
  renderRuns();
}

function renderRuns() {
  const names = new Map(automations.map(item => [item.id, item.name]));
  const body = $('runRows');
  body.replaceChildren();
  for (const item of runs) {
    const row = document.createElement('tr');
    for (const value of [names.get(item.automation_id) || workflowLabel(item.workflow_type), dateTime(item.generated_at), formatLabel(item.output_format_id)]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    }
    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${item.status}`;
    badge.textContent = config.statusLabel(item.status);
    statusCell.appendChild(badge);
    row.appendChild(statusCell);
    const action = document.createElement('td');
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'btn secondary';
    open.textContent = 'เปิดตรวจ';
    open.addEventListener('click', () => openReview(item));
    action.appendChild(open);
    row.appendChild(action);
    body.appendChild(row);
  }
  if (!runs.length) emptyRow(body, 5, 'ยังไม่มีรายงานฉบับร่าง');
  $('kWaiting').textContent = String(runs.filter(item => item.status === 'WAITING_APPROVAL').length);
  $('kApproved').textContent = String(runs.filter(item => item.status === 'APPROVED').length);
}

async function createAutomation() {
  if (!canManage()) return;
  const checked = config.validate({
    name: $('automationName').value,
    departmentId: $('department').value || null,
    workflowType: $('workflowType').value,
    cadence: $('cadence').value,
    runTime: $('runTime').value,
    dayOfWeek: $('dayOfWeek').value,
    outputFormatId: $('outputFormat').value,
    active: $('activeNow').checked,
    requiresHumanApproval: true
  });
  if (!checked.ok) {
    setStatus('createStatus', checked.errors.join(' · '), 'error');
    return;
  }

  setStatus('createStatus', 'กำลังบันทึก...');
  const value = checked.value;
  const { error } = await supabase.rpc('create_automation_definition', {
    p_organization_id: actor.organizationId,
    p_department_id: value.departmentId,
    p_name: value.name,
    p_workflow_type: value.workflowType,
    p_cadence: value.cadence,
    p_run_time: value.runTime,
    p_day_of_week: value.cadence === 'WEEKLY' ? value.dayOfWeek : null,
    p_output_format_id: value.outputFormatId,
    p_activate: value.active,
    p_request_id: crypto.randomUUID()
  });
  if (error) {
    setStatus('createStatus', friendlyError(error, 'บันทึกไม่สำเร็จ กรุณาตรวจข้อมูลและสิทธิ์'), 'error');
    return;
  }
  $('automationName').value = '';
  $('activeNow').checked = false;
  setStatus('createStatus', 'บันทึกงานอัตโนมัติสำเร็จ', 'ok');
  await Promise.all([loadAutomations(), loadRuns()]);
}

async function setAutomationStatus(id, status) {
  setStatus('whoami', 'กำลังเปลี่ยนสถานะงาน...');
  const { error } = await supabase.rpc('set_automation_definition_status', {
    p_automation_id: id,
    p_status: status,
    p_request_id: crypto.randomUUID()
  });
  if (error) {
    setStatus('whoami', friendlyError(error, 'เปลี่ยนสถานะไม่สำเร็จ'), 'error');
    return;
  }
  setStatus('whoami', `พร้อมใช้งาน · ${actor.role} · ทุกผลลัพธ์ต้องผ่าน Human Approval`, 'ok');
  await loadAutomations();
}

async function runNow(id) {
  setStatus('whoami', 'กำลังสร้างรายงานฉบับร่าง...');
  const { error } = await supabase.rpc('run_automation_now', {
    p_automation_id: id,
    p_request_id: crypto.randomUUID()
  });
  if (error) {
    setStatus('whoami', friendlyError(error, 'สร้างรายงานไม่สำเร็จ'), 'error');
    return;
  }
  setStatus('whoami', 'สร้างฉบับร่างแล้วและหยุดรอ Human Approval', 'ok');
  await Promise.all([loadAutomations(), loadRuns()]);
}

function openReview(item) {
  selectedRun = item;
  $('reviewTitle').textContent = workflowLabel(item.workflow_type);
  $('reviewMeta').textContent = `สร้าง ${dateTime(item.generated_at)} · ${formatLabel(item.output_format_id)} · ${config.statusLabel(item.status)}`;
  $('reviewDraft').textContent = item.draft_output || 'ไม่มีเนื้อหา';
  $('reviewNote').value = item.review_note || '';
  const pending = item.status === 'WAITING_APPROVAL' && canReview(item);
  $('approveBtn').disabled = !pending;
  $('rejectBtn').disabled = !pending;
  $('downloadRunBtn').disabled = item.status !== 'APPROVED';
  setStatus('reviewStatus', pending
    ? 'กรุณาตรวจชื่อ วันที่ ตัวเลข และข้อเท็จจริงก่อนอนุมัติ'
    : 'รายการนี้ตรวจแล้ว หรือบัญชีนี้ไม่มีสิทธิ์อนุมัติ');
  $('reviewDialog').showModal();
}

async function review(decision) {
  if (!selectedRun || selectedRun.status !== 'WAITING_APPROVAL' || !canReview(selectedRun)) return;
  setStatus('reviewStatus', 'กำลังบันทึกผลการตรวจ...');
  const note = $('reviewNote').value.trim();
  if (decision === 'REJECT' && !note) {
    setStatus('reviewStatus', 'กรุณาระบุเหตุผลที่ส่งกลับแก้ไข', 'error');
    return;
  }
  const { error } = await supabase.rpc('review_automation_run', {
    p_run_id: selectedRun.id,
    p_decision: decision,
    p_note: note || null,
    p_request_id: crypto.randomUUID()
  });
  if (error) {
    setStatus('reviewStatus', friendlyError(error, 'บันทึกผลการตรวจไม่สำเร็จ'), 'error');
    return;
  }
  selectedRun = null;
  $('reviewDialog').close();
  await loadRuns();
}

function downloadRun() {
  if (!selectedRun || selectedRun.status !== 'APPROVED') {
    setStatus('reviewStatus', 'ดาวน์โหลดได้เฉพาะรายงานที่เจ้าหน้าที่อนุมัติแล้ว', 'error');
    return;
  }
  const blob = new Blob([selectedRun.draft_output || ''], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `GovPrompt-Automation-${selectedRun.id.slice(0, 8)}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

$('cadence').addEventListener('change', () => $('dayField').classList.toggle('hidden', $('cadence').value !== 'WEEKLY'));
$('createBtn').addEventListener('click', createAutomation);
$('reloadBtn').addEventListener('click', () => loadAll().catch(error => setStatus('whoami', friendlyError(error, 'โหลดข้อมูลไม่สำเร็จ'), 'error')));
$('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  actor = null;
  automations = [];
  runs = [];
  await boot();
});
$('loginBtn').addEventListener('click', async () => {
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  if (!email || !password) {
    setStatus('authStatus', 'กรุณากรอกอีเมลและรหัสผ่าน', 'error');
    return;
  }
  setStatus('authStatus', 'กำลังเข้าสู่ระบบ...');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  $('loginPassword').value = '';
  if (error) {
    setStatus('authStatus', 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจบัญชี รหัสผ่าน และการยืนยันอีเมล', 'error');
    return;
  }
  await boot();
});
$('loginPassword').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing) $('loginBtn').click();
});
$('closeDialog').addEventListener('click', () => $('reviewDialog').close());
$('approveBtn').addEventListener('click', () => review('APPROVE'));
$('rejectBtn').addEventListener('click', () => review('REJECT'));
$('downloadRunBtn').addEventListener('click', downloadRun);

supabase.auth.onAuthStateChange(() => setTimeout(() => boot(), 0));
fillStaticOptions();
boot();
