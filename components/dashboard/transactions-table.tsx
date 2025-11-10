import { formatCurrency } from '@/lib/currency';
import type { Transaction } from '@/types/transaction';

type TransactionsTableProps = {
  transactions: Transaction[];
  title?: string;
  description?: string;
  emptyMessage?: string;
};

export function TransactionsTable({
  transactions,
  title = 'Latest transactions',
  description = 'Most recent activity synced via public API.',
  emptyMessage = 'No transactions recorded yet.',
}: TransactionsTableProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <p className="text-sm text-zinc-500">{description}</p>
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
                  {emptyMessage}
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
  );
}
