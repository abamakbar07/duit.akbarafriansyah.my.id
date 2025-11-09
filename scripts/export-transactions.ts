import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createClient } from '@/lib/supabase';
import type { Transaction } from '@/types/transaction';

function formatTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[:]/g, '-');
}

function formatCsvValue(value: Transaction[keyof Transaction]): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = typeof value === 'string' ? value : String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function transactionsToCsv(transactions: Transaction[]): string {
  const headers: (keyof Transaction)[] = [
    'id',
    'date',
    'account',
    'category',
    'subcategory',
    'note',
    'amount',
    'type',
    'created_at',
  ];

  const headerRow = headers.join(',');
  const rows = transactions.map((transaction) =>
    headers.map((header) => formatCsvValue(transaction[header])).join(',')
  );

  return [headerRow, ...rows].join('\n');
}

async function main(): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  const transactions: Transaction[] = data ?? [];

  const outputDirectory = path.join(process.cwd(), 'public', 'backups');
  await mkdir(outputDirectory, { recursive: true });

  const timestamp = formatTimestamp();
  const baseFilePath = path.join(outputDirectory, timestamp);

  const jsonFile = `${baseFilePath}.json`;
  const csvFile = `${baseFilePath}.csv`;

  await writeFile(jsonFile, JSON.stringify(transactions, null, 2), 'utf8');
  await writeFile(csvFile, transactionsToCsv(transactions), 'utf8');

  console.log(
    `Exported ${transactions.length} transactions to:\n- ${jsonFile}\n- ${csvFile}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
