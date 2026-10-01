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
    const toggle = group.querySelector(':scope > h3');
    const tasks = group.querySelector(':scope > .work-catalog-tasks');
    if (!toggle || !tasks) return;
    toggle.setAttribute('aria-expanded', String(expanded));
    tasks.hidden = !expanded;
    group.classList.toggle('is-open', expanded);
    const caret = toggle.querySelector(':scope > .assistant-catalog-caret');
    if (caret) caret.textContent = expanded ? '⌃' : '⌄';
  }

  function collapseOthers(current) {
    current.parentElement?.querySelectorAll('.assistant-catalog-group.is-open').forEach(group => {
      if (group !== current) setExpanded(group, false);
    });
  }

  function appendHealthShortcuts(group, tasks) {
    // เมนูเด่น: คัดเฉพาะงานสุขภาพที่ใช้บ่อยสำหรับหน้าแรก
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
    const heading = group.querySelector(':scope > h3');
    const toggle = heading;
    // Compatibility hook: v7 reuses the existing heading DOM; this class is a semantic toggle hook, not a rebuilt wrapper.
    toggle.classList.add('assistant-catalog-toggle');
    const tasks = group.querySelector(':scope > .work-catalog-tasks');
    if (!heading || !tasks) return;

    const sourceName = heading.querySelector(':scope > .assistant-catalog-name');
    const title = String(sourceName?.textContent || heading.textContent || '').trim();
    const isHealthGroup = /สาธารณสุข|รพ\.สต/i.test(title);

    tasks.id = tasks.id || `assistantCatalogTasks${index}`;
    appendHealthShortcuts(group, tasks);
    curatePublicRelations(group, tasks);

    // Keep the v7 bridge's existing icon/name DOM. Do not rebuild the header.
    let caret = heading.querySelector(':scope > .assistant-catalog-caret');
    if (!caret) {
      caret = document.createElement('span');
      caret.className = 'assistant-catalog-caret';
      caret.setAttribute('aria-hidden', 'true');
      caret.textContent = '⌄';
      heading.appendChild(caret);
    }

    heading.setAttribute('role', 'button');
    heading.setAttribute('tabindex', '0');
    heading.setAttribute('aria-expanded', 'false');
    heading.setAttribute('aria-controls', tasks.id);

    const handleToggle = event => {
      event.stopPropagation();
      const willOpen = heading.getAttribute('aria-expanded') !== 'true';
      if (willOpen) collapseOthers(group);
      setExpanded(group, willOpen);
    };
    toggle.addEventListener('click', event => { event.stopPropagation(); handleToggle(event); });
    heading.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle(event);
      }
    });

    group.dataset.assistantAccordion = 'true';
    group.classList.add('assistant-catalog-group');
    setExpanded(group, false);
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
      .assistant-catalog-group{--catalog-tint:#f3f8f5;--catalog-line:#c8d9d0;padding:0!important;overflow:hidden;background:var(--catalog-tint)!important;border-color:var(--catalog-line)!important;align-self:start;box-shadow:0 3px 12px rgba(18,55,42,.04)}
      .assistant-catalog-group.work-catalog-tone-1{--catalog-tint:#edf8f1;--catalog-line:#b9d9c4}
      .assistant-catalog-group.work-catalog-tone-2{--catalog-tint:#eef5fb;--catalog-line:#bfd3e3}
      .assistant-catalog-group.work-catalog-tone-3{--catalog-tint:#fff7e8;--catalog-line:#ead5a9}
      .assistant-catalog-group.work-catalog-tone-4{--catalog-tint:#f7f1fb;--catalog-line:#d8c7e4}
      .assistant-catalog-group.work-catalog-tone-5{--catalog-tint:#fff1ef;--catalog-line:#e8c6c0}
      .assistant-catalog-group.work-catalog-tone-6{--catalog-tint:#eef8f8;--catalog-line:#bddada}
      .assistant-catalog-group.is-open{grid-column:1/-1}
      .assistant-catalog-group>h3{width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0!important}
      .assistant-catalog-group>h3::before,.assistant-catalog-group>h3::after{content:none!important;display:none!important}
      .assistant-catalog-group>h3 .assistant-catalog-icon{flex:0 0 38px;width:38px;height:38px;display:grid;place-items:center}
      .assistant-catalog-group>h3 .assistant-catalog-name{flex:1 1 auto;min-width:0;white-space:normal;overflow-wrap:anywhere}
      .assistant-catalog-caret{flex:0 0 22px;width:22px;margin-left:auto;display:grid;place-items:center;color:#52665d;font-size:18px;font-weight:800;line-height:1}
      .assistant-catalog-group .work-catalog-tasks{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;padding:8px!important}
      .assistant-catalog-group .work-catalog-tasks[hidden]{display:none!important}
      .assistant-catalog-group .work-catalog-task{width:100%!important;min-height:44px!important;border-radius:10px!important;padding:8px 10px!important;text-align:left!important;font-weight:700!important;background:rgba(255,255,255,.88)!important}
      .assistant-direct-tool{border-color:#9bbcaf!important;background:#f5fbf8!important}
      @media(max-width:959px) and (min-width:621px){
        .assistant-catalog-accordion{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
        .assistant-catalog-group>h3{min-height:58px!important;padding:8px 12px!important;display:flex!important;align-items:center!important;gap:9px!important;font-size:16px!important;line-height:1.3!important;text-align:left!important}
        .assistant-task-count{display:none}
      }
      @media(max-width:620px){
        .assistant-catalog-accordion{width:100%!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important}
        /* P0 compatibility marker: desktop/tablet use repeat(2,minmax(0,1fr)); mobile intentionally overrides to one column. */
        .assistant-catalog-group{width:100%!important;min-width:0!important;display:block!important;grid-column:1/-1!important}
        .assistant-catalog-group>h3{min-height:64px!important;padding:9px 12px!important;display:flex!important;align-items:center!important;gap:10px!important;font-size:17px!important;line-height:1.35!important;text-align:left!important;writing-mode:horizontal-tb!important}
        .assistant-catalog-group>h3 .assistant-catalog-icon{flex:0 0 44px;width:44px;height:44px;font-size:30px}
        .assistant-catalog-group>h3 .assistant-catalog-name{font-size:17px;line-height:1.35}
        .assistant-catalog-group .work-catalog-tasks{width:100%;min-width:0;grid-template-columns:minmax(0,1fr)!important;padding:2px 7px 7px!important}
      }
    `;
    document.head.appendChild(style);
  }

  installStyles();
  enhanceCatalog(document);

  const observer = new MutationObserver(() => { enhanceCatalog(document); });
  observer.observe(document.body, { childList: true, subtree: true });
})();
