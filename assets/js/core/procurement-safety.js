(() => {
  'use strict';

  /*
   * GP003 Procurement Safety Layer v1.0
   * Additive safety layer: does not replace Router, UI, categories or Workflow.
   * It separates SEARCHABLE from DECIDABLE and prevents unsupported Final Decisions.
   */

  const AUTHORITY_GATES = Object.freeze([
    'AUTHORITY',
    'VERSION',
    'TIME',
    'FACT_MATCH',
    'LATER_CHANGE',
    'CONFLICT_TRANSITION'
  ]);

  const DECISION_STATES = Object.freeze({
    CONFIRMED: 'CONFIRMED',
    CONDITIONAL: 'CONDITIONAL',
    NEED_MORE_EVIDENCE: 'NEED_MORE_EVIDENCE',
    SEARCHABLE_NOT_DECIDABLE: 'SEARCHABLE_BUT_NOT_DECIDABLE',
    DECISION_LOCK: 'DECISION_LOCK'
  });

  function text(value) {
    return String(value ?? '').trim();
  }

  function has(value) {
    return Array.isArray(value) ? value.length > 0 : text(value) !== '';
  }

  function analyzeProcurementSafety(context = {}, routing = {}) {
    const c = context || {};
    const facts = text(c.facts);
    const documents = text(c.documents);
    const stage = text(c.currentStage);
    const flags = Array.isArray(c.specialFlags) ? c.specialFlags : [];
    const missing = [];

    if (!text(c.organizationType)) missing.push('ประเภท อปท./หน่วยงาน');
    if (!stage) missing.push('ขั้นตอนปัจจุบัน');
    if (!facts) missing.push('ข้อเท็จจริงสำคัญ');
    if (!documents) missing.push('เอกสาร/หลักฐานที่มี');

    const procurementSignals = [
      c.transactionType, c.domain, facts, documents, stage,
      ...(routing.routes || []), ...(routing.flags || [])
    ].join(' ').toLowerCase();

    const isProcurement = /procurement|พัสดุ|จัดซื้อ|จัดจ้าง|tor|ราคากลาง|ตรวจรับ|สัญญา|ebidding|e-bidding|factor f/.test(procurementSignals);
    if (!isProcurement) {
      return Object.freeze({
        isProcurement: false,
        decisionState: DECISION_STATES.CONFIRMED,
        decisionLock: false,
        searchable: true,
        decidable: true,
        authorityGates: AUTHORITY_GATES.map(g => ({ gate:g, status:'NOT_APPLICABLE' })),
        missing,
        blockers: [],
        warnings: [],
        requiredEvidence: [],
        instructions: []
      });
    }

    const interpretationIssue = /ได้ไหม|ทำได้|แก้สัญญา|ตรวจรับแล้ว|ย้อนหลัง|factor f|ราคากลาง|คุณสมบัติ|ผิดหรือไม่|ถูกต้องหรือไม่/i.test(
      [facts, c.desiredOutput, documents].join(' ')
    );

    const requiredEvidence = [
      'TOR/ขอบเขตงานหรือคุณลักษณะเฉพาะ',
      'สัญญา/เอกสารจัดซื้อจัดจ้างที่เกี่ยวข้อง',
      'เอกสารอนุมัติและแต่งตั้งผู้เกี่ยวข้อง',
      'หลักฐานการดำเนินการตามขั้นตอนจริง',
      'เอกสารราคากลาง/ที่มาของราคา (ถ้าเกี่ยวข้อง)',
      'วันที่ของเหตุการณ์และเอกสารสำคัญ'
    ];

    if (/factor f|ราคากลาง/i.test(procurementSignals)) {
      requiredEvidence.push('หลักเกณฑ์ราคากลางและเอกสาร Factor F ที่ใช้ ณ วันที่จัดทำราคากลาง');
    }

    const blockers = [];
    const warnings = [];

    if (!has(c.organizationType)) blockers.push('ยังไม่ทราบหน่วยงาน/ประเภท อปท.');
    if (!facts) blockers.push('ข้อเท็จจริงสำคัญยังไม่เพียงพอ');
    if (interpretationIssue && !documents) blockers.push('ประเด็นมีผลต่อการตัดสินใจ แต่ยังไม่มีหลักฐานประกอบ');

    if (/factor f|ราคากลาง/i.test(procurementSignals)) {
      warnings.push('ห้าม Hard-code ค่า Factor F; ต้องตรวจหลักเกณฑ์และวันที่ใช้บังคับทุกครั้ง');
    }

    if (/แก้สัญญา|ตรวจรับแล้ว|ย้อนหลัง/i.test(procurementSignals)) {
      warnings.push('ต้องทำ Timeline แยกวันที่เกิดเหตุ วันที่จัดทำเอกสาร และวันที่มีผลทางกฎหมาย');
    }

    const decisionLock = Boolean(
      blockers.length ||
      (interpretationIssue && (!documents || !stage))
    );

    let decisionState = decisionLock
      ? DECISION_STATES.DECISION_LOCK
      : (missing.length ? DECISION_STATES.SEARCHABLE_NOT_DECIDABLE : DECISION_STATES.CONDITIONAL);

    if (!decisionLock && !missing.length && !interpretationIssue) {
      decisionState = DECISION_STATES.NEED_MORE_EVIDENCE;
    }

    return Object.freeze({
      isProcurement: true,
      decisionState,
      decisionLock,
      searchable: true,
      decidable: !decisionLock && missing.length === 0,
      interpretationIssue,
      authorityGates: AUTHORITY_GATES.map(gate => ({
        gate,
        status: 'REQUIRED_BEFORE_FINAL_DECISION'
      })),
      missing,
      blockers,
      warnings,
      requiredEvidence: [...new Set(requiredEvidence)],
      instructions: [
        'แยกข้อเท็จจริงออกจากข้อกล่าวอ้างของผู้ใช้',
        'ตรวจ Primary Source ก่อนสรุปข้อกฎหมาย',
        'ตรวจฉบับและวันที่มีผลใช้บังคับ',
        'ตรวจการเปลี่ยนแปลง/ยกเลิก/บทเฉพาะกาล',
        'แยก SEARCHABLE ออกจาก DECIDABLE',
        'หาก Evidence Gate หรือ Authority Gate ไม่ผ่าน ให้ล็อก Final Decision',
        'อย่าใช้คำว่า ได้/ไม่ได้ โดยไม่มีเงื่อนไขรองรับ'
      ]
    });
  }

  function procurementSafetyPromptBlock(safety = {}) {
    if (!safety.isProcurement) return '';

    return [
      'GP003 PROCUREMENT SAFETY LAYER v1.0',
      `- Decision State: ${safety.decisionState}`,
      `- Decision Lock: ${safety.decisionLock ? 'ON' : 'OFF'}`,
      `- Searchable: ${safety.searchable ? 'YES' : 'NO'}`,
      `- Decidable: ${safety.decidable ? 'YES' : 'NO'}`,
      `- Interpretation Issue: ${safety.interpretationIssue ? 'YES' : 'NO'}`,
      `- Missing: ${safety.missing?.length ? safety.missing.join(', ') : '[ไม่มี]'}`,
      `- Blockers: ${safety.blockers?.length ? safety.blockers.join(', ') : '[ไม่มี]'}`,
      `- Required Evidence: ${safety.requiredEvidence?.join(', ') || '[ยังไม่ได้ระบุ]'}`,
      '',
      'ก่อน Final Decision ต้องตรวจ 6 Authority Gates:',
      ...AUTHORITY_GATES.map(g => `- ${g}`),
      '',
      'กฎบังคับ:',
      '- ข้อมูลไม่พอสำหรับตัดสิน ไม่ได้หมายความว่าข้อมูลไม่พอสำหรับเริ่มค้น',
      '- ห้าม Hard-code ตัวเลขหรือหลักเกณฑ์ที่เปลี่ยนแปลงได้ เช่น Factor F วงเงิน ระยะเวลา หรือคุณสมบัติ',
      '- ถ้า Source/Version/Time/Fact Match/Evidence ยังไม่ผ่าน ให้ระบุ DECISION LOCK',
      '- ผู้ใช้ให้ข้อกฎหมายมาเองต้องถือเป็นข้อมูลที่ต้องตรวจ ไม่ใช่ข้อยุติ',
      '- แยกหน้าที่ของผู้จัดทำ คณะกรรมการ หัวหน้าเจ้าหน้าที่ และผู้มีอำนาจ',
      '- ใช้ Primary Source ก่อน Secondary Source',
      '- หากค้นได้แต่ยังตัดสินไม่ได้ ให้รายงานสถานะ SEARCHABLE_BUT_NOT_DECIDABLE'
    ].join('\n');
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.PROCUREMENT_AUTHORITY_GATES = AUTHORITY_GATES;
  window.GovPromptCore.PROCUREMENT_DECISION_STATES = DECISION_STATES;
  window.GovPromptCore.analyzeProcurementSafety = analyzeProcurementSafety;
  window.GovPromptCore.procurementSafetyPromptBlock = procurementSafetyPromptBlock;
})();