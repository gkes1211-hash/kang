// 벽 통과하기: 벽이 다가오고, 구멍 모양대로 몸을 맞추면 통과!
// 몸 인식은 무궁화 게임과 같은 엔진(../mugunghwa/pose.js, 기기 안에서만 돎)을 같이 쓴다.
import { PoseSensor } from '../mugunghwa/pose.js';
import { DIFFICULTY, pickPose } from './poses.js';
import {
  measure, bodyFrame, figure, figureToLandmarks, traceSilhouette, judge, legsVisible,
  DEFAULT_PROPS, SEG_NAME,
} from './body.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo'); // 카메라 없이 가짜 몸으로 돌려 보기

// ---------- 설정 저장 ----------
const store = {
  get(k, d) { try { return localStorage.getItem(`byeok.${k}`) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(`byeok.${k}`, v); } catch { /* 저장 못 해도 게임은 된다 */ } },
};
const settings = {
  difficulty: DIFFICULTY[store.get('difficulty', 'easy')] ? store.get('difficulty', 'easy') : 'easy',
  voice: store.get('voice', 'on'),
};
const HINTS = {
  easy: '팔 자세만 맞춰요. 벽이 천천히 와요.',
  normal: '다리 자세도 나와요! 몸 전체가 보이게 서요.',
  hard: '빨라요! 다가오다가 구멍 모양이 바뀌기도 해요.',
};

// ---------- 소리 ----------
let audioCtx = null;
function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { audioCtx = null; }
}
function beep(freq, dur = 0.12, type = 'sine', vol = 0.18, when = 0) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}
const sfx = {
  count: () => beep(660, 0.12, 'square', 0.08),
  go: () => beep(990, 0.25, 'square', 0.1),
  pass: () => [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.14, 'triangle', 0.2, i * 0.07)),
  perfect: () => [659, 784, 988, 1318, 1568].forEach((f, i) => beep(f, 0.14, 'triangle', 0.2, i * 0.06)),
  fail: () => { beep(200, 0.35, 'sawtooth', 0.15); beep(110, 0.45, 'sawtooth', 0.15, 0.12); },
  morph: () => { beep(880, 0.09, 'square', 0.1); beep(660, 0.09, 'square', 0.1, 0.11); beep(880, 0.09, 'square', 0.1, 0.22); },
};

let koVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  koVoice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('ko')) || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}
function speak(text) {
  if (settings.voice !== 'on' || !koVoice) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = koVoice;
    u.lang = koVoice.lang;
    u.rate = 1.1;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
  } catch { /* 목소리가 안 나와도 게임은 된다 */ }
}

// ---------- 첫 화면 ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

function refreshHome() {
  document.querySelectorAll('.choices').forEach((group) => {
    const key = group.dataset.setting;
    group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value === settings[key])));
  });
  $('difficulty-hint').textContent = HINTS[settings.difficulty];
  const best = Number(store.get(`best.${settings.difficulty}`, 0));
  $('best').textContent = best ? `🏆 ${DIFFICULTY[settings.difficulty].label} 최고 점수: ${best}점` : '';
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

function showError(msg) {
  const el = $('error');
  el.textContent = msg;
  el.hidden = !msg;
}

// ---------- 카메라·몸 인식 ----------
const video = $('cam');
const stage = $('stage');
const ctx = stage.getContext('2d');
let stream = null;
let sensor = null;
let wakeLock = null;

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('이 주소에서는 카메라를 켤 수 없어요. https:// 주소나 이 기기(localhost)에서 열어 주세요.');
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch (err) {
    if (err?.name === 'NotAllowedError') throw new Error('카메라를 쓰도록 허락해 주세요. (주소창 옆 카메라 아이콘)');
    if (err?.name === 'NotFoundError') throw new Error('카메라를 찾지 못했어요.');
    throw new Error('카메라를 켤 수 없어요. 다른 앱이 카메라를 쓰고 있지 않은지 봐 주세요.');
  }
  video.srcObject = stream;
  await video.play().catch(() => {});
}

function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
}

// ---------- 캔버스 크기 ----------
let W = 0;
let H = 0;
let DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  W = Math.round(stage.clientWidth * DPR);
  H = Math.round(stage.clientHeight * DPR);
  if (stage.width !== W || stage.height !== H) { stage.width = W; stage.height = H; }
  if (wallC.width !== W || wallC.height !== H) { wallC.width = W; wallC.height = H; }
}
window.addEventListener('resize', () => { if (W) resize(); });

// 벽돌 무늬
const wallC = document.createElement('canvas');
const wctx = wallC.getContext('2d');
const brickTile = (() => {
  const c = document.createElement('canvas');
  c.width = 120; c.height = 60;
  const g = c.getContext('2d');
  g.fillStyle = '#f2d7bf'; g.fillRect(0, 0, 120, 60);
  const brick = (x, y, w, h, shade) => { g.fillStyle = shade; g.fillRect(x + 2, y + 2, w - 4, h - 4); };
  brick(0, 0, 60, 30, '#d9683a'); brick(60, 0, 60, 30, '#cf5f33');
  brick(-30, 30, 60, 30, '#d46437'); brick(30, 30, 60, 30, '#de7041'); brick(90, 30, 60, 30, '#d46437');
  return c;
})();
const brickPattern = ctx.createPattern(brickTile, 'repeat');
const brickPatternW = wctx.createPattern(brickTile, 'repeat');

// ---------- 몸 상태 ----------
const body = {
  present: false, pts: null, meas: {}, anchor: null, S: 0,
  props: { ...DEFAULT_PROPS }, lastLegs: -Infinity, seenFor: 0,
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function defaultFrame() {
  return { anchor: { x: W / 2, y: H * 0.36 }, S: H * 0.2 };
}

function updateBody(pts, now, dt) {
  const fr = pts && bodyFrame(pts);
  if (!fr) {
    body.present = false;
    body.pts = null;
    body.meas = {};
    body.seenFor = 0;
    return;
  }
  body.present = true;
  body.pts = pts;
  body.seenFor += dt;
  // 구멍 자리가 덜덜 떨리지 않게 천천히 따라간다
  if (!body.anchor) { body.anchor = { ...fr.anchor }; body.S = fr.S; }
  else {
    body.anchor.x = lerp(body.anchor.x, fr.anchor.x, 0.2);
    body.anchor.y = lerp(body.anchor.y, fr.anchor.y, 0.2);
    body.S = lerp(body.S, fr.S, 0.15);
  }
  for (const k of Object.keys(DEFAULT_PROPS)) {
    if (fr.props[k] != null) {
      body.props[k] = clamp(lerp(body.props[k], fr.props[k], 0.05), DEFAULT_PROPS[k] * 0.65, DEFAULT_PROPS[k] * 1.5);
    }
  }
  body.meas = measure(pts);
  if (legsVisible(pts)) body.lastLegs = now;
}

// 카메라 화면을 캔버스에 꽉 차게 그릴 때의 위치 (거울)
function videoRect() {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  const k = Math.max(W / vw, H / vh);
  const w = vw * k;
  const h = vh * k;
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

// ---------- 연습 모드: 가짜 몸 ----------
const demo = { arms: [8, 4, 8, 4], legs: [6, 0, 6, 0], mistake: null };
function demoPoints(dt, now) {
  const pose = game.pose;
  if (pose && (game.phase === 'wall')) {
    const goalArms = [...pose.arms];
    const goalLegs = [...(pose.legs || [6, 0, 6, 0])];
    if (demo.mistake != null) {
      if (demo.mistake < 4) goalArms[demo.mistake] += 75;
      else goalLegs[demo.mistake - 4] += 60;
    }
    const k = Math.min(1, dt * 2.2);
    demo.arms = demo.arms.map((a, i) => lerp(a, goalArms[i], k));
    demo.legs = demo.legs.map((a, i) => lerp(a, goalLegs[i], k));
  }
  const S = H * 0.19;
  const anchor = { x: W / 2 + Math.sin(now * 0.7) * W * 0.03, y: H * 0.34 };
  const wob = (a, i) => a + Math.sin(now * 3 + i) * 3;
  const f = figure(anchor, S, { arms: demo.arms.map(wob), legs: demo.legs.map(wob) }, DEFAULT_PROPS);
  return figureToLandmarks(f);
}

// ---------- 게임 ----------
const game = {
  running: false, phase: 'idle', phaseT: 0, diff: null, lives: 3, score: 0, passed: 0, perfect: 0,
  combo: 0, wallNo: 0, approach: 6, pose: null, lastPoseId: null, p: 0, morphAt: null,
  live: null, best: null, result: null, flash: null, shake: 0,
};

let bannerTimer = 0;
function banner(text, cls = '', ms = 0) {
  const el = $('banner');
  el.textContent = text;
  el.className = `banner ${cls}${text ? ' show' : ''}`;
  clearTimeout(bannerTimer);
  if (ms) bannerTimer = setTimeout(() => { el.className = `banner ${cls}`; }, ms);
}

function setPhase(phase) {
  game.phase = phase;
  game.phaseT = 0;
}

async function holdScreenOn() {
  try {
    wakeLock = await navigator.wakeLock?.request('screen');
    wakeLock?.addEventListener('release', () => { wakeLock = null; });
  } catch { wakeLock = null; }
}

async function startGame() {
  unlockAudio();
  showError('');
  const startBtn = $('start');
  startBtn.disabled = true;
  startBtn.textContent = '준비 중…';
  try {
    if (!DEMO) {
      const loading = PoseSensor.load(); // 카메라 허락을 기다리는 동안 엔진도 같이 불러온다
      loading.catch(() => {});
      await startCamera();
      if (!sensor) sensor = new PoseSensor(video, 1);
      try {
        await loading;
        await sensor.init();
      } catch {
        throw new Error('몸 인식을 켤 수 없어요. 크롬·사파리·엣지 최신 버전에서 열어 주세요.');
      }
    }
  } catch (err) {
    stopCamera();
    startBtn.disabled = false;
    startBtn.textContent = '시작!';
    showError(err.message || String(err));
    return;
  }
  startBtn.disabled = false;
  startBtn.textContent = '시작!';
  showScreen('screen-game');
  resize();
  holdScreenOn();

  const diff = DIFFICULTY[settings.difficulty];
  Object.assign(game, {
    running: true, diff, lives: diff.lives, score: 0, passed: 0, perfect: 0, combo: 0, wallNo: 0,
    approach: diff.approach, pose: null, lastPoseId: null, p: 0, morphAt: null, live: null, best: null,
    result: null, flash: null, shake: 0,
  });
  body.anchor = null;
  body.seenFor = 0;
  sensor?.reset();
  setPhase('find');
  lastTs = 0;
  requestAnimationFrame(loop);
}

function stopGame() {
  game.running = false;
  stopCamera();
  try { wakeLock?.release(); } catch { /* 무시 */ }
  wakeLock = null;
  try { speechSynthesis.cancel(); } catch { /* 무시 */ }
  banner('');
}

function nextWall() {
  const d = game.diff;
  const legsOk = DEMO || performance.now() / 1000 - body.lastLegs < 1.5;
  game.pose = pickPose(d, game.passed, game.lastPoseId, legsOk);
  game.lastPoseId = game.pose.id;
  game.wallNo += 1;
  game.p = 0;
  game.best = null;
  game.result = null;
  // 어려움: 세 번째 벽부터는 다가오다가 구멍 모양이 바뀔 수 있다
  game.morphAt = d.morph && game.passed >= 2 && Math.random() < d.morph ? 0.35 + Math.random() * 0.15 : null;
  demo.mistake = DEMO && Math.random() < 0.3 ? Math.floor(Math.random() * (game.pose.legs ? 8 : 4)) : null;
  setPhase('wall');
  banner(`${game.pose.emoji} ${game.pose.name}!`, 'small', 1300);
  speak(game.pose.name);
}

function resolveWall() {
  const r = game.best || game.live;
  const ok = body.present && r && r.pass;
  game.result = { pass: ok, perfect: ok && r.perfect, judge: r };
  if (ok) {
    game.combo += 1;
    game.passed += 1;
    let gain = 100 + 20 * Math.min(game.combo - 1, 5);
    if (r.perfect) { gain += 50; game.perfect += 1; }
    game.score += gain;
    game.approach = Math.max(game.diff.minApproach, game.approach * game.diff.speedUp);
    if (r.perfect) { banner(`완벽! ✨ +${gain}`, 'gold', 1000); sfx.perfect(); speak('완벽해요!'); }
    else { banner(`통과! 🎉 +${gain}`, 'ok', 1000); sfx.pass(); speak('통과!'); }
    game.flash = { color: '34,197,94', t: 0 };
  } else {
    game.combo = 0;
    game.lives -= 1;
    game.shake = 1;
    banner('꽝! 💥', 'bad', 1000);
    sfx.fail();
    speak('꽝!');
    game.flash = { color: '255,59,59', t: 0 };
  }
  setPhase('result');
}

function gameOver() {
  const key = `best.${settings.difficulty}`;
  const prevBest = Number(store.get(key, 0));
  const isBest = game.score > prevBest;
  if (isBest) store.set(key, String(game.score));
  stopGame();
  $('over-score').textContent = game.score;
  $('over-walls').textContent = game.passed;
  $('over-perfect').textContent = game.perfect;
  $('over-emoji').textContent = isBest && game.score > 0 ? '🏆' : game.passed >= 5 ? '🌟' : '💪';
  $('over-title').textContent = isBest && game.score > 0 ? '최고 기록!' : '수고했어요!';
  $('over-best').textContent = `${game.diff.emoji} ${game.diff.label} 최고 점수: ${Math.max(prevBest, game.score)}점`;
  showScreen('screen-over');
  speak(isBest && game.score > 0 ? '최고 기록이에요!' : '수고했어요!');
}

// 받침에 따라 조사 고르기: josa('왼팔', '이', '가') → '왼팔이'
function josa(word, withFinal, without) {
  const c = word.charCodeAt(word.length - 1) - 0xac00;
  return word + (c >= 0 && c <= 11171 && c % 28 ? withFinal : without);
}

// 몇 도 차이 나는 마디 중 가장 틀린 곳을 알려 준다
function worstPart(r) {
  if (!r) return null;
  let worst = null;
  for (const k of r.need) if (!worst || r.segs[k] > r.segs[worst]) worst = k;
  return worst;
}

function step(dt, now) {
  const d = game.diff;
  game.phaseT += dt;
  game.live = game.pose ? judge(game.pose, body.meas, d.tol, d.legs) : null;
  if (game.flash) { game.flash.t += dt; if (game.flash.t > 0.6) game.flash = null; }
  game.shake = Math.max(0, game.shake - dt * 2.5);

  switch (game.phase) {
    case 'find':
      if (body.present && body.seenFor > 0.8) {
        setPhase('count');
        speak('준비!');
      } else if (!body.present) banner('카메라 앞에 서요 🙋', 'small');
      else banner('찾았다! 👀', 'small');
      break;
    case 'count': {
      const n = 3 - Math.floor(game.phaseT);
      const label = n > 0 ? String(n) : '시작!';
      if ($('banner').textContent !== label) {
        banner(label, n > 0 ? '' : 'ok');
        if (n > 0) sfx.count(); else sfx.go();
      }
      if (game.phaseT >= 3.6) nextWall();
      break;
    }
    case 'wall': {
      if (!body.present) {
        // 화면 밖으로 나가면 벽이 멈추고 기다려 준다
        banner('안 보여요! 화면 안으로 와요 🙈', 'small');
        game.lostShown = true;
        break;
      }
      if (game.lostShown) { banner(''); game.lostShown = false; }
      const before = game.p;
      game.p = Math.min(1, game.p + dt / game.approach);
      if (game.morphAt != null && before < game.morphAt && game.p >= game.morphAt) {
        const old = game.pose;
        game.pose = pickPose(d, game.passed + 4, old.id, performance.now() / 1000 - body.lastLegs < 1.5 || DEMO);
        game.lastPoseId = game.pose.id;
        game.morphAt = null;
              banner(`바뀐다! 🔄 ${game.pose.name}`, 'small gold', 1300);
        sfx.morph();
        speak(`바뀐다! ${game.pose.name}`);
        if (DEMO && demo.mistake == null && Math.random() < 0.5) demo.mistake = 0;
      }
      // 벽이 거의 다 왔을 때의 가장 잘 맞은 자세로 판정 (딱 그 순간 흔들려도 봐준다)
      if (game.p >= 0.9 && game.live) {
        const b = game.best;
        if (!b || (game.live.pass && !b.pass) || (game.live.pass === b.pass && game.live.score > b.score)) game.best = game.live;
      }
      if (game.p >= 1) resolveWall();
      break;
    }
    case 'result':
      if (game.result.pass) game.p += dt / 2.4;
      if (game.phaseT >= 1.2) {
        if (game.lives <= 0) { gameOver(); return; }
        setPhase('gap');
      }
      break;
    case 'gap':
      if (game.phaseT >= 0.5) nextWall();
      break;
    default:
  }
}

// ---------- 그리기 ----------
function holeWidth(S) {
  return S * (0.28 + game.diff.tol / 180);
}

function holeFrame() {
  if (body.anchor) return { anchor: body.anchor, S: body.S };
  return defaultFrame();
}

function drawBackground() {
  const r = !DEMO && videoRect();
  if (r && video.readyState >= 2) {
    ctx.save();
    ctx.translate(r.x + r.w, r.y);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, r.w, r.h);
    ctx.restore();
    ctx.fillStyle = 'rgba(20,16,40,0.18)';
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#3b3470');
    g.addColorStop(0.62, '#6c63b8');
    g.addColorStop(0.62, '#2c2650');
    g.addColorStop(1, '#1d1a36');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

// 벽이 다가오는 길 (바닥 선)
function drawRails(vp) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2 * DPR;
  for (const t of [-0.6, -0.2, 0.2, 0.6]) {
    ctx.beginPath();
    ctx.moveTo(vp.x, vp.y);
    ctx.lineTo(vp.x + t * W * 1.4, H);
    ctx.stroke();
  }
  ctx.restore();
}

function stickFigure(c, f, color, width, dash) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (dash) c.setLineDash(dash);
  c.beginPath();
  const line = (...ps) => { c.moveTo(ps[0].x, ps[0].y); ps.slice(1).forEach((p) => c.lineTo(p.x, p.y)); };
  line(f.shL, f.shR, f.hipR, f.hipL, f.shL);
  line(f.shL, f.elL, f.wrL); line(f.shR, f.elR, f.wrR);
  line(f.hipL, f.knL, f.anL); line(f.hipR, f.knR, f.anR);
  c.moveTo(f.head.x + f.head.r, f.head.y);
  c.arc(f.head.x, f.head.y, f.head.r, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

function drawWall(now) {
  if (!game.pose || !['wall', 'result'].includes(game.phase)) return;
  const { anchor, S } = holeFrame();
  const f = figure(anchor, S, game.pose, body.props);
  const w = holeWidth(S);
  const res = game.result;
  const vp = { x: anchor.x, y: anchor.y + S * 0.6 };

  // 1) 벽 한 장을 따로 그린다: 벽돌 → 노란 테두리 → 구멍 뚫기
  wctx.setTransform(1, 0, 0, 1, 0, 0);
  wctx.globalCompositeOperation = 'source-over';
  wctx.clearRect(0, 0, W, H);
  wctx.fillStyle = brickPatternW;
  wctx.fillRect(0, 0, W, H);
  if (res) {
    wctx.fillStyle = res.pass ? 'rgba(34,197,94,0.35)' : 'rgba(255,40,40,0.4)';
    wctx.fillRect(0, 0, W, H);
  }
  // 벽 가장자리 (멀리 있을 때 판처럼 보이게)
  wctx.strokeStyle = '#7a2e12';
  wctx.lineWidth = 18 * DPR;
  wctx.strokeRect(0, 0, W, H);
  // 구멍 테두리
  wctx.fillStyle = wctx.strokeStyle = res ? (res.pass ? '#7dffa8' : '#ff8080') : '#ffd23f';
  traceSilhouette(wctx, f, w + 14 * DPR);
  wctx.globalCompositeOperation = 'destination-out';
  wctx.fillStyle = wctx.strokeStyle = '#000';
  traceSilhouette(wctx, f, w);
  wctx.globalCompositeOperation = 'source-over';

  // 2) 원근: 멀리서 작게 → 가까이 크게
  const p = game.p;
  let sc;
  let alpha;
  if (p <= 1) { sc = 1 / (1 + 4 * (1 - p)); alpha = 0.55 + 0.37 * p; }
  else { sc = 1 + (p - 1) * 8; alpha = Math.max(0, 0.92 - (p - 1) * 3.5); } // 통과하면 내 뒤로 휙
  if (res && !res.pass) alpha = Math.max(0, 0.95 - Math.max(0, game.phaseT - 0.6) * 2);

  drawRails(vp);
  if (p <= 1 && alpha > 0) {
    // 벽 그림자
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.25 * alpha})`;
    const by = vp.y + (H - vp.y) * sc;
    ctx.beginPath();
    ctx.ellipse(vp.x, Math.min(by, H - 4), W * sc * 0.55, 12 * DPR * (0.4 + sc), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  const sx = game.shake ? Math.sin(now * 60) * 18 * DPR * game.shake : 0;
  ctx.translate(vp.x + sx, vp.y);
  ctx.scale(sc, sc);
  ctx.translate(-vp.x, -vp.y);
  ctx.drawImage(wallC, 0, 0);
  ctx.restore();

  // 3) 벽이 멀리 있을 때: 내 자리에 맞출 모양을 흐릿하게 (쉬움·보통)
  if (game.diff.guide && game.phase === 'wall' && p < 0.97) {
    stickFigure(ctx, f, `rgba(255,210,63,${0.35 + 0.25 * Math.sin(now * 5) ** 2})`, Math.max(4, S * 0.07), [10 * DPR, 9 * DPR]);
  }
}

// 내 몸 뼈대: 맞은 마디는 초록, 틀린 마디는 빨강
function drawPlayer() {
  const pts = body.pts;
  if (!pts) return;
  const [L, R] = pts[11].x <= pts[12].x ? [[11, 13, 15, 23, 25, 27], [12, 14, 16, 24, 26, 28]] : [[12, 14, 16, 24, 26, 28], [11, 13, 15, 23, 25, 27]];
  const vis = (i) => pts[i] && pts[i].visibility > 0.5;
  const S = body.S || 100;
  const lw = Math.max(5 * DPR, S * 0.07);
  const live = game.live;
  const tol = game.diff?.tol ?? 30;
  const colorOf = (key) => {
    if (!live || !(key in live.segs)) return 'rgba(255,255,255,0.85)';
    return live.segs[key] <= tol ? '#22e06b' : '#ff4d4d';
  };
  const seg = (a, b, color) => {
    if (!vis(a) || !vis(b)) return;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = lw + 4 * DPR;
    ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
  };
  ctx.save();
  ctx.lineCap = 'round';
  const white = 'rgba(255,255,255,0.9)';
  seg(11, 12, white); seg(L[0], L[3], white); seg(R[0], R[3], white); seg(23, 24, white);
  seg(L[0], L[1], colorOf('uL')); seg(L[1], L[2], colorOf('fL'));
  seg(R[0], R[1], colorOf('uR')); seg(R[1], R[2], colorOf('fR'));
  seg(L[3], L[4], colorOf('tL')); seg(L[4], L[5], colorOf('sL'));
  seg(R[3], R[4], colorOf('tR')); seg(R[4], R[5], colorOf('sR'));
  for (const i of [...L, ...R]) {
    if (!vis(i)) continue;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, lw * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  if (vis(11) && vis(12)) {
    const a = { x: (pts[11].x + pts[12].x) / 2, y: (pts[11].y + pts[12].y) / 2 };
    ctx.strokeStyle = white;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(a.x, a.y - 0.55 * S, 0.27 * S, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function draw(now) {
  drawBackground();
  drawWall(now);
  drawPlayer();
  if (game.flash) {
    ctx.fillStyle = `rgba(${game.flash.color},${0.35 * (1 - game.flash.t / 0.6)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

let hudCache = '';
function hud() {
  const d = game.diff;
  const hearts = '❤️'.repeat(Math.max(0, game.lives)) + '🤍'.repeat(Math.max(0, d.lives - game.lives));
  const lvl = `${d.emoji} ${d.label} · 벽 ${game.wallNo}${game.combo >= 2 ? ` · 🔥${game.combo}연속` : ''}`;
  const live = game.phase === 'wall' ? game.live : null;
  const pct = live ? Math.round(live.score * 100) : 0;
  let tip = '';
  if (game.phase === 'find' || game.phase === 'count') {
    tip = d.legs && performance.now() / 1000 - body.lastLegs > 1.5
      ? '조금 뒤로 가서 발까지 보이면 다리 자세도 나와요'
      : '구멍 모양대로 몸을 맞춰요!';
  } else if (live && !live.pass) {
    const k = worstPart(live);
    if (k) tip = live.segs[k] === Infinity ? `${josa(SEG_NAME[k], '이', '가')} 안 보여요` : `${josa(SEG_NAME[k], '을', '를')} 구멍에 맞춰요`;
  } else if (live?.pass) tip = '좋아요! 그대로 멈춰요 ✋';
  const key = [hearts, game.score, lvl, pct, live?.pass, tip, game.pose?.id, game.phase].join('|');
  if (key === hudCache) return;
  hudCache = key;
  $('lives').textContent = hearts;
  $('score').textContent = `${game.score}점`;
  $('level').textContent = lvl;
  $('meter-fill').style.width = `${pct}%`;
  $('meter-fill').classList.toggle('good', !!live?.pass);
  // 이번 자세 이름도 여기에 보여 준다 (예: "🙌 만세 · 딱 맞아요! 👍")
  const name = game.pose && game.phase !== 'find' && game.phase !== 'count' ? `${game.pose.emoji} ${game.pose.name} · ` : '';
  $('meter-label').textContent = name + (live ? (live.pass ? '딱 맞아요! 👍' : `${pct}%`) : '자세 맞추기');
  $('tip').textContent = tip;
}

// ---------- 매 프레임 ----------
let lastTs = 0;
function loop(ts) {
  if (!game.running) return;
  const now = ts / 1000;
  const dt = lastTs ? Math.min(0.1, now - lastTs) : 1 / 60;
  lastTs = now;
  resize();

  let pts = null;
  if (DEMO) pts = demoPoints(dt, now);
  else {
    const res = sensor?.sample(dt)?.[0];
    const r = videoRect();
    if (res?.present && res.landmarks && r) {
      pts = res.landmarks.map((p) => ({ x: r.x + p.x * r.w, y: r.y + p.y * r.h, visibility: p.visibility ?? 1 }));
    }
  }
  updateBody(pts, performance.now() / 1000, dt);
  step(dt, now);
  if (!game.running) return;
  draw(now);
  hud();
  requestAnimationFrame(loop);
}

// ---------- 버튼 ----------
$('start').addEventListener('click', startGame);
$('again').addEventListener('click', () => { refreshHome(); startGame(); });
$('home').addEventListener('click', () => { refreshHome(); showScreen('screen-home'); });
$('quit').addEventListener('click', () => { stopGame(); refreshHome(); showScreen('screen-home'); });

// 다시 돌아왔을 때 화면 꺼짐 방지를 다시 건다
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && game.running && !wakeLock) {
    holdScreenOn();
  }
});

// 홈 화면 설치·오프라인
if ('serviceWorker' in navigator && !DEMO && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

if (DEMO) document.title += ' (연습 모드)';
