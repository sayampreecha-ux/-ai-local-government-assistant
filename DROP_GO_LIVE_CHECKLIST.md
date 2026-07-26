const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const state = {
  token: sessionStorage.getItem('gpAdminToken') || '',
  expiresAt: Number(sessionStorage.getItem('gpAdminExpiresAt') || 0),
  orders: [], codes: [], packages: []
};
const toolNames = {
  'official-letter':'หนังสือภายนอก','memo':'บันทึกข้อความ','meeting-invite':'เชิญประชุม','inquiry-letter':'หนังสือหารือ',
  'executive-summary':'สรุปผู้บริหาร','project-outline':'โครงร่างโครงการ','risk-analysis':'วิเคราะห์ความเสี่ยง',
  'public-news':'ข่าวประชาสัมพันธ์','speech':'คำกล่าว','document-review':'ตรวจทานเอกสาร'
};
const statusNames = {
  pending:'รอติดต่อ', contacted:'ติดต่อแล้ว', awaiting_payment:'รอชำระ', proof_submitted:'มีหลักฐาน',
  paid:'ชำระแล้ว', completed:'เปิดสิทธิ์แล้ว', cancelled:'ยกเลิก'
};

async function requestApi(url, { method='POST', body } = {}) {
  const response = await fetch(url, {
    method,
    headers: { authorization:`Bearer ${state.token}`, ...(body ? {'content-type':'application/json'} : {}) },
    ...(body ? {body:JSON.stringify(body)} : {})
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) {
    if (response.status === 401) clearAdminSession();
    throw new Error(data.error || 'ระบบขัดข้อง');
  }
  return data;
}
function clearAdminSession(){ state.token='';state.expiresAt=0;sessionStorage.removeItem('gpAdminToken');sessionStorage.removeItem('gpAdminExpiresAt'); }
function showLogin(message='',isError=false){
  document.querySelector('#adminLoginPanel').classList.remove('hidden');document.querySelector('#adminDashboard').classList.add('hidden');document.querySelector('#logoutAdmin').classList.add('hidden');
  const box=document.querySelector('#loginMessage');box.textContent=message;box.className=`form-message${message?(isError?' error':' success'):''}`;
}
function showDashboard(){document.querySelector('#adminLoginPanel').classList.add('hidden');document.querySelector('#adminDashboard').classList.remove('hidden');document.querySelector('#logoutAdmin').classList.remove('hidden');}
async function loginAdmin(secret){
  const response=await fetch('/api/admin-auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({adminSecret:secret})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'เข้าสู่ระบบไม่สำเร็จ');
  state.token=data.token;state.expiresAt=Number(data.expiresAt||0);sessionStorage.setItem('gpAdminToken',state.token);sessionStorage.setItem('gpAdminExpiresAt',String(state.expiresAt));
}

document.querySelector('#adminLoginForm').addEventListener('submit',async event=>{
  event.preventDefault();const message=document.querySelector('#loginMessage');message.className='form-message';message.textContent='กำลังตรวจสอบ...';
  try{await loginAdmin(document.querySelector('#adminSecret').value);document.querySelector('#adminSecret').value='';showDashboard();await loadAll();}
  catch(error){message.className='form-message error';message.textContent=error.message;}
});
document.querySelector('#logoutAdmin').addEventListener('click',()=>{clearAdminSession();showLogin('ออกจากระบบผู้ดูแลแล้ว');});

async function loadPackages(){
  const response=await fetch('/api/packages');const data=await response.json().catch(()=>({}));
  state.packages=data.packages||[];
  document.querySelector('#adminPackage').innerHTML=state.packages.map(pkg=>`<option value="${esc(pkg.id)}" data-uses="${pkg.maxUses}" data-days="${pkg.expiryDays}">${esc(pkg.name)} — ${Number(pkg.priceThb).toLocaleString('th-TH')} บาท</option>`).join('');
  applyPackageDefaults();
}
function applyPackageDefaults(){const option=document.querySelector('#adminPackage').selectedOptions[0];if(!option)return;document.querySelector('#maxUses').value=option.dataset.uses||'';document.querySelector('#expiryDays').value=option.dataset.days||'';}
document.querySelector('#adminPackage').addEventListener('change',applyPackageDefaults);

function statusClass(status){return `status-pill status-${status}`;}
function renderOrders(orders){
  state.orders=orders;const element=document.querySelector('#orderList');
  if(!orders.length){element.innerHTML='<p>ยังไม่มีคำขอสั่งซื้อในสถานะที่เลือก</p>';return;}
  element.innerHTML=orders.map(order=>`
    <div class="admin-list-item">
      <strong>${esc(order.fullName)}</strong> <span class="${statusClass(order.status)}">${esc(statusNames[order.status]||order.status)}</span><br>
      <span class="admin-meta">${esc(order.requestRef)} • ${new Date(order.submittedAt).toLocaleString('th-TH')} • ${esc(order.packageName)} ${Number(order.priceThb).toLocaleString('th-TH')} บาท</span><br>
      <span>${esc(order.organization)} • ${esc(order.phone)} • ${esc(order.email)} • ${esc(order.contact)}</span>
      ${order.customerNote?`<div class="admin-note">ลูกค้า: ${esc(order.customerNote)}</div>`:''}
      ${order.paymentNote?`<div class="admin-note">การชำระ: ${esc(order.paymentNote)}</div>`:''}
      <div class="admin-actions">
        ${order.hasPaymentProof?`<button class="mini" data-proof="${esc(order.id)}">เปิดหลักฐาน</button>`:''}
        <button class="mini" data-prefill="${esc(order.id)}">นำไปสร้างรหัส</button>
        <select class="mini" data-order-status="${esc(order.id)}">
          ${Object.entries(statusNames).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}
        </select>
      </div>
    </div>`).join('');
  orders.forEach(order=>{
    const select=document.querySelector(`[data-order-status="${CSS.escape(order.id)}"]`);if(select){select.value=order.status;select.onchange=async()=>{try{await requestApi('/api/admin-orders',{body:{action:'set-status',id:order.id,status:select.value}});await Promise.all([loadOrders(),loadStats()]);}catch(error){alert(error.message);}};}
  });
  document.querySelectorAll('[data-prefill]').forEach(button=>button.onclick=()=>{
    const order=state.orders.find(item=>item.id===button.dataset.prefill);if(!order)return;
    document.querySelector('#orderId').value=order.requestRef;document.querySelector('#customerName').value=order.fullName;document.querySelector('#customerEmail').value=order.email;document.querySelector('#adminPackage').value=order.packageId;applyPackageDefaults();document.querySelector('#adminForm').scrollIntoView({behavior:'smooth',block:'center'});
  });
  document.querySelectorAll('[data-proof]').forEach(button=>button.onclick=async()=>{
    try{const data=await requestApi('/api/admin-orders',{body:{action:'proof-url',id:button.dataset.proof}});window.open(data.url,'_blank','noopener');}catch(error){alert(error.message);}
  });
}
async function loadOrders(){const status=document.querySelector('#orderFilter').value;const data=await requestApi('/api/admin-orders',{body:{action:'list',status}});renderOrders(data.orders||[]);}
document.querySelector('#loadOrders').onclick=()=>loadOrders().catch(showAdminError);
document.querySelector('#orderFilter').addEventListener('change',()=>loadOrders().catch(showAdminError));

function renderCodes(codes){
  state.codes=codes;const element=document.querySelector('#codeList');if(!codes.length){element.innerHTML='<p>ยังไม่มีรหัสที่สร้างผ่านระบบ</p>';return;}
  element.innerHTML=codes.map(code=>`
    <div class="admin-list-item">
      <strong>${esc(code.ownerName)}</strong> <span class="${code.active?'status-pill status-completed':'status-pill status-cancelled'}">${code.active?'ใช้งาน':'ระงับ'}</span><br>
      <span class="admin-meta">${esc(code.orderId)} • ${esc(code.packageName)} • ${esc(code.maskedCode)} • ใช้ ${code.uses}/${code.maxUses} • หมดอายุ ${new Date(code.expiresAt).toLocaleDateString('th-TH')}</span><br>
      ${code.customerEmail?`<span>${esc(code.customerEmail)}</span><br>`:''}
      <button class="mini" data-toggle="${esc(code.id)}" data-active="${code.active?'0':'1'}">${code.active?'ระงับสิทธิ์':'เปิดสิทธิ์'}</button>
    </div>`).join('');
  document.querySelectorAll('[data-toggle]').forEach(button=>button.onclick=async()=>{
    const active=button.dataset.active==='1';if(!confirm(active?'ยืนยันเปิดสิทธิ์นี้?':'ยืนยันระงับสิทธิ์นี้?'))return;
    try{await requestApi('/api/admin-codes',{body:{action:'set-active',id:button.dataset.toggle,active}});await Promise.all([loadCodes(),loadStats()]);}catch(error){alert(error.message);}
  });
}
async function loadCodes(){const data=await requestApi('/api/admin-codes',{body:{action:'list'}});renderCodes(data.codes||[]);}
document.querySelector('#loadCodes').onclick=()=>loadCodes().catch(showAdminError);

document.querySelector('#adminForm').addEventListener('submit',async event=>{
  event.preventDefault();const message=document.querySelector('#adminMessage');message.className='form-message';message.textContent='กำลังสร้างรหัส...';
  try{
    const data=await requestApi('/api/admin-codes',{body:{action:'create',orderId:document.querySelector('#orderId').value.trim(),ownerName:document.querySelector('#customerName').value.trim(),customerEmail:document.querySelector('#customerEmail').value.trim(),packageId:document.querySelector('#adminPackage').value,maxUses:Number(document.querySelector('#maxUses').value),expiryDays:Number(document.querySelector('#expiryDays').value)}});
    const box=document.querySelector('#newCode');box.classList.remove('hidden');box.innerHTML=`<strong>รหัสใหม่ — แสดงครั้งเดียว</strong><br><span style="font-size:24px;letter-spacing:.08em;word-break:break-all">${esc(data.code)}</span><br><button type="button" class="mini" id="copyNewCode">คัดลอกรหัส</button><br><small>ระบบเก็บเฉพาะค่าแฮช ไม่สามารถแสดงรหัสเต็มซ้ำได้ อีเมลจะถูกส่งเมื่อกำหนด Resend ไว้</small>`;
    document.querySelector('#copyNewCode').onclick=async()=>{await navigator.clipboard.writeText(data.code);document.querySelector('#copyNewCode').textContent='คัดลอกแล้ว';};
    message.textContent='สร้างรหัสสำเร็จ';message.className='form-message success';await Promise.all([loadCodes(),loadOrders(),loadStats()]);
  }catch(error){message.textContent=error.message;message.className='form-message error';}
});

function renderBars(elementId,rows,labelFn){
  const element=document.querySelector(elementId);if(!rows.length){element.innerHTML='<p class="muted">ยังไม่มีข้อมูล</p>';return;}
  const max=Math.max(...rows.map(row=>row.count),1);element.innerHTML=rows.map(row=>`<div class="chart-row"><span>${esc(labelFn(row))}</span><div class="chart-bar"><i style="width:${Math.max(4,row.count/max*100)}%"></i></div><strong>${row.count}</strong></div>`).join('');
}
async function loadStats(){
  const data=await requestApi('/api/admin-stats',{method:'GET'});
  document.querySelector('#statPending').textContent=data.pendingOrders;document.querySelector('#statProof').textContent=data.proofOrders;document.querySelector('#statPaid').textContent=data.paidOrders;document.querySelector('#statCodes').textContent=data.activeCodes;document.querySelector('#statUsage').textContent=data.usageToday;document.querySelector('#statRevenue').textContent=Number(data.revenueThisMonth||0).toLocaleString('th-TH');
  renderBars('#packageSales',data.packageSales||[],row=>state.packages.find(pkg=>pkg.id===row.packageId)?.name||row.packageId);
  renderBars('#toolUsage',data.toolUsage||[],row=>toolNames[row.toolId]||row.toolId);
}
async function loadAll(){await Promise.all([loadPackages(),loadStats(),loadCodes(),loadOrders()]);const message=document.querySelector('#adminMessage');message.textContent='โหลดข้อมูลล่าสุดแล้ว';message.className='form-message success';}
document.querySelector('#loadAll').onclick=()=>loadAll().catch(showAdminError);
function showAdminError(error){const message=document.querySelector('#adminMessage');message.textContent=error.message;message.className='form-message error';}

function downloadCsv(filename,headers,rows){const quote=value=>`"${String(value??'').replaceAll('"','""')}"`;const csv=[headers.map(quote).join(','),...rows.map(row=>row.map(quote).join(','))].join('\r\n');const blob=new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename;link.click();URL.revokeObjectURL(link.href);}
document.querySelector('#exportOrders').onclick=()=>{if(!state.orders.length)return alert('กรุณาโหลดรายการคำสั่งซื้อก่อน');downloadCsv(`govprompt-orders-${new Date().toISOString().slice(0,10)}.csv`,['เลขอ้างอิง','ชื่อ','หน่วยงาน','แพ็กเกจ','ราคา','โทรศัพท์','อีเมล','สถานะ','มีหลักฐาน','วันที่ส่ง'],state.orders.map(o=>[o.requestRef,o.fullName,o.organization,o.packageName,o.priceThb,o.phone,o.email,statusNames[o.status]||o.status,o.hasPaymentProof?'ใช่':'ไม่',o.submittedAt]));};
document.querySelector('#exportCodes').onclick=()=>{if(!state.codes.length)return alert('กรุณาโหลดรายการรหัสก่อน');downloadCsv(`govprompt-codes-${new Date().toISOString().slice(0,10)}.csv`,['ชื่อผู้ซื้อ','อีเมล','เลขคำสั่งซื้อ','แพ็กเกจ','รหัสแบบปกปิด','สถานะ','ใช้แล้ว','จำนวนสูงสุด','วันหมดอายุ'],state.codes.map(c=>[c.ownerName,c.customerEmail,c.orderId,c.packageName,c.maskedCode,c.active?'ใช้งาน':'ระงับ',c.uses,c.maxUses,c.expiresAt]));};

(async function initialize(){
  await loadPackages().catch(()=>{});
  if(!state.token||!state.expiresAt||Date.now()>=state.expiresAt){clearAdminSession();showLogin();return;}
  try{showDashboard();await loadAll();}catch(error){showLogin(error.message,true);}
})();
