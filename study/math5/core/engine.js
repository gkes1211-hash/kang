// 문제 틀 등록, 문제 만들기, 무한 모드(난이도 조절·골고루 섞기) (기획서 2·6·11번)
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});
  const G = M5.grade;

  M5.LEVELS = ['쉬움', '보통', '어려움', '도전'];
  M5.units = [];
  M5.templates = [];

  M5.addUnit = (u) => { M5.units.push(u); };

  const REQUIRED = ['id', 'unit', 'sub', 'style', 'styleName', 'levels', 'build', 'verify'];
  M5.addTemplates = (list) => {
    for (const t of list) {
      for (const f of REQUIRED) if (t[f] == null) throw new Error(`문제 틀 ${t.id}에 ${f}가 없어요`);
      if (M5.templates.some((x) => x.id === t.id)) throw new Error('문제 틀 이름이 겹쳐요: ' + t.id);
      M5.templates.push(t);
    }
  };

  M5.findSub = (subId) => {
    for (const u of M5.units) for (const s of u.subs) if (s.id === subId) return { unit: u, sub: s };
    return null;
  };

  // 틀이 만든 날것의 문제를 정리한다. 쓸 수 없는 문제면 null.
  // - 객관식 보기를 섞고 정답 위치를 정한다. 보기가 겹치면 버린다.
  // - 오답 패턴 값이 정답과 같으면: soft 패턴은 빼고, 아니면 문제를 버린다. (기획서 9번)
  function finalize(tpl, raw, rng, level) {
    const p = Object.assign({}, raw);
    p.tid = tpl.id;
    p.unit = tpl.unit;
    p.sub = tpl.sub;
    p.style = tpl.style;
    p.styleName = tpl.styleName;
    p.level = level;
    p.answer = Object.assign({}, raw.answer);
    let patterns = (raw.patterns || []).map((pt) => Object.assign({}, pt));
    const a = p.answer;

    if (a.type === 'choice' || a.type === 'multi') {
      a.options = raw.keepOrder ? a.options.slice() : rng.shuffle(a.options);
      const keys = a.options.map((o) => String(o.key != null ? o.key : o.text));
      if (new Set(keys).size !== keys.length) return null;
      const correct = a.options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
      if (a.type === 'choice') {
        if (correct.length !== 1) return null;
        a.value = correct[0];
      } else {
        if (!correct.length || correct.length === a.options.length) return null;
        a.values = correct;
        // 여러 개 고르기의 패턴 값은 보기 key 목록 → 보기 번호 목록으로 바꾼다
        patterns = patterns.map((pt) => Object.assign(pt, {
          value: pt.value.map((k) => keys.indexOf(String(k))).filter((i) => i >= 0),
        }));
      }
    }

    const ans = G.answerValue(a);
    const kept = [];
    for (const pt of patterns) {
      if (Array.isArray(pt.value) && !pt.value.length) continue; // 아무것도 고르지 않은 답은 패턴으로 쓰지 않는다
      if (G.sameValue(a.type, pt.value, ans)) {
        if (pt.soft) continue;
        return null;
      }
      kept.push(pt);
    }
    p.patterns = kept;
    return p;
  }

  // 문제 틀 하나로 문제 하나 만들기. avoid: 피하고 싶은 문제 key 모음 (최근에 낸 문제)
  function makeProblem(tpl, level, rng, avoid) {
    const lv = Math.max(tpl.levels[0], Math.min(level, tpl.levels[1]));
    let fallback = null;
    let rejected = 0;
    for (let i = 0; i < 120; i++) {
      const raw = tpl.build(rng, lv);
      const p = raw ? finalize(tpl, raw, rng, lv) : null;
      if (!p) { rejected++; continue; }
      p.rejected = rejected;
      if (avoid && avoid.has(p.key)) { if (!fallback) fallback = p; continue; }
      return p;
    }
    if (fallback) return fallback;
    throw new Error('문제를 만들지 못했어요: ' + tpl.id);
  }
  M5.makeProblem = makeProblem;

  // 무한 모드 진행
  // scope: { unit: 1, sub: 'u1s4' } (sub가 없으면 단원 전체 섞기)
  M5.createSession = function ({ scope, state, rng }) {
    const pool = M5.templates.filter((t) => t.unit === scope.unit && (!scope.sub || t.sub === scope.sub));
    if (!pool.length) throw new Error('이 범위에는 아직 문제 틀이 없어요');
    const lvKey = scope.sub || 'u' + scope.unit;
    if (!state.levels[lvKey]) state.levels[lvKey] = 1;
    let okRun = 0;
    let badRun = 0;
    let last = null;

    function pickTemplate() {
      const level = state.levels[lvKey];
      let cand = pool.filter((t) => t.levels[0] <= level);
      if (!cand.length) cand = pool;

      const recent = state.recent;
      const prev2 = recent.slice(-2);
      // 같은 문제 스타일이 3번 연속 나오지 않게
      if (prev2.length === 2 && prev2[0].styleName === prev2[1].styleName) {
        const c = cand.filter((t) => t.styleName !== prev2[1].styleName);
        if (c.length) cand = c;
      }
      // 바로 앞 문제와 같은 틀은 피하기
      const prev = recent[recent.length - 1];
      if (prev) {
        const c = cand.filter((t) => t.id !== prev.tid);
        if (c.length) cand = c;
      }
      // 문제집 형식(A) 약 60%, 새로운 유형(B) 약 40%
      const wantA = rng.chance(0.6);
      let group = cand.filter((t) => (t.style === 'A') === wantA);
      if (!group.length) group = cand;

      // 최근에 적게 나온 틀·소단원일수록, 약점 유형일수록 자주
      const tplCount = {};
      const subCount = {};
      for (const x of recent) {
        tplCount[x.tid] = (tplCount[x.tid] || 0) + 1;
        subCount[x.sub] = (subCount[x.sub] || 0) + 1;
      }
      const weights = group.map((t) => {
        let w = 1 / (1 + (tplCount[t.id] || 0));
        if (!scope.sub) w *= 1 / (1 + (subCount[t.sub] || 0) / 4);
        if (t.weak && t.weak.length) w *= 1.5;
        return w;
      });
      return rng.weighted(group, weights);
    }

    return {
      scope,
      get level() { return state.levels[lvKey]; },
      next() {
        const tpl = pickTemplate();
        const avoid = new Set(state.recent.map((x) => x.key));
        const p = makeProblem(tpl, state.levels[lvKey], rng, avoid);
        state.recent.push({ key: p.key, tid: p.tid, sub: p.sub, styleName: p.styleName, style: p.style });
        if (state.recent.length > 50) state.recent.splice(0, state.recent.length - 50);
        last = p;
        return p;
      },
      // 처음 낸 답이 맞았는지 기록하고 난이도를 조절한다. 바뀌면 +1 / -1
      record(ok) {
        let change = 0;
        if (ok) {
          okRun++; badRun = 0;
          if (okRun >= 3) {
            okRun = 0;
            if (state.levels[lvKey] < 4) { state.levels[lvKey]++; change = 1; }
          }
        } else {
          badRun++; okRun = 0;
          if (badRun >= 2) {
            badRun = 0;
            if (state.levels[lvKey] > 1) { state.levels[lvKey]--; change = -1; }
          }
        }
        return change;
      },
      get last() { return last; },
    };
  };
})();
