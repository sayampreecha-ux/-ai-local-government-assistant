const DEFAULT_STYLE = 'สวย ทันสมัย ภูมิฐาน เป็นมืออาชีพ อ่านง่าย';
const DEFAULT_SIZE = Object.freeze({ label: 'Facebook / งานประชาสัมพันธ์ทั่วไป', width: 1080, height: 1350, ratio: '4:5' });

const SIZE_RULES = Object.freeze([
  { test: /(?:facebook|เฟซบุ๊ก|fb|โพสต์)/i, value: DEFAULT_SIZE },
  { test: /(?:story|สตอรี่|reel|รีล|แนวตั้งเต็มจอ)/i, value: { label: 'Story / Reel', width: 1080, height: 1920, ratio: '9:16' } },
  { test: /(?:ปก|cover|banner|แบนเนอร์|แนวนอน)/i, value: { label: 'ภาพแนวนอน', width: 1200, height: 630, ratio: '1.91:1' } }
]);

const QUICK_ACTIONS = Object.freeze({
  'สวยขึ้น': 'ยกระดับความสวยและความกลมกลืนให้ชัดขึ้น โดยยังคงความภูมิฐาน อ่านง่าย และไม่เพิ่มข้อเท็จจริงใหม่',
  'เอาแบบภูมิฐาน': 'ปรับภาพให้ภูมิฐาน สุภาพ เรียบหรู เหมาะกับหน่วยงานราชการ ลดองค์ประกอบที่ฉูดฉาดหรือไม่จำเป็น',
  'อบอุ่นขึ้น': 'เพิ่มบรรยากาศอบอุ่น เป็นมิตร แสงนุ่มและสีที่ให้ความรู้สึกจริงใจ โดยยังคงความเป็นทางการ',
  'ลดข้อความ': 'ลดข้อความบนภาพให้เหลือเฉพาะสารสำคัญ ใช้ถ้อยคำสั้น อ่านง่าย ห้ามตัดชื่อ ตำแหน่ง วันที่ หรือตัวเลขที่จำเป็นต่อข้อเท็จจริง',
  'ทำใหม่': 'สร้างแนวทางภาพใหม่จากต้นฉบับเดิม โดยคงบุคคล เครื่องแบบ โลโก้ และข้อเท็จจริงทั้งหมด',
  'ทำสำหรับ Facebook': 'จัดองค์ประกอบสำหรับ Facebook แบบ mobile-first ขนาดแนะนำ 1080×1350 พิกเซล (4:5)',
  'ทำให้ดีที่สุด': 'ตัดสินใจด้านสไตล์ สี แสง เลย์เอาต์ และองค์ประกอบให้อัตโนมัติ เพื่อผลลัพธ์ที่สวย ภูมิฐาน เป็นมืออาชีพ และอ่านง่ายที่สุด'
});

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function recommendImageSize(request = '') {
  const text = normalize(request);
  return Object.freeze({ ...(SIZE_RULES.find(rule => rule.test.test(text))?.value || DEFAULT_SIZE) });
}

export function extractExplicitThaiText(request = '') {
  const text = normalize(request);
  const quoted = [...text.matchAll(/[“\"']([^”\"']{2,120})[”\"']/g)].map(match => normalize(match[1])).filter(Boolean);
  if (quoted.length) return quoted.join('\n');

  const marker = text.match(/(?:ข้อความ|เขียน|ใส่คำว่า|ใช้คำว่า)\s*[:：]?\s*(.+)$/i);
  if (marker?.[1]) return normalize(marker[1]).slice(0, 240);
  return '';
}

export function resolveQuickAction(request = '') {
  const text = normalize(request).toLocaleLowerCase('th-TH');
  const key = Object.keys(QUICK_ACTIONS).find(item => text === item || text.includes(item));
  return key ? QUICK_ACTIONS[key] : '';
}

export function buildCreativeImagePrompt({ request = '', fileName = '', iteration = '' } = {}) {
  const userRequest = normalize(request);
  const refinement = normalize(iteration) || resolveQuickAction(userRequest);
  const size = recommendImageSize(`${userRequest} ${refinement}`);
  const explicitText = extractExplicitThaiText(userRequest);
  const sourceName = normalize(fileName) || 'ภาพต้นฉบับที่ผู้ใช้แนบ';

  const prompt = [
    'บทบาท',
    'คุณเป็น AI Creative Assistant สำหรับงานประชาสัมพันธ์ภาครัฐและองค์กรปกครองส่วนท้องถิ่น',
    '',
    'เป้าหมาย',
    'แก้ไข/ออกแบบภาพจากภาพต้นฉบับให้พร้อมใช้งานจริง โดยให้ผู้ใช้ตัดสินใจรายละเอียดทางเทคนิคให้น้อยที่สุด',
    '',
    'ภาพต้นฉบับ',
    `- ใช้ไฟล์: ${sourceName}`,
    '- วิเคราะห์ภาพจริงก่อนออกแบบ และถือภาพต้นฉบับเป็นหลักฐานของบุคคล เครื่องแบบ โลโก้ และองค์ประกอบสำคัญ',
    '',
    'ความต้องการของผู้ใช้',
    userRequest || '[ผู้ใช้ยังไม่ได้ระบุคำสั่ง]',
    refinement ? `- การปรับเพิ่ม: ${refinement}` : '',
    '',
    'คำสั่งออกแบบ',
    `- Default style: ${DEFAULT_STYLE}`,
    '- เลือกสไตล์ สี แสง Layout ระยะห่าง ลำดับสายตา และองค์ประกอบให้อัตโนมัติ',
    '- ลดองค์ประกอบที่รกหรือแย่งสายตา และทำให้สารสำคัญเด่นขึ้น',
    '- รักษาใบหน้า รูปลักษณ์บุคคล เครื่องแบบ ตราสัญลักษณ์ โลโก้ และองค์ประกอบสำคัญจากต้นฉบับ ห้ามเปลี่ยนจนผิดบุคคลหรือผิดข้อเท็จจริง',
    '- ห้ามแต่งชื่อ ตำแหน่ง หน่วยงาน วันที่ ตัวเลข รางวัล สถานที่ หรือข้อเท็จจริงใดขึ้นเอง',
    '- ตรวจคำสะกด ความสุภาพ ความเหมาะสม และความอ่านง่ายของข้อความก่อนส่งผลลัพธ์',
    '- หากข้อความยาว ให้ย่อเฉพาะส่วนเชิงสำนวน แต่ห้ามเปลี่ยนข้อเท็จจริงสำคัญ',
    '- หลีกเลี่ยงการ render ภาษาไทยเป็นส่วนถาวรของภาพ visual หากระบบมีวิธีแยก text layer ได้',
    '- เมื่อรองรับ layer ให้สร้าง visual/background แยกจากข้อความภาษาไทยจริงและ logo/official information เพื่อให้ตรวจแก้ได้',
    `- ขนาดแนะนำ: ${size.width}×${size.height} พิกเซล (${size.ratio}) — ${size.label}`,
    '',
    'ผลลัพธ์ที่ต้องการ',
    '- ถ้าระบบรองรับ image edit/generation: ส่งภาพที่แก้ไขแล้วเป็นผลลัพธ์หลัก ไม่ต้องตอบด้วย Prompt ยาว',
    '- ถ้าระบบไม่รองรับ image edit/generation: ส่ง Prompt นี้พร้อมข้อความภาษาไทยแยกต่างหากและขนาดภาพแนะนำ',
    '- ให้มนุษย์ตรวจชื่อ ตำแหน่ง หน่วยงาน วันที่ ตัวเลข โลโก้ และข้อความภาษาไทยก่อนเผยแพร่',
    explicitText ? `- ข้อความภาษาไทยที่ผู้ใช้ระบุโดยตรง: ${explicitText}` : '- ผู้ใช้ยังไม่ได้ระบุข้อความภาษาไทยแบบยืนยันได้: ห้ามสร้างชื่อ/ตำแหน่ง/วันที่/ตัวเลขแทนผู้ใช้'
  ].filter(Boolean).join('\n');

  return Object.freeze({
    prompt,
    thaiText: explicitText,
    size,
    defaultStyle: DEFAULT_STYLE,
    capability: 'image-edit-or-fallback-prompt'
  });
}

export function detectImageCapability(scope = globalThis) {
  const adapter = scope?.GovPromptImageCapability;
  const canEdit = Boolean(adapter && typeof adapter.editImage === 'function' && adapter.enabled !== false);
  return Object.freeze({ canEdit, adapter: canEdit ? adapter : null });
}

export async function executeImageWorkflow({ file, request, iteration = '', scope = globalThis } = {}) {
  if (!file) throw new Error('IMAGE_REQUIRED');
  const bundle = buildCreativeImagePrompt({ request, fileName: file.name, iteration });
  const capability = detectImageCapability(scope);

  if (capability.canEdit) {
    try {
      const result = await capability.adapter.editImage({ file, instruction: bundle.prompt, thaiText: bundle.thaiText, size: bundle.size });
      if (result) return Object.freeze({ mode: 'direct', bundle, result });
    } catch (error) {
      return Object.freeze({ mode: 'fallback', bundle, reason: error?.message || 'IMAGE_CAPABILITY_FAILED' });
    }
  }

  return Object.freeze({ mode: 'fallback', bundle, reason: 'IMAGE_CAPABILITY_UNAVAILABLE' });
}

export const PR_IMAGE_QUICK_ACTIONS = Object.freeze(['✨ สวยขึ้น', '✍️ แก้ข้อความ', '🖼️ เปลี่ยนรูป/สไตล์', '✅ พร้อมใช้']);
