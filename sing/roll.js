// 노래 연습장: 음 높이 그림판. 가로는 시간, 세로는 음(한 칸 = 반음).
// 목표 음은 막대로, 내가 부른 음은 선으로 그린다.
'use strict';

class Roll {
  constructor(canvas, labelFn) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.lo = 48; this.hi = 72;
    this.label = labelFn || ((m) => Notes.en(m));
    this.colors = null; this.colorsAt = 0;
  }
  setRange(lo, hi) { this.lo = Math.floor(lo); this.hi = Math.ceil(Math.max(hi, lo + 6)); }
  fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(this.c.clientWidth * dpr), h = Math.round(this.c.clientHeight * dpr);
    if (w && h && (this.c.width !== w || this.c.height !== h)) { this.c.width = w; this.c.height = h; }
    this.dpr = dpr; this.w = this.c.width; this.h = this.c.height;
    const now = performance.now();
    if (!this.colors || now - this.colorsAt > 1000) {
      const cs = getComputedStyle(document.documentElement);
      const v = (n) => cs.getPropertyValue(n).trim();
      this.colors = {
        bg: v('--roll-bg'), lane: v('--roll-lane'), line: v('--line'), ink: v('--ink-3'), ink2: v('--ink-2'),
        target: v('--target'), targetOn: v('--target-on'), me: v('--accent'), good: v('--good'), now: v('--ink-2'),
      };
      this.colorsAt = now;
    }
  }
  y(m) { return ((this.hi + 0.5 - m) / (this.hi - this.lo + 1)) * this.h; }
  // opts: { t0, t1, now, targets:[{s,e,m,to}], trace:[{t,m,ok}], activeTarget }
  draw(o) {
    this.fit();
    const { g, w, h, dpr, colors: C } = this;
    const LW = 46 * dpr; // 왼쪽 음 이름 칸
    const row = h / (this.hi - this.lo + 1);
    const x = (t) => LW + ((t - o.t0) / (o.t1 - o.t0)) * (w - LW);
    g.clearRect(0, 0, w, h);
    g.fillStyle = C.bg; g.fillRect(0, 0, w, h);
    // 줄: 검은 건반 음은 진하게
    for (let m = this.lo; m <= this.hi; m++) {
      const yy = this.y(m) - row / 2;
      if (Notes.black(m)) { g.fillStyle = C.lane; g.fillRect(LW, yy, w - LW, row); }
      if (Notes.pc(m) === 0) { g.fillStyle = C.line; g.fillRect(LW, yy + row - dpr, w - LW, dpr); }
    }
    // 음 이름
    const fs = Math.max(9 * dpr, Math.min(12 * dpr, row * 0.9)); // 그림판이 작아도 읽을 수 있게
    g.font = `700 ${fs}px system-ui, sans-serif`; g.textBaseline = 'middle'; g.textAlign = 'right';
    for (let m = this.lo; m <= this.hi; m++) {
      const pc = Notes.pc(m);
      if (Notes.black(m) || (row < 15 * dpr && ![0, 4, 7].includes(pc)) || (row < 7 * dpr && pc !== 0)) continue;
      g.fillStyle = pc === 0 ? C.ink2 : C.ink;
      g.fillText(this.label(m), LW - 6 * dpr, this.y(m));
    }
    g.save();
    g.beginPath(); g.rect(LW, 0, w - LW, h); g.clip();
    // 목표 막대
    for (const tg of o.targets || []) {
      if (tg.e < o.t0 || tg.s > o.t1) continue;
      const on = o.now >= tg.s && o.now <= tg.e;
      g.fillStyle = on && o.activeTarget !== false ? C.targetOn : C.target;
      if (tg.to == null) {
        const x0 = x(tg.s), x1 = x(tg.e), rh = row * 0.78;
        roundRect(g, x0, this.y(tg.m) - rh / 2, Math.max(2, x1 - x0 - 2 * dpr), rh, Math.min(rh / 2, 8 * dpr));
        g.fill();
      } else {
        g.strokeStyle = g.fillStyle; g.lineWidth = row * 0.78; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x(tg.s) + row * 0.4, this.y(tg.m)); g.lineTo(x(tg.e) - row * 0.4, this.y(tg.to)); g.stroke();
      }
    }
    // 내가 부른 선
    const tr = o.trace || [];
    g.lineWidth = 3.5 * dpr; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 1; i < tr.length; i++) {
      const a = tr[i - 1], b = tr[i];
      if (b.t < o.t0 || a.t > o.t1 || b.t - a.t > 0.12 || Math.abs(b.m - a.m) > 2) continue;
      g.strokeStyle = b.ok ? C.good : C.me;
      g.beginPath(); g.moveTo(x(a.t), this.y(a.m)); g.lineTo(x(b.t), this.y(b.m)); g.stroke();
    }
    const last = tr[tr.length - 1];
    if (last && o.now - last.t < 0.15) {
      g.fillStyle = last.ok ? C.good : C.me;
      g.beginPath(); g.arc(x(last.t), this.y(last.m), 6 * dpr, 0, Math.PI * 2); g.fill();
    }
    // 지금 선
    if (o.now >= o.t0 && o.now <= o.t1 && o.showNow !== false) {
      g.fillStyle = C.now; g.globalAlpha = 0.5; g.fillRect(x(o.now) - dpr, 0, 2 * dpr, h); g.globalAlpha = 1;
    }
    g.restore();
  }
}

function roundRect(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
