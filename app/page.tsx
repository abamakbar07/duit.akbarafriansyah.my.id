import { headers } from 'next/headers';

import { DailySpendCard } from '@/components/dashboard/daily-spend-card';
import { DashboardKpiCard } from '@/components/dashboard/kpi-card';
import { TransactionsTable } from '@/components/dashboard/transactions-table';
import { QuickLinkButton } from '@/components/quick-link-button';
import { formatCurrency } from '@/lib/currency';
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

async function getSummary(baseUrl: string): Promise<SummaryResponse | null> {
  try {
    const response = await fetch(`${baseUrl}/api/summary`, { cache: 'no-store' });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as SummaryResponse;
  } catch (error) {
    console.error('Failed to fetch summary', error);
    return null;
  }
}

async function getTransactions(baseUrl: string): Promise<Transaction[]> {
  try {
    const response = await fetch(`${baseUrl}/api/list`, { cache: 'no-store' });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { data?: Transaction[] };
    return payload.data?.slice(0, 10) ?? [];
  } catch (error) {
    console.error('Failed to fetch latest transactions', error);
    return [];
  }
}

export default async function Home() {
  const baseUrl = await computeBaseUrl();
  const [summary, transactions] = await Promise.all([getSummary(baseUrl), getTransactions(baseUrl)]);

  const today = new Date().toISOString().slice(0, 10);
  const todayTotals = summary?.byDay.find((day) => day.date === today);
  const todaysSpend = todayTotals?.expense ?? 0;

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRows = summary?.byDay.filter((day) => day.date.startsWith(monthPrefix)) ?? [];
  const monthIncome = monthRows.reduce((total, day) => total + day.income, 0);
  const monthExpense = monthRows.reduce((total, day) => total + day.expense, 0);
  const monthNet = monthIncome - monthExpense;
  const activeDays = monthRows.filter((day) => day.income > 0 || day.expense > 0).length;
  const averageDailySpend = activeDays > 0 ? monthExpense / activeDays : 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonthExpense = averageDailySpend * daysInMonth;
  const topSpendingCategory = [...(summary?.byCategory ?? [])]
    .filter((entry) => entry.expense > 0)
    .sort((a, b) => b.expense - a.expense)[0];

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

  const insights = [
    {
      title: todayTotals ? 'Today at a glance' : 'Waiting for activity',
      description: todayTotals
        ? `You've logged ${formatCurrency(todaysSpend)} in expenses today.`
        : 'No spending captured yet today. Add a transaction to kick things off.',
    },
    {
      title: 'Month-to-date trend',
      description: monthRows.length
        ? `Average daily spend sits at ${formatCurrency(averageDailySpend)} with a projected ${formatCurrency(projectedMonthExpense)} by month end.`
        : 'Once this month has activity, we will chart your daily average and projection.',
    },
    {
      title: 'Top category focus',
      description: topSpendingCategory
        ? `${topSpendingCategory.category} leads expenses at ${formatCurrency(topSpendingCategory.expense)} so far.`
        : 'Track more categories to surface where your rupiah is going.',
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {insights.map((insight) => (
            <div key={insight.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-500">{insight.title}</h2>
              <p className="mt-2 text-sm text-zinc-700">{insight.description}</p>
            </div>
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
