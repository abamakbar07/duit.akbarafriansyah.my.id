const BASE_OPTIONS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
};

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(options?: Intl.NumberFormatOptions) {
  const cacheKey = JSON.stringify(options ?? {});

  if (!formatterCache.has(cacheKey)) {
    formatterCache.set(cacheKey, new Intl.NumberFormat('id-ID', { ...BASE_OPTIONS, ...options }));
  }

  return formatterCache.get(cacheKey)!;
}

export function formatCurrency(value: number, options?: Intl.NumberFormatOptions): string {
  const formatter = getFormatter(options);
  const formatted = formatter.format(Math.abs(value));

  return value < 0 ? `-${formatted}` : formatted;
}
