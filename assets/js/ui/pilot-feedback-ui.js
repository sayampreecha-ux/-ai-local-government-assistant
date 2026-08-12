(() => {
  'use strict';

  const ISSUE_LABELS = Object.freeze({
    route: 'เข้าหมวดผิด',
    answer: 'คำตอบไม่ตรงงาน',
    search: 'การค้น/หลักฐาน',
    format: 'รูปแบบผลลัพธ์',
    privacy: 'ข้อมูลส่วนบุคคล/ความเสี่ยง'
  });

  function parseModule(article) {
    const label = article.querySelector('.route-label')?.textContent || '';
    const match = label.match(/GP\d{3}/);
    return match ? match[0] : 'UNKNOWN';
  }

  function toast(message) {
    window.GovPrompt?.toast?.(message);
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
      });
      panel.append(button);
    });

    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'บันทึก';
    save.addEventListener('click', () => {
      const result = window.GovPromptCore?.addPilotFeedback?.({
        moduleId,
        transactionType,
        verdict: 'down',
        issueCodes: [...selected]
      });
      if (!result?.saved) {
        toast('ยังบันทึก Feedback ไม่ได้');
        return;
      }
      panel.replaceChildren(document.createTextNode('ขอบคุณครับ — บันทึกจุดที่ต้องปรับแล้ว'));
      wrapper.querySelectorAll('button[data-verdict]').forEach(button => { button.disabled = true; });
      article.dataset.feedbackSaved = 'true';
      toast('บันทึก Feedback แล้ว โดยไม่เก็บข้อความคำถามหรือข้อมูลส่วนบุคคล');
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