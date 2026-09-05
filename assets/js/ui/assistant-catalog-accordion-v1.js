(() => {
  'use strict';

  const ICONS = Object.freeze([
    [/บริหาร|ผู้บริหาร/i, '👔'], [/สารบรรณ|หนังสือราชการ/i, '📄'], [/แผน|โครงการ|งบประมาณ/i, '📊'],
    [/พัสดุ|จัดซื้อจัดจ้าง/i, '🛒'], [/การเงิน|คลัง|เบิกจ่าย/i, '💰'], [/บุคคล|HR/i, '👥'],
    [/ช่าง|วิศวกรรม/i, '🏗️'], [/กฎหมาย|ระเบียบ/i, '⚖️'], [/สภา/i, '🏛️'], [/สาธารณสุข|รพ\.สต/i, '🩺'],
    [/การศึกษา|เยาวชน|กีฬา/i, '🎓'], [/ประชาสัมพันธ์|สื่อสาร|ข่าว/i, '📣'], [/PDPA|คุ้มครองข้อมูล|ข้อมูลส่วนบุคคล/i, '🔒']
  ]);

  const OPENER_LABEL = 'ผู้ช่วยงานราชการทั้งหมด';
  const INTRO_LABEL = 'เลือกงานที่ต้องการครั้งเดียว แล้วบอก GP ได้เลย';
  const iconFor = title => ICONS.find(([pattern]) => pattern.test(title))?.[1] || '🧰';

  function setExpanded(group, expanded) {
    const toggle = group.querySelector('.assistant-catalog-toggle');
    const tasks = group.querySelector('.work-catalog-tasks');
    if (!toggle || !tasks) return;
    toggle.setAttribute('aria-expanded', String(expanded));
    tasks.hidden = !expanded;
    group.classList.toggle('is-open', expanded);
    const caret = toggle.querySelector('.assistant-catalog-caret');
    if (caret) caret.textContent = expanded ? '⌃' : '⌄';
  }

  function collapseOthers(current) {
    current.parentElement?.querySelectorAll('.assistant-catalog-group.is-open').forEach(group => {
      if (group !== current) setExpanded(group, false);
    });
  }

  function appendHealthShortcuts(group, tasks) {
    const title = String(group.querySelector('h3')?.textContent || group.textContent || '');
    if (!/สาธารณสุข|รพ\.สต/i.test(title) || tasks.dataset.healthFeaturedCurated === 'true') return;
    [...tasks.querySelectorAll('.work-catalog-task')].forEach(button => {
      const label = String(button.textContent || '').trim();
      if (/PDPA|ข้อมูลสุขภาพ/i.test(label)) button.remove();
    });
    const existing = [...tasks.querySelectorAll('.work-catalog-task')];
    const keepPatterns = [/โครงการ.*สุขภาพ|สุขภาพ.*NCD|NCD/i, /กองทุน.*สปสช|สปสช/i, /งาน.*รพ\.สต|แผนสุขภาพ|สุขภาพชุมชน/i];
    const kept = new Set();
    existing.forEach(button => {
      const label = String(button.textContent || '').trim();
      const matched = keepPatterns.findIndex(pattern => pattern.test(label));
      if (matched < 0 || kept.has(matched)) { button.remove(); return; }
      kept.add(matched);
      if (matched === 2) {
        const gateway = document.createElement('button');
        gateway.type = 'button'; gateway.className = button.className;
        gateway.textContent = '🏥 งาน รพ.สต. / งานสุขภาพทั้งหมด'; gateway.dataset.healthGateway = 'true';
        gateway.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); window.location.assign('gp008.html'); });
        button.replaceWith(gateway);
      }
    });
    [{ label: '💰 แผนเงินบำรุง รพ.สต./สอน.', href: 'maintenance-fund-plan.html' }, { label: '👥 แผนลูกจ้างเงินบำรุง', href: 'temp-staff-wizard.html' }].forEach(item => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'work-catalog-task assistant-direct-tool';
      button.dataset.healthShortcut = 'true'; button.textContent = item.label; button.addEventListener('click', () => { window.location.href = item.href; }); tasks.appendChild(button);
    });
    tasks.dataset.healthFeaturedCurated = 'true';
  }

  function curatePublicRelations(group, tasks) {
    const title = String(group.querySelector('h3')?.textContent || group.textContent || '');
    if (!/ประชาสัมพันธ์|สื่อสาร/i.test(title) || tasks.dataset.prSimple === 'true') return;
    const patterns = [/เขียนข่าวประชาสัมพันธ์|ข่าวประชาสัมพันธ์/i, /ทำโพสต์.*โซเชียล|โพสต์.*Facebook/i, /อินโฟกราฟิก/i];
    const kept = new Set();
    [...tasks.querySelectorAll('.work-catalog-task')].forEach(button => {
      const label = String(button.textContent || '').trim();
      const match = patterns.findIndex(pattern => pattern.test(label));
      if (match < 0 || kept.has(match)) { button.remove(); return; }
      kept.add(match);
      if (match === 0) button.textContent = 'เขียนข่าวประชาสัมพันธ์';
      if (match === 1) button.textContent = 'ทำโพสต์โซเชียล';
      if (match === 2) button.textContent = 'ทำอินโฟกราฟิก';
    });
    const image = document.createElement('button');
    image.type = 'button'; image.className = 'work-catalog-task assistant-direct-tool'; image.dataset.prImageShortcut = 'true'; image.textContent = '✨ ทำภาพประชาสัมพันธ์';
    image.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); window.location.assign('gp012.html?mode=image-prompt'); });
    tasks.appendChild(image);
    tasks.dataset.prSimple = 'true';
  }

  function enhanceGroup(group, index) {
    if (group.dataset.assistantAccordion === 'true') return;
    const heading = group.querySelector('h3'); const tasks = group.querySelector('.work-catalog-tasks'); if (!heading || !tasks) return;
    const title = String(heading.textContent || '').trim(); const isHealthGroup = /สาธารณสุข|รพ\.สต/i.test(title);
    tasks.id = tasks.id || `assistantCatalogTasks${index}`;
    appendHealthShortcuts(group, tasks); curatePublicRelations(group, tasks);
    const visibleCount = tasks.querySelectorAll('.work-catalog-task').length;
    const countLabel = isHealthGroup ? `${visibleCount} เมนูเด่น` : `${visibleCount} งาน`;
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'assistant-catalog-toggle'; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-controls', tasks.id);
    toggle.innerHTML = `<span class="assistant-catalog-icon" aria-hidden="true">${iconFor(title)}</span><span class="assistant-catalog-name">${title}</span><span class="assistant-task-count">${countLabel}</span><span class="assistant-catalog-caret" aria-hidden="true">⌄</span>`;
    toggle.addEventListener('click', () => { const willOpen = toggle.getAttribute('aria-expanded') !== 'true'; collapseOthers(group); setExpanded(group, willOpen); if (willOpen) group.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); });
    heading.textContent = ''; heading.appendChild(toggle); group.dataset.assistantAccordion = 'true'; group.classList.add('assistant-catalog-group'); setExpanded(group, false);
  }

  function wireSearch(root) {
    const search = root.querySelector('.work-catalog-search'); if (!search || search.dataset.assistantAccordion === 'true') return;
    search.dataset.assistantAccordion = 'true'; search.addEventListener('input', () => setTimeout(() => {
      const query = String(search.value || '').trim(); root.querySelectorAll('.assistant-catalog-group').forEach(group => { if (!query) setExpanded(group, false); else setExpanded(group, !group.hidden && group.style.display !== 'none'); });
    }, 0));
  }

  function enhanceCatalog(root = document) {
    const opener = document.querySelector('.work-catalog-open'); if (opener && opener.textContent !== OPENER_LABEL) opener.textContent = OPENER_LABEL;
    const intro = root.querySelector?.('.work-catalog-intro'); if (intro && intro.textContent !== INTRO_LABEL) intro.textContent = INTRO_LABEL;
    const groups = root.querySelector?.('.work-catalog-groups'); if (!groups) return false;
    groups.classList.add('assistant-catalog-accordion'); groups.querySelectorAll('.work-catalog-group').forEach(enhanceGroup); wireSearch(root); return true;
  }

  function installStyles() {
    if (document.getElementById('assistantCatalogAccordionStyles')) return;
    const style = document.createElement('style'); style.id = 'assistantCatalogAccordionStyles'; style.textContent = `
      .assistant-catalog-accordion{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px!important}.assistant-catalog-group{padding:0!important;overflow:hidden;background:#fff!important;align-self:start}.assistant-catalog-group.is-open{grid-column:1/-1}.assistant-catalog-group>h3{margin:0!important}.assistant-catalog-toggle{width:100%;min-height:54px;border:0;background:#fff;color:#12372a;padding:10px 12px;display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:8px;align-items:center;text-align:left;font:inherit;font-weight:800;cursor:pointer}.assistant-catalog-toggle:hover,.assistant-catalog-toggle:focus-visible,.assistant-catalog-toggle[aria-expanded="true"]{background:#edf6f1;outline:none}.assistant-catalog-toggle:focus-visible{box-shadow:inset 0 0 0 2px #12372a}.assistant-catalog-icon{font-size:1.2rem}.assistant-catalog-name{min-width:0;overflow-wrap:anywhere}.assistant-task-count{font-size:.78rem;font-weight:700;color:#64756d;white-space:nowrap}.assistant-catalog-caret{font-size:1rem;color:#52665d}.assistant-catalog-group .work-catalog-tasks{display:grid!important;grid-template-columns:1fr!important;gap:6px!important;padding:0 10px 10px!important}.assistant-catalog-group .work-catalog-tasks[hidden]{display:none!important}.assistant-catalog-group .work-catalog-task{width:100%!important;border-radius:10px!important;padding:10px 12px!important;text-align:left!important;font-weight:700!important}.assistant-direct-tool{border-color:#9bbcaf!important;background:#f5fbf8!important}@media(max-width:680px){.assistant-catalog-accordion{grid-template-columns:1fr!important}.assistant-catalog-group.is-open{grid-column:auto}.assistant-catalog-toggle{min-height:50px;padding:9px 10px}.assistant-task-count{font-size:.74rem}}`;
    document.head.appendChild(style);
  }

  installStyles(); enhanceCatalog(document);
  const observer = new MutationObserver(() => { enhanceCatalog(document); }); observer.observe(document.body, { childList: true, subtree: true });
})();