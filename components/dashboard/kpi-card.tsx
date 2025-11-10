import type { ReactNode } from 'react';

export type DashboardKpiCardProps = {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
};

export function DashboardKpiCard({ label, value, caption }: DashboardKpiCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-900">{value}</p>
      {caption ? <p className="mt-1 text-xs text-zinc-500">{caption}</p> : null}
    </div>
  );
}
