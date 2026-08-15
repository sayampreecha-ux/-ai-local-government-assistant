import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateBudgetBalance } from '../../src/budget-balance-validator.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(resolve(here, '../fixtures/phayao-budget-2570-infographic-case.json'), 'utf8'));

function arithmeticOnly(items = []) {
  return items.map((item) => ({ ...item, status: 'verified' }));
}

test('Phayao 2570 infographic top-level revenue and expense arithmetic is balanced at 592,782,700 baht', () => {
  const result = validateBudgetBalance({
    revenueTotal: fixture.budget.revenueTotal,
    expenseTotal: fixture.budget.expenseTotal,
    revenueItems: arithmeticOnly(fixture.budget.revenueItems),
    expenseItems: arithmeticOnly(fixture.budget.expenseItems)
  });

  assert.equal(result.valid, true);
  assert.equal(result.status, 'balanced');
  assert.equal(result.revenueTotal, 592782700);
  assert.equal(result.expenseTotal, 592782700);
  assert.equal(result.difference, 0);
  assert.equal(result.calculatedRevenue, 592782700);
  assert.equal(result.calculatedExpense, 592782700);
});

test('user-provided infographic amounts remain pending-confirmation until official source verification', () => {
  const result = validateBudgetBalance(fixture.budget);
  assert.equal(result.valid, false);
  assert.equal(result.status, 'blocked-pending-confirmation');
  assert.ok(result.findings.some((item) => item.code === 'budget-pending-confirmation'));
});

test('investment infographic A reconciles exactly to the declared investment total', () => {
  const result = validateBudgetBalance({
    revenueTotal: 1,
    expenseTotal: 1,
    breakdowns: [{
      key: 'investment-infographic-a',
      declaredTotal: fixture.investmentInfographicA.declaredTotal,
      items: arithmeticOnly(fixture.investmentInfographicA.items)
    }]
  });

  assert.equal(result.valid, true);
  const breakdown = result.breakdowns.find((item) => item.key === 'investment-infographic-a');
  assert.equal(breakdown?.declaredTotal, 134470720);
  assert.equal(breakdown?.calculatedTotal, 134470720);
  assert.equal(breakdown?.difference, 0);
});

test('investment infographic B is blocked because its two displayed components are short by 2,495,700 baht', () => {
  const result = validateBudgetBalance({
    revenueTotal: 1,
    expenseTotal: 1,
    breakdowns: [{
      key: 'investment-infographic-b',
      declaredTotal: fixture.investmentInfographicB.declaredTotal,
      items: arithmeticOnly(fixture.investmentInfographicB.items)
    }]
  });

  assert.equal(result.valid, false);
  assert.equal(result.status, 'validation-failed');
  assert.ok(result.errors.includes('breakdown:investment-infographic-b:formula-mismatch'));
  assert.ok(result.findings.some((item) => item.code === 'budget-breakdown-mismatch'));
  const breakdown = result.breakdowns.find((item) => item.key === 'investment-infographic-b');
  assert.equal(breakdown?.calculatedTotal, 131975020);
  assert.equal(breakdown?.difference, 2495700);
});

test('personnel subtotal shown in the infographic reconciles to the declared personnel budget', () => {
  assert.equal(fixture.personnel.political + fixture.personnel.permanent, fixture.personnel.declaredTotal);
  assert.equal(fixture.personnel.permanentFromOwnRevenue + fixture.personnel.permanentFromGeneralGrant, fixture.personnel.permanent);
});

test('investment infographic A special figures remain internally consistent', () => {
  assert.equal(
    fixture.investmentInfographicA.specialFigures.solarLedPerProject * fixture.investmentInfographicA.counts.solarLedProjects,
    fixture.investmentInfographicA.specialFigures.solarLedTotal
  );
  assert.equal(fixture.investmentInfographicA.specialFigures.projects500kTotal, 98500000);
});
