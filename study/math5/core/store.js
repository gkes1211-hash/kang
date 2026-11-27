// 학습 기록 저장 (기획서 15번: 이 노트북의 브라우저 안 localStorage + 백업 내보내기/불러오기)
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});
  const KEY = 'math5-v1';
  const APP = 'math5';

  function fresh() {
    return {
      v: 1,
      levels: {},   // 소단원(또는 단원 전체)별 난이도 1~4
      recent: [],   // 최근에 낸 문제 50개
      today: { date: '', solved: 0, correct: 0, streak: 0, best: 0, passed: 0 },
      days: {},     // 날짜별 { s: 푼 문제, c: 처음에 맞힌 문제, p: 통과한 유형 }
      stats: {},    // 소단원·단원별 { s: 푼 문제, c: 처음에 맞힌 문제 }
      reports: [],  // "문제가 이상해요"로 저장한 문제
      stamps: {},   // 유형(틀)별 "이 유형 통과" 도장 { 틀 이름: { n: 받은 수, last: 날짜 } }
      retry: [],    // "다음에 다시 도전" 목록 [{ tid, sub, styleName, level, at }]
      wrong: {},    // 유형(틀)별 틀린 횟수 (자주 틀리는 유형, 약점 자동 갱신)
      causes: { actual: {}, self: {}, compared: 0, matched: 0 }, // 실제 틀린 원인과 "어디서 틀렸을까" 고른 결과
      review: {},   // 오늘의 복습 일정 { 틀 이름: { tid, unit, sub, level, wrongDate, stage, due } }
      mastered: {}, // 완전히 익힌 유형 { 틀 이름: 날짜 }
      settings: { mode: 'endless' }, // endless(무한) | set10(10문제)
      hw: {},       // 문제집 오답 연습 세트별 진행 { 세트 이름: { status, streak, best, solved, correct, stage, due, doneAt, mastered } }
    };
  }

  function todayStr(d = new Date()) {
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  // 저장된 값을 새 형식에 맞춰 채운다 (예전 기록에 없는 칸은 기본값)
  function normalize(saved) {
    const base = fresh();
    if (!saved || typeof saved !== 'object') return base;
    for (const k of Object.keys(base)) {
      if (saved[k] == null) continue;
      if (Array.isArray(base[k])) base[k] = Array.isArray(saved[k]) ? saved[k] : base[k];
      else if (typeof base[k] === 'object') base[k] = Object.assign({}, base[k], saved[k]);
      else base[k] = saved[k];
    }
    return base;
  }

  let lastSaveOk = true;
  function load() {
    let st = fresh();
    try {
      const raw = globalThis.localStorage && localStorage.getItem(KEY);
      if (raw) st = normalize(JSON.parse(raw));
    } catch (e) { /* 저장소를 못 쓰면 새로 시작 */ }
    ensureToday(st);
    return st;
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); lastSaveOk = true; } catch (e) { lastSaveOk = false; }
    return lastSaveOk;
  }
  const saveOk = () => lastSaveOk;

  // 브라우저가 공간이 부족할 때 기록을 지우지 않도록 "계속 보관"을 요청한다 (지원하는 브라우저만)
  function askPersist() {
    try {
      if (globalThis.navigator && navigator.storage && navigator.storage.persist) return navigator.storage.persist().catch(() => false);
    } catch (e) { /* 무시 */ }
    return Promise.resolve(false);
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
  // 날짜별 기록
  function bumpDay(state, field, sign = 1, date = todayStr()) {
    const d = state.days[date] || (state.days[date] = { s: 0, c: 0, p: 0 });
    d[field] = (d[field] || 0) + sign;
  }

  // ---------- 백업 내보내기 / 불러오기 ----------
  function exportText(state) {
    return JSON.stringify({ app: APP, v: 1, exportedAt: new Date().toISOString(), state }, null, 1);
  }
  // 백업 글자를 읽어 기록으로. 잘못된 파일이면 오류
  function importText(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { throw new Error('백업 파일을 읽을 수 없어요. 이 앱에서 내보낸 파일인지 확인해 주세요.'); }
    if (!obj || obj.app !== APP || !obj.state || obj.state.v !== 1) throw new Error('이 앱의 백업 파일이 아니에요.');
    const st = normalize(obj.state);
    ensureToday(st);
    return { state: st, exportedAt: obj.exportedAt || '' };
  }
  // 백업 요약 (불러오기 전에 보여 준다)
  function summary(state) {
    // 단원별 기록(u1, u2 …)을 더하면 지금까지 푼 문제 수
    const solved = Object.entries(state.stats || {}).filter(([k]) => /^u\d+$/.test(k)).reduce((s, [, v]) => s + (v.s || 0), 0);
    return {
      solved,
      days: Object.keys(state.days || {}).length,
      stamps: Object.keys(state.stamps || {}).length,
      mastered: Object.keys(state.mastered || {}).length,
      review: Object.keys(state.review || {}).length,
    };
  }

  M5.store = { load, save, saveOk, ensureToday, bump, bumpDay, fresh, todayStr, normalize, askPersist, exportText, importText, summary, KEY };
})();
