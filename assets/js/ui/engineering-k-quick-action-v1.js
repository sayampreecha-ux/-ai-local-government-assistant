(() => {
  'use strict';
  const root = document.querySelector('.work-catalog-group[data-category-id="engineering"]');
  if (!root || root.querySelector('[data-gp-k-audit]')) return;
  const tasks = root.querySelector('.work-catalog-tasks');
  if (!tasks) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'work-catalog-task';
  button.dataset.gpKAudit = 'true';
  button.dataset.gpKAudit = 'true';
  button.dataset.prompt = 'ตรวจสอบค่า K จากเอกสารที่แนบ โดยตรวจสิทธิใช้ค่า K ฐานอำนาจ สูตร ดัชนี การคำนวณ ยอดเงิน และหลักฐานที่เกี่ยวข้อง พร้อมระบุจุดขัดแย้งและ Decision Lock หากยังสรุปไม่ได้';
  button.dataset.search = 'ตรวจค่า K ค่าชดเชยค่างานก่อสร้าง สัญญาแบบปรับราคาได้';
  button.textContent = '🔍 ตรวจสอบค่า K';
  tasks.appendChild(button);
})();