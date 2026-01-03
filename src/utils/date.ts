/**
 * 日付フォーマット用のユーティリティ関数
 */

/**
 * 日付を指定されたロケールでフォーマット
 */
export function formatDate(date: Date, locale: string = 'ja-JP', options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return date.toLocaleDateString(locale, options || defaultOptions);
}

/**
 * 日付を月のみでフォーマット（ポートフォリオ用）
 */
export function formatDateMonthOnly(date: Date, locale: string = 'ja-JP'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
  });
}
