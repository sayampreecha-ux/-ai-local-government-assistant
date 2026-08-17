(() => {
  'use strict';

  const VERSION = '1.1.1';
  const MAX_QUESTIONS = 3;
  const UNKNOWN_PATTERN = /(?:ไม่ทราบ|ยังไม่ทราบ|ยังไม่กำหนด|ยังไม่มีข้อมูล)/i;
  const CREATE_PATTERN = /(?:^|\s)(?:ร่าง|จัดทำ|ทำ|สร้าง|เขียน|เตรียม|ออกแบบ|จัดซื้อ|จัดจ้าง|จัดอบรม)(?:\s|$|[^ก-๙a-z0-9])/i;
  const GENERIC_PATTERNS = Object.freeze([
    /^ร่าง\s*tor$/i, /^tor$/i, /^ทำโครงการ$/i, /^โครงการ$/i, /^อบรม$/i, /^จัดอบรม$/i,
    /^ร่างหนังสือ(?:ราชการ)?$/i, /^หนังสือราชการ$/i, /^เบิกจ่าย$/i, /^วิเคราะห์กฎหมาย$/i,
    /^กฎหมาย$/i, /^ร่างงบประมาณ$/i, /^จัดทำร่างงบประมาณ$/i, /^ทำโพสต์$/i, /^ประชาสัมพันธ์$/i
  ]);

  const PROFILES = Object.freeze({
    procurement: Object.freeze([
      Object.freeze({ key: 'item', question: 'จะซื้อ จ้าง หรือก่อสร้างอะไร? ถ้ามีชื่อโครงการ บอกชื่อสั้น ๆ ได้เลย' }),
      Object.freeze({ key: 'purpose', question: 'ต้องการนำไปใช้ทำอะไร หรืออยากได้ผลลัพธ์แบบไหนจากงานนี้?' }),
      Object.freeze({ key: 'budget', question: 'วงเงินโดยประมาณเท่าไร และถ้าทราบ ใช้งบจากแหล่งใด? ถ้ายังไม่ทราบพิมพ์ “ไม่ทราบ” ได้' })
    ]),
    project: Object.freeze([
      Object.freeze({ key: 'topic', question: 'โครงการหรือการอบรมนี้เกี่ยวกับเรื่องอะไร และต้องการแก้ปัญหา/พัฒนาเรื่องใด?' }),
      Object.freeze({ key: 'target', question: 'กลุ่มเป้าหมายคือใคร และประมาณกี่คน?' }),
      Object.freeze({ key: 'budget', question: 'งบประมาณประมาณเท่าไร? ถ้ายังไม่กำหนดพิมพ์ “ไม่ทราบ” ได้' })
    ]),
    records: Object.freeze([
      Object.freeze({ key: 'topic', question: 'หนังสือนี้เกี่ยวกับเรื่องหรือข้อเท็จจริงอะไร?' }),
      Object.freeze({ key: 'recipient', question: 'จะเรียนหรือส่งถึงใคร/หน่วยงานใด?' }),
      Object.freeze({ key: 'purpose', question: 'ต้องการให้หนังสือมีวัตถุประสงค์อะไร เช่น ขออนุมัติ ขอความร่วมมือ แจ้ง หรือหารือ?' })
    ]),
    budget: Object.freeze([
      Object.freeze({ key: 'yearOrg', question: 'จะจัดทำงบประมาณปีใด และเป็นหน่วยงานประเภทใด เช่น อบจ. เทศบาล หรือ อบต.?' }),
      Object.freeze({ key: 'sourceData', question: 'มีข้อมูลรายรับ รายจ่ายเดิม ข้อบัญญัติเดิม หรือไฟล์ประกอบหรือไม่? ถ้ายังไม่มีพิมพ์ “ไม่ทราบ” ได้' }),
      Object.freeze({ key: 'purpose', question: 'ต้องการให้ช่วยระดับไหน เช่น วางกรอบ ตรวจสมดุล หรือจัดทำร่างพร้อมเอกสาร?' })
    ]),
    legal: Object.freeze([
      Object.freeze({ key: 'facts', question: 'ข้อเท็จจริงสำคัญของเรื่องนี้คืออะไร?' }),
      Object.freeze({ key: 'issue', question: 'ต้องการให้วิเคราะห์หรือตอบประเด็นกฎหมายใด?' }),
      Object.freeze({ key: 'topic', question: 'เรื่องนี้เกี่ยวกับงาน/กิจกรรมใดของหน่วยงาน?' })
    ]),
    finance: Object.freeze([
      Object.freeze({ key: 'topic', question: 'ต้องการเบิกหรือจ่ายค่าอะไร/รายการใด?' }),
      Object.freeze({ key: 'facts', question: 'ข้อเท็จจริงที่มีผลต่อสิทธิ เช่น ผู้เดินทาง ตำแหน่ง กิจกรรม หรือช่วงเวลา คืออะไร?' }),
      Object.freeze({ key: 'budget', question: 'มีจำนวนเงินหรือวงเงินประมาณเท่าไร? ถ้ายังไม่ทราบพิมพ์ “ไม่ทราบ” ได้' })
    ]),
    engineering: Object.freeze([
      Object.freeze({ key: 'topic', question: 'งานช่าง/ก่อสร้างนี้คืออะไร และอยู่พื้นที่ใด?' }),
      Object.freeze({ key: 'purpose', question: 'ต้องการให้ GP ช่วยอะไร เช่น TOR, BOQ, ตรวจแบบ, ประมาณราคา หรือวิเคราะห์ปัญหา?' }),
      Object.freeze({ key: 'budget', question: 'วงเงินประมาณเท่าไร? ถ้ายังไม่ทราบพิมพ์ “ไม่ทราบ” ได้' })
    ]),
    general: Object.freeze([
      Object.freeze({ key: 'output', question: 'ต้องการให้ GP ช่วยทำอะไรให้เสร็จ เช่น ร่างโครงการ หนังสือ คำกล่าว แผน หรือวิเคราะห์เรื่องใด?' }),
      Object.freeze({ key: 'topic', question: 'เรื่องหรือหัวข้อหลักคืออะไร?' }),
      Object.freeze({ key: 'target', question: 'เกี่ยวข้องกับใคร/กลุ่มเป้าหมายใด และมีจำนวนประมาณเท่าไร?' })
    ])
  });

  const TOR_FIRST_SUCCESS_COPY = Object.freeze({
    label: 'เริ่ม TOR อย่างเป็นขั้นตอน',
    heading: 'ร่าง TOR ให้เริ่มง่าย — บอก GP 3 เรื่อง',
    intro: 'ไม่ต้องเขียน Prompt และยังไม่ต้องรู้สเปกทั้งหมด ตอบเท่าที่มี แล้ว GP จะช่วยตั้งโครงงานต่อให้',
    note: 'จากนั้น GP จะช่วย 3 อย่าง: จัดโครง TOR · ตรวจจุดเสี่ยงล็อกสเปก/การแข่งขัน · บอกข้อมูลหรือหลักฐานที่ยังต้องยืนยัน — ผู้ใช้ตรวจและอนุมัติก่อนใช้จริง',
    unknown: 'ยังไม่ทราบ — ให้ GP ช่วยตั้งต้น'
  });

  const DEFAULT_COPY = Object.freeze({
    label: 'ขอข้อมูลเพิ่ม',
    heading: 'ขอข้อมูลเพิ่มอีกนิดก่อนทำต่อ',
    intro: '',
    note: 'ตอบรวมกันได้ในข้อความเดียว ไม่ต้องเขียน Prompt',
    unknown: 'ยังไม่ทราบบางข้อ — ทำต่อ'
  });

  const normalize = value => String(value || '').normalize('NFC').replace(/\s+/g, ' ').trim();
  const lower = value => normalize(value).toLocaleLowerCase('th-TH');

  function inferIntent(text, route = {}) {
    const value = lower(text);
    if (/(?:ร่าง\s*tor|\btor\b|จัดซื้อ|จัดจ้าง|พัสดุ|ราคากลาง|e-?bidding)/i.test(value)) return 'procurement';
    if (/(?:ทำโครงการ|จัดทำโครงการ|โครงการ|จัดอบรม|อบรม|กิจกรรม)/i.test(value)) return 'project';
    if (/(?:ร่างงบประมาณ|ทำร่างงบ|จัดทำร่างงบประมาณ|ข้อบัญญัติงบประมาณ)/i.test(value)) return 'budget';
    if (/(?:ร่างหนังสือ|หนังสือราชการ|บันทึกข้อความ|หนังสือภายนอก|หนังสือภายใน)/i.test(value)) return 'records';
    if (/(?:วิเคราะห์กฎหมาย|ข้อกฎหมาย|กฎหมาย|ข้อหารือ|อำนาจหน้าที่)/i.test(value)) return 'legal';
    if (/(?:เบิกจ่าย|ขอเบิก|ค่าใช้จ่าย|ค่าเดินทาง|เบิกค่า)/i.test(value)) return 'finance';
    if (/(?:งานช่าง|วิศวกรรม|ถนน|สะพาน|ก่อสร้าง|boq|ประมาณราคา)/i.test(value)) return 'engineering';
    const transactionType = String(route?.transactionType || '');
    if (transactionType === 'procurement') return 'procurement';
    if (transactionType === 'planning-budget') return 'project';
    if (transactionType === 'records') return 'records';
    if (transactionType === 'legal') return 'legal';
    if (transactionType === 'finance') return 'finance';
    if (transactionType === 'engineering') return 'engineering';
    return 'general';
  }

  function isTorRequest(text) {
    return /(?:\btor\b|ขอบเขตของงาน|ร่าง\s*tor)/i.test(normalize(text));
  }

  function isGenericRequest(text) {
    const value = normalize(text);
    if (GENERIC_PATTERNS.some(pattern => pattern.test(value))) return true;
    if (/^ช่วยร่าง\s*tor|^ช่วยร่างหนังสือราชการ|^ช่วยตรวจขั้นตอน วิธีการ และเงื่อนไขการจัดซื้อจัดจ้างภาครัฐ|^จัดทำร่างงบประมาณ$/i.test(value)) return true;
    return value.length <= 18 && CREATE_PATTERN.test(` ${value} `);
  }

  function meaningfulTopic(text) {
    const stripped = lower(text)
      .replace(/ช่วย|กรุณา|ร่าง|จัดทำ|ทำ|สร้าง|เขียน|เตรียม|วิเคราะห์|ตรวจ|โครงการ|อบรม|กิจกรรม|หนังสือราชการ|บันทึกข้อความ|tor|ขอบเขตงาน|จัดซื้อ|จัดจ้าง|พัสดุ|งบประมาณ|เบิกจ่าย|กฎหมาย|เรื่อง|เกี่ยวกับ|ให้|หน่อย/gi, ' ')
      .replace(/[^ก-๙a-z0-9]+/gi, ' ')
      .trim();
    return stripped.split(/\s+/).some(token => token.length >= 3 && !/^(พร้อม|ความครบถ้วน|ความเสี่ยง|สำคัญ|ภาครัฐ|ขั้นตอน|วิธีการ|เงื่อนไข)$/.test(token));
  }

  function fieldSatisfied(key, text) {
    const value = normalize(text);
    if (!value) return false;
    if (UNKNOWN_PATTERN.test(value)) return true;
    switch (key) {
      case 'item': return meaningfulTopic(value) && !/^(?:ช่วย)?\s*(?:ร่าง\s*)?tor(?:\s*หรือขอบเขตของงาน)?$/i.test(value);
      case 'topic': return meaningfulTopic(value);
      case 'purpose': return /(?:เพื่อ|วัตถุประสงค์|ต้องการ(?:นำไป)?ใช้|ใช้งาน|ขออนุมัติ|ขอความร่วมมือ|แจ้ง|หารือ|แก้ปัญหา|พัฒนา|ส่งเสริม|ป้องกัน|ตรวจ|วิเคราะห์|จัดทำ|ร่าง)/i.test(value) && value.length > 20;
      case 'budget': return /(?:\d[\d,]*(?:\.\d+)?\s*(?:บาท|ล้าน|แสน)|(?:งบ|วงเงิน)\s*(?:ประมาณ)?\s*[:=]?\s*\d)/i.test(value);
      case 'target': return /(?:กลุ่มเป้าหมาย|ผู้เข้าร่วม|ประชาชน|ผู้สูงอายุ|เด็ก|เยาวชน|นักเรียน|ข้าราชการ|เจ้าหน้าที่|บุคลากร|ชุมชน|อสม\.?|รพ\.?สต\.?|\d+\s*คน)/i.test(value);
      case 'recipient': return /(?:เรียน|ถึง|ผู้รับ|นายก|ปลัด|ผอ\.?|ผู้อำนวยการ|ผู้ว่า|อธิบดี|กรม|กระทรวง|อบจ\.?|อบต\.?|เทศบาล)/i.test(value);
      case 'facts': return value.length >= 45 || /(?:ข้อเท็จจริง|กรณี|เหตุการณ์|วันที่|เมื่อวันที่|จำนวน|สัญญา|คำสั่ง|เอกสาร)/i.test(value);
      case 'issue': return /(?:ได้ไหม|ได้หรือไม่|หรือไม่|ประเด็น|ข้อหารือ|ต้องการทราบ|วิเคราะห์|ตรวจสอบ|มีอำนาจ|ผิด|ถูกต้อง)/i.test(value);
      case 'yearOrg': return /(?:25\d{2}|20\d{2}|ปี(?:งบประมาณ)?\s*\d{2,4})/i.test(value) && /(?:อบจ\.?|อบต\.?|เทศบาล|องค์กรปกครองส่วนท้องถิ่น|อปท\.?|หน่วยงาน)/i.test(value);
      case 'sourceData': return /(?:รายรับ|รายจ่าย|งบเดิม|ข้อบัญญัติเดิม|ไฟล์|เอกสาร|ประมาณการ|ฐานข้อมูล)/i.test(value);
      case 'output': return /(?:ร่าง|จัดทำ|ทำ|สร้าง|เขียน|วิเคราะห์|ตรวจ|สรุป|วางแผน|ออกแบบ)/i.test(value) && value.length > 8;
      default: return true;
    }
  }

  function routeFor(text) {
    try {
      const core = window.GovPromptCore;
      if (typeof core?.createSharedContext !== 'function' || typeof core?.routeTransaction !== 'function') return null;
      const context = core.createSharedContext({ facts: text, desiredOutput: text });
      return core.routeTransaction(context);
    } catch { return null; }
  }

  function shouldGuide(text) {
    const value = normalize(text);
    if (!value) return false;
    if (isGenericRequest(value)) return true;
    if (!CREATE_PATTERN.test(` ${value} `)) return false;
    return value.length < 70;
  }

  function assessQuery(text, route = null, acknowledgedUnknown = []) {
    const value = normalize(text);
    const activeRoute = route || routeFor(value) || {};
    const intent = inferIntent(value, activeRoute);
    if (!shouldGuide(value)) return Object.freeze({ ready: true, intent, route: activeRoute, missingFields: Object.freeze([]), questions: Object.freeze([]) });
    const unknown = new Set((acknowledgedUnknown || []).map(String));
    const profile = PROFILES[intent] || PROFILES.general;
    const missing = profile.filter(item => !unknown.has(item.key) && !fieldSatisfied(item.key, value)).slice(0, MAX_QUESTIONS);
    return Object.freeze({
      ready: missing.length === 0,
      intent,
      route: activeRoute,
      missingFields: Object.freeze(missing.map(item => item.key)),
      questions: Object.freeze(missing.map(item => item.question))
    });
  }

  function install() {
    if (typeof document === 'undefined') return false;
    const form = document.getElementById('chatForm');
    const input = document.getElementById('promptInput');
    const conversation = document.getElementById('conversation');
    if (!form || !input || !conversation || form.dataset.guidedIntakeInstalled === VERSION) return false;
    form.dataset.guidedIntakeInstalled = VERSION;

    let pending = null;
    let bypass = false;

    function scrollLatest() { conversation.lastElementChild?.scrollIntoView?.({ behavior: 'smooth', block: 'end' }); }

    function appendQuestionCard(assessment, subject) {
      const copy = assessment.intent === 'procurement' && isTorRequest(subject) ? TOR_FIRST_SUCCESS_COPY : DEFAULT_COPY;
      const article = document.createElement('article');
      article.className = 'message assistant guided-intake-message';
      const mark = document.createElement('span');
      mark.className = 'assistant-mark'; mark.setAttribute('aria-hidden', 'true'); mark.textContent = 'กพ';
      const content = document.createElement('div'); content.className = 'assistant-content';
      const label = document.createElement('span'); label.className = 'route-label'; label.textContent = copy.label;
      const card = document.createElement('div'); card.className = 'answer-card';
      const section = document.createElement('section'); section.className = 'answer-section';
      const heading = document.createElement('h3'); heading.textContent = copy.heading;
      const intro = document.createElement('p');
      intro.textContent = copy.intro || `เพื่อไม่ให้ GP เดาข้อมูลในงาน “${normalize(subject).slice(0, 80)}” กรุณาตอบเฉพาะข้อมูลที่มีผลต่อผลลัพธ์`;
      const list = document.createElement('ol');
      assessment.questions.forEach(question => { const li = document.createElement('li'); li.textContent = question; list.append(li); });
      const note = document.createElement('p'); note.textContent = copy.note;
      const actions = document.createElement('div'); actions.className = 'answer-actions';
      const unknownButton = document.createElement('button'); unknownButton.type = 'button'; unknownButton.textContent = copy.unknown;
      unknownButton.addEventListener('click', () => {
        if (!pending) return;
        assessment.missingFields.forEach(field => pending.unknown.add(field));
        finalizePending();
      });
      actions.append(unknownButton);
      section.append(heading, intro, list, note, actions); card.append(section); content.append(label, card); article.append(mark, content); conversation.append(article); scrollLatest();
    }

    function combinedText() {
      if (!pending) return '';
      const parts = [pending.original];
      if (pending.answers.length) parts.push(`ข้อมูลเพิ่มเติมจากผู้ใช้:\n- ${pending.answers.join('\n- ')}`);
      if (pending.unknown.size) parts.push(`ข้อมูลที่ผู้ใช้ยังไม่ทราบหรือยังไม่กำหนด:\n- ${[...pending.unknown].join('\n- ')}`);
      return parts.join('\n\n');
    }

    function finalizePending() {
      if (!pending) return;
      const finalText = combinedText();
      pending = null;
      bypass = true;
      window.setTimeout(() => { bypass = false; }, 1200);
      input.value = finalText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      queueMicrotask(() => form.requestSubmit());
    }

    form.addEventListener('submit', event => {
      if (bypass) { bypass = false; return; }
      const text = normalize(input.value);
      if (!text) return;

      if (pending) {
        event.preventDefault(); event.stopImmediatePropagation();
        pending.answers.push(text);
        if (UNKNOWN_PATTERN.test(text) && text.length <= 120) pending.lastMissing.forEach(field => pending.unknown.add(field));
        input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true }));
        const assessment = assessQuery(combinedText(), null, [...pending.unknown]);
        if (assessment.ready || pending.rounds >= 2) { finalizePending(); return; }
        pending.rounds += 1; pending.lastMissing = assessment.missingFields;
        appendQuestionCard(assessment, pending.original);
        return;
      }

      const assessment = assessQuery(text);
      if (assessment.ready) return;
      event.preventDefault(); event.stopImmediatePropagation();
      pending = { original: text, answers: [], unknown: new Set(), rounds: 1, lastMissing: assessment.missingFields };
      input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true }));
      appendQuestionCard(assessment, text);
    }, true);

    document.getElementById('newChat')?.addEventListener('click', () => { pending = null; bypass = false; });
    return true;
  }

  const api = Object.freeze({ version: VERSION, inferIntent, isTorRequest, assessQuery, shouldGuide, install });
  window.GovPromptGuidedIntake = api;
  install();
})();