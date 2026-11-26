// 기획서 6번 B: 1·2단원에 더하는 새로운 문제 스타일
//   O/X와 이유, 틀린 줄 찾기, 표·그래프 읽기, 퍼즐(빈칸 여러 개), 거꾸로 문제
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const D = M5.dec, F = M5.frac, T = M5.text, W = M5.words, TB = M5.tb;
  const j = T.j, n = T.num;

  // ---------------------------------------------------------------- O/X와 이유
  const OXWHY = {
    u1s1: [
      { s: '10 이상인 수에는 10이 들어가요.', t: true, why: "'이상'은 기준 수와 같거나 큰 수라서 10도 들어가요.", wrong: ['10보다 큰 수만 들어가니까요.', "'10 이하'와 같은 뜻이니까요."] },
      { s: '15 이하인 자연수 중 가장 큰 수는 14예요.', t: false, why: "'이하'는 기준 수도 들어가서 가장 큰 수는 15예요.", wrong: ['15는 들어가지 않으니까요.', "'이하'는 기준 수보다 작은 수만이니까요."] },
    ],
    u1s2: [
      { s: '20 초과인 자연수 중 가장 작은 수는 21이에요.', t: true, why: "'초과'는 20보다 큰 수라서 20은 들어가지 않고 21부터예요.", wrong: ['20도 들어가니까 20이에요.', "'초과'는 20보다 작은 수니까요."] },
      { s: "수직선에서 '미만'은 ●(색칠한 점)으로 나타내요.", t: false, why: "'미만'은 기준 수가 들어가지 않아서 ○(빈 점)으로 나타내요.", wrong: ["'미만'은 기준 수를 포함하니까요.", "'이상'과 '미만'은 같은 점으로 나타내니까요."] },
    ],
    u1s3: [
      { s: "'5 이상 9 미만인 자연수'는 5, 6, 7, 8로 4개예요.", t: true, why: '5는 들어가고 9는 들어가지 않아서 5부터 8까지 4개예요.', wrong: ['5와 9가 모두 들어가서 5개예요.', '5와 9가 모두 빠져서 3개예요.'] },
      { s: "'10 초과 15 이하인 수'에는 10과 15가 모두 들어가요.", t: false, why: "'초과'라서 10은 빠지고, '이하'라서 15는 들어가요.", wrong: ["'초과'와 '이하' 모두 경계 수가 들어가니까요.", '10과 15 모두 빠지니까요.'] },
    ],
    u1s4: [
      { s: '3000을 올림하여 백의 자리까지 나타내면 3100이에요.', t: false, why: '백의 자리 아래가 모두 0이라서 올림해도 3000 그대로예요.', wrong: ['올림은 무조건 1 크게 하니까요.', '3000의 백의 자리 숫자를 1 크게 하니까요.'] },
      { s: '4210을 올림하여 천의 자리까지 나타내면 5000이에요.', t: true, why: '천의 자리 아래에 0이 아닌 숫자가 있어서 천의 자리를 1 크게 하고 아래는 0으로 써요.', wrong: ['반올림하면 4000이니까 올림해도 4000이에요.', '4210은 5000에 더 가까우니까요.'] },
    ],
    u1s5: [
      { s: '2999를 버림하여 천의 자리까지 나타내면 2000이에요.', t: true, why: '천의 자리 아래 숫자를 모두 0으로 바꾸니까 2000이에요.', wrong: ['2999는 3000에 더 가까우니까 3000이에요.', '버림하면 1 작아지니까 1999예요.'] },
      { s: '버림하여 나타낸 수는 처음 수보다 클 수 있어요.', t: false, why: '버림은 아래 자리를 버리기만 해서 처음 수와 같거나 작아요.', wrong: ['버림해도 올라가는 경우가 있으니까요.', '버림과 반올림은 같으니까요.'] },
    ],
    u1s6: [
      { s: '2450을 반올림하여 백의 자리까지 나타내면 2500이에요.', t: true, why: '백의 자리 바로 아래 숫자가 5라서 올려요.', wrong: ['5는 버리는 숫자라서 2400이에요.', '2450은 2400과 2500의 가운데라서 정할 수 없어요.'] },
      { s: '1349를 반올림하여 백의 자리까지 나타내면 1400이에요.', t: false, why: '백의 자리 바로 아래 숫자는 4라서 버리고 1300이에요.', wrong: ['일의 자리 9를 올려 1350, 다시 올려 1400이 되니까요.', '반올림은 올림과 같으니까요.'] },
    ],
    u1s7: [
      { s: '학생 123명이 10명씩 탈 수 있는 보트에 모두 타려면 보트 12대면 돼요.', t: false, why: '남는 학생 3명도 타야 해서 올림으로 13대가 필요해요.', wrong: ['12대에 120명이 타니까 충분해요.', '반올림하면 12대니까요.'] },
      { s: '사탕 237개를 10개씩 봉지에 담아 팔 때 팔 수 있는 봉지 수는 버림으로 구해요.', t: true, why: '10개를 다 채우지 못한 봉지는 팔 수 없어서 남는 것을 버려요.', wrong: ['남김없이 모두 담아야 하니까 올림이에요.', '대략 나타내니까 반올림이에요.'] },
    ],
    u2s1: [
      { s: '⟪2/5⟫ × 3 = ⟪6/15⟫이에요.', t: false, why: '분모는 그대로 두고 분자에만 3을 곱해서 ⟪6/5⟫ = ⟪1 1/5⟫이에요.', wrong: ['분모와 분자에 모두 3을 곱하니까요.', '⟪2/5⟫ + 3과 같으니까요.'] },
      { s: '⟪1 1/4⟫ × 2 = ⟪2 1/2⟫이에요.', t: true, why: '⟪5/4⟫ × 2 = ⟪10/4⟫ = ⟪2 1/2⟫이에요.', wrong: ['자연수 부분만 곱하면 ⟪2 1/4⟫이니까 틀려요.', '분수 부분만 곱해서 ⟪1 1/2⟫이에요.'] },
    ],
    u2s2: [
      { s: '20의 ⟪3/4⟫은 15예요.', t: true, why: '20을 4묶음으로 나누면 한 묶음은 5이고, 3묶음은 15예요.', wrong: ['20 × 4 ÷ 3을 계산하니까요.', '20에서 ⟪3/4⟫을 빼니까요.'] },
      { s: '6 × ⟪2/3⟫의 곱은 6보다 커요.', t: false, why: '⟪2/3⟫은 1보다 작아서 곱하면 6보다 작아져요. 6 × ⟪2/3⟫ = 4예요.', wrong: ['곱셈을 하면 항상 커지니까요.', '6 × 2 = 12니까요.'] },
    ],
    u2s3: [
      { s: '⟪1/4⟫ × ⟪1/5⟫ = ⟪1/9⟫이에요.', t: false, why: '분모끼리 곱해야 해서 ⟪1/20⟫이에요.', wrong: ['분모끼리 더하면 되니까 맞아요.', '분자끼리 더해야 하니까 ⟪2/9⟫예요.'] },
      { s: '⟪3/4⟫ × ⟪2/3⟫ = ⟪1/2⟫이에요.', t: true, why: '⟪6/12⟫를 약분하면 ⟪1/2⟫이에요.', wrong: ['분자끼리, 분모끼리 더하면 ⟪5/7⟫이라서 틀려요.', '약분하면 안 되니까 ⟪6/12⟫만 맞아요.'] },
    ],
    u2s4: [
      { s: '⟪1 1/2⟫ × ⟪2 1/3⟫ = ⟪2 1/6⟫이에요.', t: false, why: '자연수끼리, 분수끼리 따로 곱하면 안 돼요. ⟪3/2⟫ × ⟪7/3⟫ = ⟪3 1/2⟫이에요.', wrong: ['1 × 2 = 2, ⟪1/2⟫ × ⟪1/3⟫ = ⟪1/6⟫이니까 맞아요.', '대분수끼리는 곱할 수 없으니까요.'] },
      { s: '⟪1/2⟫ × ⟪1/3⟫ × ⟪1/4⟫ = ⟪1/24⟫이에요.', t: true, why: '분모끼리 곱하면 2 × 3 × 4 = 24예요.', wrong: ['분모끼리 더하면 9라서 ⟪1/9⟫이에요.', '앞의 두 수만 곱해서 ⟪1/6⟫이에요.'] },
    ],
  };
  const oxTemplates = Object.keys(OXWHY).map((sub) => TB.oxWhy({
    id: sub + '-oxwhy', unit: Number(sub[1]), sub, levels: [1, 4],
    gen(r) { const i = r.int(0, OXWHY[sub].length - 1); const q = OXWHY[sub][i]; return { statement: q.s, truth: q.t, why: q.why, wrong: r.shuffle(q.wrong), key: i }; },
  }));

  // ---------------------------------------------------------------- 1단원: 반올림 풀이에서 틀린 줄 찾기
  const PLACE = { 1: '십의 자리', 2: '백의 자리', 3: '천의 자리' };
  const BELOW = { 1: '일의 자리', 2: '십의 자리', 3: '백의 자리' };
  const roundLine = TB.lineFind({
    id: 'u1s6-line', unit: 1, sub: 'u1s6', levels: [1, 4],
    gen(r, lv) {
      const e = lv <= 2 ? r.int(1, 2) : r.int(2, 3);
      let x;
      do { x = r.int(10 ** (e + 1), 10 ** (e + 2) - 1); } while (x % 10 ** e === 0);
      const dgt = Math.floor(x / 10 ** (e - 1)) % 10;
      const up = dgt >= 5;
      const ans = D.str(D.round(String(x), 'round', e));
      const other = D.str(D.round(String(x), up ? 'floor' : 'ceil', e));
      const lines = [
        `① ${PLACE[e]} 바로 아래는 ${j(BELOW[e], '이에요/예요')}.`,
        `② ${BELOW[e]} 숫자는 ${j(dgt, '이에요/예요')}.`,
        `③ ${j(dgt, '은/는')} ${up ? '5 이상이라서 올려요.' : '4 이하라서 버려요.'}`,
        `④ ${n(x)} → ${n(ans)}`,
      ];
      const k = r.int(0, 2);
      let bad, after;
      if (k === 0 && e >= 2) {
        const wrongBelow = BELOW[e - 1];
        const d2 = Math.floor(x / 10 ** (e - 2)) % 10;
        bad = { i: 0, line: `① ${PLACE[e]} 바로 아래는 ${j(wrongBelow, '이에요/예요')}.`, msg: `${PLACE[e]} 바로 아래는 ${j(BELOW[e], '이에요/예요')}.` };
        const up2 = d2 >= 5;
        after = [`② ${wrongBelow} 숫자는 ${j(d2, '이에요/예요')}.`, `③ ${j(d2, '은/는')} ${up2 ? '5 이상이라서 올려요.' : '4 이하라서 버려요.'}`, `④ ${n(x)} → ${n(up2 ? D.str(D.round(String(x), 'ceil', e)) : D.str(D.round(String(x), 'floor', e)))}`];
        if (up2 === up) return null; // 결과가 같으면 친구 답이 틀리지 않는다
      } else if (k <= 1) {
        bad = { i: 2, line: `③ ${j(dgt, '은/는')} ${up ? '5보다 작지 않으니까 버려요.' : '0이 아니니까 올려요.'}`, msg: '반올림은 바로 아래 숫자가 0~4이면 버리고, 5~9이면 올려요.' };
        after = [`④ ${n(x)} → ${n(other)}`];
      } else {
        const wrong = up ? D.str(D.add(D.round(String(x), 'floor', e), 0)) : D.str(D.round(String(x), 'ceil', e));
        bad = { i: 3, line: `④ ${n(x)} → ${n(wrong)}`, msg: `${up ? '올린다고 했으니' : '버린다고 했으니'} ${PLACE[e]} 숫자를 ${up ? '1 크게 하고' : '그대로 두고'} 아래 자리는 모두 0으로 써요.` };
        after = [];
      }
      return { problem: `${j(n(x), '을/를')} 반올림하여 ${PLACE[e]}까지`, verb: '나타낸', lines, bad, after, key: `${x}|${e}|${k}`, data: { x, e } };
    },
  });

  // ---------------------------------------------------------------- 1단원: 막대그래프 읽기
  const inK = (k, x, b) => (k === '이상' ? x >= b : k === '초과' ? x > b : k === '이하' ? x <= b : x < b);
  const barsRange = {
    id: 'u1s3-bars', unit: 1, sub: 'u1s3', style: 'B', styleName: '표·그래프 읽기', levels: [1, 4],
    build(r, lv) {
      const cnt = lv <= 2 ? 5 : 6;
      const names = r.sample(W.names, cnt);
      const vals = names.map(() => r.int(4, 16) * 5);
      const k1 = r.pick(['이상', '초과']), k2 = r.pick(['이하', '미만']);
      const sorted = [...new Set(vals)].sort((a, b) => a - b);
      if (sorted.length < 4) return null;
      const a = sorted[1], b = sorted[sorted.length - 2];
      const cntIn = vals.filter((v) => inK(k1, v, a) && inK(k2, v, b)).length;
      const twin = vals.filter((v) => inK(k1 === '이상' ? '초과' : '이상', v, a) && inK(k2 === '이하' ? '미만' : '이하', v, b)).length;
      if (!cntIn) return null;
      return {
        text: `친구들의 윗몸 일으키기 기록을 막대그래프로 나타냈어요.\n기록이 ${a}번 ${k1} ${b}번 ${k2}인 친구는 몇 명인가요?`,
        figure: { type: 'bars', title: '윗몸 일으키기 기록', unit: '번', labels: names, values: vals, step: 5, max: 85, labelEvery: 2 },
        answer: { type: 'num', value: String(cntIn), unit: '명' },
        patterns: [{ value: String(twin), cause: 'concept', soft: true, msg: "경계에 있는 기록이 들어가는지 다시 봐요. '이상'·'이하'는 들어가고 '초과'·'미만'은 들어가지 않아요." }].filter((pt) => pt.value !== '0'),
        hints: ['세로 눈금 한 칸은 5번이에요. 먼저 막대마다 기록을 읽어요.', `기록: ${names.map((nm, i) => `${nm} ${vals[i]}`).join(', ')}`, `${a}번 ${k1} ${b}번 ${k2}: ${names.filter((nm, i) => inK(k1, vals[i], a) && inK(k2, vals[i], b)).join(', ')} → ${cntIn}명`],
        solution: [`기록: ${names.map((nm, i) => `${nm} ${vals[i]}`).join(', ')}`, `조건에 맞는 친구: ${cntIn}명`],
        key: `u1s3-bars|${vals.join(',')}|${k1}${k2}`,
        data: { vals, a, b, k1, k2 },
      };
    },
    verify(p) {
      const { vals, a, b, k1, k2 } = p.data;
      const chk = (k, x, y) => (k === '이상' ? x >= y : k === '초과' ? x > y : k === '이하' ? x <= y : x < y);
      return vals.filter((v) => chk(k1, v, a) && chk(k2, v, b)).length === Number(p.answer.value);
    },
  };

  // ---------------------------------------------------------------- 2단원: 대분수 곱셈 풀이에서 틀린 줄 찾기
  const mixLine = TB.lineFind({
    id: 'u2s4-line', unit: 2, sub: 'u2s4', levels: [1, 4],
    gen(r, lv) {
      const mk = (w, d) => { let nn; do { nn = r.int(1, d - 1); } while (F.gcd(nn, d) !== 1); return { w, n: nn, d }; };
      const a = mk(r.int(1, lv <= 2 ? 2 : 3), r.int(2, 5)), b = mk(r.int(1, 2), r.int(2, lv <= 2 ? 4 : 6));
      const ia = a.w * a.d + a.n, ib = b.w * b.d + b.n;
      const N = ia * ib, Dn = a.d * b.d;
      const ans = F.make(N, Dn);
      if (F.parts(ans).n === 0) return null;
      const show = (x) => F.mkRaw(x.n, x.d, x.w);
      const lines = [`${show(a)} × ${show(b)} = ${F.mkRaw(ia, a.d)} × ${F.mkRaw(ib, b.d)}`, `= ${F.mkRaw(N, Dn)}`, `= ${F.mk(ans)}`];
      const k = r.int(0, 2);
      let bad, after;
      if (k === 0) {
        const wa = a.w + a.n; // 자연수 + 분자를 분자로 쓴 실수
        if (wa === ia) return null;
        bad = { i: 0, line: `${show(a)} × ${show(b)} = ${F.mkRaw(wa, a.d)} × ${F.mkRaw(ib, b.d)}`, msg: '대분수를 가분수로 바꿀 때 분자는 (자연수 × 분모) + 분자예요.' };
        after = [`= ${F.mkRaw(wa * ib, Dn)}`, `= ${F.mk(F.make(wa * ib, Dn))}`];
      } else if (k === 1) {
        const wd = a.d + b.d;
        bad = { i: 1, line: `= ${F.mkRaw(N, wd)}`, msg: '분모끼리 더하지 않고 곱해요.' };
        after = [`= ${F.mk(F.make(N, wd))}`];
      } else {
        const wrong = F.sub(ans, 1);
        if (wrong.n <= 0) return null;
        bad = { i: 2, line: `= ${F.mk(wrong)}`, msg: '가분수를 대분수로 바꿀 때 분자를 분모로 나눈 몫이 자연수 부분이에요. 다시 나눠 봐요.' };
        after = [];
      }
      return { problem: j(`${show(a)} × ${show(b)}`, '을/를'), lines, bad, after, key: `${show(a)}|${show(b)}|${k}`, data: { a: [a.w, a.n, a.d], b: [b.w, b.n, b.d] } };
    },
  });

  // ---------------------------------------------------------------- 2단원: 거꾸로 문제 (어떤 수의 ⟪a/b⟫이 k)
  const backFrac = {
    id: 'u2s2-back', unit: 2, sub: 'u2s2', style: 'B', styleName: '거꾸로 문제', levels: [1, 4],
    build(r, lv) {
      let a, b;
      do { b = r.int(2, lv <= 2 ? 6 : 10); a = r.int(1, b - 1); } while (F.gcd(a, b) !== 1);
      if (lv === 1) a = 1;
      const unit = r.int(2, lv <= 2 ? 6 : 12);
      const k = a * unit, X = b * unit;
      const fr = F.mkRaw(a, b);
      return {
        text: `어떤 수의 ${j(fr, '은/는')} ${j(k, '이에요/예요')}. 어떤 수는 얼마인가요?`,
        answer: { type: 'num', value: String(X) },
        patterns: [
          ...(Number.isInteger((k * a) / b) ? [{ value: String((k * a) / b), cause: 'concept', msg: `${k}에 ${j(fr, '을/를')} 곱하면 안 돼요. ${j(k, '은/는')} 어떤 수를 ${b}묶음으로 나눈 것 중 ${a}묶음이에요.` }] : []),
          ...(a > 1 ? [{ value: String(unit), cause: 'condition', msg: `${j(unit, '은/는')} 어떤 수의 ${j(F.mkRaw(1, b), '이에요/예요')}. 어떤 수는 ${b}묶음이에요.` }] : []),
        ],
        hints: [`어떤 수를 ${b}묶음으로 똑같이 나누면, 그중 ${a}묶음이 ${j(k, '이에요/예요')}.`, `한 묶음은 ${k} ÷ ${a} = ${j(unit, '이에요/예요')}.`, `어떤 수는 ${b}묶음이니까 ${unit} × ${b} = ${X}`],
        solution: [`한 묶음: ${k} ÷ ${a} = ${unit}`, `어떤 수: ${unit} × ${b} = ${X}`],
        key: `u2s2-back|${a}/${b}|${k}`,
        data: { a, b, k },
      };
    },
    verify(p) { const { a, b, k } = p.data; return Math.abs((Number(p.answer.value) * a) / b - k) < 1e-9; },
  };

  // ---------------------------------------------------------------- 2단원: 퍼즐 (빈칸 두 개)  ⟪□/d⟫ × k = ⟪w □/d⟫
  const puzzleFrac = {
    id: 'u2s1-puzzle', unit: 2, sub: 'u2s1', style: 'B', styleName: '퍼즐', levels: [2, 4],
    build(r, lv) {
      const d = r.int(3, lv === 4 ? 12 : 9), k = r.int(2, 9);
      let a;
      do { a = r.int(1, d - 1); } while (F.gcd(a, d) !== 1);
      const w = Math.floor((a * k) / d), rem = (a * k) % d;
      if (w < 1 || rem === 0 || F.gcd(rem, d) !== 1) return null;
      // 같은 자연수 부분 w가 나오는 다른 분자가 있으면 답이 하나가 아니다
      const sols = [];
      for (let a2 = 1; a2 < d; a2++) { const rr = (a2 * k) % d; if (Math.floor((a2 * k) / d) === w && rr && F.gcd(rr, d) === 1 && F.gcd(a2, d) === 1) sols.push(a2); }
      if (sols.length !== 1) return null;
      return {
        text: `□ 안에 알맞은 수를 차례로 쓰세요. (분수는 모두 기약분수예요.)\n⟪□/${d}⟫ × ${k} = ⟪${w} □/${d}⟫`,
        answer: { type: 'pair', labels: ['앞의 □', '뒤의 □'], values: [String(a), String(rem)] },
        patterns: [{ value: [String(a), String(a * k)], cause: 'concept', soft: true, msg: '곱한 결과를 대분수로 바꾸면 분자가 분모보다 작아져요. 자연수 부분을 빼고 남은 분자를 써요.' }],
        hints: [`분자끼리 곱한 결과를 대분수로 바꾸었을 때 자연수 부분이 ${j(w, '이/가')} 되어야 해요.`, `□ × ${k}를 ${j(d, '으로/로')} 나눈 몫이 ${j(w, '이/가')} 되는 □를 찾아요.`, `⟪${a}/${d}⟫ × ${k} = ⟪${a * k}/${d}⟫ = ⟪${w} ${rem}/${d}⟫ → 앞의 □는 ${a}, 뒤의 □는 ${rem}`],
        solution: [`⟪${a}/${d}⟫ × ${k} = ⟪${a * k}/${d}⟫ = ⟪${w} ${rem}/${d}⟫`],
        key: `u2s1-puzzle|${a}|${d}|${k}`,
        data: { d, k, w },
      };
    },
    verify(p) {
      const { d, k, w } = p.data;
      const [a, rem] = p.answer.values.map(Number);
      return Math.abs((a / d) * k - (w + rem / d)) < 1e-9 && rem < d;
    },
  };

  // ---------------------------------------------------------------- 1단원: 용돈 기입장 표 읽기 + 어림
  const ITEMS = ['공책', '연필', '지우개', '색종이', '간식', '스티커', '물감', '자'];
  const MODE = { ceil: '올림', floor: '버림', round: '반올림' };
  const allowance = {
    id: 'u1s7-table', unit: 1, sub: 'u1s7', style: 'B', styleName: '표·그래프 읽기', levels: [1, 4],
    build(r, lv) {
      const cnt = lv <= 2 ? 3 : 4;
      const items = r.sample(ITEMS, cnt);
      const prices = items.map(() => r.int(lv <= 2 ? 3 : 5, lv <= 2 ? 19 : 49) * 100 + (lv === 4 ? r.pick([0, 50]) : 0));
      const total = prices.reduce((s, v) => s + v, 0);
      const mode = r.pick(['ceil', 'floor', 'round']);
      const e = 3;
      if (total % 1000 === 0 || total < 1500) return null;
      const ans = D.str(D.round(String(total), mode, e));
      const others = ['ceil', 'floor', 'round'].filter((m) => m !== mode).map((m) => D.str(D.round(String(total), m, e)));
      const nm = r.pick(W.names);
      return {
        text: `${nm}의 용돈 기입장이에요. 쓴 돈을 모두 더한 금액을 ${MODE[mode]}하여 천의 자리까지 나타내면 얼마인가요?`,
        figure: { type: 'table', title: '용돈 기입장 (쓴 돈)', head: ['산 물건', '금액'], rows: items.map((it, i) => [it, `${n(prices[i])}원`]) },
        answer: { type: 'num', value: ans, unit: '원' },
        patterns: [
          { value: String(total), cause: 'condition', msg: `모두 더한 금액을 ${MODE[mode]}해야 해요.` },
          ...others.map((v, i) => ({ value: v, cause: 'concept', soft: true, msg: `${MODE[mode]}을 해야 해요. 다른 어림 방법을 했어요.` })),
        ],
        hints: ['표에서 쓴 돈을 모두 더해요.', `${prices.map(n).join(' + ')} = ${n(total)}(원)`, `${j(n(total), '을/를')} ${MODE[mode]}하여 천의 자리까지 나타내면 ${n(ans)}원`],
        solution: [`쓴 돈: ${n(total)}원`, `${MODE[mode]} → ${n(ans)}원`],
        key: `u1s7-table|${prices.join(',')}|${mode}`,
        data: { prices, mode },
      };
    },
    verify(p) {
      const t = p.data.prices.reduce((s, v) => s + v, 0);
      const v = Number(p.answer.value);
      const want = p.data.mode === 'ceil' ? Math.ceil(t / 1000) * 1000 : p.data.mode === 'floor' ? Math.floor(t / 1000) * 1000 : Math.floor(t / 1000 + 0.5) * 1000;
      return v === want;
    },
  };

  M5.addTemplates([...oxTemplates, roundLine, barsRange, mixLine, backFrac, puzzleFrac, allowance]);
})();
