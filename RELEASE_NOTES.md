const checksEl = document.querySelector('#checks');
const overallEl = document.querySelector('#overall');
const runButton = document.querySelector('#runCheck');
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function card(title, ok, detail) {
  return `<article class="package-card"><span class="package-name">${ok?'✅':'⚠️'} ${esc(title)}</span><p>${esc(detail)}</p></article>`;
}
async function json(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
async function run() {
  runButton.disabled = true;
  overallEl.className = 'form-message';
  overallEl.textContent = 'กำลังตรวจสอบระบบ...';
  const cards = [];
  let criticalOk = true;
  try {
    const health = await json('/api/health');
    cards.push(card('สวิตช์เปิดขาย', Boolean(health.salesEnabled), health.salesEnabled ? 'เปิดรับคำสั่งซื้อแล้ว' : 'ปิดไว้เพื่อทดสอบอย่างปลอดภัย'));
    cards.push(card('ฐานข้อมูล Supabase', Boolean(health.database), health.database ? 'เชื่อมต่อฐานข้อมูลสำเร็จ' : 'ยังเชื่อมต่อไม่ได้ ให้ตรวจ SUPABASE_URL, SUPABASE_SECRET_KEY และ setup.sql'));
    cards.push(card('โหมดสร้าง Prompt', health.mode === 'prompt-only' && health.promptCount === 222, `Prompt-only — พร้อมใช้ ${health.promptCount || 0} รายการ โดยไม่เรียก AI API`));
    cards.push(card('ข้อมูลชำระเงิน', Boolean(health.paymentConfigured), health.paymentConfigured ? 'ตั้งชื่อบัญชีและช่องทางชำระเงินแล้ว' : 'ยังไม่ได้ตั้ง PAYMENT_ACCOUNT_NAME และ PromptPay/บัญชีธนาคาร'));
    cards.push(card('อีเมลแจ้งเตือน', Boolean(health.emailConfigured), health.emailConfigured ? 'เปิดใช้งานแล้ว' : 'ยังไม่ตั้งค่า (เป็นฟังก์ชันเสริม)'));
    cards.push(card('LINE แจ้งเตือน', Boolean(health.lineConfigured), health.lineConfigured ? 'เปิดใช้งานแล้ว' : 'ยังไม่ตั้งค่า (เป็นฟังก์ชันเสริม)'));
    cards.push(card('เวอร์ชันระบบ', true, health.version || 'ไม่ทราบเวอร์ชัน'));
    criticalOk = Boolean(health.database && health.paymentConfigured && health.salesEnabled && health.readyForSales);
  } catch (error) {
    criticalOk = false;
    cards.push(card('API Health', false, error.message));
  }
  try {
    const data = await json('/api/packages');
    const count = Array.isArray(data.packages) ? data.packages.length : 0;
    cards.push(card('แพ็กเกจขาย', count >= 3, `โหลดได้ ${count} แพ็กเกจ`));
    criticalOk = criticalOk && count >= 3;
  } catch (error) {
    criticalOk = false;
    cards.push(card('แพ็กเกจขาย', false, error.message));
  }
  checksEl.innerHTML = cards.join('');
  overallEl.className = `form-message ${criticalOk ? 'success' : 'error'}`;
  overallEl.textContent = criticalOk ? 'ส่วนสำคัญพร้อมแล้ว ให้ทดสอบคำสั่งซื้อและออกรหัสทดลองก่อนเปิดขาย' : 'ยังมีรายการสำคัญที่ต้องตั้งค่าให้ครบก่อนเปิดขาย';
  runButton.disabled = false;
}
runButton.addEventListener('click', run);
run();
