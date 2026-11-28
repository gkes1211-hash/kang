// 과학 실험실: 열 실험 장치 (5학년 2학기 3단원 열과 우리 생활에서 처음 써요)
//   timeGraph : 시간이 흐르며 온도가 바뀌는 모습 + 온도 그래프 (두 물체 만나기, 빛과 열, 단열)
//   conduct   : 열 변색 붙임딱지로 보는 고체 속 열의 이동 (전도)
//   convect   : 물감·비눗방울로 보는 물과 공기 속 열의 이동 (대류)
// 도구(canvasBench 등)는 lab.js 의 SCI.labTools 를 같이 써요.
(() => {
  'use strict';
  const { W, H, FONT, rand, clamp, esc, tween, canvasBench, label, rrect, table } = SCI.labTools;
  const kits = SCI.kits;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, f) => { const A = hex(a); const B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(f, 0, 1))).join(',')})`; };
  const waterColor = (T) => (T < 30 ? mix('#7cc4ff', '#dff1ff', (T - 0) / 30) : mix('#ffe9df', '#ff7b5c', (T - 30) / 55));
  const fmtT = (T) => `${T.toFixed(1)} °C`;

  // =================================================================== 시간 흐름 + 온도 그래프
  // L: { scene: 'nested'|'cups'|'lamp', tmax(분), ymin, ymax, runs: [{ btn, after, screen?, series: [{ name, short?, color, from, to, k }] }], lines: { start, run } }
  kits.timeGraph = (L, api) => {
    const { ctx } = canvasBench(api.bench);
    const G = { x0: 450, x1: 735, y0: 100, y1: 362 };
    let ri = 0; let run = L.runs[0]; let t = 0; let on = false;
    const T = (s, tt) => s.to + (s.from - s.to) * Math.exp(-s.k * tt);
    const gx = (tt) => G.x0 + (tt / L.tmax) * (G.x1 - G.x0);
    const gy = (v) => G.y1 - ((v - L.ymin) / (L.ymax - L.ymin)) * (G.y1 - G.y0);
    const name = (s) => s.short || s.name;

    const steam = (x, y, n = 2) => { ctx.strokeStyle = 'rgba(150,170,180,.7)'; ctx.lineWidth = 3; for (let i = 0; i < n; i++) { const sx = x + (i - (n - 1) / 2) * 16; ctx.beginPath(); ctx.moveTo(sx, y); ctx.quadraticCurveTo(sx - 8, y - 10, sx, y - 20); ctx.quadraticCurveTo(sx + 8, y - 30, sx, y - 40); ctx.stroke(); } };
    const beaker = (x, y, w, h, Tw, fill = 0.9) => {
      ctx.fillStyle = waterColor(Tw); ctx.fillRect(x + 4, y + h * (1 - fill), w - 8, h * fill - 4);
      ctx.strokeStyle = '#7aa9c9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y); ctx.stroke();
    };

    const scenes = {
      nested: () => {
        const [a, b] = run.series;
        beaker(40, 150, 300, 240, T(a, t), 0.88);
        beaker(140, 215, 100, 170, T(b, t), 0.85);
        if (T(a, t) > 45) steam(90, 170, 2);
        label(ctx, `${name(a)} ${fmtT(T(a, t))}`, 190, 125, a.color, 17);
        label(ctx, `${name(b)}`, 190, 262, b.color, 14);
        label(ctx, fmtT(T(b, t)), 190, 284, b.color, 17);
      },
      cups: () => {
        const n = run.series.length; const gap = 400 / n;
        run.series.forEach((s, i) => {
          const cx = gap * i + gap / 2; const Tw = T(s, t);
          if (/보온병/.test(s.name)) {
            ctx.fillStyle = '#b8c4cc'; rrect(ctx, cx - 38, 212, 76, 168, 18); ctx.fill();
            ctx.fillStyle = '#7f8c94'; rrect(ctx, cx - 30, 196, 60, 22, 8); ctx.fill();
            ctx.fillStyle = waterColor(Tw); rrect(ctx, cx - 16, 300, 32, 60, 6); ctx.fill();
          } else {
            if (/스타이로폼/.test(s.name)) { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c9d3d8'; ctx.lineWidth = 3; rrect(ctx, cx - 62, 230, 124, 152, 10); ctx.fill(); ctx.stroke(); for (let k = 0; k < 40; k++) { ctx.fillStyle = '#e6ecef'; ctx.beginPath(); ctx.arc(cx - 56 + ((k * 37) % 112), 236 + ((k * 53) % 140), 3, 0, Math.PI * 2); ctx.fill(); } }
            if (/솜/.test(s.name)) { ctx.fillStyle = '#f4efe4'; ctx.strokeStyle = '#d8cfbd'; ctx.lineWidth = 2; for (let k = 0; k < 16; k++) { ctx.beginPath(); ctx.arc(cx - 40 + (k % 2) * 80, 266 + Math.floor(k / 2) * 15, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } }
            beaker(cx - 34, 270, 68, 110, Tw, 0.85);
          }
          if (Tw > 45) steam(cx, 200, 2);
          label(ctx, fmtT(Tw), cx, 176, s.color, 18);
          label(ctx, name(s), cx, 393, '#1f3a3a', 13);
        });
      },
      lamp: () => {
        const [a, b] = run.series; const lit = on || t > 0;
        const LX = 70; const LY = 92;
        // 빛줄기
        if (lit) {
          ctx.strokeStyle = 'rgba(255,200,40,.35)'; ctx.lineWidth = 7;
          for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(LX + 10, LY + 10); ctx.lineTo(120 + k * 25, 340); ctx.stroke(); }
          for (let k = 0; k < 4; k++) {
            const ex = 268 + k * 25; const ey = 340;
            ctx.beginPath(); ctx.moveTo(LX + 10, LY + 10);
            if (run.screen) { const f = (248 - (LX + 10)) / (ex - (LX + 10)); ctx.lineTo(248, LY + 10 + (ey - LY - 10) * f); } else ctx.lineTo(ex, ey);
            ctx.stroke();
          }
        }
        // 전등
        ctx.fillStyle = '#555'; ctx.fillRect(LX - 4, 20, 8, 50);
        ctx.fillStyle = '#7a8a92'; ctx.beginPath(); ctx.moveTo(LX - 40, 70); ctx.lineTo(LX + 40, 70); ctx.lineTo(LX + 26, 104); ctx.lineTo(LX - 26, 104); ctx.closePath(); ctx.fill();
        ctx.fillStyle = lit ? '#ffd84a' : '#eee'; ctx.beginPath(); ctx.arc(LX, 106, 14, 0, Math.PI * 2); ctx.fill();
        // 판
        [[a, 115], [b, 265]].forEach(([s, x]) => { const Tw = T(s, t); ctx.fillStyle = mix('#5b6770', '#c0392b', (Tw - 20) / 25); rrect(ctx, x, 340, 100, 16, 4); ctx.fill(); label(ctx, fmtT(Tw), x + 50, 318, s.color, 18); label(ctx, name(s), x + 50, 384, '#1f3a3a', 14); });
        if (run.screen) { ctx.fillStyle = '#8d6e63'; rrect(ctx, 240, 190, 14, 170, 4); ctx.fill(); label(ctx, '가림판', 247, 175, '#5d4037', 14); }
      },
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      table(ctx);
      scenes[L.scene]();
      // 그래프
      ctx.fillStyle = '#fbfefd'; ctx.fillRect(G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0);
      ctx.strokeStyle = '#d5e6e2'; ctx.lineWidth = 1; ctx.font = `700 12px ${FONT}`; ctx.fillStyle = '#5d7676'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let v = L.ymin; v <= L.ymax; v += 10) { ctx.beginPath(); ctx.moveTo(G.x0, gy(v)); ctx.lineTo(G.x1, gy(v)); ctx.stroke(); ctx.fillText(v, G.x0 - 6, gy(v)); }
      ctx.textAlign = 'center';
      for (let k = 0; k <= 5; k++) { const tt = (L.tmax / 5) * k; ctx.fillText(Math.round(tt), gx(tt), G.y1 + 13); }
      ctx.strokeStyle = '#5d7676'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(G.x0, G.y0); ctx.lineTo(G.x0, G.y1); ctx.lineTo(G.x1, G.y1); ctx.stroke();
      ctx.fillText('온도(°C)', G.x0 - 2, G.y0 - 12); ctx.textAlign = 'right'; ctx.fillText('시간(분)', G.x1, G.y1 + 30);
      run.series.forEach((s, i) => {
        ctx.strokeStyle = s.color; ctx.lineWidth = 4; ctx.beginPath();
        for (let k = 0; k <= 120; k++) { const tt = (t * k) / 120; const x = gx(tt); const y = gy(T(s, tt)); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(gx(t), gy(T(s, t)), 5, 0, Math.PI * 2); ctx.fill();
        // 범례
        const ly = 18 + i * 22; ctx.fillRect(G.x0, ly - 4, 22, 8);
        ctx.font = `800 14px ${FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = '#1f3a3a'; ctx.fillText(`${s.name}`, G.x0 + 30, ly);
      });
      ctx.textAlign = 'center';
    };
    const tick = () => { if (!api.alive()) return; draw(); requestAnimationFrame(tick); };

    const start = async () => {
      api.clearBtns(); on = true; t = 0; api.say(L.lines.run);
      await tween(5500, (f) => { t = f * L.tmax; });
      on = false;
      if (!api.alive()) return;
      api.say(run.after);
      const next = L.runs[ri + 1];
      if (next) api.btn(next.btn, () => { ri++; run = next; t = 0; side(); start(); });
      else api.done();
    };
    const side = () => { api.side.innerHTML = `<div class="card"><b>📈 그래프 보는 법</b><p class="tip">가로는 흐른 시간, 세로는 온도예요. 선이 내려가면 식고, 올라가면 데워지는 거예요.</p></div>
      <div class="card"><b>🌡️ 처음 온도</b>${run.series.map((s) => `<div class="grain"><i style="width:18px;height:18px;background:${s.color}"></i>${esc(s.name)} ${s.from} °C</div>`).join('')}</div>`; };
    side();
    api.say(L.lines.start);
    api.btn(run.btn, start);
    requestAnimationFrame(tick);
  };

  // =================================================================== 전도: 열 변색 붙임딱지
  // L: { rods: [[이름, 빠르기], ...], lines: { start, after1, cutGo, cut, after2, rodsGo, rods, end } }
  kits.conduct = (L, api) => {
    const { c, ctx, local } = canvasBench(api.bench);
    const CS = 14; const COLS = 26; const ROWS = 20; const OX = 200; const OY = 66;
    const RATE = 5.5; // 1초에 칸
    const BASE = '#40358a'; const HOT = '#ff5fa2'; const HOTTER = '#ffd23f';
    let phase = 'wait1'; let mask = []; let spd = []; let dist = []; let src = []; let t0 = 0; let el = 0; let finished = false;
    const idx = (x, y) => y * COLS + x;
    const setMask = (fn, sp) => { mask = []; spd = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { mask.push(fn(x, y)); spd.push(sp ? sp(x, y) : 1); } dist = mask.map(() => Infinity); src = []; el = 0; };
    const square = () => setMask(() => true);
    const cutPlate = () => setMask((x, y) => !(x >= 12 && x <= 13 && y <= 14));
    const RODS = [3, 9, 15];
    const rods = () => setMask((x, y) => x >= 2 && x <= 24 && RODS.some((r) => y === r || y === r + 1), (x, y) => { const k = RODS.findIndex((r) => y === r || y === r + 1); return k >= 0 ? L.rods[k][1] : 0; });
    // 이어진 칸을 따라 잰 거리 (잘린 곳은 돌아가요)
    const measure = (sources) => {
      dist = mask.map(() => Infinity); const done = mask.map(() => false);
      sources.forEach((i) => { dist[i] = 0; });
      for (;;) {
        let best = -1; let bd = Infinity;
        for (let i = 0; i < dist.length; i++) if (!done[i] && mask[i] && dist[i] < bd) { bd = dist[i]; best = i; }
        if (best < 0) break;
        done[best] = true;
        const bx = best % COLS; const by = Math.floor(best / COLS);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = bx + dx; const ny = by + dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
          const j = idx(nx, ny);
          if (!mask[j]) continue;
          if (dx && dy && (!mask[idx(bx + dx, by)] || !mask[idx(bx, by + dy)])) continue;
          const nd = bd + (dx && dy ? 1.414 : 1);
          if (nd < dist[j]) dist[j] = nd;
        }
      }
    };
    const heatAt = (cells) => { src = cells; measure(cells); t0 = performance.now(); el = 0; };
    const allHot = (pred) => mask.every((m, i) => !m || !pred(i) || dist[i] === Infinity || el * RATE * spd[i] > dist[i] + 1);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      table(ctx);
      label(ctx, phase.startsWith('rod') || phase === 'end' ? '세 막대에 열 변색 붙임딱지를 붙였어요' : '구리판 + 열 변색 붙임딱지', OX + (COLS * CS) / 2, 36, '#5d4037', 16);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const i = idx(x, y); if (!mask[i]) continue;
        const px = OX + x * CS; const py = OY + y * CS;
        ctx.fillStyle = '#c87533'; ctx.fillRect(px, py, CS, CS);
        const f = dist[i] === Infinity ? 0 : (el * RATE * spd[i] - dist[i]) / 2.5;
        ctx.fillStyle = f <= 0 ? BASE : f < 1 ? mix(BASE, HOT, f) : mix(HOT, HOTTER, (f - 1) / 6);
        ctx.fillRect(px + 1, py + 1, CS - 2, CS - 2);
      }
      ctx.font = `30px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      src.forEach((i, k) => { if (phase.startsWith('rod') || phase === 'end') { if (k % 2) return; } const x = i % COLS; const y = Math.floor(i / COLS); ctx.fillText('🔥', OX + x * CS + CS / 2, OY + y * CS + CS / 2 + (phase.startsWith('rod') || phase === 'end' ? 22 : 0)); });
      if (phase.startsWith('rod') || phase === 'end') RODS.forEach((r, k) => label(ctx, L.rods[k][0], OX - 40, OY + r * CS + CS, '#1f3a3a', 18));
      if (phase === 'wait1' || phase === 'wait2') label(ctx, '👆 데우고 싶은 곳을 눌러요', OX + (COLS * CS) / 2, OY + ROWS * CS + 26, '#0f8f84', 16);
    };
    const tick = () => {
      if (!api.alive()) return;
      if (src.length) el = (performance.now() - t0) / 1000;
      if (phase === 'heat1' && allHot(() => true)) { phase = 'done1'; api.say(L.lines.after1); setTimeout(() => { if (!api.alive()) return; api.say(L.lines.cutGo); api.btn('✂️ 잘린 판으로 바꾸기', () => { api.clearBtns(); cutPlate(); phase = 'wait2'; api.say(L.lines.cut); }); }, 2400); }
      if (phase === 'heat2' && allHot(() => true)) { phase = 'done2'; api.say(L.lines.after2); setTimeout(() => { if (!api.alive()) return; api.say(L.lines.rodsGo); api.btn('🥄 구리·철·유리 비교하기', () => { api.clearBtns(); rods(); phase = 'rods'; api.say(L.lines.rods); heatAt(RODS.flatMap((r) => [idx(2, r), idx(2, r + 1)])); }); }, 2400); }
      if (phase === 'rods' && allHot((i) => Math.floor(i / COLS) <= RODS[0] + 1)) { phase = 'rodsWait'; setTimeout(() => { if (!api.alive() || finished) return; finished = true; phase = 'end'; api.say(L.lines.end); api.done(); }, 2500); }
      draw();
      requestAnimationFrame(tick);
    };
    c.addEventListener('click', (ev) => {
      if (phase !== 'wait1' && phase !== 'wait2') return;
      const p = local(ev);
      const x = Math.floor((p.x - OX) / CS); const y = Math.floor((p.y - OY) / CS);
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS || !mask[idx(x, y)]) return;
      heatAt([idx(x, y)]);
      phase = phase === 'wait1' ? 'heat1' : 'heat2';
    });
    c.style.cursor = 'pointer';
    api.side.innerHTML = `<div class="card"><b>🎨 열 변색 붙임딱지</b><div class="grain"><i style="width:22px;height:22px;border-radius:5px;background:${BASE}"></i>차가울 때</div><div class="grain"><i style="width:22px;height:22px;border-radius:5px;background:${HOT}"></i>따뜻해지면</div><div class="grain"><i style="width:22px;height:22px;border-radius:5px;background:${HOTTER}"></i>더 뜨거우면</div>
      <p class="tip">온도에 따라 색이 변해서, 열이 어디로 가는지 눈으로 볼 수 있어요.</p></div>
      <div class="card"><b>📋 순서</b><div class="order"><span>① 구리판</span><span>② 잘린 판</span><span>③ 세 막대</span></div></div>`;
    square();
    api.say(L.lines.start);
    requestAnimationFrame(tick);
  };

  // =================================================================== 대류: 물감과 비눗방울
  // L: { lines: { start, drop, after1, roomGo, room, end } }
  kits.convect = (L, api) => {
    const { c, ctx, local } = canvasBench(api.bench);
    const SC = {
      water: { x: 200, y: 108, w: 360, h: 250, speed: 70, color: ['#3f6bd8', '#d83f8c', '#2e9e57', '#e08a1e'] },
      room: { x: 110, y: 50, w: 540, h: 330, speed: 95, color: ['#9ad7ff'] },
    };
    let scene = 'water'; let R = SC.water; let heat = false; let heatT = 0; let drops = 0; let firstDrop = 0; let phase = 'cold'; let finished = false;
    let ps = [];
    let last = performance.now();
    // 흐름: 물은 가운데가 위로(두 바퀴), 방은 난로 쪽(왼쪽)이 위로(한 바퀴)
    const vel = (x, y) => {
      const X = clamp((x - R.x) / R.w, 0, 1); const Y = clamp((y - R.y) / R.h, 0, 1);
      if (scene === 'water') {
        const k = R.speed / ((2 * Math.PI) / R.w);
        return [-Math.sin(2 * Math.PI * X) * Math.cos(Math.PI * Y) * (Math.PI / R.h) * k, Math.cos(2 * Math.PI * X) * Math.sin(Math.PI * Y) * ((2 * Math.PI) / R.w) * k];
      }
      const k = R.speed / (Math.PI / R.w);
      return [Math.sin(Math.PI * X) * Math.cos(Math.PI * Y) * (Math.PI / R.h) * k, -Math.cos(Math.PI * X) * Math.sin(Math.PI * Y) * (Math.PI / R.w) * k];
    };
    const spawn = (x, y) => {
      const col = R.color[drops % R.color.length];
      for (let i = 0; i < 16; i++) ps.push({ x: x + rand(-16, 16), y: y + rand(-16, 16), trail: [], col, bub: scene === 'room', r: rand(5, 9) });
      drops++; if (!firstDrop && heat) firstDrop = performance.now();
    };
    const drawWater = () => {
      // 비커
      ctx.fillStyle = '#e3f3ff'; ctx.fillRect(R.x, R.y, R.w, R.h);
      if (heat) { const g = ctx.createLinearGradient(0, R.y, 0, R.y + R.h); const a = clamp(heatT / 10, 0, 0.35); g.addColorStop(0, `rgba(255,120,80,${a})`); g.addColorStop(1, 'rgba(255,120,80,0)'); ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h); }
      ctx.strokeStyle = '#7aa9c9'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(R.x - 6, R.y - 30); ctx.lineTo(R.x - 6, R.y + R.h + 6); ctx.lineTo(R.x + R.w + 6, R.y + R.h + 6); ctx.lineTo(R.x + R.w + 6, R.y - 30); ctx.stroke();
      // 삼발이 + 알코올램프
      const cx = R.x + R.w / 2;
      ctx.fillStyle = '#f1f6fa'; ctx.strokeStyle = '#999'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 34, 432); ctx.lineTo(cx + 34, 432); ctx.lineTo(cx + 24, 392); ctx.lineTo(cx - 24, 392); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (heat) { ctx.font = `34px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔥', cx, 376 + Math.sin(performance.now() / 120) * 2); }
      label(ctx, '비커 속 물', R.x + R.w + 70, R.y + 20, '#2d5d7b', 15);
    };
    const drawRoom = () => {
      ctx.fillStyle = '#fffaf0'; ctx.fillRect(R.x, R.y, R.w, R.h);
      ctx.strokeStyle = '#a1887f'; ctx.lineWidth = 6; ctx.strokeRect(R.x, R.y, R.w, R.h);
      ctx.fillStyle = '#d7ccc8'; ctx.fillRect(R.x, R.y + R.h - 6, R.w, 6);
      ctx.fillStyle = '#e3f2fd'; ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 4; rrect(ctx, R.x + R.w - 150, R.y + 60, 110, 90, 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(R.x + R.w - 95, R.y + 60); ctx.lineTo(R.x + R.w - 95, R.y + 150); ctx.stroke();
      const g = ctx.createRadialGradient(R.x + 60, R.y + R.h - 40, 10, R.x + 60, R.y + R.h - 40, 200); g.addColorStop(0, `rgba(255,140,90,${clamp(heatT / 8, 0, 0.35)})`); g.addColorStop(1, 'rgba(255,140,90,0)'); ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
      ctx.fillStyle = '#c62828'; rrect(ctx, R.x + 22, R.y + R.h - 70, 80, 64, 8); ctx.fill();
      ctx.strokeStyle = '#ffab91'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(R.x + 32, R.y + R.h - 58 + k * 13); ctx.lineTo(R.x + 92, R.y + R.h - 58 + k * 13); ctx.stroke(); }
      label(ctx, '난로', R.x + 62, R.y + R.h - 84, '#b71c1c', 15);
      label(ctx, '창문', R.x + R.w - 95, R.y + 44, '#546e7a', 14);
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      table(ctx);
      if (scene === 'water') drawWater(); else drawRoom();
      ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
      for (const p of ps) {
        if (p.bub) {
          ctx.fillStyle = 'rgba(160,215,255,.35)'; ctx.strokeStyle = 'rgba(80,150,210,.8)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(p.x - p.r / 3, p.y - p.r / 3, p.r / 4, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.strokeStyle = p.col; ctx.globalAlpha = 0.35; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
          p.trail.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
          ctx.globalAlpha = 0.9; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
      if (heat && (phase === 'drop' || phase === 'room')) label(ctx, scene === 'water' ? '👆 물속을 눌러 물감 떨어뜨리기' : '👆 방 안을 눌러 비눗방울 띄우기', R.x + R.w / 2, 24, '#0f8f84', 16);
      if (heat) { ctx.strokeStyle = 'rgba(224,69,43,.55)'; ctx.fillStyle = 'rgba(224,69,43,.55)'; ctx.lineWidth = 3; const ax = scene === 'water' ? R.x + R.w / 2 : R.x + 62; const ay = scene === 'water' ? R.y + R.h - 30 : R.y + R.h - 104; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ax - 9, ay - 52); ctx.lineTo(ax, ay - 66); ctx.lineTo(ax + 9, ay - 52); ctx.fill(); }
    };
    const tick = (now) => {
      if (!api.alive()) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (heat) heatT += dt;
      for (const p of ps) {
        let vx = 0; let vy = 0;
        if (heat) [vx, vy] = vel(p.x, p.y); else vy = scene === 'water' ? 6 : 0;
        p.x = clamp(p.x + (vx + rand(-14, 14)) * dt, R.x + 4, R.x + R.w - 4);
        p.y = clamp(p.y + (vy + rand(-14, 14)) * dt, R.y + 4, R.y + R.h - 4);
        p.trail.push([p.x, p.y]); if (p.trail.length > 110) p.trail.shift();
      }
      if (phase === 'drop' && drops >= 2 && firstDrop && now - firstDrop > 6000) {
        phase = 'water-done'; api.say(L.lines.after1);
        setTimeout(() => { if (!api.alive()) return; api.say(L.lines.roomGo); api.btn('🏠 방 안 공기로', () => { api.clearBtns(); scene = 'room'; R = SC.room; ps = []; drops = 0; firstDrop = 0; heatT = 0; phase = 'room'; api.say(L.lines.room); }); }, 2800);
      }
      if (phase === 'room' && drops >= 2 && firstDrop && now - firstDrop > 6000 && !finished) { finished = true; phase = 'end'; api.say(L.lines.end); api.done(); }
      draw();
      requestAnimationFrame(tick);
    };
    c.addEventListener('click', (ev) => {
      const p = local(ev);
      if (p.x < R.x || p.x > R.x + R.w || p.y < R.y || p.y > R.y + R.h) return;
      if (ps.length > 220) ps.splice(0, 16);
      spawn(p.x, p.y);
    });
    c.style.cursor = 'crosshair';
    api.side.innerHTML = `<div class="card"><b>👀 무엇을 볼까?</b><p class="tip">물감(비눗방울)이 움직이는 길을 따라가 봐요. 데워진 쪽은 어디로 움직일까요?</p></div>
      <div class="card"><b>📋 순서</b><div class="order"><span>① 비커 속 물</span><span>② 방 안 공기</span></div></div>`;
    api.say(L.lines.start);
    api.btn('🔥 가열하기', () => { api.clearBtns(); heat = true; phase = 'drop'; if (drops) firstDrop = performance.now(); api.say(L.lines.drop); });
    requestAnimationFrame(tick);
  };
})();
