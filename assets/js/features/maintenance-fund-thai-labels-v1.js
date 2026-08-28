(() => {
  'use strict';

  const SIZE_LABELS = Object.freeze({
    S: 'ขนาดเล็ก (S)',
    M: 'ขนาดกลาง (M)',
    L: 'ขนาดใหญ่ (L)'
  });

  const setText = (selector, text) => {
    const el = document.querySelector(selector);
    if (el && el.textContent !== text) el.textContent = text;
  };

  function setImportLabel() {
    const input = document.getElementById('mfpImport');
    const label = input?.closest('label');
    if (!label) return;
    const textNode = [...label.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.nodeValue = '📥 นำเข้าข้อมูล ';
  }

  function translateHeadings(root) {
    root.querySelectorAll('h2,h3,p,.mfp-muted,.mfp-note').forEach(el => {
      const text = (el.textContent || '').trim();
      if (text === 'ติดตามผล Plan vs Actual') el.textContent = 'ติดตามการใช้เงินจริงเทียบแผน';
      else if (text === 'ปรับแผน / Version Control') el.textContent = 'ปรับแผน / ประวัติฉบับ';
      else if (text === 'Dashboard แผนเงินบำรุงในอุปกรณ์นี้') el.textContent = 'ภาพรวมแผนเงินบำรุงในอุปกรณ์นี้';
      else if (text === 'Audit Pack / แฟ้มพร้อมตรวจ') el.textContent = 'แฟ้มเอกสารพร้อมตรวจสอบ';
      else if (text === 'เปรียบเทียบตามขนาด S / M / L') el.textContent = 'เปรียบเทียบตามขนาดหน่วยบริการ';
      else if (text.includes('Plan vs Actual')) el.textContent = text.replaceAll('Plan vs Actual', 'แผนเทียบผลใช้จริง');
      else if (text.includes('Audit Pack')) el.textContent = text.replaceAll('Audit Pack', 'แฟ้มเอกสารตรวจสอบ');
      else if (text.includes('Version')) el.textContent = text.replaceAll('Version', 'ฉบับ');
    });
  }

  function translateSize(root) {
    const population = document.getElementById('mfpPopulation');
    const result = window.GovPromptMaintenanceFundSML?.classifyPopulation?.(population?.value || 0);
    const sizeInput = document.getElementById('mfpFacilitySizeLabel');
    const badge = document.getElementById('mfpFacilitySizeBadge');
    if (result?.code && sizeInput) sizeInput.value = SIZE_LABELS[result.code] || result.label;
    if (result?.code && badge) badge.textContent = SIZE_LABELS[result.code] || result.label;

    root.querySelectorAll('.mfp-sml-badge').forEach(el => {
      const code = el.dataset.size || (el.textContent.match(/\b([SML])\b/) || [])[1] || '';
      if (SIZE_LABELS[code]) el.textContent = SIZE_LABELS[code];
    });

    root.querySelectorAll('[data-sml-filter]').forEach(button => {
      const code = button.dataset.smlFilter;
      const count = (button.textContent.match(/(\d+)\s*$/) || [])[1] || '0';
      if (code === 'ALL') button.textContent = `ทั้งหมด ${count}`;
      if (code === 'S') button.textContent = `ขนาดเล็ก (S) ${count}`;
      if (code === 'M') button.textContent = `ขนาดกลาง (M) ${count}`;
      if (code === 'L') button.textContent = `ขนาดใหญ่ (L) ${count}`;
      if (code === 'U') button.textContent = `ยังไม่ระบุขนาด ${count}`;
    });
  }

  function applyThaiLabels() {
    const root = document.getElementById('maintenanceFundApp');
    if (!root) return;

    const tabLabels = {
      plan: '📝 จัดทำแผน',
      tracking: '📈 ติดตามการใช้เงิน',
      adjust: '🔄 ปรับแผน',
      dashboard: '📊 ภาพรวม',
      audit: '🗂️ เอกสารตรวจสอบ'
    };
    Object.entries(tabLabels).forEach(([view, label]) => setText(`[data-view="${view}"]`, label));

    setText('#mfpExportWord', '📄 ดาวน์โหลดเอกสาร Word');
    setText('#mfpExportCsv', '📊 ดาวน์โหลดตารางแผน');
    setText('#mfpBackup', '💾 สำรองข้อมูล');
    setText('#mfpPrint', '🖨️ พิมพ์เอกสาร');
    setText('#mfpSaveTracking', '💾 บันทึกผลการใช้เงิน');
    setText('#mfpExportTracking', '📄 ดาวน์โหลดรายงานติดตาม');
    setText('#mfpSaveAudit', '💾 บันทึกรายการตรวจสอบ');
    setText('#mfpExportAudit', '📄 ดาวน์โหลดแฟ้มตรวจสอบ');
    setText('#mfpNewPlan', '+ สร้างแผนใหม่');
    setText('#mfpExportSml', '📊 ดาวน์โหลดตารางเปรียบเทียบ');
    setImportLabel();

    translateHeadings(root);
    translateSize(root);
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      applyThaiLabels();
    });
  };

  const start = () => {
    applyThaiLabels();
    document.getElementById('mfpPopulation')?.addEventListener('input', () => setTimeout(applyThaiLabels, 0));
    const root = document.getElementById('maintenanceFundApp');
    if (!root) return;
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
