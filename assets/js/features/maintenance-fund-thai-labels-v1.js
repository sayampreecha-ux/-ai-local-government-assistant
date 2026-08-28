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
    if (textNode && textNode.nodeValue !== '📥 นำเข้าข้อมูล ') textNode.nodeValue = '📥 นำเข้าข้อมูล ';
  }

  function translateHeadings(root) {
    root.querySelectorAll('h2,h3,p,.mfp-muted,.mfp-note').forEach(el => {
      const text = (el.textContent || '').trim();
      let replacement = '';
      if (text === 'ติดตามผล Plan vs Actual') replacement = 'ติดตามการใช้เงินจริงเทียบแผน';
      else if (text === 'ปรับแผน / Version Control') replacement = 'ปรับแผน / ประวัติฉบับ';
      else if (text === 'Dashboard แผนเงินบำรุงในอุปกรณ์นี้') replacement = 'ภาพรวมแผนเงินบำรุงในอุปกรณ์นี้';
      else if (text === 'Audit Pack / แฟ้มพร้อมตรวจ') replacement = 'แฟ้มเอกสารพร้อมตรวจสอบ';
      else if (text === 'เปรียบเทียบตามขนาด S / M / L') replacement = 'เปรียบเทียบตามขนาดหน่วยบริการ';
      else if (text.includes('Plan vs Actual')) replacement = text.replaceAll('Plan vs Actual', 'แผนเทียบผลใช้จริง');
      else if (text.includes('Audit Pack')) replacement = text.replaceAll('Audit Pack', 'แฟ้มเอกสารตรวจสอบ');
      else if (text.includes('Version')) replacement = text.replaceAll('Version', 'ฉบับ');
      if (replacement && replacement !== text) el.textContent = replacement;
    });
  }

  function translateSize(root) {
    const population = document.getElementById('mfpPopulation');
    const result = window.GovPromptMaintenanceFundSML?.classifyPopulation?.(population?.value || 0);
    const sizeInput = document.getElementById('mfpFacilitySizeLabel');
    const badge = document.getElementById('mfpFacilitySizeBadge');
    if (result?.code && sizeInput) {
      const value = SIZE_LABELS[result.code] || result.label;
      if (sizeInput.value !== value) sizeInput.value = value;
    }
    if (result?.code && badge) {
      const value = SIZE_LABELS[result.code] || result.label;
      if (badge.textContent !== value) badge.textContent = value;
    }

    root.querySelectorAll('.mfp-sml-badge').forEach(el => {
      const code = el.dataset.size || (el.textContent.match(/\b([SML])\b/) || [])[1] || '';
      const value = SIZE_LABELS[code];
      if (value && el.textContent !== value) el.textContent = value;
    });

    root.querySelectorAll('[data-sml-filter]').forEach(button => {
      const code = button.dataset.smlFilter;
      const count = (button.textContent.match(/(\d+)\s*$/) || [])[1] || '0';
      let value = '';
      if (code === 'ALL') value = `ทั้งหมด ${count}`;
      if (code === 'S') value = `ขนาดเล็ก (S) ${count}`;
      if (code === 'M') value = `ขนาดกลาง (M) ${count}`;
      if (code === 'L') value = `ขนาดใหญ่ (L) ${count}`;
      if (code === 'U') value = `ยังไม่ระบุขนาด ${count}`;
      if (value && button.textContent !== value) button.textContent = value;
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
