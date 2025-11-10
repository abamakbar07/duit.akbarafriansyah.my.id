import assert from 'node:assert/strict';

import { formatCurrency } from '../lib/currency';
import { normalizeCategorySeries, normalizeDailySeries, normalizeTotals } from '../lib/summary';

type TotalsRow = Parameters<typeof normalizeTotals>[0][number];

type DailyRow = Parameters<typeof normalizeDailySeries>[0][number];

type CategoryRow = Parameters<typeof normalizeCategorySeries>[0][number];

function testNormalizeTotals() {
  const rows: TotalsRow[] = [
    { type: 'income', total: 1500000 },
    { type: 'expense', total: 425000 },
  ];

  const result = normalizeTotals(rows);

  assert.equal(result.income, 1500000);
  assert.equal(result.expense, 425000);
  assert.equal(result.net, 1075000);
}

function testNormalizeDailySeries() {
  const rows: DailyRow[] = [
    { date: '2024-01-01', type: 'expense', total: 200000 },
    { date: '2024-01-01', type: 'income', total: 500000 },
    { date: '2024-01-02', type: 'expense', total: null },
  ];

  const result = normalizeDailySeries(rows);

  assert.deepEqual(result, [
    { date: '2024-01-01', income: 500000, expense: 200000 },
    { date: '2024-01-02', income: 0, expense: 0 },
  ]);
}

function testNormalizeCategorySeries() {
  const rows: CategoryRow[] = [
    { category: 'Food', type: 'expense', total: 125000 },
    { category: 'Salary', type: 'income', total: 7000000 },
    { category: 'Food', type: 'income', total: 40000 },
  ];

  const result = normalizeCategorySeries(rows);

  assert.deepEqual(result, [
    { category: 'Food', income: 40000, expense: 125000 },
    { category: 'Salary', income: 7000000, expense: 0 },
  ]);
}

function testFormatCurrency() {
  assert.equal(formatCurrency(75000), 'Rp\u00a075.000');
  assert.equal(formatCurrency(-27500), '-Rp\u00a027.500');
}

function run() {
  testNormalizeTotals();
  testNormalizeDailySeries();
  testNormalizeCategorySeries();
  testFormatCurrency();

  console.log('summary-normalizers tests passed');
}

run();
