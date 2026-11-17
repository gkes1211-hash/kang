// 체력왕 운동 카운터: 카메라가 스쿼트·팔 벌려 뛰기·제자리 무릎 들기 횟수를 세어 준다.
// 제대로 한 것만 센다: 충분히 앉았는지, 팔이 머리 위까지 갔는지, 무릎이 높이 올라왔는지 본다.
import {
  startCamera, stopCamera, getSensor, fitCanvas, videoRect, drawMirrored, toPixels, holdScreenOn,
  drawSkeleton, torso, vis, mid,
} from '../common/camera.js';
import { unlockAudio, sfx, speak, hush, Music, makeStore } from '../common/sound.js';

const $ = (id) => document.getElementById(id);
const DEMO = new URLSearchParams(location.search).has('demo'); // 카메라 없이 가짜 몸으로 돌려 보기
const store = makeStore('fitness');

// ---------- 운동 ----------
// goal: 30초·60초에 이만큼 하면 "목표 달성" 도장
const EX = {
  squat: {
    name: '스쿼트', emoji: '🏋️', unit: '개', goal: { 30: 12, 60: 25 },
    howto: '발을 어깨너비로 벌리고, 엉덩이를 뒤로 빼며 허벅지가 바닥과 나란할 때까지 앉았다 일어나요. 무릎이 보이게 서요.',
  },
  jack: {
    name: '팔 벌려 뛰기', emoji: '🙆', unit: '개', goal: { 30: 20, 60: 40 },
    howto: '뛰면서 팔은 머리 위로, 다리는 옆으로 벌렸다가 다시 모아요. 발까지 보이면 다리도 봐요.',
  },
  knee: {
    name: '무릎 들기', emoji: '🏃', unit: '번', goal: { 30: 40, 60: 80 },
    howto: '제자리에서 달리듯 무릎을 번갈아 허리 높이까지 들어요. 한쪽 무릎마다 1번이에요.',
  },
};

const settings = {
  exercise: EX[store.get('exercise', 'squat')] ? store.get('exercise', 'squat') : 'squat',
  players: store.get('players', '1') === '2' ? '2' : '1',
  time: store.get('time', '30') === '60' ? '60' : '30',
  music: store.get('music', 'on') === 'off' ? 'off' : 'on',
  voice: store.get('voice', 'on') === 'off' ? 'off' : 'on',
};
const bestKey = () => `best.${settings.exercise}.${settings.time}`;

// ---------- 횟수 세기 ----------
// 모든 길이는 "몸통 길이(S)" 단위라서, 멀리 서든 가까이 서든 같은 기준이다.
// 정면 카메라에서는 무릎 굽힌 각도가 잘 안 보이므로(허벅지가 카메라 쪽을 향함),
// 스쿼트·무릎 들기는 "무릎이 엉덩이 높이에 얼마나 가까워졌나"로 잰다.
const clamp01 = (v) => Math.max(0, Math.min(1, v));

class Counter {
  constructor(ex) {
    this.ex = ex;
    this.count = 0;
    this.S = 0; // 서 있을 때 몸통 길이 (앉으면 짧아 보이므로 가장 긴 값을 천천히 따라간다)
    this.state = 'start';
    this.depth = 0; // 지금 동작이 얼마나 됐나 (0~1, 1 이면 한 번으로 셀 만큼)
    this.peak = 0; // 이번 동작에서 가장 많이 간 정도
    this.tip = '';
    this.tipT = 0;
    this.legs = [{ up: false, peak: 0 }, { up: false, peak: 0 }];
    this.smooth = {};
    this.pops = []; // 화면에 뜨는 "+1"
  }

  setTip(text, t = 1.6) { this.tip = text; this.tipT = t; }

  // 떨림 줄이기
  sm(key, v, k = 0.5) {
    if (v == null) return null;
    this.smooth[key] = this.smooth[key] == null ? v : this.smooth[key] + (v - this.smooth[key]) * k;
    return this.smooth[key];
  }

  update(pts, dt) {
    this.tipT = Math.max(0, this.tipT - dt);
    if (this.tipT === 0) this.tip = '';
    this.pops = this.pops.filter((p) => (p.t += dt) < 0.9);
    const s = pts && torso(pts);
    if (!s) return false;
    this.S = this.S ? Math.max(this.S * (1 - 0.05 * dt), s) : s; // 앉아도 바로 줄지 않게 천천히
    const S = this.S;
    if (this.ex === 'squat') this.squat(pts, S);
    else if (this.ex === 'jack') this.jack(pts, S);
    else this.knee(pts, S);
    return true;
  }

  add(pts, n = 1) {
    this.count += n;
    const at = vis(pts, 11) && vis(pts, 12) ? mid(pts[11], pts[12]) : null;
    if (at) this.pops.push({ x: at.x, y: at.y - this.S * 1.1, t: 0 });
    sfx.good(this.count);
  }

  // 허벅지 세로 길이 (무릎 높이 - 엉덩이 높이) / S. 서 있으면 약 0.85, 허벅지가 수평이면 0 근처
  thighV(pts, hip, knee) {
    if (!vis(pts, hip) || !vis(pts, knee)) return null;
    return (pts[knee].y - pts[hip].y) / this.S;
  }

  squat(pts, S) {
    const v = [this.thighV(pts, 23, 25), this.thighV(pts, 24, 26)].filter((x) => x != null);
    if (!v.length) { this.depth = 0; this.setTip('무릎이 보이게 조금 뒤로 가요', 0.5); return; }
    const t = this.sm('thigh', v.reduce((a, b) => a + b, 0) / v.length);
    this.depth = clamp01((0.8 - t) / (0.8 - 0.42));
    if (this.state !== 'down') {
      this.peak = Math.max(this.peak, this.depth);
      if (this.depth >= 1) { this.state = 'down'; sfx.pop(); }
      else if (this.depth < 0.15) {
        if (this.peak > 0.4) this.setTip('조금 더 깊이 앉아요! ⬇️');
        this.peak = 0;
        this.state = 'up';
      }
    } else if (this.depth < 0.3) {
      this.state = 'up';
      this.peak = 0;
      this.add(pts);
    }
    void S;
  }

  jack(pts, S) {
    if (![11, 12, 15, 16].every((i) => vis(pts, i))) { this.depth = 0; this.setTip('두 팔이 보이게 서요', 0.5); return; }
    const shY = (pts[11].y + pts[12].y) / 2;
    // 두 손목 중 낮은 쪽 기준: 어깨보다 0.6S 아래 = 0, 어깨보다 0.5S 위 = 1
    const wristY = this.sm('wrist', Math.max(pts[15].y, pts[16].y));
    const arms = clamp01((shY + 0.6 * S - wristY) / (1.1 * S));
    const legsSeen = vis(pts, 27) && vis(pts, 28);
    const spread = legsSeen ? this.sm('spread', Math.abs(pts[27].x - pts[28].x) / S) : null;
    const legs = legsSeen ? clamp01((spread - 0.55) / (0.95 - 0.55)) : 1;
    this.depth = Math.min(arms, legs);
    if (this.state !== 'open') {
      this.peak = Math.max(this.peak, arms);
      if (arms >= 1 && legs >= 1) { this.state = 'open'; sfx.pop(); }
      else if (arms >= 1 && legs < 1) this.setTip('다리도 옆으로 벌려요! ↔️', 0.6);
      if (arms < 0.15) {
        if (this.peak > 0.5) this.setTip('팔을 머리 위까지 올려요! ⬆️');
        this.peak = 0;
        this.state = 'closed';
      }
    } else if (arms < 0.2 && (!legsSeen || spread < 0.7)) {
      this.state = 'closed';
      this.peak = 0;
      this.add(pts);
    }
  }

  knee(pts, S) {
    const pairs = [[23, 25], [24, 26]];
    let shown = 0;
    let best = 0;
    pairs.forEach(([hip, kn], i) => {
      const v = this.thighV(pts, hip, kn);
      if (v == null) return;
      shown += 1;
      const t = this.sm(`k${i}`, v, 0.6);
      const lift = clamp01((0.75 - t) / (0.75 - 0.38));
      best = Math.max(best, lift);
      const leg = this.legs[i];
      if (!leg.up) {
        leg.peak = Math.max(leg.peak, lift);
        if (lift >= 1) { leg.up = true; this.add(pts); }
        else if (lift < 0.15) {
          if (leg.peak > 0.45) this.setTip('무릎을 허리 높이까지! ⬆️');
          leg.peak = 0;
        }
      } else if (lift < 0.3) {
        leg.up = false;
        leg.peak = 0;
      }
    });
    this.depth = best;
    if (!shown) this.setTip('무릎이 보이게 조금 뒤로 가요', 0.5);
    void S;
  }
}

// ---------- 연습 모드: 가짜 몸 ----------
// 운동 동작을 흉내 내는 몸 점을 만든다 (가끔 덜 해서 알림이 나오는 것도 보여 준다)
function demoBody(i, n, now, ex) {
  const S = H * (n === 2 ? 0.15 : 0.19);
  const cx = W * (n === 2 ? 0.25 + i * 0.5 : 0.5);
  const footY = H * 0.9;
  const tempo = { squat: 2.2, jack: 1.3, knee: 0.9 }[ex] + i * 0.15;
  const ph = ((now + i * 0.37) / tempo) % 1;
  const rep = Math.floor((now + i * 0.37) / tempo);
  const weak = rep % 5 === 3 ? { squat: 0.45, jack: 0.6, knee: 0.45 }[ex] : 1; // 다섯 번에 한 번은 덜 한다
  const wave = (Math.sin(ph * Math.PI * 2 - Math.PI / 2) + 1) / 2; // 0 → 1 → 0
  let squat = 0; let arms = 0; let spread = 0; const lift = [0, 0];
  if (ex === 'squat') squat = wave * weak;
  if (ex === 'jack') { arms = wave * weak; spread = wave; }
  if (ex === 'knee') {
    const k = Math.max(0, Math.sin(ph * Math.PI * 2));
    const k2 = Math.max(0, -Math.sin(ph * Math.PI * 2));
    lift[0] = k * weak; lift[1] = k2;
  }
  const hipY = footY - 1.65 * S + squat * 0.75 * S;
  const shY = hipY - S;
  const pts = Array.from({ length: 33 }, () => ({ x: cx, y: shY, visibility: 0 }));
  const put = (j, x, y) => { pts[j] = { x, y, visibility: 1 }; };
  put(0, cx, shY - 0.55 * S);
  [-1, 1].forEach((s, k) => {
    const sh = { x: cx + s * 0.42 * S, y: shY };
    const a = (10 + arms * 160) * Math.PI / 180;
    const el = { x: sh.x + s * Math.sin(a) * 0.6 * S, y: sh.y + Math.cos(a) * 0.6 * S };
    const wr = { x: el.x + s * Math.sin(a) * 0.55 * S, y: el.y + Math.cos(a) * 0.55 * S };
    const hip = { x: cx + s * 0.24 * S, y: hipY };
    const l = lift[k];
    const kneeY = squat ? footY - 0.8 * S - squat * 0.05 * S : hipY + 0.85 * S * (1 - l);
    const knee = { x: hip.x + s * (0.05 + spread * 0.25 + squat * 0.25) * S, y: kneeY };
    const ank = { x: hip.x + s * (0.05 + spread * 0.55) * S, y: l ? knee.y + 0.8 * S * (1 - l * 0.3) : footY };
    put(k ? 11 : 12, sh.x, sh.y); put(k ? 13 : 14, el.x, el.y); put(k ? 15 : 16, wr.x, wr.y);
    put(k ? 23 : 24, hip.x, hip.y); put(k ? 25 : 26, knee.x, knee.y); put(k ? 27 : 28, ank.x, ank.y);
    put(k ? 31 : 32, ank.x + s * 0.1 * S, ank.y + 0.08 * S);
  });
  return pts;
}

// ---------- 화면 ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}
function refreshHome() {
  document.querySelectorAll('.choices').forEach((group) => {
    const key = group.dataset.setting;
    group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value === settings[key])));
  });
  const ex = EX[settings.exercise];
  $('exercise-hint').textContent = ex.howto;
  $('players-hint').textContent = settings.players === '2' ? '1P는 화면 왼쪽, 2P는 오른쪽에 서요. 누가 더 많이 할까요?' : '';
  const best = Number(store.get(bestKey(), 0));
  $('best').textContent = best ? `🏆 ${ex.name} ${settings.time}초 최고 기록: ${best}${ex.unit}` : `🎯 ${settings.time}초 목표: ${ex.goal[settings.time]}${ex.unit}`;
  $('music-btn').textContent = settings.music === 'on' ? '🎵' : '🔇';
}
document.querySelectorAll('.choices').forEach((group) => {
  group.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    settings[group.dataset.setting] = b.dataset.value;
    store.set(group.dataset.setting, b.dataset.value);
    refreshHome();
  });
});
refreshHome();

let bannerTimer = 0;
function banner(text, cls = '', ms = 0) {
  const el = $('banner');
  el.textContent = text;
  el.className = `banner ${cls}${text ? ' show' : ''}`;
  clearTimeout(bannerTimer);
  if (ms) bannerTimer = setTimeout(() => { el.className = `banner ${cls}`; }, ms);
}

// ---------- 게임 ----------
const video = $('cam');
const stage = $('stage');
const ctx = stage.getContext('2d');
let W = 0; let H = 0; let DPR = 1;
let stream = null; let sensor = null; let wakeLock = null;

const game = { running: false, phase: 'idle', t: 0, left: 0, players: 1, counters: [], seen: [], lastSecond: -1 };
const music = new Music({
  chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], // C G Am F
  getBpm: () => (game.phase === 'go' && game.left < 10 ? 132 : 120),
  getTense: () => game.phase === 'go' && game.left < 10,
});

function buildPanels(n) {
  const box = $('panels');
  box.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = `panel${n === 2 ? ` p${i + 1}` : ''}`;
    p.innerHTML = '<div class="count">0</div><div class="panel-label"></div><div class="gauge"><div class="gauge-fill"></div></div><div class="panel-tip"></div>';
    box.appendChild(p);
  }
}

async function startGame() {
  unlockAudio();
  $('error').hidden = true;
  const n = settings.players === '2' ? 2 : 1;
  const btn = $('start');
  btn.disabled = true;
  btn.textContent = '준비 중…';
  try {
    if (!DEMO) {
      const camera = startCamera(video);
      stream = await camera;
      sensor = await getSensor(video, n);
    }
  } catch (err) {
    stopCamera(video, stream);
    btn.disabled = false;
    btn.textContent = '시작!';
    $('error').textContent = err.message || String(err);
    $('error').hidden = false;
    return;
  }
  btn.disabled = false;
  btn.textContent = '시작!';
  showScreen('screen-game');
  wakeLock = await holdScreenOn();
  const ex = EX[settings.exercise];
  Object.assign(game, {
    running: true, phase: 'find', t: 0, left: Number(settings.time), players: n,
    counters: Array.from({ length: n }, () => new Counter(settings.exercise)),
    seen: Array(n).fill(0), lastSecond: -1,
  });
  $('ex-name').textContent = `${ex.emoji} ${ex.name}`;
  buildPanels(n);
  if (settings.music === 'on') music.start();
  lastTs = 0;
  requestAnimationFrame(loop);
}

function stopGame() {
  game.running = false;
  music.stop();
  stopCamera(video, stream);
  stream = null;
  try { wakeLock?.release(); } catch { /* 무시 */ }
  wakeLock = null;
  hush();
  banner('');
}

function finish() {
  const ex = EX[settings.exercise];
  const counts = game.counters.map((c) => c.count);
  stopGame();
  sfx.win();
  const goal = ex.goal[settings.time];
  const body = $('over-body');
  body.innerHTML = '';
  let best = '';
  if (game.players === 1) {
    const n = counts[0];
    const prev = Number(store.get(bestKey(), 0));
    const isBest = n > prev;
    if (isBest) store.set(bestKey(), String(n));
    $('over-emoji').textContent = isBest && n > 0 ? '🏆' : n >= goal ? '🎖️' : '💪';
    $('over-title').textContent = isBest && n > 0 ? '최고 기록!' : '수고했어요!';
    body.innerHTML = `<div class="result-row"><span>${ex.emoji} ${ex.name}</span><b>${n}${ex.unit}</b></div>`
      + (n >= goal ? '<span class="stamp">🎖️ 목표 달성! 체력왕!</span>' : `<span class="stamp">🎯 목표 ${goal}${ex.unit}까지 ${goal - n}${ex.unit} 남았어요</span>`);
    best = `🏆 ${ex.name} ${settings.time}초 최고 기록: ${Math.max(prev, n)}${ex.unit}`;
    speak(isBest && n > 0 ? `최고 기록! ${n}${ex.unit}!` : `${n}${ex.unit}! 수고했어요!`, settings.voice === 'on');
  } else {
    const [a, b] = counts;
    const win = a === b ? -1 : a > b ? 0 : 1;
    $('over-emoji').textContent = win < 0 ? '🤝' : '🏆';
    $('over-title').textContent = win < 0 ? '무승부!' : `${win + 1}P 승리!`;
    body.innerHTML = counts.map((c, i) => `<div class="result-row p${i + 1}${i === win ? ' win' : ''}"><span class="who">${i + 1}P</span><b>${c}${ex.unit}</b>${i === win ? '👑' : ''}</div>`).join('');
    speak(win < 0 ? '무승부!' : `${win + 1}피 승리!`, settings.voice === 'on');
  }
  $('over-best').textContent = best;
  showScreen('screen-over');
}

function step(dt) {
  game.t += dt;
  const n = game.players;
  const present = game.seen.map((s) => s > 0);
  switch (game.phase) {
    case 'find': {
      const missing = present.map((p, i) => (p ? null : i)).filter((i) => i !== null);
      if (!missing.length && game.seen.every((s) => s > 0.8)) {
        game.phase = 'count';
        game.t = 0;
        speak('준비!', settings.voice === 'on');
      } else if (n === 2) {
        banner(missing.length === 2 ? '두 사람 모두 카메라 앞에 서요 👫'
          : missing.length ? `${missing[0] === 0 ? '1P(왼쪽)' : '2P(오른쪽)'} 어디 있어요? 🙋` : '찾았다! 👀', 'small');
      } else banner(missing.length ? '카메라 앞에 서요 🙋' : '찾았다! 👀', 'small');
      break;
    }
    case 'count': {
      const k = 3 - Math.floor(game.t);
      const label = k > 0 ? String(k) : '시작!';
      if ($('banner').textContent !== label) {
        banner(label, k > 0 ? '' : 'ok');
        if (k > 0) sfx.count(); else { sfx.go(); speak('시작!', settings.voice === 'on'); }
      }
      if (game.t >= 3.5) { game.phase = 'go'; game.t = 0; banner(''); game.counters.forEach((c) => { c.count = 0; }); }
      break;
    }
    case 'go': {
      game.left = Math.max(0, Number(settings.time) - game.t);
      const sec = Math.ceil(game.left);
      if (sec !== game.lastSecond) {
        game.lastSecond = sec;
        if (sec <= 3 && sec > 0) sfx.count();
        if (sec === 10) speak('10초 남았어요!', settings.voice === 'on');
      }
      if (game.left <= 0) { banner('끝!', 'gold'); finish(); }
      break;
    }
    default:
  }
}

function draw(now) {
  ctx.fillStyle = '#1b1830';
  ctx.fillRect(0, 0, W, H);
  const r = !DEMO && videoRect(video, W, H);
  if (r && video.readyState >= 2) {
    drawMirrored(ctx, video, r);
    ctx.fillStyle = 'rgba(20,16,40,0.2)';
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1f6b4f'); g.addColorStop(0.7, '#2d9c70'); g.addColorStop(0.7, '#1a5a42'); g.addColorStop(1, '#123d2d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (game.players === 2) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3 * DPR;
    ctx.setLineDash([14 * DPR, 12 * DPR]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.restore();
  }
  game.counters.forEach((c, i) => {
    const pts = current[i];
    if (!pts) return;
    const color = game.players === 2 ? (i === 0 ? '#ffb27a' : '#8cbcff') : 'rgba(255,255,255,0.9)';
    const hot = c.depth >= 1 ? '#22e06b' : '#ffd23f';
    const ex = c.ex;
    // 지금 세는 데 쓰는 곳(다리 또는 팔)을 노랑 → 다 하면 초록으로
    const colorOf = (a, b) => {
      const legBone = [23, 24, 25, 26].includes(a) && [25, 26, 27, 28].includes(b);
      const armBone = [11, 12, 13, 14].includes(a) && [13, 14, 15, 16].includes(b) && a !== b;
      if ((ex === 'squat' || ex === 'knee') && legBone) return hot;
      if (ex === 'jack' && (armBone || legBone)) return hot;
      return null;
    };
    drawSkeleton(ctx, pts, { width: Math.max(5 * DPR, (c.S || 100) * 0.07), color, colorOf });
    for (const p of c.pops) {
      ctx.save();
      ctx.globalAlpha = 1 - p.t / 0.9;
      ctx.font = `900 ${Math.round((c.S || 100) * 0.55)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 6 * DPR;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.fillStyle = '#ffd23f';
      const y = p.y - p.t * 60 * DPR;
      ctx.strokeText(`+1`, p.x, y);
      ctx.fillText(`+1`, p.x, y);
      ctx.restore();
    }
  });
  void now;
}

let hudCache = '';
function hud() {
  const ex = EX[settings.exercise];
  const timer = game.phase === 'go' ? `${Math.ceil(game.left)}초` : `${settings.time}초`;
  const rows = game.counters.map((c, i) => {
    const away = game.phase !== 'find' && !game.seen[i];
    return {
      count: c.count,
      label: `${game.players === 2 ? `${i + 1}P · ` : ''}${c.depth >= 1 ? '좋아요! 👍' : ex.name}`,
      depth: Math.round(c.depth * 100),
      tip: away ? '안 보여요! 화면 안으로 와요 🙈' : c.tip || (game.phase === 'go' ? '' : ex.howto),
    };
  });
  const key = JSON.stringify([timer, game.left < 10 && game.phase === 'go', rows]);
  if (key === hudCache) return;
  hudCache = key;
  $('timer').textContent = timer;
  $('timer').classList.toggle('hurry', game.phase === 'go' && game.left < 10);
  const panels = $('panels').children;
  rows.forEach((r, i) => {
    const p = panels[i];
    if (!p) return;
    p.querySelector('.count').innerHTML = `${r.count}<small>${ex.unit}</small>`;
    p.querySelector('.panel-label').textContent = r.label;
    const fill = p.querySelector('.gauge-fill');
    fill.style.width = `${r.depth}%`;
    fill.classList.toggle('done', r.depth >= 100);
    p.querySelector('.panel-tip').textContent = r.tip;
  });
}

let current = [];
let lastTs = 0;
function loop(ts) {
  if (!game.running) return;
  const now = ts / 1000;
  const dt = lastTs ? Math.min(0.1, now - lastTs) : 1 / 60;
  lastTs = now;
  ({ W, H, DPR } = fitCanvas(stage));
  const n = game.players;
  if (DEMO) current = game.counters.map((_, i) => demoBody(i, n, now, settings.exercise));
  else {
    const res = sensor?.sample(dt);
    const r = videoRect(video, W, H);
    current = game.counters.map((_, i) => (res?.[i]?.present && res[i].landmarks && r ? toPixels(res[i].landmarks, r) : null));
  }
  game.counters.forEach((c, i) => {
    const before = c.count;
    const ok = c.update(current[i], dt);
    game.seen[i] = ok ? game.seen[i] + dt : 0;
    if (game.phase !== 'go') c.count = 0; // 시작 전 동작은 세지 않는다
    else if (c.count !== before && c.count % 10 === 0) speak(`${c.count}${EX[settings.exercise].unit}!`, settings.voice === 'on');
  });
  step(dt);
  if (!game.running) return;
  draw(now);
  hud();
  requestAnimationFrame(loop);
}

$('start').addEventListener('click', startGame);
$('again').addEventListener('click', () => { refreshHome(); startGame(); });
$('home').addEventListener('click', () => { refreshHome(); showScreen('screen-home'); });
$('quit').addEventListener('click', () => { stopGame(); refreshHome(); showScreen('screen-home'); });
$('music-btn').addEventListener('click', () => {
  settings.music = settings.music === 'on' ? 'off' : 'on';
  store.set('music', settings.music);
  refreshHome();
  if (settings.music === 'on' && game.running) { unlockAudio(); music.start(); } else music.stop();
});
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden') music.stop();
  else if (game.running) {
    if (settings.music === 'on') music.start();
    if (!wakeLock) wakeLock = await holdScreenOn();
  }
});

if ('serviceWorker' in navigator && !DEMO && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (DEMO) document.title += ' (연습 모드)';
