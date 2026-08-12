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

  const ACTION_INTENT = /(ส่ง(?:หนังสือ|ข้อมูล|ผล|จริง)|ยืนยันการส่ง|ยืนยันผล|ยืนยันรายการจ่ายเงิน|อนุมัติ|สั่งจ่าย|ลงนาม|ออก(?:หนังสือ)?คำสั่ง|บันทึก.*เข้าระบบ|แก้ไขข้อมูล(?:ทะเบียน)?.*จริง|เรียก\s*api|ดำเนินการแทน|เผยแพร่.*(?:ทันที|จริง)|ตัดสิน(?:ผล|ผู้ชนะ)|เลือกผู้ชนะ|ลงโทษ|แต่งตั้ง|โอนย้าย|เลิกจ้าง|ลงมติ|เปิดเผยข้อมูล|ข้ามขั้นอนุมัติ)/i;

  const RESERVED_AUTHORITY = /(อนุมัติ(?:และ)?สั่งจ่าย|สั่งจ่ายเงิน.*แทนผู้มีอำนาจ|ลงนาม.*แทน|ออกคำสั่งทางปกครอง.*แทน|ตัดสินผลการจัดซื้อจัดจ้าง|เลือกผู้ชนะ(?:\s*e-bidding)?|ลงโทษทางวินัย|แต่งตั้งบุคคล.*เข้าตำแหน่ง|โอนย้ายข้าราชการ|เลิกจ้างพนักงาน|เลิกจ้างบุคคล|ลงมติแทน|เปิดเผยข้อมูลสุขภาพ|ส่งข้อมูลส่วนบุคคล.*ภายนอก|ส่งข้อมูลลับ.*ภายนอก|เผยแพร่รายชื่อ.*เลขบัตรประชาชน)/i;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').trim().toLocaleLowerCase();
  }

  function classifyAutonomy(request) {
    const text = normalize(request);
    if (!text) return Object.freeze({ level: 'L1', confidence: 0.4, reason: 'empty-or-unknown' });
    if (ACTION_INTENT.test(text)) {
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
    const text = normalize(request);
    const classified = classifyAutonomy(text);
    const requestedLevel = classified.level;
    const approved = options.humanApproved === true;
    const bounded = options.boundedAction === true;
    const reversible = options.reversible === true;
    const auditReady = options.auditReady === true;
    const legalAuthorityVerified = options.legalAuthorityVerified === true;
    const reservedAuthority = RESERVED_AUTHORITY.test(text);

    const governanceReady = approved && bounded && reversible && auditReady && legalAuthorityVerified;
    const allowed = requestedLevel !== 'L4' || (!reservedAuthority && governanceReady);
    const effectiveLevel = allowed ? requestedLevel : 'L3';
    const blockers = [];

    if (requestedLevel === 'L4') {
      if (reservedAuthority) blockers.push('เป็นการใช้อำนาจที่สงวนไว้สำหรับมนุษย์/ผู้มีอำนาจ — AI ทำได้เพียงช่วยร่างหรือเตรียมข้อมูล');
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
      reservedAuthority,
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
