import type { Transaction, TransactionPayload, TransactionType, TransactionUpsert } from '@/types/transaction';

const ISO_DATE_LENGTH = 10;

export function parseTransactionDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid transaction date');
  }

  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

export function parseTransactionAmount(value: string | number): number {
  const normalized = typeof value === 'string' ? value.replace(/[_,\s]/g, '') : value;
  const amount = typeof normalized === 'string' ? Number.parseFloat(normalized) : normalized;

  if (!Number.isFinite(amount)) {
    throw new Error('Invalid transaction amount');
  }

  return Math.round(amount * 100) / 100;
}

export function validateTransactionPayload(payload: unknown): TransactionPayload {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Transaction payload must be an object');
  }

  const record = payload as Record<string, unknown>;

  const account = expectNonEmptyString(record.account, 'account');
  const category = expectNonEmptyString(record.category, 'category');
  const type = expectTransactionType(record.type);

  const date = parseTransactionDate(record.date as string | Date);
  const amount = parseTransactionAmount(record.amount as string | number);

  return {
    date,
    account,
    category,
    subcategory: toOptionalString(record.subcategory),
    note: toOptionalString(record.note),
    amount,
    type,
  };
}

export function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  try {
    validateTransactionPayload({
      date: record.date,
      account: record.account,
      category: record.category,
      subcategory: record.subcategory,
      note: record.note,
      amount: record.amount,
      type: record.type,
    });
  } catch {
    return false;
  }

  return typeof record.id === 'string' && typeof record.created_at === 'string';
}

export function normalizeTransactionUpsert(input: TransactionUpsert): TransactionUpsert {
  const payload = validateTransactionPayload(input);

  return {
    ...payload,
    id: 'id' in input && input.id ? String(input.id) : undefined,
  };
}

function expectNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Transaction ${field} must be a non-empty string`);
  }

  return value.trim();
}

function expectTransactionType(value: unknown): TransactionType {
  if (value !== 'expense' && value !== 'income') {
    throw new Error('Transaction type must be "expense" or "income"');
  }

  return value as TransactionType;
}

function toOptionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('Expected optional value to be a string when provided');
  }

  return value.trim();
}
