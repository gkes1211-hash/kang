// 3단원 합동과 대칭에서 같이 쓰는 도형 도우미
//   좌표는 칸 단위이고, 그림(draw/figure.js의 geo)처럼 아래로 갈수록 y가 커진다.
(function () {
  'use strict';
  const M5 = globalThis.M5;

  const LB = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const GA = ['가', '나', '다', '라', '마', '바', '사'];
  const CIRC = ['㉠', '㉡', '㉢', '㉣', '㉤'];

  const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const shift = (pts, dx, dy) => pts.map((p) => [p[0] + dx, p[1] + dy]);
  const bbox = (pts) => {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  const norm = (pts) => { const b = bbox(pts); return shift(pts, -b.x0, -b.y0); };
  const area = (pts) => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const signedArea = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  const perim = (pts) => pts.reduce((s, p, i) => s + dist(p, pts[(i + 1) % pts.length]), 0);

  // 모눈 위의 8가지 돌리기·뒤집기 (k ≥ 4이면 뒤집은 것)
  const T8 = [
    ([x, y]) => [x, y], ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x],
    ([x, y]) => [-x, y], ([x, y]) => [y, x], ([x, y]) => [x, -y], ([x, y]) => [-y, -x],
  ];
  const T8NAME = ['그대로', '돌린', '돌린', '돌린', '뒤집은', '뒤집은', '뒤집은', '뒤집은'];
  const applyT = (pts, k) => norm(pts.map(T8[k]));
  // 꼭짓점 순서·시작점과 상관없이 같은 모양인지 비교하는 글자 (돌리기·뒤집기·옮기기를 모두 같게 본다)
  function canon(pts) {
    let best = null;
    for (let k = 0; k < 8; k++) {
      const q = applyT(pts, k);
      const n = q.length;
      for (let s = 0; s < n; s++) for (const dir of [1, -1]) {
        const str = Array.from({ length: n }, (_, i) => q[(s + dir * i + n * 2) % n].join(',')).join(' ');
        if (best === null || str < best) best = str;
      }
    }
    return best;
  }
  const congruent = (a, b) => a.length === b.length && canon(a) === canon(b);

  // 선분끼리 만나는지 (다각형이 꼬였는지 확인)
  function segCross(p1, p2, p3, p4) {
    const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
    const on = (a, b, c) => Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);
    if (d1 === 0 && on(p3, p4, p1)) return true;
    if (d2 === 0 && on(p3, p4, p2)) return true;
    if (d3 === 0 && on(p1, p2, p3)) return true;
    if (d4 === 0 && on(p1, p2, p4)) return true;
    return false;
  }
  function simple(pts) {
    const n = pts.length;
    if (n < 3 || area(pts) < 0.5) return false;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      if (a[0] === b[0] && a[1] === b[1]) return false;
      // 한 직선 위에 세 꼭짓점이 놓이면 꼭짓점이 아니다
      const c = pts[(i + 2) % n];
      if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) === 0) return false;
      for (let k = i + 2; k < n; k++) {
        if (i === 0 && k === n - 1) continue;
        if (segCross(a, b, pts[k], pts[(k + 1) % n])) return false;
      }
    }
    return true;
  }

  // 꼭짓점 i의 안쪽 각 (도, 볼록·오목 모두)
  function angleAt(pts, i) {
    const n = pts.length;
    const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const ux = a[0] - p[0], uy = a[1] - p[1], vx = b[0] - p[0], vy = b[1] - p[1];
    const cos = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
    const d = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    // 꼭짓점에서 꺾이는 방향이 도형 전체의 방향과 반대이면 180°보다 큰 각
    const cross = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]);
    return cross * signedArea(pts) < 0 ? 360 - d : d;
  }

  // 모눈 위의 여러 가지 도형 (모두 가로·세로 4칸 안)
  const LAT = [
    [[0, 0], [0, 2], [3, 2]],
    [[0, 2], [1, 0], [3, 2]],
    [[1, 0], [3, 0], [4, 2], [0, 2]],
    [[1, 0], [4, 0], [3, 2], [0, 2]],
    [[0, 0], [1, 0], [1, 2], [3, 2], [3, 3], [0, 3]],
    [[0, 0], [2, 0], [3, 1], [2, 2], [0, 2]],
    [[0, 0], [2, 0], [3, 2], [0, 2]],
    [[0, 0], [3, 0], [3, 1], [2, 1], [2, 3], [1, 3], [1, 1], [0, 1]],
    [[0, 0], [3, 1], [3, 3], [1, 2]],
    [[0, 1], [1, 0], [3, 0], [3, 2], [1, 3]],
    [[0, 0], [4, 1], [1, 2]],
    [[0, 0], [2, 0], [2, 1], [3, 1], [3, 3], [0, 3]],
    [[0, 0], [2, 0], [2, 1], [3, 1], [3, 2], [1, 2], [1, 1], [0, 1]],
    [[0, 0], [1, 0], [3, 2], [3, 3], [0, 3]],
    [[0, 0], [2, 0], [4, 1], [3, 3], [1, 2]],
    [[0, 3], [1, 0], [2, 2], [4, 1], [3, 3]],
  ].filter((s) => simple(s));
  // 돌리거나 뒤집어도 같은 모양이 되지 않는 도형만 (그래야 '뒤집은 것'과 '돌린 것'이 구별된다)
  const LAT_ASYM = LAT.filter((s) => new Set(T8.map((_, k) => canon(applyT(s, k)) + '|' + applyT(s, k).map((p) => p.join(',')).sort().join(' '))).size === 8);

  // 한 꼭짓점을 한 칸 옮긴 비슷한 도형 (합동이 아닌 것)
  function nudge(r, pts) {
    for (let t = 0; t < 30; t++) {
      const i = r.int(0, pts.length - 1);
      const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const q = pts.map((p, k) => (k === i ? [p[0] + dx, p[1] + dy] : p.slice()));
      if (!simple(q)) continue;
      const nq = norm(q);
      const b = bbox(nq);
      if (b.w > 5 || b.h > 5) continue;
      if (congruent(nq, pts)) continue;
      return nq;
    }
    return null;
  }

  // 이름 붙은 도형 (선대칭·점대칭 단원): 대칭축 수와 점대칭인지
  const reg = (n, R, rot) => Array.from({ length: n }, (_, i) => {
    const t = rot + (i * 2 * Math.PI) / n;
    return [+(R * Math.cos(t)).toFixed(3), +(R * Math.sin(t)).toFixed(3)];
  });
  const NAMED = [
    { name: '정삼각형', pts: reg(3, 2, -Math.PI / 2), axes: 3, point: false },
    { name: '이등변삼각형', pts: [[2, 0], [0.6, 3.6], [3.4, 3.6]], axes: 1, point: false },
    { name: '직각삼각형', pts: [[0, 0], [0, 3], [3.6, 3]], axes: 0, point: false, nonIso: true },
    { name: '정사각형', pts: [[0, 0], [3, 0], [3, 3], [0, 3]], axes: 4, point: true },
    { name: '직사각형', pts: [[0, 0], [4.2, 0], [4.2, 2.4], [0, 2.4]], axes: 2, point: true },
    { name: '마름모', pts: [[2, 0], [4, 1.6], [2, 3.2], [0, 1.6]], axes: 2, point: true },
    { name: '평행사변형', pts: [[1.4, 0], [4.4, 0], [3, 2.4], [0, 2.4]], axes: 0, point: true },
    { name: '사다리꼴', pts: [[0.8, 0], [2.6, 0], [4, 2.6], [0, 2.6]], axes: 0, point: false },
    { name: '등변사다리꼴', pts: [[1.2, 0], [3.2, 0], [4.4, 2.6], [0, 2.6]], axes: 1, point: false },
    { name: '연 모양 사각형', pts: [[2, 0], [3.4, 1.2], [2, 3.8], [0.6, 1.2]], axes: 1, point: false },
    { name: '정오각형', pts: reg(5, 2, -Math.PI / 2), axes: 5, point: false },
    { name: '정육각형', pts: reg(6, 2, 0), axes: 6, point: true },
    { name: '정팔각형', pts: reg(8, 2, Math.PI / 8), axes: 8, point: true },
  ];

  // 다각형 하나의 그림 조각 (꼭짓점 이름을 바깥쪽에)
  function labeled(pts, names, cls = 'shape-a') {
    const c = centroid(pts);
    return { polys: [{ pts, cls }], labels: pts.map((p, i) => ({ p, t: names[i], c })) };
  }
  // 그림 조각 여러 개를 합친다
  function merge(...parts) {
    const out = { type: 'geo' };
    for (const part of parts) {
      for (const [k, v] of Object.entries(part)) {
        if (Array.isArray(v)) out[k] = (out[k] || []).concat(v);
        else out[k] = v;
      }
    }
    return out;
  }
  const r5 = (x) => Math.round(x / 5) * 5;
  const deg = (rad) => (rad * 180) / Math.PI;
  const rad = (d) => (d * Math.PI) / 180;

  M5.g3 = { LB, GA, CIRC, centroid, dist, shift, bbox, norm, area, perim, T8, T8NAME, applyT, canon, congruent, simple, angleAt, LAT, LAT_ASYM, nudge, NAMED, labeled, merge, r5, deg, rad, reg };
})();
