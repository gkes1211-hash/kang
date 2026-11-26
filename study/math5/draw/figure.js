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

  const KINDS = { numberline, cards, chips, table, grid, rect, arrows, bars, spinner, bag };
  function render(fig) {
    if (!fig) return '';
    const fn = KINDS[fig.type];
    if (!fn) throw new Error('모르는 그림: ' + fig.type);
    return fn(fig);
  }

  M5.figure = { render };
})();
