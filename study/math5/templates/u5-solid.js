// 5단원 직육면체와 정육면체 — 직육면체와 정육면체 / 겨냥도 / 성질 / 정육면체의 전개도 / 직육면체의 전개도
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, TB = M5.tb, B = M5.box;
  const j = T.j;
  const LB = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const GA = ['가', '나', '다', '라', '마', '바'];

  M5.addUnit({
    id: 5,
    name: '직육면체와 정육면체',
    subs: [
      { id: 'u5s1', name: '직육면체와 정육면체', concept: '직사각형 6개로 둘러싸인 도형을 직육면체, 정사각형 6개로 둘러싸인 도형을 정육면체라고 해요.\n선분으로 둘러싸인 부분을 면, 면과 면이 만나는 선분을 모서리, 모서리와 모서리가 만나는 점을 꼭짓점이라고 해요.\n직육면체와 정육면체는 모두 면 6개, 모서리 12개, 꼭짓점 8개예요.\n직육면체는 길이가 같은 모서리가 4개씩 3묶음이라서, 모든 모서리의 길이의 합은 (가로 + 세로 + 높이) × 4예요.\n정육면체는 직육면체라고 할 수 있지만, 직육면체는 정육면체라고 할 수 없어요.' },
      { id: 'u5s2', name: '직육면체의 겨냥도', concept: '직육면체 모양을 잘 알 수 있게 나타낸 그림을 겨냥도라고 해요.\n보이는 모서리는 실선으로, 보이지 않는 모서리는 점선으로 그려요.\n보이는 면 3개, 보이는 모서리 9개, 보이는 꼭짓점 7개\n보이지 않는 면 3개, 보이지 않는 모서리 3개, 보이지 않는 꼭짓점 1개\n보이지 않는 모서리 3개는 가로, 세로, 높이가 하나씩이에요.' },
      { id: 'u5s3', name: '직육면체의 성질', concept: '직육면체에서 계속 늘여도 만나지 않는 두 면을 서로 평행하다고 해요. 서로 마주 보는 면은 평행하고, 평행한 면은 3쌍이에요.\n평행한 두 면을 직육면체의 밑면이라고 해요.\n서로 만나는 두 면은 수직이에요. 한 면과 수직인 면은 4개이고, 밑면과 수직인 면을 옆면이라고 해요.\n한 꼭짓점에서 만나는 면은 3개예요.' },
      { id: 'u5s4', name: '정육면체의 전개도', concept: '정육면체의 모서리를 잘라서 펼친 그림을 정육면체의 전개도라고 해요. 잘린 모서리는 실선, 잘리지 않은 모서리는 점선으로 그려요.\n전개도를 접었을 때 마주 보는 면은 평행하고, 한 면과 이웃한 면 4개는 수직이에요.\n한 줄로 이어진 세 면에서 첫째 면과 셋째 면은 마주 보는 면이에요.\n만나는 점·맞닿는 선분은 지퍼처럼 찾아요: 안쪽으로 꺾인 곳(ㄴ자로 오목한 곳)에서 꺾인 점 양쪽의 두 선분이 먼저 맞닿고, 그 바깥 선분끼리 차례로 맞닿아요. 맞닿는 두 선분의 끝점끼리 만나요.\n접었을 때 겹치는 면이 있으면 전개도가 아니에요. 정육면체의 전개도는 모두 11가지예요.' },
      { id: 'u5s5', name: '직육면체의 전개도', concept: '직육면체의 모서리를 잘라서 펼친 그림을 직육면체의 전개도라고 해요.\n마주 보는 면 3쌍은 모양과 크기가 같아요.\n접었을 때 맞닿는 선분의 길이는 같아요.\n만나는 점·맞닿는 선분은 정육면체처럼 지퍼로 찾아요: 안쪽으로 꺾인 곳에서 꺾인 점 양쪽의 두 선분이 먼저 맞닿고, 그 바깥 선분끼리 차례로 맞닿아요.\n접었을 때 겹치는 면이 없어야 해요.' },
    ],
  });

  const tpl = (o) => Object.assign({ unit: 5 }, o);
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const cm = (v) => `${v} cm`;
  const NUM_NAME = { 면: 6, 모서리: 12, 꼭짓점: 8 };

  // 직육면체의 가로·세로(깊이)·높이 (서로 다르게)
  function dims(r, lv, cube) {
    if (cube) { const a = r.int(2, lv <= 2 ? 9 : 15); return { a, h: a, c: a }; }
    for (;;) {
      const a = r.int(3, lv <= 2 ? 9 : 15), h = r.int(2, lv <= 2 ? 8 : 12), c = r.int(2, lv <= 2 ? 7 : 12);
      if (new Set([a, h, c]).size === 3) return { a, h, c };
    }
  }
  // 그림용 크기 (실제 길이와 비슷한 비율, 너무 납작하지 않게)
  const drawDims = (d) => { const m = Math.max(d.a, d.h, d.c); const f = (v) => Math.max(0.45, v / m) * 4; return { a: f(d.a), h: f(d.h), c: f(d.c) * 1.2 }; };
  const lensOf = (d) => ({ a: cm(d.a), h: cm(d.h), c: cm(d.c) });

  // 앞면 모양을 뒤로 민 입체 (직육면체 찾기 보기용). 앞면 안쪽에 들어가는 뒤 꼭짓점의 모서리는 점선
  function prismFig(front, depth, scale = 22) {
    const dv = [depth * 0.43, -depth * 0.25];
    const back = front.map(([x, y]) => [x + dv[0], y + dv[1]]);
    const inside = (p) => {
      let c = false;
      for (let i = 0, k = front.length - 1; i < front.length; k = i++) {
        const [xi, yi] = front[i], [xk, yk] = front[k];
        if ((yi > p[1]) !== (yk > p[1]) && p[0] < ((xk - xi) * (p[1] - yi)) / (yk - yi) + xi) c = !c;
      }
      return c;
    };
    const hid = back.map(inside);
    const segs = [];
    front.forEach((p, i) => segs.push({ a: p, b: front[(i + 1) % front.length], cls: 'box' }));
    back.forEach((p, i) => segs.push({ a: p, b: back[(i + 1) % back.length], cls: hid[i] || hid[(i + 1) % back.length] ? 'dash' : 'box' }));
    front.forEach((p, i) => segs.push({ a: p, b: back[i], cls: hid[i] ? 'dash' : 'box' }));
    return { type: 'geo', polys: [], segs, scale, pad: 0.4 };
  }
  const SOLIDS = {
    cuboid: (r) => { const w = r.int(30, 45) / 10, h = r.int(16, 26) / 10; return { name: '직육면체', front: [[0, 0], [w, 0], [w, h], [0, h]], depth: r.int(16, 30) / 10, kind: 'cuboid' }; },
    cube: (r) => { const a = r.int(18, 28) / 10; return { name: '정육면체', front: [[0, 0], [a, 0], [a, a], [0, a]], depth: a, kind: 'cube' }; },
    tri: (r) => ({ name: '삼각기둥', front: [[1.5, 0], [3, 2.4], [0, 2.4]], depth: r.int(18, 28) / 10, kind: 'other' }),
    trap: () => ({ name: '사다리꼴 모양 기둥', front: [[0.8, 0], [2.6, 0], [3.4, 2.2], [0, 2.2]], depth: 2, kind: 'other' }),
    para: () => ({ name: '평행사변형 모양 기둥', front: [[0.9, 0], [3.9, 0], [3, 2.2], [0, 2.2]], depth: 2, kind: 'other' }),
  };

  // ======================================================================
  // 소단원 1: 직육면체와 정육면체
  // ======================================================================
  const tCount1 = tpl({
    id: 'u5s1-count', sub: 'u5s1', style: 'A', styleName: '면·모서리·꼭짓점의 수', levels: [1, 4],
    build(r, lv) {
      const cube = r.chance(0.5);
      const name = cube ? '정육면체' : '직육면체';
      const keys = Object.keys(NUM_NAME);
      const fig = B.boxFig(drawDims(cube ? { a: 4, h: 4, c: 4 } : { a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) }));
      if (lv <= 2) {
        const k = r.pick(keys);
        return {
          text: `${name}의 ${j(k, '은/는')} 모두 몇 개인가요?`,
          figure: fig,
          answer: { type: 'num', value: String(NUM_NAME[k]), unit: '개' },
          patterns: keys.filter((x) => x !== k).map((x) => ({ value: String(NUM_NAME[x]), cause: 'concept', msg: `${NUM_NAME[x]}개는 ${x}의 수예요. ${k === '면' ? '선분으로 둘러싸인 부분' : k === '모서리' ? '면과 면이 만나는 선분' : '모서리와 모서리가 만나는 점'}을 세어요.` })),
          hints: ['면은 선분으로 둘러싸인 부분, 모서리는 면과 면이 만나는 선분, 꼭짓점은 모서리와 모서리가 만나는 점이에요.', '보이지 않는 곳(점선)에 있는 것까지 모두 세어요.', `${name}의 ${k}: ${NUM_NAME[k]}개`],
          solution: [`${name}: 면 6개, 모서리 12개, 꼭짓점 8개`, `${j(k, '은/는')} ${NUM_NAME[k]}개예요.`],
          key: `u5s1-count|${cube}|${k}`,
          data: { want: NUM_NAME[k] },
        };
      }
      const [x, y] = r.sample(keys, 2);
      const op = r.pick(['+', '-']);
      const [p, q] = op === '-' && NUM_NAME[x] < NUM_NAME[y] ? [y, x] : [x, y];
      const ans = op === '+' ? NUM_NAME[p] + NUM_NAME[q] : NUM_NAME[p] - NUM_NAME[q];
      if (ans <= 0) return null;
      return {
        text: `${name}에서 (${p}의 수) ${op} (${q}의 수)는 얼마인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans) },
        patterns: [],
        hints: ['면 6개, 모서리 12개, 꼭짓점 8개예요.', `${p}: ${NUM_NAME[p]}개, ${q}: ${NUM_NAME[q]}개`, `${NUM_NAME[p]} ${op} ${NUM_NAME[q]} = ${ans}`],
        solution: [`${p}의 수 ${NUM_NAME[p]}, ${q}의 수 ${NUM_NAME[q]}`, `${NUM_NAME[p]} ${op} ${NUM_NAME[q]} = ${ans}`],
        key: `u5s1-count|${cube}|${p}${op}${q}`,
        data: { want: ans },
      };
    },
    verify(p) { return Number(p.answer.value) === p.data.want; },
  });

  const tWhich1 = tpl({
    id: 'u5s1-which', sub: 'u5s1', style: 'A', styleName: '직육면체 찾기', levels: [1, 4],
    build(r) {
      const askCube = r.chance(0.35);
      const kinds = r.shuffle(['cuboid', 'cube', ...r.sample(['tri', 'trap', 'para'], 2), r.chance(0.5) ? 'cuboid' : 'cube']);
      const shapes = kinds.map((k) => SOLIDS[k](r));
      if (new Set(shapes.map((x) => JSON.stringify(x.front) + x.depth)).size < shapes.length) return null;
      const right = (s) => (askCube ? s.kind === 'cube' : s.kind !== 'other');
      const keys = shapes.map((s, i) => `${s.kind}${i}`);
      const pats = [];
      if (!askCube) pats.push({ value: keys.filter((_, i) => shapes[i].kind === 'cuboid'), cause: 'concept', msg: '정육면체도 직사각형(정사각형) 6개로 둘러싸여 있어서 직육면체예요.' });
      return {
        text: askCube ? '다음 중 정육면체를 모두 고르세요.' : '다음 중 직육면체를 모두 고르세요.',
        answer: { type: 'multi', options: shapes.map((s, i) => ({ figure: prismFig(s.front, s.depth), key: keys[i], correct: right(s) })) },
        keepOrder: true,
        patterns: pats.filter((pt) => pt.value.length),
        hints: [askCube ? '정육면체는 정사각형 6개로 둘러싸인 도형이에요.' : '직육면체는 직사각형 6개로 둘러싸인 도형이에요.', '앞면의 모양부터 봐요. 삼각형, 사다리꼴, 평행사변형인 면이 있으면 직육면체가 아니에요.', askCube ? '모든 모서리의 길이가 같아 보이는 것을 골라요.' : '정육면체도 직육면체에 들어가요.'],
        solution: [shapes.map((s, i) => `${i + 1}번 ${s.name}`).join(', '), askCube ? '정육면체: 정사각형 6개' : '직육면체: 직사각형 6개 (정육면체 포함)'],
        key: `u5s1-which|${askCube}|${kinds.join(',')}|${shapes.map((s) => s.depth).join(',')}`,
        data: { kinds, askCube },
      };
    },
    verify(p) { return p.answer.options.every((o, i) => (p.data.askCube ? p.data.kinds[i] === 'cube' : p.data.kinds[i] !== 'tri' && p.data.kinds[i] !== 'trap' && p.data.kinds[i] !== 'para') === p.answer.values.includes(i)); },
  });

  const tEdgeSum = tpl({
    id: 'u5s1-edgesum', sub: 'u5s1', style: 'A', styleName: '모서리의 길이의 합', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const cube = lv === 1 || r.chance(0.3);
      const d = dims(r, lv, cube);
      const s = d.a + d.h + d.c, ans = 4 * s;
      return {
        text: `${cube ? '정육면체' : '직육면체'}의 모든 모서리의 길이의 합은 몇 cm인가요?`,
        figure: B.boxFig(drawDims(d), { lens: cube ? { a: cm(d.a) } : lensOf(d) }),
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [
          { value: String(cube ? d.a * 3 : s), cause: 'concept', msg: cube ? '보이는 세 모서리만 더했어요. 정육면체의 모서리는 12개예요.' : '그림에 적힌 길이 3개만 더했어요. 길이가 같은 모서리가 4개씩 있어요.' },
          { value: String(cube ? d.a * 9 : 3 * s), cause: 'condition', msg: '보이는 모서리만 더했어요. 보이지 않는 모서리(점선)도 더해야 해요.' },
          { value: String(cube ? d.a * 6 : 2 * s), cause: 'concept', msg: '길이가 같은 모서리는 2개가 아니라 4개씩이에요.' },
        ],
        hints: ['직육면체에는 길이가 같은 모서리가 4개씩 3묶음 있어요.', cube ? '정육면체는 모서리 12개의 길이가 모두 같아요.' : `가로 ${cm(d.a)} 4개, 높이 ${cm(d.h)} 4개, 깊이 ${cm(d.c)} 4개`, cube ? `${d.a} × 12 = ${ans}` : `(${d.a} + ${d.h} + ${d.c}) × 4 = ${s} × 4 = ${ans}`],
        solution: cube ? [`정육면체의 모서리 12개의 길이가 모두 ${cm(d.a)}예요.`, `${d.a} × 12 = ${ans}(cm)`] : ['길이가 같은 모서리가 4개씩 있어요.', `(${d.a} + ${d.h} + ${d.c}) × 4 = ${ans}(cm)`],
        key: `u5s1-edgesum|${d.a}|${d.h}|${d.c}`,
        data: d,
      };
    },
    verify(p) { const d = p.data; return Number(p.answer.value) === 4 * (d.a + d.h + d.c); },
  });

  const tEdgeInv = tpl({
    id: 'u5s1-edgeinv', sub: 'u5s1', style: 'A', styleName: '모서리의 길이 구하기', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const cube = r.chance(0.4);
      const d = dims(r, lv, cube);
      const total = 4 * (d.a + d.h + d.c);
      if (cube) {
        return {
          text: `정육면체의 모든 모서리의 길이의 합이 ${cm(total)}예요. 한 모서리의 길이는 몇 cm인가요?`,
          figure: B.boxFig(drawDims(d), { lens: { a: '□ cm' } }),
          answer: { type: 'num', value: String(d.a), unit: 'cm' },
          patterns: [6, 8, 4].filter((k) => total % k === 0).map((k) => ({ value: String(total / k), cause: 'concept', msg: `정육면체의 모서리는 ${k}개가 아니라 12개예요.` })),
          hints: ['정육면체의 모서리 12개는 길이가 모두 같아요.', `(한 모서리) × 12 = ${total}`, `${total} ÷ 12 = ${d.a}`],
          solution: [`모서리 12개의 길이가 같아요.`, `${total} ÷ 12 = ${d.a}(cm)`],
          key: `u5s1-edgeinv|cube|${d.a}`,
          data: { want: d.a },
        };
      }
      return {
        text: `직육면체의 모든 모서리의 길이의 합이 ${cm(total)}예요. □ 안에 알맞은 수를 구하세요.`,
        figure: B.boxFig(drawDims(d), { lens: { a: cm(d.a), h: cm(d.h), c: '□ cm' } }),
        answer: { type: 'num', value: String(d.c), unit: 'cm' },
        patterns: [
          { value: String(total / 4), cause: 'condition', msg: `4로 나눈 ${total / 4}는 세 모서리(가로+세로+높이)의 합이에요. 여기서 ${d.a}와 ${d.h}를 빼야 해요.` },
          { value: String(total - d.a - d.h), cause: 'concept', msg: '길이가 같은 모서리가 4개씩 있어요. 먼저 4로 나눠요.' },
        ].filter((pt) => Number(pt.value) > 0),
        hints: ['모든 모서리의 길이의 합 = (가로 + 세로 + 높이) × 4', `가로 + 세로 + 높이 = ${total} ÷ 4 = ${total / 4}`, `□ = ${total / 4} - ${d.a} - ${d.h} = ${d.c}`],
        solution: [`(${d.a} + ${d.h} + □) × 4 = ${total}`, `${d.a} + ${d.h} + □ = ${total / 4}`, `□ = ${total / 4} - ${d.a} - ${d.h} = ${d.c}`],
        key: `u5s1-edgeinv|${d.a}|${d.h}|${d.c}`,
        data: { want: d.c },
      };
    },
    verify(p) { return Number(p.answer.value) === p.data.want; },
  });

  const FACE_DIMS = { front: ['a', 'h'], top: ['a', 'c'], right: ['c', 'h'] };
  const FACE_WORD = { front: '앞면', top: '윗면', right: '오른쪽 옆면' };
  const tFaceArea = tpl({
    id: 'u5s1-face', sub: 'u5s1', style: 'A', styleName: '면의 넓이', levels: [1, 4],
    build(r, lv) {
      const d = dims(r, Math.min(lv, 2), false);
      const f = r.pick(Object.keys(FACE_DIMS));
      const [x, y] = FACE_DIMS[f];
      const ans = d[x] * d[y];
      const others = Object.keys(FACE_DIMS).filter((k) => k !== f).map((k) => d[FACE_DIMS[k][0]] * d[FACE_DIMS[k][1]]);
      return {
        text: `직육면체에서 색칠한 면의 넓이는 몇 cm²인가요?`,
        figure: B.boxFig(drawDims(d), { lens: lensOf(d), shade: f }),
        answer: { type: 'num', value: String(ans), unit: 'cm²' },
        patterns: [
          ...others.map((v) => ({ value: String(v), cause: 'condition', msg: '색칠한 면의 두 변이 어떤 모서리인지 다시 봐요.' })),
          { value: String(2 * (d[x] + d[y])), cause: 'concept', msg: '넓이는 (가로) × (세로)예요. 둘레를 구했어요.' },
        ],
        hints: ['직육면체의 면은 직사각형이에요.', `색칠한 면(${FACE_WORD[f]})의 두 변은 ${cm(d[x])}, ${cm(d[y])}예요.`, `${d[x]} × ${d[y]} = ${ans}`],
        solution: [`색칠한 면은 가로 ${cm(d[x])}, 세로 ${cm(d[y])}인 직사각형이에요.`, `${d[x]} × ${d[y]} = ${ans}(cm²)`],
        key: `u5s1-face|${d.a}|${d.h}|${d.c}|${f}`,
        data: { want: ans },
      };
    },
    verify(p) { return Number(p.answer.value) === p.data.want; },
  });

  const tWire = tpl({
    id: 'u5s1-wire', sub: 'u5s1', style: 'A', styleName: '생활 속 문제', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const cube = r.chance(0.3);
      const d = dims(r, lv, cube);
      const need = 4 * (d.a + d.h + d.c);
      const left = r.int(3, 40);
      const L = need + left;
      const nm = r.pick(M5.words.names);
      return {
        text: `${j(nm, '이/가')} 철사 ${cm(L)}로 ${cube ? `한 모서리가 ${cm(d.a)}인 정육면체` : `가로 ${cm(d.a)}, 세로 ${cm(d.c)}, 높이 ${cm(d.h)}인 직육면체`} 모양을 하나 만들었어요. 남은 철사는 몇 cm인가요? (겹치는 부분은 없어요.)`,
        answer: { type: 'num', value: String(left), unit: 'cm' },
        patterns: [
          { value: String(L - (d.a + d.h + d.c)), cause: 'concept', msg: '직육면체 모양을 만들려면 모서리 12개만큼 철사가 필요해요. (가로+세로+높이) × 4예요.' },
          { value: String(need), cause: 'condition', msg: '쓴 철사의 길이를 구했어요. 처음 철사에서 빼야 남은 철사예요.' },
        ].filter((pt) => Number(pt.value) > 0),
        hints: ['직육면체 모양을 만드는 데 쓴 철사 = 모든 모서리의 길이의 합', cube ? `${d.a} × 12 = ${need}` : `(${d.a} + ${d.c} + ${d.h}) × 4 = ${need}`, `${L} - ${need} = ${left}`],
        solution: [`쓴 철사: ${cube ? `${d.a} × 12` : `(${d.a} + ${d.c} + ${d.h}) × 4`} = ${need}(cm)`, `남은 철사: ${L} - ${need} = ${left}(cm)`],
        key: `u5s1-wire|${d.a}|${d.h}|${d.c}|${L}`,
        data: { d, L },
      };
    },
    verify(p) { const { d, L } = p.data; return Number(p.answer.value) === L - 4 * (d.a + d.h + d.c); },
  });

  const COMMON = ['면이 6개예요.', '모서리가 12개예요.', '꼭짓점이 8개예요.', '면과 면이 만나는 선분을 모서리라고 해요.'];
  const DIFF = ['면의 모양이 모두 정사각형이에요.', '모든 모서리의 길이가 같아요.', '모든 면의 크기가 같아요.'];
  const tCompare = tpl({
    id: 'u5s1-compare', sub: 'u5s1', style: 'B', styleName: '같은 점과 다른 점', levels: [1, 4],
    build(r) {
      const notCommon = r.chance(0.5);
      const right = notCommon ? r.pick(DIFF) : r.pick(COMMON);
      const wrongs = r.sample(notCommon ? COMMON : DIFF, 3);
      const opts = [right, ...wrongs];
      return {
        text: notCommon ? '다음 중 직육면체와 정육면체의 같은 점이 아닌 것을 고르세요.' : '다음 중 직육면체와 정육면체의 같은 점을 고르세요.',
        answer: { type: 'choice', options: opts.map((t, i) => Object.assign({ text: t, correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'concept', msg: DIFF.includes(t) ? '이것은 정육면체만의 특징이에요. 직육면체는 면이 직사각형이라 모서리 길이가 다를 수 있어요.' : '이것은 직육면체와 정육면체가 모두 같아요.' } })) },
        hints: ['직육면체와 정육면체 모두 면 6개, 모서리 12개, 꼭짓점 8개예요.', '정육면체는 면이 모두 정사각형이라 모서리 길이가 모두 같아요. 직육면체는 그렇지 않을 수 있어요.', `정답: ${right}`],
        solution: [`같은 점: 면 6개, 모서리 12개, 꼭짓점 8개`, `다른 점: 정육면체는 면이 모두 정사각형이고 모서리 길이가 모두 같아요.`],
        key: `u5s1-compare|${notCommon}|${opts.slice().sort().join('/')}`,
        data: { notCommon },
      };
    },
    verify(p) { const t = p.answer.options[p.answer.value].text; return p.data.notCommon ? DIFF.includes(t) : COMMON.includes(t); },
  });

  const tOX = (sub, list) => TB.oxWhy({
    id: sub + '-oxwhy', unit: 5, sub, levels: [1, 4],
    gen(r) { const i = r.int(0, list.length - 1); const q = list[i]; return { statement: q.s, truth: q.t, why: q.why, wrong: r.shuffle(q.wrong), key: i }; },
  });
  const OX1 = [
    { s: '정육면체는 직육면체라고 할 수 있어요.', t: true, why: '정육면체의 면인 정사각형도 직사각형이라서, 직사각형 6개로 둘러싸인 직육면체예요.', wrong: ['정육면체는 크기가 작아서요.', '면의 수가 같으면 모두 같은 도형이라서요.'] },
    { s: '직육면체는 정육면체라고 할 수 있어요.', t: false, why: '직육면체의 면은 정사각형이 아닐 수 있어서 정육면체라고 할 수 없어요.', wrong: ['면이 6개로 같으니까요.', '모서리가 12개로 같으니까요.'] },
    { s: '직육면체의 꼭짓점은 6개예요.', t: false, why: '직육면체의 꼭짓점은 8개예요. 면이 6개예요.', wrong: ['면의 수와 꼭짓점의 수는 같으니까요.', '보이는 꼭짓점만 세면 6개니까요.'] },
    { s: '직육면체에는 길이가 같은 모서리가 4개씩 있어요.', t: true, why: '가로, 세로, 높이 방향으로 길이가 같은 모서리가 4개씩 3묶음 있어요.', wrong: ['모든 모서리의 길이가 같으니까요.', '모서리는 모두 2개씩 짝이 있으니까요.'] },
    { s: '정육면체의 면은 모두 크기가 같아요.', t: true, why: '정육면체는 모서리의 길이가 모두 같아서 면인 정사각형 6개의 크기도 모두 같아요.', wrong: ['면의 모양이 직사각형이라서요.', '마주 보는 면만 같으니까요.'] },
  ];

  const tLine1 = TB.lineFind({
    id: 'u5s1-line', unit: 5, sub: 'u5s1', levels: [1, 4],
    gen(r) {
      const a = r.int(3, 12), c = r.int(2, 10), h = r.int(2, 10);
      if (new Set([a, c, h]).size < 3) return null;
      const s = a + c + h;
      const L = ['길이가 같은 모서리가 4개씩 3묶음 있어요.', `(${a} + ${c} + ${h}) × 4`, `= ${s} × 4`, `= ${4 * s}(cm)`];
      const kind = r.int(0, 2);
      const bad = [
        { i: 0, line: '길이가 같은 모서리가 2개씩 3묶음 있어요.', msg: '직육면체에는 길이가 같은 모서리가 4개씩 있어요.', after: [`(${a} + ${c} + ${h}) × 2`, `= ${2 * s}(cm)`] },
        { i: 1, line: `(${a} + ${c} + ${h}) × 3`, msg: '모서리는 12개라서 4를 곱해야 해요. 3을 곱하면 보이는 모서리만 더한 거예요.', after: [`= ${s} × 3`, `= ${3 * s}(cm)`] },
        { i: 2, line: `= ${s + (r.chance(0.5) ? 1 : -1)} × 4`, msg: `${a} + ${c} + ${h} = ${s}이에요.`, after: [] },
      ][kind];
      if (kind === 2) bad.after = [`= ${Number(bad.line.match(/= (\d+)/)[1]) * 4}(cm)`];
      return { problem: `"가로 ${cm(a)}, 세로 ${cm(c)}, 높이 ${cm(h)}인 직육면체의 모든 모서리의 길이의 합"을`, verb: '구한', lines: L, bad: { i: bad.i, line: bad.line, msg: bad.msg }, after: bad.after, key: `${a}|${c}|${h}|${kind}|${bad.line}` };
    },
  });

  // ======================================================================
  // 소단원 2: 직육면체의 겨냥도
  // ======================================================================
  const VIS = [
    { q: '보이는 면', v: 3, other: ['보이지 않는 면', 3] }, { q: '보이지 않는 면', v: 3, other: ['보이는 면', 3] },
    { q: '보이는 모서리', v: 9, other: ['보이지 않는 모서리', 3] }, { q: '보이지 않는 모서리', v: 3, other: ['보이는 모서리', 9] },
    { q: '보이는 꼭짓점', v: 7, other: ['보이지 않는 꼭짓점', 1] }, { q: '보이지 않는 꼭짓점', v: 1, other: ['보이는 꼭짓점', 7] },
  ];
  const TOTAL = { 면: 6, 모서리: 12, 꼭짓점: 8 };
  const tCount2 = tpl({
    id: 'u5s2-count', sub: 'u5s2', style: 'A', styleName: '보이는 것과 보이지 않는 것', levels: [1, 4],
    build(r, lv) {
      const fig = B.boxFig(drawDims({ a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) }));
      if (lv <= 2) {
        const q = r.pick(VIS);
        const kind = q.q.split(' ').pop();
        return {
          text: `직육면체의 겨냥도에서 ${j(q.q, '은/는')} 모두 몇 개인가요?`,
          figure: fig,
          answer: { type: 'num', value: String(q.v), unit: '개' },
          patterns: [
            { value: String(TOTAL[kind]), cause: 'condition', msg: `${kind}의 전체 수를 셌어요. ${q.q.startsWith('보이는') ? '실선' : '점선'}으로 된 것만 세요.` },
            { value: String(q.other[1]), cause: 'concept', msg: `${q.other[1]}개는 ${q.other[0]}의 수예요.` },
          ].filter((pt) => Number(pt.value) !== q.v),
          hints: ['겨냥도에서 보이는 모서리는 실선, 보이지 않는 모서리는 점선이에요.', `${j(kind, '은/는')} 모두 ${TOTAL[kind]}개예요.`, `${q.q}: ${q.v}개`],
          solution: [`${q.q}: ${q.v}개`, `(${q.other[0]} ${q.other[1]}개와 더하면 모두 ${TOTAL[kind]}개)`],
          key: `u5s2-count|${q.q}`,
          data: { want: q.v },
        };
      }
      const [x, y] = r.sample(VIS, 2);
      const ans = x.v + y.v;
      return {
        text: `직육면체의 겨냥도에서 (${x.q}의 수) + (${y.q}의 수)는 얼마인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans) },
        patterns: [],
        hints: ['보이는 면 3, 모서리 9, 꼭짓점 7 / 보이지 않는 면 3, 모서리 3, 꼭짓점 1', `${x.q}: ${x.v}개, ${y.q}: ${y.v}개`, `${x.v} + ${y.v} = ${ans}`],
        solution: [`${x.q} ${x.v}개, ${y.q} ${y.v}개`, `${x.v} + ${y.v} = ${ans}`],
        key: `u5s2-count|${x.q}+${y.q}`,
        data: { want: ans },
      };
    },
    verify(p) { return Number(p.answer.value) === p.data.want; },
  });

  const HID = ['ㄱㅁ', 'ㅁㅂ', 'ㅁㅇ'];
  const tSketch = tpl({
    id: 'u5s2-sketch', sub: 'u5s2', style: 'A', styleName: '겨냥도 바르게 그리기', levels: [1, 4],
    build(r) {
      const dd = drawDims({ a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) });
      const visible = B.EDGES.filter((e) => !B.hiddenEdge(e)).map((e) => e[0] + e[1]);
      const kinds = {
        right: { opt: {}, msg: null },
        all: { opt: { drawAll: true }, msg: { cause: 'concept', msg: '보이지 않는 모서리까지 실선으로 그렸어요. 보이지 않는 모서리는 점선으로 그려요.' } },
        wrongdash: { opt: { dashWrong: ['ㄹㅇ', 'ㅇㅅ', 'ㅁㅇ'] }, msg: { cause: 'concept', msg: '보이는 모서리를 점선으로 그렸어요. 보이지 않는 모서리는 뒤쪽 아래 꼭짓점에 모인 3개예요.' } },
        skipH: { opt: { skip: [r.pick(HID)] }, msg: { cause: 'condition', msg: '보이지 않는 모서리 하나를 빠뜨렸어요. 점선은 3개예요.' } },
        skipV: { opt: { skip: [r.pick(visible)] }, msg: { cause: 'condition', msg: '보이는 모서리 하나를 빠뜨렸어요. 실선은 9개예요.' } },
      };
      const pick = ['right', ...r.sample(['all', 'wrongdash', 'skipH', 'skipV'], 3)];
      return {
        text: '직육면체의 겨냥도를 바르게 그린 것을 고르세요.',
        answer: { type: 'choice', options: pick.map((k) => Object.assign({ figure: B.boxFig(dd, Object.assign({ scale: 20 }, kinds[k].opt)), key: k + JSON.stringify(kinds[k].opt), correct: k === 'right' }, k === 'right' ? {} : { pattern: kinds[k].msg })) },
        hints: ['보이는 모서리는 실선, 보이지 않는 모서리는 점선으로 그려요.', '실선 9개, 점선 3개인지 세어 봐요.', '점선 3개는 뒤쪽 아래 꼭짓점 한 곳에 모여요.'],
        solution: ['바른 겨냥도: 보이는 모서리 9개는 실선, 보이지 않는 모서리 3개는 점선'],
        key: `u5s2-sketch|${pick.join(',')}|${JSON.stringify(kinds.skipH.opt)}|${JSON.stringify(kinds.skipV.opt)}`,
        data: { hidden: B.proj(B.V[B.HIDDEN], dd) },
      };
    },
    verify(p) {
      const H = p.data.hidden;
      const at = (q) => Math.abs(q[0] - H[0]) < 1e-9 && Math.abs(q[1] - H[1]) < 1e-9;
      const good = (f) => f.segs.length === 12 && f.segs.every((sg) => (sg.cls === 'dash') === (at(sg.a) || at(sg.b)));
      const ok = p.answer.options.map((o) => good(o.figure));
      return ok.filter(Boolean).length === 1 && ok[p.answer.value];
    },
  });

  const tHiddenSum = tpl({
    id: 'u5s2-hidden', sub: 'u5s2', style: 'A', styleName: '보이지 않는 모서리의 길이', levels: [1, 4], weak: ['concept'],
    build(r, lv) {
      const d = dims(r, lv, false);
      const s = d.a + d.h + d.c;
      const vis = r.chance(0.5) && lv >= 2;
      const ans = vis ? 3 * s : s;
      return {
        text: `직육면체의 겨냥도에서 ${vis ? '보이는' : '보이지 않는'} 모서리의 길이의 합은 몇 cm인가요?`,
        figure: B.boxFig(drawDims(d), { lens: lensOf(d) }),
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [
          { value: String(4 * s), cause: 'condition', msg: '모든 모서리의 길이의 합을 구했어요. ' + (vis ? '보이는 모서리(실선)만 더해요.' : '보이지 않는 모서리(점선)만 더해요.') },
          { value: String(vis ? s : 3 * s), cause: 'concept', msg: vis ? '보이지 않는 모서리를 더했어요. 보이는 모서리는 9개예요.' : '보이는 모서리를 더했어요. 보이지 않는 모서리는 점선 3개예요.' },
          { value: String(vis ? 2 * s : d.a + d.h), cause: 'condition', msg: vis ? '보이는 모서리 9개를 모두 더했는지 확인해요.' : '점선 3개는 가로, 세로, 높이가 하나씩이에요.' },
        ],
        hints: [vis ? '보이는 모서리는 실선 9개예요.' : '보이지 않는 모서리는 점선 3개예요.', vis ? '실선 9개는 가로, 세로, 높이가 3개씩이에요.' : '점선 3개는 가로, 세로, 높이가 하나씩이에요.', vis ? `(${d.a} + ${d.c} + ${d.h}) × 3 = ${ans}` : `${d.a} + ${d.c} + ${d.h} = ${ans}`],
        solution: vis ? [`보이는 모서리 9개: 가로·세로·높이가 3개씩`, `(${d.a} + ${d.c} + ${d.h}) × 3 = ${ans}(cm)`] : [`보이지 않는 모서리 3개: 가로·세로·높이가 하나씩`, `${d.a} + ${d.c} + ${d.h} = ${ans}(cm)`],
        key: `u5s2-hidden|${d.a}|${d.h}|${d.c}|${vis}`,
        data: { d, vis },
      };
    },
    verify(p) { const { d, vis } = p.data; return Number(p.answer.value) === (vis ? 3 : 1) * (d.a + d.h + d.c); },
  });

  const tMissing = tpl({
    id: 'u5s2-missing', sub: 'u5s2', style: 'A', styleName: '빠진 모서리 찾기', levels: [1, 4],
    build(r) {
      const all = B.EDGES.map((e) => e[0] + e[1]);
      const miss = r.pick(all);
      const others = r.sample(all.filter((x) => x !== miss), 3);
      const dd = drawDims({ a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) });
      return {
        text: '직육면체의 겨냥도를 그리다가 모서리 하나를 빠뜨렸어요. 빠뜨린 모서리를 고르세요.',
        figure: B.boxFig(dd, { skip: [miss], labels: true, scale: 34 }),
        answer: { type: 'choice', options: [miss, ...others].map((x, i) => Object.assign({ text: `모서리 ${x}`, correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'condition', msg: `모서리 ${x}은(는) 그려져 있어요. 꼭짓점마다 모서리가 3개씩 모이는지 확인해요.`.replace(/(.)은\(는\)/, (m, c) => j(c, '은/는')) } })) },
        hints: ['직육면체의 꼭짓점에는 모서리가 3개씩 모여요.', '꼭짓점마다 모인 선을 세어서 2개뿐인 꼭짓점을 찾아요.', `점 ${miss[0]}과 점 ${miss[1]}에는 모서리가 2개뿐이에요.`],
        solution: [`빠뜨린 모서리: 모서리 ${miss}`, B.hiddenEdge([miss[0], miss[1]]) ? '보이지 않는 모서리라서 점선으로 그려요.' : '보이는 모서리라서 실선으로 그려요.'],
        key: `u5s2-missing|${miss}|${others.join(',')}`,
        data: { miss },
      };
    },
    verify(p) { const drawn = p.figure.segs.length; return drawn === 11 && p.answer.options[p.answer.value].text === `모서리 ${p.data.miss}`; },
  });

  const tDash = tpl({
    id: 'u5s2-dash', sub: 'u5s2', style: 'A', styleName: '점선으로 그릴 모서리', levels: [1, 4],
    build(r) {
      const visible = B.EDGES.filter((e) => !B.hiddenEdge(e)).map((e) => e[0] + e[1]);
      const nearV = ['ㄱㄴ', 'ㄴㅂ', 'ㅂㅅ', 'ㄱㄹ', 'ㄹㅇ', 'ㅇㅅ'];
      const wrong = r.sample(nearV, 3);
      const opts = r.shuffle([...HID, ...wrong]);
      const dd = drawDims({ a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) });
      return {
        text: '직육면체의 겨냥도에 보이지 않는 모서리를 그려 넣으려고 해요. 점선으로 그려야 할 모서리를 모두 고르세요.',
        figure: B.boxFig(dd, { skip: HID, labels: true, scale: 34 }),
        answer: { type: 'multi', options: opts.map((x) => ({ text: `모서리 ${x}`, key: x, correct: HID.includes(x) })) },
        keepOrder: true,
        patterns: [],
        hints: ['보이지 않는 꼭짓점은 하나예요. 앞에서 보았을 때 뒤쪽 아래에 숨은 꼭짓점을 찾아요.', '숨은 꼭짓점 ㅁ에서 나오는 모서리 3개가 보이지 않는 모서리예요.', '모서리 ㄱㅁ, ㅁㅂ, ㅁㅇ'],
        solution: ['보이지 않는 꼭짓점: ㅁ', '점선으로 그릴 모서리: ㄱㅁ, ㅁㅂ, ㅁㅇ'],
        key: `u5s2-dash|${opts.join(',')}`,
        data: { visible },
      };
    },
    verify(p) { return p.answer.options.every((o, i) => HID.includes(o.key || o.text.slice(4)) === p.answer.values.includes(i)); },
  });

  const tCube9 = tpl({
    id: 'u5s2-cube', sub: 'u5s2', style: 'B', styleName: '정육면체의 겨냥도', levels: [1, 4],
    build(r, lv) {
      const a = r.int(2, lv <= 2 ? 9 : 20);
      const inv = lv >= 3 && r.chance(0.5);
      const vis = r.chance(0.6);
      const k = vis ? 9 : 3;
      if (inv) {
        return {
          text: `정육면체의 겨냥도에서 ${vis ? '보이는' : '보이지 않는'} 모서리의 길이의 합이 ${cm(k * a)}예요. 정육면체의 한 모서리는 몇 cm인가요?`,
          figure: B.boxFig(drawDims({ a: 4, h: 4, c: 4 })),
          answer: { type: 'num', value: String(a), unit: 'cm' },
          patterns: [12, vis ? 3 : 9].filter((m) => (k * a) % m === 0).map((m) => ({ value: String((k * a) / m), cause: 'concept', msg: `${vis ? '보이는' : '보이지 않는'} 모서리는 ${k}개예요.` })),
          hints: [`${vis ? '보이는' : '보이지 않는'} 모서리는 ${k}개이고, 정육면체는 모서리 길이가 모두 같아요.`, `(한 모서리) × ${k} = ${k * a}`, `${k * a} ÷ ${k} = ${a}`],
          solution: [`${vis ? '보이는' : '보이지 않는'} 모서리 ${k}개`, `${k * a} ÷ ${k} = ${a}(cm)`],
          key: `u5s2-cube|inv|${a}|${vis}`,
          data: { want: a },
        };
      }
      return {
        text: `한 모서리가 ${cm(a)}인 정육면체의 겨냥도에서 ${vis ? '보이는' : '보이지 않는'} 모서리의 길이의 합은 몇 cm인가요?`,
        figure: B.boxFig(drawDims({ a: 4, h: 4, c: 4 }), { lens: { a: cm(a) } }),
        answer: { type: 'num', value: String(k * a), unit: 'cm' },
        patterns: [{ value: String(12 * a), cause: 'condition', msg: '모든 모서리의 길이의 합을 구했어요.' }, { value: String((12 - k) * a), cause: 'concept', msg: vis ? '보이지 않는 모서리를 더했어요.' : '보이는 모서리를 더했어요.' }],
        hints: [`${vis ? '보이는' : '보이지 않는'} 모서리는 ${k}개예요.`, '정육면체는 모서리의 길이가 모두 같아요.', `${a} × ${k} = ${k * a}`],
        solution: [`${vis ? '보이는' : '보이지 않는'} 모서리 ${k}개`, `${a} × ${k} = ${k * a}(cm)`],
        key: `u5s2-cube|${a}|${vis}`,
        data: { want: k * a },
      };
    },
    verify(p) { return Number(p.answer.value) === p.data.want; },
  });

  const OX2 = [
    { s: '겨냥도에서 보이지 않는 모서리는 점선으로 그려요.', t: true, why: '보이는 모서리는 실선, 보이지 않는 모서리는 점선으로 그려서 모양을 잘 알 수 있게 해요.', wrong: ['점선이 더 그리기 쉬우니까요.', '모든 모서리를 점선으로 그리니까요.'] },
    { s: '직육면체의 겨냥도에서 보이는 면은 4개예요.', t: false, why: '보이는 면은 3개, 보이지 않는 면도 3개예요.', wrong: ['앞, 위, 옆, 뒤가 보이니까요.', '면은 6개라서 절반보다 많이 보이니까요.'] },
    { s: '직육면체의 겨냥도에서 보이지 않는 꼭짓점은 1개예요.', t: true, why: '뒤쪽 아래의 꼭짓점 하나만 보이지 않고 나머지 7개는 보여요.', wrong: ['꼭짓점은 모두 보이니까요.', '보이지 않는 면이 3개라서요.'] },
    { s: '직육면체의 겨냥도에서 보이는 모서리는 6개예요.', t: false, why: '보이는 모서리는 실선 9개예요. 보이지 않는 모서리는 3개예요.', wrong: ['면이 6개라서요.', '보이는 면 3개에 모서리가 2개씩이라서요.'] },
  ];
  const tLine2 = TB.lineFind({
    id: 'u5s2-line', unit: 5, sub: 'u5s2', levels: [1, 4],
    gen(r) {
      const a = r.int(3, 12), c = r.int(2, 10), h = r.int(2, 10);
      if (new Set([a, c, h]).size < 3) return null;
      const s = a + c + h;
      const L = ['보이는 모서리는 9개예요.', '가로, 세로, 높이가 3개씩이에요.', `(${a} + ${c} + ${h}) × 3 = ${3 * s}(cm)`];
      const kind = r.int(0, 2);
      const bad = [
        { i: 0, line: '보이는 모서리는 12개예요.', msg: '모서리 12개 중 점선 3개는 보이지 않아요. 보이는 모서리는 9개예요.', after: ['가로, 세로, 높이가 4개씩이에요.', `(${a} + ${c} + ${h}) × 4 = ${4 * s}(cm)`] },
        { i: 1, line: '가로, 세로, 높이가 하나씩이에요.', msg: '하나씩인 것은 보이지 않는 모서리예요. 보이는 모서리는 3개씩이에요.', after: [`${a} + ${c} + ${h} = ${s}(cm)`] },
        { i: 2, line: `(${a} + ${c} + ${h}) × 3 = ${3 * s + 3}(cm)`, msg: `${s} × 3 = ${3 * s}이에요.`, after: ['따라서 답은 ' + cm(3 * s + 3) + '예요.'] },
      ][kind];
      return { problem: `"가로 ${cm(a)}, 세로 ${cm(c)}, 높이 ${cm(h)}인 직육면체의 겨냥도에서 보이는 모서리의 길이의 합"을`, verb: '구한', lines: L, bad: { i: bad.i, line: bad.line, msg: bad.msg }, after: bad.after, key: `${a}|${c}|${h}|${kind}` };
    },
  });

  // ======================================================================
  // 소단원 3: 직육면체의 성질
  // ======================================================================
  const FKEYS = Object.keys(B.FACES);
  const tPar = tpl({
    id: 'u5s3-parallel', sub: 'u5s3', style: 'A', styleName: '평행한 면', levels: [1, 4],
    build(r) {
      const f = r.pick(FKEYS), opp = B.OPP[f];
      const adj = r.sample(FKEYS.filter((x) => x !== f && x !== opp), 3);
      const dd = drawDims({ a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) });
      return {
        text: `직육면체에서 ${j(B.faceName(f), '과/와')} 평행한 면을 고르세요.`,
        figure: B.boxFig(dd, { labels: true, shade: f, scale: 34 }),
        answer: { type: 'choice', options: [opp, ...adj].map((x, i) => Object.assign({ text: B.faceName(x), key: x, correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'concept', msg: `${j(B.faceName(x), '은/는')} ${j(B.faceName(f), '과/와')} 모서리에서 만나요. 만나는 면은 수직이에요.` } })) },
        hints: ['평행한 면은 계속 늘여도 만나지 않는 면, 서로 마주 보는 면이에요.', `색칠한 ${B.faceName(f)}과 모서리를 함께 쓰는 면은 평행하지 않아요.`, `마주 보는 면: ${B.faceName(opp)}`],
        solution: [`${B.faceName(f)}과 마주 보는 면은 ${B.faceName(opp)}이에요.`, '마주 보는 면은 서로 평행해요.'],
        key: `u5s3-parallel|${f}|${adj.join(',')}`,
        data: { f },
      };
    },
    verify(p) { return p.answer.options[p.answer.value].key === B.OPP[p.data.f]; },
  });

  const tPerp = tpl({
    id: 'u5s3-perp', sub: 'u5s3', style: 'A', styleName: '수직인 면', levels: [1, 4],
    build(r) {
      const f = r.pick(FKEYS), opp = B.OPP[f];
      const opts = r.shuffle(FKEYS.filter((x) => x !== f));
      const adj = opts.filter((x) => x !== opp);
      const dd = drawDims({ a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) });
      return {
        text: `직육면체에서 ${j(B.faceName(f), '과/와')} 수직인 면을 모두 고르세요.`,
        figure: B.boxFig(dd, { labels: true, shade: f, scale: 34 }),
        answer: { type: 'multi', options: opts.map((x) => ({ text: B.faceName(x), key: x, correct: x !== opp })) },
        keepOrder: true,
        patterns: [{ value: opts, cause: 'concept', msg: `${j(B.faceName(opp), '은/는')} ${j(B.faceName(f), '과/와')} 마주 보는 면이라서 평행해요. 수직인 면은 4개예요.` }],
        hints: ['한 면과 만나는 면은 그 면과 수직이에요.', '한 면과 수직인 면은 4개예요. 마주 보는 면 하나만 빼요.', `수직인 면: ${adj.map(B.faceName).join(', ')}`],
        solution: [`${B.faceName(f)}과 마주 보는 ${B.faceName(opp)}만 평행하고, 나머지 4개 면은 수직이에요.`],
        key: `u5s3-perp|${f}|${opts.join(',')}`,
        data: { f },
      };
    },
    verify(p) { return p.answer.options.every((o, i) => (o.key !== B.OPP[p.data.f]) === p.answer.values.includes(i)); },
  });

  const PROPS = [
    { q: '직육면체에서 서로 평행한 면은 모두 몇 쌍인가요?', v: 3, w: [[6, '면의 수예요. 평행한 면은 2개가 한 쌍이에요.'], [4, '한 면과 수직인 면의 수예요.']] },
    { q: '직육면체에서 한 면과 수직인 면은 모두 몇 개인가요?', v: 4, w: [[5, '마주 보는 면은 평행해서 수직이 아니에요.'], [2, '한 면은 네 변에서 각각 다른 면과 만나요.']] },
    { q: '직육면체에서 한 꼭짓점에서 만나는 면은 모두 몇 개인가요?', v: 3, w: [[4, '꼭짓점 하나를 짚고 그 점에 닿는 면을 세어 봐요.'], [2, '꼭짓점에서는 면 3개가 만나요.']] },
    { q: '직육면체에서 한 꼭짓점에서 만나는 모서리는 모두 몇 개인가요?', v: 3, w: [[4, '꼭짓점마다 가로·세로·높이 방향 모서리가 하나씩 모여요.'], [2, '꼭짓점에서 만나는 모서리는 3개예요.']] },
    { q: '직육면체에서 한 모서리와 길이가 같은 모서리는 그 모서리를 빼고 몇 개 더 있나요?', v: 3, w: [[4, '자기 자신은 빼요. 같은 길이의 모서리는 모두 4개예요.'], [11, '길이가 같은 모서리는 4개씩이에요.']] },
    { q: '직육면체에서 한 모서리에서 만나는 면은 모두 몇 개인가요?', v: 2, w: [[3, '모서리는 면과 면이 만나는 선분이에요. 두 면이 만나요.'], [4, '모서리 하나에는 면 2개가 붙어 있어요.']] },
  ];
  const tProps = tpl({
    id: 'u5s3-count', sub: 'u5s3', style: 'A', styleName: '성질 알아보기', levels: [1, 4],
    build(r) {
      const i = r.int(0, PROPS.length - 1);
      const q = PROPS[i];
      return {
        text: q.q,
        figure: B.boxFig(drawDims({ a: 6, h: 4, c: 4 })),
        answer: { type: 'num', value: String(q.v) },
        patterns: q.w.map(([v, m]) => ({ value: String(v), cause: 'concept', msg: m })),
        hints: ['직육면체는 면 6개, 모서리 12개, 꼭짓점 8개예요.', '그림에서 한 곳을 손가락으로 짚고 직접 세어 봐요.', `세어 보면 ${q.v}이에요.`.replace(/(\d)이에요/, (m, d) => j(d, '이에요/예요'))],
        solution: [`${q.v}이에요.`.replace(/(\d)이에요/, (m, d) => j(d, '이에요/예요'))],
        key: `u5s3-count|${i}`,
        data: { i },
      };
    },
    verify(p) { return Number(p.answer.value) === PROPS[p.data.i].v; },
  });

  const FACE_DIM2 = { top: ['a', 'c'], bottom: ['a', 'c'], front: ['a', 'h'], back: ['a', 'h'], left: ['c', 'h'], right: ['c', 'h'] };
  const tPerpSum = tpl({
    id: 'u5s3-measure', sub: 'u5s3', style: 'A', styleName: '평행한 면·수직인 면의 길이', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const d = dims(r, lv, false);
      const f = r.pick(['top', 'front', 'right']);
      const kind = r.pick(['oppPerim', 'perpPerimSum']);
      const [x, y] = FACE_DIM2[B.OPP[f]];
      let ans, text, pats, hint;
      if (kind === 'oppPerim') {
        ans = 2 * (d[x] + d[y]);
        text = `직육면체에서 색칠한 면과 평행한 면의 둘레는 몇 cm인가요?`;
        pats = [{ value: String(d[x] * d[y]), cause: 'concept', msg: '넓이를 구했어요. 둘레는 네 변의 길이의 합이에요.' }, { value: String(d[x] + d[y]), cause: 'condition', msg: '두 변만 더했어요. 둘레는 네 변이에요.' }];
        hint = `평행한 면은 색칠한 면과 모양과 크기가 같아요. (${d[x]} + ${d[y]}) × 2 = ${ans}`;
      } else {
        // 색칠한 면과 수직인 4개 면이 색칠한 면과 만나는 모서리의 길이의 합 = 색칠한 면의 둘레
        const [p, q] = FACE_DIM2[f];
        ans = 2 * (d[p] + d[q]);
        text = `직육면체에서 색칠한 면과 수직인 면 4개가 색칠한 면과 만나는 모서리의 길이를 모두 더하면 몇 cm인가요?`;
        pats = [{ value: String(4 * (d.a + d.h + d.c)), cause: 'condition', msg: '모든 모서리를 더했어요. 색칠한 면의 테두리 모서리 4개만 더해요.' }, { value: String(d[p] + d[q]), cause: 'condition', msg: '모서리 4개를 모두 더해야 해요.' }];
        hint = `만나는 모서리는 색칠한 면의 네 변이에요. (${d[p]} + ${d[q]}) × 2 = ${ans}`;
      }
      return {
        text,
        figure: B.boxFig(drawDims(d), { lens: lensOf(d), shade: f }),
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: pats.filter((pt) => Number(pt.value) !== ans),
        hints: [kind === 'oppPerim' ? '색칠한 면과 마주 보는 면이 평행한 면이에요.' : '색칠한 면과 만나는 면 4개가 수직인 면이에요.', kind === 'oppPerim' ? '마주 보는 면은 모양과 크기가 같아요.' : '수직인 면과 색칠한 면이 만나는 곳은 색칠한 면의 테두리예요.', hint],
        solution: [hint],
        key: `u5s3-measure|${d.a}|${d.h}|${d.c}|${f}|${kind}`,
        data: { want: ans },
      };
    },
    verify(p) { return Number(p.answer.value) === p.data.want; },
  });

  const tMeet = tpl({
    id: 'u5s3-meet', sub: 'u5s3', style: 'A', styleName: '두 면이 만나는 모서리', levels: [1, 4],
    build(r) {
      let f1, f2;
      do { [f1, f2] = r.sample(FKEYS, 2); } while (B.OPP[f1] === f2);
      const e = B.sharedEdge(f1, f2);
      const right = e.join('');
      const all = B.EDGES.map((x) => x[0] + x[1]);
      const rk = all.find((x) => x === right || x === right[1] + right[0]);
      const others = r.sample(all.filter((x) => x !== rk), 3);
      const dd = drawDims({ a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) });
      return {
        text: `직육면체에서 ${j(B.faceName(f1), '과/와')} ${B.faceName(f2)}이 만나는 모서리를 고르세요.`,
        figure: B.boxFig(dd, { labels: true, scale: 34 }),
        answer: { type: 'choice', options: [rk, ...others].map((x, i) => Object.assign({ text: `모서리 ${x}`, correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'condition', msg: `두 면의 이름에 모두 들어 있는 점 2개를 찾아요. ${B.faceName(f1)}, ${B.faceName(f2)}` } })) },
        hints: ['두 면이 만나는 모서리는 두 면에 모두 들어 있는 선분이에요.', `${B.FACES[f1].join(', ')}과 ${B.FACES[f2].join(', ')}에 모두 있는 점을 찾아요.`, `같이 들어 있는 점: ${e.join(', ')}`],
        solution: [`두 면에 모두 들어 있는 점은 ${e.join(', ')}이에요.`, `만나는 모서리: 모서리 ${rk}`],
        key: `u5s3-meet|${f1}|${f2}|${others.join(',')}`,
        data: { f1, f2 },
      };
    },
    verify(p) { const e = B.sharedEdge(p.data.f1, p.data.f2); const t = p.answer.options[p.answer.value].text.slice(4); return t.includes(e[0]) && t.includes(e[1]); },
  });

  const tBase = tpl({
    id: 'u5s3-base', sub: 'u5s3', style: 'A', styleName: '밑면과 옆면', levels: [1, 4],
    build(r) {
      const f = r.pick(FKEYS), opp = B.OPP[f];
      const sides = FKEYS.filter((x) => x !== f && x !== opp);
      const shown = r.sample(sides, 3);
      const dd = drawDims({ a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) });
      return {
        text: `직육면체에서 ${j(B.faceName(f), '을/를')} 밑면으로 할 때, 옆면이 아닌 것을 고르세요.`,
        figure: B.boxFig(dd, { labels: true, scale: 34 }),
        answer: { type: 'choice', options: [opp, ...shown].map((x, i) => Object.assign({ text: B.faceName(x), correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'concept', msg: `${j(B.faceName(x), '은/는')} 밑면 ${j(B.faceName(f), '과/와')} 만나는 면이라서 옆면이에요.` } })) },
        hints: ['평행한 두 면이 밑면이에요. 밑면과 수직인 면이 옆면이에요.', `${B.faceName(f)}과 평행한 면도 밑면이에요.`, `다른 밑면: ${B.faceName(opp)}`],
        solution: [`${B.faceName(f)}과 평행한 ${B.faceName(opp)}도 밑면이라서 옆면이 아니에요.`, `옆면은 ${sides.map(B.faceName).join(', ')}이에요.`],
        key: `u5s3-base|${f}|${shown.join(',')}`,
        data: { f },
      };
    },
    verify(p) { return p.answer.options[p.answer.value].text === B.faceName(B.OPP[p.data.f]); },
  });

  // 주사위: 마주 보는 면의 눈의 합은 7
  const tDice = tpl({
    id: 'u5s3-dice', sub: 'u5s3', style: 'B', styleName: '주사위', levels: [1, 4],
    build(r, lv) {
      const pairs = r.shuffle([[1, 6], [2, 5], [3, 4]]).map((p) => (r.chance(0.5) ? p : [p[1], p[0]]));
      const vis = pairs.map((p) => p[0]);
      const hid = pairs.map((p) => p[1]);
      const ask = lv <= 2 ? 'one' : 'sum';
      const dd = drawDims({ a: 4, h: 4, c: 4 });
      const fig = B.boxFig(dd, { scale: 40 });
      const P = (n) => B.proj(B.V[n], dd);
      const center = (f) => { const ps = B.FACES[f].map(P); return [ps.reduce((s, p) => s + p[0], 0) / 4, ps.reduce((s, p) => s + p[1], 0) / 4]; };
      fig.texts = [{ p: center('front'), t: String(vis[0]), cls: 'tx' }, { p: center('top'), t: String(vis[1]), cls: 'tx' }, { p: center('right'), t: String(vis[2]), cls: 'tx' }];
      if (ask === 'one') {
        const k = r.int(0, 2);
        const where = ['앞면', '윗면', '오른쪽 옆면'][k];
        return {
          text: `주사위는 마주 보는 면의 눈의 수를 더하면 7이에요. ${where}과 평행한 면의 눈의 수는 얼마인가요?`,
          figure: fig,
          answer: { type: 'num', value: String(hid[k]) },
          patterns: [{ value: String(vis[k]), cause: 'concept', msg: '평행한 면은 마주 보는 면이에요. 7에서 빼요.' }, ...vis.filter((_, i) => i !== k).map((v) => ({ value: String(v), cause: 'concept', msg: '이 면은 수직인 면이에요. 마주 보는 면을 찾아요.' }))].filter((pt) => Number(pt.value) !== hid[k]),
          hints: ['평행한 면은 마주 보는 면이에요.', '주사위에서 마주 보는 두 면의 눈의 합은 7이에요.', `7 - ${vis[k]} = ${hid[k]}`],
          solution: [`${where}의 눈 ${vis[k]}`, `마주 보는 면: 7 - ${vis[k]} = ${hid[k]}`],
          key: `u5s3-dice|one|${vis.join('')}|${k}`,
          data: { want: hid[k] },
        };
      }
      const ans = sum(hid);
      return {
        text: '주사위는 마주 보는 면의 눈의 수를 더하면 7이에요. 그림에서 보이지 않는 세 면의 눈의 수의 합은 얼마인가요?',
        figure: fig,
        answer: { type: 'num', value: String(ans) },
        patterns: [{ value: String(sum(vis)), cause: 'concept', msg: '보이는 세 면을 더했어요.' }, { value: '21', cause: 'condition', msg: '21은 모든 면의 합이에요. 보이는 세 면을 빼야 해요.' }].filter((pt) => Number(pt.value) !== ans),
        hints: ['보이지 않는 세 면은 보이는 세 면과 각각 마주 보는 면이에요.', `7 - ${vis[0]} = ${hid[0]}, 7 - ${vis[1]} = ${hid[1]}, 7 - ${vis[2]} = ${hid[2]}`, `${hid.join(' + ')} = ${ans}`],
        solution: [`보이지 않는 면: ${hid.join(', ')}`, `${hid.join(' + ')} = ${ans}  (또는 21 - ${sum(vis)} = ${ans})`],
        key: `u5s3-dice|sum|${vis.join('')}`,
        data: { want: ans },
      };
    },
    verify(p) { return Number(p.answer.value) === p.data.want; },
  });

  const OX3 = [
    { s: '직육면체에서 서로 평행한 면은 3쌍이에요.', t: true, why: '마주 보는 면끼리 평행하고, 면이 6개라서 3쌍이에요.', wrong: ['면이 6개라서 6쌍이에요.', '한 면과 평행한 면이 3개라서요.'] },
    { s: '직육면체에서 한 면과 수직인 면은 5개예요.', t: false, why: '마주 보는 면은 평행해서 빼야 해요. 수직인 면은 4개예요.', wrong: ['자기 자신을 뺀 나머지는 모두 수직이니까요.', '면이 6개라서요.'] },
    { s: '직육면체의 밑면은 항상 아래에 있는 면이에요.', t: false, why: '평행한 두 면을 밑면이라고 해요. 위치와 상관없이 어느 평행한 두 면이든 밑면이 될 수 있어요.', wrong: ['밑면은 바닥에 닿는 면이니까요.', '밑면은 하나뿐이니까요.'] },
    { s: '직육면체에서 옆면은 밑면과 수직이에요.', t: true, why: '밑면과 수직인 면을 옆면이라고 해요.', wrong: ['옆면은 밑면과 평행하니까요.', '옆면은 밑면과 크기가 같으니까요.'] },
  ];

  const tLine3 = TB.lineFind({
    id: 'u5s3-line', unit: 5, sub: 'u5s3', levels: [1, 4],
    gen(r) {
      const pairs = r.shuffle([[1, 6], [2, 5], [3, 4]]).map((q) => (r.chance(0.5) ? q : [q[1], q[0]]));
      const v = pairs.map((q) => q[0]), h = pairs.map((q) => q[1]);
      const tot = sum(h);
      const L = ['마주 보는 두 면의 눈의 합은 7이에요.', `보이지 않는 면의 눈: ${h.join(', ')}`, `${h.join(' + ')} = ${tot}`];
      const kind = r.int(0, 2);
      const bad = [
        { i: 0, line: '마주 보는 두 면의 눈의 합은 6이에요.', msg: '주사위에서 마주 보는 두 면의 눈의 합은 7이에요.', after: [`보이지 않는 면의 눈: ${v.map((x) => 6 - x).join(', ')}`, `${v.map((x) => 6 - x).join(' + ')} = ${sum(v.map((x) => 6 - x))}`] },
        { i: 1, line: `보이지 않는 면의 눈: ${v.join(', ')}`, msg: `보이는 면의 눈을 그대로 썼어요. 7에서 빼야 해요: ${h.join(', ')}`, after: [`${v.join(' + ')} = ${sum(v)}`] },
        { i: 2, line: `${h.join(' + ')} = ${tot + 1}`, msg: `${h.join(' + ')} = ${tot}이에요.`, after: [] },
      ][kind];
      if (kind === 2) bad.after = [`따라서 ${tot + 1}이에요.`];
      return { problem: `"보이는 세 면의 눈이 ${v.join(', ')}인 주사위에서 보이지 않는 세 면의 눈의 합"을`, verb: '구한', lines: L, bad: { i: bad.i, line: bad.line, msg: bad.msg }, after: bad.after, key: `${v.join('')}|${kind}` };
    },
  });

  // ======================================================================
  // 소단원 4·5: 전개도
  // ======================================================================
  // 전개도 하나 만들기: 정육면체(cube) 또는 직육면체. 면 이름(가~바)과 점 이름(ㄱ~ㅎ)
  function makeNet(r, cube, lv) {
    const base = r.pick(B.NETS);
    const cells = B.orient(base, r.int(0, 7));
    const folded = B.fold(cells);
    let L;
    if (cube) L = { x: 1, y: 1, z: 1 };
    else {
      const v = r.shuffle([r.int(2, 3), r.int(4, 5), r.int(6, 7)]);
      if (lv <= 2) v.sort((a, b) => a - b);
      L = { x: v[0], y: v[1], z: v[2] };
    }
    const rects = B.layout(folded, L);
    if (!rects) return null;
    const ordered = rects.slice().sort((p, q) => p.y - q.y || p.x - q.x);
    ordered.forEach((rc, i) => { rc.name = GA[i]; });
    const pts = B.netPoints(rects).sort((p, q) => p.p[1] - q.p[1] || p.p[0] - q.p[0]);
    pts.forEach((p, i) => { p.name = LB[i]; });
    const segs = B.boundary(rects);
    const W = Math.max(...rects.map((x) => x.x + x.w)), H = Math.max(...rects.map((x) => x.y + x.h));
    return { rects, pts, segs, L, W, H, cube, cells };
  }
  const ptAt = (N, p) => N.pts.find((q) => Math.abs(q.p[0] - p[0]) < 1e-9 && Math.abs(q.p[1] - p[1]) < 1e-9);
  const segName = (N, s) => `선분 ${ptAt(N, s.a).name}${ptAt(N, s.b).name}`;
  const lenOf = (N, s) => s.len; // 직육면체 전개도는 칸 단위 = cm
  // 전개도 그림: 면은 색, 바깥 둘레는 실선, 접는 선(잘리지 않은 모서리)은 점선
  function netFig(N, o = {}) {
    const u = o.scale || Math.min(N.cube ? 72 : 46, 420 / Math.max(N.W, N.H));
    const segs = N.segs.map((s) => ({ a: s.a, b: s.b, cls: 'box' }));
    const seen = new Set();
    for (const rc of N.rects) {
      for (const q of N.rects) {
        if (q === rc) continue;
        const eq = (x, y) => Math.abs(x - y) < 1e-9;
        let a = null, b = null;
        if (eq(rc.x + rc.w, q.x) && eq(rc.y, q.y)) { a = [q.x, q.y]; b = [q.x, q.y + q.h]; }
        if (eq(rc.y + rc.h, q.y) && eq(rc.x, q.x)) { a = [q.x, q.y]; b = [q.x + q.w, q.y]; }
        if (a) { const k = a.concat(b).join(','); if (!seen.has(k)) { seen.add(k); segs.push({ a, b, cls: 'dash' }); } }
      }
    }
    const f = { type: 'geo', polys: N.rects.map((rc) => ({ pts: [[rc.x, rc.y], [rc.x + rc.w, rc.y], [rc.x + rc.w, rc.y + rc.h], [rc.x, rc.y + rc.h]], cls: o.shade && o.shade.includes(rc.name) ? 'shape-b' : 'netface' })), segs, scale: u, pad: 0.6 };
    if (o.faces !== false) f.texts = N.rects.map((rc) => ({ p: [rc.x + rc.w / 2, rc.y + rc.h / 2], t: o.faceText ? o.faceText(rc) : rc.name }));
    if (o.points) { const c = [N.W / 2, N.H / 2]; f.labels = N.pts.filter((p) => o.points === true || o.points.includes(p.name)).map((p) => ({ p: p.p, t: p.name, c, d: 0.32 })); }
    if (o.sides) f.sides = o.sides;
    return f;
  }
  const cellFig = (cells, scale = 16) => ({ type: 'geo', polys: cells.map(([x, y]) => ({ pts: [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]], cls: 'netface' })), segs: cells.flatMap(([x, y]) => [[[x, y], [x + 1, y]], [[x + 1, y], [x + 1, y + 1]], [[x + 1, y + 1], [x, y + 1]], [[x, y + 1], [x, y]]]).map(([a, b]) => ({ a, b, cls: 'box' })), scale, pad: 0.3 });
  const what = (cube) => (cube ? '정육면체' : '직육면체');

  function oppTpl(sub, cube) {
    return tpl({
      id: sub + '-opposite', sub, style: 'A', styleName: '마주 보는 면', levels: [1, 4],
      build(r, lv) {
        const N = makeNet(r, cube, lv);
        if (!N) return null;
        const f = r.pick(N.rects);
        const opp = N.rects.find((x) => x.face === B.DOPP[f.face]);
        const others = N.rects.filter((x) => x !== f).map((x) => x.name).sort();
        return {
          text: `${what(cube)}의 전개도를 접었을 때 면 ${j(f.name, '과/와')} 평행한 면을 고르세요.`,
          figure: netFig(N, { shade: [f.name] }),
          answer: { type: 'choice', options: others.map((nm) => Object.assign({ text: `면 ${nm}`, correct: nm === opp.name }, nm === opp.name ? {} : { pattern: { cause: 'concept', msg: `면 ${nm}은(는) 접으면 면 ${f.name}과 만나요(수직). 평행한 면은 만나지 않는 면이에요.`.replace(/면 (.)은\(는\)/, (m, c) => `면 ${j(c, '은/는')}`) } })) },
          keepOrder: true,
          hints: ['평행한 면은 접었을 때 마주 보는 면이에요. 붙어 있는 면은 수직이에요.', '한 줄로 이어진 세 면에서 첫째 면과 셋째 면은 마주 봐요.', `면 ${f.name}과 마주 보는 면: 면 ${opp.name}`],
          solution: [`면 ${f.name}과 이웃한 면 4개는 수직이에요.`, `남은 면 ${opp.name}이 평행한 면이에요.`],
          key: `${sub}-opposite|${N.cells.map((c) => c.join(',')).join(' ')}|${JSON.stringify(N.L)}|${f.name}`,
          data: { rects: N.rects.map((x) => ({ name: x.name, face: x.face })), f: f.name },
        };
      },
      verify(p) {
        const R = p.data.rects, fx = R.find((x) => x.name === p.data.f);
        const want = R.find((x) => x.face === B.DOPP[fx.face]).name;
        return p.answer.options[p.answer.value].text === `면 ${want}`;
      },
    });
  }
  // 직육면체 전개도에 길이 몇 개 적기 (가로·세로·높이 하나씩)
  function sideLabels(N, r, skip) {
    const out = [];
    const used = new Set();
    for (const s of r.shuffle(N.segs)) {
      if (skip && skip.includes(s)) continue;
      if (used.has(s.len)) continue;
      used.add(s.len);
      out.push({ a: s.a, b: s.b, t: cm(s.len), c: [N.W / 2, N.H / 2], d: 0.55 });
      if (used.size === 3) break;
    }
    return out;
  }

  function perpTpl(sub, cube) {
    return tpl({
      id: sub + '-perp', sub, style: 'A', styleName: '수직인 면', levels: [1, 4],
      build(r, lv) {
        const N = makeNet(r, cube, lv);
        if (!N) return null;
        const f = r.pick(N.rects);
        const opp = N.rects.find((x) => x.face === B.DOPP[f.face]);
        const others = N.rects.filter((x) => x !== f).sort((p, q) => (p.name < q.name ? -1 : 1));
        return {
          text: `${what(cube)}의 전개도를 접었을 때 면 ${j(f.name, '과/와')} 수직인 면을 모두 고르세요.`,
          figure: netFig(N, { shade: [f.name] }),
          answer: { type: 'multi', options: others.map((x) => ({ text: `면 ${x.name}`, key: x.name, correct: x !== opp })) },
          keepOrder: true,
          patterns: [{ value: others.map((x) => x.name), cause: 'concept', msg: `면 ${opp.name}은 면 ${f.name}과 마주 보는 면이라서 평행해요. 수직인 면은 4개예요.` }],
          hints: ['접었을 때 만나는 면이 수직인 면이에요. 한 면과 수직인 면은 4개예요.', `면 ${f.name}과 마주 보는 면 하나만 빼면 돼요.`, `마주 보는 면: 면 ${opp.name}`],
          solution: [`면 ${f.name}과 평행한 면은 면 ${opp.name}이에요.`, `나머지 ${others.filter((x) => x !== opp).map((x) => '면 ' + x.name).join(', ')}이 수직이에요.`],
          key: `${sub}-perp|${N.cells.map((c) => c.join(',')).join(' ')}|${JSON.stringify(N.L)}|${f.name}`,
          data: { rects: N.rects.map((x) => ({ name: x.name, face: x.face })), f: f.name },
        };
      },
      verify(p) {
        const R = p.data.rects, fx = R.find((x) => x.name === p.data.f);
        return p.answer.options.every((o, i) => (R.find((x) => x.name === o.key).face !== B.DOPP[fx.face]) === p.answer.values.includes(i));
      },
    });
  }

  // ---- 만나는 점·맞닿는 선분: "지퍼처럼 닫기"로 한 단계씩 설명 ----
  //   꺾인 곳(오목한 곳)에서 양쪽 선분이 먼저 맞닿고, 그 바깥 선분끼리 차례로 맞닿아요.
  const CN = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];
  function zipInfo(N) {
    const Z = B.zipper(N.segs);
    if (!Z) return null;
    const nm = (p) => ptAt(N, p).name;
    const step = (z, i) => {
      const c = nm(z.corner[0]) === nm(z.corner[1]) ? `점 ${nm(z.corner[0])}` : `점 ${j(nm(z.corner[0]), '과/와')} 점 ${nm(z.corner[1])}이 만난 곳`;
      return `${CN[i]} ${c}에서 ${j(segName(N, z.s), '과/와')} ${segName(N, z.t)}이 맞닿아요. → 점 ${j(nm(z.ends[0]), '과/와')} 점 ${nm(z.ends[1])}이 만나요.`;
    };
    // 단계 k까지 가는 길: 안쪽에서 먼저 붙인 단계들 + k
    const chain = (k) => [...Z[k].inside, k].sort((a, b) => a - b);
    return { Z, nm, step, chain };
  }
  // 정답 그림: 맞닿는 선분 짝마다 같은 번호, 이번 문제에 쓰는 짝은 색으로
  function zipFig(N, zi, hlSteps, pts) {
    const f = netFig(N, { points: true, faces: false });
    const c = [N.W / 2, N.H / 2];
    const on = new Set(hlSteps);
    f.segs = f.segs.map((sg) => {
      const k = zi.Z.findIndex((z) => [z.s, z.t].some((x) => x.a === sg.a && x.b === sg.b));
      return k >= 0 && on.has(k) ? Object.assign({}, sg, { cls: k === hlSteps[hlSteps.length - 1] ? 'hl' : 'hl2' }) : sg;
    });
    f.sides = zi.Z.flatMap((z, k) => (on.has(k) ? [z.s, z.t].map((x) => ({ a: x.a, b: x.b, t: CN[k], c, d: 0.62, cls: 'zip' })) : []));
    if (pts) f.dots = pts.map((p) => ({ p: p.p }));
    f.pad = 1.1;
    return f;
  }
  // 몇 단계 안쪽까지 생각해야 하는지로 난이도 고르기
  const depthOK = (d, lv) => (lv === 1 ? d === 0 : lv === 2 ? d >= 1 && d <= 2 : d >= 2);

  function pointTpl(sub, cube) {
    return tpl({
      id: sub + '-point', sub, style: 'A', styleName: '만나는 점', levels: [1, 4], weak: ['concept'],
      build(r, lv) {
        const N = makeNet(r, cube, lv);
        if (!N) return null;
        const zi = zipInfo(N);
        if (!zi) return null;
        // 단계마다 바로 만나게 되는 두 점 (끝점끼리, 꺾인 곳의 두 점끼리)
        const links = [];
        zi.Z.forEach((z, k) => {
          for (const [a, b] of [[zi.nm(z.ends[0]), zi.nm(z.ends[1])], [zi.nm(z.corner[0]), zi.nm(z.corner[1])]]) if (a !== b) links.push([a, b, k]);
        });
        // 점 p에서 q까지 이어지는 단계들 (가장 짧은 길)
        const path = (p0, q0) => {
          const prev = new Map([[p0, null]]);
          const qu = [p0];
          while (qu.length) {
            const x = qu.shift();
            if (x === q0) break;
            for (const [a, b, k] of links) for (const [u, v] of [[a, b], [b, a]]) if (u === x && !prev.has(v)) { prev.set(v, [x, k]); qu.push(v); }
          }
          const ks = [];
          for (let x = q0; prev.get(x); x = prev.get(x)[0]) ks.push(prev.get(x)[1]);
          return ks;
        };
        const cand = N.pts.filter((p) => N.pts.some((q) => q !== p && q.cube === p.cube)).map((p) => {
          const same = N.pts.filter((q) => q !== p && q.cube === p.cube);
          const ks = [...new Set(same.flatMap((q) => path(p.name, q.name)))];
          const depth = Math.max(...ks.map((k) => zi.Z[k].inside.length));
          return { p, same, ks, depth };
        });
        const pool = cand.filter((x) => depthOK(x.depth, lv));
        const it = r.pick(pool.length ? pool : cand);
        const { p, same } = it;
        const diff = r.sample(N.pts.filter((q) => q !== p && q.cube !== p.cube), 5 - same.length);
        const opts = [...same, ...diff].sort((a, b) => (a.name < b.name ? -1 : 1));
        const steps = [...new Set(it.ks.flatMap((k) => zi.chain(k)))].sort((a, b) => a - b);
        const lines = steps.map((k) => zi.step(zi.Z[k], k));
        return {
          text: `${what(cube)}의 전개도를 접었을 때 점 ${j(p.name, '과/와')} 만나는 점을 모두 고르세요.`,
          figure: netFig(N, { points: true, faces: false }),
          figureAfter: zipFig(N, zi, steps, [p, ...same]),
          answer: { type: 'multi', options: opts.map((q) => ({ text: `점 ${q.name}`, key: q.name, correct: q.cube === p.cube })) },
          keepOrder: true,
          patterns: [],
          hints: [
            '전개도를 지퍼처럼 닫는다고 생각해요. 안쪽으로 꺾인 곳(ㄴ자로 오목한 곳)에서는 꺾인 점 양쪽의 두 선분이 먼저 맞닿아요.',
            `${lines[0]}`,
            lines.length > 1 ? lines.slice(1).join('\n') : `그래서 점 ${p.name}과 만나는 점은 ${same.map((q) => '점 ' + q.name).join(', ')}이에요.`,
          ],
          solution: [...lines, `그래서 점 ${j(p.name, '과/와')} 만나는 점은 ${same.map((q) => '점 ' + q.name).join(', ')}이에요.`, '(정답 그림에서 같은 번호끼리 맞닿는 선분이에요.)'],
          key: `${sub}-point|${N.cells.map((c) => c.join(',')).join(' ')}|${JSON.stringify(N.L)}|${p.name}|${diff.map((q) => q.name).join('')}`,
          data: { pts: N.pts.map((q) => ({ name: q.name, cube: q.cube })), p: p.name },
        };
      },
      verify(p) {
        const P = p.data.pts, me = P.find((q) => q.name === p.data.p);
        return p.answer.options.every((o, i) => (P.find((q) => q.name === o.key).cube === me.cube) === p.answer.values.includes(i));
      },
    });
  }

  function edgeTpl(sub, cube) {
    return tpl({
      id: sub + '-edge', sub, style: 'A', styleName: '맞닿는 선분', levels: [1, 4], weak: ['concept'],
      build(r, lv) {
        const N = makeNet(r, cube, lv);
        if (!N) return null;
        const zi = zipInfo(N);
        if (!zi) return null;
        const pool = zi.Z.map((z, k) => k).filter((k) => depthOK(zi.Z[k].inside.length, lv));
        const k = r.pick(pool.length ? pool : zi.Z.map((z, i) => i));
        const z = zi.Z[k];
        const [s, t] = r.chance(0.5) ? [z.s, z.t] : [z.t, z.s];
        // 헷갈리기 쉬운 보기: 바로 옆 선분, 길이가 같은 선분
        const wrong = r.sample(N.segs.filter((x) => x !== s && x !== t), 3);
        const opts = r.shuffle([t, ...wrong]);
        const steps = zi.chain(k);
        const lines = steps.map((i) => zi.step(zi.Z[i], i));
        return {
          text: `${what(cube)}의 전개도를 접었을 때 ${j(segName(N, s), '과/와')} 맞닿는 선분을 고르세요.`,
          figure: netFig(N, { points: true, faces: false }),
          figureAfter: zipFig(N, zi, steps),
          answer: { type: 'choice', options: opts.map((x) => Object.assign({ text: segName(N, x), correct: x === t }, x === t ? {} : { pattern: { cause: 'concept', msg: '접었을 때 맞닿지 않는 선분이에요. 안쪽으로 꺾인 곳부터 지퍼처럼 닫아 봐요. 꺾인 점 양쪽의 두 선분이 먼저 맞닿고, 그 바깥 선분끼리 차례로 맞닿아요.' } })) },
          keepOrder: true,
          hints: [
            '전개도를 지퍼처럼 닫는다고 생각해요. 안쪽으로 꺾인 곳(ㄴ자로 오목한 곳)에서는 꺾인 점 양쪽의 두 선분이 먼저 맞닿아요.',
            steps.length > 1 ? `먼저 ${lines[0]}` : `${segName(N, s)}이 붙어 있는 꺾인 곳을 찾아요. 꺾인 점의 반대쪽 선분이 맞닿는 선분이에요.`,
            lines.join('\n'),
          ],
          solution: [...lines, `그래서 ${j(segName(N, s), '과/와')} 맞닿는 선분은 ${segName(N, t)}이에요.`, '(정답 그림에서 같은 번호끼리 맞닿는 선분이에요.)'],
          key: `${sub}-edge|${N.cells.map((c) => c.join(',')).join(' ')}|${JSON.stringify(N.L)}|${segName(N, s)}|${opts.map((x) => segName(N, x)).join('')}`,
          data: { want: segName(N, t) },
        };
      },
      verify(p) { return p.answer.options[p.answer.value].text === p.data.want && p.answer.options.filter((o) => o.text === p.data.want).length === 1; },
    });
  }

  // 정육면체 전개도 찾기 (아닌 것 찾기)
  const tIsNet = tpl({
    id: 'u5s4-isnet', sub: 'u5s4', style: 'A', styleName: '전개도 찾기', levels: [1, 4],
    build(r, lv) {
      const findNot = lv >= 3 && r.chance(0.5);
      const pickO = (c) => B.orient(c, r.int(0, 7));
      const good = (findNot ? r.sample(B.NETS, 3) : [r.pick(B.NETS)]).map(pickO);
      const bad = (findNot ? [r.pick(B.NONNETS)] : r.sample(B.NONNETS, 3)).map(pickO);
      const all = [...good.map((c) => ({ c, ok: true })), ...bad.map((c) => ({ c, ok: false }))];
      const right = (x) => (findNot ? !x.ok : x.ok);
      return {
        text: findNot ? '다음 중 정육면체의 전개도가 아닌 것을 고르세요.' : '다음 중 정육면체의 전개도를 고르세요.',
        answer: { type: 'choice', options: all.map((x) => Object.assign({ figure: cellFig(x.c), key: B.canonCells(x.c) + x.c.join(';'), correct: right(x) }, right(x) ? {} : { pattern: { cause: 'concept', msg: x.ok ? '이 그림은 접으면 정육면체가 돼요.' : '이 그림은 접으면 겹치는 면이 생겨서 정육면체가 되지 않아요.' } })) },
        hints: ['정육면체의 전개도는 정사각형 6개로, 접었을 때 겹치는 면이 없어야 해요.', '한 줄로 4칸이 넘게 이어지거나, 한 꼭짓점에 정사각형 4개가 모이면 전개도가 아니에요.', '한 면을 바닥에 두고 나머지 면을 하나씩 세워 본다고 생각해요.'],
        solution: ['접었을 때 6개의 면이 서로 겹치지 않고 정육면체가 되는 것이 전개도예요.'],
        key: `u5s4-isnet|${findNot}|${all.map((x) => x.c.join(';')).join('/')}`,
        data: { findNot },
      };
    },
    verify(p) {
      const ok = p.answer.options.map((o) => !!B.fold(o.figure.polys.map((q) => q.pts[0])));
      const right = ok.map((v) => (p.data.findNot ? !v : v));
      return right.filter(Boolean).length === 1 && right[p.answer.value];
    },
  });

  const tDiceNet = tpl({
    id: 'u5s4-dice', sub: 'u5s4', style: 'B', styleName: '주사위 전개도', levels: [1, 4],
    build(r, lv) {
      const N = makeNet(r, true, lv);
      const pairs = r.shuffle([[1, 6], [2, 5], [3, 4]]);
      const num = {};
      ['U', 'N', 'E'].forEach((f, i) => { const sw = r.chance(0.5); num[f] = pairs[i][sw ? 1 : 0]; num[B.DOPP[f]] = pairs[i][sw ? 0 : 1]; });
      const q = r.pick(N.rects);
      const ans = num[q.face];
      const opp = N.rects.find((x) => x.face === B.DOPP[q.face]);
      return {
        text: '주사위의 전개도예요. 주사위는 마주 보는 면의 눈의 수를 더하면 7이에요. ?에 알맞은 눈의 수를 구하세요.',
        figure: netFig(N, { faceText: (rc) => (rc === q ? '?' : String(num[rc.face])) }),
        answer: { type: 'num', value: String(ans) },
        patterns: N.rects.filter((x) => x !== q && x !== opp).map((x) => ({ value: String(7 - num[x.face]), cause: 'concept', msg: `?와 마주 보는 면은 ${num[opp.face]}이 적힌 면이에요. 이웃한 면이 아니라 마주 보는 면을 찾아요.` })).filter((pt) => Number(pt.value) !== ans),
        hints: ['접었을 때 마주 보는 면의 합이 7이에요.', '한 줄로 이어진 세 면에서 첫째와 셋째 면이 마주 봐요. 이웃한 면은 마주 보지 않아요.', `?와 마주 보는 면: ${num[opp.face]} → 7 - ${num[opp.face]} = ${ans}`],
        solution: [`?와 마주 보는 면의 눈은 ${num[opp.face]}이에요.`, `7 - ${num[opp.face]} = ${ans}`],
        key: `u5s4-dice|${N.cells.map((c) => c.join(',')).join(' ')}|${N.rects.map((x) => num[x.face]).join('')}|${q.name}`,
        data: { want: ans, other: num[opp.face] },
      };
    },
    verify(p) { return Number(p.answer.value) + p.data.other === 7; },
  });

  const tNetPerim4 = tpl({
    id: 'u5s4-perim', sub: 'u5s4', style: 'B', styleName: '전개도의 둘레', levels: [1, 4],
    build(r, lv) {
      const N = makeNet(r, true, lv);
      const a = r.int(2, lv <= 2 ? 9 : 15);
      const s = N.segs[0];
      return {
        text: `한 모서리가 ${cm(a)}인 정육면체의 전개도예요. 전개도의 둘레(바깥 선의 길이)는 몇 cm인가요?`,
        figure: netFig(N, { faces: false, sides: [{ a: s.a, b: s.b, t: cm(a), c: [N.W / 2, N.H / 2], d: 0.55 }] }),
        answer: { type: 'num', value: String(14 * a), unit: 'cm' },
        patterns: [{ value: String(12 * a), cause: 'concept', msg: '정육면체의 모서리 12개의 합을 구했어요. 전개도의 바깥 선분을 세어요.' }, { value: String(24 * a), cause: 'condition', msg: '면 6개의 둘레를 모두 더했어요. 접는 선(점선)은 바깥 선이 아니에요.' }, { value: String(6 * a), cause: 'concept', msg: '바깥 선분의 수를 세어 봐요. 14개예요.' }],
        hints: ['바깥 둘레의 선분(실선)은 길이가 모두 한 모서리와 같아요.', '실선의 수를 세어요. 정육면체 전개도의 바깥 선분은 늘 14개예요.', `${a} × 14 = ${14 * a}`],
        solution: [`바깥 선분 14개`, `${a} × 14 = ${14 * a}(cm)`],
        key: `u5s4-perim|${a}|${N.cells.map((c) => c.join(',')).join(' ')}`,
        data: { a, n: N.segs.length },
      };
    },
    verify(p) { return p.data.n === 14 && Number(p.answer.value) === 14 * p.data.a; },
  });

  const OX4 = [
    { s: '정육면체의 전개도에서 접었을 때 마주 보는 면은 서로 평행해요.', t: true, why: '마주 보는 면은 계속 늘여도 만나지 않아서 평행해요.', wrong: ['마주 보는 면은 서로 붙어 있으니까요.', '전개도에서는 모든 면이 평행하니까요.'] },
    { s: '정사각형 6개를 이어 붙이면 항상 정육면체의 전개도가 돼요.', t: false, why: '접었을 때 겹치는 면이 생기면 전개도가 아니에요. 정육면체의 전개도는 11가지뿐이에요.', wrong: ['정육면체는 정사각형 6개로 둘러싸여 있으니까요.', '어떻게 붙여도 접으면 상자가 되니까요.'] },
    { s: '전개도에서 잘리지 않은 모서리는 점선으로 그려요.', t: true, why: '잘린 모서리는 실선, 잘리지 않은(접는) 모서리는 점선으로 그려요.', wrong: ['보이지 않는 모서리라서 점선이에요.', '모든 선을 점선으로 그리니까요.'] },
    { s: '전개도에서 한 줄로 이어진 세 면 중 첫째 면과 셋째 면은 수직이에요.', t: false, why: '첫째 면과 셋째 면은 접으면 마주 보는 면이라서 평행해요.', wrong: ['멀리 떨어진 면은 모두 수직이니까요.', '가운데 면을 사이에 두고 만나니까요.'] },
  ];
  const OX5 = [
    { s: '직육면체의 전개도에서 마주 보는 면은 모양과 크기가 같아요.', t: true, why: '마주 보는 면은 평행하고 모양과 크기가 같은 직사각형이에요.', wrong: ['모든 면의 크기가 같으니까요.', '이웃한 면끼리 크기가 같으니까요.'] },
    { s: '직육면체의 전개도에서 맞닿는 선분의 길이는 다를 수 있어요.', t: false, why: '접었을 때 맞닿는 선분은 같은 모서리가 되니까 길이가 같아야 해요.', wrong: ['직사각형은 가로와 세로가 다르니까요.', '전개도는 늘어날 수 있으니까요.'] },
    { s: '직육면체의 전개도는 한 가지 모양뿐이에요.', t: false, why: '어느 모서리를 자르느냐에 따라 여러 가지 모양의 전개도를 그릴 수 있어요.', wrong: ['직육면체는 모양이 하나니까요.', '전개도는 항상 십자 모양이니까요.'] },
  ];

  // 직육면체 전개도 찾기: 바른 것 1개 + 길이가 안 맞는 것 / 접으면 겹치는 것
  const tIsNet5 = tpl({
    id: 'u5s5-isnet', sub: 'u5s5', style: 'A', styleName: '전개도 찾기', levels: [1, 4],
    build(r, lv) {
      const N = makeNet(r, false, lv);
      if (!N) return null;
      const rectFig = (rects) => {
        const W = Math.max(...rects.map((x) => x.x + x.w)), H = Math.max(...rects.map((x) => x.y + x.h));
        return { type: 'geo', polys: rects.map((rc) => ({ pts: [[rc.x, rc.y], [rc.x + rc.w, rc.y], [rc.x + rc.w, rc.y + rc.h], [rc.x, rc.y + rc.h]], cls: 'netface' })), segs: rects.flatMap((rc) => [[[rc.x, rc.y], [rc.x + rc.w, rc.y]], [[rc.x + rc.w, rc.y], [rc.x + rc.w, rc.y + rc.h]], [[rc.x + rc.w, rc.y + rc.h], [rc.x, rc.y + rc.h]], [[rc.x, rc.y + rc.h], [rc.x, rc.y]]]).map(([a, b]) => ({ a, b, cls: 'box' })), scale: Math.min(14, 130 / Math.max(W, H)), pad: 0.3 };
      };
      const plain = (rects) => rects.map((x) => ({ x: x.x, y: x.y, w: x.w, h: x.h }));
      const opts = [{ rects: plain(N.rects), ok: true }];
      // 끝에 붙은 면 하나의 가로·세로를 바꾸면 맞닿는 선분의 길이가 달라진다
      const leaf = N.rects.filter((rc) => N.rects.filter((q) => q !== rc && touching(rc, q)).length === 1 && rc.w !== rc.h);
      for (const lf of r.shuffle(leaf)) {
        if (opts.length >= 3) break;
        const par = N.rects.find((q) => q !== lf && touching(lf, q));
        const nr = plain(N.rects);
        const k = N.rects.indexOf(lf);
        const t = nr[k];
        const w = t.h, h = t.w;
        if (eq(par.x + par.w, lf.x)) Object.assign(t, { w, h });
        else if (eq(lf.x + lf.w, par.x)) Object.assign(t, { x: par.x - w, w, h });
        else if (eq(par.y + par.h, lf.y)) Object.assign(t, { w, h });
        else Object.assign(t, { y: par.y - h, w, h });
        if (overlap(nr)) continue;
        opts.push({ rects: nr, ok: false, msg: '접었을 때 맞닿는 선분의 길이가 달라요. 맞닿는 선분은 길이가 같아야 해요.' });
      }
      // 정육면체 전개도가 아닌 모양에 직사각형을 넣은 것
      while (opts.length < 4) {
        const c = B.orient(r.pick(B.NONNETS), r.int(0, 7));
        opts.push({ rects: c.map(([x, y]) => ({ x: x * 3, y: y * 2, w: 3, h: 2 })), ok: false, msg: '접으면 겹치는 면이 생겨서 직육면체가 되지 않아요.' });
      }
      const sh = r.shuffle(opts);
      return {
        text: '다음 중 직육면체의 전개도를 고르세요.',
        keepOrder: true,
        answer: { type: 'choice', options: sh.map((o) => Object.assign({ figure: rectFig(o.rects), key: JSON.stringify(o.rects), correct: o.ok }, o.ok ? {} : { pattern: { cause: 'concept', msg: o.msg } })) },
        hints: ['직육면체의 전개도는 마주 보는 면 3쌍의 모양과 크기가 같아요.', '접었을 때 맞닿는 선분의 길이가 같은지 확인해요.', '접었을 때 겹치는 면이 없어야 해요.'],
        solution: ['마주 보는 면의 크기가 같고, 맞닿는 선분의 길이가 같고, 겹치는 면이 없는 것이 전개도예요.'],
        key: `u5s5-isnet|${sh.map((o) => JSON.stringify(o.rects)).join('/')}`,
        data: { okIndex: sh.findIndex((o) => o.ok) },
      };
    },
    verify(p) { return p.answer.value === p.data.okIndex && p.answer.options.filter((o) => o.correct).length === 1; },
  });
  const eq = (x, y) => Math.abs(x - y) < 1e-9;
  const touching = (a, b) => (eq(a.x + a.w, b.x) || eq(b.x + b.w, a.x)) && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9 || (eq(a.y + a.h, b.y) || eq(b.y + b.h, a.y)) && a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9;
  const overlap = (R) => R.some((A, i) => R.some((Bq, k) => k > i && A.x < Bq.x + Bq.w - 1e-9 && Bq.x < A.x + A.w - 1e-9 && A.y < Bq.y + Bq.h - 1e-9 && Bq.y < A.y + A.h - 1e-9));

  // 전개도에서 □의 길이
  const tLen5 = tpl({
    id: 'u5s5-length', sub: 'u5s5', style: 'A', styleName: '전개도의 길이', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const N = makeNet(r, false, lv);
      if (!N) return null;
      const target = r.pick(N.segs);
      const partner = B.gluePartner(N.segs, target);
      const labels = sideLabels(N, r, [target, partner]);
      if (labels.length < 3) return null;
      const lens = labels.map((x) => Number(x.t.split(' ')[0]));
      const c = [N.W / 2, N.H / 2];
      return {
        text: '직육면체의 전개도예요. □ 안에 알맞은 수를 구하세요.',
        figure: netFig(N, { faces: false, sides: [...labels, { a: target.a, b: target.b, t: '□ cm', c, d: 0.55 }] }),
        answer: { type: 'num', value: String(target.len), unit: 'cm' },
        patterns: lens.filter((v) => v !== target.len).map((v) => ({ value: String(v), cause: 'condition', msg: '접었을 때 □인 선분과 맞닿는 선분을 찾아요. 맞닿는 선분의 길이는 같아요.' })),
        hints: ['접었을 때 맞닿는 선분의 길이는 같아요. 마주 보는 면은 크기가 같아요.', '□가 있는 면과 같은 크기인 면(마주 보는 면)을 찾거나, 접었을 때 맞닿는 선분을 찾아요.', `그래서 □ 안에 알맞은 수는 ${target.len}이에요.`.replace(/(\d+)이에요/, (m, d) => j(d, '이에요/예요'))],
        solution: [`□인 선분과 같은 길이의 선분을 찾으면 ${cm(target.len)}예요.`],
        key: `u5s5-length|${N.cells.map((c2) => c2.join(',')).join(' ')}|${JSON.stringify(N.L)}|${target.a.join(',')}|${labels.map((x) => x.t).join(',')}`,
        data: { want: target.len, L: N.L },
      };
    },
    verify(p) { return Object.values(p.data.L).includes(Number(p.answer.value)) && Number(p.answer.value) === p.data.want; },
  });

  const tNetPerim5 = tpl({
    id: 'u5s5-perim', sub: 'u5s5', style: 'A', styleName: '전개도의 둘레', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const N = makeNet(r, false, lv);
      if (!N) return null;
      const ans = sum(N.segs.map((s) => s.len));
      const { x, y, z } = N.L;
      return {
        text: `가로·세로·높이가 ${cm(x)}, ${cm(y)}, ${cm(z)}인 직육면체의 전개도예요. 전개도의 둘레(바깥 선의 길이)는 몇 cm인가요?`,
        figure: netFig(N, { faces: false, sides: sideLabels(N, r) }),
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [{ value: String(4 * (x + y + z)), cause: 'concept', msg: '직육면체의 모든 모서리의 합을 구했어요. 전개도의 바깥 선분을 하나씩 더해요.' }].filter((pt) => Number(pt.value) !== ans),
        hints: ['바깥 둘레의 실선만 더해요. 접는 선(점선)은 빼요.', '실선 14개의 길이는 각각 가로, 세로, 높이 중 하나예요.', `바깥 선분: ${N.segs.map((s) => s.len).join(' + ')} = ${ans}`],
        solution: [`${N.segs.map((s) => s.len).join(' + ')} = ${ans}(cm)`],
        key: `u5s5-perim|${N.cells.map((c) => c.join(',')).join(' ')}|${JSON.stringify(N.L)}`,
        data: { lens: N.segs.map((s) => s.len) },
      };
    },
    verify(p) { return p.data.lens.length === 14 && sum(p.data.lens) === Number(p.answer.value); },
  });

  // 겨냥도를 보고 전개도의 길이 (B)
  const tSketchNet = tpl({
    id: 'u5s5-sketch', sub: 'u5s5', style: 'B', styleName: '겨냥도와 전개도', levels: [1, 4],
    build(r, lv) {
      const N = makeNet(r, false, lv);
      if (!N) return null;
      const target = r.pick(N.segs);
      const { x, y, z } = N.L;
      // 겨냥도: 가로 x, 높이 y, 깊이 z
      const d = { a: x, h: y, c: z };
      return {
        text: '직육면체의 겨냥도를 보고 전개도를 그렸어요. 전개도의 □ 안에 알맞은 수를 구하세요.',
        figure: { type: 'geo', polys: [], segs: [], scale: 1 },
        answer: { type: 'num', value: String(target.len), unit: 'cm' },
        patterns: [x, y, z].filter((v) => v !== target.len).map((v) => ({ value: String(v), cause: 'condition', msg: '□가 있는 면이 직육면체의 어느 면인지, □인 선분이 어느 모서리인지 찾아요.' })),
        hints: ['전개도의 각 선분은 직육면체의 모서리 하나예요. 가로, 세로, 높이 중 하나와 같아요.', '□가 있는 면의 다른 변의 길이와 비교해 봐요.', `그래서 □ 안에 알맞은 수는 ${target.len}이에요.`.replace(/(\d+)이에요/, (m, d) => j(d, '이에요/예요'))],
        solution: [`□인 선분은 길이가 ${cm(target.len)}인 모서리예요.`],
        key: `u5s5-sketch|${N.cells.map((c) => c.join(',')).join(' ')}|${JSON.stringify(N.L)}|${target.a.join(',')}`,
        data: { want: target.len, net: N, d, target },
      };
    },
    verify(p) { return [p.data.d.a, p.data.d.h, p.data.d.c].includes(Number(p.answer.value)) && Number(p.answer.value) === p.data.want; },
  });
  // 그림은 겨냥도와 전개도를 나란히 (두 그림을 하나로 합친다)
  const _bSketch = tSketchNet.build;
  tSketchNet.build = function (r, lv) {
    const p = _bSketch(r, lv);
    if (!p) return null;
    const { net, d, target } = p.data;
    const box = B.boxFig(drawDims(d), { lens: lensOf(d) });
    const nf = netFig(net, { faces: false, sides: [{ a: target.a, b: target.b, t: '□ cm', c: [net.W / 2, net.H / 2], d: 0.55 }] });
    // 단위가 다른 두 그림을 하나의 geo로: 전개도를 겨냥도 오른쪽에 배치
    const sNet = 5 / Math.max(net.W, net.H);
    const bx = Math.max(...box.segs.flatMap((s) => [s.a[0], s.b[0]])) + 1.6;
    const by = Math.min(...box.segs.flatMap((s) => [s.a[1], s.b[1]]));
    const T2 = ([px, py]) => [bx + px * sNet, by + py * sNet];
    p.figure = {
      type: 'geo', scale: 30, pad: 0.8,
      polys: nf.polys.map((q) => ({ pts: q.pts.map(T2), cls: q.cls })),
      segs: [...box.segs, ...nf.segs.map((s) => ({ a: T2(s.a), b: T2(s.b), cls: s.cls }))],
      sides: [...box.sides, ...nf.sides.map((s) => ({ a: T2(s.a), b: T2(s.b), t: s.t, c: T2(s.c), d: s.d }))],
    };
    p.data = { want: p.data.want, d };
    return p;
  };

  const tLine5 = TB.lineFind({
    id: 'u5s5-line', unit: 5, sub: 'u5s5', levels: [1, 4],
    gen(r) {
      const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9);
      if (new Set([a, b, c]).size < 3) return null;
      const tot = 4 * (a + b + c);
      // 직육면체 전개도의 둘레는 늘 14개 선분. 길이별 개수는 전개도마다 다르지만 모서리의 합과는 다르다
      const L = [`가로 ${a} cm, 세로 ${b} cm, 높이 ${c} cm인 직육면체의 전개도에서`, '마주 보는 면은 모양과 크기가 같아요.', `가로 ${a} cm, 세로 ${b} cm인 면은 2개예요.`, `그 두 면의 넓이의 합은 ${a} × ${b} × 2 = ${2 * a * b}(cm²)`];
      const kind = r.int(1, 3);
      const bad = [null,
        { i: 1, line: '마주 보는 면은 크기가 서로 달라요.', msg: '직육면체에서 마주 보는 면은 모양과 크기가 같아요.', after: [`가로 ${a} cm, 세로 ${b} cm인 면은 1개예요.`, `그 면의 넓이는 ${a} × ${b} = ${a * b}(cm²)`] },
        { i: 2, line: `가로 ${a} cm, 세로 ${b} cm인 면은 4개예요.`, msg: '크기가 같은 면은 마주 보는 두 면, 2개씩이에요.', after: [`그 면들의 넓이의 합은 ${a} × ${b} × 4 = ${4 * a * b}(cm²)`] },
        { i: 3, line: `그 두 면의 넓이의 합은 ${a} × ${b} × 2 = ${2 * a * b + 2}(cm²)`, msg: `${a} × ${b} × 2 = ${2 * a * b}이에요.`, after: [] },
      ][kind];
      if (kind === 3) bad.after = ['계산을 다시 확인하지 않았어요.'];
      return { problem: `"직육면체의 전개도에서 가로 ${a} cm, 세로 ${b} cm인 면의 넓이의 합"을`, verb: '구한', lines: L, bad: { i: bad.i, line: bad.line, msg: bad.msg }, after: bad.after, key: `${a}|${b}|${c}|${kind}|${tot}` };
    },
  });

  M5.u5 = { makeNet, netFig, cellFig, dims, drawDims, lensOf, what, segName, ptAt };

  M5.addTemplates([
    tCount1, tWhich1, tEdgeSum, tEdgeInv, tFaceArea, tWire, tCompare, tOX('u5s1', OX1), tLine1,
    tCount2, tSketch, tHiddenSum, tMissing, tDash, tCube9, tOX('u5s2', OX2), tLine2,
    tPar, tPerp, tProps, tPerpSum, tMeet, tBase, tDice, tOX('u5s3', OX3), tLine3,
    tIsNet, oppTpl('u5s4', true), perpTpl('u5s4', true), pointTpl('u5s4', true), edgeTpl('u5s4', true), tDiceNet, tNetPerim4, tOX('u5s4', OX4),
    tIsNet5, tLen5, oppTpl('u5s5', false), pointTpl('u5s5', false), edgeTpl('u5s5', false), tNetPerim5, tSketchNet, tOX('u5s5', OX5), tLine5,
  ]);
})();
