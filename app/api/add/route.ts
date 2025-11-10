import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase';
import { validateTransactionPayload } from '@/lib/transactions';
import type { Transaction } from '@/types/transaction';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let payload;

  try {
    const body = await request.json();
    payload = validateTransactionPayload(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select()
    .single<Transaction>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
