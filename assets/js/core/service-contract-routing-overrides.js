(() => {
  'use strict';

  // GP-Service-Contract v1
  // A focused extension for service-contract workflows inside the existing GP003 domain.
  // This module classifies service-contract intent and supplies mandatory review gates.
  // It does not approve, sign, procure, or pay on behalf of an authorized official.

  const SERVICE_CONTRACT_RULES = Object.freeze([
    Object.freeze({
      id: 'classification',
      title: 'จำแนกลักษณะงานจ้างเหมาบริการ',
      requiredEvidence: Object.freeze([
        'ผลสำเร็จของงานหรือ deliverables',
        'ขอบเขตงานและระยะเวลาส่งมอบ',
        'วิธีควบคุมผลลัพธ์งาน ไม่ใช่การควบคุมแบบลูกจ้าง',
        'เหตุผลความจำเป็นและประโยชน์ของทางราชการ'
      ]),
      risk: 'เสี่ยงถูกตีความว่าเป็นการจ้างแรงงานหรือใช้รูปแบบสัญญาไม่ตรงข้อเท็จจริง'
    }),
    Object.freeze({
      id: 'necessity-approval',
      title: 'ความจำเป็นและบันทึกขออนุมัติ',
      requiredEvidence: Object.freeze([
        'เหตุผลความจำเป็น',
        'ขอบเขตผลผลิต/ผลลัพธ์ที่ต้องการ',
        'วงเงินและแหล่งงบประมาณ',
        'ผู้มีอำนาจอนุมัติและลำดับการเสนอ'
      ]),
      risk: 'เสี่ยงเริ่มดำเนินการก่อนมีการอนุมัติหรือใช้อำนาจไม่ถูกต้อง'
    }),
    Object.freeze({
      id: 'tor-scope',
      title: 'ขอบเขตงานและเงื่อนไขการจ้าง',
      requiredEvidence: Object.freeze([
        'ขอบเขตงานที่วัดผลได้',
        'กำหนดส่งมอบและเกณฑ์ตรวจรับ',
        'เงื่อนไขการจ่ายเงินที่สัมพันธ์กับผลงาน',
        'เงื่อนไขที่ไม่จำกัดการแข่งขันโดยไม่มีเหตุผล'
      ]),
      risk: 'เสี่ยงกำหนดงานคลุมเครือ ตรวจรับไม่ได้ หรือผูกกับบุคคล/ยี่ห้อโดยไม่จำเป็น'
    }),
    Object.freeze({
      id: 'procurement-method',
      title: 'วิธีจัดซื้อจัดจ้างและหลักฐานราคา',
      requiredEvidence: Object.freeze([
        'วงเงินที่ตรวจสอบได้จากเอกสารต้นทาง',
        'เหตุผลและฐานอำนาจของวิธีจัดซื้อจัดจ้าง',
        'หลักฐานการสืบราคา/ราคากลาง/ราคาอ้างอิงตามกรณี',
        'การตรวจสอบการแบ่งซื้อแบ่งจ้าง'
      ]),
      risk: 'เสี่ยงเลือกวิธีจัดซื้อจัดจ้างไม่สอดคล้องวงเงินหรือข้อเท็จจริง'
    }),
    Object.freeze({
      id: 'contract',
      title: 'สัญญาและเงื่อนไขการเปลี่ยนแปลง',
      requiredEvidence: Object.freeze([
        'คู่สัญญาและอำนาจลงนาม',
        'ระยะเวลาและขอบเขตงานตรงกับ TOR',
        'ค่าปรับ/การบอกเลิก/การแก้ไขสัญญาตามหลักเกณฑ์ที่ใช้บังคับ',
        'หลักฐานการลงนามก่อนเริ่มงานตามกรณี'
      ]),
      risk: 'เสี่ยงสัญญาไม่ตรง TOR หรือมีการแก้ไขสาระสำคัญโดยไม่มีฐานอำนาจ'
    }),
    Object.freeze({
      id: 'acceptance-payment',
      title: 'ตรวจรับและเบิกจ่าย',
      requiredEvidence: Object.freeze([
        'รายงานผลการปฏิบัติงาน/ผลงานที่ส่งมอบ',
        'คณะกรรมการหรือผู้ตรวจรับตามคำสั่ง',
        'หลักฐานตรวจรับตรงตามเกณฑ์',
        'ใบแจ้งหนี้/เอกสารเบิกจ่ายและการหักภาษีตามกรณี'
      ]),
      risk: 'เสี่ยงจ่ายเงินโดยไม่มีผลงานหรือหลักฐานตรวจรับครบถ้วน'
    })
  ]);

  const INTENT_PATTERNS = Object.freeze([
    /จ้างเหมาบริการ/,
    /จ้างเหมา(?!ก่อสร้าง)/,
    /ผู้รับจ้างบริการ/,
    /ค่าจ้างเหมาบริการ/,
    /ตรวจรับ.{0,30}(?:จ้างเหมา|บริการ)/,
    /บันทึกขออนุมัติ.{0,40}(?:จ้าง|บริการ)/,
    /TOR.{0,40}(?:จ้างเหมา|บริการ)/i
  ]);

  function isServiceContractIntent(input = '') {
    const text = String(input ?? '').trim();
    return INTENT_PATTERNS.some(pattern => pattern.test(text));
  }

  function createServiceContractReview(input = {}) {
    const text = String(input.question ?? input.text ?? '');
    const matched = isServiceContractIntent(text);
    const evidence = Array.isArray(input.evidence) ? input.evidence : [];
    const evidenceText = evidence.map(item => String(item ?? '').toLowerCase()).join(' ');

    const checks = SERVICE_CONTRACT_RULES.map(rule => {
      const found = rule.requiredEvidence.filter(required => evidenceText.includes(required.toLowerCase()));
      return Object.freeze({
        id: rule.id,
        title: rule.title,
        status: found.length === rule.requiredEvidence.length ? 'provisionally-supported' : 'evidence-required',
        evidenceFound: Object.freeze(found),
        evidenceRequired: rule.requiredEvidence,
        risk: rule.risk
      });
    });

    const missing = checks.filter(check => check.status === 'evidence-required');
    return Object.freeze({
      moduleId: 'GP-SERVICE-CONTRACT',
      parentModuleId: 'GP003',
      matched,
      decisionLock: missing.length > 0 || input.authorityVerified !== true,
      status: matched ? (missing.length > 0 ? 'evidence-incomplete' : 'authority-verification-required') : 'not-applicable',
      checks: Object.freeze(checks),
      requiredNextAction: matched
        ? 'ให้ AI ฝั่งผู้ใช้ค้นและแนบกฎหมาย/หนังสือสั่งการจากแหล่งทางการ แล้วตรวจสอบฉบับ วันมีผล ข้อเท็จจริง และอำนาจก่อนสรุป'
        : 'ส่งต่อให้ Router จำแนกโมดูลตามปกติ'
    });
  }

  const core = window.GovPromptCore = window.GovPromptCore || {};
  core.serviceContract = Object.freeze({
    version: '1.0.0',
    rules: SERVICE_CONTRACT_RULES,
    isServiceContractIntent,
    createServiceContractReview
  });
})();
