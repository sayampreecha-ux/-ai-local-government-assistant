(() => {
  'use strict';
  const api = window.GovPromptCore?.CircularWatch;
  const $ = id => document.getElementById(id);
  const make = (tag, value) => { const node = document.createElement(tag); if (value !== undefined) node.textContent = String(value); return node; };
  const allowed = new Set(['www.dla.go.th','dla.go.th','www.cgd.go.th','cgd.go.th','www.gprocurement.go.th','gprocurement.go.th','cmsmoi.moi.go.th','moi.go.th','www.moi.go.th','ratchakitcha.soc.go.th']);
  const safeUrl = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.port && allowed.has(url.hostname) ? url.href : null; }
    catch { return null; }
  };
  const PAGE = 20;
  let registry, offset = 0, loaded = false, partial = false;
  const sourceFallback = [
    ['กรมบัญชีกลาง / e-GP', 'https://www.gprocurement.go.th/'],
    ['กรมส่งเสริมการปกครองท้องถิ่น', 'https://www.dla.go.th/land/officialDoc.do'],
    ['กระทรวงมหาดไทย', 'https://cmsmoi.moi.go.th/'],
    ['ราชกิจจานุเบกษา', 'https://ratchakitcha.soc.go.th/search-result/']
  ];
  const addLink = (parent, label, href) => {
    const safe = safeUrl(href); if (!safe) return;
    const a = make('a', label); a.href = safe; a.target = '_blank'; a.rel = 'noopener noreferrer'; parent.append(a);
  };
  function showSources() {
    const target = $('officialSources'); target.replaceChildren();
    target.append(make('p', 'ยังไม่สามารถค้นเว็บราชการสดจากหน้านี้ได้ กรุณาเปิดเว็บไซต์ต้นทางและใช้คำค้นเดียวกัน:'));
    for (const [name,url] of sourceFallback) { const row = make('p'); addLink(row, 'เปิดค้นที่ ' + name, url); target.append(row); }
  }
  function details(record) {
    const target = $('details'); target.replaceChildren();
    for (const line of [record.documentNumber + ' — ' + record.documentTitle, 'หน่วยงาน: ' + record.issuingAgency, 'วันที่: ' + (record.documentDate || 'ไม่ระบุ'), 'สถานะกฎหมายล่าสุด: ยังต้องตรวจจากต้นฉบับ']) target.append(make('p', line));
    addLink(target, 'เปิดหนังสือต้นฉบับ', record.sourceUrl);
  }
  function render() {
    const target = $('results'); target.replaceChildren();
    const term = $('query').value.trim();
    if (!term) { target.append(make('p', 'พิมพ์เลข ว หรือคำสำคัญ แล้วกดค้นหา')); return; }
    if (!loaded || !registry) return;
    const found = registry.search(term, {offset, limit:PAGE});
    if (!found.items.length) target.append(make('p', 'ไม่พบในดัชนี GP ที่ตรวจรับแล้ว ไม่ได้หมายความว่าไม่มีหนังสือเวียนฉบับนั้น โปรดค้นต่อที่เว็บไซต์ทางการด้านล่าง'));
    for (const record of found.items) {
      const row = make('div'); row.className = 'result';
      const heading = make('button', record.documentNumber + ' — ' + record.documentTitle);
      heading.type = 'button'; heading.addEventListener('click', () => details(record));
      row.append(heading, make('p', record.issuingAgency + ' · ' + (record.documentDate || 'ไม่ระบุวันที่')));
      addLink(row, 'เปิดต้นฉบับ', record.sourceUrl); target.append(row);
    }
    $('pageStatus').textContent = found.total + ' รายการ' + (partial ? ' (ดัชนีบางส่วน)' : '');
    $('previous').disabled = offset === 0; $('next').disabled = offset + PAGE >= found.total;
  }
  async function fetchJson(path) { const res = await fetch(path, {credentials:'omit',cache:'no-store'}); if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); }
  async function load() {
    if (!api) throw new Error('Circular Watch module unavailable');
    const manifest = await fetchJson('knowledge/circulars/index.json');
    if (!Array.isArray(manifest.records) || !Array.isArray(manifest.shards)) throw new Error('Invalid manifest');
    partial = manifest.shards.length > 8;
    const shards = await Promise.all(manifest.shards.slice(0,8).map(async s => {
      if (typeof s.path !== 'string' || !/^[a-zA-Z0-9_/-]+\.json$/.test(s.path) || s.path.startsWith('/') || s.path.split('/').includes('..')) throw new Error('Invalid shard path');
      const file = await fetchJson(new URL(s.path, new URL('knowledge/circulars/', document.baseURI)).href);
      if (!Array.isArray(file.records)) throw new Error('Invalid shard records');
      return file.records;
    }));
    registry = api.createCircularRegistry([...manifest.records,...shards.flat()].filter(api.isPublishedRecord));
    loaded = true;
    $('loading').textContent = 'ดัชนี GP ที่ตรวจรับแล้ว: ' + registry.records.length + ' รายการ' + (partial ? ' (ข้อมูลบางส่วน)' : '');
    render();
  }
  $('searchForm').addEventListener('submit', e => { e.preventDefault(); offset = 0; render(); });
  $('clear').addEventListener('click', () => { $('query').value = ''; offset = 0; $('details').textContent = 'เลือกเอกสารจากผลค้น'; $('pageStatus').textContent = ''; render(); });
  $('previous').addEventListener('click', () => { offset = Math.max(0, offset-PAGE); render(); });
  $('next').addEventListener('click', () => { offset += PAGE; render(); });
  showSources();
  load().catch(error => { $('loading').textContent = 'โหลดดัชนีไม่ได้: ' + error.message; $('results').textContent = 'ไม่สามารถยืนยันข้อมูลในดัชนีได้ โปรดค้นจากเว็บไซต์ทางการด้านล่าง'; });
})();