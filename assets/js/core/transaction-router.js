(() => {
  'use strict';

  const ROUTE_RULES = [
    { id: 'emergency-procurement', routes: ['procurement', 'payment', 'asset'], flags: ['urgent'], terms: ['รถเสีย', 'เสียระหว่างทาง', 'ฉุกเฉิน', 'เร่งด่วน', 'ดำเนินการไปก่อน'] },
    { id: 'travel-entitlement', routes: ['entitlement', 'payment'], flags: [], terms: ['ค่าเดินทาง', 'เดินทางไปราชการ', 'ค่าพาหนะ', 'ค่าที่พัก'] },
    { id: 'housing-entitlement', routes: ['entitlement', 'payment'], flags: [], terms: ['ค่าเช่าบ้าน', 'บ้านพักราชการ'] },
    { id: 'advance-payment', routes: ['advance', 'payment', 'accounting'], flags: [], terms: ['เงินยืม', 'ส่งใช้เงินยืม', 'ลูกหนี้เงินยืม'] },
    { id: 'grant', routes: ['grant', 'payment', 'monitoring'], flags: [], terms: ['เงินอุดหนุน', 'ขอรับการสนับสนุนงบประมาณ'] },
    { id: 'consultant-procurement', routes: ['plan-budget', 'procurement-consultant', 'contract', 'acceptance', 'payment'], flags: [], terms: ['จ้างที่ปรึกษา', 'ที่ปรึกษา'] },
    { id: 'construction', routes: ['plan-budget', 'procurement-construction', 'engineering', 'contract', 'acceptance', 'payment', 'asset'], flags: [], terms: ['ก่อสร้าง', 'ถนน', 'สะพาน', 'อาคาร', 'boq'] },
    { id: 'general-procurement', routes: ['plan-budget', 'procurement', 'contract', 'acceptance', 'payment'], flags: [], terms: ['ซื้อ', 'จ้าง', 'tor', 'ราคากลาง', 'ตรวจรับ'] },
    { id: 'revenue', routes: ['revenue', 'accounting'], flags: [], terms: ['ภาษี', 'ค่าธรรมเนียม', 'ค่าเช่า', 'รายได้', 'ลูกหนี้'] },
    { id: 'administrative-order', routes: ['authority', 'administrative-order'], flags: [], terms: ['คำสั่งทางปกครอง', 'เพิกถอน', 'พักใช้', 'ใบอนุญาต', 'อุทธรณ์'] },
    { id: 'hr', routes: ['authority', 'hr'], flags: [], terms: ['บรรจุ', 'แต่งตั้ง', 'โอน', 'ย้าย', 'วินัย', 'เลื่อนเงินเดือน'] },
    { id: 'council', routes: ['authority', 'council'], flags: [], terms: ['สภา', 'ญัตติ', 'ข้อบัญญัติ', 'ประชุมสภา'] }
  ];

  const FLAG_RULES = [
    { flag: 'no-receipt', terms: ['ไม่มีใบเสร็จ', 'ใบเสร็จหาย'] },
    { flag: 'retroactive', terms: ['ย้อนหลัง', 'เบิกย้อนหลัง', 'อนุมัติย้อนหลัง'] },
    { flag: 'single-bidder', terms: ['รายเดียว', 'ผู้เสนอราคารายเดียว'] },
    { flag: 'cross-fiscal-year', terms: ['ข้ามปี', 'กันเงิน', 'ผูกพันข้ามปี'] },
    { flag: 'contract-change', terms: ['แก้สัญญา', 'ขยายเวลา', 'งดค่าปรับ', 'ลดค่าปรับ'] },
    { flag: 'complaint', terms: ['ร้องเรียน', 'ทักท้วง', 'ตรวจสอบ'] }
  ];

  function includesAny(text, terms) {
    return terms.some(term => text.includes(term.toLowerCase()));
  }

  function routeTransaction(context = {}, extraText = '') {
    const source = [
      context.domain,
      context.currentStage,
      context.transactionType,
      context.facts,
      context.documents,
      Array.isArray(context.specialFlags) ? context.specialFlags.join(' ') : context.specialFlags,
      extraText
    ].join(' ').toLowerCase();

    const matches = ROUTE_RULES.filter(rule => includesAny(source, rule.terms));
    const routes = [...new Set(matches.flatMap(match => match.routes))];
    const flags = [...new Set([
      ...matches.flatMap(match => match.flags),
      ...FLAG_RULES.filter(rule => includesAny(source, rule.terms)).map(rule => rule.flag)
    ])];

    if (!routes.length) routes.push('authority', 'fact-check', 'risk-review');

    return {
      ruleIds: matches.map(match => match.id),
      routes,
      flags,
      requiresClarification: !context.organizationType || !context.currentStage,
      missingCoreFacts: [
        !context.organizationType ? 'ประเภท อปท./หน่วยงาน' : '',
        !context.currentStage ? 'ขั้นตอนปัจจุบัน' : ''
      ].filter(Boolean)
    };
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.routeTransaction = routeTransaction;
  window.GovPromptCore.ROUTE_RULES = ROUTE_RULES;
})();