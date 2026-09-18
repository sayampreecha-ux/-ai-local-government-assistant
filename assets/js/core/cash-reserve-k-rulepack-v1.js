(() => {
  'use strict';

  const app = window.GovPrompt = window.GovPrompt || {};
  const registry = app.domainRulePacks = app.domainRulePacks || {};

  const OFFICIAL_SOURCE_CANDIDATES = Object.freeze([
    {
      id: 'cash-reserve-rule-97-1',
      label: 'ระเบียบกระทรวงมหาดไทยว่าด้วยการรับเงิน การเบิกจ่ายเงิน การฝากเงิน การเก็บรักษาเงิน และการตรวจเงินขององค์กรปกครองส่วนท้องถิ่น — ข้อ 97 (1)',
      verification: 'ต้องอ่านฉบับปัจจุบันและตรวจบทเฉพาะกาล/หนังสือแก้ไขเพิ่มเติมจากแหล่งราชการก่อนสรุปผล'
    },
    {
      id: 'classification-w1095',
      label: 'หนังสือกรมส่งเสริมการปกครองท้องถิ่น ที่ มท 0808.2/1095 ลงวันที่ 28 พฤษภาคม 2564 เรื่องรูปแบบและการจำแนกประเภทรายรับ–รายจ่าย',
      verification: 'ต้องตรวจต้นฉบับและข้อความของประเภท (13) ว่าครอบคลุมข้อเท็จจริงของรายการที่กำลังพิจารณาหรือไม่'
    },
    {
      id: 'price-adjustment-k',
      label: 'หลักเกณฑ์/เงื่อนไขสัญญาแบบปรับราคาได้และเอกสารคำนวณค่าชดเชยสัญญา (ค่า K)',
      verification: 'ต้องตรวจว่าค่า K เกิดจากสัญญาใด งวดใด สูตรใด และผ่านการตรวจรับ/อนุมัติการคำนวณแล้วหรือไม่'
    }
  ]);

  const REQUIRED_FACTS = Object.freeze([
    'ประเภทของ อปท. และหน่วยงานผู้เบิก',
    'โครงการ/สัญญาก่อสร้างและวัตถุประสงค์ของเงินสะสมที่ได้รับอนุมัติ',
    'วันที่ทำสัญญา การแก้ไขสัญญา งวดงาน และวันที่เกิดสิทธิค่า K',
    'แหล่งเงินและข้อเท็จจริงว่าเป็นการจ่ายจากเงินสะสมที่กันไว้/อนุมัติไว้แล้วหรือการตั้งรายการใหม่',
    'จำนวนเงินค่า K เอกสารคำนวณ ดัชนีราคาที่ใช้ และผู้ตรวจสอบ/ผู้อนุมัติ',
    'สถานะงบประมาณและการจำแนกรายจ่ายในระบบ/เอกสารงบประมาณ',
    'หนังสือหรือมติที่ใช้อนุมัติการใช้เงินสะสม และเงื่อนไขที่แนบท้าย'
  ]);

  const DECISION_GATES = Object.freeze([
    {
      id: 'classification-gate',
      label: 'ตรวจการจำแนกประเภทรายจ่าย',
      rule: 'ห้ามสรุปว่าใช้เงินสะสมได้เพียงเพราะมีคำว่า “ค่าที่ดินและสิ่งก่อสร้าง”; ต้องยืนยันประเภทและคำอธิบายรายการจาก ว 1095 ฉบับต้นฉบับ'
    },
    {
      id: 'authority-gate',
      label: 'ตรวจฐานอำนาจของการใช้เงินสะสม',
      rule: 'แยกการอนุญาตให้ใช้เงินสะสมออกจากการจำแนกรายจ่าย และตรวจเงื่อนไขของข้อ 97 (1) กับข้อ/หนังสือที่เกี่ยวข้องให้ครบ'
    },
    {
      id: 'k-entitlement-gate',
      label: 'ตรวจสิทธิและความถูกต้องของค่า K',
      rule: 'ตรวจสัญญาแบบปรับราคาได้ สูตร ดัชนี งวดงาน วันที่ และเอกสารรับรองการคำนวณก่อนพิจารณาจ่าย'
    },
    {
      id: 'waiver-gate',
      label: 'ตรวจว่าต้องขอยกเว้นหรือไม่',
      rule: 'ห้ามใช้คำตอบจากการหารือเพียงอย่างเดียวเป็นข้อยุติ ต้องตรวจว่ากรณีจริงเข้าข่ายข้อจำกัด/ข้อยกเว้น/เงื่อนไขเฉพาะใด และต้องมีหนังสือยืนยันหรือไม่'
    },
    {
      id: 'evidence-gate',
      label: 'ตรวจหลักฐานและความสอดคล้อง',
      rule: 'ทุกข้อสรุปต้องผูกกับข้อกฎหมาย/หนังสือ/เอกสารหลักฐานที่ระบุเลขหน้า ข้อ หรือข้อความที่ตรวจได้; หากเอกสารไม่ครบให้ล็อกคำวินิจฉัยสุดท้าย'
    }
  ]);

  function normalize(text) {
    return String(text ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  }

  function detect(input = '') {
    const text = normalize(input);
    const relevant = /(เงินสะสม|ค่า\s*K|ค่าชดเชยสัญญา|สัญญาแบบปรับราคาได้|ค่าที่ดินและสิ่งก่อสร้าง|ข้อ\s*97|มท\s*0808\.2\/1095|ว\s*1095)/i.test(text);
    if (!relevant) return Object.freeze({ relevant: false, domain: '', confidence: 0 });

    return Object.freeze({
      relevant: true,
      domain: 'cash-reserve-k-payment',
      confidence: 0.99,
      requiresOfficialSource: true,
      requiresPrimaryDocument: true,
      decisionLockDefault: true,
      searchableBeforeDecidable: true,
      officialSourceCandidates: OFFICIAL_SOURCE_CANDIDATES,
      requiredFacts: REQUIRED_FACTS,
      decisionGates: DECISION_GATES,
      prohibitedShortcuts: Object.freeze([
        'ห้ามสรุปจากหมวดงบประมาณเพียงอย่างเดียว',
        'ห้ามถือคำตอบจากหน่วยงานเป็นกฎหมายแทนการตรวจต้นฉบับ',
        'ห้ามฟันธงว่าไม่ต้องขอยกเว้นหากยังไม่ตรวจข้อ 97 (1) ฉบับปัจจุบันและข้อเท็จจริงของกรณี',
        'ห้ามกำหนดอัตรา สูตร ดัชนี หรือเงื่อนไขค่า K แบบตายตัวในระบบ'
      ]),
      outputSchema: Object.freeze([
        'คำตอบเบื้องต้นแบบมีเงื่อนไข',
        'ข้อเท็จจริงที่ยืนยันแล้ว/ยังไม่ยืนยัน',
        'ฐานอำนาจและเอกสารต้นฉบับที่ตรวจแล้ว',
        'ผลการตรวจแต่ละ Gate พร้อมหลักฐาน',
        'สถานะ: ดำเนินการได้ / ได้เมื่อแก้ไขหรือเพิ่มหลักฐาน / ยังสรุปไม่ได้',
        'ความเสี่ยงและข้อเสนอแนะเชิงปฏิบัติ'
      ])
    });
  }

  registry['cash-reserve-k-payment'] = Object.freeze({
    id: 'cash-reserve-k-payment',
    version: '1.0.0',
    label: 'เงินสะสม — จ่ายค่า K ให้ผู้รับจ้าง',
    detect,
    officialSourceCandidates: OFFICIAL_SOURCE_CANDIDATES,
    requiredFacts: REQUIRED_FACTS,
    decisionGates: DECISION_GATES
  });

  app.cashReserveKRulePack = registry['cash-reserve-k-payment'];
})();
