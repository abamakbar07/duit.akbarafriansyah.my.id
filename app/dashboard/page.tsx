import { headers } from 'next/headers';

import { BudgetStatus } from '@/components/dashboard/budget-status';
import { CategoryBreakdownChart } from '@/components/dashboard/category-breakdown-chart';
import { DailySpendCard } from '@/components/dashboard/daily-spend-card';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { DashboardKpiCard } from '@/components/dashboard/kpi-card';
import { TransactionsTable } from '@/components/dashboard/transactions-table';
import { formatCurrency } from '@/lib/currency';
import type { BudgetSummary } from '@/types/budget';
import type { Transaction } from '@/types/transaction';

type SummaryResponse = {
  totals: {
    income: number;
    expense: number;
    net: number;
  };
  byDay: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
  byCategory: Array<{
    category: string;
    income: number;
    expense: number;
  }>;
  budgets: BudgetSummary | null;
};

type DashboardFiltersState = {
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
};

async function computeBaseUrl() {
  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const host = headersList.get('host');

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

function normalizeFilters(searchParams: Record<string, string | string[] | undefined>): DashboardFiltersState {
  const getParam = (key: string) => {
    const value = searchParams[key];

    if (Array.isArray(value)) {
      return value[0];
    }

    return value ?? undefined;
  };

  return {
    startDate: getParam('startDate') || undefined,
    endDate: getParam('endDate') || undefined,
    account: getParam('account') || undefined,
    category: getParam('category') || undefined,
  };
}

async function getSummary(baseUrl: string, filters: DashboardFiltersState): Promise<SummaryResponse | null> {
  try {
    const params = new URLSearchParams();

    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.account) params.set('account', filters.account);
    if (filters.category) params.set('category', filters.category);

    const query = params.toString();
    const response = await fetch(`${baseUrl}/api/summary${query ? `?${query}` : ''}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as SummaryResponse;
  } catch (error) {
    console.error('Failed to fetch summary', error);
    return null;
  }
}

async function getTransactions(baseUrl: string, filters: DashboardFiltersState): Promise<Transaction[]> {
  try {
    const params = new URLSearchParams();

    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.account) params.set('account', filters.account);
    if (filters.category) params.set('category', filters.category);

    const query = params.toString();
    const response = await fetch(`${baseUrl}/api/list${query ? `?${query}` : ''}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { data?: Transaction[] };
    return payload.data ?? [];
  } catch (error) {
    console.error('Failed to fetch latest transactions', error);
    return [];
  }
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = normalizeFilters(searchParams);
  const baseUrl = await computeBaseUrl();
  const [summary, transactions] = await Promise.all([
    getSummary(baseUrl, filters),
    getTransactions(baseUrl, filters),
  ]);

  const displayedTransactions = transactions.slice(0, 20);
  const accountOptions = Array.from(new Set(transactions.map((transaction) => transaction.account))).filter(Boolean);
  const categoryOptions = Array.from(
    new Set([
      ...(summary?.byCategory ?? []).map((entry) => entry.category),
      ...transactions.map((transaction) => transaction.category ?? ''),
    ])
  ).filter(Boolean);

  const contextLabel = filters.startDate || filters.endDate || filters.account || filters.category ? 'Selected range' : 'All time';
  const budgetSummary = summary?.budgets ?? null;

  const kpis = [
    {
      label: 'Income',
      value: formatCurrency(summary?.totals.income ?? 0),
      caption: `${contextLabel} income`,
    },
    {
      label: 'Expense',
      value: formatCurrency(summary?.totals.expense ?? 0),
      caption: `${contextLabel} spending`,
    },
    {
      label: 'Net balance',
      value: formatCurrency(summary?.totals.net ?? 0),
      caption: `${formatCurrency(summary?.totals.income ?? 0)} in · ${formatCurrency(summary?.totals.expense ?? 0)} out`,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-600">
            Explore interactive filters to drill into Supabase-powered spending summaries.
          </p>
        </header>

        <DashboardFilters
          initialFilters={filters}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
        />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {kpis.map((kpi) => (
            <DashboardKpiCard key={kpi.label} label={kpi.label} value={kpi.value} caption={kpi.caption} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <DailySpendCard data={summary?.byDay ?? []} />
          <CategoryBreakdownChart data={summary?.byCategory ?? []} />
        </section>

        {budgetSummary ? <BudgetStatus summary={budgetSummary} /> : null}

        <TransactionsTable
          transactions={displayedTransactions}
          title="Transactions in view"
          description="Latest matching entries from Supabase. Adjust filters above to refine the feed."
          emptyMessage="No transactions match the selected filters."
        />
      </div>
    </div>
  );
}
