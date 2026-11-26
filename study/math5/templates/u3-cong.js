// 3단원 합동과 대칭 (1) — 도형의 합동 / 합동인 도형의 성질
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, W = M5.words, TB = M5.tb, g = M5.g3;
  const j = T.j;
  const { LB, GA, CIRC } = g;

  M5.addUnit({
    id: 3,
    name: '합동과 대칭',
    subs: [
      { id: 'u3s1', name: '도형의 합동', concept: '모양과 크기가 같아서 포개었을 때 완전히 겹치는 두 도형을 서로 합동이라고 해요.\n돌리거나 뒤집어 놓아도 포개어 완전히 겹치면 합동이에요.\n모양이 같아도 크기가 다르면 합동이 아니에요. 넓이나 둘레만 같은 것도 합동이 아니에요.\n삼각형은 세 변의 길이, 두 변의 길이와 그 사이의 각, 한 변의 길이와 그 양 끝 각을 알면 합동인 삼각형을 하나로 그릴 수 있어요.' },
      { id: 'u3s2', name: '합동인 도형의 성질', concept: '합동인 두 도형을 포개었을 때 겹치는 점을 대응점, 겹치는 변을 대응변, 겹치는 각을 대응각이라고 해요.\n합동인 두 도형에서 대응변의 길이는 서로 같고, 대응각의 크기도 서로 같아요.\n"삼각형 ㄱㄴㄷ과 삼각형 ㄹㅁㅂ은 합동"이라고 하면 차례대로 ㄱ과 ㄹ, ㄴ과 ㅁ, ㄷ과 ㅂ이 대응점이에요.\n삼각형 세 각의 합은 180°, 사각형 네 각의 합은 360°예요.' },
    ],
  });

  const tpl = (o) => Object.assign({ unit: 3 }, o);
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const pt = (s) => `점 ${s}`;
  const cm = (v) => `${v} cm`;
  const dg = (v) => `${v}°`;
  const mod = (a, n) => ((a % n) + n) % n;

  // 모눈 그림 하나 (도형을 한 칸 안쪽으로)
  function latFig(shapes, G, scale = 22) {
    return { type: 'geo', grid: { w: G.w, h: G.h }, polys: shapes.map((s) => ({ pts: s.pts, cls: s.cls || 'shape-a' })), texts: shapes.filter((s) => s.tag).map((s) => ({ p: s.tag, t: s.tagText })), scale, pad: 0.4 };
  }
  // 여러 칸으로 나눈 모눈에 도형을 하나씩 (칸 크기 cell)
  function cellsFig(list, cols, cell, scale) {
    const rows = Math.ceil(list.length / cols);
    const shapes = list.map((s, i) => {
      const b = g.bbox(s.pts);
      const cx = (i % cols) * cell, cy = Math.floor(i / cols) * cell;
      const ox = cx + Math.floor((cell - b.w) / 2), oy = cy + Math.max(1, Math.floor((cell - b.h) / 2));
      return { pts: g.shift(g.norm(s.pts), ox, oy), cls: s.cls, tag: [cx + 0.6, cy + 0.6], tagText: s.name };
    });
    const f = latFig(shapes, { w: cols * cell, h: rows * cell }, scale);
    f.segs = [];
    for (let c = 1; c < cols; c++) f.segs.push({ a: [c * cell, 0], b: [c * cell, rows * cell], cls: 'thin' });
    for (let r = 1; r < rows; r++) f.segs.push({ a: [0, r * cell], b: [cols * cell, r * cell], cls: 'thin' });
    return f;
  }
  const scale2 = (pts) => g.norm(pts.map(([x, y]) => [x * 2, y * 2]));

  // ======================================================================
  // 소단원 1: 도형의 합동
  // ======================================================================
  const tPick = tpl({
    id: 'u3s1-pick', sub: 'u3s1', style: 'A', styleName: '합동인 도형 고르기', levels: [1, 4],
    build(r, lv) {
      const bi = r.int(0, g.LAT.length - 1);
      const base = g.LAT[bi];
      const k = lv === 1 ? r.pick([1, 2, 3]) : r.int(1, 7);
      const right = g.applyT(base, k);
      const outs = [];
      const b = g.bbox(base);
      if (lv >= 2 && b.w <= 3 && b.h <= 3 && r.chance(0.7)) outs.push({ pts: g.applyT(scale2(base), r.int(0, 7)), kind: 'scale' });
      for (let t = 0; t < 12 && outs.length < 3; t++) {
        const q = g.nudge(r, g.applyT(base, r.int(0, 7)));
        if (q && !outs.some((o) => g.canon(o.pts) === g.canon(q))) outs.push({ pts: q, kind: 'nudge' });
      }
      if (outs.length < 3) return null;
      const all = [{ pts: right, kind: 'right' }, ...outs];
      const G = Math.max(...all.map((o) => Math.max(g.bbox(o.pts).w, g.bbox(o.pts).h))) + 2;
      const opt = (o) => ({ type: 'geo', grid: { w: G, h: G }, polys: [{ pts: g.shift(o.pts, 1, 1), cls: 'shape-b' }], scale: 16, pad: 0.2 });
      const msg = {
        scale: { cause: 'concept', msg: '모양은 같지만 크기가 달라요. 합동은 모양과 크기가 모두 같아야 해요.' },
        nudge: { cause: 'condition', msg: '비슷해 보이지만 한 꼭짓점의 위치가 달라서 포개면 완전히 겹치지 않아요. 변의 길이를 모눈 칸으로 세어 비교해 봐요.' },
      };
      return {
        text: '주어진 도형과 서로 합동인 도형을 고르세요.',
        figure: { type: 'geo', grid: { w: b.w + 2, h: b.h + 2 }, polys: [{ pts: g.shift(base, 1, 1), cls: 'shape-a' }], scale: 26, pad: 0.2, title: '주어진 도형' },
        answer: { type: 'choice', options: all.map((o) => Object.assign({ figure: opt(o), key: g.canon(o.pts) + o.kind, correct: o.kind === 'right' }, o.kind === 'right' ? {} : { pattern: msg[o.kind] })) },
        hints: ['합동인 도형은 모양과 크기가 같아서 포개면 완전히 겹쳐요. 돌리거나 뒤집어 놓아도 돼요.', '보기마다 변의 길이를 모눈 칸으로 세어 주어진 도형과 비교해 봐요. 크기가 다르거나 꼭짓점 하나가 다른 도형은 빼요.', `정답은 주어진 도형을 ${g.T8NAME[k]} 도형이에요.`],
        solution: [`주어진 도형을 ${g.T8NAME[k]} 도형은 포개면 완전히 겹치므로 합동이에요.`, '나머지는 크기가 다르거나 한 꼭짓점의 위치가 달라요.'],
        key: `u3s1-pick|${bi}|${k}|${outs.map((o) => g.canon(o.pts)).sort().join('/')}`,
        data: { base },
      };
    },
    verify(p) {
      const ok = p.answer.options.map((o) => g.congruent(g.norm(o.figure.polys[0].pts), p.data.base));
      return ok.filter(Boolean).length === 1 && ok[p.answer.value];
    },
  });

  // 기준 도형과 합동인 도형 세기 (뒤집은 도형도 합동)
  const tGridCount = tpl({
    id: 'u3s1-gridcount', sub: 'u3s1', style: 'B', styleName: '모눈에서 세기', levels: [1, 4],
    build(r, lv) {
      const bi = r.int(0, g.LAT_ASYM.length - 1);
      const base = g.LAT_ASYM[bi];
      const m = r.int(1, lv <= 2 ? 3 : 4);
      const list = [];
      let flips = 0;
      for (let i = 0; i < m; i++) {
        const k = i === 0 && m >= 2 ? r.int(4, 7) : r.int(1, 7);
        if (k >= 4) flips++;
        list.push({ pts: g.applyT(base, k), ok: true, k });
      }
      for (let t = 0; t < 20 && list.length < 5; t++) {
        const q = g.nudge(r, g.applyT(base, r.int(0, 7)));
        if (q && g.bbox(q).w <= 4 && g.bbox(q).h <= 4 && !list.some((o) => !o.ok && g.canon(o.pts) === g.canon(q))) list.push({ pts: q, ok: false });
      }
      if (list.length < 5) return null;
      const shown = r.shuffle(list).map((o, i) => Object.assign(o, { name: GA[i] }));
      const fig = cellsFig([{ pts: base, cls: 'shape-b', name: '기준' }, ...shown.map((o) => ({ pts: o.pts, cls: 'shape-a', name: o.name }))], 3, 6, 20);
      const names = shown.filter((o) => o.ok).map((o) => o.name);
      return {
        text: '기준 도형과 서로 합동인 도형은 가~마 중에서 모두 몇 개인가요?',
        figure: fig,
        answer: { type: 'num', value: String(m), unit: '개' },
        patterns: flips && m - flips >= 1 ? [{ value: String(m - flips), cause: 'concept', msg: '뒤집어 놓은 도형도 포개면 완전히 겹쳐요. 돌리거나 뒤집어도 모양과 크기가 같으면 합동이에요.' }] : [],
        hints: ['도형을 돌리거나 뒤집어서 기준 도형과 포개어 본다고 생각해요.', '변의 길이를 모눈 칸으로 세어 기준 도형과 같은지 하나씩 확인해요.', `합동인 도형: ${names.join(', ')}`],
        solution: [`기준 도형과 합동인 도형은 ${names.join(', ')}로 ${m}개예요.`, '뒤집어 놓은 도형도 합동이에요.'],
        key: `u3s1-gridcount|${bi}|${shown.map((o) => g.canon(o.pts)).join('/')}`,
        data: { base, shapes: shown.map((o) => o.pts) },
      };
    },
    verify(p) { return p.data.shapes.filter((s) => g.congruent(s, p.data.base)).length === Number(p.answer.value); },
  });

  // 합동인 두 도형 찾기 (가~라 중 두 개)
  const tPair = tpl({
    id: 'u3s1-pair', sub: 'u3s1', style: 'A', styleName: '합동인 두 도형 찾기', levels: [1, 4],
    build(r, lv) {
      const bi = r.int(0, g.LAT.length - 1);
      const base = g.LAT[bi];
      const shapes = [{ pts: g.applyT(base, r.int(0, 7)), kind: 'base' }, { pts: g.applyT(base, lv === 1 ? r.pick([1, 2, 3]) : r.int(1, 7)), kind: 'base' }];
      const b = g.bbox(base);
      if (lv >= 2 && b.w <= 2 && b.h <= 2) shapes.push({ pts: g.applyT(scale2(base), r.int(0, 7)), kind: 'scale' });
      for (let t = 0; t < 12 && shapes.length < 4; t++) {
        const q = g.nudge(r, g.applyT(base, r.int(0, 7)));
        if (q && g.bbox(q).w <= 4 && g.bbox(q).h <= 4 && !shapes.some((o) => o.kind !== 'base' && g.canon(o.pts) === g.canon(q))) shapes.push({ pts: q, kind: 'nudge' });
      }
      if (shapes.length < 4 || shapes.some((s) => g.bbox(s.pts).w > 4 || g.bbox(s.pts).h > 4)) return null;
      const order = r.shuffle(shapes).map((s, i) => Object.assign(s, { name: GA[i] }));
      const pairs = [];
      for (let a = 0; a < 4; a++) for (let c = a + 1; c < 4; c++) pairs.push([order[a], order[c]]);
      const good = order.filter((s) => s.kind === 'base').map((s) => s.name);
      return {
        text: '서로 합동인 두 도형을 찾아 고르세요.',
        figure: cellsFig(order.map((s) => ({ pts: s.pts, name: s.name })), 2, 6, 22),
        answer: {
          type: 'choice', options: pairs.map(([x, y]) => {
            const ok = x.kind === 'base' && y.kind === 'base';
            const bad = [x, y].find((s) => s.kind === 'scale') ? { cause: 'concept', msg: '모양은 같지만 크기가 다른 도형이 있어요. 합동은 크기까지 같아야 해요.' } : { cause: 'condition', msg: '한 꼭짓점의 위치가 달라서 포개면 완전히 겹치지 않아요. 변의 길이를 칸으로 세어 비교해 봐요.' };
            return Object.assign({ text: `${j(x.name, '과/와')} ${y.name}`, correct: ok }, ok ? {} : { pattern: bad });
          }),
        },
        keepOrder: true,
        hints: ['돌리거나 뒤집어서 포개었을 때 완전히 겹치는 두 도형을 찾아요.', '각 도형의 변의 길이를 모눈 칸으로 세어 적어 보고, 같은 것끼리 비교해요.', `${j(good[0], '과/와')} ${good[1]}의 변의 길이가 모두 같아요.`],
        solution: [`도형 ${j(good[0], '과/와')} 도형 ${j(good[1], '은/는')} 돌리거나 뒤집으면 포개어 완전히 겹쳐요.`],
        key: `u3s1-pair|${bi}|${order.map((s) => g.canon(s.pts)).join('/')}`,
        data: { shapes: order.map((s) => s.pts) },
      };
    },
    verify(p) {
      const s = p.data.shapes;
      const cong = [];
      for (let a = 0; a < 4; a++) for (let c = a + 1; c < 4; c++) cong.push(g.congruent(s[a], s[c]));
      return cong.filter(Boolean).length === 1 && cong[p.answer.value];
    },
  });

  // 사각형에 대각선을 긋고 합동인 삼각형 세기 (16번)
  const QUADS = {
    평행사변형: [[1.6, 0], [5.4, 0], [3.8, 2.8], [0, 2.8]],
    직사각형: [[0, 0], [5, 0], [5, 3], [0, 3]],
    마름모: [[2.2, 0], [4.4, 1.6], [2.2, 3.2], [0, 1.6]],
    정사각형: [[0, 0], [3.4, 0], [3.4, 3.4], [0, 3.4]],
    등변사다리꼴: [[1.3, 0], [3.9, 0], [5.2, 3], [0, 3]],
  };
  const sideKey = (tri) => tri.map((_, i) => g.dist(tri[i], tri[(i + 1) % 3])).sort((a, b) => a - b).map((v) => v.toFixed(3)).join('|');
  function countPairs(tris) {
    let n = 0;
    for (let a = 0; a < tris.length; a++) for (let c = a + 1; c < tris.length; c++) if (sideKey(tris[a]) === sideKey(tris[c])) n++;
    return n;
  }
  function quadTris(pts, two) {
    const [A, B, C, D] = pts;
    if (!two) return { small: [], big: [[A, B, C], [C, D, A]] };
    const O = lineX(A, C, B, D);
    return { small: [[A, B, O], [B, C, O], [C, D, O], [D, A, O]], big: [[A, B, C], [C, D, A], [B, C, D], [D, A, B]] };
  }
  function lineX(p1, p2, p3, p4) {
    const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
    const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
    return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
  }
  const tCount = tpl({
    id: 'u3s1-count', sub: 'u3s1', style: 'A', styleName: '합동인 삼각형 세기', levels: [1, 4],
    build(r, lv) {
      const names = Object.keys(QUADS).filter((n) => !(n === '등변사다리꼴' && lv <= 1));
      const shape = r.pick(names);
      const two = shape === '등변사다리꼴' || (lv >= 2 && r.chance(0.8)) || lv >= 3;
      const pts = QUADS[shape];
      const tr = quadTris(pts, two);
      const small = countPairs(tr.small), big = countPairs(tr.big), ans = countPairs([...tr.small, ...tr.big]);
      const c = g.centroid(pts);
      const fig = g.merge(g.labeled(pts, LB.slice(0, 4)), { segs: two ? [{ a: pts[0], b: pts[2] }, { a: pts[1], b: pts[3] }] : [{ a: pts[0], b: pts[2] }], scale: 46 });
      if (two) fig.labels.push({ p: lineX(pts[0], pts[2], pts[1], pts[3]), t: 'ㅁ', c: [c[0], c[1] - 1] });
      const patterns = two
        ? [{ value: String(small), cause: 'condition', soft: true, msg: '대각선 두 개로 나뉜 작은 삼각형뿐 아니라, 대각선 하나로 나뉜 큰 삼각형끼리도 합동인지 찾아야 해요.' },
          { value: String(big), cause: 'condition', soft: true, msg: '큰 삼각형뿐 아니라 두 대각선이 만나 생긴 작은 삼각형 4개도 비교해야 해요.' },
          { value: String(tr.small.length + tr.big.length), cause: 'concept', soft: true, msg: '삼각형의 개수가 아니라 서로 합동인 삼각형의 쌍의 수를 세어야 해요.' }]
        : [{ value: '2', cause: 'concept', msg: '삼각형은 2개이지만, 서로 합동인 두 삼각형은 1쌍이라고 세요.' }];
      return {
        text: `${shape} ㄱㄴㄷㄹ에 ${two ? '두 대각선을 그었어요. 두 대각선이 만나는 점은 점 ㅁ이에요' : '대각선 ㄱㄷ을 그었어요'}. 그림에서 찾을 수 있는 서로 합동인 삼각형은 모두 몇 쌍인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: '쌍' },
        patterns,
        hints: [
          `${j(shape, '은/는')} ${shape === '평행사변형' ? '마주 보는 변의 길이가 같아요.' : shape === '직사각형' ? '마주 보는 변의 길이가 같고 두 대각선의 길이가 같아요.' : shape === '마름모' ? '네 변의 길이가 모두 같아요.' : shape === '정사각형' ? '네 변의 길이와 두 대각선의 길이가 모두 같아요.' : '평행하지 않은 두 변의 길이와 두 대각선의 길이가 같아요.'}`,
          two ? '작은 삼각형 4개(점 ㅁ이 꼭짓점)와 큰 삼각형 4개(대각선 하나로 나뉜 것)를 따로 나누어 세어 봐요.' : '대각선 하나로 나뉜 두 삼각형의 세 변의 길이를 비교해요.',
          two ? `작은 삼각형끼리 ${small}쌍, 큰 삼각형끼리 ${big}쌍 → 모두 ${ans}쌍` : '두 삼각형은 세 변의 길이가 같아서 1쌍이에요.',
        ],
        solution: two ? [`작은 삼각형끼리: ${small}쌍`, `큰 삼각형끼리: ${big}쌍`, `모두 ${small} + ${big} = ${ans}(쌍)`] : ['대각선으로 나뉜 두 삼각형은 서로 합동이라서 1쌍이에요.'],
        key: `u3s1-count|${shape}|${two}`,
        data: { shape, two },
      };
    },
    verify(p) { const t = quadTris(QUADS[p.data.shape], p.data.two); return countPairs([...t.small, ...t.big]) === Number(p.answer.value); },
  });

  // 합동인 삼각형을 하나로 그릴 수 있는 조건
  function triOK(o) {
    if (o.type === 'SSS') { const [a, b, c] = o.v.slice().sort((x, y) => x - y); return a + b > c; }
    if (o.type === 'SAS') return o.v[2] > 0 && o.v[2] < 180;
    if (o.type === 'ASA') return o.v[1] + o.v[2] < 180;
    return false; // AAA, SS, SSA
  }
  const tTriCond = tpl({
    id: 'u3s1-tricond', sub: 'u3s1', style: 'A', styleName: '합동인 삼각형 그리기', levels: [2, 4],
    build(r) {
      let a, b, c;
      do { a = r.int(3, 9); b = r.int(3, 9); c = r.int(3, 9); } while (!(a + b > c && a + c > b && b + c > a) || new Set([a, b, c]).size < 3);
      const B = r.int(7, 16) * 5, C = r.int(7, 15) * 5;
      if (B + C >= 160) return null;
      const A = 180 - B - C;
      const make = {
        SSS: () => ({ type: 'SSS', v: [a, b, c], text: `세 변의 길이: 변 ㄱㄴ ${a} cm, 변 ㄴㄷ ${b} cm, 변 ㄷㄱ ${c} cm` }),
        SAS: () => ({ type: 'SAS', v: [a, b, B], text: `변 ㄱㄴ ${a} cm, 변 ㄴㄷ ${b} cm, 각 ㄱㄴㄷ ${B}°` }),
        ASA: () => ({ type: 'ASA', v: [b, B, C], text: `변 ㄴㄷ ${b} cm, 각 ㄱㄴㄷ ${B}°, 각 ㄱㄷㄴ ${C}°` }),
        AAA: () => ({ type: 'AAA', v: [A, B, C], text: `각 ㄴㄱㄷ ${A}°, 각 ㄱㄴㄷ ${B}°, 각 ㄱㄷㄴ ${C}°`, msg: { cause: 'concept', msg: '세 각의 크기만 알면 모양은 같지만 크기가 다른 삼각형을 얼마든지 그릴 수 있어요.' } }),
        SS: () => ({ type: 'SS', v: [a, b], text: `변 ㄱㄴ ${a} cm, 변 ㄴㄷ ${b} cm`, msg: { cause: 'condition', msg: '두 변의 길이만 알면 그 사이의 각에 따라 여러 가지 삼각형이 돼요.' } }),
        SSA: () => ({ type: 'SSA', v: [a, b, C], text: `변 ㄱㄴ ${a} cm, 변 ㄴㄷ ${b} cm, 각 ㄱㄷㄴ ${C}°`, msg: { cause: 'condition', msg: '각 ㄱㄷㄴ은 두 변 ㄱㄴ, ㄴㄷ 사이의 각이 아니에요. 두 변과 그 사이의 각(각 ㄱㄴㄷ)을 알아야 해요.' } }),
        BADS: () => { const x = r.int(2, 4), y = r.int(3, 5); return { type: 'SSS', v: [x, y, x + y], text: `세 변의 길이: 변 ㄱㄴ ${x} cm, 변 ㄴㄷ ${y} cm, 변 ㄷㄱ ${x + y} cm`, msg: { cause: 'condition', msg: '가장 긴 변이 나머지 두 변의 길이의 합보다 길거나 같으면 삼각형이 만들어지지 않아요.' } }; },
        BADA: () => { const x = r.int(16, 21) * 5, y = 180 - x + r.int(0, 3) * 5; return { type: 'ASA', v: [b, x, y], text: `변 ㄴㄷ ${b} cm, 각 ㄱㄴㄷ ${x}°, 각 ㄱㄷㄴ ${y}°`, msg: { cause: 'condition', msg: '두 각의 합이 180°보다 크거나 같으면 삼각형이 만들어지지 않아요.' } }; },
      };
      const right = make[r.pick(['SSS', 'SAS', 'ASA'])]();
      const wrongs = r.sample(['AAA', 'SS', 'SSA', 'BADS', 'BADA'], 3).map((k) => make[k]());
      const opts = [right, ...wrongs];
      const kind = { SSS: '세 변의 길이', SAS: '두 변의 길이와 그 사이의 각', ASA: '한 변의 길이와 그 양 끝 각' }[right.type];
      return {
        text: '삼각형 ㄱㄴㄷ과 합동인 삼각형을 그리려고 해요. 다음 중 삼각형을 하나로 그릴 수 있는 것을 고르세요.',
        answer: { type: 'choice', options: opts.map((o, i) => Object.assign({ text: o.text, correct: i === 0 }, i === 0 ? {} : { pattern: o.msg })) },
        hints: ['합동인 삼각형은 ① 세 변의 길이 ② 두 변의 길이와 그 사이의 각 ③ 한 변의 길이와 그 양 끝 각 중 하나를 알면 그릴 수 있어요.', '각이 두 변 "사이"에 있는지, 세 변이나 두 각으로 정말 삼각형이 만들어지는지도 확인해요.', `정답은 "${kind}"을 아는 경우예요.`],
        solution: [`${kind}을 알면 합동인 삼각형을 하나로 그릴 수 있어요.`, '세 각만 알거나 두 변만 알면 여러 가지 삼각형이 생기고, 변이나 각의 크기가 맞지 않으면 삼각형이 만들어지지 않아요.'],
        key: `u3s1-tricond|${opts.map((o) => o.text).join('/')}`,
        data: { opts: opts.map((o) => ({ type: o.type, v: o.v })), texts: opts.map((o) => o.text) },
      };
    },
    verify(p) {
      // 그릴 수 있는 것이 정답 하나뿐인지 (보기 글자에 적힌 수가 검사한 값과 같은지도)
      const ok = p.answer.options.map((o) => {
        const d = p.data.opts[p.data.texts.indexOf(o.text)];
        const nums = (o.text.match(/\d+/g) || []).map(Number);
        return d.v.every((v) => nums.includes(v)) && triOK(d);
      });
      return ok.filter(Boolean).length === 1 && ok[p.answer.value];
    },
  });

  // 도형을 잘라 합동인 두 도형으로 나누기
  function splitPoly(pts, a, b) {
    // 직선 ab로 볼록 다각형을 두 조각으로
    const side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      const sp = side(p), sq = side(q);
      if (sp >= 0) L.push(p);
      if (sp <= 0) R.push(p);
      if ((sp > 0 && sq < 0) || (sp < 0 && sq > 0)) {
        const t = sp / (sp - sq);
        const x = [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
        L.push(x); R.push(x);
      }
    }
    return [L, R];
  }
  const tCut = tpl({
    id: 'u3s1-cut', sub: 'u3s1', style: 'A', styleName: '합동인 두 도형으로 자르기', levels: [1, 4],
    build(r, lv) {
      const kind = lv === 1 ? r.pick(['직사각형', '정사각형']) : r.pick(['직사각형', '정사각형', '평행사변형']);
      let w = r.int(2, 4) * 2, h = r.int(1, 3) * 2, s = 0;
      if (kind === '정사각형') h = w = r.int(2, 3) * 2;
      if (kind === '평행사변형') { s = r.int(1, 2); w = r.int(2, 3) * 2; h = r.int(1, 2) * 2; }
      if (kind === '직사각형' && w === h) return null;
      const pts = kind === '평행사변형' ? [[s, 0], [w + s, 0], [w, h], [0, h]] : [[0, 0], [w, 0], [w, h], [0, h]];
      const c = [(w + s) / 2, h / 2];
      // 경계 위의 모눈 점 (평행사변형은 위·아래 변만)
      const bd = [];
      for (let x = 0; x <= w + s; x++) { if (x >= s && x <= w + s) bd.push([x, 0]); if (x <= w) bd.push([x, h]); }
      if (kind !== '평행사변형') for (let y = 1; y < h; y++) bd.push([0, y], [w, y]);
      const onEdge = (p, q) => (p[1] === q[1] && (p[1] === 0 || p[1] === h)) || (kind !== '평행사변형' && p[0] === q[0] && (p[0] === 0 || p[0] === w));
      const lines = [];
      // 선분의 가운데 점이 도형 안쪽에 있어야 자르는 선 (변 위를 지나는 선은 빼기)
      const inside = (q) => pts.every((a, i) => { const b = pts[(i + 1) % 4]; return (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) > 1e-9; }) || pts.every((a, i) => { const b = pts[(i + 1) % 4]; return (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) < -1e-9; });
      for (let i = 0; i < bd.length; i++) for (let k = i + 1; k < bd.length; k++) if (!onEdge(bd[i], bd[k]) && inside([(bd[i][0] + bd[k][0]) / 2, (bd[i][1] + bd[k][1]) / 2])) lines.push([bd[i], bd[k]]);
      const through = lines.filter(([p, q]) => p[0] + q[0] === 2 * c[0] && p[1] + q[1] === 2 * c[1]);
      const off = lines.filter(([p, q]) => !(p[0] + q[0] === 2 * c[0] && p[1] + q[1] === 2 * c[1]));
      if (!through.length || off.length < 3) return null;
      const right = r.pick(through);
      const wrongs = r.sample(off, 3);
      const all = [right, ...wrongs];
      const opt = (ln) => ({ type: 'geo', polys: [{ pts, cls: 'shape-a' }], segs: [{ a: ln[0], b: ln[1], cls: 'axis' }], scale: 22, pad: 0.3 });
      return {
        text: `${j(kind, '을/를')} 빨간 선을 따라 잘라서 서로 합동인 두 도형으로 나누려고 해요. 알맞게 자른 것을 고르세요.`,
        answer: { type: 'choice', options: all.map((ln, i) => Object.assign({ figure: opt(ln), key: ln.join(';'), correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'concept', msg: '잘린 두 조각의 크기가 달라요. 포개었을 때 완전히 겹치려면 두 조각의 모양과 크기가 같아야 해요.' } })) },
        hints: ['잘린 두 조각을 포개었을 때 완전히 겹쳐야 해요.', '두 조각의 넓이부터 비교해 봐요. 넓이가 다르면 합동이 아니에요.', `도형의 한가운데를 지나는 선으로 자르면 두 조각이 합동이 돼요.`],
        solution: ['도형의 한가운데를 지나도록 자르면 한 조각을 180° 돌렸을 때 다른 조각과 완전히 겹쳐요.', '나머지는 두 조각의 크기가 달라요.'],
        key: `u3s1-cut|${kind}|${w}|${h}|${s}|${all.map((l) => l.join(';')).join('/')}`,
        data: { pts },
      };
    },
    verify(p) {
      const ok = p.answer.options.map((o) => {
        const [A, B] = splitPoly(p.data.pts, o.figure.segs[0].a, o.figure.segs[0].b);
        return Math.abs(g.area(A) - g.area(B)) < 1e-9 && Math.abs(g.perim(A) - g.perim(B)) < 1e-9;
      });
      return ok.filter(Boolean).length === 1 && ok[p.answer.value];
    },
  });

  // 합동이 아닌 까닭
  const RECT_AREA = [[1, 6, 2, 3], [1, 8, 2, 4], [2, 6, 3, 4], [1, 4, 2, 2], [1, 9, 3, 3], [2, 8, 4, 4], [1, 6, 3, 2]];
  const RECT_PER = [[1, 5, 2, 4], [2, 6, 3, 5], [1, 7, 4, 4], [2, 5, 3, 4], [1, 6, 2, 5], [1, 4, 2, 3], [2, 7, 4, 5]];
  const rectPts = (a, b) => [[0, 0], [a, 0], [a, b], [0, b]];
  const tWhy = tpl({
    id: 'u3s1-why', sub: 'u3s1', style: 'B', styleName: '합동이 아닌 까닭', levels: [1, 4],
    build(r) {
      const kind = r.pick(['scale', 'area', 'perim']);
      let A, B, key;
      if (kind === 'scale') {
        const small = g.LAT.filter((s) => g.bbox(s).w <= 3 && g.bbox(s).h <= 3);
        const bi = r.int(0, small.length - 1);
        A = g.applyT(small[bi], r.int(0, 7)); B = g.applyT(scale2(small[bi]), r.int(0, 7));
        if (r.chance(0.5)) [A, B] = [B, A];
        key = `${bi}|${g.canon(A)}|${g.canon(B)}`;
      } else {
        const [a, b, c, d] = r.pick(kind === 'area' ? RECT_AREA : RECT_PER);
        A = r.chance(0.5) ? rectPts(a, b) : rectPts(b, a);
        B = r.chance(0.5) ? rectPts(c, d) : rectPts(d, c);
        key = `${a}${b}${c}${d}|${g.bbox(A).w}|${g.bbox(B).w}`;
      }
      const ba = g.bbox(A), bb = g.bbox(B);
      const H = Math.max(ba.h, bb.h) + 2;
      const fig = { type: 'geo', grid: { w: ba.w + bb.w + 4, h: H + 1 }, polys: [{ pts: g.shift(A, 1, 2), cls: 'shape-a' }, { pts: g.shift(B, ba.w + 3, 2), cls: 'shape-b' }], texts: [{ p: [1.4, 0.8], t: '가' }, { p: [ba.w + 3.4, 0.8], t: '나' }], scale: 22, pad: 0.3 };
      const TX = {
        scale: '모양은 같지만 크기가 달라서 포개었을 때 완전히 겹치지 않아요.',
        area: '넓이는 같지만 모양이 달라서 포개었을 때 완전히 겹치지 않아요.',
        perim: '둘레는 같지만 모양이 달라서 포개었을 때 완전히 겹치지 않아요.',
        turn: '한 도형을 돌려 놓았기 때문에 합동이 아니에요.',
      };
      const aA = g.area(A), aB = g.area(B), pA = g.perim(A), pB = g.perim(B);
      const why = {
        scale: { cause: 'concept', msg: kind === 'scale' ? '' : `두 도형은 모양이 달라요. 가로와 세로의 길이를 칸으로 세어 봐요.` },
        area: { cause: 'concept', msg: `두 도형의 넓이는 ${aA}칸과 ${aB}칸으로 달라요.` },
        perim: { cause: 'concept', msg: `두 도형의 둘레는 ${pA}칸과 ${pB}칸으로 달라요.` },
        turn: { cause: 'concept', msg: '돌리거나 뒤집어도 포개어 완전히 겹치면 합동이에요. 돌려 놓은 것은 까닭이 아니에요.' },
      };
      const keys = ['scale', 'area', 'perim', 'turn'];
      return {
        text: '두 도형 가와 나는 서로 합동이 아니에요. 그 까닭으로 알맞은 것을 고르세요.',
        figure: fig,
        answer: { type: 'choice', options: keys.map((k) => Object.assign({ text: TX[k], correct: k === kind }, k === kind ? {} : { pattern: why[k] })) },
        keepOrder: true,
        hints: ['합동은 모양과 크기가 모두 같아야 해요.', `두 도형의 넓이(칸 수)와 둘레(칸 수)를 각각 세어 봐요. 가: 넓이 ${aA}칸, 둘레 ${pA}칸`, `나: 넓이 ${aB}칸, 둘레 ${pB}칸 → ${TX[kind]}`],
        solution: [`가: 넓이 ${aA}칸, 둘레 ${pA}칸 / 나: 넓이 ${aB}칸, 둘레 ${pB}칸`, TX[kind]],
        key: `u3s1-why|${kind}|${key}`,
        data: { A, B, kind },
      };
    },
    verify(p) {
      const { A, B, kind } = p.data;
      if (g.congruent(A, B)) return false;
      const aA = g.area(A), aB = g.area(B), pA = g.perim(A), pB = g.perim(B);
      if (kind === 'scale') { const [sm, lg] = aA < aB ? [A, B] : [B, A]; return Math.abs(g.area(lg) / g.area(sm) - 4) < 1e-9 && g.congruent(scale2(sm), lg); }
      if (kind === 'area') return aA === aB && pA !== pB;
      return pA === pB && aA !== aB;
    },
  });

  const OX1 = [
    { s: '넓이가 같은 두 직사각형은 항상 서로 합동이에요.', t: false, why: '가로 2 cm·세로 6 cm와 가로 3 cm·세로 4 cm처럼 넓이가 같아도 모양이 다르면 합동이 아니에요.', wrong: ['넓이가 같으면 포개었을 때 항상 겹치니까요.', '직사각형은 네 각이 모두 직각이라서 언제나 합동이니까요.'] },
    { s: '한 변의 길이가 같은 두 정사각형은 서로 합동이에요.', t: true, why: '정사각형은 네 변의 길이가 모두 같고 네 각이 모두 직각이라서, 한 변이 같으면 모양과 크기가 같아요.', wrong: ['정사각형은 크기와 상관없이 모두 합동이니까요.', '네 각이 직각인 도형은 모두 합동이니까요.'] },
    { s: '뒤집어 놓은 도형은 처음 도형과 합동이 아니에요.', t: false, why: '뒤집어도 모양과 크기는 그대로라서 포개면 완전히 겹쳐요.', wrong: ['뒤집으면 꼭짓점의 순서가 바뀌니까요.', '뒤집으면 모양이 달라지니까요.'] },
    { s: '둘레가 같은 두 정삼각형은 서로 합동이에요.', t: true, why: '둘레가 같으면 한 변의 길이가 같고, 정삼각형은 세 각이 모두 60°라서 모양과 크기가 같아요.', wrong: ['둘레가 같은 도형은 모두 합동이니까요.', '삼각형은 모두 세 각의 합이 180°로 같으니까요.'] },
    { s: '세 각의 크기가 각각 같은 두 삼각형은 항상 합동이에요.', t: false, why: '세 각이 같아도 크기가 다른 삼각형이 있어요. 모양만 같고 크기는 다를 수 있어요.', wrong: ['세 각이 같으면 세 변도 항상 같으니까요.', '삼각형은 각만 같으면 포개어 겹치니까요.'] },
    { s: '모양과 크기가 같은 두 도형은 서로 합동이에요.', t: true, why: '모양과 크기가 같으면 포개었을 때 완전히 겹쳐서 합동이에요.', wrong: ['모양만 같아도 합동이니까요.', '색깔이 같으면 합동이니까요.'] },
  ];
  const OX2 = [
    { s: '합동인 두 사각형은 넓이는 같지만 둘레는 다를 수 있어요.', t: false, why: '합동이면 대응변의 길이가 모두 같아서 둘레도 같아요.', wrong: ['포개는 방향에 따라 둘레가 달라지니까요.', '넓이만 같으면 합동이니까요.'] },
    { s: '합동인 두 도형에서 대응각의 크기는 서로 같아요.', t: true, why: '포개었을 때 겹치는 각이라서 크기가 같아요.', wrong: ['대응각은 서로 마주 보는 각이라서 같아요.', '도형의 모든 각은 크기가 같아서요.'] },
    { s: '두 도형의 대응점은 이름이 같은 순서에 있는 점이에요.', t: false, why: '이름 순서와 상관없이 포개었을 때 겹치는 점이 대응점이에요.', wrong: ['점의 이름은 항상 같은 순서로 붙이니까요.', '왼쪽 위에 있는 점끼리 대응점이니까요.'] },
    { s: '합동인 두 삼각형에는 대응변이 3쌍 있어요.', t: true, why: '삼각형은 변이 3개라서 포개면 겹치는 변이 3쌍이에요.', wrong: ['대응변은 항상 1쌍뿐이니까요.', '삼각형의 대응변은 6쌍이니까요.'] },
    { s: '합동인 두 도형에서 대응변의 길이는 서로 같아요.', t: true, why: '포개었을 때 완전히 겹치는 변이라서 길이가 같아요.', wrong: ['대응변은 평행한 변이라서 같아요.', '도형의 모든 변은 길이가 같아서요.'] },
  ];
  const tOX = (sub, list) => TB.oxWhy({
    id: sub + '-oxwhy', unit: 3, sub, levels: [1, 4],
    gen(r) { const i = r.int(0, list.length - 1); const q = list[i]; return { statement: q.s, truth: q.t, why: q.why, wrong: r.shuffle(q.wrong), key: i }; },
  });

  // ======================================================================
  // 소단원 2: 합동인 도형의 성질
  // ======================================================================
  // 합동인 두 도형 만들기: 왼쪽(가) ㄱㄴㄷ(ㄹ), 오른쪽(나)은 돌리거나 뒤집은 것
  //   B[i]는 A[i]의 대응점, 오른쪽 점의 이름은 nameB[i]
  function makeTri(r) {
    for (let t = 0; t < 60; t++) {
      const A = r.int(7, 21) * 5, B = r.int(7, 21) * 5, C = 180 - A - B;
      const angs = [A, B, C];
      if (C < 35 || C > 110 || Math.min(Math.abs(A - B), Math.abs(B - C), Math.abs(A - C)) < 10) continue;
      const L = 4, c = (L * Math.sin(g.rad(C))) / Math.sin(g.rad(A));
      let pts = [[c * Math.cos(g.rad(B)), -c * Math.sin(g.rad(B))], [0, 0], [L, 0]];
      pts = rotateAll(pts, r.int(-2, 2) * 12);
      return { pts: g.norm(pts), angs };
    }
    return null;
  }
  function makeQuad(r) {
    for (let t = 0; t < 80; t++) {
      const rx = 2.3 * (0.85 + r.int(0, 6) * 0.05), ry = 1.6 * (0.85 + r.int(0, 6) * 0.05);
      const pts = [0, 1, 2, 3].map((i) => { const th = g.rad(225 + i * 90 + r.int(-24, 24)); return [rx * Math.cos(th), ry * Math.sin(th)]; });
      const real = pts.map((_, i) => g.angleAt(pts, i));
      if (real.some((a) => a < 60 || a > 135)) continue;
      const angs = real.slice(0, 3).map(g.r5);
      angs.push(360 - sum(angs));
      if (angs.some((a, i) => Math.abs(a - real[i]) > 6 || a < 55 || a > 140)) continue;
      let dup = false;
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) if (Math.abs(angs[a] - angs[b]) < 10) dup = true;
      if (dup) continue;
      return { pts: g.norm(pts), angs };
    }
    return null;
  }
  function rotateAll(pts, d) {
    const c = g.centroid(pts), t = g.rad(d);
    return pts.map(([x, y]) => [c[0] + (x - c[0]) * Math.cos(t) - (y - c[1]) * Math.sin(t), c[1] + (x - c[0]) * Math.sin(t) + (y - c[1]) * Math.cos(t)]);
  }
  const XF = {
    rot180: { f: ([x, y]) => [-x, -y], name: '180° 돌린' },
    flipH: { f: ([x, y]) => [-x, y], name: '왼쪽과 오른쪽을 뒤집은' },
    flipV: { f: ([x, y]) => [x, -y], name: '위와 아래를 뒤집은' },
    rot90: { f: ([x, y]) => [-y, x], name: '90° 돌린' },
  };
  function makePair(r, n, lv) {
    const base = n === 3 ? makeTri(r) : makeQuad(r);
    if (!base) return null;
    const A = base.pts;
    const xf = lv === 1 ? r.pick(['rot180', 'flipH']) : r.pick(Object.keys(XF));
    const c = g.centroid(A);
    let B = A.map(([x, y]) => XF[xf].f([x - c[0], y - c[1]]));
    const ba = g.bbox(A), bb = g.bbox(B);
    B = g.shift(B, ba.x1 + 1.8 - bb.x0, (ba.y0 + ba.y1) / 2 - (bb.y0 + bb.y1) / 2);
    let dir, off;
    do { dir = r.pick([1, -1]); off = r.int(0, n - 1); } while (dir === 1 && off === 0);
    const nameA = LB.slice(0, n);
    const nameB = A.map((_, i) => LB[n + mod(dir * i + off, n)]);
    // 변의 길이 (cm): 가장 짧은 변이 3~6 cm쯤 되게
    const real = A.map((_, i) => g.dist(A[i], A[(i + 1) % n]));
    const k = r.int(3, 6) / Math.min(...real);
    const lens = real.map((v) => Math.max(2, Math.round(v * k)));
    if (new Set(lens).size < n) return null;
    return { n, A, B, nameA, nameB, angs: base.angs, lens, xf };
  }
  const sideA = (P, i) => P.nameA[i] + P.nameA[(i + 1) % P.n];
  const sideB = (P, i) => P.nameB[i] + P.nameB[(i + 1) % P.n];
  const angA = (P, i) => P.nameA[mod(i - 1, P.n)] + P.nameA[i] + P.nameA[(i + 1) % P.n];
  const angB = (P, i) => P.nameB[mod(i - 1, P.n)] + P.nameB[i] + P.nameB[(i + 1) % P.n];
  const polyName = (P, which) => (P.n === 3 ? '삼각형 ' : '사각형 ') + (which === 'A' ? P.nameA : P.nameB).join('');
  // 그림: 두 도형과 꼭짓점 이름, 그리고 표시할 길이·각
  function pairFig(P, { sidesA = [], sidesB = [], angsA = [], angsB = [] } = {}) {
    const f = g.merge(g.labeled(P.A, P.nameA, 'shape-a'), g.labeled(P.B, P.nameB, 'shape-b'), { scale: 52 });
    const cA = g.centroid(P.A), cB = g.centroid(P.B);
    f.sides = [
      ...sidesA.map(([i, t]) => ({ a: P.A[i], b: P.A[(i + 1) % P.n], t, c: cA })),
      ...sidesB.map(([i, t]) => ({ a: P.B[i], b: P.B[(i + 1) % P.n], t, c: cB })),
    ];
    f.angles = [
      ...angsA.map(([i, t]) => ({ v: P.A[i], a: P.A[mod(i - 1, P.n)], b: P.A[(i + 1) % P.n], t })),
      ...angsB.map(([i, t]) => ({ v: P.B[i], a: P.B[mod(i - 1, P.n)], b: P.B[(i + 1) % P.n], t })),
    ];
    return f;
  }
  // 두 도형이 정말 합동이고 B[i]가 A[i]의 대응점인지
  function pairOK(d) {
    const n = d.A.length;
    for (let i = 0; i < n; i++) {
      if (Math.abs(g.dist(d.A[i], d.A[(i + 1) % n]) - g.dist(d.B[i], d.B[(i + 1) % n])) > 1e-6) return false;
      if (Math.abs(g.angleAt(d.A, i) - g.angleAt(d.B, i)) > 1e-6) return false;
    }
    return true;
  }
  const pairData = (P) => ({ A: P.A, B: P.B, nameA: P.nameA, nameB: P.nameB, angs: P.angs, lens: P.lens });
  const xfHint = (P) => `오른쪽 도형은 왼쪽 도형을 ${XF[P.xf].name} 모양이에요. 머릿속으로 돌리거나 뒤집어 포개어 봐요.`;
  const corrList = (P) => P.nameA.map((a, i) => `점 ${a} ↔ 점 ${P.nameB[i]}`).join(', ');

  const tCorr = tpl({
    id: 'u3s2-corr', sub: 'u3s2', style: 'A', styleName: '대응점·대응변·대응각', levels: [1, 4],
    build(r, lv) {
      const P = makePair(r, lv <= 2 ? 3 : r.pick([3, 4]), lv);
      if (!P) return null;
      const what = r.pick(['point', 'side', 'angle']);
      const i = r.int(0, P.n - 1);
      const fromB = r.chance(0.4);
      const mk = {
        point: (k) => (fromB ? pt(P.nameA[k]) : pt(P.nameB[k])),
        side: (k) => (fromB ? `변 ${sideA(P, k)}` : `변 ${sideB(P, k)}`),
        angle: (k) => (fromB ? `각 ${angA(P, k)}` : `각 ${angB(P, k)}`),
      }[what];
      const ask = { point: fromB ? pt(P.nameB[i]) : pt(P.nameA[i]), side: fromB ? `변 ${sideB(P, i)}` : `변 ${sideA(P, i)}`, angle: fromB ? `각 ${angB(P, i)}` : `각 ${angA(P, i)}` }[what];
      const word = { point: '대응점', side: '대응변', angle: '대응각' }[what];
      const opts = Array.from({ length: P.n }, (_, k) => Object.assign({ text: mk(k), correct: k === i }, k === i ? {} : { pattern: { cause: 'concept', msg: `포개었을 때 ${j(ask, '과/와')} 겹치는 ${j(what === 'point' ? '점' : what === 'side' ? '변' : '각', '을/를')} 찾아요. ${corrList(P)}이에요.` } }));
      return {
        text: `두 도형은 서로 합동이에요. ${ask}의 ${j(word, '을/를')} 고르세요.`,
        figure: pairFig(P),
        answer: { type: 'choice', options: opts },
        hints: [xfHint(P), what === 'point' ? '모양이 특별한 꼭짓점(가장 뾰족한 곳, 가장 넓은 곳)부터 짝을 지어 봐요.' : `먼저 ${ask}의 꼭짓점마다 대응점을 찾아요.`, `${corrList(P)} → ${word}: ${mk(i)}`],
        solution: [corrList(P), `${ask}의 ${word}: ${mk(i)}`],
        key: `u3s2-corr|${P.angs.join(',')}|${P.xf}|${P.nameB.join('')}|${what}|${i}|${fromB}`,
        data: Object.assign(pairData(P), { what, i, fromB }),
      };
    },
    verify(p) {
      const d = p.data;
      if (!pairOK(d)) return false;
      const n = d.A.length, i = d.i, N = d.fromB ? d.nameA : d.nameB;
      const want = { point: pt(N[i]), side: `변 ${N[i]}${N[(i + 1) % n]}`, angle: `각 ${N[mod(i - 1, n)]}${N[i]}${N[(i + 1) % n]}` }[d.what];
      return p.answer.options[p.answer.value].text === want;
    },
  });

  const tSide = tpl({
    id: 'u3s2-side', sub: 'u3s2', style: 'A', styleName: '대응변의 길이', levels: [1, 4],
    build(r, lv) {
      const P = makePair(r, lv <= 2 ? 3 : 4, lv);
      if (!P) return null;
      const i = r.int(0, P.n - 1);
      return {
        text: `두 도형은 서로 합동이에요. 변 ${sideB(P, i)}의 길이는 몇 cm인가요?`,
        figure: pairFig(P, { sidesA: P.lens.map((v, k) => [k, cm(v)]) }),
        answer: { type: 'num', value: String(P.lens[i]), unit: 'cm' },
        patterns: P.lens.map((v, k) => ({ value: String(v), cause: 'concept', msg: `변 ${sideB(P, i)}의 대응변은 변 ${j(sideA(P, k), '이/가')} 아니라 변 ${sideA(P, i)}이에요. 포개었을 때 겹치는 변을 찾아요.` })).filter((_, k) => k !== i),
        hints: [xfHint(P), `변 ${sideB(P, i)}의 양 끝 점 ${P.nameB[i]}, ${P.nameB[(i + 1) % P.n]}의 대응점을 찾아요.`, `점 ${P.nameB[i]} ↔ 점 ${P.nameA[i]}, 점 ${P.nameB[(i + 1) % P.n]} ↔ 점 ${P.nameA[(i + 1) % P.n]} → 대응변은 변 ${sideA(P, i)} (${cm(P.lens[i])})`],
        solution: [`변 ${sideB(P, i)}의 대응변은 변 ${sideA(P, i)}이에요.`, `합동인 도형에서 대응변의 길이는 같으므로 ${cm(P.lens[i])}예요.`],
        key: `u3s2-side|${P.angs.join(',')}|${P.lens.join(',')}|${P.xf}|${P.nameB.join('')}|${i}`,
        data: Object.assign(pairData(P), { i }),
      };
    },
    verify(p) { return pairOK(p.data) && Number(p.answer.value) === p.data.lens[p.data.i]; },
  });

  const tAngle = tpl({
    id: 'u3s2-angle', sub: 'u3s2', style: 'A', styleName: '대응각의 크기', levels: [1, 4],
    build(r, lv) {
      const P = makePair(r, lv <= 2 ? 3 : 4, lv);
      if (!P) return null;
      const i = r.int(0, P.n - 1);
      const shownIdx = Array.from({ length: P.n }, (_, k) => k).filter((k) => k === i || r.chance(0.7));
      return {
        text: `두 도형은 서로 합동이에요. 각 ${angB(P, i)}의 크기는 몇 도인가요?`,
        figure: pairFig(P, { angsA: shownIdx.map((k) => [k, dg(P.angs[k])]) }),
        answer: { type: 'num', value: String(P.angs[i]), unit: '°' },
        patterns: shownIdx.filter((k) => k !== i).map((k) => ({ value: String(P.angs[k]), cause: 'concept', msg: `각 ${angB(P, i)}의 대응각은 각 ${angA(P, i)}이에요. 포개었을 때 겹치는 각을 찾아요.` })),
        hints: [xfHint(P), `꼭짓점 ${P.nameB[i]}의 대응점을 먼저 찾아요.`, `점 ${P.nameB[i]} ↔ 점 ${P.nameA[i]} → 각 ${angB(P, i)}의 대응각은 각 ${angA(P, i)} (${dg(P.angs[i])})`],
        solution: [`각 ${angB(P, i)}의 대응각은 각 ${angA(P, i)}이에요.`, `대응각의 크기는 같으므로 ${dg(P.angs[i])}예요.`],
        key: `u3s2-angle|${P.angs.join(',')}|${P.xf}|${P.nameB.join('')}|${i}|${shownIdx.join('')}`,
        data: Object.assign(pairData(P), { i }),
      };
    },
    verify(p) { return pairOK(p.data) && Number(p.answer.value) === p.data.angs[p.data.i]; },
  });

  // 18번: 대응각 + 삼각형 세 각의 합
  const tTri180 = tpl({
    id: 'u3s2-tri180', sub: 'u3s2', style: 'A', styleName: '대응각으로 각도 구하기', levels: [1, 4], weak: ['concept'],
    build(r, lv) {
      const P = makePair(r, 3, lv);
      if (!P) return null;
      const [a, b, k] = r.shuffle([0, 1, 2]);
      const askB = r.chance(0.6);
      const x = P.angs[a], y = P.angs[b], ans = P.angs[k];
      const askName = askB ? angB(P, k) : angA(P, k);
      const fig = pairFig(P, { angsA: [[a, dg(x)]].concat(askB ? [] : [[k, '?']]), angsB: [[b, dg(y)]].concat(askB ? [[k, '?']] : []) });
      const pats = [
        { value: String(180 - x), cause: 'condition', msg: `대응각을 이용하면 각 ${angA(P, b)}도 ${dg(y)}예요. 두 각을 모두 빼야 해요.` },
        { value: String(180 - y), cause: 'condition', msg: `각 ${angA(P, a)}(${dg(x)})도 빼야 해요.` },
        { value: String(x + y), cause: 'concept', msg: '삼각형의 세 각의 합은 180°예요. 180°에서 두 각을 빼요.' },
        { value: String(360 - x - y), cause: 'concept', msg: '삼각형의 세 각의 합은 360°가 아니라 180°예요.' },
      ];
      return {
        text: `${polyName(P, 'A')}과 삼각형 ${P.nameB.join('')}은 서로 합동이에요. 각 ${askName}의 크기는 몇 도인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: '°' },
        patterns: pats,
        hints: [`삼각형 ${P.nameA.join('')}과 삼각형 ${P.nameB.join('')}에서 차례대로 같은 자리의 글자가 대응점이에요.`, `각 ${angB(P, b)}의 대응각은 각 ${angA(P, b)}이라서 각 ${angA(P, b)}도 ${dg(y)}예요.`, `삼각형의 세 각의 합은 180° → 180° - ${dg(x)} - ${dg(y)} = ${dg(ans)}`],
        solution: [`각 ${angA(P, b)} = 각 ${angB(P, b)} = ${dg(y)} (대응각)`, `각 ${angA(P, k)} = 180° - ${dg(x)} - ${dg(y)} = ${dg(ans)}`, askB ? `각 ${angB(P, k)} = 각 ${angA(P, k)} = ${dg(ans)}` : `따라서 ${dg(ans)}예요.`],
        key: `u3s2-tri180|${P.angs.join(',')}|${P.xf}|${P.nameB.join('')}|${a}${b}${k}|${askB}`,
        data: Object.assign(pairData(P), { x, y }),
      };
    },
    verify(p) { return pairOK(p.data) && p.data.x + p.data.y + Number(p.answer.value) === 180; },
  });

  // 대응각 + 사각형 네 각의 합
  const tQuad360 = tpl({
    id: 'u3s2-quad360', sub: 'u3s2', style: 'A', styleName: '대응각으로 각도 구하기', levels: [2, 4], weak: ['concept'],
    build(r, lv) {
      const P = makePair(r, 4, lv);
      if (!P) return null;
      const [a, b, c, k] = r.shuffle([0, 1, 2, 3]);
      const [x, y, z] = [P.angs[a], P.angs[b], P.angs[c]];
      const ans = P.angs[k];
      const askB = r.chance(0.5);
      const askName = askB ? angB(P, k) : angA(P, k);
      const fig = pairFig(P, { angsA: [[a, dg(x)], [b, dg(y)]].concat(askB ? [] : [[k, '?']]), angsB: [[c, dg(z)]].concat(askB ? [[k, '?']] : []) });
      const pats = [
        { value: String(360 - x - y), cause: 'condition', msg: `대응각을 이용하면 각 ${angA(P, c)}도 ${dg(z)}예요. 알 수 있는 세 각을 모두 빼야 해요.` },
        { value: String(Math.abs(x + y + z - 180)), cause: 'concept', msg: '사각형의 네 각의 합은 180°가 아니라 360°예요.' },
      ].filter((pt) => Number(pt.value) > 0);
      return {
        text: `${polyName(P, 'A')}과 사각형 ${P.nameB.join('')}은 서로 합동이에요. 각 ${askName}의 크기는 몇 도인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: '°' },
        patterns: pats,
        hints: [`사각형 ${P.nameA.join('')}과 사각형 ${P.nameB.join('')}에서 차례대로 같은 자리의 글자가 대응점이에요.`, `각 ${angB(P, c)}의 대응각은 각 ${angA(P, c)}이라서 ${dg(z)}예요.`, `사각형의 네 각의 합은 360° → 360° - ${dg(x)} - ${dg(y)} - ${dg(z)} = ${dg(ans)}`],
        solution: [`각 ${angA(P, c)} = 각 ${angB(P, c)} = ${dg(z)} (대응각)`, `360° - ${dg(x)} - ${dg(y)} - ${dg(z)} = ${dg(ans)}`],
        key: `u3s2-quad360|${P.angs.join(',')}|${P.xf}|${P.nameB.join('')}|${a}${b}${c}${k}|${askB}`,
        data: Object.assign(pairData(P), { x, y, z }),
      };
    },
    verify(p) { return pairOK(p.data) && p.data.x + p.data.y + p.data.z + Number(p.answer.value) === 360; },
  });

  // 합동인 도형의 둘레: 변의 길이가 두 도형에 나뉘어 적혀 있다
  const tPerim = tpl({
    id: 'u3s2-perim', sub: 'u3s2', style: 'A', styleName: '합동인 도형의 둘레', levels: [1, 4],
    build(r, lv) {
      const P = makePair(r, lv === 1 ? 3 : 4, lv);
      if (!P) return null;
      const idx = r.shuffle(Array.from({ length: P.n }, (_, k) => k));
      const cut = r.int(1, P.n - 1);
      const onA = idx.slice(0, cut), onB = idx.slice(cut);
      const total = sum(P.lens);
      const askB = r.chance(0.5);
      const shownAsk = sum((askB ? onB : onA).map((k) => P.lens[k]));
      return {
        text: `두 도형은 서로 합동이에요. ${askB ? `${P.n === 3 ? '삼각형' : '사각형'} ${P.nameB.join('')}` : polyName(P, 'A')}의 둘레는 몇 cm인가요?`,
        figure: pairFig(P, { sidesA: onA.map((k) => [k, cm(P.lens[k])]), sidesB: onB.map((k) => [k, cm(P.lens[k])]) }),
        answer: { type: 'num', value: String(total), unit: 'cm' },
        patterns: [{ value: String(shownAsk), cause: 'condition', msg: '이 도형에 적힌 길이만 더하면 안 돼요. 다른 도형에 적힌 대응변의 길이도 이용해요.' }],
        hints: ['합동인 두 도형은 대응변의 길이가 같아서 둘레도 같아요.', '두 도형에 나뉘어 적힌 길이를 대응변끼리 짝지어 모든 변의 길이를 알아내요.', `${P.lens.join(' + ')} = ${total}`],
        solution: [P.lens.map((v, k) => `변 ${sideA(P, k)} = 변 ${sideB(P, k)} = ${cm(v)}`).join(', '), `둘레: ${P.lens.join(' + ')} = ${total}(cm)`],
        key: `u3s2-perim|${P.angs.join(',')}|${P.lens.join(',')}|${P.xf}|${P.nameB.join('')}|${onA.join('')}|${askB}`,
        data: Object.assign(pairData(P), {}),
      };
    },
    verify(p) { return pairOK(p.data) && sum(p.data.lens) === Number(p.answer.value); },
  });

  // 10번: 잘못 설명한 것
  const tWrong = tpl({
    id: 'u3s2-wrong', sub: 'u3s2', style: 'A', styleName: '잘못 설명한 것 찾기', levels: [2, 4],
    build(r, lv) {
      const P = makePair(r, lv === 2 ? 3 : 4, lv);
      if (!P) return null;
      const n = P.n;
      const [i1, i2, i3, i4] = [r.int(0, n - 1), r.int(0, n - 1), r.int(0, n - 1), r.int(0, n - 1)];
      const other = (i) => mod(i + r.int(1, n - 1), n);
      const st = [
        { ok: `점 ${P.nameA[i1]}의 대응점은 ${j(pt(P.nameB[i1]), '이에요/예요')}.`, bad: () => `점 ${P.nameA[i1]}의 대응점은 ${j(pt(P.nameB[other(i1)]), '이에요/예요')}.`, why: `점 ${P.nameA[i1]}의 대응점은 점 ${P.nameB[i1]}이에요.` },
        { ok: `변 ${sideB(P, i2)}의 길이는 ${j(cm(P.lens[i2]), '이에요/예요')}.`, bad: () => `변 ${sideB(P, i2)}의 길이는 ${j(cm(P.lens[other(i2)]), '이에요/예요')}.`, why: `변 ${sideB(P, i2)}의 대응변은 변 ${sideA(P, i2)}이라서 ${cm(P.lens[i2])}예요.` },
        { ok: `각 ${angB(P, i3)}의 크기는 ${j(dg(P.angs[i3]), '이에요/예요')}.`, bad: () => `각 ${angB(P, i3)}의 크기는 ${j(dg(P.angs[other(i3)]), '이에요/예요')}.`, why: `각 ${angB(P, i3)}의 대응각은 각 ${angA(P, i3)}이라서 ${dg(P.angs[i3])}예요.` },
        { ok: `변 ${sideA(P, i4)}의 대응변은 변 ${j(sideB(P, i4), '이에요/예요')}.`, bad: () => `변 ${sideA(P, i4)}의 대응변은 변 ${j(sideB(P, other(i4)), '이에요/예요')}.`, why: `변 ${sideA(P, i4)}의 대응변은 변 ${sideB(P, i4)}이에요.` },
      ];
      const badK = r.int(0, 3);
      const texts = st.map((s, k) => `${CIRC[k]} ${k === badK ? s.bad() : s.ok}`);
      if (new Set(texts).size < 4) return null;
      return {
        text: '두 도형은 서로 합동이에요. 잘못 설명한 것을 고르세요.',
        figure: pairFig(P, { sidesA: P.lens.map((v, k) => [k, cm(v)]), angsA: P.angs.map((v, k) => [k, dg(v)]) }),
        answer: { type: 'choice', options: texts.map((t, k) => Object.assign({ text: t, correct: k === badK }, k === badK ? {} : { pattern: { cause: 'concept', msg: `이 설명은 맞아요. ${st[k].why}` } })) },
        keepOrder: true,
        hints: [xfHint(P), `대응점부터 모두 찾아 두면 편해요. ${corrList(P)}`, `${CIRC[badK]}을 확인해요. ${st[badK].why}`],
        solution: [`${CIRC[badK]}이 잘못됐어요. ${st[badK].why}`],
        key: `u3s2-wrong|${P.angs.join(',')}|${P.lens.join(',')}|${P.xf}|${P.nameB.join('')}|${texts.join('/')}`,
        data: Object.assign(pairData(P), { badK, texts, ok: st.map((s) => s.ok) }),
      };
    },
    verify(p) {
      const d = p.data;
      if (!pairOK(d)) return false;
      // 정답 보기만 바른 설명과 다르다
      return p.answer.options.every((o, k) => (o.text.slice(2) === d.ok[CIRC.indexOf(o.text[0])]) === (k !== p.answer.value));
    },
  });

  // 11번: 종이띠 접기
  function foldGeom(th) {
    const L = 9, H = 3;
    const t = g.rad(th);
    const p = 3 + H / Math.tan(t) + 0.4;
    const P = [p, H], Q = [p - H / Math.tan(t), 0];
    const refl = (X) => {
      const dx = -Math.cos(t), dy = -Math.sin(t);
      const vx = X[0] - P[0], vy = X[1] - P[1];
      const k = vx * dx + vy * dy;
      return [P[0] + 2 * k * dx - vx, P[1] + 2 * k * dy - vy];
    };
    const R0 = refl([0, 0]), R1 = refl([0, H]);
    return { L, H, P, Q, R0, R1, left: [[0, 0], Q, P, [0, H]], right: [Q, [L + p - 3, 0], [L + p - 3, H], P], flap: [R0, Q, P, R1] };
  }
  const tFold = tpl({
    id: 'u3s2-fold', sub: 'u3s2', style: 'A', styleName: '종이 접기', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const th = lv === 2 ? r.int(6, 14) * 5 : r.int(28, 70);
      const x = 180 - 2 * th;
      const G = foldGeom(th);
      const askT = r.chance(0.6); // ㉠을 묻기 / 접힌 변과 아래 변 사이의 각을 묻기
      const fig = { type: 'geo', polys: [{ pts: G.left, cls: 'dash' }, { pts: G.right, cls: 'shape-c' }, { pts: G.flap, cls: 'shape-b' }], angles: [
        { v: G.P, a: G.R1, b: [G.P[0] + 3, G.H], t: askT ? dg(x) : '?' },
        { v: G.P, a: G.Q, b: G.R1, t: askT ? '㉠' : dg(th), r: 0.9, tr: 1.6 },
      ], scale: 30 };
      const ans = askT ? th : x;
      const pats = askT
        ? [{ value: String(180 - x), cause: 'condition', msg: '접힌 부분과 접히기 전 부분이 합동이라서 ㉠과 크기가 같은 각이 하나 더 있어요. 2로 나눠야 해요.' },
          { value: String(x / 2), cause: 'concept', msg: '한 직선 위의 각은 모두 합해 180°예요. 180°에서 먼저 빼고 2로 나눠요.' }]
        : [{ value: String(180 - th), cause: 'condition', msg: `접히기 전 부분에도 ${dg(th)}인 각이 있어요. 180°에서 ${dg(th)}를 두 번 빼야 해요.` },
          { value: String(2 * th), cause: 'concept', msg: '한 직선 위의 각은 모두 합해 180°예요. 180°에서 두 각을 빼요.' }];
      return {
        text: askT ? '직사각형 모양의 종이띠를 그림과 같이 접었어요. 각 ㉠의 크기는 몇 도인가요?' : '직사각형 모양의 종이띠를 그림과 같이 접었어요. 접은 선과 접힌 변 사이의 각이 그림과 같을 때, ?로 표시한 각의 크기는 몇 도인가요?',
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: '°' },
        patterns: pats.filter((pt) => Number(pt.value) !== ans),
        hints: ['접힌 부분과 접히기 전 부분(점선)은 서로 합동이에요. 그래서 접은 선 양쪽의 두 각은 크기가 같아요.', '종이띠의 아래쪽 변은 곧은 선이라서, 그 위의 한 점에 모인 각을 모두 더하면 180°예요.', askT ? `㉠ + ㉠ + ${dg(x)} = 180° → ㉠ = (180° - ${dg(x)}) ÷ 2 = ${dg(th)}` : `${dg(th)} + ${dg(th)} + ? = 180° → ? = 180° - ${dg(2 * th)} = ${dg(x)}`],
        solution: askT ? [`접기 전의 각도 ㉠과 같아요 (합동).`, `㉠ × 2 = 180° - ${dg(x)} = ${dg(180 - x)}`, `㉠ = ${dg(180 - x)} ÷ 2 = ${dg(th)}`] : [`접기 전의 각도 ${dg(th)}예요 (합동).`, `? = 180° - ${dg(th)} - ${dg(th)} = ${dg(x)}`],
        key: `u3s2-fold|${th}|${askT}`,
        data: { th, x, askT },
      };
    },
    verify(p) {
      const G = foldGeom(p.data.th);
      const ang = (v, a, b) => g.deg(Math.acos(((a[0] - v[0]) * (b[0] - v[0]) + (a[1] - v[1]) * (b[1] - v[1])) / (g.dist(v, a) * g.dist(v, b))));
      const real = { t: ang(G.P, G.Q, G.R1), x: ang(G.P, G.R1, [G.P[0] + 3, G.H]) };
      const want = p.data.askT ? real.t : real.x;
      return Math.abs(Number(p.answer.value) - want) < 1e-6 && Math.abs(real.t - p.data.th) < 1e-6 && Math.abs(real.x - p.data.x) < 1e-6;
    },
  });

  // 19번: 합동인 직사각형 4개와 정사각형 1개 (서술형)
  const tTiles = tpl({
    id: 'u3s2-tiles', sub: 'u3s2', style: 'A', styleName: '서술형', levels: [1, 4], weak: ['concept'],
    build(r, lv) {
      const Lg = r.int(lv <= 2 ? 5 : 8, lv <= 2 ? 12 : 18), S = r.int(2, Lg - 2), m = Lg - S, T2 = Lg + S;
      const ask = lv === 1 ? 'perim' : r.pick(['area', 'area', 'perim']);
      const u = 7 / T2;
      const P = (x, y) => [x * u, y * u];
      const rects = [[0, 0, Lg, S], [Lg, 0, T2, Lg], [S, Lg, T2, T2], [0, S, S, T2]].map(([a, b, c, d]) => [P(a, b), P(c, b), P(c, d), P(a, d)]);
      const sq = [P(S, S), P(Lg, S), P(Lg, Lg), P(S, Lg)];
      const big = [P(0, 0), P(0, T2), P(T2, T2), P(T2, 0)];
      const fig = { type: 'geo', polys: [...rects.map((pts) => ({ pts, cls: 'shape-b' })), { pts: sq, cls: 'shape-a' }], sides: [{ a: P(0, 0), b: P(Lg, 0), t: cm(Lg), c: P(Lg / 2, S), d: 0.42 }, { a: P(S, S), b: P(Lg, S), t: cm(m), c: P(T2 / 2, T2 / 2), d: -0.42 }], labels: big.map((p, i) => ({ p, t: LB[i], c: P(T2 / 2, T2 / 2) })), scale: 40 };
      const ans = ask === 'area' ? T2 * T2 : 4 * T2;
      const pats = ask === 'area'
        ? [{ value: String(Lg * Lg), cause: 'concept', msg: `사각형 ㄱㄴㄷㄹ의 한 변은 ${cm(Lg)}가 아니에요. 직사각형의 긴 변과 짧은 변을 더한 길이예요.` },
          { value: String((Lg + m) * (Lg + m)), cause: 'concept', msg: '정사각형의 한 변이 아니라 직사각형의 짧은 변을 더해야 해요.' },
          { value: String(4 * T2), cause: 'condition', msg: '둘레가 아니라 넓이를 구해요.' }]
        : [{ value: String(4 * Lg), cause: 'concept', msg: `사각형 ㄱㄴㄷㄹ의 한 변은 ${cm(Lg)}가 아니에요. 직사각형의 긴 변과 짧은 변을 더한 길이예요.` },
          { value: String(4 * (Lg + m)), cause: 'concept', msg: '정사각형의 한 변이 아니라 직사각형의 짧은 변을 더해야 해요.' }];
      return {
        text: `사각형 ㄱㄴㄷㄹ은 합동인 직사각형 4개와 정사각형 1개로 이루어져 있어요. 사각형 ㄱㄴㄷㄹ의 ${ask === 'area' ? '넓이는 몇 cm²' : '둘레는 몇 cm'}인지 풀이 과정을 쓰고 답을 구하세요.`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: ask === 'area' ? 'cm²' : 'cm' },
        patterns: pats.filter((pt) => Number(pt.value) !== ans),
        hints: [`직사각형 4개가 합동이라서 긴 변은 모두 ${cm(Lg)}, 짧은 변은 모두 같아요.`, `직사각형의 짧은 변 = ${cm(Lg)} - ${cm(m)} = ${cm(S)}`, `사각형 ㄱㄴㄷㄹ의 한 변 = ${Lg} + ${S} = ${cm(T2)} → ${ask === 'area' ? `${T2} × ${T2} = ${ans}` : `${T2} × 4 = ${ans}`}`],
        solution: [`직사각형의 짧은 변: ${Lg} - ${m} = ${S}(cm)`, `사각형 ㄱㄴㄷㄹ의 한 변: ${Lg} + ${S} = ${T2}(cm)`, ask === 'area' ? `넓이: ${T2} × ${T2} = ${ans}(cm²)` : `둘레: ${T2} × 4 = ${ans}(cm)`],
        essay: {
          checklist: [
            { q: '직사각형의 짧은 변의 길이를 구했나요?', concept: `직사각형의 긴 변에서 정사각형의 한 변을 빼면 짧은 변이에요. ${Lg} - ${m} = ${S}` },
            { q: '사각형 ㄱㄴㄷㄹ의 한 변의 길이를 구했나요?', concept: `한 변 = 긴 변 + 짧은 변 = ${Lg} + ${S} = ${T2}` },
            { q: `${ask === 'area' ? '넓이' : '둘레'}를 구하는 식을 썼나요?`, concept: ask === 'area' ? '(정사각형의 넓이) = (한 변) × (한 변)' : '(정사각형의 둘레) = (한 변) × 4' },
          ],
        },
        key: `u3s2-tiles|${Lg}|${S}|${ask}`,
        data: { Lg, m, ask },
      };
    },
    verify(p) { const s = p.data.Lg + (p.data.Lg - p.data.m); return Number(p.answer.value) === (p.data.ask === 'area' ? s * s : 4 * s); },
  });

  // 풀이에서 처음으로 틀린 줄 (대응각 + 세 각의 합)
  const tLine2 = TB.lineFind({
    id: 'u3s2-line', unit: 3, sub: 'u3s2', levels: [1, 4],
    gen(r) {
      const A = r.int(7, 18) * 5, B = r.int(7, 18) * 5, C = 180 - A - B;
      if (C < 30) return null;
      const off = r.int(1, 2);
      const nb = (i) => LB[3 + mod(i + off, 3)];
      const L = [
        `각 ${nb(1)}의 대응각은 각 ㄴ이므로 각 ㄴ = ${B}°`,
        '삼각형의 세 각의 합은 180°',
        `각 ㄷ = 180° - ${A}° - ${B}° = ${C}°`,
        `각 ${nb(2)} = 각 ㄷ = ${C}°`,
      ];
      const kind = r.int(0, 2);
      const err = r.pick([10, -10, 20]);
      const bad = [
        { i: 0, line: `각 ${nb(1)}의 대응각은 각 ㄱ이므로 각 ㄱ = ${B}°`, msg: `삼각형 ㄱㄴㄷ과 삼각형 ${nb(0)}${nb(1)}${nb(2)}에서 차례대로 짝을 지으면 점 ${nb(1)}의 대응점은 점 ㄴ이에요.`, after: [L[1], `각 ㄷ = 180° - ${B}° - ${B}° = ${180 - 2 * B}°`, `각 ${nb(2)} = 각 ㄷ = ${180 - 2 * B}°`] },
        { i: 1, line: '삼각형의 세 각의 합은 360°', msg: '삼각형의 세 각의 합은 180°예요.', after: [`각 ㄷ = 360° - ${A}° - ${B}° = ${360 - A - B}°`, `각 ${nb(2)} = 각 ㄷ = ${360 - A - B}°`] },
        { i: 2, line: `각 ㄷ = 180° - ${A}° - ${B}° = ${C + err}°`, msg: `180 - ${A} - ${B}을 다시 계산하면 ${C}이에요.`, after: [`각 ${nb(2)} = 각 ㄷ = ${C + err}°`] },
      ][kind];
      if (kind === 0 && 180 - 2 * B <= 0) return null;
      return {
        problem: `"삼각형 ㄱㄴㄷ과 삼각형 ${nb(0)}${nb(1)}${nb(2)}은 서로 합동이에요. 각 ㄱ이 ${A}°, 각 ${nb(1)}이 ${B}°일 때 각 ${nb(2)}의 크기"를`,
        verb: '구한',
        lines: L,
        bad: { i: bad.i, line: bad.line, msg: bad.msg },
        after: bad.after,
        key: `${A}|${B}|${off}|${kind}|${err}`,
      };
    },
  });

  // 합동인 직각삼각형 2개를 붙인 도형의 둘레
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25]];
  const tTwoTri = tpl({
    id: 'u3s2-twotri', sub: 'u3s2', style: 'B', styleName: '퍼즐', levels: [1, 4],
    build(r, lv) {
      let [a, b, c] = r.pick(TRIPLES.slice(0, lv <= 2 ? 4 : 7));
      if (r.chance(0.5)) [a, b] = [b, a];
      const how = lv === 1 ? 'hyp' : r.pick(['hyp', 'legA', 'legB']);
      const u = 5 / Math.max(a, b);
      let fig, ans, shape;
      if (how === 'hyp') {
        const R = [[0, 0], [0, a * u], [b * u, a * u], [b * u, 0]];
        fig = { type: 'geo', polys: [{ pts: [R[0], R[1], R[2]], cls: 'shape-a' }, { pts: [R[0], R[2], R[3]], cls: 'shape-b' }], segs: [{ a: R[0], b: R[2], cls: 'dash' }], sides: [{ a: R[0], b: R[1], t: cm(a), c: R[2] }, { a: R[1], b: R[2], t: cm(b), c: R[0] }, { a: R[0], b: R[2], t: cm(c), c: R[1], d: -0.45 }], angles: [{ v: R[1], a: R[0], b: R[2], right: true }], scale: 42 };
        ans = 2 * (a + b); shape = '직사각형';
      } else {
        const [p, q] = how === 'legA' ? [a, b] : [b, a]; // p: 붙인 다리, q: 밑변 절반
        const top = [q * u, 0], bl = [0, p * u], br = [2 * q * u, p * u], foot = [q * u, p * u];
        fig = { type: 'geo', polys: [{ pts: [top, bl, foot], cls: 'shape-a' }, { pts: [top, foot, br], cls: 'shape-b' }], segs: [{ a: top, b: foot, cls: 'dash' }], sides: [{ a: top, b: foot, t: cm(p), c: bl, d: 0.5 }, { a: bl, b: foot, t: cm(q), c: top }, { a: top, b: bl, t: cm(c), c: foot }], angles: [{ v: foot, a: top, b: bl, right: true }], scale: 42 };
        ans = 2 * q + 2 * c; shape = '이등변삼각형';
      }
      const inner = how === 'hyp' ? c : how === 'legA' ? a : b;
      return {
        text: `합동인 직각삼각형 2개를 겹치지 않게 이어 붙여서 ${j(shape, '을/를')} 만들었어요. 만든 ${shape}의 둘레는 몇 cm인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [
          { value: String(2 * (a + b + c)), cause: 'condition', msg: `붙인 변(${cm(inner)})은 도형의 안쪽에 있어서 둘레에 들어가지 않아요.` },
          { value: String(a + b + c), cause: 'concept', msg: '삼각형 하나의 둘레가 아니라 붙여서 만든 도형 바깥쪽 변의 길이를 모두 더해요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: ['두 삼각형은 합동이라서 대응변의 길이가 같아요.', `붙인 변(점선, ${cm(inner)})은 둘레에 들어가지 않아요. 바깥쪽 변만 찾아요.`, `바깥쪽 변: ${how === 'hyp' ? `${a}, ${b}, ${a}, ${b}` : `${c}, ${c}, ${how === 'legA' ? b : a} × 2`} → ${ans} cm`],
        solution: [`삼각형 한 개의 세 변: ${a} cm, ${b} cm, ${c} cm`, `붙인 변 ${cm(inner)}을 빼고 바깥쪽 변을 더해요: ${ans} cm`],
        key: `u3s2-twotri|${a}|${b}|${how}`,
        data: { a, b, c, how },
      };
    },
    verify(p) {
      const { a, b, c, how } = p.data;
      // 두 삼각형 둘레의 합에서 붙인 변 2개를 뺀다
      const inner = how === 'hyp' ? c : how === 'legA' ? a : b;
      return a * a + b * b === c * c && Number(p.answer.value) === 2 * (a + b + c) - 2 * inner;
    },
  });

  M5.addTemplates([
    tPick, tGridCount, tPair, tCount, tTriCond, tCut, tWhy, tOX('u3s1', OX1),
    tCorr, tSide, tAngle, tTri180, tQuad360, tPerim, tWrong, tFold, tTiles, tLine2, tTwoTri, tOX('u3s2', OX2),
  ]);
  M5.u3 = { tOX, rotateAll };
})();
