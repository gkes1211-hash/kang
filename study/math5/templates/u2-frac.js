// 2단원 분수의 곱셈 — (분수)×(자연수) / (자연수)×(분수) / 진분수의 곱셈 / (대분수)×(대분수) (세 분수의 곱셈 포함)
//
// 분수는 M5.frac으로 분자·분모 정수 계산만 한다. 문장 속 분수는 ⟪2 3/4⟫ 표시로 쓰면 화면에 위아래로 쌓여 보인다.
// verify는 만드는 쪽과 다른 방법(소수 Number 계산, 하나씩 해 보기)으로 정답을 다시 확인한다.
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const F = M5.frac, T = M5.text, W = M5.words;
  const j = T.j;

  M5.addUnit({
    id: 2,
    name: '분수의 곱셈',
    subs: [
      { id: 'u2s1', name: '(분수)×(자연수)', concept: '분수에 자연수를 곱할 때는 분모는 그대로 두고 분자에 자연수를 곱해요.\n예) ⟪2/5⟫ × 3 = ⟪6/5⟫ = ⟪1 1/5⟫\n대분수는 가분수로 바꾼 다음 곱해요.\n예) ⟪1 1/3⟫ × 2 = ⟪4/3⟫ × 2 = ⟪8/3⟫ = ⟪2 2/3⟫\n답은 기약분수로, 가분수는 대분수로 나타내요.' },
      { id: 'u2s2', name: '(자연수)×(분수)', concept: '자연수에 분수를 곱할 때도 분모는 그대로 두고 자연수와 분자를 곱해요.\n예) 6 × ⟪2/3⟫ = ⟪12/3⟫ = 4\n6의 ⟪2/3⟫는 6을 3묶음으로 똑같이 나눈 것 중 2묶음이에요. (6 ÷ 3 × 2 = 4)\n1보다 작은 진분수를 곱하면 원래 수보다 작아지고, 1보다 큰 수를 곱하면 커져요.' },
      { id: 'u2s3', name: '진분수의 곱셈', concept: '진분수끼리 곱할 때는 분자는 분자끼리, 분모는 분모끼리 곱해요.\n예) ⟪2/3⟫ × ⟪4/5⟫ = ⟪8/15⟫\n단위분수끼리 곱하면 분모끼리 곱한 단위분수가 돼요. 예) ⟪1/3⟫ × ⟪1/4⟫ = ⟪1/12⟫\n분모가 클수록 단위분수는 작아요. 예) ⟪1/12⟫은 ⟪1/3⟫보다 작아요.\n곱하기 전에 약분하면 계산이 쉬워요.' },
      { id: 'u2s4', name: '(대분수)×(대분수)', concept: '대분수의 곱셈은 대분수를 가분수로 바꾼 다음 분자끼리, 분모끼리 곱해요.\n예) ⟪1 1/2⟫ × ⟪2 1/3⟫ = ⟪3/2⟫ × ⟪7/3⟫ = ⟪21/6⟫ = ⟪3 1/2⟫\n자연수끼리, 분수끼리 따로 곱하면 안 돼요.\n세 분수의 곱셈은 앞에서부터 차례로 계산하거나, 세 분자와 세 분모를 한꺼번에 곱해요.' },
    ],
  });

  // ---------- 수 조각 { w: 자연수 부분, n: 분자, d: 분모 } (자연수는 n = 0) ----------
  const nat = (k) => ({ w: k, n: 0, d: 1 });
  function prop(r, d1, d2) { for (;;) { const d = r.int(d1, d2); const n = r.int(1, d - 1); if (F.gcd(n, d) === 1) return { w: 0, n, d }; } }
  function mix(r, w1, w2, d1, d2) { const f = prop(r, d1, d2); f.w = r.int(w1, w2); return f; }
  const unitF = (r, d1, d2) => ({ w: 0, n: 1, d: r.int(d1, d2) });
  const imp = (x) => (x.n === 0 ? { n: x.w, d: 1 } : { n: x.w * x.d + x.n, d: x.d });
  const val = (x) => F.make(imp(x).n, imp(x).d);
  const show = (x) => (x.n === 0 ? String(x.w) : F.mkRaw(x.n, x.d, x.w));
  const expr = (xs) => xs.map(show).join(' × ');
  const K = F.key, M = F.mk;
  const fnum = (x) => imp(x).n / imp(x).d; // 검사용 Number
  const fv = (v) => F.toNumber(v);
  const close = (a, b) => Math.abs(a - b) < 1e-9;
  const prodNum = (xs) => xs.reduce((s, x) => s * fnum(x), 1);
  const reduced = (v) => F.key(F.parse(v)) === String(v);
  const okSize = (f, maxD = 100) => { f = F.parse(f); return f.d <= maxD && f.n / f.d < 500 && f.n > 0; };
  const FRAC = (f, unit) => (unit ? { type: 'frac', value: K(f), unit } : { type: 'frac', value: K(f) });
  const COND = '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요?';

  // 곱셈 풀이 한 줄: ⟪1 1/2⟫ × ⟪2/3⟫ = ⟪3/2⟫ × ⟪2/3⟫ = ⟪6/6⟫ = 1
  function product(xs) {
    const is = xs.map(imp);
    const N = is.reduce((s, f) => s * f.n, 1), Dn = is.reduce((s, f) => s * f.d, 1);
    const ans = F.make(N, Dn);
    const conv = xs.some((x) => x.w && x.n) ? is.map((f) => (f.d === 1 ? String(f.n) : F.mkRaw(f.n, f.d))).join(' × ') : null;
    const rawP = Dn === 1 ? String(N) : F.mkRaw(N, Dn);
    const line = `${expr(xs)} = ${conv ? conv + ' = ' : ''}${rawP}${rawP !== M(ans) ? ' = ' + M(ans) : ''}`;
    return { ans, N, D: Dn, is, conv, line };
  }

  // 자주 하는 실수와 그때 나오는 값 (오답 패턴, 객관식·O/X·친구 풀이에 쓴다)
  function mulMistakes(xs) {
    const out = [];
    const add = (id, f, cause, msg, reason) => { if (f && f.n > 0 && okSize(f, 400)) out.push({ id, value: f, cause, msg, reason }); };
    const fr = xs.filter((x) => x.n !== 0), nats = xs.filter((x) => x.n === 0);
    add('add', xs.map(val).reduce((a, b) => F.add(a, b)), 'calc', '곱셈인데 더했어요. 기호를 다시 확인해요.', '곱하지 않고 더했어요');
    if (xs.length === 2 && nats.length === 1) {
      const a = fr[0], k = nats[0].w;
      add('denAlso', val(a), 'concept', '분수에 자연수를 곱할 때는 분모는 그대로 두고 분자에만 곱해요. 분모에도 곱하면 값이 그대로예요.', '분모에도 자연수를 곱했어요');
      add('denOnly', F.make(imp(a).n, imp(a).d * k), 'concept', '자연수는 분모가 아니라 분자에 곱해요.', '분모에 자연수를 곱했어요');
      if (a.w) {
        add('wholeOnly', F.add(F.make(a.w * k), F.make(a.n, a.d)), 'concept', '대분수의 자연수 부분에만 곱했어요. 가분수로 바꾸어 곱하면 실수가 없어요.', '자연수 부분에만 곱했어요');
        add('fracOnly', F.add(F.make(a.w), F.make(a.n * k, a.d)), 'concept', '대분수의 분수 부분에만 곱했어요. 가분수로 바꾸어 곱해요.', '분수 부분에만 곱했어요');
      }
    }
    if (xs.length === 2 && nats.length === 0) {
      const [a, b] = xs;
      if (a.w || b.w) {
        add('sep', F.add(F.make(a.w * b.w), F.make(a.n * b.n, a.d * b.d)), 'concept', '자연수끼리, 분수끼리 따로 곱했어요. 대분수는 가분수로 바꾼 다음 곱해요.', '자연수끼리, 분수끼리 따로 곱했어요');
        if (a.w && b.w) add('oneConv', F.mul(val(a), F.make(b.w)), 'calc', '두 대분수를 모두 가분수로 바꿔야 해요. 한쪽의 분수 부분을 빠뜨렸어요.', '한쪽 대분수의 분수 부분을 빠뜨렸어요');
      } else {
        add('denAdd', F.make(a.n * b.n, a.d + b.d), 'concept', '분모끼리는 더하지 않고 곱해요.', '분모끼리 더했어요');
        add('cross', F.make(a.n * b.d, a.d * b.n), 'concept', '분자는 분자끼리, 분모는 분모끼리 곱해요. 엇갈려 곱했어요.', '분자와 분모를 엇갈려 곱했어요');
        add('numAdd', F.make(a.n + b.n, a.d * b.d), 'calc', '분자끼리도 곱해야 해요. 분자를 더했어요.', '분자끼리 더했어요');
      }
    }
    if (xs.length === 3) {
      add('firstTwo', F.mul(val(xs[0]), val(xs[1])), 'condition', '세 수를 모두 곱해야 해요. 마지막 수를 빠뜨렸어요.', '마지막 수를 곱하지 않았어요');
      add('lastTwo', F.mul(val(xs[1]), val(xs[2])), 'condition', '세 수를 모두 곱해야 해요. 첫째 수를 빠뜨렸어요.', '첫째 수를 곱하지 않았어요');
    }
    return out;
  }
  // 정답·서로와 값이 겹치지 않는 실수만
  function distinctWrong(ms, ans) {
    const seen = new Set([K(ans)]);
    return ms.filter((m) => { const k = K(m.value); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  const toPatterns = (ms) => ms.map((m) => ({ value: K(m.value), cause: m.cause, msg: m.msg, soft: true }));

  function calcHints(xs, P) {
    const hasMixed = xs.some((x) => x.w && x.n);
    const hasNat = xs.some((x) => x.n === 0);
    const dens = P.is.filter((f) => f.d > 1).map((f) => f.d);
    return [
      hasMixed ? '대분수가 있으면 먼저 가분수로 바꿔요.' : hasNat ? '분모는 그대로 두고, 분자에 자연수를 곱해요.' : '분자는 분자끼리, 분모는 분모끼리 곱해요.',
      `${hasMixed ? `가분수로 바꾸면 ${j(P.conv, '이에요/예요')}. ` : ''}분자: ${P.is.map((f) => f.n).join(' × ')} = ${P.N}, ${dens.length > 1 ? `분모: ${dens.join(' × ')} = ${P.D}` : `분모 ${j(P.D, '은/는')} 그대로예요.`}`,
      `${P.line}\n답은 기약분수로, 가분수는 대분수로 나타내요.`,
    ];
  }

  // 소단원별 기본 계산 수 만들기 (난이도 1~4)
  const GEN = {
    u2s1(r, lv) {
      const k = lv === 1 ? r.int(2, 5) : lv === 2 ? r.int(2, 9) : lv === 3 ? r.int(2, 6) : r.int(3, 12);
      const a = lv === 1 ? prop(r, 2, 9) : lv === 2 ? prop(r, 3, 12) : lv === 3 ? mix(r, 1, 3, 2, 8) : (r.chance(0.5) ? mix(r, 1, 5, 2, 12) : prop(r, 5, 15));
      return [a, nat(k)];
    },
    u2s2(r, lv) { const [a, k] = GEN.u2s1(r, lv); return [k, a]; },
    u2s3(r, lv) {
      if (lv === 1) return [unitF(r, 2, 9), unitF(r, 2, 9)];
      if (lv === 2) return [prop(r, 2, 6), prop(r, 2, 6)];
      if (lv === 3) return [prop(r, 2, 9), prop(r, 2, 9)];
      return [prop(r, 3, 12), prop(r, 3, 12)];
    },
    u2s4(r, lv) {
      if (lv === 1) return [mix(r, 1, 2, 2, 4), mix(r, 1, 2, 2, 4)];
      if (lv === 2) return [mix(r, 1, 3, 2, 5), mix(r, 1, 3, 2, 6)];
      if (lv === 3) return [mix(r, 1, 4, 2, 7), mix(r, 1, 3, 2, 7)];
      return r.chance(0.5) ? [mix(r, 1, 5, 2, 9), mix(r, 1, 4, 2, 9)] : [mix(r, 1, 3, 2, 6), prop(r, 2, 7), mix(r, 1, 2, 2, 5)];
    },
  };
  const verifyProduct = (p) => close(fv(p.answer.value), prodNum(p.data.xs)) && reduced(p.answer.value);
  const tpl = (o) => Object.assign({ unit: 2 }, o);

  // ======================================================================
  // 소단원마다 같이 쓰는 틀
  // ======================================================================

  // 기본 계산
  function tCalc(sub, gen = GEN[sub]) {
    return tpl({
      id: sub + '-basic', sub, style: 'A', styleName: '기본 계산', levels: [1, 4], weak: ['form'],
      build(r, lv) {
        const xs = gen(r, lv);
        const P = product(xs);
        if (!okSize(P.ans)) return null;
        return {
          text: `계산해 보세요.\n${expr(xs)}`,
          answer: FRAC(P.ans),
          patterns: toPatterns(mulMistakes(xs)),
          hints: calcHints(xs, P),
          solution: [P.line],
          key: `${sub}-basic|${expr(xs)}`,
          data: { xs },
        };
      },
      verify: verifyProduct,
    });
  }

  // 객관식 4지선다: 오답 선택지는 자주 하는 실수의 값
  function tChoice(sub, gen = GEN[sub]) {
    return tpl({
      id: sub + '-choice', sub, style: 'B', styleName: '객관식', levels: [1, 4],
      build(r, lv) {
        const xs = gen(r, lv);
        const P = product(xs);
        if (!okSize(P.ans)) return null;
        const ms = r.shuffle(distinctWrong(mulMistakes(xs), P.ans)).slice(0, 3);
        const opts = [{ text: M(P.ans), v: K(P.ans), correct: true }];
        for (const m of ms) opts.push({ text: M(m.value), v: K(m.value), correct: false, pattern: { cause: m.cause, msg: m.msg } });
        for (const extra of [F.add(P.ans, F.make(1, P.ans.d)), F.sub(P.ans, F.make(1, P.ans.d)), F.mul(P.ans, 2)]) {
          if (opts.length >= 4) break;
          if (extra.n <= 0 || opts.some((o) => F.eq(o.v, extra))) continue;
          opts.push({ text: M(extra), v: K(extra), correct: false, pattern: { cause: 'calc', msg: '차근차근 다시 계산해 봐요. 분자는 분자끼리, 분모는 분모끼리 곱해요.' } });
        }
        opts.sort((a, b) => F.cmp(a.v, b.v));
        return {
          text: `계산 결과를 고르세요.\n${expr(xs)}`,
          answer: { type: 'choice', options: opts },
          keepOrder: true,
          hints: calcHints(xs, P),
          solution: [P.line],
          key: `${sub}-choice|${expr(xs)}`,
          data: { xs },
        };
      },
      verify(p) {
        const want = prodNum(p.data.xs);
        return p.answer.options.every((o, i) => close(fv(o.v), want) === (i === p.answer.value));
      },
    });
  }

  // O/X: 계산이 맞는지, 또는 개념 문장이 맞는지
  const CONCEPT_OX = {
    u2s1: [
      ['분수에 자연수를 곱할 때는 분모와 분자에 모두 자연수를 곱해요.', false, '분모는 그대로 두고 분자에만 곱해요.'],
      ['⟪2/7⟫ × 3과 ⟪2/7⟫ + ⟪2/7⟫ + ⟪2/7⟫의 값은 같아요.', true, '⟪2/7⟫을 3번 더한 것이 ⟪2/7⟫ × 3이에요.'],
    ],
    u2s2: [
      ['자연수에 진분수를 곱하면 처음 자연수보다 작아져요.', true, '1보다 작은 수를 곱하면 원래 수보다 작아져요.'],
      ['12의 ⟪3/4⟫은 12 × ⟪3/4⟫으로 구할 수 있어요.', true, '"~의 몇 분의 몇"은 곱셈으로 구해요.'],
      ['자연수에 대분수를 곱하면 처음 자연수보다 작아져요.', false, '대분수는 1보다 커서 곱하면 커져요.'],
    ],
    u2s3: [
      ['진분수끼리 곱하면 곱은 곱하는 두 수보다 작아요.', true, '1보다 작은 수를 곱하면 작아져요.'],
      ['단위분수끼리 곱하면 분모끼리 더한 단위분수가 돼요.', false, '분모끼리 곱해요. ⟪1/3⟫ × ⟪1/4⟫ = ⟪1/12⟫'],
      ['⟪1/5⟫은 ⟪1/8⟫보다 커요.', true, '분모가 작을수록 단위분수는 커요.'],
    ],
    u2s4: [
      ['대분수끼리 곱할 때는 자연수끼리, 분수끼리 곱해서 더해요.', false, '대분수를 가분수로 바꾼 다음 곱해요.'],
      ['세 분수의 곱셈은 앞의 두 수를 먼저 곱한 다음 나머지 수를 곱해도 돼요.', true, '차례로 곱해도, 한꺼번에 곱해도 결과는 같아요.'],
    ],
  };
  function tOX(sub, gen = GEN[sub]) {
    return tpl({
      id: sub + '-ox', sub, style: 'B', styleName: 'O/X 판단', levels: [1, 4],
      build(r, lv) {
        if (r.chance(0.3)) {
          const i = r.int(0, CONCEPT_OX[sub].length - 1);
          const [s, truth, why] = CONCEPT_OX[sub][i];
          return {
            text: `다음 문장이 맞으면 O, 틀리면 X를 고르세요.\n${s}`,
            answer: { type: 'ox', value: truth },
            patterns: [{ value: !truth, cause: 'concept', msg: why }],
            hints: ['개념 설명을 떠올려 봐요.', '작은 수로 예를 들어 직접 계산해 보면 알 수 있어요.', `${why} → ${truth ? 'O' : 'X'}`],
            solution: [why],
            key: `${sub}-ox|concept|${i}`,
            data: { concept: i, truth },
          };
        }
        const xs = gen(r, lv);
        const P = product(xs);
        if (!okSize(P.ans)) return null;
        const ms = distinctWrong(mulMistakes(xs), P.ans);
        const truth = !ms.length || r.chance(0.5);
        const shown = truth ? P.ans : r.pick(ms).value;
        return {
          text: `계산이 맞으면 O, 틀리면 X를 고르세요.\n${expr(xs)} = ${M(shown)}`,
          answer: { type: 'ox', value: truth },
          patterns: [{ value: !truth, cause: 'concept', msg: `바르게 계산하면 ${j(P.line, '이에요/예요')}.` }],
          hints: [calcHints(xs, P)[0], calcHints(xs, P)[1], `${P.line}\n문제의 답 ${j(M(shown), '와/과')} 비교해 봐요.`],
          solution: [P.line],
          key: `${sub}-ox|${expr(xs)}|${K(shown)}`,
          data: { xs, shown: K(shown) },
        };
      },
      verify(p) {
        if (p.data.concept != null) return p.answer.value === p.data.truth;
        return p.answer.value === close(fv(p.data.shown), prodNum(p.data.xs));
      },
    });
  }

  // 친구 풀이 검사: 친구가 틀리게 계산한 답을 보고 무엇을 잘못했는지 고르기
  function tFriend(sub, gen = GEN[sub]) {
    return tpl({
      id: sub + '-friend', sub, style: 'B', styleName: '친구 풀이 검사', levels: [1, 4],
      build(r, lv) {
        const xs = gen(r, lv);
        const P = product(xs);
        if (!okSize(P.ans)) return null;
        const ms = distinctWrong(mulMistakes(xs), P.ans);
        if (ms.length < 3) return null;
        const chosen = r.pick(ms);
        const fname = r.pick(W.names);
        const others = r.sample(ms.filter((m) => m !== chosen), 3);
        const opts = [{ key: chosen.id, text: chosen.reason, correct: true }];
        for (const m of others) opts.push({ key: m.id, text: m.reason, correct: false, pattern: { cause: 'concept', msg: `그렇게 했다면 ${j(M(m.value), '이/가')} 나와요. ${fname}의 답 ${j(M(chosen.value), '와/과')} 달라요.` } });
        return {
          text: `${fname}의 계산이에요.\n${expr(xs)} = ${M(chosen.value)}\n${fname}의 답은 틀렸어요. 무엇을 잘못했는지 고르세요.`,
          answer: { type: 'choice', options: opts },
          hints: [
            `먼저 ${j(expr(xs), '을/를')} 직접 계산해 봐요.`,
            `바른 답은 ${j(M(P.ans), '이에요/예요')}. ${fname}의 답 ${j(M(chosen.value), '와/과')} 어디가 다른지 봐요.`,
            `보기에 적힌 대로 하나씩 계산해 봐요. '${chosen.reason}'처럼 하면 ${j(M(chosen.value), '이/가')} 나와요.`,
          ],
          solution: [`바른 계산: ${P.line}`, `${fname}의 실수: ${chosen.reason}`],
          key: `${sub}-friend|${expr(xs)}|${chosen.id}`,
          data: { xs, W: K(chosen.value), vals: Object.fromEntries(ms.map((m) => [m.id, K(m.value)])) },
        };
      },
      verify(p) {
        const { xs, W: Wv, vals } = p.data;
        if (close(fv(Wv), prodNum(xs))) return false;
        return p.answer.options.every((o, i) => F.eq(vals[o.key], Wv) === (i === p.answer.value));
      },
    });
  }

  // 화살표 규칙대로 차례로 계산하기 (그림)
  function tArrow(sub, gen) {
    return tpl({
      id: sub + '-arrow', sub, style: 'A', styleName: '화살표 계산', levels: [1, 4],
      build(r, lv) {
        const xs = gen(r, lv);
        const P = product(xs);
        if (!okSize(P.ans)) return null;
        const first = product(xs.slice(0, 2)).ans;
        const lines = [];
        let cur = val(xs[0]);
        for (let i = 1; i < xs.length; i++) {
          const nx = F.mul(cur, val(xs[i]));
          lines.push(`${M(cur)} × ${show(xs[i])} = ${M(nx)}`);
          cur = nx;
        }
        return {
          text: '화살표 규칙대로 차례로 계산하여 ?에 알맞은 수를 구하세요.',
          figure: { type: 'arrows', start: show(xs[0]), steps: xs.slice(1).map((x) => '× ' + show(x)) },
          answer: FRAC(P.ans),
          patterns: [
            ...(xs.length > 2 ? [{ value: K(first), cause: 'condition', soft: true, msg: '화살표를 끝까지 따라가야 해요. 첫째 화살표에서 멈췄어요.' }] : []),
            ...toPatterns(mulMistakes(xs).filter((m) => m.id === 'add')),
          ],
          hints: [
            '왼쪽부터 화살표 하나씩 차례로 계산해요. 대분수는 가분수로 바꿔서 곱해요.',
            lines[0],
            lines.join('\n'),
          ],
          solution: lines,
          key: `${sub}-arrow|${expr(xs)}`,
          data: { xs },
        };
      },
      verify: verifyProduct,
    });
  }

  // 어림 먼저: 계산하지 않고 크기 비교
  function tEst(sub, gen) {
    return tpl({
      id: sub + '-est', sub, style: 'B', styleName: '어림 먼저', levels: [1, 3],
      build(r, lv) {
        const { xs, base } = gen(r, lv);
        const other = xs.find((x) => x !== base);
        const P = product(xs);
        const c = F.cmp(P.ans, val(base));
        const sign = c > 0 ? '>' : c < 0 ? '<' : '=';
        const big = F.cmp(val(other), 1);
        const why = big < 0 ? `${j(show(other), '은/는')} 1보다 작아서, 곱하면 ${show(base)}보다 작아져요.` : big > 0 ? `${j(show(other), '은/는')} 1보다 커서, 곱하면 ${show(base)}보다 커져요.` : '1을 곱하면 그대로예요.';
        return {
          text: `계산하지 않고 크기를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.\n(가) ${expr(xs)}\n(나) ${show(base)}`,
          answer: { type: 'ineq', value: sign },
          patterns: [{ value: sign === '<' ? '>' : '<', cause: 'concept', msg: '1보다 작은 수를 곱하면 원래 수보다 작아지고, 1보다 큰 수를 곱하면 원래 수보다 커져요.' }],
          hints: [`곱하는 수 ${j(show(other), '이/가')} 1보다 큰지 작은지 먼저 봐요.`, '1보다 작은 수를 곱하면 작아지고, 1보다 큰 수를 곱하면 커져요.', `${why} → (가) ${sign} (나)`],
          solution: [why, `(가) = ${M(P.ans)}`],
          key: `${sub}-est|${expr(xs)}`,
          data: { xs, base: xs.indexOf(base) },
        };
      },
      verify(p) {
        const a = prodNum(p.data.xs), b = fnum(p.data.xs[p.data.base]);
        const sign = close(a, b) ? '=' : a > b ? '>' : '<';
        return sign === p.answer.value;
      },
    });
  }

  // 잘못 계산한 부분 찾아 바르게 계산하기
  function tFix(sub, gen, prefer) {
    return tpl({
      id: sub + '-fix', sub, style: 'A', styleName: '잘못 계산한 곳 고치기', levels: [1, 4],
      build(r, lv) {
        const xs = gen(r, lv);
        const P = product(xs);
        if (!okSize(P.ans)) return null;
        const ms = distinctWrong(mulMistakes(xs), P.ans).filter((m) => m.id !== 'add');
        const pool = ms.filter((m) => prefer.includes(m.id));
        if (!pool.length) return null;
        const m = r.pick(pool);
        const fname = r.pick(W.names);
        let work = `${expr(xs)} = ${M(m.value)}`;
        if (m.id === 'sep') {
          const [a, b] = xs;
          work = `${expr(xs)} = (${a.w} × ${b.w}) + (${F.mkRaw(a.n, a.d)} × ${F.mkRaw(b.n, b.d)}) = ${M(m.value)}`;
        }
        return {
          text: `${j(fname, '이/가')} 계산한 것이에요. 잘못 계산한 곳을 찾아 바르게 계산하세요.\n${work}`,
          answer: FRAC(P.ans),
          patterns: [{ value: K(m.value), cause: 'concept', msg: `친구와 같은 실수를 했어요. ${m.msg}` }, ...toPatterns(ms.filter((x) => x !== m))],
          hints: [`${fname}의 계산에서 어디가 잘못되었는지 찾아봐요.`, m.msg, P.line],
          solution: [`잘못된 곳: ${m.reason}`, `바른 계산: ${P.line}`],
          key: `${sub}-fix|${expr(xs)}|${m.id}`,
          data: { xs },
        };
      },
      verify: verifyProduct,
    });
  }

  // 서술형 (기획서 12번): 풀이를 쓰고, 답은 자동 채점, 모범 풀이와 체크리스트로 스스로 확인
  function tEssay(sub, gen) {
    return tpl({
      id: sub + '-essay', sub, style: 'A', styleName: '서술형', levels: [1, 4],
      build(r, lv) {
        const xs = gen(r, lv);
        const [a, b] = xs;
        const P = product(xs);
        if (!okSize(P.ans)) return null;
        // 방법 2: 대분수의 자연수 부분과 분수 부분에 각각 곱해서 더하기
        const part1 = F.mul(F.make(a.w), val(b));
        const part2 = F.mul(F.make(a.n, a.d), val(b));
        const sum = F.add(part1, part2);
        if (!F.eq(sum, P.ans)) return null;
        const m2 = `(${a.w} × ${show(b)}) + (${F.mkRaw(a.n, a.d)} × ${show(b)}) = ${M(part1)} + ${M(part2)} = ${M(sum)}`;
        return {
          text: `${j(expr(xs), '을/를')} 두 가지 방법으로 계산하려고 해요.\n풀이 과정을 쓰고 답을 구하세요.`,
          answer: FRAC(P.ans),
          patterns: toPatterns(mulMistakes(xs)),
          hints: [
            '방법 1: 대분수를 가분수로 바꿔서 곱해요. 방법 2: 대분수의 자연수 부분과 분수 부분에 각각 곱해서 더해요.',
            `방법 1: ${show(a)} = ${F.mkRaw(imp(a).n, a.d)}`,
            `방법 1: ${P.line}\n방법 2: ${m2}`,
          ],
          solution: [`방법 1 (가분수로 바꾸기): ${P.line}`, `방법 2 (나누어 곱하기): ${m2}`, `두 방법의 답이 ${j(M(P.ans), '으로/로')} 같아요.`],
          essay: {
            checklist: [
              { q: '대분수를 가분수로 바꿔서 계산했나요?', concept: `대분수를 가분수로 바꾸는 법: 자연수 × 분모 + 분자를 분자로 써요. ${show(a)} = ${F.mkRaw(imp(a).n, a.d)}` },
              { q: '자연수 부분과 분수 부분에 각각 곱해서 더했나요?', concept: `대분수는 자연수와 분수의 합이에요. ${show(a)} × ${show(b)} = (${a.w} × ${show(b)}) + (${F.mkRaw(a.n, a.d)} × ${show(b)})` },
              { q: '두 방법의 답이 같은지 확인했나요?', concept: '두 방법으로 계산한 값이 다르면 어딘가 실수한 거예요. 하나씩 다시 계산해 봐요.' },
              { q: '답을 기약분수(대분수)로 나타냈나요?', concept: '분자와 분모를 공약수로 끝까지 나누고, 가분수는 대분수로 바꿔요.' },
            ],
          },
          key: `${sub}-essay|${expr(xs)}`,
          data: { xs },
        };
      },
      verify: verifyProduct,
    });
  }

  // ======================================================================
  // 소단원 1: (분수)×(자연수)
  // ======================================================================
  const S1 = 'u2s1';
  const LIFE1 = [
    { q: (nm, a, k) => `${j(nm, '은/는')} 하루에 물을 ${a} L씩 마셔요. ${k}일 동안 마신 물은 모두 몇 L인가요?`, unit: 'L', usp: ' ', cnt: '일 동안' },
    { q: (nm, a, k) => `${j(nm, '은/는')} 매일 ${a} km씩 달려요. ${k}일 동안 달린 거리는 모두 몇 km인가요?`, unit: 'km', usp: ' ', cnt: '일 동안' },
    { q: (nm, a, k) => `리본을 한 사람에게 ${a} m씩 ${k}명에게 나누어 주었어요. 나누어 준 리본은 모두 몇 m인가요?`, unit: 'm', usp: ' ', cnt: '명에게' },
    { q: (nm, a, k) => `주스를 한 컵에 ${a} L씩 ${k}컵 담았어요. 담은 주스는 모두 몇 L인가요?`, unit: 'L', usp: ' ', cnt: '컵' },
    { q: (nm, a, k) => `${j(nm, '은/는')} 책을 하루에 ${a}시간씩 읽어요. ${k}일 동안 책을 읽은 시간은 모두 몇 시간인가요?`, unit: '시간', usp: '', cnt: '일 동안' },
  ];
  const tLife1 = tpl({
    id: 'u2s1-life', sub: S1, style: 'A', styleName: '생활 속 문장제', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const c = r.pick(LIFE1);
      const a = lv <= 2 ? prop(r, 2, lv === 1 ? 6 : 10) : mix(r, 1, lv === 3 ? 2 : 4, 2, 8);
      const k = r.int(2, lv <= 2 ? 6 : 9);
      const xs = [a, nat(k)];
      const P = product(xs);
      if (!okSize(P.ans)) return null;
      const nm = r.pick(W.names);
      return {
        text: c.q(nm, show(a), k),
        answer: FRAC(P.ans, c.unit),
        patterns: [
          { value: K(val(a)), cause: 'condition', soft: true, msg: `${k}${c.cnt}이에요. 한 번의 양에 ${j(k, '을/를')} 곱해야 해요.` },
          ...toPatterns(mulMistakes(xs).filter((m) => m.id !== 'denAlso')),
        ],
        hints: [
          `${COND} 한 번에 ${show(a)}${c.usp}${c.unit}씩, ${k}번이에요.`,
          `식으로 쓰면 ${j(expr(xs), '이에요/예요')}.`,
          `${P.line} (${c.unit})`,
        ],
        solution: [`식: ${expr(xs)}`, `${P.line} (${c.unit})`],
        key: `u2s1-life|${c.unit}|${expr(xs)}`,
        data: { xs },
      };
    },
    verify: verifyProduct,
  });

  const tBox1 = tpl({
    id: 'u2s1-box', sub: S1, style: 'A', styleName: '□ 안에 들어갈 수', levels: [2, 4],
    build(r, lv) {
      const a = prop(r, 3, lv === 2 ? 9 : 15);
      const k = r.int(1, lv === 4 ? 4 : 2);
      // a × □ < k  →  □ < k × 분모 ÷ 분자
      const lim = (k * a.d) / a.n;
      const ans = [];
      for (let x = 1; x < lim; x++) ans.push(x);
      if (ans.length < 1 || ans.length > 9) return null;
      const patterns = [];
      if (Number.isInteger(lim)) patterns.push({ value: [...ans, lim].map(String), cause: 'concept', msg: `${show(a)} × ${j(lim, '은/는')} 딱 ${j(k, '이에요/예요')}. ${k}보다 작아야 하니까 들어가지 않아요.` });
      patterns.push({ value: [...ans, ans.length + 1].map(String), cause: 'calc', soft: true, msg: `□에 ${j(ans.length + 1, '을/를')} 넣고 직접 곱해 봐요. ${k}보다 작은지 확인해요.` });
      return {
        text: `□ 안에 들어갈 수 있는 자연수를 모두 쓰세요.\n${show(a)} × □ < ${k}`,
        answer: { type: 'nums', values: ans.map(String) },
        patterns,
        hints: [
          `□에 1, 2, 3, …을 차례로 넣어 곱해 봐요.`,
          `${show(a)} × □는 분모 ${j(a.d, '은/는')} 그대로, 분자는 ${a.n} × □예요. ${k}보다 작으려면 ${a.n} × □가 ${k * a.d}보다 작아야 해요.`,
          `${a.n} × □ < ${k * a.d} → □는 ${ans.join(', ')}`,
        ],
        solution: [`${show(a)} × □ < ${k} → ${a.n} × □ < ${k * a.d}`, `□ = ${ans.join(', ')}`],
        key: `u2s1-box|${K(val(a))}|${k}`,
        data: { a, k },
      };
    },
    verify(p) {
      const { a, k } = p.data;
      const exp = [];
      for (let x = 1; x < 100; x++) if (fnum(a) * x < k - 1e-12) exp.push(x);
      return exp.join(',') === p.answer.values.join(',');
    },
  });

  const tWrongCalc1 = tpl({
    id: 'u2s1-wrongop', sub: S1, style: 'A', styleName: '잘못 계산한 결과로 바른 답', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const x = lv === 2 ? prop(r, 2, 9) : mix(r, 1, lv === 3 ? 3 : 5, 2, 9);
      const k = r.int(2, lv === 4 ? 9 : 6);
      const R = F.add(val(x), F.make(k));
      const xs = [x, nat(k)];
      const P = product(xs);
      if (!okSize(P.ans)) return null;
      return {
        text: `어떤 분수에 ${j(k, '을/를')} 곱해야 할 것을 잘못하여 더했더니 ${j(M(R), '이/가')} 되었어요.\n바르게 계산한 값은 얼마인가요?`,
        answer: FRAC(P.ans),
        patterns: [
          { value: K(F.mul(R, k)), cause: 'condition', msg: '잘못 계산한 값에 바로 곱했어요. 먼저 어떤 분수를 구해요.' },
          { value: K(val(x)), cause: 'condition', msg: '어떤 분수가 아니라 바르게 계산한 값을 물었어요.' },
          { value: K(R), cause: 'condition', soft: true, msg: '잘못 계산한 값이 아니라 바르게 계산한 값을 구해요.' },
        ],
        hints: [
          `${COND} 먼저 '어떤 분수'를 구해요.`,
          `어떤 분수 = ${M(R)} - ${k} = ${M(val(x))}`,
          `바르게 계산하면 ${P.line}`,
        ],
        solution: [`어떤 분수: ${M(R)} - ${k} = ${M(val(x))}`, `바른 계산: ${P.line}`],
        key: `u2s1-wrongop|${expr(xs)}`,
        data: { xs },
      };
    },
    verify: verifyProduct,
  });

  const S1_TEMPLATES = [
    tCalc(S1), tLife1, tBox1, tWrongCalc1,
    tArrow(S1, (r, lv) => [lv <= 2 ? prop(r, 2, 9) : mix(r, 1, 2, 2, 7), nat(r.int(2, lv === 1 ? 4 : 6)), nat(r.int(2, lv <= 2 ? 3 : 5))]),
    tEst(S1, (r, lv) => { const xs = GEN.u2s1(r, Math.min(lv + 1, 4)); return { xs, base: xs[1] }; }),
    tOX(S1), tChoice(S1), tFriend(S1),
    tEssay(S1, (r, lv) => [mix(r, 1, lv <= 2 ? 3 : 5, 2, lv <= 2 ? 6 : 9), nat(r.int(2, lv <= 2 ? 5 : 9))]),
  ];

  // ======================================================================
  // 소단원 2: (자연수)×(분수)
  // ======================================================================
  const S2 = 'u2s2';
  const TRAIT = [['안경을 쓴', '학생'], ['자전거를 탈 줄 아는', '학생'], ['강아지를 키우는', '학생'], ['피아노를 배우는', '학생'], ['파란색', '구슬'], ['빨간색', '풍선']];
  const tPart = tpl({
    id: 'u2s2-part', sub: S2, style: 'A', styleName: '전체의 몇 분의 몇', levels: [1, 4],
    build(r, lv) {
      const f = lv === 1 ? unitF(r, 2, 6) : prop(r, 2, lv === 2 ? 6 : 10);
      const N = f.d * r.int(2, lv <= 2 ? 6 : 12);
      const ans = (N / f.d) * f.n;
      const [trait, what] = r.pick(TRAIT);
      const cnt = what === '학생' ? '명' : '개';
      const part = j(M(val(f)), '은/는');
      const intro = what === '학생' ? `우리 반 학생 ${N}명 중 ${part} ${trait} 학생이에요.` : `${what} ${N}개 중 ${part} ${trait} ${j(what, '이에요/예요')}.`;
      return {
        text: `${intro}\n${trait} ${j(what, '은/는')} 몇 ${cnt}인가요?`,
        answer: { type: 'num', value: String(ans), unit: cnt },
        patterns: [
          ...(f.n > 1 ? [{ value: String(N / f.d), cause: 'calc', msg: `${j(N, '을/를')} ${f.d}묶음으로 나눈 것 중 ${f.n}묶음이에요. 나눈 다음 ${j(f.n, '을/를')} 곱해야 해요.` }] : []),
          { value: String(N - ans), cause: 'condition', msg: `${trait} ${what}의 수를 물었어요. 나머지를 구했어요.` },
          ...(Number.isInteger((N * f.d) / f.n) ? [{ value: String((N * f.d) / f.n), cause: 'concept', soft: true, msg: '분자와 분모를 거꾸로 곱했어요. 분모로 나누고 분자를 곱해요.' }] : []),
        ],
        hints: [
          `${N}의 ${j(M(val(f)), '은/는')} ${N} × ${M(val(f))}로 구해요.`,
          `${j(N, '을/를')} ${f.d}묶음으로 똑같이 나누면 한 묶음은 ${j(N / f.d, '이에요/예요')}.`,
          `${f.n}묶음이니까 ${N / f.d} × ${f.n} = ${ans}(${cnt})`,
        ],
        solution: [`${N} × ${M(val(f))} = ${ans}(${cnt})`],
        key: `u2s2-part|${N}|${K(val(f))}|${trait}`,
        data: { N, f },
      };
    },
    verify(p) { return close(Number(p.answer.value), p.data.N * fnum(p.data.f)) && Number.isInteger(Number(p.answer.value)); },
  });

  // 단위: word(1 다음에 오는 말), sp(숫자와 단위 사이 띄어쓰기), base(작은 단위로 몇), unit(작은 단위)
  const UNITS2 = [
    { whole: '1시간', word: '시간', sp: '', base: 60, unit: '분', usp: '', dens: [2, 3, 4, 5, 6, 10, 12] },
    { whole: '1 m', word: 'm', sp: ' ', base: 100, unit: 'cm', usp: ' ', dens: [2, 4, 5, 10, 20, 25] },
    { whole: '1 kg', word: 'kg', sp: ' ', base: 1000, unit: 'g', usp: ' ', dens: [2, 4, 5, 8, 10, 20, 25] },
    { whole: '1 L', word: 'L', sp: ' ', base: 1000, unit: 'mL', usp: ' ', dens: [2, 4, 5, 8, 10, 20] },
    { whole: '1분', word: '분', sp: '', base: 60, unit: '초', usp: '', dens: [2, 3, 4, 5, 6, 10, 12] },
    { whole: '하루', word: null, sp: '', base: 24, unit: '시간', usp: '', dens: [2, 3, 4, 6, 8, 12] },
  ];
  const tUnit = tpl({
    id: 'u2s2-unit', sub: S2, style: 'A', styleName: '단위 바꾸기', levels: [1, 4],
    build(r, lv) {
      const u = r.pick(UNITS2);
      const d = r.pick(u.dens);
      let nn = r.int(1, d - 1);
      while (F.gcd(nn, d) !== 1) nn = r.int(1, d - 1);
      const w = lv >= 3 && u.word ? r.int(1, 3) : 0;
      const x = { w, n: nn, d };
      const ans = (u.base / d) * (w * d + nn);
      const rawX = F.mkRaw(imp(x).n, d);
      const text = w
        ? `${j(`${show(x)}${u.sp}${u.word}`, '은/는')} 몇 ${u.unit}인가요?`
        : `${u.whole}의 ${j(M(val(x)), '은/는')} 몇 ${u.unit}인가요?`;
      return {
        text: `${text}\n(${u.whole} = ${u.base}${u.usp}${u.unit})`,
        answer: { type: 'num', value: String(ans), unit: u.unit },
        patterns: [
          ...(nn > 1 && !w ? [{ value: String(u.base / d), cause: 'calc', msg: `${j(u.base, '을/를')} ${d}로 나눈 다음 분자 ${j(nn, '을/를')} 곱해야 해요.` }] : []),
          ...(w ? [{ value: String(u.base * w), cause: 'condition', msg: '분수 부분도 바꿔야 해요. 자연수 부분만 바꿨어요.' }] : []),
          ...(w ? [{ value: String(u.base * w + nn), cause: 'concept', soft: true, msg: `분수 부분 ${j(M(F.make(nn, d)), '을/를')} 그대로 ${nn}${u.usp}${u.unit}로 쓰면 안 돼요. ${u.base} × ${j(M(F.make(nn, d)), '을/를')} 계산해요.` }] : []),
        ],
        hints: [
          `${u.whole} = ${u.base}${u.usp}${j(u.unit, '이에요/예요')}. ${u.base}에 분수를 곱해요.`,
          w ? `${j(show(x), '을/를')} 가분수로 바꾸면 ${j(rawX, '이에요/예요')}. ${u.base} × ${j(rawX, '을/를')} 계산해요.` : `${u.base} × ${j(M(val(x)), '을/를')} 계산해요.`,
          `${u.base} × ${rawX} = ${ans}(${u.unit})`,
        ],
        solution: [`${u.base} × ${rawX} = ${ans}(${u.unit})`],
        key: `u2s2-unit|${u.unit}|${show(x)}`,
        data: { base: u.base, x },
      };
    },
    verify(p) { return close(Number(p.answer.value), p.data.base * fnum(p.data.x)); },
  });

  const THINGS = [['사탕', '개'], ['구슬', '개'], ['색종이', '장'], ['딱지', '장'], ['쿠키', '개']];
  const tRest = tpl({
    id: 'u2s2-rest', sub: S2, style: 'A', styleName: '여러 단계 문장제', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const f1 = prop(r, 2, lv === 2 ? 4 : 6), f2 = prop(r, 2, lv === 2 ? 4 : 6);
      const remF = F.sub(1, val(f1));
      // N을 두 분모의 배수로 하면 남은 수와 친구에게 준 수가 모두 자연수가 된다
      const N = f1.d * f2.d * r.int(1, lv === 4 ? 4 : 2);
      const rem = N * fv(remF);
      const ans = rem * fv(val(f2));
      if (!Number.isInteger(rem) || !Number.isInteger(ans) || ans <= 0) return null;
      const [thing, cnt] = r.pick(THINGS);
      const nm = r.pick(W.names);
      const askLeft = lv === 4 && r.chance(0.4);
      const finalAns = askLeft ? rem - ans : ans;
      return {
        text: `${j(nm, '은/는')} ${thing} ${N}${cnt} 중 ${j(M(val(f1)), '을/를')} 동생에게 주고, 나머지의 ${j(M(val(f2)), '을/를')} 친구에게 주었어요.\n${askLeft ? `${j(nm, '이/가')} 가지고 있는 ${j(thing, '은/는')}` : `친구에게 준 ${j(thing, '은/는')}`} 몇 ${cnt}인가요?`,
        answer: { type: 'num', value: String(finalAns), unit: cnt },
        patterns: [
          { value: String(N * fv(val(f2))), cause: 'condition', msg: `'나머지의 ${F.str(val(f2))}'예요. 전체에 곱하지 말고, 먼저 남은 ${j(thing, '을/를')} 구해요.` },
          { value: String(N * fv(val(f1)) * fv(val(f2))), cause: 'condition', soft: true, msg: '동생에게 준 것이 아니라 그 나머지에 곱해야 해요.' },
          { value: String(rem), cause: 'condition', soft: true, msg: `남은 ${thing}에서 한 번 더 계산해야 해요.` },
          ...(askLeft ? [{ value: String(ans), cause: 'condition', msg: `친구에게 준 것이 아니라 ${nm}에게 남은 ${j(thing, '을/를')} 물었어요.` }] : []),
        ],
        hints: [
          `${COND} '나머지의'에 밑줄을 그어 봐요.`,
          `동생에게 주고 남은 ${thing}: ${N} × ${M(remF)} = ${rem}(${cnt})`,
          `친구에게 준 ${thing}: ${rem} × ${M(val(f2))} = ${ans}(${cnt})${askLeft ? `\n남은 ${thing}: ${rem} - ${ans} = ${finalAns}(${cnt})` : ''}`,
        ],
        solution: [`남은 ${thing}: ${N} × ${M(remF)} = ${rem}(${cnt})`, `친구에게 준 ${thing}: ${rem} × ${M(val(f2))} = ${ans}(${cnt})`, ...(askLeft ? [`${nm}에게 남은 ${thing}: ${rem} - ${ans} = ${finalAns}(${cnt})`] : [])],
        key: `u2s2-rest|${N}|${K(val(f1))}|${K(val(f2))}|${askLeft}`,
        data: { N, f1, f2, askLeft },
      };
    },
    verify(p) {
      const { N, f1, f2, askLeft } = p.data;
      const rem = N * (1 - fnum(f1));
      const give = rem * fnum(f2);
      return close(Number(p.answer.value), askLeft ? rem - give : give);
    },
  });

  const ORD = ['첫째로', '둘째로', '셋째로'];
  const tBounce = tpl({
    id: 'u2s2-bounce', sub: S2, style: 'A', styleName: '반복해서 곱하기', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const f = r.pick([{ w: 0, n: 1, d: 2 }, { w: 0, n: 2, d: 3 }, { w: 0, n: 3, d: 4 }, { w: 0, n: 3, d: 5 }, { w: 0, n: 1, d: 3 }, { w: 0, n: 2, d: 5 }]);
      const t = lv === 2 ? 2 : lv === 3 ? r.pick([2, 3]) : 3;
      const H = f.d ** t * r.int(1, Math.max(1, Math.floor(400 / f.d ** t)));
      if (H < 20) return null;
      const hs = [H];
      for (let i = 0; i < t + 1; i++) hs.push((hs[hs.length - 1] / f.d) * f.n);
      const ans = hs[t];
      if (!Number.isInteger(ans)) return null;
      return {
        text: `공을 ${H} cm 높이에서 떨어뜨렸어요. 이 공은 떨어진 높이의 ${M(val(f))}만큼 튀어 올라요.\n공이 ${ORD[t - 1]} 튀어 오른 높이는 몇 cm인가요?`,
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [
          { value: String(hs[1]), cause: 'condition', msg: `${ORD[t - 1]} 튀어 오른 높이예요. 튀어 오를 때마다 ${j(M(val(f)), '을/를')} 곱해야 해요.` },
          ...(t === 3 ? [{ value: String(hs[2]), cause: 'condition', msg: '셋째로 튀어 오른 높이예요. 한 번 더 곱해야 해요.' }] : []),
          ...(Number.isInteger(hs[t + 1]) ? [{ value: String(hs[t + 1]), cause: 'condition', soft: true, msg: '한 번 더 곱했어요. 몇째로 튀어 오른 높이인지 다시 세어 봐요.' }] : []),
        ],
        hints: [
          `${COND} '${ORD[t - 1]}'는 튀어 오른 횟수예요.`,
          `첫째로 튀어 오른 높이: ${H} × ${M(val(f))} = ${hs[1]}(cm)`,
          hs.slice(1, t + 1).map((h, i) => `${ORD[i]}: ${hs[i]} × ${M(val(f))} = ${h}(cm)`).join('\n'),
        ],
        solution: hs.slice(1, t + 1).map((h, i) => `${ORD[i]} 튀어 오른 높이: ${hs[i]} × ${M(val(f))} = ${h}(cm)`),
        key: `u2s2-bounce|${H}|${K(val(f))}|${t}`,
        data: { H, f, t },
      };
    },
    verify(p) { const { H, f, t } = p.data; return close(Number(p.answer.value), H * fnum(f) ** t); },
  });

  const DISH = [['쿠키', '밀가루', 'g'], ['카레', '감자', 'g'], ['떡볶이', '떡', 'g'], ['과일 화채', '수박', 'g'], ['식빵', '우유', 'mL']];
  const tRecipe2 = tpl({
    id: 'u2s2-recipe', sub: S2, style: 'B', styleName: '레시피 양 바꾸기', levels: [1, 3],
    build(r, lv) {
      const [dish, ing, unit] = r.pick(DISH);
      const f = lv === 1 ? r.pick([{ w: 0, n: 1, d: 2 }, { w: 0, n: 1, d: 4 }, { w: 0, n: 3, d: 4 }]) : lv === 2 ? prop(r, 2, 5) : mix(r, 1, 2, 2, 4);
      const Q = f.d * r.int(2, 12) * 10;
      const ans = (Q / f.d) * imp(f).n;
      return {
        text: `${dish} 1판을 만드는 데 ${ing} ${j(`${Q} ${unit}`, '이/가')} 필요해요.\n${j(dish, '을/를')} ${M(val(f))}판만큼 만들려면 ${j(ing, '은/는')} 몇 ${unit} 필요한가요?`,
        answer: { type: 'num', value: String(ans), unit },
        patterns: [
          ...(f.n > 1 || f.w ? [{ value: String(Q / f.d), cause: 'calc', msg: '분모로 나눈 다음 분자를 곱해야 해요.' }] : []),
          ...(!f.w && Number.isInteger(Q - ans) && Q - ans > 0 ? [{ value: String(Q - ans), cause: 'condition', soft: true, msg: '줄어든 양이 아니라 필요한 양을 물었어요.' }] : []),
        ],
        hints: [`1판에 ${j(`${Q} ${unit}`, '이/가')} 필요하니까 ${M(val(f))}판은 ${Q} × ${j(M(val(f)), '으로/로')} 구해요.`, `${Q} ÷ ${f.d} = ${Q / f.d}`, `${Q} × ${F.mkRaw(imp(f).n, f.d)} = ${ans}(${unit})`],
        solution: [`${Q} × ${M(val(f))} = ${ans}(${unit})`],
        key: `u2s2-recipe|${dish}|${Q}|${K(val(f))}`,
        data: { Q, f },
      };
    },
    verify(p) { return close(Number(p.answer.value), p.data.Q * fnum(p.data.f)); },
  });

  const S2_TEMPLATES = [
    tCalc(S2), tPart, tUnit, tRest, tBounce, tRecipe2,
    tEst(S2, (r, lv) => { const xs = GEN.u2s2(r, Math.min(lv + 1, 4)); return { xs, base: xs[0] }; }),
    tOX(S2), tChoice(S2),
  ];

  // ======================================================================
  // 소단원 3: 진분수의 곱셈
  // ======================================================================
  const S3 = 'u2s3';
  const tUnitBox = tpl({
    id: 'u2s3-unitbox', sub: S3, style: 'A', styleName: '단위분수 크기 비교', levels: [1, 4], weak: ['unitfrac'],
    build(r, lv) {
      const a = r.int(2, lv <= 2 ? 5 : 9);
      const less = r.chance(0.5);
      if (less) {
        // 1/a × 1/□ < 1/T  →  a × □ > T  →  가장 작은 □
        const T2 = a * r.int(2, 8) + (r.chance(0.5) ? 0 : r.int(1, a - 1));
        const ans = Math.floor(T2 / a) + 1;
        const patterns = [];
        if (T2 % a === 0) patterns.push({ value: String(T2 / a), cause: 'concept', msg: `□ = ${T2 / a}이면 곱이 딱 ⟪1/${T2}⟫이라서 더 작지 않아요.` });
        patterns.push({ value: String(Math.max(1, Math.ceil(T2 / a) - 1)), cause: 'concept', soft: true, msg: '분모가 클수록 단위분수는 작아져요. □가 더 커야 곱이 작아져요.' });
        return {
          text: `□ 안에 들어갈 수 있는 자연수 중에서 가장 작은 수를 구하세요.\n⟪1/${a}⟫ × ⟪1/□⟫ < ⟪1/${T2}⟫`,
          answer: { type: 'num', value: String(ans) },
          patterns,
          hints: [
            '단위분수끼리 곱하면 분모끼리 곱한 단위분수가 돼요. 분모가 클수록 단위분수는 작아요.',
            `⟪1/${a}⟫ × ⟪1/□⟫의 분모는 ${a} × □예요. 곱이 ⟪1/${T2}⟫보다 작으려면 ${a} × □가 ${T2}보다 커야 해요.`,
            `${a} × □ > ${T2} → □는 ${ans}부터 들어가요.`,
          ],
          solution: [`${a} × □ > ${T2}`, `가장 작은 □: ${ans}`],
          key: `u2s3-unitbox|lt|${a}|${T2}`,
          data: { a, T: T2, less },
        };
      }
      // 1/a × 1/□ > 1/T  →  a × □ < T  (□는 2 이상)
      const T2 = a * r.int(3, 7) + (r.chance(0.5) ? 0 : r.int(1, a - 1));
      const ans = [];
      for (let x = 2; a * x < T2; x++) ans.push(x);
      if (ans.length < 1 || ans.length > 7) return null;
      const patterns = [];
      if (T2 % a === 0) patterns.push({ value: [...ans, T2 / a].map(String), cause: 'concept', msg: `□ = ${T2 / a}이면 곱이 딱 ⟪1/${T2}⟫이라서 더 크지 않아요.` });
      return {
        text: `□ 안에 들어갈 수 있는 자연수를 모두 쓰세요. (□는 1보다 큰 수예요.)\n⟪1/${a}⟫ × ⟪1/□⟫ > ⟪1/${T2}⟫`,
        answer: { type: 'nums', values: ans.map(String) },
        patterns,
        hints: [
          '단위분수끼리 곱하면 분모끼리 곱한 단위분수가 돼요. 분모가 작을수록 단위분수는 커요.',
          `⟪1/${a}⟫ × ⟪1/□⟫의 분모는 ${a} × □예요. 곱이 ⟪1/${T2}⟫보다 크려면 ${a} × □가 ${T2}보다 작아야 해요.`,
          `${a} × □ < ${T2} → □는 ${ans.join(', ')}`,
        ],
        solution: [`${a} × □ < ${T2}`, `□ = ${ans.join(', ')}`],
        key: `u2s3-unitbox|gt|${a}|${T2}`,
        data: { a, T: T2, less },
      };
    },
    verify(p) {
      const { a, T: T2, less } = p.data;
      const ok = (x) => (less ? 1 / (a * x) < 1 / T2 - 1e-15 : 1 / (a * x) > 1 / T2 + 1e-15);
      if (less) { const v = Number(p.answer.value); return ok(v) && (v === 1 || !ok(v - 1)); }
      const exp = [];
      for (let x = 2; x < 200; x++) if (ok(x)) exp.push(x);
      return exp.join(',') === p.answer.values.join(',');
    },
  });

  const FIELD = [['밭', '채소', '배추'], ['밭', '꽃', '장미'], ['꽃밭', '꽃', '튤립'], ['텃밭', '채소', '상추']];
  const BOOK = ['동화책', '과학책', '위인전', '만화책'];
  const tOfPart = tpl({
    id: 'u2s3-ofpart', sub: S3, style: 'A', styleName: '여러 단계 문장제', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const f1 = prop(r, 2, lv <= 2 ? 5 : 8), f2 = prop(r, 2, lv <= 2 ? 5 : 8);
      const rest = lv >= 2 && r.chance(0.6);
      if (!rest) {
        const [place, g, crop] = r.pick(FIELD);
        const ans = F.mul(val(f1), val(f2));
        return {
          text: `${place}의 ${M(val(f1))}에 ${j(g, '을/를')} 심었어요. 그중 ${M(val(f2))}에는 ${j(crop, '을/를')} 심었어요.\n${j(crop, '을/를')} 심은 부분은 ${place} 전체의 몇 분의 몇인가요?`,
          answer: FRAC(ans),
          patterns: [
            { value: K(val(f2)), cause: 'condition', msg: `'그중'이에요. ${place} 전체가 아니라 ${j(g, '을/를')} 심은 부분의 ${F.str(val(f2))}예요.` },
            { value: K(val(f1)), cause: 'condition', soft: true, msg: `${j(g, '을/를')} 심은 부분이 아니라 ${j(crop, '을/를')} 심은 부분을 물었어요.` },
            ...toPatterns(mulMistakes([f1, f2]).filter((m) => m.id !== 'add')),
          ],
          hints: [`${COND} '그중'은 앞에서 말한 부분 안에서라는 뜻이에요.`, `${crop}: ${place} 전체의 ${M(val(f1))}의 ${M(val(f2))} → ${M(val(f1))} × ${M(val(f2))}`, product([f1, f2]).line],
          solution: [`${M(val(f1))} × ${M(val(f2))} = ${M(ans)}`],
          key: `u2s3-ofpart|그중|${K(val(f1))}|${K(val(f2))}`,
          data: { f1, f2, rest },
        };
      }
      const book = r.pick(BOOK);
      const remF = F.sub(1, val(f1));
      const ans = F.mul(remF, val(f2));
      return {
        text: `${j(book, '을/를')} 어제는 전체의 ${j(M(val(f1)), '을/를')} 읽고, 오늘은 나머지의 ${j(M(val(f2)), '을/를')} 읽었어요.\n오늘 읽은 부분은 ${book} 전체의 몇 분의 몇인가요?`,
        answer: FRAC(ans),
        patterns: [
          { value: K(F.mul(val(f1), val(f2))), cause: 'condition', msg: "'어제 읽고 난 나머지의'예요. 어제 읽은 부분에 곱했어요. 먼저 남은 부분을 구해요." },
          { value: K(val(f2)), cause: 'condition', msg: "'나머지의'예요. 전체의 몇 분의 몇이 아니에요. 먼저 남은 부분을 구해요." },
          { value: K(remF), cause: 'condition', soft: true, msg: '남은 부분에서 한 번 더 곱해야 해요.' },
        ],
        hints: [
          `${COND} '나머지의'에 밑줄을 그어 봐요.`,
          `어제 읽고 남은 부분: 1 - ${M(val(f1))} = ${M(remF)}`,
          `오늘 읽은 부분: ${M(remF)} × ${M(val(f2))} = ${M(ans)}`,
        ],
        solution: [`남은 부분: 1 - ${M(val(f1))} = ${M(remF)}`, `오늘 읽은 부분: ${M(remF)} × ${M(val(f2))} = ${M(ans)}`],
        key: `u2s3-ofpart|나머지|${K(val(f1))}|${K(val(f2))}`,
        data: { f1, f2, rest },
      };
    },
    verify(p) {
      const { f1, f2, rest } = p.data;
      const v = rest ? (1 - fnum(f1)) * fnum(f2) : fnum(f1) * fnum(f2);
      return close(fv(p.answer.value), v) && reduced(p.answer.value);
    },
  });

  const tGrid = tpl({
    id: 'u2s3-grid', sub: S3, style: 'A', styleName: '넓이 그림', levels: [1, 4],
    build(r, lv) {
      const cols = r.int(2, lv <= 2 ? 5 : 8), rows = r.int(2, lv <= 2 ? 5 : 8);
      const p = r.int(1, cols - 1), q = r.int(1, rows - 1);
      if (F.gcd(p, cols) !== 1 || F.gcd(q, rows) !== 1) return null;
      const a = { w: 0, n: p, d: cols }, b = { w: 0, n: q, d: rows };
      const ans = F.mul(val(a), val(b));
      const square = lv <= 2 || r.chance(0.5);
      const shape = square ? '정사각형' : '직사각형';
      const lenMode = lv >= 3 && r.chance(0.5);
      if (lenMode) {
        // 가로 p/cols m, 세로 q/rows m인 직사각형의 넓이
        return {
          text: `가로가 ${show(a)} m, 세로가 ${show(b)} m인 직사각형이 있어요.\n이 직사각형의 넓이는 몇 m²인가요?`,
          figure: { type: 'rect', w: `${show(a)} m`, h: `${show(b)} m` },
          answer: FRAC(ans, 'm²'),
          patterns: [
            { value: K(F.add(val(a), val(b))), cause: 'concept', msg: '넓이는 가로와 세로를 더하지 않고 곱해요.' },
            { value: K(F.mul(F.add(val(a), val(b)), 2)), cause: 'concept', soft: true, msg: '둘레가 아니라 넓이를 구해요. (넓이) = (가로) × (세로)' },
            ...toPatterns(mulMistakes([a, b]).filter((m) => m.id !== 'add')),
          ],
          hints: ['직사각형의 넓이 = (가로) × (세로)', `${show(a)} × ${show(b)}`, product([a, b]).line + ' (m²)'],
          solution: [`${product([a, b]).line} (m²)`],
          key: `u2s3-grid|len|${p}/${cols}|${q}/${rows}`,
          data: { xs: [a, b] },
        };
      }
      return {
        text: `${shape}의 가로를 ${cols}등분, 세로를 ${rows}등분했어요. 가로의 ${show(a)}, 세로의 ${show(b)}만큼 겹치는 부분을 색칠했어요.\n색칠한 부분은 ${shape} 전체의 몇 분의 몇인가요?`,
        figure: { type: 'grid', cols, rows, shadeCols: p, shadeRows: q, square },
        answer: FRAC(ans),
        patterns: [
          { value: K(F.make(p + q, cols + rows)), cause: 'concept', msg: '분자끼리, 분모끼리 더하지 않아요. 가로의 몇 분의 몇과 세로의 몇 분의 몇을 곱해요.' },
          { value: K(F.make(p * q, cols + rows)), cause: 'calc', soft: true, msg: `전체 칸 수는 ${cols} × ${rows} = ${cols * rows}칸이에요.` },
          ...toPatterns(mulMistakes([a, b]).filter((m) => !['add', 'numAdd', 'denAdd'].includes(m.id))),
        ],
        hints: [
          '색칠한 칸 수와 전체 칸 수를 세어 봐요. 또는 가로의 몇 분의 몇과 세로의 몇 분의 몇을 곱해요.',
          `전체 ${cols} × ${rows} = ${cols * rows}칸 중 색칠한 칸은 ${p} × ${q} = ${p * q}칸이에요.`,
          `${show(a)} × ${show(b)} = ${F.mkRaw(p * q, cols * rows)}${K(ans) !== `${p * q}/${cols * rows}` ? ' = ' + M(ans) : ''}`,
        ],
        solution: [`${show(a)} × ${show(b)} = ${F.mkRaw(p * q, cols * rows)}${K(ans) !== `${p * q}/${cols * rows}` ? ' = ' + M(ans) : ''}`],
        key: `u2s3-grid|${cols}x${rows}|${p}|${q}`,
        data: { xs: [a, b] },
      };
    },
    verify(p) {
      if (p.figure.type === 'grid') {
        // 다른 방법: 색칠한 칸을 하나씩 센다
        const g = p.figure;
        let on = 0;
        for (let r2 = 0; r2 < g.rows; r2++) for (let c = 0; c < g.cols; c++) if (c < g.shadeCols && r2 < g.shadeRows) on++;
        return close(fv(p.answer.value), on / (g.cols * g.rows)) && reduced(p.answer.value);
      }
      return verifyProduct(p);
    },
  });

  // 수 카드 4장으로 진분수 2개를 만들어 곱이 가장 크게(작게)
  function cardProducts(ds) {
    const out = [];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) for (let m = 0; m < 4; m++) for (let q = 0; q < 4; q++) {
      if (new Set([i, k, m, q]).size < 4) continue;
      const a = ds[i], b = ds[k], c = ds[m], d = ds[q];
      if (a < b && c < d) out.push({ a, b, c, d, v: F.make(a * c, b * d) });
    }
    return out;
  }
  const tCards3 = tpl({
    id: 'u2s3-cards', sub: S3, style: 'A', styleName: '수 카드', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const ds = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      const all = cardProducts(ds);
      if (!all.length) return null;
      const big = r.chance(0.5);
      const sorted = all.slice().sort((x, y) => F.cmp(x.v, y.v));
      const best = big ? sorted[sorted.length - 1] : sorted[0];
      const worst = big ? sorted[0] : sorted[sorted.length - 1];
      const e = `${F.mkRaw(best.a, best.b)} × ${F.mkRaw(best.c, best.d)}`;
      return {
        text: `수 카드 4장을 한 번씩만 사용하여 진분수 2개를 만들려고 해요.\n두 진분수의 곱이 가장 ${big ? '클' : '작을'} 때, 그 곱을 구하세요.`,
        figure: { type: 'cards', nums: ds },
        answer: FRAC(best.v),
        patterns: [
          { value: K(worst.v), cause: 'condition', msg: `곱이 가장 ${big ? '큰' : '작은'} 식을 만들어야 해요. 반대로 만들었어요.` },
          { value: K(F.make(Math.max(...ds) * [...ds].sort((x, y) => y - x)[1], Math.min(...ds) * [...ds].sort((x, y) => x - y)[1])), cause: 'concept', soft: true, msg: '진분수는 분자가 분모보다 작아야 해요.' },
        ],
        hints: [
          `${COND} 진분수(분자 < 분모)를 2개 만들고, 곱이 가장 ${big ? '큰' : '작은'} 경우를 찾아요.`,
          big ? '곱이 크려면 분자는 크게, 분모는 작게 해야 해요. 그래도 분자가 분모보다 작아야 해요.' : '곱이 작으려면 분자는 작게, 분모는 크게 해요.',
          `${e} = ${M(best.v)}`,
        ],
        solution: [`가장 ${big ? '큰' : '작은'} 곱: ${e} = ${M(best.v)}`],
        key: `u2s3-cards|${ds.slice().sort().join('')}|${big}`,
        data: { ds, big },
      };
    },
    verify(p) {
      // 다른 방법: 분자로 쓸 두 장을 먼저 고르고 나머지 두 장을 분모로
      const { ds, big } = p.data;
      let best = null;
      for (let i = 0; i < 4; i++) for (let k = i + 1; k < 4; k++) {
        const nums = [ds[i], ds[k]];
        const dens = ds.filter((_, x) => x !== i && x !== k);
        for (const [d1, d2] of [[dens[0], dens[1]], [dens[1], dens[0]]]) {
          if (nums[0] < d1 && nums[1] < d2) {
            const v = (nums[0] * nums[1]) / (d1 * d2);
            if (best == null || (big ? v > best : v < best)) best = v;
          }
        }
      }
      return best != null && close(best, fv(p.answer.value)) && reduced(p.answer.value);
    },
  });

  const tSeq = tpl({
    id: 'u2s3-seq', sub: S3, style: 'B', styleName: '규칙 찾기', levels: [1, 4],
    build(r, lv) {
      const rr = r.pick(lv <= 2 ? [{ n: 1, d: 2 }, { n: 1, d: 3 }] : [{ n: 1, d: 2 }, { n: 1, d: 3 }, { n: 2, d: 3 }, { n: 3, d: 4 }, { n: 1, d: 4 }]);
      const ratio = F.make(rr.n, rr.d);
      // 수 3개를 보여 주고 넷째 수를 묻는다
      const startNat = r.chance(lv <= 2 ? 0.6 : 0.3);
      const start = startNat ? F.make(rr.d ** 2 * r.int(1, 9)) : val(prop(r, 2, lv <= 2 ? 6 : 9));
      const terms = [start];
      for (let i = 0; i < 3; i++) terms.push(F.mul(terms[terms.length - 1], ratio));
      const ans = terms[3];
      if (!okSize(ans) || F.isInt(ans) && ans.n === 0) return null;
      const diff = F.sub(terms[1], terms[2]);
      const arith = F.sub(terms[2], diff);
      return {
        text: `일정한 규칙으로 수를 늘어놓았어요. □ 안에 알맞은 수를 구하세요.\n${terms.slice(0, 3).map(M).join(',  ')},  □`,
        answer: FRAC(ans),
        patterns: [
          ...(arith.n > 0 ? [{ value: K(arith), cause: 'concept', soft: true, msg: '같은 수를 빼는 규칙이 아니라 같은 수를 곱하는 규칙이에요.' }] : []),
          { value: K(F.mul(ans, ratio)), cause: 'calc', soft: true, msg: '한 번만 곱하면 돼요. □는 바로 다음 수예요.' },
        ],
        hints: [
          '앞의 수에 얼마를 곱하면 뒤의 수가 되는지 찾아봐요.',
          `${M(terms[0])} × ${M(ratio)} = ${M(terms[1])}, ${M(terms[1])} × ${M(ratio)} = ${M(terms[2])} → ${j(M(ratio), '을/를')} 곱하는 규칙이에요.`,
          `${M(terms[2])} × ${M(ratio)} = ${M(ans)}`,
        ],
        solution: [`규칙: ${j(M(ratio), '을/를')} 곱해요.`, `${M(terms[2])} × ${M(ratio)} = ${M(ans)}`],
        key: `u2s3-seq|${terms.slice(0, 3).map(K).join(',')}`,
        data: { terms: terms.slice(0, 3).map(K) },
      };
    },
    verify(p) {
      const t = p.data.terms.map(fv);
      const ratio = t[1] / t[0];
      return close(t[2] / t[1], ratio) && close(fv(p.answer.value), t[2] * ratio) && reduced(p.answer.value);
    },
  });

  const S3_TEMPLATES = [
    tCalc(S3), tUnitBox, tOfPart, tGrid, tCards3,
    tFix(S3, (r, lv) => GEN.u2s3(r, lv), ['denAdd', 'cross', 'numAdd']),
    tOX(S3), tChoice(S3), tFriend(S3), tSeq,
  ];

  // ======================================================================
  // 소단원 4: (대분수)×(대분수), 세 분수의 곱셈
  // ======================================================================
  const S4 = 'u2s4';
  const tThree = tpl({
    id: 'u2s4-three', sub: S4, style: 'A', styleName: '세 분수의 곱셈', levels: [1, 4],
    build(r, lv) {
      const xs = lv === 1 ? [unitF(r, 2, 5), unitF(r, 2, 5), unitF(r, 2, 5)]
        : lv === 2 ? [prop(r, 2, 5), prop(r, 2, 5), prop(r, 2, 5)]
          : lv === 3 ? [prop(r, 2, 6), prop(r, 2, 6), nat(r.int(2, 9))]
            : [mix(r, 1, 2, 2, 5), prop(r, 2, 6), prop(r, 2, 6)];
      const P = product(xs);
      if (!okSize(P.ans)) return null;
      return {
        text: `계산해 보세요.\n${expr(xs)}`,
        answer: FRAC(P.ans),
        patterns: toPatterns(mulMistakes(xs)),
        hints: ['세 분수의 곱셈은 앞에서부터 차례로 계산하거나, 분자끼리·분모끼리 한꺼번에 곱해요.', calcHints(xs, P)[1], `${P.line}\n답은 기약분수로, 가분수는 대분수로 나타내요.`],
        solution: [P.line],
        key: `u2s4-three|${expr(xs)}`,
        data: { xs },
      };
    },
    verify: verifyProduct,
  });

  const tArea = tpl({
    id: 'u2s4-area', sub: S4, style: 'A', styleName: '넓이 그림', levels: [1, 4],
    build(r, lv) {
      const square = r.chance(0.3);
      const a = mix(r, 1, lv <= 2 ? 2 : 4, 2, lv <= 2 ? 4 : 7);
      const b = square ? a : (lv === 1 ? prop(r, 2, 4) : mix(r, 1, lv <= 2 ? 2 : 3, 2, lv <= 2 ? 5 : 7));
      const xs = [a, b];
      const P = product(xs);
      if (!okSize(P.ans)) return null;
      return {
        text: square ? `한 변의 길이가 ${show(a)} m인 정사각형이 있어요.\n이 정사각형의 넓이는 몇 m²인가요?` : `가로가 ${show(a)} m, 세로가 ${show(b)} m인 직사각형이 있어요.\n이 직사각형의 넓이는 몇 m²인가요?`,
        figure: { type: 'rect', w: `${show(a)} m`, h: `${show(b)} m`, square },
        answer: FRAC(P.ans, 'm²'),
        patterns: [
          { value: K(F.mul(F.add(val(a), val(b)), 2)), cause: 'concept', soft: true, msg: '둘레가 아니라 넓이를 구해요. (넓이) = (가로) × (세로)' },
          { value: K(F.add(val(a), val(b))), cause: 'concept', msg: '넓이는 가로와 세로를 곱해요.' },
          ...toPatterns(mulMistakes(xs).filter((m) => m.id !== 'add')),
        ],
        hints: [square ? '정사각형의 넓이 = (한 변) × (한 변)' : '직사각형의 넓이 = (가로) × (세로)', calcHints(xs, P)[1], `${P.line} (m²)`],
        solution: [`${P.line} (m²)`],
        key: `u2s4-area|${expr(xs)}|${square}`,
        data: { xs },
      };
    },
    verify: verifyProduct,
  });

  // 수 카드 3장으로 대분수 만들기
  function mixedCards(ds) {
    const out = [];
    for (const w of ds) for (const nn of ds) for (const d of ds) {
      if (new Set([w, nn, d]).size < 3 || w === 0 || nn >= d) continue;
      out.push({ w, n: nn, d });
    }
    return out;
  }
  const tCards4 = tpl({
    id: 'u2s4-cards', sub: S4, style: 'A', styleName: '수 카드', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const ds = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, lv === 2 ? 6 : 9), 3);
      const all = mixedCards(ds);
      if (all.length < 2) return null;
      const sorted = all.slice().sort((x, y) => F.cmp(val(x), val(y)));
      const lo = sorted[0], hi = sorted[sorted.length - 1];
      const xs = [hi, lo];
      const P = product(xs);
      if (!okSize(P.ans)) return null;
      return {
        text: `수 카드 3장을 한 번씩만 사용하여 대분수를 만들려고 해요.\n만들 수 있는 가장 큰 대분수와 가장 작은 대분수의 곱을 구하세요.`,
        figure: { type: 'cards', nums: ds },
        answer: FRAC(P.ans),
        patterns: [
          { value: K(F.add(val(hi), val(lo))), cause: 'condition', msg: '두 대분수의 합이 아니라 곱을 구해요.' },
          ...toPatterns(mulMistakes(xs).filter((m) => m.id !== 'add')),
          ...(sorted.length > 2 ? [{ value: K(F.mul(val(hi), val(sorted[1]))), cause: 'condition', soft: true, msg: '가장 작은 대분수를 다시 찾아봐요. 자연수 부분이 가장 작고, 분수 부분도 작아야 해요.' }] : []),
        ],
        hints: [
          `${COND} 분수 부분은 진분수(분자 < 분모)여야 해요.`,
          `가장 큰 대분수는 ${show(hi)}, 가장 작은 대분수는 ${j(show(lo), '이에요/예요')}.`,
          P.line,
        ],
        solution: [`가장 큰 대분수: ${show(hi)}, 가장 작은 대분수: ${show(lo)}`, P.line],
        key: `u2s4-cards|${ds.slice().sort().join('')}`,
        data: { ds },
      };
    },
    verify(p) {
      // 다른 방법: 세 자리 순서를 모두 Number로 비교
      const { ds } = p.data;
      const vs = [];
      for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) for (let m = 0; m < 3; m++) {
        if (i === k || k === m || i === m) continue;
        if (ds[k] < ds[m]) vs.push(ds[i] + ds[k] / ds[m]);
      }
      return close(fv(p.answer.value), Math.max(...vs) * Math.min(...vs)) && reduced(p.answer.value);
    },
  });

  const tRange = tpl({
    id: 'u2s4-est', sub: S4, style: 'B', styleName: '어림 먼저', levels: [1, 4],
    build(r, lv) {
      const xs = GEN.u2s4(r, Math.min(lv, 3));
      const [a, b] = xs;
      const lo = a.w * b.w, hi = (a.w + 1) * (b.w + 1);
      const P = product(xs);
      const A = j(show(a), '은/는'), B = j(show(b), '은/는');
      const opts = [
        { text: `${lo}보다 작아요`, correct: false, pattern: { cause: 'concept', msg: `${A} ${a.w}보다 크고, ${B} ${b.w}보다 커요. 그래서 곱은 ${a.w} × ${b.w} = ${lo}보다 커요.` } },
        { text: `${j(lo, '와/과')} ${hi} 사이예요`, correct: true },
        { text: `${hi}보다 커요`, correct: false, pattern: { cause: 'concept', msg: `${A} ${a.w + 1}보다 작고, ${B} ${b.w + 1}보다 작아요. 그래서 곱은 ${a.w + 1} × ${b.w + 1} = ${hi}보다 작아요.` } },
      ];
      return {
        text: `정확히 계산하기 전에 어림해 보세요. 곱은 어느 범위에 있나요?\n${expr(xs)}`,
        answer: { type: 'choice', options: opts },
        keepOrder: true,
        hints: [
          '대분수의 자연수 부분만 보고 어림해 봐요.',
          `${A} ${j(a.w, '와/과')} ${a.w + 1} 사이, ${B} ${j(b.w, '와/과')} ${b.w + 1} 사이의 수예요.`,
          `곱은 ${a.w} × ${b.w} = ${lo}보다 크고, ${a.w + 1} × ${b.w + 1} = ${hi}보다 작아요. (실제 값: ${M(P.ans)})`,
        ],
        solution: [`${lo} < ${expr(xs)} < ${hi}`, `실제 값: ${P.line}`],
        key: `u2s4-est|${expr(xs)}`,
        data: { xs, lo, hi },
      };
    },
    verify(p) {
      const v = prodNum(p.data.xs);
      return v > p.data.lo && v < p.data.hi && p.answer.options[p.answer.value].correct;
    },
  });

  const DISH4 = [['케이크', '버터', '컵'], ['팬케이크', '밀가루', '컵'], ['주스', '오렌지', '개'], ['수프', '우유', '컵']];
  const tRecipe4 = tpl({
    id: 'u2s4-recipe', sub: S4, style: 'B', styleName: '레시피 양 바꾸기', levels: [1, 4],
    build(r, lv) {
      const [dish, ing, unit] = r.pick(DISH4);
      const a = mix(r, 1, lv <= 2 ? 2 : 3, 2, lv <= 2 ? 4 : 6);
      const b = lv === 1 ? nat(r.int(2, 4)) : mix(r, 1, lv <= 2 ? 2 : 3, 2, 4);
      const xs = [a, b];
      const P = product(xs);
      if (!okSize(P.ans)) return null;
      return {
        text: `${dish} 1개를 만드는 데 ${ing} ${show(a)}${j(unit, '이/가')} 필요해요.\n${dish} ${show(b)}개만큼 만들려면 ${j(ing, '은/는')} 몇 ${unit} 필요한가요?`,
        answer: FRAC(P.ans, unit),
        patterns: toPatterns(mulMistakes(xs)),
        hints: [`1개에 ${show(a)}${unit}씩이니까 ${show(b)}개는 ${show(a)} × ${j(show(b), '으로/로')} 구해요.`, calcHints(xs, P)[1], `${P.line} (${unit})`],
        solution: [`${P.line} (${unit})`],
        key: `u2s4-recipe|${dish}|${expr(xs)}`,
        data: { xs },
      };
    },
    verify: verifyProduct,
  });

  const S4_TEMPLATES = [
    tCalc(S4), tThree, tArea,
    tFix(S4, (r, lv) => GEN.u2s4(r, Math.min(lv, 3)), ['sep', 'oneConv']),
    tCards4,
    tArrow(S4, (r, lv) => lv <= 2 ? [mix(r, 1, 2, 2, 4), mix(r, 1, 2, 2, 4)] : [mix(r, 1, 2, 2, 5), mix(r, 1, 2, 2, 4), prop(r, 2, lv === 3 ? 5 : 7)]),
    tEssay(S4, (r, lv) => [mix(r, 1, lv <= 2 ? 2 : 4, 2, lv <= 2 ? 4 : 7), lv === 1 ? nat(r.int(2, 5)) : mix(r, 1, 2, 2, lv <= 2 ? 4 : 6)]),
    tRange, tRecipe4, tChoice(S4), tOX(S4),
  ];

  M5.addTemplates([...S1_TEMPLATES, ...S2_TEMPLATES, ...S3_TEMPLATES, ...S4_TEMPLATES]);
})();
