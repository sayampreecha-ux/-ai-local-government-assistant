(() => {
  'use strict';

  const REDACTION_RULES = Object.freeze([
    { label: 'เลขบัตรประชาชน/เลขประจำตัว', pattern: /(?:เลข(?:ประจำตัว(?:ประชาชน)?|บัตรประชาชน)|บัตรประชาชน)?\s*[:：#-]?\s*\b\d(?:[\s-]*\d){12}\b/gi, replacement: ' [ปกปิดเลขประจำตัว] ' },
    { label: 'เลขหนังสือเดินทาง', pattern: /(?:passport|หนังสือเดินทาง)\s*[:：#-]?\s*[A-Z0-9]{6,15}/gi, replacement: ' หนังสือเดินทาง [ปกปิด] ' },
    { label: 'เลขประจำตัวผู้เสียภาษี', pattern: /(?:เลขประจำตัวผู้เสียภาษี|tax\s*id)\s*[:：#-]?\s*\d(?:[\s-]*\d){9,14}/gi, replacement: ' เลขผู้เสียภาษี [ปกปิด] ' },
    { label: 'อีเมล', pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, replacement: ' [ปกปิดอีเมล] ' },
    { label: 'หมายเลขโทรศัพท์', pattern: /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g, replacement: ' [ปกปิดเบอร์โทร] ' },
    { label: 'เลขบัญชี/พร้อมเพย์', pattern: /(?:เลขบัญชี|บัญชีธนาคาร|พร้อมเพย์)\s*[:：#-]?\s*[0-9\s-]{6,20}/gi, replacement: ' เลขบัญชี [ปกปิด] ' },
    { label: 'ชื่อบุคคล', pattern: /(?:นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,2}/g, replacement: ' [ปกปิดชื่อบุคคล] ' },
    { label: 'ชื่อ-นามสกุล', pattern: /(?:ชื่อ(?:-?นามสกุล)?|ชื่อผู้ป่วย|ชื่อเจ้าของบัญชี)\s*[:：-]?\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,3}/gi, replacement: ' ชื่อ [ปกปิด] ' },
    { label: 'รหัสผู้ป่วย/HN/AN', pattern: /(?:\bHN\b|\bAN\b|เลขผู้ป่วย|รหัสผู้ป่วย)\s*[:：#-]?\s*[A-Za-z0-9/-]{3,30}/gi, replacement: ' รหัสผู้ป่วย [ปกปิด] ' },
    { label: 'วันเดือนปีเกิด', pattern: /(?:วันเกิด|วันเดือนปีเกิด|เกิดวันที่)\s*[:：-]?\s*[^,;\n]{3,40}/gi, replacement: ' วันเกิด [ปกปิด] ' },
    { label: 'ที่อยู่', pattern: /(?:ที่อยู่|บ้านเลขที่)\s*[:：-]?\s*[^,;\n]{3,120}/gi, replacement: ' ที่อยู่ [ปกปิด] ' },
    { label: 'ทะเบียนรถ', pattern: /(?:ทะเบียนรถ|เลขทะเบียน)\s*[:：-]?\s*[ก-๙A-Za-z0-9 -]{2,20}/gi, replacement: ' ทะเบียนรถ [ปกปิด] ' }
  ]);

  const SENSITIVE_CONTEXT_RULES = Object.freeze([
    { label: 'ข้อมูลสุขภาพ/ความพิการ', pattern: /(?:ข้อมูลสุขภาพ|ผลตรวจ|ผลเลือด|ผลเอกซเรย์|ผล(?:MRI|CT)|การวินิจฉัย|ประวัติการรักษา|โรคประจำตัว|ชื่อโรค|อาการป่วย|ยา(?:ที่ใช้|ประจำ)?|หมู่เลือด|กรุ๊ปเลือด|ความพิการ|ผู้พิการ|สุขภาพจิต|จิตเวช)/i },
    { label: 'ข้อมูลพันธุกรรม', pattern: /(?:พันธุกรรม|สารพันธุกรรม|DNA|genetic)/i },
    { label: 'ข้อมูลชีวมิติ', pattern: /(?:ชีวมิติ|biometric|ลายนิ้วมือ|ม่านตา|iris|faceprint|เสียงเพื่อยืนยันตัวตน)/i },
    { label: 'เชื้อชาติ/เผ่าพันธุ์', pattern: /(?:เชื้อชาติ|เผ่าพันธุ์|ชาติพันธุ์)/i },
    { label: 'ความคิดเห็นทางการเมือง', pattern: /(?:ความคิดเห็นทางการเมือง|แนวคิดทางการเมือง|สังกัดพรรคการเมือง|สมาชิกพรรคการเมือง)/i },
    { label: 'ความเชื่อ/ศาสนา', pattern: /(?:ศาสนา|ความเชื่อ|ลัทธิ|ปรัชญาความเชื่อ)/i },
    { label: 'พฤติกรรม/รสนิยมทางเพศ', pattern: /(?:พฤติกรรมทางเพศ|รสนิยมทางเพศ|อัตลักษณ์ทางเพศ|เพศวิถี)/i },
    { label: 'ประวัติอาชญากรรม', pattern: /(?:ประวัติอาชญากรรม|ประวัติอาญา|ทะเบียนประวัติอาชญากร|ผลตรวจประวัติอาชญากรรม)/i },
    { label: 'ข้อมูลสหภาพแรงงาน', pattern: /(?:สหภาพแรงงาน|สมาชิกสหภาพ)/i }
  ]);

  const BLOCK_RULES = Object.freeze([
    { label: 'ข้อมูลลับของราชการ', pattern: /(?:ข้อมูลลับของราชการ|ชั้นความลับ|ลับมาก|ลับที่สุด|SECRET|TOP\s*SECRET)/i },
    { label: 'รหัสผ่าน/กุญแจลับ', pattern: /(?:password|passwd|api\s*key|secret|token|bearer|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*[^\s,;]+/i },
    { label: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i }
  ]);

  const RESIDUAL_RISK_RULES = Object.freeze([
    { label: 'เลขประจำตัว 13 หลัก', pattern: /\b\d(?:[\s-]*\d){12}\b/ },
    { label: 'อีเมล', pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/ },
    { label: 'หมายเลขโทรศัพท์', pattern: /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/ },
    { label: 'ชุดตัวเลขยาวผิดปกติ', pattern: /\b\d{16,}\b/ },
    { label: 'ข้อมูลรับรองสิทธิ์/รหัสลับ', pattern: /(?:password|passwd|api\s*key|secret|token|bearer|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*\S+/i }
  ]);

  const MASKED_SEGMENT_PATTERN = /(?:(?:หนังสือเดินทาง|เลขผู้เสียภาษี|เลขบัญชี|ชื่อ|รหัสผู้ป่วย|วันเกิด|ที่อยู่|ทะเบียนรถ)\s*)?\[ปกปิด[^\]\n]{0,80}\]/g;
  const collapseWhitespace = value => String(value ?? '').replace(/\s+/g, ' ').trim();

  function protectMaskMarkers(input) {
    const markers = [];
    const protectedText = String(input ?? '').replace(MASKED_SEGMENT_PATTERN, marker => {
      const token = `\uE000${String.fromCharCode(0xE100 + markers.length)}\uE001`;
      markers.push(Object.freeze({ token, marker }));
      return token;
    });
    return Object.freeze({ protectedText, markers: Object.freeze(markers) });
  }

  function restoreMaskMarkers(input, markers) {
    let restored = String(input ?? '');
    markers.forEach(({ token, marker }) => {
      restored = restored.split(token).join(marker);
    });
    return restored;
  }

  function detectByRules(input, rules) {
    const text = String(input ?? '');
    return Object.freeze(rules.filter(rule => {
      rule.pattern.lastIndex = 0;
      return rule.pattern.test(text);
    }).map(rule => rule.label));
  }

  const detectBlockingRisk = input => detectByRules(input, BLOCK_RULES);
  const detectResidualRisk = input => detectByRules(input, RESIDUAL_RISK_RULES);
  const detectSensitiveContext = input => detectByRules(input, SENSITIVE_CONTEXT_RULES);

  function applyRedactions(input, { preserveWhitespace = false } = {}) {
    const original = String(input ?? '');
    let safeText = original;
    const redactions = [];

    // Protect every canonical mask before EACH rule, not only once at the start.
    // A rule may create a new mask that a later overlapping rule would otherwise
    // interpret as fresh PII (for example [ปกปิดชื่อบุคคล] contains "ชื่อ").
    REDACTION_RULES.forEach(rule => {
      const protectedStep = protectMaskMarkers(safeText);
      let working = protectedStep.protectedText;
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(working)) {
        redactions.push(rule.label);
        rule.pattern.lastIndex = 0;
        working = working.replace(rule.pattern, rule.replacement);
      }
      safeText = restoreMaskMarkers(working, protectedStep.markers);
    });

    const protectedNumbers = protectMaskMarkers(safeText);
    safeText = protectedNumbers.protectedText.replace(/\b\d{16,}\b/g, ' [ปกปิดชุดตัวเลข] ');
    safeText = restoreMaskMarkers(safeText, protectedNumbers.markers);
    safeText = preserveWhitespace
      ? safeText.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim()
      : collapseWhitespace(safeText);
    return { safeText, redactions: Object.freeze([...new Set(redactions)]) };
  }

  function sanitizeExternalContent(input) {
    const original = String(input ?? '');
    const blockingRisks = detectBlockingRisk(original);
    const sensitiveContext = detectSensitiveContext(original);
    const redacted = applyRedactions(original, { preserveWhitespace: true });
    const residualRisks = detectResidualRisk(redacted.safeText);
    const blocked = blockingRisks.length > 0 || sensitiveContext.length > 0 || residualRisks.length > 0;
    return Object.freeze({
      original,
      safeText: redacted.safeText,
      changed: redacted.safeText !== original,
      blocked,
      redactions: redacted.redactions,
      blockingRisks,
      residualRisks,
      sensitiveContext
    });
  }

  function sanitizeAttachmentName(name, index = 1) {
    const original = String(name ?? '').trim();
    const dot = original.lastIndexOf('.');
    const extension = dot > 0 && dot < original.length - 1
      ? original.slice(dot + 1).replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toLowerCase()
      : '';
    const base = dot > 0 ? original.slice(0, dot) : original;
    const privacy = sanitizeExternalContent(base);
    let safeBase = privacy.safeText.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!safeBase || privacy.blocked) safeBase = `เอกสารแนบ-${index}`;
    return Object.freeze({
      original,
      safeName: `${safeBase}${extension ? `.${extension}` : ''}`,
      changed: true,
      blocked: privacy.blocked,
      redactions: privacy.redactions,
      blockingRisks: privacy.blockingRisks,
      residualRisks: privacy.residualRisks,
      sensitiveContext: privacy.sensitiveContext
    });
  }

  function sanitizeExternalQuery(input) {
    const original = collapseWhitespace(input);
    const privacy = sanitizeExternalContent(original);
    let safeQuery = collapseWhitespace(privacy.safeText);
    const fallbackApplied = safeQuery.length < 3;
    if (fallbackApplied) safeQuery = 'กฎหมาย ระเบียบ หนังสือสั่งการ งานราชการ';
    return Object.freeze({ ...privacy, original, safeQuery, fallbackApplied });
  }

  function blockedSearchResult(privacy) {
    const reasons = [...new Set([...privacy.blockingRisks, ...privacy.sensitiveContext, ...privacy.residualRisks])];
    return Object.freeze({
      mode: 'blocked',
      provider: 'privacy-guard',
      searchedAt: new Date().toISOString(),
      results: Object.freeze([]),
      evidence: Object.freeze({ primaryResults: Object.freeze([]), conclusionEligible: false }),
      warning: `Privacy Guard หยุดการค้นภายนอก เพราะตรวจพบข้อมูลที่ห้ามส่ง${reasons.length ? ` (${reasons.join(', ')})` : ''}`,
      privacyGuard: Object.freeze({
        applied: true,
        blocked: true,
        redactions: privacy.redactions,
        blockingRisks: privacy.blockingRisks,
        residualRisks: privacy.residualRisks,
        sensitiveContext: privacy.sensitiveContext,
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
          window.GovPrompt?.toast?.('🔒 Privacy Guard บล็อกข้อมูลอ่อนไหว/ข้อมูลเสี่ยง ไม่ส่งออกภายนอก');
          return blockedSearchResult(privacy);
        }
        if (privacy.changed) window.GovPrompt?.toast?.('🔐 ปกปิดข้อมูลส่วนบุคคลก่อนค้นภายนอกแล้ว');
        const result = await connector.search(privacy.safeQuery, options);
        return result && typeof result === 'object'
          ? Object.freeze({
              ...result,
              privacyGuard: Object.freeze({
                applied: privacy.changed,
                blocked: false,
                redactions: privacy.redactions,
                blockingRisks: privacy.blockingRisks,
                residualRisks: privacy.residualRisks,
                sensitiveContext: privacy.sensitiveContext,
                externalQueryWasSanitized: privacy.changed,
                externalRequestSent: true
              })
            })
          : result;
      }
    });
    core.officialSearchConnector = guardedConnector;
    return true;
  }

  // Issue #73: the submit boundary has exactly one owner:
  // privacy-submit-guard.js. The former input gate in this module used its own
  // stopImmediatePropagation/requestSubmit flow and could suppress the sanitized
  // submit before Home/UI saw it. Keep this module responsible only for reusable
  // sanitization and the external-search guard.
  function simplifyPrimaryNavigation() {
    const toolsButton = document.querySelector('.bottom-nav [data-panel="tools"]');
    if (toolsButton) toolsButton.hidden = true;
    const nav = document.querySelector('.bottom-nav');
    if (nav) nav.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    sanitizeExternalQuery,
    sanitizeExternalContent,
    sanitizeAttachmentName,
    detectBlockingRisk,
    detectResidualRisk,
    detectSensitiveContext,
    installPrivacyGuard
  });

  function installAll() {
    installPrivacyGuard();
    simplifyPrimaryNavigation();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installAll, { once: true });
  else installAll();
})();
