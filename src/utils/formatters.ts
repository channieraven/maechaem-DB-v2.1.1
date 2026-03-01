export function formatDate(
  value: Date | string | number | null | undefined,
  locale = 'th-TH',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumber(
  value: number | null | undefined,
  locale = 'th-TH',
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, options).format(value);
}
