import dynamic from 'next/dynamic';
import { headers } from 'next/headers';

import { QuickLinkButton } from '@/components/quick-link-button';
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

const DailySpendChart = dynamic(() => import('@/components/daily-spend-chart'), {
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white text-sm text-zinc-500">
      Loading trend...
    </div>
  ),
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 100 ? 2 : 0,
  }).format(value);
}

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
      label: 'cURL ingestion',
      description: 'Fire-and-forget POST to /api/add from any automation runner.',
      value: `curl -X POST ${baseUrl}/api/add -H 'Content-Type: application/json' -d '{"date":"${today}","amount":-12000,"category":"Food","account":"Wallet","type":"expense"}'`,
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
            <div key={kpi.label} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">{kpi.label}</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{kpi.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{kpi.caption}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <DailySpendChart data={summary?.byDay ?? []} />

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Automation</h2>
            <div className="flex flex-col gap-4">
              {automationCommands.map((command) => (
                <QuickLinkButton key={command.label} {...command} />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Latest transactions</h2>
              <p className="text-sm text-zinc-500">Most recent activity synced via public API.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Account</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-zinc-500">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4 align-middle text-zinc-600">
                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                            {transaction.category}
                          </span>
                          {transaction.subcategory && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                              {transaction.subcategory}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-zinc-600">{transaction.account}</td>
                      <td className="px-6 py-4 align-middle text-right font-medium text-zinc-900">
                        <span className={transaction.type === 'expense' ? 'text-red-500' : 'text-emerald-600'}>
                          {transaction.type === 'expense' ? '-' : '+'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
