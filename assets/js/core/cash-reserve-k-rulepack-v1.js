(() => {
  'use strict';

  const app = window.GovPrompt = window.GovPrompt || {};
  const registry = app.domainRulePacks = app.domainRulePacks || {};
  const textOf = value => String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  const isRelevant = value => /(เงินสะสม|ค่า\s*K|ค่าชดเชยสัญญา|สัญญาแบบปรับราคาได้|ค่าที่ดินและสิ่งก่อสร้าง|ข้อ\s*97|มท\s*0808\.2\/1095|ว\s*1095)/i.test(textOf(value));

  const officialSourceCandidates = Object.freeze([
    { id: 'cash-reserve-rule-97-1', label: 'ระเบียบกระทรวงมหาดไทยว่าด้วยการรับเงิน การเบิกจ่ายเงิน การฝากเงิน การเก็บรักษาเงิน และการตรวจเงินขององค์กรปกครองส่วนท้องถิ่น — ข้อ 97 (1)' },
    { id: 'classification-w1095', label: 'หนังสือกรมส่งเสริมการปกครองท้องถิ่น ที่ มท 0808.2/1095 ลงวันที่ 28 พฤษภาคม 2564 และประเภท (13)' },
    { id: 'price-adjustment-k', label: 'สัญญาแบบปรับราคาได้ เอกสารคำนวณค่า K ดัชนี งวดงาน และการอนุมัติ' }
  ]);
  const requiredFacts = Object.freeze(['ประเภท อปท. และหน่วยงานผู้เบิก','โครงการ/สัญญาและวัตถุประสงค์ของเงินสะสม','วันที่ทำสัญญา/แก้ไขสัญญา/งวดงาน/วันที่เกิดสิทธิ','แหล่งเงินและมติหรือคำสั่งอนุมัติใช้เงินสะสม','จำนวนเงิน สูตร ดัชนี และเอกสารคำนวณค่า K','สถานะงบประมาณและการจำแนกรายจ่าย','เอกสารตรวจสอบและอนุมัติการจ่าย']);
  const decisionGates = Object.freeze([
    { id: 'classification', label: 'ตรวจการจำแนกประเภทรายจ่าย' },
    { id: 'authority', label: 'ตรวจฐานอำนาจและเงื่อนไขข้อ 97 (1)' },
    { id: 'k-entitlement', label: 'ตรวจสิทธิ สูตร ดัชนี และการคำนวณค่า K' },
    { id: 'waiver-exemption', label: 'ตรวจเงื่อนไขการขอยกเว้น/ไม่ขอยกเว้น' },
    { id: 'evidence', label: 'ตรวจต้นฉบับและหลักฐานที่ตรวจสอบย้อนกลับได้' }
  ]);

  const policyBlock = [
    '=== CASH RESERVE + K PAYMENT CONTROL (MANDATORY) ===',
    'แยกการจำแนกประเภทรายจ่ายออกจากฐานอำนาจและเงื่อนไขการใช้เงินสะสม ห้ามสรุปจากหมวดงบประมาณเพียงอย่างเดียว',
    'ตรวจข้อ 97(1) ฉบับที่ใช้บังคับ ณ วันเกิดรายการ และตรวจต้นฉบับหนังสือ มท 0808.2/1095 ลงวันที่ 28 พฤษภาคม 2564 รวมถึงขอบเขตประเภท (13)',
    'ตรวจสัญญาแบบปรับราคาได้ สูตร ดัชนี งวดงาน วันที่เกิดสิทธิ เอกสารคำนวณ การตรวจสอบ และการอนุมัติค่า K',
    'วิเคราะห์การขอยกเว้น/ไม่ขอยกเว้นแยกต่างหาก ห้ามถือคำตอบหารือหรือภาพหน้าจอแทนต้นฉบับ และห้ามสรุปอัตโนมัติว่าทุกกรณีไม่ต้องขอ',
    'ค้นสดให้ดำเนินการโดย AI ปลายทาง/ผู้ให้บริการ AI ที่ผู้ใช้เลือกเท่านั้น ไม่เรียก officialSearchConnector ของ GovPrompt อัตโนมัติ เพื่อลดการใช้โควตาและลิมิตของระบบ',
    'AI ปลายทางต้องค้นแหล่งทางการก่อนสรุป ตรวจวันมีผล การแก้ไข และบทเฉพาะกาล หากค้นไม่ได้ให้ระบุข้อจำกัดและเปิด Decision Lock',
    'ผลลัพธ์ต้องมีข้อเท็จจริงที่ยืนยัน/ยังไม่ยืนยัน ฐานอำนาจ ตาราง Gate หลักฐาน ความเสี่ยง แนวทางปฏิบัติ และสถานะ: ดำเนินการได้ / ต้องแก้ไขหรือเพิ่มหลักฐาน / ยังสรุปไม่ได้',
    'ห้ามกำหนดสูตร อัตรา ดัชนี หรือเงื่อนไขค่า K แบบตายตัวจากความจำหรือจากตัวอย่าง'
  ].join('\n');

  function detect(input = '') {
    const relevant = isRelevant(input);
    return Object.freeze({
      relevant,
      domain: relevant ? 'cash-reserve-k-payment' : '',
      confidence: relevant ? 0.99 : 0,
      requiresOfficialSource: relevant,
      requiresPrimaryDocument: relevant,
      decisionLockDefault: relevant,
      searchableBeforeDecidable: relevant,
      searchDelegation: relevant ? 'external-ai-only' : 'default',
      officialSourceCandidates,
      requiredFacts,
      decisionGates,
      policyBlock,
      prohibitedShortcuts: Object.freeze(['ห้ามสรุปจากหมวดงบประมาณเพียงอย่างเดียว','ห้ามใช้คำตอบหารือแทนกฎหมาย','ห้ามฟันธงเรื่องยกเว้นโดยไม่ตรวจข้อเท็จจริงและต้นฉบับ','ห้าม hard-code สูตรหรือเงื่อนไขค่า K'])
    });
  }

  const rulepack = Object.freeze({ id: 'cash-reserve-k-payment', version: '2.1.0', label: 'เงินสะสม — จ่ายค่า K ให้ผู้รับจ้าง', detect, officialSourceCandidates, requiredFacts, decisionGates, policyBlock });
  registry['cash-reserve-k-payment'] = rulepack;
  app.cashReserveKRulePack = rulepack;

  const core = window.GovPromptCore;
  if (core && typeof core.createGovernmentPrompt === 'function' && !core.__cashReserveKRuntimeInstalled) {
    const originalCreate = core.createGovernmentPrompt;
    core.createGovernmentPrompt = function cashReserveKPromptWrapper(args = {}) {
      const question = textOf(args.question ?? args.text ?? args.facts ?? '');
      const result = originalCreate.call(this, args);
      if (!isRelevant(question) || !result || typeof result !== 'object') return result;
      return Object.freeze({
        ...result,
        prompt: `${result.prompt || ''}\n\n${policyBlock}`,
        cashReserveKControl: Object.freeze({ id: rulepack.id, version: rulepack.version, decisionLockDefault: true, officialSourceFirst: true, searchDelegation: 'external-ai-only', requiredGates: decisionGates.map(gate => gate.id) })
      });
    };
    core.__cashReserveKRuntimeInstalled = true;
    app.emit?.('cash-k:integration-ready', { version: rulepack.version, searchDelegation: 'external-ai-only' });
  } else if (!core) {
    app.emit?.('cash-k:integration-pending', { reason: 'GovPromptCore unavailable at module load' });
  }
})();
