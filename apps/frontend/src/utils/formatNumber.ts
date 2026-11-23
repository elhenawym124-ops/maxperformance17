export const NUMBER_LOCALE = 'ar-EG';

export function formatNumber(
  v: number | null | undefined,
  maxFractionDigits?: number,
): string;
export function formatNumber(
  v: number | null | undefined,
  opts: { maxFractionDigits?: number },
): string;
export function formatNumber(
  v: number | null | undefined,
  maxFractionDigitsOrOpts: number | { maxFractionDigits?: number } = 0,
): string {
  if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) {
    return '—';
  }
  const num = typeof v === 'number' ? v : Number(v);
  if (isNaN(num)) {
    return '—';
  }
  const maxFractionDigits =
    typeof maxFractionDigitsOrOpts === 'number'
      ? maxFractionDigitsOrOpts
      : (maxFractionDigitsOrOpts?.maxFractionDigits ?? 0);

  return new Intl.NumberFormat(NUMBER_LOCALE, {
    maximumFractionDigits: maxFractionDigits,
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
  const clamped = Math.min(100, Math.max(0, num));
  return `${new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 1 }).format(clamped)}٪`;
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
  if (numerator < 0) {
    return formatPercent(0);
  }
  if (numerator > denominator) {
    return formatPercent(100);
  }
  return formatPercent((numerator / denominator) * 100);
}
