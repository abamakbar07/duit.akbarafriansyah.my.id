export interface BudgetConfig {
  currency: 'IDR';
  categories: Record<string, number>;
  accounts: Record<string, number>;
}

export interface BudgetCategoryStatus {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  isOverLimit: boolean;
}

export interface BudgetAccountStatus {
  account: string;
  limit: number;
  spent: number;
  remaining: number;
  isOverLimit: boolean;
}

export interface BudgetSummary {
  period: {
    start: string;
    end: string;
  };
  currency: string;
  categories: BudgetCategoryStatus[];
  accounts: BudgetAccountStatus[];
}
