(() => {
  'use strict';

  const CURRENT_TEXT = '✅ ค้นสดและยืนยันหลักฐานปัจจุบันได้ตาม metadata ที่มี';
  const SAFER_TEXT = '✅ พบแหล่งราชการที่มีข้อมูลวันที่/การปรับปรุงล่าสุด — โปรดตรวจสอบสถานะการใช้บังคับของเอกสารก่อนนำไปอ้างอิง';
  const REMOVE_ACTION_PATTERN = /^(?:เปิดใน\s*)?(?:ChatGPT|Gemini)$|^เปิดแบบฟอร์ม\b/i;

  function softenFreshnessCopy(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const matches = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue?.includes(CURRENT_TEXT)) matches.push(walker.currentNode);
    }
    matches.forEach(node => {
      node.nodeValue = node.nodeValue.replace(CURRENT_TEXT, SAFER_TEXT);
    });
  }

  function simplifyAnswerCard(card) {
    if (!card || card.dataset.leanModeReady === 'true') return;

    const actions = card.querySelector('.answer-actions');
    if (actions) {
      [...actions.children].forEach(control => {
        const label = String(control.textContent || '').trim();
        if (REMOVE_ACTION_PATTERN.test(label)) control.remove();
      });

      const copyButton = [...actions.querySelectorAll('button')]
        .find(button => button.textContent.includes('คัดลอก Prompt'));
      if (copyButton) {
        copyButton.textContent = 'คัดลอก Prompt';
        copyButton.title = 'คัดลอก Prompt ที่ผ่าน Privacy Guard แล้ว';
      }
      actions.setAttribute('aria-label', 'คัดลอก Prompt พร้อมใช้');
    }

    const heading = card.querySelector('.answer-section > h3');
    if (heading) heading.textContent = 'Prompt พร้อมใช้';

    const paragraphs = [...card.querySelectorAll('.answer-section > p')];
    const description = paragraphs.find(paragraph => paragraph.textContent.includes('ระบบจัดคำถามไปที่'));
    description?.remove();

    const detailsBlocks = [...card.querySelectorAll('.answer-section > details')];
    const promptDetails = detailsBlocks.find(details => details.querySelector('pre'));
    if (promptDetails) {
      promptDetails.open = true;
      const summary = promptDetails.querySelector('summary');
      if (summary) summary.textContent = 'Prompt ที่ GovPrompt จัดให้';
    }

    card.dataset.leanModeReady = 'true';
  }

  function enforceLeanMode(root = document) {
    root.querySelectorAll?.('.answer-card').forEach(simplifyAnswerCard);

    const toolsButton = document.querySelector('.bottom-nav [data-panel="tools"]');
    toolsButton?.remove();

    document.querySelectorAll('.answer-actions').forEach(actions => {
      [...actions.children].forEach(control => {
        const label = String(control.textContent || '').trim();
        if (REMOVE_ACTION_PATTERN.test(label)) control.remove();
      });
    });
  }

  softenFreshnessCopy();
  enforceLeanMode();

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.nodeValue?.includes(CURRENT_TEXT)) node.nodeValue = node.nodeValue.replace(CURRENT_TEXT, SAFER_TEXT);
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          softenFreshnessCopy(node);
          enforceLeanMode(node.matches?.('.answer-card') ? node.parentElement || node : node);
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
