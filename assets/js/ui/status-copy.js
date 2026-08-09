(() => {
  'use strict';

  const CURRENT_TEXT = '✅ ค้นสดและยืนยันหลักฐานปัจจุบันได้ตาม metadata ที่มี';
  const SAFER_TEXT = '✅ พบแหล่งราชการที่มีข้อมูลวันที่/การปรับปรุงล่าสุด — โปรดตรวจสอบสถานะการใช้บังคับของเอกสารก่อนนำไปอ้างอิง';

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

  function copyPreparedPrompt(card) {
    const prompt = card?.querySelector('pre')?.textContent || '';
    if (!prompt) return Promise.resolve(false);
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(prompt).then(() => true).catch(() => fallbackCopy(prompt));
    }
    return Promise.resolve(fallbackCopy(prompt));
  }

  function fallbackCopy(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      return copied;
    } catch {
      return false;
    }
  }

  function addAiLaunchers(root = document) {
    root.querySelectorAll?.('.answer-actions').forEach(actions => {
      if (actions.dataset.multiAiReady === 'true') return;
      const chatGptButton = [...actions.querySelectorAll('button')].find(button => button.textContent.trim() === 'เปิดใน ChatGPT');
      if (!chatGptButton) return;

      chatGptButton.textContent = 'ChatGPT';
      chatGptButton.title = 'คัดลอก Prompt แล้วเปิด ChatGPT';

      const geminiButton = document.createElement('button');
      geminiButton.type = 'button';
      geminiButton.textContent = 'Gemini';
      geminiButton.title = 'คัดลอก Prompt แล้วเปิด Gemini';
      geminiButton.addEventListener('click', async () => {
        const target = window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
        const copied = await copyPreparedPrompt(actions.closest('.answer-card'));
        if (copied) window.GovPrompt?.toast('คัดลอก Prompt แล้ว — วางใน Gemini ได้เลย');
        else window.GovPrompt?.toast('เปิด Gemini แล้ว แต่คัดลอก Prompt อัตโนมัติไม่สำเร็จ');
        if (!target) window.GovPrompt?.toast('เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาต pop-up');
      });

      const copyButton = [...actions.querySelectorAll('button')].find(button => button.textContent.includes('คัดลอก Prompt'));
      actions.insertBefore(geminiButton, copyButton || chatGptButton.nextSibling);
      actions.dataset.multiAiReady = 'true';
      actions.setAttribute('aria-label', 'เลือก AI สำหรับวิเคราะห์ Prompt ต่อ');
    });
  }

  softenFreshnessCopy();
  addAiLaunchers();

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.nodeValue?.includes(CURRENT_TEXT)) node.nodeValue = node.nodeValue.replace(CURRENT_TEXT, SAFER_TEXT);
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          softenFreshnessCopy(node);
          addAiLaunchers(node.matches?.('.answer-actions') ? node.parentElement || node : node);
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
