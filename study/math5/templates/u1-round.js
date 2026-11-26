// 1단원 수의 범위와 어림하기 ② — 올림 / 버림 / 반올림 / 올림·버림·반올림을 활용한 문제 해결
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const D = M5.dec, T = M5.text, W = M5.words;
  const j = T.j, n = T.num, place = T.place, MODE = T.MODE;

  const OTHER = { ceil: ['floor', 'round'], floor: ['ceil', 'round'], round: ['ceil', 'floor'] };
  const SUB = { ceil: 'u1s4', floor: 'u1s5', round: 'u1s6' };
  const P10 = (e) => 10 ** e;
  const rd = (x, mode, e) => D.str(D.round(x, mode, e));
  const same = (a, b) => D.eq(a, b);
  const pos = (v) => D.cmp(v, 0) > 0;

  // 검사용: 1000배 한 정수로 따로 확인 (만드는 쪽과 다른 방법)
  const milli = (s) => Math.round(Number(String(s).replace(/,/g, '')) * 1000);
  function okRound(mode, x, e, r) {
    const X = milli(x), R = milli(r), U = Math.round(10 ** e * 1000);
    if (R % U !== 0) return false;
    if (mode === 'ceil') return R >= X && R - U < X;
    if (mode === 'floor') return R <= X && R + U > X;
    return R - U / 2 <= X && X < R + U / 2;
  }

  function modeHow(mode) {
    if (mode === 'ceil') return '올림은 나타낼 자리 아래에 0이 아닌 숫자가 있으면 나타낼 자리 숫자를 1 크게 하고, 아래 자리는 모두 0으로 써요.';
    if (mode === 'floor') return '버림은 나타낼 자리 아래 숫자를 모두 0으로 바꿔요.';
    return '반올림은 나타낼 자리 바로 아래 숫자가 0~4이면 버리고, 5~9이면 올려요.';
  }

  // ---------- 수 만들기 ----------
  // digits 자리 자연수. 나타낼 자리(e) 아래가 0이 아닌 수 (exact면 아래가 모두 0)
  function genInt(r, digits, e, opt = {}) {
    const lo = P10(digits - 1), hi = P10(digits) - 1;
    for (let t = 0; t < 200; t++) {
      let x = r.int(lo, hi);
      if (opt.carry) { const d = Math.floor(x / P10(e)) % 10; x += (9 - d) * P10(e); }
      if (opt.edge && e >= 1) { const d = Math.floor(x / P10(e - 1)) % 10; x += (r.pick([4, 5]) - d) * P10(e - 1); }
      if (opt.exact) x = Math.floor(x / P10(e)) * P10(e);
      else if (x % P10(e) === 0) continue;
      if (x < lo || x > hi) continue;
      return x;
    }
    return null;
  }
  // 난이도별 자연수와 나타낼 자리
  function genX(r, lv, mode) {
    let e, x;
    if (lv === 1) { e = 1; x = genInt(r, 3, 1); }
    else if (lv === 2) { e = r.pick([1, 2]); x = genInt(r, 4, e); }
    else if (lv === 3) { e = r.pick([2, 3]); x = genInt(r, r.pick([4, 5]), e, { exact: mode === 'ceil' && r.chance(0.15), edge: mode === 'round' && r.chance(0.4) }); }
    else { e = r.pick([2, 3, 4]); x = genInt(r, r.pick([5, 6]), e, { carry: r.chance(0.4), edge: mode === 'round' && r.chance(0.3) }); }
    return x == null ? null : { x: String(x), e };
  }
  // 난이도별 소수와 나타낼 자리
  function genDec(r, lv) {
    const s = lv === 2 ? 2 : 3;
    const e = lv === 2 ? -1 : r.pick([-1, -2]);
    const k = s + e; // 0.001 단위 정수에서 나타낼 자리의 위치
    for (let t = 0; t < 200; t++) {
      // 1보다 큰 소수만 (0.01처럼 어림하면 0이 되는 수는 내지 않는다)
      let N = r.int(lv === 2 ? 101 : 1001, lv === 2 ? 2099 : lv === 3 ? 50999 : 99999);
      if (lv === 4 && r.chance(0.4)) { const d = Math.floor(N / P10(k)) % 10; N += (9 - d) * P10(k); }
      if (N % 10 === 0 || N % P10(k) === 0) continue;
      return { x: D.str(D.make(N, s)), e };
    }
    return null;
  }

  // 자주 하는 실수와 그때 나오는 값
  function mistakes(x, mode, e) {
    const isInt = D.isInt(x);
    const ans = rd(x, mode, e);
    const pn = place(e);
    const list = [];
    for (const o of OTHER[mode]) {
      list.push({ id: 'mode-' + o, value: rd(x, o, e), cause: 'concept', soft: true, msg: `${MODE[o]}을 했어요. ${modeHow(mode)}`, reason: `${MODE[o]}을 했어요` });
    }
    const minE = isInt ? 0 : -D.parse(x).s;
    if (e - 1 >= minE) list.push({ id: 'place-low', value: rd(x, mode, e - 1), cause: 'condition', soft: true, msg: `${pn}까지 나타내야 해요. ${place(e - 1)}까지 나타냈어요.`, reason: `${place(e - 1)}까지 나타냈어요` });
    if (e + 1 <= 4 && D.cmp(x, D.pow10(e + 1)) >= 0) list.push({ id: 'place-high', value: rd(x, mode, e + 1), cause: 'condition', soft: true, msg: `${pn}까지 나타내야 해요. ${place(e + 1)}까지 나타냈어요.`, reason: `${place(e + 1)}까지 나타냈어요` });
    if (isInt) {
      const fl = rd(x, 'floor', e);
      if (same(fl, x)) {
        if (mode === 'ceil') list.push({ id: 'always', value: D.str(D.add(x, D.pow10(e))), cause: 'concept', msg: `${pn} 아래 자리가 모두 0이면 올림해도 그대로예요.`, reason: `아래 자리가 모두 0인데 올렸어요` });
      } else {
        list.push({ id: 'nozero', value: D.str(D.add(x, D.sub(ans, fl))), cause: 'concept', soft: true, msg: `${pn} 아래 자리 숫자는 모두 0으로 바꿔야 해요.`, reason: `${pn} 아래 숫자를 0으로 바꾸지 않았어요` });
      }
    }
    return list.filter((m) => pos(m.value));
  }
  const wrongOnly = (ms, ans) => {
    const seen = new Set([D.str(D.parse(ans))]);
    return ms.filter((m) => { const k = D.str(D.parse(m.value)); if (seen.has(k)) return false; seen.add(k); return true; });
  };

  function roundHints(x, mode, e, ans) {
    const pn = place(e);
    const d = D.digitAt(x, e - 1);
    const allZero = same(rd(x, 'floor', e), x);
    let h3;
    if (mode === 'ceil') h3 = allZero ? `${pn} 아래가 모두 0이라서 그대로 ${j(n(ans), '이에요/예요')}.` : `${pn} 아래에 0이 아닌 숫자가 있어서 ${pn} 숫자를 1 크게 하고 아래는 0으로 써요. → ${n(ans)}`;
    else if (mode === 'floor') h3 = `${pn} 아래 숫자를 모두 0으로 바꾸면 ${j(n(ans), '이에요/예요')}.`;
    else h3 = `${pn} 바로 아래 숫자가 ${j(d, '이라서/라서')} ${d >= 5 ? '올려요' : '버려요'}. → ${n(ans)}`;
    return [
      mode === 'round' ? `${n(x)}에서 ${pn} 바로 아래 자리 숫자를 찾아봐요.` : `${n(x)}에서 ${pn} 아래 자리 숫자들을 살펴봐요.`,
      modeHow(mode),
      h3,
    ];
  }
  const ask = (x, mode, e) => `${j(n(x), '을/를')} ${MODE[mode]}하여 ${place(e)}까지`;

  // ======================================================================
  // 소단원 4·5·6 공통 틀 (올림 / 버림 / 반올림)
  // ======================================================================
  function roundSet(mode) {
    const sub = SUB[mode];
    const M = MODE[mode];

    const basic = {
      id: sub + '-basic', unit: 1, sub, style: 'A', styleName: '기본 계산', levels: [1, 4],
      build(r, lv) {
        const g = genX(r, lv, mode);
        if (!g) return null;
        const { x, e } = g;
        const ans = rd(x, mode, e);
        return {
          text: `${ask(x, mode, e)} 나타내세요.`,
          answer: { type: 'num', value: ans },
          patterns: mistakes(x, mode, e).map(({ value, cause, msg, soft }) => ({ value, cause, msg, soft })),
          hints: roundHints(x, mode, e, ans),
          solution: [modeHow(mode), `${n(x)} → ${n(ans)}`],
          key: `${sub}-basic|${x}|${e}`,
          data: { x, e },
        };
      },
      verify(p) { return okRound(mode, p.data.x, p.data.e, p.answer.value); },
    };

    const decimal = {
      id: sub + '-dec', unit: 1, sub, style: 'A', styleName: '소수 어림', levels: [2, 4],
      build(r, lv) {
        const g = genDec(r, lv);
        if (!g) return null;
        const { x, e } = g;
        const ans = rd(x, mode, e);
        return {
          text: `${ask(x, mode, e)} 나타내세요.`,
          answer: { type: 'num', value: ans },
          patterns: mistakes(x, mode, e).map(({ value, cause, msg, soft }) => ({ value, cause, msg, soft })),
          hints: roundHints(x, mode, e, ans),
          solution: [modeHow(mode), `${n(x)} → ${n(ans)}`],
          key: `${sub}-dec|${x}|${e}`,
          data: { x, e },
        };
      },
      verify(p) { return okRound(mode, p.data.x, p.data.e, p.answer.value); },
    };

    const compare = {
      id: sub + '-compare', unit: 1, sub, style: 'A', styleName: '크기 비교', levels: [1, 4],
      build(r, lv) {
        const g = genX(r, lv, mode);
        if (!g) return null;
        const { x, e } = g;
        let y = x, m2 = mode, e2 = e;
        const kind = r.int(0, 2);
        if (kind === 0) m2 = r.pick(OTHER[mode]);
        else if (kind === 1) { e2 = e + r.pick([-1, 1]); if (e2 < 1 || D.cmp(x, D.pow10(e2 + 1)) < 0) return null; m2 = r.pick(['ceil', 'floor', 'round']); }
        else { y = String(Number(x) + r.pick([-1, 1]) * r.int(1, P10(e))); m2 = r.pick(['ceil', 'floor', 'round']); if (Number(y) <= 0 || y.length !== x.length) return null; }
        if (y === x && m2 === mode && e2 === e) return null;
        const L = rd(x, mode, e), R = rd(y, m2, e2);
        const c = D.cmp(L, R), sign = c > 0 ? '>' : c < 0 ? '<' : '=';
        const wrongL = rd(x, OTHER[mode][0], e);
        const wc = D.cmp(wrongL, R), wsign = wc > 0 ? '>' : wc < 0 ? '<' : '=';
        return {
          text: `두 수의 크기를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.\n(가) ${ask(x, mode, e)} 나타낸 수\n(나) ${ask(y, m2, e2)} 나타낸 수\n(가) ○ (나)`,
          answer: { type: 'ineq', value: sign },
          patterns: [{ value: wsign, cause: 'concept', soft: true, msg: `(가)는 ${j(M, '이에요/예요')}. ${modeHow(mode)}` }],
          hints: [
            '(가)와 (나)를 각각 먼저 어림한 다음 비교해요.',
            `(가)는 ${M}, (나)는 ${j(MODE[m2], '이에요/예요')}. 어림 방법과 자리를 헷갈리지 않게 해요.`,
            `(가) = ${n(L)}, (나) = ${n(R)} → ${n(L)} ${sign} ${n(R)}`,
          ],
          solution: [`(가) ${n(x)} → ${n(L)}`, `(나) ${n(y)} → ${n(R)}`, `${n(L)} ${sign} ${n(R)}`],
          key: `${sub}-compare|${x}|${e}|${y}|${m2}|${e2}`,
          data: { x, e, y, m2, e2, L, R },
        };
      },
      verify(p) {
        const { x, e, y, m2, e2, L, R } = p.data;
        const a = Number(L), b = Number(R);
        const sign = a > b ? '>' : a < b ? '<' : '=';
        return okRound(mode, x, e, L) && okRound(m2, y, e2, R) && sign === p.answer.value;
      },
    };

    const notOne = {
      id: sub + '-not', unit: 1, sub, style: 'A', styleName: '아닌 수 찾기', levels: [1, 3],
      build(r, lv) {
        const e = lv === 1 ? 1 : lv === 2 ? 2 : r.pick([2, 3]);
        const U = P10(e);
        const R = U * r.int(lv === 1 ? 12 : 21, 99);
        const [lo, hi] = mode === 'ceil' ? [R - U + 1, R] : mode === 'floor' ? [R, R + U - 1] : [R - U / 2, R + U / 2 - 1];
        const bad = r.pick([lo - 1, hi + 1, lo - r.int(2, Math.max(2, U / 2)), hi + r.int(2, Math.max(2, U / 2))]);
        const inside = new Set([r.pick([lo, hi])]);
        for (let t = 0; inside.size < 3 && t < 50; t++) inside.add(r.int(lo, hi));
        if (inside.size < 3 || bad <= 0) return null;
        const pn = place(e);
        const opts = [...inside].map((v) => ({ text: n(v), v, correct: false, pattern: { cause: 'concept', msg: `${j(n(v), '을/를')} ${M}하여 ${pn}까지 나타내면 ${j(n(R), '이/가')} 돼요.` } }));
        opts.push({ text: n(bad), v: bad, correct: true });
        opts.sort((a, b) => a.v - b.v);
        return {
          text: `${M}하여 ${pn}까지 나타내면 ${j(n(R), '이/가')} 되는 수가 아닌 것을 고르세요.`,
          answer: { type: 'choice', options: opts },
          keepOrder: true,
          hints: [
            `보기의 수를 하나씩 ${M}하여 ${pn}까지 나타내 봐요.`,
            modeHow(mode),
            `${M}하여 ${pn}까지 나타내면 ${j(n(R), '이/가')} 되는 수는 ${n(lo)} 이상 ${n(hi)} 이하인 수예요. 이 범위 밖의 수를 찾아요.`,
          ],
          solution: [`${M}하여 ${j(n(R), '이/가')} 되는 수: ${n(lo)} 이상 ${n(hi)} 이하`, `${n(bad)} → ${n(rd(String(bad), mode, e))}`],
          key: `${sub}-not|${R}|${e}|${opts.map((o) => o.v).join(',')}`,
          data: { R, e },
        };
      },
      verify(p) {
        const { R, e } = p.data;
        const bads = p.answer.options.map((o, i) => (okRound(mode, o.v, e, R) ? -1 : i)).filter((i) => i >= 0);
        return bads.length === 1 && bads[0] === p.answer.value;
      },
    };

    const origin = {
      id: sub + '-origin', unit: 1, sub, style: 'A', styleName: '원래 수의 범위', levels: [1, 4],
      build(r, lv) {
        const e = lv === 1 ? 1 : lv === 2 ? 2 : lv === 3 ? r.pick([2, 3]) : r.pick([3, 4]);
        const U = P10(e);
        const R = U * r.int(3, 99);
        const iv = (m) => (m === 'ceil' ? [R - U + 1, R] : m === 'floor' ? [R, R + U - 1] : [R - U / 2, R + U / 2 - 1]);
        const [lo, hi] = iv(mode);
        const pn = place(e);
        const patterns = OTHER[mode].map((o) => ({ value: iv(o).map(String), cause: 'concept', soft: true, msg: `${MODE[o]}으로 생각했어요. ${modeHow(mode)}` }));
        if (mode === 'ceil') patterns.push({ value: [String(R - U), String(R - 1)], cause: 'concept', soft: true, msg: `${j(n(R - U), '을/를')} 올림하면 그대로 ${j(n(R - U), '이에요/예요')}. 가장 작은 수는 ${n(R - U)}보다 1 커요.` });
        if (mode === 'round') patterns.push({ value: [String(R - U / 2 + 1), String(R + U / 2)], cause: 'concept', soft: true, msg: '반올림은 바로 아래 숫자가 5일 때 올려요. 4일 때는 버려요.' });
        return {
          text: `어떤 자연수를 ${M}하여 ${pn}까지 나타내었더니 ${j(n(R), '이/가')} 되었어요.\n어떤 자연수가 될 수 있는 수 중에서 가장 작은 수와 가장 큰 수를 구하세요.`,
          answer: { type: 'pair', labels: ['가장 작은 수', '가장 큰 수'], values: [String(lo), String(hi)] },
          patterns,
          hints: [
            `${M}하여 ${j(n(R), '이/가')} 되는 수를 몇 개 떠올려 봐요.`,
            modeHow(mode),
            `${M}하여 ${pn}까지 나타내면 ${j(n(R), '이/가')} 되는 수는 ${n(lo)}부터 ${n(hi)}까지예요.`,
          ],
          solution: [`${n(lo)} → ${n(R)}, ${n(hi)} → ${n(R)}`, `${n(lo - 1)} → ${n(rd(String(lo - 1), mode, e))}, ${n(hi + 1)} → ${n(rd(String(hi + 1), mode, e))}`],
          key: `${sub}-origin|${R}|${e}`,
          data: { R, e },
        };
      },
      verify(p) {
        const { R, e } = p.data;
        const [lo, hi] = p.answer.values.map(Number);
        return okRound(mode, lo, e, R) && okRound(mode, hi, e, R) && !okRound(mode, lo - 1, e, R) && !okRound(mode, hi + 1, e, R);
      },
    };

    const cards = {
      id: sub + '-cards', unit: 1, sub, style: 'A', styleName: '수 카드', levels: [2, 4], weak: ['condition'],
      build(r, lv) {
        const digits = lv === 2 || r.chance(0.5) ? r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4) : [0, ...r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)];
        const big = r.chance(0.5);
        const desc = digits.slice().sort((a, b) => b - a);
        const asc = digits.slice().sort((a, b) => a - b);
        const small = asc.slice();
        if (small[0] === 0) { const k = small.findIndex((d) => d !== 0); [small[0], small[k]] = [small[k], small[0]]; }
        const X = String(Number((big ? desc : small).join('')));
        const Y = String(Number((big ? small : desc).join('')));
        const e = lv === 2 ? r.pick([1, 2]) : r.pick([1, 2, 3]);
        const ans = rd(X, mode, e), pn = place(e);
        const patterns = [{ value: rd(Y, mode, e), cause: 'condition', msg: `가장 ${big ? '큰' : '작은'} 수를 만들어야 해요. 가장 ${big ? '작은' : '큰'} 수로 계산했어요.` }];
        for (const o of OTHER[mode]) patterns.push({ value: rd(X, o, e), cause: 'concept', soft: true, msg: `${MODE[o]}을 했어요. ${modeHow(mode)}` });
        if (!big && asc[0] === 0) patterns.push({ value: rd(String(Number(asc.join(''))), mode, e), cause: 'condition', soft: true, msg: '0은 맨 앞자리에 올 수 없어요.' });
        return {
          text: `수 카드 4장을 한 번씩만 사용하여 가장 ${big ? '큰' : '작은'} 네 자리 수를 만들었어요.\n이 수를 ${M}하여 ${pn}까지 나타내세요.`,
          figure: { type: 'cards', nums: r.shuffle(digits) },
          answer: { type: 'num', value: ans },
          patterns,
          hints: [
            '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 가장 큰 수인지 가장 작은 수인지 확인해요.',
            `가장 ${big ? '큰' : '작은'} 네 자리 수는 ${j(n(X), '이에요/예요')}.${!big && digits.includes(0) ? ' (0은 맨 앞에 올 수 없어요.)' : ''}`,
            `${ask(X, mode, e)} 나타내면 ${j(n(ans), '이에요/예요')}.`,
          ],
          solution: [`가장 ${big ? '큰' : '작은'} 네 자리 수: ${n(X)}`, `${n(X)} → ${n(ans)}`],
          key: `${sub}-cards|${asc.join('')}|${big}|${e}`,
          data: { digits, big, e },
        };
      },
      verify(p) {
        const { digits, big, e } = p.data;
        let best = null;
        for (let x = 1000; x <= 9999; x++) {
          const left = digits.slice();
          const ok = String(x).split('').map(Number).every((d) => { const i = left.indexOf(d); if (i < 0) return false; left.splice(i, 1); return true; });
          if (ok && (best == null || (big ? x > best : x < best))) best = x;
        }
        return okRound(mode, best, e, p.answer.value);
      },
    };

    const ox = {
      id: sub + '-ox', unit: 1, sub, style: 'B', styleName: 'O/X 판단', levels: [1, 4],
      build(r, lv) {
        const g = lv === 4 && r.chance(0.5) ? genDec(r, 3) : genX(r, lv, mode);
        if (!g) return null;
        const { x, e } = g;
        const ans = rd(x, mode, e);
        const ms = wrongOnly(mistakes(x, mode, e), ans);
        const truth = !ms.length || r.chance(0.5);
        const shown = truth ? ans : r.pick(ms).value;
        return {
          text: `${ask(x, mode, e)} 나타내면 ${j(n(shown), '이에요/예요')}.\n맞으면 O, 틀리면 X를 고르세요.`,
          answer: { type: 'ox', value: truth },
          patterns: [{ value: !truth, cause: 'concept', msg: `${ask(x, mode, e)} 나타내면 ${j(n(ans), '이에요/예요')}.` }],
          hints: [roundHints(x, mode, e, ans)[0], modeHow(mode), `${n(x)} → ${n(ans)}. 문제의 수 ${j(n(shown), '와/과')} 비교해 봐요.`],
          solution: [`${n(x)} → ${n(ans)}`, truth ? '문제의 수와 같아요 → O' : `문제의 수 ${j(n(shown), '은/는')} 틀렸어요 → X`],
          key: `${sub}-ox|${x}|${e}|${shown}`,
          data: { x, e, shown },
        };
      },
      verify(p) { return p.answer.value === okRound(mode, p.data.x, p.data.e, p.data.shown); },
    };

    const choice4 = {
      id: sub + '-choice', unit: 1, sub, style: 'B', styleName: '객관식', levels: [1, 4],
      build(r, lv) {
        const g = lv >= 3 && r.chance(0.3) ? genDec(r, lv) : genX(r, lv, mode);
        if (!g) return null;
        const { x, e } = g;
        const ans = rd(x, mode, e);
        const ms = r.shuffle(wrongOnly(mistakes(x, mode, e), ans)).slice(0, 3);
        const opts = [{ text: n(ans), v: ans, correct: true }];
        for (const m of ms) opts.push({ text: n(m.value), v: m.value, correct: false, pattern: { cause: m.cause, msg: m.msg } });
        const U = D.pow10(e);
        for (const extra of [D.add(ans, U), D.sub(ans, U), D.add(ans, D.mulInt(U, 2))]) {
          if (opts.length >= 4) break;
          if (!pos(extra) || opts.some((o) => same(o.v, extra))) continue;
          opts.push({ text: n(extra), v: D.str(extra), correct: false, pattern: { cause: 'calc', msg: '차근차근 다시 어림해 봐요.' } });
        }
        opts.sort((a, b) => D.cmp(a.v, b.v));
        return {
          text: `${ask(x, mode, e)} 나타낸 수를 고르세요.`,
          answer: { type: 'choice', options: opts },
          keepOrder: true,
          hints: roundHints(x, mode, e, ans),
          solution: [modeHow(mode), `${n(x)} → ${n(ans)}`],
          key: `${sub}-choice|${x}|${e}`,
          data: { x, e },
        };
      },
      verify(p) {
        const { x, e } = p.data;
        return p.answer.options.every((o, i) => okRound(mode, x, e, o.v) === (i === p.answer.value));
      },
    };

    const friend = {
      id: sub + '-friend', unit: 1, sub, style: 'B', styleName: '친구 풀이 검사', levels: [1, 4],
      build(r, lv) {
        const g = genX(r, lv, mode);
        if (!g) return null;
        const { x, e } = g;
        const ans = rd(x, mode, e);
        const ms = mistakes(x, mode, e).filter((m) => !same(m.value, ans));
        if (ms.length < 3) return null;
        const chosen = r.pick(ms);
        const Wv = chosen.value;
        const others = ms.filter((m) => m !== chosen && !same(m.value, Wv));
        if (others.length < 2) return null;
        const fname = r.pick(W.names);
        const opts = [{ key: chosen.id, text: chosen.reason, correct: true }];
        for (const m of r.sample(others, 3)) opts.push({ key: m.id, text: m.reason, correct: false, pattern: { cause: 'concept', msg: `그렇게 했다면 ${j(n(m.value), '이/가')} 나와요. ${fname}의 답 ${j(n(Wv), '와/과')} 달라요.` } });
        return {
          text: `${fname}의 풀이예요.\n"${ask(x, mode, e)} 나타내면 ${j(n(Wv), '이에요/예요')}."\n${fname}의 답은 틀렸어요. 무엇을 잘못했는지 고르세요.`,
          answer: { type: 'choice', options: opts },
          hints: [
            `먼저 ${ask(x, mode, e)} 직접 나타내 봐요.`,
            `바른 답은 ${j(n(ans), '이에요/예요')}. ${fname}의 답 ${j(n(Wv), '와/과')} 어디가 다른지 봐요.`,
            `보기에 적힌 대로 하나씩 해 봐요. '${chosen.reason}'처럼 하면 ${j(n(Wv), '이/가')} 나와요.`,
          ],
          solution: [`바른 답: ${n(ans)}`, `${fname}의 실수: ${chosen.reason} → ${n(Wv)}`],
          key: `${sub}-friend|${x}|${e}|${chosen.id}`,
          data: { x, e, W: Wv, vals: Object.fromEntries(ms.map((m) => [m.id, m.value])) },
        };
      },
      verify(p) {
        const { x, e, W: Wv, vals } = p.data;
        if (okRound(mode, x, e, Wv)) return false; // 친구 답은 틀려야 한다
        return p.answer.options.every((o, i) => (milli(vals[o.key]) === milli(Wv)) === (i === p.answer.value));
      },
    };

    return [basic, decimal, compare, notOne, origin, cards, ox, choice4, friend];
  }

  // ======================================================================
  // 소단원 7: 올림·버림·반올림을 활용한 문제 해결
  // ======================================================================
  const S7 = 'u1s7';
  const ceilDiv = (a, b) => Math.ceil(a / b);

  const tBus = {
    id: 'u1s7-bus', unit: 1, sub: S7, style: 'A', styleName: '올림 상황', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const ctx = lv <= 2 ? r.pick([{ v: '보트', c: '대', cap: 10 }, { v: '케이블카', c: '대', cap: 10 }, { v: '엘리베이터', c: '번', cap: 10 }])
        : r.pick([{ v: '배', c: '척', cap: 100 }, { v: '기차 한 칸', c: '칸', cap: 100 }]);
      const N = lv === 1 ? r.int(21, 99) : lv === 2 ? r.int(101, 399) : lv === 3 ? r.int(201, 999) : r.int(1001, 4999);
      if (N % ctx.cap === 0) return null;
      const ans = ceilDiv(N, ctx.cap), fl = Math.floor(N / ctx.cap), rem = N - fl * ctx.cap;
      const ride = ctx.v === '엘리베이터' ? `한 번에 ${ctx.cap}명씩 탈 수 있는 엘리베이터로 모두 올라가려면 엘리베이터가 최소 몇 번 움직여야 하나요?` : `${ctx.v} 하나에 ${ctx.cap}명씩 탈 수 있어요. 모두 타려면 ${j(ctx.v, '이/가')} 최소 몇 ${ctx.c} 필요한가요?`;
      return {
        text: `학생 ${n(N)}명이 있어요. ${ride}`,
        answer: { type: 'num', value: String(ans), unit: ctx.c },
        patterns: [
          { value: String(fl), cause: 'condition', msg: `남는 학생 ${rem}명도 모두 타야 해요. ${ctx.cap}명이 안 되어도 하나 더 필요해요.` },
          { value: String(ans * ctx.cap), cause: 'condition', soft: true, msg: `학생 수가 아니라 몇 ${ctx.c}인지 물었어요.` },
        ],
        hints: [
          '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 학생이 "모두" 타야 해요.',
          `${ctx.cap}명씩 ${fl}${ctx.c}에 ${n(fl * ctx.cap)}명이 타면 ${rem}명이 남아요.`,
          `남은 ${rem}명도 타야 하니까 하나 더! ${fl} + 1 = ${ans}(${ctx.c}) → 올림이에요.`,
        ],
        solution: [`${j(n(N), '을/를')} 올림하여 ${ctx.cap === 10 ? '십' : '백'}의 자리까지 → ${n(ans * ctx.cap)}`, `${n(ans * ctx.cap)} ÷ ${ctx.cap} = ${ans}(${ctx.c})`],
        key: `u1s7-bus|${N}|${ctx.v}`,
        data: { N, cap: ctx.cap },
      };
    },
    verify(p) { const { N, cap } = p.data; const a = Number(p.answer.value); return a * cap >= N && (a - 1) * cap < N; },
  };

  const tBills = {
    id: 'u1s7-bills', unit: 1, sub: S7, style: 'A', styleName: '올림 상황', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const bill = lv <= 2 ? 1000 : 10000;
      const price = bill === 1000 ? r.int(11, 99) * 100 : r.int(11, 99) * 1000 + (lv === 4 ? r.int(1, 9) * 100 : 0);
      if (price % bill === 0) return null;
      const item = r.pick(W.goods);
      const money = r.chance(0.5);
      const cc = ceilDiv(price, bill), fc = Math.floor(price / bill), rc = Math.round(price / bill);
      const val = (c) => String(money ? c * bill : c);
      const patterns = [{ value: val(fc), cause: 'condition', msg: '지폐로만 내야 해요. 물건값보다 적게 내면 살 수 없어요.' }];
      if (rc !== cc) patterns.push({ value: val(rc), cause: 'concept', soft: true, msg: '반올림을 하면 돈이 모자라요. 모자라지 않게 올림해야 해요.' });
      return {
        text: `${j(item, '은/는')} ${n(price)}원이에요.\n${n(bill)}원짜리 지폐로만 낸다면 최소 ${money ? '얼마를' : '몇 장을'} 내야 하나요?`,
        answer: { type: 'num', value: val(cc), unit: money ? '원' : '장' },
        patterns,
        hints: [
          '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 지폐로만 내야 해요.',
          `${n(bill)}원짜리 ${fc}장이면 ${n(fc * bill)}원이라서 모자라요.`,
          `한 장 더 내야 해요. ${cc}장 → ${n(cc * bill)}원 (올림)`,
        ],
        solution: [`${n(price)}원을 올림하여 ${bill === 1000 ? '천' : '만'}의 자리까지 → ${n(cc * bill)}원`, money ? `${n(cc * bill)}원` : `${cc}장`],
        key: `u1s7-bills|${price}|${bill}|${money}`,
        data: { price, bill, money },
      };
    },
    verify(p) {
      const { price, bill, money } = p.data;
      const paid = money ? Number(p.answer.value) : Number(p.answer.value) * bill;
      return paid % bill === 0 && paid >= price && paid - bill < price;
    },
  };

  const PACK = [
    { t: '귤', pk: '상자', cap: 10 }, { t: '달걀', pk: '판', cap: 10 }, { t: '쿠키', pk: '봉지', cap: 10 },
    { t: '사탕', pk: '봉지', cap: 100 }, { t: '구슬', pk: '주머니', cap: 100 }, { t: '클립', pk: '통', cap: 100 },
  ];
  const tPack = {
    id: 'u1s7-pack', unit: 1, sub: S7, style: 'A', styleName: '버림 상황', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const ctx = r.pick(PACK.filter((c) => (lv <= 2 ? c.cap === 10 : c.cap === 100)));
      const N = lv === 1 ? r.int(21, 99) : lv === 2 ? r.int(101, 499) : lv === 3 ? r.int(201, 999) : r.int(1001, 5999);
      if (N % ctx.cap === 0) return null;
      const ans = Math.floor(N / ctx.cap), rem = N - ans * ctx.cap;
      return {
        text: `${ctx.t} ${n(N)}개를 한 ${ctx.pk}에 ${ctx.cap}개씩 담아서 팔려고 해요.\n팔 수 있는 ${j(ctx.pk, '은/는')} 최대 몇 ${ctx.pk}인가요?`,
        answer: { type: 'num', value: String(ans), unit: ctx.pk },
        patterns: [
          { value: String(ans + 1), cause: 'condition', msg: `${ctx.cap}개를 꽉 채운 ${ctx.pk}만 팔 수 있어요. 남은 ${rem}개로는 팔 수 없어요.` },
          { value: String(ans * ctx.cap), cause: 'condition', soft: true, msg: `${ctx.t}의 개수가 아니라 몇 ${ctx.pk}인지 물었어요.` },
        ],
        hints: [
          `문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 한 ${ctx.pk}에 꼭 ${ctx.cap}개씩 담아야 팔 수 있어요.`,
          `${ctx.cap}개씩 담으면 몇 ${j(ctx.pk, '이/가')} 꽉 차는지 생각해요.`,
          `${ans}${ctx.pk}에 ${n(ans * ctx.cap)}개를 담고 ${rem}개가 남아요. 남은 것은 팔 수 없으니 ${j(ans + ctx.pk, '이에요/예요')}. (버림)`,
        ],
        solution: [`${j(n(N), '을/를')} 버림하여 ${ctx.cap === 10 ? '십' : '백'}의 자리까지 → ${n(ans * ctx.cap)}`, `${n(ans * ctx.cap)} ÷ ${ctx.cap} = ${ans}`],
        key: `u1s7-pack|${N}|${ctx.t}`,
        data: { N, cap: ctx.cap },
      };
    },
    verify(p) { const { N, cap } = p.data; const a = Number(p.answer.value); return a * cap <= N && (a + 1) * cap > N; },
  };

  const tCoins = {
    id: 'u1s7-coins', unit: 1, sub: S7, style: 'A', styleName: '버림 상황', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const bill = lv <= 2 ? 1000 : 10000;
      const N = bill === 1000 ? r.int(101, 999) * 10 : r.int(101, 999) * 100;
      if (N % bill === 0) return null;
      const money = r.chance(0.5);
      const fc = Math.floor(N / bill), cc = fc + 1;
      const val = (c) => String(money ? c * bill : c);
      return {
        text: `저금통에 모은 동전이 모두 ${n(N)}원이에요.\n이 동전을 ${n(bill)}원짜리 지폐로 바꾸면 ${money ? '최대 얼마까지' : '지폐를 최대 몇 장까지'} 바꿀 수 있나요?`,
        answer: { type: 'num', value: val(fc), unit: money ? '원' : '장' },
        patterns: [{ value: val(cc), cause: 'condition', msg: '가진 돈보다 많이 바꿀 수는 없어요. 모자란 부분은 버려요.' }],
        hints: [
          '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 가진 동전만큼만 바꿀 수 있어요.',
          `${n(bill)}원짜리 ${cc}장은 ${n(cc * bill)}원이라서 가진 돈보다 많아요.`,
          `${fc}장 → ${n(fc * bill)}원까지 바꿀 수 있어요. (버림)`,
        ],
        solution: [`${n(N)}원을 버림하여 ${bill === 1000 ? '천' : '만'}의 자리까지 → ${n(fc * bill)}원`],
        key: `u1s7-coins|${N}|${bill}|${money}`,
        data: { N, bill, money },
      };
    },
    verify(p) {
      const { N, bill, money } = p.data;
      const got = money ? Number(p.answer.value) : Number(p.answer.value) * bill;
      return got % bill === 0 && got <= N && got + bill > N;
    },
  };

  const SITU = [
    { m: 'ceil', make: (r) => `학생 ${r.int(121, 389)}명이 한 대에 10명씩 탈 수 있는 보트에 모두 타려고 해요. 보트가 최소 몇 대 필요한지 구해요.`, why: '학생이 모두 타야 하니까 남는 학생을 위해 한 대가 더 필요해요. 그래서 올림이에요.' },
    { m: 'ceil', make: (r) => `${r.int(11, 99) * 100}원짜리 ${j(r.pick(W.goods), '을/를')} 1000원짜리 지폐로만 사려고 해요. 최소 얼마를 내야 하는지 구해요.`, why: '지폐로만 내면 모자라지 않게 더 내야 해요. 그래서 올림이에요.' },
    { m: 'ceil', make: (r) => `리본이 ${r.int(101, 499)} cm 필요한데, 가게에서 리본을 1 m(100 cm) 단위로만 팔아요. 최소 몇 m를 사야 하는지 구해요.`, why: '필요한 길이보다 모자라면 안 되니까 올림이에요.' },
    { m: 'floor', make: (r) => `귤 ${r.int(121, 389)}개를 한 상자에 10개씩 담아 팔려고 해요. 팔 수 있는 상자 수를 구해요.`, why: '10개를 채우지 못한 상자는 팔 수 없어서 남는 것은 버려요. 그래서 버림이에요.' },
    { m: 'floor', make: (r) => `동전 ${n(r.int(101, 999) * 10)}원을 1000원짜리 지폐로 바꾸려고 해요. 최대 얼마까지 바꿀 수 있는지 구해요.`, why: '가진 돈보다 많이 바꿀 수 없으니까 모자란 부분은 버려요. 그래서 버림이에요.' },
    { m: 'floor', make: (r) => `밀가루 ${n(r.int(101, 999) * 10 + r.int(1, 9))} g으로 빵 한 개에 100 g씩 써서 빵을 만들려고 해요. 빵을 최대 몇 개 만들 수 있는지 구해요.`, why: '100 g이 안 되는 밀가루로는 빵을 만들 수 없어요. 그래서 버림이에요.' },
    { m: 'round', make: (r) => `${r.pick(W.names)}의 키 ${D.str(D.make(r.int(1301, 1599), 1))} cm를 일의 자리까지 대략 나타내려고 해요.`, why: '정확한 값에 가장 가까운 수로 대략 나타낼 때는 반올림을 써요.' },
    { m: 'round', make: (r) => `우리 마을 사람 수 ${n(r.int(10001, 99999))}명을 천의 자리까지 대략 나타내려고 해요.`, why: '대략 몇 명인지 가장 가까운 수로 나타낼 때는 반올림을 써요.' },
    { m: 'round', make: (r) => `${r.pick(W.names)}의 50 m 달리기 기록 ${D.str(D.make(r.int(801, 1199), 2))}초를 소수 첫째 자리까지 대략 나타내려고 해요.`, why: '기록을 가장 가까운 수로 대략 나타낼 때는 반올림을 써요.' },
  ];
  const tWhich = {
    id: 'u1s7-which', unit: 1, sub: S7, style: 'A', styleName: '어림 방법 판단', levels: [1, 4],
    build(r) {
      const si = r.int(0, SITU.length - 1);
      const s = SITU[si];
      const text = s.make(r);
      return {
        text: `다음 상황에 알맞은 어림 방법을 고르세요.\n${text}`,
        answer: { type: 'choice', options: ['ceil', 'floor', 'round'].map((m) => Object.assign({ text: MODE[m], correct: m === s.m }, m === s.m ? {} : { pattern: { cause: 'concept', msg: s.why } })) },
        keepOrder: true,
        hints: [
          '남김없이 모두 해야 하는지, 꽉 찬 것만 셀 수 있는지, 대략 나타내는지 생각해요.',
          '모두 해야 하면 올림, 꽉 찬 것만 세면 버림, 가장 가까운 수로 대략 나타내면 반올림이에요.',
          s.why,
        ],
        solution: [s.why],
        key: `u1s7-which|${text}`,
        data: { m: s.m },
      };
    },
    verify(p) { return p.answer.options[p.answer.value].text === MODE[p.data.m]; },
  };

  const LIFE_R = [
    { lv: 1, make: (r) => ({ x: D.str(D.make(r.int(1301, 1599), 1)), e: 0, unit: 'cm', q: (nm, x) => `${nm}의 키는 ${x} cm예요.` }) },
    { lv: 1, make: (r) => ({ x: D.str(D.make(r.int(251, 499), 1)), e: 0, unit: 'kg', q: (nm, x) => `${nm}의 몸무게는 ${x} kg이에요.` }) },
    { lv: 2, make: (r) => ({ x: D.str(D.make(r.int(801, 1199), 2)), e: -1, unit: '초', q: (nm, x) => `${nm}의 50 m 달리기 기록은 ${x}초예요.` }) },
    { lv: 3, make: (r) => { const e = r.pick([2, 3]); return { x: String(r.int(1001, 99999)), e, unit: '명', q: (nm, x) => `${nm}네 마을 사람은 ${x}명이에요.` }; } },
    { lv: 4, make: (r) => { const e = r.pick([3, 4]); return { x: String(r.int(100001, 999999)), e, unit: '명', q: (nm, x) => `야구장에 온 관객은 ${x}명이에요.` }; } },
  ];
  const tLifeRound = {
    id: 'u1s7-liferound', unit: 1, sub: S7, style: 'B', styleName: '생활 속 반올림', levels: [1, 4],
    build(r, lv) {
      const c = r.pick(LIFE_R.filter((x) => x.lv <= lv)).make(r);
      const { x, e, unit } = c;
      if (same(rd(x, 'floor', e), x)) return null;
      const ans = rd(x, 'round', e);
      const nm = r.pick(W.names);
      return {
        text: `${c.q(nm, n(x))}\n반올림하여 ${place(e)}까지 나타내면 몇 ${unit}인가요?`,
        answer: { type: 'num', value: ans, unit },
        patterns: ['ceil', 'floor'].map((o) => ({ value: rd(x, o, e), cause: 'concept', soft: true, msg: `${MODE[o]}을 했어요. ${modeHow('round')}` })),
        hints: roundHints(x, 'round', e, ans),
        solution: [modeHow('round'), `${n(x)} → ${n(ans)}`],
        key: `u1s7-liferound|${x}|${e}`,
        data: { x, e },
      };
    },
    verify(p) { return okRound('round', p.data.x, p.data.e, p.answer.value); },
  };

  const tNotebook = {
    id: 'u1s7-notebook', unit: 1, sub: S7, style: 'A', styleName: '여러 단계 문장제', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const k = r.pick([2, 3]);
      const st = lv === 2 ? r.int(21, 79) : r.int(101, 399);
      const bundle = lv === 4 ? 100 : 10;
      const total = st * k;
      if (total % bundle === 0 || total < bundle * 2) return null;
      const ans = ceilDiv(total, bundle);
      const forgot = ceilDiv(st, bundle);
      return {
        text: `학생 ${n(st)}명에게 공책을 한 명에 ${k}권씩 나누어 주려고 해요.\n공책은 ${bundle}권씩 묶음으로만 팔아요. 공책을 최소 몇 묶음 사야 하나요?`,
        answer: { type: 'num', value: String(ans), unit: '묶음' },
        patterns: [
          { value: String(forgot), cause: 'condition', msg: `한 명에게 ${k}권씩이에요. 필요한 공책은 ${n(st)} × ${k} = ${n(total)}(권)이에요.` },
          { value: String(Math.floor(total / bundle)), cause: 'condition', soft: true, msg: '공책이 모자라면 안 되니까 올림해야 해요.' },
          { value: String(ans * bundle), cause: 'condition', soft: true, msg: '공책 수가 아니라 몇 묶음인지 물었어요.' },
        ],
        hints: [
          '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? "한 명에 몇 권씩"인지 확인해요.',
          `필요한 공책은 ${n(st)} × ${k} = ${n(total)}(권)이에요.`,
          `${n(total)}권을 ${bundle}권씩 묶음으로 사려면 올림해서 ${ans}묶음이에요.`,
        ],
        solution: [`필요한 공책: ${n(st)} × ${k} = ${n(total)}(권)`, `올림 → ${n(ans * bundle)}권 → ${ans}묶음`],
        key: `u1s7-notebook|${st}|${k}|${bundle}`,
        data: { st, k, bundle },
      };
    },
    verify(p) {
      const { st, k, bundle } = p.data;
      const a = Number(p.answer.value);
      return a * bundle >= st * k && (a - 1) * bundle < st * k;
    },
  };

  const tBundlePrice = {
    id: 'u1s7-price', unit: 1, sub: S7, style: 'A', styleName: '여러 단계 문장제', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const t = r.pick(['구슬', '공', '지우개', '풍선', '스티커']);
      const cap = lv === 4 && r.chance(0.5) ? 100 : 10;
      const N = cap === 10 ? (lv === 2 ? r.int(11, 99) : r.int(101, 399)) : r.int(101, 999);
      if (N % cap === 0) return null;
      const price = r.pick([1500, 2000, 2500, 3000, 4000, 5000]);
      const b = ceilDiv(N, cap), ans = b * price;
      return {
        text: `${j(t, '은/는')} ${cap}개씩 한 묶음으로만 팔고, 한 묶음에 ${n(price)}원이에요.\n${t} ${n(N)}개가 필요하다면 최소 얼마를 내야 하나요?`,
        answer: { type: 'num', value: String(ans), unit: '원' },
        patterns: [
          { value: String(b), cause: 'condition', msg: '몇 묶음인지가 아니라 내야 할 돈을 물었어요.' },
          { value: String(Math.floor(N / cap) * price), cause: 'condition', soft: true, msg: '모자라면 안 되니까 묶음 수는 올림해야 해요.' },
        ],
        hints: [
          '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 묶음으로만 살 수 있고, 내야 할 돈을 물었어요.',
          `${n(N)}개가 필요하면 ${cap}개씩 묶음은 올림해서 ${b}묶음 사야 해요.`,
          `${b} × ${n(price)} = ${n(ans)}(원)`,
        ],
        solution: [`필요한 묶음: ${b}묶음 (올림)`, `${b} × ${n(price)} = ${n(ans)}(원)`],
        key: `u1s7-price|${t}|${N}|${cap}|${price}`,
        data: { N, cap, price },
      };
    },
    verify(p) {
      const { N, cap, price } = p.data;
      const a = Number(p.answer.value);
      if (a % price) return false;
      const b = a / price;
      return b * cap >= N && (b - 1) * cap < N;
    },
  };

  const tBackward = {
    id: 'u1s7-backward', unit: 1, sub: S7, style: 'B', styleName: '거꾸로 문제', levels: [2, 4],
    build(r, lv) {
      const ctx = r.pick([{ v: '보트', c: '대', cap: 10 }, { v: '케이블카', c: '대', cap: 10 }, { v: '버스', c: '대', cap: lv === 4 ? 100 : 10 }]);
      const cap = ctx.cap;
      const k = lv === 2 ? r.int(3, 9) : lv === 3 ? r.int(10, 40) : r.int(11, 99);
      const lo = (k - 1) * cap + 1, hi = k * cap;
      return {
        text: `학생들이 한 ${ctx.c}에 ${cap}명씩 탈 수 있는 ${ctx.v}에 모두 타려면 ${j(ctx.v, '이/가')} 최소 ${k}${ctx.c} 필요해요.\n학생 수가 될 수 있는 수 중에서 가장 적은 수와 가장 많은 수를 구하세요.`,
        answer: { type: 'pair', labels: ['가장 적은 수', '가장 많은 수'], values: [String(lo), String(hi)] },
        patterns: [
          { value: [String(lo - 1), String(hi)], cause: 'concept', soft: true, msg: `학생이 ${n(lo - 1)}명이면 ${ctx.v} ${k - 1}${ctx.c}로 모두 탈 수 있어요.` },
          { value: [String(hi), String(hi + cap - 1)], cause: 'concept', soft: true, msg: `${j(ctx.v, '이/가')} ${k}${ctx.c} 필요하다는 건 ${k - 1}${ctx.c}로는 모자란다는 뜻이에요. 버림이 아니라 올림으로 생각해요.` },
        ],
        hints: [
          `${j(ctx.v, '이/가')} 최소 ${k}${ctx.c} 필요하려면 ${k - 1}${ctx.c}로는 모자라야 해요.`,
          `${k - 1}${ctx.c}에는 최대 ${n((k - 1) * cap)}명, ${k}${ctx.c}에는 최대 ${n(k * cap)}명이 탈 수 있어요.`,
          `그래서 학생 수는 ${n(lo)}명부터 ${n(hi)}명까지예요.`,
        ],
        solution: [`올림하여 ${cap === 10 ? '십' : '백'}의 자리까지 나타내면 ${j(n(hi), '이/가')} 되는 수: ${n(lo)}부터 ${n(hi)}까지`],
        key: `u1s7-backward|${ctx.v}|${cap}|${k}`,
        data: { cap, k },
      };
    },
    verify(p) {
      const { cap, k } = p.data;
      const [lo, hi] = p.answer.values.map(Number);
      return ceilDiv(lo, cap) === k && ceilDiv(hi, cap) === k && ceilDiv(lo - 1, cap) === k - 1 && ceilDiv(hi + 1, cap) === k + 1;
    },
  };

  M5.addTemplates([
    ...roundSet('ceil'), ...roundSet('floor'), ...roundSet('round'),
    tBus, tBills, tPack, tCoins, tWhich, tLifeRound, tNotebook, tBundlePrice, tBackward,
  ]);
})();
