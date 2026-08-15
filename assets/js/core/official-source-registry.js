(() => {
  'use strict';

  const SOURCES = Object.freeze([
    { id: 'ratchakitcha', name: 'ราชกิจจานุเบกษา', host: 'ratchakitcha.soc.go.th', tier: 'primary', priority: 100, topics: ['กฎหมาย', 'ประกาศ', 'กฎกระทรวง', 'พระราชบัญญัติ'] },
    { id: 'krisdika', name: 'สำนักงานคณะกรรมการกฤษฎีกา', host: 'krisdika.go.th', tier: 'primary', priority: 98, topics: ['กฎหมาย', 'พระราชบัญญัติ', 'ระเบียบ', 'กฤษฎีกา'] },
    { id: 'cgd', name: 'กรมบัญชีกลาง', host: 'cgd.go.th', tier: 'primary', priority: 96, topics: ['พัสดุ', 'การเงิน', 'ค่าใช้จ่าย', 'หนังสือเวียน'] },
    { id: 'moi', name: 'กระทรวงมหาดไทย', host: 'moi.go.th', tier: 'primary', priority: 94, topics: ['ท้องถิ่น', 'ระเบียบ', 'หนังสือสั่งการ', 'ประชาสัมพันธ์', 'ข่าวประชาสัมพันธ์', 'การสื่อสารราชการ'] },
    { id: 'dla', name: 'กรมส่งเสริมการปกครองท้องถิ่น', host: 'dla.go.th', tier: 'primary', priority: 93, topics: ['ท้องถิ่น', 'การเงิน', 'บุคคล', 'พัสดุ', 'สภา', 'สาธารณสุข', 'ประชาสัมพันธ์', 'ข่าวประชาสัมพันธ์', 'การสื่อสารราชการ'] },
    { id: 'admincourt', name: 'ศาลปกครอง', host: 'admincourt.go.th', tier: 'primary', priority: 92, topics: ['คำพิพากษา', 'คำสั่งศาล', 'คดีปกครอง'] },
    { id: 'coj', name: 'สำนักงานศาลยุติธรรม', host: 'coj.go.th', tier: 'primary', priority: 91, topics: ['ศาลยุติธรรม', 'คำพิพากษา', 'คำสั่งศาล'] },
    { id: 'budget', name: 'สำนักงบประมาณ', host: 'bb.go.th', tier: 'primary', priority: 90, topics: ['งบประมาณ', 'หลักเกณฑ์งบประมาณ'] },
    { id: 'nacc', name: 'สำนักงาน ป.ป.ช.', host: 'nacc.go.th', tier: 'primary', priority: 90, topics: ['ป.ป.ช.', 'ทุจริต', 'วินัย'] },
    { id: 'oag', name: 'สำนักงานการตรวจเงินแผ่นดิน', host: 'audit.go.th', tier: 'primary', priority: 89, topics: ['สตง.', 'ตรวจสอบ', 'การเงิน', 'พัสดุ'] }
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFC').trim().toLocaleLowerCase();
  }

  function hostOf(urlOrHost) {
    const raw = String(urlOrHost ?? '').trim();
    let host = raw;
    try { host = new URL(raw).hostname; } catch {}
    return normalize(host).replace(/^www\./, '');
  }

  function dynamicThaiGovernmentSource(host) {
    if (!(host === 'go.th' || host.endsWith('.go.th'))) return null;
    return Object.freeze({
      id: `thai-gov:${host}`,
      name: host,
      host,
      tier: 'primary',
      priority: 86,
      topics: Object.freeze(['หน่วยงานราชการ', 'องค์กรปกครองส่วนท้องถิ่น', 'งบประมาณ', 'แผนพัฒนาท้องถิ่น']),
      dynamic: true
    });
  }

  function matchSource(urlOrHost) {
    const normalized = hostOf(urlOrHost);
    return SOURCES.find(source => normalized === source.host || normalized.endsWith(`.${source.host}`)) || dynamicThaiGovernmentSource(normalized);
  }

  function rankSources(query = '') {
    const q = normalize(query);
    return Object.freeze([...SOURCES].map(source => {
      const topicMatches = source.topics.filter(topic => q.includes(normalize(topic))).length;
      return Object.freeze({ ...source, score: source.priority + topicMatches * 10 });
    }).sort((a, b) => b.score - a.score || b.priority - a.priority || a.name.localeCompare(b.name, 'th')));
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.OFFICIAL_SOURCE_REGISTRY = SOURCES;
  window.GovPromptCore.matchOfficialSource = matchSource;
  window.GovPromptCore.rankOfficialSources = rankSources;
})();
