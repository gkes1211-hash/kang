// 날짜 도우미. 저장은 'YYYY-MM-DD', 화면 표시는 '2026.11.19'

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateOnly(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): string {
  return toDateOnly(new Date());
}

export function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, days: number): string {
  const d = parseDateOnly(s);
  d.setDate(d.getDate() + days);
  return toDateOnly(d);
}

/** b - a (일) */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDateOnly(b).getTime() - parseDateOnly(a).getTime()) / 86400000);
}

/** '2026-11-19' → '2026.11.19' */
export function fmtDate(s?: string): string {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${y}.${m}.${d}`;
}

/** 생일은 연도 없이 '11.19' 처럼 보여 줄 때도 있음 */
export function fmtMonthDay(s?: string): string {
  if (!s) return '';
  const [, m, d] = s.split('-');
  return `${m}.${d}`;
}

/** 다음 연락일을 오늘 기준으로 쉬운 말로 */
export function relativeLabel(s: string): string {
  const diff = daysBetween(today(), s);
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  if (diff > 0) return `${diff}일 뒤`;
  return `${-diff}일 지남`;
}
