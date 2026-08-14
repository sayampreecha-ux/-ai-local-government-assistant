(() => {
  'use strict';

  const FAILSAFE_RULES = Object.freeze([
    { label: 'เลขบัตรประชาชน/เลขประจำตัวตามบริบท', pattern: /(?:เลข(?:ประจำตัว(?:ประชาชน)?|บัตรประชาชน)|บัตรประชาชน)\s*[:：#-]?\s*\d(?:[\s-]*\d){3,19}\b/gi },
    { label: 'รหัสผู้ป่วย/HN/AN', pattern: /\b(HN|AN)\s*[:：#-]?\s*([A-Za-z0-9/-]{3,30})\b/gi },
    { label: 'เลขบัตรประชาชน/เลขประจำตัว', pattern: /\b\d(?:[\s-]*\d){12}\b/g },
    { label: 'อีเมล', pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g },
    { label: 'หมายเลขโทรศัพท์', pattern: /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g },
    { label: 'เลขหนังสือเดินทาง', pattern: /(?:passport|หนังสือเดินทาง)\s*[:：#-]?\s*[A-Z0-9]{6,15}/gi },
    { label: 'เลขประจำตัวผู้เสียภาษี', pattern: /(?:เลขประจำตัวผู้เสียภาษี|tax\s*id)\s*[:：#-]?\s*\d(?:[\s-]*\d){9,14}/gi },
    { label: 'เลขบัญชี/พร้อมเพย์', pattern: /(?:เลขบัญชี|บัญชีธนาคาร|พร้อมเพย์)\s*[:：#-]?\s*[0-9\s-]{6,20}/gi },
    { label: 'ชื่อบุคคล', pattern: /(?:นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,2}/g },
    { label: 'วันเดือนปีเกิด', pattern: /(?:วันเกิด|วันเดือนปีเกิด|เกิดวันที่)\s*[:：-]?\s*[^,;\n]{3,40}/gi },
    { label: 'ที่อยู่', pattern: /(?:ที่อยู่|บ้านเลขที่)\s*[:：-]?\s*[^,;\n]{3,120}/gi },
    { label: 'ทะเบียนรถ', pattern: /(?:ทะเบียนรถ|เลขทะเบียน)\s*[:：-]?\s*[ก-๙A-Za-z0-9 -]{2,20}/gi },
    { label: 'ข้อมูลรับรองสิทธิ์/รหัสลับ', pattern: /(?:password|passwd|api\s*key|secret|token|bearer|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*[^\s,;]+/gi },
    { label: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi },
    { label: 'ชุดตัวเลขยาวผิดปกติ', pattern: /\b\d{16,}\b/g }
  ]);

  function normalizeCompactPatientIds(value) {
    return String(value ?? '').replace(/\b(HN|AN)\s*[:：#-]?\s*([A-Za-z0-9/-]{3,30})\b/gi, '$1 $2');
  }

  function detectFailSafeRisks(value) {
    const text = String(value ?? '');
    return Object.freeze(FAILSAFE_RULES.filter(rule => {
      rule.pattern.lastIndex = 0;
      return rule.pattern.test(text);
    }).map(rule => rule.label));
  }

  function stopSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function showPrivacyWarning(message) {
    const form = document.getElementById('chatForm');
    if (!form || typeof document.createElement !== 'function' || typeof form.insertAdjacentElement !== 'function') return false;
    let warning = document.getElementById('privacySubmitWarning');
    if (!warning) {
      warning = document.createElement('div');
      warning.id = 'privacySubmitWarning';
      warning.className = 'privacy-submit-warning';
      warning.setAttribute('role', 'alert');
      warning.setAttribute('aria-live', 'assertive');
      warning.style.margin = '8px 0 0';
      warning.style.padding = '9px 12px';
      warning.style.borderRadius = '12px';
      warning.style.fontSize = '.86rem';
      warning.style.fontWeight = '700';
      warning.style.lineHeight = '1.45';
      warning.style.whiteSpace = 'pre-line';
      warning.style.background = '#fff1f0';
      warning.style.border = '1px solid #d92d20';
      warning.style.color = '#8a1c13';
      form.insertAdjacentElement('afterend', warning);
    }
    warning.textContent = message;
    warning.hidden = false;
    if (window.__govPromptPrivacyWarningTimer) window.clearTimeout?.(window.__govPromptPrivacyWarningTimer);
    if (typeof window.setTimeout === 'function') {
      window.__govPromptPrivacyWarningTimer = window.setTimeout(() => {
        const current = document.getElementById('privacySubmitWarning');
        if (current) current.hidden = true;
      }, 10_000);
    }
    return true;
  }

  function notify(message) {
    const surfaceShown = showPrivacyWarning(message);
    if (typeof window.GovPrompt?.toast === 'function') {
      window.GovPrompt.toast(message);
      return;
    }
    if (!surfaceShown) window.alert(message);
  }

  function clearAndBlock(event, input, reasons = []) {
    stopSubmit(event);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const labels = reasons.length ? `\nตรวจพบ: ${[...new Set(reasons)].join(', ')}` : '';
    notify(`🔒 GovPrompt บล็อกข้อมูลส่วนบุคคล/ข้อมูลอ่อนไหวก่อนประมวลผล${labels}\n\nข้อมูลนี้จะไม่ถูกแสดงบน UI ไม่เข้า history/router/search และไม่ถูกส่งไป Worker/API ภายนอก กรุณาใช้ข้อมูลสมมติหรือข้อมูลที่ไม่สามารถระบุตัวบุคคลได้`);
    input.focus();
  }

  function install() {
    const form = document.getElementById('chatForm');
    const input = document.getElementById('promptInput');
    if (!form || !input || form.dataset.privacySubmitGuard === '3') return;
    form.dataset.privacySubmitGuard = '3';

    form.addEventListener('submit', event => {
      const core = window.GovPromptCore;
      if (!core || typeof core.sanitizeExternalContent !== 'function') {
        clearAndBlock(event, input, ['Privacy Guard unavailable']);
        return;
      }

      const raw = input.value.trim();
      if (!raw) return;

      const normalized = normalizeCompactPatientIds(raw);
      const failSafeRisks = detectFailSafeRisks(normalized);
      const privacy = core.sanitizeExternalContent(normalized);
      const reasons = [...new Set([
        ...failSafeRisks,
        ...(privacy.redactions || []),
        ...(privacy.blockingRisks || []),
        ...(privacy.sensitiveContext || []),
        ...(privacy.residualRisks || [])
      ])];

      // Security invariant v3: EVERY detected PII/sensitive signal fails closed in capture phase.
      // Nothing detected is rewritten and allowed onward. The raw submit is stopped before
      // Home/UI/history/router/search/Worker/API can observe or persist it.
      const detected = reasons.length > 0 || Boolean(privacy.changed) || Boolean(privacy.blocked);
      if (detected) {
        clearAndBlock(event, input, reasons);
        return;
      }

      // Final pre-flight check immediately before allowing the event to continue.
      const finalCheck = core.sanitizeExternalContent(raw);
      const finalReasons = [...new Set([
        ...(finalCheck.redactions || []),
        ...(finalCheck.blockingRisks || []),
        ...(finalCheck.sensitiveContext || []),
        ...(finalCheck.residualRisks || [])
      ])];
      if (finalCheck.changed || finalCheck.blocked || finalReasons.length > 0) {
        clearAndBlock(event, input, finalReasons);
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
