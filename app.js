(() => {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[ch]));

  const tools = Array.isArray(window.GOVPROMPT_CATALOG) ? window.GOVPROMPT_CATALOG : [];
  const freeTools = tools.slice(0, 20);
  const state = { selectedId: freeTools[0]?.id || '', result: '' };

  const FEEDBACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwcQDVl0B0unH-KK71xRqgqn21aWwHO-BYF6rR7U0fhRbmGS53ZCXbzhSih_CDp1s9O/exec';
  const RELEASE_VERSION = 'v1.7-free20-feedback';

  function deviceType() {
    return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
  }

  function sendFeedbackRecord({ promptCode = '', rating = '', comment = '' } = {}) {
    if (!FEEDBACK_ENDPOINT) return;
    const body = new URLSearchParams({
      promptCode,
      rating: String(rating || ''),
      comment: String(comment || ''),
      device: deviceType(),
      version: RELEASE_VERSION,
      page: location.href
    });

    fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body
    }).catch(error => console.warn('feedback unavailable', error));
  }

  function ensureFeedbackPanel() {
    if (document.querySelector('#freeFeedbackPanel')) return;
    const workspace = document.querySelector('#workspace');
    if (!workspace) return;

    const panel = document.createElement('section');
    panel.id = 'freeFeedbackPanel';
    panel.className = 'section soft';
    panel.innerHTML = `
      <div class="section-head compact">
        <div>
          <span class="kicker">ช่วยพัฒนา GovPrompt Thailand</span>
          <h2>ประสบการณ์ใช้งานเป็นอย่างไร?</h2>
        </div>
        <p>ให้คะแนนและข้อเสนอแนะสั้น ๆ ข้อมูลจะบันทึกใน Google Sheet ของโครงการ</p>
      </div>
      <form id="freeFeedbackForm" class="generator-form" style="max-width:760px;margin:auto">
        <label>คะแนนความพึงพอใจ
          <select id="freeFeedbackRating" class="input" required>
            <option value="">เลือกคะแนน</option>
            <option value="5">5 — ดีมาก</option>
            <option value="4">4 — ดี</option>
            <option value="3">3 — พอใช้</option>
            <option value="2">2 — ควรปรับปรุง</option>
            <option value="1">1 — ใช้งานยาก</option>
          </select>
        </label>
        <label>ความคิดเห็นหรือข้อเสนอแนะ
          <textarea id="freeFeedbackComment" placeholder="เช่น ใช้ง่าย แต่ควรเพิ่มตัวอย่างข้อมูล"></textarea>
        </label>
        <button class="btn primary full" type="submit">ส่งความคิดเห็น</button>
        <div id="freeFeedbackMessage" class="form-message" aria-live="polite"></div>
      </form>
    `;
    workspace.insertAdjacentElement('afterend', panel);

    document.querySelector('#freeFeedbackForm').addEventListener('submit', event => {
      event.preventDefault();
      const tool = selectedTool();
      const rating = document.querySelector('#freeFeedbackRating').value;
      const comment = document.querySelector('#freeFeedbackComment').value.trim();
      sendFeedbackRecord({ promptCode: tool?.code || '', rating, comment });
      const message = document.querySelector('#freeFeedbackMessage');
      message.className = 'form-message success';
      message.textContent = 'ขอบคุณครับ ความคิดเห็นถูกส่งไปยัง Google Sheet แล้ว';
      event.target.reset();
    });
  }

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function selectedTool() {
    return freeTools.find(t => t.id === state.selectedId) || freeTools[0];
  }

  function fieldHtml(field) {
    const required = field.required ? 'required' : '';
    const mark = field.required ? ' <span aria-hidden="true">*</span>' : '';
    if (field.type === 'textarea') {
      return `<label>${escapeHtml(field.label)}${mark}<textarea id="${escapeHtml(field.id)}" ${required} placeholder="${escapeHtml(field.placeholder || '')}"></textarea></label>`;
    }
    return `<label>${escapeHtml(field.label)}${mark}<input id="${escapeHtml(field.id)}" ${required} placeholder="${escapeHtml(field.placeholder || '')}" /></label>`;
  }

  function buildPrompt(tool, tone, fields) {
    const toneMap = {
      official: 'ใช้ภาษาราชการที่กระชับ ชัดเจน และพร้อมตรวจทาน',
      executive: 'สรุปสาระสำคัญสำหรับผู้บริหาร โดยเน้นประเด็นตัดสินใจ ความเสี่ยง และข้อเสนอ',
      plain: 'ใช้ภาษาที่อ่านง่ายสำหรับประชาชน แต่ยังคงความถูกต้องและสุภาพ'
    };

    const facts = (tool.formFields || []).map(field => {
      const value = fields[field.id]?.trim();
      return value ? `- ${field.label}: ${value}` : `- ${field.label}: [ยังไม่ได้ระบุ]`;
    }).join('\n');

    return `บทบาท
คุณเป็น Government AI Copilot ผู้เชี่ยวชาญงานราชการไทย

ภารกิจ
${tool.name}

ข้อมูลจากผู้ใช้
${facts}

ข้อกำหนดสำคัญ
- ยึดข้อเท็จจริงที่ผู้ใช้ให้เป็นหลัก
- ห้ามสมมติชื่อบุคคล วันที่ เลขหนังสือ วงเงิน หรือข้อกฎหมาย
- หากข้อมูลสำคัญไม่ครบ ให้ระบุช่องว่างหรือถามเฉพาะข้อมูลที่จำเป็น
- แยกข้อเท็จจริง ข้อกฎหมาย การวิเคราะห์ ความเสี่ยง และข้อเสนอแนะตามความเหมาะสม
- ${toneMap[tone] || toneMap.official}
- ระบุข้อมูลที่ต้องตรวจสอบเพิ่มเติมก่อนนำไปใช้จริง

โปรดจัดทำผลลัพธ์ฉบับพร้อมตรวจทาน โดยไม่อ้างว่าข้อมูลที่ไม่ได้ให้มาเป็นข้อเท็จจริง`;
  }

  function renderCards() {
    const grid = $('#toolGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!freeTools.length) {
      grid.innerHTML = '<div class="notice">ไม่พบข้อมูลเครื่องมือ กรุณาตรวจไฟล์ catalog-public.js</div>';
      return;
    }

    const grouped = freeTools.reduce((map, tool) => {
      const key = tool.groupCode || 'FREE';
      if (!map.has(key)) map.set(key, { name: tool.groupName || 'เครื่องมือฟรี', items: [] });
      map.get(key).items.push(tool);
      return map;
    }, new Map());

    for (const [groupCode, group] of grouped) {
      grid.insertAdjacentHTML('beforeend',
        `<div class="tool-group-title"><span>${escapeHtml(groupCode)}</span><h3>${escapeHtml(group.name)}</h3><small>${group.items.length} เครื่องมือฟรี</small></div>`
      );

      group.items.forEach(tool => {
        grid.insertAdjacentHTML('beforeend', `
          <article class="tool-card" tabindex="0" role="button" data-tool-id="${escapeHtml(tool.id)}" aria-label="เปิด ${escapeHtml(tool.name)}">
            <div class="tool-icon">${tool.icon || '📌'}</div>
            <span class="pill">${escapeHtml(tool.code)} • ทดลองใช้ฟรี</span>
            <h3>${escapeHtml(`${tool.code} — ${tool.name}`)}</h3>
            <p>${escapeHtml(tool.desc || '')}</p>
            <button class="btn secondary full" type="button" data-open-tool="${escapeHtml(tool.id)}">เปิดเครื่องมือ</button>
          </article>
        `);
      });
    }

    $$('[data-open-tool], .tool-card[data-tool-id]').forEach(element => {
      const open = event => {
        if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        const id = element.dataset.openTool || element.dataset.toolId;
        openFreeWorkspace(id);
      };
      element.addEventListener('click', open);
      element.addEventListener('keydown', open);
    });
  }

  function renderPreview() {
    const select = $('#previewTool');
    if (!select) return;
    select.innerHTML = freeTools.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(`${t.code} — ${t.name}`)}</option>`).join('');
    const update = () => {
      const tool = freeTools.find(t => t.id === select.value) || freeTools[0];
      if ($('#previewOutput')) $('#previewOutput').textContent = tool?.preview || '';
    };
    select.addEventListener('change', update);
    update();
  }

  function renderFields() {
    const tool = selectedTool();
    if (!tool) return;
    const select = $('#toolSelect');
    if (select) {
      select.innerHTML = freeTools.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(`${t.code} — ${t.name}`)}</option>`).join('');
      select.value = tool.id;
    }
    if ($('#dynamicFields')) $('#dynamicFields').innerHTML = (tool.formFields || []).map(fieldHtml).join('');
    if ($('#toolAccessNote')) $('#toolAccessNote').textContent = `${tool.code} ใช้งานฟรี • สร้าง Prompt ในอุปกรณ์ของคุณ • ไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์`;
    if ($('#resultLabel')) $('#resultLabel').textContent = `${tool.code} — Prompt พร้อมคัดลอก`;
  }

  function openFreeWorkspace(id) {
    if (!freeTools.some(t => t.id === id)) return;
    state.selectedId = id;
    renderFields();
    const workspace = $('#workspace');
    if (workspace) {
      workspace.classList.remove('hidden');
      workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function setupWorkspace() {
    const workspace = $('#workspace');
    if (!workspace) return;

    const heading = workspace.querySelector('h2');
    if (heading) heading.textContent = 'สร้าง Prompt งานราชการฟรี';
    const memberInfo = $('#memberInfo');
    if (memberInfo) memberInfo.textContent = 'ทดลองใช้ฟรี 20 Prompt โดยไม่ต้องสมัครสมาชิกหรือกรอกรหัส';

    const logout = $('#logoutBtn');
    if (logout) {
      logout.textContent = 'ปิดพื้นที่ทำงาน';
      logout.onclick = () => workspace.classList.add('hidden');
    }

    $('#toolSelect')?.addEventListener('change', event => {
      state.selectedId = event.target.value;
      renderFields();
    });

    $('#generatorForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const tool = selectedTool();
      if (!tool) return;

      const confirm = $('#confirmFacts');
      if (confirm && !confirm.checked) {
        if ($('#generateMessage')) {
          $('#generateMessage').className = 'form-message error';
          $('#generateMessage').textContent = 'กรุณายืนยันว่าข้อมูลเป็นข้อเท็จจริงและจะตรวจทานก่อนใช้จริง';
        }
        return;
      }

      const fields = Object.fromEntries((tool.formFields || []).map(field => [
        field.id,
        document.getElementById(field.id)?.value || ''
      ]));

      state.result = buildPrompt(tool, $('#tone')?.value || 'official', fields);
      const output = $('#resultOutput');
      if (output) {
        output.textContent = state.result;
        output.classList.remove('empty');
      }
      if ($('#watermark')) $('#watermark').textContent = `GovPrompt Thailand • ${tool.code} • สร้างเมื่อ ${new Date().toLocaleString('th-TH')}`;
      ['copyBtn', 'wordBtn', 'pdfBtn'].forEach(id => {
        const button = document.getElementById(id);
        if (button) button.disabled = false;
      });
      if ($('#generateMessage')) {
        $('#generateMessage').className = 'form-message success';
        $('#generateMessage').textContent = 'สร้าง Prompt สำเร็จ — ตรวจทานแล้วคัดลอกไปใช้กับ AI ที่คุณเลือกได้ทันที';
        sendFeedbackRecord({ promptCode: tool.code, comment: '[usage] generated' });
      }
    });

    $('#copyBtn')?.addEventListener('click', async () => {
      if (!state.result) return;
      try {
        await navigator.clipboard.writeText(state.result);
      } catch {
        const area = document.createElement('textarea');
        area.value = state.result;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      const button = $('#copyBtn');
      if (button) {
        button.textContent = 'คัดลอกแล้ว';
        setTimeout(() => button.textContent = 'คัดลอก', 1500);
      }
    });

    $('#wordBtn')?.addEventListener('click', () => {
      if (!state.result) return;
      const blob = new Blob([`\ufeff${state.result}`], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTool()?.code || 'GovPrompt'}-prompt.doc`;
      a.click();
      URL.revokeObjectURL(url);
    });

    $('#pdfBtn')?.addEventListener('click', () => window.print());
  }

  function simplifyLandingPage() {
    $('#systemBanner')?.classList.add('hidden');

    ['#packages', '#how', '#order', '#paymentPanel'].forEach(selector => {
      const element = $(selector);
      if (element) element.classList.add('hidden');
    });

    $$('nav a[href="#packages"], nav a[href="#order"], [data-open-login]').forEach(element => {
      element.style.display = 'none';
    });

    const previewTitle = $('#preview h2');
    if (previewTitle) previewTitle.textContent = 'ทดลองดูรูปแบบของ 20 Prompt ฟรี';
    const previewText = $('#preview p');
    if (previewText) previewText.textContent = 'เลือกเครื่องมือเพื่อดูแนวทาง แล้วกดเปิดเครื่องมือเพื่อกรอกข้อมูลและสร้าง Prompt ได้ทันที';
    const lock = $('.fade-lock');
    if (lock) lock.textContent = '✅ เปิดใช้ฟรีได้ทันที ไม่ต้องเข้าสู่ระบบ';
  }

  function init() {
    simplifyLandingPage();
    renderCards();
    renderPreview();
    setupWorkspace();
    ensureFeedbackPanel();

    if (freeTools.length) {
      state.selectedId = freeTools[0].id;
      renderFields();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();