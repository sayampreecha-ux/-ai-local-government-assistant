(() => {
  'use strict';

  const form = document.getElementById('chatForm');
  const input = document.getElementById('promptInput');
  const conversation = document.getElementById('conversation');
  const attachmentInput = document.getElementById('attachmentInput');
  const cameraInput = document.getElementById('cameraInput');
  const attachmentStatus = document.getElementById('attachmentStatus');
  const outputFormatSelect = document.getElementById('outputFormatSelect');
  const outputFormatButton = document.getElementById('outputFormatButton');
  const resultPromptKey = 'govprompt.resultPrompt.v1';
  const resultForceIntakeKey = 'govprompt.forceGuidedIntake.v1';
  let resultRoute = new URLSearchParams(window.location.search).get('view') === 'result';

  function enterResultPage() {
    if (!resultRoute) {
      const target = new URL(window.location.href);
      target.searchParams.set('view', 'result');
      target.hash = '';
      // Keep File objects and the selected output format in this document.
      // This runs after an accepted submission, never before the privacy gate.
      window.history.pushState({ govpromptResult: true }, '', target.toString());
      resultRoute = true;
    }
    document.documentElement.classList.add('result-route');
    document.querySelector('.chat-main').classList.add('has-messages');
    conversation.after(document.querySelector('.composer-region'));
    installResultHeader();
  }

  // Guided intake handles its own submit event. Move its rendered questions to
  // the result view too, without intercepting or replaying that submission.
  new MutationObserver(records => {
    const addedIntake = records.some(record => [...record.addedNodes].some(node =>
      node.nodeType === 1 && node.classList.contains('guided-intake-message')));
    if (!addedIntake) return;
    enterResultPage();
    document.documentElement.classList.add('result-intake');
    input.placeholder = 'พิมพ์ข้อมูลเพิ่มเติมที่จำเป็น...';
    document.querySelector('.result-page-header strong').textContent = 'ข้อมูลประกอบงาน';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }).observe(conversation, { childList: true });

  window.addEventListener('popstate', () => {
    const nextResultRoute = new URLSearchParams(window.location.search).get('view') === 'result';
    if (nextResultRoute !== resultRoute) window.location.reload();
  });

  function installResultHeader() {
    if (!resultRoute || document.querySelector('.result-page-header')) return;
    const header = document.createElement('div');
    header.className = 'result-page-header';
    header.innerHTML = '<a href="index.html" class="result-back">← เลือกงานอื่น</a><div><span>GOVPROMPT</span><strong>ผลลัพธ์พร้อมใช้งาน</strong></div>';
    conversation.before(header);
  }

  function ensureOutputFormatDialog() {
    let dialog = document.getElementById('outputFormatDialog');
    if (dialog || !outputFormatSelect) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'outputFormatDialog';
    dialog.className = 'output-format-picker-dialog';
    dialog.setAttribute('aria-labelledby', 'outputFormatDialogTitle');

    const head = document.createElement('div');
    head.className = 'output-format-picker-head';
    const title = document.createElement('strong');
    title.id = 'outputFormatDialogTitle';
    title.textContent = 'รูปแบบผลลัพธ์';
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'ปิด');
    close.textContent = '×';
    close.addEventListener('click', () => dialog.close());
    head.append(title, close);

    const grid = document.createElement('div');
    grid.className = 'output-format-picker-grid';
    [...outputFormatSelect.options].forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.value = option.value;
      button.textContent = option.textContent;
      button.setAttribute('aria-pressed', option.value === outputFormatSelect.value ? 'true' : 'false');
      button.addEventListener('click', () => {
        outputFormatSelect.value = option.value;
        outputFormatSelect.dispatchEvent(new Event('change', { bubbles: true }));
        dialog.close();
      });
      grid.append(button);
    });

    dialog.append(head, grid);
    document.body.append(dialog);
    dialog.addEventListener('close', () => outputFormatButton?.focus());
    return dialog;
  }

  function syncOutputFormatButton() {
    if (!outputFormatSelect || !outputFormatButton) return;
    const option = outputFormatSelect.options[outputFormatSelect.selectedIndex];
    outputFormatButton.textContent = option?.textContent || 'ให้ระบบเลือกอัตโนมัติ';
    const dialog = document.getElementById('outputFormatDialog');
    if (dialog) {
      dialog.querySelectorAll('[data-value]').forEach(button => {
        button.setAttribute('aria-pressed', button.dataset.value === outputFormatSelect.value ? 'true' : 'false');
      });
    }
  }

  outputFormatButton?.addEventListener('click', () => {
    const dialog = ensureOutputFormatDialog();
    syncOutputFormatButton();
    if (dialog?.showModal) dialog.showModal();
  });
  outputFormatSelect?.addEventListener('change', syncOutputFormatButton);
  syncOutputFormatButton();

  const dialog = document.getElementById('appDialog');
  const legacyHistoryKey = 'govprompt-v3-history';
  const history = [];
  let attachments = [];

  try { localStorage.removeItem(legacyHistoryKey); } catch {}

  const runtimeMetrics = { lcp: 0, cls: 0 };
  try {
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      if (entries.length) runtimeMetrics.lcp = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => {
      list.getEntries().forEach(entry => { if (!entry.hadRecentInput) runtimeMetrics.cls += entry.value; });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  window.addEventListener('load', () => setTimeout(() => {
    const paints = performance.getEntriesByType('paint');
    const firstPaint = paints.find(entry => entry.name === 'first-paint');
    const firstContentfulPaint = paints.find(entry => entry.name === 'first-contentful-paint');
    document.documentElement.dataset.firstPaint = String(firstPaint?.startTime ?? 0);
    document.documentElement.dataset.fcp = String(firstContentfulPaint?.startTime ?? 0);
    document.documentElement.dataset.lcp = String(runtimeMetrics.lcp);
    document.documentElement.dataset.cls = String(runtimeMetrics.cls);
    const metricTarget = document.getElementById('main-content');
    if (metricTarget) {
      metricTarget.dataset.firstPaint = document.documentElement.dataset.firstPaint;
      metricTarget.dataset.fcp = document.documentElement.dataset.fcp;
      metricTarget.dataset.lcp = document.documentElement.dataset.lcp;
      metricTarget.dataset.cls = document.documentElement.dataset.cls;
    }
  }, 1000), { once: true });

  const escapeHTML = value => String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const domainNames = Object.freeze({
    records: 'งานสารบรรณ', legal: 'กฎหมายและข้อบัญญัติ', procurement: 'พัสดุและจัดซื้อจัดจ้าง',
    'planning-budget': 'แผน โครงการ และงบประมาณ', finance: 'การเงินและการคลัง', 'human-resources': 'งานบุคคล',
    engineering: 'งานช่างและวิศวกรรม', 'public-health': 'สาธารณสุข', education: 'การศึกษา',
    'internal-audit': 'ตรวจสอบภายใน', executive: 'งานบริหาร', 'public-relations': 'ประชาสัมพันธ์',
    council: 'งานสภาท้องถิ่น', general: 'งานราชการทั่วไป'
  });

  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }

  function addUserMessage(text) {
    const article = document.createElement('article');
    article.className = 'message user';
    article.innerHTML = `<div class="message-body">${escapeHTML(text)}</div>`;
    conversation.appendChild(article);
  }

  function addThinking() {
    const article = document.createElement('article');
    article.className = 'message assistant';
    article.id = 'thinkingMessage';
    article.innerHTML = '<span class="assistant-mark" aria-hidden="true">กพ</span><div class="assistant-content"><div class="thinking"><span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>กำลังจัดโครงสร้างคำถามและเตรียม Prompt</span></div><div class="analysis-steps">จำแนกงาน · ตรวจความเสี่ยง · กำหนดแหล่งที่ AI ควรค้น · เตรียมผลลัพธ์</div></div>';
    conversation.appendChild(article);
  }

  function requireCore() {
    const core = window.GovPromptCore;
    if (!core
      || typeof core.createSharedContext !== 'function'
      || typeof core.routeTransaction !== 'function'
      || typeof core.createGovernmentPrompt !== 'function'
      || typeof core.resolveOutputFormatPreset !== 'function') {
      throw new Error('GovPrompt Core is unavailable');
    }
    return core;
  }

  function sanitizedAttachmentMetadata(core) {
    return Object.freeze(attachments.map((file, index) => {
      const privacy = typeof core.sanitizeAttachmentName === 'function'
        ? core.sanitizeAttachmentName(file.name, index + 1)
        : { safeName: `เอกสารแนบ-${index + 1}`, changed: true, blocked: false };
      return Object.freeze({
        name: privacy.safeName,
        type: String(file.type || ''),
        size: Number(file.size || 0),
        lastModified: Number(file.lastModified || 0),
        privacyChanged: Boolean(privacy.changed),
        privacyBlocked: Boolean(privacy.blocked)
      });
    }));
  }

  function prepareExternalPrompt(prompt) {
    const core = requireCore();
    if (typeof core.sanitizeExternalContent !== 'function') {
      return Object.freeze({ blocked: true, safeText: '', changed: false, reason: 'PRIVACY_GUARD_UNAVAILABLE' });
    }
    const privacy = core.sanitizeExternalContent(prompt);
    const source = String(prompt ?? '');
    const explicitSecretValue = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:password|passwd|api\s*key|secret|token|bearer|รหัสผ่าน|กุญแจ\s*api)\s*[:=：]\s*[A-Za-z0-9_./+\-=]{8,}/i.test(source);
    const residualIdentifierRisks = (privacy.residualRisks || []).filter(label => label !== 'ข้อมูลรับรองสิทธิ์/รหัสลับ');
    // Generated prompts may contain security guidance words such as "API key", "token",
    // "health data" or "government confidential data". Those labels alone are not secrets.
    // Block only an actual secret value/private key or residual direct identifiers that
    // remain after automatic redaction.
    const blocked = explicitSecretValue || residualIdentifierRisks.length > 0;
    return Object.freeze({
      blocked,
      safeText: privacy.safeText,
      changed: privacy.changed,
      reason: blocked ? 'SENSITIVE_EXTERNAL_HANDOFF_BLOCKED' : ''
    });
  }

  async function prepareWorkflowRuntime(text, evidence = []) {
    const privacy = prepareExternalPrompt(text);
    if (privacy.blocked || !privacy.safeText) return Object.freeze({ view: null, block: '', status: 'privacy-blocked' });
    try {
      const runtime = await import('./core/government-workflow-runtime-v5.js?v=5.6.4');
      const view = runtime.buildWorkflowRuntimeView({ query: privacy.safeText, evidence: Array.isArray(evidence) ? evidence : [] });
      return Object.freeze({ view, block: runtime.buildWorkflowPromptBlock(view), status: 'ready' });
    } catch {
      return Object.freeze({ view: null, block: '', status: 'runtime-unavailable' });
    }
  }

  async function prepareBudgetOfficialRuntime(text, workflowRuntime, core) {
    if (!workflowRuntime?.view?.workflowIds?.includes('gov.budget-draft')) return Object.freeze({ workflowRuntime, budgetSourceRuntime: null });
    const privacy = prepareExternalPrompt(text);
    if (privacy.blocked || !privacy.safeText) return Object.freeze({ workflowRuntime, budgetSourceRuntime: null });
    try {
      const [budgetRuntime, documentModule, browserInputModule] = await Promise.all([
        import('./core/budget-official-source-runtime-v1.js?v=2.1.0'),
        import('./core/budget-official-document-connector-v1.js?v=1.0.0'),
        import('./core/budget-browser-input-runtime-v1.js?v=1.6.0')
      ]);
      const targetYear = budgetRuntime.parseBudgetYear(privacy.safeText);
      const browserInputs = await browserInputModule.prepareBudgetInternalInputsFromFiles(attachments, { targetYear });
      const documentConnector = documentModule.createBudgetOfficialDocumentConnector();
      const budgetSourceRuntime = await budgetRuntime.executeBudgetOfficialSourceSearch({
        query: privacy.safeText,
        workflowView: workflowRuntime.view,
        connector: core.officialSearchConnector,
        documentConnector,
        internalBudgetInputs: browserInputs.inputs
      });
      const refreshedWorkflowRuntime = await prepareWorkflowRuntime(privacy.safeText, budgetSourceRuntime.evidence);
      return Object.freeze({
        workflowRuntime: refreshedWorkflowRuntime.status === 'ready' ? refreshedWorkflowRuntime : workflowRuntime,
        budgetSourceRuntime: Object.freeze({ ...budgetSourceRuntime, browserInputs })
      });
    } catch {
      return Object.freeze({ workflowRuntime, budgetSourceRuntime: null });
    }
  }

  function enrichPromptWithWorkflow(promptBundle, workflowRuntime) {
    if (!workflowRuntime?.block) return promptBundle;
    return Object.freeze({ ...promptBundle, prompt: `${promptBundle.prompt}\n\n${workflowRuntime.block}`, workflowRuntime: workflowRuntime.view });
  }

  function enrichPromptWithSearch(promptBundle, searchResult) {
    const results = searchResult?.evidence?.primaryResults || [];
    const evidenceLines = results.slice(0, 8).map((item, index) => [
      `${index + 1}. ${item.title || '[ไม่มีชื่อเอกสาร]'}`,
      `หน่วยงาน/แหล่ง: ${item.sourceName || item.issuingAgency || item.sourceId || 'แหล่งราชการ'}`,
      `URL: ${item.sourceUrl}`,
      item.documentDate ? `วันที่เอกสาร: ${item.documentDate}` : '',
      item.snippet ? `ข้อมูลย่อจากผลค้น: ${item.snippet}` : ''
    ].filter(Boolean).join('\n'));
    const searchBlock = [
      'ผลค้นแหล่งราชการสดจาก GovPrompt',
      `- สถานะการค้น: ${searchResult?.mode === 'live' ? 'ค้นสดแล้ว' : 'ยังค้นสดไม่ได้'}`,
      searchResult?.searchedAt ? `- เวลาค้น: ${searchResult.searchedAt}` : '',
      searchResult?.provider ? `- Search provider: ${searchResult.provider}` : '',
      searchResult?.warning ? `- คำเตือน: ${searchResult.warning}` : '',
      '- หลักการใช้หลักฐาน: Primary Source First; ห้ามใช้ secondary source ฟันธงเมื่อมี primary source',
      evidenceLines.length ? evidenceLines.join('\n\n') : '- ยังไม่มีผลค้นต้นฉบับราชการที่นำมาใช้อ้างอิงได้',
      '',
      'คำสั่งเพิ่มเติมสำหรับการวิเคราะห์',
      '- ตรวจเนื้อหาในต้นฉบับจาก URL ก่อนอ้างข้อกฎหมาย เลขหนังสือ วันที่ หรือข้อสรุปสำคัญ',
      '- ผลค้นเว็บเป็นตัวชี้ไปยังต้นฉบับ ไม่ใช่หลักฐานว่าฉบับนั้นยังมีผลโดยอัตโนมัติ',
      `- หากยังยืนยันสถานะฉบับล่าสุดไม่ได้ ให้แสดง “${window.GovPromptCore.UNVERIFIED_LATEST_WARNING || 'ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง'}”`
    ].filter(Boolean).join('\n');
    return Object.freeze({ ...promptBundle, prompt: `${promptBundle.prompt}\n\n${searchBlock}` });
  }

  function enrichNaturalPersonServiceTor(promptBundle, text) {
    const q = String(text || '');
    if (!/จ้างเหมาบริการบุคคลธรรมดา|ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา/i.test(q)) return promptBundle;
    const block = [
      '',
      '=== SPECIALIZED WORKFLOW: จ้างเหมาบริการบุคคลธรรมดา ===',
      '1. วิเคราะห์ลักษณะงานจริง ไม่ตัดสินจากชื่อตำแหน่ง เช่น คนขับรถ รปภ. แม่บ้าน คนสวน ธุรการ การเงิน พัสดุ ช่าง IT สาธารณสุข หรือการศึกษา',
      '2. แยก “งานบริการ/ผลส่งมอบ” ออกจากลักษณะที่อาจทำให้ความสัมพันธ์คล้ายการจ้างแรงงาน',
      '3. ตรวจความเสี่ยงจากการกำหนดเวลาปฏิบัติงาน การลา การควบคุมสั่งการโดยตรง การกำหนดสถานะเสมือนลูกจ้าง และข้อความ “งานอื่นตามที่ได้รับมอบหมาย” ที่กว้างเกินจำเป็น',
      '4. ห้ามกำหนดให้ผู้รับจ้างใช้อำนาจรัฐแทนเจ้าหน้าที่ เช่น อนุมัติ อนุญาต สั่งการ วินิจฉัย รับรอง หรือออกคำสั่งในนามหน่วยงาน',
      '5. จัด TOR แบบผลลัพธ์เป็นฐาน: ขอบเขตงาน → ผลผลิต/งานส่งมอบ → กำหนดส่ง → หลักฐาน → เกณฑ์ตรวจรับ → การจ่ายเงิน',
      '6. ตรวจความสอดคล้อง TOR ↔ สัญญา/ข้อตกลง ↔ ผลส่งมอบ ↔ ตรวจรับ ↔ จ่ายเงิน',
      '7. ตรวจฐานอำนาจ กฎหมาย ระเบียบ หนังสือสั่งการ และฉบับที่ใช้บังคับ ณ เวลาจัดทำจากแหล่งทางการ โดยไม่ hard-code เลขหนังสือ วันที่ อัตรา หรือเงื่อนไขที่ยังไม่ได้ยืนยัน',
      '8. ใช้ Applicable Authority Check: AUTHORITY, VERSION, TIME, FACT_MATCH, LATER_CHANGE, CONFLICT_TRANSITION',
      '9. หากหลักฐานหรือเงื่อนไขสำคัญยังไม่พอ ให้เปิด Decision Lock และระบุสิ่งที่ต้องค้น/ตรวจเพิ่ม แทนการฟันธง',
      '10. ผลลัพธ์ต้องมี: ข้อเท็จจริง · จำแนกลักษณะงาน · ฐานอำนาจที่ตรวจแล้ว · ความเสี่ยง · ข้อมูลที่ขาด · ร่าง TOR · checklist ความสอดคล้องเอกสาร',
      'Template Library ใช้เป็นข้อมูลอ้างอิงเท่านั้น หากไม่มีแบบตรงกับงาน ให้สังเคราะห์จากลักษณะงานจริง',
      '=== END SPECIALIZED WORKFLOW ==='
    ].join('\\n');
    return Object.freeze({ ...promptBundle, prompt: `${promptBundle.prompt}${block}`, serviceContractNaturalPerson: true });
  }

  async function preparePrompt(text) {
    const core = requireCore();
    const safeAttachments = sanitizedAttachmentMetadata(core);
    const workflowRuntimePromise = prepareWorkflowRuntime(text);
    const context = core.createSharedContext({ facts: text, desiredOutput: text, documents: safeAttachments.map(file => file.name).join(', ') });
    const route = core.routeTransaction(context);
    const promptBundleBase = core.createGovernmentPrompt({
      question: text,
      route,
      context,
      attachments: safeAttachments,
      outputFormatId: outputFormatSelect?.value || 'auto'
    });
    const toolPlan = typeof core.createToolRoutingPlan === 'function'
      ? core.createToolRoutingPlan({ question: text, attachments: safeAttachments })
      : null;
    const toolRoutingBlock = toolPlan && typeof core.formatToolRoutingInstructions === 'function'
      ? core.formatToolRoutingInstructions(toolPlan)
      : '';
    const routedPromptBundle = toolRoutingBlock
      ? Object.freeze({
          ...promptBundleBase,
          prompt: `${promptBundleBase.prompt}\n\nแนวทางเลือกเครื่องมือ\n${toolRoutingBlock}`,
          toolRoutingPlan: toolPlan
        })
      : promptBundleBase;
    const promptBundle = enrichNaturalPersonServiceTor(routedPromptBundle, text);

    const isPr = Boolean(promptBundle?.prMode);

    if (isPr) {
      const workflowRuntime = await workflowRuntimePromise;
      return Object.freeze({
        route,
        promptBundle: Object.freeze({ ...promptBundle, workflowRuntime: workflowRuntime.view }),
        searchResult: Object.freeze({ mode: 'skipped-pr', results: [], evidence: { primaryResults: [], conclusionEligible: false }, warning: '' }),
        workflowRuntime: workflowRuntime.view,
        workflowRuntimeStatus: workflowRuntime.status,
        budgetSourceRuntime: null
      });
    }

    const workflowRuntime = await workflowRuntimePromise;
    let searchResult;
    const v8 = window.GovPromptCore.EVIDENCE_FIRST_V8;
    const kAuditTask = route?.moduleId === 'GP007' && /ค่า\\s*K|ค่าชดเชยค่างานก่อสร้าง|สัญญาแบบปรับราคาได้|เงินชดเชยค่างาน|CUCEM[-\\s]?K/i.test(text);
    const decisionTask = Boolean(v8?.isDecisionQuestion?.(text)) || ['legal','procurement','finance','human-resources','internal-audit'].includes(String(route?.transactionType || '').toLowerCase()) || kAuditTask;
    if (decisionTask && typeof core.officialSearchConnector?.search === 'function') {
      try {
        searchResult = Object.freeze(await core.officialSearchConnector.search(text, { count: 10, requireFreshness: true }));
      } catch {
        searchResult = Object.freeze({ mode: 'search-error', results: [], evidence: { primaryResults: [], conclusionEligible: false }, warning: 'การค้นแหล่งราชการสดขัดข้อง — ยังไม่ควรฟันธง' });
      }
    } else {
      searchResult = Object.freeze({
        mode: 'delegated-user-ai',
        results: [],
        evidence: { primaryResults: [], conclusionEligible: false },
        warning: 'งานนี้ไม่จำเป็นต้องค้นกฎหมายสดโดยอัตโนมัติ — ใช้ Prompt ที่เตรียมไว้ตามประเภทงาน'
      });
    }
    if (decisionTask && v8) {
      const primaryResults = searchResult?.evidence?.primaryResults || [];
      const freshnessVerified = Boolean(searchResult?.evidence?.verifiedCurrent && searchResult?.evidence?.strongPrimaryEvidence);
      const assessment = v8.checkApplicableAuthority({
        question: text,
        domain: route?.transactionType,
        evidence: {
          documents: primaryResults.map(item => ({
            title: item.documentTitle || item.title,
            issuingAgency: item.issuingAgency || item.sourceName,
            documentDate: item.documentDate,
            url: item.sourceUrl,
            primary: item.official === true,
            contentVerified: item.contentVerified === true
          })),
          factsComplete: Boolean(text),
          authorityConfirmed: primaryResults.some(item => item.official === true),
          versionConfirmed: freshnessVerified,
          timeConfirmed: freshnessVerified,
          factMatchConfirmed: primaryResults.some(item => (item.evidenceFeatures?.relevance || 0) >= 0.45),
          laterChangeChecked: freshnessVerified,
          conflictTransitionChecked: false,
          conflicts: []
        }
      });
      searchResult = Object.freeze({ ...searchResult, v8Assessment: assessment });
    }
    return Object.freeze({
      route,
      promptBundle: enrichPromptWithWorkflow(promptBundle, workflowRuntime),
      searchResult,
      workflowRuntime: workflowRuntime.view,
      workflowRuntimeStatus: workflowRuntime.status,
      budgetSourceRuntime: null
    });
  }

  function legacyCopyText(text) {
    const textarea = document.createElement('textarea');
    const previousFocus = document.activeElement;
    textarea.value = String(text || '');
    textarea.setAttribute('aria-hidden', 'true');
    textarea.autocomplete = 'off';
    textarea.spellcheck = false;
    Object.assign(textarea.style, {
      position: 'fixed',
      top: '0',
      left: '-9999px',
      width: '1px',
      height: '1px',
      padding: '0',
      border: '0',
      outline: '0',
      boxShadow: 'none',
      background: 'transparent',
      fontSize: '16px',
      opacity: '0.01'
    });
    document.body.appendChild(textarea);
    try { textarea.focus({ preventScroll: true }); } catch { textarea.focus(); }
    textarea.setSelectionRange(0, textarea.value.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch {}
    textarea.remove();
    try { previousFocus?.focus?.({ preventScroll: true }); } catch {}
    return copied;
  }

  async function copyText(text) {
    const value = String(text || '');
    if (!value) return false;
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(value); return true; } catch {}
    }
    return legacyCopyText(value);
  }

  function appendSearchDetails(section, searchResult) {
    if (searchResult?.mode === 'skipped-pr' || searchResult?.mode === 'delegated-user-ai') return;
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const results = (searchResult?.results || []).filter(result => result.official);
    summary.textContent = searchResult?.mode === 'live' ? `แหล่งราชการที่ค้นสด (${results.length})` : 'สถานะการค้นข้อมูลราชการสด';
    details.append(summary);
    if (searchResult?.warning) { const warning = document.createElement('p'); warning.textContent = searchResult.warning; details.append(warning); }
    results.slice(0, 8).forEach(result => {
      const item = document.createElement('p');
      const link = document.createElement('a');
      link.href = result.sourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = result.title || result.sourceName || result.sourceUrl;
      item.append(link);
      if (result.sourceName) item.append(document.createTextNode(` — ${result.sourceName}`));
      details.append(item);
    });
    if (!results.length) {
      const empty = document.createElement('p');
      empty.textContent = searchResult?.mode === 'live' ? 'ไม่พบต้นฉบับจากแหล่งราชการที่นำมาใช้อ้างอิงได้' : 'ระบบยังไม่สามารถเรียก live search ได้ จึงยังไม่อ้างว่าได้ค้นข้อมูลล่าสุดแล้ว';
      details.append(empty);
    }
    section.append(details);
  }

  function structuredBudgetArtifact(runtime) {
    return (runtime?.artifactAttempt?.artifacts || []).find(artifact => artifact?.key === 'budget-structured-export' && artifact?.status === 'ready') || null;
  }

  function appendBudgetResult(section, actions, budgetSourceRuntime) {
    if (!budgetSourceRuntime) return;
    const box = document.createElement('div');
    const title = document.createElement('h4');
    const note = document.createElement('p');
    box.className = 'budget-runtime-result';
    title.textContent = 'Budget Draft Agent';
    const artifact = structuredBudgetArtifact(budgetSourceRuntime);
    if (artifact) {
      const c = artifact.content || {};
      note.textContent = `✅ Working Draft พร้อมส่งออก · รายรับ ${Number(c.revenueTotal || 0).toLocaleString('th-TH')} บาท · รายจ่าย ${Number(c.expenseTotal || 0).toLocaleString('th-TH')} บาท${c.hasEstimates ? ' · มีตัวเลขประมาณการที่ต้องยืนยัน' : ''}`;
      for (const format of ['xlsx', 'docx']) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = format === 'xlsx' ? 'ดาวน์โหลด Excel' : 'ดาวน์โหลด Word';
        button.addEventListener('click', async () => {
          try {
            const exporter = await import('./core/budget-office-export-v1.js?v=1.0.0');
            const ok = exporter.downloadBudgetOfficeFile(artifact, format);
            window.GovPrompt?.toast(ok ? `สร้างไฟล์ ${format.toUpperCase()} แล้ว` : 'ยังไม่สามารถสร้างไฟล์ได้');
          } catch { window.GovPrompt?.toast('โมดูลสร้างไฟล์ยังไม่พร้อม กรุณาลองใหม่'); }
        });
        actions.append(button);
      }
    } else {
      const missing = [...new Set([...(budgetSourceRuntime.missingKeys || []), ...(budgetSourceRuntime.artifactAttempt?.missingEvidence || [])])];
      note.textContent = `⚠️ ร่างยังไม่พร้อมส่งออก${missing.length ? ` · ต้องยืนยัน/เพิ่ม: ${missing.slice(0, 6).join(', ')}` : ` · สถานะ ${budgetSourceRuntime.status || 'blocked'}`}`;
    }
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'สถานะหลักฐานงบประมาณ';
    const lines = document.createElement('pre');
    const readAttempts = budgetSourceRuntime.documentReads?.attempts || [];
    const fileResults = budgetSourceRuntime.browserInputs?.results || [];
    lines.textContent = [
      `Runtime: ${budgetSourceRuntime.status || '-'}`,
      `เอกสารราชการที่อ่าน: ${readAttempts.filter(item => item.status === 'ready').length}/${readAttempts.length}`,
      `ไฟล์แนบที่อ่านเป็นข้อมูลโครงสร้าง: ${fileResults.filter(item => item.status === 'ready').length}/${fileResults.length}`,
      `Working draft derived keys: ${(budgetSourceRuntime.workingDraft?.derivedKeys || []).join(', ') || '-'}`,
      `Final approval: ต้องเป็นมนุษย์ผู้มีอำนาจ`
    ].join('\n');
    details.append(summary, lines);
    box.append(title, note, details);
    section.append(box);
  }

  function addRouteResult({ route, promptBundle, searchResult, workflowRuntime, budgetSourceRuntime }) {
    const article = document.createElement('article');
    const content = document.createElement('div');
    const label = document.createElement('span');
    const card = document.createElement('div');
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    const description = document.createElement('p');
    const status = document.createElement('p');
    const actions = document.createElement('div');
    const openChatGPT = document.createElement('button');
    const copyButton = document.createElement('button');
    const specialistLink = document.createElement('a');
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const preview = document.createElement('pre');
    const mark = document.createElement('span');

    article.className = 'message assistant'; content.className = 'assistant-content'; label.className = 'route-label'; card.className = 'answer-card'; section.className = 'answer-section'; actions.className = 'answer-actions'; mark.className = 'assistant-mark'; mark.setAttribute('aria-hidden', 'true'); mark.textContent = 'กพ';
    label.textContent = `${domainNames[route.transactionType] || domainNames.general} · ${route.moduleId}`;
    const isPrResult = Boolean(promptBundle?.prMode);
    heading.textContent = budgetSourceRuntime
      ? 'GovPrompt ดำเนินงานร่างงบประมาณให้แล้ว'
      : isPrResult
        ? 'คำสั่งประชาสัมพันธ์พร้อมแล้ว — ทำต่อใน AI ได้ทันที'
        : 'GovPrompt เตรียมคำสั่งพร้อมใช้แล้ว';
    const workflowSummary = workflowRuntime?.primary?.currentStage?.title ? ` · Workflow: ${workflowRuntime.primary.currentStage.title} → ${workflowRuntime.primary.actionLabel}` : '';
    const presentationSummary = promptBundle.presentationPreset ? ` · การนำเสนอ: ${promptBundle.presentationPreset.label}` : '';
    description.textContent = budgetSourceRuntime
      ? `ระบบค้นและอ่านต้นฉบับราชการ ตรวจข้อมูล คำนวณ และเตรียม Working Draft พร้อมหลักฐาน${workflowSummary}${presentationSummary}`
      : isPrResult
        ? `GP จัดคำสั่งเฉพาะงานประชาสัมพันธ์ให้แล้ว พร้อมตรวจข้อเท็จจริง PDPA และรูปแบบสื่อ${workflowSummary}${presentationSummary}`
        : `ระบบจัดคำถาม ตรวจความเสี่ยง และเตรียม Prompt กำหนดวิธีค้นแหล่งราชการให้แล้ว — กดคัดลอกไปวางใน ChatGPT หรือ AI ที่คุณใช้${workflowSummary}${presentationSummary}`;

    const v8Assessment = searchResult?.v8Assessment;
    if (isPrResult) status.textContent = '✅ พร้อมทำสื่อประชาสัมพันธ์ — ไม่ดึงกฎงานอื่นมาปน';
    else if (v8Assessment?.decisionLock === 'ON') status.textContent = `🔒 Decision Lock ON — ${v8Assessment.reasons?.[0] || 'ต้องตรวจหลักฐาน/เงื่อนไขเพิ่มก่อนฟันธง'}`;
    else if (budgetSourceRuntime && structuredBudgetArtifact(budgetSourceRuntime)) status.textContent = '✅ ร่างงบประมาณผ่านการตรวจสมดุลและพร้อมส่งออกเป็น Working Draft';
    else if (searchResult?.mode === 'live' && searchResult?.evidence?.conclusionEligible) status.textContent = '✅ ค้นสดและยืนยันหลักฐานปัจจุบันได้ตาม metadata ที่มี';
    else if (searchResult?.mode === 'live') status.textContent = `⚠️ ค้นสดแล้ว แต่ ${searchResult.warning || 'ยังยืนยันฉบับปัจจุบันล่าสุดไม่ได้'}`;
    else if (searchResult?.mode === 'delegated-user-ai') status.textContent = '✅ พร้อมส่งต่อ — ให้ AI ของผู้ใช้ค้นเว็บสดและตรวจแหล่งราชการเองตาม Prompt';
    else status.textContent = `ℹ️ ${searchResult?.warning || 'ยังเชื่อมบริการค้นเว็บราชการสดไม่ได้'}`;

    openChatGPT.type = 'button'; openChatGPT.textContent = 'เปิดใน ChatGPT';
    openChatGPT.addEventListener('click', async () => {
      const external = prepareExternalPrompt(promptBundle.prompt);
      if (external.blocked) { window.GovPrompt?.toast('🔒 หยุดส่งต่อ: Prompt ยังมีข้อมูลเสี่ยง กรุณาปกปิดข้อมูลก่อนเปิดใน ChatGPT'); return; }
      const copied = await copyText(external.safeText);
      if (!copied) { window.GovPrompt?.toast('ไม่สามารถคัดลอกได้ กรุณาลองใหม่'); return; }
      window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
      window.GovPrompt?.toast(external.changed ? '🔐 ปกปิดข้อมูลเสี่ยงแล้ว และคัดลอก Prompt สำหรับ ChatGPT แล้ว' : 'คัดลอก Prompt แล้ว — ให้ ChatGPT ค้นสดตามคำสั่งได้เลย');
    });

    copyButton.type = 'button'; copyButton.textContent = 'คัดลอกไปใช้กับ AI';
    copyButton.addEventListener('click', async () => {
      const external = prepareExternalPrompt(promptBundle.prompt);
      if (external.blocked) { window.GovPrompt?.toast('🔒 หยุดคัดลอก: Prompt ยังมีข้อมูลเสี่ยง กรุณาปกปิดข้อมูลก่อน'); return; }
      const copied = await copyText(external.safeText);
      window.GovPrompt?.toast(copied ? (external.changed ? '🔐 ปกปิดข้อมูลเสี่ยงก่อนคัดลอกแล้ว' : 'คัดลอก Prompt พร้อมคำสั่งค้นสดแล้ว') : 'ไม่สามารถคัดลอกได้ กรุณาลองใหม่');
    });

    specialistLink.href = route.assistant.path; specialistLink.textContent = `เปิดแบบฟอร์ม ${route.moduleId}`;
    actions.append(openChatGPT, copyButton, specialistLink);
    appendBudgetResult(section, actions, budgetSourceRuntime);
    appendSearchDetails(section, searchResult);
    summary.textContent = 'ดู Prompt ที่ GovPrompt เตรียมไว้'; preview.textContent = promptBundle.prompt; preview.style.whiteSpace = 'pre-wrap'; preview.style.overflowWrap = 'anywhere'; details.append(summary, preview);
    section.prepend(heading, description, status, actions); section.append(details);
    card.append(section); content.append(label, card); article.append(mark, content); conversation.appendChild(article);
  }

  function saveHistory(text, route) {
    history.unshift({ text, moduleId: route.moduleId, domain: domainNames[route.transactionType] || domainNames.general, at: new Date().toISOString() });
    history.length = Math.min(history.length, 20);
  }

  function clearAttachments() {
    attachments = []; attachmentStatus.textContent = ''; attachmentInput.value = ''; cameraInput.value = '';
  }

  async function submitPrompt(text) {
    enterResultPage();
    document.documentElement.classList.remove('result-intake');
    document.querySelector('.result-page-header strong').textContent = 'กำลังเตรียมงาน';
    document.querySelector('.chat-main').classList.add('has-messages');
    addUserMessage(text); addThinking();
    conversation.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
    let prepared;
    try { prepared = await preparePrompt(text); }
    catch {
      document.getElementById('thinkingMessage')?.remove();
      window.GovPrompt?.toast('ระบบวิเคราะห์หรือค้นข้อมูลยังไม่พร้อม กรุณาลองใหม่อีกครั้ง');
      document.documentElement.classList.add('result-intake');
      document.querySelector('.result-page-header strong').textContent = 'กรุณาลองส่งอีกครั้ง';
      input.value = text; resizeInput(); input.focus(); return;
    }
    await new Promise(resolve => setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250));
    document.getElementById('thinkingMessage')?.remove();
    addRouteResult(prepared); saveHistory(text, prepared.route); clearAttachments();
    document.querySelector('.result-page-header strong').textContent = 'ผลลัพธ์พร้อมใช้งาน';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    if (resultRoute) {
      document.documentElement.classList.remove('result-intake');
      conversation.querySelectorAll('.guided-intake-message').forEach(message => message.remove());
    }
    input.value = ''; resizeInput(); submitPrompt(text);
  });

  input.addEventListener('input', resizeInput);
  input.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });

  const promptButtons = [...document.querySelectorAll('[data-prompt]')];
  promptButtons.forEach((button, index) => {
    button.addEventListener('click', () => submitPrompt(button.dataset.prompt));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? promptButtons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + promptButtons.length) % promptButtons.length;
      promptButtons[target].focus();
    });
  });

  document.querySelectorAll('[data-file-picker]').forEach(button => button.addEventListener('click', () => { document.getElementById(button.dataset.filePicker)?.click(); }));

  function collectFiles(fileList) {
    const incoming = Array.from(fileList || []);
    attachments = [...attachments, ...incoming].slice(0, 5);
    attachmentStatus.textContent = attachments.length ? `แนบแล้ว ${attachments.length} ไฟล์ · พิมพ์ “สรุป” เพื่อสรุปใช้ปฏิบัติงาน` : '';
    if (incoming.length) window.GovPrompt?.toast('🔐 ไฟล์ยังอยู่ในเบราว์เซอร์ ระบบคำนวณ hash และอ่านเฉพาะข้อมูลโครงสร้างที่จำเป็น');
  }
  attachmentInput.addEventListener('change', () => collectFiles(attachmentInput.files));
  cameraInput.addEventListener('change', () => collectFiles(cameraInput.files));

  document.getElementById('micButton').addEventListener('click', () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { window.GovPrompt?.toast('เบราว์เซอร์นี้ยังไม่รองรับการพิมพ์ด้วยเสียง'); return; }
    const recognition = new Recognition(); const button = document.getElementById('micButton');
    recognition.lang = 'th-TH'; recognition.interimResults = false;
    recognition.onstart = () => button.classList.add('listening');
    recognition.onresult = event => { input.value += `${input.value ? ' ' : ''}${event.results[0][0].transcript.trim()}`; resizeInput(); };
    recognition.onerror = () => window.GovPrompt?.toast('ไม่สามารถเข้าถึงไมโครโฟนได้ตามนโยบายความปลอดภัย');
    recognition.onend = () => button.classList.remove('listening'); recognition.start();
  });

  function historyPanel() {
    if (!history.length) return '<div class="empty-panel"><strong>ยังไม่มีประวัติการใช้งาน</strong><p>คำถามล่าสุดจะเก็บไว้เฉพาะในหน่วยความจำของแท็บนี้ และจะหายไปเมื่อปิดหรือโหลดหน้าใหม่</p></div>';
    return `<div class="tool-list">${history.map(item => `<a href="#" data-history="${escapeHTML(item.text)}"><strong>${escapeHTML(item.text)}</strong><small>${escapeHTML(item.domain)} · ${new Date(item.at).toLocaleString('th-TH')}</small></a>`).join('')}</div>`;
  }

  function toolsPanel() {
    return `<p>เครื่องมือเฉพาะทางสำหรับผู้ใช้ขั้นสูง ระบบสนทนาจะเลือกเครื่องมือเหล่านี้ให้อัตโนมัติ</p><div class="tool-list">${window.GovPromptCore.PROMPT_REGISTRY.map(tool => `<a href="${tool.path}"><strong>${tool.moduleId} · ${escapeHTML(tool.title)}</strong><small>เปิดแบบฟอร์มเฉพาะด้าน</small></a>`).join('')}</div>`;
  }

  const panels = {
    history: ['ประวัติ', 'บทสนทนาล่าสุด', historyPanel],
    knowledge: ['คลังความรู้', 'Knowledge Engine', () => '<div class="empty-panel"><strong>คลังความรู้แบบ Metadata + Index</strong><p>GovPrompt จะใช้คลังเบาเป็นตัวชี้ไปยังต้นฉบับราชการ และตรวจความใหม่ก่อนนำข้อมูลมาใช้</p></div>'],
    profile: ['โปรไฟล์', 'บริบทการทำงาน', () => '<div class="empty-panel"><strong>พื้นที่องค์กรนำร่อง</strong><p>หน้า Home ไม่ส่งหรือจัดเก็บข้อมูลโปรไฟล์ ส่วนงานองค์กรใช้บัญชีและสิทธิ์แยกตามหน่วยงาน</p></div><div class="tool-list"><a href="https://sayampreecha-ux.github.io/govprompt-thailand-v6/pilot/"><strong>Workspace องค์กร</strong><small>ติดตามโครงการ · ศูนย์สั่งการ · งานย่อย · งานอัตโนมัติ · บัญชีองค์กรเท่านั้น</small></a></div>'],
    tools: ['เครื่องมือ', 'ADVANCED USERS', toolsPanel]
  };

  function openPanel(event) {
    const panel = panels[event.detail?.panel]; if (!panel) return;
    const [title, eyebrow, panelContent] = panel;
    document.getElementById('dialogTitle').textContent = title;
    document.getElementById('dialogEyebrow').textContent = eyebrow;
    document.getElementById('dialogContent').innerHTML = panelContent();
    dialog.showModal();
    dialog.querySelectorAll('[data-history]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault(); dialog.close(); input.value = link.dataset.history; resizeInput(); input.focus();
    }));
  }

  window.GovPrompt.on('shell:panel', openPanel);
  document.getElementById('newChat').addEventListener('click', () => {
    if (resultRoute) { window.location.assign('index.html'); return; }
    conversation.replaceChildren(); clearAttachments(); document.querySelector('.chat-main').classList.remove('has-messages'); input.focus();
  });

  if (resultRoute) {
    enterResultPage();
    document.documentElement.classList.add('result-intake');
    document.querySelector('.chat-main').classList.add('has-messages');
    installResultHeader();
    let pendingPrompt = '';
    let forceGuidedIntake = false;
    try {
      pendingPrompt = sessionStorage.getItem(resultPromptKey) || '';
      forceGuidedIntake = sessionStorage.getItem(resultForceIntakeKey) === 'true';
      sessionStorage.removeItem(resultPromptKey);
      sessionStorage.removeItem(resultForceIntakeKey);
    } catch {}
    if (pendingPrompt) {
      if (forceGuidedIntake) form.dataset.forceGuidedIntake = 'true';
      input.value = pendingPrompt;
      input.placeholder = 'พิมพ์ข้อมูลเพิ่มเติมที่จำเป็น...';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      form.requestSubmit();
    }
    else {
      document.documentElement.classList.remove('result-intake');
      const empty = document.createElement('div');
      empty.className = 'result-empty';
      empty.innerHTML = '<strong>ยังไม่ได้เลือกงาน</strong><p>กลับไปเลือกผู้ช่วยที่ต้องการ แล้วระบบจะเปิดผลลัพธ์ในหน้านี้</p><a href="index.html">กลับหน้าเลือกงาน</a>';
      conversation.append(empty);
    }
  }
})();
