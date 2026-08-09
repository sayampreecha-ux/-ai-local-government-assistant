(() => {
  'use strict';
  const API_ROOT = 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/access/admin';
  const TOKEN_KEY = 'gp_admin_token';
  const STORE = 'gp_simple_issued';
  const COUNTER = 'gp_simple_counter';

  function records() { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch { return []; } }
  function save(value) { localStorage.setItem(STORE, JSON.stringify(value)); }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
  function render() {
    const query = document.getElementById('search').value.trim().toLowerCase();
    const rows = records().map((record, index) => ({ ...record, index })).filter(record => !query || record.name.toLowerCase().includes(query) || record.code.toLowerCase().includes(query));
    document.getElementById('log').innerHTML = rows.map(record => `<tr><td>${record.index + 1}</td><td>${escapeHtml(record.name)}</td><td>${escapeHtml(record.code)}</td><td>${escapeHtml(record.date)}</td><td><button class="danger" data-remove="${record.index}">ลบ</button></td></tr>`).join('');
    document.querySelectorAll('[data-remove]').forEach(button => { button.onclick = () => removeRecord(Number(button.dataset.remove)); });
  }
  function nextSerial() {
    const current = Math.max(Number(localStorage.getItem(COUNTER) || 0), ...records().map(record => Number((record.code.match(/^GP69-(\d{4})-/) || [])[1] || 0)));
    const next = current + 1;
    if (next > 9999) throw new Error('SERIAL_LIMIT_REACHED');
    localStorage.setItem(COUNTER, String(next));
    return String(next).padStart(4, '0');
  }
  async function api(path, body, token = '') {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`${API_ROOT}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'REQUEST_FAILED');
    return payload;
  }
  function showPanel() { loginBox.classList.add('hidden'); panel.classList.remove('hidden'); render(); }
  function removeRecord(index) { if (confirm('ยืนยันการลบรายการนี้?')) { const rows = records(); rows.splice(index, 1); save(rows); render(); } }
  async function copyText(text) { await navigator.clipboard.writeText(text); document.getElementById('copyStatus').textContent = 'คัดลอกแล้ว'; setTimeout(() => { document.getElementById('copyStatus').textContent = ''; }, 1800); }

  document.getElementById('unlock').onclick = async () => {
    err.textContent = '';
    try {
      const result = await api('login', { password: document.getElementById('pw').value });
      sessionStorage.setItem(TOKEN_KEY, result.token);
      document.getElementById('pw').value = '';
      showPanel();
    } catch { err.textContent = 'รหัสผ่านไม่ถูกต้อง'; }
  };
  document.getElementById('pw').addEventListener('keydown', event => { if (event.key === 'Enter') document.getElementById('unlock').click(); });
  document.getElementById('lock').onclick = () => { sessionStorage.removeItem(TOKEN_KEY); location.reload(); };
  document.getElementById('issue').onclick = async () => {
    const name = document.getElementById('name').value.trim();
    if (!name) { alert('กรุณาใส่ชื่อลูกค้า'); return; }
    try {
      const result = await api('issue', { serial: nextSerial() }, sessionStorage.getItem(TOKEN_KEY) || '');
      const rows = records();
      rows.push({ name, code: result.code, date: new Date().toLocaleString('th-TH') });
      save(rows);
      newCode.textContent = result.code;
      out.classList.remove('hidden');
      document.getElementById('name').value = '';
      render();
    } catch { sessionStorage.removeItem(TOKEN_KEY); alert('ไม่สามารถออก code ได้ กรุณาเข้าสู่ระบบใหม่'); location.reload(); }
  };
  document.getElementById('copy').onclick = () => copyText(newCode.textContent);
  document.getElementById('copyMsg').onclick = () => copyText(`รหัสสมาชิก:\n${newCode.textContent}`);
  document.getElementById('search').addEventListener('input', render);
  document.getElementById('clearAll').onclick = () => { if (confirm('ยืนยันล้างรายชื่อลูกค้าทั้งหมด?')) { localStorage.removeItem(STORE); render(); } };
  document.getElementById('export').onclick = () => { const rows = [['ลำดับ', 'ลูกค้า', 'รหัส', 'วันที่'], ...records().map((record, index) => [index + 1, record.name, record.code, record.date])]; const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n'); const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); anchor.download = `govprompt-members-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(anchor.href); };
})();
