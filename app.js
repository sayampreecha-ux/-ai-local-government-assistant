(() => {
  'use strict';

  const FEEDBACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwcQDVl0B0unH-KK71xRqgqn21aWwHO-BYF6rR7U0fhRbmGS53ZCXbzhSih_CDp1s9O/exec';
  const RELEASE_VERSION = 'free20-20260727-1';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[ch]));

  const catalog = Array.isArray(window.GOVPROMPT_CATALOG) ? window.GOVPROMPT_CATALOG : [];
  const freeTools = catalog.slice(0, 20);
  const state = { selectedId: freeTools[0]?.id || '', result: '' };

  const deviceType = () => window.matchMedia('(max-width:768px)').matches ? 'mobile' : 'desktop';

  function selectedTool() {
    return freeTools.find(tool => tool.id === state.selectedId) || freeTools[0];
  }

  function sendRecord({ promptCode = '', rating = '', comment = '', event = '' } = {}) {
    if (!FEEDBACK_ENDPOINT) return;
    const body = new URLSearchParams({
      promptCode,
      rating: String(rating || ''),
      comment: String(comment || ''),
      event: String(event || ''),
      device: deviceType(),
      version: RELEASE_VERSION,
      page: location.href
    });
    fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body
    }).catch(error => console.warn('Google Sheet endpoint unavailable', error));
  }

  function buildPrompt(tool, tone, fields) {
    const toneMap = {
      official: 'ใช้ภาษาราชการที่กระชับ ชัดเจน และพร้อมตรวจทาน',
      executive: 'สรุปสาระสำคัญสำหรับผู้บริหาร โดยเน้นประเด็นตัดสินใจ ความเสี่ยง และข้อเสนอ',
      plain: 'ใช้ภาษาที่อ่านง่ายสำหรับประชาชน แต่ยังคงความถูกต้องและสุภาพ'
    };
    const facts = (tool.formFields || []).map(field => {
      const value = String(fields[field.id] || '').trim();
      return `- ${field.label}: ${value || '[ยังไม่ได้ระบุ]'}`;
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

  function fieldHtml(field) {
    const required = field.required ? 'required' : '';
    const mark = field.required ? ' *' : '';
    const placeholder = escapeHtml(field.placeholder || '');
    if (field.type === 'textarea') {
      return `<label>${escapeHtml(field.label)}${mark}<textarea id="${escapeHtml(field.id)}" ${required} placeholder="${placeholder}"></textarea></label>`;
    }
    return `<label>${escapeHtml(field.label)}${mark}<input id="${escapeHtml(field.id)}" ${required} placeholder="${placeholder}"></label>`;
  }

  function renderCards() {
    const grid = $('#toolGrid');
    if (!grid) return;
    if (!freeTools.length) {
      grid.innerHTML = '<div class="notice">ไม่พบข้อมูลเครื่องมือ กรุณาตรวจว่าไฟล์ catalog-public.js อยู่ในโฟลเดอร์เดียวกัน</div>';
      return;
    }
    grid.innerHTML = freeTools.map(tool => `
      <article class="tool-card" tabindex="0" role="button" data-tool-id="${escapeHtml(tool.id)}">
        <div class="tool-icon">${tool.icon || '📌'}</div>
        <span class="pill">${escapeHtml(tool.code)} • ฟรี</span>
        <h3>${escapeHtml(tool.code)} — ${escapeHtml(tool.name)}</h3>
        <p>${escapeHtml(tool.desc || '')}</p>
        <button class="btn secondary full" type="button" data-open-tool="${escapeHtml(tool.id)}">เปิดเครื่องมือ</button>
      </article>`).join('');

    $$('[data-open-tool]').forEach(button => button.addEventListener('click', event => {
      event.stopPropagation();
      openWorkspace(button.dataset.openTool);
    }));
    $$('.tool-card[data-tool-id]').forEach(card => {
      card.addEventListener('click', () => openWorkspace(card.dataset.toolId));
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openWorkspace(card.dataset.toolId);
        }
      });
    });
  }

  function renderPreview() {
    const select = $('#previewTool');
    if (!select || !freeTools.length) return;
    select.innerHTML = freeTools.map(tool => `<option value="${escapeHtml(tool.id)}">${escapeHtml(tool.code)} — ${escapeHtml(tool.name)}</option>`).join('');
    const update = () => {
      const tool = freeTools.find(item => item.id === select.value) || freeTools[0];
      $('#previewOutput').textContent = tool.preview || `ตัวอย่างแนวทางของ ${tool.code} — ${tool.name}`;
    };
    select.addEventListener('change', update);
    update();
  }

  function renderFields() {
    const tool = selectedTool();
    if (!tool) return;
    const select = $('#toolSelect');
    select.innerHTML = freeTools.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.code)} — ${escapeHtml(item.name)}</option>`).join('');
    select.value = tool.id;
    $('#dynamicFields').innerHTML = (tool.formFields || []).map(fieldHtml).join('');
    $('#toolAccessNote').textContent = `${tool.code} ใช้งานฟรี • สร้าง Prompt ในอุปกรณ์ของคุณ`;
    $('#resultLabel').textContent = `${tool.code} — Prompt พร้อมคัดลอก`;
  }

  function openWorkspace(id) {
    if (!freeTools.some(tool => tool.id === id)) return;
    state.selectedId = id;
    state.result = '';
    renderFields();
    $('#resultOutput').textContent = 'Prompt ที่ประกอบจากข้อมูลของคุณจะแสดงที่นี่';
    $('#resultOutput').classList.add('empty');
    $('#nextStep').classList.add('hidden');
    ['copyBtn','wordBtn','pdfBtn'].forEach(id => $(('#' + id)).disabled = true);
    $('#workspace').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    $('#workspace').scrollTop = 0;
  }

  function closeWorkspace() {
    $('#workspace').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function setupWorkspace() {
    $('#closeWorkspace').addEventListener('click', closeWorkspace);
    $('#toolSelect').addEventListener('change', event => {
      state.selectedId = event.target.value;
      state.result = '';
      renderFields();
      $('#resultOutput').textContent = 'Prompt ที่ประกอบจากข้อมูลของคุณจะแสดงที่นี่';
      $('#resultOutput').classList.add('empty');
      $('#nextStep').classList.add('hidden');
      ['copyBtn','wordBtn','pdfBtn'].forEach(id => $(('#' + id)).disabled = true);
    });

    $('#generatorForm').addEventListener('submit', event => {
      event.preventDefault();
      const tool = selectedTool();
      if (!tool) return;

      const confirm = $('#confirmFacts');
      if (!confirm.checked) {
        $('#generateMessage').className = 'form-message error';
        $('#generateMessage').textContent = 'กรุณายืนยันว่าข้อมูลเป็นข้อเท็จจริงและจะตรวจทานก่อนใช้จริง';
        return;
      }

      const fields = Object.fromEntries((tool.formFields || []).map(field => [
        field.id, document.getElementById(field.id)?.value || ''
      ]));

      state.result = buildPrompt(tool, $('#tone').value, fields);
      $('#resultOutput').textContent = state.result;
      $('#resultOutput').classList.remove('empty');
      $('#watermark').textContent = `GovPrompt Thailand • ${tool.code} • สร้างเมื่อ ${new Date().toLocaleString('th-TH')}`;
      $('#nextStep').classList.remove('hidden');
      ['copyBtn','wordBtn','pdfBtn'].forEach(id => $(('#' + id)).disabled = false);
      $('#generateMessage').className = 'form-message success';
      $('#generateMessage').textContent = 'สร้าง Prompt สำเร็จ — ตรวจทานแล้วคัดลอกไปใช้กับ AI ที่คุณเลือกได้ทันที';
      sendRecord({promptCode: tool.code, event: 'generated', comment: '[usage] generated'});
      if (window.innerWidth < 980) $('#resultOutput').scrollIntoView({behavior:'smooth', block:'start'});
    });

    $('#copyBtn').addEventListener('click', async () => {
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
      const old = button.textContent;
      button.textContent = '✅ คัดลอกแล้ว';
      setTimeout(() => button.textContent = old, 1500);
    });

    $('#wordBtn').addEventListener('click', () => {
      if (!state.result) return;
      const blob = new Blob([`\ufeff${state.result}`], {type:'application/msword;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTool()?.code || 'GovPrompt'}-prompt.doc`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    });

    $('#pdfBtn').addEventListener('click', () => window.print());
  }

  function setupFeedback() {
    $('#feedbackForm').addEventListener('submit', event => {
      event.preventDefault();
      const rating = $('#feedbackRating').value;
      const comment = $('#feedbackComment').value.trim();
      const tool = selectedTool();
      sendRecord({promptCode: tool?.code || '', rating, comment, event:'feedback'});
      $('#feedbackMessage').className = 'form-message success';
      $('#feedbackMessage').textContent = 'ขอบคุณครับ ความคิดเห็นถูกส่งไปยัง Google Sheet แล้ว';
      event.target.reset();
    });
  }

  function init() {
    renderCards();
    renderPreview();
    setupWorkspace();
    setupFeedback();
    if (freeTools.length) renderFields();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();