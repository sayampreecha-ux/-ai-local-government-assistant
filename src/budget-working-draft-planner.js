import { mergeEvidenceByKey } from './budget-official-evidence-adapter.js';

export const BUDGET_WORKING_DRAFT_PLANNER_VERSION = '1.0';

const keyOf = item => String(item?.key || '').trim();
const indexOf = evidence => new Map((Array.isArray(evidence) ? evidence : []).filter(item => keyOf(item)).map(item => [keyOf(item), item]));
const finite = value => Number.isFinite(Number(value));
const number = value => finite(value) ? Number(value) : null;
const valueOf = (index, key) => index.get(key)?.value;
const round2 = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function estimatedEvidence(key, value, sourceEvidenceKeys = [], note = '') {
  return Object.freeze({
    key,
    value: value && typeof value === 'object' ? Object.freeze(value) : value,
    official: false,
    verified: false,
    fresh: true,
    current: true,
    status: 'estimated',
    estimated: true,
    provenance: Object.freeze({
      sourceType: 'derived-working-draft',
      plannerVersion: BUDGET_WORKING_DRAFT_PLANNER_VERSION,
      sourceEvidenceKeys: Object.freeze([...new Set(sourceEvidenceKeys)]),
      note
    })
  });
}

function baselineExpenseItems(baseline) {
  return Array.isArray(baseline?.expenseItems) ? baseline.expenseItems.filter(item => finite(item?.amount)) : [];
}

function baselineRevenueItems(baseline) {
  return Array.isArray(baseline?.revenueItems) ? baseline.revenueItems.filter(item => finite(item?.amount)) : [];
}

function personnelAmount(baseline) {
  const row = baselineExpenseItems(baseline).find(item => String(item?.key || '').toLowerCase() === 'personnel' || /บุคลากร/i.test(String(item?.label || '')));
  return number(row?.amount);
}

function scaleRows(rows, targetTotal) {
  if (!rows.length || !finite(targetTotal)) return [];
  const sourceTotal = rows.reduce((sum, row) => sum + Number(row.amount), 0);
  if (!(sourceTotal > 0)) return [];
  let allocated = 0;
  return rows.map((row, index) => {
    const isLast = index === rows.length - 1;
    const amount = isLast ? round2(Number(targetTotal) - allocated) : round2(Number(targetTotal) * Number(row.amount) / sourceTotal);
    allocated = round2(allocated + amount);
    return Object.freeze({
      key: String(row.key || `item-${index + 1}`),
      label: String(row.label || row.key || `รายการ ${index + 1}`),
      amount,
      status: 'estimated',
      estimated: true
    });
  });
}

function targetCeiling(baseline) {
  return number(baseline?.total);
}

function makeProjectRequests(plan) {
  const projects = Array.isArray(plan?.projects) ? plan.projects : [];
  return projects.map((project, index) => Object.freeze({
    id: String(project?.id || `project-${index + 1}`),
    name: String(project?.name || project?.title || `โครงการ ${index + 1}`),
    amount: finite(project?.amount) ? Number(project.amount) : null,
    evidenceStatus: project?.evidenceStatus || 'verified',
    readiness: 'unverified',
    priority: 'Reserve'
  }));
}

function priorityRows(projectRequests) {
  return projectRequests.map(project => Object.freeze({
    projectId: project.id,
    name: project.name,
    amount: project.amount,
    priority: 'Reserve',
    readiness: 'unverified',
    reason: 'ยังไม่มีหลักฐานความพร้อมด้านพื้นที่ แบบ ราคา/สเปก หรือการอนุมัติคำขอครบถ้วน'
  }));
}

function riskReview({ hasPersonnel, projectRequests, budgetTotals, latestRevenueActuals }) {
  const findings = [
    Object.freeze({ code: 'working-draft-estimates', severity: 'medium', status: 'open', message: 'กรอบที่ระบบคำนวณอัตโนมัติเป็นประมาณการ ต้องยืนยันก่อนเสนอร่างขั้นสุดท้าย' })
  ];
  if (!hasPersonnel) findings.push(Object.freeze({ code: 'budget-obligation-gap', severity: 'high', status: 'open', message: 'ยังไม่มีฐานภาระบุคลากรที่เพียงพอสำหรับล็อกกรอบงบ' }));
  if (projectRequests.length) findings.push(Object.freeze({ code: 'budget-plan-readiness-unverified', severity: 'medium', status: 'open', message: 'โครงการจากแผนยังต้องตรวจความพร้อมและคำของบก่อนจัดลำดับ A/B/C' }));
  if (!finite(latestRevenueActuals?.total) && !(Array.isArray(latestRevenueActuals?.rows) && latestRevenueActuals.rows.length)) findings.push(Object.freeze({ code: 'budget-source-gap', severity: 'high', status: 'open', message: 'ข้อมูลรายรับจริงยังไม่เพียงพอสำหรับยืนยันประมาณการรายรับ' }));
  if (!budgetTotals) findings.push(Object.freeze({ code: 'budget-allocation-gap', severity: 'high', status: 'open', message: 'ยังจัดกรอบรายรับรายจ่ายสมดุลไม่ได้' }));
  return Object.freeze({ findings: Object.freeze(findings), status: findings.some(item => item.severity === 'high') ? 'needs-review' : 'working-draft' });
}

export function buildBudgetWorkingDraftEvidence({ evidence = [] } = {}) {
  const original = Array.isArray(evidence) ? evidence : [];
  const index = indexOf(original);
  const derived = [];
  const blockers = [];
  const baseline = valueOf(index, 'baselineBudget');
  const actuals = valueOf(index, 'latestRevenueActuals');
  const plan = valueOf(index, 'targetYearPlan');

  if (!index.has('revenueForecastBasis') && actuals) {
    derived.push(estimatedEvidence('revenueForecastBasis', Object.freeze({
      method: 'conservative-baseline-ceiling',
      latestActuals: actuals,
      rule: 'ไม่ขยายวงเงินเหนือฐานงบเดิมโดยอัตโนมัติ; ใช้รายรับจริงเป็นข้อมูลประกอบและรอยืนยันยอดจัดสรร'
    }), ['baselineBudget', 'latestRevenueActuals'], 'กรอบอนุรักษ์นิยมสำหรับ Working Draft'));
  }

  if (!index.has('projectRequests') && plan) {
    const requests = makeProjectRequests(plan);
    if (requests.length) derived.push(estimatedEvidence('projectRequests', Object.freeze(requests), ['targetYearPlan'], 'นำรายการจากแผนมาเป็นบัญชีคำขอเบื้องต้น ไม่ถือว่าพร้อมดำเนินการ'));
    else blockers.push('targetYearPlan:projects-required');
  }

  if (!index.has('personnelObligations') && baseline) {
    const amount = personnelAmount(baseline);
    if (finite(amount)) {
      derived.push(estimatedEvidence('personnelObligations', Object.freeze({
        total: amount,
        basis: 'baseline-personnel-budget',
        evidenceStatus: 'estimated'
      }), ['baselineBudget'], 'ใช้ยอดงบบุคลากรปีฐานเป็น placeholder จนกว่าจะนำเข้าภาระบุคลากรปีเป้าหมายจริง'));
    } else blockers.push('personnelObligations:verified-or-estimated-basis-required');
  }

  let working = mergeEvidenceByKey(original, derived);
  let workingIndex = indexOf(working);

  if (!workingIndex.has('budgetTotals') && baseline) {
    const ceiling = targetCeiling(baseline);
    if (finite(ceiling)) {
      const revenueItems = scaleRows(baselineRevenueItems(baseline), ceiling);
      const expenseItems = scaleRows(baselineExpenseItems(baseline), ceiling);
      if (revenueItems.length && expenseItems.length) {
        const budgetTotals = Object.freeze({
          revenueTotal: ceiling,
          expenseTotal: ceiling,
          revenueItems: Object.freeze(revenueItems),
          expenseItems: Object.freeze(expenseItems),
          workingDraft: true,
          evidenceStatus: 'estimated'
        });
        const totalEvidence = estimatedEvidence('budgetTotals', budgetTotals, ['baselineBudget', 'latestRevenueActuals'], 'รักษาเพดานรวมเท่าปีฐานจนกว่ายอดรายรับปีเป้าหมายจะยืนยัน');
        derived.push(totalEvidence);
        working = mergeEvidenceByKey(working, [totalEvidence]);
        workingIndex = indexOf(working);
      } else blockers.push('budgetTotals:baseline-breakdown-required');
    } else blockers.push('budgetTotals:baseline-total-required');
  }

  if (!workingIndex.has('allocationDraft')) {
    const totals = valueOf(workingIndex, 'budgetTotals');
    if (Array.isArray(totals?.expenseItems) && totals.expenseItems.length) {
      derived.push(estimatedEvidence('allocationDraft', Object.freeze({
        total: totals.expenseTotal,
        rows: Object.freeze(totals.expenseItems.map(row => Object.freeze({ ...row }))),
        status: 'working-draft'
      }), ['budgetTotals'], 'จัดสรรเบื้องต้นตามสัดส่วนปีฐาน'));
    }
  }

  working = mergeEvidenceByKey(original, derived);
  workingIndex = indexOf(working);
  const projectRequests = Array.isArray(valueOf(workingIndex, 'projectRequests')) ? valueOf(workingIndex, 'projectRequests') : [];

  if (!workingIndex.has('priorityReadiness') && projectRequests.length) {
    derived.push(estimatedEvidence('priorityReadiness', Object.freeze({
      rows: Object.freeze(priorityRows(projectRequests)),
      defaultPriority: 'Reserve',
      rule: 'ห้ามยกระดับเป็น A/B/C จนกว่าหลักฐานความพร้อมและคำของบจริงจะครบ'
    }), ['projectRequests'], 'fail-safe readiness classification'));
  }

  working = mergeEvidenceByKey(original, derived);
  workingIndex = indexOf(working);
  if (!workingIndex.has('budgetRiskReview')) {
    derived.push(estimatedEvidence('budgetRiskReview', riskReview({
      hasPersonnel: Boolean(workingIndex.get('personnelObligations')),
      projectRequests,
      budgetTotals: valueOf(workingIndex, 'budgetTotals'),
      latestRevenueActuals: actuals
    }), ['baselineBudget', 'latestRevenueActuals', 'targetYearPlan', 'personnelObligations', 'budgetTotals'], 'automated risk pre-screen; human review remains required'));
  }

  const finalEvidence = mergeEvidenceByKey(original, derived);
  const finalIndex = indexOf(finalEvidence);
  for (const key of ['baselineBudget', 'latestRevenueActuals', 'targetYearPlan', 'personnelObligations', 'budgetTotals']) {
    if (!finalIndex.has(key)) blockers.push(`${key}:required`);
  }

  return Object.freeze({
    plannerVersion: BUDGET_WORKING_DRAFT_PLANNER_VERSION,
    status: blockers.length ? 'partial' : 'ready-working-draft',
    evidence: Object.freeze(finalEvidence),
    derivedKeys: Object.freeze([...new Set(derived.map(item => item.key))]),
    blockers: Object.freeze([...new Set(blockers)]),
    governance: Object.freeze({
      noFabrication: true,
      estimatesExplicitlyLabelled: true,
      conservativeBaselineCeiling: true,
      projectReadinessDefaultsToReserve: true,
      humanApprovalStillRequired: true
    })
  });
}

export default buildBudgetWorkingDraftEvidence;
