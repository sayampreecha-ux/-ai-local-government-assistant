// GovPrompt Thailand v1.5 — Public Prompt Registry
// Contains public metadata only. Prompt Master remains server-side.
(function buildPublicRegistry(){
  const catalog = Array.isArray(window.GOVPROMPT_CATALOG) ? window.GOVPROMPT_CATALOG : [];
  const normalize = value => String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ก-๙]+/g, ' ')
    .trim();

  function categoryOf(tool){
    const text = normalize(`${tool.groupName || ''} ${tool.name || ''} ${tool.desc || ''}`);
    if (/ข่าว|ประชาสัมพันธ์|สื่อ|คำกล่าว/.test(text)) return 'ประชาสัมพันธ์';
    if (/กฎหมาย|หารือ|อุทธรณ์|วินัย|คดี|คำสั่ง/.test(text)) return 'กฎหมายและคำสั่ง';
    if (/tor|จัดซื้อ|จัดจ้าง|พัสดุ|สัญญา|ตรวจรับ/.test(text)) return 'พัสดุและโครงการ';
    if (/บุคคล|พนักงาน|แต่งตั้ง|ประเมิน/.test(text)) return 'งานบุคคล';
    if (/งบประมาณ|แผน|ยุทธศาสตร์|โครงการ/.test(text)) return 'แผนและงบประมาณ';
    if (/สาธารณสุข|รพ.สต|สุขภาพ/.test(text)) return 'สาธารณสุข';
    if (/กองช่าง|ถนน|อาคาร|ก่อสร้าง|ช่าง/.test(text)) return 'กองช่าง';
    return 'หนังสือและงานทั่วไป';
  }

  window.GOVPROMPT_REGISTRY = catalog.map((tool, index) => ({
    id: tool.id,
    code: tool.code,
    title: tool.name,
    description: tool.desc || '',
    category: categoryOf(tool),
    groupCode: tool.groupCode || '',
    groupName: tool.groupName || '',
    icon: tool.icon || '📌',
    version: '1.0',
    status: 'active',
    publicFree: index < 20,
    fields: Array.isArray(tool.formFields) ? tool.formFields.map(field => ({
      id: field.id,
      label: field.label,
      type: field.type || 'text',
      required: Boolean(field.required),
      placeholder: field.placeholder || ''
    })) : [],
    searchText: normalize(`${tool.code} ${tool.name} ${tool.desc || ''} ${tool.groupName || ''} ${categoryOf(tool)}`)
  }));
  window.GOVPROMPT_NORMALIZE = normalize;
})();
