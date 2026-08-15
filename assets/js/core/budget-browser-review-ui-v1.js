import { confirmParsedBudgetReview } from '../../../src/budget-file-parser-review.js';

export const BUDGET_BROWSER_REVIEW_UI_VERSION = '1.1';

const text = value => String(value ?? '').trim();
const number = value => {
  const normalized = text(value).replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

function money(value) {
  return Number(value || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

function purposeLabel(purpose) {
  return ({ baselineBudget: 'งบประมาณฐานเดิม', personnelObligations: 'ภาระบุคลากร', budgetTotals: 'ยอดรายรับ/รายจ่าย' })[purpose] || purpose;
}

function createNumberInput(value, field) {
  const input = document.createElement('input');
  input.type = 'number';
  input.step = '0.01';
  input.value = Number.isFinite(Number(value)) ? String(value) : '';
  input.dataset.field = field;
  input.className = 'budget-review-number';
  return input;
}

function itemTable(title, items = [], side) {
  const wrap = document.createElement('div');
  const heading = document.createElement('h5');
  heading.textContent = title;
  const table = document.createElement('table');
  table.className = 'budget-review-table';
  table.innerHTML = '<thead><tr><th>รายการ</th><th>จำนวนเงิน (บาท)</th></tr></thead>';
  const tbody = document.createElement('tbody');
  items.forEach((item, index) => {
    const tr = document.createElement('tr');
    const label = document.createElement('td');
    label.textContent = item.label || item.name || item.key || `รายการ ${index + 1}`;
    const amount = document.createElement('td');
    const input = createNumberInput(item.amount, `${side}.${index}.amount`);
    input.dataset.side = side;
    input.dataset.index = String(index);
    amount.append(input);
    tr.append(label, amount);
    tbody.append(tr);
  });
  table.append(tbody);
  wrap.append(heading, table);
  return wrap;
}

function collectCorrections(container, review) {
  const corrections = {};
  const extracted = review.extracted || {};
  for (const input of container.querySelectorAll('input[data-field]')) {
    const field = input.dataset.field;
    const value = number(input.value);
    if (field === 'total' || field === 'fiscalYear' || field === 'revenueTotal' || field === 'expenseTotal') corrections[field] = value;
  }
  const patchItems = (source = [], side) => source.map((item, index) => {
    const input = container.querySelector(`input[data-side="${side}"][data-index="${index}"]`);
    return { ...item, amount: input ? number(input.value) : item.amount };
  });
  if (Array.isArray(extracted.revenueItems)) corrections.revenueItems = patchItems(extracted.revenueItems, 'revenueItems');
  if (Array.isArray(extracted.expenseItems)) corrections.expenseItems = patchItems(extracted.expenseItems, 'expenseItems');
  if (Array.isArray(extracted.items)) corrections.items = patchItems(extracted.items, 'items');
  return corrections;
}

export function renderBudgetReviewPanel(review, { onConfirmed = null, onCancelled = null } = {}) {
  if (!review || typeof document === 'undefined') return null;
  const panel = document.createElement('section');
  panel.className = 'budget-review-panel';
  const heading = document.createElement('h4');
  heading.textContent = `ตรวจข้อมูลจากไฟล์: ${purposeLabel(review.purpose)}`;
  const note = document.createElement('p');
  note.textContent = 'ตัวเลขต่อไปนี้ระบบอ่านจากไฟล์โดยอัตโนมัติ กรุณาตรวจและแก้ไขก่อนยืนยัน ระบบจะยังไม่ใช้เป็นหลักฐานจนกว่าคุณกดยืนยัน';
  panel.append(heading, note);

  const extracted = review.extracted || {};
  const summary = document.createElement('div');
  summary.className = 'budget-review-summary';
  if (review.purpose === 'baselineBudget') {
    summary.append(document.createTextNode('ปีงบประมาณ '));
    summary.append(createNumberInput(extracted.fiscalYear, 'fiscalYear'));
    summary.append(document.createTextNode(' · ยอดรวม '));
    summary.append(createNumberInput(extracted.total, 'total'));
    summary.append(document.createTextNode(' บาท'));
  } else if (review.purpose === 'personnelObligations') {
    summary.append(document.createTextNode('ยอดภาระบุคลากรรวม '));
    summary.append(createNumberInput(extracted.total, 'total'));
    summary.append(document.createTextNode(' บาท'));
  } else if (review.purpose === 'budgetTotals') {
    summary.append(document.createTextNode('รายรับรวม '));
    summary.append(createNumberInput(extracted.revenueTotal, 'revenueTotal'));
    summary.append(document.createTextNode(' บาท · รายจ่ายรวม '));
    summary.append(createNumberInput(extracted.expenseTotal, 'expenseTotal'));
    summary.append(document.createTextNode(' บาท'));
  }
  panel.append(summary);

  if (Array.isArray(extracted.revenueItems) && extracted.revenueItems.length) panel.append(itemTable('รายการรายรับ', extracted.revenueItems, 'revenueItems'));
  if (Array.isArray(extracted.expenseItems) && extracted.expenseItems.length) panel.append(itemTable('รายการรายจ่าย', extracted.expenseItems, 'expenseItems'));
  if (Array.isArray(extracted.items) && extracted.items.length) panel.append(itemTable('รายการ', extracted.items, 'items'));

  const actions = document.createElement('div');
  actions.className = 'budget-review-actions';
  const confirmButton = document.createElement('button');
  confirmButton.type = 'button';
  confirmButton.textContent = 'ยืนยันข้อมูลนี้';
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'ยังไม่ยืนยัน';
  cancelButton.className = 'secondary';
  const status = document.createElement('p');
  status.className = 'budget-review-status';

  confirmButton.addEventListener('click', () => {
    const corrections = collectCorrections(panel, review);
    const result = confirmParsedBudgetReview(review, {
      confirmed: true,
      reviewer: 'browser-user-review-ui',
      corrections
    });
    if (result.status === 'confirmed') {
      status.textContent = `✅ ยืนยันแล้ว${result.balance ? ` · รายรับ ${money(result.balance.revenueTotal)} · รายจ่าย ${money(result.balance.expenseTotal)}` : ''}`;
      confirmButton.disabled = true;
      if (typeof onConfirmed === 'function') onConfirmed(result);
    } else {
      status.textContent = `⚠️ ยังยืนยันไม่ได้: ${result.status}`;
      if (result.balance?.findings?.length) status.textContent += ` · ${result.balance.findings.map(item => item.message).join(' / ')}`;
    }
  });
  cancelButton.addEventListener('click', () => {
    status.textContent = 'ยังไม่ยืนยันข้อมูลนี้';
    if (typeof onCancelled === 'function') onCancelled(review);
  });
  actions.append(confirmButton, cancelButton);
  panel.append(actions, status);
  return panel;
}

export function requestBudgetReviewDecision(review) {
  if (!review || typeof document === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'budget-review-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const shell = document.createElement('div');
    shell.className = 'budget-review-dialog';
    const panel = renderBudgetReviewPanel(review, {
      onConfirmed: result => {
        overlay.remove();
        resolve(Object.freeze({
          confirmed: true,
          reviewer: 'browser-user-review-ui',
          confirmedAt: result.review?.confirmedAt || new Date().toISOString(),
          corrections: Object.freeze({ ...result.evidenceInput?.[review.purpose]?.data })
        }));
      },
      onCancelled: () => {
        overlay.remove();
        resolve(Object.freeze({ confirmed: false, reviewer: 'browser-user-review-ui' }));
      }
    });
    shell.append(panel);
    overlay.append(shell);
    document.body.append(overlay);
    shell.querySelector('input,button')?.focus();
  });
}

export default Object.freeze({ version: BUDGET_BROWSER_REVIEW_UI_VERSION, renderBudgetReviewPanel, requestBudgetReviewDecision });
