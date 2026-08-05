const statusEl = document.querySelector('#setupStatus');
const overallEl = document.querySelector('#setupOverall');
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function row(label, ok, detail) {
  return `<div class="status-row"><span><b>${esc(label)}</b><br><small>${esc(detail)}</small></span><strong class="${ok?'ok':'warn'}">${ok?'พร้อม':'ยังไม่พร้อม'}</strong></div>`;
}
async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
async function run() {
  overallEl.className = 'form-message';
  overallEl.textContent = 'กำลังตรวจสอบ...';
  try {
    const [health, config, packageData] = await Promise.all([
      getJson('/api/health'),
      getJson('/api/public-config'),
      getJson('/api/packages')
    ]);
    const packageCount = Array.isArray(packageData.packages) ? packageData.packages.length : 0;
    statusEl.innerHTML = [
      row('เว็บไซต์และ API', Boolean(health.ok), `เวอร์ชัน ${health.version || '-'}`),
      row('ฐานข้อมูล Supabase', Boolean(health.database), health.database ? 'ตาราง packages อ่านได้' : 'ตรวจ URL, Secret key และ setup.sql'),
      row('แพ็กเกจขาย', packageCount >= 3, `โหลดได้ ${packageCount} แพ็กเกจ (${packageData.source || 'ไม่ทราบแหล่ง'})`),
      row('ข้อมูลรับชำระเงิน', Boolean(health.paymentConfigured), 'ต้องมีชื่อบัญชีและ PromptPay/เลขบัญชี'),
      row('โหมดสร้างผลลัพธ์', health.mode === 'live', health.mode === 'live' ? 'เชื่อม OpenAI แล้ว' : 'Demo — ยังไม่คิดค่า API'),
      row('สวิตช์เปิดขาย', Boolean(config.salesEnabled), config.salesEnabled ? 'เปิดรับคำสั่งซื้อ' : 'ปิดไว้เพื่อทดสอบอย่างปลอดภัย'),
      row('พร้อมขายจริง', Boolean(config.readyForSales), config.readyForSales ? 'ฐานข้อมูล การชำระเงิน และสวิตช์เปิดขายครบ' : 'ยังไม่ควรรับเงินจากลูกค้า')
    ].join('');
    overallEl.className = `form-message ${config.readyForSales ? 'success' : 'error'}`;
    overallEl.textContent = config.readyForSales ? 'ระบบพร้อมรับคำสั่งซื้อแล้ว กรุณาทดสอบคำสั่งซื้อจำลอง 1 รายการก่อนเปิดโพสต์ขาย' : 'ยังไม่เปิดขาย ระบบจะป้องกันการส่งคำสั่งซื้อจนกว่าจะตั้ง SALES_ENABLED=true';
  } catch (error) {
    overallEl.className = 'form-message error';
    overallEl.textContent = `ตรวจระบบไม่สำเร็จ: ${error.message}`;
  }
}
document.querySelector('#rerunSetup').addEventListener('click', run);
run();
