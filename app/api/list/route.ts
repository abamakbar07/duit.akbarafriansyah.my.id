import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase';
import type { Transaction } from '@/types/transaction';

export const dynamic = 'force-dynamic';

interface ListFilters {
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
  limit?: number;
}

function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;

  const limit = Number.parseInt(value, 10);

  if (!Number.isFinite(limit) || limit <= 0) {
    return undefined;
  }

  return Math.min(limit, 100);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters: ListFilters = {
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    account: searchParams.get('account') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    limit: parseLimit(searchParams.get('limit')),
  };

  const supabase = createClient();

  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('date', filters.endDate);
  }

  if (filters.account) {
    query = query.eq('account', filters.account);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query.returns<Transaction[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
