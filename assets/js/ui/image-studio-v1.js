const IMAGE_CREATIVE_INTENT = /(?:(?:ทำ|สร้าง|ออกแบบ|จัดทำ|ปรับ|แต่ง|รีดีไซน์).{0,24}(?:ภาพ|รูป|โปสเตอร์|การ์ด|อินโฟกราฟิก)|(?:ภาพ|รูป|โปสเตอร์|การ์ด).{0,28}(?:ประชาสัมพันธ์|เกษียณ|ยินดี|ต้อนรับ|เชิดชู|วันสำคัญ|รับสมัคร|เชิญ|ให้สวย|สวยที่สุด|ภูมิฐาน|อบอุ่น|ทางการ))/i;
const FINANCE_DECISION = /(?:เบิก|เบิกจ่าย|ค่าใช้จ่าย|จ่าย|ใช้เงิน|ใช้งบ).{0,80}(?:ได้ไหม|ได้หรือไม่|ได้มั้ย|หรือไม่)/i;
const IMAGE_FILE = /(?:image\/|\.(?:png|jpe?g|webp|heic|heif|gif)$)/i;

let installed = false;

function normalize(value) {
  return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

export function isImageCreativeIntent(value) {
  const source = normalize(value);
  return Boolean(source && !FINANCE_DECISION.test(source) && IMAGE_CREATIVE_INTENT.test(source));
}

function correctRoute(core, base, reason) {
  if (!base || base.primaryModule === 'GP012' || base.moduleId === 'GP012') return base;
  const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === 'GP012');
  const modules = Object.freeze([...new Set(['GP012', base.primaryModule, ...(base.modules || [])].filter(Boolean))].slice(0, 3));
  return Object.freeze({
    ...base,
    primaryModule: 'GP012',
    moduleId: 'GP012',
    transactionType: assistant?.transactionTypes?.[0] || 'public-relations',
    assistant: assistant || base.assistant,
    modules,
    confidence: 0.995,
    fallback: false,
    ambiguous: false,
    reason
  });
}

function installRouting(core) {
  if (core.__IMAGE_STUDIO_ROUTING_V1__) return;
  const baseRequest = typeof core.routeRequest === 'function' ? core.routeRequest : null;
  const baseTransaction = typeof core.routeTransaction === 'function' ? core.routeTransaction : null;
  if (baseRequest) {
    core.routeRequest = function routeRequestWithImageStudio(request, options = {}) {
      const base = baseRequest(request, options);
      return isImageCreativeIntent(request) ? correctRoute(core, base, 'image-studio:public-relations') : base;
    };
  }
  if (baseTransaction) {
    core.routeTransaction = function routeTransactionWithImageStudio(context, options = {}) {
      const base = baseTransaction(context, options);
      const source = [context?.facts, context?.desiredOutput, context?.documents, context?.currentStage].filter(Boolean).join(' ');
      return isImageCreativeIntent(source) ? correctRoute(core, base, 'image-studio:public-relations') : base;
    };
  }
  core.__IMAGE_STUDIO_ROUTING_V1__ = true;
}

function buildCreativeBlock(question, attachments = []) {
  const hasImage = attachments.some(item => IMAGE_FILE.test(`${item?.type || ''} ${item?.name || item || ''}`));
  return [
    'GOVPROMPT — IMAGE CREATIVE MODE',
    'เป้าหมาย: ทำภาพประชาสัมพันธ์ให้สวย ใช้งานได้จริง และง่ายที่สุด โดยผู้ใช้ไม่ต้องรู้ Prompt หรือหลักการออกแบบ',
    `คำขอ: ${String(question || '').trim()}`,
    `ภาพต้นฉบับ: ${hasImage ? 'มีภาพแนบใน GovPrompt' : 'ยังไม่พบภาพแนบที่ยืนยันได้'}`,
    '',
    'หลักการออกแบบ',
    '- วิเคราะห์เจตนาและภาพต้นฉบับ แล้วเลือก Layout สี แสง พื้นหลัง Typography และสไตล์ที่เหมาะสมให้อัตโนมัติ',
    '- Default: สวยทันสมัย ภูมิฐาน เป็นมืออาชีพ อ่านง่าย เหมาะกับงานราชการไทย และไม่รก',
    '- รักษาใบหน้า รูปลักษณ์ บุคคล เครื่องแบบ ตรา/โลโก้ และองค์ประกอบสำคัญจากต้นฉบับ',
    '- ห้ามแต่งชื่อ ตำแหน่ง หน่วยงาน วันที่ ตัวเลข สถานที่ หรือข้อเท็จจริงที่ผู้ใช้ไม่ได้ให้',
    '- ตรวจคำสะกด โดยเฉพาะชื่อ ตำแหน่ง วันที่ และข้อมูลราชการ ก่อนส่งงาน',
    '- ถ้า AI มีเครื่องมือสร้าง/แก้ไขภาพ ให้ใช้เครื่องมือนั้นทันทีและส่งภาพเป็นผลลัพธ์หลัก',
    '- ถ้าไม่มีเครื่องมือสร้างภาพ ให้ส่ง Prompt พร้อมใช้ + ข้อความไทยจริง + ขนาดที่แนะนำ และห้ามอ้างว่าสร้างภาพแล้ว',
    '- ถ้าข้อมูลพอ ให้ทำทันที ไม่ถาม Font, Color, Layout, Aspect Ratio หรือ Prompt Style ที่ AI ตัดสินใจแทนได้'
  ].join('\n');
}

function installPromptEnhancer(core) {
  if (core.__IMAGE_STUDIO_PROMPT_V1__) return true;
  if (typeof core.createGovernmentPrompt !== 'function') return false;
  const baseCreate = core.createGovernmentPrompt;
  core.createGovernmentPrompt = function createGovernmentPromptWithImageStudio(options = {}) {
    const bundle = baseCreate(options);
    if (!isImageCreativeIntent(options.question)) return bundle;
    return Object.freeze({
      ...bundle,
      prompt: `${bundle.prompt}\n\n${buildCreativeBlock(options.question, Array.isArray(options.attachments) ? options.attachments : [])}`,
      prMode: true,
      imageCreativeMode: true
    });
  };
  core.__IMAGE_STUDIO_PROMPT_V1__ = true;
  return true;
}

export function installImageStudio(core = window.GovPromptCore) {
  if (!core || installed) return false;
  installed = true;
  installRouting(core);
  core.isImageCreativeIntent = isImageCreativeIntent;
  core.IMAGE_CREATIVE_MODE = Object.freeze({
    version: '1.1',
    moduleId: 'GP012',
    intentPattern: IMAGE_CREATIVE_INTENT,
    defaultPrompt: 'ทำภาพประชาสัมพันธ์จากภาพที่แนบให้สวยที่สุด',
    homepageEntry: false
  });
  if (!installPromptEnhancer(core) && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => installPromptEnhancer(core), { once: true });
  }
  return true;
}

if (typeof window !== 'undefined' && window.GovPromptCore) installImageStudio(window.GovPromptCore);
