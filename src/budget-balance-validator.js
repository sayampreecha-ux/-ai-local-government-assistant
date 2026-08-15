export const BUDGET_BALANCE_VALIDATOR_VERSION = '1.1';
export const BUDGET_EVIDENCE_STATUSES = Object.freeze(['verified', 'estimated', 'pending-confirmation']);

const EPSILON = 0.01;
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const asNumber = (value) => {
  if (isFiniteNumber(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const normalized = Number(value.replace(/,/g, ''));
    return Number.isFinite(normalized) ? normalized : null;
  }
  return null;
};
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const closeEnough = (left, right) => Math.abs(left - right) <= EPSILON;
const keyOf = (item, index, prefix) => String(item?.key || item?.id || `${prefix}-${index + 1}`);

function normalizeItems(items, prefix) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    key: keyOf(item, index, prefix),
    amount: asNumber(item?.amount ?? item?.value),
    status: String(item?.status || '').trim(),
    estimated: item?.estimated === true
  }));
}

function validateLineItems(items, prefix, errors) {
  const normalized = normalizeItems(items, prefix);
  for (const item of normalized) {
    if (item.amount == null) errors.push(`${prefix}:${item.key}:finite-amount-required`);
    if (item.status && !BUDGET_EVIDENCE_STATUSES.includes(item.status)) errors.push(`${prefix}:${item.key}:invalid-status`);
    if (item.estimated && item.status !== 'estimated') errors.push(`${prefix}:${item.key}:estimated-status-label-required`);
    if (item.status === 'pending-confirmation') errors.push(`${prefix}:${item.key}:pending-confirmation`);
  }
  return normalized;
}

function computedTotal(items) {
  if (!items.length || items.some((item) => item.amount == null)) return null;
  return round2(items.reduce((sum, item) => sum + item.amount, 0));
}

function normalizeBreakdowns(breakdowns = []) {
  if (!Array.isArray(breakdowns)) return [];
  return breakdowns.map((breakdown, index) => {
    const key = String(breakdown?.key || breakdown?.id || `breakdown-${index + 1}`);
    const items = normalizeItems(breakdown?.items, `breakdown:${key}`);
    return {
      key,
      declaredTotal: asNumber(breakdown?.declaredTotal ?? breakdown?.total),
      items,
      calculatedTotal: computedTotal(items)
    };
  });
}

function validateBreakdowns(breakdowns, errors) {
  const normalized = normalizeBreakdowns(breakdowns);
  for (const breakdown of normalized) {
    if (breakdown.declaredTotal == null) errors.push(`breakdown:${breakdown.key}:declared-total-required`);
    if (!breakdown.items.length) errors.push(`breakdown:${breakdown.key}:items-required`);
    for (const item of breakdown.items) {
      if (item.amount == null) errors.push(`breakdown:${breakdown.key}:${item.key}:finite-amount-required`);
      if (item.status && !BUDGET_EVIDENCE_STATUSES.includes(item.status)) errors.push(`breakdown:${breakdown.key}:${item.key}:invalid-status`);
      if (item.estimated && item.status !== 'estimated') errors.push(`breakdown:${breakdown.key}:${item.key}:estimated-status-label-required`);
      if (item.status === 'pending-confirmation') errors.push(`breakdown:${breakdown.key}:${item.key}:pending-confirmation`);
    }
    if (breakdown.declaredTotal != null && breakdown.calculatedTotal != null && !closeEnough(breakdown.declaredTotal, breakdown.calculatedTotal)) {
      errors.push(`breakdown:${breakdown.key}:formula-mismatch`);
    }
  }
  return normalized;
}

function finding(code, message) {
  return Object.freeze({ code, severity: 'high', message });
}

export function validateBudgetBalance(payload = {}) {
  const errors = [];
  const revenueItems = validateLineItems(payload.revenueItems, 'revenue', errors);
  const expenseItems = validateLineItems(payload.expenseItems, 'expense', errors);
  const breakdowns = validateBreakdowns(payload.breakdowns, errors);
  const declaredRevenue = asNumber(payload.revenueTotal);
  const declaredExpense = asNumber(payload.expenseTotal);
  const calculatedRevenue = computedTotal(revenueItems);
  const calculatedExpense = computedTotal(expenseItems);

  if (payload.revenueTotal != null && declaredRevenue == null) errors.push('revenueTotal:finite-number-required');
  if (payload.expenseTotal != null && declaredExpense == null) errors.push('expenseTotal:finite-number-required');

  if (declaredRevenue == null && calculatedRevenue == null) errors.push('revenueTotal-or-revenueItems:required');
  if (declaredExpense == null && calculatedExpense == null) errors.push('expenseTotal-or-expenseItems:required');

  if (declaredRevenue != null && calculatedRevenue != null && !closeEnough(declaredRevenue, calculatedRevenue)) {
    errors.push('revenueTotal:formula-mismatch');
  }
  if (declaredExpense != null && calculatedExpense != null && !closeEnough(declaredExpense, calculatedExpense)) {
    errors.push('expenseTotal:formula-mismatch');
  }

  const effectiveRevenue = declaredRevenue ?? calculatedRevenue;
  const effectiveExpense = declaredExpense ?? calculatedExpense;
  if (effectiveRevenue != null && effectiveExpense != null && !closeEnough(effectiveRevenue, effectiveExpense)) {
    errors.push('budget:revenue-expense-not-balanced');
  }

  const formulaErrors = errors.filter((error) => error.includes('formula-mismatch'));
  const breakdownFormulaErrors = errors.filter((error) => error.startsWith('breakdown:') && error.endsWith(':formula-mismatch'));
  const pendingErrors = errors.filter((error) => error.includes('pending-confirmation'));
  const balanceError = errors.includes('budget:revenue-expense-not-balanced');
  const allItems = [...revenueItems, ...expenseItems, ...breakdowns.flatMap((breakdown) => breakdown.items)];
  const hasEstimates = allItems.some((item) => item.status === 'estimated' || item.estimated);

  let status = 'balanced';
  if (errors.length) {
    if (formulaErrors.length) status = 'validation-failed';
    else if (balanceError) status = 'blocked-unbalanced-budget';
    else if (pendingErrors.length) status = 'blocked-pending-confirmation';
    else status = 'blocked-invalid-budget-data';
  }

  const findings = [];
  if (formulaErrors.length) findings.push(finding('budget-formula-mismatch', 'ผลรวมรายการไม่ตรงกับยอดรวมที่ประกาศ ต้องแก้สูตรหรือข้อมูลก่อนเดินต่อ'));
  if (breakdownFormulaErrors.length) findings.push(finding('budget-breakdown-mismatch', 'พบยอดรายละเอียดภายในหมวดงบไม่รวมเท่ากับยอดหมวดที่ประกาศ ต้องตรวจแหล่งข้อมูลและแก้ไขก่อนถือเป็นร่างสุดท้าย'));
  if (balanceError) findings.push(finding('budget-not-balanced', 'รายรับและรายจ่ายไม่สมดุล ต้องปรับให้สมดุลก่อนจัดทำร่างขั้นสุดท้าย'));
  if (pendingErrors.length) findings.push(finding('budget-pending-confirmation', 'มีตัวเลขที่ยังอยู่ระหว่างยืนยัน จึงยังใช้เป็นยอดยืนยันขั้นสุดท้ายไม่ได้'));
  if (errors.some((error) => error.includes('estimated-status-label-required'))) findings.push(finding('budget-estimate-unlabelled', 'รายการประมาณการต้องระบุสถานะ estimated อย่างชัดเจน'));

  return Object.freeze({
    validatorVersion: BUDGET_BALANCE_VALIDATOR_VERSION,
    valid: errors.length === 0,
    status,
    revenueTotal: effectiveRevenue,
    expenseTotal: effectiveExpense,
    difference: effectiveRevenue != null && effectiveExpense != null ? round2(effectiveRevenue - effectiveExpense) : null,
    calculatedRevenue,
    calculatedExpense,
    breakdowns: Object.freeze(breakdowns.map((breakdown) => Object.freeze({
      key: breakdown.key,
      declaredTotal: breakdown.declaredTotal,
      calculatedTotal: breakdown.calculatedTotal,
      difference: breakdown.declaredTotal != null && breakdown.calculatedTotal != null
        ? round2(breakdown.declaredTotal - breakdown.calculatedTotal)
        : null
    }))),
    hasEstimates,
    estimatedItemKeys: Object.freeze(allItems.filter((item) => item.status === 'estimated').map((item) => item.key)),
    errors: Object.freeze(errors),
    findings: Object.freeze(findings),
    failClosed: errors.length > 0
  });
}

export default validateBudgetBalance;
