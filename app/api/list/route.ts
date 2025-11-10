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

  const supabase = createClient();

  let query = supabase
    .from('transactions')
    .select('*')
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

  const { data, error } = await query.returns<Transaction[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
