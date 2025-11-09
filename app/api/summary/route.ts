import { NextRequest, NextResponse } from 'next/server';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

import { createClient } from '@/lib/supabase';
import type { Transaction, TransactionType } from '@/types/transaction';

interface SummaryFilters {
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
}

interface AggregateRow {
  type: TransactionType;
  total: number | null;
  date?: string;
  category?: string;
}

type FilterBuilder<Result> = PostgrestFilterBuilder<Transaction, Result, unknown>;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters: SummaryFilters = {
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    account: searchParams.get('account') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  };

  const supabase = createClient();

  const totalsQuery = applyFilters<AggregateRow[]>(
    supabase.from('transactions').select('type, total:amount.sum()'),
    filters
  );

  const byDayQuery = applyFilters<AggregateRow[]>(
    supabase
      .from('transactions')
      .select('date, type, total:amount.sum()')
      .order('date', { ascending: true }),
    filters
  );

  const byCategoryQuery = applyFilters<AggregateRow[]>(
    supabase
      .from('transactions')
      .select('category, type, total:amount.sum()')
      .order('category', { ascending: true }),
    filters
  );

  const [totalsResult, dayResult, categoryResult] = await Promise.all([
    totalsQuery.returns<AggregateRow[]>(),
    byDayQuery.returns<AggregateRow[]>(),
    byCategoryQuery.returns<AggregateRow[]>(),
  ]);

  if (totalsResult.error) {
    return NextResponse.json({ error: totalsResult.error.message }, { status: 500 });
  }

  if (dayResult.error) {
    return NextResponse.json({ error: dayResult.error.message }, { status: 500 });
  }

  if (categoryResult.error) {
    return NextResponse.json({ error: categoryResult.error.message }, { status: 500 });
  }

  const totals = normalizeTotals(totalsResult.data ?? []);
  const byDay = normalizeDailySeries(dayResult.data ?? []);
  const byCategory = normalizeCategorySeries(categoryResult.data ?? []);

  return NextResponse.json({
    totals,
    byDay,
    byCategory,
  });
}

function applyFilters<Result>(query: FilterBuilder<Result>, filters: SummaryFilters): FilterBuilder<Result> {
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

function normalizeTotals(rows: AggregateRow[]) {
  const income = Number(rows.find((row) => row.type === 'income')?.total ?? 0);
  const expense = Number(rows.find((row) => row.type === 'expense')?.total ?? 0);

  return {
    income,
    expense,
    net: income - expense,
  };
}

function normalizeDailySeries(rows: AggregateRow[]) {
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

function normalizeCategorySeries(rows: AggregateRow[]) {
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
