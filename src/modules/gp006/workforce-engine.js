const n = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

export function analyzeWorkforce(input = {}) {
  const wf = input.workforce || {};
  const authorized = n(wf.authorized);
  const filled = n(wf.filled);
  const forecastRetirements = n(wf.forecastRetirements) ?? 0;
  const plannedHires = n(wf.plannedHires) ?? 0;

  // Never invent an establishment or headcount. Missing evidence stays unresolved.
  if (authorized === null || filled === null) {
    return {
      status: "needs-evidence",
      authorized,
      filled,
      vacancies: null,
      projectedFilled: null,
      projectedGap: null,
      unresolved: [
        ...(authorized === null ? ["authorized-workforce"] : []),
        ...(filled === null ? ["filled-workforce"] : [])
      ],
      warning: "ยังไม่มีข้อมูลกรอบอัตรากำลัง/คนครองที่ยืนยันได้ — ห้ามสมมติตัวเลข"
    };
  }

  const projectedFilled = Math.max(0, filled - forecastRetirements + plannedHires);
  return {
    status: "evidence-ready",
    authorized,
    filled,
    vacancies: Math.max(0, authorized - filled),
    forecastRetirements,
    plannedHires,
    projectedFilled,
    projectedGap: Math.max(0, authorized - projectedFilled),
    overstaffed: projectedFilled > authorized
  };
}

export function analyzeThreeYearWorkforcePlan(input = {}) {
  const plan = input.workforcePlan || {};
  const organization = plan.organization || {};
  const period = plan.period || {};
  const positions = Array.isArray(plan.positions) ? plan.positions : [];
  const workloads = Array.isArray(plan.workloads) ? plan.workloads : [];
  const sources = Array.isArray(plan.sources) ? plan.sources : [];

  const missing = [];
  if (!organization.type) missing.push("organization.type");
  if (!organization.name) missing.push("organization.name");
  if (!period.start || !period.end) missing.push("period");
  if (!positions.length) missing.push("positions/current-establishment");

  const positionAnalysis = positions.map((p) => {
    const authorized = n(p.authorized);
    const filled = n(p.filled);
    const vacancy = authorized !== null && filled !== null ? Math.max(0, authorized - filled) : null;
    return {
      unit: p.unit || null,
      position: p.position || null,
      authorized,
      filled,
      vacancy,
      evidence: p.evidence || null,
      status: authorized === null || filled === null ? "needs-evidence" : "verified-input"
    };
  });

  const workloadAnalysis = workloads.map((w) => {
    const annualVolume = n(w.annualVolume);
    const hoursPerCase = n(w.hoursPerCase);
    const productiveHoursPerFTE = n(w.productiveHoursPerFTE);
    const currentFTE = n(w.currentFTE);
    const requiredHours = annualVolume !== null && hoursPerCase !== null ? annualVolume * hoursPerCase : null;
    const requiredFTE = requiredHours !== null && productiveHoursPerFTE && productiveHoursPerFTE > 0
      ? requiredHours / productiveHoursPerFTE
      : null;
    const gapFTE = requiredFTE !== null && currentFTE !== null ? requiredFTE - currentFTE : null;
    return {
      unit: w.unit || null,
      activity: w.activity || null,
      annualVolume,
      hoursPerCase,
      productiveHoursPerFTE,
      currentFTE,
      requiredHours,
      requiredFTE,
      gapFTE,
      recommendation: gapFTE === null ? "ต้องมีข้อมูล Workload เพิ่ม" : gapFTE > 0 ? "พิจารณาเพิ่ม/จัดสรรกำลังคน โดยต้องตรวจหลักเกณฑ์และงบประมาณ" : gapFTE < 0 ? "พิจารณาปรับภารกิจ/จัดสรรกำลังคนใหม่" : "กำลังคนสมดุลตามสมมติฐานที่ยืนยัน"
    };
  });

  const sourceVerified = sources.some((s) => s && s.official === true && s.verified === true);
  const readyForRecommendation = missing.length === 0 && sourceVerified;

  return {
    workflow: "hr.three-year-workforce-plan",
    organization,
    period,
    positionAnalysis,
    workloadAnalysis,
    governance: {
      sourceVerified,
      humanApprovalRequired: true,
      piiMinimization: true,
      noFabrication: true
    },
    status: readyForRecommendation ? "analysis-ready" : "needs-evidence",
    unresolved: [...missing, ...(!sourceVerified ? ["latest-official-rule/source-verification"] : [])],
    nextSteps: readyForRecommendation
      ? ["gap-analysis", "personnel-cost-check", "draft-plan", "validation", "human-approval"]
      : ["collect-minimum-evidence", "verify-latest-official-source"]
  };
}
