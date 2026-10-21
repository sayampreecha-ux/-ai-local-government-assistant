(() => {
  'use strict';

  const OUTPUTS = Object.freeze({
    'construction-estimate': Object.freeze({ label: 'ตารางประมาณราคา ปร.4/ปร.5 และรายงานตรวจสอบ', format: 'engineering-estimate', instructions: Object.freeze([
      'จัดทำ BOQ/ปร.4/ปร.5 จากหลักฐานที่อ่านได้ แสดงหน่วย สูตร และไฟล์/หน้า/เลขแบบ ห้ามเดาข้อมูลที่ขาด',
      'แสดงตาราง A ตรวจปริมาณและผลต่าง ตาราง B สูตรรวม ปร.4 ตาราง C เปรียบเทียบ Factor F และ ปร.5 และตาราง D ข้อจำกัดและ Human Review',
      'แยกการตรวจเลขจากการรับรองอัตราราชการ และให้วิศวกร/ผู้มีอำนาจตรวจรับรองก่อนใช้จริง'
    ]) }),
    official_document: Object.freeze({ label: 'หนังสือราชการ/เอกสารพร้อมใช้', format: 'official-document', instructions: Object.freeze([
      'ร่างฉบับพร้อมใช้ก่อน โดยใช้ [ระบุ...] เฉพาะข้อมูลสำคัญที่ยังขาด',
      'คงรูปแบบและถ้อยคำราชการที่เหมาะสมกับประเภทเอกสาร',
      'ปรับความละเอียดตามประเภทและความเสี่ยงของหนังสือ: หนังสือทั่วไปให้กระชับ แต่งานชี้แจงข้อทักท้วง ป.ป.ช./สตง. หรือหนังสือหารือที่ซับซ้อนต้องตอบครบทุกประเด็น พร้อมเรื่องเดิม ลำดับข้อเท็จจริง หลักฐาน ข้อกฎหมายที่ตรวจยืนยันได้ ข้อพิจารณา และข้อเสนอเท่าที่เหมาะกับประเภทหนังสือ; ไม่บังคับห้าหัวข้อในหนังสือภายนอก ไม่ยืดเนื้อหาเพื่อความยาว และไม่ตัดสาระเพื่อความกระชับ',
      'ห้ามแต่งเลขหนังสือ วันที่ ชื่อบุคคล หรือฐานกฎหมายที่ผู้ใช้ไม่ได้ให้',
      'ถ้าข้อมูลยังไม่ครบแต่ยังร่างได้ ให้ส่งร่างฉบับใช้งานได้ก่อน แล้วค่อยระบุเฉพาะช่องว่างที่มีผลต่อการลงนามหรือใช้จริง'
    ]) }),
    meeting_minutes: Object.freeze({ label: 'ร่างรายงานการประชุมพร้อมตรวจ', format: 'meeting-minutes', instructions: Object.freeze([
      'Answer First: จัดทำร่างรายงานการประชุมจากข้อมูลที่มีทันที ใช้ [ระบุ...] หรือ [ต้องตรวจสอบ] เฉพาะจุดที่หลักฐานยังไม่พอ',
      'แยก Working Transcript/หลักฐานการพูด ออกจาก Official-style Meeting Minutes; รายงานทางการให้สรุปสาระสำคัญ ไม่คัด verbatim ทั้งหมด',
      'ห้ามเดาชื่อผู้พูด วัน เวลา ญัตติ มติ หรือคะแนนเสียง; ผู้พูดที่ระบุไม่ได้ให้ใช้สถานะ UNIDENTIFIED หรือคำกลางที่ไม่ระบุตัวบุคคล',
      'มติแต่ละรายการต้องระบุสถานะ VERIFIED, PARTIAL หรือ UNVERIFIED เฉพาะชั้น Working Transcript/Review Evidence; ห้ามแสดง metadata นี้ในรายงานฉบับสะอาด เว้นแต่ผู้ใช้ร้องขอ และห้ามเติมจำนวนคะแนนเสียงถ้าต้นฉบับไม่มี',
      'รักษา trace กลับสู่ transcript/ช่วงเวลา/ข้อความต้นทางเท่าที่ข้อมูลรองรับ และใช้หลัก data minimization'
    ]) }),
    executive_summary: Object.freeze({ label: 'สรุปผู้บริหาร', format: 'executive-summary', instructions: Object.freeze([
      'สรุป Answer First ไม่เกินหนึ่งหน้าหากผู้ใช้ไม่ได้กำหนดความยาว',
      'แยกสาระสำคัญ ตัวเลข/ผลกระทบ ความเสี่ยง และข้อเสนอเพื่อการตัดสินใจ',
      'ถ้ามีงานต่อเนื่อง ให้สรุป Action Items ผู้รับผิดชอบ และกำหนดเวลาเท่าที่มีข้อมูล'
    ]) }),
    table: Object.freeze({ label: 'ตาราง', format: 'table', instructions: Object.freeze([
      'จัดข้อมูลเป็นตารางที่อ่านง่ายและใช้หัวคอลัมน์สั้นชัดเจน',
      'ห้ามเติมค่าที่ไม่มีในข้อมูลต้นทาง ให้ใช้ “ไม่ระบุ” เมื่อจำเป็น',
      'ถ้ามีข้อมูลจำนวนเงิน วันที่ หรือสถานะ ให้จัดรูปแบบให้สม่ำเสมอ'
    ]) }),
    csv: Object.freeze({ label: 'CSV', format: 'csv', instructions: Object.freeze([
      'ส่งออกเป็น CSV ที่มี header ชัดเจนและหนึ่งระเบียนต่อหนึ่งบรรทัด',
      'คงค่าต้นฉบับและ escape เครื่องหมายคำพูด/คอมมาตามมาตรฐาน CSV',
      'ไม่เพิ่มคอลัมน์ที่ผู้ใช้ไม่ได้ขอ เว้นแต่จำเป็นต่อความเข้าใจ'
    ]) }),
    json: Object.freeze({ label: 'JSON', format: 'json', instructions: Object.freeze([
      'ส่งออกเป็น JSON ที่ parse ได้จริง ไม่มีข้อความอธิบายนอก JSON หากผู้ใช้ขอ JSON โดยตรง',
      'ใช้ key ที่สื่อความหมายและโครงสร้างคงที่',
      'ค่าที่ไม่มีข้อมูลให้ใช้ null แทนการเดา'
    ]) }),
    checklist: Object.freeze({ label: 'Checklist/SOP', format: 'checklist', instructions: Object.freeze([
      'เรียงขั้นตอนตามลำดับปฏิบัติจริง',
      'ระบุผู้รับผิดชอบ เอกสาร/หลักฐาน และจุดตรวจเมื่อข้อมูลรองรับ',
      'แยก Must-have ออกจากข้อแนะนำเมื่อเกี่ยวข้อง'
    ]) }),
    comparison: Object.freeze({ label: 'ตารางเปรียบเทียบ', format: 'comparison', instructions: Object.freeze([
      'เปรียบเทียบประเด็นเดียวกันแบบแถวต่อแถว',
      'แยกความเหมือน ความต่าง ผลกระทบ และข้อเสนอแนะ',
      'ห้ามสรุปว่าฉบับใดถูกต้องกว่าโดยไม่มีหลักฐานรองรับ'
    ]) }),
    analysis: Object.freeze({ label: 'บทวิเคราะห์', format: 'analysis', instructions: Object.freeze([
      'ตอบข้อสรุปที่ใช้ตัดสินใจได้ก่อน แล้วจึงให้เหตุผล',
      'แยกข้อเท็จจริง ประเด็นวิเคราะห์ ความเสี่ยง และข้อเสนอแนะ',
      'สำหรับข้อกฎหมาย/การเงิน/พัสดุ ให้แยกสิ่งที่ยืนยันแล้วกับสิ่งที่ต้องตรวจสอบเพิ่ม',
      'ถ้าเป็นการเงินหรือเบิกจ่าย ให้ขึ้นต้นด้วย “เบิกได้ / เบิกไม่ได้ / มีเงื่อนไข / ยังยืนยันไม่ได้” ตามหลักฐาน แล้วสรุปฐานอำนาจ เงื่อนไข เอกสารประกอบ และจุดที่ต้องอนุมัติหรือใช้ดุลพินิจ',
      'ถ้าเป็นข้อกฎหมาย ให้ขึ้นต้นด้วย “ทำได้ / ทำไม่ได้ / ยังฟันธงไม่ได้” ตามหลักฐาน แล้วสรุปฐานอำนาจ ฉบับที่ใช้กับบุคคลและช่วงเวลาเกิดเหตุ พร้อมฉบับปัจจุบันประกอบ เงื่อนไข และความเสี่ยง',
      'ถ้าเป็นพัสดุหรือจัดซื้อจัดจ้าง ให้ขึ้นต้นด้วย “ดำเนินการได้ / มีเงื่อนไข / มีความเสี่ยง” แล้วตรวจวิธีการ คุณสมบัติ การแข่งขัน การตรวจรับ เอกสาร และจุดอนุมัติที่สำคัญ'
    ]) }),
    project: Object.freeze({ label: 'โครงการพร้อมใช้', format: 'project', instructions: Object.freeze([
      'จัดโครงหลักการและเหตุผล วัตถุประสงค์ กลุ่มเป้าหมาย วิธีดำเนินการ งบประมาณ ตัวชี้วัด และผลที่คาดว่าจะได้รับ',
      'ใช้ [ระบุ...] เฉพาะจุดสำคัญที่ยังขาด',
      'ตรวจความสัมพันธ์ระหว่างปัญหา วัตถุประสงค์ กิจกรรม ตัวชี้วัด และงบประมาณ',
      'ถ้าโครงการเกี่ยวข้องกับสุขภาพ การศึกษา หรือภารกิจเฉพาะ ให้ตรวจฐานอำนาจ แหล่งเงิน กลุ่มเป้าหมาย และข้อจำกัดของภารกิจก่อนเสนอใช้งานจริง'
    ]) }),
    tor: Object.freeze({ label: 'TOR/ขอบเขตของงาน', format: 'tor', instructions: Object.freeze([
      'จัด TOR ให้ตรวจรับได้จริงและใช้เกณฑ์วัดผลชัดเจน',
      'แยกคุณลักษณะ/ขอบเขตงาน ระยะเวลา ส่งมอบ ตรวจรับ และเงื่อนไขสำคัญ',
      'ชี้จุดเสี่ยงล็อกสเปกหรือจำกัดการแข่งขันเมื่อพบ',
      'ตรวจให้เกณฑ์ตรวจรับวัดได้จริง ไม่ใช้ถ้อยคำกว้างที่ตรวจพิสูจน์ไม่ได้ และหลีกเลี่ยงการระบุยี่ห้อหรือเงื่อนไขที่จำกัดการแข่งขันโดยไม่มีเหตุผลรองรับ',
      'ถ้ายังยืนยันมาตรฐาน สเปก ราคากลาง หรือกฎที่เป็นปัจจุบันไม่ได้ ให้แยกเป็นรายการที่ต้องตรวจเพิ่มก่อนนำ TOR ไปใช้จริง'
    ]) }),
    public_content: Object.freeze({ label: 'ข่าว/โพสต์ประชาสัมพันธ์', format: 'public-content', instructions: Object.freeze([
      'เขียนให้กระชับ อ่านง่าย และพร้อมเผยแพร่',
      'ตรวจชื่อ ตัวเลข วันที่ และข้อมูลส่วนบุคคลก่อนเผยแพร่',
      'ถ้าผู้ใช้ขอโพสต์สั้น ให้เน้นสารสำคัญและ CTA เดียว'
    ]) }),
    prompt: Object.freeze({ label: 'Prompt พร้อมใช้', format: 'prompt', instructions: Object.freeze([
      'เขียน Prompt ที่มี Role, Task, Context, Constraints และ Output ชัดเจน',
      'ใช้ภาษาที่ผู้ใช้คัดลอกไปใช้งานต่อได้ทันที',
      'หลีกเลี่ยงคำสั่งให้ AI สมมติข้อเท็จจริงหรือแหล่งอ้างอิง'
    ]) }),
    default: Object.freeze({ label: 'คำตอบพร้อมใช้', format: 'answer-first', instructions: Object.freeze([
      'ตอบสิ่งที่ผู้ใช้ต้องใช้ตัดสินใจหรือทำงานก่อน',
      'จัดโครงสร้างให้อ่านง่ายและไม่ถามข้อมูลจุกจิกก่อนให้คำตอบเบื้องต้น',
      'เสนอผลลัพธ์พร้อมใช้เมื่อสามารถทำได้จากข้อมูลที่มี'
    ]) })
  });

  const EXPLICIT_DOCUMENT_PREFIXES = Object.freeze([
    'ทำหนังสือ', 'ร่างหนังสือ', 'เขียนหนังสือ', 'จัดทำหนังสือ',
    'ช่วยทำหนังสือ', 'ช่วยร่างหนังสือ', 'ช่วยเขียนหนังสือ', 'ช่วยจัดทำหนังสือ'
  ]);
  const EXPLICIT_PROJECT_PREFIXES = Object.freeze([
    'ทำโครงการ', 'ร่างโครงการ', 'เขียนโครงการ', 'จัดทำโครงการ', 'ทำโครการ', 'ร่างโครการ', 'เขียนโครการ', 'จัดทำโครการ',
    'ช่วยทำโครงการ', 'ช่วยร่างโครงการ', 'ช่วยเขียนโครงการ', 'ช่วยจัดทำโครงการ'
  ]);

  const RULES = Object.freeze([
    { id: 'meeting_minutes', score: 120, patterns: [/(?:ทำ|จัดทำ|ร่าง).{0,18}รายงาน(?:การ)?ประชุม/, /(?:^|\s)สรุป(?:การ)?ประชุม(?:\s|$)/, /ถอด(?:เสียง)?ประชุม|จัดรายงาน(?:การ)?ประชุม|ทำรายงานจากไฟล์เสียง/i, /(?:ไฟล์เสียง|เสียง).{0,18}ประชุม.{0,24}(?:ทำรายงาน|สรุป|ถอด)|(?:ทำรายงาน|สรุป|ถอด).{0,24}(?:ไฟล์เสียง|เสียง).{0,18}ประชุม/i] },
    { id: 'table', score: 108, patterns: [/เป็นตาราง/, /ทำตาราง/, /จัดตาราง/, /สกัด.{0,18}ตาราง/] },
    { id: 'executive_summary', score: 105, patterns: [/สรุป.{0,70}(?:รายงาน|ข้อเสนอ).{0,30}เสนอผู้บริหาร/, /สรุปปัญหา.{0,70}เสนอผู้บริหาร/] },
    { id: 'analysis', score: 101, patterns: [/(?:มีอำนาจ|ชอบด้วยกฎหมาย|ฐานอำนาจ).{0,55}(?:ได้ไหม|ได้หรือไม่|หรือไม่)/, /(?:ได้ไหม|ได้หรือไม่|หรือไม่).{0,35}(?:มีอำนาจ|ชอบด้วยกฎหมาย|ฐานอำนาจ)/] },
    { id: 'csv', score: 100, patterns: [/\bcsv\b/i, /ไฟล์\s*csv/i] },
    { id: 'json', score: 100, patterns: [/\bjson\b/i, /โครงสร้างข้อมูล/i] },
    { id: 'official_document', score: 99, patterns: [/(?:ร่าง|ทำ|เขียน|จัดทำ).{0,20}(?:หนังสือ|บันทึกข้อความ|บันทึก|คำสั่ง|ประกาศ).{0,45}ประชาสัมพันธ์/] },
    { id: 'comparison', score: 98, patterns: [/เปรียบเทียบ/, /เทียบ(?:เอกสาร|ข้อดี|ข้อเสีย|ก่อน|หลัง)/] },
    { id: 'checklist', score: 97, patterns: [/checklist/i, /เช็กลิสต์/i, /sop/i, /ขั้นตอนการทำงาน/, /ลำดับขั้นตอน/] },
    { id: 'executive_summary', score: 96, patterns: [/สรุปผู้บริหาร/, /executive\s*(?:summary|brief)/i, /สรุป.{0,16}(?:เสนอ|ให้)ผู้บริหาร/, /ย่อ.{0,16}(?:1\s*หน้า|หนึ่งหน้า)/, /briefing.{0,25}(?:ผู้บริหาร|ประชุม)/i] },
    { id: 'tor', score: 94, patterns: [/\btor\b/i, /ขอบเขต(?:ของ)?งาน/, /ร่าง.{0,12}ทีโออาร์/] },
    { id: 'project', score: 93, patterns: [/(?:ร่าง|เขียน|ทำ|จัดทำ)\s*(?:โครงการ|โครการ)/] },
    { id: 'official_document', score: 92, patterns: [/ร่าง.{0,18}(?:หนังสือ|บันทึกข้อความ|บันทึก|คำสั่ง|ประกาศ)/, /ทำหนังสือ/, /เขียนหนังสือ/, /หนังสือราชการ/] },
    { id: 'public_content', score: 91, patterns: [/โพสต์(?:facebook|เฟซบุ๊ก)?/i, /ข่าวประชาสัมพันธ์/, /ประชาสัมพันธ์/, /แคปชัน/, /อินโฟกราฟิก/] },
    { id: 'prompt', score: 90, patterns: [/\bprompt\b/i, /พรอมต์/, /คำสั่ง\s*ai/i, /สูตรคำสั่ง/] },
    { id: 'analysis', score: 70, patterns: [/วิเคราะห์/, /ตรวจ(?:สอบ|ทาน|ความเสี่ยง)/, /ได้ไหม/, /ได้หรือไม่/, /ทำอย่างไร/, /ควรทำ/, /มีอำนาจ/, /ต้องพิจารณา/, /ต้องมี/, /ต้องใช้/, /ต้องดำเนิน/, /ต่างกันอย่างไร/, /มีผล/, /ความเสี่ยง/, /ควรตรวจ/, /ควรประเมิน/] }
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  }

  function inferExplicitPrefix(source) {
    const compact = source.replace(/\s+/g, '');
    if (EXPLICIT_DOCUMENT_PREFIXES.some(prefix => compact.startsWith(prefix))) return 'official_document';
    if (EXPLICIT_PROJECT_PREFIXES.some(prefix => compact.startsWith(prefix))) return 'project';
    if (/^โครงการ(?:สถานีอนามัย|รพ\\.?สต\\.?|รพสต|สอน\\.)/i.test(compact)) return 'project';
    return '';
  }

  function inferFromModule(moduleId) {
    if (moduleId === 'GP001') return 'official_document';
    if (moduleId === 'GP011') return 'executive_summary';
    if (moduleId === 'GP012') return 'public_content';
    if (['GP002', 'GP003', 'GP004', 'GP005', 'GP006', 'GP007', 'GP008', 'GP009', 'GP010', 'GP013'].includes(moduleId)) return 'analysis';
    return 'default';
  }

  function routeOutput(input, route = null, context = null) {
    const source = normalize([
      input,
      context?.desiredOutput,
      context?.facts
    ].filter(Boolean).join(' '));

    // Explicit correspondence drafting takes precedence over subject-matter
    // engineering output. Do not infer this from 'หนังสือ' alone.
    if (/^(?:กรุณา|โปรด|ช่วย)?\s*(?:ร่าง|เขียน|จัดทำ|ทำ)\s*(?:หนังสือ(?:ตอบ|หารือ|ชี้แจง|แจ้ง)?|บันทึกข้อความ|คำชี้แจง(?:เป็นหนังสือ)?)/i.test(normalize(input))) {
      return Object.freeze({ ...OUTPUTS.official_document, id: 'official_document', confidence: 0.99, reason: 'explicit-correspondence-draft' });
    }

    if (/^(?:ช่วย)?(?:ร่าง|จัดทำ|ทำ)\s*(?:ระเบียบ)?วาระ(?:การ)?ประชุมสภา/i.test(normalize(input))) {
      return Object.freeze({ id: 'council-agenda', label: 'ร่างระเบียบวาระประชุมสภาท้องถิ่น', format: 'council-agenda', confidence: 1,
        instructions: Object.freeze(['จัดทำร่างระเบียบวาระประชุมสภา แยกหัวข้อวาระและเรื่องเสนอ ใช้ [ระบุ...] สำหรับวันเวลา สถานที่ และข้อมูลที่ยังไม่มี ห้ามแต่งญัตติหรือมติ', 'ตรวจข้อกำหนดการประชุมและเอกสารประกอบจากต้นฉบับที่ใช้บังคับก่อนใช้จริง คง Human Review']) });
    }
    const engineeringPlan = window.GovPromptCore?.ENGINEERING_WORKFLOWS?.plan(input, context || {});
    if (engineeringPlan) {
      const typed = window.GovPromptCore.ENGINEERING_WORKFLOWS.output(engineeringPlan);
      if (engineeringPlan.estimationRequested && !engineeringPlan.primaryDraft && !engineeringPlan.publicityRequested && !engineeringPlan.documentRequested && !engineeringPlan.tasks.some(t=>t.id==='T11') && window.GovPromptCore.isEngineeringEstimateIntent?.(input)) {
        return Object.freeze({...OUTPUTS['construction-estimate'],id:'construction-estimate',confidence:1,reason:'construction-estimate-evidence-first'});
      }
      return typed;
    }

    const explicitPrefix = inferExplicitPrefix(source);
    if (explicitPrefix) {
      const definition = OUTPUTS[explicitPrefix] || OUTPUTS.default;
      return Object.freeze({
        id: explicitPrefix,
        label: definition.label,
        format: definition.format,
        confidence: 0.99,
        reason: 'explicit-prefix-intent',
        instructions: definition.instructions,
        matched: Object.freeze([])
      });
    }

    let best = null;
    for (const rule of RULES) {
      const matched = rule.patterns.filter(pattern => pattern.test(source));
      if (!matched.length) continue;
      const candidate = { id: rule.id, score: rule.score, matched: matched.map(pattern => pattern.source) };
      if (!best || candidate.score > best.score) best = candidate;
    }

    const engineering = window.GovPromptCore?.isEngineeringEstimateIntent?.(input);
    const constructionOutput = engineering && (!best || best.id === 'analysis');
    const id = constructionOutput ? 'construction-estimate' : (best?.id || inferFromModule(route?.moduleId));
    const definition = OUTPUTS[id] || OUTPUTS.default;
    return Object.freeze({
      id,
      label: definition.label,
      format: definition.format,
      confidence: best ? Math.min(0.99, 0.74 + best.score / 500) : 0.62,
      reason: constructionOutput ? 'construction-estimate-evidence-first' : (best ? 'explicit-output-intent' : 'module-default'),
      instructions: definition.instructions,
      matched: Object.freeze(best?.matched || [])
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.OUTPUT_DEFINITIONS = OUTPUTS;
  window.GovPromptCore.routeOutput = routeOutput;
})();
