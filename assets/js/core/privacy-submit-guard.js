(() => {
  'use strict';

  const FAILSAFE_RULES = Object.freeze([
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

  function clearAndBlock(event, input, message) {
    stopSubmit(event);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    window.alert(message);
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

      // Security invariant: blocked/special-category data is terminated. For
      // redactable PII, the DOM value is replaced synchronously in capture phase
      // before Home/UI/router/search/history can observe the submit.
      if (blocked || !safeText) {
        clearAndBlock(
          event,
          input,
          `🔒 GovPrompt บล็อกข้อมูลอ่อนไหว/ข้อมูลเสี่ยง ไม่ส่งต่อและไม่ประมวลผล${reasons.length ? `\nตรวจพบ: ${reasons.join(', ')}` : ''}\n\nกรุณาใช้ข้อมูลสมมติหรือข้อมูลที่ไม่สามารถระบุตัวบุคคลได้`
        );
        return;
      }

      if (!changed) return;

      // Do not cancel/re-submit redactable PII. Rewrite the textarea before the
      // event reaches Home's submit listener, then let the same event continue.
      // This avoids native form re-entrancy while ensuring raw PII never reaches
      // render/router/search/prompt/history.
      input.value = safeText;
      input.dispatchEvent(new Event('input', { bubbles: true }));

      const finalCheck = core.sanitizeExternalContent(input.value.trim());
      if (finalCheck.blocked || finalCheck.changed || !input.value.trim()) {
        clearAndBlock(event, input, '🔒 Privacy Guard ตรวจซ้ำไม่ผ่าน ระบบยกเลิกการส่งเพื่อความปลอดภัย');
        return;
      }

      const labels = reasons.length ? `\nตรวจพบ: ${reasons.join(', ')}` : '';
      window.alert(`🔐 GovPrompt ตรวจพบข้อมูลส่วนบุคคลและปกปิดให้อัตโนมัติแล้ว${labels}\n\nข้อมูลดิบถูกปกปิดก่อนถึงหน้าจอ การค้นหา ประวัติ และระบบภายนอก`);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
