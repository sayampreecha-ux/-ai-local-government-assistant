(() => {
  'use strict';

  const REQUIRED_GATES = Object.freeze([
    'authority',
    'legal-basis',
    'plan-budget',
    'decision-authority',
    'evidence',
    'pdpa',
    'risk',
    'audit-trail'
  ]);

  function evaluateQuality(context = {}, routing = {}) {
    const warnings = [];
    const blockers = [];

    if (!context.organizationType) blockers.push('ยังไม่ทราบประเภท อปท./หน่วยงาน');
    if (!context.currentStage) warnings.push('ยังไม่ทราบขั้นตอนปัจจุบันของเรื่อง');
    if (!context.facts) blockers.push('ข้อเท็จจริงสำคัญยังไม่เพียงพอ');
    if (!context.documents) warnings.push('ยังไม่ได้ระบุเอกสารหรือหลักฐานที่มี');

    const routes = routing.routes || [];
    if (routes.some(route => route.includes('procurement')) && !context.fundingSource) {
      warnings.push('เรื่องซื้อหรือจ้างยังไม่ได้ระบุแหล่งเงิน/งบประมาณ');
    }
    if ((routing.flags || []).includes('retroactive')) {
      warnings.push('พบประเด็นย้อนหลัง ต้องแยกการเกิดสิทธิ การอนุมัติ และปีงบประมาณ');
    }
    if ((routing.flags || []).includes('urgent')) {
      warnings.push('กรณีเร่งด่วนต้องตรวจเหตุคาดหมายไม่ได้ ความจำเป็น และขอบเขตเท่าที่จำเป็น');
    }
    if ((routing.flags || []).includes('single-bidder')) {
      warnings.push('กรณีผู้เสนอราคารายเดียวต้องตรวจการแข่งขัน ราคา และเหตุผลการดำเนินการต่อ');
    }

    let level = 'green';
    if (warnings.length) level = 'yellow';
    if (blockers.length) level = 'orange';
    if ((routing.flags || []).includes('complaint') && blockers.length) level = 'red';

    return {
      level,
      blockers,
      warnings,
      mandatoryGates: REQUIRED_GATES,
      humanReviewRequired: level !== 'green',
      decisionLabel: {
        green: 'ใช้เป็นแนวทางทำงานต่อได้หลังตรวจทาน',
        yellow: 'ใช้ได้เมื่อเติมข้อมูลและตรวจเงื่อนไข',
        orange: 'ยังไม่ควรสรุปเด็ดขาด ต้องตรวจเอกสาร/ผู้เชี่ยวชาญ',
        red: 'ควรหยุดและส่งผู้มีอำนาจหรือผู้เชี่ยวชาญตรวจ'
      }[level]
    };
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.evaluateQuality = evaluateQuality;
})();