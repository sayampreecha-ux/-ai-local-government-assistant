import { confirmParsedBudgetReview } from '../../../src/budget-file-parser-review.js';

export const BUDGET_REVIEW_UI_VERSION = '1.0';

const text = value => String(value ?? '').trim();
const money = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString('th-TH', { maximumFractionDigits: 2 }) : '-';

function summarize(review) {
  const extracted = review?.extracted || {};
  if (review?.purpose === 'baselineBudget') {
    return [`ปีงบประมาณ: ${extracted.fiscalYear || '-'}`, `ยอดรวม: ${money(extracted.total)} บาท`];
  }
  if (review?.purpose === 'personnelObligations') {
    return [`ภาระบุคลากรรวม: ${money(extracted.total)} บาท`, `จำนวนรายการ: ${(extracted.items || []).length}`];
  }
  if (review?.purpose === 'budgetTotals') {
    return [
      `รายรับรวม: ${money(extracted.revenueTotal)} บาท`,
      `รายจ่ายรวม: ${money(extracted.expenseTotal)} บาท`,
      `รายการรายรับ: ${(extracted.revenueItems || []).length}`,
      `รายการรายจ่าย: ${(extracted.expenseItems || []).length}`
    ];
  }
  return ['ยังสรุปข้อมูลไม่ได้'];
}

function ensureHost() {
  let host = document.getElementById('budgetReviewPanel');
  if (host) return host;
  host = document.createElement('section');
  host.id = 'budgetReviewPanel';
  host.className = 'budget-review-panel';
  host.setAttribute('aria-live', 'polite');
  const conversation = document.getElementById('conversation');
  if (conversation?.parentNode) conversation.parentNode.insertBefore(host, conversation.nextSibling);
  else document.body.append(host);
  return host;
}

function button(label, handler) {
  const node = document.createElement('button');
  node.type = 'button';
  node.textContent = label;
  node.addEventListener('click', handler);
  return node;
}

export function renderBudgetReviews(reviews = [], { onConfirmed = null } = {}) {
  const host = ensureHost();
  host.replaceChildren();
  if (!Array.isArray(reviews) || !reviews.length) {
    host.hidden = true;
    return host;
  }
  host.hidden = false;
  const heading = document.createElement('h3');
  heading.textContent = 'ตรวจตัวเลขจากไฟล์ก่อนใช้';
  const intro = document.createElement('p');
  intro.textContent = 'ระบบอ่านไฟล์แล้ว แต่ยังไม่ถือเป็นหลักฐาน กรุณาตรวจและยืนยันก่อนนำไปคำนวณร่างงบประมาณ';
  host.append(heading, intro);

  reviews.forEach((review, index) => {
    const card = document.createElement('div');
    card.className = 'budget-review-card';
    const title = document.createElement('strong');
    title.textContent = `ไฟล์ ${index + 1} · ${review.purpose || 'ข้อมูลข้อมูลงบประมาณ'}`;
    const list = document.createElement('ul');
    summarize(review).forEach(line => {
      const item = document.createElement('li');
      item.textContent = line;
      list.append(item);
    });
    const warning = document.createElement('p');
    warning.textContent = review.warnings?.length ? `⚠️ ต้องตรวจเพิ่ม: ${review.warnings.join(', ')}` : '✅ parser ไม่พบข้อผิดรูปแบบพื้นฐาน แต่ยังต้องให้คนยืนยัน';
    const actions = document.createElement('div');
    actions.className = 'budget-review-actions';
    const confirm = button('ยืนยันตัวเลขนี้', () => {
      const result = confirmParsedBudgetReview(review, { confirmed: true, reviewer: 'browser-user' });
      if (result.failClosed) {
        warning.textContent = `⛔ ยังยืนยันไม่ได้: ${result.status}`;
        return;
      }
      const current = globalThis.GovPromptBudgetConfirmedInputs && typeof globalThis.GovPromptBudgetConfirmedInputs === 'object'
        ? globalThis.GovPromptBudgetConfirmedInputs : {};
      globalThis.GovPromptBudgetConfirmedInputs = Object.freeze({ ...current, ...result.evidenceInput });
      confirm.disabled = true;
      confirm.textContent = 'ยืนยันแล้ว';
      warning.textContent = '✅ ยืนยันแล้ว ค่านี้จะถูกใช้เฉพาะในแท็บนี้ กรุณาส่งคำสั่งงบประมาณเดิมอีกครั้งเพื่อประมวลผลต่อ';
      if (typeof onConfirmed === 'function') onConfirmed(result);
    });
    actions.append(confirm);
    card.append(title, list, warning, actions);
    host.append(card);
  });
  return host;
}

export function clearBudgetConfirmedInputs() {
  globalThis.GovPromptBudgetConfirmedInputs = Object.freeze({});
  const host = document.getElementById('budgetReviewPanel');
  if (host) { host.replaceChildren(); host.hidden = true; }
}

export default Object.freeze({ version: BUDGET_REVIEW_UI_VERSION, renderBudgetReviews, clearBudgetConfirmedInputs });
