export const BUDGET_OFFICIAL_DOCUMENT_PARSER_VERSION = '1.1';

const text = value => String(value ?? '').replace(/\r/g, '').trim();
const normalizeSpace = value => text(value).replace(/[\t ]+/g, ' ');
const numberFrom = value => {
  const matched = String(value ?? '').replace(/[฿บาท]/g, ' ').match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!matched) return null;
  const number = Number(matched[0].replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
};
const moneyNumbers = value => [...String(value ?? '').matchAll(/(?:^|[^\d])(-?\d{1,3}(?:,\d{3})+(?:\.\d+)?|-?\d{4,}(?:\.\d+)?)(?=$|[^\d])/g)]
  .map(match => Number(match[1].replace(/,/g, '')))
  .filter(number => Number.isFinite(number));
const unique = values => [...new Set(values.filter(Boolean))];

const LABELS = Object.freeze({
  revenue: [
    ['own-revenue', /รายได้จัดเก็บเอง|รายได้ที่.*จัดเก็บเอง/i],
    ['allocated-revenue', /ภาษีจัดสรร|รายได้ที่รัฐบาลจัดเก็บ.*จัดสรร|รัฐบาลจัดเก็บและจัดสรร/i],
    ['general-grant', /เงินอุดหนุนทั่วไป/i],
    ['other-revenue', /รายรับอื่น|รายได้อื่น/i]
  ],
  expense: [
    ['central-budget', /งบกลาง/i], ['personnel', /งบบุคลากร/i], ['operations', /งบดำเนินงาน/i],
    ['investment', /งบลงทุน/i], ['subsidy', /งบเงินอุดหนุน|เงินอุดหนุน(?!ทั่วไป)/i], ['other-expense', /รายจ่ายอื่น/i]
  ]
});

function linesOf(rawContent) { return text(rawContent).split('\n').map(normalizeSpace).filter(Boolean); }
function amountForLine(line) { const numbers = moneyNumbers(line); return numbers.length ? numbers[numbers.length - 1] : null; }
function extractLabelRows(lines, definitions) {
  const rows = [];
  for (const [key, pattern] of definitions) {
    const candidates = lines.filter(line => pattern.test(line)); let best = null;
    for (const line of candidates) { const amount = amountForLine(line); if (amount == null) continue; if (!best || amount > best.amount) best = { key, label: line.slice(0, 180), amount, status: 'verified' }; }
    if (best) rows.push(best);
  }
  return rows;
}
function fiscalYearFrom(lines, fallback = null) {
  const joined = lines.slice(0, 200).join(' ');
  const thai = joined.match(/(?:พ\.ศ\.?|ปีงบประมาณ|ประจำปีงบประมาณ)\s*(25\d{2})/i);
  if (thai) return Number(thai[1]);
  const any = joined.match(/\b(25\d{2})\b/);
  return any ? Number(any[1]) : (Number.isInteger(Number(fallback)) ? Number(fallback) : null);
}
function findBudgetTotal(lines, revenueRows, expenseRows) {
  const explicit = [];
  for (const line of lines) { if (!/(รวมรายจ่าย|รายจ่ายทั้งสิ้น|งบประมาณรายจ่าย|รวมประมาณการรายรับ|ประมาณการรายรับรวม|รวมรายรับ)/i.test(line)) continue; explicit.push(...moneyNumbers(line).filter(number => number >= 100000)); }
  const expenseSum = expenseRows.length >= 3 ? expenseRows.reduce((sum, row) => sum + row.amount, 0) : null;
  const revenueSum = revenueRows.length >= 2 ? revenueRows.reduce((sum, row) => sum + row.amount, 0) : null;
  const candidates = [...explicit, expenseSum, revenueSum].filter(number => Number.isFinite(number));
  return candidates.length ? Math.max(...candidates) : null;
}
export function parseBaselineBudgetDocument(rawContent, { targetYear = null } = {}) {
  const lines = linesOf(rawContent); const revenueItems = extractLabelRows(lines, LABELS.revenue); const expenseItems = extractLabelRows(lines, LABELS.expense);
  const fiscalYear = fiscalYearFrom(lines, targetYear ? Number(targetYear) - 1 : null); const total = findBudgetTotal(lines, revenueItems, expenseItems); const errors = [];
  if (!fiscalYear) errors.push('fiscalYear:not-found'); if (!Number.isFinite(total)) errors.push('total:not-found'); if (expenseItems.length < 2 && revenueItems.length < 2) errors.push('budget-breakdown:insufficient');
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), data: Object.freeze({ fiscalYear, total, revenueItems: Object.freeze(revenueItems), expenseItems: Object.freeze(expenseItems), parserVersion: BUDGET_OFFICIAL_DOCUMENT_PARSER_VERSION }) });
}
export function parseRevenueActualsDocument(rawContent) {
  const lines = linesOf(rawContent); const rows = extractLabelRows(lines, LABELS.revenue);
  const explicitTotals = lines.filter(line => /(รวมรายรับ|รายรับรวม|รวมทั้งสิ้น)/i.test(line)).flatMap(moneyNumbers).filter(number => number >= 1000);
  const rowTotal = rows.length ? rows.reduce((sum, row) => sum + row.amount, 0) : null; const total = explicitTotals.length ? Math.max(...explicitTotals) : rowTotal;
  const periodLine = lines.find(line => /(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ณ วันที่|ถึงเดือน)/i.test(line)); const errors = [];
  if (!rows.length && !Number.isFinite(total)) errors.push('revenue-data:not-found');
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), data: Object.freeze({ total: Number.isFinite(total) ? total : null, rows: Object.freeze(rows), period: periodLine ? periodLine.slice(0, 180) : '', parserVersion: BUDGET_OFFICIAL_DOCUMENT_PARSER_VERSION }) });
}
const PLAN_HEADING_PREFIX = /^(?:ที่|ลำดับ|แผนงาน|แผนพัฒนาท้องถิ่น|ยุทธศาสตร์|หน้า|รวม|หมายเหตุ)(?:\s|[:：\-–—]|$)/i;
function projectCandidate(line) {
  if (line.length < 8 || line.length > 500) return false;
  if (PLAN_HEADING_PREFIX.test(line)) return false;
  return /(โครงการ|ก่อสร้าง|ปรับปรุง|ซ่อมแซม|จัดซื้อ|จัดหา|อบรม|พัฒนา|ส่งเสริม|ถนน|สะพาน|ระบบประปา|ไฟฟ้า|เสาไฟ|อาคาร|สนามกีฬา)/i.test(line);
}
function cleanProjectName(line) {
  const cells = line.includes('|') ? line.split('|').map(normalizeSpace).filter(Boolean) : [line]; const candidates = cells.filter(cell => projectCandidate(cell));
  return (candidates[0] || line).replace(/^[-*•\d.()\s]+/, '').slice(0, 260).trim();
}
export function parseTargetYearPlanDocument(rawContent, { targetYear = null } = {}) {
  const lines = linesOf(rawContent); const detectedYear = fiscalYearFrom(lines, targetYear); const projectLines = lines.filter(projectCandidate); const names = unique(projectLines.map(cleanProjectName)).slice(0, 1000);
  const projects = names.map((name, index) => { const sourceLine = projectLines.find(line => cleanProjectName(line) === name) || name; const amounts = moneyNumbers(sourceLine).filter(number => number >= 1000); return Object.freeze({ id: `plan-project-${index + 1}`, name, amount: amounts.length ? amounts[amounts.length - 1] : null, evidenceStatus: 'verified' }); });
  const errors = []; if (!detectedYear) errors.push('targetYear:not-found'); if (!projects.length) errors.push('projects:not-found');
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), data: Object.freeze({ targetYear: detectedYear, projects: Object.freeze(projects), projectCount: projects.length, parserVersion: BUDGET_OFFICIAL_DOCUMENT_PARSER_VERSION }) });
}
export function parseOfficialBudgetDocument(targetKey, rawContent, options = {}) {
  if (targetKey === 'baselineBudget') return parseBaselineBudgetDocument(rawContent, options);
  if (targetKey === 'latestRevenueActuals') return parseRevenueActualsDocument(rawContent, options);
  if (targetKey === 'targetYearPlan') return parseTargetYearPlanDocument(rawContent, options);
  return Object.freeze({ valid: false, errors: Object.freeze(['targetKey:unsupported']), data: null });
}
export { numberFrom, moneyNumbers };
