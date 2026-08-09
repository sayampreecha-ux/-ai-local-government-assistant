(() => {
  'use strict';

  const REDACTION_RULES = Object.freeze([
    { id: 'thai-id', label: 'เลขประจำตัว 13 หลัก', pattern: /\b\d(?:[\s-]*\d){12}\b/g, replacement: ' ' },
    { id: 'email', label: 'อีเมล', pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, replacement: ' ' },
    { id: 'phone', label: 'หมายเลขโทรศัพท์', pattern: /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g, replacement: ' ' },
    { id: 'bank-account', label: 'เลขบัญชี/พร้อมเพย์', pattern: /(?:เลขบัญชี|บัญชีธนาคาร|พร้อมเพย์)\s*[:：-]?\s*[0-9\s-]{6,20}/gi, replacement: ' ' },
    { id: 'named-person', label: 'ชื่อบุคคล', pattern: /(?:นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,2}/g, replacement: ' บุคคล ' },
    { id: 'explicit-name', label: 'ชื่อ-นามสกุล', pattern: /(?:ชื่อ(?:-?นามสกุล)?|ชื่อผู้ป่วย|ชื่อเจ้าของบัญชี)\s*[:：-]?\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,3}/gi, replacement: ' บุคคล ' },
    { id: 'health-detail', label: 'รายละเอียดสุขภาพเฉพาะบุคคล', pattern: /(?:ผลตรวจ|ผลเลือด|การวินิจฉัย|ประวัติการรักษา|ข้อมูลสุขภาพ|โรคประจำตัว)\s*[:：-]?\s*[^,;\n]{1,100}/gi, replacement: ' ข้อมูลสุขภาพ ' },
    { id: 'patient-id', label: 'รหัสผู้ป่วย/HN/AN', pattern: /(?:HN|AN|เลขผู้ป่วย|รหัสผู้ป่วย)\s*[:：#-]?\s*[A-Za-z0-9/-]{3,30}/gi, replacement: ' รหัสผู้ป่วย ' },
    { id: 'birth-date', label: 'วันเดือนปีเกิด', pattern: /(?:วันเกิด|วันเดือนปีเกิด|เกิดวันที่)\s*[:：-]?\s*[^,;\n]{2,40}/gi, replacement: ' วันเกิด ' },
    { id: 'address', label: 'ที่อยู่', pattern: /(?:ที่อยู่|บ้านเลขที่)\s*[:：-]?\s*[^,;\n]{3,120}/gi, replacement: ' ที่อยู่ ' },
    { id: 'vehicle-plate', label: 'ทะเบียนรถ', pattern: /(?:ทะเบียนรถ|เลขทะเบียน)\s*[:：-]?\s*[ก-๙A-Za-z0-9 -]{2,20}/gi, replacement: ' ทะเบียนรถ ' }
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
    const matches = BLOCK_RULES.filter(rule => {
      rule.pattern.lastIndex = 0;
      return rule.pattern.test(text);
    });
    return Object.freeze(matches.map(rule => rule.label));
  }

  function detectResidualRisk(input) {
    const text = String(input ?? '');
    const matches = RESIDUAL_RISK_RULES.filter(rule => {
      rule.pattern.lastIndex = 0;
      return rule.pattern.test(text);
    });
    return Object.freeze(matches.map(rule => rule.label));
  }

  function sanitizeExternalQuery(input) {
    const original = collapseWhitespace(input);
    const blockingRisks = detectBlockingRisk(original);
    let safeQuery = original;
    const redactions = [];

    REDACTION_RULES.forEach(rule => {
      rule.pattern.lastIndex = 0;
      if (!rule.pattern.test(safeQuery)) return;
      redactions.push(rule.label);
      rule.pattern.lastIndex = 0;
      safeQuery = safeQuery.replace(rule.pattern, rule.replacement);
    });

    safeQuery = collapseWhitespace(safeQuery)
      .replace(/\b\d{16,}\b/g, ' ');
    safeQuery = collapseWhitespace(safeQuery);

    const residualRisks = detectResidualRisk(safeQuery);
    const blocked = blockingRisks.length > 0 || residualRisks.length > 0;
    const fallbackApplied = safeQuery.length < 3;
    if (fallbackApplied) safeQuery = 'กฎหมาย ระเบียบ หนังสือสั่งการ งานราชการ';

    return Object.freeze({
      original,
      safeQuery,
      changed: safeQuery !== original,
      blocked,
      fallbackApplied,
      redactions: Object.freeze([...new Set(redactions)]),
      blockingRisks,
      residualRisks
    });
  }

  function blockedSearchResult(privacy) {
    const reasons = [...privacy.blockingRisks, ...privacy.residualRisks];
    const reasonText = reasons.length ? ` (${[...new Set(reasons)].join(', ')})` : '';
    return Object.freeze({
      mode: 'blocked',
      provider: 'privacy-guard',
      searchedAt: new Date().toISOString(),
      results: Object.freeze([]),
      evidence: Object.freeze({ primaryResults: Object.freeze([]), conclusionEligible: false }),
      warning: `Privacy Guard หยุดการค้นภายนอก เพราะตรวจพบข้อมูลเสี่ยง${reasonText} กรุณาปกปิดข้อมูลก่อนค้นใหม่`,
      privacyGuard: Object.freeze({
        applied: true,
        blocked: true,
        redactions: privacy.redactions,
        blockingRisks: privacy.blockingRisks,
        residualRisks: privacy.residualRisks,
        externalQueryWasSanitized: privacy.changed,
        externalRequestSent: false
      })
    });
  }

  function installPrivacyGuard() {
    const core = window.GovPromptCore;
    const connector = core?.officialSearchConnector;
    if (!core || !connector || typeof connector.search !== 'function') return false;
    if (connector.__privacyGuardInstalled) return true;

    const guardedConnector = Object.freeze({
      ...connector,
      __privacyGuardInstalled: true,
      search: async (query, options = {}) => {
        const privacy = sanitizeExternalQuery(query);

        if (privacy.blocked) {
          window.GovPrompt?.toast?.('🔒 Privacy Guard หยุดการค้นภายนอก: พบข้อมูลเสี่ยง กรุณาปกปิดข้อมูลก่อน');
          return blockedSearchResult(privacy);
        }

        if (privacy.changed) {
          window.GovPrompt?.toast?.('🔐 Privacy Guard ปกปิดข้อมูลเสี่ยงก่อนค้นภายนอกแล้ว');
        }

        const result = await connector.search(privacy.safeQuery, options);
        if (!result || typeof result !== 'object') return result;
        return Object.freeze({
          ...result,
          privacyGuard: Object.freeze({
            applied: privacy.changed,
            blocked: false,
            redactions: privacy.redactions,
            blockingRisks: privacy.blockingRisks,
            residualRisks: privacy.residualRisks,
            externalQueryWasSanitized: privacy.changed,
            externalRequestSent: true
          })
        });
      }
    });

    core.officialSearchConnector = guardedConnector;
    return core.officialSearchConnector === guardedConnector;
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.sanitizeExternalQuery = sanitizeExternalQuery;
  window.GovPromptCore.detectBlockingRisk = detectBlockingRisk;
  window.GovPromptCore.detectResidualRisk = detectResidualRisk;
  window.GovPromptCore.installPrivacyGuard = installPrivacyGuard;

  if (!installPrivacyGuard()) {
    document.addEventListener('DOMContentLoaded', installPrivacyGuard, { once: true });
  }
})();
