(() => {
  'use strict';

  const app = window.GovPrompt = window.GovPrompt || {};
  const registry = app.domainRulePacks = app.domainRulePacks || {};
  const normalize = value => String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();

  const K_AUDIT_PATTERN = /ค่า\s*K|ค่าชดเชยค่างานก่อสร้าง|สัญญาแบบปรับราคาได้|เงินชดเชยค่างาน|CUCEM[-\s]?K/i;

  const officialSourceCandidates = Object.freeze([
    { id: 'bb-k-hub', label: 'สำนักงบประมาณ — เงินชดเชยค่างานก่อสร้าง (ค่า K)' },
    { id: 'bb-k-manual', label: 'สำนักงบประมาณ — คู่มือการคิดค่า K และมติคณะรัฐมนตรีที่เกี่ยวข้อง' },
    { id: 'bb-k-cucem', label: 'สำนักงบประมาณ — โปรแกรม CUCEM-K และคู่มือ' },
    { id: 'contract-documents', label: 'สัญญา/BOQ/แบบ/Specification/รายการคำนวณค่า K ของโครงการ' }
  ]);

  const requiredEvidence = Object.freeze([
    'สัญญาและเงื่อนไขการปรับราคา',
    'BOQ/แบบ/รายการประกอบแบบ/Specification',
    'ใบแสดงรายการคำนวณค่า K',
    'งวดงานและวันที่ที่เกี่ยวข้องกับการคำนวณ',
    'ดัชนีที่ใช้เป็นฐานและดัชนีปัจจุบัน พร้อมแหล่งที่มา',
    'หลักฐานงานที่ทำจริง/รายงานควบคุมงาน/ตรวจรับ เมื่อมีประเด็นลักษณะงาน'
  ]);

  const gates = Object.freeze([
    { id: 'k-eligibility', label: 'ตรวจว่างานและสัญญาเข้าเงื่อนไขการใช้ค่า K หรือไม่' },
    { id: 'authority-version', label: 'ตรวจฐานอำนาจ ฉบับที่ใช้บังคับ และช่วงเวลา' },
    { id: 'formula-match', label: 'ตรวจว่าประเภทงานตรงกับสูตรที่เอกสารเลือก' },
    { id: 'index-check', label: 'ตรวจดัชนี ฐานเวลา และแหล่งที่มา' },
    { id: 'arithmetic-check', label: 'คำนวณซ้ำและตรวจความสอดคล้องของตัวเลข' },
    { id: 'reverse-check', label: 'ย้อนตรวจจากยอดเงินที่จ่าย/เรียกคืนกลับไปยังค่า K' },
    { id: 'evidence-check', label: 'ตรวจหลักฐานประกอบและความขัดแย้งระหว่างเอกสาร' }
  ]);

  const policyBlock = [
    '=== GP-K CHECK / ENGINEERING K AUDIT (MANDATORY) ===',
    'บทบาท: ผู้ช่วยช่างและวิศวกรรมสำหรับ “ตรวจสอบค่า K” ไม่ใช่โปรแกรมคำนวณแทนโปรแกรมของสำนักงบประมาณ',
    'ให้เริ่มจากการตรวจสิทธิ/ประเภทงาน/เงื่อนไขสัญญา แล้วจึงตรวจสูตร ตัวแปร ดัชนี และจำนวนเงิน',
    'ห้ามสรุปว่า “ไม่บดอัด = ไม่มีสิทธิ K” หรือกฎอื่นจากคำสำคัญเพียงคำเดียว ต้องเทียบ BOQ แบบ Specification สัญญา และลักษณะงานจริงกับฐานอำนาจที่ใช้บังคับ',
    'ห้าม hard-code สูตร ค่าสัมประสิทธิ์ อัตรา threshold ดัชนี หรือเงื่อนไขเฉพาะกรณีจากความจำ ตัวอย่าง หรือเอกสารเก่าโดยไม่ตรวจฉบับที่ใช้บังคับ',
    'ต้องแยก “สิทธิใช้ K” ออกจาก “คำนวณจำนวนเงิน K” และแยกทั้งสองออกจาก “ความถูกต้องของเอกสารที่หน่วยงานจัดทำ”',
    'คำนวณซ้ำโดยรักษาค่าดิบและค่าก่อนปัดเศษเท่าที่ข้อมูลรองรับ และตรวจย้อนกลับจากยอดเงินที่เอกสารระบุ',
    'ถ้าตัวเลขในเอกสารขัดกัน ให้รายงานค่าที่พบแต่ละจุดและเปิด Decision Lock ห้ามเลือกตัวเลขที่คิดว่าน่าจะถูกเอง',
    'เรื่องกฎหมาย/ระเบียบ/หลักเกณฑ์/ดัชนีที่เปลี่ยนตามเวลา ต้องค้นแหล่งทางการและตรวจฉบับที่ใช้บังคับก่อนฟันธง',
    'ผลลัพธ์ต้องมี: ข้อเท็จจริงที่ยืนยันได้ / Gate ผลตรวจ / ตารางความคลาดเคลื่อน / หลักฐานที่ยังขาด / ความเสี่ยง / ขั้นตอนที่ควรทำต่อ',
    'ถ้าหลักฐานไม่พอ ให้ระบุ “ยังสรุปไม่ได้” และบอกว่าต้องตรวจเอกสารใด ไม่สร้างคำตอบจากการคาดเดา'
  ].join('\n');

  function detect(input = '') {
    const relevant = K_AUDIT_PATTERN.test(normalize(input));
    return Object.freeze({
      relevant,
      domain: relevant ? 'engineering-k-audit' : '',
      moduleId: relevant ? 'GP007' : '',
      confidence: relevant ? 0.995 : 0,
      requiresOfficialSource: relevant,
      requiresPrimaryDocument: relevant,
      decisionLockDefault: relevant,
      searchableBeforeDecidable: relevant,
      officialSourceCandidates,
      requiredEvidence,
      gates,
      policyBlock
    });
  }

  const rulepack = Object.freeze({
    id: 'engineering-k-audit',
    version: '1.0.0',
    label: 'ผู้ช่วยช่าง — ตรวจสอบค่า K',
    detect,
    officialSourceCandidates,
    requiredEvidence,
    gates,
    policyBlock
  });

  registry[rulepack.id] = rulepack;
  app.engineeringKAuditRulePack = rulepack;

  const core = window.GovPromptCore;
  if (core && typeof core.createGovernmentPrompt === 'function' && !core.__engineeringKAuditRuntimeInstalled) {
    const originalCreate = core.createGovernmentPrompt;
    core.createGovernmentPrompt = function engineeringKAuditPromptWrapper(args = {}) {
      const question = normalize(args.question ?? args.text ?? args.facts ?? '');
      const result = originalCreate.call(this, args);
      if (!K_AUDIT_PATTERN.test(question) || !result || typeof result !== 'object') return result;
      return Object.freeze({
        ...result,
        prompt: `${result.prompt || ''}\n\n${policyBlock}`,
        engineeringKAuditControl: Object.freeze({
          id: rulepack.id,
          version: rulepack.version,
          moduleId: 'GP007',
          decisionLockDefault: true,
          officialSourceFirst: true,
          gates: gates.map(gate => gate.id)
        })
      });
    };
    core.__engineeringKAuditRuntimeInstalled = true;
    app.emit?.('engineering-k:integration-ready', { version: rulepack.version });
  }
})();