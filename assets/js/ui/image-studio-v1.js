const IMAGE_CREATIVE_INTENT = /(?:(?:ทำ|สร้าง|ออกแบบ|จัดทำ|ปรับ|แต่ง|รีดีไซน์).{0,24}(?:ภาพ|รูป|โปสเตอร์|การ์ด|อินโฟกราฟิก)|(?:ภาพ|รูป|โปสเตอร์|การ์ด).{0,28}(?:ประชาสัมพันธ์|เกษียณ|ยินดี|ต้อนรับ|เชิดชู|วันสำคัญ|รับสมัคร|เชิญ|ให้สวย|สวยที่สุด|ภูมิฐาน|อบอุ่น|ทางการ))/i;
const FINANCE_DECISION = /(?:เบิก|เบิกจ่าย|ค่าใช้จ่าย|จ่าย|ใช้เงิน|ใช้งบ).{0,80}(?:ได้ไหม|ได้หรือไม่|ได้มั้ย|หรือไม่)/i;
const IMAGE_FILE = /(?:image\/|\.(?:png|jpe?g|webp|heic|heif|gif)$)/i;

let installed = false;
let imageStudioActive = false;
let pendingImageResult = false;
let lastImageFiles = [];

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
    '- รักษาใบหน้า รูปลักษณ์ บุคคล เครื่องแบบ ตรา/โลโก้ และองค์ประกอบสำคัญจากต้นฉบับ ห้ามเปลี่ยนสาระโดยไม่มีเหตุผล',
    '- ห้ามแต่งชื่อ ตำแหน่ง หน่วยงาน วันที่ ตัวเลข สถานที่ หรือข้อเท็จจริงที่ผู้ใช้ไม่ได้ให้',
    '- ตรวจคำสะกด โดยเฉพาะชื่อ ตำแหน่ง วันที่ และข้อมูลราชการ ก่อนส่งงาน',
    '- งานเกษียณ: อบอุ่น สง่างาม ให้เกียรติ มองไปข้างหน้า ไม่เศร้าและไม่อวยเกินจริง',
    '- หากไม่ได้ระบุขนาด ให้เลือกขนาดที่เหมาะกับช่องทางหลักเอง; งานโพสต์ทั่วไปเริ่มจาก 4:5 เมื่อเหมาะสม',
    '',
    'การสร้างภาพ',
    '- ถ้า AI มีเครื่องมือสร้าง/แก้ไขภาพ ให้ใช้เครื่องมือนั้นทันทีและส่งภาพเป็นผลลัพธ์หลัก ไม่ตอบด้วย JSON หรือพารามิเตอร์เครื่องมือ',
    '- ถ้ามีภาพต้นฉบับ ให้แก้จากภาพนั้นแทนการสร้างบุคคลใหม่ เพื่อรักษาเอกลักษณ์เดิม',
    '- ถ้าการสร้างตัวอักษรไทยในภาพเสี่ยงผิด ให้สร้าง Visual/Background ก่อน แล้วแยก “ข้อความภาษาไทยจริงสำหรับวางทับ” ออกมาอย่างชัดเจน',
    '- ถ้า AI ไม่มีเครื่องมือสร้างภาพ ห้ามอ้างว่าสร้างแล้ว ให้ส่ง Prompt สำหรับ Image AI + ข้อความไทยจริง + ขนาดที่แนะนำแทน',
    '- หาก AI ปลายทางไม่ได้รับไฟล์ภาพจาก GovPrompt ให้แจ้งสั้น ๆ ให้แนบภาพต้นฉบับเดิมใน AI ปลายทางก่อนใช้คำสั่งนี้',
    '',
    'UX',
    '- ถ้าข้อมูลพอ ให้ทำทันที ไม่ถาม Font, Color, Layout, Aspect Ratio หรือ Prompt Style ที่ AI ตัดสินใจแทนได้',
    '- รองรับคำสั่งสั้น ๆ เช่น “สวยขึ้น”, “ทางการขึ้น”, “อบอุ่นขึ้น”, “ลดข้อความ”, “เปลี่ยนสไตล์”, “ทำสำหรับ Facebook”, “ทำให้ดีที่สุด”',
    '- บอกงานครั้งเดียว → AI จัดรายละเอียด → ผู้ใช้ตรวจเฉพาะจุดสำคัญ'
  ].join('\n');
}

function installPromptEnhancer(core) {
  if (core.__IMAGE_STUDIO_PROMPT_V1__) return true;
  if (typeof core.createGovernmentPrompt !== 'function') return false;
  const baseCreate = core.createGovernmentPrompt;
  core.createGovernmentPrompt = function createGovernmentPromptWithImageStudio(options = {}) {
    const bundle = baseCreate(options);
    if (!isImageCreativeIntent(options.question)) return bundle;
    imageStudioActive = true;
    pendingImageResult = true;
    if (typeof document !== 'undefined') document.documentElement.dataset.gpImageStudio = 'active';
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

function ensureStyle() {
  if (document.getElementById('gpImageStudioStyle')) return;
  const style = document.createElement('style');
  style.id = 'gpImageStudioStyle';
  style.textContent = '#imageStudioQuickAction{border-color:#b8cfc3;background:#f5faf7}#imageStudioQuickAction[aria-pressed="true"]{background:#12372a;color:#fff;border-color:#12372a}.image-studio-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px;padding-top:10px;border-top:1px solid #e2e8e5}.image-studio-actions button{border:1px solid #cbd8d2;background:#fff;color:#12372a;border-radius:999px;padding:7px 11px;font:inherit;font-weight:700;cursor:pointer}.image-studio-actions button:hover,.image-studio-actions button:focus-visible{background:#f1f7f4;outline:2px solid #12372a;outline-offset:1px}@media(max-width:620px){#imageStudioQuickAction{flex:1 1 auto}.image-studio-actions{gap:6px}.image-studio-actions button{padding:7px 9px;font-size:.86rem}}';
  document.head.append(style);
}

function setPrompt(text = 'ทำภาพประชาสัมพันธ์จากภาพที่แนบให้สวยที่สุด') {
  const input = document.getElementById('promptInput');
  if (!input) return;
  imageStudioActive = true;
  document.documentElement.dataset.gpImageStudio = 'active';
  document.getElementById('imageStudioQuickAction')?.setAttribute('aria-pressed', 'true');
  input.value = text;
  input.placeholder = 'เช่น ทำภาพเกษียณให้สวยที่สุด อบอุ่น ภูมิฐาน';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function openPicker() {
  const picker = document.getElementById('attachmentInput');
  if (!picker) return;
  const oldAccept = picker.getAttribute('accept');
  picker.setAttribute('accept', 'image/*');
  picker.addEventListener('change', () => {
    if (oldAccept === null) picker.removeAttribute('accept');
    else picker.setAttribute('accept', oldAccept);
  }, { once: true });
  picker.click();
}

function installEntry() {
  const quickActions = document.querySelector('.quick-actions');
  if (!quickActions || document.getElementById('imageStudioQuickAction')) return;
  ensureStyle();
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'imageStudioQuickAction';
  button.textContent = '🎨 ทำภาพประชาสัมพันธ์';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', 'แนบรูปแล้วให้ GovPrompt ช่วยทำภาพประชาสัมพันธ์');
  button.addEventListener('click', () => {
    setPrompt();
    window.GovPrompt?.toast?.('🎨 แนบรูป → บอกสั้น ๆ ว่าอยากได้แบบไหน → กดส่ง');
    openPicker();
  });
  quickActions.append(button);
}

function captureFiles(fileList) {
  const images = Array.from(fileList || []).filter(file => IMAGE_FILE.test(`${file.type || ''} ${file.name || ''}`));
  if (!images.length) return;
  lastImageFiles = images.slice(0, 5);
  if (!imageStudioActive) return;
  setTimeout(() => {
    const status = document.getElementById('attachmentStatus');
    if (status) status.textContent = `แนบภาพแล้ว ${lastImageFiles.length} ภาพ · บอกสั้น ๆ ว่าอยากได้แบบไหน แล้วกดส่ง`;
  }, 0);
}

function installFileCapture() {
  ['attachmentInput', 'cameraInput'].forEach(id => {
    const input = document.getElementById(id);
    if (!input || input.dataset.gpImageCapture === '1') return;
    input.dataset.gpImageCapture = '1';
    input.addEventListener('change', () => captureFiles(input.files));
  });
}

function restoreImages() {
  if (!lastImageFiles.length || typeof DataTransfer !== 'function') return false;
  const input = document.getElementById('attachmentInput');
  if (!input) return false;
  try {
    const transfer = new DataTransfer();
    lastImageFiles.forEach(file => transfer.items.add(file));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  } catch { return false; }
}

function canShareFiles() {
  if (!lastImageFiles.length || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
  try { return navigator.canShare({ files: lastImageFiles }); } catch { return false; }
}

function enhanceResult(article) {
  if (!article || article.dataset.gpImageEnhanced === '1') return;
  const section = article.querySelector('.answer-section');
  if (!section) return;
  article.dataset.gpImageEnhanced = '1';
  const heading = section.querySelector('h3');
  const paragraphs = section.querySelectorAll(':scope > p');
  const actions = section.querySelector('.answer-actions');
  const preview = section.querySelector('details pre');
  if (heading) heading.textContent = 'คำสั่งทำภาพพร้อมแล้ว — ส่งต่อ AI สร้างภาพได้ทันที';
  if (paragraphs[0]) paragraphs[0].textContent = 'GP จัดแนวภาพ ข้อความ และข้อควรรักษาจากต้นฉบับให้แล้ว โดยไม่ต้องเขียน Prompt เอง';
  if (paragraphs[1]) paragraphs[1].textContent = lastImageFiles.length
    ? '✅ มีภาพต้นฉบับพร้อมใช้ · บนมือถือกด “ส่งภาพ + คำสั่ง” หากเครื่องรองรับ หรือเปิด ChatGPT แล้วแนบภาพเดิมก่อนส่งคำสั่ง'
    : 'ℹ️ ยังไม่พบภาพต้นฉบับ · แนบภาพได้หากต้องการให้ AI แก้จากต้นฉบับ';

  if (actions) {
    const buttons = actions.querySelectorAll('button');
    if (buttons[0]) buttons[0].textContent = 'เปิด ChatGPT เพื่อสร้างภาพ';
    if (buttons[1]) buttons[1].textContent = 'คัดลอกคำสั่งสร้างภาพ';
    if (canShareFiles() && preview) {
      const share = document.createElement('button');
      share.type = 'button';
      share.textContent = 'ส่งภาพ + คำสั่ง';
      share.addEventListener('click', async () => {
        try {
          await navigator.share({ files: lastImageFiles, text: preview.textContent || '', title: 'GovPrompt — ทำภาพประชาสัมพันธ์' });
        } catch (error) {
          if (error?.name !== 'AbortError') window.GovPrompt?.toast?.('แชร์ตรงยังไม่สำเร็จ — เปิด ChatGPT แล้วแนบภาพเดิมได้');
        }
      });
      actions.prepend(share);
    }
  }

  const quick = document.createElement('div');
  quick.className = 'image-studio-actions';
  [
    ['✨ สวยขึ้น', 'ทำภาพประชาสัมพันธ์จากภาพเดิมให้สวยขึ้นอีก โดยคงข้อเท็จจริงและบุคคลเดิม'],
    ['✍️ แก้ข้อความ', 'แก้ข้อความบนภาพประชาสัมพันธ์เป็น: '],
    ['🖼️ เปลี่ยนสไตล์', 'เปลี่ยนสไตล์ภาพประชาสัมพันธ์เป็น: ']
  ].forEach(([label, command]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      setPrompt(command);
      if (!restoreImages() && lastImageFiles.length) window.GovPrompt?.toast?.('เบราว์เซอร์นี้อาจขอให้แนบภาพเดิมอีกครั้ง');
    });
    quick.append(button);
  });
  const ready = document.createElement('button');
  ready.type = 'button';
  ready.textContent = '✅ พร้อมใช้';
  ready.addEventListener('click', () => window.GovPrompt?.toast?.('ตรวจชื่อ ตำแหน่ง วันที่ และข้อความไทยบนภาพอีกครั้งก่อนเผยแพร่'));
  quick.append(ready);
  section.append(quick);
}

function installResultObserver() {
  const conversation = document.getElementById('conversation');
  if (!conversation || conversation.dataset.gpImageObserver === '1') return;
  conversation.dataset.gpImageObserver = '1';
  new MutationObserver(records => {
    if (!pendingImageResult) return;
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement) || !node.matches('article.message.assistant') || !node.querySelector('.answer-card')) continue;
        enhanceResult(node);
        pendingImageResult = false;
        return;
      }
    }
  }).observe(conversation, { childList: true });
}

function installUi() {
  if (typeof document === 'undefined') return;
  installEntry();
  installFileCapture();
  installResultObserver();
}

export function installImageStudio(core = window.GovPromptCore) {
  if (!core || installed) return false;
  installed = true;
  installRouting(core);
  core.isImageCreativeIntent = isImageCreativeIntent;
  core.IMAGE_CREATIVE_MODE = Object.freeze({
    version: '1.0',
    moduleId: 'GP012',
    intentPattern: IMAGE_CREATIVE_INTENT,
    defaultPrompt: 'ทำภาพประชาสัมพันธ์จากภาพที่แนบให้สวยที่สุด'
  });
  installUi();
  if (!installPromptEnhancer(core) && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => installPromptEnhancer(core), { once: true });
  }
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', installUi, { once: true });
  }
  return true;
}

if (typeof window !== 'undefined' && window.GovPromptCore) installImageStudio(window.GovPromptCore);
