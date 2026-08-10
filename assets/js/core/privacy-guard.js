(() => {
  'use strict';

  const REDACTION_RULES = Object.freeze([
    { id: 'thai-id-context', label: 'เลขบัตรประชาชน/เลขประจำตัว', pattern: /(?:เลข(?:ประจำตัว(?:ประชาชน)?|บัตรประชาชน)|บัตรประชาชน)\s*[:：#-]?\s*\d(?:[\s-]*\d){5,19}/gi, replacement: ' เลขบัตรประชาชน [ปกปิด] ' },
    { id: 'thai-id', label: 'เลขประจำตัว 13 หลัก', pattern: /\b\d(?:[\s-]*\d){12}\b/g, replacement: ' [ปกปิดเลขประจำตัว] ' },
    { id: 'email', label: 'อีเมล', pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, replacement: ' [ปกปิดอีเมล] ' },
    { id: 'phone-context', label: 'หมายเลขโทรศัพท์', pattern: /(?:เบอร์(?:โทร(?:ศัพท์)?)?|โทรศัพท์|มือถือ)\s*[:：#-]?\s*(?:\+?\d[\d\s-]{6,18}\d)/gi, replacement: ' เบอร์โทร [ปกปิด] ' },
    { id: 'phone', label: 'หมายเลขโทรศัพท์', pattern: /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g, replacement: ' [ปกปิดเบอร์โทร] ' },
    { id: 'bank-account', label: 'เลขบัญชี/พร้อมเพย์', pattern: /(?:เลขบัญชี|บัญชีธนาคาร|พร้อมเพย์)\s*[:：-]?\s*[0-9\s-]{6,20}/gi, replacement: ' เลขบัญชี [ปกปิด] ' },
    { id: 'named-person', label: 'ชื่อบุคคล', pattern: /(?:นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,2}/g, replacement: ' [ปกปิดชื่อบุคคล] ' },
    { id: 'explicit-name', label: 'ชื่อ-นามสกุล', pattern: /(?:ชื่อ(?:-?นามสกุล)?|ชื่อผู้ป่วย|ชื่อเจ้าของบัญชี)\s*[:：-]?\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,3}/gi, replacement: ' ชื่อ [ปกปิด] ' },
    { id: 'health-detail', label: 'รายละเอียดสุขภาพเฉพาะบุคคล', pattern: /(?:ผลตรวจ|ผลเลือด|การวินิจฉัย|ประวัติการรักษา|ข้อมูลสุขภาพ|โรคประจำตัว)\s*[:：-]?\s*[^,;\n]{1,100}/gi, replacement: ' ข้อมูลสุขภาพ [ปกปิด] ' },
    { id: 'patient-id', label: 'รหัสผู้ป่วย/HN/AN', pattern: /(?:HN|AN|เลขผู้ป่วย|รหัสผู้ป่วย)\s*[:：#-]?\s*[A-Za-z0-9/-]{3,30}/gi, replacement: ' รหัสผู้ป่วย [ปกปิด] ' },
    { id: 'birth-date', label: 'วันเดือนปีเกิด', pattern: /(?:วันเกิด|วันเดือนปีเกิด|เกิดวันที่)\s*[:：-]?\s*.*?(?=\s+(?:อายุ|เบอร์(?:โทร(?:ศัพท์)?)?|โทรศัพท์|มือถือ|ที่อยู่|บ้านเลขที่|เลขบัตร|เลขประจำตัว|HN|AN)\b|[,;\n]|$)/gi, replacement: ' วันเกิด [ปกปิด] ' },
    { id: 'address', label: 'ที่อยู่', pattern: /(?:ที่อยู่|บ้านเลขที่)\s*[:：-]?\s*.*?(?=\s+(?:อายุ|วันเกิด|วันเดือนปีเกิด|เกิดวันที่|เบอร์(?:โทร(?:ศัพท์)?)?|โทรศัพท์|มือถือ|เลขบัตร|เลขประจำตัว|HN|AN)\b|[,;\n]|$)/gi, replacement: ' ที่อยู่ [ปกปิด] ' },
    { id: 'vehicle-plate', label: 'ทะเบียนรถ', pattern: /(?:ทะเบียนรถ|เลขทะเบียน)\s*[:：-]?\s*[ก-๙A-Za-z0-9 -]{2,20}/gi, replacement: ' ทะเบียนรถ [ปกปิด] ' }
  ]);

  const BLOCK_RULES = Object.freeze([
    { id: 'classified', label: 'ข้อมูลลับของราชการ', pattern: /(?:ข้อมูลลับของราชการ|ชั้นความลับ|ลับมาก|ลับที่สุด|SECRET|TOP\s*SECRET)/i },
    { id: 'credential', label: 'รหัสผ่าน/กุญแจลับ', pattern: /(?:password|passwd|api\s*key|secret|token|bearer|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*[^\s,;]+/i },
    { id: 'private-key', label: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i }
  ]);

  const RESIDUAL_RISK_RULES = Object.freeze([
    { id: 'thai-id-residual', label: 'เลขประจำตัว 13 หลัก', pattern: /\b\d(?:[\s-]*\d){12}\b/ },
    { id: 'email-residual', label: 'อีเมล', pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/ },
    { id: 'phone-residual', label: 'หมายเลขโทรศัพท์', pattern: /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/ },
    { id: 'long-number-residual', label: 'ชุดตัวเลขยาวผิดปกติ', pattern: /\b\d{16,}\b/ },
    { id: 'credential-residual', label: 'ข้อมูลรับรองสิทธิ์/รหัสลับ', pattern: /(?:password|passwd|api\s*key|secret|token|bearer|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*\S+/i }
  ]);

  const collapseWhitespace = value => String(value ?? '').replace(/\s+/g, ' ').trim();

  function detectBlockingRisk(input) {
    const text = String(input ?? '');
    return Object.freeze(BLOCK_RULES.filter(rule => { rule.pattern.lastIndex = 0; return rule.pattern.test(text); }).map(rule => rule.label));
  }

  function detectResidualRisk(input) {
    const text = String(input ?? '');
    return Object.freeze(RESIDUAL_RISK_RULES.filter(rule => { rule.pattern.lastIndex = 0; return rule.pattern.test(text); }).map(rule => rule.label));
  }

  function applyRedactions(input, { preserveWhitespace = false } = {}) {
    const original = String(input ?? '');
    let safeText = original;
    const redactions = [];
    REDACTION_RULES.forEach(rule => {
      rule.pattern.lastIndex = 0;
      if (!rule.pattern.test(safeText)) return;
      redactions.push(rule.label);
      rule.pattern.lastIndex = 0;
      safeText = safeText.replace(rule.pattern, rule.replacement);
    });
    safeText = safeText.replace(/\b\d{16,}\b/g, ' [ปกปิดชุดตัวเลข] ');
    safeText = preserveWhitespace ? safeText.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim() : collapseWhitespace(safeText);
    return { safeText, redactions: Object.freeze([...new Set(redactions)]) };
  }

  function sanitizeExternalContent(input) {
    const original = String(input ?? '');
    const blockingRisks = detectBlockingRisk(original);
    const redacted = applyRedactions(original, { preserveWhitespace: true });
    const residualRisks = detectResidualRisk(redacted.safeText);
    return Object.freeze({ original, safeText: redacted.safeText, changed: redacted.safeText !== original, blocked: blockingRisks.length > 0 || residualRisks.length > 0, redactions: redacted.redactions, blockingRisks, residualRisks });
  }

  function sanitizeAttachmentName(name, index = 1) {
    const original = String(name ?? '').trim();
    const dot = original.lastIndexOf('.');
    const extension = dot > 0 && dot < original.length - 1 ? original.slice(dot + 1).replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toLowerCase() : '';
    const base = dot > 0 ? original.slice(0, dot) : original;
    const privacy = sanitizeExternalContent(base);
    let safeBase = privacy.safeText.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!safeBase || privacy.blocked || privacy.residualRisks.length) safeBase = `เอกสารแนบ-${index}`;
    const safeName = `${safeBase}${extension ? `.${extension}` : ''}`;
    return Object.freeze({ original, safeName, changed: safeName !== original, blocked: privacy.blocked, redactions: privacy.redactions, blockingRisks: privacy.blockingRisks, residualRisks: privacy.residualRisks });
  }

  function sanitizeExternalQuery(input) {
    const original = collapseWhitespace(input);
    const blockingRisks = detectBlockingRisk(original);
    const redacted = applyRedactions(original);
    let safeQuery = redacted.safeText;
    const residualRisks = detectResidualRisk(safeQuery);
    const blocked = blockingRisks.length > 0 || residualRisks.length > 0;
    const fallbackApplied = safeQuery.length < 3;
    if (fallbackApplied) safeQuery = 'กฎหมาย ระเบียบ หนังสือสั่งการ งานราชการ';
    return Object.freeze({ original, safeQuery, changed: safeQuery !== original, blocked, fallbackApplied, redactions: redacted.redactions, blockingRisks, residualRisks });
  }

  function blockedSearchResult(privacy) {
    const reasons = [...privacy.blockingRisks, ...privacy.residualRisks];
    const reasonText = reasons.length ? ` (${[...new Set(reasons)].join(', ')})` : '';
    return Object.freeze({ mode: 'blocked', provider: 'privacy-guard', searchedAt: new Date().toISOString(), results: Object.freeze([]), evidence: Object.freeze({ primaryResults: Object.freeze([]), conclusionEligible: false }), warning: `Privacy Guard หยุดการค้นภายนอก เพราะตรวจพบข้อมูลเสี่ยง${reasonText} กรุณาปกปิดข้อมูลก่อนค้นใหม่`, privacyGuard: Object.freeze({ applied: true, blocked: true, redactions: privacy.redactions, blockingRisks: privacy.blockingRisks, residualRisks: privacy.residualRisks, externalQueryWasSanitized: privacy.changed, externalRequestSent: false }) });
  }

  function installPrivacyGuard() {
    const core = window.GovPromptCore;
    const connector = core?.officialSearchConnector;
    if (!core || !connector || typeof connector.search !== 'function') return false;
    if (connector.__privacyGuardInstalled) return true;
    const guardedConnector = Object.freeze({ ...connector, __privacyGuardInstalled: true, search: async (query, options = {}) => {
      const privacy = sanitizeExternalQuery(query);
      if (privacy.blocked) { window.GovPrompt?.toast?.('🔒 Privacy Guard หยุดการค้นภายนอก: พบข้อมูลลับหรือข้อมูลเสี่ยงที่ปกปิดไม่ได้'); return blockedSearchResult(privacy); }
      if (privacy.changed) window.GovPrompt?.toast?.('🔐 ปกปิดข้อมูลส่วนบุคคลอัตโนมัติก่อนค้นภายนอกแล้ว');
      const result = await connector.search(privacy.safeQuery, options);
      if (!result || typeof result !== 'object') return result;
      return Object.freeze({ ...result, privacyGuard: Object.freeze({ applied: privacy.changed, blocked: false, redactions: privacy.redactions, blockingRisks: privacy.blockingRisks, residualRisks: privacy.residualRisks, externalQueryWasSanitized: privacy.changed, externalRequestSent: true }) });
    }});
    core.officialSearchConnector = guardedConnector;
    return core.officialSearchConnector === guardedConnector;
  }

  function installInputPrivacyGate() {
    const form = document.getElementById('chatForm');
    const input = document.getElementById('promptInput');
    if (!form || !input || form.dataset.privacyGateInstalled === '1') return false;
    form.dataset.privacyGateInstalled = '1';
    form.addEventListener('submit', event => {
      if (form.dataset.privacyBypass === '1') return;
      const privacy = sanitizeExternalContent(input.value);
      if (!privacy.changed && !privacy.blocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (privacy.blocked) {
        const reasons = [...new Set([...privacy.blockingRisks, ...privacy.residualRisks])];
        const detail = reasons.length ? `\nตรวจพบ: ${reasons.join(', ')}` : '';
        window.alert(`🔒 GovPrompt หยุดส่งข้อความนี้เพื่อความปลอดภัย${detail}\n\nกรุณาลบข้อมูลลับ/รหัสผ่าน หรือข้อมูลที่ระบบยังปกปิดได้ไม่แน่นอนก่อนส่งใหม่`);
        input.focus();
        return;
      }
      if (!privacy.safeText.trim()) {
        window.alert('ข้อความหลังปกปิดข้อมูลไม่เหลือสาระเพียงพอ กรุณาพิมพ์คำถามใหม่โดยไม่ใส่ข้อมูลส่วนบุคคล');
        input.focus();
        return;
      }
      input.value = privacy.safeText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const labels = privacy.redactions.length ? privacy.redactions.join(', ') : 'ข้อมูลส่วนบุคคล';
      window.GovPrompt?.toast?.(`🔐 ปกปิดอัตโนมัติแล้ว: ${labels}`);
      form.dataset.privacyBypass = '1';
      try { form.requestSubmit(); } finally { delete form.dataset.privacyBypass; }
    }, true);
    return true;
  }

  function simplifyPrimaryNavigation() {
    const toolsButton = document.querySelector('.bottom-nav [data-panel="tools"]');
    if (toolsButton) toolsButton.hidden = true;
    const nav = document.querySelector('.bottom-nav');
    if (nav) nav.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.sanitizeExternalQuery = sanitizeExternalQuery;
  window.GovPromptCore.sanitizeExternalContent = sanitizeExternalContent;
  window.GovPromptCore.sanitizeAttachmentName = sanitizeAttachmentName;
  window.GovPromptCore.detectBlockingRisk = detectBlockingRisk;
  window.GovPromptCore.detectResidualRisk = detectResidualRisk;
  window.GovPromptCore.installPrivacyGuard = installPrivacyGuard;
  window.GovPromptCore.installInputPrivacyGate = installInputPrivacyGate;

  function installAll() { installPrivacyGuard(); installInputPrivacyGate(); simplifyPrimaryNavigation(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installAll, { once: true }); else installAll();
})();
