(() => {
  'use strict';

  const ISSUE_LABELS = Object.freeze({
    route: 'เข้าหมวดผิด',
    answer: 'คำตอบไม่ตรงงาน',
    search: 'การค้น/หลักฐาน',
    format: 'รูปแบบผลลัพธ์',
    privacy: 'ข้อมูลส่วนบุคคล/ความเสี่ยง'
  });

  const MODULE_LABELS = Object.freeze({
    GP001: 'สารบรรณ/หนังสือราชการ',
    GP002: 'กฎหมาย',
    GP003: 'พัสดุ/TOR',
    GP004: 'แผน/โครงการ/งบประมาณ',
    GP005: 'การเงิน/เบิกจ่าย',
    GP006: 'บุคคล',
    GP007: 'งานช่าง',
    GP008: 'สาธารณสุข',
    GP009: 'การศึกษา/เด็ก/เยาวชน/กีฬา',
    GP010: 'ตรวจสอบภายใน',
    GP011: 'ผู้บริหาร/คำกล่าว/สรุปผู้บริหาร',
    GP012: 'ประชาสัมพันธ์/สื่อ',
    GP013: 'สภาท้องถิ่น'
  });

  function parseModule(article) {
    const label = article.querySelector('.route-label')?.textContent || '';
    const match = label.match(/GP\d{3}/);
    return match ? match[0] : 'UNKNOWN';
  }

  function toast(message) {
    window.GovPrompt?.toast?.(message);
  }

  function makeExpectedModulePicker(panel, currentModuleId) {
    let field = panel.querySelector('.pilot-feedback-route-correction');
    if (field) return field;

    field = document.createElement('label');
    field.className = 'pilot-feedback-route-correction';
    field.textContent = 'ควรเป็นหมวดใด? ';

    const select = document.createElement('select');
    select.setAttribute('aria-label', 'หมวดที่ควรเป็น');

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'เลือก GP001–GP013 (ถ้าทราบ)';
    select.append(placeholder);

    Object.entries(MODULE_LABELS).forEach(([moduleId, label]) => {
      const option = document.createElement('option');
      option.value = moduleId;
      option.textContent = `${moduleId} — ${label}`;
      if (moduleId === currentModuleId) option.disabled = true;
      select.append(option);
    });

    field.append(select);
    panel.append(field);
    return field;
  }

  function makeIssuePicker(article, moduleId, transactionType, wrapper) {
    if (wrapper.querySelector('.pilot-feedback-issues')) return;
    const panel = document.createElement('div');
    panel.className = 'pilot-feedback-issues';
    panel.setAttribute('aria-label', 'เลือกจุดที่ต้องปรับ');
    const selected = new Set();

    Object.entries(ISSUE_LABELS).forEach(([code, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.issue = code;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        if (selected.has(code)) selected.delete(code);
        else selected.add(code);
        button.setAttribute('aria-pressed', selected.has(code) ? 'true' : 'false');

        if (code === 'route') {
          const field = makeExpectedModulePicker(panel, moduleId);
          field.hidden = !selected.has('route');
        }
      });
      panel.append(button);
    });

    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'บันทึก';
    save.addEventListener('click', () => {
      const expectedModuleId = selected.has('route')
        ? panel.querySelector('.pilot-feedback-route-correction select')?.value || undefined
        : undefined;
      const result = window.GovPromptCore?.addPilotFeedback?.({
        moduleId,
        transactionType,
        verdict: 'down',
        issueCodes: [...selected],
        expectedModuleId
      });
      if (!result?.saved) {
        toast('ยังบันทึก Feedback ไม่ได้');
        return;
      }
      panel.replaceChildren(document.createTextNode('ขอบคุณครับ — บันทึกจุดที่ต้องปรับแล้ว'));
      wrapper.querySelectorAll('button[data-verdict]').forEach(button => { button.disabled = true; });
      article.dataset.feedbackSaved = 'true';
      toast(expectedModuleId
        ? `บันทึก Route ที่ควรเป็น ${expectedModuleId} แล้ว โดยไม่เก็บข้อความคำถาม`
        : 'บันทึก Feedback แล้ว โดยไม่เก็บข้อความคำถามหรือข้อมูลส่วนบุคคล');
    });
    panel.append(save);
    wrapper.append(panel);
  }

  function attachFeedback(article) {
    if (!(article instanceof HTMLElement) || article.dataset.pilotFeedbackReady === 'true') return;
    const section = article.querySelector('.answer-section');
    if (!section || !article.querySelector('.route-label')) return;

    article.dataset.pilotFeedbackReady = 'true';
    const moduleId = parseModule(article);
    const transactionType = moduleId === 'GP012' ? 'public-relations' : 'general';
    const wrapper = document.createElement('div');
    wrapper.className = 'pilot-feedback';

    const label = document.createElement('span');
    label.textContent = 'ผลลัพธ์นี้ใช้ได้ไหม?';

    const up = document.createElement('button');
    up.type = 'button';
    up.dataset.verdict = 'up';
    up.textContent = '👍 ใช้ได้';
    up.addEventListener('click', () => {
      const result = window.GovPromptCore?.addPilotFeedback?.({ moduleId, transactionType, verdict: 'up' });
      if (!result?.saved) {
        toast('ยังบันทึก Feedback ไม่ได้');
        return;
      }
      up.disabled = true;
      down.disabled = true;
      label.textContent = 'ขอบคุณครับ — บันทึกว่าใช้ได้แล้ว';
      article.dataset.feedbackSaved = 'true';
      toast('บันทึก Feedback แล้ว');
    });

    const down = document.createElement('button');
    down.type = 'button';
    down.dataset.verdict = 'down';
    down.textContent = '👎 ต้องปรับ';
    down.addEventListener('click', () => makeIssuePicker(article, moduleId, transactionType, wrapper));

    const exportButton = document.createElement('button');
    exportButton.type = 'button';
    exportButton.textContent = 'คัดลอกสรุป Pilot';
    exportButton.addEventListener('click', async () => {
      const report = window.GovPromptCore?.exportPilotFeedbackReport?.();
      if (!report) return toast('ยังไม่มีรายงาน Pilot');
      try {
        await navigator.clipboard.writeText(report);
        toast('คัดลอกรายงาน Pilot แล้ว');
      } catch {
        toast('คัดลอกรายงานไม่ได้');
      }
    });

    wrapper.append(label, up, down, exportButton);
    section.append(wrapper);
  }

  const conversation = document.getElementById('conversation');
  if (!conversation) return;

  const observer = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (!(node instanceof HTMLElement)) return;
      if (node.matches?.('article.message.assistant')) attachFeedback(node);
      node.querySelectorAll?.('article.message.assistant').forEach(attachFeedback);
    }));
  });

  observer.observe(conversation, { childList: true, subtree: true });
  conversation.querySelectorAll('article.message.assistant').forEach(attachFeedback);
})();