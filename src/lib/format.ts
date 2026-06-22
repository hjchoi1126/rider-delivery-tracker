export const FormatCurrencyLogic = (value: number): string =>
  new Intl.NumberFormat('ko-KR').format(value);

export const FormatWonLogic = (value: number): string => `₩${FormatCurrencyLogic(value)}`;

export const CalcPercentLogic = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0;
