import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { TransactionType } from '@/types/transaction';

type FilterableQuery = PostgrestFilterBuilder<any, any, any, any>;

export interface SummaryFilterOptions {
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
}

export interface AggregateRow {
  type: TransactionType;
  total: number | null;
  date?: string;
  category?: string;
}

export function normalizeTotals(rows: AggregateRow[]) {
  const income = Number(rows.find((row) => row.type === 'income')?.total ?? 0);
  const expense = Number(rows.find((row) => row.type === 'expense')?.total ?? 0);

  return {
    income,
    expense,
    net: income - expense,
  };
}

export function normalizeDailySeries(rows: AggregateRow[]) {
  const map = new Map<string, { date: string; income: number; expense: number }>();

  for (const row of rows) {
    if (!row.date) {
      continue;
    }

    const total = Number(row.total ?? 0);
    const existing = map.get(row.date) ?? { date: row.date, income: 0, expense: 0 };

    if (row.type === 'income') {
      existing.income = total;
    } else {
      existing.expense = total;
    }

    map.set(row.date, existing);
  }

  return Array.from(map.values());
}

export function normalizeCategorySeries(rows: AggregateRow[]) {
  const map = new Map<string, { category: string; income: number; expense: number }>();

  for (const row of rows) {
    if (!row.category) {
      continue;
    }

    const total = Number(row.total ?? 0);
    const existing = map.get(row.category) ?? { category: row.category, income: 0, expense: 0 };

    if (row.type === 'income') {
      existing.income = total;
    } else {
      existing.expense = total;
    }

    map.set(row.category, existing);
  }

  return Array.from(map.values());
}

export function applySummaryFilters<T extends FilterableQuery>(
  query: T,
  filters: SummaryFilterOptions
): T {
  let builder = query;

  if (filters.startDate) {
    builder = builder.gte('date', filters.startDate);
  }

  if (filters.endDate) {
    builder = builder.lte('date', filters.endDate);
  }

  if (filters.account) {
    builder = builder.eq('account', filters.account);
  }

  if (filters.category) {
    builder = builder.eq('category', filters.category);
  }

  return builder;
}
