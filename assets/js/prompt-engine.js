(() => {
  'use strict';

  const root = document.querySelector('.generator');
  if (!root) return;

  const fields = [...root.querySelectorAll('input:not(.search),textarea,select')];
  const legacyStorageKey = `govprompt:r2:${location.pathname}`;
  const draftState = {};

  // Government drafts can contain personal or sensitive data. Remove drafts
  // persisted by older releases and keep new drafts only in this tab's memory.
  try { localStorage.removeItem(legacyStorageKey); } catch {}

  const panel = document.createElement('div');
  panel.className = 'gp-safety';
  panel.setAttribute('role', 'status');
  root.insertBefore(panel, root.querySelector('.actions'));

  const draft = document.createElement('div');
  draft.className = 'gp-draft';
  draft.textContent = 'ร่างนี้เก็บเฉพาะในหน่วยความจำของแท็บ และจะหายไปเมื่อปิดหรือโหลดหน้าใหม่';
  panel.after(draft);

  function scan() {
    const text = fields.map(field => field.value || '').join(' ');
    const flags = [];
    if (/\b\d{13}\b/.test(text)) flags.push('เลข 13 หลัก');
    if (/(?:\+66|0)\d{8,9}\b/.test(text)) flags.push('เบอร์โทร');
    if (/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text)) flags.push('อีเมล');
    if (/(?:เลขบัญชี|พร้อมเพย์|โรค|ผลตรวจ|ข้อมูลสุขภาพ)/i.test(text)) flags.push('ข้อมูลอ่อนไหว');

    panel.dataset.level = flags.length ? 'warn' : '';
    panel.textContent = flags.length
      ? `⚠️ พบข้อมูลที่ควรตรวจและปกปิดถ้าไม่จำเป็น: ${flags.join(', ')}`
      : '✅ ไม่พบรูปแบบข้อมูลส่วนบุคคลที่ระบบตรวจจับได้ชัดเจน — ยังต้องตรวจทานด้วยตนเอง';
    return flags;
  }

  let timer;
  fields.forEach((field, index) => {
    field.dataset.gpKey = field.id || field.name || String(index);
    field.addEventListener('input', () => {
      scan();
      clearTimeout(timer);
      timer = setTimeout(() => {
        fields.forEach(item => { draftState[item.dataset.gpKey] = item.value; });
        draft.textContent = `เก็บร่างไว้ในหน่วยความจำของแท็บแล้ว ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
      }, 350);
    });
  });

  scan();

  document.getElementById('clear')?.addEventListener('click', () => {
    Object.keys(draftState).forEach(key => delete draftState[key]);
    draft.textContent = 'ล้างร่างในหน่วยความจำแล้ว';
  }, true);

  document.getElementById('copy')?.addEventListener('click', async event => {
    const output = document.getElementById('output');
    if (!output?.textContent) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      await navigator.clipboard.writeText(output.textContent);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = output.textContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    window.GovPrompt?.toast('คัดลอก Prompt แล้ว');
  }, true);
})();
