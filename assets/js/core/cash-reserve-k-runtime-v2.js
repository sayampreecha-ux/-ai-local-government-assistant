(() => {
  'use strict';

  const app = window.GovPrompt = window.GovPrompt || {};
  const root = window.GovPromptCore;
  if (!root || typeof root.createGovernmentPrompt !== 'function') {
    app.emit?.('cash-k:integration-error', { reason: 'GovPromptCore unavailable' });
    return;
  }
  if (root.__cashReserveKRuntimeV2Installed) return;

  // Hard policy: GovPrompt must never execute live web/official-source searches.
  // The AI provider selected by the user performs live retrieval externally.
  const delegatedResult = (query, channel = 'external-ai') => Object.freeze({
    status: 'delegated-to-external-ai',
    searchDelegation: 'external-ai-only',
    query: String(query ?? ''),
    channel,
    executedInternally: false,
    message: 'โปรดให้ AI ภายนอกที่ผู้ใช้เลือกค้นสดจากแหล่งทางการ แล้วนำหลักฐานกลับมาให้ GovPrompt ตรวจสอบ'
  });

  app.searchPolicy = Object.freeze({
    mode: 'external-ai-only',
    disableInternalLiveSearch: true,
    delegatedResult,
    version: '1.1.0'
  });

  const guardedNames = ['search', 'searchOfficial', 'searchWeb', 'liveSearch', 'officialSearch', 'executeBudgetOfficialSourceSearch'];
  const guardedTargets = new WeakSet();
  const guardTarget = target => {
    if (!target || (typeof target !== 'object' && typeof target !== 'function') || guardedTargets.has(target)) return;
    guardedTargets.add(target);
    guardedNames.forEach(name => {
      if (typeof target[name] !== 'function' || target[`__externalAiOnly_${name}`]) return;
      const original = target[name];
      target[name] = function externalAiOnlySearchGuard(query, ...args) {
        return Promise.resolve(delegatedResult(query));
      };
      try {
        Object.defineProperty(target, `__externalAiOnly_${name}`, { value: true, configurable: true });
        Object.defineProperty(target, `__original_${name}`, { value: original, configurable: true });
      } catch {
        target[`__externalAiOnly_${name}`] = true;
        target[`__original_${name}`] = original;
      }
    });
  };

  const scanAndGuard = () => {
    [root, app, app.officialSearchConnector, app.officialSourceConnector, app.searchConnector,
      app.budgetOfficialSourceRuntime, app.budgetOfficialDocumentConnector].forEach(guardTarget);
  };
  scanAndGuard();
  // Cover connectors initialized after this runtime script.
  if (typeof window.setInterval === 'function') {
    const timer = window.setInterval(scanAndGuard, 250);
    window.setTimeout?.(() => window.clearInterval?.(timer), 30_000);
  }

  const rulepack = app.cashReserveKRulePack;
  const isRelevant = value => rulepack?.detect?.(String(value ?? '')).relevant === true
    || /(เงินสะสม|ค่า\s*K|ค่าชดเชยสัญญา|สัญญาแบบปรับราคาได้|ว\s*1095|ข้อ\s*97\s*\(\s*1\s*\))/i.test(String(value ?? ''));

  const policyBlock = [
    '=== CASH RESERVE + K PAYMENT CONTROL (MANDATORY) ===',
    'ภารกิจนี้เกี่ยวกับการใช้เงินสะสมเพื่อจ่ายค่า K ให้ผู้รับจ้าง ให้ตรวจแบบ Evidence-First และห้ามฟันธงจากหมวดงบประมาณเพียงอย่างเดียว',
    '1) แยกประเด็นการจำแนกประเภทรายจ่ายออกจากฐานอำนาจและเงื่อนไขการใช้เงินสะสมตามข้อ 97(1) ฉบับที่ใช้บังคับ ณ วันเกิดรายการ',
    '2) ตรวจต้นฉบับหนังสือ มท 0808.2/1095 ลงวันที่ 28 พฤษภาคม 2564 และขอบเขตประเภท (13) โดยห้ามถือภาพหน้าจอหรือคำตอบหารือแทนต้นฉบับ',
    '3) ตรวจสัญญาแบบปรับราคาได้ สูตร ดัชนี งวดงาน วันที่เกิดสิทธิ เอกสารคำนวณ การตรวจสอบ และการอนุมัติค่า K',
    '4) วิเคราะห์เรื่องการขอยกเว้น/ไม่ขอยกเว้นแยกต่างหาก ต้องระบุฐานอำนาจ เงื่อนไข และข้อเท็จจริงที่ทำให้เข้าเกณฑ์ ห้ามสรุปอัตโนมัติว่าทุกกรณีไม่ต้องขอ',
    '5) ให้ AI ภายนอกที่ผู้ใช้เลือกค้นแหล่งทางการก่อนสรุป; GovPrompt ห้ามค้นสดเอง และทำหน้าที่ตรวจหลักฐาน/เงื่อนไข/ความขัดแย้ง',
    '6) หากไม่มีต้นฉบับหรือหลักฐานสำคัญไม่ครบ ให้เปิด Decision Lock และตอบเป็นคำวิเคราะห์เบื้องต้นแบบมีเงื่อนไข พร้อมรายการหลักฐานที่ต้องเพิ่ม',
    '7) ผลลัพธ์ต้องมี: ข้อเท็จจริงที่ยืนยัน/ยังไม่ยืนยัน, ฐานอำนาจ, ตารางตรวจ Gate, ผลการตรวจค่า K, วิเคราะห์ข้อยกเว้น, ความเสี่ยง, แนวทางปฏิบัติ และสถานะสุดท้าย',
    'ห้ามกำหนดสูตร อัตรา ดัชนี หรือเงื่อนไขค่า K แบบตายตัวจากความจำหรือจากกรณีตัวอย่าง'
  ].join('\n');

  const originalCreate = root.createGovernmentPrompt;
  root.createGovernmentPrompt = function patchedCreateGovernmentPrompt(args = {}) {
    const question = String(args.question ?? args.text ?? args.facts ?? '');
    const result = originalCreate.call(this, args);
    if (!isRelevant(question) || !result || typeof result !== 'object') return result;
    const prompt = `${result.prompt || ''}\n\n${policyBlock}`;
    return Object.freeze({
      ...result,
      prompt,
      cashReserveKControl: Object.freeze({
        id: 'cash-reserve-k-payment',
        version: '2.1.1',
        decisionLockDefault: true,
        officialSourceFirst: true,
        searchDelegation: 'external-ai-only',
        internalLiveSearchDisabled: true,
        requiredGates: ['classification', 'authority', 'k-entitlement', 'waiver-exemption', 'evidence']
      })
    });
  };

  root.__cashReserveKRuntimeV2Installed = true;
  app.emit?.('cash-k:integration-ready', { version: '2.1.1', searchDelegation: 'external-ai-only', internalLiveSearchDisabled: true });
})();
