import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase';
import type { Transaction } from '@/types/transaction';

export const dynamic = 'force-dynamic';

interface ListFilters {
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters: ListFilters = {
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    account: searchParams.get('account') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  };

  const pageSize = Math.max(Number(searchParams.get('pageSize')) || 50, 1);
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const rangeStart = (page - 1) * pageSize;
  const rangeEnd = rangeStart + pageSize - 1;

  const supabase = createClient();

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

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

  const { data, error, count } = await query
    .limit(pageSize)
    .range(rangeStart, rangeEnd)
    .returns<Transaction[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    total: count ?? 0,
    page,
    pageSize,
  });
}
