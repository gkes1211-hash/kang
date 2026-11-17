// 제기차기: 화면 속 제기를 발·무릎으로 차올린다. 떨어뜨리지 않고 몇 번 찰 수 있을까?
// 혼자: 세 번 떨어뜨리면 끝, 가장 긴 연속 기록을 잰다 / 둘이서: 60초 동안 각자 제기로 더 많이 차기.
import {
  startCamera, stopCamera, getSensor, fitCanvas, videoRect, drawMirrored, toPixels, holdScreenOn,
  drawSkeleton, torso, vis, mid,
} from '../common/camera.js';
import { unlockAudio, sfx, speak, hush, Music, makeStore } from '../common/sound.js';

const $ = (id) => document.getElementById(id);
const DEMO = new URLSearchParams(location.search).has('demo'); // 카메라 없이 가짜 몸으로 돌려 보기
const store = makeStore('jegi');

// 난이도
// gravity: 떨어지는 빠르기(화면 높이/초²), reach: 발·무릎이 제기에 닿는 거리(몸통 길이 배),
// needUp: 발을 위로 올리는 중이어야 차지나, drift: 옆으로 튀는 정도(화면 너비 배)
const LEVELS = {
  easy: { label: '쉬움', emoji: '🐣', gravity: 0.9, reach: 0.55, needUp: false, drift: 0.04,
    hint: '제기가 천천히 떨어져요. 발이나 무릎에 닿기만 해도 올라가요.' },
  normal: { label: '보통', emoji: '🐰', gravity: 1.2, reach: 0.45, needUp: true, drift: 0.07,
    hint: '발이나 무릎을 위로 차올려야 올라가요.' },
  hard: { label: '어려움', emoji: '🦅', gravity: 1.6, reach: 0.36, needUp: true, drift: 0.12,
    hint: '빨리 떨어지고 옆으로 많이 튀어요. 진짜 제기처럼!' },
};
const DUO_TIME = 60;
const LIVES = 3;

const settings = {
  players: store.get('players', '1') === '2' ? '2' : '1',
  difficulty: LEVELS[store.get('difficulty', 'easy')] ? store.get('difficulty', 'easy') : 'easy',
  music: store.get('music', 'on') === 'off' ? 'off' : 'on',
  voice: store.get('voice', 'on') === 'off' ? 'off' : 'on',
};
const bestKey = () => `best.${settings.difficulty}`;
const voiceOn = () => settings.voice === 'on';

// 차는 데 쓰는 몸 점: 발목·발끝·뒤꿈치(발), 무릎
const FEET = [27, 28, 29, 30, 31, 32];
const KNEES = [25, 26];

// ---------- 화면 ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}
function refreshHome() {
  document.querySelectorAll('.choices').forEach((group) => {
    const key = group.dataset.setting;
    group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value === settings[key])));
  });
  $('difficulty-hint').textContent = LEVELS[settings.difficulty].hint;
  $('players-hint').textContent = settings.players === '2'
    ? '1P는 화면 왼쪽, 2P는 오른쪽에 서요. 각자 제기를 차요!'
    : '발까지 화면에 보이게 조금 뒤로 서요.';
  const best = Number(store.get(bestKey(), 0));
  $('best').textContent = best ? `🏆 ${LEVELS[settings.difficulty].label} 최고 연속 기록: ${best}번` : '';
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

// ---------- 게임 상태 ----------
const video = $('cam');
const stage = $('stage');
const ctx = stage.getContext('2d');
let W = 0; let H = 0; let DPR = 1;
let stream = null; let sensor = null; let wakeLock = null;

const game = { running: false, phase: 'idle', t: 0, left: DUO_TIME, players: 1, level: LEVELS.easy, kids: [], lastSecond: -1 };
const music = new Music({
  chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]], // Am G F E: 흥겨운 장터 느낌
  getBpm: () => 118 + Math.min(16, Math.max(0, ...game.kids.map((k) => k.streak))),
  getTense: () => game.kids.some((k) => k.jegi && k.jegi.vy > 0 && k.jegi.y > H * 0.5),
});

// 한 사람의 상태: 몸, 제기, 기록
function newKid(i) {
  return {
    i, pts: null, S: 0, seen: 0, prev: {}, vel: {},
    jegi: null, respawn: 0, streak: 0, best: 0, total: 0, drops: 0, lastKick: -1, pops: [],
  };
}

// 이 사람이 쓰는 화면 칸 (둘이서는 반씩)
function area(i) {
  const n = game.players;
  return { l: (W / n) * i, r: (W / n) * (i + 1) };
}

const jegiR = () => Math.max(14 * DPR, H * 0.035);

function spawn(kid) {
  const a = area(kid.i);
  const hips = kid.pts && vis(kid.pts, 23) && vis(kid.pts, 24) ? mid(kid.pts[23], kid.pts[24]) : null;
  const x = Math.min(a.r - jegiR() * 2, Math.max(a.l + jegiR() * 2, hips ? hips.x : (a.l + a.r) / 2));
  kid.jegi = { x, y: H * 0.12, vx: 0, vy: 0, spin: 0, wob: Math.random() * 10 };
}

// ---------- 차기 ----------
function trackPoints(kid, dt) {
  const pts = kid.pts;
  for (const j of [...FEET, ...KNEES]) {
    if (!vis(pts, j)) { delete kid.prev[j]; continue; }
    const p = pts[j];
    const q = kid.prev[j];
    if (q && dt > 0) {
      const v = { x: (p.x - q.x) / dt, y: (p.y - q.y) / dt };
      const o = kid.vel[j] || v;
      kid.vel[j] = { x: o.x + (v.x - o.x) * 0.6, y: o.y + (v.y - o.y) * 0.6 };
    }
    kid.prev[j] = { x: p.x, y: p.y };
  }
}

function tryKick(kid, now) {
  const jg = kid.jegi;
  if (!jg || !kid.pts || now - kid.lastKick < 0.3 || jg.vy < -H * 0.3) return;
  const lv = game.level;
  const S = kid.S || H * 0.2;
  const reach = lv.reach * S + jegiR();
  let hit = null;
  for (const j of [...FEET, ...KNEES]) {
    if (!vis(kid.pts, j)) continue;
    const p = kid.pts[j];
    const d = Math.hypot(p.x - jg.x, p.y - jg.y);
    if (d > reach) continue;
    const v = kid.vel[j] || { x: 0, y: 0 };
    if (lv.needUp && v.y > -0.6 * S) continue; // 보통·어려움: 위로 차올려야 한다
    if (!hit || d < hit.d) hit = { j, d, p, v };
  }
  if (!hit) return;
  // 화면 위쪽(조금씩 다른 높이)까지 올라가게 차 준다
  const top = H * (0.1 + Math.random() * 0.12);
  const rise = Math.max(H * 0.25, jg.y - top);
  jg.vy = -Math.sqrt(2 * lv.gravity * H * rise);
  const side = (jg.x - hit.p.x) / reach;
  jg.vx = Math.max(-W * 0.3, Math.min(W * 0.3, side * W * 0.12 + hit.v.x * 0.15 + (Math.random() - 0.5) * 2 * lv.drift * W));
  jg.spin = (Math.random() - 0.5) * 8;
  kid.lastKick = now;
  kid.streak += 1;
  kid.total += 1;
  kid.best = Math.max(kid.best, kid.streak);
  const knee = KNEES.includes(hit.j);
  kid.pops.push({ x: jg.x, y: jg.y, t: 0, text: knee ? `무릎! ${kid.streak}` : String(kid.streak) });
  sfx.good(kid.streak);
  if (kid.streak % 10 === 0) speak(`${kid.streak}번!`, voiceOn());
}

function physics(kid, dt, now) {
  const jg = kid.jegi;
  if (!jg) {
    kid.respawn -= dt;
    if (kid.respawn <= 0 && (game.players === 2 || kid.drops < LIVES)) spawn(kid);
    return;
  }
  const g = game.level.gravity * H;
  jg.vy += g * dt;
  jg.vx *= 1 - 0.6 * dt;
  jg.x += jg.vx * dt;
  jg.y += jg.vy * dt;
  jg.spin *= 1 - 0.8 * dt;
  jg.wob += dt * (4 + Math.abs(jg.vy) / H * 3);
  const r = jegiR();
  const a = area(kid.i);
  if (jg.x < a.l + r) { jg.x = a.l + r; jg.vx = Math.abs(jg.vx) * 0.6; }
  if (jg.x > a.r - r) { jg.x = a.r - r; jg.vx = -Math.abs(jg.vx) * 0.6; }
  if (jg.y < r) { jg.y = r; jg.vy = Math.abs(jg.vy) * 0.2; }
  tryKick(kid, now);
  // 바닥: 발이 보이면 발보다 조금 아래, 안 보이면 화면 아래
  const feet = kid.pts ? FEET.filter((j) => vis(kid.pts, j)).map((j) => kid.pts[j].y) : [];
  const floor = feet.length ? Math.min(H + r, Math.max(...feet) + (kid.S || H * 0.2) * 0.35) : H + r;
  if (jg.y > floor) drop(kid);
}

function drop(kid) {
  kid.jegi = null;
  kid.streak = 0;
  kid.drops += 1;
  kid.respawn = 1.3;
  sfx.fail();
  if (game.players === 1) {
    const left = LIVES - kid.drops;
    banner(left > 0 ? `떨어졌어요! 💥 남은 기회 ${left}` : '끝! 💥', 'bad small', 1200);
    if (left <= 0) { game.phase = 'end'; game.t = 0; }
  } else {
    banner(`${kid.i + 1}P 떨어졌어요! 💥`, 'bad small', 900);
  }
}

// ---------- 연습 모드: 가짜 몸 ----------
// 제기 밑으로 가서 발을 차올린다 (가끔 빗나가서 떨어뜨리기도 한다)
const demoState = [];
function demoBody(kid, dt, now) {
  const n = game.players;
  const ds = demoState[kid.i] || (demoState[kid.i] = { cx: 0, foot: null, miss: false, side: 1 });
  const S = H * (n === 2 ? 0.14 : 0.17);
  const a = area(kid.i);
  if (!ds.cx) ds.cx = (a.l + a.r) / 2;
  const jg = kid.jegi;
  if (jg) ds.cx += (jg.x - ds.cx) * Math.min(1, dt * 2.5);
  ds.cx = Math.max(a.l + S, Math.min(a.r - S, ds.cx)); // 내 칸 안에서만
  const footY = H * 0.93;
  const hipY = footY - 1.65 * S;
  const shY = hipY - S;
  const cx = ds.cx + Math.sin(now * 2 + kid.i) * S * 0.05;
  let kick = null;
  if (jg && jg.vy > 0 && jg.y > hipY + 0.2 * S) {
    if (!ds.foot) { ds.side = jg.x < cx ? -1 : 1; ds.miss = Math.random() < 0.12; ds.foot = { x: cx + ds.side * 0.3 * S, y: footY }; }
    const tx = jg.x + (ds.miss ? ds.side * 1.4 * S : 0);
    const ty = jg.y + jegiR() * 0.6;
    ds.foot.x += (tx - ds.foot.x) * Math.min(1, dt * 14);
    ds.foot.y += (ty - ds.foot.y) * Math.min(1, dt * 14);
    kick = ds.foot;
  } else if (ds.foot) {
    ds.foot.y += (footY - ds.foot.y) * Math.min(1, dt * 8);
    if (Math.abs(ds.foot.y - footY) < 2) ds.foot = null;
    kick = ds.foot;
  }
  const pts = Array.from({ length: 33 }, () => ({ x: cx, y: shY, visibility: 0 }));
  const put = (j, x, y) => { pts[j] = { x, y, visibility: 1 }; };
  put(0, cx, shY - 0.55 * S);
  [-1, 1].forEach((s, k) => {
    const sh = { x: cx + s * 0.42 * S, y: shY };
    const hip = { x: cx + s * 0.24 * S, y: hipY };
    const swing = kick && s === ds.side ? 0.35 : 0;
    put(k ? 11 : 12, sh.x, sh.y);
    put(k ? 13 : 14, sh.x + s * 0.35 * S, sh.y + 0.5 * S - swing * S);
    put(k ? 15 : 16, sh.x + s * 0.55 * S, sh.y + 0.95 * S - swing * 1.5 * S);
    put(k ? 23 : 24, hip.x, hip.y);
    const ank = kick && s === ds.side ? kick : { x: hip.x + s * 0.06 * S, y: footY };
    const knee = { x: (hip.x + ank.x) / 2 + s * 0.12 * S, y: Math.min((hip.y + ank.y) / 2, ank.y - 0.4 * S) };
    put(k ? 25 : 26, knee.x, knee.y);
    put(k ? 27 : 28, ank.x, ank.y);
    put(k ? 29 : 30, ank.x - s * 0.04 * S, ank.y + 0.06 * S);
    put(k ? 31 : 32, ank.x + s * 0.12 * S, ank.y + 0.08 * S);
  });
  return pts;
}

// ---------- 진행 ----------
async function startGame() {
  unlockAudio();
  $('error').hidden = true;
  const n = settings.players === '2' ? 2 : 1;
  const btn = $('start');
  btn.disabled = true;
  btn.textContent = '준비 중…';
  try {
    if (!DEMO) {
      stream = await startCamera(video);
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
  const lv = LEVELS[settings.difficulty];
  Object.assign(game, {
    running: true, phase: 'find', t: 0, left: DUO_TIME, players: n, level: lv,
    kids: Array.from({ length: n }, (_, i) => newKid(i)), lastSecond: -1,
  });
  demoState.length = 0;
  $('level').textContent = `${lv.emoji} ${lv.label}`;
  $('timer').hidden = n === 1;
  const box = $('panels');
  box.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = `panel${n === 2 ? ` p${i + 1}` : ''}`;
    p.innerHTML = '<div class="count">0</div><div class="panel-label"></div><div class="panel-sub"></div><div class="panel-tip"></div>';
    box.appendChild(p);
  }
  hudCache = '';
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
  const kids = game.kids;
  stopGame();
  sfx.win();
  const lv = game.level;
  const body = $('over-body');
  let bestLine = '';
  if (game.players === 1) {
    const k = kids[0];
    const prev = Number(store.get(bestKey(), 0));
    const isBest = k.best > prev;
    if (isBest) store.set(bestKey(), String(k.best));
    $('over-emoji').textContent = isBest && k.best > 0 ? '🏆' : k.best >= 10 ? '🌟' : '🪶';
    $('over-title').textContent = isBest && k.best > 0 ? '최고 기록!' : '수고했어요!';
    body.innerHTML = `<div class="result-row"><span>최고 연속</span><b>${k.best}번</b></div>`
      + `<div class="result-row"><span>모두 찬 횟수</span><b>${k.total}번</b></div>`
      + (k.best >= 10 ? '<span class="stamp">🪶 제기차기 달인!</span>' : '');
    bestLine = `🏆 ${lv.label} 최고 연속 기록: ${Math.max(prev, k.best)}번`;
    speak(isBest && k.best > 0 ? `최고 기록! ${k.best}번!` : `${k.best}번! 수고했어요!`, voiceOn());
  } else {
    const [a, b] = kids;
    const score = (k) => k.total * 1000 + k.best;
    const win = score(a) === score(b) ? -1 : score(a) > score(b) ? 0 : 1;
    $('over-emoji').textContent = win < 0 ? '🤝' : '🏆';
    $('over-title').textContent = win < 0 ? '무승부!' : `${win + 1}P 승리!`;
    body.innerHTML = kids.map((k, i) => `<div class="result-row p${i + 1}${i === win ? ' win' : ''}"><span class="who">${i + 1}P</span><b>${k.total}번</b><span>최고 연속 ${k.best}</span>${i === win ? '👑' : ''}</div>`).join('');
    speak(win < 0 ? '무승부!' : `${win + 1}피 승리!`, voiceOn());
  }
  $('over-best').textContent = bestLine;
  showScreen('screen-over');
}

function step(dt, now) {
  game.t += dt;
  const kids = game.kids;
  switch (game.phase) {
    case 'find': {
      const missing = kids.filter((k) => !k.seen).map((k) => k.i);
      if (!missing.length && kids.every((k) => k.seen > 0.8)) {
        game.phase = 'count';
        game.t = 0;
        speak('준비!', voiceOn());
      } else if (game.players === 2) {
        banner(missing.length === 2 ? '두 사람 모두 카메라 앞에 서요 👫'
          : missing.length ? `${missing[0] === 0 ? '1P(왼쪽)' : '2P(오른쪽)'} 어디 있어요? 🙋` : '찾았다! 👀', 'small');
      } else banner(missing.length ? '카메라 앞에 서요 🙋' : '찾았다! 👀', 'small');
      break;
    }
    case 'count': {
      const k = 3 - Math.floor(game.t);
      const label = k > 0 ? String(k) : '차요!';
      if ($('banner').textContent !== label) {
        banner(label, k > 0 ? '' : 'ok');
        if (k > 0) sfx.count(); else { sfx.go(); speak('시작!', voiceOn()); }
      }
      if (game.t >= 3.3) {
        game.phase = 'play';
        game.t = 0;
        kids.forEach(spawn);
        banner('', '', 0);
      }
      break;
    }
    case 'play': {
      kids.forEach((k) => physics(k, dt, now));
      if (game.players === 2) {
        game.left = Math.max(0, DUO_TIME - game.t);
        const sec = Math.ceil(game.left);
        if (sec !== game.lastSecond) {
          game.lastSecond = sec;
          if (sec <= 3 && sec > 0) sfx.count();
          if (sec === 10) speak('10초 남았어요!', voiceOn());
        }
        if (game.left <= 0) { finish(); return; }
      }
      break;
    }
    case 'end':
      if (game.t > 1.3) finish();
      break;
    default:
  }
}

// ---------- 그리기 ----------
const TASSELS = ['#e8423a', '#2f7fe0', '#f5c400', '#2bb673', '#ff7ab8'];
function drawJegi(jg) {
  const r = jegiR();
  ctx.save();
  ctx.translate(jg.x, jg.y);
  // 종이 술: 움직이는 반대쪽(바람 받는 쪽)으로 날린다. 떨어질 때는 위로 활짝.
  const sp = Math.hypot(jg.vx, jg.vy) || 1;
  const back = { x: -jg.vx / sp, y: -jg.vy / sp };
  const up = jg.vy > 0 ? 1 : 0.4;
  const dir = { x: back.x * (1 - up) + 0 * up, y: back.y * (1 - up) - 1 * up };
  const dl = Math.hypot(dir.x, dir.y) || 1;
  const d = { x: dir.x / dl, y: dir.y / dl };
  const nrm = { x: -d.y, y: d.x };
  TASSELS.forEach((c, i) => {
    const off = (i - 2) * 0.28;
    const len = r * (2.6 + Math.sin(jg.wob + i) * 0.35);
    ctx.strokeStyle = c;
    ctx.lineWidth = r * 0.42;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(nrm.x * off * r * 0.5, nrm.y * off * r * 0.5 - r * 0.2);
    const bend = Math.sin(jg.wob * 1.3 + i) * r * 0.5;
    const ex = d.x * len + nrm.x * (off * r * 1.6 + bend);
    const ey = d.y * len + nrm.y * (off * r * 1.6 + bend);
    ctx.quadraticCurveTo(d.x * len * 0.5 + nrm.x * off * r, d.y * len * 0.5 + nrm.y * off * r, ex, ey);
    ctx.stroke();
  });
  // 엽전 (가운데 네모 구멍)
  ctx.rotate(jg.spin * 0.1);
  ctx.fillStyle = '#e3b23c';
  ctx.strokeStyle = '#8a5a12';
  ctx.lineWidth = r * 0.18;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7a4d0e';
  ctx.fillRect(-r * 0.28, -r * 0.28, r * 0.56, r * 0.56);
  ctx.restore();
}

function draw() {
  ctx.fillStyle = '#1b1830';
  ctx.fillRect(0, 0, W, H);
  const r = !DEMO && videoRect(video, W, H);
  if (r && video.readyState >= 2) {
    drawMirrored(ctx, video, r);
    ctx.fillStyle = 'rgba(20,16,40,0.18)';
    ctx.fillRect(0, 0, W, H);
  } else {
    // 마당 배경
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8fd0ff'); g.addColorStop(0.62, '#d9f1ff'); g.addColorStop(0.62, '#d9b98a'); g.addColorStop(1, '#b8915c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (game.players === 2) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3 * DPR;
    ctx.setLineDash([14 * DPR, 12 * DPR]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.restore();
  }
  for (const kid of game.kids) {
    if (kid.pts) {
      const color = game.players === 2 ? (kid.i === 0 ? '#ffb27a' : '#8cbcff') : 'rgba(255,255,255,0.9)';
      drawSkeleton(ctx, kid.pts, { width: Math.max(5 * DPR, (kid.S || 100) * 0.07), color });
      // 차는 곳(발·무릎)을 동그라미로 보여 준다
      ctx.save();
      for (const j of [27, 28, 25, 26]) {
        if (!vis(kid.pts, j)) continue;
        ctx.strokeStyle = 'rgba(255,210,63,0.85)';
        ctx.lineWidth = 3 * DPR;
        ctx.beginPath();
        ctx.arc(kid.pts[j].x, kid.pts[j].y, (kid.S || 100) * game.level.reach * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (kid.jegi) drawJegi(kid.jegi);
    for (const p of kid.pops) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.t / 0.9);
      ctx.font = `900 ${Math.round(H * 0.07)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 6 * DPR;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.fillStyle = '#ffd23f';
      const y = p.y - jegiR() * 1.5 - p.t * 70 * DPR;
      ctx.strokeText(p.text, p.x, y);
      ctx.fillText(p.text, p.x, y);
      ctx.restore();
    }
  }
}

let hudCache = '';
function hud() {
  const n = game.players;
  const rows = game.kids.map((k) => {
    const feet = k.pts && (vis(k.pts, 27) || vis(k.pts, 28));
    let tip = '';
    if (!k.seen && game.phase !== 'find') tip = '안 보여요! 화면 안으로 와요 🙈';
    else if (!feet) tip = '발이 보이게 조금 뒤로 가요 👣';
    else if (game.phase === 'play' && k.jegi && k.jegi.vy > 0 && k.jegi.y > H * 0.45) tip = game.level.needUp ? '발을 위로 차올려요! 🦶' : '발에 대요! 🦶';
    const hearts = n === 1 ? ` · ${'❤️'.repeat(Math.max(0, LIVES - k.drops))}${'🤍'.repeat(Math.min(LIVES, k.drops))}` : '';
    return {
      count: k.streak,
      label: `${n === 2 ? `${k.i + 1}P · ` : ''}연속${hearts}`,
      sub: `모두 ${k.total}번 · 최고 연속 ${k.best}번`,
      tip,
    };
  });
  const timer = `${Math.ceil(game.left)}초`;
  const key = JSON.stringify([timer, rows]);
  if (key === hudCache) return;
  hudCache = key;
  $('timer').textContent = timer;
  $('timer').classList.toggle('hurry', game.phase === 'play' && game.left < 10);
  const panels = $('panels').children;
  rows.forEach((r, i) => {
    const p = panels[i];
    if (!p) return;
    p.querySelector('.count').innerHTML = `${r.count}<small>번</small>`;
    p.querySelector('.panel-label').textContent = r.label;
    p.querySelector('.panel-sub').textContent = r.sub;
    p.querySelector('.panel-tip').textContent = r.tip;
  });
}

// ---------- 매 프레임 ----------
let lastTs = 0;
function loop(ts) {
  if (!game.running) return;
  const now = ts / 1000;
  const dt = lastTs ? Math.min(0.05, now - lastTs) : 1 / 60;
  lastTs = now;
  ({ W, H, DPR } = fitCanvas(stage));
  const res = DEMO ? null : sensor?.sample(dt);
  const r = DEMO ? null : videoRect(video, W, H);
  for (const kid of game.kids) {
    let pts = null;
    if (DEMO) pts = demoBody(kid, dt, now);
    else if (res?.[kid.i]?.present && res[kid.i].landmarks && r) pts = toPixels(res[kid.i].landmarks, r);
    kid.pts = pts;
    const s = pts && torso(pts);
    if (s) {
      kid.S = kid.S ? kid.S + (s - kid.S) * 0.1 : s;
      kid.seen += dt;
      trackPoints(kid, dt);
    } else kid.seen = 0;
    kid.pops = kid.pops.filter((p) => (p.t += dt) < 0.9);
  }
  step(dt, now);
  if (!game.running) return;
  draw();
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
