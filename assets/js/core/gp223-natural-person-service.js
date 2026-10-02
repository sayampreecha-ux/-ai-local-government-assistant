(() => {
  'use strict';

  const core = window.GovPromptCore = window.GovPromptCore || {};
  const authorityCandidates = Object.freeze([
    'ว 727 ลงวันที่ 22 กันยายน 2569',
    'มท 0808.2/ว 5418 ลงวันที่ 24 กันยายน 2569',
    'มท 0803.3/ว 5389 ลงวันที่ 23 กันยายน 2569',
    'มท 0808.2/ว 9636', 'ว 159'
  ]);
  const gates = Object.freeze([
    'Employment-like Risk Gate', 'Scope Integrity Gate', 'Authority Boundary Gate',
    'Deliverable Gate', 'Acceptance Gate', 'Five-Document Consistency Gate',
    'Contract Terms Gate', 'ว 727 / Authority Evidence Gate',
    'Legacy Citation / Supersession Check', 'Travel-and-Training Gate',
    'External-Person Training Gate', 'Travel Expense Gate'
  ]);

  function createGP223WorkflowPlan({ question, attachments = [], context = {} } = {}) {
    const source = [question, context.facts].filter(Boolean).join('\n');
    const expenseSource = /อบรม|training|เดินทาง|ประชุม|ไปปฏิบัติงาน/i.test(question) ? question : source;
    const expenseFacts = expenseSource.replace(/(?:ไม่ใช่|ไม่ได้|ไม่ต้อง|ไม่มี|ไม่เป็น)(?:การ|ไป|เข้า)?(?:ฝึก)?อบรม/g, '');
    const training = /อบรม|training/i.test(expenseFacts);
    const travel = /เดินทาง|ไปประชุม|ไปปฏิบัติงาน|ปฏิบัติงานต่างจังหวัด|ไปราชการ/.test(expenseFacts);
    const legacy = /ว\s*877/.test(source);
    const contract = /ค่าปรับ|หลักประกัน|สัญญา/.test(source);
    const accounting = /บัญชี|รายงานทางการเงิน/.test(source);
    const issues = ['applicable-authority'];
    if (training) issues.push('training-eligibility');
    if (travel && !training) issues.push('travel-expense');
    // A mixed itinerary must assess each activity independently.
    if (travel && training && /ประชุม|ปฏิบัติงาน/.test(expenseFacts)) issues.push('travel-expense');
    if (legacy) issues.push('legacy-supersession');
    if (contract) issues.push('contract-terms');
    return Object.freeze({
      workflowId: 'GP223', toolMode: 'ai-only', automaticLiveSearch: false,
      canDraft: true, canAnalyze: true, canChecklist: true,
      gates, authorityCandidates,
      // Metadata/filenames are never proof of the text, version or applicability.
      authorityStatus: 'UNVERIFIED',
      decisionLocks: Object.freeze(issues.map(issue => Object.freeze({ issue, status: 'UNVERIFIED', blocksDraft: false }))),
      expenseKind: training ? (issues.includes('travel-expense') ? 'mixed-separate-assessment' : 'training') : (travel ? 'travel' : 'none'),
      attachmentNames: Object.freeze(attachments.map(file => String(file?.name || '')).filter(Boolean)),
      accounting,
      destinationSearchRequested: core.requestsGP223DestinationSearch(question)
    });
  }

  function buildGP223PromptBlock(plan) {
    return [
      '=== SPECIALIZED WORKFLOW: จ้างเหมาบริการบุคคลธรรมดา / GP223 ===',
      'GP223_TOOL_MODE = AI_ONLY; AUTOMATIC_LIVE_SEARCH_GP223 = DISABLED',
      'Answer First: ทำ Draft / Analyze / Checklist ส่วนที่ข้อมูลรองรับทันที ใช้ [ระบุ...] เฉพาะข้อมูลที่ขาด ห้ามอ้างว่าร่างนี้ผ่านฐานอำนาจแล้ว',
      'Guided Intake: ใช้ช่องสนทนาหลักเท่านั้น ห้ามเปิด Modal/Form GP223 ไม่บังคับแนบไฟล์ อ่านข้อมูลและเอกสารก่อน ถามทีละประเด็นที่จำเป็น ห้ามถามซ้ำหรือถามเป็นชุดยาว',
      'เอกสารแนบ: ใช้เนื้อหาที่อ่านได้จริง หากมีเพียงรายการไฟล์และยังไม่ได้ส่งเนื้อหาไป AI ปลายทาง ห้ามอ้างว่าอ่านแล้ว ขอแนบใน AI ปลายทางเฉพาะเมื่อจำเป็นต่อข้อสรุป และทำร่างจากข้อมูลที่มีต่อ',
      'จำแนกลักษณะงานจากงานจริงและผลสำเร็จ ไม่ยึดตำแหน่งเพียงอย่างเดียว ครอบคลุมงานบัญชี ธุรการ คนขับรถ เครื่องจักร ประปา รายได้ นิติการ สาธารณภัย สอน สาธารณสุข รักษาความปลอดภัย ภารโรงและทำความสะอาด',
      'Employment-like Risk Gate: เวลางาน/จันทร์-ศุกร์/สถานที่/รายเดือน/บันทึกเวลา/อายุ/วุฒิ เป็น risk signal ตรวจร่วมกับ control/subordination (การควบคุมสั่งการ) วิธีทำงาน การลาแบบลูกจ้าง deliverable และ contract; ห้ามตัดสินจากมีเวลางานปัจจัยเดียว ให้ CONDITIONAL เมื่อเงื่อนไขยังไม่ครบ',
      'Scope Integrity Gate: งานต้องอยู่ในขอบเขตบริการที่จ้าง ตัดถ้อยคำ “งานอื่นตามที่ได้รับมอบหมายทุกประการ” ที่ไม่จำกัดขอบเขต และผูกปริมาณ ระยะเวลา ผลส่งมอบกับหลักฐาน',
      'Authority Boundary Gate: ผู้รับจ้างสนับสนุนงานได้ แต่ไม่อนุมัติ อนุญาต วินิจฉัย รับรอง สั่งจ่ายเงิน หรือใช้อำนาจรัฐแทนเจ้าหน้าที่ เว้นแต่มีฐานอำนาจยืนยัน',
      'Deliverable Gate: ขอบเขตงาน → ผลส่งมอบ → กำหนดส่ง → หลักฐาน → เกณฑ์ตรวจรับ → การจ่ายเงิน ต้องวัดได้และสอดคล้องกัน',
      'Acceptance Gate: ตรวจรับจากผลสำเร็จและหลักฐานตามสัญญา ไม่รับรองผลงานจากลงเวลาอย่างเดียว; กรณีงานไม่ครบ/ผิดพลาดให้ใช้เงื่อนไขแก้ไขและตรวจรับตามสัญญา ไม่แต่งเงื่อนไขหักเงิน',
      'Five-Document Consistency Gate: TOR ↔ สัญญา ↔ ผลส่งมอบ ↔ ตรวจรับ ↔ จ่ายเงิน ใช้ขอบเขต งวดงาน หลักฐานและเกณฑ์เดียวกัน',
      'Contract Terms Gate: ตรวจแบบสัญญาบุคคลธรรมดา ระยะเวลา ส่งมอบ ตรวจรับ จ่ายเงิน บอกเลิก หลักประกันและค่าปรับ; ค่าปรับ 0.10% หรือ “หลักประกัน: ไม่มี” ในร่างเดิมเป็น trigger ที่ต้องยืนยัน ไม่รับรองอัตราหรือข้อยกเว้นอัตโนมัติ',
      'Official Authority Evidence Gate / ว 727 / Authority Evidence Gate: ตรวจ evidence ที่มี ไม่บังคับค้นสด และไม่ถือรายการไฟล์/เลขหนังสือ/สรุปว่าได้ตรวจต้นฉบับแล้ว',
      ...plan.authorityCandidates.map(candidate => `Authority candidate/baseline: ${candidate} — UNVERIFIED จนกว่าจะตรวจต้นฉบับและการใช้บังคับได้; ไม่รับรองว่าล่าสุดหรือยังมีผลจากเลขหนังสือ`),
      'Applicable Authority Check: AUTHORITY → VERSION → TIME → FACT_MATCH → LATER_CHANGE → CONFLICT_TRANSITION จากหลักฐานที่มี แยกข้อมูลพอวิเคราะห์จากข้อมูลพอตัดสิน; การอ้างระเบียบไม่ได้สร้างสิทธิเบิกโดยตัวมันเอง ตรวจเอกสารต้นเรื่องและกฎปลายทางให้ตรงกัน',
      'Legacy Citation / Supersession Check: ว 877 เป็นฐานเดิมที่ต้องเทียบกับ ว 727; ตรวจแก้ไข/ยกเลิก/แทนที่และวันที่ใช้จากต้นฉบับ ห้ามฟันธงว่า ว 727 ยกเลิก ว 877 หรือคัดลอกฐานเดิมไปใช้จากเลขหนังสืออย่างเดียว ไม่มีต้นฉบับให้ UNVERIFIED',
      'Travel-and-Training Gate: แยก “เดินทางไปประชุม/ปฏิบัติงานตามภารกิจที่จ้าง” ออกจาก “ฝึกอบรม” ตามกิจกรรมจริง ไม่ตัดสินจากหัวข้อการประชุม และไม่ใช้หลักเดินทางไปราชการสร้างสิทธิอบรมอัตโนมัติ',
      'Travel Expense Gate: สำหรับไปประชุม/ปฏิบัติงาน ตรวจคำสั่ง/การอนุมัติ ภารกิจ สถานะบุคคล TOR/สัญญา ผู้รับผิดชอบค่าใช้จ่าย แหล่งเงิน การเบิกซ้ำและอัตราจากต้นฉบับที่ใช้จริง ห้ามแต่งอัตรา ห้ามเอาระเบียบหน่วยงานอื่นมาแทน มท. สำหรับ อปท. อัตโนมัติ',
      'External-Person Training Gate: สำหรับอบรม ตรวจว่าหลักเกณฑ์ครอบคลุมบุคคลภายนอก/ผู้รับจ้างหรือข้อยกเว้นใด จากต้นฉบับที่ใช้กับ อปท. พร้อมผู้อนุมัติ ผู้รับผิดชอบค่าใช้จ่ายและเอกสาร; ไม่อนุมานสิทธิจากแค่ได้รับมอบหมายให้เดินทาง',
      `ประเด็นปัจจุบัน: ${plan.expenseKind}; Decision Lock เฉพาะประเด็น: ${plan.decisionLocks.map(lock => lock.issue).join(', ')}`,
      'Decision Lock: UNVERIFIED/CONFLICT ห้ามฟันธงสิทธิ/ฐานอำนาจเฉพาะประเด็นที่ขาด; CONDITIONAL ระบุเงื่อนไข; ทบทวนสถานะรายประเด็นเมื่อมีต้นฉบับที่ตรงบุคคล วันที่และกรณีจริงครบ ไม่ lock งาน Draft/Analyze/Checklist ทั้งหมด',
      'ห้ามแต่งเลขหนังสือ กฎหมาย ข้อกฎหมาย อัตรา วันที่ ข้อเท็จจริง หรืออ้างว่าได้ค้น/เปิดเอกสารแล้วเมื่อยังไม่ได้ตรวจ',
      plan.destinationSearchRequested
        ? 'เจตนาผู้ใช้: ค้น/ตรวจสด — ให้ AI ปลายทางค้นผ่านความสามารถของแพลตฟอร์มเอง ยึดต้นฉบับทางการและรายงานสิ่งที่ตรวจจริง GovPrompt ไม่เรียก search backend; หากค้นไม่ได้ทำส่วนอื่นต่อพร้อม UNVERIFIED'
        : 'AI-only: ใช้ข้อมูลพิมพ์ เอกสารแนบและ context เท่านั้น ไม่สั่ง AI ปลายทางค้นเองอัตโนมัติ คำว่า “ล่าสุด/ยังมีผล” เพียงอย่างเดียวไม่ใช่คำสั่งค้น',
      'ผลลัพธ์ตามงานที่ขอ: ข้อเท็จจริง → จำแนกงาน → ความเสี่ยง → ร่าง/วิเคราะห์ → ตารางผลส่งมอบและตรวจรับ → checklist 5 เอกสาร → ประเด็นที่ยังต้องยืนยัน; ถ้าถามสิทธิเบิกไม่ต้องสร้าง TOR ทั้งฉบับโดยไม่จำเป็น',
      ...(plan.accounting ? [
        'แนวร่างงานบัญชี: สนับสนุนจัดทำทะเบียน/ข้อมูล/ชุดเอกสารและรายงานบัญชี ไม่ใช่อนุมัติบัญชี รับจ่ายเงินหรือใช้อำนาจเจ้าหน้าที่',
        'ตาราง TOR งานบัญชี: ชุดเอกสารเรียงตามรายการ [ระบุปริมาณ] → checklist ความครบถ้วน → กำหนดส่ง [ระบุงวด] → ไฟล์ทะเบียน/รายงานและหลักฐาน → ตรวจตรงเอกสารต้นทาง ไม่มีรายการซ้ำหรือขาด แก้ข้อผิดพลาด → จ่ายเมื่อคณะกรรมการตรวจรับตามสัญญา; ไม่คิดค่าจ้างจากการมาทำงานอย่างเดียว'
      ] : []),
      'Human Review: ร่างยังไม่ใช่การอนุมัติ ใช้จริงเมื่อผู้รับผิดชอบตรวจฐานอำนาจ แบบสัญญา และผู้มีอำนาจอนุมัติตามขั้นตอน',
      '=== END SPECIALIZED WORKFLOW ==='
    ].join('\n');
  }

  core.createGP223WorkflowPlan = createGP223WorkflowPlan;
  core.buildGP223PromptBlock = buildGP223PromptBlock;
  // Keep the complete handoff in tab memory; no raw prompt in a DOM attribute or storage.
  core.gp223HandoffPrompts = new WeakMap();
})();
