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

  function findQuestion(card) {
    const article = card.closest('.message.assistant');
    let cursor = article?.previousElementSibling || null;
    while (cursor) {
      if (cursor.matches('.message.user')) {
        return String(cursor.querySelector('.message-body')?.textContent || '').trim();
      }
      cursor = cursor.previousElementSibling;
    }
    return '';
  }

  function findDomain(card) {
    const raw = String(card.parentElement?.querySelector('.route-label')?.textContent || '').trim();
    return raw.split('·')[0].trim() || 'งานราชการไทย';
  }

  function collectOfficialSources(card) {
    const seen = new Set();
    return [...card.querySelectorAll('.answer-section details a[href]')]
      .map(link => ({ title: String(link.textContent || '').trim(), url: String(link.href || '').trim() }))
      .filter(item => item.url && !seen.has(item.url) && seen.add(item.url))
      .slice(0, 8);
  }

  function buildToolRoutingBlock(question) {
    const createPlan = window.GovPromptCore?.createToolRoutingPlan;
    const formatPlan = window.GovPromptCore?.formatToolRoutingInstructions;
    if (typeof createPlan !== 'function' || typeof formatPlan !== 'function') {
      return '- ใช้ข้อมูลที่ผู้ใช้ให้ก่อน และค้นข้อมูลภายนอกเฉพาะเมื่อจำเป็นต่อความถูกต้องหรือความเป็นปัจจุบัน';
    }
    return formatPlan(createPlan({ question })) || '- ใช้ AI วิเคราะห์จากข้อมูลที่ผู้ใช้ให้ก่อน';
  }

  function buildHandoffPrompt(card) {
    const question = findQuestion(card) || '[คำถามของผู้ใช้]';
    const domain = findDomain(card);
    const sources = collectOfficialSources(card);
    const sourceBlock = sources.length
      ? sources.map((source, index) => `${index + 1}. ${source.title || 'แหล่งราชการ'}\n${source.url}`).join('\n\n')
      : 'ยังไม่มีแหล่งราชการที่ยืนยันได้จาก GovPrompt';
    const toolRoutingBlock = buildToolRoutingBlock(question);

    return [
      'บทบาท',
      `คุณเป็นผู้ช่วยงานราชการไทยด้าน${domain}`,
      '',
      'คำถามจากผู้ใช้',
      question,
      '',
      'แนวทางเลือกเครื่องมือ',
      toolRoutingBlock,
      '',
      'แนวทางตอบ',
      '- ตอบจากข้อเท็จจริงและหลักฐานที่มี ไม่สมมติเลขมาตรา เลขหนังสือ วันที่ ชื่อบุคคล หรือข้อเท็จจริงที่ไม่ได้ให้มา',
      '- หากข้อมูลสำคัญไม่ครบ ให้ตอบเบื้องต้นเท่าที่ทำได้ แล้วถามเพิ่มเฉพาะข้อมูลที่มีผลต่อคำตอบ',
      '- ใช้แหล่งราชการ/ต้นฉบับเป็นหลัก และตรวจสถานะความเป็นปัจจุบันก่อนฟันธง',
      '- แยกข้อเท็จจริง ประเด็นวิเคราะห์ ความเสี่ยง และข้อเสนอแนะเมื่อเหมาะสม',
      '- คำนึงถึง PDPA และหลีกเลี่ยงการขอหรือแสดงข้อมูลส่วนบุคคลที่ไม่จำเป็น',
      '- หากยังยืนยันฉบับล่าสุดไม่ได้ ให้ระบุชัดว่า ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง',
      '',
      'แหล่งราชการที่ GovPrompt ค้นให้',
      sourceBlock,
      '',
      'หมายเหตุ',
      'Prompt นี้เป็นผลลัพธ์สำหรับนำไปวิเคราะห์ต่อ ไม่รวมกฎภายใน ระบบจัดอันดับ หรือกลไกความปลอดภัยภายในของ GovPrompt'
    ].join('\n');
  }

  function safeHandoff(card) {
    const raw = buildHandoffPrompt(card);
    const sanitizer = window.GovPromptCore?.sanitizeExternalContent;
    if (typeof sanitizer !== 'function') return { blocked: true, safeText: '' };
    const result = sanitizer(raw);
    return { blocked: Boolean(result.blocked), safeText: String(result.safeText || ''), changed: Boolean(result.changed) };
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
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
    }
  }

  async function handoffTo(card, destination) {
    const handoff = safeHandoff(card);
    if (handoff.blocked || !handoff.safeText) {
      window.GovPrompt?.toast?.('🔒 หยุดส่งต่อ: ยังพบข้อมูลเสี่ยง กรุณาปกปิดข้อมูลก่อน');
      return;
    }
    const copied = await copyText(handoff.safeText);
    if (!copied) {
      window.GovPrompt?.toast?.('ไม่สามารถคัดลอก Prompt ได้ กรุณาลองใหม่');
      return;
    }
    if (destination === 'chatgpt') window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
    if (destination === 'gemini') window.open('https://gemini.google.com/', '_blank', 'noopener,noreferrer');

    if (destination === 'chatgpt') {
      window.GovPrompt?.toast?.(handoff.changed
        ? '🔐 ปกปิดข้อมูลเสี่ยงและคัดลอก Prompt แล้ว — กรุณาวางใน ChatGPT'
        : 'คัดลอก Prompt แล้ว — กรุณาวางใน ChatGPT');
      return;
    }
    if (destination === 'gemini') {
      window.GovPrompt?.toast?.(handoff.changed
        ? '🔐 ปกปิดข้อมูลเสี่ยงและคัดลอก Prompt แล้ว — กรุณาวางใน Gemini'
        : 'คัดลอก Prompt แล้ว — กรุณาวางใน Gemini');
      return;
    }
    window.GovPrompt?.toast?.(handoff.changed ? '🔐 ปกปิดข้อมูลเสี่ยงและคัดลอก Prompt แล้ว' : 'คัดลอก Prompt พร้อมใช้แล้ว');
  }

  function simplifyAnswerCard(card) {
    if (!card) return;

    const actions = card.querySelector('.answer-actions');
    if (actions) {
      actions.classList.add('handoff-actions');
      [...actions.children].forEach(control => {
        const label = String(control.textContent || '').trim();
        if (/^เปิดแบบฟอร์ม\b/i.test(label)) control.remove();
      });

      let chatGPT = [...actions.querySelectorAll('button')].find(button => /ChatGPT/i.test(button.textContent));
      let gemini = [...actions.querySelectorAll('button')].find(button => /Gemini/i.test(button.textContent));
      let copyButton = [...actions.querySelectorAll('button')].find(button => button.textContent.includes('คัดลอก Prompt'));

      if (!chatGPT) {
        chatGPT = document.createElement('button');
        chatGPT.type = 'button';
        actions.prepend(chatGPT);
      }
      chatGPT.textContent = 'เปิดใน ChatGPT';
      chatGPT.title = 'คัดลอก Prompt แล้วเปิด ChatGPT เพื่อให้ผู้ใช้วาง Prompt เอง';
      chatGPT.classList.add('handoff-primary');

      if (!gemini) {
        gemini = document.createElement('button');
        gemini.type = 'button';
        chatGPT.after(gemini);
      }
      gemini.textContent = 'เปิดใน Gemini';
      gemini.title = 'คัดลอก Prompt แล้วเปิด Gemini เพื่อให้ผู้ใช้วาง Prompt เอง';
      gemini.classList.add('handoff-primary');

      if (copyButton) {
        copyButton.textContent = 'คัดลอก Prompt';
        copyButton.title = 'คัดลอกเฉพาะ Prompt พร้อมใช้ที่ผ่าน Privacy Guard';
        copyButton.classList.add('prompt-copy-secondary');
      }

      actions.setAttribute('aria-label', 'นำ Prompt พร้อมใช้ไปวิเคราะห์ต่อ');
    }

    const heading = card.querySelector('.answer-section > h3');
    if (heading) heading.textContent = 'นำไปใช้ต่อ';

    const paragraphs = [...card.querySelectorAll('.answer-section > p')];
    const description = paragraphs.find(paragraph => paragraph.textContent.includes('ระบบจัดคำถามไปที่'));
    description?.remove();

    const routeLabel = card.parentElement?.querySelector('.route-label');
    if (routeLabel) routeLabel.textContent = findDomain(card);

    const detailsBlocks = [...card.querySelectorAll('.answer-section > details')];
    const promptDetails = detailsBlocks.find(details => details.querySelector('pre'));
    if (promptDetails) {
      promptDetails.open = false;
      const summary = promptDetails.querySelector('summary');
      const preview = promptDetails.querySelector('pre');
      if (summary) summary.textContent = 'ดู Prompt ที่ GovPrompt เตรียมไว้';
      if (preview) preview.textContent = buildHandoffPrompt(card);
    }

    card.dataset.leanModeReady = 'true';
  }

  function enforceLeanMode(root = document) {
    root.querySelectorAll?.('.answer-card').forEach(simplifyAnswerCard);
    document.querySelector('.bottom-nav [data-panel="tools"]')?.remove();
  }

  document.addEventListener('click', event => {
    const control = event.target.closest?.('.answer-actions button');
    if (!control) return;
    const card = control.closest('.answer-card');
    if (!card) return;
    const label = String(control.textContent || '').trim();
    if (!/^(?:เปิดใน\s+)?(?:ChatGPT|Gemini)$|^คัดลอก Prompt$/i.test(label)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (/ChatGPT/i.test(label)) void handoffTo(card, 'chatgpt');
    else if (/Gemini/i.test(label)) void handoffTo(card, 'gemini');
    else void handoffTo(card, 'copy');
  }, true);

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
