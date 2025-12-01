import { NextRequest, NextResponse } from 'next/server';

import { fetchBudgetSummary } from '@/lib/budgets';
import { createClient } from '@/lib/supabase';
import {
  applySummaryFilters,
  normalizeCategorySeries,
  normalizeDailySeries,
  normalizeTotals,
  type AggregateRow,
  type SummaryFilterOptions,
} from '@/lib/summary';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filters: SummaryFilterOptions = {
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    account: searchParams.get('account') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  };

  const supabase = createClient();

  const totalsQuery = applySummaryFilters(
    supabase.from('transactions').select('type, total:amount.sum()').group('type'),
    filters
  );

  const byDayQuery = applySummaryFilters(
    supabase
      .from('transactions')
      .select('date, type, total:amount.sum()')
      .group('date, type')
      .order('date', { ascending: true }),
    filters
  );

  const byCategoryQuery = applySummaryFilters(
    supabase
      .from('transactions')
      .select('category, type, total:amount.sum()')
      .group('category, type')
      .order('category', { ascending: true }),
    filters
  );

  try {
    const [totalsResult, dayResult, categoryResult, budgetSummary] =
      await Promise.all([
        totalsQuery.returns<AggregateRow[]>(),
        byDayQuery.returns<AggregateRow[]>(),
        byCategoryQuery.returns<AggregateRow[]>(),
        fetchBudgetSummary(supabase, { account: filters.account }),
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
      budgets: budgetSummary ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to compute summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
