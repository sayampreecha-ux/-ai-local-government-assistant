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
    { label: 'ชื่อบุคคล', pattern: /(?:นาย(?!ก(?:องค์การ|อบจ|เทศบาล|เทศมนตรี|อปท|ฯ|\s))|นางสาว|นาง|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,2}/g },
    { label: 'วันเดือนปีเกิด', pattern: /(?:วันเกิด|วันเดือนปีเกิด|เกิดวันที่)\s*[:：-]?\s*[^,;\n]{3,40}/gi },
    { label: 'ที่อยู่', pattern: /(?:ที่อยู่|บ้านเลขที่)\s*[:：-]?\s*[^,;\n]{3,120}/gi },
    { label: 'ทะเบียนรถ', pattern: /(?:ทะเบียนรถ|เลขทะเบียน)\s*[:：-]?\s*[ก-๙A-Za-z0-9 -]{2,20}/gi },
    { label: 'ข้อมูลรับรองสิทธิ์/รหัสลับ', pattern: /(?:password|passwd|api\s*key|secret|token|bearer|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*[^\s,;]+/gi },
    { label: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi },
    { label: 'ชุดตัวเลขยาวผิดปกติ', pattern: /\b\d{16,}\b/g }
  ]);

  const DATA_GATE_DECISIONS = Object.freeze({
    ALLOW: 'ALLOW',
    SANITIZE: 'SANITIZE',
    BLOCK: 'BLOCK'
  });

  const DATA_CLASSIFICATIONS = Object.freeze({
    PUBLIC: 'PUBLIC',
    INTERNAL_SANITIZABLE: 'INTERNAL_SANITIZABLE',
    RESTRICTED: 'RESTRICTED'
  });

  const PROCUREMENT_PATTERN = /(?:จัดซื้อจัดจ้าง|พัสดุ|TOR|ขอบเขตของงาน|ราคากลาง|ผู้ยื่นข้อเสนอ|ผู้เสนอราคา|ผู้ชนะการเสนอราคา|e-?bidding|ประกวดราคา)/i;
  const FINANCE_PATTERN = /(?:การเงิน|การคลัง|งบประมาณ|เบิกจ่าย|ฎีกา|ใบสำคัญ|เงินเดือน|ภาษี|บัญชีธนาคาร|เลขบัญชี|พร้อมเพย์)/i;
  const PUBLIC_PROCUREMENT_PATTERN = /(?:เผยแพร่(?:ต่อสาธารณะ)?แล้ว|ประกาศผู้ชนะ|ประกาศผล(?:การจัดซื้อจัดจ้าง)?|ผลการจัดซื้อจัดจ้าง|สัญญา(?:ที่)?เผยแพร่|TOR(?:ฉบับ)?(?:ที่)?(?:ประกาศ|เผยแพร่)|ราคากลาง(?:ที่)?(?:ประกาศ|เผยแพร่))/i;
  const DRAFT_INTERNAL_PATTERN = /(?:เอกสารร่าง\s*TOR|ร่าง\s*TOR\s*ฉบับนี้|ร่างขอบเขตของงานฉบับนี้|บันทึกภายใน|ฎีกาเบิกจ่าย|ใบสำคัญ(?:รับ|จ่าย)|รายงานการเงินภายใน|เอกสารผู้ขาย|เอกสารภายใน|ยังไม่เผยแพร่)/i;
  const ACTIVE_STAGE_PATTERN = /(?:อยู่ระหว่าง(?:พิจารณา|แข่งขัน|ประเมิน)|ระหว่าง(?:พิจารณา|แข่งขัน|ประเมิน)|ก่อนประกาศผล|ก่อนประกาศผู้ชนะ|ก่อนอนุมัติผล|ยังไม่ประกาศผู้ชนะ|pre[-\s]?award|active\s*bid|evaluation\s*in\s*progress)/i;
  const BIDDER_PATTERN = /(?:ผู้ยื่นข้อเสนอ|ผู้เสนอราคา|ผู้เข้าประกวดราคา|bidder|บริษัท\s*[A-Za-zก-๙]|หจก\.?|ห้างหุ้นส่วน)/i;
  const BID_PRICE_VALUE_PATTERN = /(?:ราคาเสนอ|ราคาที่เสนอ|วงเงินเสนอ|ใบเสนอราคา|bid\s*price|quotation)\s*[:：=]?\s*(?:บาท\s*)?\d[\d,]*(?:\.\d+)?/i;
  const COMMITTEE_SCORE_PATTERN = /(?:คะแนนกรรมการ|คะแนนประเมิน|ความเห็นกรรมการ|committee\s*score|evaluation\s*score)/i;
  const SCORE_VALUE_PATTERN = /(?:คะแนนกรรมการ|คะแนนประเมิน|committee\s*score|evaluation\s*score)[^0-9]{0,40}\d{1,3}(?:\.\d+)?(?:\s*คะแนน|\s*\/\s*100)?/i;
  const TRADE_SECRET_VALUE_PATTERN = /(?:ความลับทางการค้า|trade\s*secret)\s*[:：= -]\s*\S+/i;
  const GOV_CONFIDENTIAL_VALUE_PATTERN = /(?:(?:ชั้นความลับ|ระดับความลับ)\s*[:：= -]\s*(?:ลับ|ลับมาก|ลับที่สุด|secret|top\s*secret)|(?:เอกสารลับ|ข้อมูลลับของราชการ)\s*[:：= -]\s*\S+)/i;
  const CREDENTIAL_VALUE_PATTERN = /(?:password|passwd|api\s*key|secret|token|bearer|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]\s*[^\s,;]+/i;
  const PRIVATE_KEY_PATTERN = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i;
  const BANK_ACCOUNT_VALUE_PATTERN = /(?:เลข(?:ที่)?บัญชี|บัญชีธนาคาร|พร้อมเพย์)\s*[:：#-]?\s*\d(?:[\s-]*\d){5,19}\b/i;
  const NATIONAL_ID_PATTERN = /(?:เลข(?:ประจำตัว(?:ประชาชน)?|บัตรประชาชน)|บัตรประชาชน)\s*[:：#-]?\s*\d(?:[\s-]*\d){12}\b/i;
  const TAX_ID_PATTERN = /(?:เลขประจำตัวผู้เสียภาษี|tax\s*id)\s*[:：#-]?\s*\d(?:[\s-]*\d){9,14}\b/i;
  const PERSON_NAME_PATTERN = /(?:นาย(?!ก(?:องค์การ|อบจ|เทศบาล|เทศมนตรี|อปท|ฯ|\s))|นางสาว|นาง|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,2}/g;
  const PHONE_PATTERN = /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g;
  const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
  const ADDRESS_PATTERN = /(?:ที่อยู่|บ้านเลขที่)\s*[:：-]?\s*[^,;\n]{3,120}/gi;
  const SIGNATURE_PATTERN = /(?:ลงชื่อ|ลายมือชื่อ|ผู้ลงนาม)\s*[:：-]?\s*(?:นาย|นาง|นางสาว)?\s*[ก-๙A-Za-z.'’-]+(?:\s+[ก-๙A-Za-z.'’-]+){0,2}/gi;
  const PERSONAL_FINANCE_PATTERN = /(?:เงินเดือน|ค่าจ้างรายบุคคล|payroll|ภาษี(?:เงินได้)?(?:ของ)?|ภ\.ง\.ด\.)/i;
  const PERSON_LEVEL_MARKER_PATTERN = /(?:รายบุคคล|พนักงานรายนี้|เจ้าหน้าที่รายนี้|ของ\s*(?:นาย|นาง|นางสาว)\s+|เลขประจำตัวผู้เสียภาษี|เลขบัตรประชาชน)/i;
  const AGGREGATE_BUDGET_PATTERN = /(?:งบประมาณ|วงเงิน)[\s\S]{0,100}(?:เบิกจ่าย|ใช้ไป|คงเหลือ|เหลือ|รวม)|(?:เบิกจ่าย|ใช้ไป)[\s\S]{0,100}(?:คงเหลือ|เหลือ)/i;

  function resetAndTest(pattern, value) {
    pattern.lastIndex = 0;
    return pattern.test(String(value ?? ''));
  }

  function addFinding(findings, riskCodes, code, label, action) {
    riskCodes.push(code);
    findings.push(Object.freeze({ code, label, action }));
  }

  function sanitizeOrdinaryPii(input) {
    let safeText = String(input ?? '');
    const labels = [];
    const rules = [
      { label: 'ชื่อบุคคล', pattern: PERSON_NAME_PATTERN, replacement: '[ปกปิดชื่อบุคคล]' },
      { label: 'หมายเลขโทรศัพท์', pattern: PHONE_PATTERN, replacement: '[ปกปิดเบอร์โทร]' },
      { label: 'อีเมล', pattern: EMAIL_PATTERN, replacement: '[ปกปิดอีเมล]' },
      { label: 'ที่อยู่', pattern: ADDRESS_PATTERN, replacement: 'ที่อยู่ [ปกปิด]' },
      { label: 'ลายมือชื่อ/ผู้ลงนาม', pattern: SIGNATURE_PATTERN, replacement: '[ปกปิดผู้ลงนาม]' }
    ];
    rules.forEach(rule => {
      rule.pattern.lastIndex = 0;
      if (!rule.pattern.test(safeText)) return;
      labels.push(rule.label);
      rule.pattern.lastIndex = 0;
      safeText = safeText.replace(rule.pattern, rule.replacement);
    });
    return Object.freeze({
      safeText: safeText.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim(),
      labels: Object.freeze([...new Set(labels)])
    });
  }

  function evaluateProcurementFinanceData(input, context = {}) {
    const original = String(input ?? '').trim();
    const findings = [];
    const riskCodes = [];
    const domain = String(context.domain || '').toLowerCase();
    const isProcurement = domain === 'procurement' || resetAndTest(PROCUREMENT_PATTERN, original);
    const isFinance = domain === 'finance' || domain === 'planning-budget' || resetAndTest(FINANCE_PATTERN, original);
    const contextStage = String(context.procurementStage || '').toLowerCase();
    const activeStage = contextStage === 'pre_award' || contextStage === 'active'
      || resetAndTest(ACTIVE_STAGE_PATTERN, original);
    const isPublished = context.isPublished === true || (isProcurement && resetAndTest(PUBLIC_PROCUREMENT_PATTERN, original));
    const isDraftInternal = context.isPublished === false || resetAndTest(DRAFT_INTERNAL_PATTERN, original);
    const hasPersonLevelMarker = resetAndTest(PERSON_LEVEL_MARKER_PATTERN, original)
      || resetAndTest(PERSON_NAME_PATTERN, original);
    const aggregateBudget = isFinance && resetAndTest(AGGREGATE_BUDGET_PATTERN, original) && !hasPersonLevelMarker;

    if (resetAndTest(CREDENTIAL_VALUE_PATTERN, original) || resetAndTest(PRIVATE_KEY_PATTERN, original)) {
      addFinding(findings, riskCodes, 'CREDENTIAL_OR_TOKEN', 'ตรวจพบรหัสผ่าน Token API key หรือ private key', 'BLOCK');
    }
    if (resetAndTest(GOV_CONFIDENTIAL_VALUE_PATTERN, original)) {
      addFinding(findings, riskCodes, 'GOV_CONFIDENTIAL', 'ตรวจพบข้อมูลที่ระบุชั้นความลับของราชการ', 'BLOCK');
    }
    if (resetAndTest(TRADE_SECRET_VALUE_PATTERN, original)) {
      addFinding(findings, riskCodes, 'TRADE_SECRET', 'ตรวจพบเนื้อหาที่ระบุว่าเป็นความลับทางการค้า', 'BLOCK');
    }
    if (resetAndTest(BANK_ACCOUNT_VALUE_PATTERN, original)) {
      addFinding(findings, riskCodes, 'BANK_ACCOUNT_DETECTED', 'ตรวจพบเลขบัญชีธนาคารหรือพร้อมเพย์', 'BLOCK');
    }
    if (resetAndTest(NATIONAL_ID_PATTERN, original)) {
      addFinding(findings, riskCodes, 'PII_DETECTED', 'ตรวจพบเลขบัตรประชาชน/เลขประจำตัวบุคคล', 'BLOCK');
    }
    if (resetAndTest(TAX_ID_PATTERN, original)
      || (resetAndTest(PERSONAL_FINANCE_PATTERN, original) && hasPersonLevelMarker)) {
      addFinding(findings, riskCodes, 'PERSONAL_PAYROLL_OR_TAX', 'ตรวจพบข้อมูลเงินเดือน ภาษี หรือเลขผู้เสียภาษีระดับบุคคล', 'BLOCK');
    }
    if (isProcurement && activeStage
      && resetAndTest(BIDDER_PATTERN, original)
      && resetAndTest(BID_PRICE_VALUE_PATTERN, original)) {
      addFinding(findings, riskCodes, 'ACTIVE_BID_PRICE', 'ตรวจพบราคาเสนอของผู้ยื่นข้อเสนอระหว่างกระบวนการจัดซื้อจัดจ้าง', 'BLOCK');
    }
    if (isProcurement && activeStage
      && resetAndTest(COMMITTEE_SCORE_PATTERN, original)
      && resetAndTest(SCORE_VALUE_PATTERN, original)) {
      addFinding(findings, riskCodes, 'PRE_AWARD_COMMITTEE_SCORE', 'ตรวจพบคะแนน/ผลประเมินของกรรมการก่อนประกาศผล', 'BLOCK');
    }

    const uniqueBlockCodes = [...new Set(riskCodes)];
    if (uniqueBlockCodes.length) {
      return Object.freeze({
        decision: DATA_GATE_DECISIONS.BLOCK,
        classification: DATA_CLASSIFICATIONS.RESTRICTED,
        sanitizedText: '',
        riskCodes: Object.freeze(uniqueBlockCodes),
        findings: Object.freeze(findings)
      });
    }

    const pii = sanitizeOrdinaryPii(original);
    const canSanitizeOrdinaryPii = isProcurement || isFinance || isDraftInternal;
    const sanitizedPiiLabels = canSanitizeOrdinaryPii ? pii.labels : [];
    if (sanitizedPiiLabels.length) {
      addFinding(findings, riskCodes, 'PII_DETECTED', `ปกปิดข้อมูลส่วนบุคคลทั่วไป: ${sanitizedPiiLabels.join(', ')}`, 'SANITIZE');
    }
    if (isDraftInternal) {
      addFinding(findings, riskCodes, 'DRAFT_INTERNAL_DOCUMENT', 'เอกสารยังเป็นร่าง/เอกสารภายใน จึงต้องผ่านการปกปิดก่อนประมวลผล', 'SANITIZE');
    }
    if (isPublished) {
      addFinding(findings, riskCodes, 'PUBLIC_PROCUREMENT_DOCUMENT', 'เอกสารจัดซื้อจัดจ้างที่ระบุว่าเผยแพร่หรือประกาศต่อสาธารณะแล้ว', 'ALLOW');
    }
    if (aggregateBudget) {
      addFinding(findings, riskCodes, 'AGGREGATE_BUDGET', 'ข้อมูลเป็นยอดงบประมาณ/เบิกจ่ายแบบรวมและไม่พบตัวระบุบุคคล', 'ALLOW');
    }

    const uniqueCodes = [...new Set(riskCodes)];
    const mustSanitize = sanitizedPiiLabels.length > 0 || isDraftInternal;
    const classification = mustSanitize
      ? DATA_CLASSIFICATIONS.INTERNAL_SANITIZABLE
      : (isPublished || aggregateBudget ? DATA_CLASSIFICATIONS.PUBLIC : (isProcurement || isFinance ? DATA_CLASSIFICATIONS.INTERNAL_SANITIZABLE : DATA_CLASSIFICATIONS.PUBLIC));

    return Object.freeze({
      decision: mustSanitize ? DATA_GATE_DECISIONS.SANITIZE : DATA_GATE_DECISIONS.ALLOW,
      classification,
      sanitizedText: canSanitizeOrdinaryPii ? pii.safeText : original,
      riskCodes: Object.freeze(uniqueCodes),
      findings: Object.freeze(findings)
    });
  }

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
    notify(`🔒 GovPrompt บล็อกข้อมูลส่วนบุคคล/ข้อมูลอ่อนไหวก่อนประมวลผล หรือข้อมูลราชการ/จัดซื้อที่ไม่อนุญาต${labels}\n\nข้อมูลนี้จะไม่ถูกแสดงบน UI ไม่เข้า history/router/search และไม่ถูกส่งไป Worker/API ภายนอก กรุณาลบข้อมูลลับ ข้อมูลส่วนบุคคลระดับสูง หรือข้อมูลการแข่งขันจัดซื้อจัดจ้างที่ยังไม่ควรเปิดเผย`);
    input.focus();
  }

  function applySanitizedInput(input, gate) {
    input.value = gate.sanitizedText;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const reasons = gate.riskCodes.length ? ` (${gate.riskCodes.join(', ')})` : '';
    notify(`🔐 GovPrompt ปกปิดข้อมูลที่ระบุตัวบุคคลก่อนประมวลผลแล้ว${reasons}`);
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    evaluateProcurementFinanceData,
    PROCUREMENT_FINANCE_DATA_GATE: Object.freeze({
      decisions: DATA_GATE_DECISIONS,
      classifications: DATA_CLASSIFICATIONS,
      version: '1.0.0'
    })
  });

  function install() {
    const form = document.getElementById('chatForm');
    const input = document.getElementById('promptInput');
    if (!form || !input || form.dataset.privacySubmitGuard === '3') return;
    form.dataset.privacySubmitGuard = '3';

    form.addEventListener('submit', event => {
      const core = window.GovPromptCore;
      if (!core || typeof core.sanitizeExternalContent !== 'function'
        || typeof core.evaluateProcurementFinanceData !== 'function') {
        clearAndBlock(event, input, ['Privacy/Data Gate unavailable']);
        return;
      }

      const raw = input.value.trim();
      if (!raw) return;

      // Procurement & Finance Data Gate runs before any UI/history/router/search handoff.
      // BLOCK > SANITIZE > ALLOW. Raw restricted data never reaches the bubble-phase submit handler.
      // Security path remains before Home/UI/history/router/search/Worker/API.
      const gate = core.evaluateProcurementFinanceData(raw);
      if (gate.decision === DATA_GATE_DECISIONS.BLOCK) {
        clearAndBlock(event, input, gate.riskCodes);
        return;
      }

      let candidate = raw;
      if (gate.decision === DATA_GATE_DECISIONS.SANITIZE) {
        candidate = String(gate.sanitizedText || '').trim();
        if (!candidate) {
          clearAndBlock(event, input, ['SANITIZATION_EMPTY']);
          return;
        }
        applySanitizedInput(input, gate);
      }

      const normalized = normalizeCompactPatientIds(candidate);
      const failSafeRisks = detectFailSafeRisks(normalized);
      const privacy = core.sanitizeExternalContent(normalized);
      const reasons = [...new Set([
        ...failSafeRisks,
        ...(privacy.redactions || []),
        ...(privacy.blockingRisks || []),
        ...(privacy.sensitiveContext || []),
        ...(privacy.residualRisks || [])
      ])];

      // Security invariant v3 remains for every residual signal:
      // EVERY detected PII/sensitive signal fails closed in capture phase.
      // The only exception is a domain-scoped Procurement/Finance SANITIZE result whose
      // raw identifiers have already been removed before downstream code can observe them.
      const detected = reasons.length > 0 || Boolean(privacy.changed) || Boolean(privacy.blocked);
      if (detected) {
        clearAndBlock(event, input, reasons);
        return;
      }

      // Final pre-flight check immediately before allowing Home/UI to continue.
      const finalCheck = core.sanitizeExternalContent(candidate);
      const finalReasons = [...new Set([
        ...(finalCheck.redactions || []),
        ...(finalCheck.blockingRisks || []),
        ...(finalCheck.sensitiveContext || []),
        ...(finalCheck.residualRisks || [])
      ])];
      if (finalCheck.changed || finalCheck.blocked || finalReasons.length > 0) {
        clearAndBlock(event, input, finalReasons);
        return;
      }

      // If normalized text differs, only the normalized safe form may continue.
      if (normalized !== candidate) {
        input.value = normalized;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
