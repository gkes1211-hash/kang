// 5단원 직육면체와 정육면체에서 같이 쓰는 도우미
//   겨냥도: 직육면체 ㄱㄴㄷㄹ-ㅁㅂㅅㅇ (윗면 ㄱㄴㄷㄹ, 아랫면 ㅁㅂㅅㅇ, 보이지 않는 꼭짓점은 ㅁ)
//       ㄱ ─────── ㄹ
//      ╱│        ╱│
//    ㄴ ─────── ㄷ │
//     │ ㅁ┄┄┄┄┄│┄ㅇ
//     │╱        │╱
//    ㅂ ─────── ㅅ
//   전개도: 정육면체 전개도 11가지를 컴퓨터가 직접 찾고(주사위 굴리기), 접었을 때 마주 보는 면·만나는 점·맞닿는 선분을 계산한다.
(function () {
  'use strict';
  const M5 = globalThis.M5;

  // ---------------------------------------------------------------- 겨냥도
  // a: 가로(ㅂㅅ), h: 높이(ㅂㄴ), c: 깊이(ㅅㅇ)
  const V = { ㄱ: [0, 1, 1], ㄴ: [0, 1, 0], ㄷ: [1, 1, 0], ㄹ: [1, 1, 1], ㅁ: [0, 0, 1], ㅂ: [0, 0, 0], ㅅ: [1, 0, 0], ㅇ: [1, 0, 1] };
  const NAMES = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'];
  const HIDDEN = 'ㅁ';
  // 모서리 12개: 축 a(가로) · h(높이) · c(깊이)
  const EDGES = [
    ['ㄴ', 'ㄷ', 'a'], ['ㄱ', 'ㄹ', 'a'], ['ㅂ', 'ㅅ', 'a'], ['ㅁ', 'ㅇ', 'a'],
    ['ㄴ', 'ㅂ', 'h'], ['ㄷ', 'ㅅ', 'h'], ['ㄹ', 'ㅇ', 'h'], ['ㄱ', 'ㅁ', 'h'],
    ['ㄱ', 'ㄴ', 'c'], ['ㄹ', 'ㄷ', 'c'], ['ㅁ', 'ㅂ', 'c'], ['ㅇ', 'ㅅ', 'c'],
  ];
  const hiddenEdge = (e) => e[0] === HIDDEN || e[1] === HIDDEN;
  // 면 6개 (꼭짓점을 차례대로)
  const FACES = {
    top: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'], bottom: ['ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'], front: ['ㄴ', 'ㅂ', 'ㅅ', 'ㄷ'],
    back: ['ㄱ', 'ㅁ', 'ㅇ', 'ㄹ'], left: ['ㄱ', 'ㄴ', 'ㅂ', 'ㅁ'], right: ['ㄹ', 'ㄷ', 'ㅅ', 'ㅇ'],
  };
  const OPP = { top: 'bottom', bottom: 'top', front: 'back', back: 'front', left: 'right', right: 'left' };
  const faceName = (f) => '면 ' + FACES[f].join('');
  const edgeName = (e) => '모서리 ' + e[0] + e[1];
  // 두 면이 만나는 모서리
  function sharedEdge(f1, f2) {
    const s = FACES[f1].filter((v) => FACES[f2].includes(v));
    return s.length === 2 ? s : null;
  }

  // 3차원 점 → 그림 좌표 (깊이는 오른쪽 위로 비스듬히)
  function proj(p, d) {
    const k = 0.5, t = Math.PI / 6;
    const x = p[0] * d.a, y = p[1] * d.h, z = p[2] * d.c;
    return [x + z * k * Math.cos(t), -y - z * k * Math.sin(t)];
  }
  // 겨냥도 그림 (geo)
  //   opt.drawAll: 보이지 않는 모서리도 실선으로 (틀린 그림 보기용)
  //   opt.dashWrong: 이 모서리들을 점선으로 (틀린 그림 보기용) / opt.skip: 빠뜨린 모서리
  //   opt.labels: 꼭짓점 이름 / opt.lens: { a: '5 cm', h: …, c: … } / opt.shade: 색칠할 면
  function boxFig(d, opt = {}) {
    const P = {};
    for (const n of NAMES) P[n] = proj(V[n], d);
    const ctr = proj([0.5, 0.5, 0.5], d);
    const segs = [];
    for (const e of EDGES) {
      const key = e[0] + e[1];
      if (opt.skip && opt.skip.includes(key)) continue;
      let dash = hiddenEdge(e);
      if (opt.drawAll) dash = false;
      if (opt.dashWrong) dash = opt.dashWrong.includes(key);
      segs.push({ a: P[e[0]], b: P[e[1]], cls: dash ? 'dash' : 'box' });
    }
    const f = { type: 'geo', polys: [], segs, scale: opt.scale || 44, pad: 0.7 };
    if (opt.shade) for (const s of [].concat(opt.shade)) f.polys.push({ pts: FACES[s].map((n) => P[n]), cls: 'shade' });
    if (opt.labels) f.labels = NAMES.map((n) => ({ p: P[n], t: n, c: ctr, d: 0.45 }));
    if (opt.lens) {
      f.sides = [];
      if (opt.lens.a) f.sides.push({ a: P['ㅂ'], b: P['ㅅ'], t: opt.lens.a, c: ctr });
      if (opt.lens.h) f.sides.push({ a: P['ㄴ'], b: P['ㅂ'], t: opt.lens.h, c: ctr, d: 0.6 });
      if (opt.lens.c) f.sides.push({ a: P['ㅅ'], b: P['ㅇ'], t: opt.lens.c, c: ctr, d: 0.55 });
    }
    return f;
  }

  // ---------------------------------------------------------------- 전개도
  // 주사위 굴리기: o[방향] = 그 방향을 보고 있는 주사위 면 (처음에는 방향 이름 그대로)
  //   그림에서 E = 오른쪽(+x), S = 아래(+y)
  const ROLL = {
    E: (o) => ({ D: o.E, E: o.U, U: o.W, W: o.D, N: o.N, S: o.S }),
    W: (o) => ({ D: o.W, W: o.U, U: o.E, E: o.D, N: o.N, S: o.S }),
    S: (o) => ({ D: o.S, S: o.U, U: o.N, N: o.D, E: o.E, W: o.W }),
    N: (o) => ({ D: o.N, N: o.U, U: o.S, S: o.D, E: o.E, W: o.W }),
  };
  const STEP = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
  const DOPP = { U: 'D', D: 'U', N: 'S', S: 'N', E: 'W', W: 'E' };
  const AXIS = { U: 'z', D: 'z', N: 'y', S: 'y', E: 'x', W: 'x' };

  // 칸 목록을 접어 본다. 정육면체 전개도이면 칸마다 { face, o } (o: 그 칸에서 방향별로 맞닿는 면), 아니면 null
  function fold(cells) {
    const key = (c) => c.join(',');
    const set = new Set(cells.map(key));
    const res = new Map();
    const start = cells[0];
    res.set(key(start), { cell: start, o: { U: 'U', D: 'D', N: 'N', S: 'S', E: 'E', W: 'W' } });
    const q = [start];
    while (q.length) {
      const c = q.shift();
      const cur = res.get(key(c));
      for (const dir of ['E', 'W', 'S', 'N']) {
        const n = [c[0] + STEP[dir][0], c[1] + STEP[dir][1]];
        if (!set.has(key(n)) || res.has(key(n))) continue;
        res.set(key(n), { cell: n, o: ROLL[dir](cur.o) });
        q.push(n);
      }
    }
    if (res.size !== cells.length) return null;
    const out = cells.map((c) => { const r = res.get(key(c)); return { cell: c, face: r.o.D, o: r.o }; });
    if (new Set(out.map((x) => x.face)).size !== 6) return null;
    return out;
  }

  // 칸 6개짜리 도형(헥소미노)을 모두 만들고, 정육면체 전개도인 것과 아닌 것으로 나눈다
  function normCells(cells) {
    const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]).sort((p, q) => p[1] - q[1] || p[0] - q[0]);
  }
  const T8 = [([x, y]) => [x, y], ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x], ([x, y]) => [-x, y], ([x, y]) => [y, x], ([x, y]) => [x, -y], ([x, y]) => [-y, -x]];
  const cellKey = (cells) => normCells(cells).map((c) => c.join(',')).join(' ');
  const canonCells = (cells) => T8.map((f) => cellKey(cells.map(f))).sort()[0];
  function hexominoes() {
    let level = [[[0, 0]]];
    for (let n = 1; n < 6; n++) {
      const next = new Map();
      for (const cells of level) {
        const set = new Set(cells.map((c) => c.join(',')));
        for (const c of cells) for (const d of Object.values(STEP)) {
          const m = [c[0] + d[0], c[1] + d[1]];
          if (set.has(m.join(','))) continue;
          const nc = normCells([...cells, m]);
          const k = cellKey(nc);
          if (!next.has(k)) next.set(k, nc);
        }
      }
      level = [...next.values()];
    }
    const free = new Map();
    for (const cells of level) { const k = canonCells(cells); if (!free.has(k)) free.set(k, cells); }
    return [...free.values()];
  }
  const HEX = hexominoes();
  const NETS = HEX.filter((c) => fold(c));
  const NONNETS = HEX.filter((c) => !fold(c) && Math.max(...c.map((p) => p[0])) <= 4 && Math.max(...c.map((p) => p[1])) <= 4);
  // 돌리거나 뒤집은 모양 (전개도 그림을 여러 가지로 보이게)
  function orient(cells, k) { return normCells(cells.map(T8[k])); }

  // 직육면체 전개도의 칸 크기와 위치: 주사위 면의 축마다 길이 { x, y, z }
  //   칸의 가로 = o.E 면의 축 길이, 세로 = o.S 면의 축 길이
  function layout(folded, L) {
    const len = (f) => L[AXIS[f]];
    const byKey = new Map(folded.map((f) => [f.cell.join(','), f]));
    const pos = new Map();
    const first = folded[0];
    pos.set(first.cell.join(','), { x: 0, y: 0, w: len(first.o.E), h: len(first.o.S) });
    const q = [first];
    while (q.length) {
      const f = q.shift();
      const p = pos.get(f.cell.join(','));
      for (const dir of ['E', 'W', 'S', 'N']) {
        const nk = [f.cell[0] + STEP[dir][0], f.cell[1] + STEP[dir][1]].join(',');
        const g = byKey.get(nk);
        if (!g || pos.has(nk)) continue;
        const w = len(g.o.E), h = len(g.o.S);
        const r = { w, h, x: dir === 'E' ? p.x + p.w : dir === 'W' ? p.x - w : p.x, y: dir === 'S' ? p.y + p.h : dir === 'N' ? p.y - h : p.y };
        pos.set(nk, r);
        q.push(g);
      }
    }
    const rects = folded.map((f) => Object.assign({ face: f.face, o: f.o, cell: f.cell }, pos.get(f.cell.join(','))));
    // 겹치면 쓸 수 없는 전개도
    for (let i = 0; i < rects.length; i++) for (let k = i + 1; k < rects.length; k++) {
      const A = rects[i], B = rects[k];
      if (A.x < B.x + B.w - 1e-9 && B.x < A.x + A.w - 1e-9 && A.y < B.y + B.h - 1e-9 && B.y < A.y + A.h - 1e-9) return null;
    }
    const mx = Math.min(...rects.map((r) => r.x)), my = Math.min(...rects.map((r) => r.y));
    for (const r of rects) { r.x -= mx; r.y -= my; }
    return rects;
  }

  // 전개도의 바깥 둘레 선분 (칸의 변 중 이웃 칸과 붙지 않은 것): { rect, dir, a, b, len, glueFace }
  //   dir 방향의 변은 접으면 rect.o[dir] 면과 맞닿는다
  function boundary(rects) {
    const out = [];
    const near = (r, dir) => rects.find((q) => q !== r && adjacentRects(r, q, dir));
    for (const r of rects) {
      const corners = { NW: [r.x, r.y], NE: [r.x + r.w, r.y], SE: [r.x + r.w, r.y + r.h], SW: [r.x, r.y + r.h] };
      const sides = { N: [corners.NW, corners.NE], E: [corners.NE, corners.SE], S: [corners.SE, corners.SW], W: [corners.SW, corners.NW] };
      for (const dir of ['N', 'E', 'S', 'W']) {
        if (near(r, dir)) continue;
        const [a, b] = sides[dir];
        out.push({ rect: r, dir, a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) });
      }
    }
    return out;
  }
  function adjacentRects(r, q, dir) {
    const eq = (x, y) => Math.abs(x - y) < 1e-9;
    if (dir === 'E') return eq(r.x + r.w, q.x) && eq(r.y, q.y);
    if (dir === 'W') return eq(q.x + q.w, r.x) && eq(r.y, q.y);
    if (dir === 'S') return eq(r.y + r.h, q.y) && eq(r.x, q.x);
    return eq(q.y + q.h, r.y) && eq(r.x, q.x);
  }
  // 둘레 선분과 접었을 때 맞닿는 둘레 선분
  function gluePartner(segs, sg) {
    return segs.find((t) => t !== sg && t.rect.face === sg.rect.o[sg.dir] && t.rect.o[t.dir] === sg.rect.face) || null;
  }
  // 지퍼처럼 닫기: 전개도의 꺾인 곳(오목한 곳)에서 양쪽 선분이 먼저 맞닿고, 그다음 바깥쪽 선분끼리 차례로 맞닿는다.
  //   둘레를 한 바퀴 돌며 '이웃한 두 선분이 맞닿는 짝'을 찾아 붙이고 빼기를 반복한다 (정육면체 전개도는 늘 7번)
  //   결과: [{ s, t, corner: [s.b, t.a], ends: [s.a, t.b], inside: [안쪽에서 먼저 붙인 단계 번호들] }]
  function zipper(segs) {
    const key = (p) => p.map((v) => v.toFixed(4)).join(',');
    const cyc = [segs[0]];
    while (cyc.length < segs.length) {
      const last = cyc[cyc.length - 1];
      const nx = segs.find((x) => key(x.a) === key(last.b));
      if (!nx || cyc.includes(nx)) return null;
      cyc.push(nx);
    }
    const pos = new Map(cyc.map((x, i) => [x, i]));
    const n = cyc.length;
    let list = cyc.slice();
    const steps = [];
    while (list.length) {
      let f = -1;
      for (let i = 0; i < list.length; i++) if (gluePartner(segs, list[i]) === list[(i + 1) % list.length]) { f = i; break; }
      if (f < 0) return null;
      const s = list[f], t = list[(f + 1) % list.length];
      const ps = pos.get(s), pt = pos.get(t);
      const between = (x) => { const d = (pos.get(x) - ps + n) % n; return d > 0 && d < (pt - ps + n) % n; };
      const inside = steps.map((st, i) => (between(st.s) && between(st.t) ? i : -1)).filter((i) => i >= 0);
      steps.push({ s, t, corner: [s.b, t.a], ends: [s.a, t.b], inside });
      list = list.filter((x) => x !== s && x !== t);
    }
    return steps;
  }

  // 전개도 위의 점(칸의 꼭짓점) → 접었을 때의 정육면체 꼭짓점 (만나는 세 면)
  function cornerOf(r, corner) {
    const dirs = { NW: ['N', 'W'], NE: ['N', 'E'], SE: ['S', 'E'], SW: ['S', 'W'] }[corner];
    return [r.face, r.o[dirs[0]], r.o[dirs[1]]].sort().join('');
  }
  // 전개도의 꼭짓점 모두 (같은 자리의 점은 하나로): { p: [x,y], cube: 정육면체 꼭짓점 }
  function netPoints(rects) {
    const pts = new Map();
    for (const r of rects) {
      const cs = { NW: [r.x, r.y], NE: [r.x + r.w, r.y], SE: [r.x + r.w, r.y + r.h], SW: [r.x, r.y + r.h] };
      for (const [k, p] of Object.entries(cs)) {
        const key = p.map((v) => v.toFixed(4)).join(',');
        if (!pts.has(key)) pts.set(key, { p, cube: cornerOf(r, k) });
      }
    }
    return [...pts.values()];
  }

  M5.box = { V, NAMES, HIDDEN, EDGES, FACES, OPP, faceName, edgeName, sharedEdge, hiddenEdge, boxFig, proj, fold, NETS, NONNETS, HEX, orient, layout, boundary, gluePartner, zipper, netPoints, cornerOf, DOPP, AXIS, T8, canonCells };
})();
