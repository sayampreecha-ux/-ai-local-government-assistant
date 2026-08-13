(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.createToolRoutingPlan !== 'function') return;

  const baseCreateToolRoutingPlan = core.createToolRoutingPlan;
  const PRIMARY_SOURCE_EXPANSION = /(?:ที\s*โอ\s*อาร์|ทีโออาร์|ขอบเขต(?:ของ)?งาน|เงินสำรองจ่าย|สมาชิกสภา|องค์ประชุม|มีส่วนได้เสีย.{0,20}ลงมติ)/i;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  core.createToolRoutingPlan = function createToolRoutingPlanWithThaiGovernmentTerms(input = {}) {
    const base = baseCreateToolRoutingPlan(input);
    const text = normalize(input.question);
    if (!PRIMARY_SOURCE_EXPANSION.test(text) || base.flags?.needsPrimarySource) return base;

    const tools = Object.freeze([...new Set([
      ...base.tools.filter(tool => tool !== 'ai-reasoning'),
      'web-search',
      'ai-reasoning'
    ])]);
    const instructions = Object.freeze([
      ...base.instructions.filter(item => !item.includes('ไม่ต้องค้นเว็บโดยอัตโนมัติ')),
      'ค้นเว็บเมื่อจำเป็น โดยยึดแหล่งราชการ/ต้นฉบับก่อน ตรวจสถานะฉบับล่าสุด และห้ามฟันธงจากข้อมูลเก่าหรือแหล่งสรุปเพียงอย่างเดียว'
    ]);
    const reasons = Object.freeze([...new Set([...(base.reasons || []), 'เป็นงานราชการที่ควรตรวจแหล่งปฐมภูมิ'])]);

    return Object.freeze({
      ...base,
      mode: base.mode === 'ai-only' ? 'web-when-needed' : base.mode,
      tools,
      instructions,
      reasons,
      flags: Object.freeze({ ...base.flags, needsPrimarySource: true })
    });
  };

  core.TOOL_ROUTING_PRIMARY_SOURCE_EXPANSION = PRIMARY_SOURCE_EXPANSION;
})();
