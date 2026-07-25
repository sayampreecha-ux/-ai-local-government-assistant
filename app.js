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
    banner.textContent = '🔧 ระบบอยู่ระหว่างตั้งค่า ยังไม่เปิดรับคำสั่งซื้อ — สามารถดูตัวอย่างและตรวจหน้าระบบได้ก่อน';
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


// Baseline v1.1 — 20 Prompt ฟรีแบบ client-side
(function initFree20(){
  const select = document.querySelector('#freeToolSelect');
  const form = document.querySelector('#freePromptForm');
  if (!select || !form || !Array.isArray(window.GOVPROMPT_CATALOG)) return;

  const freeTools = window.GOVPROMPT_CATALOG.slice(0, 20);
  const description = document.querySelector('#freeToolDescription');
  const fieldsBox = document.querySelector('#freeDynamicFields');
  const output = document.querySelector('#freePromptOutput');
  const copyBtn = document.querySelector('#freeCopyBtn');
  const message = document.querySelector('#freePromptMessage');

  freeTools.forEach(tool => select.add(new Option(`${tool.code} — ${tool.name}`, tool.id)));

  function safe(value){
    return String(value ?? '').replace(/[<>]/g, '');
  }

  function renderFreeFields(){
    const tool = freeTools.find(item => item.id === select.value) || freeTools[0];
    if (!tool) return;
    description.textContent = `${tool.icon || '📌'} ${tool.desc || tool.name}`;
    fieldsBox.innerHTML = (tool.formFields || []).map(field => {
      const required = field.required ? 'required' : '';
      const mark = field.required ? ' *' : '';
      const common = `id="free_${safe(field.id)}" ${required} placeholder="${safe(field.placeholder || '')}"`;
      const control = field.type === 'textarea'
        ? `<textarea ${common}></textarea>`
        : `<input ${common}>`;
      return `<label>${safe(field.label)}${mark}${control}</label>`;
    }).join('');
    output.textContent = 'กรอกข้อมูลให้ครบ แล้วกด “สร้าง Prompt ฟรี”';
    output.classList.add('empty');
    copyBtn.disabled = true;
    message.textContent = '';
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
    const facts = collectFacts(tool);
    return `บทบาท
คุณเป็น Government AI Copilot ผู้เชี่ยวชาญงานราชการไทย

ภารกิจ
${tool.name}

ข้อมูลจากผู้ใช้
${facts}

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

  select.addEventListener('change', renderFreeFields);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const tool = freeTools.find(item => item.id === select.value) || freeTools[0];
    if (!tool || !document.querySelector('#freeConfirmFacts').checked) return;
    const prompt = buildPublicPrompt(tool);
    output.textContent = prompt;
    output.classList.remove('empty');
    copyBtn.disabled = false;
    message.className = 'form-message success';
    message.textContent = `สร้าง ${tool.code} สำเร็จ — ตรวจข้อมูลก่อนคัดลอกไปใช้กับ AI`;
    output.scrollIntoView({behavior:'smooth', block:'nearest'});
  });

  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.textContent);
    copyBtn.textContent = 'คัดลอกแล้ว ✓';
    setTimeout(() => copyBtn.textContent = 'คัดลอก Prompt', 1400);
  });

  renderFreeFields();
})();
