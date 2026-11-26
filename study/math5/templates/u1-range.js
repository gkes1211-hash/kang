// 1단원 수의 범위와 어림하기 ① — 이상과 이하 / 초과와 미만 / 수의 범위를 활용한 문제 해결
//
// 문제 틀 하나는 build(rng, 난이도)로 문제를 만들고, verify(문제)로 정답이 조건을 만족하는지 따로 확인한다.
// verify는 build와 다른 방법(Number 비교, 하나씩 세기)으로 확인해서 실수를 잡는다.
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const D = M5.dec, T = M5.text, W = M5.words;
  const j = T.j, n = T.num;

  M5.addUnit({
    id: 1,
    name: '수의 범위와 어림하기',
    subs: [
      { id: 'u1s1', name: '이상과 이하', concept: '10 이상인 수는 10과 같거나 10보다 큰 수예요. 10, 10.5, 11처럼 10도 들어가요.\n10 이하인 수는 10과 같거나 10보다 작은 수예요. 10도 들어가요.\n수직선에서는 경계 수를 색칠한 점(●)으로 나타내요.' },
      { id: 'u1s2', name: '초과와 미만', concept: '10 초과인 수는 10보다 큰 수예요. 10은 들어가지 않아요.\n10 미만인 수는 10보다 작은 수예요. 10은 들어가지 않아요.\n수직선에서는 경계 수를 빈 점(○)으로 나타내요.' },
      { id: 'u1s3', name: '수의 범위를 활용한 문제 해결', concept: '수의 범위는 두 조건을 함께 쓸 수 있어요. \'10 이상 15 미만\'은 10과 같거나 크고 15보다 작은 수예요.\n그래서 10은 들어가고 15는 들어가지 않아요.\n표에서 칸을 찾을 때는 경계에 있는 수가 어느 칸에 들어가는지 꼭 확인해요.' },
      { id: 'u1s4', name: '올림', concept: '올림은 구하려는 자리 아래 수를 올려서 나타내는 방법이에요.\n아래 자리에 0이 아닌 숫자가 있으면 구하려는 자리 숫자를 1 크게 하고, 아래 자리는 모두 0으로 써요.\n예) 2731을 올림하여 백의 자리까지 → 2800\n아래 자리가 모두 0이면 그대로예요. 예) 2700 → 2700' },
      { id: 'u1s5', name: '버림', concept: '버림은 구하려는 자리 아래 수를 버려서 나타내는 방법이에요.\n구하려는 자리 아래 숫자를 모두 0으로 바꾸면 돼요.\n예) 2789를 버림하여 백의 자리까지 → 2700' },
      { id: 'u1s6', name: '반올림', concept: '반올림은 구하려는 자리 바로 아래 자리 숫자를 봐요.\n0, 1, 2, 3, 4이면 버리고, 5, 6, 7, 8, 9이면 올려요.\n예) 2749를 반올림하여 백의 자리까지 → 바로 아래 숫자가 4라서 2700\n예) 2751 → 바로 아래 숫자가 5라서 2800' },
      { id: 'u1s7', name: '올림·버림·반올림을 활용한 문제 해결', concept: '생활 속에서는 상황에 맞는 어림 방법을 골라야 해요.\n남김없이 모두 담거나 태워야 하면 올림, 꽉 채운 것만 셀 수 있으면 버림, 대략 얼마인지 나타낼 때는 반올림을 써요.\n예) 학생 123명이 10명씩 타는 보트에 모두 타려면 → 13대 (올림)' },
    ],
  });

  // ---------- 공통 도우미 ----------
  const KIND = {
    이상: { lo: true, closed: true },
    초과: { lo: true, closed: false },
    이하: { lo: false, closed: true },
    미만: { lo: false, closed: false },
  };
  const ALL4 = ['이상', '초과', '이하', '미만'];
  const TWIN = { 이상: '초과', 초과: '이상', 이하: '미만', 미만: '이하' }; // 경계 수 포함만 다름
  const FLIP = { 이상: '이하', 이하: '이상', 초과: '미만', 미만: '초과' }; // 방향만 다름
  const LO = ['이상', '초과'];
  const HI = ['이하', '미만'];

  // 만들 때 쓰는 비교 (정확한 소수 계산)
  function inK(k, x, b) {
    const c = D.cmp(x, b);
    return k === '이상' ? c >= 0 : k === '초과' ? c > 0 : k === '이하' ? c <= 0 : c < 0;
  }
  // 검사할 때 쓰는 비교 (다른 방법: Number)
  function chk(k, x, b) {
    x = Number(x); b = Number(b);
    return k === '이상' ? x >= b : k === '초과' ? x > b : k === '이하' ? x <= b : x < b;
  }
  const sameSet = (a, b) => a.map(Number).sort((x, y) => x - y).join('|') === b.map(Number).sort((x, y) => x - y).join('|');
  const tenth = (t) => D.str(D.make(t, 1)); // 0.1 단위 정수 → 수 글자
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const q = (s) => `'${s}'`;

  function meaning(k, b) {
    const bn = n(b);
    switch (k) {
      case '이상': return `${bn} 이상인 수는 ${j(bn, '와/과')} 같거나 ${bn}보다 큰 수예요. ${bn}도 들어가요.`;
      case '초과': return `${bn} 초과인 수는 ${bn}보다 큰 수예요. ${j(bn, '은/는')} 들어가지 않아요.`;
      case '이하': return `${bn} 이하인 수는 ${j(bn, '와/과')} 같거나 ${bn}보다 작은 수예요. ${bn}도 들어가요.`;
      default: return `${bn} 미만인 수는 ${bn}보다 작은 수예요. ${j(bn, '은/는')} 들어가지 않아요.`;
    }
  }
  const boundaryMsg = (k, b) => (KIND[k].closed
    ? `${q(n(b) + ' ' + k)}에는 경계 수 ${n(b)}도 들어가요.`
    : `${q(n(b) + ' ' + k)}에는 경계 수 ${j(n(b), '이/가')} 들어가지 않아요.`);
  const flipMsg = (k) => `${j(q(k), '은/는')} 경계 수보다 ${KIND[k].lo ? '큰' : '작은'} 쪽이에요. 반대쪽을 골랐어요.`;

  // 한쪽만 있는 수직선
  function oneSideFig(b, k) {
    const min = Math.max(0, b - 4);
    return {
      type: 'numberline', min, max: min + 8,
      marks: [{ v: b, closed: KIND[k].closed }],
      seg: KIND[k].lo ? { from: b, to: null } : { from: null, to: b },
    };
  }
  function kindFromFig(fig) {
    const closed = fig.marks[0].closed;
    const lo = fig.seg.to == null;
    return lo ? (closed ? '이상' : '초과') : (closed ? '이하' : '미만');
  }
  function readMsg(k, kk) {
    if (TWIN[k] === kk) return { cause: 'concept', msg: '●(색칠한 점)은 그 수를 포함하고, ○(빈 점)은 포함하지 않아요. 점 모양을 다시 봐요.' };
    if (FLIP[k] === kk) return { cause: 'concept', msg: '선이 뻗은 방향을 다시 봐요. 오른쪽은 큰 수, 왼쪽은 작은 수 쪽이에요.' };
    return { cause: 'concept', msg: '점 모양과 선이 뻗은 방향을 둘 다 다시 봐요.' };
  }

  // ======================================================================
  // 소단원 1·2 공통 틀 (이상·이하 / 초과·미만)
  // ======================================================================

  // 1. 수 고르기 — 조건에 맞는 수를 모두 쓰기
  function tPick(sub, kinds) {
    return {
      id: sub + '-pick', unit: 1, sub, style: 'A', styleName: '수 고르기', levels: [1, 4],
      build(r, lv) {
        const k = r.pick(kinds);
        const bT = lv === 1 ? r.int(15, 60) * 10 : lv === 2 ? r.int(30, 150) * 10 : lv === 3 ? r.int(20, 99) * 10 : r.int(20, 99) * 10 + r.int(1, 9);
        const cnt = [0, 6, 7, 7, 8][lv];
        const pool = [];
        for (let d = -6; d <= 6; d++) if (d) pool.push(bT + d * 10);
        if (lv >= 3) for (let d = -3; d <= 3; d++) pool.push(bT + d * 10 + r.pick([-5, -3, -1, 1, 2, 4]));
        const uniq = [...new Set(pool)].filter((t) => t > 0 && t !== bT);
        const list = r.shuffle([bT, ...r.sample(uniq, cnt - 1)]).map(tenth);
        const b = tenth(bT);
        const by = (kk) => list.filter((x) => inK(kk, x, b));
        const ans = by(k);
        if (ans.length < 1 || ans.length > list.length - 2) return null;
        const strict = list.filter((x) => !D.eq(x, b) && inK(k, x, b));
        const bn = n(b);
        return {
          text: `다음 수 중에서 ${bn} ${k}인 수를 모두 찾아 쓰세요.`,
          figure: { type: 'chips', items: list.map(n) },
          answer: { type: 'nums', values: ans },
          patterns: [
            { value: by(TWIN[k]), cause: 'concept', msg: boundaryMsg(k, b) },
            { value: by(FLIP[k]), cause: 'concept', msg: flipMsg(k) },
          ],
          hints: [
            `${q(k)}의 뜻을 떠올려 봐요. 경계 수 ${bn}보다 큰 수를 찾나요, 작은 수를 찾나요?`,
            meaning(k, b),
            `${bn}보다 ${KIND[k].lo ? '큰' : '작은'} 수: ${strict.map(n).join(', ') || '없음'} / 경계 수 ${bn}: ${KIND[k].closed ? '들어가요' : '들어가지 않아요'}. 이 수들을 모두 써요.`,
          ],
          solution: [meaning(k, b), `조건에 맞는 수: ${ans.map(n).join(', ')}`],
          key: `${sub}-pick|${k}|${b}|${list.slice().sort().join(',')}`,
          data: { k, b, list },
        };
      },
      verify(p) {
        const { k, b, list } = p.data;
        return sameSet(list.filter((x) => chk(k, x, b)), p.answer.values);
      },
    };
  }

  // 2. 자연수 개수 세기
  function tCount(sub, kl, kh) {
    return {
      id: sub + '-count', unit: 1, sub, style: 'A', styleName: '자연수 개수', levels: [1, 4],
      build(r, lv) {
        let aT, bT;
        if (lv === 1) { const a = r.int(5, 40); aT = a * 10; bT = (a + r.int(3, 8)) * 10; }
        else if (lv === 2) { const a = r.int(20, 120); aT = a * 10; bT = (a + r.int(6, 15)) * 10; }
        else if (lv === 3) { const a = r.int(100, 600); aT = a * 10; bT = (a + r.int(12, 40)) * 10; }
        else { const a = r.int(10, 90); aT = a * 10 + r.int(1, 9); bT = (a + r.int(5, 20)) * 10 + (r.chance(0.5) ? r.int(1, 9) : 0); }
        const startOf = (k) => (k === '이상' ? Math.ceil(aT / 10) : Math.floor(aT / 10) + 1);
        const endOf = (k) => (k === '이하' ? Math.floor(bT / 10) : Math.ceil(bT / 10) - 1);
        const start = startOf(kl), end = endOf(kh), cnt = end - start + 1;
        if (cnt < 2) return null;
        const twinCnt = endOf(TWIN[kh]) - startOf(TWIN[kl]) + 1;
        const a = tenth(aT), b = tenth(bT), an = n(a), bn = n(b);
        const patterns = [{ value: String(twinCnt), cause: 'concept', soft: true, msg: '경계 수가 들어가는지 다시 봐요. \'이상\'·\'이하\'는 경계 수가 들어가고, \'초과\'·\'미만\'은 들어가지 않아요.' }];
        if (aT % 10 === 0 && bT % 10 === 0) patterns.push({ value: String((bT - aT) / 10), cause: 'calc', soft: true, msg: `${bn}에서 ${j(an, '을/를')} 빼기만 하면 개수가 맞지 않아요. 가장 작은 수부터 가장 큰 수까지 세어 봐요.` });
        return {
          text: `${an} ${kl} ${bn} ${kh}인 자연수는 모두 몇 개인가요?`,
          answer: { type: 'num', value: String(cnt), unit: '개' },
          patterns,
          hints: [
            '조건에 맞는 자연수 중에서 가장 작은 수와 가장 큰 수를 먼저 찾아봐요.',
            `가장 작은 수는 ${start}, 가장 큰 수는 ${j(end, '이에요/예요')}.`,
            `${start}부터 ${end}까지의 개수는 ${end} - ${start} + 1 = ${cnt}(개)예요.`,
          ],
          solution: [`${an} ${kl} ${bn} ${kh}인 자연수는 ${start}부터 ${end}까지예요.`, `${end} - ${start} + 1 = ${cnt}(개)`],
          key: `${sub}-count|${a}|${b}`,
          data: { a, b, kl, kh },
        };
      },
      verify(p) {
        const { a, b, kl, kh } = p.data;
        let c = 0;
        for (let x = 1; x <= Math.ceil(Number(b)) + 1; x++) if (chk(kl, x, a) && chk(kh, x, b)) c++;
        return String(c) === p.answer.value;
      },
    };
  }

  // 3. 수직선 읽기 (한쪽)
  function tLineRead(sub, kinds) {
    return {
      id: sub + '-line', unit: 1, sub, style: 'A', styleName: '수직선 읽기', levels: [1, 3],
      build(r, lv) {
        const b = lv === 1 ? r.int(5, 30) : lv === 2 ? r.int(30, 200) : r.int(200, 900);
        const k = r.pick(kinds);
        const fig = oneSideFig(b, k);
        const bn = n(b);
        return {
          text: '수직선에 나타낸 수의 범위를 고르세요.',
          figure: fig,
          answer: {
            type: 'choice',
            options: ALL4.map((kk) => Object.assign({ text: `${bn} ${kk}`, correct: kk === k }, kk === k ? {} : { pattern: readMsg(k, kk) })),
          },
          hints: [
            '점의 모양과 선이 뻗은 방향을 차례로 살펴봐요.',
            '●는 그 수를 포함하고 ○는 포함하지 않아요. 오른쪽으로 뻗으면 큰 수, 왼쪽으로 뻗으면 작은 수 쪽이에요.',
            `점은 ${KIND[k].closed ? '●' : '○'}이고, 선은 ${KIND[k].lo ? '오른쪽' : '왼쪽'}으로 뻗었어요. 그래서 ${j(q(bn + ' ' + k), '이에요/예요')}.`,
          ],
          solution: [`${KIND[k].closed ? '●' : '○'} 점, ${KIND[k].lo ? '오른쪽' : '왼쪽'} 방향 → ${bn} ${k}`],
          key: `${sub}-line|${b}|${k}`,
          data: { b, k },
        };
      },
      verify(p) {
        const kk = kindFromFig(p.figure);
        return kk === p.data.k && p.answer.options[p.answer.value].text === `${n(p.data.b)} ${kk}`;
      },
    };
  }

  // 4. 범위를 보고 알맞은 수직선 고르기 (보기가 그림)
  function tLinePick(sub, kinds) {
    return {
      id: sub + '-linepick', unit: 1, sub, style: 'B', styleName: '수직선 고르기', levels: [1, 3],
      build(r, lv) {
        const b = lv === 1 ? r.int(5, 30) : lv === 2 ? r.int(30, 200) : r.int(200, 900);
        const k = r.pick(kinds);
        const bn = n(b);
        return {
          text: `${j(q(bn + ' ' + k), '을/를')} 수직선에 바르게 나타낸 것을 고르세요.`,
          answer: {
            type: 'choice',
            options: ALL4.map((kk) => Object.assign({ key: kk, figure: oneSideFig(b, kk), correct: kk === k }, kk === k ? {} : { pattern: readMsg(k, kk) })),
          },
          hints: [
            `${j(q(k), '은/는')} 경계 수를 포함하는지, 어느 쪽으로 뻗는지 생각해요.`,
            '포함하면 ●, 포함하지 않으면 ○예요. 큰 쪽이면 오른쪽, 작은 쪽이면 왼쪽으로 뻗어요.',
            `${bn} ${j(k, '은/는')} ${KIND[k].closed ? '●' : '○'} 점에서 ${KIND[k].lo ? '오른쪽' : '왼쪽'}으로 뻗은 수직선이에요.`,
          ],
          solution: [meaning(k, b), `${KIND[k].closed ? '●' : '○'} 점, ${KIND[k].lo ? '오른쪽' : '왼쪽'} 방향`],
          key: `${sub}-linepick|${b}|${k}`,
          data: { b, k },
        };
      },
      verify(p) {
        const opt = p.answer.options[p.answer.value];
        return kindFromFig(opt.figure) === p.data.k && p.answer.options.filter((o) => kindFromFig(o.figure) === p.data.k).length === 1;
      },
    };
  }

  // 5. 가장 작은(큰) 자연수
  function tExtreme(sub, kinds) {
    return {
      id: sub + '-extreme', unit: 1, sub, style: 'A', styleName: '가장 작은 수·큰 수', levels: [1, 4],
      build(r, lv) {
        const k = r.pick(kinds);
        const lo = KIND[k].lo;
        const bT = lv === 1 ? r.int(10, 60) * 10 : lv === 2 ? r.int(60, 300) * 10 : lv === 3 ? r.int(300, 999) * 10 : r.int(10, 99) * 10 + r.int(1, 9);
        const b = tenth(bT), bn = n(b);
        const isInt = bT % 10 === 0;
        let ans;
        const patterns = [];
        if (isInt) {
          const bi = bT / 10;
          const valOf = (kk) => (kk === '이상' || kk === '이하' ? bi : kk === '초과' ? bi + 1 : bi - 1);
          ans = valOf(k);
          patterns.push({ value: String(valOf(TWIN[k])), cause: 'concept', msg: boundaryMsg(k, b) });
        } else {
          const fl = Math.floor(bT / 10);
          ans = lo ? fl + 1 : fl;
          patterns.push({ value: b, cause: 'condition', soft: true, msg: '자연수를 물었어요. 1, 2, 3처럼 소수점이 없는 수로 답해요.' });
          patterns.push(lo
            ? { value: String(fl), cause: 'concept', soft: true, msg: `${j(fl, '은/는')} ${bn}보다 작아서 들어가지 않아요.` }
            : { value: String(fl + 1), cause: 'concept', soft: true, msg: `${j(fl + 1, '은/는')} ${bn}보다 커서 들어가지 않아요.` });
        }
        if (ans < 1) return null;
        const ask = lo ? '가장 작은 자연수' : '가장 큰 자연수';
        const seq = lo ? `${ans}, ${ans + 1}, ${ans + 2}, …` : `…, ${ans - 2}, ${ans - 1}, ${ans}`;
        return {
          text: `${bn} ${k}인 자연수 중에서 ${j(ask, '을/를')} 쓰세요.`,
          answer: { type: 'num', value: String(ans) },
          patterns,
          hints: [
            `${q(bn + ' ' + k)}에 ${j(bn, '이/가')} 들어가는지부터 생각해요.`,
            meaning(k, b),
            `조건에 맞는 자연수를 차례로 써 보면 ${j(seq, '이에요/예요')}. 그중 ${lo ? '가장 작은' : '가장 큰'} 수를 찾아요.`,
          ],
          solution: [meaning(k, b), `${ask}: ${ans}`],
          key: `${sub}-extreme|${b}|${k}`,
          data: { b, k, lo },
        };
      },
      verify(p) {
        const { b, k, lo } = p.data;
        const v = Number(p.answer.value);
        return Number.isInteger(v) && v >= 1 && chk(k, v, b) && !chk(k, lo ? v - 1 : v + 1, b);
      },
    };
  }

  // 6. O/X 판단
  function tOX(sub, kinds) {
    return {
      id: sub + '-ox', unit: 1, sub, style: 'B', styleName: 'O/X 판단', levels: [1, 3],
      build(r, lv) {
        const k = r.pick(kinds);
        const bT = lv === 1 ? r.int(10, 99) * 10 : lv === 2 ? r.int(100, 500) * 10 : r.int(10, 99) * 10 + (r.chance(0.5) ? r.int(1, 9) : 0);
        let xT = bT;
        if (!r.chance(0.45)) xT = bT + (lv === 3 ? r.pick([-1, 1]) * r.int(1, 9) : r.pick([-10, 10]));
        const b = tenth(bT), x = tenth(xT), bn = n(b), xn = n(x);
        const ans = inK(k, x, b);
        const rel = xT === bT ? '경계 수와 같아요' : xT > bT ? `${bn}보다 커요` : `${bn}보다 작아요`;
        return {
          text: `${j(xn, '은/는')} ${bn} ${k}인 수에 들어가요.\n맞으면 O, 틀리면 X를 고르세요.`,
          answer: { type: 'ox', value: ans },
          patterns: [{ value: !ans, cause: 'concept', msg: `${meaning(k, b)} 그래서 ${j(xn, '은/는')} ${ans ? '들어가요' : '들어가지 않아요'}.` }],
          hints: [
            `${j(xn, '와/과')} 경계 수 ${bn}의 크기를 먼저 비교해요.`,
            meaning(k, b),
            `${j(xn, '은/는')} ${rel}. 그래서 ${ans ? '들어가요 → O' : '들어가지 않아요 → X'}`,
          ],
          solution: [meaning(k, b), `${j(xn, '은/는')} ${rel} → ${ans ? 'O' : 'X'}`],
          key: `${sub}-ox|${b}|${x}|${k}`,
          data: { b, x, k },
        };
      },
      verify(p) { return p.answer.value === chk(p.data.k, p.data.x, p.data.b); },
    };
  }

  // 7. 생활 속 표에서 조건에 맞는 사람 고르기
  const LIFE = {
    이상: [
      { rule: (b) => `키가 ${b} cm 이상인 사람만 탈 수 있는 놀이 기구가 있어요.`, ask: '놀이 기구를 탈 수 있는 사람', col: '키(cm)', range: [118, 150] },
      { rule: (b) => `줄넘기를 ${b}번 이상 넘으면 통과예요.`, ask: '통과한 사람', col: '넘은 횟수(번)', range: [30, 90] },
    ],
    이하: [
      { rule: (b) => `몸무게가 ${b} kg 이하인 사람만 탈 수 있는 그네가 있어요.`, ask: '그네를 탈 수 있는 사람', col: '몸무게(kg)', range: [25, 50] },
      { rule: (b) => `${b}세 이하 어린이는 입장료가 무료예요.`, ask: '입장료가 무료인 사람', col: '나이(세)', range: [4, 14] },
    ],
    초과: [
      { rule: (b) => `윗몸 일으키기를 ${b}번 초과로 하면 메달을 받아요.`, ask: '메달을 받는 사람', col: '기록(번)', range: [15, 60] },
      { rule: (b) => `키가 ${b} cm 초과인 사람은 큰 의자에 앉아요.`, ask: '큰 의자에 앉는 사람', col: '키(cm)', range: [120, 150] },
    ],
    미만: [
      { rule: (b) => `${b}세 미만은 보호자와 함께 들어가야 해요.`, ask: '보호자와 함께 들어가야 하는 사람', col: '나이(세)', range: [5, 15] },
      { rule: (b) => `50 m 달리기 기록이 ${b}초 미만이면 1등급이에요.`, ask: '1등급인 사람', col: '기록(초)', range: [7, 15] },
    ],
  };
  function tLife(sub, kinds) {
    return {
      id: sub + '-life', unit: 1, sub, style: 'A', styleName: '생활 속 표', levels: [1, 3],
      build(r, lv) {
        const k = r.pick(kinds);
        const ctx = r.pick(LIFE[k]);
        const [lo, hi] = ctx.range;
        const b = r.int(lo + 3, hi - 3);
        const cnt = lv === 1 ? 5 : 6;
        const vals = r.shuffle([b, ...r.sample(range(lo, hi).filter((v) => v !== b), cnt - 1)]);
        const names = r.sample(W.names, cnt);
        const by = (kk) => names.filter((nm, i) => inK(kk, vals[i], b));
        const ans = by(k);
        if (ans.length < 1 || ans.length > cnt - 1) return null;
        return {
          text: `${ctx.rule(b)}\n표를 보고 ${j(ctx.ask, '을/를')} 모두 고르세요.`,
          figure: { type: 'table', head: ['이름', ctx.col], rows: names.map((nm, i) => [nm, String(vals[i])]) },
          answer: { type: 'multi', options: names.map((nm) => ({ key: nm, text: nm, correct: ans.includes(nm) })) },
          keepOrder: true,
          patterns: [
            { value: by(TWIN[k]), cause: 'concept', msg: boundaryMsg(k, b) },
            { value: by(FLIP[k]), cause: 'concept', soft: true, msg: flipMsg(k) },
          ],
          hints: [
            `표에서 ${j(b, '와/과')} 같은 값이 있는지 먼저 찾아봐요.`,
            meaning(k, b),
            `${b}보다 ${KIND[k].lo ? '큰' : '작은'} 사람${KIND[k].closed ? `과 ${j(b, '와/과')} 같은 사람` : ''}을 모두 골라요.`,
          ],
          solution: [meaning(k, b), `알맞은 사람: ${ans.join(', ')}`],
          key: `${sub}-life|${k}|${b}|${vals.join(',')}`,
          data: { k, b, names, vals },
        };
      },
      verify(p) {
        const { k, b, names, vals } = p.data;
        const exp = names.filter((nm, i) => chk(k, vals[i], b)).sort().join('|');
        return exp === p.answer.values.map((i) => p.answer.options[i].key).sort().join('|');
      },
    };
  }

  // 8. 거꾸로: 들어가는 자연수를 보고 경계 수 찾기
  function tReverse(sub, kinds) {
    return {
      id: sub + '-reverse', unit: 1, sub, style: 'B', styleName: '거꾸로 문제', levels: [1, 4],
      build(r, lv) {
        const L = lv === 1 ? r.int(3, 4) : lv === 2 ? r.int(4, 6) : lv === 3 ? r.int(5, 8) : r.int(6, 10);
        const start = lv === 1 ? r.int(3, 30) : lv === 2 ? r.int(20, 150) : lv === 3 ? r.int(100, 500) : r.int(300, 990);
        const end = start + L - 1;
        const list = range(start, end);
        const closed = KIND[kinds[0]].closed;
        const ans = closed ? [start, end] : [start - 1, end + 1];
        const wrong = closed ? [start - 1, end + 1] : [start, end];
        const form = `□ ${kinds[0]} □ ${kinds[1]}`;
        return {
          text: `어떤 수의 범위에 들어가는 자연수를 모두 쓰면 ${j(list.join(', '), '이에요/예요')}.\n이 범위를 ${j(q(form), '으로/로')} 나타낼 때, □ 안에 알맞은 수를 차례로 쓰세요.`,
          answer: { type: 'pair', labels: [`□ ${kinds[0]}`, `□ ${kinds[1]}`], values: ans.map(String) },
          patterns: [{
            value: wrong.map(String), cause: 'concept',
            msg: closed ? '\'이상\'·\'이하\'는 경계 수도 들어가요. 들어가는 수의 처음과 끝을 그대로 쓰면 돼요.' : '\'초과\'·\'미만\'은 경계 수가 들어가지 않아요. 한 칸 바깥 수를 경계 수로 써야 해요.',
          }],
          hints: [
            `들어가는 자연수 중 가장 작은 수는 ${start}, 가장 큰 수는 ${j(end, '이에요/예요')}.`,
            closed ? '\'이상\'과 \'이하\'는 경계 수도 들어가요.' : '\'초과\'와 \'미만\'은 경계 수가 들어가지 않아요. 한 칸 바깥 수가 경계 수예요.',
            closed ? `그래서 ${start} 이상 ${end} 이하예요.` : `${start}보다 1 작은 ${start - 1}, ${end}보다 1 큰 ${j(end + 1, '을/를')} 써서 ${start - 1} 초과 ${end + 1} 미만이에요.`,
          ],
          solution: [`${ans[0]} ${kinds[0]} ${ans[1]} ${kinds[1]}`],
          key: `${sub}-reverse|${start}|${L}`,
          data: { list, kinds },
        };
      },
      verify(p) {
        const [a, b] = p.answer.values.map(Number);
        const [k0, k1] = p.data.kinds;
        const got = [];
        for (let x = 1; x <= b + 5; x++) if (chk(k0, x, a) && chk(k1, x, b)) got.push(x);
        return got.join(',') === p.data.list.join(',');
      },
    };
  }

  function rangeBasics(sub, kinds) {
    return [
      tPick(sub, kinds), tCount(sub, kinds[0], kinds[1]), tLineRead(sub, kinds), tLinePick(sub, kinds),
      tExtreme(sub, kinds), tOX(sub, kinds), tLife(sub, kinds), tReverse(sub, kinds),
    ];
  }

  // ======================================================================
  // 소단원 3: 수의 범위를 활용한 문제 해결
  // ======================================================================
  const S3 = 'u1s3';

  const TARIFF = [
    { title: '택배 요금표', item: '상자', unit: 'kg', ends: [2, 3, 5, 10, 15, 20, 25, 30], p0: [3000, 3500, 4000], inc: [500, 1000, 1500] },
    { title: '우편 요금표', item: '편지', unit: 'g', ends: [5, 25, 50, 100, 150, 200], p0: [300, 400, 500], inc: [100, 200, 300] },
  ];
  function makeTariff(r) {
    const c = r.pick(TARIFF);
    const ends = r.sample(c.ends, 4).sort((a, b) => a - b);
    const p0 = r.pick(c.p0), inc = r.pick(c.inc);
    const prices = ends.map((_, i) => p0 + inc * i);
    const labels = ends.map((e, i) => (i === 0 ? `${e} ${c.unit} 이하` : `${ends[i - 1]} ${c.unit} 초과 ${e} ${c.unit} 이하`));
    return { c, ends, prices, labels, fig: { type: 'table', title: c.title, head: ['무게', '요금'], rows: labels.map((l, i) => [l, `${n(prices[i])}원`]) } };
  }
  const bracketOf = (tf, wT) => tf.ends.findIndex((e) => wT <= e * 10);
  // 무게 고르기 (0.1 단위 정수). 경계 무게면 bnd = true
  function pickWeight(r, tf, lv) {
    const i = r.int(0, tf.ends.length - 1);
    const loT = i ? tf.ends[i - 1] * 10 : 0, hiT = tf.ends[i] * 10;
    if (lv >= 3 && r.chance(0.5)) {
      const k = r.int(0, tf.ends.length - 2);
      return { wT: tf.ends[k] * 10, bnd: true };
    }
    if (lv >= 3) {
      const k = r.int(0, tf.ends.length - 2);
      return { wT: tf.ends[k] * 10 + r.int(1, 5), bnd: false };
    }
    if (lv === 1 && hiT - loT >= 20) return { wT: r.int(loT / 10 + 1, hiT / 10 - 1) * 10, bnd: false };
    let wT;
    do { wT = r.int(loT + 1, hiT - 1); } while (wT % 10 === 0);
    return { wT, bnd: false };
  }
  function tariffPatterns(tf, wT, i, otherPrice = 0) {
    const w = tenth(wT), u = tf.c.unit;
    if (wT === tf.ends[i] * 10 && i + 1 < tf.prices.length) {
      return [{ value: String(tf.prices[i + 1] + otherPrice), cause: 'concept', msg: `${j(`${n(w)} ${u}`, '은/는')} '${tf.labels[i]}' 칸에 들어가요. '이하'는 그 수도 포함해요.` }];
    }
    if (i > 0 && wT - tf.ends[i - 1] * 10 <= 5) {
      return [{ value: String(tf.prices[i - 1] + otherPrice), cause: 'concept', soft: true, msg: `'${tf.ends[i - 1]} ${u} 초과'는 ${tf.ends[i - 1]} ${u}보다 조금이라도 무거우면 들어가요.` }];
    }
    return [];
  }
  function tariffCheck(ends, prices, w) {
    for (let i = 0; i < ends.length; i++) if (w <= ends[i] && (i === 0 || w > ends[i - 1])) return prices[i];
    return null;
  }

  const tTariff = {
    id: 'u1s3-tariff', unit: 1, sub: S3, style: 'A', styleName: '요금표', levels: [1, 4],
    build(r, lv) {
      const tf = makeTariff(r);
      const { wT } = pickWeight(r, tf, lv);
      const i = bracketOf(tf, wT);
      if (i < 0) return null;
      const w = n(tenth(wT)), u = tf.c.unit, price = tf.prices[i], name = r.pick(W.names);
      return {
        text: `${tf.c.title}를 보고 답하세요.\n${j(name, '이/가')} 무게가 ${w} ${u}인 ${j(tf.c.item, '을/를')} 보내려고 해요. 요금은 얼마인가요?`,
        figure: tf.fig,
        answer: { type: 'num', value: String(price), unit: '원' },
        patterns: tariffPatterns(tf, wT, i),
        hints: [
          `${w} ${j(u, '이/가')} 표의 어느 칸에 들어가는지 찾아봐요.`,
          '\'초과\'는 그 수가 들어가지 않고, \'이하\'는 그 수가 들어가요.',
          `${w} ${j(u, '은/는')} '${tf.labels[i]}' 칸이에요. 그래서 요금은 ${n(price)}원이에요.`,
        ],
        solution: [`${w} ${u} → '${tf.labels[i]}' 칸`, `요금: ${n(price)}원`],
        key: `u1s3-tariff|${tf.ends}|${tf.prices[0]}|${wT}`,
        data: { ends: tf.ends, prices: tf.prices, w: tenth(wT) },
      };
    },
    verify(p) {
      const { ends, prices, w } = p.data;
      return tariffCheck(ends, prices, Number(w)) === Number(p.answer.value);
    },
  };

  const tTariffSum = {
    id: 'u1s3-tariffsum', unit: 1, sub: S3, style: 'A', styleName: '요금표', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const tf = makeTariff(r);
      const w1 = pickWeight(r, tf, lv).wT, w2 = pickWeight(r, tf, Math.min(lv, 2)).wT;
      const i1 = bracketOf(tf, w1), i2 = bracketOf(tf, w2);
      if (i1 < 0 || i2 < 0 || i1 === i2) return null;
      const p1 = tf.prices[i1], p2 = tf.prices[i2], u = tf.c.unit, item = tf.c.item, name = r.pick(W.names);
      const a = n(tenth(w1)), b = n(tenth(w2));
      return {
        text: `${tf.c.title}를 보고 답하세요.\n${j(name, '이/가')} 무게가 ${a} ${u}, ${b} ${u}인 ${item} 2개를 보내려고 해요. 요금은 모두 얼마인가요?`,
        figure: tf.fig,
        answer: { type: 'num', value: String(p1 + p2), unit: '원' },
        patterns: [
          { value: String(p1), cause: 'condition', msg: `보내는 ${j(item, '이/가')} 2개예요. 두 요금을 모두 더해야 해요.` },
          { value: String(p2), cause: 'condition', msg: `보내는 ${j(item, '이/가')} 2개예요. 두 요금을 모두 더해야 해요.` },
          ...tariffPatterns(tf, w1, i1, p2),
        ],
        hints: [
          `문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 보내는 ${j(item, '이/가')} 몇 개인지 확인해요.`,
          `${a} ${j(u, '와/과')} ${b} ${j(u, '이/가')} 각각 표의 어느 칸인지 찾아요.`,
          `${a} ${u} → ${n(p1)}원, ${b} ${u} → ${n(p2)}원. 더하면 ${n(p1)} + ${n(p2)} = ${n(p1 + p2)}(원)`,
        ],
        solution: [`${a} ${u}: ${n(p1)}원`, `${b} ${u}: ${n(p2)}원`, `모두 ${n(p1 + p2)}원`],
        key: `u1s3-tariffsum|${tf.ends}|${tf.prices[0]}|${w1}|${w2}`,
        data: { ends: tf.ends, prices: tf.prices, ws: [tenth(w1), tenth(w2)] },
      };
    },
    verify(p) {
      const { ends, prices, ws } = p.data;
      return ws.reduce((s, w) => s + tariffCheck(ends, prices, Number(w)), 0) === Number(p.answer.value);
    },
  };

  const CLASSES = ['핀급', '플라이급', '밴텀급', '페더급', '라이트급', '웰터급'];
  const tWeightClass = {
    id: 'u1s3-class', unit: 1, sub: S3, style: 'A', styleName: '체급표', levels: [1, 4],
    build(r, lv) {
      const start = r.int(26, 34), step = r.pick([2, 3, 4]);
      const ups = CLASSES.map((_, i) => start + step * i);
      const labels = ups.map((u, i) => (i === 0 ? `${u} kg 이하` : `${ups[i - 1]} kg 초과 ${u} kg 이하`));
      const i = r.int(1, 4);
      let wT;
      if (lv >= 3 && r.chance(0.5)) wT = ups[i] * 10;
      else if (lv >= 3) wT = ups[i - 1] * 10 + r.int(1, 5);
      else if (lv === 1) wT = r.int(ups[i - 1] + 1, ups[i] - 1) * 10;
      else { do { wT = r.int(ups[i - 1] * 10 + 1, ups[i] * 10 - 1); } while (wT % 10 === 0); }
      const onBoundary = wT === ups[i] * 10;
      const w = n(tenth(wT)), name = r.pick(W.names);
      const s0 = r.int(Math.max(0, onBoundary ? i - 2 : i - 3), Math.min(i, 2));
      const idx = [s0, s0 + 1, s0 + 2, s0 + 3];
      return {
        text: `태권도 체급표예요.\n몸무게가 ${w} kg인 ${j(name, '은/는')} 어느 체급인가요?`,
        figure: { type: 'table', title: '체급표', head: ['체급', '몸무게'], rows: CLASSES.map((c, k) => [c, labels[k]]) },
        answer: {
          type: 'choice',
          options: idx.map((k) => Object.assign({ text: CLASSES[k], correct: k === i }, k === i ? {} : {
            pattern: onBoundary && k === i + 1
              ? { cause: 'concept', msg: `${w} ${j('kg', '은/는')} '${labels[i]}'에 들어가요. '초과'는 경계 수를 포함하지 않아요.` }
              : { cause: 'condition', msg: `표에서 ${w} ${j('kg', '이/가')} 들어가는 칸을 다시 찾아봐요.` },
          })),
        },
        keepOrder: true,
        hints: [
          `${w} ${j('kg', '이/가')} 표의 어느 칸에 들어가는지 찾아봐요.`,
          '\'초과\'는 경계 수가 들어가지 않고, \'이하\'는 경계 수가 들어가요.',
          `${w} ${j('kg', '은/는')} '${labels[i]}' 칸이라서 ${j(CLASSES[i], '이에요/예요')}.`,
        ],
        solution: [`${w} kg → '${labels[i]}' → ${CLASSES[i]}`],
        key: `u1s3-class|${start}|${step}|${wT}`,
        data: { ups, w: tenth(wT) },
      };
    },
    verify(p) {
      const { ups, w } = p.data;
      const x = Number(w);
      const i = ups.findIndex((u, k) => x <= u && (k === 0 || x > ups[k - 1]));
      return p.answer.options[p.answer.value].text === CLASSES[i];
    },
  };

  const tTwoCond = {
    id: 'u1s3-twocond', unit: 1, sub: S3, style: 'A', styleName: '여러 조건', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const a = lv === 2 ? r.int(10, 60) : lv === 3 ? r.int(50, 300) : r.int(100, 800);
      const b = a + r.int(8, 20), c = r.int(a + 2, b - 3), d = b + r.int(2, 10);
      const k1 = r.pick(LO), k2 = r.pick(HI), k3 = r.pick(LO), k4 = r.pick(HI);
      const in1 = (x) => inK(k1, x, a) && inK(k2, x, b);
      const in2 = (x) => inK(k3, x, c) && inK(k4, x, d);
      const both = [];
      let c1 = 0, c2 = 0, cu = 0;
      for (let x = 1; x <= d + 2; x++) {
        const A = in1(x), B = in2(x);
        if (A) c1++; if (B) c2++; if (A || B) cu++;
        if (A && B) both.push(x);
      }
      if (both.length < 2) return null;
      const msg = '조건이 두 개예요. 두 조건을 모두 만족하는 수만 세어야 해요.';
      return {
        text: `다음 두 조건을 모두 만족하는 자연수는 몇 개인가요?\n· ${a} ${k1} ${b} ${k2}인 수\n· ${c} ${k3} ${d} ${k4}인 수`,
        answer: { type: 'num', value: String(both.length), unit: '개' },
        patterns: [
          { value: String(c1), cause: 'condition', msg },
          { value: String(c2), cause: 'condition', soft: true, msg },
          { value: String(cu), cause: 'concept', soft: true, msg: '두 조건 중 하나만 맞는 수까지 세었어요. 두 조건에 모두 맞아야 해요.' },
        ],
        hints: [
          '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 조건이 두 개예요.',
          '두 범위가 겹치는 부분을 찾아요. 수직선에 두 범위를 그려 보면 쉬워요.',
          `두 조건을 모두 만족하는 자연수는 ${both[0]}부터 ${both[both.length - 1]}까지예요. ${both[both.length - 1]} - ${both[0]} + 1 = ${both.length}(개)`,
        ],
        solution: [`첫째 조건: ${a} ${k1} ${b} ${k2}`, `둘째 조건: ${c} ${k3} ${d} ${k4}`, `겹치는 자연수: ${both[0]}부터 ${both[both.length - 1]}까지 → ${both.length}개`],
        key: `u1s3-twocond|${a}${k1}${b}${k2}|${c}${k3}${d}${k4}`,
        data: { a, b, c, d, k1, k2, k3, k4 },
      };
    },
    verify(p) {
      const { a, b, c, d, k1, k2, k3, k4 } = p.data;
      let cnt = 0;
      for (let x = 1; x <= d + 2; x++) if (chk(k1, x, a) && chk(k2, x, b) && chk(k3, x, c) && chk(k4, x, d)) cnt++;
      return String(cnt) === p.answer.value;
    },
  };

  const tTwoEnd = {
    id: 'u1s3-line2', unit: 1, sub: S3, style: 'A', styleName: '수직선 읽기', levels: [1, 3],
    build(r, lv) {
      const a = lv === 1 ? r.int(2, 20) : lv === 2 ? r.int(20, 150) : r.int(150, 900);
      const b = a + r.int(3, 6);
      const kl = r.pick(LO), kh = r.pick(HI);
      const fig = {
        type: 'numberline', min: Math.max(0, a - 2), max: Math.max(0, a - 2) + (b - a) + 4,
        marks: [{ v: a, closed: KIND[kl].closed }, { v: b, closed: KIND[kh].closed }], seg: { from: a, to: b },
      };
      const opts = [];
      for (const x of LO) for (const y of HI) {
        const ok = x === kl && y === kh;
        const msg = x !== kl && y !== kh ? '양쪽 끝 점의 모양을 모두 다시 봐요. ●는 포함, ○는 포함하지 않아요.'
          : x !== kl ? `왼쪽 끝 ${a}의 점 모양을 다시 봐요. ●는 포함, ○는 포함하지 않아요.`
            : `오른쪽 끝 ${b}의 점 모양을 다시 봐요. ●는 포함, ○는 포함하지 않아요.`;
        opts.push(Object.assign({ text: `${a} ${x} ${b} ${y}`, correct: ok }, ok ? {} : { pattern: { cause: 'concept', msg } }));
      }
      return {
        text: '수직선에 나타낸 수의 범위를 고르세요.',
        figure: fig,
        answer: { type: 'choice', options: opts },
        hints: [
          '왼쪽 끝 점과 오른쪽 끝 점의 모양을 하나씩 봐요.',
          '왼쪽 끝: ●이면 \'이상\', ○이면 \'초과\'. 오른쪽 끝: ●이면 \'이하\', ○이면 \'미만\'.',
          `왼쪽 끝은 ${KIND[kl].closed ? '●' : '○'}, 오른쪽 끝은 ${KIND[kh].closed ? '●' : '○'} → ${a} ${kl} ${b} ${kh}`,
        ],
        solution: [`${a} ${kl} ${b} ${kh}`],
        key: `u1s3-line2|${a}|${b}|${kl}|${kh}`,
        data: { a, b },
      };
    },
    verify(p) {
      const [m1, m2] = p.figure.marks;
      const exp = `${p.data.a} ${m1.closed ? '이상' : '초과'} ${p.data.b} ${m2.closed ? '이하' : '미만'}`;
      return p.answer.options[p.answer.value].text === exp;
    },
  };

  const tRide = {
    id: 'u1s3-ride', unit: 1, sub: S3, style: 'A', styleName: '생활 속 표', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const A = r.int(7, 10), H = r.int(125, 140);
      const ka = r.pick(LO), kh = r.pick(LO);
      const cnt = lv === 2 ? 5 : 6;
      const names = r.sample(W.names, cnt);
      const ppl = names.map((nm) => ({ nm, age: r.int(A - 3, A + 3), h: r.int(H - 10, H + 10) }));
      if (lv >= 3) { ppl[0].age = A; ppl[1].h = H; }
      const order = r.shuffle(ppl);
      const ageOk = order.filter((x) => inK(ka, x.age, A)).map((x) => x.nm);
      const hOk = order.filter((x) => inK(kh, x.h, H)).map((x) => x.nm);
      const ans = order.filter((x) => inK(ka, x.age, A) && inK(kh, x.h, H)).map((x) => x.nm);
      if (!ans.length || ans.length === cnt || ageOk.length === ans.length) return null;
      const msg = '조건이 두 개예요. 나이와 키 조건을 둘 다 만족해야 해요.';
      return {
        text: `나이가 ${A}세 ${ka}이고, 키가 ${H} cm ${kh}인 사람만 탈 수 있는 놀이 기구가 있어요.\n표를 보고 탈 수 있는 사람을 모두 고르세요.`,
        figure: { type: 'table', head: ['이름', '나이(세)', '키(cm)'], rows: order.map((x) => [x.nm, String(x.age), String(x.h)]) },
        answer: { type: 'multi', options: order.map((x) => ({ key: x.nm, text: x.nm, correct: ans.includes(x.nm) })) },
        keepOrder: true,
        patterns: [
          { value: ageOk, cause: 'condition', msg },
          { value: hOk, cause: 'condition', soft: true, msg },
        ],
        hints: [
          '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 조건이 두 개예요.',
          `먼저 나이 조건(${A}세 ${ka})에 맞는 사람을 찾고, 그중에서 키 조건(${H} cm ${kh})에도 맞는 사람을 찾아요.`,
          `나이 조건에 맞는 사람: ${ageOk.join(', ')} → 그중 키 조건에도 맞는 사람을 골라요.`,
        ],
        solution: [`나이 ${A}세 ${ka}: ${ageOk.join(', ')}`, `그중 키 ${H} cm ${kh}: ${ans.join(', ')}`],
        key: `u1s3-ride|${A}${ka}|${H}${kh}|${ppl.map((x) => x.age + '-' + x.h).join(',')}`,
        data: { A, H, ka, kh, ppl },
      };
    },
    verify(p) {
      const { A, H, ka, kh, ppl } = p.data;
      const exp = ppl.filter((x) => chk(ka, x.age, A) && chk(kh, x.h, H)).map((x) => x.nm).sort().join('|');
      return exp === p.answer.values.map((i) => p.answer.options[i].key).sort().join('|');
    },
  };

  const tFee = {
    id: 'u1s3-fee', unit: 1, sub: S3, style: 'A', styleName: '요금표', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const p1 = r.pick([500, 1000, 1500, 2000]), p2 = p1 + r.pick([500, 1000]), p3 = p2 + r.pick([1000, 1500, 2000]);
      const name = r.pick(W.names);
      const mem = [
        { who: '아빠', age: r.int(38, 50) }, { who: '엄마', age: r.int(36, 48) },
        { who: name, age: r.int(9, 12) },
      ];
      const extra = r.pick([['동생', r.int(5, 10)], ['사촌', r.int(13, 19)], ['사촌', r.int(6, 18)]]);
      mem.push({ who: extra[0], age: extra[1] });
      if (lv >= 3) mem.push({ who: '삼촌의 아이', age: r.pick([13, 19]) });
      const cls = (a) => (a < 13 ? 0 : a < 19 ? 1 : 2);
      const prices = [p1, p2, p3];
      const names = ['어린이', '청소년', '어른'];
      const sum = mem.reduce((s, m) => s + prices[cls(m.age)], 0);
      const patterns = [];
      if (mem.some((m) => m.age === 13)) patterns.push({ value: String(sum - mem.filter((m) => m.age === 13).length * (p2 - p1)), cause: 'concept', msg: '13세는 \'13세 이상 19세 미만\'인 청소년이에요. \'이상\'은 경계 수도 들어가요.' });
      if (mem.some((m) => m.age === 19)) patterns.push({ value: String(sum - mem.filter((m) => m.age === 19).length * (p3 - p2)), cause: 'concept', msg: '19세는 \'19세 이상\'인 어른이에요. \'미만\'은 경계 수가 들어가지 않아요.' });
      const detail = mem.map((m) => `${m.who}(${m.age}세) ${names[cls(m.age)]} ${n(prices[cls(m.age)])}원`).join(', ');
      return {
        text: `${name}네 가족이 놀이공원에 가요.\n가족의 나이: ${mem.map((m) => `${m.who} ${m.age}세`).join(', ')}\n가족 모두의 입장료는 얼마인가요?`,
        figure: { type: 'table', title: '입장료', head: ['구분', '나이', '입장료'], rows: [['어린이', '13세 미만', `${n(p1)}원`], ['청소년', '13세 이상 19세 미만', `${n(p2)}원`], ['어른', '19세 이상', `${n(p3)}원`]] },
        answer: { type: 'num', value: String(sum), unit: '원' },
        patterns,
        hints: [
          '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요? 가족 한 사람씩 어느 칸인지 정해요.',
          '13세, 19세처럼 경계에 있는 나이는 \'이상\'과 \'미만\'을 잘 보고 정해요.',
          `${detail} → 모두 더하면 ${n(sum)}원`,
        ],
        solution: [detail, `합: ${n(sum)}원`],
        key: `u1s3-fee|${p1}|${p2}|${p3}|${mem.map((m) => m.age).join(',')}`,
        data: { ages: mem.map((m) => m.age), prices },
      };
    },
    verify(p) {
      const { ages, prices } = p.data;
      const total = ages.reduce((s, a) => s + (a >= 19 ? prices[2] : a >= 13 ? prices[1] : prices[0]), 0);
      return total === Number(p.answer.value);
    },
  };

  const tCountPuzzle = {
    id: 'u1s3-puzzle', unit: 1, sub: S3, style: 'B', styleName: '퍼즐', levels: [1, 4],
    build(r, lv) {
      const k1 = r.pick(LO), k2 = r.pick(HI);
      const cnt = lv === 1 ? r.int(3, 6) : lv === 2 ? r.int(5, 12) : lv === 3 ? r.int(10, 30) : r.int(20, 60);
      const lowUnknown = lv < 4 || r.chance(0.5);
      let a, b, start, end, text, ans;
      if (lowUnknown) {
        b = lv === 1 ? r.int(10, 30) : lv === 2 ? r.int(30, 100) : lv === 3 ? r.int(100, 500) : r.int(200, 999);
        end = k2 === '이하' ? b : b - 1;
        start = end - cnt + 1;
        a = k1 === '이상' ? start : start - 1;
        if (a < 1) return null;
        ans = a;
        text = `□ ${k1} ${b} ${k2}인 자연수는 모두 ${cnt}개예요.\n□ 안에 알맞은 자연수를 구하세요.`;
      } else {
        a = r.int(100, 800);
        start = k1 === '이상' ? a : a + 1;
        end = start + cnt - 1;
        b = k2 === '이하' ? end : end + 1;
        ans = b;
        text = `${a} ${k1} □ ${k2}인 자연수는 모두 ${cnt}개예요.\n□ 안에 알맞은 자연수를 구하세요.`;
      }
      const msg = '경계 수가 들어가는지 다시 확인해요. \'이상\'·\'이하\'는 들어가고, \'초과\'·\'미만\'은 들어가지 않아요.';
      return {
        text,
        answer: { type: 'num', value: String(ans) },
        patterns: [{ value: String(ans - 1), cause: 'concept', msg }, { value: String(ans + 1), cause: 'concept', msg }],
        hints: [
          '자연수의 개수는 (가장 큰 수) - (가장 작은 수) + 1로 셀 수 있어요.',
          lowUnknown ? `${b} ${k2}인 자연수 중 가장 큰 수는 ${j(end, '이에요/예요')}.` : `${a} ${k1}인 자연수 중 가장 작은 수는 ${j(start, '이에요/예요')}.`,
          `자연수 ${start}부터 ${end}까지가 ${cnt}개예요. 그래서 □는 ${j(ans, '이에요/예요')}.`,
        ],
        solution: [`조건에 맞는 자연수: ${start}부터 ${end}까지 (${end} - ${start} + 1 = ${cnt}개)`, `□ = ${ans}`],
        key: `u1s3-puzzle|${a}${k1}${b}${k2}|${lowUnknown}`,
        data: { a, b, k1, k2, cnt, lowUnknown },
      };
    },
    verify(p) {
      const { k1, k2, cnt, lowUnknown } = p.data;
      const v = Number(p.answer.value);
      const a = lowUnknown ? v : p.data.a, b = lowUnknown ? p.data.b : v;
      let c = 0;
      for (let x = 1; x <= b + 2; x++) if (chk(k1, x, a) && chk(k2, x, b)) c++;
      return c === cnt;
    },
  };

  const tRangeOX = {
    id: 'u1s3-ox', unit: 1, sub: S3, style: 'B', styleName: 'O/X 판단', levels: [1, 4],
    build(r, lv) {
      const a = lv === 1 ? r.int(5, 40) : lv === 2 ? r.int(40, 200) : r.int(100, 900);
      const b = a + r.int(3, 9);
      const k1 = r.pick(LO), k2 = r.pick(HI);
      let xT;
      const roll = r.int(0, 9);
      if (roll < 3) xT = a * 10;
      else if (roll < 6) xT = b * 10;
      else if (roll < 8) xT = r.int(a + 1, b - 1) * 10 + (lv >= 3 ? r.int(0, 9) : 0);
      else xT = (r.chance(0.5) ? a - 1 : b + 1) * 10;
      const x = tenth(xT), xn = n(x);
      const ans = inK(k1, x, a) && inK(k2, x, b);
      const why = xT === a * 10 ? `${j(xn, '은/는')} 왼쪽 경계 수예요. '${k1}'${KIND[k1].closed ? '은 경계 수가 들어가요' : '는 경계 수가 들어가지 않아요'}.`
        : xT === b * 10 ? `${j(xn, '은/는')} 오른쪽 경계 수예요. '${k2}'${KIND[k2].closed ? '는 경계 수가 들어가요' : '은 경계 수가 들어가지 않아요'}.`
          : ans ? `${j(xn, '은/는')} ${j(a, '와/과')} ${b} 사이에 있는 수예요.` : `${j(xn, '은/는')} 범위 밖에 있는 수예요.`;
      return {
        text: `${j(xn, '은/는')} ${a} ${k1} ${b} ${k2}인 수에 들어가요.\n맞으면 O, 틀리면 X를 고르세요.`,
        answer: { type: 'ox', value: ans },
        patterns: [{ value: !ans, cause: 'concept', msg: `${why} 그래서 ${ans ? '들어가요' : '들어가지 않아요'}.` }],
        hints: [
          `${j(xn, '이/가')} 경계 수인지, 두 경계 수 사이에 있는지 먼저 봐요.`,
          '\'이상\'·\'이하\'는 경계 수가 들어가고, \'초과\'·\'미만\'은 들어가지 않아요.',
          `${why} → ${ans ? 'O' : 'X'}`,
        ],
        solution: [why, ans ? 'O' : 'X'],
        key: `u1s3-ox|${a}${k1}${b}${k2}|${x}`,
        data: { a, b, k1, k2, x },
      };
    },
    verify(p) { const { a, b, k1, k2, x } = p.data; return p.answer.value === (chk(k1, x, a) && chk(k2, x, b)); },
  };

  function perms(digits, len) {
    const out = new Set();
    const go = (cur, used) => {
      if (cur.length === len) { if (cur[0] !== 0) out.add(Number(cur.join(''))); return; }
      digits.forEach((d, i) => { if (!used[i]) { used[i] = true; go([...cur, d], used); used[i] = false; } });
    };
    go([], []);
    return [...out].sort((a, b) => a - b);
  }
  const tCards = {
    id: 'u1s3-cards', unit: 1, sub: S3, style: 'A', styleName: '수 카드', levels: [1, 4],
    build(r, lv) {
      let digits, len;
      if (lv <= 2) { digits = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3); len = 2; }
      else if (lv === 3) { digits = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4); len = 2; }
      else { digits = r.chance(0.5) ? [0, ...r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 2)] : r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3); len = 3; }
      const nums = perms(digits, len);
      const i = r.int(0, nums.length - 2), k = r.int(i + 1, Math.min(nums.length - 1, i + 5));
      const k1 = r.pick(LO), k2 = r.pick(HI);
      const a = lv >= 3 ? nums[i] : nums[i] - r.int(0, 2);
      const b = lv >= 3 ? nums[k] : nums[k] + r.int(0, 2);
      if (a < 1 || a >= b) return null;
      const by = (x1, x2) => nums.filter((x) => inK(x1, x, a) && inK(x2, x, b));
      const inList = by(k1, k2);
      if (!inList.length) return null;
      const m = digits.length;
      const word = len === 2 ? '두' : '세';
      const how = m === len ? `수 카드 ${m}장을 한 번씩만 사용하여 ${word} 자리 수를 만들려고 해요.` : `수 카드 ${m}장 중에서 ${len}장을 골라 한 번씩만 사용하여 ${word} 자리 수를 만들려고 해요.`;
      return {
        text: `${how}\n만들 수 있는 수 중에서 ${a} ${k1} ${b} ${k2}인 수는 모두 몇 개인가요?`,
        figure: { type: 'cards', nums: digits },
        answer: { type: 'num', value: String(inList.length), unit: '개' },
        patterns: [
          { value: String(by(TWIN[k1], TWIN[k2]).length), cause: 'concept', soft: true, msg: '경계 수가 들어가는지 다시 봐요. \'이상\'·\'이하\'는 들어가고, \'초과\'·\'미만\'은 들어가지 않아요.' },
          { value: String(nums.length), cause: 'condition', soft: true, msg: '만들 수 있는 수 중에서 범위에 맞는 수만 세어야 해요.' },
        ],
        hints: [
          `만들 수 있는 ${word} 자리 수를 빠짐없이 모두 써 봐요. 가장 높은 자리에 오는 카드부터 차례로 정하면 좋아요.${digits.includes(0) ? ' 0은 맨 앞에 올 수 없어요.' : ''}`,
          `만들 수 있는 수: ${nums.join(', ')}`,
          `그중 ${a} ${k1} ${b} ${k2}인 수: ${inList.join(', ')} → ${inList.length}개`,
        ],
        solution: [`만들 수 있는 수: ${nums.join(', ')}`, `범위에 맞는 수: ${inList.join(', ')} (${inList.length}개)`],
        key: `u1s3-cards|${digits.slice().sort().join('')}|${a}${k1}${b}${k2}`,
        data: { digits, len, a, b, k1, k2 },
      };
    },
    verify(p) {
      // 다른 방법: 모든 len 자리 수를 하나씩 보며 카드로 만들 수 있는지 확인
      const { digits, len, a, b, k1, k2 } = p.data;
      let c = 0;
      for (let x = 10 ** (len - 1); x < 10 ** len; x++) {
        const ds = String(x).split('').map(Number);
        const left = digits.slice();
        const ok = ds.every((d) => { const i = left.indexOf(d); if (i < 0) return false; left.splice(i, 1); return true; });
        if (ok && chk(k1, x, a) && chk(k2, x, b)) c++;
      }
      return String(c) === p.answer.value;
    },
  };

  M5.addTemplates([
    ...rangeBasics('u1s1', ['이상', '이하']),
    ...rangeBasics('u1s2', ['초과', '미만']),
    tTariff, tTariffSum, tWeightClass, tTwoCond, tTwoEnd, tRide, tFee, tCountPuzzle, tCards, tRangeOX,
  ]);

  M5.u1 = { chk, KIND }; // 다른 1단원 파일에서 쓴다
})();
