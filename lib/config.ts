import type { BudgetConfig } from '@/types/budget';

export const budgetConfig: BudgetConfig = {
  currency: 'IDR',
  categories: {
    Groceries: 3_000_000,
    Dining: 1_500_000,
    Transport: 750_000,
    Subscriptions: 600_000,
    Utilities: 1_200_000,
    Entertainment: 800_000,
  },
  accounts: {
    'BCA Debit': 5_000_000,
    'BCA Credit': 4_000_000,
  },
};

export function getBudgetConfig(): BudgetConfig {
  return budgetConfig;
}
