const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

const tools = Array.isArray(window.GOVPROMPT_CATALOG) ? window.GOVPROMPT_CATALOG : [];

const toolIds = tools.map(t => t.id);
const fallbackPackages = [
  {id:'starter-222',name:'Starter 222',priceThb:222,description:'เครื่องมือพื้นฐานสำหรับงานประจำ',maxUses:60,expiryDays:180,allowedTools:toolIds.slice(0,40)},
  {id:'professional-599',name:'Professional 599',priceThb:599,description:'เครื่องมือครอบคลุมงานบริหารและงานวิชาชีพ',maxUses:250,expiryDays:365,allowedTools:toolIds.slice(0,140)},
  {id:'agency-999',name:'Agency 999',priceThb:999,description:'คลังเครื่องมือครบ 222 รายการสำหรับหน่วยงาน',maxUses:800,expiryDays:365,allowedTools:toolIds}
];

function selectedTool() {
  return tools.find(t => t.id === document.querySelector('#toolSelect')?.value) || tools[0];
}

function fieldsFor(toolId) {
  return tools.find(t => t.id === toolId)?.formFields || [];
}


const state = {
  packages: fallbackPackages,
  token: sessionStorage.getItem('gpToken') || '',
  member: JSON.parse(sessionStorage.getItem('gpMember') || 'null'),
  result: '',
  payment: JSON.parse(sessionStorage.getItem('gpPayment') || 'null'),
  config: { salesEnabled: false, readyForSales: false, aiMode: 'demo' }
};

const toolGrid = document.querySelector('#toolGrid');
const groupedTools = tools.reduce((map, tool) => {
  if (!map.has(tool.groupCode)) map.set(tool.groupCode, {name:tool.groupName, items:[]});
  map.get(tool.groupCode).items.push(tool);
  return map;
}, new Map());
for (const [groupCode, group] of groupedTools) {
  toolGrid.insertAdjacentHTML('beforeend', `<div class="tool-group-title"><span>${escapeHtml(groupCode)}</span><h3>${escapeHtml(group.name)}</h3><small>${group.items.length} เครื่องมือ</small></div>`);
  group.items.forEach(t => toolGrid.insertAdjacentHTML('beforeend', `<article class="tool-card"><div class="tool-icon">${t.icon}</div><span class="pill">${escapeHtml(t.code)} • ผ่านการตรวจ</span><h3>${escapeHtml(`${t.code} — ${t.name}`)}</h3><p>${escapeHtml(t.desc)}</p></article>`));
}
const previewTool = document.querySelector('#previewTool');
tools.forEach(t => previewTool.add(new Option(`${t.code} — ${t.name}`, t.id)));
function updatePreview(){ const t=tools.find(x=>x.id===previewTool.value); document.querySelector('#previewOutput').textContent=t.preview; }
previewTool.addEventListener('change', updatePreview); updatePreview();

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'ระบบขัดข้อง');
  return data;
}


async function loadPublicConfig() {
  if (window.GOVPROMPT_STATIC_GITHUB) {
    state.config = { salesEnabled: false, readyForSales: false, aiMode: 'static-preview' };
  } else {
    try {
      state.config = await api('/api/public-config');
    } catch (error) {
      console.warn('public config unavailable', error);
    }
  }
  const banner = document.querySelector('#systemBanner');
  const orderButton = document.querySelector('#orderBtn');
  const buyButtons = document.querySelectorAll('[data-buy]');
  if (!state.config.salesEnabled) {
    banner.classList.remove('hidden');
    banner.classList.add('success');
    banner.textContent = '✅ เปิดให้ใช้ฟรี 20 Prompt โดยไม่ต้องสมัครสมาชิก • ระบบสมาชิกและแพ็กเกจเต็มจะเปิดในระยะถัดไป';
    orderButton.disabled = true;
    orderButton.textContent = 'ยังไม่เปิดรับคำสั่งซื้อ';
    buyButtons.forEach(button => { button.disabled = true; });
  } else if (!state.config.readyForSales) {
    banner.classList.remove('hidden');
    banner.textContent = '⚠️ เปิดรับคำสั่งซื้อแล้ว แต่การตั้งค่าฐานข้อมูลหรือข้อมูลชำระเงินยังไม่ครบ';
  } else {
    banner.classList.remove('hidden');
    banner.classList.add('success');
    banner.textContent = '✅ ระบบเปิดรับคำสั่งซื้อแล้ว • คลัง Prompt 222 รายการสร้าง Prompt พร้อมคัดลอกโดยไม่เรียก AI API';
  }
}

async function loadPackages() {
  try {
    if (window.GOVPROMPT_STATIC_GITHUB) throw new Error('static hosting');
    const data = await api('/api/packages');
    if (data.packages?.length) state.packages = data.packages;
  } catch (error) {
    console.warn('using package fallback', error);
  }
  renderPackages();
}

function packageFeatures(pkg) {
  const names = (pkg.allowedTools || []).map(id => tools.find(t => t.id === id)?.name).filter(Boolean);
  return names.slice(0, 4).map(name => `<li>${escapeHtml(name)}</li>`).join('') + (names.length > 4 ? `<li>และอีก ${names.length - 4} เครื่องมือ</li>` : '');
}

function renderPackages() {
  const grid = document.querySelector('#packageGrid');
  grid.innerHTML = state.packages.map((pkg, index) => `
    <article class="package-card ${index===1?'featured':''}">
      ${index===1?'<div class="popular">แนะนำ</div>':''}
      <span class="package-name">${escapeHtml(pkg.name)}</span>
      <div class="package-price"><strong>${Number(pkg.priceThb).toLocaleString('th-TH')}</strong><span>บาท</span></div>
      <p>${escapeHtml(pkg.description)}</p>
      <ul><li>ใช้ได้ ${Number(pkg.maxUses).toLocaleString('th-TH')} ครั้ง</li><li>อายุสิทธิ์ ${Number(pkg.expiryDays).toLocaleString('th-TH')} วัน</li>${packageFeatures(pkg)}</ul>
      <button class="btn ${index===1?'primary':'secondary'} full" data-buy="${escapeHtml(pkg.id)}">เลือกแพ็กเกจนี้</button>
    </article>`).join('');
  const select = document.querySelector('#packageId');
  select.innerHTML = state.packages.map(pkg => `<option value="${escapeHtml(pkg.id)}">${escapeHtml(pkg.name)} — ${Number(pkg.priceThb).toLocaleString('th-TH')} บาท</option>`).join('');
  document.querySelectorAll('[data-buy]').forEach(btn => btn.onclick = () => {
    select.value = btn.dataset.buy;
    document.querySelector('#order').scrollIntoView({behavior:'smooth'});
  });
}

const dialog = document.querySelector('#loginDialog');
document.querySelectorAll('[data-open-login]').forEach(button => button.addEventListener('click', () => dialog.showModal()));

async function login(code) {
  if (window.GOVPROMPT_STATIC_GITHUB) throw new Error('ระบบสมาชิกยังไม่เปิดใช้งานบน GitHub Pages');
  return api('/api/auth', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({code})});
}

function memberLabel(member, remaining = member.remainingUses) {
  const remain = Number.isInteger(remaining) ? ` • คงเหลือ ${remaining} ครั้ง` : '';
  const expiry = member.expiresAt ? ` • หมดอายุ ${new Date(member.expiresAt).toLocaleDateString('th-TH')}` : '';
  return `ผู้ใช้: ${member.ownerName} • ${member.packageName || 'แพ็กเกจสมาชิก'} • เลขคำสั่งซื้อ ${member.orderId}${remain}${expiry}`;
}

function populateMemberTools() {
  const select = document.querySelector('#toolSelect');
  const rawAllowed = Array.isArray(state.member?.allowedTools) ? state.member.allowedTools : [];
  let allowed = state.member?.master ? toolIds : rawAllowed.filter(id => toolIds.includes(id));
  if (!allowed.length) {
    const packageName = String(state.member?.packageName || '').toLowerCase();
    allowed = packageName.includes('starter') ? toolIds.slice(0,40) : packageName.includes('professional') ? toolIds.slice(0,140) : toolIds;
  }
  select.innerHTML = tools.filter(t => allowed.includes(t.id)).map(t => `<option value="${t.id}">${escapeHtml(`${t.code} — ${t.name}`)}</option>`).join('');
  document.querySelector('#toolAccessNote').textContent = `แพ็กเกจนี้ใช้ได้ ${allowed.length} เครื่องมือ • ทุกเครื่องมือสร้าง Prompt โดยไม่เรียก AI API`;
}

function openWorkspace(member, token) {
  state.member = member; state.token = token;
  sessionStorage.setItem('gpToken', token); sessionStorage.setItem('gpMember', JSON.stringify(member));
  document.querySelector('#memberInfo').textContent = memberLabel(member);
  if (dialog.open) dialog.close();
  populateMemberTools(); renderFields();
  document.querySelector('#workspace').classList.remove('hidden');
  document.querySelector('#workspace').scrollIntoView({behavior:'smooth'});
}

document.querySelector('#loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.querySelector('#loginMessage');
  message.className='form-message'; message.textContent='กำลังตรวจสอบ...';
  try {
    const data = await login(document.querySelector('#accessCode').value.trim().toUpperCase());
    message.className='form-message success'; message.textContent='ตรวจสอบสำเร็จ';
    openWorkspace(data.member, data.token);
  } catch (error) { message.className='form-message error'; message.textContent=error.message; }
});

document.querySelector('#logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('gpToken'); sessionStorage.removeItem('gpMember'); location.reload();
});

function fieldHtml(field) {
  const required = field.required ? 'required' : '';
  const requiredMark = field.required ? ' <span aria-hidden="true">*</span>' : '';
  return `<label>${escapeHtml(field.label)}${requiredMark}${field.type==='textarea' ? `<textarea id="${escapeHtml(field.id)}" ${required} placeholder="${escapeHtml(field.placeholder || '')}"></textarea>` : `<input id="${escapeHtml(field.id)}" ${required} placeholder="${escapeHtml(field.placeholder || '')}">`}</label>`;
}
function renderFields(){
  const tool = selectedTool();
  if (!tool) return;
  document.querySelector('#dynamicFields').innerHTML = (tool.formFields || []).map(fieldHtml).join('');
  document.querySelector('#generateBtn').textContent = 'สร้าง Prompt พร้อมคัดลอก';
  document.querySelector('#resultLabel').textContent = `${tool.code} — Prompt พร้อมคัดลอก`;
  document.querySelector('#toolAccessNote').textContent = `${tool.code} ผ่านการตรวจและอนุมัติแล้ว • ไม่เรียก OpenAI API • Prompt Master เก็บไว้ฝั่งเซิร์ฟเวอร์`;
}
document.querySelector('#toolSelect').addEventListener('change', renderFields);
function payloadFields(){
  const tool = selectedTool();
  return Object.fromEntries((tool?.formFields || []).map(field => [field.id, document.querySelector(`#${CSS.escape(field.id)}`)?.value.trim() || '']));
}

document.querySelector('#generatorForm').addEventListener('submit', async event => {
  event.preventDefault();
  const message=document.querySelector('#generateMessage'); const button=document.querySelector('#generateBtn');
  if(!document.querySelector('#confirmFacts').checked) return;
  const tool=selectedTool();
  button.disabled=true; button.textContent='กำลังประกอบ Prompt...'; message.className='form-message'; message.textContent=`ระบบกำลังประกอบ ${tool?.code || 'Prompt'} จากข้อมูลที่กรอก โดยไม่เรียก AI API`;
  document.querySelector('#resultOutput').classList.add('loading');
  try {
    const data = await api('/api/generate', {method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${state.token}`},body:JSON.stringify({toolId:document.querySelector('#toolSelect').value,tone:document.querySelector('#tone').value,fields:payloadFields()})});
    state.result=data.output;
    const output=document.querySelector('#resultOutput'); output.textContent=data.output; output.classList.remove('empty');
    document.querySelector('#watermark').textContent=`จัดทำสำหรับ ${data.watermark.ownerName} • ${data.watermark.packageName || ''} • ${data.watermark.orderId} • ${new Date().toLocaleString('th-TH')}`;
    ['copyBtn','wordBtn','pdfBtn'].forEach(id=>document.querySelector('#'+id).disabled=false);
    if(Number.isInteger(data.remainingUses)){
      state.member.remainingUses=data.remainingUses; sessionStorage.setItem('gpMember',JSON.stringify(state.member));
      document.querySelector('#memberInfo').textContent=memberLabel(state.member,data.remainingUses);
    }
    message.className='form-message success';
    message.textContent=`สร้าง ${data.promptCode || tool?.code || 'Prompt'} สำเร็จ — พร้อมคัดลอกไปใช้กับ AI ของคุณ • ไม่เรียก AI API และไม่หักจำนวนครั้ง`;
  } catch(error) { message.className='form-message error'; message.textContent=error.message; }
  finally { button.disabled=false; button.textContent='สร้าง Prompt พร้อมคัดลอก'; document.querySelector('#resultOutput').classList.remove('loading'); }
});

document.querySelector('#copyBtn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(state.result); const button=document.querySelector('#copyBtn'); button.textContent='คัดลอกแล้ว'; setTimeout(()=>button.textContent='คัดลอก',1200);
});
document.querySelector('#pdfBtn').addEventListener('click',()=>window.print());
document.querySelector('#wordBtn').addEventListener('click',()=>{
  const title=tools.find(t=>t.id===document.querySelector('#toolSelect').value)?.name || 'GovPrompt';
  const lines=state.result.split('\n').map(line=>`<p>${escapeHtml(line)||'&nbsp;'}</p>`).join('');
  const watermark=escapeHtml(document.querySelector('#watermark').textContent);
  const html=`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:"TH Sarabun New",sans-serif;font-size:16pt;line-height:1.35}h1{text-align:center;font-size:20pt}.wm{color:#777;font-size:10pt;border-bottom:1px solid #bbb;padding-bottom:8px}</style></head><body><div class="wm">${watermark}</div><h1>${escapeHtml(title)}</h1>${lines}</body></html>`;
  const blob=new Blob(['\ufeff',html],{type:'application/msword'}); const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download=`${title}-${new Date().toISOString().slice(0,10)}.doc`; link.click(); URL.revokeObjectURL(link.href);
});

function paymentHtml(payment) {
  const rows=[];
  if(payment.promptPayId) rows.push(`<div><span>พร้อมเพย์</span><strong>${escapeHtml(payment.promptPayId)}</strong></div>`);
  if(payment.bankName || payment.accountNumber) rows.push(`<div><span>${escapeHtml(payment.bankName || 'บัญชีธนาคาร')}</span><strong>${escapeHtml(payment.accountNumber || '-')}</strong></div>`);
  if(payment.accountName) rows.push(`<div><span>ชื่อบัญชี</span><strong>${escapeHtml(payment.accountName)}</strong></div>`);
  return rows.length ? rows.join('') : '<div><span>การชำระเงิน</span><strong>กรุณาติดต่อผู้ขายเพื่อรับรายละเอียด</strong></div>';
}

function showPayment(data) {
  state.payment = {requestRef:data.requestRef, proofToken:data.proofToken, packageName:data.package?.name || data.packageName, priceThb:data.package?.priceThb ?? data.priceThb, payment:data.payment || {}};
  sessionStorage.setItem('gpPayment', JSON.stringify(state.payment));
  document.querySelector('#paymentRef').textContent=state.payment.requestRef;
  document.querySelector('#paymentPackage').textContent=`${state.payment.packageName} • ${Number(state.payment.priceThb).toLocaleString('th-TH')} บาท`;
  document.querySelector('#paymentDetails').innerHTML=paymentHtml(state.payment.payment);
  const panel=document.querySelector('#paymentPanel'); panel.classList.remove('hidden'); panel.scrollIntoView({behavior:'smooth'});
}

document.querySelector('#orderForm').addEventListener('submit', async event => {
  event.preventDefault();
  const message=document.querySelector('#orderMessage'); const button=document.querySelector('#orderBtn');
  button.disabled=true; button.textContent='กำลังบันทึก...'; message.className='form-message'; message.textContent='กำลังสร้างเลขอ้างอิง';
  try {
    const data=await api('/api/order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      packageId:document.querySelector('#packageId').value, fullName:document.querySelector('#fullName').value.trim(), organization:document.querySelector('#organization').value.trim(),
      phone:document.querySelector('#phone').value.trim(), email:document.querySelector('#email').value.trim(), contact:document.querySelector('#contact').value.trim(),
      customerNote:document.querySelector('#customerNote').value.trim(), acceptTerms:document.querySelector('#acceptTerms').checked, acceptPrivacy:document.querySelector('#acceptPrivacy').checked,
      botField:document.querySelector('[name="botField"]').value
    })});
    message.className='form-message success'; message.textContent=`รับคำขอแล้ว เลขอ้างอิง ${data.requestRef}`; showPayment(data);
  } catch(error) { message.className='form-message error'; message.textContent=error.message; }
  finally { button.disabled=false; button.textContent='ส่งคำขอสั่งซื้อ'; }
});

document.querySelector('#proofForm').addEventListener('submit', async event => {
  event.preventDefault();
  const message=document.querySelector('#proofMessage'); const button=document.querySelector('#proofBtn');
  if(!state.payment?.proofToken) { message.className='form-message error'; message.textContent='กรุณาสร้างหรือค้นหาคำสั่งซื้อก่อน'; return; }
  const file=document.querySelector('#proofFile').files[0];
  if(!file) return;
  if(file.size>2_500_000){message.className='form-message error';message.textContent='ไฟล์มีขนาดเกิน 2.5 MB';return;}
  button.disabled=true; button.textContent='กำลังอัปโหลด...'; message.className='form-message'; message.textContent='กำลังส่งหลักฐานแบบส่วนตัว';
  try {
    const form=new FormData(); form.set('proofToken',state.payment.proofToken); form.set('requestRef',state.payment.requestRef); form.set('file',file); form.set('paymentNote',document.querySelector('#paymentNote').value.trim());
    const data=await api('/api/payment-proof',{method:'POST',body:form});
    message.className='form-message success'; message.textContent=`ส่งหลักฐานสำเร็จ เลขอ้างอิง ${data.requestRef} กรุณารอผู้ดูแลตรวจสอบ`;
    sessionStorage.removeItem('gpPayment');
  } catch(error){message.className='form-message error';message.textContent=error.message;}
  finally{button.disabled=false;button.textContent='ส่งหลักฐาน';}
});

document.querySelector('#lookupForm').addEventListener('submit', async event => {
  event.preventDefault(); const message=document.querySelector('#lookupMessage'); message.className='form-message'; message.textContent='กำลังค้นหา...';
  try {
    const data=await api('/api/order-lookup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestRef:document.querySelector('#lookupRef').value.trim(),email:document.querySelector('#lookupEmail').value.trim(),phoneLast4:document.querySelector('#lookupPhone').value.trim()})});
    message.className='form-message success'; message.textContent='พบคำสั่งซื้อแล้ว กรุณาส่งหลักฐานในส่วนที่เปิดขึ้น'; showPayment(data);
  } catch(error){message.className='form-message error';message.textContent=error.message;}
});

(async function initialize(){
  await loadPackages();
  await loadPublicConfig();
  if(state.payment?.proofToken) showPayment(state.payment);
  if(state.member && state.token) openWorkspace(state.member,state.token);
})();



// Baseline v1.4 — Smart Workspace + Favorites + Recent + Task Router
(function initSmartWorkspace(){
  const catalog = Array.isArray(window.GOVPROMPT_CATALOG) ? window.GOVPROMPT_CATALOG : [];
  const registry = Array.isArray(window.GOVPROMPT_REGISTRY) ? window.GOVPROMPT_REGISTRY : [];
  const normalizeSearch = window.GOVPROMPT_NORMALIZE || (value => String(value || '').toLowerCase());
  const select = document.querySelector('#freeToolSelect');
  const form = document.querySelector('#freePromptForm');
  if (!select || !form || !catalog.length) return;

  const FREE_LIMIT = 20;
  const freeTools = catalog.slice(0, FREE_LIMIT);
  const STORAGE_FAVORITES = 'govprompt_favorites_v1';
  const STORAGE_RECENT = 'govprompt_recent_v1';
  let favorites = readStorage(STORAGE_FAVORITES, []);
  let recent = readStorage(STORAGE_RECENT, []);

  const description = document.querySelector('#freeToolDescription');
  const fieldsBox = document.querySelector('#freeDynamicFields');
  const output = document.querySelector('#freePromptOutput');
  const copyBtn = document.querySelector('#freeCopyBtn');
  const message = document.querySelector('#freePromptMessage');
  const cardsBox = document.querySelector('#freePromptCards');
  const searchInput = document.querySelector('#freeSearch');
  const tabsBox = document.querySelector('#freeCategoryTabs');
  const selectedTitle = document.querySelector('#freeSelectedTitle');
  const selectedCode = document.querySelector('#freeSelectedCode');
  const quickActionGrid = document.querySelector('#quickActionGrid');
  const recentList = document.querySelector('#recentPromptList');
  const favoriteList = document.querySelector('#favoritePromptList');
  const favoriteCount = document.querySelector('#favoriteCount');
  const routerInput = document.querySelector('#taskRouterInput');
  const routerBtn = document.querySelector('#taskRouterBtn');
  const routerResults = document.querySelector('#taskRouterResults');
  const reviewPanel = document.querySelector('#freeReviewPanel');
  const reviewScore = document.querySelector('#freeReviewScore');
  const reviewItems = document.querySelector('#freeReviewItems');
  const feedbackPanel = document.querySelector('#freeFeedbackPanel');
  const feedbackForm = document.querySelector('#freeFeedbackForm');
  const feedbackPromptCode = document.querySelector('#feedbackPromptCode');
  const feedbackComment = document.querySelector('#feedbackComment');
  const feedbackSubmitBtn = document.querySelector('#feedbackSubmitBtn');
  const feedbackMessage = document.querySelector('#feedbackMessage');
  const FEEDBACK_LOCAL_KEY = 'govprompt_feedback_pending_v1';

  function safe(value){
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function readStorage(key, fallback){
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (_) { return fallback; }
  }

  function writeStorage(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function categoryOf(tool){
    const text = `${tool.groupName || ''} ${tool.name || ''} ${tool.desc || ''}`.toLowerCase();
    if (/ข่าว|ประชาสัมพันธ์|สื่อ|คำกล่าว/.test(text)) return 'ประชาสัมพันธ์';
    if (/กฎหมาย|หารือ|อุทธรณ์|วินัย|คดี|คำสั่ง/.test(text)) return 'กฎหมายและคำสั่ง';
    if (/tor|จัดซื้อ|จัดจ้าง|พัสดุ|สัญญา|ตรวจรับ/.test(text)) return 'พัสดุและโครงการ';
    if (/บุคคล|พนักงาน|แต่งตั้ง|ประเมิน/.test(text)) return 'งานบุคคล';
    return 'หนังสือและงานทั่วไป';
  }

  function findTool(id){ return catalog.find(tool => tool.id === id || tool.code === id); }
  function isFavorite(tool){ return favorites.includes(tool.id); }

  function toggleFavorite(tool){
    favorites = isFavorite(tool) ? favorites.filter(id => id !== tool.id) : [tool.id, ...favorites.filter(id => id !== tool.id)];
    writeStorage(STORAGE_FAVORITES, favorites);
    renderCards();
    renderWorkspaceLists();
  }

  function addRecent(tool){
    recent = [tool.id, ...recent.filter(id => id !== tool.id)].slice(0, 10);
    writeStorage(STORAGE_RECENT, recent);
    renderWorkspaceLists();
  }

  function openTool(tool){
    if (!tool) return;
    if (!freeTools.some(item => item.id === tool.id)) {
      document.querySelector('#catalog222')?.scrollIntoView({behavior:'smooth'});
      const catalogSearch = document.querySelector('#catalogSearch');
      if (catalogSearch) {
        catalogSearch.value = tool.code;
        catalogSearch.dispatchEvent(new Event('input'));
      }
      return;
    }
    select.value = tool.id;
    renderFreeFields();
    addRecent(tool);
    document.querySelector('.product-builder')?.scrollIntoView({behavior:'smooth', block:'start'});
  }

  const categories = ['ทั้งหมด', ...new Set(freeTools.map(categoryOf))];
  let activeCategory = 'ทั้งหมด';
  select.innerHTML = '';
  freeTools.forEach(tool => select.add(new Option(`${tool.code} — ${tool.name}`, tool.id)));

  function renderTabs(){
    tabsBox.innerHTML = categories.map(cat => `<button type="button" class="category-tab ${cat===activeCategory?'active':''}" data-category="${safe(cat)}">${safe(cat)}</button>`).join('');
    tabsBox.querySelectorAll('[data-category]').forEach(btn => btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      renderTabs();
      renderCards();
    }));
  }

  function filteredFreeTools(){
    const q = searchInput.value.trim().toLowerCase();
    return freeTools.filter(tool => {
      const categoryMatch = activeCategory === 'ทั้งหมด' || categoryOf(tool) === activeCategory;
      const hay = `${tool.code} ${tool.name} ${tool.desc || ''} ${tool.groupName || ''}`.toLowerCase();
      return categoryMatch && (!q || hay.includes(q));
    });
  }

  function renderCards(){
    const items = filteredFreeTools();
    cardsBox.innerHTML = items.length ? items.map(tool => `
      <article class="free-product-card">
        <button class="favorite-button ${isFavorite(tool)?'active':''}" type="button" data-favorite="${safe(tool.id)}" aria-label="${isFavorite(tool)?'นำออกจากรายการโปรด':'เพิ่มในรายการโปรด'}">${isFavorite(tool)?'★':'☆'}</button>
        <div class="free-card-top">
          <span class="free-card-icon">${tool.icon || '📌'}</span>
          <span class="free-card-category">${safe(categoryOf(tool))}</span>
        </div>
        <span class="pill">${safe(tool.code)}</span>
        <h3>${safe(tool.name)}</h3>
        <p>${safe(tool.desc || '')}</p>
        <button class="btn secondary full" type="button" data-use-free="${safe(tool.id)}">ใช้ Prompt นี้</button>
      </article>`).join('') : '<div class="empty-state">ไม่พบ Prompt ที่ตรงกับคำค้น</div>';

    cardsBox.querySelectorAll('[data-use-free]').forEach(btn => btn.addEventListener('click', () => openTool(findTool(btn.dataset.useFree))));
    cardsBox.querySelectorAll('[data-favorite]').forEach(btn => btn.addEventListener('click', () => toggleFavorite(findTool(btn.dataset.favorite))));
  }

  function renderFreeFields(){
    const tool = freeTools.find(item => item.id === select.value) || freeTools[0];
    if (!tool) return;
    selectedTitle.textContent = tool.name;
    selectedCode.textContent = tool.code;
    description.textContent = `${tool.icon || '📌'} ${tool.desc || tool.name}`;
    fieldsBox.innerHTML = (tool.formFields || []).map(field => {
      const required = field.required ? 'required' : '';
      const mark = field.required ? ' *' : '';
      const common = `id="free_${safe(field.id)}" ${required} placeholder="${safe(field.placeholder || '')}"`;
      const control = field.type === 'textarea' ? `<textarea ${common}></textarea>` : `<input ${common}>`;
      return `<label>${safe(field.label)}${mark}${control}</label>`;
    }).join('');
    output.textContent = 'กรอกข้อมูลให้ครบ แล้วกด “สร้าง Prompt ฟรี”';
    output.classList.add('empty');
    copyBtn.disabled = true;
    message.textContent = '';
    reviewPanel?.classList.add('hidden');
  }

  function collectFacts(tool){
    return (tool.formFields || []).map(field => {
      const el = document.querySelector(`#free_${CSS.escape(field.id)}`);
      const value = el?.value?.trim() || '[ยังไม่ได้ระบุ]';
      return `- ${field.label}: ${value}`;
    }).join('\n');
  }

  function buildPublicPrompt(tool){
    const tone = document.querySelector('#freeTone').value;
    return `บทบาท
คุณเป็น Government AI Copilot ผู้เชี่ยวชาญงานราชการไทย

ภารกิจ
${tool.name}

ข้อมูลจากผู้ใช้
${collectFacts(tool)}

ข้อกำหนดสำคัญ
- ยึดข้อเท็จจริงที่ผู้ใช้ให้เป็นหลัก
- ห้ามสมมติชื่อบุคคล วันที่ เลขหนังสือ วงเงิน หรือข้อกฎหมาย
- หากข้อมูลสำคัญไม่ครบ ให้ระบุช่องว่างหรือถามเฉพาะข้อมูลที่จำเป็น
- แยกข้อเท็จจริง การวิเคราะห์ ความเสี่ยง และข้อเสนอแนะให้ชัดเจนเมื่อเหมาะสม
- ระบุข้อมูลหรือเอกสารที่ต้องตรวจสอบเพิ่มเติมก่อนนำไปใช้จริง
- ตรวจความสอดคล้องกับอำนาจหน้าที่ รูปแบบงานราชการ และผลกระทบที่เกี่ยวข้อง
- ใช้${tone}

ผลลัพธ์ที่ต้องการ
จัดทำผลลัพธ์สำหรับ “${tool.code} — ${tool.name}” ให้พร้อมตรวจทานและนำไปปรับใช้ โดยไม่สร้างข้อเท็จจริงใหม่`;
  }


  function renderReview(tool){
    if (!reviewPanel || !reviewScore || !reviewItems) return;
    const fields = tool.formFields || [];
    const missingRequired = fields.filter(field => field.required && !document.querySelector(`#free_${CSS.escape(field.id)}`)?.value.trim());
    const missingOptional = fields.filter(field => !field.required && !document.querySelector(`#free_${CSS.escape(field.id)}`)?.value.trim());
    const checks = [
      {ok: missingRequired.length === 0, title: 'ข้อมูลจำเป็น', detail: missingRequired.length ? `ยังขาด: ${missingRequired.map(f => f.label).join(', ')}` : 'กรอกข้อมูลจำเป็นครบแล้ว'},
      {ok: missingOptional.length === 0, title: 'ข้อมูลประกอบ', detail: missingOptional.length ? `ยังไม่ได้ระบุ ${missingOptional.length} รายการ ซึ่งอาจทำให้ผลลัพธ์ไม่สมบูรณ์` : 'กรอกข้อมูลประกอบครบแล้ว'},
      {ok: document.querySelector('#freeConfirmFacts')?.checked, title: 'การยืนยันตรวจทาน', detail: 'ผู้ใช้ต้องตรวจข้อเท็จจริง กฎหมาย อำนาจหน้าที่ และข้อมูลส่วนบุคคลก่อนใช้จริง'},
      {ok: true, title: 'การคุ้มครอง Prompt Master', detail: 'ระบบใช้เฉพาะ Metadata และข้อมูลที่ผู้ใช้กรอก ไม่เปิดเผย Prompt Master'}
    ];
    const score = Math.round((checks.filter(item => item.ok).length / checks.length) * 100);
    reviewScore.textContent = `${score}%`;
    reviewItems.innerHTML = checks.map(item => `<div class="review-item ${item.ok?'ok':'warn'}"><span>${item.ok?'✓':'!'}</span><div><strong>${safe(item.title)}</strong><small>${safe(item.detail)}</small></div></div>`).join('');
    reviewPanel.classList.remove('hidden');
  }

  function resetFeedback(){
    if (!feedbackPanel || !feedbackForm) return;
    feedbackPanel.classList.add('hidden');
    feedbackPanel.classList.remove('is-sent');
    feedbackForm.reset();
    if (feedbackMessage) { feedbackMessage.className = 'form-message'; feedbackMessage.textContent = ''; }
    if (feedbackSubmitBtn) { feedbackSubmitBtn.disabled = false; feedbackSubmitBtn.textContent = '📨 ส่งความคิดเห็น'; }
  }

  function savePendingFeedback(payload){
    try {
      const current = JSON.parse(localStorage.getItem(FEEDBACK_LOCAL_KEY) || '[]');
      const list = Array.isArray(current) ? current : [];
      list.push(payload);
      localStorage.setItem(FEEDBACK_LOCAL_KEY, JSON.stringify(list.slice(-100)));
    } catch (_) {}
  }

  async function submitFeedback(event){
    event.preventDefault();
    if (!feedbackForm || !feedbackMessage || !feedbackSubmitBtn) return;
    const data = new FormData(feedbackForm);
    const rating = data.get('rating');
    if (!rating) {
      feedbackMessage.className = 'form-message error';
      feedbackMessage.textContent = 'กรุณาเลือกคะแนนก่อนส่งความคิดเห็น';
      return;
    }
    const payload = {
      timestamp: new Date().toISOString(),
      promptCode: feedbackPromptCode?.value || selectedCode?.textContent || '',
      rating: Number(rating),
      comment: String(feedbackComment?.value || '').trim().slice(0, 1000),
      device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile/tablet' : 'desktop',
      version: window.GOVPROMPT_RELEASE_VERSION || 'v1.6-feedback',
      page: location.href.split('#')[0]
    };
    feedbackSubmitBtn.disabled = true;
    feedbackSubmitBtn.textContent = 'กำลังส่ง...';
    const endpoint = String(window.GOVPROMPT_FEEDBACK_ENDPOINT || '').trim();
    if (!endpoint) {
      savePendingFeedback(payload);
      feedbackMessage.className = 'form-message success';
      feedbackMessage.textContent = 'บันทึกความคิดเห็นไว้ในอุปกรณ์แล้ว — เจ้าของระบบต้องตั้งค่า Google Sheets เพื่อรับข้อมูลส่วนกลาง';
      feedbackPanel.classList.add('is-sent');
      feedbackSubmitBtn.textContent = 'บันทึกแล้ว ✓';
      return;
    }
    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify(payload)
      });
      feedbackMessage.className = 'form-message success';
      feedbackMessage.textContent = 'ขอบคุณครับ ความคิดเห็นของคุณถูกส่งเพื่อใช้ปรับปรุง GovPrompt Thailand แล้ว';
      feedbackPanel.classList.add('is-sent');
      feedbackSubmitBtn.textContent = 'ส่งแล้ว ✓';
    } catch (_) {
      savePendingFeedback(payload);
      feedbackMessage.className = 'form-message error';
      feedbackMessage.textContent = 'ส่งออนไลน์ไม่สำเร็จ ระบบบันทึกไว้ในอุปกรณ์ชั่วคราว กรุณาลองใหม่เมื่อมีอินเทอร์เน็ต';
      feedbackSubmitBtn.disabled = false;
      feedbackSubmitBtn.textContent = '📨 ลองส่งอีกครั้ง';
    }
  }

  function renderQuickActions(){
    if (!quickActionGrid) return;
    const keywords = ['หนังสือ','คำสั่ง','ข่าว','กฎหมาย','TOR','บุคคล'];
    const icons = ['📄','📋','📢','⚖️','📑','👥'];
    quickActionGrid.innerHTML = keywords.map((word, i) => `<button type="button" class="quick-action" data-quick="${safe(word)}"><span>${icons[i]}</span><strong>${safe(word)}</strong><small>ค้นหาเครื่องมือที่เกี่ยวข้อง</small></button>`).join('');
    quickActionGrid.querySelectorAll('[data-quick]').forEach(btn => btn.addEventListener('click', () => {
      routerInput.value = btn.dataset.quick;
      runRouter();
      document.querySelector('#taskRouterResults')?.scrollIntoView({behavior:'smooth', block:'nearest'});
    }));
  }

  function listItem(tool){
    return `<button type="button" class="mini-prompt-item" data-open-tool="${safe(tool.id)}"><span><strong>${safe(tool.code)}</strong>${safe(tool.name)}</span><span>›</span></button>`;
  }

  function renderWorkspaceLists(){
    const recentTools = recent.map(findTool).filter(Boolean);
    const favoriteTools = favorites.map(findTool).filter(Boolean);
    if (recentList) recentList.innerHTML = recentTools.length ? recentTools.map(listItem).join('') : '<p class="empty-mini">ยังไม่มีรายการใช้งานล่าสุด</p>';
    if (favoriteList) favoriteList.innerHTML = favoriteTools.length ? favoriteTools.map(listItem).join('') : '<p class="empty-mini">กด ☆ ที่การ์ดเพื่อบันทึกรายการโปรด</p>';
    if (favoriteCount) favoriteCount.textContent = String(favoriteTools.length);
    document.querySelectorAll('[data-open-tool]').forEach(btn => btn.addEventListener('click', () => openTool(findTool(btn.dataset.openTool))));
  }

  function routerMatches(query){
    const normalizedQuery = normalizeSearch(query);
    const words = normalizedQuery.split(/\s+/).filter(Boolean);
    return catalog.map(tool => {
      const reg = registry.find(item => item.id === tool.id);
      const hay = reg?.searchText || normalizeSearch(`${tool.code} ${tool.name} ${tool.desc || ''} ${tool.groupName || ''}`);
      let score = words.reduce((sum, word) => sum + (hay.includes(word) ? 3 : 0), 0);
      if (hay.includes(normalizedQuery)) score += 6;
      if (normalizeSearch(tool.code) === normalizedQuery) score += 12;
      return {tool, score};
    }).filter(item => item.score > 0).sort((a,b) => b.score-a.score).slice(0, 5).map(item => item.tool);
  }

  function runRouter(){
    const q = routerInput?.value.trim() || '';
    if (!routerResults) return;
    if (!q) { routerResults.innerHTML = '<p class="router-hint">พิมพ์ชื่องานหรือเอกสารที่ต้องการจัดทำ</p>'; return; }
    const matches = routerMatches(q);
    routerResults.innerHTML = matches.length ? matches.map(tool => `<article class="router-result-card"><div><span class="pill">${safe(tool.code)}</span><strong>${safe(tool.name)}</strong><small>${safe(tool.desc || tool.groupName || '')}</small></div><button class="btn secondary" type="button" data-router-open="${safe(tool.id)}">${freeTools.some(x=>x.id===tool.id)?'เริ่มใช้':'ดูในคลัง'}</button></article>`).join('') : '<p class="router-hint">ยังไม่พบรายการตรงคำค้น ลองใช้คำสั้นลง เช่น “หนังสือ” “ข่าว” หรือ “TOR”</p>';
    routerResults.querySelectorAll('[data-router-open]').forEach(btn => btn.addEventListener('click', () => openTool(findTool(btn.dataset.routerOpen))));
  }

  searchInput.addEventListener('input', renderCards);
  select.addEventListener('change', () => { renderFreeFields(); resetFeedback(); addRecent(findTool(select.value)); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const tool = freeTools.find(item => item.id === select.value) || freeTools[0];
    if (!tool || !document.querySelector('#freeConfirmFacts').checked) return;
    output.textContent = buildPublicPrompt(tool);
    output.classList.remove('empty');
    copyBtn.disabled = false;
    addRecent(tool);
    message.className = 'form-message success';
    message.textContent = `สร้าง ${tool.code} สำเร็จ — ตรวจข้อมูลก่อนคัดลอกไปใช้กับ AI`;
    renderReview(tool);
    if (feedbackPromptCode) feedbackPromptCode.value = tool.code;
    if (feedbackPanel) feedbackPanel.classList.remove('hidden');
    output.scrollIntoView({behavior:'smooth', block:'nearest'});
  });

  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(output.textContent); }
    catch (_) {
      const range = document.createRange(); range.selectNodeContents(output); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    }
    copyBtn.textContent = 'คัดลอกแล้ว ✓';
    setTimeout(() => copyBtn.textContent = 'คัดลอก Prompt', 1400);
  });

  feedbackForm?.addEventListener('submit', submitFeedback);
  routerBtn?.addEventListener('click', runRouter);
  routerInput?.addEventListener('keydown', event => { if (event.key === 'Enter') runRouter(); });
  document.querySelector('#clearRecentBtn')?.addEventListener('click', () => { recent = []; writeStorage(STORAGE_RECENT, recent); renderWorkspaceLists(); });

  renderTabs();
  renderCards();
  renderFreeFields();
  renderQuickActions();
  renderWorkspaceLists();

  const catalogGrid = document.querySelector('#catalog222Grid');
  const catalogSearch = document.querySelector('#catalogSearch');
  const catalogCount = document.querySelector('#catalogCount');
  const moreBtn = document.querySelector('#catalogMoreBtn');
  let catalogLimit = 36;

  function renderCatalog(){
    const q = normalizeSearch(catalogSearch.value.trim());
    const filtered = catalog.filter(tool => {
      const reg = registry.find(item => item.id === tool.id);
      return !q || (reg?.searchText || normalizeSearch(`${tool.code} ${tool.name} ${tool.desc || ''} ${tool.groupName || ''}`)).includes(q);
    });
    const visible = filtered.slice(0, catalogLimit);
    catalogCount.textContent = `พบ ${filtered.length} รายการ`;
    catalogGrid.innerHTML = visible.length ? visible.map(tool => `
      <article class="catalog222-card">
        <strong>${safe(tool.code)}</strong>
        <span>${safe(tool.name)}</span>
        <small>${safe(tool.groupName || tool.desc || '')}</small>
        ${freeTools.some(item=>item.id===tool.id)?`<button class="text-button catalog-use" type="button" data-catalog-use="${safe(tool.id)}">เริ่มใช้ฟรี</button>`:''}
      </article>`).join('') : '<div class="empty-state">ไม่พบรายการที่ค้นหา</div>';
    moreBtn.hidden = visible.length >= filtered.length;
    catalogGrid.querySelectorAll('[data-catalog-use]').forEach(btn => btn.addEventListener('click', () => openTool(findTool(btn.dataset.catalogUse))));
  }

  catalogSearch.addEventListener('input', () => { catalogLimit = 36; renderCatalog(); });
  moreBtn.addEventListener('click', () => { catalogLimit += 36; renderCatalog(); });
  renderCatalog();
})();
