(() => {
  'use strict';

  const LEVELS = Object.freeze({
    L1: Object.freeze({ id: 'L1', label: 'Read', description: 'อ่าน ค้น ดึงข้อมูล และสรุป โดยไม่เปลี่ยนแปลงระบบจริง' }),
    L2: Object.freeze({ id: 'L2', label: 'Recommend', description: 'วิเคราะห์ ประเมินความเสี่ยง และเสนอทางเลือก โดยไม่ตัดสินแทนผู้มีอำนาจ' }),
    L3: Object.freeze({ id: 'L3', label: 'Draft', description: 'จัดทำร่าง เอกสาร หรือชุดข้อมูลเพื่อให้มนุษย์ตรวจและอนุมัติก่อนใช้จริง' }),
    L4: Object.freeze({ id: 'L4', label: 'Bounded Action', description: 'ดำเนินการเชิงระบบเฉพาะขอบเขตที่อนุมัติไว้ล่วงหน้าและย้อนกลับได้' })
  });

  const PROHIBITED_AUTONOMOUS_ACTIONS = Object.freeze([
    'อนุมัติหรือสั่งจ่ายเงินแทนผู้มีอำนาจ',
    'ลงนามหรือออกคำสั่งทางปกครองแทนเจ้าหน้าที่',
    'ตัดสินผลการจัดซื้อจัดจ้างหรือคัดเลือกผู้ชนะ',
    'ลงโทษทางวินัย แต่งตั้ง โอนย้าย หรือเลิกจ้างบุคคล',
    'ลงมติหรือใช้อำนาจของสภาท้องถิ่น',
    'เปิดเผยข้อมูลส่วนบุคคล ข้อมูลสุขภาพ หรือข้อมูลลับโดยอัตโนมัติ',
    'ส่งข้อมูลหรือเรียก API ที่มีผลผูกพันภายนอกโดยไม่มีการอนุมัติที่ตรวจสอบได้'
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFC').trim().toLocaleLowerCase();
  }

  function classifyAutonomy(request) {
    const text = normalize(request);
    if (!text) return Object.freeze({ level: 'L1', confidence: 0.4, reason: 'empty-or-unknown' });
    if (/(ส่งจริง|ยืนยันการส่ง|อนุมัติ|สั่งจ่าย|ลงนาม|ออกคำสั่ง|บันทึกเข้าระบบ|แก้ไขข้อมูลจริง|เรียก api|ดำเนินการแทน|เผยแพร่ทันที)/i.test(text)) {
      return Object.freeze({ level: 'L4', confidence: 0.95, reason: 'action-intent' });
    }
    if (/(ร่าง|เขียน|จัดทำ|ทำหนังสือ|ทำบันทึก|ทำ tor|ทำโครงการ|สร้าง checklist|ทำตาราง|ทำ csv|ทำ json|ทำโพสต์|ทำข่าว)/i.test(text)) {
      return Object.freeze({ level: 'L3', confidence: 0.9, reason: 'draft-intent' });
    }
    if (/(วิเคราะห์|ประเมิน|ตรวจ|พิจารณา|เสนอทางเลือก|แนะนำ|ความเสี่ยง|ควรทำอย่างไร|ได้ไหม|หรือไม่)/i.test(text)) {
      return Object.freeze({ level: 'L2', confidence: 0.85, reason: 'recommend-intent' });
    }
    return Object.freeze({ level: 'L1', confidence: 0.7, reason: 'read-intent' });
  }

  function evaluateAgentGovernance(request, options = {}) {
    const classified = classifyAutonomy(request);
    const requestedLevel = classified.level;
    const approved = options.humanApproved === true;
    const bounded = options.boundedAction === true;
    const reversible = options.reversible === true;
    const auditReady = options.auditReady === true;
    const legalAuthorityVerified = options.legalAuthorityVerified === true;

    const allowed = requestedLevel !== 'L4' || (approved && bounded && reversible && auditReady && legalAuthorityVerified);
    const effectiveLevel = allowed ? requestedLevel : 'L3';
    const blockers = [];
    if (requestedLevel === 'L4') {
      if (!approved) blockers.push('ต้องมี Human Approval ที่ตรวจสอบได้');
      if (!bounded) blockers.push('ต้องกำหนดขอบเขตการกระทำอย่างชัดเจน');
      if (!reversible) blockers.push('ต้องมีวิธี Pause/Reject/Revoke/Rollback');
      if (!auditReady) blockers.push('ต้องมี Audit Trail');
      if (!legalAuthorityVerified) blockers.push('ต้องยืนยันฐานอำนาจตามกฎหมายแยกจากสิทธิ์ทางเทคนิค');
    }

    return Object.freeze({
      requestedLevel,
      effectiveLevel,
      allowed,
      requiresHumanApproval: requestedLevel === 'L4',
      technicalPermissionIsLegalAuthority: false,
      blockers: Object.freeze(blockers),
      reason: classified.reason,
      confidence: classified.confidence
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.AGENT_AUTONOMY_LEVELS = LEVELS;
  window.GovPromptCore.PROHIBITED_AUTONOMOUS_ACTIONS = PROHIBITED_AUTONOMOUS_ACTIONS;
  window.GovPromptCore.classifyAutonomy = classifyAutonomy;
  window.GovPromptCore.evaluateAgentGovernance = evaluateAgentGovernance;
})();
