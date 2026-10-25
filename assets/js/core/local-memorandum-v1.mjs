// Zero-network memorandum draft contract. No AI calls, no legal assertions.
export const PLACEHOLDER = '[รอตรวจสอบ]';
const trim = value => String(value ?? '').trim();
const field = (text, label) => {
  const escaped = label.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp('(?:^|\\n)\\s*' + escaped + '\\s*[:：]\\s*([^\\n]{1,500})', 'im'));
  return trim(match?.[1]) || PLACEHOLDER;
};
export function makeLocalMemoDraft(input) {
  const source = trim(input);
  if (!source || source.length > 12000) throw new Error('กรุณาระบุข้อความไม่เกิน 12,000 ตัวอักษร');
  if (!/บันทึกข้อความ/.test(source)) throw new Error('รองรับเฉพาะการร่างบันทึกข้อความใน V1');
  const required = ['ส่วนราชการ','ที่','วันที่','เรื่อง','เรียน'];
  const values = Object.fromEntries(required.map(name => [name, field(source, name)]));
  const missing = required.filter(name => values[name] === PLACEHOLDER);
  const body = field(source, 'ข้อเท็จจริง');
  if (body === PLACEHOLDER) missing.push('ข้อเท็จจริง');
  const hasClaim = /(?:ได้รับอนุมัติแล้ว|ได้ตรวจสอบกฎหมายแล้ว|ได้ตรวจรับแล้ว)/.test(source);
  if (hasClaim) throw new Error('พบข้อความกล่าวอ้างการอนุมัติ/ตรวจสอบแล้ว ต้องตรวจหลักฐานก่อน');
  const review = 'ร่างจากข้อมูลที่ผู้ใช้ป้อน ยังไม่ได้ตรวจรับข้อเท็จจริงหรือฐานกฎหมาย และยังไม่ได้รับอนุมัติ';
  return {
    title: 'บันทึกข้อความ (ร่างเพื่อเจ้าหน้าที่ตรวจทาน)',
    summary: review,
    sections: [
      { heading: 'ข้อมูลหนังสือ', paragraphs: required.map(name => name + '  ' + values[name]), bullets: [] },
      { heading: 'ข้อเท็จจริง', paragraphs: [body], bullets: [] },
      { heading: 'ข้อพิจารณา', paragraphs: [field(source, 'ข้อพิจารณา')], bullets: [] },
      { heading: 'ข้อเสนอ', paragraphs: [field(source, 'ข้อเสนอ')], bullets: [] },
      { heading: 'รายการตรวจสอบก่อนลงนาม', paragraphs: [review], bullets: missing.map(name => name + ': ' + PLACEHOLDER) }
    ],
    actionItems: [], slides: [], missing, reviewRequired: true
  };
}
