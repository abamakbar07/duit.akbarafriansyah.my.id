export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  account: string;
  category: string;
  subcategory: string | null;
  note: string | null;
  amount: number;
  type: TransactionType;
  created_at: string; // ISO timestamp
}

export type TransactionPayload = Omit<Transaction, 'id' | 'created_at'>;

export type TransactionUpsert = TransactionPayload & Partial<Pick<Transaction, 'id'>>;
