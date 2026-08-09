(() => {
  'use strict';

  const REDACTION_RULES = Object.freeze([
    { id: 'thai-id', label: 'เลขประจำตัว 13 หลัก', pattern: /\b\d{13}\b/g, replacement: ' ' },
    { id: 'email', label: 'อีเมล', pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, replacement: ' ' },
    { id: 'phone', label: 'หมายเลขโทรศัพท์', pattern: /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g, replacement: ' ' },
    { id: 'bank-account', label: 'เลขบัญชี/พร้อมเพย์', pattern: /(?:เลขบัญชี|บัญชีธนาคาร|พร้อมเพย์)\s*[:：-]?\s*[0-9\s-]{6,20}/gi, replacement: ' ' },
    { id: 'password-secret', label: 'รหัสผ่าน/กุญแจลับ', pattern: /(?:password|passwd|api\s*key|secret|token|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*[^\s,;]+/gi, replacement: ' ' },
    { id: 'named-person', label: 'ชื่อบุคคล', pattern: /(?:นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,2}/g, replacement: ' บุคคล ' },
    { id: 'health-detail', label: 'รายละเอียดสุขภาพเฉพาะบุคคล', pattern: /(?:ผลตรวจ|ผลเลือด|การวินิจฉัย|ประวัติการรักษา|ข้อมูลสุขภาพ|โรคประจำตัว)\s*[:：-]?\s*[^,;\n]{1,80}/gi, replacement: ' ข้อมูลสุขภาพ ' }
  ]);

  const collapseWhitespace = value => String(value ?? '').replace(/\s+/g, ' ').trim();

  function sanitizeExternalQuery(input) {
    const original = collapseWhitespace(input);
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
      .replace(/(?:ข้อมูลลับของราชการ|ชั้นความลับ|ลับมาก|ลับที่สุด)\s*[:：-]?\s*[^,;\n]{0,120}/gi, 'ข้อมูลราชการ')
      .replace(/\b\d{16,}\b/g, ' ');
    safeQuery = collapseWhitespace(safeQuery);

    if (safeQuery.length < 3) safeQuery = 'กฎหมาย ระเบียบ หนังสือสั่งการ งานราชการ';

    return Object.freeze({
      original,
      safeQuery,
      changed: safeQuery !== original,
      redactions: Object.freeze([...new Set(redactions)])
    });
  }

  function installPrivacyGuard() {
    const connector = window.GovPromptCore?.officialSearchConnector;
    if (!connector || typeof connector.search !== 'function' || connector.__privacyGuardInstalled) return false;

    const originalSearch = connector.search.bind(connector);
    const guardedSearch = async (query, options = {}) => {
      const privacy = sanitizeExternalQuery(query);
      if (privacy.changed) {
        window.GovPrompt?.toast?.('🔐 Privacy Guard ปกปิดข้อมูลเสี่ยงก่อนค้นภายนอกแล้ว');
      }
      const result = await originalSearch(privacy.safeQuery, options);
      if (!result || typeof result !== 'object') return result;
      return Object.freeze({
        ...result,
        privacyGuard: Object.freeze({
          applied: privacy.changed,
          redactions: privacy.redactions,
          externalQueryWasSanitized: privacy.changed
        })
      });
    };

    try {
      connector.search = guardedSearch;
      Object.defineProperty(connector, '__privacyGuardInstalled', { value: true, configurable: false });
    } catch {
      return false;
    }
    return true;
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.sanitizeExternalQuery = sanitizeExternalQuery;
  window.GovPromptCore.installPrivacyGuard = installPrivacyGuard;

  if (!installPrivacyGuard()) {
    document.addEventListener('DOMContentLoaded', installPrivacyGuard, { once: true });
  }
})();
