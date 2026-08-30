(() => {
  'use strict';

  if (window.__GOVPROMPT_STATUS_COPY_V15__) return;
  window.__GOVPROMPT_STATUS_COPY_V15__ = true;

  const CURRENT_TEXT = '✅ ค้นสดและยืนยันหลักฐานปัจจุบันได้ตาม metadata ที่มี';
  const SAFER_TEXT = '✅ พบแหล่งราชการที่มีข้อมูลวันที่/การปรับปรุงล่าสุด — โปรดตรวจสอบสถานะการใช้บังคับของเอกสารก่อนนำไปอ้างอิง';
  const GENERIC_EVIDENCE_TEXT = 'ข้อมูล/หลักฐานเพิ่มเติมตามขั้นตอนนี้';
  const TECHNICAL_LABELS = Object.freeze({
    currentBudgetRule: 'หลักเกณฑ์งบประมาณฉบับปัจจุบัน',
    baselineBudgetSource: 'แหล่งข้อมูลงบประมาณปีเดิม',
    latestRevenueActualsSource: 'แหล่งข้อมูลรายรับจริงล่าสุด',
    targetYearPlanSource: 'แหล่งข้อมูลแผนพัฒนาปีเป้าหมาย',
    organizationContext: 'ชื่อและประเภทหน่วยงาน',
    targetBudgetYear: 'ปีงบประมาณที่จัดทำ',
    baselineBudget: 'ข้อมูลงบประมาณปีเดิม',
    latestRevenueActuals: 'รายรับจริงล่าสุด',
    revenueForecastBasis: 'หลักเกณฑ์และฐานประมาณการรายรับ',
    targetYearPlan: 'แผนพัฒนาปีเป้าหมาย',
    projectRequests: 'คำของบและโครงการที่จะบรรจุในงบประมาณ',
    personnelObligations: 'ภาระบุคลากรและภาระผูกพัน',
    allocationDraft: 'ร่างการจัดสรรวงเงิน',
    priorityReadiness: 'ผลจัดลำดับความสำคัญและความพร้อม',
    budgetRiskReview: 'ผลทบทวนความเสี่ยงงบประมาณ',
    budgetTotals: 'ยอดรวมรายรับและรายจ่าย',
    budgetSourceRegister: 'ทะเบียนแหล่งข้อมูลประกอบงบประมาณ',
    'gov.budget-draft': 'งานร่างงบประมาณ',
    'gov.procurement': 'งานจัดซื้อจัดจ้าง',
    'gov.finance': 'งานการเงินและการคลัง',
    'gov.project': 'งานแผนและโครงการ',
    'gov.legal': 'งานกฎหมาย',
    'gov.correspondence': 'งานสารบรรณ',
    'gov.hr': 'งานบุคคล',
    'gov.engineering': 'งานช่างและวิศวกรรม',
    'gov.health': 'งานสาธารณสุข',
    'gov.education': 'งานการศึกษา',
    'gov.internal-audit': 'งานตรวจสอบภายใน',
    'gov.executive': 'งานบริหาร',
    'gov.public-relations': 'งานประชาสัมพันธ์',
    'gov.council': 'งานสภาท้องถิ่น',
    'gov.citizen-service': 'งานบริการประชาชน',
    'Budget Draft Agent': 'ผู้ช่วยจัดทำร่างงบประมาณ',
    'Working Draft': 'ร่างทำงาน'
  });
  const TECHNICAL_KEYS = Object.keys(TECHNICAL_LABELS).sort((a, b) => b.length - a.length);

  function humanizeTechnicalCopy(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(node => {
      let value = String(node.nodeValue || '');
      TECHNICAL_KEYS.forEach(key => { if (value.includes(key)) value = value.split(key).join(TECHNICAL_LABELS[key]); });
      const repeatedGeneric = new RegExp(`(?:${GENERIC_EVIDENCE_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*·\\s*)+${GENERIC_EVIDENCE_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      value = value.replace(repeatedGeneric, 'ข้อมูล/หลักฐานเพิ่มเติมที่ต้องใช้ในขั้นตอนนี้');
      if (value !== node.nodeValue) node.nodeValue = value;
    });
    root.querySelectorAll?.('.workflow-progress-item span').forEach(element => {
      const parts = String(element.textContent || '').split('·').map(part => part.trim()).filter(Boolean);
      const unique = [...new Set(parts)];
      if (unique.length && unique.length !== parts.length) element.textContent = unique.join(' · ');
    });
  }

  function softenFreshnessCopy(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const matches = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue?.includes(CURRENT_TEXT)) matches.push(walker.currentNode);
    }
    matches.forEach(node => { node.nodeValue = node.nodeValue.replace(CURRENT_TEXT, SAFER_TEXT); });
  }

  function findQuestion(card) {
    const article = card.closest('.message.assistant');
    let cursor = article?.previousElementSibling || null;
    while (cursor) {
      if (cursor.matches('.message.user')) return String(cursor.querySelector('.message-body')?.textContent || '').trim();
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
      .filter(item => item.url && !seen.has(item.url) && seen.add(item.url)).slice(0, 8);
  }

  function buildToolRoutingBlock(question) {
    const createPlan = window.GovPromptCore?.createToolRoutingPlan;
    const formatPlan = window.GovPromptCore?.formatToolRoutingInstructions;
    if (typeof createPlan !== 'function' || typeof formatPlan !== 'function') return '- ใช้ข้อมูลที่ผู้ใช้ให้ก่อน และค้นข้อมูลภายนอกเฉพาะเมื่อจำเป็นต่อความถูกต้องหรือความเป็นปัจจุบัน';
    return formatPlan(createPlan({ question })) || '- ใช้ AI วิเคราะห์จากข้อมูลที่ผู้ใช้ให้ก่อน';
  }

  function isDocumentFormattingQuestion(question) {
    return /จัดหน้า|จัดรูปแบบ|จัดเอกสาร|เรียบเรียงเอกสาร|สรุปเอกสาร|สรุปรายงาน|สรุปประชุม|รายงานประชุม|ทำสไลด์|แปลง.*สไลด์|presentation|powerpoint|pptx|word|pdf/i.test(String(question || ''));
  }

  function buildDocumentFormattingBlock(question) {
    if (!isDocumentFormattingQuestion(question)) return '';
    return [
      'โหมดจัดหน้าเอกสาร',
      '- หากมี PDF/Word/PPTX แนบอยู่ใน AI ปลายทาง ให้อ่านไฟล์ที่แนบก่อน แล้วใช้เนื้อหาในไฟล์เป็นหลัก',
      '- รักษาข้อเท็จจริง ชื่อบุคคล ชื่อหน่วยงาน ตัวเลข วันที่ เลขที่หนังสือ และสาระเดิม ห้ามแต่งเติมข้อเท็จจริงที่ไม่มีในเอกสาร',
      '- จัดโครงสร้างให้อ่านง่ายและเป็นทางการด้วยหัวข้อหลัก หัวข้อย่อย Bullet Points ตาราง และระยะห่างตามความเหมาะสม โดยไม่ทำให้สาระเดิมคลาดเคลื่อน',
      '- ถ้าเป็นรายงานทั่วไป: แยกหัวข้อหลัก/ย่อย เน้นสาระสำคัญ และใช้ Bullet Points หรือตารางเมื่อช่วยให้อ่านเร็วขึ้น',
      '- ถ้าเป็นสรุปประชุม: แยก 1) สาระสำคัญ 2) มติ 3) งานที่ต้องดำเนินการ 4) ผู้รับผิดชอบ 5) กำหนดส่ง และห้ามสร้างมติ/ผู้รับผิดชอบ/กำหนดส่งที่เอกสารไม่ได้ระบุ',
      '- ถ้าเป็นสไลด์นำเสนอ: แบ่งเป็นสไลด์ตามหัวข้อที่ชัดเจน ใช้ประมาณ 3–4 ประเด็นต่อสไลด์ และระบุชื่อสไลด์ทุกหน้า',
      '- หากผู้ใช้ขอไฟล์ PDF/Word/PPTX และแพลตฟอร์มรองรับการสร้างไฟล์ ให้สร้างไฟล์ตามรูปแบบที่ขอ; หากไม่รองรับ ให้จัดเนื้อหาและโครงสร้างพร้อมนำไปวางต่อ และห้ามอ้างว่าส่งออกไฟล์แล้วหากไม่ได้สร้างไฟล์จริง',
      '- ตรวจความครบถ้วน ความสม่ำเสมอของหัวข้อ การเว้นวรรค ตาราง และตัวเลขอีกครั้งก่อนส่งผลลัพธ์'
    ].join('\n');
  }

  function isPrCreationQuestion(question, domain = '') {
    const text = String(question || '').normalize('NFC');
    const domainText = String(domain || '');
    const prDomain = /ประชาสัมพันธ์|public-relations/i.test(domainText);
    const mediaObject = /(?:วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์|โพสต์|ข่าวประชาสัมพันธ์|อินโฟกราฟิก|โปสเตอร์|แคปชัน|สคริปต์|คำกล่าว)/i.test(text);
    const creationVerb = /(?:ทำ|สร้าง|ร่าง|เขียน|จัดทำ|ออกแบบ|วางข้อความ|สรุป|เรียบเรียง)/i.test(text);
    return (prDomain && mediaObject && creationVerb)
      || /(?:ทำ|สร้าง|ร่าง|เขียน|จัดทำ|ออกแบบ).{0,30}(?:วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์|โพสต์|ข่าวประชาสัมพันธ์|อินโฟกราฟิก|โปสเตอร์|แคปชัน|สคริปต์)/i.test(text)
      || /(?:วิดีโอ|วีดีโอ|คลิป|video).{0,30}(?:ประชาสัมพันธ์|แนะนำ(?:องค์กร|หน่วยงาน|อบจ\.?|อบต\.?|เทศบาล|อปท\.?)?)/i.test(text);
  }

  function buildPrCreationHandoffPrompt(question) {
    const text = String(question || '').trim() || '[งานประชาสัมพันธ์ที่ผู้ใช้ต้องการ]';
    const isVideo = /(?:วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์)/i.test(text);
    const lines = [
      'บทบาท',
      'คุณเป็นผู้ช่วยงานประชาสัมพันธ์ของหน่วยงานราชการไทย',
      '',
      'งานที่ผู้ใช้ต้องการ',
      text,
      '',
      'หลักการทำงาน',
      '- ใช้ข้อเท็จจริงและข้อมูลที่ผู้ใช้ให้เป็นหลัก ไม่ค้นเว็บโดยอัตโนมัติ เว้นแต่ผู้ใช้ขอให้ตรวจข้อมูลปัจจุบันหรือค้นแหล่งอ้างอิงเพิ่ม',
      '- ห้ามแต่งชื่อบุคคล ตำแหน่ง วันที่ ตัวเลข สถานที่ ผลงาน เหตุการณ์ หรือผลการดำเนินงานที่ผู้ใช้ไม่ได้ให้',
      '- หากข้อมูลสำคัญขัดแย้ง ให้ชี้จุดขัดแย้งก่อน และใช้เฉพาะข้อมูลที่ยืนยันได้',
      '- ตรวจ PDPA ข้อมูลส่วนบุคคล สิทธิการใช้ภาพ/สื่อ ลิขสิทธิ์ และความเหมาะสมก่อนเผยแพร่',
      '- ใช้ภาษาไทยอ่านง่าย กระชับ น่าเชื่อถือ และเหมาะกับการสื่อสารของหน่วยงานราชการ',
      '- ถ้าข้อมูลเพียงพอ ให้จัดทำชิ้นงานทันที ไม่ถามซ้ำหรือถามเพิ่มโดยไม่จำเป็น'
    ];

    if (isVideo) {
      lines.push(
        '',
        'ผลลัพธ์ที่ต้องส่งมอบ',
        '1. ลำดับฉาก / Storyboard พร้อมช่วงเวลาโดยประมาณ',
        '2. บทพากย์ภาษาไทย',
        '3. ข้อความขึ้นจอและซับไตเติล',
        '4. รายการภาพหรือคลิปที่ควรใช้ในแต่ละช่วง',
        '5. Prompt พร้อมคัดลอกไปใช้กับ AI Video ภายนอก',
        '',
        'ข้อกำหนดสำหรับวิดีโอ',
        '- ถ้าผู้ใช้ระบุความยาวแล้ว ให้จัดจำนวนฉากและจังหวะเนื้อหาให้พอดีกับเวลานั้น',
        '- ถ้าผู้ใช้ให้ GP แนะนำความยาว ให้เสนอความยาวที่เหมาะสมก่อน แล้วจัด Storyboard ตามความยาวที่เสนอ',
        '- ระบุว่าภาพหรือคลิปใดควรใช้ช่วงใด โดยไม่อ้างว่ามีไฟล์หรือภาพที่ผู้ใช้ยังไม่ได้ให้',
        '- ปิดท้ายด้วย Call to Action เฉพาะเมื่อเหมาะกับวัตถุประสงค์ของงาน'
      );
    } else {
      lines.push(
        '',
        'ผลลัพธ์ที่ต้องส่งมอบ',
        '- จัดชิ้นงานประชาสัมพันธ์พร้อมคัดลอกไปใช้ตามรูปแบบที่ผู้ใช้ขอ'
      );
    }

    return lines.join('\n');
  }

  function buildHandoffPrompt(card) {
    const question = findQuestion(card) || '[คำถามของผู้ใช้]';
    const domain = findDomain(card);
    if (isPrCreationQuestion(question, domain)) return buildPrCreationHandoffPrompt(question);
    const sources = collectOfficialSources(card);
    const sourceBlock = sources.length ? sources.map((source, index) => `${index + 1}. ${source.title || 'แหล่งราชการ'}\n${source.url}`).join('\n\n') : 'ยังไม่มีแหล่งราชการที่ยืนยันได้จาก GovPrompt';
    const formattingBlock = buildDocumentFormattingBlock(question);
    return ['บทบาท', `คุณเป็นผู้ช่วยงานราชการไทยด้าน${domain}`, '', 'คำถามจากผู้ใช้', question, '', 'แนวทางเลือกเครื่องมือ', buildToolRoutingBlock(question), '', 'แนวทางตอบ', '- ตอบจากข้อเท็จจริงและหลักฐานที่มี ไม่สมมติเลขมาตรา เลขหนังสือ วันที่ ชื่อบุคคล หรือข้อเท็จจริงที่ไม่ได้ให้มา', '- หากข้อมูลสำคัญไม่ครบ ให้ตอบเบื้องต้นเท่าที่ทำได้ แล้วถามเพิ่มเฉพาะข้อมูลที่มีผลต่อคำตอบ', '- ใช้แหล่งราชการ/ต้นฉบับเป็นหลัก และตรวจสถานะความเป็นปัจจุบันก่อนฟันธง', '- แยกข้อเท็จจริง ประเด็นวิเคราะห์ ความเสี่ยง และข้อเสนอแนะเมื่อเหมาะสม', '- คำนึงถึง PDPA และหลีกเลี่ยงการขอหรือแสดงข้อมูลส่วนบุคคลที่ไม่จำเป็น', '- หากยังยืนยันฉบับล่าสุดไม่ได้ ให้ระบุชัดว่า ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง', formattingBlock ? `\n${formattingBlock}` : '', '', 'แหล่งราชการที่ GovPrompt ค้นให้', sourceBlock, '', 'หมายเหตุ', 'Prompt นี้เป็นผลลัพธ์สำหรับนำไปวิเคราะห์ต่อ ไม่รวมกฎภายใน ระบบจัดอันดับ หรือกลไกความปลอดภัยภายในของ GovPrompt'].filter(Boolean).join('\n');
  }

  function safeHandoff(card) {
    const sanitizer = window.GovPromptCore?.sanitizeExternalContent;
    if (typeof sanitizer !== 'function') return { blocked: true, safeText: '' };
    const result = sanitizer(buildHandoffPrompt(card));
    return { blocked: Boolean(result.blocked), safeText: String(result.safeText || ''), changed: Boolean(result.changed) };
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const textarea = document.createElement('textarea'); textarea.value = text; textarea.setAttribute('readonly', ''); textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.appendChild(textarea); textarea.select(); const copied = document.execCommand('copy'); textarea.remove(); return copied;
    }
  }

  async function handoffTo(card, destination) {
    const handoff = safeHandoff(card);
    if (handoff.blocked || !handoff.safeText) { window.GovPrompt?.toast?.('🔒 หยุดส่งต่อ: ยังพบข้อมูลเสี่ยง กรุณาปกปิดข้อมูลก่อน'); return; }
    if (!await copyText(handoff.safeText)) { window.GovPrompt?.toast?.('ไม่สามารถคัดลอกคำสั่งได้ กรุณาลองใหม่'); return; }
    if (destination === 'chatgpt') window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
    if (destination === 'gemini') window.open('https://gemini.google.com/', '_blank', 'noopener,noreferrer');
    if (destination === 'chatgpt') window.GovPrompt?.toast?.(handoff.changed ? '🔐 ปกปิดข้อมูลเสี่ยงแล้ว · คัดลอกแล้ว ✅ เปิด ChatGPT → แตะช่องข้อความ → วาง → กดส่ง' : 'คัดลอกแล้ว ✅ เปิด ChatGPT → แตะช่องข้อความ → วาง → กดส่ง');
    else if (destination === 'gemini') window.GovPrompt?.toast?.(handoff.changed ? '🔐 ปกปิดข้อมูลเสี่ยงแล้ว · คัดลอกแล้ว ✅ เปิด Gemini → แตะช่องข้อความ → วาง → กดส่ง' : 'คัดลอกแล้ว ✅ เปิด Gemini → แตะช่องข้อความ → วาง → กดส่ง');
    else window.GovPrompt?.toast?.(handoff.changed ? '🔐 ปกปิดข้อมูลเสี่ยงแล้ว · คัดลอกคำสั่งแล้ว ✅ ไปที่ ChatGPT → วาง → กดส่ง' : 'คัดลอกคำสั่งแล้ว ✅ ไปที่ ChatGPT → วาง → กดส่ง');
  }

  function styleSecondaryCopyButton(button) {
    if (!button) return;
    Object.assign(button.style, { gridColumn: '1 / -1', justifySelf: 'center', width: 'auto', minHeight: '36px', padding: '4px 8px', border: '0', background: 'transparent', color: '#005fcc', textDecoration: 'underline', textUnderlineOffset: '3px' });
  }

  function hideTechnicalSearchStatus(card) {
    const section = card.querySelector('.answer-section');
    if (!section) return;
    [...section.children].forEach(element => {
      const text = String(element.textContent || '').trim();
      if (element.tagName === 'P' && (/ค้นสด|live search|บริการค้นเว็บราชการสด|ยืนยันหลักฐานปัจจุบัน|ยังเชื่อมบริการค้นเว็บ/i.test(text))) element.hidden = true;
      if (element.tagName === 'DETAILS') {
        const summary = String(element.querySelector('summary')?.textContent || '').trim();
        const hasOfficialLinks = Boolean(element.querySelector('a[href]'));
        if (/สถานะการค้นข้อมูลราชการสด/i.test(summary) && !hasOfficialLinks) element.hidden = true;
      }
    });
  }

  function addSimpleHandoffGuide(card, heading) {
    const section = card.querySelector('.answer-section');
    if (!section || section.querySelector('.simple-handoff-guide')) return;
    const guide = document.createElement('p');
    const documentFormatting = isDocumentFormattingQuestion(findQuestion(card));
    guide.className = 'simple-handoff-guide';
    guide.innerHTML = documentFormatting
      ? '<strong>จัดหน้าเอกสาร 3 ขั้น:</strong> 1) กด “คัดลอกแล้วเปิดใน ChatGPT” 2) แนบไฟล์เดิม PDF/Word/PPTX ใน ChatGPT 3) วางคำสั่งแล้วกดส่ง<br><small>ถ้าต้องการไฟล์ปลายทาง ให้ระบุ Word, PDF หรือ PowerPoint ตามต้องการ และตรวจทานก่อนใช้จริง</small>'
      : '<strong>ทำต่อแค่ 3 ขั้น:</strong> 1) กด “คัดลอกแล้วเปิดใน ChatGPT” 2) ใน ChatGPT แตะช่องข้อความแล้วกด “วาง” 3) กดส่ง<br><small>ถ้ามีไฟล์ ให้แนบไฟล์ใน ChatGPT แล้วพิมพ์ว่า “ใช้ไฟล์นี้ทำตามคำสั่งข้างบน”</small>';
    Object.assign(guide.style, { margin: '10px 0 12px', padding: '10px 12px', borderRadius: '12px', background: '#f3f7f5', lineHeight: '1.6' });
    if (heading) heading.after(guide); else section.prepend(guide);
  }

  function simplifyWelcome() {
    const welcome = document.getElementById('welcome');
    if (!welcome) return;
    const intro = [...welcome.children].find(element => element.tagName === 'P' && !element.classList.contains('eyebrow'));
    if (intro) intro.textContent = 'อ่าน · สรุป · จัดหน้า · ตรวจ · เปรียบเทียบเอกสารราชการ พร้อมสร้าง Prompt ใช้ต่อได้';
    const documentAction = [...welcome.querySelectorAll('.quick-actions button')]
      .find(button => /^(?:จัดซื้อจัดจ้าง|สรุปเอกสาร|จัดหน้าเอกสาร)$/.test(String(button.textContent || '').trim()));
    if (documentAction) {
      documentAction.textContent = 'จัดหน้าเอกสาร';
      documentAction.dataset.prompt = 'ช่วยจัดหน้าเอกสารที่แนบให้อ่านง่ายและเป็นทางการ โดยรักษาข้อเท็จจริง ชื่อ ตัวเลข วันที่ และสาระเดิมไว้ จัดหัวข้อหลัก/หัวข้อย่อย ใช้ Bullet Points หรือตารางเมื่อเหมาะสม หากเป็นสรุปประชุมให้แยกสาระสำคัญ มติ ผู้รับผิดชอบ และกำหนดส่ง หากเป็นสไลด์ให้แบ่งหัวข้อชัดเจนประมาณ 3–4 ประเด็นต่อสไลด์';
    }
  }

  function simplifyAnswerCard(card) {
    if (!card) return;
    const actions = card.querySelector('.answer-actions');
    if (actions) {
      actions.classList.add('handoff-actions');
      [...actions.children].forEach(control => { if (/^เปิดแบบฟอร์ม\b/i.test(String(control.textContent || '').trim())) control.remove(); });
      let chatGPT = [...actions.querySelectorAll('button')].find(button => /ChatGPT/i.test(button.textContent));
      let gemini = [...actions.querySelectorAll('button')].find(button => /Gemini/i.test(button.textContent));
      const copyButton = [...actions.querySelectorAll('button')].find(button => /คัดลอก\s*(?:Prompt|คำสั่ง)/i.test(button.textContent));
      if (!chatGPT) { chatGPT = document.createElement('button'); chatGPT.type = 'button'; actions.prepend(chatGPT); }
      chatGPT.textContent = 'คัดลอกแล้วเปิดใน ChatGPT'; chatGPT.title = 'คัดลอกคำสั่ง แล้วเปิด ChatGPT เพื่อวางและกดส่ง'; chatGPT.classList.add('handoff-primary');
      if (!gemini) { gemini = document.createElement('button'); gemini.type = 'button'; chatGPT.after(gemini); }
      gemini.textContent = 'คัดลอกแล้วเปิดใน Gemini'; gemini.title = 'คัดลอกคำสั่ง แล้วเปิด Gemini เพื่อวางและกดส่ง'; gemini.classList.add('handoff-primary');
      if (copyButton) { copyButton.textContent = 'คัดลอกคำสั่งอย่างเดียว'; copyButton.title = 'คัดลอกเฉพาะคำสั่งพร้อมใช้ที่ผ่าน Privacy Guard'; copyButton.classList.add('prompt-copy-secondary'); styleSecondaryCopyButton(copyButton); }
      actions.setAttribute('aria-label', 'เลือกวิธีนำคำสั่งไปใช้ต่อ');
    }
    const heading = card.querySelector('.answer-section > h3');
    if (heading) heading.textContent = isDocumentFormattingQuestion(findQuestion(card)) ? 'คำสั่งจัดหน้าเอกสารพร้อมแล้ว — ทำต่อใน ChatGPT' : 'คำสั่งพร้อมแล้ว — ทำต่อใน ChatGPT';
    addSimpleHandoffGuide(card, heading);
    const description = [...card.querySelectorAll('.answer-section > p')].find(p => p.textContent.includes('ระบบจัดคำถามไปที่')); description?.remove();
    const routeLabel = card.parentElement?.querySelector('.route-label'); if (routeLabel) routeLabel.textContent = findDomain(card);
    hideTechnicalSearchStatus(card);
    const detailsBlocks = [...card.querySelectorAll('.answer-section > details')];
    const promptDetails = detailsBlocks.find(details => details.querySelector('pre'));
    if (promptDetails) { promptDetails.open = false; const summary = promptDetails.querySelector('summary'); const preview = promptDetails.querySelector('pre'); if (summary) summary.textContent = 'ดูคำสั่งที่ GovPrompt เตรียมไว้'; if (preview) preview.textContent = buildHandoffPrompt(card); }
    humanizeTechnicalCopy(card);
    card.dataset.leanModeReady = 'true';
  }

  function enforceLeanMode(root = document) {
    simplifyWelcome();
    root.querySelectorAll?.('.answer-card').forEach(simplifyAnswerCard);
    humanizeTechnicalCopy(root);
    document.querySelector('.bottom-nav [data-panel="tools"]')?.remove();
  }

  document.addEventListener('click', event => {
    const control = event.target.closest?.('.answer-actions button'); if (!control) return;
    const card = control.closest('.answer-card'); if (!card) return;
    const label = String(control.textContent || '').trim();
    if (!/ChatGPT|Gemini|คัดลอก\s*(?:Prompt|คำสั่ง)/i.test(label)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (/ChatGPT/i.test(label)) void handoffTo(card, 'chatgpt'); else if (/Gemini/i.test(label)) void handoffTo(card, 'gemini'); else void handoffTo(card, 'copy');
  }, true);

  window.GovPromptStatusCopy = Object.freeze({
    isPrCreationQuestion,
    buildPrCreationHandoffPrompt
  });

  if (typeof document === 'undefined') return;

  softenFreshnessCopy(); enforceLeanMode();
  const observer = new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue?.includes(CURRENT_TEXT)) node.nodeValue = node.nodeValue.replace(CURRENT_TEXT, SAFER_TEXT);
      humanizeTechnicalCopy(node.parentElement || document);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      softenFreshnessCopy(node);
      humanizeTechnicalCopy(node);
      enforceLeanMode(node.matches?.('.answer-card') ? node.parentElement || node : node);
    }
  })));
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();