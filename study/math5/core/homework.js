// 문제집 오답 연습 (사진으로 받은 문제)
//   부모님이 문제집 사진을 Claude에게 올리면, Claude가 문제를 읽고 homework/sets.js 에 "오답 세트"를 하나 추가해요.
//   세트 하나 = 사진 속 문제 1개 + (틀린 문제) 왜 틀렸는지 / (모르는 문제) 풀이 + 같은 유형 연습 문제.
//   연습 문제는 앱의 검증된 문제 틀(tid)을 먼저 쓰고, 맞는 틀이 없으면 세트에 직접 적은 문제(custom)를 써요.
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});

  M5.homework = [];
  const KINDS = { wrong: '틀린 문제', unknown: '모르는 문제' };
  const CAUSES = ['concept', 'calc', 'condition', 'form'];
  const GOAL = 4; // 연습에서 처음에 맞힌 문제가 연속으로 이만큼이면 "알고 넘어가기" 완료

  function fail(h, msg) { throw new Error(`오답 세트 ${h && h.id}: ${msg}`); }

  M5.addHomework = (list) => {
    for (const h of list) {
      for (const f of ['id', 'date', 'source', 'kind', 'sub', 'problem', 'solution', 'hints', 'practice']) if (h[f] == null) fail(h, `${f}가 없어요`);
      if (!KINDS[h.kind]) fail(h, 'kind는 wrong 또는 unknown이에요');
      if (!M5.findSub(h.sub)) fail(h, '소단원 이름이 틀렸어요: ' + h.sub);
      if (!h.problem.text || !h.problem.answer) fail(h, '문제 글과 정답이 있어야 해요');
      // 틀린 문제: 아이가 쓴 답이 사진에 있으면 diagnosis(왜 틀렸는지) 하나,
      //   답이 남아 있지 않으면(다른 곳에 풀었을 때) mistakes(이 문제에서 자주 하는 실수 목록)로 앱에서 다시 풀 때 원인을 찾는다
      const okD = (d) => d && CAUSES.includes(d.cause) && d.title && d.msg;
      if (h.kind === 'wrong' && h.childAnswer != null && !okD(h.diagnosis)) fail(h, '아이가 쓴 답이 있으면 diagnosis(cause, title, msg)가 있어야 해요');
      if (h.kind === 'wrong' && h.childAnswer == null && !(Array.isArray(h.mistakes) && h.mistakes.length >= 2 && h.mistakes.every((m) => okD(m) && m.value != null))) fail(h, '아이 답이 없는 틀린 문제에는 자주 하는 실수(mistakes) 2개 이상이 있어야 해요');
      if (!Array.isArray(h.hints) || h.hints.length !== 3) fail(h, '힌트는 3단계예요');
      if (!h.practice.length) fail(h, '연습 문제가 없어요');
      for (const it of h.practice) {
        if (it.tid && !M5.templates.find((t) => t.id === it.tid)) fail(h, '없는 문제 틀: ' + it.tid);
        if (!it.tid && !it.custom) fail(h, '연습 문제는 tid 또는 custom이 있어야 해요');
      }
      if (M5.homework.some((x) => x.id === h.id)) fail(h, '세트 이름이 겹쳐요');
      M5.homework.push(h);
    }
  };

  // 사진 속 문제를 앱에서 풀 수 있는 문제로
  function original(h) {
    const info = M5.findSub(h.sub);
    const pats = [];
    if (h.kind === 'wrong' && h.childValue != null) pats.push({ value: h.childValue, cause: h.diagnosis.cause, title: h.diagnosis.title, msg: h.diagnosis.msg });
    for (const m of h.mistakes || []) pats.push({ value: m.value, cause: m.cause, title: m.title, msg: m.msg });
    return {
      tid: 'hw:' + h.id, unit: info.unit.id, sub: h.sub, style: 'A', styleName: '내 문제집 문제', level: 1,
      text: h.problem.text, figure: h.problem.figure || null, answer: Object.assign({}, h.problem.answer),
      patterns: pats, hints: h.hints, solution: h.solution, key: 'hw:' + h.id,
    };
  }

  // 연습 문제를 차례대로 (틀 → 새 숫자로, custom → 적힌 문제를 돌아가며)
  function practiceMaker(h, rng, avoidKeys) {
    const used = new Set(avoidKeys || []);
    let i = r0(h, rng);
    return {
      next() {
        const it = h.practice[i % h.practice.length];
        i++;
        if (it.tid) {
          const tpl = M5.templates.find((t) => t.id === it.tid);
          const lv = Math.max(tpl.levels[0], Math.min(it.level || 1, tpl.levels[1]));
          const p = M5.makeProblem(tpl, lv, rng, used);
          used.add(p.key);
          return p;
        }
        const info = M5.findSub(it.custom.sub || h.sub);
        const k = h.practice.indexOf(it);
        return Object.assign({ unit: info.unit.id, sub: info.sub.id, style: 'A', styleName: '같은 유형 문제', level: 1, patterns: [] }, it.custom, {
          tid: `hw:${h.id}:${k}`, key: `hw:${h.id}:${k}`, answer: Object.assign({}, it.custom.answer),
        });
      },
    };
  }
  const r0 = (h, rng) => rng.int(0, h.practice.length - 1);

  // 세트 진행 상태 (state.hw[id])
  function stateOf(state, id) {
    if (!state.hw) state.hw = {};
    return state.hw[id] || (state.hw[id] = { status: 'new', streak: 0, best: 0, solved: 0, correct: 0, stage: 0, due: '' });
  }
  // 오늘 다시 확인할 세트 (완료한 세트는 1일·7일·30일 뒤에 문제 2개로 다시 확인)
  function dueSets(state, today) {
    return M5.homework.filter((h) => { const s = state.hw && state.hw[h.id]; return s && s.status === 'done' && s.due && s.due <= today; });
  }

  M5.hw = { KINDS, GOAL, original, practiceMaker, stateOf, dueSets };
})();
