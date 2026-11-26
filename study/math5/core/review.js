// 오늘의 복습 (기획서 7번)
// 틀렸던 유형은 틀린 날로부터 1일, 7일, 30일 뒤에 같은 틀의 새 문제로 다시 나온다.
// 복습에서 3번 연속 맞히면 "완전히 익힌 유형"이 된다. 복습에서 다시 틀리면 그날부터 다시 시작한다.
// 날짜는 모두 'YYYY-MM-DD' 글자 (그 노트북의 날짜)
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});
  const DAYS = [1, 7, 30];

  function addDays(date, k) {
    const [y, m, d] = date.split('-').map(Number);
    const t = new Date(y, m - 1, d + k);
    const p = (x) => String(x).padStart(2, '0');
    return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
  }
  const max = (a, b) => (a > b ? a : b);

  function ensure(state) {
    if (!state.review) state.review = {};
    if (!state.mastered) state.mastered = {};
  }

  // 유형을 틀렸을 때 (무한 모드·도전·복습에서): 그날부터 다시 1일·7일·30일
  function markWrong(state, p, today) {
    ensure(state);
    delete state.mastered[p.tid];
    state.review[p.tid] = {
      tid: p.tid, unit: p.unit, sub: p.sub, level: p.level,
      wrongDate: today, stage: 0, due: addDays(today, DAYS[0]),
    };
  }

  // 오늘 복습할 유형 (날짜가 지난 것도 포함, 오래된 것부터)
  function dueList(state, today) {
    ensure(state);
    return Object.values(state.review).filter((x) => x.due <= today).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
  }

  // 복습 문제를 처음에 맞혔는지 기록. 결과: { mastered, next, stage }
  function answered(state, tid, ok, today) {
    ensure(state);
    const x = state.review[tid];
    if (!x) return { mastered: false, next: null, stage: 0 };
    if (!ok) {
      x.wrongDate = today; x.stage = 0; x.due = addDays(today, DAYS[0]);
      return { mastered: false, next: x.due, stage: 0 };
    }
    x.stage++;
    if (x.stage >= DAYS.length) {
      delete state.review[tid];
      state.mastered[tid] = today;
      return { mastered: true, next: null, stage: x.stage };
    }
    // 틀린 날로부터 7일, 30일 뒤. 복습이 늦어졌으면 적어도 내일
    x.due = max(addDays(x.wrongDate, DAYS[x.stage]), addDays(today, 1));
    return { mastered: false, next: x.due, stage: x.stage };
  }

  const stageName = (stage) => `${DAYS[stage]}일 복습`;

  M5.review = { DAYS, addDays, markWrong, dueList, answered, stageName, ensure };
})();
