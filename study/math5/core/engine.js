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
      if (kept.some((k) => G.sameValue(a.type, k.value, pt.value))) continue; // 값이 같은 패턴은 앞의 것 하나만
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
    if (fallback) { fallback.repeat = true; return fallback; } // 최근에 낸 문제밖에 만들 수 없었다
    throw new Error('문제를 만들지 못했어요: ' + tpl.id);
  }
  M5.makeProblem = makeProblem;

  // 이 문제에 원인(cause)이 같은 오답 패턴이 있는지 (객관식은 보기에 붙은 패턴까지 본다)
  function hasCause(p, cause) {
    return p.patterns.some((pt) => pt.cause === cause)
      || (p.answer.options || []).some((o) => o.pattern && o.pattern.cause === cause);
  }

  // 비슷한 문제 도전 (기획서 3번 6): 같은 틀로 숫자·상황을 바꾼 문제 + 같은 원인의 오답 패턴을 가진 같은 소단원의 다른 틀
  // cause가 없으면(어떤 오답 패턴과도 맞지 않았으면) 모두 같은 틀에서 낸다.
  M5.similarProblems = function (orig, cause, rng, avoidKeys, n = 5) {
    const tpl = M5.templates.find((t) => t.id === orig.tid);
    const sibs = M5.templates.filter((t) => t.sub === orig.sub && t.id !== tpl.id && t.levels[0] <= orig.level);
    const avoid = new Set(avoidKeys || []);
    avoid.add(orig.key);
    const out = [];
    for (let i = 0; i < n; i++) {
      let p = null;
      if (cause && i >= n - 2) {
        for (const t of rng.shuffle(sibs)) {
          for (let k = 0; k < 4 && !p; k++) {
            const q = makeProblem(t, orig.level, rng, avoid);
            if (hasCause(q, cause) && !avoid.has(q.key)) p = q;
          }
          if (p) break;
        }
      }
      if (!p) p = makeProblem(tpl, orig.level, rng, avoid);
      if (avoid.has(p.key)) {
        // 같은 틀로는 새 문제를 더 만들 수 없을 때(문장 종류가 적은 틀): 같은 소단원의 다른 틀에서
        // 같은 원인의 오답 패턴이 있는 틀을 먼저 찾고, 없으면 아무 틀이나
        const order = [...rng.shuffle(sibs.filter((t) => cause && hasCauseTpl(t, cause, orig.level, rng))), ...rng.shuffle(sibs)];
        for (const t of order) {
          const q = makeProblem(t, orig.level, rng, avoid);
          if (!avoid.has(q.key)) { q.simFallback = true; p = q; break; }
        }
      }
      avoid.add(p.key);
      out.push(p);
    }
    return rng.shuffle(out);
  };
  M5.hasCause = hasCause;
  // 이 틀로 만든 문제에 같은 원인의 오답 패턴이 있는지 몇 번 만들어 보고 확인
  function hasCauseTpl(t, cause, level, rng) {
    for (let i = 0; i < 3; i++) if (hasCause(makeProblem(t, level, rng, null), cause)) return true;
    return false;
  }

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

    function pickTemplate(skip) {
      const level = state.levels[lvKey];
      let cand = pool.filter((t) => t.levels[0] <= level);
      if (!cand.length) cand = pool;
      // 최근에 낸 문제밖에 만들 수 없었던 틀은 이번에는 빼기
      if (skip && skip.size) {
        const c = cand.filter((t) => !skip.has(t.id));
        if (c.length) cand = c;
      }

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
        // 약점 자동 갱신 (기획서 7번): 이 아이가 자주 틀린 유형일수록 조금 더 자주 (최대 1.5배)
        const wr = (state.wrong && state.wrong[t.id]) || 0;
        w *= 1 + Math.min(wr, 5) * 0.1;
        return w;
      });
      return rng.weighted(group, weights);
    }

    // 최근에 낸 문제로 기억하기 (무한 모드가 같은 문제를 다시 내지 않게)
    function remember(p) {
      state.recent.push({ key: p.key, tid: p.tid, sub: p.sub, styleName: p.styleName, style: p.style });
      if (state.recent.length > 50) state.recent.splice(0, state.recent.length - 50);
    }

    return {
      scope,
      get level() { return state.levels[lvKey]; },
      next() {
        const avoid = new Set(state.recent.map((x) => x.key));
        const skip = new Set();
        let p = null;
        // 최근 50문제와 같은 문제만 나오는 틀(문장 종류가 적은 O/X 등)이면 다른 틀로 바꿔 본다
        for (let i = 0; i < 6; i++) {
          const tpl = pickTemplate(skip);
          const q = makeProblem(tpl, state.levels[lvKey], rng, avoid);
          if (!p || !q.repeat) p = q;
          if (!q.repeat) break;
          skip.add(tpl.id);
        }
        remember(p);
        last = p;
        return p;
      },
      // 비슷한 문제 5개 (난이도는 바꾸지 않는다)
      similar(orig, cause) {
        const set = M5.similarProblems(orig, cause, rng, state.recent.map((x) => x.key));
        set.forEach(remember);
        return set;
      },
      // 같은 틀로 문제 하나 더 ("문제가 이상해요"로 뺀 도전 문제를 바꿀 때)
      another(orig) {
        const tpl = M5.templates.find((t) => t.id === orig.tid);
        const p = makeProblem(tpl, orig.level, rng, new Set(state.recent.map((x) => x.key)));
        remember(p);
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
      // 아이(어른)가 난이도를 직접 고를 때: 다음 문제부터 이 난이도, 연속 정답·오답 수는 처음부터 다시
      setLevel(n) {
        state.levels[lvKey] = Math.max(1, Math.min(4, Math.round(n)));
        okRun = 0; badRun = 0;
        return state.levels[lvKey];
      },
    };
  };
})();
