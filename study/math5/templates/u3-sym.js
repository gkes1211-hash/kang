// 3단원 합동과 대칭 (2) — 선대칭도형과 그 성질 / 점대칭도형과 그 성질
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, TB = M5.tb, g = M5.g3;
  const j = T.j;
  const { LB, CIRC } = g;

  const unit3 = M5.units.find((u) => u.id === 3);
  unit3.subs.push(
    { id: 'u3s3', name: '선대칭도형과 그 성질', concept: '한 직선을 따라 접었을 때 완전히 겹치는 도형을 선대칭도형, 그 직선을 대칭축이라고 해요.\n선대칭도형에서 대응변의 길이와 대응각의 크기는 각각 같아요.\n대응점끼리 이은 선분은 대칭축과 수직(90°)으로 만나고, 대칭축이 그 선분을 둘로 똑같이 나눠요.\n대칭축 위에 있는 변은 완성된 도형의 안쪽에 들어가서 둘레가 아니에요.' },
    { id: 'u3s4', name: '점대칭도형과 그 성질', concept: '한 점을 중심으로 180° 돌렸을 때 처음 도형과 완전히 겹치는 도형을 점대칭도형, 그 점을 대칭의 중심이라고 해요.\n점대칭도형에서 대응변의 길이와 대응각의 크기는 각각 같아요.\n대응점끼리 이은 선분은 대칭의 중심을 지나고, 대칭의 중심이 그 선분을 둘로 똑같이 나눠요.\n디지털 숫자 0, 1, 2, 5, 8은 180° 돌려도 그대로이고, 6과 9는 서로 바뀌어요. 수를 돌리면 숫자의 순서도 거꾸로 돼요.' },
  );

  const tpl = (o) => Object.assign({ unit: 3 }, o);
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const cm = (v) => `${v} cm`;
  const dg = (v) => `${v}°`;
  const mod = (a, n) => ((a % n) + n) % n;
  const { tOX } = M5.u3;

  const namedFig = (s, scale = 20) => ({ type: 'geo', polys: [{ pts: g.norm(s.pts), cls: 'shape-a' }], scale, pad: 0.3, title: s.name });
  const byName = (n) => g.NAMED.find((s) => s.name === n);
  // 대칭축 위에 있는 꼭짓점의 이름이 빨간 대칭축과 겹치지 않게 비스듬히 옆으로 옮긴다
  function offAxis(fig, A, B) {
    const L = g.dist(A, B), ax = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
    const c = g.centroid(fig.polys[0].pts);
    for (const lb of fig.labels || []) {
      const v = [lb.p[0] - A[0], lb.p[1] - A[1]];
      if (Math.abs(v[0] * ax[1] - v[1] * ax[0]) > 1e-6) continue;
      const out = (lb.p[0] - c[0]) * ax[0] + (lb.p[1] - c[1]) * ax[1] >= 0 ? 1 : -1;
      lb.c = [lb.p[0] - out * ax[0] * 0.6 + ax[1] * 0.8, lb.p[1] - out * ax[1] * 0.6 - ax[0] * 0.8];
      lb.d = 0.55;
    }
    return fig;
  }

  // ======================================================================
  // 소단원 3: 선대칭도형과 그 성질
  // ======================================================================
  const AXES_WRONG = {
    직사각형: [4, '직사각형의 대각선은 대칭축이 아니에요. 대각선을 따라 접으면 겹치지 않아요.'],
    마름모: [4, '마름모는 두 대각선만 대칭축이에요. 마주 보는 변의 가운데를 잇는 선으로 접으면 겹치지 않아요.'],
    정사각형: [2, '가로·세로 가운데 선뿐 아니라 두 대각선도 대칭축이에요.'],
    정육각형: [3, '꼭짓점끼리 잇는 선뿐 아니라 마주 보는 변의 가운데를 잇는 선도 대칭축이에요.'],
    정팔각형: [4, '꼭짓점끼리 잇는 선뿐 아니라 마주 보는 변의 가운데를 잇는 선도 대칭축이에요.'],
    등변사다리꼴: [2, '위아래로 접으면 윗변과 아랫변의 길이가 달라서 겹치지 않아요.'],
    '연 모양 사각형': [2, '가로로 접으면 위쪽과 아래쪽의 모양이 달라서 겹치지 않아요.'],
    이등변삼각형: [3, '길이가 같은 두 변 사이의 각을 지나는 선 하나만 대칭축이에요.'],
  };
  const tAxes = tpl({
    id: 'u3s3-axes', sub: 'u3s3', style: 'A', styleName: '대칭축의 수', levels: [1, 4],
    build(r, lv) {
      const pool = g.NAMED.filter((s) => s.axes > 0 && (lv >= 2 || s.axes <= 4));
      if (lv >= 3 && r.chance(0.6)) {
        const [a, b] = r.sample(pool, 2);
        const fig = { type: 'geo', polys: [{ pts: g.norm(a.pts), cls: 'shape-a' }, { pts: g.shift(g.norm(b.pts), g.bbox(g.norm(a.pts)).w + 2, 0), cls: 'shape-b' }], texts: [{ p: [g.bbox(g.norm(a.pts)).w / 2, -0.9], t: '가' }, { p: [g.bbox(g.norm(a.pts)).w + 2 + g.bbox(g.norm(b.pts)).w / 2, -0.9], t: '나' }], scale: 30 };
        const ans = a.axes + b.axes;
        const pats = [a, b].filter((s) => AXES_WRONG[s.name]).map((s) => ({ value: String(ans - s.axes + AXES_WRONG[s.name][0]), cause: 'concept', msg: `${s.name}: ${AXES_WRONG[s.name][1]}` }));
        return {
          text: `선대칭도형 가(${a.name})와 나(${b.name})의 대칭축의 수의 합은 몇 개인가요?`,
          figure: fig,
          answer: { type: 'num', value: String(ans), unit: '개' },
          patterns: pats,
          hints: ['도형을 반으로 접었을 때 완전히 겹치게 하는 직선을 모두 찾아요.', `가(${a.name})의 대칭축을 먼저 세고, 나(${b.name})의 대칭축을 세요.`, `가: ${a.axes}개, 나: ${b.axes}개 → ${a.axes} + ${b.axes} = ${ans}`],
          solution: [`${a.name}의 대칭축: ${a.axes}개`, `${b.name}의 대칭축: ${b.axes}개`, `합: ${ans}개`],
          key: `u3s3-axes|sum|${[a.name, b.name].join('+')}`,
          data: { names: [a.name, b.name] },
        };
      }
      const s = r.pick(pool);
      const w = AXES_WRONG[s.name];
      return {
        text: `다음 ${j(s.name, '은/는')} 선대칭도형이에요. 대칭축은 모두 몇 개인가요?`,
        figure: namedFig(s, 40),
        answer: { type: 'num', value: String(s.axes), unit: '개' },
        patterns: w ? [{ value: String(w[0]), cause: 'concept', msg: w[1] }] : [],
        hints: ['도형을 반으로 접었을 때 완전히 겹치게 하는 직선이 대칭축이에요.', s.name.startsWith('정') && s.name !== '정사각형' ? `${s.name}은 변의 수만큼 대칭축이 있어요.` : '가로, 세로, 대각선 방향으로 하나씩 접어 본다고 생각해요.', `${s.name}의 대칭축은 ${s.axes}개예요.`],
        solution: [`${s.name}의 대칭축은 ${s.axes}개예요.`],
        key: `u3s3-axes|${s.name}`,
        data: { names: [s.name] },
      };
    },
    verify(p) { return sum(p.data.names.map((n) => byName(n).axes)) === Number(p.answer.value); },
  });

  // 9번: 대칭축이 가장 많은(적은) 도형
  const tMost = tpl({
    id: 'u3s3-most', sub: 'u3s3', style: 'A', styleName: '대칭축 비교', levels: [1, 4],
    build(r) {
      const most = r.chance(0.7);
      const pool = g.NAMED.filter((s) => s.axes > 0);
      const pick = r.sample(pool, 4);
      const axes = pick.map((s) => s.axes);
      const target = most ? Math.max(...axes) : Math.min(...axes);
      if (axes.filter((a) => a === target).length !== 1) return null;
      return {
        text: `다음 선대칭도형 중에서 대칭축의 수가 가장 ${most ? '많은' : '적은'} 도형을 고르세요.`,
        answer: { type: 'choice', options: pick.map((s) => Object.assign({ figure: namedFig(s), key: s.name, correct: s.axes === target }, s.axes === target ? {} : { pattern: { cause: 'concept', msg: `이 도형(${s.name})의 대칭축은 ${s.axes}개예요. 대칭축이 ${target}개인 도형이 있어요.` } })) },
        hints: ['도형마다 반으로 접어 완전히 겹치는 직선을 세어 봐요.', '정다각형은 변의 수만큼 대칭축이 있어요.', `${pick.map((s) => `${s.name} ${s.axes}개`).join(', ')}`],
        solution: [pick.map((s) => `${s.name}: ${s.axes}개`).join(', '), `가장 ${most ? '많은' : '적은'} 것은 ${j(pick.find((s) => s.axes === target).name, '이에요/예요')}.`],
        key: `u3s3-most|${most}|${pick.map((s) => s.name).sort().join('/')}`,
        data: { most },
      };
    },
    verify(p) {
      const ax = p.answer.options.map((o) => byName(o.key).axes);
      const t = p.data.most ? Math.max(...ax) : Math.min(...ax);
      return ax[p.answer.value] === t && ax.filter((a) => a === t).length === 1;
    },
  });

  // 선대칭도형 모두 고르기
  const tWhich = tpl({
    id: 'u3s3-which', sub: 'u3s3', style: 'A', styleName: '선대칭도형 찾기', levels: [1, 4],
    build(r) {
      const yes = g.NAMED.filter((s) => s.axes > 0), no = g.NAMED.filter((s) => s.axes === 0);
      const ny = r.int(2, 3);
      const pick = r.shuffle([...r.sample(yes, ny), ...r.sample(no, 5 - ny > no.length ? no.length : 5 - ny)]);
      const right = pick.filter((s) => s.axes > 0).map((s) => s.name);
      const para = pick.find((s) => s.name === '평행사변형');
      return {
        text: '다음 중 선대칭도형을 모두 고르세요.',
        answer: { type: 'multi', options: pick.map((s) => ({ figure: namedFig(s), key: s.name, correct: s.axes > 0 })) },
        patterns: para ? [{ value: [...right, '평행사변형'], cause: 'concept', msg: '평행사변형은 어떤 직선으로 접어도 완전히 겹치지 않아요. 180° 돌리면 겹치는 점대칭도형이에요.' }] : [],
        hints: ['반으로 접었을 때 완전히 겹치게 하는 직선이 있는지 하나씩 봐요.', '가로, 세로, 비스듬한 방향으로 모두 접어 본다고 생각해요.', `선대칭도형: ${right.join(', ')}`],
        solution: [`선대칭도형은 ${right.join(', ')}이에요.`, `${j(pick.filter((s) => !s.axes).map((s) => s.name).join(', '), '은/는')} 접어서 완전히 겹치게 하는 직선이 없어요.`],
        key: `u3s3-which|${pick.map((s) => s.name).join('/')}`,
        data: {},
      };
    },
    verify(p) { return p.answer.options.every((o, i) => (byName(o.key).axes > 0) === p.answer.values.includes(i)); },
  });

  // 대칭축이 세로인 선대칭도형: ㄱ(위, 대칭축 위) → 오른쪽 점들 → 아래 점(대칭축 위) → 왼쪽 점들
  //   flip이면 가로 대칭축으로 돌린 그림
  function symShape(r, k) {
    for (let t = 0; t < 60; t++) {
      const h = r.int(6, 10) / 2;
      const R = [];
      if (k === 1) R.push([r.int(3, 6) / 2, r.int(2, Math.round(h * 2) - 2) / 2]);
      else {
        const y1 = r.int(1, Math.round(h * 2) - 3) / 2, y2 = r.int(Math.round(y1 * 2) + 1, Math.round(h * 2) - 1) / 2;
        R.push([r.int(2, 6) / 2, y1], [r.int(2, 6) / 2, y2]);
      }
      const Tp = [0, 0], Bp = [0, h];
      const pts = [Tp, ...R, Bp, ...R.slice().reverse().map(([x, y]) => [-x, y])];
      if (!g.simple(pts)) continue;
      const angs = pts.map((_, i) => g.angleAt(pts, i));
      if (angs.some((a) => a < 35 || a > 220)) continue;
      return { pts, k, h };
    }
    return null;
  }
  const flipXY = (pts) => pts.map(([x, y]) => [y, x]);

  const tSide3 = tpl({
    id: 'u3s3-side', sub: 'u3s3', style: 'A', styleName: '대응변의 길이', levels: [1, 4],
    build(r, lv) {
      const S = symShape(r, lv <= 2 ? 1 : 2);
      if (!S) return null;
      const n = S.pts.length, half = S.k + 1; // 오른쪽 변 (0→1, …, k→k+1)
      const real = Array.from({ length: half }, (_, i) => g.dist(S.pts[i], S.pts[i + 1]));
      const sc = r.int(3, 6) / Math.min(...real);
      const lens = real.map((v) => Math.max(2, Math.round(v * sc)));
      if (new Set(lens).size < half) return null;
      const flip = r.chance(0.4);
      let pts = S.pts, ax = [[0, -1], [0, S.h + 1]];
      if (flip) { pts = flipXY(pts); ax = flipXY(ax); }
      const names = LB.slice(0, n);
      const c = g.centroid(pts);
      const i = r.int(0, half - 1);
      // 오른쪽 변 i(점 i→i+1)의 대응변: 점 (n-i)%n → 점 n-i-1
      const mi = (q) => mod(n - q, n);
      const sideName = (a, b) => names[a] + names[b];
      const ask = sideName(mi(i), mi(i + 1));
      const fig = g.merge(g.labeled(pts, names), { segs: [{ a: ax[0], b: ax[1], cls: 'axis' }], texts: [{ p: [ax[0][0] + (flip ? -0.5 : 0), ax[0][1] - (flip ? 0 : 0.5)], t: LB[n] }, { p: [ax[1][0] + (flip ? 0.5 : 0), ax[1][1] + (flip ? 0 : 0.5)], t: LB[n + 1] }], scale: 40 });
      fig.sides = lens.map((v, q) => ({ a: pts[q], b: pts[q + 1], t: cm(v), c }));
      offAxis(fig, ax[0], ax[1]);
      return {
        text: `직선 ${LB[n]}${j(LB[n + 1], '을/를')} 대칭축으로 하는 선대칭도형이에요. 변 ${ask}의 길이는 몇 cm인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(lens[i]), unit: 'cm' },
        patterns: lens.map((v, q) => ({ value: String(v), cause: 'concept', msg: `변 ${ask}의 대응변은 변 ${sideName(i, i + 1)}이에요. 대칭축을 따라 접었을 때 겹치는 변을 찾아요.` })).filter((_, q) => q !== i),
        hints: ['대칭축을 따라 접으면 겹치는 변끼리 길이가 같아요.', `점 ${names[mi(i)]}과 겹치는 점은 점 ${names[i]}, 점 ${names[mi(i + 1)]}과 겹치는 점은 점 ${names[i + 1]}이에요.`, `변 ${ask}의 대응변은 변 ${sideName(i, i + 1)} → ${cm(lens[i])}`],
        solution: [`변 ${ask}의 대응변은 변 ${sideName(i, i + 1)}이에요.`, `대응변의 길이는 같으므로 ${cm(lens[i])}예요.`],
        key: `u3s3-side|${S.pts.map((p) => p.join(',')).join(' ')}|${lens.join(',')}|${flip}|${i}`,
        data: { pts, lens, i, n },
      };
    },
    verify(p) {
      const { pts, i, n } = p.data;
      const a = pts[i], b = pts[i + 1], c = pts[mod(n - i, n)], d = pts[mod(n - i - 1, n)];
      return Math.abs(g.dist(a, b) - g.dist(c, d)) < 1e-9 && Number(p.answer.value) === p.data.lens[i];
    },
  });

  // 연 모양(대칭축이 두 꼭짓점을 지나는 사각형): ㄱ 위, ㄴ 왼쪽, ㄷ 아래, ㄹ 오른쪽
  //   al: 각 ㄱ의 절반, be: 각 ㄷ의 절반, ga: 각 ㄴ = 각 ㄹ
  function kite(r, lv) {
    for (let t = 0; t < 60; t++) {
      const al = lv <= 2 ? r.int(5, 13) * 5 : r.int(22, 68), be = lv <= 2 ? r.int(5, 13) * 5 : r.int(22, 68);
      const ga = 180 - al - be;
      if (ga < 55 || ga > 140 || al === be) continue;
      const R = [Math.sin(g.rad(al)), Math.cos(g.rad(al))];
      const yb = R[1] + R[0] / Math.tan(g.rad(be));
      if (yb / R[0] > 3.2 || yb / R[0] < 0.8) continue;
      const s = 4.2 / yb;
      const pts = [[0, 0], [-R[0] * s, R[1] * s], [0, yb * s], [R[0] * s, R[1] * s]];
      return { pts, al, be, ga };
    }
    return null;
  }
  function kiteFig(K, marks) {
    const n = 4, names = LB.slice(0, 4);
    const f = g.merge(g.labeled(K.pts, names), { segs: [{ a: [0, -0.9], b: [0, K.pts[2][1] + 0.9], cls: 'axis' }], texts: [{ p: [0.45, -0.8], t: 'ㅁ' }, { p: [0.45, K.pts[2][1] + 0.8], t: 'ㅂ' }], scale: 44 });
    offAxis(f, [0, -0.9], [0, K.pts[2][1] + 0.9]);
    f.angles = marks.map(([i, t, half]) => (half ? { v: K.pts[i], a: K.pts[i === 0 ? 3 : 3], b: i === 0 ? [0, 1] : [0, 0], t, r: 0.7, tr: 1.5 } : { v: K.pts[i], a: K.pts[mod(i - 1, n)], b: K.pts[(i + 1) % n], t }));
    return f;
  }
  // 13번: 대응각 + 사각형 네 각의 합
  function kiteProblem(r, lv, essay) {
    const K = kite(r, lv);
    if (!K) return null;
    const A = 2 * K.al, C = 2 * K.be, Gm = K.ga;
    const kind = r.pick(lv <= 1 ? ['B', 'L'] : ['B', 'L', 'half']);
    let q;
    if (kind === 'B') {
      q = { text: '각 ㄴㄷㄹ', ans: C, marks: [[0, dg(A)], [3, dg(Gm)], [2, '?']], given: `각 ㄴㄱㄹ = ${dg(A)}, 각 ㄱㄹㄷ = ${dg(Gm)}`,
        pats: [{ value: String(360 - A - Gm), cause: 'condition', msg: `각 ㄱㄴㄷ은 각 ㄱㄹㄷ의 대응각이라서 ${dg(Gm)}예요. 이 각도 빼야 해요.` }, { value: String(Math.abs(180 - A - Gm)), cause: 'concept', msg: '사각형 네 각의 합은 180°가 아니라 360°예요.' }],
        steps: [`각 ㄱㄴㄷ = 각 ㄱㄹㄷ = ${dg(Gm)} (대응각)`, `각 ㄴㄷㄹ = 360° - ${dg(A)} - ${dg(Gm)} - ${dg(Gm)} = ${dg(C)}`] };
    } else if (kind === 'L') {
      q = { text: '각 ㄱㄴㄷ', ans: Gm, marks: [[0, dg(A)], [2, dg(C)], [1, '?']], given: `각 ㄴㄱㄹ = ${dg(A)}, 각 ㄴㄷㄹ = ${dg(C)}`,
        pats: [{ value: String(360 - A - C), cause: 'condition', msg: `각 ㄱㄴㄷ과 각 ㄱㄹㄷ은 대응각이라서 크기가 같아요. 남은 ${dg(360 - A - C)}를 2로 나눠야 해요.` }, { value: String(Math.abs(180 - A - C)), cause: 'concept', msg: '사각형 네 각의 합은 360°예요.' }],
        steps: [`각 ㄱㄴㄷ + 각 ㄱㄹㄷ = 360° - ${dg(A)} - ${dg(C)} = ${dg(360 - A - C)}`, `각 ㄱㄴㄷ = 각 ㄱㄹㄷ (대응각) → ${dg(360 - A - C)} ÷ 2 = ${dg(Gm)}`] };
    } else {
      // 각 ㄱ의 절반(대칭축과 변 ㄱㄹ 사이의 각)만 주어짐
      q = { text: '각 ㄴㄷㄹ', ans: C, marks: [[0, dg(K.al), true], [3, dg(Gm)], [2, '?']], given: `대칭축과 변 ㄱㄹ 사이의 각 = ${dg(K.al)}, 각 ㄱㄹㄷ = ${dg(Gm)}`,
        pats: [{ value: String(360 - K.al - 2 * Gm), cause: 'condition', msg: `대칭축이 각 ㄴㄱㄹ을 똑같이 둘로 나눠요. 각 ㄴㄱㄹ = ${dg(K.al)} × 2 = ${dg(A)}예요.` }, { value: String(360 - A - Gm), cause: 'condition', msg: `각 ㄱㄴㄷ은 각 ㄱㄹㄷ의 대응각이라서 ${dg(Gm)}예요.` }],
        steps: [`각 ㄴㄱㄹ = ${dg(K.al)} × 2 = ${dg(A)} (대칭축이 똑같이 나눠요)`, `각 ㄱㄴㄷ = 각 ㄱㄹㄷ = ${dg(Gm)} (대응각)`, `각 ㄴㄷㄹ = 360° - ${dg(A)} - ${dg(Gm)} - ${dg(Gm)} = ${dg(C)}`] };
    }
    return {
      text: `직선 ㅁㅂ을 대칭축으로 하는 선대칭도형이에요. ${q.text}의 크기는 몇 도인가요?${essay ? ' 풀이 과정을 쓰고 답을 구하세요.' : ''}`,
      figure: kiteFig(K, q.marks),
      answer: { type: 'num', value: String(q.ans), unit: '°' },
      patterns: q.pats.filter((pt) => Number(pt.value) !== q.ans && Number(pt.value) > 0),
      hints: ['대칭축을 따라 접으면 각 ㄱㄴㄷ과 각 ㄱㄹㄷ이 겹쳐요. 대응각의 크기는 같아요.', '사각형 ㄱㄴㄷㄹ의 네 각의 합은 360°예요.', q.steps.join(' → ')],
      solution: q.steps,
      key: `kite|${K.al}|${K.be}|${kind}`,
      data: { al: K.al, be: K.be, kind },
      kite: K,
    };
  }
  const kiteVerify = (p) => {
    const { al, be, kind } = p.data;
    const want = { B: 2 * be, L: 180 - al - be, half: 2 * be }[kind];
    return Number(p.answer.value) === want && 2 * al + 2 * be + 2 * (180 - al - be) === 360;
  };
  const tKite = tpl({
    id: 'u3s3-kite', sub: 'u3s3', style: 'A', styleName: '대응각으로 각도 구하기', levels: [1, 4], weak: ['condition'],
    build(r, lv) { const q = kiteProblem(r, lv, false); if (!q) return null; q.key = 'u3s3-kite|' + q.key; delete q.kite; return q; },
    verify: kiteVerify,
  });
  const tKiteEssay = tpl({
    id: 'u3s3-essay', sub: 'u3s3', style: 'A', styleName: '서술형', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const q = kiteProblem(r, lv, true);
      if (!q) return null;
      q.key = 'u3s3-essay|' + q.key;
      delete q.kite;
      q.essay = { checklist: [
        { q: '대응각의 크기가 같다는 것을 이용했나요?', concept: '선대칭도형에서 대칭축을 따라 접었을 때 겹치는 각(대응각)은 크기가 같아요.' },
        { q: '사각형 네 각의 합이 360°라는 것을 썼나요?', concept: '사각형의 네 각의 크기를 모두 더하면 360°예요.' },
        { q: '구하는 각을 식으로 나타내 계산했나요?', concept: q.solution[q.solution.length - 1] },
      ] };
      return q;
    },
    verify: kiteVerify,
  });

  // 15번: 대칭축 위에 변이 있는 반쪽 도형 → 완성한 도형의 둘레
  const tPerim3 = tpl({
    id: 'u3s3-perim', sub: 'u3s3', style: 'A', styleName: '완성한 도형의 둘레', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const S = symShape(r, lv <= 2 ? 1 : 2);
      if (!S) return null;
      const half = S.pts.slice(0, S.k + 2); // ㄱ, 오른쪽 점들, 아래 점 (닫으면 대칭축 위의 변)
      const m = half.length;
      const real = half.map((_, i) => g.dist(half[i], half[(i + 1) % m]));
      const sc = r.int(3, 6) / Math.min(...real);
      const lens = real.map((v) => Math.max(2, Math.round(v * sc)));
      const outer = sum(lens.slice(0, m - 1)), axisLen = lens[m - 1];
      const flip = r.chance(0.5);
      let pts = half, ax = [[0, -1], [0, S.h + 1]];
      if (flip) { pts = flipXY(pts); ax = flipXY(ax); }
      const names = LB.slice(0, m);
      const c = g.centroid(pts);
      const fig = g.merge(g.labeled(pts, names), { segs: [{ a: ax[0], b: ax[1], cls: 'axis' }], texts: [{ p: [ax[0][0] - (flip ? 0.6 : -0.5), ax[0][1] - (flip ? -0.5 : 0.4)], t: LB[m] }, { p: [ax[1][0] + (flip ? 0.6 : 0.5), ax[1][1] + (flip ? 0.5 : 0.4)], t: LB[m + 1] }], scale: 40 });
      fig.sides = lens.map((v, q) => ({ a: pts[q], b: pts[(q + 1) % m], t: cm(v), c, d: q === m - 1 ? -0.75 : 0.48 }));
      offAxis(fig, ax[0], ax[1]);
      const ans = 2 * outer;
      return {
        text: `직선 ${LB[m]}${j(LB[m + 1], '을/를')} 대칭축으로 하는 선대칭도형을 완성했을 때, 완성된 선대칭도형의 둘레는 몇 cm인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [
          { value: String(2 * (outer + axisLen)), cause: 'condition', msg: `대칭축 위의 변(${cm(axisLen)})은 완성된 도형의 안쪽에 들어가서 둘레에 넣지 않아요.` },
          { value: String(outer), cause: 'condition', msg: '반쪽의 길이만 더했어요. 나머지 반쪽에도 똑같은 길이의 변이 있어요.' },
          { value: String(outer + axisLen), cause: 'concept', msg: '완성된 도형의 둘레는 반쪽 바깥 변의 2배예요. 대칭축 위의 변은 넣지 않아요.' },
          { value: String(2 * outer + axisLen), cause: 'condition', msg: `대칭축 위의 변(${cm(axisLen)})은 도형의 안쪽이라 둘레가 아니에요.` },
        ],
        hints: ['나머지 반쪽을 그려 보면 대응변끼리 길이가 같아요.', `대칭축 위의 변 ${names[m - 1]}${names[0]}(${cm(axisLen)})은 완성된 도형의 안쪽에 있어요.`, `(${lens.slice(0, m - 1).join(' + ')}) × 2 = ${outer} × 2 = ${ans}`],
        solution: [`반쪽의 바깥 변: ${lens.slice(0, m - 1).join(' + ')} = ${outer}(cm)`, `완성된 도형의 둘레: ${outer} × 2 = ${ans}(cm)`, `대칭축 위의 변 ${cm(axisLen)}은 둘레가 아니에요.`],
        key: `u3s3-perim|${S.pts.map((p) => p.join(',')).join(' ')}|${lens.join(',')}|${flip}`,
        data: { lens },
      };
    },
    verify(p) { const l = p.data.lens; return Number(p.answer.value) === 2 * sum(l.slice(0, l.length - 1)); },
  });

  // 대응점을 이은 선분과 대칭축
  const tPerp = tpl({
    id: 'u3s3-perp', sub: 'u3s3', style: 'A', styleName: '대응점과 대칭축', levels: [1, 4],
    build(r, lv) {
      const S = symShape(r, 2);
      if (!S) return null;
      const n = S.pts.length;
      const i = r.int(1, 2), mi = n - i;
      const P = S.pts[i], Q = S.pts[mi], M = [0, P[1]];
      const names = LB.slice(0, n);
      const x = r.int(2, 9) + (lv >= 3 && r.chance(0.4) ? 0.5 : 0);
      const kind = r.pick(lv === 1 ? ['double', 'right'] : ['double', 'half', 'right']);
      const c = g.centroid(S.pts);
      const Mn = 'ㅈ';
      const fig = g.merge(g.labeled(S.pts, names), { segs: [{ a: [0, -1], b: [0, S.h + 1], cls: 'axis' }, { a: P, b: Q, cls: 'dash' }], dots: [{ p: M, t: Mn, c: [M[0] + 1, M[1] - 1] }], texts: [{ p: [0.5, -0.8], t: 'ㅅ' }, { p: [0.5, S.h + 0.8], t: 'ㅇ' }], scale: 42 });
      offAxis(fig, [0, -1], [0, S.h + 1]);
      const PN = names[i], QN = names[mi];
      let text, ans, pats, hintEnd;
      if (kind === 'double') {
        fig.sides = [{ a: M, b: P, t: cm(x), c: [M[0], M[1] + 1], d: 0.45 }];
        text = `직선 ㅅㅇ을 대칭축으로 하는 선대칭도형이에요. 선분 ${Mn}${PN}이 ${cm(x)}일 때 선분 ${PN}${QN}의 길이는 몇 cm인가요?`;
        ans = 2 * x; pats = [{ value: String(x), cause: 'concept', msg: `대칭축은 선분 ${PN}${QN}을 둘로 똑같이 나눠요. 선분 ${PN}${QN}은 선분 ${Mn}${PN}의 2배예요.` }];
        hintEnd = `${x} × 2 = ${ans}`;
      } else if (kind === 'half') {
        fig.sides = [{ a: Q, b: P, t: cm(2 * x), c: [M[0], M[1] + 1], d: 0.45 }];
        text = `직선 ㅅㅇ을 대칭축으로 하는 선대칭도형이에요. 선분 ${PN}${QN}이 ${cm(2 * x)}일 때 선분 ${Mn}${QN}의 길이는 몇 cm인가요?`;
        ans = x; pats = [{ value: String(2 * x), cause: 'concept', msg: `대칭축이 선분 ${PN}${QN}을 둘로 똑같이 나눠요. 절반만 구해요.` }];
        hintEnd = `${2 * x} ÷ 2 = ${ans}`;
      } else {
        text = `직선 ㅅㅇ을 대칭축으로 하는 선대칭도형이에요. 선분 ${PN}${QN}과 대칭축이 만나서 이루는 각은 몇 도인가요?`;
        ans = 90; pats = [{ value: '180', cause: 'concept', msg: '대응점을 이은 선분은 대칭축과 수직으로 만나요. 수직은 90°예요.' }, { value: '45', cause: 'concept', msg: '대응점을 이은 선분은 대칭축과 수직(90°)으로 만나요.' }];
        hintEnd = '수직이므로 90°';
      }
      return {
        text,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: kind === 'right' ? '°' : 'cm' },
        patterns: pats,
        hints: [`점 ${j(PN, '과/와')} 점 ${QN}은 대응점이에요.`, '대응점끼리 이은 선분은 대칭축과 수직으로 만나고, 대칭축이 그 선분을 둘로 똑같이 나눠요.', hintEnd],
        solution: [`선분 ${PN}${QN}은 대칭축과 수직으로 만나고, 점 ${Mn}이 선분 ${PN}${QN}을 둘로 똑같이 나눠요.`, `${hintEnd}${kind === 'right' ? '' : '(cm)'}`],
        key: `u3s3-perp|${S.pts.map((p) => p.join(',')).join(' ')}|${i}|${x}|${kind}`,
        data: { x, kind, P, Q },
      };
    },
    verify(p) {
      const { x, kind, P, Q } = p.data;
      const ok = Math.abs(P[1] - Q[1]) < 1e-9 && Math.abs(P[0] + Q[0]) < 1e-9; // 대칭축(세로)과 수직, 똑같이 나눔
      const want = { double: 2 * x, half: x, right: 90 }[kind];
      return ok && Number(p.answer.value) === want;
    },
  });

  // 모눈 위에 선대칭도형 완성하기 (점 찍기)
  const tDraw3 = tpl({
    id: 'u3s3-draw', sub: 'u3s3', style: 'A', styleName: '도형 완성하기', levels: [1, 4],
    build(r, lv) {
      const W = 10, H = 7, X = 5;
      for (let t = 0; t < 40; t++) {
        const k = lv <= 2 ? r.int(2, 3) : r.int(3, 4);
        const y1 = r.int(0, 2), y2 = r.int(H - 2, H);
        const ys = r.sample([...Array(H + 1).keys()], k).sort((a, b) => a - b);
        const chain = ys.map((y) => [r.int(X - 4, X - 1), y]);
        // 아래 대칭축 점 → 왼쪽 점들(아래에서 위로) → 위 대칭축 점 → 오른쪽 점들(위에서 아래로)
        const left = [[X, y2], ...chain.slice().sort((a, b) => b[1] - a[1]), [X, y1]];
        const right = chain.slice().sort((a, b) => a[1] - b[1]).map(([x, y]) => [2 * X - x, y]);
        const poly = [...left, ...right];
        if (!g.simple(poly)) continue;
        const ans = right.map((p) => p.join(','));
        const slideD = X - Math.min(...chain.map((p) => p[0]));
        const slide = chain.map(([x, y]) => [x + slideD, y]);
        const pats = [];
        if (slide.every(([x]) => x > X && x <= W)) {
          const v = slide.map((p) => p.join(','));
          if (v.slice().sort().join('|') !== ans.slice().sort().join('|')) pats.push({ value: v, cause: 'concept', msg: '그대로 옮기기만 하면 안 돼요. 대칭축을 기준으로 뒤집어서, 대칭축까지의 거리가 같은 곳에 찍어요.' });
        }
        const segs = left.slice(0, -1).map((p, i) => ({ a: p, b: left[i + 1] }));
        return {
          text: '빨간 직선을 대칭축으로 하는 선대칭도형의 반쪽이에요. 나머지 반쪽의 꼭짓점이 될 점을 모눈 위에 모두 찍으세요.',
          figure: { type: 'geo', grid: { w: W, h: H }, polys: [{ pts: poly, cls: 'ghost' }], segs: [{ a: [X, -0.6], b: [X, H + 0.6], cls: 'axis' }, ...segs], pick: true, scale: 36, pad: 0.7 },
          answer: { type: 'points', values: ans },
          patterns: pats,
          hints: ['대칭축에서 꼭짓점까지의 거리를 모눈 칸으로 세어요.', '같은 높이에서, 대칭축의 반대쪽으로 같은 칸 수만큼 떨어진 곳이 대응점이에요.', chain.map(([x, y]) => `(${X - x}칸 왼쪽 → ${X - x}칸 오른쪽)`).join(', ')],
          solution: ['각 꼭짓점에서 대칭축까지 수직으로 잰 거리와 같은 거리만큼 반대쪽에 대응점을 찍어요.', `찍을 점: ${right.length}개`],
          key: `u3s3-draw|${poly.map((p) => p.join(',')).join(' ')}`,
          data: { chain, X },
        };
      }
      return null;
    },
    verify(p) {
      const { chain, X } = p.data;
      const want = chain.map(([x, y]) => `${2 * X - x},${y}`).sort().join('|');
      return p.answer.values.slice().sort().join('|') === want;
    },
  });

  const OX3 = [
    { s: '직사각형의 대각선은 대칭축이에요.', t: false, why: '직사각형을 대각선을 따라 접으면 완전히 겹치지 않아서 대칭축이 아니에요.', wrong: ['대각선은 도형을 똑같이 둘로 나누니까요.', '모든 사각형의 대각선은 대칭축이니까요.'] },
    { s: '선대칭도형에서 대응점을 이은 선분은 대칭축과 수직으로 만나요.', t: true, why: '대칭축을 따라 접으면 대응점이 겹치기 때문에 이은 선분은 대칭축과 90°로 만나요.', wrong: ['대응점을 이은 선분은 대칭축과 항상 평행하니까요.', '대응점끼리는 길이가 같으니까요.'] },
    { s: '정사각형의 대칭축은 2개예요.', t: false, why: '가로·세로 가운데 선 2개와 대각선 2개로 대칭축은 4개예요.', wrong: ['가로와 세로로만 접을 수 있으니까요.', '대각선으로 접으면 겹치지 않으니까요.'] },
    { s: '선대칭도형에서 대칭축은 대응점을 이은 선분을 둘로 똑같이 나눠요.', t: true, why: '대칭축에서 두 대응점까지의 거리가 같아서 선분이 똑같이 나뉘어요.', wrong: ['대칭축은 항상 도형의 가운데를 지나니까요.', '대응점끼리 이은 선분은 대칭축이니까요.'] },
    { s: '원은 선대칭도형이 아니에요.', t: false, why: '원은 중심을 지나는 어떤 직선으로 접어도 완전히 겹쳐서 대칭축이 셀 수 없이 많아요.', wrong: ['원에는 꼭짓점이 없으니까요.', '원은 접으면 모양이 바뀌니까요.'] },
  ];
  const OX4 = [
    { s: '평행사변형은 점대칭도형이에요.', t: true, why: '두 대각선이 만나는 점을 중심으로 180° 돌리면 처음 도형과 완전히 겹쳐요.', wrong: ['평행사변형은 접으면 완전히 겹치니까요.', '마주 보는 변이 평행하면 모두 선대칭도형이니까요.'] },
    { s: '정삼각형은 점대칭도형이에요.', t: false, why: '정삼각형은 180° 돌리면 꼭짓점이 아래로 가서 처음 도형과 겹치지 않아요. 선대칭도형이에요.', wrong: ['세 변의 길이가 같으니까요.', '대칭축이 3개 있으니까요.'] },
    { s: '점대칭도형에서 대응점을 이은 선분은 대칭의 중심을 지나요.', t: true, why: '180° 돌렸을 때 겹치는 두 점은 대칭의 중심을 사이에 두고 같은 거리만큼 떨어져 있어요.', wrong: ['대응점끼리는 항상 수직으로 만나니까요.', '대칭의 중심은 도형의 꼭짓점이니까요.'] },
    { s: '점대칭도형에서 대칭의 중심은 여러 개일 수 있어요.', t: false, why: '점대칭도형에서 대칭의 중심은 항상 1개예요.', wrong: ['대칭축처럼 여러 개 있을 수 있으니까요.', '대응점마다 대칭의 중심이 따로 있으니까요.'] },
    { s: '디지털 숫자 6을 180° 돌리면 9가 돼요.', t: true, why: '6의 위쪽과 아래쪽이 거꾸로 바뀌어 9 모양이 돼요.', wrong: ['6과 9는 모양이 같은 숫자니까요.', '180° 돌리면 모든 숫자가 그대로니까요.'] },
  ];

  // 알파벳 선대칭
  const LET_YES = ['A', 'H', 'I', 'M', 'O', 'T', 'U', 'V', 'W', 'X', 'Y', 'E', 'C', 'D'];
  const LET_NO = ['F', 'G', 'J', 'L', 'N', 'P', 'Q', 'R', 'S', 'Z'];
  const LET_POINT = ['N', 'S', 'Z'];
  const tLetters = tpl({
    id: 'u3s3-letters', sub: 'u3s3', style: 'B', styleName: '생활 속 대칭', levels: [1, 4],
    build(r) {
      const ny = r.int(2, 3);
      const yes = r.sample(LET_YES, ny);
      const no = r.sample(LET_NO, 5 - ny);
      const pick = r.shuffle([...yes, ...no]);
      const trap = no.find((c) => LET_POINT.includes(c));
      return {
        text: '다음 알파벳 중 선대칭도형인 것을 모두 고르세요.',
        answer: { type: 'multi', options: pick.map((c) => ({ text: c, key: c, correct: yes.includes(c) })) },
        patterns: trap ? [{ value: [...yes, trap], cause: 'concept', msg: `${trap}는 180° 돌리면 겹치는 점대칭도형이지만, 어떤 직선으로 접어도 완전히 겹치지 않아요.` }] : [],
        hints: ['글자를 세로 선이나 가로 선으로 반을 접었을 때 완전히 겹치는지 봐요.', 'A, H, M처럼 세로로 접어 겹치는 글자도 있고, E, C, D처럼 가로로 접어 겹치는 글자도 있어요.', `선대칭인 글자: ${yes.slice().sort().join(', ')}`],
        solution: [`${j(yes.slice().sort().join(', '), '은/는')} 접었을 때 완전히 겹쳐요.`],
        key: `u3s3-letters|${pick.join('')}`,
        data: {},
      };
    },
    verify(p) { return p.answer.options.every((o, i) => LET_YES.includes(o.text) === p.answer.values.includes(i)); },
  });

  const tLine3 = TB.lineFind({
    id: 'u3s3-line', unit: 3, sub: 'u3s3', levels: [1, 4],
    gen(r) {
      const A = r.int(10, 24) * 5, C = r.int(14, 24) * 5;
      const D = 360 - A - 2 * C;
      if (D < 30 || D > 150) return null;
      const L = [`각 ㄱㄹㄷ의 대응각은 각 ㄱㄴㄷ이므로 각 ㄱㄹㄷ = ${C}°`, '사각형 ㄱㄴㄷㄹ의 네 각의 합은 360°', `각 ㄴㄷㄹ = 360° - ${A}° - ${C}° - ${C}° = ${D}°`];
      const kind = r.int(0, 2), err = r.pick([10, -10, 20]);
      const bad = [
        { i: 0, line: `각 ㄱㄹㄷ의 대응각은 각 ㄴㄱㄹ이므로 각 ㄱㄹㄷ = ${A}°`, msg: '대칭축 ㄱㄷ을 따라 접으면 각 ㄱㄹㄷ은 각 ㄱㄴㄷ과 겹쳐요.', after: [L[1], `각 ㄴㄷㄹ = 360° - ${A}° - ${C}° - ${A}° = ${360 - 2 * A - C}°`] },
        { i: 1, line: '사각형 ㄱㄴㄷㄹ의 네 각의 합은 180°', msg: '사각형의 네 각의 합은 360°예요.', after: [`각 ㄴㄷㄹ = 180° - ${A}° - ${C}° - ${C}° = ?`] },
        { i: 2, line: `각 ㄴㄷㄹ = 360° - ${A}° - ${C}° - ${C}° = ${D + err}°`, msg: `360 - ${A} - ${C} - ${C}을 다시 계산하면 ${D}이에요.`, after: [`따라서 각 ㄴㄷㄹ은 ${D + err}°`] },
      ][kind];
      if (kind === 0 && 360 - 2 * A - C <= 0) return null;
      return { problem: `"직선 ㄱㄷ을 대칭축으로 하는 선대칭도형 ㄱㄴㄷㄹ에서 각 ㄴㄱㄹ이 ${A}°, 각 ㄱㄴㄷ이 ${C}°일 때 각 ㄴㄷㄹ의 크기"를`, verb: '구한', lines: L, bad: { i: bad.i, line: bad.line, msg: bad.msg }, after: bad.after, key: `${A}|${C}|${kind}|${err}` };
    },
  });

  // ======================================================================
  // 소단원 4: 점대칭도형과 그 성질
  // ======================================================================
  const tWhich4 = tpl({
    id: 'u3s4-which', sub: 'u3s4', style: 'A', styleName: '점대칭도형 찾기', levels: [1, 4],
    build(r) {
      const yes = g.NAMED.filter((s) => s.point), no = g.NAMED.filter((s) => !s.point);
      const ny = r.int(2, 3);
      const pick = r.shuffle([...r.sample(yes, ny), ...r.sample(no, 5 - ny)]);
      const right = pick.filter((s) => s.point).map((s) => s.name);
      const trap = pick.find((s) => !s.point && s.axes > 0);
      return {
        text: '다음 중 점대칭도형을 모두 고르세요.',
        answer: { type: 'multi', options: pick.map((s) => ({ figure: namedFig(s), key: s.name, correct: s.point })) },
        patterns: trap ? [{ value: [...right, trap.name], cause: 'concept', msg: `${j(trap.name, '은/는')} 선대칭도형이지만, 180° 돌리면 처음 도형과 겹치지 않아요.` }] : [],
        hints: ['도형의 한가운데에 핀을 꽂고 180° 돌린다고 생각해요.', '돌린 도형이 처음 도형과 완전히 겹치는지 봐요. 접어서 겹치는 것(선대칭)과는 달라요.', `점대칭도형: ${right.join(', ')}`],
        solution: [`점대칭도형은 ${right.join(', ')}이에요.`],
        key: `u3s4-which|${pick.map((s) => s.name).join('/')}`,
        data: {},
      };
    },
    verify(p) { return p.answer.options.every((o, i) => byName(o.key).point === p.answer.values.includes(i)); },
  });

  // 점대칭인 육각형·평행사변형: 앞 절반 꼭짓점 v, 뒤 절반은 -v (대칭의 중심 = 원점)
  function pointShape(r, half) {
    for (let t = 0; t < 80; t++) {
      const base = r.int(0, 20);
      const ths = half === 2 ? [base, base + r.int(55, 120)] : [base, base + r.int(45, 75), base + r.int(105, 140)];
      const vs = ths.map((d) => { const R = 1.5 + r.int(0, 8) * 0.15; return [R * Math.cos(g.rad(180 + d)), R * Math.sin(g.rad(180 + d))]; });
      const pts = [...vs, ...vs.map(([x, y]) => [-x, -y])];
      if (!g.simple(pts)) continue;
      const angs = pts.map((_, i) => g.angleAt(pts, i));
      if (angs.some((a) => a < 45 || a > 175)) continue;
      return pts.map(([x, y]) => [x * 1.4, y * 1.4]);
    }
    return null;
  }
  const centerOf = () => [0, 0];
  function pointFig(pts, names, extra = {}) {
    const f = g.merge(g.labeled(pts, names), { dots: [{ p: centerOf(), t: 'ㅇ', c: [0.4, 1] }], scale: 42 }, extra);
    return f;
  }
  const lensOf = (r, pts, k) => {
    const n = pts.length;
    const real = pts.map((_, i) => g.dist(pts[i], pts[(i + 1) % n])).slice(0, k);
    const sc = r.int(3, 7) / Math.min(...real);
    return real.map((v) => Math.max(2, Math.round(v * sc)));
  };

  const tSide4 = tpl({
    id: 'u3s4-side', sub: 'u3s4', style: 'A', styleName: '대응변의 길이', levels: [1, 4],
    build(r, lv) {
      const half = lv <= 2 ? 2 : 3;
      const pts = pointShape(r, half);
      if (!pts) return null;
      const n = pts.length, names = LB.slice(0, n);
      const lens = lensOf(r, pts, half);
      if (new Set(lens).size < half) return null;
      const i = r.int(0, half - 1), oi = i + half;
      const c = [0, 0];
      const fig = pointFig(pts, names);
      fig.sides = lens.map((v, q) => ({ a: pts[q], b: pts[q + 1], t: cm(v), c }));
      const sn = (a) => names[a % n] + names[(a + 1) % n];
      return {
        text: `점 ㅇ을 대칭의 중심으로 하는 점대칭도형이에요. 변 ${sn(oi)}의 길이는 몇 cm인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(lens[i]), unit: 'cm' },
        patterns: lens.map((v, q) => ({ value: String(v), cause: 'concept', msg: `변 ${sn(oi)}의 대응변은 변 ${sn(i)}이에요. 점 ㅇ을 중심으로 180° 돌렸을 때 겹치는 변을 찾아요.` })).filter((_, q) => q !== i),
        hints: ['점 ㅇ을 중심으로 180° 돌리면 겹치는 변끼리 길이가 같아요.', `점 ${names[oi]}의 대응점은 점 ㅇ의 반대쪽에 있는 점 ${names[i]}이에요.`, `변 ${sn(oi)}의 대응변은 변 ${sn(i)} → ${cm(lens[i])}`],
        solution: [`변 ${sn(oi)}의 대응변은 변 ${sn(i)}이에요.`, `대응변의 길이는 같으므로 ${cm(lens[i])}예요.`],
        key: `u3s4-side|${pts.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' ')}|${lens.join(',')}|${i}`,
        data: { pts, lens, i },
      };
    },
    verify(p) {
      const { pts, i } = p.data, n = pts.length, h = n / 2;
      return Math.abs(g.dist(pts[i], pts[i + 1]) - g.dist(pts[i + h], pts[(i + h + 1) % n])) < 1e-9 && Number(p.answer.value) === p.data.lens[i];
    },
  });

  // 평행사변형(점대칭)의 각
  const tAngle4 = tpl({
    id: 'u3s4-angle', sub: 'u3s4', style: 'A', styleName: '대응각으로 각도 구하기', levels: [1, 4],
    build(r, lv) {
      const a = lv <= 2 ? r.int(8, 16) * 5 : r.int(40, 80);
      const L = 4.4, Hh = 2.6;
      const dx = Hh / Math.tan(g.rad(a));
      // ㄱ 왼쪽 위, ㄴ 왼쪽 아래 … 각 ㄴ(왼쪽 아래)이 a
      const pts = [[dx, 0], [0, Hh], [L, Hh], [L + dx, 0]];
      const c = [L / 2 + dx / 2, Hh / 2];
      const P = pts.map(([x, y]) => [x - c[0], y - c[1]]);
      const names = LB.slice(0, 4);
      const kind = r.pick(lv === 1 ? ['same'] : ['same', 'next']);
      const ask = kind === 'same' ? 3 : r.pick([0, 2]); // 각 ㄹ(대응각) / 각 ㄱ 또는 각 ㄷ (이웃한 각)
      const angName = (i) => names[(i + 3) % 4] + names[i] + names[(i + 1) % 4];
      const fig = pointFig(P, names, { angles: [{ v: P[1], a: P[0], b: P[2], t: dg(a) }, { v: P[ask], a: P[(ask + 3) % 4], b: P[(ask + 1) % 4], t: '?' }] });
      const ans = kind === 'same' ? a : 180 - a;
      const pats = kind === 'same'
        ? [{ value: String(180 - a), cause: 'concept', msg: `각 ${angName(3)}은 각 ${angName(1)}의 대응각이에요. 점 ㅇ을 중심으로 180° 돌리면 겹쳐요.` }]
        : [{ value: String(a), cause: 'concept', msg: `각 ${angName(1)}의 대응각은 각 ${angName(3)}이에요. 각 ${angName(ask)}은 대응각이 아니에요.` },
          { value: String(360 - 2 * a), cause: 'condition', msg: `각 ${angName(0)}과 각 ${angName(2)}은 대응각이라서 크기가 같아요. 남은 ${dg(360 - 2 * a)}를 2로 나눠야 해요.` },
          { value: String(360 - a), cause: 'condition', msg: `각 ${angName(3)}도 대응각이라서 ${dg(a)}예요. 360°에서 ${dg(a)}를 두 번 빼요.` }];
      return {
        text: `점 ㅇ을 대칭의 중심으로 하는 점대칭도형 ㄱㄴㄷㄹ이에요. 각 ${angName(ask)}의 크기는 몇 도인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: '°' },
        patterns: pats.filter((pt) => Number(pt.value) !== ans),
        hints: ['점 ㅇ을 중심으로 180° 돌렸을 때 겹치는 각(대응각)은 크기가 같아요.', kind === 'same' ? `점 ㄴ의 대응점은 점 ㄹ이에요.` : `각 ${angName(1)} = 각 ${angName(3)} = ${dg(a)}, 각 ${angName(0)} = 각 ${angName(2)}, 네 각의 합은 360°예요.`, kind === 'same' ? `각 ${angName(3)} = 각 ${angName(1)} = ${dg(a)}` : `(360° - ${dg(a)} - ${dg(a)}) ÷ 2 = ${dg(ans)}`],
        solution: kind === 'same' ? [`각 ${angName(3)}은 각 ${angName(1)}의 대응각이라서 ${dg(a)}예요.`] : [`각 ${angName(3)} = ${dg(a)} (대응각)`, `각 ${angName(0)} + 각 ${angName(2)} = 360° - ${dg(a)} - ${dg(a)} = ${dg(360 - 2 * a)}`, `각 ${angName(ask)} = ${dg(360 - 2 * a)} ÷ 2 = ${dg(ans)}`],
        key: `u3s4-angle|${a}|${kind}|${ask}`,
        data: { P, ask },
      };
    },
    verify(p) { return Math.abs(g.angleAt(p.data.P, p.data.ask) - Number(p.answer.value)) < 1e-6; },
  });

  // 12번: 점대칭도형의 둘레
  const tPerim4 = tpl({
    id: 'u3s4-perim', sub: 'u3s4', style: 'A', styleName: '점대칭도형의 둘레', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const half = lv <= 1 ? 2 : r.pick([2, 3, 3]);
      const pts = pointShape(r, half);
      if (!pts) return null;
      const n = pts.length, names = LB.slice(0, n);
      const lens = lensOf(r, pts, half);
      // 변마다 자기 자신 또는 대응변 중 한쪽에만 길이를 적는다
      const where = lens.map(() => r.int(0, 1));
      const fig = pointFig(pts, names);
      fig.sides = lens.map((v, q) => { const s = q + where[q] * half; return { a: pts[s], b: pts[(s + 1) % n], t: cm(v), c: [0, 0] }; });
      const ans = 2 * sum(lens);
      return {
        text: `점 ㅇ을 대칭의 중심으로 하는 점대칭도형이에요. 이 도형의 둘레는 몇 cm인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [{ value: String(sum(lens)), cause: 'condition', msg: '길이가 적힌 변만 더했어요. 길이가 적히지 않은 대응변도 길이가 같아요.' },
          ...(half === 3 ? [{ value: String(2 * sum(lens.slice(0, 2))), cause: 'condition', msg: '빠뜨린 변이 있어요. 변을 하나씩 짚으며 모두 세어 봐요.' }] : [])],
        hints: ['점대칭도형에서 대응변의 길이는 같아요.', `변이 ${n}개이고, 길이가 같은 변끼리 ${half}쌍이에요.`, `(${lens.join(' + ')}) × 2 = ${ans}`],
        solution: [`대응변의 길이가 같으므로 적힌 길이마다 같은 변이 하나씩 더 있어요.`, `(${lens.join(' + ')}) × 2 = ${sum(lens)} × 2 = ${ans}(cm)`],
        key: `u3s4-perim|${pts.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' ')}|${lens.join(',')}|${where.join('')}`,
        data: { pts, lens },
      };
    },
    verify(p) {
      const { pts, lens } = p.data, n = pts.length, h = n / 2;
      for (let i = 0; i < h; i++) if (Math.abs(g.dist(pts[i], pts[i + 1]) - g.dist(pts[i + h], pts[(i + h + 1) % n])) > 1e-9) return false;
      return Number(p.answer.value) === 2 * sum(lens);
    },
  });

  // 14번: 대칭의 중심과 대응점
  const tCenter = tpl({
    id: 'u3s4-center', sub: 'u3s4', style: 'A', styleName: '대칭의 중심', levels: [1, 4],
    build(r, lv) {
      const pts = pointShape(r, r.pick([2, 3]));
      if (!pts) return null;
      const n = pts.length, h = n / 2, names = LB.slice(0, n);
      const i = r.int(0, h - 1), oi = i + h;
      const x = r.int(2, 9) + (lv >= 3 && r.chance(0.4) ? 0.5 : 0);
      const kind = r.pick(['double', 'half']);
      const fig = pointFig(pts, names, { segs: [{ a: pts[i], b: pts[oi], cls: 'dash' }] });
      const PN = names[i], QN = names[oi];
      if (kind === 'double') fig.sides = [{ a: pts[i], b: [0, 0], t: cm(x), c: pts[(i + 1) % n], d: 0.45 }];
      else fig.sides = [{ a: pts[i], b: pts[oi], t: cm(2 * x), c: pts[(i + 1) % n], d: 0.45 }];
      const ans = kind === 'double' ? 2 * x : x;
      return {
        text: kind === 'double' ? `점 ㅇ을 대칭의 중심으로 하는 점대칭도형이에요. 선분 ${PN}ㅇ이 ${cm(x)}일 때 선분 ${PN}${QN}의 길이는 몇 cm인가요?` : `점 ㅇ을 대칭의 중심으로 하는 점대칭도형이에요. 선분 ${PN}${QN}이 ${cm(2 * x)}일 때 선분 ${QN}ㅇ의 길이는 몇 cm인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [{ value: String(kind === 'double' ? x : 2 * x), cause: 'concept', msg: `대칭의 중심 ㅇ은 대응점 ${PN}, ${QN}을 이은 선분을 둘로 똑같이 나눠요.` }],
        hints: [`점 ${j(PN, '과/와')} 점 ${QN}은 대응점이에요.`, '대응점끼리 이은 선분은 대칭의 중심을 지나고, 대칭의 중심이 그 선분을 둘로 똑같이 나눠요.', kind === 'double' ? `${x} × 2 = ${ans}` : `${2 * x} ÷ 2 = ${ans}`],
        solution: [`선분 ${PN}ㅇ = 선분 ${QN}ㅇ`, kind === 'double' ? `선분 ${PN}${QN} = ${x} × 2 = ${ans}(cm)` : `선분 ${QN}ㅇ = ${2 * x} ÷ 2 = ${ans}(cm)`],
        key: `u3s4-center|${n}|${i}|${x}|${kind}|${pts[0].map((v) => v.toFixed(1)).join(',')}`,
        data: { x, kind, P: pts[i], Q: pts[oi] },
      };
    },
    verify(p) {
      const { x, kind, P, Q } = p.data;
      return Math.abs(P[0] + Q[0]) < 1e-9 && Math.abs(P[1] + Q[1]) < 1e-9 && Number(p.answer.value) === (kind === 'double' ? 2 * x : x);
    },
  });

  // 17번: 일부분을 보고 완성된 점대칭도형의 넓이
  const tArea4 = tpl({
    id: 'u3s4-area', sub: 'u3s4', style: 'A', styleName: '완성한 도형의 넓이', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const kind = r.pick(lv === 1 ? ['rtri', 'rect'] : ['rtri', 'rect', 'tri']);
      const a = r.int(3, 12) * (lv >= 3 ? 2 : 1), b = r.int(3, 10) * (lv >= 3 ? 2 : 1);
      const u = 5 / Math.max(a, b);
      let fig, ans, part, what;
      if (kind === 'rtri') {
        // 직각삼각형 ㄱㄷㄴ (ㄷ이 직각), 대칭의 중심은 빗변 ㄱㄴ의 가운데
        const A = [0, 0], C = [a * u, 0], B = [a * u, b * u], O = [a * u / 2, b * u / 2];
        fig = { type: 'geo', polys: [{ pts: [A, C, B], cls: 'shape-c' }, { pts: [A, B, [0, b * u]], cls: 'dash' }], dots: [{ p: O, t: 'ㅇ', c: [O[0] - 1, O[1] + 1] }], labels: [{ p: A, t: 'ㄱ', c: O }, { p: C, t: 'ㄷ', c: O }, { p: B, t: 'ㄴ', c: O }], sides: [{ a: A, b: C, t: cm(a), c: O }, { a: C, b: B, t: cm(b), c: O }], angles: [{ v: C, a: A, b: B, right: true }], scale: 40 };
        ans = a * b; part = a * b / 2; what = '직사각형';
      } else if (kind === 'rect') {
        const O = [a * u, b * u / 2];
        fig = { type: 'geo', polys: [{ pts: [[0, 0], [a * u, 0], [a * u, b * u], [0, b * u]], cls: 'shape-c' }, { pts: [[a * u, 0], [2 * a * u, 0], [2 * a * u, b * u], [a * u, b * u]], cls: 'dash' }], dots: [{ p: O, t: 'ㅇ', c: [O[0] - 1, O[1]] }], sides: [{ a: [0, 0], b: [a * u, 0], t: cm(a), c: [0, b * u] }, { a: [0, 0], b: [0, b * u], t: cm(b), c: [a * u, 0] }], scale: 34 };
        ans = 2 * a * b; part = a * b; what = '직사각형';
      } else {
        // 삼각형 ㄱㄴㄷ, 대칭의 중심은 변 ㄴㄷ의 가운데 → 평행사변형
        const s = r.int(1, 3) * a * u / 4;
        const P = [0, b * u], Q = [a * u, b * u], R = [s, 0], O = [(Q[0] + R[0]) / 2, (Q[1] + R[1]) / 2];
        const P2 = [2 * O[0] - P[0], 2 * O[1] - P[1]];
        fig = { type: 'geo', polys: [{ pts: [P, Q, R], cls: 'shape-c' }, { pts: [R, Q, P2], cls: 'dash' }], segs: [{ a: R, b: [s, b * u], cls: 'dash' }], dots: [{ p: O, t: 'ㅇ', c: [O[0] + 1, O[1] + 1] }], labels: [{ p: R, t: 'ㄱ', c: g.centroid([P, Q, R]) }, { p: P, t: 'ㄴ', c: g.centroid([P, Q, R]) }, { p: Q, t: 'ㄷ', c: g.centroid([P, Q, R]) }], sides: [{ a: P, b: Q, t: cm(a), c: R }, { a: R, b: [s, b * u], t: cm(b), c: P, d: 0.55 }], angles: [{ v: [s, b * u], a: R, b: Q, right: true }], scale: 40 };
        ans = a * b; part = a * b / 2; what = '평행사변형';
        if (s >= a * u) return null;
      }
      if (!Number.isInteger(part * 2)) return null;
      return {
        text: `점 ㅇ을 대칭의 중심으로 하는 점대칭도형의 일부분이에요. 점선까지 그려 완성한 점대칭도형(${what})의 넓이는 몇 cm²인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: 'cm²' },
        patterns: [{ value: String(part), cause: 'condition', msg: '주어진 부분의 넓이만 구했어요. 180° 돌린 나머지 부분까지 넓이가 2배예요.' }, { value: String(ans * 2), cause: 'concept', msg: '완성된 도형은 주어진 부분의 2배예요. 한 번만 2배 해요.' }].filter((pt) => Number.isInteger(Number(pt.value))),
        hints: ['주어진 부분을 점 ㅇ을 중심으로 180° 돌리면 나머지 부분이 생겨요. 두 부분은 합동이에요.', `주어진 부분의 넓이: ${kind === 'rect' ? `${a} × ${b} = ${part}` : `${a} × ${b} ÷ 2 = ${part}`}`, `완성된 도형의 넓이: ${part} × 2 = ${ans}`],
        solution: [`주어진 부분의 넓이: ${kind === 'rect' ? `${a} × ${b}` : `${a} × ${b} ÷ 2`} = ${part}(cm²)`, `완성된 ${what}의 넓이: ${part} × 2 = ${ans}(cm²)`],
        key: `u3s4-area|${kind}|${a}|${b}`,
        data: { kind, a, b },
      };
    },
    verify(p) { const { kind, a, b } = p.data; return Number(p.answer.value) === (kind === 'rect' ? 2 * a * b : a * b); },
  });

  // 모눈 위에 점대칭도형 완성하기 (점 찍기)
  const move = (dx, dy) => [dx > 0 ? `오른쪽 ${dx}칸` : dx < 0 ? `왼쪽 ${-dx}칸` : '', dy > 0 ? `아래 ${dy}칸` : dy < 0 ? `위 ${-dy}칸` : ''].filter(Boolean).join(', ');
  const tDraw4 = tpl({
    id: 'u3s4-draw', sub: 'u3s4', style: 'A', styleName: '도형 완성하기', levels: [1, 4],
    build(r, lv) {
      const W = 10, H = 8, C = [5, 4];
      for (let t = 0; t < 60; t++) {
        const P = [r.int(1, 4), r.int(1, 7)];
        const P2 = [2 * C[0] - P[0], 2 * C[1] - P[1]];
        if (P[0] === C[0] && P[1] === C[1]) continue;
        const k = lv <= 2 ? 2 : r.int(2, 3);
        const chain = Array.from({ length: k }, () => [r.int(0, W), r.int(0, H)]);
        const mirror = chain.map(([x, y]) => [2 * C[0] - x, 2 * C[1] - y]);
        if (mirror.some(([x, y]) => x < 0 || x > W || y < 0 || y > H)) continue;
        const poly = [P, ...chain, P2, ...mirror];
        if (!g.simple(poly)) continue;
        // 중심은 도형 안쪽에 (넓이가 너무 작지 않게)
        if (g.area(poly) < 10) continue;
        const ans = mirror.map((p) => p.join(','));
        const pats = [];
        for (const [f, msg] of [[([x, y]) => [2 * C[0] - x, y], '좌우로 뒤집기만 하면 선대칭이에요. 점 ㅇ을 지나 반대쪽으로, 같은 거리만큼 떨어진 곳에 찍어요.'], [([x, y]) => [x, 2 * C[1] - y], '위아래로 뒤집기만 하면 안 돼요. 점 ㅇ을 중심으로 180° 돌린 자리에 찍어요.']]) {
          const v = chain.map(f);
          if (v.every(([x, y]) => x >= 0 && x <= W && y >= 0 && y <= H)) {
            const vs = v.map((p) => p.join(','));
            if (vs.slice().sort().join('|') !== ans.slice().sort().join('|') && !pats.some((q) => q.value.slice().sort().join('|') === vs.slice().sort().join('|'))) pats.push({ value: vs, cause: 'concept', msg });
          }
        }
        const path = [P, ...chain, P2];
        return {
          text: '점 ㅇ을 대칭의 중심으로 하는 점대칭도형의 반쪽이에요. 나머지 반쪽의 꼭짓점이 될 점을 모눈 위에 모두 찍으세요.',
          figure: { type: 'geo', grid: { w: W, h: H }, polys: [{ pts: poly, cls: 'ghost' }], segs: path.slice(0, -1).map((p, i) => ({ a: p, b: path[i + 1] })), dots: [{ p: C, t: 'ㅇ', c: [C[0] - 1, C[1] - 1] }], pick: true, scale: 34, pad: 0.7 },
          answer: { type: 'points', values: ans },
          patterns: pats,
          hints: ['꼭짓점에서 점 ㅇ까지 가는 방향과 칸 수를 세어요.', '점 ㅇ을 지나 반대 방향으로 같은 칸 수만큼 더 가면 대응점이에요.', chain.map(([x, y]) => `꼭짓점에서 점 ㅇ까지 ${move(C[0] - x, C[1] - y)}`).join(' / ') + ' → 점 ㅇ에서 똑같이 한 번 더 가요.'],
          solution: ['각 꼭짓점에서 점 ㅇ을 지나는 직선을 긋고, 점 ㅇ에서 같은 거리만큼 떨어진 곳에 대응점을 찍어요.', `찍을 점: ${mirror.length}개`],
          key: `u3s4-draw|${poly.map((p) => p.join(',')).join(' ')}`,
          data: { chain, C },
        };
      }
      return null;
    },
    verify(p) {
      const { chain, C } = p.data;
      return p.answer.values.slice().sort().join('|') === chain.map(([x, y]) => `${2 * C[0] - x},${2 * C[1] - y}`).sort().join('|');
    },
  });

  // 디지털 숫자 (심화 3)
  const ROT = { 0: '0', 1: '1', 2: '2', 5: '5', 6: '9', 8: '8', 9: '6' };
  const rotNum = (s) => { let o = ''; for (const c of s) { if (ROT[c] == null) return null; o = ROT[c] + o; } return o; };
  const DIGIT_SETS = [[0, 1, 5, 6, 9], [2, 5, 6, 8, 9], [0, 1, 2, 8, 6, 9], [1, 6, 8, 9], [0, 2, 5, 6, 9], [1, 2, 5, 8], [0, 1, 2, 3, 4, 6, 7, 8, 9], [2, 3, 5, 6, 8, 9]];
  const tDigits = tpl({
    id: 'u3s4-digits', sub: 'u3s4', style: 'A', styleName: '180° 돌린 디지털 수', levels: [2, 4], weak: ['concept'],
    build(r, lv) {
      const D = r.pick(DIGIT_SETS).map(String);
      const len = lv === 2 ? 3 : 4;
      const all = [];
      const make = (k, pre) => { if (k === 0) { all.push(pre); return; } for (const d of D) if (!(pre === '' && d === '0')) make(k - 1, pre + d); };
      make(len, '');
      const good = all.filter((s) => rotNum(s) === s);
      const order = all.filter((s) => rotNum(s) !== s && s.split('').every((c) => ROT[c] === c) && s !== s.split('').reverse().join(''));
      const pal = all.filter((s) => rotNum(s) !== s && s === s.split('').reverse().join('') && /[69]/.test(s));
      const other = all.filter((s) => rotNum(s) !== s && !order.includes(s) && !pal.includes(s));
      if (good.length < 2 || (!order.length && !pal.length) || !other.length) return null;
      const right = r.sample(good, r.int(1, Math.min(3, good.length)));
      const traps = [];
      if (order.length) traps.push({ v: r.pick(order), kind: 'order' });
      if (pal.length) traps.push({ v: r.pick(pal), kind: 'pal' });
      const rest = r.sample(other, 5 - right.length - traps.length);
      if (right.length + traps.length + rest.length !== 5) return null;
      const opts = r.shuffle([...right, ...traps.map((t) => t.v), ...rest]);
      const tO = traps.find((t) => t.kind === 'order'), tP = traps.find((t) => t.kind === 'pal');
      const pats = [];
      const ORDER = '180° 돌리면 숫자의 순서도 거꾸로 바뀌어요. 맨 앞 숫자가 맨 뒤로 가요.';
      const SIX = '6을 180° 돌리면 9, 9를 돌리면 6이 돼요. 6과 9는 서로 바뀌어요.';
      if (tO) pats.push({ value: [...right, tO.v], cause: 'concept', msg: `${tO.v}: ${ORDER} ${j(tO.v, '을/를')} 돌리면 ${j(rotNum(tO.v), '이에요/예요')}.` });
      if (tP) pats.push({ value: [...right, tP.v], cause: 'concept', msg: `${tP.v}: ${SIX} ${j(tP.v, '을/를')} 돌리면 ${j(rotNum(tP.v), '이에요/예요')}.` });
      if (tO && tP) pats.push({ value: [...right, tO.v, tP.v], cause: 'concept', msg: `${ORDER} 그리고 ${SIX}` });
      return {
        text: `다음과 같은 디지털 숫자로 만든 수예요. 한 점을 중심으로 180° 돌려도 같은 수를 나타내는 것을 모두 고르세요.`,
        figure: { type: 'digits', nums: D, rot: true },
        answer: { type: 'multi', options: opts.map((s) => ({ text: s, key: s, correct: right.includes(s) })) },
        patterns: pats,
        hints: ['아래 단추로 숫자를 하나씩 돌려 봐요. 0, 1, 2, 5, 8은 그대로, 6과 9는 서로 바뀌어요. 3, 4, 7은 숫자가 되지 않아요.', '수 전체를 180° 돌리면 숫자의 순서도 거꾸로 돼요. 맨 앞 숫자를 돌린 것이 맨 뒤로 가요.', `보기마다 돌린 수: ${opts.map((s) => `${s} → ${rotNum(s) || '숫자가 안 돼요'}`).join(', ')}`],
        solution: [opts.map((s) => `${s} → ${rotNum(s) || '숫자가 안 돼요'}`).join(', '), `같은 수: ${right.slice().sort().join(', ')}`],
        key: `u3s4-digits|${D.join('')}|${opts.join(',')}`,
        data: {},
      };
    },
    verify(p) { return p.answer.options.every((o, i) => (rotNum(o.text) === o.text) === p.answer.values.includes(i)); },
  });

  // 3-2: 조건에 맞는 수 세기
  const tDigCount = tpl({
    id: 'u3s4-digcount', sub: 'u3s4', style: 'A', styleName: '180° 돌린 디지털 수', levels: [3, 4], weak: ['concept'],
    build(r) {
      const D = r.pick(DIGIT_SETS).map(String);
      const len = r.pick([3, 4]);
      const all = [];
      const make = (k, pre) => { if (k === 0) { all.push(pre); return; } for (const d of D) if (!(pre === '' && d === '0')) make(k - 1, pre + d); };
      make(len, '');
      const lo = 10 ** (len - 1), hi = 10 ** len;
      const kind = r.pick(['less', 'range', 'all']);
      let a = lo, b = hi - 1, cond;
      if (kind === 'less') { b = r.int(2, 9) * lo - 1; cond = `${b + 1}보다 작은`; }
      else if (kind === 'range') { a = r.int(1, 8) * lo; b = a + lo; cond = `${a}부터 ${b}까지의`; }
      else cond = '';
      const inR = (s) => Number(s) >= a && Number(s) <= b;
      const good = all.filter((s) => rotNum(s) === s && inR(s));
      if (good.length < 1 || good.length > 40) return null;
      const palNo69 = all.filter((s) => s === s.split('').reverse().join('') && s.split('').every((c) => ROT[c] != null) && inR(s)).length;
      const noRange = all.filter((s) => rotNum(s) === s).length;
      const pats = [
        { value: String(palNo69), cause: 'concept', msg: '6을 돌리면 9, 9를 돌리면 6이 돼요. 앞뒤가 같은 수가 아니라 돌린 수가 같은 수를 세요.' },
        ...(kind !== 'all' ? [{ value: String(noRange), cause: 'condition', msg: `"${cond}" 조건에 맞는 수만 세어야 해요.` }] : []),
      ].filter((pt) => Number(pt.value) !== good.length);
      return {
        text: `다음 디지털 숫자로 ${len === 3 ? '세' : '네'} 자리 수를 만들려고 해요. ${cond ? cond + ' ' : ''}${len === 3 ? '세' : '네'} 자리 수 중에서 한 점을 중심으로 180° 돌려도 같은 수는 모두 몇 개인가요? (같은 숫자를 여러 번 쓸 수 있어요.)`,
        figure: { type: 'digits', nums: D, rot: true },
        answer: { type: 'num', value: String(good.length), unit: '개' },
        patterns: pats,
        hints: ['0, 1, 2, 5, 8은 180° 돌려도 그대로이고, 6과 9는 서로 바뀌어요. 3, 4, 7은 돌리면 숫자가 아니에요.', len === 4 ? '천의 자리와 일의 자리, 백의 자리와 십의 자리가 짝이에요. 앞의 두 자리를 정하면 뒤의 두 자리가 정해져요.' : '백의 자리와 일의 자리가 짝이고, 가운데 숫자는 돌려도 그대로인 숫자(0, 1, 2, 5, 8)여야 해요.', `조건에 맞는 수: ${good.slice(0, 15).join(', ')}${good.length > 15 ? ' …' : ''} → ${good.length}개`],
        solution: [`${good.slice(0, 20).join(', ')}${good.length > 20 ? ' …' : ''}`, `모두 ${good.length}개예요.`],
        key: `u3s4-digcount|${D.join('')}|${len}|${kind}|${a}|${b}`,
        data: { D, len, a, b },
      };
    },
    verify(p) {
      const { D, len, a, b } = p.data;
      let n = 0;
      for (let v = Math.max(a, 10 ** (len - 1)); v <= Math.min(b, 10 ** len - 1); v++) { const s = String(v); if (s.split('').every((c) => D.includes(c)) && rotNum(s) === s) n++; }
      return n === Number(p.answer.value);
    },
  });

  // 디지털 수를 180° 돌린 수
  const tRot1 = tpl({
    id: 'u3s4-rot', sub: 'u3s4', style: 'B', styleName: '디지털 수 돌리기', levels: [1, 4], weak: ['concept'],
    build(r, lv) {
      const len = lv <= 1 ? 2 : lv === 2 ? 3 : 4;
      const ds = ['1', '2', '5', '6', '8', '9', '0'];
      let s = '';
      for (let i = 0; i < len; i++) s += r.pick(i === 0 || i === len - 1 ? ds.slice(0, 6) : ds);
      const rs = rotNum(s);
      if (rs === s || !/[69]/.test(s)) return null;
      const mapOnly = s.split('').map((c) => ROT[c]).join('');
      const revOnly = s.split('').reverse().join('');
      return {
        text: `디지털 숫자로 나타낸 수 ${j(s, '을/를')} 한 점을 중심으로 180° 돌리면 어떤 수가 되나요?`,
        figure: { type: 'digits', nums: s.split('') },
        answer: { type: 'num', value: rs },
        patterns: [
          { value: mapOnly, cause: 'concept', msg: '숫자마다 돌린 것은 맞아요. 그런데 수 전체를 돌리면 순서도 거꾸로 바뀌어요.' },
          { value: revOnly, cause: 'concept', msg: '순서를 거꾸로 한 것은 맞아요. 그런데 6은 9로, 9는 6으로 바뀌어요.' },
        ],
        hints: ['0, 1, 2, 5, 8은 180° 돌려도 그대로이고, 6과 9는 서로 바뀌어요.', `수 전체를 돌리면 맨 앞의 ${j(s[0], '이/가')} 맨 뒤로 가요. 순서를 거꾸로: ${revOnly}`, `${revOnly}에서 6과 9를 바꾸면 ${rs}`],
        solution: [`순서를 거꾸로: ${revOnly}`, `6 ↔ 9 바꾸기: ${rs}`],
        key: `u3s4-rot|${s}`,
        data: { s },
      };
    },
    verify(p) { return rotNum(p.data.s) === p.answer.value && p.answer.value[0] !== '0'; },
  });

  // 선대칭도형이면서 점대칭도형
  const tBoth = tpl({
    id: 'u3s4-both', sub: 'u3s4', style: 'B', styleName: '선대칭과 점대칭', levels: [1, 4],
    build(r) {
      const both = (s) => s.axes > 0 && s.point;
      const yes = g.NAMED.filter(both), no = g.NAMED.filter((s) => !both(s));
      const ny = r.int(1, 2);
      const pick = r.shuffle([...r.sample(yes, ny), ...r.sample(no, 5 - ny)]);
      const right = pick.filter(both).map((s) => s.name);
      const pOnly = pick.find((s) => s.point && !s.axes), lOnly = pick.find((s) => !s.point && s.axes);
      const pats = [];
      if (pOnly) pats.push({ value: [...right, pOnly.name], cause: 'condition', msg: `${j(pOnly.name, '은/는')} 점대칭도형이지만 선대칭도형은 아니에요. 두 가지를 모두 만족해야 해요.` });
      if (lOnly) pats.push({ value: [...right, lOnly.name], cause: 'condition', msg: `${j(lOnly.name, '은/는')} 선대칭도형이지만 점대칭도형은 아니에요. 두 가지를 모두 만족해야 해요.` });
      return {
        text: '다음 중 선대칭도형이면서 점대칭도형인 것을 모두 고르세요.',
        answer: { type: 'multi', options: pick.map((s) => ({ figure: namedFig(s), key: s.name, correct: both(s) })) },
        patterns: pats,
        hints: ['접어서 완전히 겹치는 직선이 있는지(선대칭), 180° 돌려서 겹치는지(점대칭)를 따로 확인해요.', '두 가지를 모두 만족하는 도형만 골라요.', `둘 다인 도형: ${right.join(', ')}`],
        solution: pick.map((s) => `${s.name}: 선대칭 ${s.axes ? 'O' : 'X'}, 점대칭 ${s.point ? 'O' : 'X'}`),
        key: `u3s4-both|${pick.map((s) => s.name).join('/')}`,
        data: {},
      };
    },
    verify(p) { return p.answer.options.every((o, i) => { const s = byName(o.key); return (s.axes > 0 && s.point) === p.answer.values.includes(i); }); },
  });

  M5.addTemplates([
    tAxes, tMost, tWhich, tSide3, tKite, tKiteEssay, tPerim3, tPerp, tDraw3, tOX('u3s3', OX3), tLetters, tLine3,
    tWhich4, tSide4, tAngle4, tPerim4, tCenter, tArea4, tDraw4, tDigits, tDigCount, tRot1, tBoth, tOX('u3s4', OX4),
  ]);
})();
