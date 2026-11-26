// 4단원 소수의 곱셈 — (소수)×(자연수) / (자연수)×(소수) / (소수)×(소수) / 곱의 소수점 위치
// 소수는 M5.dec로 정수처럼 계산한다 (부동소수점 오차 없음). verify는 Number 계산으로 따로 확인한다.
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const D = M5.dec, T = M5.text, W = M5.words, TB = M5.tb;
  const j = T.j, n = T.num;

  M5.addUnit({
    id: 4,
    name: '소수의 곱셈',
    subs: [
      { id: 'u4s1', name: '(소수)×(자연수)', concept: '소수에 자연수를 곱할 때는 소수를 자연수처럼 생각해서 곱한 다음, 소수점을 원래 자리에 찍어요.\n예) 2.4 × 3 → 24 × 3 = 72 → 7.2\n2.4는 0.1이 24개예요. 0.1이 24 × 3 = 72개이니까 7.2예요.\n분수로 바꿔 계산해도 돼요. 2.4 × 3 = ⟪24/10⟫ × 3 = ⟪72/10⟫ = 7.2' },
      { id: 'u4s2', name: '(자연수)×(소수)', concept: '자연수에 소수를 곱할 때도 자연수처럼 곱한 다음 소수점을 찍어요.\n예) 6 × 0.4 → 6 × 4 = 24 → 2.4\n6의 0.4배는 6의 ⟪4/10⟫이에요.\n1보다 작은 소수를 곱하면 처음 수보다 작아지고, 1보다 큰 소수를 곱하면 처음 수보다 커져요.' },
      { id: 'u4s3', name: '(소수)×(소수)', concept: '소수끼리 곱할 때는 자연수처럼 곱한 다음, 두 소수의 소수점 아래 자리 수를 더한 만큼 소수점을 찍어요.\n예) 0.3 × 0.2 → 3 × 2 = 6 → 소수점 아래 1 + 1 = 2자리 → 0.06\n예) 1.2 × 0.35 → 12 × 35 = 420 → 소수점 아래 1 + 2 = 3자리 → 0.420 = 0.42' },
      { id: 'u4s4', name: '곱의 소수점 위치', concept: '10, 100, 1000을 곱하면 곱하는 수의 0의 개수만큼 소수점이 오른쪽으로 옮겨져요. 예) 3.25 × 100 = 325\n0.1, 0.01, 0.001을 곱하면 소수점 아래 자리 수만큼 소수점이 왼쪽으로 옮겨져요. 예) 47 × 0.01 = 0.47\n소수끼리 곱하면 곱의 소수점 아래 자리 수는 두 수의 소수점 아래 자리 수를 더한 것과 같아요.' },
    ],
  });

  // ---------- 수 만들기 ----------
  // 소수점 아래 s자리, 정수 부분 iMin~iMax인 소수 (끝자리는 0이 아님)
  function dec(r, iMin, iMax, s) {
    for (;;) {
      const N = r.int(iMin * 10 ** s, (iMax + 1) * 10 ** s - 1);
      if (N % 10 !== 0 && N > 0) return D.str(D.make(N, s));
    }
  }
  const S = (x) => D.str(D.parse(x));
  const F = (x) => n(x); // 쉼표 있는 글자
  const places = (x) => D.parse(x).s;
  const digitsOf = (x) => Math.abs(D.parse(x).n); // 소수점을 뺀 자연수
  const close = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));
  const num = (x) => Number(String(x).replace(/,/g, ''));
  const COND = '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요?';
  const tpl = (o) => Object.assign({ unit: 4 }, o);
  const ok = (v, maxS = 4) => { const d = D.parse(v); return d && d.n > 0 && d.s <= maxS && D.cmp(d, 100000) < 0; };

  // 곱셈 풀이
  function mulInfo(x, y) {
    const a = D.parse(x), b = D.parse(y);
    const N = digitsOf(x) * digitsOf(y);
    const ans = S(D.mul(x, y));
    const sp = a.s + b.s;
    const raw = sp ? D.str(D.make(N, 0)).padStart(sp + 1, '0').replace(new RegExp(`(\\d{${sp}})$`), '.$1') : String(N); // 0을 지우기 전 (0.420)
    const lines = [
      `${F(digitsOf(x))} × ${F(digitsOf(y))} = ${F(N)}`,
      sp ? `소수점 아래 자리 수: ${a.s ? a.s : 0} + ${b.s ? b.s : 0} = ${sp}자리 → ${raw}${raw !== ans ? ` = ${ans}` : ''}` : '',
    ].filter(Boolean);
    return { ans, N, sp, raw, lines, line: `${F(x)} × ${F(y)} = ${F(ans)}` };
  }

  // 자주 하는 실수와 그때 나오는 값
  function decMistakes(x, y) {
    const a = D.parse(x), b = D.parse(y);
    const N = digitsOf(x) * digitsOf(y);
    const sp = a.s + b.s;
    const out = [];
    const add = (id, v, cause, msg, reason) => { if (v != null && ok(v, 4)) out.push({ id, value: S(v), cause, msg, reason }); };
    if (a.s && b.s) add('pointMax', D.make(N, Math.max(a.s, b.s)), 'concept', '곱의 소수점 아래 자리 수는 두 소수의 소수점 아래 자리 수를 더한 것이에요.', '소수점 아래 자리 수를 더하지 않았어요');
    add('pointMore', D.make(N, sp + 1), 'calc', '소수점을 한 자리 더 옮겼어요. 소수점 아래 자리 수를 다시 세어 봐요.', '소수점을 한 자리 왼쪽에 찍었어요');
    if (sp >= 1) add('pointLess', D.make(N, sp - 1), 'calc', '소수점을 한 자리 덜 옮겼어요. 소수점 아래 자리 수를 다시 세어 봐요.', '소수점을 한 자리 오른쪽에 찍었어요');
    add('add', D.add(x, y), 'calc', '곱셈인데 더했어요. 기호를 다시 확인해요.', '곱하지 않고 더했어요');
    if (sp >= 1) add('noPoint', D.make(N, 0), 'concept', '자연수처럼 곱한 다음 소수점을 찍어야 해요.', '소수점을 찍지 않았어요');
    // 2.4 × 3 → 6.4 (자연수 부분에만 곱함)
    const whole = (p, k) => { const ip = Math.floor(D.toNumber(p)); if (ip < 1) return null; return D.add(D.make(ip * k), D.sub(p, ip)); };
    if (a.s && !b.s) add('wholeOnly', whole(x, b.n), 'concept', '소수 부분에도 곱해야 해요. 자연수처럼 곱한 다음 소수점을 찍어요.', '자연수 부분에만 곱했어요');
    if (b.s && !a.s) add('wholeOnly', whole(y, a.n), 'concept', '소수 부분에도 곱해야 해요. 자연수처럼 곱한 다음 소수점을 찍어요.', '자연수 부분에만 곱했어요');
    return out;
  }
  function distinctWrong(ms, ans) {
    const seen = new Set([S(ans)]);
    return ms.filter((m) => { if (seen.has(m.value)) return false; seen.add(m.value); return true; });
  }
  const toPatterns = (ms) => ms.map((m) => ({ value: m.value, cause: m.cause, msg: m.msg, soft: true }));
  const KOR_N = ['', '한', '두', '세', '네', '다섯'];
  const kindOf = (x) => (places(x) ? `소수 ${KOR_N[places(x)]} 자리 수` : '자연수');
  function mulHints(x, y, I) {
    return [
      '소수를 자연수처럼 생각해서 곱한 다음, 소수점 아래 자리 수만큼 소수점을 찍어요.',
      I.lines[0] + (I.sp ? `. ${j(F(x), '은/는')} ${kindOf(x)}, ${j(F(y), '은/는')} ${j(kindOf(y), '이에요/예요')}.` : ''),
      [I.line, ...I.lines.slice(1)].join('\n'),
    ];
  }

  // 소단원별 곱셈 수 만들기
  const GEN = {
    u4s1(r, lv) {
      if (lv === 1) return [dec(r, 0, 0, 1), String(r.int(2, 9))];
      if (lv === 2) return [dec(r, 1, 9, 1), String(r.int(2, 9))];
      if (lv === 3) return [r.chance(0.5) ? dec(r, 0, 0, 2) : dec(r, 1, 9, 2), String(r.int(2, 30))];
      return [dec(r, 1, 19, 2), String(r.int(11, 99))];
    },
    u4s2(r, lv) { const [x, k] = GEN.u4s1(r, lv); return [k, x]; },
    u4s3(r, lv) {
      if (lv === 1) return [dec(r, 0, 0, 1), dec(r, 0, 0, 1)];
      if (lv === 2) return [dec(r, 1, 9, 1), dec(r, 0, 0, 1)];
      if (lv === 3) return [dec(r, 1, 9, 1), dec(r, 1, 9, 1)];
      return [dec(r, 0, 0, 2), dec(r, 0, 9, 1)];
    },
  };
  const verifyMul = (p) => close(num(p.answer.value), num(p.data.x) * num(p.data.y));

  // ---------- 소단원마다 같이 쓰는 틀 ----------
  function tBasic(sub) {
    return tpl({
      id: sub + '-basic', sub, style: 'A', styleName: '기본 계산', levels: [1, 4],
      build(r, lv) {
        const [x, y] = GEN[sub](r, lv);
        const I = mulInfo(x, y);
        if (!ok(I.ans)) return null;
        return {
          text: `계산해 보세요.\n${F(x)} × ${F(y)}`,
          answer: { type: 'num', value: I.ans },
          patterns: toPatterns(decMistakes(x, y)),
          hints: mulHints(x, y, I),
          solution: [I.line, ...I.lines],
          key: `${sub}-basic|${x}|${y}`,
          data: { x, y },
        };
      },
      verify: verifyMul,
    });
  }

  function tChoice(sub, gen = GEN[sub]) {
    return tpl({
      id: sub + '-choice', sub, style: 'B', styleName: '객관식', levels: [1, 4],
      build(r, lv) {
        const [x, y] = gen(r, lv);
        const I = mulInfo(x, y);
        if (!ok(I.ans)) return null;
        const ms = r.shuffle(distinctWrong(decMistakes(x, y), I.ans)).slice(0, 3);
        if (ms.length < 3) return null;
        const opts = [{ text: F(I.ans), v: I.ans, correct: true }, ...ms.map((m) => ({ text: F(m.value), v: m.value, correct: false, pattern: { cause: m.cause, msg: m.msg } }))];
        opts.sort((p, q) => D.cmp(p.v, q.v));
        return {
          text: `계산 결과를 고르세요.\n${F(x)} × ${F(y)}`,
          answer: { type: 'choice', options: opts },
          keepOrder: true,
          hints: mulHints(x, y, I),
          solution: [I.line, ...I.lines],
          key: `${sub}-choice|${x}|${y}`,
          data: { x, y },
        };
      },
      verify(p) { const want = num(p.data.x) * num(p.data.y); return p.answer.options.every((o, i) => close(num(o.v), want) === (i === p.answer.value)); },
    });
  }

  // 어림 먼저: 정확히 계산하기 전에 대략 얼마인지 고르기
  function tEst(sub) {
    return tpl({
      id: sub + '-est', sub, style: 'B', styleName: '어림 먼저', levels: [1, 4],
      build(r, lv) {
        const [x, y] = GEN[sub](r, Math.min(lv + 1, 4));
        const I = mulInfo(x, y);
        const v = num(I.ans);
        if (v < 0.05) return null;
        // 자릿수(10의 거듭제곱)로 어림한 값
        const e = Math.floor(Math.log10(v));
        const lead = Math.round(v / 10 ** e);
        if (lead >= 10 || lead < 1) return null;
        const about = (k) => D.str(D.make(lead * 10 ** Math.max(0, k), Math.max(0, -k)));
        const cands = [e - 2, e - 1, e, e + 1].map(about);
        if (new Set(cands).size < 4) return null;
        const estMsg = `${j(F(x), '을/를')} 약 ${F(roundAbout(x))}, ${j(F(y), '을/를')} 약 ${j(F(roundAbout(y)), '으로/로')} 어림해서 곱해 봐요. 소수점 위치를 생각해요.`;
        const opts = cands.map((c, i) => Object.assign({ text: `약 ${F(c)}`, correct: i === 2 }, i === 2 ? {} : { pattern: { cause: 'concept', msg: estMsg } }));
        return {
          text: `정확히 계산하기 전에 어림해 보세요. 곱은 약 얼마일까요?\n${F(x)} × ${F(y)}`,
          answer: { type: 'choice', options: opts },
          keepOrder: true,
          hints: [
            '두 수를 계산하기 쉬운 수로 어림해서 곱해 봐요.',
            `${j(F(x), '은/는')} 약 ${F(roundAbout(x))}, ${j(F(y), '은/는')} 약 ${j(F(roundAbout(y)), '이에요/예요')}.`,
            `실제로 계산하면 ${I.line}. 그래서 약 ${j(F(about(e)), '이에요/예요')}.`,
          ],
          solution: [I.line, `→ 약 ${F(about(e))}`],
          key: `${sub}-est|${x}|${y}`,
          data: { x, y, about: about(e) },
        };
      },
      verify(p) {
        const v = num(p.data.x) * num(p.data.y);
        const chosen = num(p.answer.options[p.answer.value].text.replace('약 ', ''));
        // 고른 어림값이 실제 값과 같은 자릿수인지 (0.5배 ~ 2배 안)
        return v / chosen > 0.5 && v / chosen < 2 && p.answer.options.filter((o) => { const c = num(o.text.replace('약 ', '')); return v / c > 0.5 && v / c < 2; }).length === 1;
      },
    });
  }
  // 어림: 가장 높은 자리만 남기기 (2.83 → 3, 0.47 → 0.5)
  function roundAbout(x) {
    const v = num(x);
    const e = Math.floor(Math.log10(v));
    const lead = Math.round(v / 10 ** e);
    return D.str(D.make(lead * 10 ** Math.max(0, e), Math.max(0, -e)));
  }

  // 틀린 줄 찾기: 분수로 바꾸어 계산하는 풀이
  function tLine(sub) {
    return TB.lineFind({
      id: sub + '-line', unit: 4, sub, levels: [1, 4],
      gen(r, lv) {
        const [x, y] = GEN[sub](r, Math.min(lv, 3));
        const a = D.parse(x), b = D.parse(y);
        const I = mulInfo(x, y);
        const fr = (d) => (d.s ? `⟪${d.n}/${10 ** d.s}⟫` : String(d.n));
        const den = 10 ** (a.s + b.s);
        const lines = [
          `${F(x)} × ${F(y)} = ${fr(a)} × ${fr(b)}`,
          `= ⟪${I.N}/${den}⟫`,
          `= ${F(I.ans)}`,
        ];
        const which = r.int(0, 2);
        let bad, after;
        if (which === 0) {
          const wrongA = a.s ? `⟪${a.n}/${10 ** (a.s + 1)}⟫` : String(a.n);
          const wrongB = !a.s && b.s ? `⟪${b.n}/${10 ** (b.s + 1)}⟫` : fr(b);
          const wd = (a.s ? 10 ** (a.s + 1) : 1) * (!a.s && b.s ? 10 ** (b.s + 1) : b.s ? 10 ** b.s : 1);
          bad = { i: 0, line: `${F(x)} × ${F(y)} = ${a.s ? wrongA : fr(a)} × ${wrongB}`, msg: `소수를 분수로 바꿀 때 분모를 잘못 썼어요. 소수 한 자리 수는 분모가 10, 두 자리 수는 100이에요.` };
          after = [`= ⟪${I.N}/${wd}⟫`, `= ${F(S(D.make(I.N, Math.round(Math.log10(wd)))))}`];
        } else if (which === 1) {
          const wd = a.s && b.s ? 10 ** Math.max(a.s, b.s) : 10 ** (a.s + b.s + 1);
          bad = { i: 1, line: `= ⟪${I.N}/${wd}⟫`, msg: a.s && b.s ? `분모끼리도 곱해야 해요. 분모끼리 곱하면 ${j(den, '이에요/예요')}.` : `분모를 잘못 썼어요. 자연수는 분자에만 곱하니까 분모는 ${den} 그대로예요.` };
          after = [`= ${F(S(D.make(I.N, Math.round(Math.log10(wd)))))}`];
        } else {
          const wrong = S(D.make(I.N, a.s + b.s + (r.chance(0.5) ? 1 : -1)));
          bad = { i: 2, line: `= ${F(wrong)}`, msg: `분모가 ${den}인 분수는 소수 ${KOR_N[a.s + b.s]} 자리 수로 나타내요.` };
          after = [];
        }
        if (bad.i === 2 && bad.line === lines[2]) return null;
        return {
          problem: j(`${F(x)} × ${F(y)}`, '을/를'),
          lines, bad, after,
          key: `${x}|${y}|${which}`,
          data: { x, y },
        };
      },
      // 친구의 마지막 답은 바른 답과 달라야 한다
      check(p) { const last = T.plain(p.answer.options[p.answer.options.length - 1].text).replace(/^= /, ''); return !close(num(last), num(p.data.x) * num(p.data.y)); },
    });
  }

  // 서술형: 두 가지 방법 (분수로 바꾸기 / 자연수처럼 곱하고 소수점 찍기)
  function tEssay(sub) {
    return tpl({
      id: sub + '-essay', sub, style: 'A', styleName: '서술형', levels: [1, 4],
      build(r, lv) {
        const [x, y] = GEN[sub](r, Math.min(lv, 3));
        const a = D.parse(x), b = D.parse(y);
        const I = mulInfo(x, y);
        const fr = (d) => (d.s ? `⟪${d.n}/${10 ** d.s}⟫` : String(d.n));
        const den = 10 ** (a.s + b.s);
        const m1 = `${F(x)} × ${F(y)} = ${fr(a)} × ${fr(b)} = ⟪${I.N}/${den}⟫ = ${F(I.ans)}`;
        const m2 = `${F(digitsOf(x))} × ${F(digitsOf(y))} = ${F(I.N)} → 소수점 아래 ${a.s + b.s}자리 → ${F(I.ans)}`;
        return {
          text: `${j(`${F(x)} × ${F(y)}`, '을/를')} 두 가지 방법으로 계산하려고 해요.\n풀이 과정을 쓰고 답을 구하세요.`,
          answer: { type: 'num', value: I.ans },
          patterns: toPatterns(decMistakes(x, y)),
          hints: ['방법 1: 소수를 분수로 바꿔서 곱해요. 방법 2: 자연수처럼 곱한 다음 소수점을 찍어요.', `방법 1: ${fr(a)} × ${fr(b)}`, `방법 1: ${m1}\n방법 2: ${m2}`],
          solution: [`방법 1 (분수로 바꾸기): ${m1}`, `방법 2 (자연수처럼 곱하기): ${m2}`],
          essay: {
            checklist: [
              { q: '소수를 분수로 바꿔서 계산했나요?', concept: `소수 한 자리 수는 분모가 10, 두 자리 수는 분모가 100인 분수로 바꿔요. 예) ${F(x)} = ${fr(a)}` },
              { q: '자연수처럼 곱한 다음 소수점을 찍었나요?', concept: '소수점을 떼고 자연수처럼 곱한 다음, 두 수의 소수점 아래 자리 수를 더한 만큼 소수점을 찍어요.' },
              { q: '두 방법의 답이 같은지 확인했나요?', concept: '두 방법으로 계산한 값이 다르면 어딘가 실수한 거예요. 소수점 위치부터 다시 봐요.' },
            ],
          },
          key: `${sub}-essay|${x}|${y}`,
          data: { x, y },
        };
      },
      verify: verifyMul,
    });
  }

  // O/X와 이유
  const OXWHY = {
    u4s1: [
      { s: '2.4 × 3은 0.1이 72개인 수예요.', t: true, why: '2.4는 0.1이 24개이고, 24 × 3 = 72이니까요.', wrong: ['2.4 × 3 = 6.4이니까요.', '0.1이 24 + 3 = 27개이니까요.'] },
      { s: '0.6 × 5의 곱은 5보다 커요.', t: false, why: '0.6은 1보다 작아서 곱하면 5보다 작아져요. 0.6 × 5 = 3이에요.', wrong: ['곱셈을 하면 항상 수가 커지니까요.', '6 × 5 = 30이니까요.'] },
      { s: '1.5 × 4와 1.5 + 1.5 + 1.5 + 1.5의 값은 같아요.', t: true, why: '1.5를 4번 더한 것이 1.5 × 4이고, 둘 다 6이에요.', wrong: ['덧셈과 곱셈은 언제나 결과가 달라요.', '1.5 × 4 = 4.5이니까요.'] },
    ],
    u4s2: [
      { s: '8 × 0.5는 8의 절반과 같아요.', t: true, why: '0.5는 ⟪1/2⟫이니까 8 × 0.5 = 4예요.', wrong: ['8 × 0.5 = 8.5이니까요.', '0.5를 곱하면 수가 커지니까요.'] },
      { s: '12 × 1.3의 곱은 12보다 작아요.', t: false, why: '1.3은 1보다 커서 곱하면 12보다 커져요. 12 × 1.3 = 15.6이에요.', wrong: ['소수를 곱하면 항상 작아지니까요.', '12 × 13 = 156이니까요.'] },
      { s: '5 × 0.3과 0.3 × 5의 값은 같아요.', t: true, why: '곱하는 두 수의 순서를 바꾸어도 곱은 같아요. 둘 다 1.5예요.', wrong: ['5 × 0.3 = 15이고 0.3 × 5 = 1.5이니까요.', '자연수가 앞에 오면 곱이 더 커지니까요.'] },
    ],
    u4s3: [
      { s: '0.3 × 0.2 = 0.6이에요.', t: false, why: '소수점 아래 자리 수를 더해야 해요. 1 + 1 = 2자리 → 0.06이에요.', wrong: ['3 × 2 = 6이니까 0.6이 맞아요.', '0.3 + 0.2 = 0.5이니까요.'] },
      { s: '0.5 × 0.4의 곱은 0.5보다 작아요.', t: true, why: '1보다 작은 0.4를 곱하면 0.5보다 작아져요. 0.5 × 0.4 = 0.2예요.', wrong: ['소수끼리 곱하면 항상 1보다 커지니까요.', '0.5 × 0.4 = 2이니까요.'] },
      { s: '1.2 × 0.35의 곱은 소수 세 자리 수 0.420으로 나타낼 수 있어요.', t: true, why: '12 × 35 = 420이고 소수점 아래 1 + 2 = 3자리라서 0.420 = 0.42예요.', wrong: ['소수끼리 곱하면 항상 소수 한 자리 수가 되니까요.', '12 × 35 = 420이니까 곱은 420이에요.'] },
    ],
    u4s4: [
      { s: '3.25 × 100 = 325예요.', t: true, why: '100을 곱하면 소수점이 오른쪽으로 두 자리 옮겨지니까요.', wrong: ['100을 곱하면 소수점이 왼쪽으로 옮겨지니까요.', '3.25 + 100 = 103.25이니까요.'] },
      { s: '47 × 0.01 = 4.7이에요.', t: false, why: '0.01을 곱하면 소수점이 왼쪽으로 두 자리 옮겨져서 0.47이에요.', wrong: ['0.01을 곱하면 소수점이 오른쪽으로 두 자리 옮겨지니까요.', '0.01은 1보다 크니까요.'] },
      { s: '5.8 × 0.1과 0.58 × 1은 같아요.', t: true, why: '5.8 × 0.1 = 0.58이고 0.58 × 1 = 0.58이에요.', wrong: ['0.1을 곱하면 10배가 되니까요.', '5.8 × 0.1 = 58이니까요.'] },
      { s: '0.4 × 0.06의 곱은 소수 두 자리 수예요.', t: false, why: '소수점 아래 자리 수 1 + 2 = 3자리라서 0.024, 소수 세 자리 수예요.', wrong: ['4 × 6 = 24이니까 두 자리 수예요.', '두 수 중 자리가 더 많은 0.06이 두 자리니까요.'] },
    ],
  };
  function tOXWhy(sub) {
    return TB.oxWhy({
      id: sub + '-oxwhy', unit: 4, sub, levels: [1, 4],
      gen(r) {
        const i = r.int(0, OXWHY[sub].length - 1);
        const q = OXWHY[sub][i];
        return { statement: q.s, truth: q.t, why: q.why, wrong: r.shuffle(q.wrong), key: i };
      },
    });
  }

  // ======================================================================
  // 소단원 1: (소수)×(자연수)
  // ======================================================================
  const LIFE1 = [
    { q: (nm, x, k) => `${j(nm, '은/는')} 매일 우유를 ${x} L씩 마셔요. ${k}일 동안 마신 우유는 모두 몇 L인가요?`, unit: 'L', cnt: (k) => `${k}일 동안` },
    { q: (nm, x, k) => `리본을 한 사람에게 ${x} m씩 ${k}명에게 나누어 주었어요. 나누어 준 리본은 모두 몇 m인가요?`, unit: 'm', cnt: (k) => `${k}명` },
    { q: (nm, x, k) => `무게가 ${x} kg인 사과 ${k}개의 무게는 모두 몇 kg인가요?`, unit: 'kg', cnt: (k) => `사과가 ${k}개` },
    { q: (nm, x, k) => `${j(nm, '은/는')} 자전거로 1시간에 ${x} km를 가요. 같은 빠르기로 ${k}시간 동안 가면 모두 몇 km를 갈까요?`, unit: 'km', cnt: (k) => `${k}시간 동안` },
    { q: (nm, x, k) => `${j(nm, '은/는')} 경기에서 한 번 뛸 때마다 ${x} m씩 뛰어요. ${k}번 뛴 거리는 모두 몇 m인가요?`, unit: 'm', cnt: (k) => `${k}번` },
  ];
  const tLife1 = tpl({
    id: 'u4s1-life', sub: 'u4s1', style: 'A', styleName: '생활 속 문장제', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const c = r.pick(LIFE1);
      const [x, k] = GEN.u4s1(r, lv);
      const I = mulInfo(x, k);
      const nm = r.pick(W.names);
      return {
        text: c.q(nm, F(x), k),
        answer: { type: 'num', value: I.ans, unit: c.unit },
        patterns: [{ value: S(x), cause: 'condition', msg: `${j(c.cnt(k), '이에요/예요')}. 한 번의 양에 ${j(k, '을/를')} 곱해야 해요.` }, ...toPatterns(decMistakes(x, k))],
        hints: [`${COND} 한 번에 ${F(x)} ${c.unit}씩, ${j(c.cnt(k), '이에요/예요')}.`, `식으로 쓰면 ${j(`${F(x)} × ${k}`, '이에요/예요')}.`, `${I.line} (${c.unit})`],
        solution: [`${I.line} (${c.unit})`],
        key: `u4s1-life|${c.unit}|${x}|${k}`,
        data: { x, y: k },
      };
    },
    verify: verifyMul,
  });

  const tBox1 = tpl({
    id: 'u4s1-box', sub: 'u4s1', style: 'A', styleName: '□ 안에 들어갈 수', levels: [1, 4],
    build(r, lv) {
      const x = lv <= 2 ? dec(r, 0, 0, 1) : dec(r, 0, 2, lv === 3 ? 1 : 2);
      const lim = r.int(lv <= 2 ? 3 : 5, lv <= 2 ? 9 : 30);
      // x × □ < lim 인 가장 큰 자연수
      let best = 0;
      while (D.cmp(D.mul(x, best + 1), lim) < 0) best++;
      if (best < 1 || best > 99) return null;
      const exact = D.eq(D.mul(x, best + 1), lim);
      return {
        text: `□ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.\n${F(x)} × □ < ${lim}`,
        answer: { type: 'num', value: String(best) },
        patterns: [
          { value: String(best + 1), cause: exact ? 'concept' : 'calc', msg: exact ? `□에 ${j(best + 1, '을/를')} 넣으면 곱이 딱 ${j(lim, '이에요/예요')}. ${lim}보다 작아야 해요.` : `□에 ${j(best + 1, '을/를')} 넣고 곱해 봐요. ${j(F(D.str(D.mul(x, best + 1))), '은/는')} ${lim}보다 커요.` },
          { value: String(best - 1), cause: 'calc', soft: true, msg: '가장 큰 수를 찾아야 해요. 하나 더 큰 수도 넣어 봐요.' },
        ].filter((pt) => Number(pt.value) > 0),
        hints: ['□에 자연수를 차례로 넣어 곱해 봐요.', `${F(x)} × ${best} = ${F(D.str(D.mul(x, best)))}`, `${F(x)} × ${best} = ${j(F(D.str(D.mul(x, best))), '은/는')} ${lim}보다 작고, ${F(x)} × ${best + 1} = ${j(F(D.str(D.mul(x, best + 1))), '은/는')} ${lim}보다 작지 않아요. → ${best}`],
        solution: [`${F(x)} × ${best} = ${F(D.str(D.mul(x, best)))} < ${lim}`, `${F(x)} × ${best + 1} = ${F(D.str(D.mul(x, best + 1)))} ≥ ${lim}`],
        key: `u4s1-box|${x}|${lim}`,
        data: { x, lim },
      };
    },
    verify(p) { const { x, lim } = p.data; const b = Number(p.answer.value); return num(x) * b < lim - 1e-9 && num(x) * (b + 1) >= lim - 1e-9; },
  });

  // 퍼즐: 빈칸이 여러 개인 계산식 완성하기  (w.□ × k = □.t)
  const tPuzzle1 = tpl({
    id: 'u4s1-puzzle', sub: 'u4s1', style: 'B', styleName: '퍼즐', levels: [2, 4],
    build(r, lv) {
      const w = r.int(1, lv === 4 ? 9 : 5), k = r.int(2, 9), a = r.int(1, 9);
      const prod = (10 * w + a) * k; // 0.1의 개수
      const q = Math.floor(prod / 10), t = prod % 10;
      // 같은 끝자리를 만드는 다른 a가 있으면 답이 하나가 아니라서 버린다
      const sols = [];
      for (let a2 = 0; a2 <= 9; a2++) { const p2 = (10 * w + a2) * k; if (p2 % 10 === t) sols.push(a2); }
      if (sols.length !== 1) return null;
      return {
        text: `□ 안에 알맞은 수를 차례로 쓰세요.\n${w}.□ × ${k} = □.${t}`,
        answer: { type: 'pair', labels: ['앞의 □', '뒤의 □'], values: [String(a), String(q)] },
        patterns: [{ value: [String(a), String(Math.floor(((10 * w + a) * k) / 100) || q + 1)], cause: 'calc', soft: true, msg: '뒤의 □는 곱의 자연수 부분이에요. 0.1이 몇 개인지 세어서 다시 구해 봐요.' }],
        hints: [
          `${w}.□는 0.1이 (${10 * w} + □)개예요. ${j(k, '을/를')} 곱한 결과의 소수 첫째 자리 숫자가 ${j(t, '이/가')} 되어야 해요.`,
          `(□ × ${k})의 일의 자리 숫자가 ${j((t - ((10 * w * k) % 10) + 10) % 10, '이/가')} 되는 □를 찾아요.`,
          `${w}.${a} × ${k} = ${F(D.str(D.make(prod, 1)))} → 앞의 □는 ${a}, 뒤의 □는 ${q}`,
        ],
        solution: [`${w}.${a} × ${k} = ${F(D.str(D.make(prod, 1)))}`],
        key: `u4s1-puzzle|${w}|${k}|${a}`,
        data: { w, k, t },
      };
    },
    verify(p) {
      const { w, k, t } = p.data;
      const [a, q] = p.answer.values.map(Number);
      const v = Math.round((w + a / 10) * k * 10);
      return v % 10 === t && Math.floor(v / 10) === q;
    },
  });

  const U4S1 = [tBasic('u4s1'), tLife1, tBox1, tPuzzle1, tEst('u4s1'), tChoice('u4s1'), tOXWhy('u4s1'), tLine('u4s1'), tEssay('u4s1')];

  // ======================================================================
  // 소단원 2: (자연수)×(소수)
  // ======================================================================
  const tPart2 = tpl({
    id: 'u4s2-times', sub: 'u4s2', style: 'A', styleName: '몇 배 구하기', levels: [1, 4],
    build(r, lv) {
      const u = r.pick([['m', ' '], ['kg', ' '], ['L', ' '], ['km', ' ']]);
      const k = String(r.int(2, lv <= 2 ? 9 : 40));
      const x = lv === 1 ? dec(r, 0, 0, 1) : lv === 2 ? dec(r, 1, 3, 1) : dec(r, 0, 2, 2);
      const I = mulInfo(k, x);
      return {
        text: `${k}${u[1]}${u[0]}의 ${x}배는 몇 ${u[0]}인가요?`,
        answer: { type: 'num', value: I.ans, unit: u[0] },
        patterns: toPatterns(decMistakes(k, x)),
        hints: [`"${k}의 ${x}배"는 ${k} × ${j(x, '으로/로')} 구해요.`, mulHints(k, x, I)[1], `${I.line} (${u[0]})`],
        solution: [`${I.line} (${u[0]})`],
        key: `u4s2-times|${k}|${x}|${u[0]}`,
        data: { x: k, y: x },
      };
    },
    verify: verifyMul,
  });

  const GOODS = ['돼지고기', '소고기', '쌀', '딸기', '포도', '감자', '고구마'];
  const tShop = tpl({
    id: 'u4s2-shop', sub: 'u4s2', style: 'B', styleName: '생활 속 상황', levels: [1, 4],
    build(r, lv) {
      const sale = lv >= 3 && r.chance(0.5);
      if (sale) {
        const price = r.int(20, 99) * 100;
        const rate = r.pick(['0.9', '0.8', '0.75', '0.7', '0.6', '0.5']);
        const item = r.pick(W.goods);
        const I = mulInfo(String(price), rate);
        if (!D.isInt(I.ans)) return null;
        return {
          text: `마트에서 ${price.toLocaleString('ko-KR')}원짜리 ${j(item, '을/를')} 정가의 ${rate}배 가격으로 할인해서 팔아요.\n할인한 가격은 얼마인가요?`,
          answer: { type: 'num', value: I.ans, unit: '원' },
          patterns: [{ value: S(D.sub(price, I.ans)), cause: 'condition', msg: '깎아 준 금액이 아니라 할인한 가격(내야 할 돈)을 물었어요.' }, ...toPatterns(decMistakes(String(price), rate))],
          hints: [`${COND} 정가의 ${rate}배를 구해요.`, `식: ${F(price)} × ${rate}`, `${I.line} (원)`],
          solution: [`${I.line} (원)`],
          key: `u4s2-shop|sale|${price}|${rate}`,
          data: { x: String(price), y: rate },
        };
      }
      const g = r.pick(GOODS);
      const per = r.int(lv <= 2 ? 10 : 20, 99) * 100;
      const kg = lv <= 2 ? dec(r, 0, 2, 1) : dec(r, 0, 2, 2);
      const I = mulInfo(String(per), kg);
      if (!D.isInt(I.ans)) return null;
      return {
        text: `${g} 1 kg의 값은 ${per.toLocaleString('ko-KR')}원이에요.\n${g} ${kg} kg의 값은 얼마인가요?`,
        answer: { type: 'num', value: I.ans, unit: '원' },
        patterns: toPatterns(decMistakes(String(per), kg)),
        hints: ['1 kg의 값에 무게를 곱해요.', `식: ${F(per)} × ${kg}`, `${I.line} (원)`],
        solution: [`${I.line} (원)`],
        key: `u4s2-shop|${g}|${per}|${kg}`,
        data: { x: String(per), y: kg },
      };
    },
    verify: verifyMul,
  });

  const tTravel = tpl({
    id: 'u4s2-travel', sub: 'u4s2', style: 'A', styleName: '생활 속 문장제', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const ctx = r.pick([
        { q: (k, x) => `자동차가 1 km를 가는 데 휘발유가 ${x} L 들어요. 같은 빠르기로 ${k} km를 가려면 휘발유는 몇 L 들까요?`, unit: 'L' },
        { q: (k, x) => `용돈 ${k.toLocaleString('ko-KR')}원 중 ${x}만큼을 저금하려고 해요. 저금할 돈은 얼마인가요?`, unit: '원', money: true },
        { q: (k, x) => `가족 여행으로 ${k} km를 가야 해요. 오늘은 전체 거리의 ${x}만큼 갔어요. 오늘 간 거리는 몇 km인가요?`, unit: 'km' },
      ]);
      const k = ctx.money ? r.int(1, 9) * 1000 : r.int(lv <= 2 ? 10 : 20, lv <= 2 ? 60 : 300);
      const x = ctx.unit === 'L' ? (lv <= 2 ? `0.0${r.int(5, 9)}` : dec(r, 0, 0, 2)) : r.pick(['0.1', '0.2', '0.25', '0.3', '0.4', '0.5', '0.6', '0.75', '0.8']);
      const I = mulInfo(String(k), x);
      if (ctx.money && !D.isInt(I.ans)) return null;
      return {
        text: ctx.q(k, x),
        answer: { type: 'num', value: I.ans, unit: ctx.unit },
        patterns: toPatterns(decMistakes(String(k), x)),
        hints: [`${COND} 무엇에 무엇을 곱해야 하는지 찾아봐요.`, `식: ${F(k)} × ${x}`, `${I.line} (${ctx.unit})`],
        solution: [`${I.line} (${ctx.unit})`],
        key: `u4s2-travel|${ctx.unit}|${k}|${x}`,
        data: { x: String(k), y: x },
      };
    },
    verify: verifyMul,
  });

  // 어림 먼저 (크기 비교): 계산하지 않고 k × x 와 k 비교
  const tCmp2 = tpl({
    id: 'u4s2-cmp', sub: 'u4s2', style: 'B', styleName: '어림 먼저', levels: [1, 3],
    build(r, lv) {
      const k = String(r.int(2, 50));
      const x = r.chance(0.5) ? dec(r, 0, 0, lv === 1 ? 1 : 2) : dec(r, 1, 3, 1);
      const c = D.cmp(D.mul(k, x), k);
      const sign = c > 0 ? '>' : c < 0 ? '<' : '=';
      const big = D.cmp(x, 1) > 0;
      const why = big ? `${j(x, '은/는')} 1보다 커서, 곱하면 ${k}보다 커져요.` : `${j(x, '은/는')} 1보다 작아서, 곱하면 ${k}보다 작아져요.`;
      return {
        text: `계산하지 않고 크기를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.\n(가) ${k} × ${x}\n(나) ${k}`,
        answer: { type: 'ineq', value: sign },
        patterns: [{ value: sign === '<' ? '>' : '<', cause: 'concept', msg: '1보다 작은 수를 곱하면 원래 수보다 작아지고, 1보다 큰 수를 곱하면 커져요.' }],
        hints: [`곱하는 수 ${j(x, '이/가')} 1보다 큰지 작은지 먼저 봐요.`, '1보다 작은 수를 곱하면 작아지고, 1보다 큰 수를 곱하면 커져요.', `${why} → (가) ${sign} (나)`],
        solution: [why, `(가) = ${F(D.str(D.mul(k, x)))}`],
        key: `u4s2-cmp|${k}|${x}`,
        data: { k, x },
      };
    },
    verify(p) { const a = num(p.data.k) * num(p.data.x), b = num(p.data.k); return (a > b ? '>' : a < b ? '<' : '=') === p.answer.value; },
  });

  const U4S2 = [tBasic('u4s2'), tPart2, tShop, tTravel, tCmp2, tChoice('u4s2'), tOXWhy('u4s2'), tLine('u4s2')];

  // ======================================================================
  // 소단원 3: (소수)×(소수)
  // ======================================================================
  const tArea3 = tpl({
    id: 'u4s3-area', sub: 'u4s3', style: 'A', styleName: '넓이 그림', levels: [1, 4],
    build(r, lv) {
      const sq = r.chance(0.3);
      const x = lv === 1 ? dec(r, 0, 0, 1) : lv <= 3 || sq ? dec(r, 1, lv === 2 ? 3 : 9, 1) : dec(r, 1, 5, 2);
      const y = sq ? x : (lv === 1 ? dec(r, 0, 0, 1) : dec(r, lv <= 2 ? 0 : 1, lv <= 2 ? 0 : 5, 1));
      const I = mulInfo(x, y);
      return {
        text: sq ? `한 변의 길이가 ${x} m인 정사각형의 넓이는 몇 m²인가요?` : `가로가 ${x} m, 세로가 ${y} m인 직사각형의 넓이는 몇 m²인가요?`,
        figure: { type: 'rect', w: `${x} m`, h: `${y} m`, square: sq },
        answer: { type: 'num', value: I.ans, unit: 'm²' },
        patterns: [
          { value: S(D.mul(D.add(x, y), 2)), cause: 'concept', soft: true, msg: '둘레가 아니라 넓이를 구해요. (넓이) = (가로) × (세로)' },
          ...toPatterns(decMistakes(x, y)),
        ],
        hints: [sq ? '정사각형의 넓이 = (한 변) × (한 변)' : '직사각형의 넓이 = (가로) × (세로)', mulHints(x, y, I)[1], `${I.line} (m²)`],
        solution: [`${I.line} (m²)`, ...I.lines],
        key: `u4s3-area|${x}|${y}`,
        data: { x, y },
      };
    },
    verify: verifyMul,
  });

  const tLife3 = tpl({
    id: 'u4s3-life', sub: 'u4s3', style: 'A', styleName: '생활 속 문장제', levels: [1, 4],
    build(r, lv) {
      const c = r.pick([
        { q: (a, b) => `1 m의 무게가 ${a} kg인 철근이 있어요. 이 철근 ${b} m의 무게는 몇 kg인가요?`, unit: 'kg' },
        { q: (a, b) => `페인트 1 L로 벽 ${a} m²를 칠할 수 있어요. 페인트 ${b} L로는 벽 몇 m²를 칠할 수 있나요?`, unit: 'm²' },
        { q: (a, b) => `${j(r.pick(W.names), '은/는')} 1시간에 ${a} km를 걸어요. 같은 빠르기로 ${b}시간 동안 걸으면 몇 km를 갈까요?`, unit: 'km' },
      ]);
      const [x, y] = GEN.u4s3(r, lv);
      const I = mulInfo(x, y);
      return {
        text: c.q(x, y),
        answer: { type: 'num', value: I.ans, unit: c.unit },
        patterns: toPatterns(decMistakes(x, y)),
        hints: [`식으로 쓰면 ${j(`${x} × ${y}`, '이에요/예요')}.`, mulHints(x, y, I)[1], `${I.line} (${c.unit})`],
        solution: [`${I.line} (${c.unit})`],
        key: `u4s3-life|${c.unit}|${x}|${y}`,
        data: { x, y },
      };
    },
    verify: verifyMul,
  });

  // 수 카드 4장으로 □.□ × □.□ 곱이 가장 크게(작게)
  const tCards3 = tpl({
    id: 'u4s3-cards', sub: 'u4s3', style: 'A', styleName: '수 카드', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const ds = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      const big = r.chance(0.5);
      let best = null, worst = null, bestE = '';
      const perm = (arr) => arr.length <= 1 ? [arr] : arr.flatMap((v, i) => perm([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [v, ...p]));
      for (const [a, b, c, d] of perm(ds)) {
        const v = D.mul(D.make(10 * a + b, 1), D.make(10 * c + d, 1));
        if (!best || (big ? D.cmp(v, best) > 0 : D.cmp(v, best) < 0)) { best = v; bestE = `${a}.${b} × ${c}.${d}`; }
        if (!worst || (big ? D.cmp(v, worst) < 0 : D.cmp(v, worst) > 0)) worst = v;
      }
      return {
        text: `수 카드 4장을 한 번씩만 사용하여 (소수 한 자리 수) × (소수 한 자리 수)를 만들려고 해요.\n곱이 가장 ${big ? '클' : '작을'} 때, 그 곱을 구하세요.`,
        figure: { type: 'cards', nums: ds },
        answer: { type: 'num', value: S(best) },
        patterns: [{ value: S(worst), cause: 'condition', msg: `곱이 가장 ${big ? '큰' : '작은'} 식을 만들어야 해요. 반대로 만들었어요.` }],
        hints: [
          `${COND} 곱이 가장 ${big ? '크려면' : '작으려면'} 일의 자리에 어떤 수를 놓아야 할지 생각해요.`,
          big ? '가장 큰 두 수를 두 소수의 일의 자리에 놓아요.' : '가장 작은 두 수를 두 소수의 일의 자리에 놓아요.',
          `${bestE} = ${F(S(best))}`,
        ],
        solution: [`${bestE} = ${F(S(best))}`],
        key: `u4s3-cards|${ds.slice().sort().join('')}|${big}`,
        data: { ds, big },
      };
    },
    verify(p) {
      const { ds, big } = p.data;
      let best = null;
      for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) for (let m = 0; m < 4; m++) for (let q = 0; q < 4; q++) {
        if (new Set([i, k, m, q]).size < 4) continue;
        const v = (ds[i] + ds[k] / 10) * (ds[m] + ds[q] / 10);
        if (best == null || (big ? v > best : v < best)) best = v;
      }
      return close(num(p.answer.value), best);
    },
  });

  const U4S3 = [tBasic('u4s3'), tArea3, tLife3, tCards3, tEst('u4s3'), tChoice('u4s3'), tOXWhy('u4s3'), tLine('u4s3'), tEssay('u4s3')];

  // ======================================================================
  // 소단원 4: 곱의 소수점 위치
  // ======================================================================
  const POW = ['10', '100', '1000', '0.1', '0.01', '0.001'];
  const powWord = (k) => ({ 10: '오른쪽으로 한 자리', 100: '오른쪽으로 두 자리', 1000: '오른쪽으로 세 자리', 0.1: '왼쪽으로 한 자리', 0.01: '왼쪽으로 두 자리', 0.001: '왼쪽으로 세 자리' }[k]);
  const inv = { 10: '0.1', 100: '0.01', 1000: '0.001', 0.1: '10', 0.01: '100', 0.001: '1000' };
  const tPow = tpl({
    id: 'u4s4-pow', sub: 'u4s4', style: 'A', styleName: '기본 계산', levels: [1, 4],
    build(r, lv) {
      const k = r.pick(lv === 1 ? ['10', '100', '0.1'] : POW);
      const x = lv === 1 ? dec(r, 1, 9, 1) : lv === 2 ? dec(r, 0, 99, r.int(1, 2)) : r.chance(0.3) ? String(r.int(2, 999)) : dec(r, 0, 99, r.int(1, 3));
      const ans = S(D.mul(x, k));
      if (!ok(ans, 4)) return null;
      const near = k.startsWith('0') ? [S(D.mul(x, D.mul(k, 10))), S(D.mul(x, D.mul(k, '0.1')))] : [S(D.mul(x, D.mul(k, 10))), S(D.mul(x, D.mul(k, '0.1')))];
      return {
        text: `계산해 보세요.\n${F(x)} × ${F(k)}`,
        answer: { type: 'num', value: ans },
        patterns: [
          { value: S(D.mul(x, inv[k])), cause: 'concept', msg: `소수점을 반대쪽으로 옮겼어요. ${j(F(k), '을/를')} 곱하면 소수점이 ${powWord(k)} 옮겨져요.` },
          ...near.filter((v) => ok(v, 4)).map((v) => ({ value: v, cause: 'calc', soft: true, msg: '소수점을 옮기는 자리 수를 다시 세어 봐요. 10, 100, 1000은 0의 개수만큼, 0.1, 0.01, 0.001은 소수점 아래 자리 수만큼 옮겨요.' })),
        ].filter((pt) => ok(pt.value, 4)),
        hints: ['10, 100, 1000을 곱하면 소수점이 오른쪽으로, 0.1, 0.01, 0.001을 곱하면 왼쪽으로 옮겨져요.', `${j(F(k), '을/를')} 곱하면 소수점이 ${powWord(k)} 옮겨져요.`, `${F(x)} × ${F(k)} = ${F(ans)}`],
        solution: [`${F(x)} × ${F(k)} = ${F(ans)} (소수점이 ${powWord(k)})`],
        key: `u4s4-pow|${x}|${k}`,
        data: { x, y: k },
      };
    },
    verify: verifyMul,
  });

  const tKnown = tpl({
    id: 'u4s4-known', sub: 'u4s4', style: 'A', styleName: '곱셈식 이용하기', levels: [1, 4],
    build(r, lv) {
      const A = r.int(lv <= 2 ? 12 : 101, lv <= 2 ? 99 : 999), B = r.int(lv <= 2 ? 2 : 11, lv <= 2 ? 9 : 99);
      const C = A * B;
      if (C % 10 === 0 || A % 10 === 0 || B % 10 === 0) return null;
      const sa = r.int(0, 2), sb = r.int(lv === 1 ? 0 : 1, 2);
      if (sa + sb === 0) return null;
      const a = D.str(D.make(A, sa)), b = D.str(D.make(B, sb));
      const ans = S(D.make(C, sa + sb));
      return {
        text: `${F(A)} × ${F(B)} = ${j(F(C), '을/를')} 이용하여 계산해 보세요.\n${F(a)} × ${F(b)}`,
        answer: { type: 'num', value: ans },
        patterns: [
          { value: String(C), cause: 'concept', msg: '소수점을 찍어야 해요. 두 수의 소수점 아래 자리 수를 더한 만큼 찍어요.' },
          ...(sa && sb ? [{ value: S(D.make(C, Math.max(sa, sb))), cause: 'concept', msg: '곱의 소수점 아래 자리 수는 두 수의 소수점 아래 자리 수를 더한 것이에요.' }] : []),
          { value: S(D.make(C, sa + sb + 1)), cause: 'calc', soft: true, msg: '소수점을 한 자리 더 옮겼어요.' },
        ].filter((pt) => ok(pt.value, 4)),
        hints: [`${j(F(a), '은/는')} ${F(A)}의 ${['1', '0.1', '0.01'][sa]}배, ${j(F(b), '은/는')} ${F(B)}의 ${['1', '0.1', '0.01'][sb]}배예요.`, `소수점 아래 자리 수: ${sa} + ${sb} = ${sa + sb}자리`, `${F(C)} → ${F(ans)}`],
        solution: [`${F(a)} × ${F(b)} = ${F(ans)} (소수점 아래 ${sa + sb}자리)`],
        key: `u4s4-known|${a}|${b}`,
        data: { x: a, y: b },
      };
    },
    verify: verifyMul,
  });

  const tBox4 = tpl({
    id: 'u4s4-box', sub: 'u4s4', style: 'A', styleName: '□ 안에 들어갈 수', levels: [1, 4],
    build(r, lv) {
      const k = r.pick(lv === 1 ? ['10', '100', '0.1'] : POW);
      const x = lv <= 2 ? dec(r, 1, 9, r.int(1, 2)) : dec(r, 0, 99, r.int(1, 3));
      const y = S(D.mul(x, k));
      if (!ok(y, 4)) return null;
      const front = r.chance(0.5);
      return {
        text: `□ 안에 알맞은 수를 구하세요.\n${front ? `□ × ${F(x)}` : `${F(x)} × □`} = ${F(y)}`,
        answer: { type: 'num', value: k },
        patterns: [
          { value: inv[k], cause: 'concept', msg: '소수점이 어느 쪽으로 옮겨졌는지 다시 봐요. 오른쪽으로 옮겨지면 10, 100, 1000을, 왼쪽으로 옮겨지면 0.1, 0.01, 0.001을 곱한 거예요.' },
          ...['10', '100', '1000', '0.1', '0.01', '0.001'].filter((v) => v !== k && v !== inv[k] && (v.startsWith('0') === k.startsWith('0'))).map((v) => ({ value: v, cause: 'calc', soft: true, msg: '소수점이 몇 자리 옮겨졌는지 다시 세어 봐요.' })),
        ],
        hints: [`${j(F(x), '와/과')} ${F(y)}의 소수점 위치를 비교해요.`, `소수점이 ${powWord(k)} 옮겨졌어요.`, `${F(x)} × ${F(k)} = ${F(y)} → □ = ${F(k)}`],
        solution: [`${F(x)} × ${F(k)} = ${F(y)}`],
        key: `u4s4-box|${x}|${k}|${front}`,
        data: { x, y },
      };
    },
    verify(p) { return close(num(p.data.x) * num(p.answer.value), num(p.data.y)); },
  });

  const tPlaces = tpl({
    id: 'u4s4-places', sub: 'u4s4', style: 'A', styleName: '곱의 소수점 아래 자리 수', levels: [1, 4],
    build(r, lv) {
      const x = dec(r, 0, 9, r.int(1, lv <= 2 ? 1 : 2)), y = dec(r, 0, 9, r.int(1, lv <= 2 ? 2 : 3));
      const N = digitsOf(x) * digitsOf(y);
      if (N % 10 === 0) return null; // 끝자리가 0이면 자리 수가 줄어서 헷갈린다
      const ans = places(x) + places(y);
      if (ans > 5) return null;
      return {
        text: `${F(x)} × ${F(y)}의 곱은 소수 몇 자리 수인가요?`,
        answer: { type: 'num', value: String(ans), unit: '자리' },
        patterns: [
          { value: String(Math.max(places(x), places(y))), cause: 'concept', msg: '두 수의 소수점 아래 자리 수를 더해야 해요.' },
        ],
        hints: [`${j(F(x), '은/는')} 소수 ${KOR_N[places(x)]} 자리 수, ${j(F(y), '은/는')} 소수 ${KOR_N[places(y)]} 자리 수예요.`, '곱의 소수점 아래 자리 수는 두 수의 소수점 아래 자리 수를 더한 것이에요.', `${places(x)} + ${places(y)} = ${ans} → ${F(x)} × ${F(y)} = ${F(S(D.mul(x, y)))}`],
        solution: [`${places(x)} + ${places(y)} = ${ans}(자리)`, `${F(x)} × ${F(y)} = ${F(S(D.mul(x, y)))}`],
        key: `u4s4-places|${x}|${y}`,
        data: { x, y },
      };
    },
    verify(p) { return D.parse(S(D.mul(p.data.x, p.data.y))).s === Number(p.answer.value); },
  });

  // 규칙 찾기: 10배씩 또는 0.1배씩
  const tSeq4 = tpl({
    id: 'u4s4-seq', sub: 'u4s4', style: 'B', styleName: '규칙 찾기', levels: [1, 4],
    build(r, lv) {
      const k = r.pick(['10', '0.1']);
      const start = k === '10' ? dec(r, 0, 0, lv <= 2 ? 2 : 3) : String(r.int(11, 999));
      const t = [start];
      for (let i = 0; i < 3; i++) t.push(S(D.mul(t[i], k)));
      if (!t.every((v) => ok(v, 4))) return null;
      return {
        text: `일정한 규칙으로 수를 늘어놓았어요. □ 안에 알맞은 수를 구하세요.\n${t.slice(0, 3).map(F).join(',  ')},  □`,
        answer: { type: 'num', value: t[3] },
        patterns: [
          { value: S(D.mul(t[2], inv[k])), cause: 'concept', msg: `규칙을 반대로 했어요. 앞의 수에 ${j(F(k), '을/를')} 곱하는 규칙이에요.` },
          { value: S(D.mul(t[3], k)), cause: 'calc', soft: true, msg: '□는 바로 다음 수예요. 한 번만 곱해요.' },
        ].filter((pt) => ok(pt.value, 4)),
        hints: ['앞의 수와 뒤의 수의 소수점 위치를 비교해 봐요.', `소수점이 ${powWord(k)}씩 옮겨져요. → ${j(F(k), '을/를')} 곱하는 규칙`, `${F(t[2])} × ${F(k)} = ${F(t[3])}`],
        solution: [`규칙: ${j(F(k), '을/를')} 곱해요.`, `${F(t[2])} × ${F(k)} = ${F(t[3])}`],
        key: `u4s4-seq|${t.slice(0, 3).join(',')}`,
        data: { t: t.slice(0, 3), k },
      };
    },
    verify(p) { const { t, k } = p.data; return close(num(t[1]), num(t[0]) * num(k)) && close(num(p.answer.value), num(t[2]) * num(k)); },
  });

  // 거꾸로 문제
  const tBack4 = tpl({
    id: 'u4s4-back', sub: 'u4s4', style: 'B', styleName: '거꾸로 문제', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const k1 = r.pick(['0.1', '0.01', '0.001']);
      const X = String(r.int(11, 999));
      if (Number(X) % 10 === 0) return null;
      const y = S(D.mul(X, k1));
      const k2 = r.pick(['10', '100', '1000']);
      const ans = S(D.mul(X, k2));
      return {
        text: `어떤 수에 ${j(k1, '을/를')} 곱했더니 ${j(F(y), '이/가')} 되었어요.\n어떤 수에 ${j(k2, '을/를')} 곱하면 얼마인가요?`,
        answer: { type: 'num', value: ans },
        patterns: [
          { value: S(D.mul(y, k2)), cause: 'condition', msg: `${j(F(y), '은/는')} 어떤 수가 아니에요. 먼저 어떤 수를 구해요.` },
          { value: X, cause: 'condition', msg: `어떤 수에 ${j(k2, '을/를')} 곱한 값을 물었어요.` },
        ],
        hints: [`${COND} 먼저 '어떤 수'를 구해요.`, `${j(k1, '을/를')} 곱하면 소수점이 ${powWord(k1)} 옮겨져요. 거꾸로 하면 어떤 수는 ${j(F(X), '이에요/예요')}.`, `${F(X)} × ${k2} = ${F(ans)}`],
        solution: [`어떤 수: ${F(X)} (${F(X)} × ${k1} = ${F(y)})`, `${F(X)} × ${k2} = ${F(ans)}`],
        key: `u4s4-back|${X}|${k1}|${k2}`,
        data: { X, k1, k2, y },
      };
    },
    verify(p) { const { X, k1, k2, y } = p.data; return close(num(X) * num(k1), num(y)) && close(num(p.answer.value), num(X) * num(k2)); },
  });

  const U4S4 = [tPow, tKnown, tBox4, tPlaces, tSeq4, tBack4, tOXWhy('u4s4'),
    tChoice('u4s4', (r, lv) => [lv <= 2 ? dec(r, 1, 9, r.int(1, 2)) : dec(r, 0, 99, r.int(1, 3)), r.pick(lv === 1 ? ['10', '100', '0.1'] : POW)])];

  M5.addTemplates([...U4S1, ...U4S2, ...U4S3, ...U4S4]);
})();
