import { NextResponse } from 'next/server';

import { fetchBudgetSummary } from '@/lib/budgets';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function dispatchWebhook(payload: unknown) {
  const webhookUrl = process.env.BUDGET_NOTIFY_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to dispatch budget webhook', error);
  }
}

export async function GET() {
  const supabase = createClient();

  try {
    const budgets = await fetchBudgetSummary(supabase);

    if (!budgets) {
      return NextResponse.json({
        status: 'disabled',
        message: 'No budgets configured. Update lib/config.ts to enable alerts.',
      });
    }

    const overspentCategories = budgets.categories.filter((category) => category.isOverLimit);
    const overspentAccounts = budgets.accounts.filter((account) => account.isOverLimit);
    const hasOverspend = overspentCategories.length > 0 || overspentAccounts.length > 0;

    if (hasOverspend) {
      console.warn('[budget] Overspend detected', {
        overspentCategories,
        overspentAccounts,
      });

      await dispatchWebhook({
        type: 'budget-overspend',
        period: budgets.period,
        currency: budgets.currency,
        overspentCategories,
        overspentAccounts,
      });
    }

    return NextResponse.json({
      status: hasOverspend ? 'alert' : 'ok',
      budgets,
      overspentCategories,
      overspentAccounts,
      hasOverspend,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to evaluate budgets';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
