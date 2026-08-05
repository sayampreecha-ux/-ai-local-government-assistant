(() => {
  'use strict';

  const form = document.getElementById('chatForm');
  const input = document.getElementById('promptInput');
  const conversation = document.getElementById('conversation');
  const attachmentInput = document.getElementById('attachmentInput');
  const cameraInput = document.getElementById('cameraInput');
  const attachmentStatus = document.getElementById('attachmentStatus');
  const dialog = document.getElementById('appDialog');
  const historyKey = 'govprompt-v3-history';
  let attachments = [];

  const escapeHTML = value => String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const domainNames = Object.freeze({
    records: 'งานสารบรรณ', legal: 'กฎหมายและข้อบัญญัติ', procurement: 'พัสดุและจัดซื้อจัดจ้าง',
    'planning-budget': 'แผนและงบประมาณ', finance: 'การเงินและการคลัง', 'human-resources': 'งานบุคคล',
    engineering: 'งานช่างและวิศวกรรม', 'public-health': 'สาธารณสุข', education: 'การศึกษา',
    'internal-audit': 'ตรวจสอบภายใน', executive: 'งานบริหาร', 'public-relations': 'ประชาสัมพันธ์', general: 'งานราชการทั่วไป'
  });

  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }

  function addUserMessage(text) {
    const article = document.createElement('article');
    article.className = 'message user';
    article.innerHTML = `<div class="message-body">${escapeHTML(text)}</div>`;
    conversation.appendChild(article);
  }

  function addThinking() {
    const article = document.createElement('article');
    article.className = 'message assistant';
    article.id = 'thinkingMessage';
    article.innerHTML = '<span class="assistant-mark" aria-hidden="true">กพ</span><div class="assistant-content"><div class="thinking"><span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>กำลังวิเคราะห์งานราชการ</span></div><div class="analysis-steps">จำแนกประเภทงาน · ตรวจบริบท · เตรียมแหล่งอ้างอิง</div></div>';
    conversation.appendChild(article);
  }

  function routePrompt(text) {
    const context = window.GovPromptCore.createSharedContext({ facts: text, desiredOutput: text, documents: attachments.map(file => file.name).join(', ') });
    return window.GovPromptCore.routeTransaction(context);
  }

  function answerCopy(route, text) {
    const name = domainNames[route.transactionType] || domainNames.general;
    return {
      summary: `ระบบจำแนกคำถามนี้เป็น “${name}” และส่งต่อให้ ${route.assistant.title} วิเคราะห์โดยอัตโนมัติ`,
      laws: 'ควรตรวจสอบกฎหมาย ระเบียบ หนังสือสั่งการ และข้อบัญญัติที่ใช้บังคับ ณ วันที่ดำเนินการ โดยไม่สมมติเลขมาตราหรือแหล่งอ้างอิงที่ยังไม่ผ่านการตรวจสอบ',
      procedure: `รวบรวมข้อเท็จจริง หน่วยงานเจ้าของเรื่อง ขั้นตอนปัจจุบัน เอกสารที่มี และผลลัพธ์ที่ต้องการ สำหรับเรื่อง “${text}” ก่อนจัดทำร่างหรือดำเนินการ`,
      risk: 'ข้อมูลสำคัญยังอาจไม่ครบถ้วน การอนุมัติ วงเงิน วันที่ และอำนาจหน้าที่ต้องให้ผู้รับผิดชอบตรวจสอบก่อนใช้จริง',
      recommendation: 'เปิดเครื่องมือเฉพาะด้านเพื่อกรอกรายละเอียดและสร้าง Prompt ฉบับเต็ม หรือถามต่อในช่องสนทนาเพื่อเพิ่มบริบท',
      references: 'คลังความรู้และ Citation Engine จะยอมรับเฉพาะเอกสารที่มีผลใช้บังคับและแหล่งราชการที่ตรวจสอบได้'
    };
  }

  function addAnswer(route, text) {
    const copy = answerCopy(route, text);
    const article = document.createElement('article');
    article.className = 'message assistant';
    article.innerHTML = `<span class="assistant-mark" aria-hidden="true">กพ</span><div class="assistant-content"><span class="route-label">${escapeHTML(domainNames[route.transactionType] || domainNames.general)} · ${route.moduleId}</span><div class="answer-card"><section class="answer-section"><h3>สรุป</h3><p>${escapeHTML(copy.summary)}</p></section><section class="answer-section"><h3>กฎหมายที่เกี่ยวข้อง</h3><p>${escapeHTML(copy.laws)}</p></section><section class="answer-section"><h3>ขั้นตอนดำเนินการ</h3><p>${escapeHTML(copy.procedure)}</p></section><section class="answer-section risk"><h3>ความเสี่ยง</h3><p>${escapeHTML(copy.risk)}</p></section><section class="answer-section"><h3>ข้อเสนอแนะ</h3><p>${escapeHTML(copy.recommendation)}</p><div class="answer-actions"><a href="${escapeHTML(route.assistant.path)}">เปิดเครื่องมือขั้นสูง</a><button type="button" data-copy-answer>คัดลอก</button></div></section><section class="answer-section references"><h3>เอกสารอ้างอิง</h3><p>${escapeHTML(copy.references)}</p></section></div></div>`;
    conversation.appendChild(article);
    article.querySelector('[data-copy-answer]').addEventListener('click', async () => {
      await navigator.clipboard.writeText(Object.values(copy).join('\n\n'));
      window.GovPrompt?.toast('คัดลอกคำตอบแล้ว');
    });
  }

  function saveHistory(text, route) {
    let history = [];
    try { history = JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch { history = []; }
    history.unshift({ text, moduleId: route.moduleId, domain: domainNames[route.transactionType] || domainNames.general, at: new Date().toISOString() });
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
  }

  async function submitPrompt(text) {
    document.querySelector('.chat-main').classList.add('has-messages');
    addUserMessage(text);
    addThinking();
    conversation.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
    const route = routePrompt(text);
    await new Promise(resolve => setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850));
    document.getElementById('thinkingMessage')?.remove();
    addAnswer(route, text);
    saveHistory(text, route);
    conversation.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    resizeInput();
    submitPrompt(text);
  });

  input.addEventListener('input', resizeInput);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => submitPrompt(button.dataset.prompt)));

  function collectFiles(fileList) {
    attachments = [...attachments, ...Array.from(fileList)].slice(0, 5);
    attachmentStatus.textContent = attachments.length ? `แนบแล้ว ${attachments.length} ไฟล์: ${attachments.map(file => file.name).join(', ')}` : '';
  }
  attachmentInput.addEventListener('change', () => collectFiles(attachmentInput.files));
  cameraInput.addEventListener('change', () => collectFiles(cameraInput.files));

  document.getElementById('micButton').addEventListener('click', () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { window.GovPrompt?.toast('เบราว์เซอร์นี้ยังไม่รองรับการพิมพ์ด้วยเสียง'); return; }
    const recognition = new Recognition();
    const button = document.getElementById('micButton');
    recognition.lang = 'th-TH';
    recognition.interimResults = false;
    recognition.onstart = () => button.classList.add('listening');
    recognition.onresult = event => { input.value += `${input.value ? ' ' : ''}${event.results[0][0].transcript.trim()}`; resizeInput(); };
    recognition.onerror = () => window.GovPrompt?.toast('ไม่สามารถเข้าถึงไมโครโฟนได้ตามนโยบายความปลอดภัย');
    recognition.onend = () => button.classList.remove('listening');
    recognition.start();
  });

  function historyPanel() {
    let history = [];
    try { history = JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch { history = []; }
    if (!history.length) return '<div class="empty-panel"><strong>ยังไม่มีประวัติการใช้งาน</strong><p>คำถามล่าสุดจะเก็บไว้เฉพาะในอุปกรณ์นี้</p></div>';
    return `<div class="tool-list">${history.map(item => `<a href="#" data-history="${escapeHTML(item.text)}"><strong>${escapeHTML(item.text)}</strong><small>${escapeHTML(item.domain)} · ${new Date(item.at).toLocaleString('th-TH')}</small></a>`).join('')}</div>`;
  }

  function toolsPanel() {
    return `<p>เครื่องมือเฉพาะทางสำหรับผู้ใช้ขั้นสูง ระบบสนทนาจะเลือกเครื่องมือเหล่านี้ให้อัตโนมัติ</p><div class="tool-list">${window.GovPromptCore.PROMPT_REGISTRY.map(tool => `<a href="${tool.path}"><strong>${tool.moduleId} · ${escapeHTML(tool.title)}</strong><small>เปิดแบบฟอร์มเฉพาะด้าน</small></a>`).join('')}</div>`;
  }

  const panels = {
    history: ['ประวัติ', 'บทสนทนาล่าสุด', historyPanel],
    knowledge: ['คลังความรู้', 'Knowledge Engine', () => '<div class="empty-panel"><strong>คลังความรู้พร้อมใช้งาน</strong><p>ระบบตรวจรุ่นเอกสาร วันที่มีผล และแหล่งราชการก่อนสร้างการอ้างอิง โดยไม่แสดงข้อมูลภายในที่ไม่จำเป็น</p></div>'],
    profile: ['โปรไฟล์', 'บริบทการทำงาน', () => '<div class="empty-panel"><strong>บริบทส่วนตัวจะมาในรุ่นถัดไป</strong><p>ขณะนี้ระบบไม่ส่งหรือจัดเก็บข้อมูลโปรไฟล์จากหน้านี้</p></div>'],
    tools: ['เครื่องมือ', 'ADVANCED USERS', toolsPanel]
  };

  document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
    const [title, eyebrow, content] = panels[button.dataset.panel];
    document.getElementById('dialogTitle').textContent = title;
    document.getElementById('dialogEyebrow').textContent = eyebrow;
    document.getElementById('dialogContent').innerHTML = content();
    dialog.showModal();
    dialog.querySelectorAll('[data-history]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault(); dialog.close(); input.value = link.dataset.history; resizeInput(); input.focus();
    }));
  }));
  document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
  document.getElementById('newChat').addEventListener('click', () => {
    conversation.replaceChildren(); attachments = []; attachmentStatus.textContent = '';
    document.querySelector('.chat-main').classList.remove('has-messages'); input.focus();
  });
})();
