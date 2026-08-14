(() => {
  'use strict';

  function normalizeCompactPatientIds(value) {
    return String(value ?? '').replace(/\b(HN|AN)\s*[:：#-]?\s*([A-Za-z0-9/-]{3,30})\b/gi, '$1 $2');
  }

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
        input.value = '';
        window.alert('🔒 Privacy Guard ยังไม่พร้อม ระบบไม่รับส่งข้อความเพื่อความปลอดภัย');
        return;
      }

      const raw = input.value.trim();
      if (!raw) return;
      const normalized = normalizeCompactPatientIds(raw);
      const privacy = core.sanitizeExternalContent(normalized);

      if (privacy.blocked) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const reasons = [...new Set([...(privacy.blockingRisks || []), ...(privacy.sensitiveContext || []), ...(privacy.residualRisks || [])])];
        input.value = privacy.changed && !(privacy.sensitiveContext || []).length && !(privacy.blockingRisks || []).length ? privacy.safeText : '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        window.alert(`🔒 GovPrompt บล็อกข้อมูลอ่อนไหว/ข้อมูลเสี่ยง ไม่ส่งต่อและไม่ประมวลผล${reasons.length ? `\nตรวจพบ: ${reasons.join(', ')}` : ''}\n\nกรุณาใช้ข้อมูลสมมติหรือข้อมูลที่ไม่สามารถระบุตัวบุคคลได้`);
        input.focus();
        return;
      }

      if (privacy.changed || normalized !== raw) {
        input.value = privacy.safeText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const labels = privacy.redactions?.length ? ` (${privacy.redactions.join(', ')})` : '';
        window.GovPrompt?.toast(`🔐 ปกปิดข้อมูลส่วนบุคคลก่อนประมวลผลแล้ว${labels}`);
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
