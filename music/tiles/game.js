// 반짝 건반: 내려오는 타일을 박자에 맞춰 누르면 그 음이 울리는 리듬 게임.
// 소리는 모두 Web Audio로 기기 안에서 만든다(녹음 파일 없음).
(() => {
  'use strict';

  // ---------- 음 ----------
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = (s) => {
    const m = /^([A-G])([#b]?)(\d)$/.exec(s);
    if (!m) throw new Error('음 이름이 이상해요: ' + s);
    return PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const SOLFA = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];
  // 음악 시간에 쓰는 음 이름 색(도 빨강, 레 주황, 미 노랑, 파 연두, 솔 초록, 라 보라, 시 분홍)
  const PCOLOR = ['#ff6b6b', '#ff6b6b', '#ffa14a', '#ffa14a', '#ffe05a', '#a6e85a', '#a6e85a', '#3fd6b0', '#3fd6b0', '#a596ff', '#a596ff', '#ff86c8'];
  const CHORDS = { C: [0, 4, 7], F: [5, 9, 12], G: [7, 11, 14], Am: [9, 12, 16], Dm: [2, 5, 9], Em: [4, 7, 11] };

  // ---------- 곡 ----------
  // mel: "음:박" (박을 빼면 1박), ch: 반주 화음 "화음:박"
  const SONGS = [
    { id: 'star', title: '작은 별', about: '반짝반짝 작은 별, 아름답게 비치네', bpm: 92, level: 1,
      mel: 'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2',
      ch: 'C:2 C:2 F:2 C:2 F:2 C:2 G:2 C:2 C:2 F:2 C:2 G:2 C:2 F:2 C:2 G:2 C:2 C:2 F:2 C:2 F:2 C:2 G:2 C:2' },
    { id: 'nabi', title: '나비야', about: '나비야 나비야 이리 날아오너라', bpm: 104, level: 1,
      mel: 'G4 E4 E4:2 F4 D4 D4:2 C4 D4 E4 F4 G4 G4 G4:2 G4 E4 E4:2 F4 D4 D4:2 C4 E4 G4 G4 E4 E4 E4:2 D4 D4 D4 D4 D4 E4 F4:2 E4 E4 E4 E4 E4 F4 G4:2 G4 E4 E4:2 F4 D4 D4:2 C4 E4 G4 G4 C4:4',
      ch: 'C:4 G:4 C:4 C:4 C:4 G:4 C:4 C:4 G:4 G:4 C:4 C:4 C:4 G:4 C:4 C:4' },
    { id: 'joy', title: '기쁨의 노래', about: '베토벤 교향곡 9번의 그 멜로디', bpm: 112, level: 2,
      mel: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2 D4 D4 E4 C4 D4 E4:0.5 F4:0.5 E4 C4 D4 E4:0.5 F4:0.5 E4 D4 C4 D4 G3:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2',
      ch: 'C:4 G:4 C:4 G:4 C:4 G:4 C:4 G:2 C:2 G:4 C:4 G:4 C:2 G:2 C:4 G:4 C:4 G:2 C:2' },
    { id: 'bday', title: '생일 축하 노래', about: '세 박자 노래, 친구 생일에 쳐 줘요', bpm: 96, level: 2,
      mel: 'G3:0.5 G3:0.5 A3 G3 C4 B3:2 G3:0.5 G3:0.5 A3 G3 D4 C4:2 G3:0.5 G3:0.5 G4 E4 C4 B3 A3 F4:0.5 F4:0.5 E4 C4 D4 C4:3',
      ch: 'C:1 C:3 G:3 G:3 C:3 C:3 F:3 C:1.5 G:1.5 C:3' },
    { id: 'meteor', title: '별똥별 행진', about: '이 게임을 위해 새로 지은 곡', bpm: 116, level: 3,
      mel: 'C4 E4 G4 E4 A4 G4 E4:2 D4 E4 G4 A4 G4:4 A4 C5 A4 G4 E4 G4 D4:2 C4 D4 E4 G4 D4:4 C4 E4 G4 E4 A4 G4 E4:2 D4 E4 G4 A4 G4:4 A4 C5 A4 G4 E4 G4 D4 E4 G4 A4 G4 E4 C4:4',
      ch: 'C:4 Am:2 C:2 G:4 C:4 F:4 C:2 G:2 C:4 G:4 C:4 Am:2 C:2 G:4 C:4 F:4 C:2 G:2 C:4 C:4' },
  ];

  function parse(song) {
    const read = (str) => str.trim().split(/\s+/).map((tok) => { const [n, d] = tok.split(':'); return [n, d ? parseFloat(d) : 1]; });
    const notes = []; let b = 0;
    for (const [n, d] of read(song.mel)) { if (n !== 'R') notes.push({ m: midi(n), beat: b, dur: d }); b += d; }
    const chords = []; let cb = 0;
    for (const [n, d] of read(song.ch)) { chords.push({ name: n, beat: cb, dur: d }); cb += d; }
    return { notes, chords };
  }

  // ---------- 저장(이 기기 안에만) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('banjjak-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('banjjak-' + k, JSON.stringify(v)); } catch (e) { /* 저장 못 해도 게임은 된다 */ } },
  };
  const opt = Object.assign({ speed: '1', hearts: '3', band: 'on' }, store.get('opt', {}));
  let sel = Math.max(0, Math.min(SONGS.length - 1, store.get('sel', 0) | 0));
  const best = store.get('best', {});

  // ---------- 소리 ----------
  let ac = null, master = null;
  function ensureAudio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      const comp = ac.createDynamicsCompressor();
      master = ac.createGain(); master.gain.value = 0.9;
      master.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
  }
  function newBus() { const b = ac.createGain(); b.connect(master); return b; }

  // 건반 소리: 삼각파에 배음을 조금 섞고, 치자마자 밝았다가 차츰 어두워진다
  function pluck(bus, m, t, vol, len) {
    const f = hz(m);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.22);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(9000, f * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2.2), t + Math.min(len, 1.2));
    for (const [h, type, a] of [[1, 'triangle', 1], [2, 'sine', 0.3], [3, 'sine', 0.1], [4.01, 'sine', 0.05]]) {
      const o = ac.createOscillator(); o.type = type; o.frequency.value = f * h;
      const og = ac.createGain(); og.gain.value = a;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + len + 0.05);
    }
    lp.connect(g); g.connect(bus);
    return g;
  }
  function pad(bus, name, t, dur) {
    const iv = CHORDS[name] || CHORDS.C;
    const root = 36 + (iv[0] % 12); // 낮은 베이스
    const bg = ac.createGain();
    bg.gain.setValueAtTime(0.0001, t); bg.gain.exponentialRampToValueAtTime(0.22, t + 0.02); bg.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.4, dur * 0.95));
    const bo = ac.createOscillator(); bo.type = 'sine'; bo.frequency.value = hz(root);
    bo.connect(bg); bg.connect(bus); bo.start(t); bo.stop(t + dur + 0.05);
    for (const i of iv) {
      const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(48 + i);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.3, dur * 0.9));
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  function tick(bus, t, hi) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = hi ? 1568 : 1046;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.1);
  }
  function thud(bus) {
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const g = ac.createGain(); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.16);
  }

  // ---------- 화면 ----------
  const $ = (s) => document.querySelector(s);
  const cv = $('#board'), cx = cv.getContext('2d');
  let W = 0, H = 0, boardX = 0, boardW = 0, laneW = 0, hitY = 0;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // 보이는 화면 크기. 폰에서 가로가 넓게 잡히는 경우를 막으려고 가장 작은 값을 쓴다
    const de = document.documentElement, vv = window.visualViewport;
    W = Math.round(Math.min(window.innerWidth, de.clientWidth || 1e9, vv ? vv.width * (vv.scale || 1) : 1e9));
    H = Math.round(Math.min(window.innerHeight, de.clientHeight || 1e9, vv ? vv.height * (vv.scale || 1) : 1e9));
    cv.style.width = W + 'px'; cv.style.height = H + 'px'; // 화면에 보이는 크기는 CSS 픽셀로 고정(폰에서 2~3배로 커지지 않게)
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    boardW = Math.min(W, 480); boardX = (W - boardW) / 2; laneW = boardW / 4;
    const sab = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    hitY = H - sab - Math.max(84, Math.min(130, H * 0.15));
  }
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();

  let FAM = getComputedStyle(document.body).fontFamily;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { FAM = getComputedStyle(document.body).fontFamily; });
  const STARS = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.6 }));
  const fineMouse = window.matchMedia && matchMedia('(pointer: fine)').matches;
  let keyboardUsed = fineMouse;

  // ---------- 게임 상태 ----------
  const OK = 0.2, GOOD = 0.13, PERF = 0.07;
  let state = 'menu'; // menu | play | paused | resume | end
  let G = null;
  let perf0 = 0, audio0 = 0, pausedAt = null, resumeT0 = 0;
  const pnow = () => performance.now() / 1000;
  const gnow = () => (pausedAt !== null ? pausedAt : pnow() - perf0);
  const at = (g) => audio0 + g;

  function buildRun(song) {
    const sp = parseFloat(opt.speed) || 1;
    const spb = 60 / (song.bpm * sp);
    const p = parse(song);
    let prevLane = 1, prevM = null;
    const notes = p.notes.map((n) => {
      let lane = 1;
      if (prevM !== null) {
        // 음이 올라가면 오른쪽, 내려가면 왼쪽으로. 같은 음은 두 칸 건너뛴다. 바로 앞 타일과 같은 줄은 피한다.
        const d = n.m - prevM;
        const step = d === 0 ? 2 : Math.sign(d) * (Math.abs(d) >= 5 ? 2 : 1);
        lane = prevLane + step;
        if (lane < 0 || lane > 3) lane = prevLane - step;
        lane = Math.max(0, Math.min(3, lane));
        if (lane === prevLane) lane = (prevLane + 2) % 4;
      }
      prevLane = lane; prevM = n.m;
      return { m: n.m, lane, t: n.beat * spb, d: n.dur * spb, hold: n.dur >= 2, hit: false, miss: false, holding: false, hitAt: 0, endAt: 0, voice: null };
    });
    const last = notes[notes.length - 1];
    return {
      song, sp, spb, notes,
      chords: p.chords.map((c) => ({ name: c.name, t: c.beat * spb, d: c.dur * spb, sched: false })),
      lead: 4 * spb, end: last.t + last.d,
      travel: 2.0 / Math.pow(sp, 0.6),
      score: 0, combo: 0, maxCombo: 0, pts: 0,
      hearts: opt.hearts === '3' ? 3 : Infinity,
      counts: { p: 0, g: 0, o: 0, m: 0 },
      scan: 0, ticks: -4, judge: null, flash: [null, null, null, null], parts: [], over: false,
      bus: newBus(),
    };
  }

  // ---------- 메뉴 ----------
  const songsEl = $('#songs');
  $('#legend').innerHTML = [0, 2, 4, 5, 7, 9, 11].map((pc) => `<i style="--c:${PCOLOR[pc]}">${SOLFA[pc]}</i>`).join('');
  function starText(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
  function renderSongs() {
    songsEl.innerHTML = SONGS.map((s, i) => {
      const b = best[s.id];
      return `<button type="button" class="song${i === sel ? ' on' : ''}" data-i="${i}" aria-pressed="${i === sel}">
        <b>${s.title}</b><span class="lv" aria-label="어려움 ${s.level}">${'●'.repeat(s.level)}${'○'.repeat(3 - s.level)}</span>
        <small>${s.about}</small><span class="best">${b ? starText(b.stars) + ' ' + b.score : ''}</span></button>`;
    }).join('');
  }
  songsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.song'); if (!b) return;
    sel = +b.dataset.i; store.set('sel', sel); renderSongs();
    ensureAudio();
    if (ac) { // 고른 곡의 첫 소절을 살짝 들려준다
      const p = parse(SONGS[sel]); const spb = 60 / SONGS[sel].bpm; const bus = newBus(); const t0 = ac.currentTime + 0.05;
      p.notes.slice(0, 4).forEach((n) => pluck(bus, n.m, t0 + n.beat * spb, 0.3, 0.7));
      setTimeout(() => bus.disconnect(), 4000);
    }
  });
  function renderOpts() {
    document.querySelectorAll('.seg').forEach((seg) => {
      const k = seg.dataset.opt;
      seg.querySelectorAll('button').forEach((b) => { const on = b.dataset.val === opt[k]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    });
  }
  document.querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    opt[seg.dataset.opt] = b.dataset.val; store.set('opt', opt); renderOpts();
  }));
  renderSongs(); renderOpts();
  const ver = document.getElementById('ver');
  const showVer = () => { if (ver) ver.textContent = `버전 3 · 화면 ${W}×${H}`; };
  showVer(); window.addEventListener('resize', showVer);

  // ---------- 화면 전환 ----------
  const show = (id, on) => { $(id).hidden = !on; };
  let wakeLock = null;
  async function lockScreen() { try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { wakeLock = null; } }
  function unlockScreen() { try { if (wakeLock) wakeLock.release(); } catch (e) { /* 무시 */ } wakeLock = null; }

  function stopRun() {
    if (G) { try { G.bus.disconnect(); } catch (e) { /* 이미 끊김 */ } }
    G = null; pausedAt = null;
    activeLanes.clear();
  }
  function startSong() {
    ensureAudio();
    if (!ac) { alertNoAudio(); return; }
    stopRun();
    G = buildRun(SONGS[sel]);
    if (ac.state === 'suspended') ac.resume();
    perf0 = pnow() + G.lead + 0.15; audio0 = ac.currentTime + G.lead + 0.15;
    state = 'play';
    show('#menu', false); show('#pause', false); show('#result', false); show('#hud', true);
    $('#hudTitle').textContent = G.song.title + ' · ' + ({ '0.8': '느리게', '1': '보통', '1.25': '빠르게' }[opt.speed] || '');
    updateHud();
    lockScreen();
  }
  function alertNoAudio() { $('.tip').textContent = '이 브라우저는 소리를 낼 수 없어서 게임을 시작할 수 없어요. 다른 브라우저로 열어 주세요.'; }
  function toMenu() {
    stopRun(); state = 'menu';
    if (ac && ac.state === 'suspended') ac.resume();
    show('#hud', false); show('#pause', false); show('#result', false); show('#menu', true);
    renderSongs(); unlockScreen();
  }
  function pauseGame() {
    if (state !== 'play' || !G) return;
    pausedAt = gnow();
    for (const n of G.notes) if (n.holding) finishHold(n, pausedAt);
    activeLanes.clear();
    if (ac) ac.suspend();
    state = 'paused'; show('#pause', true);
  }
  function resumeGame() {
    if (state !== 'paused') return;
    show('#pause', false); state = 'resume'; resumeT0 = pnow();
  }
  $('#startBtn').addEventListener('click', startSong);
  $('#againBtn').addEventListener('click', startSong);
  $('#restartBtn2').addEventListener('click', startSong);
  $('#menuBtn').addEventListener('click', toMenu);
  $('#menuBtn2').addEventListener('click', toMenu);
  $('#pauseBtn').addEventListener('click', pauseGame);
  $('#resumeBtn').addEventListener('click', () => { ensureAudio(); resumeGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

  // ---------- 판정 ----------
  const JUDGE = {
    p: { text: '최고!', color: '#ffe27a', pts: 3 },
    g: { text: '좋아요!', color: '#8fe3ff', pts: 2 },
    o: { text: '괜찮아요', color: '#c9b8ff', pts: 1 },
    m: { text: '놓쳤어요', color: '#ff7a8a', pts: 0 },
  };
  function setJudge(text, color) { G.judge = { text, color, t: pnow() }; }
  function laneCenter(l) { return boardX + laneW * l + laneW / 2; }

  function press(lane, y) {
    if (state !== 'play' || !G || G.over) return;
    const g = gnow();
    let pick = null, bd = 1e9;
    for (let i = G.scan; i < G.notes.length; i++) {
      const n = G.notes[i];
      if (n.t - g > OK) break;
      if (n.hit || n.miss || n.lane !== lane) continue;
      const d = Math.abs(n.t - g);
      if (d <= OK && d < bd) { bd = d; pick = n; }
    }
    if (!pick && y != null && g >= 0) {
      // 선에 닿기 전이라도 그 줄의 다음 타일 자체를 손가락으로 누르면 인정한다(점수는 '괜찮아요')
      const pps = (hitY + 30) / G.travel;
      for (let i = G.scan; i < G.notes.length; i++) {
        const n = G.notes[i];
        if (n.hit || n.miss || n.lane !== lane) continue;
        const bottom = hitY - (n.t - g) * pps, top = bottom - Math.max(46, n.d * pps - 6);
        if (y >= top - 24 && y <= bottom + 24 && n.t - g < 1.2) { pick = n; bd = OK; }
        break; // 그 줄에서 가장 먼저 올 타일만 본다
      }
    }
    if (!pick) {
      G.flash[lane] = { t: pnow(), bad: g >= 0 };
      if (g >= 0) { thud(G.bus); G.combo = 0; }
      return;
    }
    const kind = bd <= PERF ? 'p' : bd <= GOOD ? 'g' : 'o';
    const J = JUDGE[kind];
    G.counts[kind]++; G.pts += J.pts; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.score += J.pts * 100 + Math.min(G.combo, 30) * 5;
    pick.hit = true; pick.hitAt = g;
    pick.voice = pluck(G.bus, pick.m, ac.currentTime, 0.5, pick.hold ? pick.d + 0.35 : 1.1);
    if (pick.hold) pick.holding = true; else pick.endAt = g;
    G.flash[lane] = { t: pnow(), bad: false };
    burst(laneCenter(lane), hitY, PCOLOR[pick.m % 12], 14);
    setJudge(J.text, J.color);
    updateHud();
  }
  function release(lane) {
    if (!G) return;
    const g = gnow();
    for (const n of G.notes) if (n.holding && n.lane === lane) finishHold(n, g);
  }
  function finishHold(n, g) {
    const frac = Math.max(0, Math.min(1, (g - n.t) / n.d));
    n.holding = false; n.endAt = g;
    G.score += Math.round(frac * 200);
    if (frac < 0.97 && n.voice && ac) {
      const t = ac.currentTime;
      try { n.voice.gain.cancelScheduledValues(t); n.voice.gain.setTargetAtTime(0.0001, t, 0.05); } catch (e) { /* 무시 */ }
    }
    if (frac >= 0.85) { setJudge('쭉~ 최고!', '#ffe27a'); burst(laneCenter(n.lane), hitY, '#ffe27a', 18); }
    updateHud();
  }
  function doMiss(n) {
    n.miss = true; G.counts.m++; G.combo = 0;
    setJudge(JUDGE.m.text, JUDGE.m.color);
    if (G.hearts !== Infinity) {
      G.hearts--;
      const hud = $('#hud'); hud.classList.remove('shake'); void hud.offsetWidth; hud.classList.add('shake');
      if (G.hearts <= 0) { updateHud(); finish(false); return; }
    }
    updateHud();
  }
  function finish(clear) {
    if (G.over) return;
    G.over = true; state = 'end';
    for (const n of G.notes) if (n.holding) finishHold(n, gnow());
    const N = G.notes.length, acc = G.pts / (3 * N);
    const stars = !clear ? 0 : acc >= 0.9 ? 3 : acc >= 0.72 ? 2 : 1;
    const id = G.song.id, prev = best[id];
    const isNew = clear && (!prev || G.score > prev.score);
    if (clear) {
      best[id] = { stars: Math.max(stars, prev ? prev.stars : 0), score: Math.max(G.score, prev ? prev.score : 0) };
      store.set('best', best);
    }
    const done = G.notes.filter((n) => n.hit || n.miss).length;
    $('#resTitle').textContent = clear ? (stars === 3 ? '완벽해요!' : '끝까지 쳤어요!') : '아쉬워요!';
    $('#resStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
    $('#resScore').innerHTML = `${G.score}${isNew ? '<small>새 최고 점수!</small>' : ''}`;
    $('#resCounts').innerHTML = [['p', '최고'], ['g', '좋아요'], ['o', '괜찮아요'], ['m', '놓침']]
      .map(([k, l]) => `<div><b>${G.counts[k]}</b><span>${l}</span></div>`).join('');
    $('#resNote').textContent = clear
      ? `가장 긴 콤보 ${G.maxCombo} · 정확도 ${Math.round(acc * 100)}%`
      : `${Math.round((done / N) * 100)}%까지 쳤어요. '끝까지 연습'을 켜면 하트 없이 칠 수 있어요.`;
    setTimeout(() => { if (state === 'end') { show('#hud', false); show('#result', true); unlockScreen(); } }, clear ? 900 : 700);
  }
  function updateHud() {
    if (!G) return;
    $('#hudScore').textContent = G.score;
    $('#hudHearts').textContent = G.hearts === Infinity ? '연습' : '♥'.repeat(Math.max(0, G.hearts)) + '♡'.repeat(3 - Math.max(0, G.hearts));
  }

  // ---------- 입력 ----------
  const activeLanes = new Map(); // 손가락/키 → 줄
  const laneAt = (x) => Math.max(0, Math.min(3, Math.floor((x - boardX) / laneW)));
  function down(id, x, y) {
    if (state !== 'play') return;
    if (ac && ac.state === 'suspended') ac.resume(); // 아이폰은 소리가 잠들어 있을 수 있다
    const lane = laneAt(x);
    activeLanes.set(id, lane);
    press(lane, y);
  }
  const lift = (id) => {
    if (!activeLanes.has(id)) return;
    const lane = activeLanes.get(id); activeLanes.delete(id);
    for (const l of activeLanes.values()) if (l === lane) return; // 같은 줄을 다른 손가락이 아직 누르고 있다
    release(lane);
  };
  // 손가락은 터치 이벤트로 받는다(폰에서 가장 확실하다). 마우스·펜은 포인터 이벤트로.
  cv.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) down('t' + t.identifier, t.clientX, t.clientY);
  }, { passive: false });
  ['touchend', 'touchcancel'].forEach((ev) => cv.addEventListener(ev, (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) lift('t' + t.identifier);
  }, { passive: false }));
  cv.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  cv.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    down('p' + e.pointerId, e.clientX, e.clientY);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => cv.addEventListener(ev, (e) => { if (e.pointerType !== 'touch') lift('p' + e.pointerId); }));
  const KEYS = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pauseGame(); else if (state === 'paused') resumeGame(); return; }
    if (!(e.code in KEYS) || e.repeat) return;
    keyboardUsed = true;
    activeLanes.set('k' + e.code, KEYS[e.code]);
    press(KEYS[e.code]);
  });
  window.addEventListener('keyup', (e) => { if (e.code in KEYS) lift('k' + e.code); });
  window.addEventListener('blur', () => { for (const id of [...activeLanes.keys()]) lift(id); });

  // ---------- 진행 ----------
  function update(g) {
    // 시작 전 네 번 똑딱
    while (G.ticks < 0 && G.ticks * G.spb <= g + 0.15) {
      tick(G.bus, Math.max(ac.currentTime, at(G.ticks * G.spb)), G.ticks === -4);
      G.ticks++;
    }
    if (opt.band === 'on') {
      for (const c of G.chords) {
        if (c.sched) continue;
        if (c.t > g + 0.25) break;
        c.sched = true;
        if (c.t + c.d > g) pad(G.bus, c.name, Math.max(ac.currentTime, at(c.t)), c.d);
      }
    }
    for (const n of G.notes) if (n.holding && g >= n.t + n.d) finishHold(n, n.t + n.d);
    for (let i = G.scan; i < G.notes.length; i++) {
      const n = G.notes[i];
      if (n.t + OK >= g) break;
      if (!n.hit && !n.miss) { doMiss(n); if (G.over) return; }
    }
    while (G.scan < G.notes.length && (G.notes[G.scan].hit || G.notes[G.scan].miss)) G.scan++;
    if (g > G.end + 0.6 && !G.notes.some((n) => n.holding)) finish(true);
  }

  // ---------- 그리기 ----------
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    cx.beginPath();
    cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r);
    cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath();
  }
  function burst(x, y, color, n) {
    if (!G) return;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 160 + Math.random() * 320;
      G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.55 + Math.random() * 0.3, age: 0, r: 2 + Math.random() * 3, color });
    }
  }

  function drawSky(rt) {
    const bg = cx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d0a22'); bg.addColorStop(0.65, '#1a1545'); bg.addColorStop(1, '#2b1f55');
    cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
    for (const s of STARS) {
      cx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(rt * s.s + s.p));
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(s.x * W, s.y * H, s.r, 0, 6.283); cx.fill();
    }
    cx.globalAlpha = 1;
  }
  function drawBoard(rt) {
    cx.fillStyle = 'rgba(255,255,255,0.035)'; cx.fillRect(boardX, 0, boardW, H);
    cx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i <= 4; i++) cx.fillRect(Math.round(boardX + laneW * i) - 0.5, 0, 1, H);
    // 누른 줄 빛
    if (G) for (let l = 0; l < 4; l++) {
      const f = G.flash[l]; if (!f) continue;
      const a = 1 - (rt - f.t) / 0.18; if (a <= 0) continue;
      const gr = cx.createLinearGradient(0, hitY - 220, 0, hitY);
      const c = f.bad ? '255,122,138' : '255,255,255';
      gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(1, `rgba(${c},${0.28 * a})`);
      cx.fillStyle = gr; cx.fillRect(boardX + laneW * l, hitY - 220, laneW, 220);
    }
    // 치는 선
    const lg = cx.createLinearGradient(boardX, 0, boardX + boardW, 0);
    lg.addColorStop(0, '#ff86c8'); lg.addColorStop(0.5, '#ffd75e'); lg.addColorStop(1, '#3fd6b0');
    cx.shadowColor = 'rgba(255,215,94,0.8)'; cx.shadowBlur = 14;
    cx.fillStyle = lg; cx.fillRect(boardX, hitY - 2, boardW, 4);
    cx.shadowBlur = 0;
    // 선 아래: 키 표시
    cx.fillStyle = 'rgba(10,8,28,0.45)'; cx.fillRect(boardX, hitY + 2, boardW, H - hitY);
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.font = '15px ' + FAM;
    for (let l = 0; l < 4; l++) {
      const x = laneCenter(l), y = hitY + Math.min(40, (H - hitY) / 2);
      cx.strokeStyle = 'rgba(255,255,255,0.18)'; cx.lineWidth = 2;
      cx.beginPath(); cx.arc(x, y, 17, 0, 6.283); cx.stroke();
      if (keyboardUsed) { cx.fillStyle = 'rgba(255,255,255,0.5)'; cx.fillText('DFJK'[l], x, y + 1); }
    }
  }
  function drawTiles(g) {
    const pps = (hitY + 30) / G.travel;
    const font = 'bold 19px ' + FAM;
    cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
    for (let i = Math.max(0, G.scan - 12); i < G.notes.length; i++) {
      const n = G.notes[i];
      const bottom = hitY - (n.t - g) * pps;
      if (bottom < -20) break; // 아직 화면 위
      const h = Math.max(46, n.d * pps - 6);
      let top = bottom - h;
      if (top > H) continue;
      const x = boardX + laneW * n.lane + 5, w = laneW - 10;
      const col = PCOLOR[n.m % 12];
      if (n.hit && !n.holding) {
        const a = 1 - (g - n.endAt) / 0.28; if (a <= 0) continue;
        cx.globalAlpha = a * 0.7; cx.fillStyle = '#ffffff';
        if (n.hold) { const b = Math.min(bottom, hitY); top = Math.min(top, b - 4); rr(x, top - (1 - a) * 20, w, b - top, 12); }
        else rr(x - (1 - a) * 6, top - (1 - a) * 24, w + (1 - a) * 12, h, 12);
        cx.fill(); cx.globalAlpha = 1; continue;
      }
      let drawBottom = bottom;
      if (n.holding) drawBottom = Math.min(bottom, hitY);
      if (drawBottom - top < 2) continue;
      cx.globalAlpha = n.miss ? 0.28 : 1;
      // 몸통
      cx.shadowColor = col; cx.shadowBlur = n.holding ? 26 : 10;
      cx.fillStyle = col; rr(x, top, w, drawBottom - top, 12); cx.fill();
      cx.shadowBlur = 0;
      const shine = cx.createLinearGradient(0, top, 0, top + Math.min(40, drawBottom - top));
      shine.addColorStop(0, 'rgba(255,255,255,0.45)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      cx.fillStyle = shine; rr(x, top, w, drawBottom - top, 12); cx.fill();
      if (n.hold) {
        // 긴 타일: 가운데 줄로 "꾹 누르기" 표시
        cx.fillStyle = 'rgba(27,21,48,0.28)';
        rr(x + w / 2 - 4, top + 12, 8, Math.max(0, drawBottom - top - 46), 4); cx.fill();
      }
      if (n.miss) { cx.strokeStyle = '#ff7a8a'; cx.lineWidth = 2; rr(x, top, w, drawBottom - top, 12); cx.stroke(); }
      if (!n.holding) { cx.fillStyle = 'rgba(27,21,48,0.85)'; cx.font = font; cx.fillText(SOLFA[n.m % 12], x + w / 2, bottom - 14); }
      cx.globalAlpha = 1;
      if (n.holding) { // 누르는 곳에 반짝이
        cx.fillStyle = 'rgba(255,255,255,0.85)'; cx.beginPath(); cx.arc(x + w / 2, hitY, 10 + 3 * Math.sin(g * 30), 0, 6.283); cx.fill();
      }
    }
  }
  function drawParts(dt) {
    const ps = G.parts;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.age += dt;
      if (p.age >= p.life) { ps.splice(i, 1); continue; }
      p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      cx.globalAlpha = 1 - p.age / p.life; cx.fillStyle = p.color;
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
    }
    cx.globalAlpha = 1;
  }
  function drawText(rt, g) {
    const fam = FAM;
    const cxm = boardX + boardW / 2;
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    if (G.judge) {
      const age = rt - G.judge.t;
      if (age < 0.7) {
        const sc = age < 0.08 ? 0.7 + age / 0.08 * 0.45 : 1.15 - Math.min(0.15, (age - 0.08) * 1.2);
        cx.save(); cx.globalAlpha = age < 0.5 ? 1 : 1 - (age - 0.5) / 0.2;
        cx.translate(cxm, hitY * 0.55); cx.scale(sc, sc);
        cx.font = '34px ' + fam; cx.lineWidth = 6; cx.strokeStyle = 'rgba(13,10,34,0.8)';
        cx.strokeText(G.judge.text, 0, 0); cx.fillStyle = G.judge.color; cx.fillText(G.judge.text, 0, 0);
        cx.restore();
      }
    }
    if (G.combo >= 3) {
      cx.font = '20px ' + fam; cx.fillStyle = 'rgba(255,255,255,0.85)';
      cx.fillText(G.combo + ' 콤보', cxm, hitY * 0.55 + 36);
    }
    let big = null;
    if (state === 'play' && g < 0) {
      const b = Math.floor(g / G.spb); // -5..-1
      big = b <= -4 ? '준비' : String(-b);
    } else if (state === 'resume') {
      const left = 1.5 - (rt - resumeT0);
      big = String(Math.max(1, Math.ceil(left / 0.5)));
    }
    if (big) {
      cx.font = '64px ' + fam; cx.lineWidth = 8; cx.strokeStyle = 'rgba(13,10,34,0.8)';
      cx.strokeText(big, cxm, H * 0.4); cx.fillStyle = '#ffd75e'; cx.fillText(big, cxm, H * 0.4);
    }
  }

  let lastRt = pnow();
  function frame() {
    const rt = pnow(); const dt = Math.min(0.05, rt - lastRt); lastRt = rt;
    if (state === 'resume' && rt - resumeT0 >= 1.5 && G) {
      state = 'resuming';
      const go = () => { perf0 = pnow() - pausedAt; audio0 = ac.currentTime - pausedAt; pausedAt = null; if (state === 'resuming') state = 'play'; };
      ac.resume().then(go, go);
    }
    const g = G ? gnow() : 0;
    if (state === 'play' && G && !G.over) update(g);
    drawSky(rt);
    drawBoard(rt);
    if (G) {
      drawTiles(g);
      drawParts(dt);
      drawText(rt, g);
      if (state === 'play' || state === 'end') $('#hudBar').style.width = Math.max(0, Math.min(100, (g / G.end) * 100)) + '%';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
