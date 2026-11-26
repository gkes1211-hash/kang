// 그림 그리기 (기획서 10번). 틀이 만든 그림 정보를 받아 SVG·HTML 글자로 바꾼다.
// 화면(DOM)을 쓰지 않으므로 자동 테스트에서도 그대로 확인할 수 있다.
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});
  const H = (s) => M5.text.html(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 수직선: { min, max, marks: [{ v, closed }], seg: { from: 수|null, to: 수|null } }  (null이면 끝까지 이어짐)
  function numberline(f) {
    const W = 640, H = 104, pad = 52, y = 50;
    const span = f.max - f.min;
    const x = (v) => pad + ((v - f.min) * (W - 2 * pad)) / span;
    const out = [];
    out.push(`<svg class="fig-nl" viewBox="0 0 ${W} ${H}" role="img" aria-label="수직선">`);
    out.push(`<line class="axis" x1="${pad - 34}" y1="${y}" x2="${W - pad + 34}" y2="${y}"/>`);
    out.push(`<path class="axis-head" d="M${W - pad + 40} ${y} l-10 -6 v12 z"/>`);
    for (let v = f.min; v <= f.max; v++) {
      out.push(`<line class="tick" x1="${x(v)}" y1="${y - 7}" x2="${x(v)}" y2="${y + 7}"/>`);
      out.push(`<text class="lbl" x="${x(v)}" y="${y + 32}" text-anchor="middle">${esc(v)}</text>`);
    }
    const ry = y - 20;
    const from = f.seg.from == null ? pad - 30 : x(f.seg.from);
    const to = f.seg.to == null ? W - pad + 30 : x(f.seg.to);
    out.push(`<line class="range" x1="${from}" y1="${ry}" x2="${to}" y2="${ry}"/>`);
    if (f.seg.from == null) out.push(`<path class="range-head" d="M${from - 6} ${ry} l12 -7 v14 z"/>`);
    if (f.seg.to == null) out.push(`<path class="range-head" d="M${to + 6} ${ry} l-12 -7 v14 z"/>`);
    for (const m of f.marks) {
      out.push(`<line class="drop" x1="${x(m.v)}" y1="${ry}" x2="${x(m.v)}" y2="${y}"/>`);
      out.push(`<circle class="${m.closed ? 'dot-closed' : 'dot-open'}" cx="${x(m.v)}" cy="${ry}" r="8"/>`);
    }
    out.push('</svg>');
    return out.join('');
  }

  // 수 카드: { nums: [3, 8, 1] }
  function cards(f) {
    return `<div class="fig-cards" role="img" aria-label="수 카드 ${f.nums.join(', ')}">${f.nums.map((v) => `<span class="card-num">${esc(v)}</span>`).join('')}</div>`;
  }

  // 수 목록: { items: ['12', '15.5'] }
  function chips(f) {
    return `<div class="fig-chips">${f.items.map((v) => `<span class="chip">${H(v)}</span>`).join('')}</div>`;
  }

  // 표: { title, head: [...], rows: [[...], ...] }
  function table(f) {
    const cap = f.title ? `<caption>${H(f.title)}</caption>` : '';
    const head = `<thead><tr>${f.head.map((h) => `<th>${H(h)}</th>`).join('')}</tr></thead>`;
    const body = `<tbody>${f.rows.map((r) => `<tr>${r.map((c) => `<td>${H(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table class="fig-table">${cap}${head}${body}</table>`;
  }

  // 넓이 격자: 가로를 cols등분, 세로를 rows등분하고, 왼쪽 shadeCols칸 × 위쪽 shadeRows칸을 색칠
  //   { cols, rows, shadeCols, shadeRows, square }
  function grid(f) {
    const cells = [];
    for (let r = 0; r < f.rows; r++) {
      for (let c = 0; c < f.cols; c++) {
        const on = c < f.shadeCols && r < f.shadeRows;
        const col = c < f.shadeCols;
        cells.push(`<span class="${on ? 'on' : col ? 'col' : ''}"></span>`);
      }
    }
    const shape = f.square ? '정사각형' : '직사각형';
    return `<div class="fig-grid-wrap"><div class="fig-grid ${f.square ? 'sq' : ''}" style="--c:${f.cols};--r:${f.rows}" role="img" aria-label="${shape}을 가로 ${f.cols}등분, 세로 ${f.rows}등분하고 ${f.shadeCols * f.shadeRows}칸을 색칠한 그림">${cells.join('')}</div>
      <p class="fig-legend"><span class="sw on"></span>색칠한 부분 <span class="sw col"></span>가로의 ${H(M5.frac.mkRaw(f.shadeCols, f.cols))}만큼</p></div>`;
  }

  // 직사각형(정사각형) 넓이: { w: 가로 글자, h: 세로 글자, square }
  function rect(f) {
    return `<div class="fig-rect ${f.square ? 'sq' : ''}" role="img" aria-label="가로 ${H(M5.text.plain(f.w))}, 세로 ${H(M5.text.plain(f.h))}인 ${f.square ? '정사각형' : '직사각형'}">
      <div class="box"></div><span class="lw">${H(f.w)}</span><span class="lh">${H(f.h)}</span></div>`;
  }

  // 화살표 계산: { start: 글자, steps: ['× 3/4', ...] } 마지막 칸은 ?
  function arrows(f) {
    const parts = [`<span class="node">${H(f.start)}</span>`];
    f.steps.forEach((s, i) => {
      parts.push(`<span class="arr"><span class="op">${H(s)}</span><span class="line">→</span></span>`);
      parts.push(`<span class="node ${i === f.steps.length - 1 ? 'q' : 'empty'}">${i === f.steps.length - 1 ? '?' : ''}</span>`);
    });
    return `<div class="fig-arrows" role="img" aria-label="화살표 규칙대로 계산하는 그림">${parts.join('')}</div>`;
  }

  // 막대그래프: { title, unit, labels: [...], values: [수 또는 null(?)], step: 눈금 한 칸, max }
  function bars(f) {
    const W = 560, Hh = 280, L = 56, R = 16, T = 34, B = 46;
    const n = f.labels.length;
    const plotW = W - L - R, plotH = Hh - T - B;
    const y = (v) => T + plotH - (v / f.max) * plotH;
    const bw = Math.min(56, (plotW / n) * 0.55);
    const cx = (i) => L + (plotW / n) * (i + 0.5);
    const out = [`<svg class="fig-bars" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(f.title || '막대그래프')}">`];
    if (f.title) out.push(`<text class="ttl" x="${W / 2}" y="20" text-anchor="middle">${esc(f.title)}</text>`);
    const lblEvery = f.labelEvery || 1;
    for (let v = 0, k = 0; v <= f.max + 1e-9; v += f.step, k++) {
      out.push(`<line class="${k % lblEvery === 0 ? 'gl major' : 'gl'}" x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}"/>`);
      if (k % lblEvery === 0) out.push(`<text class="yl" x="${L - 8}" y="${y(v) + 5}" text-anchor="end">${esc(+v.toFixed(3))}</text>`);
    }
    if (f.unit) out.push(`<text class="yl unit" x="${L - 8}" y="${T - 10}" text-anchor="end">(${esc(f.unit)})</text>`);
    f.labels.forEach((lab, i) => {
      const v = f.values[i];
      if (v == null) out.push(`<text class="q" x="${cx(i)}" y="${y(f.max * 0.45)}" text-anchor="middle">?</text>`);
      else out.push(`<rect class="bar" x="${cx(i) - bw / 2}" y="${y(v)}" width="${bw}" height="${y(0) - y(v)}"/>`);
      out.push(`<text class="xl" x="${cx(i)}" y="${Hh - B + 22}" text-anchor="middle">${esc(lab)}</text>`);
    });
    out.push(`<line class="axis" x1="${L}" y1="${y(0)}" x2="${W - R}" y2="${y(0)}"/><line class="axis" x1="${L}" y1="${T - 4}" x2="${L}" y2="${y(0)}"/>`);
    out.push('</svg>');
    return out.join('');
  }

  const COLOR_NAME = { red: '빨강', blue: '파랑', yellow: '노랑', green: '초록', white: '흰색' };
  // 회전판: { sectors: ['red', 'blue', ...] } 똑같은 크기로 나눈 칸
  function spinner(f) {
    const n = f.sectors.length, r = 84, c = 96;
    const out = [`<svg class="fig-spin" viewBox="0 0 192 196" role="img" aria-label="회전판: ${f.sectors.map((s) => COLOR_NAME[s]).join(', ')}">`];
    if (n === 1) {
      out.push(`<circle class="sp-${f.sectors[0]}" cx="${c}" cy="${c}" r="${r}"/>`);
      out.push(`<text class="sl" x="${c}" y="${c - 30}" text-anchor="middle">${COLOR_NAME[f.sectors[0]]}</text>`);
    } else {
      f.sectors.forEach((col, i) => {
        const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2;
        const p = (a) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
        out.push(`<path class="sp-${col}" d="M${c} ${c} L${p(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)} Z"/>`);
        out.push(`<text class="sl" x="${(c + r * 0.62 * Math.cos(am)).toFixed(1)}" y="${(c + r * 0.62 * Math.sin(am) + 5).toFixed(1)}" text-anchor="middle">${COLOR_NAME[col]}</text>`);
      });
    }
    out.push(`<circle class="sp-rim" cx="${c}" cy="${c}" r="${r}"/><path class="sp-arrow" d="M${c} ${c - 52} L${c - 7} ${c - 34} L${c + 7} ${c - 34} Z"/><line class="sp-arrow-l" x1="${c}" y1="${c}" x2="${c}" y2="${c - 36}"/><circle class="sp-pin" cx="${c}" cy="${c}" r="6"/>`);
    out.push('</svg>');
    return out.join('');
  }

  // 구슬 주머니: { balls: [{ color, n }] }
  function bag(f) {
    const dots = f.balls.flatMap((b) => Array.from({ length: b.n }, () => `<span class="ball b-${b.color}"></span>`));
    const legend = f.balls.map((b) => `${COLOR_NAME[b.color]} ${b.n}개`).join(', ');
    return `<div class="fig-bag" role="img" aria-label="주머니 속 구슬: ${legend}"><div class="bag-body">${dots.join('')}</div><p class="bag-legend">${esc(legend)}</p></div>`;
  }


  // 도형 (3단원): 좌표는 칸 단위, 아래로 갈수록 y가 커진다.
  //   { grid: { w, h } 모눈, polys: [{ pts, cls: 'shape-a'|'shape-b'|'shape-c'|'dash'|'ghost'|'line' }], segs: [{ a, b, cls: 'axis'|'dash'|'thin' }],
  //     labels: [{ p, t, c }] 꼭짓점 이름 (c에서 멀어지는 쪽에), sides: [{ a, b, t, c }] 변의 길이, angles: [{ v, a, b, t, right }] 각,
  //     dots: [{ p, t, c }] 점 (대칭의 중심 등), texts: [{ p, t }], pick: true (모눈 점을 눌러 찍는 문제), scale, title }
  function geo(f) {
    const u = f.scale || 34;
    const all = [];
    if (f.grid) all.push([0, 0], [f.grid.w, f.grid.h]);
    for (const q of f.polys || []) all.push(...q.pts);
    for (const q of f.segs || []) all.push(q.a, q.b);
    for (const q of f.dots || []) all.push(q.p);
    for (const q of f.texts || []) all.push(q.p);
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    const pad = f.pad != null ? f.pad : 0.9;
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, x1 = Math.max(...xs) + pad, y1 = Math.max(...ys) + pad;
    const X = (v) => +((v - x0) * u).toFixed(1), Y = (v) => +((v - y0) * u).toFixed(1);
    const P = (p) => `${X(p[0])},${Y(p[1])}`;
    const fs = Math.max(12, Math.min(18, u * 0.5));
    const away = (p, c, d) => {
      if (!c) return [p[0], p[1] - d];
      let dx = p[0] - c[0], dy = p[1] - c[1];
      const L = Math.hypot(dx, dy) || 1;
      return [p[0] + (dx / L) * d, p[1] + (dy / L) * d];
    };
    const txt = (p, t, cls) => `<text class="${cls}" x="${X(p[0])}" y="${(Y(p[1]) + fs * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fs}">${esc(t)}</text>`;
    const out = [`<svg class="fig-geo${f.pick ? ' pickable' : ''}" viewBox="0 0 ${X(x1)} ${Y(y1)}" style="max-width:${Math.round(X(x1))}px" role="img" aria-label="${esc(f.title || '도형 그림')}">`];
    if (f.grid) {
      for (let i = 0; i <= f.grid.w; i++) out.push(`<line class="gl" x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(f.grid.h)}"/>`);
      for (let i = 0; i <= f.grid.h; i++) out.push(`<line class="gl" x1="${X(0)}" y1="${Y(i)}" x2="${X(f.grid.w)}" y2="${Y(i)}"/>`);
    }
    for (const q of f.polys || []) out.push(`<polygon class="pg ${q.cls || 'fa'}" points="${q.pts.map(P).join(' ')}"/>`);
    for (const q of f.segs || []) out.push(`<line class="sg ${q.cls || ''}" x1="${X(q.a[0])}" y1="${Y(q.a[1])}" x2="${X(q.b[0])}" y2="${Y(q.b[1])}"/>`);
    for (const q of f.angles || []) {
      const ta = Math.atan2(q.a[1] - q.v[1], q.a[0] - q.v[0]), tb = Math.atan2(q.b[1] - q.v[1], q.b[0] - q.v[0]);
      let d = tb - ta;
      while (d <= -Math.PI) d += 2 * Math.PI;
      while (d > Math.PI) d -= 2 * Math.PI;
      const r = q.r || 0.55;
      const pt = (t, rr) => [q.v[0] + rr * Math.cos(t), q.v[1] + rr * Math.sin(t)];
      if (q.right) {
        const s1 = pt(ta, 0.38), s2 = pt(tb, 0.38), s3 = [s1[0] + s2[0] - q.v[0], s1[1] + s2[1] - q.v[1]];
        out.push(`<polyline class="ang" points="${P(s1)} ${P(s3)} ${P(s2)}"/>`);
      } else {
        const p1 = pt(ta, r), p2 = pt(ta + d, r);
        out.push(`<path class="ang" d="M${P(p1)} A${(r * u).toFixed(1)} ${(r * u).toFixed(1)} 0 0 ${d > 0 ? 1 : 0} ${P(p2)}"/>`);
      }
      if (q.t) out.push(txt(pt(ta + d / 2, q.tr || (Math.abs(d) < 0.8 ? 1.35 : 0.95)), q.t, 'at'));
    }
    for (const q of f.sides || []) {
      const m = [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2];
      let nx = -(q.b[1] - q.a[1]), ny = q.b[0] - q.a[0];
      const L = Math.hypot(nx, ny) || 1;
      nx /= L; ny /= L;
      if (q.c && (m[0] - q.c[0]) * nx + (m[1] - q.c[1]) * ny < 0) { nx = -nx; ny = -ny; }
      const d = q.d || 0.48;
      out.push(txt([m[0] + nx * d, m[1] + ny * d], q.t, 'st'));
    }
    for (const q of f.dots || []) {
      out.push(`<circle class="cdot" cx="${X(q.p[0])}" cy="${Y(q.p[1])}" r="4"/>`);
      if (q.t) out.push(txt(away(q.p, q.c, 0.5), q.t, 'vl'));
    }
    for (const q of f.labels || []) out.push(txt(away(q.p, q.c, q.d || 0.5), q.t, 'vl'));
    for (const q of f.texts || []) out.push(txt(q.p, q.t, q.cls || 'tx'));
    if (f.pick && f.grid) {
      for (let y = 0; y <= f.grid.h; y++) for (let x = 0; x <= f.grid.w; x++) {
        out.push(`<circle class="gp" data-p="${x},${y}" cx="${X(x)}" cy="${Y(y)}" r="${(u * 0.26).toFixed(1)}"><title>(${x}, ${y})</title></circle>`);
      }
    }
    out.push('</svg>');
    return out.join('');
  }

  // 디지털 숫자: { nums: ['2', '5', '6'], rot: true(180° 돌려 보기 단추) }
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  const SEGP = { a: 'M9 5h22', b: 'M33 8v24', c: 'M33 38v24', d: 'M9 65h22', e: 'M7 38v24', f: 'M7 8v24', g: 'M9 35h22' };
  function digit(ch) {
    const on = SEG[ch] || '';
    return `<svg class="dg" viewBox="0 0 40 70" aria-hidden="true">${Object.keys(SEGP).map((k) => `<path class="${on.includes(k) ? 'on' : 'off'}" d="${SEGP[k]}"/>`).join('')}</svg>`;
  }
  function digits(f) {
    return `<div class="fig-digits" role="img" aria-label="디지털 숫자 ${f.nums.join(', ')}"><div class="dg-row">${f.nums.map((c) => `<span class="dg-box">${digit(c)}</span>`).join('')}</div>${f.rot ? '<button type="button" class="btn ghost small-btn rot-btn">↻ 숫자를 하나씩 180° 돌려 보기</button>' : ''}</div>`;
  }

  const KINDS = { numberline, cards, chips, table, grid, rect, arrows, bars, spinner, bag, geo, digits };
  function render(fig) {
    if (!fig) return '';
    const fn = KINDS[fig.type];
    if (!fn) throw new Error('모르는 그림: ' + fig.type);
    return fn(fig);
  }

  M5.figure = { render };
})();
