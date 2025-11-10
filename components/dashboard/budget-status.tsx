import { formatCurrency } from '@/lib/currency';
import type { BudgetAccountStatus, BudgetCategoryStatus, BudgetSummary } from '@/types/budget';

interface BudgetStatusProps {
  summary: BudgetSummary;
}

function BudgetListItem({
  label,
  spent,
  limit,
  remaining,
  isOverLimit,
}: {
  label: string;
  spent: number;
  limit: number;
  remaining: number;
  isOverLimit: boolean;
}) {
  const limitSafe = limit > 0 ? limit : 1;
  const progress = Math.min((spent / limitSafe) * 100, 100);
  const barColor = isOverLimit ? 'bg-rose-500' : 'bg-emerald-500';
  const stateColor = isOverLimit ? 'text-rose-600' : 'text-emerald-600';
  const remainingLabel = isOverLimit
    ? `Over by ${formatCurrency(Math.abs(remaining))}`
    : `${formatCurrency(remaining)} left`;

  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border p-4 shadow-sm transition-colors ${
        isOverLimit ? 'border-rose-200 bg-rose-50' : 'border-zinc-200 bg-white'
      }`}
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">{label}</p>
          <p className="text-xs text-zinc-500">
            {formatCurrency(spent)} spent of {formatCurrency(limit)} limit
          </p>
        </div>
        <span className={`text-xs font-semibold ${stateColor}`}>{remainingLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full ${barColor}`} style={{ width: `${progress}%` }} />
      </div>
      {isOverLimit ? (
        <p className="text-xs text-rose-600">
          Overspent by {formatCurrency(Math.abs(remaining))}. Consider pausing or redirecting new expenses.
        </p>
      ) : null}
    </li>
  );
}

function BudgetSection({
  title,
  items,
  getLabel,
}: {
  title: string;
  items: Array<BudgetCategoryStatus | BudgetAccountStatus>;
  getLabel: (item: BudgetCategoryStatus | BudgetAccountStatus) => string;
}) {
  if (!items.length) {
    return null;
  }

  const sortedItems = [...items].sort((a, b) => {
    if (a.isOverLimit === b.isOverLimit) {
      return b.spent - a.spent;
    }

    return a.isOverLimit ? -1 : 1;
  });

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">{title}</h3>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sortedItems.map((item) => (
          <BudgetListItem
            key={getLabel(item)}
            label={getLabel(item)}
            spent={item.spent}
            limit={item.limit}
            remaining={item.remaining}
            isOverLimit={item.isOverLimit}
          />
        ))}
      </ul>
    </div>
  );
}

export function BudgetStatus({ summary }: BudgetStatusProps) {
  const hasCategories = summary.categories.length > 0;
  const hasAccounts = summary.accounts.length > 0;

  if (!hasCategories && !hasAccounts) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900">Budget status</h2>
          <p className="text-xs text-zinc-500">
            Monitoring spend in {summary.currency} from {summary.period.start} to {summary.period.end}.
          </p>
        </div>
        <div className="flex flex-col gap-8">
          <BudgetSection
            title="Categories"
            items={summary.categories}
            getLabel={(item) => ('category' in item ? item.category : 'Unknown')}
          />
          <BudgetSection
            title="Accounts"
            items={summary.accounts}
            getLabel={(item) => ('account' in item ? item.account : 'Unknown')}
          />
        </div>
      </div>
    </section>
  );
}
