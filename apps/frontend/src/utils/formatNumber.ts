export const NUMBER_LOCALE = 'ar-EG';

export function formatNumber(
  v: number | null | undefined,
  opts?: { maxFractionDigits?: number },
): string {
  if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) {
    return '—';
  }
  const num = typeof v === 'number' ? v : Number(v);
  if (isNaN(num)) {
    return '—';
  }
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    maximumFractionDigits: opts?.maxFractionDigits ?? 0,
  }).format(num);
}

export function formatCurrency(
  v: number | null | undefined,
  symbol = 'ج.م',
): string {
  if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) {
    return '—';
  }
  const num = typeof v === 'number' ? v : Number(v);
  if (isNaN(num)) {
    return '—';
  }
  return `${formatNumber(num)} ${symbol}`;
}

export function formatPercent(v: number | null | undefined): string {
  if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) {
    return '—';
  }
  const num = typeof v === 'number' ? v : Number(v);
  if (isNaN(num)) {
    return '—';
  }
  const maxFractionDigits = Number.isInteger(num) ? 0 : 1;
  return `${formatNumber(num, { maxFractionDigits })}%`;
}

export function formatRatio(numerator: number, denominator: number): string {
  if (
    denominator === null ||
    denominator === undefined ||
    isNaN(denominator) ||
    denominator <= 0
  ) {
    return '—';
  }
  if (numerator === null || numerator === undefined || isNaN(numerator)) {
    return '—';
  }
  if (numerator > denominator) {
    return `${formatNumber(numerator)} من ${formatNumber(denominator)}`;
  }
  return formatPercent(Math.round((numerator / denominator) * 1000) / 10);
}
