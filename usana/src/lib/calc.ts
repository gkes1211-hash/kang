import { addDays } from './date';

/**
 * 소진 예정일 = 구매일 + (1통 섭취 기간 × 수량 ÷ 섭취 인원)
 * 나누어 떨어지지 않으면 내림 (하루라도 일찍 연락하도록)
 */
export function calcRunOutDate(purchaseDate: string, daysPerUnit: number, quantity: number, people: number): string {
  const days = Math.floor((daysPerUnit * quantity) / Math.max(1, people));
  return addDays(purchaseDate, days);
}

export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/** '45,000' 같은 입력에서 숫자만 꺼냄 */
export const toNumber = (s: string) => Number(s.replace(/[^0-9]/g, '')) || 0;
