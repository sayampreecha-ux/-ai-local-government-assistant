(() => {
  'use strict';

  function install() {
    const form = document.getElementById('chatForm');
    const input = document.getElementById('promptInput');
    if (!form || !input || form.dataset.privacySubmitGuard === '1') return;
    form.dataset.privacySubmitGuard = '1';

    form.addEventListener('submit', event => {
      const core = window.GovPromptCore;
      if (!core || typeof core.sanitizeExternalContent !== 'function') {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.GovPrompt?.toast('🔒 Privacy Guard ยังไม่พร้อม ระบบหยุดส่งข้อมูลไว้ก่อน');
        return;
      }

      const original = input.value.trim();
      if (!original) return;
      const privacy = core.sanitizeExternalContent(original);

      if (privacy.blocked) {
        event.preventDefault();
        event.stopImmediatePropagation();
        input.value = privacy.safeText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        window.GovPrompt?.toast('🔒 พบข้อมูลเสี่ยงที่ยังปกปิดไม่สมบูรณ์ ระบบหยุดส่งไว้ก่อน กรุณาตรวจข้อความแล้วส่งใหม่');
        input.focus();
        return;
      }

      if (privacy.changed) {
        input.value = privacy.safeText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const labels = privacy.redactions?.length ? ` (${privacy.redactions.join(', ')})` : '';
        window.GovPrompt?.toast(`🔐 พบข้อมูลส่วนบุคคลและปกปิดก่อนประมวลผลแล้ว${labels}`);
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
