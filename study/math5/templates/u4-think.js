// 4단원 🧩 사고력 문제 (소수의 곱셈)
//   갈래: 규칙 찾기 · 경우의 수 · 거꾸로 생각하기 · 공간 감각 · 논리·추론
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, D = M5.dec;
  const j = T.j;
  const think = (o) => Object.assign({ unit: 4, style: 'B', levels: [1, 4] }, o);
  const S = (x) => D.str(D.parse(x));
  const mul = (a, b) => D.str(D.mul(a, b));
  const lt = (a, b) => D.cmp(a, b) < 0;

  // 규칙 찾기: 같은 소수씩 커지는 수의 k번째
  const tSeq = think({
    id: 'u4s1-think-seq', sub: 'u4s1', styleName: '규칙 찾기',
    build(r, lv) {
      const a = S(D.make(r.int(lv <= 2 ? 2 : 11, lv <= 2 ? 9 : 99), lv <= 2 ? 1 : 2));
      const k = r.int(lv <= 2 ? 5 : 8, lv <= 2 ? 9 : 16);
      const t = (i) => mul(a, String(i));
      return {
        text: `규칙에 따라 수를 늘어놓았어요. ${k}번째 수를 구하세요.\n${t(1)},  ${t(2)},  ${t(3)},  ${t(4)},  …`,
        answer: { type: 'num', value: t(k) },
        patterns: [{ value: t(k - 1), cause: 'calc', msg: '한 칸 앞의 수예요. 몇 번째인지 다시 세어요.' }, { value: S(D.add(a, String(k))), cause: 'concept', msg: `${a}씩 커지는 규칙이라서 ${k}번째는 ${a} × ${k}예요.` }].filter((pt) => !D.eq(pt.value, t(k))),
        hints: ['앞의 수와 뒤의 수의 차를 구해 봐요.', `${a}씩 커지므로 □번째 수는 ${a} × □예요.`, `${a} × ${k} = ${t(k)}`],
        solution: [`늘어놓은 수는 ${a} × 1, ${a} × 2, ${a} × 3, …`, `${k}번째: ${a} × ${k} = ${t(k)}`],
        key: `u4s1-think-seq|${a}|${k}`,
        data: { a, k },
      };
    },
    verify(p) { return D.eq(p.answer.value, D.mul(p.data.a, String(p.data.k))); },
  });

  // 경우의 수: 수 카드로 만든 □.□ × m 이 범위 안에 드는 경우
  const tCards = think({
    id: 'u4s1-think-cards', sub: 'u4s1', styleName: '경우의 수',
    build(r) {
      const ds = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      const m = r.int(3, 9);
      const all = []; for (const a of ds) for (const b of ds) if (a !== b) all.push(`${a}.${b}`);
      const vals = all.map((x) => mul(x, String(m))).sort((x, y) => D.cmp(x, y));
      const lo = Math.floor(Number(vals[r.int(0, 5)])), hi = Math.ceil(Number(vals[r.int(6, 11)]));
      if (hi <= lo) return null;
      const ok = all.filter((x) => { const v = mul(x, String(m)); return !lt(v, String(lo)) && lt(v, String(hi)); });
      if (!ok.length) return null;
      return {
        text: `수 카드 2장을 골라 □.□ 꼴의 소수를 만들어요. 만든 소수에 ${m}을(를) 곱한 값이 ${lo} 이상 ${hi} 미만이 되는 소수는 모두 몇 개인가요?`.replace(`${m}을(를)`, j(String(m), '을/를')),
        figure: { type: 'cards', nums: ds },
        answer: { type: 'num', value: String(ok.length), unit: '개' },
        patterns: [],
        hints: [`곱이 ${lo} 이상 ${hi} 미만 → 소수는 ${lo} ÷ ${m}과 ${hi} ÷ ${m} 사이에 있어야 해요. 대략 어느 정도 크기인지 먼저 어림해요.`, `만들 수 있는 소수 ${all.length}개 중 일의 자리 숫자가 알맞은 것부터 골라 곱해 봐요.`, `되는 소수: ${ok.join(', ')} → ${ok.length}개`],
        solution: [ok.map((x) => `${x} × ${m} = ${mul(x, String(m))}`).join(', '), `모두 ${ok.length}개`],
        key: `u4s1-think-cards|${ds.join('')}|${m}|${lo}|${hi}`,
        data: { ds, m, lo, hi },
      };
    },
    verify(p) {
      const { ds, m, lo, hi } = p.data; let c = 0;
      for (const a of ds) for (const b of ds) if (a !== b) { const v = D.mul(`${a}.${b}`, String(m)); if (D.cmp(v, String(lo)) >= 0 && D.cmp(v, String(hi)) < 0) c++; }
      return c === Number(p.answer.value);
    },
  });

  // 거꾸로 생각하기: 소수를 곱해야 할 것을 자연수를 곱했을 때
  const tWrong = think({
    id: 'u4s2-think-wrong', sub: 'u4s2', styleName: '거꾸로 생각하기',
    build(r, lv) {
      const x = r.int(lv <= 2 ? 6 : 12, lv <= 2 ? 40 : 250);
      const k = r.int(2, 9), sc = lv <= 2 ? 1 : r.pick([1, 2]);
      const dec = S(D.make(k, sc));
      const wrong = x * k, ans = mul(String(x), dec);
      return {
        text: `어떤 자연수에 ${dec}을(를) 곱해야 할 것을 잘못하여 ${k}을(를) 곱했더니 ${wrong}이(가) 되었어요. 바르게 계산한 값을 구하세요.`.replace(`${dec}을(를)`, j(dec, '을/를')).replace(`${k}을(를)`, j(String(k), '을/를')).replace(`${wrong}이(가)`, j(String(wrong), '이/가')),
        answer: { type: 'num', value: ans },
        patterns: [{ value: mul(String(wrong), dec), cause: 'condition', msg: `잘못 계산한 결과에 ${dec}을 곱했어요. 먼저 어떤 수를 구해야 해요.` }, { value: String(x), cause: 'condition', msg: '어떤 수를 구했어요. 이제 바르게 계산해요.' }].filter((pt) => !D.eq(pt.value, ans)),
        hints: ['먼저 어떤 수를 구해요. 잘못 계산한 식을 거꾸로 생각해요.', `어떤 수 × ${k} = ${wrong} → 어떤 수 = ${wrong} ÷ ${k} = ${x}`, `바른 계산: ${x} × ${dec} = ${ans}`],
        solution: [`어떤 수: ${wrong} ÷ ${k} = ${x}`, `바르게 계산: ${x} × ${dec} = ${ans}`],
        key: `u4s2-think-wrong|${x}|${dec}`,
        data: { x, dec, k },
      };
    },
    verify(p) { const { x, dec, k } = p.data; return D.eq(p.answer.value, D.mul(String(x), dec)) && D.eq(D.make(k, D.parse(dec).s), dec); },
  });

  // 경우의 수: 자연수 □ × (소수) < L
  const tLess = think({
    id: 'u4s2-think-less', sub: 'u4s2', styleName: '경우의 수',
    build(r, lv) {
      const dec = S(D.make(r.int(2, 9), 1)), L = r.int(lv <= 2 ? 3 : 6, lv <= 2 ? 7 : 15);
      let ans = 0, incl = 0;
      for (let b = 1; b < 200; b++) { const v = D.mul(String(b), dec); if (D.cmp(v, String(L)) < 0) ans++; if (D.cmp(v, String(L)) <= 0) incl++; }
      return {
        text: `□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?\n□ × ${dec} < ${L}`,
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(incl), cause: 'condition', msg: '"<"는 같은 경우를 넣지 않아요.' }, { value: String(ans + 1), cause: 'calc', msg: `${ans + 1} × ${dec}을 계산해 보면 ${L}보다 크거나 같아요.` }].filter((pt) => Number(pt.value) !== ans),
        hints: [`□에 1, 2, 3, …을 넣어 ${dec}씩 커지는 값을 차례로 구해 봐요.`, `${ans} × ${dec} = ${mul(String(ans), dec)}, ${ans + 1} × ${dec} = ${mul(String(ans + 1), dec)}`, `□는 1부터 ${ans}까지 → ${ans}개`],
        solution: [`${ans} × ${dec} = ${mul(String(ans), dec)} < ${L}`, `${ans + 1} × ${dec} = ${mul(String(ans + 1), dec)} ≥ ${L}`, `${ans}개`],
        key: `u4s2-think-less|${dec}|${L}`,
        data: { dec, L },
      };
    },
    verify(p) { const { dec, L } = p.data; let c = 0; for (let b = 1; b < 300; b++) if (D.cmp(D.mul(String(b), dec), String(L)) < 0) c++; return c === Number(p.answer.value); },
  });

  // 공간 감각: 가로·세로를 늘이면 넓이는 몇 배
  const tScale = think({
    id: 'u4s3-think-scale', sub: 'u4s3', styleName: '공간 감각',
    build(r) {
      const k1 = r.pick(['1.1', '1.2', '1.5', '0.8', '0.9', '1.3']), k2 = r.chance(0.6) ? k1 : r.pick(['1.1', '1.2', '1.5', '0.8', '0.9', '2']);
      const ans = mul(k1, k2);
      const w = (k) => (D.cmp(k, '1') > 0 ? `${k}배로 늘였어요` : `${k}배로 줄였어요`);
      return {
        text: `직사각형의 가로를 ${k1}배로, 세로를 ${k2}배로 바꾸었어요. 새 직사각형의 넓이는 처음 넓이의 몇 배인가요?`,
        answer: { type: 'num', value: ans, unit: '배' },
        patterns: [{ value: S(D.add(k1, k2)), cause: 'concept', msg: '넓이는 가로 × 세로라서 두 배수를 곱해야 해요.' }, { value: k1 === k2 ? S(D.mul(k1, '2')) : k1, cause: 'concept', msg: '가로와 세로가 모두 바뀌었어요. 두 배수를 곱해요.' }].filter((pt) => !D.eq(pt.value, ans)),
        hints: ['처음 가로를 □, 세로를 △라 하면 처음 넓이는 □ × △예요.', `새 넓이: (□ × ${k1}) × (△ × ${k2}) = □ × △ × ${k1} × ${k2}`, `${k1} × ${k2} = ${ans}배`],
        solution: [`새 넓이 = 처음 넓이 × ${k1} × ${k2}`, `${k1} × ${k2} = ${ans} → ${ans}배`],
        key: `u4s3-think-scale|${k1}|${k2}`,
        data: { k1, k2 },
      };
    },
    verify(p) { return D.eq(p.answer.value, D.mul(p.data.k1, p.data.k2)); },
  });

  // 경우의 수: 수 카드 4장으로 □.□ × □.□의 가장 큰(작은) 곱
  function prods(ds) {
    const o = [];
    for (const a of ds) for (const b of ds) for (const c of ds) for (const d of ds) if (new Set([a, b, c, d]).size === 4) o.push({ x: `${a}.${b}`, y: `${c}.${d}`, v: mul(`${a}.${b}`, `${c}.${d}`) });
    return o;
  }
  const tMax = think({
    id: 'u4s3-think-max', sub: 'u4s3', styleName: '경우의 수',
    build(r) {
      const ds = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4).sort((a, b) => a - b);
      const big = r.chance(0.6);
      const all = prods(ds);
      const best = all.reduce((a, b) => ((big ? D.cmp(b.v, a.v) > 0 : D.cmp(b.v, a.v) < 0) ? b : a));
      const naive = big ? mul(`${ds[3]}.${ds[2]}`, `${ds[1]}.${ds[0]}`) : mul(`${ds[0]}.${ds[1]}`, `${ds[2]}.${ds[3]}`);
      return {
        text: `수 카드 4장을 한 번씩 모두 사용하여 □.□ × □.□의 곱셈식을 만들려고 해요. 곱이 가장 ${big ? '클' : '작을'} 때의 곱을 구하세요.`,
        figure: { type: 'cards', nums: ds },
        answer: { type: 'num', value: best.v },
        patterns: [{ value: naive, cause: 'concept', msg: big ? '가장 큰 소수와 남은 카드로 만든 소수를 곱한다고 곱이 가장 큰 것은 아니에요. 큰 두 수를 각각 일의 자리에 놓아요.' : '작은 두 수를 각각 일의 자리에 놓아야 곱이 작아져요.' }].filter((pt) => !D.eq(pt.value, best.v)),
        hints: [big ? `일의 자리에는 큰 수 ${ds[3]}, ${ds[2]}를 하나씩 놓아요.` : `일의 자리에는 작은 수 ${ds[0]}, ${ds[1]}를 하나씩 놓아요.`, `남은 두 수를 소수 첫째 자리에 놓는 방법 2가지를 비교해요.`, `${best.x} × ${best.y} = ${best.v}`],
        solution: [`가장 ${big ? '큰' : '작은'} 곱: ${best.x} × ${best.y} = ${best.v}`],
        key: `u4s3-think-max|${ds.join('')}|${big}`,
        data: { ds, big },
      };
    },
    verify(p) {
      const { ds, big } = p.data; const all = prods(ds);
      const best = all.reduce((a, b) => ((big ? D.cmp(b.v, a.v) > 0 : D.cmp(b.v, a.v) < 0) ? b : a));
      return D.eq(best.v, p.answer.value);
    },
  });

  // 논리·추론: 곱이 같은 식을 모두 고르기 (소수점 위치)
  const tSame = think({
    id: 'u4s4-think-same', sub: 'u4s4', styleName: '논리·추론',
    build(r) {
      const A = r.int(12, 89), Bv = r.int(12, 89), P = A * Bv;
      const sh = r.int(1, 3);
      const target = S(D.make(P, sh));
      const cand = [];
      for (let i = 0; i <= 3; i++) for (let k = 0; k <= 3; k++) cand.push({ t: `${S(D.make(A, i))} × ${S(D.make(Bv, k))}`, ok: i + k === sh });
      const right = r.sample(cand.filter((c) => c.ok), Math.min(2, cand.filter((c) => c.ok).length));
      const wrong = r.sample(cand.filter((c) => !c.ok), 5 - right.length);
      const opts = r.shuffle([...right, ...wrong]);
      if (new Set(opts.map((o) => o.t)).size < 5) return null;
      return {
        text: `${A} × ${Bv} = ${P}이에요. 이것을 이용하여, 곱이 ${target}인 곱셈식을 모두 고르세요.`.replace(`${P}이에요`, j(String(P), '이에요/예요')),
        answer: { type: 'multi', options: opts.map((o) => ({ text: o.t, key: o.t, correct: o.ok })) },
        keepOrder: true,
        patterns: [],
        hints: ['곱하는 두 수의 소수점 아래 자리 수를 더하면, 곱의 소수점 아래 자리 수가 돼요.', `${target}은(는) 소수점 아래 ${sh}자리예요.`.replace(`${target}은(는)`, j(target, '은/는')), `두 수의 소수점 아래 자리 수의 합이 ${sh}인 식을 골라요.`],
        solution: opts.map((o) => `${o.t} = ${mul(o.t.split(' × ')[0], o.t.split(' × ')[1])}`),
        key: `u4s4-think-same|${A}|${Bv}|${sh}|${opts.map((o) => o.t).join('/')}`,
        data: { target },
      };
    },
    verify(p) { return p.answer.options.every((o, i) => { const [x, y] = o.text.split(' × '); return D.eq(D.mul(x, y), p.data.target) === p.answer.values.includes(i); }); },
  });

  // 거꾸로 생각하기: 어떤 수의 10배(100배)를 알 때 0.1배(0.01배)
  const tTimes = think({
    id: 'u4s4-think-times', sub: 'u4s4', styleName: '거꾸로 생각하기',
    build(r) {
      const x = S(D.make(r.int(11, 999), r.int(0, 2)));
      const up = r.pick(['10', '100', '1000']), down = r.pick(['0.1', '0.01']);
      const known = mul(x, up), ans = mul(x, down);
      if (D.parse(ans).s > 4) return null;
      return {
        text: `어떤 수의 ${up}배는 ${j(known, '이에요/예요')}. 어떤 수의 ${down}배는 얼마인가요?`,
        answer: { type: 'num', value: ans },
        patterns: [{ value: mul(known, down), cause: 'condition', msg: `${up}배 한 수의 ${down}배를 구했어요. 먼저 어떤 수를 구해요.` }, { value: x, cause: 'condition', msg: '어떤 수를 구했어요. 이제 그 수의 ' + down + '배를 구해요.' }].filter((pt) => !D.eq(pt.value, ans)),
        hints: [`어떤 수의 ${up}배가 ${known}이므로, 어떤 수는 ${known}의 소수점을 왼쪽으로 ${up.length - 1}칸 옮긴 수예요.`, `어떤 수 = ${x}`, `${x} × ${down} = ${ans} (소수점을 왼쪽으로 ${down === '0.1' ? 1 : 2}칸)`],
        solution: [`어떤 수: ${x}`, `${x}의 ${down}배: ${ans}`],
        key: `u4s4-think-times|${x}|${up}|${down}`,
        data: { x, up, down },
      };
    },
    verify(p) { const { x, down } = p.data; return D.eq(p.answer.value, D.mul(x, down)); },
  });

  M5.addTemplates([tSeq, tCards, tWrong, tLess, tScale, tMax, tSame, tTimes]);
})();
