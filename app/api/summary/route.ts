import { NextRequest, NextResponse } from 'next/server';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

import { createClient } from '@/lib/supabase';
import { normalizeCategorySeries, normalizeDailySeries, normalizeTotals } from '@/lib/summary';

interface SummaryFilters {
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filters: SummaryFilters = {
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    account: searchParams.get('account') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  };

  const supabase = createClient();

  const totalsQuery = applyFilters(
    supabase.from('transactions').select('type, total:amount.sum()'),
    filters
  );

  const byDayQuery = applyFilters(
    supabase
      .from('transactions')
      .select('date, type, total:amount.sum()')
      .order('date', { ascending: true }),
    filters
  );

  const byCategoryQuery = applyFilters(
    supabase
      .from('transactions')
      .select('category, type, total:amount.sum()')
      .order('category', { ascending: true }),
    filters
  );

  const [totalsResult, dayResult, categoryResult] = await Promise.all([
    totalsQuery.returns(),
    byDayQuery.returns(),
    byCategoryQuery.returns(),
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

type FilterableQuery = PostgrestFilterBuilder<Record<string, unknown>, Record<string, unknown>, unknown>;

export function applyFilters<T extends FilterableQuery>(query: T, filters: SummaryFilters): T {
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
