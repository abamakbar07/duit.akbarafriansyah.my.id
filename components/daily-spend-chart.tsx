'use client';

import { useMemo } from 'react';

type DailyPoint = {
  date: string;
  income: number;
  expense: number;
};

type Props = {
  data: DailyPoint[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLabel(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DailySpendChart({ data }: Props) {
  const points = useMemo(() => {
    if (!data.length) {
      return null;
    }

    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const maxExpense = sorted.reduce((max, point) => Math.max(max, point.expense), 0);

    if (maxExpense === 0) {
      return {
        sorted,
        maxExpense: 0,
        path: 'M0 100 L100 100',
        area: 'M0 100 L100 100 L100 100 Z',
      } as const;
    }

    const coordinates = sorted.map((point, index) => {
      const x = (index / Math.max(sorted.length - 1, 1)) * 100;
      const y = 100 - (point.expense / maxExpense) * 80 - 10; // keep padding at bottom & top

      return { x, y, expense: point.expense, date: point.date };
    });

    const line = coordinates
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');

    const area =
      `M0 100 ` +
      coordinates
        .map((point, index) => `${index === 0 ? 'L' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ') +
      ` L100 100 Z`;

    return {
      sorted,
      maxExpense,
      coordinates,
      path: line,
      area,
    } as const;
  }, [data]);

  if (!points || !data.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white text-sm text-zinc-500">
        No spending yet this period.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between text-sm text-zinc-500">
        <span>Daily spend</span>
        <span>Peak {formatCurrency(points.maxExpense)}</span>
      </div>
      <svg viewBox="0 0 100 100" className="h-48 w-full">
        <defs>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={points.area} fill="url(#expenseGradient)" stroke="none" />
        <path d={points.path} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.coordinates?.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r={1.2} fill="#b91c1c" />
        ))}
      </svg>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        {points.sorted.map((point) => (
          <div key={point.date} className="flex items-center gap-2">
            <span className="font-medium text-zinc-700">{formatLabel(point.date)}</span>
            <span>{formatCurrency(point.expense)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
