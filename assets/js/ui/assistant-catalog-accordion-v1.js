(() => {
  'use strict';

  const ICONS = Object.freeze([
    [/บริหาร|ผู้บริหาร/i, '👔'], [/สารบรรณ|หนังสือราชการ/i, '📄'], [/แผน|โครงการ|งบประมาณ/i, '📊'],
    [/พัสดุ|จัดซื้อจัดจ้าง/i, '🛒'], [/การเงิน|คลัง|เบิกจ่าย/i, '💰'], [/บุคคล|HR/i, '👥'],
    [/ช่าง|วิศวกรรม/i, '🏗️'], [/กฎหมาย|ระเบียบ/i, '⚖️'], [/สภา/i, '🏛️'], [/สาธารณสุข|รพ\.สต/i, '🩺'],
    [/การศึกษา|เยาวชน|กีฬา/i, '🎓'], [/ประชาสัมพันธ์|สื่อสาร|ข่าว/i, '📣'], [/PDPA|คุ้มครองข้อมูล|ข้อมูลส่วนบุคคล/i, '🔒']
  ]);

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
    const patterns = [
      /เขียนข่าวประชาสัมพันธ์|ข่าวประชาสัมพันธ์/i,
      /ทำโพสต์.*โซเชียล|โพสต์.*Facebook/i,
      /อินโฟกราฟิก/i,
      /ร่างสคริปต์|สคริปต์.*วิดีโอ|คำกล่าว|วิดีโอ/i
    ];
    const kept = new Set();
    [...tasks.querySelectorAll('.work-catalog-task')].forEach(button => {
      const label = String(button.textContent || '').trim();
      const match = patterns.findIndex(pattern => pattern.test(label));
      if (match < 0 || kept.has(match)) { button.remove(); return; }
      kept.add(match);
      if (match === 0) button.textContent = 'เขียนข่าวประชาสัมพันธ์';
      if (match === 1) button.textContent = 'ทำโพสต์โซเชียล';
      if (match === 2) button.textContent = 'ทำอินโฟกราฟิก';
      if (match === 3) button.textContent = 'ร่างสคริปต์ / คำกล่าว / วิดีโอ';
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

  function enhanceCatalog(root = document) {
    const groups = root.querySelector?.('.work-catalog-groups');
    if (!groups) return false;
    groups.classList.add('assistant-catalog-accordion');
    groups.querySelectorAll('.work-catalog-group').forEach(enhanceGroup);
    return true;
  }

  function installStyles() {
    if (document.getElementById('assistantCatalogAccordionStyles')) return;
    const style = document.createElement('style');
    style.id = 'assistantCatalogAccordionStyles';
    style.textContent = `
      .assistant-catalog-accordion{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px!important}
      .assistant-catalog-group{--catalog-tint:#f3f8f5;--catalog-line:#c8d9d0;padding:0!important;overflow:hidden;background:var(--catalog-tint)!important;border-color:var(--catalog-line)!important;align-self:start;box-shadow:0 5px 18px rgba(18,55,42,.045)}
      .assistant-catalog-group.work-catalog-tone-1{--catalog-tint:#edf8f1;--catalog-line:#b9d9c4}
      .assistant-catalog-group.work-catalog-tone-2{--catalog-tint:#eef5fb;--catalog-line:#bfd3e3}
      .assistant-catalog-group.work-catalog-tone-3{--catalog-tint:#fff7e8;--catalog-line:#ead5a9}
      .assistant-catalog-group.work-catalog-tone-4{--catalog-tint:#f7f1fb;--catalog-line:#d8c7e4}
      .assistant-catalog-group.work-catalog-tone-5{--catalog-tint:#fff1ef;--catalog-line:#e8c6c0}
      .assistant-catalog-group.work-catalog-tone-6{--catalog-tint:#eef8f8;--catalog-line:#bddada}
      .assistant-catalog-group.is-open{grid-column:1/-1}
      .assistant-catalog-group>h3{margin:0!important}
      .assistant-catalog-toggle{width:100%;min-height:66px;border:0;background:transparent;color:#12372a;padding:11px 12px;display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:8px;align-items:center;text-align:left;font:inherit;font-weight:800;line-height:1.35;cursor:pointer}
      .assistant-catalog-toggle:hover,.assistant-catalog-toggle:focus-visible,.assistant-catalog-toggle[aria-expanded="true"]{background:rgba(255,255,255,.55);outline:none}
      .assistant-catalog-toggle:focus-visible{box-shadow:inset 0 0 0 2px #12372a}
      .assistant-catalog-icon{font-size:1.35rem}
      .assistant-catalog-name{min-width:0;overflow-wrap:anywhere}
      .assistant-task-count{font-size:.78rem;font-weight:700;color:#64756d;white-space:nowrap}
      .assistant-catalog-caret{font-size:1rem;color:#52665d}
      .assistant-catalog-group .work-catalog-tasks{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;padding:2px 10px 10px!important}
      .assistant-catalog-group .work-catalog-tasks[hidden]{display:none!important}
      .assistant-catalog-group .work-catalog-task{width:100%!important;min-height:48px!important;border-radius:11px!important;padding:10px 12px!important;text-align:left!important;font-weight:700!important;background:rgba(255,255,255,.88)!important}
      .assistant-direct-tool{border-color:#9bbcaf!important;background:#f5fbf8!important}
      @media(max-width:959px){.assistant-catalog-accordion{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:620px){.assistant-catalog-accordion{gap:8px!important}.assistant-catalog-group.is-open{grid-column:1/-1}.assistant-catalog-toggle{min-height:64px;padding:8px;grid-template-columns:auto minmax(0,1fr) auto;gap:6px;font-size:.82rem}.assistant-catalog-icon{font-size:1.18rem}.assistant-task-count{display:none}.assistant-catalog-caret{font-size:.9rem}.assistant-catalog-group .work-catalog-tasks{grid-template-columns:1fr!important;padding:2px 8px 8px!important}.assistant-catalog-group .work-catalog-task{font-size:.84rem!important}}
    `;
    document.head.appendChild(style);
  }

  installStyles();
  enhanceCatalog(document);

  const observer = new MutationObserver(() => { enhanceCatalog(document); });
  observer.observe(document.body, { childList: true, subtree: true });
})();
