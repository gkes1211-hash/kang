// 학습 기록 저장 (이 노트북의 브라우저 안, localStorage)
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});
  const KEY = 'math5-v1';

  function fresh() {
    return {
      v: 1,
      levels: {},   // 소단원(또는 단원 전체)별 난이도 1~4
      recent: [],   // 최근에 낸 문제 50개
      today: { date: '', solved: 0, correct: 0, streak: 0, best: 0, passed: 0 },
      stats: {},    // 소단원·단원별 { s: 푼 문제, c: 처음에 맞힌 문제 }
      reports: [],  // "문제가 이상해요"로 저장한 문제
      stamps: {},   // 유형(틀)별 받은 "이 유형 통과" 도장 { 틀 이름: { n: 받은 수, last: 날짜 } }
      retry: [],    // "다음에 다시 도전" 목록 [{ tid, sub, styleName, level, at }]
      wrong: {},    // 유형(틀)별 틀린 횟수 (자주 틀리는 유형, 복습에 쓴다)
      causes: { actual: {}, self: {}, compared: 0, matched: 0 }, // 틀린 원인과 "어디서 틀렸을까" 고른 결과
    };
  }

  function todayStr() {
    const d = new Date();
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function load() {
    const base = fresh();
    try {
      const raw = globalThis.localStorage && localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        for (const k of Object.keys(base)) if (saved[k] != null) base[k] = saved[k];
      }
    } catch (e) { /* 저장소를 못 쓰면 새로 시작 */ }
    ensureToday(base);
    return base;
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장 실패는 조용히 넘어간다 */ }
  }

  function ensureToday(state) {
    const t = todayStr();
    if (state.today.date !== t) state.today = { date: t, solved: 0, correct: 0, streak: 0, best: 0, passed: 0 };
    if (state.today.passed == null) state.today.passed = 0;
  }

  function bump(state, key, ok, sign = 1) {
    const s = state.stats[key] || (state.stats[key] = { s: 0, c: 0 });
    s.s += sign;
    if (ok) s.c += sign;
  }

  M5.store = { load, save, ensureToday, bump, fresh, todayStr };
})();
