(() => {
  'use strict';

  const WATCHDOG_VERSION = '1.0.0';
  const WATCHDOG_MS = 10_000;
  const BUDGET_PATTERN = /(?:จัดทำร่างงบประมาณ|ทำร่างงบ|ร่างงบประมาณ|ร่างงบ|จัดร่างงบ|ทำกรอบงบ)/i;

  const form = document.getElementById('chatForm');
  const input = document.getElementById('promptInput');
  const conversation = document.getElementById('conversation');
  if (!form || !input || !conversation) return;

  function realBudgetResultCount() {
    return document.querySelectorAll('.budget-runtime-result:not([data-budget-watchdog-fallback="true"])').length;
  }

  function appendFailClosedFallback(initialRealCount) {
    if (realBudgetResultCount() > initialRealCount) return null;

    const priorFallback = conversation.querySelector('[data-budget-watchdog-fallback="true"]');
    if (priorFallback) return priorFallback.closest('.message.assistant') || priorFallback;

    const article = document.createElement('article');
    const mark = document.createElement('span');
    const content = document.createElement('div');
    const label = document.createElement('span');
    const card = document.createElement('div');
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    const status = document.createElement('p');
    const box = document.createElement('div');
    const title = document.createElement('h4');
    const note = document.createElement('p');
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const lines = document.createElement('pre');

    article.className = 'message assistant budget-watchdog-message';
    mark.className = 'assistant-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = 'กพ';
    content.className = 'assistant-content';
    label.className = 'route-label';
    label.textContent = 'แผน โครงการ และงบประมาณ · GP004';
    card.className = 'answer-card';
    section.className = 'answer-section';
    heading.textContent = 'GovPrompt หยุดรออย่างปลอดภัยและแสดงสถานะงานงบประมาณ';
    status.textContent = '⚠️ ระบบส่วนค้น/ประมวลผลงบประมาณตอบช้าเกินกำหนด จึงไม่ฟันธงจากข้อมูลที่ยังยืนยันไม่ได้';

    box.className = 'budget-runtime-result';
    box.dataset.budgetWatchdogFallback = 'true';
    title.textContent = 'Budget Draft Agent';
    note.textContent = '⚠️ ร่างยังไม่พร้อมส่งออก · สถานะ blocked-runtime-timeout · ต้องยืนยันหลักฐานงบประมาณและแหล่งราชการก่อนใช้งานจริง';
    summary.textContent = 'สถานะหลักฐานงบประมาณ';
    lines.textContent = [
      'Runtime: blocked-runtime-timeout',
      'เอกสารราชการที่อ่าน: ยังไม่ยืนยัน',
      'Working Draft: ยังไม่พร้อมส่งออก',
      'Final approval: ต้องเป็นมนุษย์ผู้มีอำนาจ',
      'Fail-closed: true'
    ].join('\n');
    details.append(summary, lines);
    box.append(title, note, details);
    section.append(heading, status, box);
    card.append(section);
    content.append(label, card);
    article.append(mark, content);
    conversation.append(article);
    article.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
    return article;
  }

  function watchBudgetSubmission(text) {
    if (!BUDGET_PATTERN.test(String(text || ''))) return;
    const initialRealCount = realBudgetResultCount();
    let fallbackArticle = null;
    const timer = window.setTimeout(() => {
      fallbackArticle = appendFailClosedFallback(initialRealCount);
    }, WATCHDOG_MS);

    const observer = new MutationObserver(() => {
      if (realBudgetResultCount() <= initialRealCount) return;
      window.clearTimeout(timer);
      if (fallbackArticle?.isConnected) fallbackArticle.remove();
      observer.disconnect();
    });
    observer.observe(conversation, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 180_000);
  }

  // Capture phase runs after the privacy guard for safe requests and before Home clears the input.
  // If the privacy guard blocks the request with stopImmediatePropagation(), this listener never receives raw restricted data.
  form.addEventListener('submit', () => {
    const safeCandidate = input.value.trim();
    if (safeCandidate) watchBudgetSubmission(safeCandidate);
  }, true);

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.BUDGET_UI_FAILCLOSED_WATCHDOG = Object.freeze({ version: WATCHDOG_VERSION, timeoutMs: WATCHDOG_MS });
})();
