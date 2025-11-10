'use client';

import { useMemo } from 'react';

import { formatCurrency } from '@/lib/currency';

type CategoryPoint = {
  category: string;
  income: number;
  expense: number;
};

type CategoryBreakdownChartProps = {
  data: CategoryPoint[];
};

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const prepared = useMemo(() => {
    if (!data.length) {
      return null;
    }

    const sorted = [...data].sort((a, b) => b.expense - a.expense);
    const maxValue = sorted.reduce((max, entry) => Math.max(max, entry.expense, entry.income), 0);

    return { sorted, maxValue } as const;
  }, [data]);

  if (!prepared || !prepared.sorted.length || prepared.maxValue === 0) {
    return (
      <div className="flex h-full min-h-[12rem] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white text-sm text-zinc-500">
        No category activity for this range.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 text-sm font-medium text-zinc-500">Category distribution</div>
      <div className="flex flex-col gap-4">
        {prepared.sorted.map((entry) => (
          <div key={entry.category} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-zinc-800">{entry.category}</span>
              <span className="text-xs text-zinc-500">
                {formatCurrency(entry.expense)} out
                {entry.income > 0 ? ` · ${formatCurrency(entry.income)} in` : ''}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="w-10 shrink-0 text-right text-[11px] uppercase tracking-wide">Out</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-red-100">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{
                      width:
                        entry.expense === 0
                          ? '0%'
                          : `${Math.max((entry.expense / prepared.maxValue) * 100, 4)}%`,
                    }}
                  />
                </div>
                <span className="w-16 text-right font-medium text-red-500">{formatCurrency(entry.expense)}</span>
              </div>
              {entry.income > 0 ? (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="w-10 shrink-0 text-right text-[11px] uppercase tracking-wide">In</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{
                        width:
                          entry.income === 0
                            ? '0%'
                            : `${Math.max((entry.income / prepared.maxValue) * 100, 4)}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-medium text-emerald-600">{formatCurrency(entry.income)}</span>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
