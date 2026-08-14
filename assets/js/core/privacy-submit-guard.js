(() => {
  'use strict';

  const FAILSAFE_RULES = Object.freeze([
    { label: 'เลขบัตรประชาชน/เลขประจำตัวตามบริบท', pattern: /(?:เลข(?:ประจำตัว(?:ประชาชน)?|บัตรประชาชน)|บัตรประชาชน)\s*[:：#-]?\s*\d(?:[\s-]*\d){3,19}\b/gi, replacement: ' [ปกปิดเลขประจำตัว] ' },
    { label: 'รหัสผู้ป่วย/HN/AN', pattern: /\b(HN|AN)\s*[:：#-]?\s*([A-Za-z0-9/-]{3,30})\b/gi, replacement: ' รหัสผู้ป่วย [ปกปิด] ' },
    { label: 'เลขบัตรประชาชน/เลขประจำตัว', pattern: /\b\d(?:[\s-]*\d){12}\b/g, replacement: ' [ปกปิดเลขประจำตัว] ' },
    { label: 'อีเมล', pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, replacement: ' [ปกปิดอีเมล] ' },
    { label: 'หมายเลขโทรศัพท์', pattern: /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g, replacement: ' [ปกปิดเบอร์โทร] ' },
    { label: 'เลขหนังสือเดินทาง', pattern: /(?:passport|หนังสือเดินทาง)\s*[:：#-]?\s*[A-Z0-9]{6,15}/gi, replacement: ' หนังสือเดินทาง [ปกปิด] ' },
    { label: 'เลขประจำตัวผู้เสียภาษี', pattern: /(?:เลขประจำตัวผู้เสียภาษี|tax\s*id)\s*[:：#-]?\s*\d(?:[\s-]*\d){9,14}/gi, replacement: ' เลขผู้เสียภาษี [ปกปิด] ' },
    { label: 'เลขบัญชี/พร้อมเพย์', pattern: /(?:เลขบัญชี|บัญชีธนาคาร|พร้อมเพย์)\s*[:：#-]?\s*[0-9\s-]{6,20}/gi, replacement: ' เลขบัญชี [ปกปิด] ' },
    { label: 'ข้อมูลรับรองสิทธิ์/รหัสลับ', pattern: /(?:password|passwd|api\s*key|secret|token|bearer|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*[^\s,;]+/gi, replacement: ' [ปกปิดข้อมูลรับรองสิทธิ์] ' },
    { label: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi, replacement: ' [ปกปิด Private key] ' },
    { label: 'ชุดตัวเลขยาวผิดปกติ', pattern: /\b\d{16,}\b/g, replacement: ' [ปกปิดชุดตัวเลข] ' }
  ]);

  function normalizeCompactPatientIds(value) {
    return String(value ?? '').replace(/\b(HN|AN)\s*[:：#-]?\s*([A-Za-z0-9/-]{3,30})\b/gi, '$1 $2');
  }

  function applyFailSafeRedactions(value) {
    let safeText = String(value ?? '');
    const redactions = [];
    FAILSAFE_RULES.forEach(rule => {
      rule.pattern.lastIndex = 0;
      if (!rule.pattern.test(safeText)) return;
      redactions.push(rule.label);
      rule.pattern.lastIndex = 0;
      safeText = safeText.replace(rule.pattern, rule.replacement);
    });
    safeText = safeText.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
    return Object.freeze({ safeText, changed: safeText !== String(value ?? ''), redactions: Object.freeze([...new Set(redactions)]) });
  }

  function stopSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function showPrivacyWarning(message, kind = 'mask') {
    const form = document.getElementById('chatForm');
    if (!form || typeof document.createElement !== 'function' || typeof form.insertAdjacentElement !== 'function') return false;

    let warning = document.getElementById('privacySubmitWarning');
    if (!warning) {
      warning = document.createElement('div');
      warning.id = 'privacySubmitWarning';
      warning.className = 'privacy-submit-warning';
      warning.setAttribute('role', 'status');
      warning.setAttribute('aria-live', 'assertive');
      warning.style.margin = '8px 0 0';
      warning.style.padding = '9px 12px';
      warning.style.borderRadius = '12px';
      warning.style.fontSize = '.86rem';
      warning.style.fontWeight = '700';
      warning.style.lineHeight = '1.45';
      warning.style.whiteSpace = 'pre-line';
      form.insertAdjacentElement('afterend', warning);
    }

    warning.dataset.kind = kind;
    warning.style.background = kind === 'block' ? '#fff1f0' : '#eef8f2';
    warning.style.border = kind === 'block' ? '1px solid #d92d20' : '1px solid #7bb99a';
    warning.style.color = kind === 'block' ? '#8a1c13' : '#12372a';
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

  function notify(message, kind = 'mask') {
    const surfaceShown = showPrivacyWarning(message, kind);
    if (typeof window.GovPrompt?.toast === 'function') {
      window.GovPrompt.toast(message);
      return;
    }
    if (!surfaceShown) window.alert(message);
  }

  function clearAndBlock(event, input, message) {
    stopSubmit(event);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    notify(message, 'block');
    input.focus();
  }

  function install() {
    const form = document.getElementById('chatForm');
    const input = document.getElementById('promptInput');
    if (!form || !input || form.dataset.privacySubmitGuard === '2') return;
    form.dataset.privacySubmitGuard = '2';

    form.addEventListener('submit', event => {
      const core = window.GovPromptCore;
      if (!core || typeof core.sanitizeExternalContent !== 'function') {
        clearAndBlock(event, input, '🔒 Privacy Guard ยังไม่พร้อม ระบบหยุดการส่งข้อความอัตโนมัติเพื่อความปลอดภัย');
        return;
      }

      const raw = input.value.trim();
      if (!raw) return;

      const normalized = normalizeCompactPatientIds(raw);
      const privacy = core.sanitizeExternalContent(normalized);
      const failSafe = applyFailSafeRedactions(privacy.safeText);
      const safeText = failSafe.safeText;
      const postCheck = core.sanitizeExternalContent(safeText);
      const reasons = [...new Set([
        ...(privacy.redactions || []),
        ...(failSafe.redactions || []),
        ...(privacy.blockingRisks || []),
        ...(privacy.sensitiveContext || []),
        ...(privacy.residualRisks || []),
        ...(postCheck.blockingRisks || []),
        ...(postCheck.sensitiveContext || []),
        ...(postCheck.residualRisks || [])
      ])];
      const changed = normalized !== raw || Boolean(privacy.changed) || failSafe.changed;
      const blocked = Boolean(privacy.blocked) || Boolean(postCheck.blocked);

      if (blocked || !safeText) {
        clearAndBlock(
          event,
          input,
          `🔒 GovPrompt บล็อกข้อมูลอ่อนไหว/ข้อมูลเสี่ยง ไม่ส่งต่อและไม่ประมวลผล${reasons.length ? `\nตรวจพบ: ${reasons.join(', ')}` : ''}\n\nกรุณาใช้ข้อมูลสมมติหรือข้อมูลที่ไม่สามารถระบุตัวบุคคลได้`
        );
        return;
      }

      if (!changed) return;

      input.value = safeText;
      input.dispatchEvent(new Event('input', { bubbles: true }));

      const finalCheck = core.sanitizeExternalContent(input.value.trim());
      if (finalCheck.blocked || finalCheck.changed || !input.value.trim()) {
        clearAndBlock(event, input, '🔒 Privacy Guard ตรวจซ้ำไม่ผ่าน ระบบยกเลิกการส่งเพื่อความปลอดภัย');
        return;
      }

      const labels = reasons.length ? `\nตรวจพบ: ${reasons.join(', ')}` : '';
      notify(`🔐 GovPrompt ตรวจพบข้อมูลส่วนบุคคลและปกปิดให้อัตโนมัติแล้ว${labels}\n\nข้อมูลดิบถูกปกปิดก่อนถึงหน้าจอ การค้นหา ประวัติ และระบบภายนอก`, 'mask');
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
