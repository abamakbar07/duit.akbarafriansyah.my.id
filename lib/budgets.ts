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

const BUDGET_TIMEZONE = process.env.BUDGET_TIMEZONE ?? 'Asia/Jakarta';

function formatDateParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getLocalDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [year, month, day] = formatter.format(date).split('-').map(Number);

  return { year, month, day };
}

function getDefaultPeriod() {
  const timeZone = BUDGET_TIMEZONE;
  const { year, month, day } = getLocalDateParts(new Date(), timeZone);
  const start = formatDateParts(year, month, 1);
  const end = formatDateParts(year, month, day);

  if (process.env.NODE_ENV !== 'production') {
    console.debug('Budget period derived from timezone', { timeZone, start, end });
  }

  return { start, end };
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

function applyBudgetFilters(query: unknown, filters: BudgetFilters) {
  let builder = (query as any).eq('type', 'expense');

  if (filters.account) {
    builder = (builder as any).eq('account', filters.account);
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
    ? (applyBudgetFilters(
        supabase
          .from('transactions')
          .select('category, total:amount.sum()')
          .gte('date', period.start)
          .lte('date', period.end)
          .in('category', Object.keys(categories)) as any,
        filters
      ) as any).returns()
    : Promise.resolve({ data: [], error: null } as const);

  const accountTotalsPromise = hasAccountBudgets
    ? (applyBudgetFilters(
        supabase
          .from('transactions')
          .select('account, total:amount.sum()')
          .gte('date', period.start)
          .lte('date', period.end)
          .in('account', Object.keys(accounts)) as any,
        filters
      ) as any).returns()
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
