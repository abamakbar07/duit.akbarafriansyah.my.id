import { headers } from 'next/headers';

import { DailySpendCard } from '@/components/dashboard/daily-spend-card';
import { DashboardKpiCard } from '@/components/dashboard/kpi-card';
import { TransactionsTable } from '@/components/dashboard/transactions-table';
import { QuickLinkButton } from '@/components/quick-link-button';
import { formatCurrency } from '@/lib/currency';
import { createClient } from '@/lib/supabase';
import { normalizeCategorySeries, normalizeDailySeries, normalizeTotals } from '@/lib/summary';
import type { AggregateRow } from '@/lib/summary';
import type { Transaction } from '@/types/transaction';

export const dynamic = 'force-dynamic';

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

async function getSummary(): Promise<SummaryResponse | null> {
  try {
    const supabase = createClient();

    const totalsQuery = supabase
      .from('transactions')
      .select('type, total:amount.sum()')
      .returns<AggregateRow[]>();
    const byDayQuery = supabase
      .from('transactions')
      .select('date, type, total:amount.sum()')
      .order('date', { ascending: true })
      .returns<AggregateRow[]>();
    const byCategoryQuery = supabase
      .from('transactions')
      .select('category, type, total:amount.sum()')
      .order('category', { ascending: true })
      .returns<AggregateRow[]>();

    const [totalsResult, byDayResult, byCategoryResult] = await Promise.all([
      totalsQuery,
      byDayQuery,
      byCategoryQuery,
    ]);

    if (totalsResult.error || byDayResult.error || byCategoryResult.error) {
      console.error(
        'Failed to fetch summary',
        totalsResult.error?.message ?? byDayResult.error?.message ?? byCategoryResult.error?.message
      );
      return null;
    }

    return {
      totals: normalizeTotals(totalsResult.data ?? []),
      byDay: normalizeDailySeries(byDayResult.data ?? []),
      byCategory: normalizeCategorySeries(byCategoryResult.data ?? []),
    };
  } catch (error) {
    console.error('Failed to fetch summary', error);
    return null;
  }
}

async function getTransactions(): Promise<Transaction[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch latest transactions', error.message);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error('Failed to fetch latest transactions', error);
    return [];
  }
}

export default async function Home() {
  const baseUrl = await computeBaseUrl();
  const [summary, transactions] = await Promise.all([getSummary(), getTransactions()]);

  const today = new Date().toISOString().slice(0, 10);
  const todayTotals = summary?.byDay.find((day) => day.date === today);
  const todaysSpend = todayTotals?.expense ?? 0;

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRows = summary?.byDay.filter((day) => day.date.startsWith(monthPrefix)) ?? [];
  const monthIncome = monthRows.reduce((total, day) => total + day.income, 0);
  const monthExpense = monthRows.reduce((total, day) => total + day.expense, 0);
  const monthNet = monthIncome - monthExpense;

  const kpis = [
    {
      label: "Today's spend",
      value: formatCurrency(todaysSpend),
      caption: todayTotals ? 'Tracked from Supabase' : 'No transactions today',
    },
    {
      label: 'Month-to-date balance',
      value: formatCurrency(monthNet),
      caption: `${formatCurrency(monthIncome)} in · ${formatCurrency(monthExpense)} out`,
    },
    {
      label: 'Overall cash flow',
      value: formatCurrency(summary?.totals.net ?? 0),
      caption: `${formatCurrency(summary?.totals.income ?? 0)} income vs ${formatCurrency(summary?.totals.expense ?? 0)} spend`,
    },
  ];

  const automationCommands = [
    {
      label: 'Interactive dashboard',
      description: 'Launch the filterable dashboard for deeper dives into recent activity.',
      value: `${baseUrl}/dashboard`,
      href: `${baseUrl}/dashboard`,
    },
    {
      label: 'cURL ingestion',
      description: 'Fire-and-forget POST to /api/add from any automation runner.',
      value: `curl -X POST ${baseUrl}/api/add -H 'Content-Type: application/json' -d '{"date":"${today}","amount":-75000,"category":"Food","account":"Wallet","type":"expense"}'`,
    },
    {
      label: 'Shortcuts trigger',
      description: 'Open the pre-filled Shortcut for quick manual logging on iOS.',
      // Provide an explicit text parameter so Shortcuts receives text input.
      value: 'shortcuts://run-shortcut?name=Log%20Expense&input=text&text=',
      href: 'shortcuts://run-shortcut?name=Log%20Expense&input=text&text=',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-zinc-900">Spending snapshot</h1>
          <p className="text-sm text-zinc-600">
            Automated overview sourced directly from Supabase. No login, no friction — just the numbers you need today.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {kpis.map((kpi) => (
            <DashboardKpiCard key={kpi.label} label={kpi.label} value={kpi.value} caption={kpi.caption} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <DailySpendCard data={summary?.byDay ?? []} />

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Automation</h2>
            <div className="flex flex-col gap-4">
              {automationCommands.map((command) => (
                <QuickLinkButton key={command.label} {...command} />
              ))}
            </div>
          </div>
        </section>

        <TransactionsTable transactions={transactions} />
      </div>
    </div>
  );
}
