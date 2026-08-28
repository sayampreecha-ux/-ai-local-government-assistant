(() => {
  'use strict';

  const SIZE_LABELS = Object.freeze({
    S: 'ขนาดเล็ก (S)',
    M: 'ขนาดกลาง (M)',
    L: 'ขนาดใหญ่ (L)'
  });
  const VIEW_LABELS = Object.freeze({
    plan: { full: 'จัดทำแผน', dock: 'แผน', icon: '📝' },
    tracking: { full: 'ติดตามการใช้เงิน', dock: 'ใช้เงินจริง', icon: '📈' },
    adjust: { full: 'ปรับแผน', dock: 'ปรับแผน', icon: '🔄' },
    dashboard: { full: 'ภาพรวม', dock: 'ภาพรวม', icon: '📊' },
    audit: { full: 'เอกสารตรวจสอบ', dock: 'ตรวจเอกสาร', icon: '🗂️' }
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

  function installPersistentNavStyles() {
    if (document.getElementById('mfpPersistentNavStyles')) return;
    const style = document.createElement('style');
    style.id = 'mfpPersistentNavStyles';
    style.textContent = `
      .mfp-persistent-nav{position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:80;width:min(720px,calc(100% - 20px));display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:7px;background:rgba(255,255,255,.97);border:1px solid #d9e2ef;border-radius:16px;box-shadow:0 10px 32px rgba(16,35,63,.18);backdrop-filter:blur(12px)}
      .mfp-persistent-nav button{min-width:0;border:0;background:transparent;border-radius:11px;padding:7px 4px;color:#52657d;font:inherit;font-size:12px;line-height:1.15;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;touch-action:manipulation}
      .mfp-persistent-nav button .mfp-nav-icon{font-size:18px;line-height:1}.mfp-persistent-nav button.active{background:#0b3b75;color:#fff;font-weight:800}.mfp-persistent-nav button:focus-visible{outline:3px solid #8db8ef;outline-offset:1px}
      .mfp-persistent-nav-status{position:fixed;right:12px;bottom:calc(max(10px,env(safe-area-inset-bottom)) + 70px);z-index:79;border:1px solid #d9e2ef;background:#fff;color:#31445c;border-radius:999px;padding:6px 10px;font-size:12px;box-shadow:0 5px 16px rgba(16,35,63,.12)}
      body{padding-bottom:92px!important}
      @media(min-width:760px){.mfp-persistent-nav{bottom:14px;width:min(760px,calc(100% - 32px))}.mfp-persistent-nav button{flex-direction:row;font-size:13px;padding:9px 7px}.mfp-persistent-nav-status{right:18px;bottom:78px}}
      @media print{.mfp-persistent-nav,.mfp-persistent-nav-status{display:none!important}body{padding-bottom:0!important}}
    `;
    document.head.appendChild(style);
  }

  function detectActiveView() {
    const candidates = [...document.querySelectorAll('#maintenanceFundApp [data-view]')];
    const active = candidates.find(el => el.classList.contains('active') || el.getAttribute('aria-selected') === 'true' || el.dataset.active === 'true');
    if (active?.dataset?.view && VIEW_LABELS[active.dataset.view]) return active.dataset.view;
    const text = document.getElementById('mfpView')?.innerText || '';
    if (/ติดตามการใช้เงินจริงเทียบแผน|ติดตามผล/.test(text)) return 'tracking';
    if (/ปรับแผน \/ ประวัติฉบับ|ปรับแผน \/ Version/.test(text)) return 'adjust';
    if (/แฟ้มเอกสารพร้อมตรวจสอบ|Audit Pack/.test(text)) return 'audit';
    if (/ภาพรวมแผนเงินบำรุง|จำนวนแผน|เปรียบเทียบตามขนาดหน่วยบริการ/.test(text)) return 'dashboard';
    return 'plan';
  }

  function updatePersistentNavState(view = detectActiveView()) {
    const nav = document.getElementById('mfpPersistentNav');
    if (!nav) return;
    nav.querySelectorAll('[data-persistent-view]').forEach(button => {
      const selected = button.dataset.persistentView === view;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-current', selected ? 'page' : 'false');
    });
    const status = document.getElementById('mfpPersistentNavStatus');
    if (status) status.textContent = `อยู่ที่: ${VIEW_LABELS[view]?.full || 'จัดทำแผน'}`;
  }

  function openView(view) {
    const target = [...document.querySelectorAll('#maintenanceFundApp [data-view]')].find(el => el.dataset.view === view);
    if (!target) return;
    target.click();
    requestAnimationFrame(() => {
      updatePersistentNavState(view);
      window.scrollTo({ top: Math.max(0, document.getElementById('maintenanceFundApp')?.offsetTop - 66), behavior: 'smooth' });
    });
  }

  function ensurePersistentNav() {
    installPersistentNavStyles();
    if (!document.getElementById('mfpPersistentNav')) {
      const nav = document.createElement('nav');
      nav.id = 'mfpPersistentNav';
      nav.className = 'mfp-persistent-nav';
      nav.setAttribute('aria-label', 'เมนูหลักแผนเงินบำรุง');
      nav.innerHTML = Object.entries(VIEW_LABELS).map(([view, info]) => `<button type="button" data-persistent-view="${view}" title="${info.full}"><span class="mfp-nav-icon" aria-hidden="true">${info.icon}</span><span>${info.dock}</span></button>`).join('');
      document.body.appendChild(nav);
      nav.addEventListener('click', event => {
        const button = event.target.closest('[data-persistent-view]');
        if (button) openView(button.dataset.persistentView);
      });
    }
    if (!document.getElementById('mfpPersistentNavStatus')) {
      const status = document.createElement('div');
      status.id = 'mfpPersistentNavStatus';
      status.className = 'mfp-persistent-nav-status';
      status.setAttribute('aria-live', 'polite');
      document.body.appendChild(status);
    }
    document.querySelectorAll('#maintenanceFundApp [data-view]').forEach(tab => {
      if (tab.dataset.persistentNavBound === '1') return;
      tab.dataset.persistentNavBound = '1';
      tab.addEventListener('click', () => setTimeout(() => updatePersistentNavState(tab.dataset.view), 0));
    });
    updatePersistentNavState();
  }

  function applyThaiLabels() {
    const root = document.getElementById('maintenanceFundApp');
    if (!root) return;

    Object.entries(VIEW_LABELS).forEach(([view, info]) => setText(`[data-view="${view}"]`, `${info.icon} ${info.full}`));

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
    ensurePersistentNav();
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
