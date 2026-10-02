(() => {
  'use strict';

  const WATCHDOG_VERSION = '1.2.0';
  const WATCHDOG_MS = 10_000;
  const POLL_MS = 250;
  const BUDGET_PATTERN = /(?:จัดทำร่างงบประมาณ|ทำร่างงบ|ร่างงบประมาณ|ร่างงบ|จัดร่างงบ|ทำกรอบงบ)/i;

  const conversation = document.getElementById('conversation');
  if (!conversation) return;

  document.documentElement.dataset.budgetWatchdogVersion = WATCHDOG_VERSION;
  document.documentElement.dataset.budgetWatchdogReady = 'true';

  const observedUserBodies = new WeakSet();
  let lastBudgetText = '';
  let lastBudgetStartedAt = 0;

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
    document.documentElement.dataset.budgetWatchdogFallback = 'visible';
    article.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
    return article;
  }

  function watchBudgetSubmission(text) {
    const normalized = String(text || '').trim();
    if (!BUDGET_PATTERN.test(normalized)) return;

    const now = Date.now();
    if (normalized === lastBudgetText && now - lastBudgetStartedAt < 2_000) return;
    lastBudgetText = normalized;
    lastBudgetStartedAt = now;
    document.documentElement.dataset.budgetWatchdogTriggered = 'true';

    const initialRealCount = realBudgetResultCount();
    let fallbackArticle = null;
    const timer = window.setTimeout(() => {
      fallbackArticle = appendFailClosedFallback(initialRealCount);
    }, WATCHDOG_MS);

    const resultObserver = new MutationObserver(() => {
      if (realBudgetResultCount() <= initialRealCount) return;
      window.clearTimeout(timer);
      if (fallbackArticle?.isConnected) fallbackArticle.remove();
      document.documentElement.dataset.budgetWatchdogFallback = 'replaced-by-runtime';
      resultObserver.disconnect();
    });
    resultObserver.observe(conversation, { childList: true, subtree: true });
    window.setTimeout(() => resultObserver.disconnect(), 180_000);
  }

  function inspectSafeUserBubbles(root = conversation) {
    const bodies = [];
    if (root?.matches?.('.message.user .message-body')) bodies.push(root);
    if (root?.querySelectorAll) bodies.push(...root.querySelectorAll('.message.user .message-body'));
    if (root === conversation) bodies.push(...conversation.querySelectorAll('.message.user .message-body'));

    for (const body of bodies) {
      if (observedUserBodies.has(body)) continue;
      observedUserBodies.add(body);
      const safeRenderedText = String(body.textContent || '').trim();
      if (safeRenderedText) watchBudgetSubmission(safeRenderedText);
    }
  }

  // Privacy boundary: only observe user bubbles already rendered by Home after the capture-phase
  // privacy/data gate has allowed the request. Raw composer text is never read by this watchdog.
  const conversationObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes || []) {
        if (node.nodeType === 1) inspectSafeUserBubbles(node);
      }
    }
  });
  conversationObserver.observe(conversation, { childList: true, subtree: true });
  inspectSafeUserBubbles();

  // MutationObserver is the primary trigger. Polling is a deterministic backstop for browsers,
  // service-worker transitions, or DOM insertion timing where an observer delivery could be missed.
  // It scans only already-rendered safe user bubbles and never reads the composer.
  const poller = window.setInterval(() => inspectSafeUserBubbles(conversation), POLL_MS);
  window.addEventListener('pagehide', () => window.clearInterval(poller), { once: true });

  try {
    window.GovPromptCore = window.GovPromptCore || {};
    window.GovPromptCore.BUDGET_UI_FAILCLOSED_WATCHDOG = Object.freeze({
      version: WATCHDOG_VERSION,
      timeoutMs: WATCHDOG_MS,
      pollMs: POLL_MS,
      trigger: 'safe-user-bubble-observer+poll'
    });
  } catch {}
})();
