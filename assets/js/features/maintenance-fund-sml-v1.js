(() => {
  'use strict';

  const META_KEY = 'govprompt.maintenanceFundFacilityMeta.v1';
  const CURRENT_KEY = 'govprompt.maintenanceFundPlan.current.v1';
  const SOURCE_URL = 'https://r8way.moph.go.th/r8wayNewadmin/page/upload_file/20211007065658.pdf';
  const SOURCE_LABEL = 'เกณฑ์การแบ่งขนาด รพ.สต./สอน. ตามจำนวนประชากรรับผิดชอบของกระทรวงสาธารณสุข';

  const api = () => window.GovPromptMaintenanceFundPlan;
  const parseNumber = value => api()?.parseNumber ? api().parseNumber(value) : Number(String(value ?? '').replace(/,/g, '')) || 0;
  const money = value => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(Number(value || 0));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));

  function classifyPopulation(value) {
    const population = Math.max(0, Math.floor(parseNumber(value)));
    if (!population) return Object.freeze({ code: '', label: 'ยังไม่จัดขนาด', population: 0, description: 'กรอกประชากรรับผิดชอบเพื่อจัด S/M/L' });
    if (population < 3000) return Object.freeze({ code: 'S', label: 'S — ขนาดเล็ก', population, description: 'ประชากรรับผิดชอบน้อยกว่า 3,000 คน' });
    if (population <= 8000) return Object.freeze({ code: 'M', label: 'M — ขนาดกลาง', population, description: 'ประชากรรับผิดชอบ 3,000–8,000 คน' });
    return Object.freeze({ code: 'L', label: 'L — ขนาดใหญ่', population, description: 'ประชากรรับผิดชอบ 8,001 คนขึ้นไป' });
  }

  function loadMetaMap() {
    try {
      const raw = JSON.parse(localStorage.getItem(META_KEY) || '{}');
      return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    } catch {
      return {};
    }
  }

  function saveMetaMap(map) {
    localStorage.setItem(META_KEY, JSON.stringify(map));
  }

  function currentPlanId() {
    return localStorage.getItem(CURRENT_KEY) || '';
  }

  let pendingMeta = { population: '', size: '', basis: 'responsibility-population' };
  let scheduled = false;

  function getMeta(planId = currentPlanId()) {
    const map = loadMetaMap();
    if (planId && map[planId]) return { ...pendingMeta, ...map[planId] };
    return { ...pendingMeta };
  }

  function setMeta(planId, meta) {
    if (!planId) return;
    const map = loadMetaMap();
    const size = classifyPopulation(meta.population);
    map[planId] = {
      population: size.population || '',
      size: size.code,
      sizeLabel: size.label,
      basis: 'responsibility-population',
      source: SOURCE_URL,
      updatedAt: new Date().toISOString()
    };
    saveMetaMap(map);
  }

  function removeMeta(planId) {
    if (!planId) return;
    const map = loadMetaMap();
    delete map[planId];
    saveMetaMap(map);
  }

  function installStyles() {
    if (document.getElementById('mfpSmlStyles')) return;
    const style = document.createElement('style');
    style.id = 'mfpSmlStyles';
    style.textContent = `
      .mfp-sml-badge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 9px;font-weight:800;font-size:12px;background:#eaf3ff;color:#0b3b75;border:1px solid #bfd5ef}
      .mfp-sml-badge[data-size="S"]{background:#eef8f1;color:#176b46;border-color:#c6e4d1}.mfp-sml-badge[data-size="M"]{background:#fff7df;color:#7b5a00;border-color:#efd68a}.mfp-sml-badge[data-size="L"]{background:#f4edff;color:#5d2c91;border-color:#d9c4ef}
      .mfp-sml-help{grid-column:1/-1;background:#f7fbff;border:1px solid #d8e8f7;border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.55}
      .mfp-sml-help a{color:#0b3b75}.mfp-sml-dashboard{margin-top:12px}.mfp-sml-filters{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.mfp-sml-filter{border:1px solid #cfd9e7;background:#fff;border-radius:999px;padding:7px 11px;cursor:pointer;font:inherit}.mfp-sml-filter.active{background:#0b3b75;color:#fff;border-color:#0b3b75}
      .mfp-sml-table td,.mfp-sml-table th{white-space:nowrap}.mfp-sml-table td:first-child,.mfp-sml-table th:first-child{position:sticky;left:0;background:#fff;z-index:1}.mfp-sml-mini{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:5px}.mfp-sml-pop{font-size:12px;color:#637287}
      @media(max-width:650px){.mfp-sml-filter{padding:8px 10px}.mfp-sml-help{font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  function updateSizeDisplay(population) {
    const result = classifyPopulation(population);
    const label = document.getElementById('mfpFacilitySizeLabel');
    const badge = document.getElementById('mfpFacilitySizeBadge');
    if (label) label.value = result.label;
    if (badge) {
      badge.dataset.size = result.code;
      badge.textContent = result.code ? `ขนาด ${result.code}` : 'ยังไม่จัดขนาด';
    }
    pendingMeta = { population: result.population || '', size: result.code, basis: 'responsibility-population' };
  }

  function capturePlanMeta() {
    const input = document.getElementById('mfpPopulation');
    if (!input) return;
    updateSizeDisplay(input.value);
  }

  function enhancePlanView() {
    const facility = document.getElementById('mfpFacility');
    if (!facility || document.getElementById('mfpPopulation')) return;
    const grid = facility.closest('.mfp-grid');
    if (!grid) return;
    const meta = getMeta();
    const size = classifyPopulation(meta.population);
    pendingMeta = { population: size.population || '', size: size.code, basis: 'responsibility-population' };
    grid.insertAdjacentHTML('beforeend', `
      <div class="mfp-field"><label>ประชากรรับผิดชอบ (คน)</label><input id="mfpPopulation" value="${esc(size.population || '')}" inputmode="numeric" placeholder="เช่น 2500"></div>
      <div class="mfp-field"><label>ขนาด รพ.สต./สอน.</label><div class="mfp-sml-mini"><input id="mfpFacilitySizeLabel" value="${esc(size.label)}" disabled><span id="mfpFacilitySizeBadge" class="mfp-sml-badge" data-size="${esc(size.code)}">${size.code ? `ขนาด ${size.code}` : 'ยังไม่จัดขนาด'}</span></div></div>
      <div class="mfp-sml-help"><b>จัดขนาดอัตโนมัติ:</b> S &lt; 3,000 คน · M 3,000–8,000 คน · L 8,001 คนขึ้นไป ใช้เพื่อจัดกลุ่มและเปรียบเทียบการบริหารแผนเท่านั้น <b>ไม่ใช่วงเงินเงินบำรุงมาตรฐาน</b> และไม่ควรนำขนาดไปกำหนดงบอัตโนมัติ <a href="${SOURCE_URL}" target="_blank" rel="noopener">↗ ${SOURCE_LABEL}</a></div>
    `);
    document.getElementById('mfpPopulation')?.addEventListener('input', event => updateSizeDisplay(event.target.value));
    updateSizeDisplay(size.population);
  }

  function aggregateBySize(plans, map) {
    const groups = {
      S: { code:'S', count:0, opening:0, income:0, plan:0, actual:0, closing:0 },
      M: { code:'M', count:0, opening:0, income:0, plan:0, actual:0, closing:0 },
      L: { code:'L', count:0, opening:0, income:0, plan:0, actual:0, closing:0 },
      U: { code:'ยังไม่ระบุ', count:0, opening:0, income:0, plan:0, actual:0, closing:0 }
    };
    plans.forEach(plan => {
      const summary = api().summarize(plan);
      const code = map[plan.id]?.size || classifyPopulation(map[plan.id]?.population).code || 'U';
      const group = groups[code] || groups.U;
      group.count += 1;
      group.opening += summary.opening;
      group.income += summary.income;
      group.plan += summary.plannedMaintenance;
      group.actual += summary.actual;
      group.closing += summary.forecastClosing;
    });
    return groups;
  }

  function downloadCsv(plans, map) {
    const rows = [['ขนาด','หน่วยบริการ','ประเภท','ปีงบประมาณ','ประชากรรับผิดชอบ','เงินต้นปี','รายรับคาดการณ์','แผนเงินบำรุง','จ่ายจริง','คงเหลือคาดการณ์']];
    plans.forEach(plan => {
      const summary = api().summarize(plan);
      const meta = map[plan.id] || {};
      const code = meta.size || classifyPopulation(meta.population).code || 'ไม่ระบุ';
      rows.push([code, plan.facility || '', plan.facilityType || '', plan.fiscalYear || '', meta.population || '', summary.opening, summary.income, summary.plannedMaintenance, summary.actual, summary.forecastClosing]);
    });
    const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'สรุปแผนเงินบำรุงตามขนาด_SML.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function applyFacilityFilter(code) {
    const map = loadMetaMap();
    document.querySelectorAll('.mfp-facility[data-plan-id]').forEach(row => {
      const meta = map[row.dataset.planId] || {};
      const size = meta.size || classifyPopulation(meta.population).code || 'U';
      row.hidden = code !== 'ALL' && size !== code;
    });
    document.querySelectorAll('.mfp-sml-filter').forEach(button => button.classList.toggle('active', button.dataset.smlFilter === code));
  }

  function enhanceDashboard() {
    const list = document.querySelector('.mfp-facility-list');
    if (!list || document.getElementById('mfpSmlDashboard')) return;
    const plans = api()?.loadAllPlans?.() || [];
    const map = loadMetaMap();
    const groups = aggregateBySize(plans, map);
    const rows = ['S','M','L','U'].map(code => {
      const g = groups[code];
      const avg = g.count ? g.plan / g.count : 0;
      return `<tr><td>${esc(g.code)}</td><td>${g.count}</td><td>${money(g.opening)}</td><td>${money(g.income)}</td><td>${money(g.plan)}</td><td>${money(g.actual)}</td><td>${money(g.closing)}</td><td>${money(avg)}</td></tr>`;
    }).join('');
    const section = document.createElement('section');
    section.id = 'mfpSmlDashboard';
    section.className = 'mfp-card mfp-sml-dashboard';
    section.innerHTML = `
      <div class="mfp-row-head"><div><h3>เปรียบเทียบตามขนาด S / M / L</h3><div class="mfp-muted">จัดกลุ่มจากประชากรรับผิดชอบ เพื่อช่วยติดตามหน่วยขนาดเดียวกัน ไม่ใช่เกณฑ์กำหนดวงเงินอัตโนมัติ</div></div><button class="mfp-btn" id="mfpExportSml">📊 ส่งออก S/M/L CSV</button></div>
      <div class="mfp-sml-filters"><button class="mfp-sml-filter active" data-sml-filter="ALL">ทั้งหมด ${plans.length}</button><button class="mfp-sml-filter" data-sml-filter="S">S ${groups.S.count}</button><button class="mfp-sml-filter" data-sml-filter="M">M ${groups.M.count}</button><button class="mfp-sml-filter" data-sml-filter="L">L ${groups.L.count}</button><button class="mfp-sml-filter" data-sml-filter="U">ยังไม่ระบุ ${groups.U.count}</button></div>
      <div class="mfp-table-wrap"><table class="mfp-table mfp-sml-table"><thead><tr><th>ขนาด</th><th>จำนวน</th><th>เงินต้นปี</th><th>รายรับคาดการณ์</th><th>แผน</th><th>จ่ายจริง</th><th>คงเหลือคาดการณ์</th><th>แผนเฉลี่ย/แห่ง</th></tr></thead><tbody>${rows}</tbody></table></div>
    `;
    const dashboardCards = list.closest('.mfp-card');
    dashboardCards?.parentNode?.insertBefore(section, dashboardCards);
    document.querySelectorAll('.mfp-facility[data-plan-id]').forEach(row => {
      const meta = map[row.dataset.planId] || {};
      const size = classifyPopulation(meta.population);
      const first = row.firstElementChild;
      if (!first || first.querySelector('.mfp-sml-mini')) return;
      first.insertAdjacentHTML('beforeend', `<div class="mfp-sml-mini"><span class="mfp-sml-badge" data-size="${esc(meta.size || size.code)}">${meta.size || size.code ? `ขนาด ${esc(meta.size || size.code)}` : 'ยังไม่ระบุขนาด'}</span><span class="mfp-sml-pop">${meta.population ? `${money(meta.population)} คน` : 'ยังไม่กรอกประชากร'}</span></div>`);
    });
    section.querySelectorAll('[data-sml-filter]').forEach(button => button.addEventListener('click', () => applyFacilityFilter(button.dataset.smlFilter)));
    document.getElementById('mfpExportSml')?.addEventListener('click', () => downloadCsv(plans, map));
  }

  function enhance() {
    installStyles();
    enhancePlanView();
    enhanceDashboard();
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  }

  document.addEventListener('click', event => {
    const save = event.target.closest('#mfpSave');
    if (save) {
      capturePlanMeta();
      const meta = { ...pendingMeta };
      setTimeout(() => {
        const id = currentPlanId();
        if (id) setMeta(id, meta);
        scheduleEnhance();
      }, 0);
    }
    const newPlan = event.target.closest('#mfpNewPlan');
    if (newPlan) pendingMeta = { population:'', size:'', basis:'responsibility-population' };
    const deletePlan = event.target.closest('[data-delete-plan]');
    if (deletePlan) removeMeta(deletePlan.dataset.deletePlan);
  }, true);

  const observer = new MutationObserver(scheduleEnhance);
  const start = () => {
    const root = document.getElementById('maintenanceFundApp');
    if (!root) return;
    observer.observe(root, { childList:true, subtree:true });
    enhance();
  };

  window.GovPromptMaintenanceFundSML = Object.freeze({
    META_KEY,
    SOURCE_URL,
    classifyPopulation,
    loadMetaMap,
    getMeta,
    aggregateBySize
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
