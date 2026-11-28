// 과학 실험실: 실험 장치 모음
// 장치 하나 = SCI.kits.이름(L, api)
//   L   : 데이터의 lab 칸 (lines 말풍선, 장치 설정)
//   api : bench(실험대 요소), side(오른쪽 칸), ctrls(버튼 줄), say(말), btn(이름, 누르면), clearBtns(),
//         noSide(), done() (실험 끝 → 다음 단계 버튼), alive() (화면을 떠나면 false)
// 새 학기에도 같은 장치를 데이터만 바꿔 다시 써요. 새 실험이 필요하면 여기에 장치를 더해요.
(() => {
  'use strict';
  window.SCI = window.SCI || { semesters: {}, order: [] };
  const kits = (SCI.kits = {});
  const W = 760; const H = 440;
  const FONT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const tween = (ms, fn) => new Promise((res) => {
    const t0 = performance.now();
    const step = (now) => { const t = Math.min(1, (now - t0) / ms); fn(t * t * (3 - 2 * t)); if (t < 1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
  });

  // 캔버스 실험대: 760×440 좌표로 그리고, 화면 크기에 맞게 늘어나요
  const canvasBench = (bench) => {
    const c = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    c.className = 'cv';
    bench.appendChild(c);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const local = (ev) => { const r = c.getBoundingClientRect(); return { x: ((ev.clientX - r.left) * W) / r.width, y: ((ev.clientY - r.top) * H) / r.height }; };
    return { c, ctx, local };
  };
  const label = (ctx, text, x, y, color = '#1f3a3a', size = 16) => {
    ctx.font = `800 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
  };
  const rrect = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const table = (ctx) => { ctx.fillStyle = '#e9dcc7'; ctx.fillRect(0, 400, W, 40); };
  // 실험대 위 위치(760×440 좌표) → 퍼센트
  const pct = (x, y) => `left:${(x / W) * 100}%;top:${(y / H) * 100}%`;

  // 끌기 도우미 (마우스·터치 모두)
  const draggable = (el, { start, move, end }) => {
    el.addEventListener('pointerdown', (ev) => {
      if (start && start(ev) === false) return;
      ev.preventDefault();
      el.setPointerCapture(ev.pointerId);
      const mv = (e) => move && move(e);
      const up = (e) => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); end && end(e); };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  };
  const benchPos = (bench, ev) => { const r = bench.getBoundingClientRect(); return { x: ((ev.clientX - r.left) * W) / r.width, y: ((ev.clientY - r.top) * H) / r.height }; };

  // =================================================================== 섞기 (비빔밥): 재료를 그릇에 끌어 넣고 비빈 뒤 돋보기로 살펴보기
  kits.mix = (L, api) => {
    api.noSide();
    const b = api.bench;
    const BOWL = { x: 300, y: 150, w: 400, h: 230 };
    b.innerHTML = `<div class="mx-bowl" style="${pct(BOWL.x, BOWL.y)};width:${(BOWL.w / W) * 100}%;height:${(BOWL.h / H) * 100}%"></div>
      ${L.items.map((it, i) => `<div class="mx-item" data-i="${i}" style="${pct(40, 30 + i * 92)}"><span>${it[0]}</span><small>${esc(it[1])}</small></div>`).join('')}
      <div class="mx-lens" hidden style="${pct(120, 300)}">🔍</div>`;
    const bowl = b.querySelector('.mx-bowl');
    const pieces = [];
    let added = 0; let mixed = false; let finished = false;
    const seen = new Set();
    const putPiece = (i) => {
      for (let k = 0; k < 4; k++) {
        const p = document.createElement('span');
        p.className = 'pc'; p.dataset.name = L.items[i][1];
        p.innerHTML = `<i>${L.items[i][0]}</i><b>${esc(L.items[i][1])} 그대로!</b>`;
        p.style.left = `${8 + ((i * 4 + k) % 8) * 11 + rand(-2, 2)}%`;
        p.style.top = `${18 + Math.floor((i * 4 + k) / 8) * 30 + rand(-4, 4)}%`;
        bowl.appendChild(p); pieces.push(p);
      }
    };
    b.querySelectorAll('.mx-item').forEach((el) => {
      const i = +el.dataset.i;
      const home = el.getAttribute('style');
      draggable(el, {
        start: () => !el.classList.contains('used'),
        move: (ev) => { const p = benchPos(b, ev); el.style.left = `${((p.x - 40) / W) * 100}%`; el.style.top = `${((p.y - 40) / H) * 100}%`; },
        end: (ev) => {
          const p = benchPos(b, ev);
          if (p.x > BOWL.x && p.x < BOWL.x + BOWL.w && p.y > BOWL.y - 40 && p.y < BOWL.y + BOWL.h) {
            el.classList.add('used'); putPiece(i); added++;
            if (added === L.items.length) { api.say(L.lines.ready); api.btn('🥄 비비기', mix); }
          } else el.setAttribute('style', home);
        },
      });
    });
    const mix = async () => {
      if (mixed) return; mixed = true; api.clearBtns();
      bowl.classList.add('shake');
      await wait(900);
      bowl.classList.remove('shake');
      pieces.forEach((p) => { p.style.left = `${rand(6, 84)}%`; p.style.top = `${rand(14, 74)}%`; p.classList.add('mixed'); });
      api.say(L.lines.mixed);
      const lens = b.querySelector('.mx-lens');
      lens.hidden = false;
      draggable(lens, {
        move: (ev) => {
          const p = benchPos(b, ev);
          lens.style.left = `${((p.x - 45) / W) * 100}%`; lens.style.top = `${((p.y - 45) / H) * 100}%`;
          const lr = lens.getBoundingClientRect();
          const cx = lr.left + lr.width / 2; const cy = lr.top + lr.height / 2;
          pieces.forEach((pc) => {
            const r = pc.getBoundingClientRect();
            const on = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy) < lr.width * 0.55;
            pc.classList.toggle('seen', on);
            if (on) seen.add(pc.dataset.name);
          });
          if (!finished && seen.size >= 3) { finished = true; api.say(L.lines.found); api.done(); }
        },
      });
    };
    api.say(L.lines.start);
  };

  // =================================================================== 체: 알갱이 크기로 나누기 (구멍 큰 체 → 구멍 작은 체)
  kits.sieve = (L, api) => {
    const { c, ctx, local } = canvasBench(api.bench);
    const SX = 380; const SY = 120; const SW = 290; const SH = 70; // 체
    const BOWL = { x1: 250, x2: 510, y: 318 };
    const DISH = { x: 120, y: 372 };
    let hole = L.sieves[0].hole; let sieveName = L.sieves[0].name;
    let phase = 'cup'; let dx = 0; let dragging = false; let finished = false;
    const ps = [];
    L.grains.forEach((g) => { for (let i = 0; i < g.n; i++) ps.push({ ...g, box: 'cup', x: rand(70, 170), y: rand(95, 150), tx: 0, ty: 0, st: 'rest', vy: 0 }); });
    ps.sort(() => Math.random() - 0.5);
    const inSieve = (p) => { p.box = 'sieve'; p.tx = rand(SX - SW / 2 + 16, SX + SW / 2 - 16) ; p.ty = rand(SY + 18, SY + SH - p.r - 4); p.st = 'move'; };
    const toBowl = (p) => { p.box = 'bowl'; p.x = clamp(p.x + dx, BOWL.x1 + 30, BOWL.x2 - 30); p.st = 'fall'; p.vy = rand(0, 2); p.ty = rand(BOWL.y + 30, BOWL.y + 66 - p.r); };
    const toDish = (p) => { p.box = 'dish'; p.tx = DISH.x + rand(-55, 55); p.ty = DISH.y + rand(-14, 6); p.st = 'move'; };
    const passes = (p) => p.r * 2 < hole;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      table(ctx);
      // 그릇
      ctx.fillStyle = '#f6efe6'; ctx.strokeStyle = '#b9a58a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(BOWL.x1, BOWL.y); ctx.lineTo(BOWL.x2, BOWL.y); ctx.quadraticCurveTo(BOWL.x2 - 10, 405, (BOWL.x1 + BOWL.x2) / 2, 405); ctx.quadraticCurveTo(BOWL.x1 + 10, 405, BOWL.x1, BOWL.y); ctx.fill(); ctx.stroke();
      // 접시 (콩 놓는 곳)
      if (phase === 'sieve2' || phase === 'done2') { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#b9a58a'; ctx.beginPath(); ctx.ellipse(DISH.x, DISH.y + 6, 80, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      // 컵
      if (phase === 'cup') { ctx.fillStyle = 'rgba(220,240,255,.5)'; ctx.strokeStyle = '#7aa9c9'; rrect(ctx, 55, 70, 130, 95, 10); ctx.fill(); ctx.stroke(); label(ctx, '콩·팥·좁쌀 혼합물', 120, 190, '#1f3a3a', 15); }
      // 체 (뒤쪽 테두리)
      const sx = SX + dx;
      ctx.fillStyle = 'rgba(210,180,140,.18)'; ctx.strokeStyle = '#9b7b4f'; ctx.lineWidth = 6;
      rrect(ctx, sx - SW / 2, SY, SW, SH, 14); ctx.fill(); ctx.stroke();
      // 체 그물
      ctx.strokeStyle = 'rgba(90,70,40,.45)'; ctx.lineWidth = 1.2;
      for (let x = sx - SW / 2 + hole / 2; x < sx + SW / 2; x += hole + 2) { ctx.beginPath(); ctx.moveTo(x, SY + SH - 2); ctx.lineTo(x, SY + SH + 6); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(sx - SW / 2, SY + SH + 2); ctx.lineTo(sx + SW / 2, SY + SH + 2); ctx.stroke();
      label(ctx, `${sieveName} (구멍 ${hole >= 12 ? '크게' : '작게'})`, sx, SY - 18, '#7a5a2a', 16);
      // 알갱이
      for (const p of ps) {
        const x = p.box === 'sieve' ? p.x + dx : p.x;
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        if (p.r > 4) { ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.stroke(); }
      }
      if (phase === 'done1' || phase === 'sieve2' || phase === 'done2') label(ctx, phase === 'done2' ? '좁쌀' : '팥 + 좁쌀', (BOWL.x1 + BOWL.x2) / 2, 425, '#0a6a62', 18);
      if (phase === 'done1') label(ctx, '콩', SX, SY + SH + 26, '#0a6a62', 18);
      if (phase === 'done2') { label(ctx, '팥', SX, SY + SH + 26, '#0a6a62', 18); label(ctx, '콩', DISH.x, DISH.y + 44, '#0a6a62', 18); }
      if (phase === 'sieve1' || phase === 'sieve2') label(ctx, '↔ 체를 잡고 좌우로 흔들어요', SX, 30, '#0f8f84', 17);
    };
    const tick = () => {
      if (!api.alive()) return;
      for (const p of ps) {
        if (p.st === 'move') { p.x += (p.tx - p.x) * 0.14; p.y += (p.ty - p.y) * 0.14; if (Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) < 1) { p.x = p.tx; p.y = p.ty; p.st = 'rest'; } }
        else if (p.st === 'fall') { p.vy += 0.7; p.y += p.vy; if (p.y >= p.ty) { p.y = p.ty; p.st = 'rest'; } }
      }
      if (!dragging && dx !== 0 && !shaking) { dx *= 0.8; if (Math.abs(dx) < 0.5) dx = 0; }
      draw();
      requestAnimationFrame(tick);
    };
    const shakeOnce = () => {
      if (phase !== 'sieve1' && phase !== 'sieve2') return;
      for (const p of ps) {
        if (p.box !== 'sieve' || p.st !== 'rest') continue;
        if (passes(p) && Math.random() < 0.5) toBowl(p);
        else { p.y = clamp(p.y + rand(-5, 5), SY + 16, SY + SH - p.r - 3); p.x = clamp(p.x + rand(-6, 6), SX - SW / 2 + 14, SX + SW / 2 - 14); }
      }
      if (!ps.some((p) => p.box === 'sieve' && passes(p))) setTimeout(finishPhase, 500);
    };
    const finishPhase = () => {
      if (phase === 'sieve1') {
        phase = 'done1'; api.clearBtns(); api.say(L.lines.big);
        setTimeout(() => { if (phase !== 'done1' || !api.alive()) return; api.say(L.lines.swap); api.btn(`🕸️ ${L.sieves[1].name}로 바꾸기`, swap); }, 2600);
      } else if (phase === 'sieve2' && !finished) {
        finished = true; phase = 'done2'; api.clearBtns(); api.say(L.lines.small); api.done();
      }
    };
    const swap = () => {
      api.clearBtns();
      hole = L.sieves[1].hole; sieveName = L.sieves[1].name;
      ps.forEach((p) => { if (p.box === 'sieve') toDish(p); else if (p.box === 'bowl') inSieve(p); });
      phase = 'sieve2'; api.say(L.lines.shake); api.btn('↔️ 흔들기', shakeBtn);
    };
    let shaking = false;
    const shakeBtn = async () => {
      if (shaking) return; shaking = true;
      await tween(1100, (t) => { dx = Math.sin(t * Math.PI * 6) * 45; });
      dx = 0; shaking = false;
      shakeOnce(); setTimeout(shakeOnce, 150); setTimeout(shakeOnce, 300);
    };
    // 체를 마우스로 잡고 흔들기: 방향이 바뀔 때마다 한 번 흔든 것으로 쳐요
    let startX = 0; let lastX = 0; let dir = 0; let travel = 0;
    draggable(c, {
      start: (ev) => {
        if (phase !== 'sieve1' && phase !== 'sieve2') return false;
        const p = local(ev);
        if (p.y < SY - 40 || p.y > SY + SH + 30 || Math.abs(p.x - (SX + dx)) > SW / 2 + 30) return false;
        dragging = true; startX = p.x - dx; lastX = p.x; dir = 0; travel = 0; return true;
      },
      move: (ev) => {
        const p = local(ev);
        dx = clamp(p.x - startX, -70, 70);
        const d = Math.sign(p.x - lastX);
        travel += Math.abs(p.x - lastX);
        if (d && d !== dir) { if (travel > 25) shakeOnce(); dir = d; travel = 0; }
        lastX = p.x;
      },
      end: () => { dragging = false; },
    });
    c.style.cursor = 'grab';
    api.say(L.lines.start);
    api.btn('🫙 붓기', () => { api.clearBtns(); ps.forEach(inSieve); phase = 'sieve1'; api.say(L.lines.shake); api.btn('↔️ 흔들기', shakeBtn); });
    api.side.innerHTML = `<div class="card"><b>🔎 알갱이 크기</b>${L.grains.map((g) => `<div class="grain"><i style="width:${g.r * 2}px;height:${g.r * 2}px;background:${g.color}"></i>${esc(g.name)}</div>`).join('')}</div>
      <div class="card"><b>🕸️ 체 두 개</b>${L.sieves.map((s) => `<div class="grain"><span class="holes" style="--h:${s.hole}px"></span>${esc(s.name)}</div>`).join('')}</div>`;
    requestAnimationFrame(tick);
  };

  // =================================================================== 자석: 철 구슬 골라내기 → 철 캔과 알루미늄 캔
  kits.magnet = (L, api) => {
    const { c, ctx, local } = canvasBench(api.bench);
    const TRAY = { x: 30, y: 210, w: 430, h: 180 };
    const BOX = { x: 530, y: 260, w: 200, h: 140 };
    const HOME = { x: 640, y: 80 };
    let mx = HOME.x; let my = HOME.y; let drag = false; let phase = 'beads'; let told = false; let finished = false;
    let items = [];
    const PLASTIC = ['#ff7aa2', '#5bc0eb', '#9bc53d', '#fde74c', '#c879ff'];
    const spread = (n, w, h) => { const out = []; let tries = 0; while (out.length < n && tries < 2000) { tries++; const x = rand(TRAY.x + w, TRAY.x + TRAY.w - w); const y = rand(TRAY.y + h, TRAY.y + TRAY.h - h); if (out.every((o) => Math.hypot(o.x - x, o.y - y) > w * 1.7)) out.push({ x, y }); } return out; };
    const setBeads = () => {
      const pos = spread(22, 13, 13);
      items = pos.map((p, i) => ({ ...p, iron: i < 10, kind: 'bead', color: PLASTIC[i % PLASTIC.length], st: 'tray' }));
    };
    const setCans = () => {
      const pos = spread(6, 34, 38);
      items = pos.map((p, i) => ({ ...p, iron: i % 2 === 0, kind: 'can', st: 'tray' }));
    };
    setBeads();
    const tip = () => ({ x: mx, y: my + 44 });
    const drawMagnet = () => {
      ctx.save(); ctx.translate(mx, my);
      ctx.lineCap = 'butt'; ctx.lineWidth = 22;
      ctx.strokeStyle = '#e0452b'; ctx.beginPath(); ctx.moveTo(-22, 40); ctx.lineTo(-22, 0); ctx.arc(0, 0, 22, Math.PI, Math.PI * 1.5); ctx.stroke();
      ctx.strokeStyle = '#2f80ed'; ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI * 1.5, 0); ctx.lineTo(22, 40); ctx.stroke();
      ctx.fillStyle = '#c9d1d6'; ctx.fillRect(-33, 34, 22, 12); ctx.fillRect(11, 34, 22, 12);
      ctx.fillStyle = '#fff'; ctx.font = `900 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('N', -22, 22); ctx.fillText('S', 22, 22);
      ctx.restore();
    };
    const drawItem = (it) => {
      if (it.kind === 'bead') {
        const g = ctx.createRadialGradient(it.x - 4, it.y - 4, 2, it.x, it.y, 12);
        if (it.iron) { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#6d7880'); } else { g.addColorStop(0, '#ffffff'); g.addColorStop(1, it.color); }
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(it.x, it.y, 12, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = it.iron ? '#8a959c' : '#cfe3f0'; ctx.strokeStyle = it.iron ? '#5c666c' : '#8fb3c9'; ctx.lineWidth = 3;
        rrect(ctx, it.x - 26, it.y - 34, 52, 68, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(it.x - 26, it.y - 30, 52, 6);
        label(ctx, it.iron ? '철' : '알루미늄', it.x, it.y + 6, it.iron ? '#2b3236' : '#2d5d7b', it.iron ? 17 : 12);
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      table(ctx);
      ctx.fillStyle = '#f3ece2'; ctx.strokeStyle = '#c8b79e'; ctx.lineWidth = 4; rrect(ctx, TRAY.x, TRAY.y, TRAY.w, TRAY.h, 18); ctx.fill(); ctx.stroke();
      label(ctx, phase === 'beads' ? '섞인 구슬' : '섞인 캔', TRAY.x + TRAY.w / 2, TRAY.y - 16, '#7a6a5a', 16);
      ctx.fillStyle = '#eaf6f4'; ctx.strokeStyle = '#0f8f84'; ctx.setLineDash([10, 8]); rrect(ctx, BOX.x, BOX.y, BOX.w, BOX.h, 16); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      label(ctx, phase === 'beads' ? '철 구슬 통' : '철 캔 통', BOX.x + BOX.w / 2, BOX.y - 16, '#0a6a62', 17);
      items.filter((it) => it.st !== 'stuck').forEach(drawItem);
      drawMagnet();
      items.filter((it) => it.st === 'stuck').forEach(drawItem);
      if (!drag && !finished && !items.some((it) => it.st === 'stuck')) label(ctx, '👆 자석을 잡고 끌어요', HOME.x, HOME.y - 52, '#0f8f84', 15);
    };
    const tick = () => {
      if (!api.alive()) return;
      const t = tip();
      for (const it of items) {
        if (it.st === 'stuck') { it.x += (t.x + it.ox - it.x) * 0.5; it.y += (t.y + it.oy - it.y) * 0.5; }
        else if (it.st === 'fall') { it.vy += 0.8; it.y += it.vy; if (it.y >= it.ty) { it.y = it.ty; it.st = 'box'; } }
      }
      if (drag) {
        const R = phase === 'beads' ? 46 : 64;
        let n = items.filter((it) => it.st === 'stuck').length;
        for (const it of items) {
          if (it.st !== 'tray' || !it.iron) continue;
          if (Math.hypot(it.x - t.x, it.y - t.y) < R) {
            it.st = 'stuck';
            if (it.kind === 'bead') { it.ox = ((n % 4) - 1.5) * 20; it.oy = 10 + Math.floor(n / 4) * 18; } else { it.ox = (n % 3 - 1) * 56; it.oy = 36; }
            n++;
            if (!told) { told = true; api.say(L.lines.stuck); }
          }
        }
      }
      draw();
      requestAnimationFrame(tick);
    };
    const drop = () => {
      const t = tip();
      const stuck = items.filter((it) => it.st === 'stuck');
      if (!stuck.length) return;
      if (t.x > BOX.x - 20 && t.x < BOX.x + BOX.w + 20 && t.y < BOX.y + BOX.h) {
        const inBox = items.filter((it) => it.st === 'box' || it.st === 'fall').length;
        stuck.forEach((it, k) => {
          it.st = 'fall'; it.vy = 0;
          const n = inBox + k;
          if (it.kind === 'bead') { it.x = BOX.x + 30 + (n % 6) * 28; it.ty = BOX.y + BOX.h - 18 - Math.floor(n / 6) * 24; } else { it.x = BOX.x + 40 + (n % 3) * 60; it.ty = BOX.y + BOX.h - 40; }
        });
        setTimeout(check, 500);
      }
    };
    const check = () => {
      if (!api.alive()) return;
      const left = items.some((it) => it.iron && it.st === 'tray');
      const held = items.some((it) => it.st === 'stuck');
      if (left || held) { if (left && !held) api.say(L.lines.more); return; }
      if (phase === 'beads') {
        phase = 'beadsDone'; api.say(L.lines.beads);
        setTimeout(() => { if (!api.alive()) return; api.say(L.lines.cansGo); api.btn('♻️ 캔 나누기', () => { api.clearBtns(); setCans(); mx = HOME.x; my = HOME.y; phase = 'cans'; told = false; api.say(L.lines.cans); }); }, 2400);
      } else if (phase === 'cans' && !finished) { finished = true; api.say(L.lines.cansDone); api.done(); }
    };
    draggable(c, {
      start: (ev) => {
        if (phase === 'beadsDone' || finished) return false;
        const p = local(ev);
        if (Math.hypot(p.x - mx, p.y - (my + 15)) > 60) return false;
        drag = true; c.style.cursor = 'grabbing'; c.ox = p.x - mx; c.oy = p.y - my; return true;
      },
      move: (ev) => { if (!drag) return; const p = local(ev); mx = clamp(p.x - c.ox, 30, W - 30); my = clamp(p.y - c.oy, 20, H - 90); },
      end: () => { drag = false; c.style.cursor = 'grab'; drop(); },
    });
    c.style.cursor = 'grab';
    api.side.innerHTML = `<div class="card"><b>🧲 자석에 붙을까?</b><div class="grain"><i class="bead iron"></i>철 구슬</div><div class="grain"><i class="bead plastic"></i>플라스틱 구슬</div>
      <p class="tip">자석을 잡고 구슬 위로 가져갔다가, 초록 통 위에서 놓아요.</p></div>`;
    api.say(L.lines.start);
    requestAnimationFrame(tick);
  };

  // =================================================================== 녹이기 → 거르기 → 증발시키기 (소금과 모래)
  kits.filterEvap = (L, api) => {
    const NS = 'http://www.w3.org/2000/svg';
    const sand = Array.from({ length: 26 }, (_, i) => `<circle cx="${78 + (i % 13) * 8 + rand(-2, 2)}" cy="${366 - Math.floor(i / 13) * 7 + rand(-2, 2)}" r="4" fill="#c49a5a"/>`).join('');
    const salt = Array.from({ length: 14 }, (_, i) => `<rect x="${80 + i * 7 + rand(-2, 2)}" y="${350 + rand(-3, 3)}" width="5" height="5" fill="#fff" stroke="#b8c2c8" stroke-width="1" transform="rotate(${rand(0, 45)} ${82 + i * 7} 352)"/>`).join('');
    const crystals = Array.from({ length: 14 }, (_, i) => `<rect x="${596 + (i % 7) * 10 + rand(-2, 2)}" y="${(i < 7 ? 234 : 226) + rand(-2, 2)}" width="8" height="8" fill="#fff" stroke="#7d8b92" stroke-width="1.5" transform="rotate(${rand(0, 40)} ${600 + (i % 7) * 10} 230)"/>`).join('');
    api.bench.innerHTML = `<svg class="cv" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <rect x="0" y="400" width="${W}" height="40" fill="#e9dcc7"/>
      <g id="fe-a">
        <rect x="60" y="230" width="140" height="150" rx="10" fill="#eef8ff" stroke="#7aa9c9" stroke-width="4"/>
        <rect id="fe-wa" x="64" y="376" width="132" height="0" rx="4" fill="#bfe3f8"/>
        <g id="fe-sand">${sand}</g><g id="fe-salt">${salt}</g>
        <line id="fe-rod" x1="130" y1="200" x2="130" y2="360" stroke="#9ccfe0" stroke-width="7" stroke-linecap="round" opacity="0"/>
      </g>
      <text x="130" y="425" text-anchor="middle" class="svl">소금 + 모래</text>
      <rect x="452" y="60" width="10" height="340" fill="#9aa"/><rect x="250" y="392" width="260" height="10" rx="5" fill="#9aa"/>
      <rect x="330" y="150" width="130" height="8" fill="#9aa"/>
      <path d="M270 150 L390 150 L342 222 L342 262 L318 262 L318 222 Z" fill="#f4fbff" stroke="#7aa9c9" stroke-width="4"/>
      <path id="fe-paper" d="M284 156 L376 156 L332 214 L328 214 Z" fill="#fff" stroke="#c9c9c9" stroke-width="2" opacity="0"/>
      <g id="fe-sandp" opacity="0">${Array.from({ length: 14 }, (_, i) => `<circle cx="${306 + (i % 7) * 7}" cy="${196 + Math.floor(i / 7) * 6}" r="3.5" fill="#c49a5a"/>`).join('')}</g>
      <line id="fe-drip" x1="330" y1="262" x2="330" y2="380" stroke="#9fd3f2" stroke-width="5" stroke-dasharray="8 7" opacity="0"/>
      <line id="fe-pour" x1="200" y1="240" x2="300" y2="170" stroke="#9ccfe0" stroke-width="6" stroke-linecap="round" opacity="0"/>
      <rect x="275" y="300" width="110" height="92" rx="8" fill="#eef8ff" stroke="#7aa9c9" stroke-width="4"/>
      <rect id="fe-wb" x="279" y="388" width="102" height="0" rx="4" fill="#cdeafb"/>
      <text x="330" y="425" text-anchor="middle" class="svl">거름 장치</text>
      <path d="M570 260 L560 340 M690 260 L700 340 M630 260 L630 340" stroke="#555" stroke-width="5"/>
      <rect x="555" y="252" width="150" height="8" rx="4" fill="#666"/>
      <path d="M580 236 Q630 268 680 236 Z" fill="#fff" stroke="#999" stroke-width="3"/>
      <ellipse id="fe-wd" cx="630" cy="240" rx="0" ry="6" fill="#bfe3f8"/>
      <g id="fe-cry" opacity="0">${crystals}</g>
      <g id="fe-steam" opacity="0"><path d="M610 225 q-8 -15 0 -30 q8 -15 0 -30" stroke="#b9cbd4" stroke-width="4" fill="none"/><path d="M650 225 q-8 -15 0 -30 q8 -15 0 -30" stroke="#b9cbd4" stroke-width="4" fill="none"/></g>
      <path d="M605 400 L655 400 L645 352 L615 352 Z" fill="#f1f6fa" stroke="#999" stroke-width="3"/>
      <rect x="626" y="338" width="8" height="16" fill="#777"/>
      <path id="fe-flame" d="M630 336 C 618 318 626 300 630 290 C 636 302 644 318 630 336 Z" fill="#ff9f1a" opacity="0"/>
      <text x="630" y="425" text-anchor="middle" class="svl">증발 접시 + 알코올램프</text>
    </svg>`;
    const $ = (id) => api.bench.querySelector(`#${id}`);
    const setH = (id, bottom, h) => { const el = $(id); el.setAttribute('y', bottom - h); el.setAttribute('height', h); };
    let cur = 0; let busy = false;
    const side = api.side;
    const renderSide = () => {
      side.innerHTML = `<div class="card"><b>🧰 실험 도구</b>${L.steps.map((s, i) => `<button type="button" class="tool${i < cur ? ' done' : i === cur ? ' cur' : ''}" data-i="${i}"><span class="em">${s.em}</span>${esc(s.name)}${i < cur ? ' ✓' : ''}</button>`).join('')}</div>
        <div class="card"><b>📋 실험 순서</b><div class="order">${['① 녹이기', '② 거르기', '③ 증발시키기'].map((t, k) => { const at = cur <= 1 ? 0 : cur <= 3 ? 1 : 2; const fin = cur >= L.steps.length; return `<span class="${fin || k < at ? 'ok' : k === at ? 'now' : ''}">${t}</span>`; }).join('')}</div></div>`;
    };
    const acts = [
      () => tween(1200, (t) => setH('fe-wa', 376, 120 * t)),
      async () => {
        $('fe-rod').setAttribute('opacity', 1);
        await tween(1800, (t) => { $('fe-rod').setAttribute('transform', `rotate(${Math.sin(t * Math.PI * 8) * 14} 130 200)`); $('fe-salt').setAttribute('opacity', 1 - t); });
        $('fe-rod').setAttribute('opacity', 0);
      },
      () => tween(700, (t) => { $('fe-paper').setAttribute('opacity', t); $('fe-paper').setAttribute('transform', `translate(0 ${(1 - t) * -30})`); }),
      async () => {
        $('fe-pour').setAttribute('opacity', 1); $('fe-drip').setAttribute('opacity', 1);
        await tween(2400, (t) => { setH('fe-wa', 376, 120 * (1 - t) + 6 * t); $('fe-sand').setAttribute('opacity', 1 - t); $('fe-sandp').setAttribute('opacity', t); setH('fe-wb', 388, 70 * t); $('fe-drip').setAttribute('stroke-dashoffset', -t * 200); });
        $('fe-pour').setAttribute('opacity', 0); $('fe-drip').setAttribute('opacity', 0); setH('fe-wa', 376, 0);
      },
      async () => {
        await tween(800, (t) => { setH('fe-wb', 388, 70 * (1 - t)); $('fe-wd').setAttribute('rx', 46 * t); });
        $('fe-flame').setAttribute('opacity', 1); $('fe-steam').setAttribute('opacity', 1);
        await tween(2800, (t) => { $('fe-wd').setAttribute('rx', 46 * (1 - t)); $('fe-steam').setAttribute('transform', `translate(0 ${-((t * 60) % 20)})`); $('fe-cry').setAttribute('opacity', t > 0.5 ? (t - 0.5) * 2 : 0); $('fe-flame').setAttribute('transform', `scale(1 ${1 + Math.sin(t * 40) * 0.08})`); $('fe-flame').setAttribute('transform-origin', '630 336'); });
        $('fe-flame').setAttribute('opacity', 0); $('fe-steam').setAttribute('opacity', 0);
      },
    ];
    side.addEventListener('click', async (ev) => {
      const b = ev.target.closest('.tool');
      if (!b || busy) return;
      const i = +b.dataset.i;
      if (i < cur) return;
      if (i > cur) { api.say(L.lines.wrongTool); return; }
      busy = true;
      b.classList.add('busy');
      await acts[i]();
      if (!api.alive()) return;
      cur++; busy = false; renderSide();
      if (cur < L.steps.length) api.say(L.steps[cur].line);
      else { api.say(L.lines.end); api.done(); }
    });
    renderSide();
    api.say(L.steps[0].line);
  };

  // =================================================================== 분류 상자: 카드를 알맞은 상자에 넣기
  kits.sort = (L, api) => {
    api.noSide();
    const b = api.bench;
    b.classList.add('free');
    b.innerHTML = `<div class="st-cards">${L.items.map((it, i) => `<button type="button" class="st-card" data-i="${i}"><span class="em">${it.em}</span>${esc(it.t)}</button>`).join('')}</div>
      <div class="st-bins">${L.bins.map((bn) => `<button type="button" class="st-bin" data-b="${bn[0]}"><b><span class="em">${bn[1]}</span>${esc(bn[2])}</b><div class="st-in"></div></button>`).join('')}</div>`;
    let sel = null; let left = L.items.length;
    b.addEventListener('click', (ev) => {
      const card = ev.target.closest('.st-card');
      if (card) {
        b.querySelectorAll('.st-card').forEach((x) => x.classList.remove('sel'));
        card.classList.add('sel'); sel = +card.dataset.i; api.say(L.lines.pick); return;
      }
      const bin = ev.target.closest('.st-bin');
      if (!bin) return;
      if (sel === null) { api.say(L.lines.start); return; }
      const it = L.items[sel];
      const el = b.querySelector(`.st-card[data-i="${sel}"]`);
      if (it.bin === bin.dataset.b) {
        el.remove();
        bin.querySelector('.st-in').insertAdjacentHTML('beforeend', `<span title="${esc(it.t)}">${it.em}</span>`);
        bin.classList.add('ok'); setTimeout(() => bin.classList.remove('ok'), 500);
        sel = null; left--;
        if (left === 0) { api.say(L.lines.done); api.done(); } else api.say(L.lines.right);
      } else {
        el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');
        api.say(`${L.lines.wrong} ${it.hint}`);
      }
    });
    api.say(L.lines.start);
  };
})();
