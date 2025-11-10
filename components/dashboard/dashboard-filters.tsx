'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type DashboardFiltersState = {
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
};

type DashboardFiltersProps = {
  initialFilters: DashboardFiltersState;
  accountOptions: string[];
  categoryOptions: string[];
};

export function DashboardFilters({ initialFilters, accountOptions, categoryOptions }: DashboardFiltersProps) {
  const [filters, setFilters] = useState<DashboardFiltersState>(initialFilters);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const sortedAccounts = useMemo(() => accountOptions.filter(Boolean).sort((a, b) => a.localeCompare(b)), [accountOptions]);
  const sortedCategories = useMemo(() => categoryOptions.filter(Boolean).sort((a, b) => a.localeCompare(b)), [categoryOptions]);

  function handleChange(event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  }

  function applyFilters(next: DashboardFiltersState) {
    const params = new URLSearchParams(searchParams.toString());

    for (const key of ['startDate', 'endDate', 'account', 'category'] as const) {
      const value = next[key];

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      applyFilters(filters);
    });
  }

  function handleReset() {
    const cleared = {} as DashboardFiltersState;
    setFilters(cleared);

    startTransition(() => {
      applyFilters(cleared);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="startDate" className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Start date
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          value={filters.startDate ?? ''}
          onChange={handleChange}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="endDate" className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          End date
        </label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          value={filters.endDate ?? ''}
          onChange={handleChange}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="account" className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Account
        </label>
        <select
          id="account"
          name="account"
          value={filters.account ?? ''}
          onChange={handleChange}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">All accounts</option>
          {sortedAccounts.map((account) => (
            <option key={account} value={account}>
              {account}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={filters.category ?? ''}
          onChange={handleChange}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">All categories</option>
          {sortedCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2 lg:col-span-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
            disabled={isPending}
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            disabled={isPending}
          >
            {isPending ? 'Updating…' : 'Apply filters'}
          </button>
        </div>
      </div>
    </form>
  );
}
