(() => {
  'use strict';

  function listOrFallback(items, fallback = '[ยังไม่ได้ระบุ]') {
    return Array.isArray(items) && items.length ? items.join(', ') : fallback;
  }

  function composeGovernancePrompt({ role, task, context, routing, quality, domainPrompt = '' }) {
    const contextText = window.GovPromptCore?.contextToText
      ? window.GovPromptCore.contextToText(context)
      : '';

    return [
      'บทบาท',
      role || 'คุณเป็น Government AI Copilot สำหรับองค์กรปกครองส่วนท้องถิ่น',
      '',
      'ภารกิจ',
      task || '[ยังไม่ได้ระบุ]',
      '',
      contextText,
      '',
      'เส้นทางงานที่ระบบจำแนก',
      `- Routes: ${listOrFallback(routing?.routes)}`,
      `- Flags: ${listOrFallback(routing?.flags, '[ไม่มี]')}`,
      `- ข้อมูลแกนกลางที่ยังขาด: ${listOrFallback(routing?.missingCoreFacts, '[ไม่มี]')}`,
      '',
      'GOVERNANCE QUALITY GATE',
      `- ระดับ: ${quality?.level || '[ยังไม่ได้ประเมิน]'}`,
      `- ข้อสรุปการใช้งาน: ${quality?.decisionLabel || '[ยังไม่ได้ประเมิน]'}`,
      `- Blockers: ${listOrFallback(quality?.blockers, '[ไม่มี]')}`,
      `- Warnings: ${listOrFallback(quality?.warnings, '[ไม่มี]')}`,
      '',
      'ข้อกำหนดการวิเคราะห์',
      '- เริ่มจากประเภท อปท. เขตอำนาจ ฐานอำนาจ และผู้มีอำนาจก่อนพิจารณาแผน งบ หรือการเบิกจ่าย',
      '- แยกเรื่องที่เป็นพัสดุออกจากรายจ่ายตามสิทธิ เงินยืม เงินอุดหนุน รายได้ เงินรับฝาก และคำสั่งทางปกครอง',
      '- วิเคราะห์ต้นน้ำ ขั้นดำเนินการ และปลายน้ำจนถึงบัญชี ทรัพย์สิน การติดตาม และการตรวจสอบ',
      '- ห้ามสมมติชื่อบุคคล วันที่ เลขหนังสือ เลขมาตรา วงเงิน คำพิพากษา หรือผลสำเร็จ',
      '- เมื่อข้อมูลไม่ครบ ให้ระบุ [ต้องตรวจสอบ/เพิ่มเติม] และตอบแบบมีเงื่อนไขเท่าที่ทำได้',
      '- ตรวจ PDPA ข้อมูลข่าวสาร ความลับราชการ ผลประโยชน์ทับซ้อน และหลักฐานตรวจสอบย้อนกลับ',
      '- ระบุระดับ Human Review: ใช้ได้หลังตรวจทาน / ต้องผู้เชี่ยวชาญตรวจ / ควรหยุดดำเนินการ',
      domainPrompt ? `\nข้อกำหนดเฉพาะด้าน\n${domainPrompt}` : '',
      '',
      'รูปแบบผลลัพธ์',
      '1. ข้อสรุปทันที',
      '2. เส้นทางงานที่เลือกและเหตุผล',
      '3. ข้อเท็จจริงและข้อมูลที่ขาด',
      '4. ฐานอำนาจและผู้มีอำนาจ',
      '5. ขั้นตอนก่อน ระหว่าง และหลังดำเนินการ',
      '6. เอกสารและหลักฐาน',
      '7. ความเสี่ยงและทางแก้',
      '8. สิ่งที่ต้องตรวจสอบฉบับล่าสุดก่อนใช้จริง'
    ].filter(Boolean).join('\n');
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.composeGovernancePrompt = composeGovernancePrompt;
})();