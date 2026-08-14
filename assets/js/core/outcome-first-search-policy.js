(() => {
  'use strict';

  const core = window.GovPromptCore || {};
  const baseConnector = core.officialSearchConnector;
  const basePlan = core.createOfficialSearchPlan;
  const baseEvidence = core.createOfficialSearchEvidence;
  const selectBestCurrent = core.selectBestCurrent;
  const queryTerms = core.officialSearchQueryTerms;

  if (!baseConnector || typeof baseConnector.search !== 'function' || typeof basePlan !== 'function') return;

  const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const lower = value => normalize(value).toLocaleLowerCase('th');
  const includesAny = (text, terms = []) => terms.some(term => text.includes(lower(term)));

  const GOAL_PROFILES = Object.freeze([
    Object.freeze({
      id: 'career-progression',
      patterns: Object.freeze(['ครองตำแหน่ง','ดำรงตำแหน่ง','เลื่อนเป็น','เลื่อนระดับ','เลื่อนตำแหน่ง','ปลัดต้น','ปลัดกลาง','ชก','ชพ','ชำนาญการพิเศษ','สอบคัดเลือก']),
      expansion: 'คุณสมบัติ ระยะเวลาดำรงตำแหน่ง เลื่อนระดับ เลื่อนตำแหน่ง สอบคัดเลือก มาตรฐานกำหนดตำแหน่ง หลักเกณฑ์บริหารงานบุคคลท้องถิ่น',
      evidence: Object.freeze(['คุณสมบัติ','ดำรงตำแหน่ง','ระยะเวลา','เลื่อนระดับ','เลื่อนตำแหน่ง','สอบคัดเลือก','มาตรฐานกำหนดตำแหน่ง','บริหารงานบุคคล'])
    }),
    Object.freeze({
      id: 'eligibility-decision',
      patterns: Object.freeze(['ได้ไหม','ได้หรือไม่','มีสิทธิ','สามารถ','คุณสมบัติ','เข้าเกณฑ์','ทำได้ไหม','เบิกได้ไหม']),
      expansion: 'เงื่อนไข คุณสมบัติ สิทธิ ข้อยกเว้น หลักเกณฑ์ที่ใช้บังคับ',
      evidence: Object.freeze(['เงื่อนไข','คุณสมบัติ','สิทธิ','หลักเกณฑ์','ข้อยกเว้น'])
    }),
    Object.freeze({
      id: 'duration-deadline',
      patterns: Object.freeze(['กี่ปี','กี่เดือน','กี่วัน','ภายในกี่','เมื่อไร','ระยะเวลา','ครบกำหนด']),
      expansion: 'ระยะเวลา กำหนดเวลา เงื่อนไขการนับระยะเวลา หลักเกณฑ์',
      evidence: Object.freeze(['ระยะเวลา','กำหนดเวลา','ปี','เดือน','วัน','หลักเกณฑ์'])
    }),
    Object.freeze({
      id: 'authority',
      patterns: Object.freeze(['ใครอนุมัติ','ใครมีอำนาจ','ผู้มีอำนาจ','อำนาจอนุมัติ','อำนาจหน้าที่','มอบอำนาจ']),
      expansion: 'อำนาจหน้าที่ ผู้มีอำนาจอนุมัติ การมอบอำนาจ ฐานอำนาจ',
      evidence: Object.freeze(['อำนาจ','อนุมัติ','มอบอำนาจ','ฐานอำนาจ'])
    }),
    Object.freeze({
      id: 'procedure-documents',
      patterns: Object.freeze(['ขั้นตอน','ทำอย่างไร','ทำยังไง','ต้องทำอะไร','ใช้เอกสารอะไร','เอกสารประกอบ']),
      expansion: 'ขั้นตอน วิธีปฏิบัติ เอกสารประกอบ ผู้อนุมัติ หลักเกณฑ์',
      evidence: Object.freeze(['ขั้นตอน','วิธีปฏิบัติ','เอกสาร','หลักเกณฑ์'])
    }),
    Object.freeze({
      id: 'amount-rate',
      patterns: Object.freeze(['เท่าไร','กี่บาท','อัตรา','วงเงิน','เพดาน','เหมาจ่าย']),
      expansion: 'อัตรา วงเงิน เพดาน เงื่อนไขการเบิกจ่าย หลักเกณฑ์',
      evidence: Object.freeze(['อัตรา','วงเงิน','เพดาน','เบิกจ่าย','หลักเกณฑ์'])
    }),
    Object.freeze({
      id: 'compliance-risk',
      patterns: Object.freeze(['ถูกต้องไหม','ถูกต้องหรือไม่','ผิดระเบียบ','ความเสี่ยง','เสี่ยง','ชี้มูล','ร้องเรียน','ตรวจสอบ']),
      expansion: 'ข้อห้าม เงื่อนไข ความเสี่ยง การปฏิบัติให้ถูกต้อง หลักเกณฑ์ ระเบียบ',
      evidence: Object.freeze(['ข้อห้าม','เงื่อนไข','ความเสี่ยง','ระเบียบ','หลักเกณฑ์'])
    }),
    Object.freeze({
      id: 'current-status',
      patterns: Object.freeze(['ล่าสุด','ปัจจุบัน','ตอนนี้','ยังใช้','ยังมีผล','ยกเลิก','ฉบับล่าสุด']),
      expansion: 'ฉบับปัจจุบัน สถานะมีผลใช้บังคับ แก้ไขเพิ่มเติม ยกเลิก ฉบับล่าสุด',
      evidence: Object.freeze(['ปัจจุบัน','มีผลใช้บังคับ','แก้ไขเพิ่มเติม','ยกเลิก','ล่าสุด'])
    })
  ]);

  function detectUserGoals(query) {
    const text = lower(query);
    const matched = GOAL_PROFILES.filter(profile => includesAny(text, profile.patterns));
    return Object.freeze(matched.slice(0, 3));
  }

  function buildOutcomeQuery(query) {
    const original = normalize(query);
    const goals = detectUserGoals(original);
    if (!goals.length) return Object.freeze({ original, expanded: original, goals });
    const expansions = [...new Set(goals.map(goal => goal.expansion))];
    return Object.freeze({ original, expanded: [original, ...expansions].join(' '), goals });
  }

  function answerFit(result, originalQuery, goals) {
    const title = lower(result?.title || result?.documentTitle);
    const snippet = lower(result?.snippet);
    const full = `${title} ${snippet}`;
    const terms = typeof queryTerms === 'function' ? queryTerms(originalQuery) : [];
    const termHits = terms.filter(term => full.includes(lower(term))).length;
    const queryCoverage = termHits / Math.max(1, terms.length);
    let goalCoverage = 0;
    let titleGoalCoverage = 0;
    for (const goal of goals) {
      const hits = goal.evidence.filter(term => full.includes(lower(term))).length / Math.max(1, goal.evidence.length);
      const titleHits = goal.evidence.filter(term => title.includes(lower(term))).length / Math.max(1, goal.evidence.length);
      goalCoverage = Math.max(goalCoverage, hits);
      titleGoalCoverage = Math.max(titleGoalCoverage, titleHits);
    }
    const existingRelevance = Number(result?.queryRelevance || 0);
    return Math.max(0, Math.min(1, queryCoverage * 0.42 + goalCoverage * 0.30 + titleGoalCoverage * 0.12 + existingRelevance * 0.16));
  }

  function rerankForOutcome(results, originalQuery, goals) {
    if (!goals.length) return Object.freeze(results || []);
    return Object.freeze((results || []).map(result => Object.freeze({
      ...result,
      answerFit: answerFit(result, originalQuery, goals),
      userGoalIds: Object.freeze(goals.map(goal => goal.id))
    })).sort((a, b) =>
      Number(b.official) - Number(a.official)
      || b.answerFit - a.answerFit
      || Number(b.queryRelevance || 0) - Number(a.queryRelevance || 0)
      || Number(b.sourcePriority || 0) - Number(a.sourcePriority || 0)
    ));
  }

  function createOutcomePlan(query, options = {}) {
    const outcome = buildOutcomeQuery(query);
    const plan = basePlan(outcome.expanded, options);
    return Object.freeze({
      ...plan,
      originalQuery: outcome.original,
      outcomeQuery: outcome.expanded,
      userGoals: Object.freeze(outcome.goals.map(goal => goal.id)),
      routedModulesAdvisory: true,
      policy: Object.freeze({ ...(plan.policy || {}), outcomeFirst: true, routeAdvisory: true, answerFitGate: true })
    });
  }

  async function search(query, options = {}) {
    const outcome = buildOutcomeQuery(query);
    if (!outcome.goals.length) return baseConnector.search(outcome.original, options);

    const response = await baseConnector.search(outcome.expanded, options);
    if (response?.mode !== 'live') {
      return Object.freeze({
        ...response,
        plan: response?.plan ? Object.freeze({ ...response.plan, originalQuery: outcome.original, outcomeQuery: outcome.expanded, userGoals: Object.freeze(outcome.goals.map(goal => goal.id)), routedModulesAdvisory: true }) : response?.plan
      });
    }

    const ranked = rerankForOutcome(response.results, outcome.original, outcome.goals);
    const freshness = typeof selectBestCurrent === 'function' ? selectBestCurrent(ranked, options) : response.freshness;
    const evidenceBase = typeof baseEvidence === 'function'
      ? baseEvidence(ranked, freshness, { verificationRequired: response.verificationRequired })
      : response.evidence;
    const primaryFits = (evidenceBase?.primaryResults || []).map(item => answerFit(item, outcome.original, outcome.goals));
    const answerFitScore = primaryFits.length ? Math.max(...primaryFits) : 0;
    const answerFitEligible = answerFitScore >= 0.45;
    const evidence = Object.freeze({
      ...(evidenceBase || {}),
      answerFitScore,
      answerFitEligible,
      userGoals: Object.freeze(outcome.goals.map(goal => goal.id)),
      conclusionEligible: Boolean(evidenceBase?.conclusionEligible && answerFitEligible)
    });
    const mismatchWarning = !answerFitEligible && (evidenceBase?.primaryResults?.length || 0)
      ? 'พบเอกสารราชการ แต่ยังไม่ตรงคำถามเพียงพอ — ควรค้นเพิ่มก่อนฟันธง'
      : '';

    return Object.freeze({
      ...response,
      plan: Object.freeze({
        ...response.plan,
        originalQuery: outcome.original,
        outcomeQuery: outcome.expanded,
        userGoals: Object.freeze(outcome.goals.map(goal => goal.id)),
        routedModulesAdvisory: true,
        policy: Object.freeze({ ...(response.plan?.policy || {}), outcomeFirst: true, routeAdvisory: true, answerFitGate: true })
      }),
      results: ranked,
      freshness,
      evidence,
      warning: response.warning || mismatchWarning
    });
  }

  core.detectOfficialSearchUserGoals = detectUserGoals;
  core.buildOutcomeFirstSearchQuery = buildOutcomeQuery;
  core.scoreOfficialSearchAnswerFit = answerFit;
  core.rankOfficialSearchResultsForOutcome = rerankForOutcome;
  core.createOfficialSearchPlan = createOutcomePlan;
  core.officialSearchConnector = Object.freeze({ ...baseConnector, search, createSearchPlan: createOutcomePlan });
})();
