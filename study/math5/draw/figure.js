// 그림 그리기 (기획서 10번). 틀이 만든 그림 정보를 받아 SVG·HTML 글자로 바꾼다.
// 화면(DOM)을 쓰지 않으므로 자동 테스트에서도 그대로 확인할 수 있다.
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});
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
    return `<div class="fig-chips">${f.items.map((v) => `<span class="chip">${esc(v)}</span>`).join('')}</div>`;
  }

  // 표: { title, head: [...], rows: [[...], ...] }
  function table(f) {
    const cap = f.title ? `<caption>${esc(f.title)}</caption>` : '';
    const head = `<thead><tr>${f.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>`;
    const body = `<tbody>${f.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table class="fig-table">${cap}${head}${body}</table>`;
  }

  const KINDS = { numberline, cards, chips, table };
  function render(fig) {
    if (!fig) return '';
    const fn = KINDS[fig.type];
    if (!fn) throw new Error('모르는 그림: ' + fig.type);
    return fn(fig);
  }

  M5.figure = { render };
})();
