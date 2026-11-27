// 2단원 🧩 사고력 문제 (분수의 곱셈)
//   갈래: 규칙 찾기 · 경우의 수 · 퍼즐 · 생활 속 문제
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, F = M5.frac;
  const j = T.j;
  const think = (o) => Object.assign({ unit: 2, style: 'B', levels: [1, 4] }, o);
  const M = F.mk, K = F.key;
  const FR = (f) => ({ type: 'frac', value: K(f) });
  const fpat = (f, cause, msg) => ({ value: K(f), cause, msg });
  const okF = (f) => { f = F.parse(f); return !!f && f.n > 0 && f.d <= 100 && f.n / f.d < 500; };

  // 규칙 찾기: (분수) × 1, × 2, × 3 … 의 k번째
  const tSeq = think({
    id: 'u2s1-think-seq', sub: 'u2s1', styleName: '규칙 찾기',
    build(r, lv) {
      const d = r.int(3, lv <= 2 ? 7 : 12), n = r.int(1, d - 1);
      if (F.gcd(n, d) !== 1) return null;
      const f = F.make(n, d), k = r.int(lv <= 2 ? 5 : 8, lv <= 2 ? 9 : 15);
      const term = (i) => F.mul(f, i);
      const ans = term(k);
      return {
        text: `규칙에 따라 수를 늘어놓았어요. ${k}번째 수를 구하세요.\n${M(term(1))},  ${M(term(2))},  ${M(term(3))},  ${M(term(4))},  …`,
        answer: FR(ans),
        patterns: [fpat(term(k - 1), 'calc', '한 칸 앞의 수예요. 몇 번째인지 다시 세어요.'), fpat(F.add(f, k), 'concept', `${M(f)}씩 커지는 규칙이에요. ${k}번째 수는 ${M(f)} × ${k}예요.`)].filter((pt) => okF(pt.value) && !F.eq(pt.value, ans)),
        hints: ['앞의 수와 뒤의 수의 차를 구해 봐요.', `${M(f)}씩 커지므로 □번째 수는 ${M(f)} × □예요.`, `${M(f)} × ${k} = ${M(ans)}`],
        solution: [`늘어놓은 수는 ${M(f)} × 1, ${M(f)} × 2, ${M(f)} × 3, …이에요.`, `${k}번째 수: ${M(f)} × ${k} = ${M(ans)}`],
        key: `u2s1-think-seq|${n}/${d}|${k}`,
        data: { n, d, k },
      };
    },
    verify(p) { const { n, d, k } = p.data; return F.eq(p.answer.value, F.make(n * k, d)); },
  });

  // 경우의 수: ⟪□/d⟫ × m 이 L보다 작은 자연수 □
  const tLess = think({
    id: 'u2s1-think-less', sub: 'u2s1', styleName: '경우의 수',
    build(r, lv) {
      const d = r.int(3, 9), m = r.int(2, lv <= 2 ? 5 : 9), L = r.int(2, lv <= 2 ? 4 : 7);
      let ans = 0; for (let b = 1; b < 200; b++) if (b * m < L * d) ans++;
      let incl = 0; for (let b = 1; b < 200; b++) if (b * m <= L * d) incl++;
      if (ans < 1) return null;
      return {
        text: `□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?\n⟪□/${d}⟫ × ${m} < ${L}`,
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(incl), cause: 'condition', msg: `"<"는 같은 경우를 넣지 않아요. 곱이 ${L}과 같아지는 □는 빼요.` }].filter((pt) => Number(pt.value) !== ans),
        hints: [`⟪□/${d}⟫ × ${m}은 분모가 ${d}, 분자가 □ × ${m}인 분수예요.`, `${L} = ⟪${L * d}/${d}⟫이므로 □ × ${m} < ${L * d}이 되는 □를 찾아요.`, `□ × ${m}이 ${L * d}보다 작은 자연수 □: 1부터 ${ans}까지 → ${ans}개`],
        solution: [`분자끼리 비교: □ × ${m} < ${L * d}`, `□ × ${m} < ${L * d} → □는 1, 2, …, ${ans}`, `모두 ${ans}개`],
        key: `u2s1-think-less|${d}|${m}|${L}`,
        data: { d, m, L },
      };
    },
    verify(p) { const { d, m, L } = p.data; let c = 0; for (let b = 1; b < 300; b++) if (F.cmp(F.make(b * m, d), L) < 0) c++; return c === Number(p.answer.value); },
  });

  // 경우의 수: N × ⟪□/d⟫ 가 자연수가 되는 □
  const tNat = think({
    id: 'u2s2-think-nat', sub: 'u2s2', styleName: '경우의 수',
    build(r) {
      const d = r.pick([6, 8, 9, 10, 12, 14, 15, 16, 18, 20]), N = r.int(2, 30);
      const list = []; for (let b = 1; b < d; b++) if ((N * b) % d === 0) list.push(b);
      if (list.length < 1 || list.length === d - 1) return null;
      return {
        text: `${N} × ⟪□/${d}⟫의 계산 결과가 자연수가 되도록 □ 안에 1부터 ${d - 1}까지의 자연수를 넣으려고 해요. □ 안에 들어갈 수 있는 수는 모두 몇 개인가요?`,
        answer: { type: 'num', value: String(list.length), unit: '개' },
        patterns: [{ value: String(d - 1), cause: 'concept', msg: '모든 수가 되는 것은 아니에요. 분모로 나누어떨어져야 자연수가 돼요.' }],
        hints: [`${N} × ⟪□/${d}⟫은 분모가 ${d}, 분자가 ${N} × □인 분수예요. ${N} × □가 ${j(String(d), '으로/로')} 나누어떨어져야 자연수가 돼요.`, `${N}과 ${d}을(를) 약분해 보면 □가 어떤 수의 배수여야 하는지 알 수 있어요.`.replace(`${d}을(를)`, j(String(d), '을/를')), `되는 수: ${list.join(', ')} → ${list.length}개`],
        solution: [`${N} × □가 ${d}의 배수가 되어야 해요.`, `□ = ${list.join(', ')}`, `모두 ${list.length}개`],
        key: `u2s2-think-nat|${N}|${d}`,
        data: { N, d },
      };
    },
    verify(p) { const { N, d } = p.data; let c = 0; for (let b = 1; b < d; b++) if (F.isInt(F.make(N * b, d))) c++; return c === Number(p.answer.value); },
  });

  // 생활 속 문제: 남은 것의 일부를 계속 쓰기
  const tRest = think({
    id: 'u2s2-think-rest', sub: 'u2s2', styleName: '생활 속 문제',
    build(r, lv) {
      const k = r.pick([2, 3, 4, 5]), n = lv <= 2 ? 2 : r.int(2, 3);
      const L = r.int(2, 9) * k ** n;
      const keep = F.make(k - 1, k);
      let rem = F.make(L, 1);
      const rows = [];
      for (let i = 0; i < n; i++) { const used = F.mul(rem, F.make(1, k)); rows.push([M(rem), M(used)]); rem = F.mul(rem, keep); }
      const what = r.pick([['리본', 'cm'], ['물', 'mL'], ['찰흙', 'g']]);
      if (!okF(rem)) return null;
      return {
        text: `${what[0]} ${L} ${what[1]}가 있어요. 매일 남은 ${what[0]}의 ⟪1/${k}⟫씩 사용했어요. ${n}일 동안 사용하고 남은 ${j(what[0], '은/는')} 몇 ${what[1]}인가요?`,
        answer: Object.assign(FR(rem), { unit: what[1] }),
        patterns: [
          fpat(F.sub(L, F.mul(F.make(L * n, k))), 'concept', '처음 양의 ⟪1/' + k + '⟫씩이 아니라 "남은 양"의 ⟪1/' + k + '⟫씩 써요. 날마다 쓰는 양이 줄어들어요.'),
          fpat(F.mul(L, F.make(1, k ** n)), 'condition', '마지막 날 사용한 양이 아니라 남은 양을 구해요.'),
        ].filter((pt) => okF(pt.value) && !F.eq(pt.value, rem)),
        hints: [`남은 것의 ⟪1/${k}⟫을 쓰면 남은 것의 ⟪${k - 1}/${k}⟫이 남아요.`, `1일 뒤: ${L} × ⟪${k - 1}/${k}⟫ = ${M(F.mul(L, keep))}`, `${n}일 뒤: ${L}${(' × ⟪' + (k - 1) + '/' + k + '⟫').repeat(n)} = ${M(rem)}`],
        solution: [...rows.map((x, i) => `${i + 1}일째: 남은 ${x[0]} ${what[1]}의 ⟪1/${k}⟫ = ${x[1]} ${what[1]} 사용`), `남은 양: ${M(rem)} ${what[1]}`],
        key: `u2s2-think-rest|${L}|${k}|${n}|${what[0]}`,
        data: { L, k, n },
      };
    },
    verify(p) { const { L, k, n } = p.data; let rem = F.make(L, 1); for (let i = 0; i < n; i++) rem = F.sub(rem, F.mul(rem, F.make(1, k))); return F.eq(rem, p.answer.value); },
  });

  // 규칙 찾기: ⟪1/2⟫ × ⟪2/3⟫ × ⟪3/4⟫ × … (약분이 연달아 되는 곱)
  const tChain = think({
    id: 'u2s3-think-chain', sub: 'u2s3', styleName: '규칙 찾기',
    build(r, lv) {
      const s = lv <= 2 ? 1 : r.int(1, 4), n = r.int(s + 4, lv <= 2 ? 10 : 20);
      const ans = F.make(s, n);
      const shown = [s, s + 1, s + 2].map((a) => `⟪${a}/${a + 1}⟫`);
      return {
        text: `계산해 보세요.\n${shown.join(' × ')} × … × ⟪${n - 1}/${n}⟫`,
        answer: FR(ans),
        patterns: [fpat(F.make(n - 1, n), 'concept', '마지막 분수만 남는 것이 아니에요. 앞 분수의 분모와 뒤 분수의 분자가 차례로 약분돼요.'), fpat(F.make(s, n - 1), 'calc', `마지막 분수의 분모는 ${n}이에요.`)].filter((pt) => !F.eq(pt.value, ans)),
        hints: ['곱하기 전에 약분할 수 있는 것을 먼저 찾아요.', `⟪${s}/${s + 1}⟫ × ⟪${s + 1}/${s + 2}⟫ = ⟪${s}/${s + 2}⟫처럼, 앞 분수의 분모와 뒤 분수의 분자가 약분돼요.`, `모두 약분하면 첫 분수의 분자 ${s}와 마지막 분수의 분모 ${n}만 남아요 → ${M(ans)}`],
        solution: [`이웃한 분수끼리 분모와 분자가 약분돼요.`, `남는 것: 분자 ${s}, 분모 ${n} → ${M(ans)}`],
        key: `u2s3-think-chain|${s}|${n}`,
        data: { s, n },
      };
    },
    verify(p) { const { s, n } = p.data; let f = F.make(1, 1); for (let a = s; a < n; a++) f = F.mul(f, F.make(a, a + 1)); return F.eq(f, p.answer.value); },
  });

  // 퍼즐: ⟪1/□⟫ × ⟪1/△⟫ = ⟪1/N⟫
  const tPairs = think({
    id: 'u2s3-think-pairs', sub: 'u2s3', styleName: '퍼즐',
    build(r) {
      const N = r.pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 42, 48, 60]);
      const pairs = []; for (let a = 2; a * a < N; a++) if (N % a === 0) pairs.push([a, N / a]);
      const withOne = pairs.length + 1;
      return {
        text: `⟪1/□⟫ × ⟪1/△⟫ = ⟪1/${N}⟫이 되도록 □와 △에 자연수를 넣으려고 해요. □는 1보다 크고 △보다 작아요. (□, △)는 모두 몇 쌍인가요?`,
        answer: { type: 'num', value: String(pairs.length), unit: '쌍' },
        patterns: [{ value: String(withOne), cause: 'condition', msg: '□는 1보다 커야 해요. (1, ' + N + ')은 빼요.' }, { value: String(pairs.length * 2), cause: 'condition', msg: '□가 △보다 작아야 해서 순서를 바꾼 것은 세지 않아요.' }].filter((pt) => Number(pt.value) !== pairs.length),
        hints: [`⟪1/□⟫ × ⟪1/△⟫의 분모는 □ × △이므로 □ × △ = ${N}이에요.`, `곱해서 ${N}이 되는 두 수를 작은 수부터 찾아요.`, `${pairs.map((x) => `(${x.join(', ')})`).join(', ')} → ${pairs.length}쌍`],
        solution: [`□ × △ = ${N}`, `1 < □ < △인 쌍: ${pairs.map((x) => `(${x.join(', ')})`).join(', ')}`, `모두 ${pairs.length}쌍`],
        key: `u2s3-think-pairs|${N}`,
        data: { N },
      };
    },
    verify(p) { const N = p.data.N; let c = 0; for (let a = 2; a < N; a++) for (let b = a + 1; b <= N; b++) if (F.eq(F.mul(F.make(1, a), F.make(1, b)), F.make(1, N))) c++; return c === Number(p.answer.value); },
  });

  // 경우의 수: 수 카드로 만든 가장 큰 대분수 × 가장 작은 대분수
  function mixedAll(ds) {
    const o = [];
    for (const w of ds) for (const n of ds) for (const d of ds) if (new Set([w, n, d]).size === 3 && n < d) o.push(F.mixed(w, n, d));
    return o;
  }
  const tCards = think({
    id: 'u2s4-think-cards', sub: 'u2s4', styleName: '경우의 수',
    build(r) {
      const ds = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3).sort((a, b) => a - b);
      const all = mixedAll(ds);
      const big = all.reduce((a, b) => (F.cmp(a, b) > 0 ? a : b)), small = all.reduce((a, b) => (F.cmp(a, b) < 0 ? a : b));
      const ans = F.mul(big, small);
      if (!okF(ans)) return null;
      return {
        text: `수 카드 3장을 한 번씩 모두 사용하여 대분수를 만들려고 해요. 만들 수 있는 가장 큰 대분수와 가장 작은 대분수의 곱을 구하세요.`,
        figure: { type: 'cards', nums: ds },
        answer: FR(ans),
        patterns: [fpat(F.mul(big, big), 'condition', '가장 큰 대분수끼리 곱했어요. 가장 작은 대분수와 곱해요.'), fpat(F.add(big, small), 'concept', '합이 아니라 곱을 구해요.')].filter((pt) => okF(pt.value) && !F.eq(pt.value, ans)),
        hints: ['대분수는 (자연수) + (진분수)예요. 진분수는 분자가 분모보다 작아야 해요.', `가장 큰 대분수: 자연수 부분에 가장 큰 수 ${ds[2]} → ${M(big)} / 가장 작은 대분수: 자연수 부분에 가장 작은 수 ${ds[0]} → ${M(small)}`, `${M(big)} × ${M(small)} = ${M(ans)}`],
        solution: [`가장 큰 대분수 ${M(big)}, 가장 작은 대분수 ${M(small)}`, `${M(big)} × ${M(small)} = ${M(ans)}`],
        key: `u2s4-think-cards|${ds.join('')}`,
        data: { ds },
      };
    },
    verify(p) { const all = mixedAll(p.data.ds); const big = all.reduce((a, b) => (F.cmp(a, b) > 0 ? a : b)), small = all.reduce((a, b) => (F.cmp(a, b) < 0 ? a : b)); return F.eq(F.mul(big, small), p.answer.value); },
  });

  // 경우의 수: ⟪w n/d⟫ × □ < L
  const tMixLess = think({
    id: 'u2s4-think-less', sub: 'u2s4', styleName: '경우의 수',
    build(r, lv) {
      const d = r.int(2, 6), n = r.int(1, d - 1), w = r.int(1, 3);
      if (F.gcd(n, d) !== 1) return null;
      const f = F.mixed(w, n, d), L = r.int(lv <= 2 ? 8 : 12, lv <= 2 ? 20 : 40);
      let ans = 0, incl = 0;
      for (let b = 1; b < 100; b++) { const v = F.mul(f, b); if (F.cmp(v, L) < 0) ans++; if (F.cmp(v, L) <= 0) incl++; }
      if (ans < 1) return null;
      const just = []; for (let b = 1; b <= ans + 1; b++) just.push(`${M(f)} × ${b} = ${M(F.mul(f, b))}`);
      return {
        text: `□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?\n${M(f)} × □ < ${L}`,
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(incl), cause: 'condition', msg: `"<"는 같은 경우를 넣지 않아요.` }, { value: String(ans + 1), cause: 'calc', msg: `${M(f)} × ${ans + 1}을 계산해 보면 ${L}보다 커요.` }].filter((pt) => Number(pt.value) !== ans),
        hints: ['□에 1, 2, 3, …을 차례로 넣어 곱을 구해 봐요.', `${M(f)}은(는) ${w}보다 조금 커요. ${L} ÷ ${w + 1}과 ${L} ÷ ${w} 사이에서 찾아요.`.replace(`${M(f)}은(는)`, `${M(f)}${j(M(f), '은/는').slice(M(f).length)}`), just.slice(-2).join(' / ') + ` → □는 1부터 ${ans}까지`],
        solution: [just.slice(-2).join(', '), `□ = 1, 2, …, ${ans} → ${ans}개`],
        key: `u2s4-think-less|${w}|${n}|${d}|${L}`,
        data: { w, n, d, L },
      };
    },
    verify(p) { const { w, n, d, L } = p.data; const f = F.mixed(w, n, d); let c = 0; for (let b = 1; b < 200; b++) if (F.cmp(F.mul(f, b), L) < 0) c++; return c === Number(p.answer.value); },
  });

  M5.addTemplates([tSeq, tLess, tNat, tRest, tChain, tPairs, tCards, tMixLess]);
})();
