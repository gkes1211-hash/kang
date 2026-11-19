// 건강기능식품 표시·광고 규정 관련 도우미

/** 질병 예방·치료 효과로 읽힐 수 있는 표현 */
export const BANNED_WORDS = ['치료', '낫는', '낫게', '나아', '완치', '예방', '약 대신', '처방', '효능'];

export function findBanned(text: string): string[] {
  return BANNED_WORDS.filter((w) => text.includes(w));
}

export const DISCLAIMER = '이 제품은 질병의 예방 및 치료를 위한 의약품이 아닙니다.';
