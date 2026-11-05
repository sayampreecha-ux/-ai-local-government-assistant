(() => {
  'use strict';
  const api = window.GovPromptCore?.CircularWatch;
  const byId = id => document.getElementById(id);
  const status = byId('loading'), results = byId('results'), details = byId('details');
  const PAGE_SIZE = 20, MAX_SHARDS = 8;
  let registry = api?.createCircularRegistry([]), offset = 0, selected = null, complete = true;
  const element = (tag, value, className = '') => {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = String(value);
    if (className) node.className = className;
    return node;
  };
  function filters() {
    return {
      category: byId('category').value.trim(), agency: byId('agency').value.trim(),
      year: byId('year').value.trim(), status: byId('status').value,
      offset, limit: PAGE_SIZE
    };
  }
  function showDetails(id) {
    const record = registry.get(id);
    if (!record) return;
    selected = record;
    const gate = registry.assess(id);
    details.replaceChildren();
    const lines = [
      record.documentTitle, 'เลขที่: ' + record.documentNumber,
      'หน่วยงาน: ' + record.issuingAgency, 'หมวด: ' + (record.category || 'ไม่ระบุ'),
      'วันที่ออก: ' + (record.documentDate || 'ไม่ระบุ'),
      'วันที่มีผล: ' + (record.effectiveDate || 'ไม่ระบุ'),
      'Version: ' + record.status.toUpperCase(),
      'Human Review: ' + record.reviewStatus.toUpperCase(),
      'Evidence Gate: ' + gate.decision,
      'ประเด็นที่ยังต้องตรวจ: ' + (gate.issues.join(', ') || 'ต้องตรวจความเป็นปัจจุบันจากต้นฉบับอีกครั้ง'),
      'ตรวจสอบล่าสุดตามทะเบียน: ' + (record.lastVerifiedAt || 'ไม่มีหลักฐาน'),
      'หลักฐานตามทะเบียน: ' + (record.evidence.join(' | ') || 'ยังไม่มี'),
      'สัมพันธ์กับฉบับเดิม: ' + (record.supersedesDocumentId || 'ไม่ระบุ'),
      'ถูกแทนที่โดย: ' + (record.supersededByDocumentId || 'ไม่ระบุ'),
      'ข้อความที่คัดจากต้นฉบับ: ' + (record.contentExcerpt || 'ไม่มี'),
      'ตำแหน่งอ้างอิง: ' + (record.excerptLocator || 'ไม่ระบุ')
    ];
    for (const line of lines) details.append(element('p', line));
    const link = element('a', 'เปิดต้นฉบับตาม URL ที่ลงทะเบียน');
    link.href = record.sourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
    details.append(link);
    details.append(element('p', 'NOT VERIFIED LATEST — ต้องตรวจแหล่งทางการอีกครั้งก่อนใช้เป็นข้อยุติ', 'notice'));
    byId('handoff').disabled = false;
  }
  function render() {
    const result = registry.search(byId('query').value, filters());
    results.replaceChildren();
    if (!result.items.length) results.append(element('p', 'ไม่พบรายการในข้อมูลที่โหลด (ไม่ใช่ข้อยืนยันว่าไม่มีหนังสือเวียนฉบับนั้น)'));
    for (const record of result.items) {
      const row = element('div', undefined, 'result');
      const button = element('button', record.documentNumber + ' — ' + record.documentTitle);
      button.type = 'button';
      button.addEventListener('click', () => showDetails(record.id));
      row.append(button);
      row.append(element('div', record.issuingAgency + ' · ' + (record.documentDate || 'ไม่ระบุวันที่') + ' · ' + record.status.toUpperCase() + ' · ' + record.reviewStatus.toUpperCase(), 'meta'));
      results.append(row);
    }
    byId('pageStatus').textContent = (result.total ? offset + 1 : 0) + '–' + Math.min(offset + PAGE_SIZE, result.total) + ' / ' + result.total + (complete ? '' : ' (ข้อมูลบางส่วน)');
    byId('previous').disabled = offset === 0;
    byId('next').disabled = offset + PAGE_SIZE >= result.total;
  }
  function safeShardPath(path) {
    if (typeof path !== 'string' || !/^[a-zA-Z0-9_/-]+\.json$/.test(path) || path.startsWith('/') || path.split('/').includes('..')) {
      throw new TypeError('Invalid shard path');
    }
    return new URL(path, new URL('knowledge/circulars/', document.baseURI)).href;
  }
  async function fetchJson(url) {
    const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }
  async function loadOfficialSources() {
    const target = byId('officialSources');
    if (!target) return;
    try {
      const catalog = await fetchJson('knowledge/circulars/official-sources.json');
      if (!Array.isArray(catalog.sources) || catalog.sources.length > 20) throw new TypeError('Invalid source catalog');
      target.replaceChildren();
      for (const source of catalog.sources) {
        const url = new URL(source.url);
        if (url.protocol !== 'https:' || url.username || url.password || url.port ||
            !['www.dla.go.th', 'dla.go.th', 'cmsmoi.moi.go.th', 'moi.go.th', 'ratchakitcha.soc.go.th'].includes(url.hostname)) {
          throw new TypeError('Unapproved official source URL');
        }
        if (source.mode !== 'MANUAL_REVIEW') throw new TypeError('Unsupported source mode');
        const row = element('p');
        const link = element('a', source.agency);
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        row.append(link, document.createTextNode(' — ค้นหาและตรวจต้นฉบับด้วยตนเอง (' + source.scope + ')'));
        target.append(row);
      }
      target.append(element('p', 'ยังไม่มีการตรวจ PDF, การแก้ไขหรือยกเลิก และความเป็นปัจจุบันอัตโนมัติ', 'notice'));
    } catch (error) {
      target.textContent = 'ไม่สามารถยืนยันรายการแหล่งข้อมูล: ' + error.message;
    }
  }
  async function load() {
    if (!api) throw new Error('Circular Watch module is unavailable');
    const index = await fetchJson('knowledge/circulars/index.json');
    if (!Array.isArray(index.records) || !Array.isArray(index.shards)) throw new TypeError('Invalid registry manifest');
    const year = byId('year').value.trim();
    const matching = index.shards.filter(shard => !year || String(shard.year || '') === year);
    complete = matching.length <= MAX_SHARDS;
    const batches = await Promise.all(matching.slice(0, MAX_SHARDS).map(async shard => {
      const data = await fetchJson(safeShardPath(shard.path));
      if (!Array.isArray(data.records)) throw new TypeError('Invalid shard');
      return data.records;
    }));
    registry = api.createCircularRegistry([...index.records, ...batches.flat()]);
    offset = 0; selected = null; byId('handoff').disabled = true;
    details.textContent = 'เลือกเอกสารจากผลการค้นหา';
    status.textContent = complete ? 'ทะเบียนที่โหลด: ' + registry.records.length + ' รายการ (ไม่ใช่ผลค้นเว็บสด)' : '⚠️ โหลดข้อมูลบางส่วน: โปรดกรองปีเพื่อลดจำนวน Shard';
    render();
  }
  byId('searchForm').addEventListener('submit', event => {
    event.preventDefault();
    if (byId('year').value && !/^\d{4}$/.test(byId('year').value)) {
      status.textContent = 'ปีต้องเป็น ค.ศ. 4 หลัก'; return;
    }
    load().catch(error => { complete = false; status.textContent = 'ไม่สามารถโหลดทะเบียน: ' + error.message; results.replaceChildren(); });
  });
  byId('clear').addEventListener('click', () => {
    for (const id of ['query', 'year', 'category', 'agency', 'status']) byId(id).value = '';
    load().catch(error => { status.textContent = 'โหลดทะเบียนไม่สำเร็จ: ' + error.message; });
  });
  byId('previous').addEventListener('click', () => { offset = Math.max(0, offset - PAGE_SIZE); render(); });
  byId('next').addEventListener('click', () => { offset += PAGE_SIZE; render(); });
  byId('handoff').addEventListener('click', async () => {
    if (!selected) return;
    const gate = registry.assess(selected.id);
    const prompt = [
      'โปรดค้นและตรวจสอบแหล่งราชการล่าสุดก่อนวิเคราะห์ ห้ามสรุปจากทะเบียนนี้เพียงอย่างเดียว',
      'หนังสือ: ' + selected.documentNumber + ' — ' + selected.documentTitle,
      'หน่วยงาน: ' + selected.issuingAgency,
      'URL ต้นฉบับตามทะเบียน: ' + selected.sourceUrl,
      'สถานะทะเบียน: ' + selected.status.toUpperCase(),
      'หลักฐาน: ' + (selected.evidence.length ? 'มีรายการหลักฐานในทะเบียนแต่ต้องตรวจต้นฉบับซ้ำ' : 'ยังไม่มีหลักฐานตรวจรับ'),
      'Gate: ' + gate.decision + '; verifiedLatest=false; checkedLive=false',
      'โปรดตรวจ Official Source → Authority → Version → Evidence → Reasoning → Human Review',
      'ค้นหนังสือแก้ไข/ยกเลิก/แทนที่และบทเฉพาะกาล แสดง URL วันที่ตรวจสอบและข้อความอ้างอิงที่อ่านได้จริง',
      'หากหลักฐานไม่ครบให้ตอบ NOT VERIFIED / Decision Lock ไม่แต่งเลข ว หรือฐานกฎหมาย'
    ].join('\n');
    try {
      await navigator.clipboard.writeText(prompt);
      status.textContent = 'คัดลอกคำถามแล้ว — กรุณาเปิด AI ที่เลือกและวางข้อความเอง';
    } catch {
      status.textContent = 'คัดลอกอัตโนมัติไม่ได้ โปรดใช้เบราว์เซอร์ที่อนุญาต Clipboard';
    }
  });
  byId('importFile').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const output = byId('importStatus');
    try {
      if (file.size > 1024 * 1024) throw new Error('ไฟล์เกิน 1 MB');
      const parsed = JSON.parse(await file.text());
      const rows = Array.isArray(parsed) ? parsed : parsed.records;
      if (!Array.isArray(rows) || rows.length > 100) throw new Error('ต้องเป็น JSON array ไม่เกิน 100 รายการ');
      const preview = api.createCircularRegistry(rows);
      output.textContent = 'ตรวจรูปแบบผ่าน ' + preview.records.length + ' รายการ — เป็นเพียง Preview ในเครื่อง ยังไม่เผยแพร่หรืออนุมัติ ต้องตรวจหลักฐานต้นฉบับก่อนนำไปใช้';
    } catch (error) {
      output.textContent = 'นำเข้าตัวอย่างไม่ได้: ' + error.message;
    } finally {
      event.target.value = '';
    }
  });
  loadOfficialSources();
  load().catch(error => { complete = false; status.textContent = 'ไม่สามารถโหลดทะเบียน: ' + error.message; });
})();
