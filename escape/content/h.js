// 문제를 짧게 쓰는 도우미
// C(문제, [보기...], 정답 번호, 풀이)        고르기 (정답을 0번에 써도 화면에서는 섞인다)
// X(문제, true/false, 풀이)                 O/X
// N(문제, 정답 숫자, 풀이, 힌트)            숫자 자물쇠
// O(문제, [맞는 순서...], 풀이)             순서대로 놓기
// M(문제, [[왼쪽, 오른쪽], ...], 풀이)      짝 맞추기
// S(문제, [바구니1, 바구니2], [1에 들어갈 것...], [2에 들어갈 것...], 풀이)  나누어 담기
export const C = (q, opts, a = 0, ex = '', hint = '') => ({ type: 'choice', q, opts, a, ex, hint });
export const X = (q, ans, ex = '', hint = '') => ({ type: 'ox', q, ans: !!ans, ex, hint });
export const N = (q, a, ex = '', hint = '') => ({ type: 'number', q, a: String(a), ex, hint });
export const O = (q, items, ex = '', hint = '') => ({ type: 'order', q, items, ex, hint });
export const M = (q, pairs, ex = '', hint = '') => ({ type: 'match', q, pairs, ex, hint });
export const S = (q, bins, a, b, ex = '', hint = '') => ({ type: 'sort', q, bins, items: [...a.map((t) => [t, 0]), ...b.map((t) => [t, 1])], ex, hint });

export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
