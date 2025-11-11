import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getBudgetConfig } from '@/lib/config';
import type {
  BudgetAccountStatus,
  BudgetCategoryStatus,
  BudgetSummary,
} from '@/types/budget';

interface BudgetFilters {
  account?: string;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function getDefaultPeriod() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

function mapCategoryStatuses(
  limits: Record<string, number>,
  totals: Map<string, number>
): BudgetCategoryStatus[] {
  return Object.entries(limits).map(([category, limit]) => {
    const spent = totals.get(category) ?? 0;
    const remaining = limit - spent;

    return {
      category,
      limit,
      spent,
      remaining,
      isOverLimit: remaining < 0,
    };
  });
}

function mapAccountStatuses(
  limits: Record<string, number>,
  totals: Map<string, number>
): BudgetAccountStatus[] {
  return Object.entries(limits).map(([account, limit]) => {
    const spent = totals.get(account) ?? 0;
    const remaining = limit - spent;

    return {
      account,
      limit,
      spent,
      remaining,
      isOverLimit: remaining < 0,
    };
  });
}

type BudgetFilterQuery = PostgrestFilterBuilder<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  unknown
>;

function applyBudgetFilters<T extends BudgetFilterQuery>(query: T, filters: BudgetFilters): T {
  let builder = query.eq('type', 'expense');

  if (filters.account) {
    builder = builder.eq('account', filters.account);
  }

  return builder;
}

export async function fetchBudgetSummary(
  supabase: SupabaseClient,
  filters: BudgetFilters = {}
): Promise<BudgetSummary | null> {
  const config = getBudgetConfig();
  const { categories, accounts, currency } = config;
  const hasCategoryBudgets = Object.keys(categories).length > 0;
  const hasAccountBudgets = Object.keys(accounts).length > 0;

  if (!hasCategoryBudgets && !hasAccountBudgets) {
    return null;
  }

  const period = getDefaultPeriod();

  const categoryTotalsPromise = hasCategoryBudgets
    ? applyBudgetFilters(
        supabase
          .from('transactions')
          .select('category, total:amount.sum()')
          .group('category')
          .gte('date', period.start)
          .lte('date', period.end)
          .in('category', Object.keys(categories)),
        filters
      ).returns<Array<{ category: string | null; total: number | null }>>()
    : Promise.resolve({ data: [], error: null } as const);

  const accountTotalsPromise = hasAccountBudgets
    ? applyBudgetFilters(
        supabase
          .from('transactions')
          .select('account, total:amount.sum()')
          .group('account')
          .gte('date', period.start)
          .lte('date', period.end)
          .in('account', Object.keys(accounts)),
        filters
      ).returns<Array<{ account: string | null; total: number | null }>>()
    : Promise.resolve({ data: [], error: null } as const);

  const [categoryTotals, accountTotals] = await Promise.all([
    categoryTotalsPromise,
    accountTotalsPromise,
  ]);

  if (categoryTotals.error) {
    throw new Error(categoryTotals.error.message);
  }

  if (accountTotals.error) {
    throw new Error(accountTotals.error.message);
  }

  const categoryMap = new Map<string, number>();
  for (const row of categoryTotals.data ?? []) {
    if (!row.category) continue;
    categoryMap.set(row.category, Number(row.total ?? 0));
  }

  const accountMap = new Map<string, number>();
  for (const row of accountTotals.data ?? []) {
    if (!row.account) continue;
    accountMap.set(row.account, Number(row.total ?? 0));
  }

  return {
    period,
    currency,
    categories: mapCategoryStatuses(categories, categoryMap),
    accounts: mapAccountStatuses(accounts, accountMap),
  };
}
