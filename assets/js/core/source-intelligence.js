(() => {
  'use strict';

  const PRIMARY_SOURCE_HOSTS = Object.freeze([
    'ratchakitcha.soc.go.th',
    'krisdika.go.th',
    'cgd.go.th',
    'moi.go.th',
    'dla.go.th',
    'bb.go.th',
    'admincourt.go.th',
    'coj.go.th',
    'supremecourt.or.th',
    'constitutionalcourt.or.th',
    'nacc.go.th',
    'pacc.go.th',
    'audit.go.th'
  ]);

  const PRIMARY_SOURCE_AGENCIES = Object.freeze([
    'ราชกิจจานุเบกษา', 'สำนักงานคณะกรรมการกฤษฎีกา', 'กรมบัญชีกลาง', 'กระทรวงมหาดไทย',
    'กรมส่งเสริมการปกครองท้องถิ่น', 'สำนักงบประมาณ', 'ศาลปกครอง', 'ศาลยุติธรรม',
    'ศาลฎีกา', 'ศาลรัฐธรรมนูญ', 'ป.ป.ช.', 'ป.ป.ท.', 'สตง.'
  ]);

  function text(value) { return String(value ?? '').trim(); }

  function hostname(urlValue) {
    try { return new URL(text(urlValue)).hostname.toLowerCase(); }
    catch { return ''; }
  }

  function isGovernmentHost(host) {
    return Boolean(host && (host === 'go.th' || host.endsWith('.go.th') || PRIMARY_SOURCE_HOSTS.some(official => host === official || host.endsWith(`.${official}`))));
  }

  function classifySource(input = {}) {
    const sourceUrl = text(input.sourceUrl || input.sourceURL || input.source);
    const issuingAgency = text(input.issuingAgency || input.agency);
    const host = hostname(sourceUrl);
    const explicit = text(input.sourceLevel).toLowerCase();

    if (explicit === 'primary' || explicit === 'secondary') {
      return Object.freeze({ sourceLevel: explicit, official: explicit === 'primary', host, reason: 'explicit-source-level' });
    }

    const officialAgency = PRIMARY_SOURCE_AGENCIES.some(name => issuingAgency.includes(name));
    const officialHost = isGovernmentHost(host);
    const sourceLevel = officialHost || officialAgency ? 'primary' : sourceUrl ? 'secondary' : 'unknown';
    return Object.freeze({
      sourceLevel,
      official: sourceLevel === 'primary',
      host,
      reason: officialHost ? 'official-government-host' : officialAgency ? 'recognized-primary-agency' : sourceUrl ? 'non-primary-source' : 'missing-source'
    });
  }

  function sourcePriority(input = {}) {
    const classification = classifySource(input);
    const hostRank = PRIMARY_SOURCE_HOSTS.findIndex(official => classification.host === official || classification.host.endsWith(`.${official}`));
    return Object.freeze({
      ...classification,
      priority: classification.sourceLevel === 'primary' ? 1000 - (hostRank >= 0 ? hostRank : 100) : classification.sourceLevel === 'secondary' ? 100 : 0
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    PRIMARY_SOURCE_HOSTS,
    PRIMARY_SOURCE_AGENCIES,
    classifySource,
    sourcePriority
  });
})();
