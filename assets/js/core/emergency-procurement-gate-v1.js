(() => {
  'use strict';
  const VERSION = '1.0.0';
  const GATE_ID = 'emergency-procurement';
  const GATE_LABEL = 'Emergency Procurement Decision Gate';
  const OFFICIAL_SOURCES = Object.freeze([
    Object.freeze({
      id: 'CGD-W714-2569',
      title: 'กค (กวจ) 0405.4/ว 714 ลงวันที่ 16 กันยายน 2569 — แนวทางการยื่นข้อเสนอโดยวิธีคัดเลือกและวิธีเฉพาะเจาะจงผ่าน e-GP',
      url: 'https://www.cgd.go.th/cs/srn/srn/หน้าหลัก.html?page_locale=en_US',
      status: 'current-check-required'
    }),
    Object.freeze({
      id: 'CGD-PROCUREMENT',
      title: 'กรมบัญชีกลาง — แหล่งต้นฉบับกฎหมายและแนวทางจัดซื้อจัดจ้าง',
      url: 'https://www.cgd.go.th/',
      status: 'primary-source-required'
    })
  ]);
  const DISASTER_WORDS = /อุทกภัย|น้ำท่วม|น้ำป่า|ดินถล่ม|วาตภัย|ภัยแล้ง|ภัยธรรมชาติ|สาธารณภัย|อุบัติภัย|ผู้ประสบภัย/;
  const PROCUREMENT_WORDS = /จัดซื้อ|จัดจ้าง|พัสดุ|วิธีเฉพาะเจาะจง|e-?gp|ข้อ 79|มาตรา 56|ถุงยังชีพ|กระสอบทราย|ทราย|สูบน้ำ|เครื่องสูบน้ำ|เครื่องปั่นไฟ|เต็นท์|น้ำดื่ม|ยา|เวชภัณฑ์/;
  const EMERGENCY_WORDS = /ฉุกเฉิน|เร่งด่วน|ด่วน|ทันที|ไม่ทัน|ความเสียหาย|ช่วยเหลือ/;
  const AMOUNT_RE = /(?:วงเงิน|ราคา|งบประมาณ|จำนวนเงิน)\s*[^\n]{0,30}?([0-9][0-9,]*(?:\.\d+)?)\s*(?:บาท|บ\.?)?/i;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().trim();
  }
  function parseAmount(text) {
    const match = String(text).match(AMOUNT_RE);
    if (!match) return null;
    const value = Number(match[1].replace(/,/g, ''));
    return Number.isFinite(value) ? value : null;
  }
  function detectEmergencyProcurementGate(request) {
    const text = normalize(request);
    const disaster = DISASTER_WORDS.test(text);
    const procurement = PROCUREMENT_WORDS.test(text);
    if (!disaster || !procurement) return null;

    const amount = parseAmount(text);
    const emergency = EMERGENCY_WORDS.test(text);
    const le500k = amount !== null && amount <= 500000;
    const gt500k = amount !== null && amount > 500000;
    const candidateBases = [];
    if (le500k) candidateBases.push('ม.56(2)(ข) + ระเบียบฯ ข้อ 79 วรรคสอง');
    if (gt500k || amount === null) candidateBases.push('ม.56(2)(ง) — ต้องพิสูจน์องค์ประกอบภัยธรรมชาติ/ฉุกเฉินและความเสียหายร้ายแรง');
    candidateBases.push('กฎกระทรวงฯ ข้อ 2(5) — ตรวจองค์ประกอบของกรณีฉุกเฉินแยกต่างหาก');

    const missing = [];
    if (amount === null) missing.push('วงเงินครั้งหนึ่งของการจัดหา');
    if (!emergency) missing.push('ข้อเท็จจริงที่ยืนยันความจำเป็นเร่งด่วน');
    missing.push('วันที่/ช่วงเวลาที่เกิดเหตุและช่วงเวลาที่ต้องใช้พัสดุ');
    missing.push('เหตุผลว่ากระบวนการปกติหรือวิธีคัดเลือกจะไม่ทันหรือก่อความเสียหายอย่างไร');
    missing.push('รายการ/ปริมาณพัสดุและความจำเป็น');
    missing.push('ราคาที่เหมาะสมและหลักฐานประกอบ');
    missing.push('ตรวจการแบ่งซื้อแบ่งจ้าง');
    missing.push('หลักเกณฑ์ e-GP/ข้อยกเว้นที่มีผลใช้บังคับ ณ วันที่ดำเนินการ');

    return Object.freeze({
      version: VERSION,
      gateId: GATE_ID,
      gateLabel: GATE_LABEL,
      disaster,
      procurement,
      emergency,
      amount,
      amountBand: le500k ? 'LE_500K' : gt500k ? 'GT_500K' : 'UNKNOWN',
      candidateBases: Object.freeze(candidateBases),
      decisionLock: true,
      missingFacts: Object.freeze(missing),
      sources: OFFICIAL_SOURCES
    });
  }

  function buildEmergencyProcurementPromptBlock(gate) {
    if (!gate) return '';
    return [
      '=== EMERGENCY PROCUREMENT DECISION GATE ===',
      'พบคำถามเกี่ยวกับการจัดซื้อจัดจ้างในบริบทภัยพิบัติ/อุทกภัย',
      'ห้ามสรุป “ใช้ข้อ 79” หรือ “ใช้ ม.56(2)(ง)” จากคำว่าอุทกภัยหรือจากวงเงินเพียงอย่างเดียว',
      '',
      'ฐานที่ต้องแยกตรวจ',
      '1. หากวงเงินครั้งหนึ่งไม่เกิน 500,000 บาท ให้ตรวจ ม.56(2)(ข) และเงื่อนไขของระเบียบฯ ข้อ 79 วรรคสองเป็นรายกรณี',
      '2. หากเกิน 500,000 บาท ให้พิจารณา ม.56(2)(ง) ได้เมื่อข้อเท็จจริงเข้าองค์ประกอบเรื่องฉุกเฉินจากภัยธรรมชาติ ความจำเป็น และความเสียหายร้ายแรง',
      '3. ตรวจ กฎกระทรวงฯ ข้อ 2(5) แยกจากข้อ 79 และไม่ปะปนฐานกฎหมาย',
      '',
      'ข้อ 79 วรรคสอง: หากเข้าเงื่อนไขจริง ให้แยก “ไม่ต้องรอความเห็นชอบก่อนดำเนินการ” ออกจาก “ต้องรีบรายงานขอความเห็นชอบภายหลัง” และเมื่อได้รับความเห็นชอบ รายงานจึงเป็นหลักฐานการตรวจรับโดยอนุโลม',
      '',
      'e-GP: ห้ามใช้เส้นแบ่ง 500,000 บาทเป็นตัวตัดสิน e-GP โดยอัตโนมัติ ให้ตรวจหลักเกณฑ์และหนังสือเวียนที่มีผลใช้บังคับ ณ วันที่ดำเนินการ โดยเฉพาะแนวทางปัจจุบันเกี่ยวกับวิธีเฉพาะเจาะจงผ่าน e-GP',
      '',
      'ห้าม',
      '- เหมารวมว่าอุทกภัยทุกกรณีใช้ข้อ 79 วรรคสองได้',
      '- เหมารวมว่าเกิน 500,000 บาทใช้ ม.56(2)(ง) ได้ทันที',
      '- เหมารวมว่าไม่ต้องมีเอกสาร/หลักฐาน',
      '- แบ่งซื้อแบ่งจ้างเพื่อหลีกเลี่ยงวิธีการจัดซื้อจัดจ้าง',
      '',
      'ข้อมูลที่ต้องตรวจให้ครบก่อน Final Decision',
      gate.missingFacts.map((x, i) => (i + 1) + '. ' + x).join('\n'),
      '',
      'สถานะ: 🟡 Decision Lock — ต้องตรวจข้อเท็จจริงและต้นฉบับก่อนฟันธง',
      'ผลลัพธ์ต้องแยก: ฐานกฎหมายที่เข้าได้ / เงื่อนไขที่ผ่าน / เงื่อนไขที่ยังไม่ผ่าน / หลักฐานที่ต้องเก็บ / ขั้นตอน e-GP / ความเสี่ยง Audit',
      '=== END EMERGENCY PROCUREMENT DECISION GATE ==='
    ].join('\n');
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    EMERGENCY_PROCUREMENT_GATE_VERSION: VERSION,
    detectEmergencyProcurementGate,
    buildEmergencyProcurementPromptBlock,
    EMERGENCY_PROCUREMENT_SOURCES: OFFICIAL_SOURCES
  });
})();