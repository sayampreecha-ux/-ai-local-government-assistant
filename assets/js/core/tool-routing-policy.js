(() => {
  'use strict';

  const FRESHNESS_TERMS = Object.freeze([
    'ล่าสุด', 'ปัจจุบัน', 'ตอนนี้', 'วันนี้', 'ฉบับใหม่', 'ฉบับล่าสุด', 'อัปเดต',
    'ยังใช้', 'ยังมีผล', 'มีผลใช้บังคับ', 'ยกเลิก', 'แก้ไขล่าสุด', 'latest', 'current'
  ]);

  const PRIMARY_SOURCE_TERMS = Object.freeze([
    'กฎหมาย', 'ระเบียบ', 'หนังสือเวียน', 'หนังสือสั่งการ', 'ข้อหารือ', 'ซักซ้อม',
    'คำพิพากษา', 'ประกาศ', 'กฎกระทรวง', 'พระราชบัญญัติ', 'พัสดุ', 'จัดซื้อ',
    'จัดจ้าง', 'tor', 'ราคากลาง', 'เบิกจ่าย', 'งบประมาณ', 'วินัย'
  ]);

  const GMAIL_TERMS = Object.freeze([
    'gmail', 'อีเมล', 'email', 'กล่องจดหมาย', 'inbox', 'เมลที่ส่ง', 'เมลที่ได้รับ',
    'จดหมายที่เคยส่ง', 'อีเมลที่เคยส่ง', 'อีเมลเดิม'
  ]);

  const DRIVE_FILE_TERMS = Object.freeze([
    'google drive', 'drive', 'ไดรฟ์', 'ไฟล์ของฉัน', 'เอกสารของฉัน', 'ไฟล์ที่เคยทำ',
    'เอกสารที่เคยทำ', 'เอกสารเดิม', 'ไฟล์เดิม', 'หาไฟล์', 'หาเอกสาร'
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function includesAny(text, terms) {
    return terms.some(term => text.includes(String(term).toLocaleLowerCase()));
  }

  function createToolRoutingPlan({ question, attachments = [] } = {}) {
    const text = normalize(question);
    const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
    const hasAttachments = files.length > 0;
    const wantsGmail = includesAny(text, GMAIL_TERMS);
    const wantsDriveFiles = includesAny(text, DRIVE_FILE_TERMS);
    const needsCurrentWeb = includesAny(text, FRESHNESS_TERMS);
    const needsPrimarySource = includesAny(text, PRIMARY_SOURCE_TERMS);

    const tools = [];
    const instructions = [];

    if (hasAttachments) {
      tools.push('attached-files');
      instructions.push('อ่านและใช้เอกสารที่ผู้ใช้แนบมาก่อน ห้ามถามซ้ำข้อมูลที่พบในเอกสาร');
    }

    if (wantsGmail) {
      tools.push('gmail');
      instructions.push('หากสภาพแวดล้อมรองรับ ให้ค้น Gmail ของบัญชีผู้ใช้เองเท่านั้น และใช้เฉพาะข้อมูลที่จำเป็นต่อคำถาม');
    }

    if (wantsDriveFiles) {
      tools.push('drive-files');
      instructions.push('หากสภาพแวดล้อมรองรับ ให้ค้น Drive/Files ของบัญชีผู้ใช้เองก่อน และอย่าสมมติว่าได้เปิดเอกสารที่ยังไม่ได้อ่าน');
    }

    if (needsCurrentWeb || needsPrimarySource) {
      tools.push('web-search');
      instructions.push('ค้นเว็บเมื่อจำเป็น โดยยึดแหล่งราชการ/ต้นฉบับก่อน ตรวจสถานะฉบับล่าสุด และห้ามฟันธงจากข้อมูลเก่าหรือแหล่งสรุปเพียงอย่างเดียว');
    }

    if (!tools.length) {
      tools.push('ai-reasoning');
      instructions.push('ใช้การวิเคราะห์/ร่าง/สรุปจากข้อมูลที่ผู้ใช้ให้ก่อน ไม่ต้องค้นเว็บโดยอัตโนมัติหากข้อมูลปัจจุบันไม่จำเป็น');
    } else {
      tools.push('ai-reasoning');
      instructions.push('หลังรวบรวมข้อมูลจากเครื่องมือที่จำเป็นแล้ว ให้ AI วิเคราะห์ สรุป หรือจัดทำผลลัพธ์พร้อมใช้ตามคำขอ');
    }

    const uniqueTools = Object.freeze([...new Set(tools)]);
    const mode = wantsGmail || wantsDriveFiles
      ? 'user-data-first'
      : (hasAttachments ? 'attachment-first' : (needsCurrentWeb || needsPrimarySource ? 'web-when-needed' : 'ai-only'));

    const reasons = [];
    if (hasAttachments) reasons.push('มีเอกสารแนบ');
    if (wantsGmail) reasons.push('คำถามอ้างถึงอีเมลของผู้ใช้');
    if (wantsDriveFiles) reasons.push('คำถามอ้างถึงไฟล์/เอกสารของผู้ใช้');
    if (needsCurrentWeb) reasons.push('ต้องตรวจข้อมูลปัจจุบัน');
    if (needsPrimarySource) reasons.push('เป็นงานที่ควรตรวจแหล่งปฐมภูมิ');
    if (!reasons.length) reasons.push('ตอบได้จากข้อมูลที่ผู้ใช้ให้และการวิเคราะห์ทั่วไป');

    return Object.freeze({
      mode,
      tools: uniqueTools,
      instructions: Object.freeze(instructions),
      reasons: Object.freeze(reasons),
      flags: Object.freeze({ hasAttachments, wantsGmail, wantsDriveFiles, needsCurrentWeb, needsPrimarySource })
    });
  }

  function formatToolRoutingInstructions(plan) {
    if (!plan?.tools?.length) return '';
    return [
      `- โหมดแนะนำ: ${plan.mode}`,
      `- ลำดับเครื่องมือ: ${plan.tools.join(' → ')}`,
      ...plan.instructions.map(item => `- ${item}`),
      '- หากเครื่องมือที่แนะนำไม่มีในสภาพแวดล้อมนี้ ให้บอกผู้ใช้ตรง ๆ และทำเฉพาะส่วนที่ทำได้ ห้ามอ้างว่าได้ค้นหรือเปิดข้อมูลแล้ว'
    ].join('\n');
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.createToolRoutingPlan = createToolRoutingPlan;
  window.GovPromptCore.formatToolRoutingInstructions = formatToolRoutingInstructions;
})();
