// 벽 통과하기: 벽이 다가오고, 구멍 모양대로 몸을 맞추면 통과!
// 혼자: 구멍 하나 / 둘이서: 왼쪽 1P·오른쪽 2P 구멍 두 개, 두 사람 모두 맞춰야 통과.
// 몸 인식은 무궁화 게임과 같은 엔진(../mugunghwa/pose.js, 기기 안에서만 돎)을 같이 쓴다.
import { PoseSensor } from '../mugunghwa/pose.js';
import { DIFFICULTY, pickSolo, pickPair } from './poses.js';
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
  players: store.get('players', '1') === '2' ? '2' : '1',
  difficulty: DIFFICULTY[store.get('difficulty', 'easy')] ? store.get('difficulty', 'easy') : 'easy',
  music: store.get('music', 'on') === 'off' ? 'off' : 'on',
  voice: store.get('voice', 'on') === 'off' ? 'off' : 'on',
};
const HINTS = {
  easy: '팔 자세만 맞춰요. 벽이 천천히 와요.',
  normal: '다리·몸통 자세도 나와요! 몸 전체가 보이게 서요.',
  hard: '빨라요! 다가오다가 구멍 모양이 바뀌기도 해요.',
};
const PLAYER_HINTS = {
  1: '혼자서 구멍 하나를 통과해요.',
  2: '1P는 화면 왼쪽, 2P는 오른쪽에 서요. 둘 다 맞춰야 통과!',
};
const bestKey = () => (settings.players === '2' ? `best.${settings.difficulty}.2p` : `best.${settings.difficulty}`);

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
  wall: () => beep(330, 0.18, 'triangle', 0.08),
};

// 목소리: 통과·꽝 같은 짧은 말만 한다 (자세 이름은 말하지 않고 화면에만 보여 준다)
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

// ---------- 배경음악 ----------
// 파일 없이 기기 안에서 바로 만드는 음악. 가라앉은 단조(라단조) 코드 위에
// 통통 튀는 베이스·반짝이는 아르페지오·작은 북을 잔잔하게 깐다.
// 벽이 가까이 오면 하이햇이 빨라져 두근두근해지고, 통과할수록 조금씩 빨라진다.
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const music = { timer: 0, next: 0, step: 0, master: null, noise: null };

function musicOn() { return settings.music === 'on' && !!audioCtx; }

function startMusic() {
  if (!musicOn() || music.timer) return;
  const ac = audioCtx;
  music.master = ac.createGain();
  music.master.gain.setValueAtTime(0.0001, ac.currentTime);
  music.master.gain.exponentialRampToValueAtTime(0.55, ac.currentTime + 1.5); // 천천히 커지게
  music.master.connect(ac.destination);
  if (!music.noise) {
    const len = Math.floor(ac.sampleRate * 0.2);
    music.noise = ac.createBuffer(1, len, ac.sampleRate);
    const d = music.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  music.next = ac.currentTime + 0.1;
  music.step = 0;
  music.timer = setInterval(scheduleMusic, 25);
}

function stopMusic() {
  if (!music.timer) return;
  clearInterval(music.timer);
  music.timer = 0;
  const m = music.master;
  music.master = null;
  if (m && audioCtx) {
    const t = audioCtx.currentTime;
    m.gain.cancelScheduledValues(t);
    m.gain.setValueAtTime(m.gain.value, t);
    m.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    setTimeout(() => m.disconnect(), 600);
  }
}

function note(freq, t, dur, type, vol, cutoff) {
  const ac = audioCtx;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out = g;
  if (cutoff) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    g.connect(f);
    out = f;
  }
  o.connect(g);
  out.connect(music.master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function kick(t) {
  const ac = audioCtx;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.32, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(music.master);
  o.start(t);
  o.stop(t + 0.2);
}

function hat(t, vol) {
  const ac = audioCtx;
  const s = ac.createBufferSource();
  s.buffer = music.noise;
  const f = ac.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 7000;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s.connect(f).connect(g).connect(music.master);
  s.start(t);
  s.stop(t + 0.06);
}

function scheduleMusic() {
  if (!music.master) return;
  const bpm = Math.min(134, 112 + game.passed * 1.5);
  const sp = 60 / bpm / 4; // 16분음표 길이
  const tense = game.phase === 'wall' && game.p > 0.6; // 벽이 가까이 오면 두근두근
  while (music.next < audioCtx.currentTime + 0.15) {
    const t = music.next;
    const s = music.step % 64;
    const i = s % 16;
    const chord = CHORDS[Math.floor(s / 16)];
    if (i % 8 === 0) kick(t);
    if (i % 4 === 2) hat(t, 0.05);
    else if (tense && i % 2 === 1) hat(t, 0.03);
    if (i % 2 === 0) note(mtof(chord[0] - 24 + (i % 4 === 2 ? 12 : 0)), t, sp * 1.7, 'triangle', 0.13);
    const a = ARP[i % 8];
    note(mtof((a === 3 ? chord[0] + 12 : chord[a]) + 12), t, sp * 0.9, 'square', 0.022, 2200);
    if (i === 0) chord.forEach((m) => note(mtof(m), t, sp * 15, 'sawtooth', 0.012, 900)); // 은은한 화음
    music.step += 1;
    music.next += sp;
  }
}

function refreshMusicBtn() {
  const b = $('music-btn');
  b.textContent = settings.music === 'on' ? '🎵' : '🔇';
  b.setAttribute('aria-pressed', String(settings.music === 'on'));
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
  $('players-hint').textContent = PLAYER_HINTS[settings.players];
  const best = Number(store.get(bestKey(), 0));
  const who = settings.players === '2' ? ' (둘이서)' : '';
  $('best').textContent = best ? `🏆 ${DIFFICULTY[settings.difficulty].label}${who} 최고 점수: ${best}점` : '';
  refreshMusicBtn();
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
const sensors = {}; // 인원수별 몸 인식기 (둘이서는 화면을 반씩 나눠 따로 찾는다)
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
const wallC = document.createElement('canvas');
const wctx = wallC.getContext('2d');
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  W = Math.round(stage.clientWidth * DPR);
  H = Math.round(stage.clientHeight * DPR);
  if (stage.width !== W || stage.height !== H) { stage.width = W; stage.height = H; }
  if (wallC.width !== W || wallC.height !== H) { wallC.width = W; wallC.height = H; }
}
window.addEventListener('resize', () => { if (W) resize(); });

// 벽돌 무늬
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
const brickPattern = wctx.createPattern(brickTile, 'repeat');

// ---------- 몸 상태 (한 사람에 하나씩) ----------
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const newBody = () => ({
  present: false, pts: null, meas: {}, anchor: null, S: 0,
  props: { ...DEFAULT_PROPS }, lastLegs: -Infinity, seenFor: 0,
});
let bodies = [newBody()];

function updateBody(body, pts, now, dt) {
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
  // 화면이 덜덜 떨리지 않게 천천히 따라간다
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

// 다리까지 다 보이나 (모두)
const fullBody = () => DEMO || bodies.every((b) => performance.now() / 1000 - b.lastLegs < 1.5);

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
const newDemo = () => ({ arms: [8, 4, 8, 4], legs: [6, 0, 6, 0], lean: 0, mistake: null });
let demos = [newDemo()];
function demoPoints(i, dt, now) {
  const demo = demos[i];
  const pose = game.wall?.poses[i];
  if (pose && game.phase === 'wall') {
    const goalArms = [...pose.arms];
    const goalLegs = [...(pose.legs || [6, 0, 6, 0])];
    if (demo.mistake != null) {
      if (demo.mistake < 4) goalArms[demo.mistake] += 75;
      else goalLegs[demo.mistake - 4] += 60;
    }
    const k = Math.min(1, dt * (2 + i * 0.5));
    demo.arms = demo.arms.map((a, j) => lerp(a, goalArms[j], k));
    demo.legs = demo.legs.map((a, j) => lerp(a, goalLegs[j], k));
    demo.lean = lerp(demo.lean, pose.lean || 0, k);
  }
  const n = bodies.length;
  const S = H * (n === 2 ? 0.14 : 0.19);
  const anchor = { x: W * (n === 2 ? 0.25 + i * 0.5 : 0.5) + Math.sin(now * 0.7 + i) * W * 0.02, y: H * 0.34 };
  const wob = (a, j) => a + Math.sin(now * 3 + j + i) * 3;
  const f = figure(anchor, S, { arms: demo.arms.map(wob), legs: demo.legs.map(wob), lean: demo.lean }, DEFAULT_PROPS);
  return figureToLandmarks(f);
}

// ---------- 게임 ----------
const game = {
  running: false, phase: 'idle', phaseT: 0, diff: null, players: 1, lives: 3, score: 0, passed: 0, perfect: 0,
  combo: 0, wallNo: 0, approach: 6, wall: null, lastId: null, p: 0, morphAt: null,
  judges: [], best: [], result: null, flash: null, shake: 0, lostShown: false,
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

// 아래 칸: 사람마다 게이지 하나
function buildMeters(n) {
  const box = $('meters');
  box.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const wrap = document.createElement('div');
    wrap.className = `meter-wrap${n === 2 ? ` p${i + 1}` : ''}`;
    wrap.innerHTML = '<div class="meter-label"></div><div class="meter"><div class="meter-fill"></div></div><div class="tip"></div>';
    box.appendChild(wrap);
  }
}

async function startGame() {
  unlockAudio();
  showError('');
  const n = settings.players === '2' ? 2 : 1;
  const startBtn = $('start');
  startBtn.disabled = true;
  startBtn.textContent = '준비 중…';
  try {
    if (!DEMO) {
      const loading = PoseSensor.load(); // 카메라 허락을 기다리는 동안 엔진도 같이 불러온다
      loading.catch(() => {});
      await startCamera();
      sensor = sensors[n] || (sensors[n] = new PoseSensor(video, n));
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
  bodies = Array.from({ length: n }, newBody);
  demos = Array.from({ length: n }, newDemo);
  Object.assign(game, {
    running: true, diff, players: n, lives: diff.lives, score: 0, passed: 0, perfect: 0, combo: 0, wallNo: 0,
    approach: diff.approach, wall: null, lastId: null, p: 0, morphAt: null, judges: [], best: [],
    result: null, flash: null, shake: 0, lostShown: false,
  });
  sensor?.reset();
  buildMeters(n);
  hudCache = '';
  setPhase('find');
  startMusic();
  lastTs = 0;
  requestAnimationFrame(loop);
}

function stopGame() {
  game.running = false;
  stopMusic();
  stopCamera();
  try { wakeLock?.release(); } catch { /* 무시 */ }
  wakeLock = null;
  try { speechSynthesis.cancel(); } catch { /* 무시 */ }
  banner('');
}

function newWall() {
  const pickWall = game.players === 2 ? pickPair : pickSolo;
  return pickWall(game.diff, game.passed, game.lastId, fullBody());
}

function nextWall() {
  const d = game.diff;
  game.wall = newWall();
  game.lastId = game.wall.id;
  game.wallNo += 1;
  game.p = 0;
  game.best = [];
  game.result = null;
  // 어려움: 세 번째 벽부터는 다가오다가 구멍 모양이 바뀔 수 있다
  game.morphAt = d.morph && game.passed >= 2 && Math.random() < d.morph ? 0.35 + Math.random() * 0.15 : null;
  demos.forEach((dm) => {
    dm.mistake = DEMO && Math.random() < 0.25 ? Math.floor(Math.random() * 4) : null;
  });
  setPhase('wall');
  sfx.wall();
  // 자세 이름은 말하지 않고 화면에만 크게 보여 준다
  banner(`${game.wall.emoji} ${game.wall.name}`, 'small', 1400);
}

function resolveWall() {
  const rs = game.judges.map((j, i) => game.best[i] || j);
  const each = rs.map((r, i) => !!(bodies[i].present && r && r.pass));
  const ok = each.every(Boolean);
  const perfect = ok && rs.every((r) => r.perfect);
  game.result = { pass: ok, perfect, each };
  if (ok) {
    game.combo += 1;
    game.passed += 1;
    let gain = 100 + 20 * Math.min(game.combo - 1, 5);
    if (perfect) { gain += 50; game.perfect += 1; }
    if (game.players === 2) gain += 50; // 둘이 같이 맞추면 보너스
    game.score += gain;
    game.approach = Math.max(game.diff.minApproach, game.approach * game.diff.speedUp);
    if (perfect) { banner(`완벽! ✨ +${gain}`, 'gold', 1000); sfx.perfect(); speak('완벽해요!'); }
    else { banner(`통과! 🎉 +${gain}`, 'ok', 1000); sfx.pass(); speak('통과!'); }
    game.flash = { color: '34,197,94', t: 0 };
  } else {
    game.combo = 0;
    game.lives -= 1;
    game.shake = 1;
    // 둘이서: 누가 못 맞췄는지 알려 준다
    const who = game.players === 2 ? each.map((e, i) => (e ? '' : `${i + 1}P`)).filter(Boolean).join('·') : '';
    banner(who ? `꽝! 💥 ${who}` : '꽝! 💥', 'bad', 1000);
    sfx.fail();
    speak('꽝!');
    game.flash = { color: '255,59,59', t: 0 };
  }
  setPhase('result');
}

function gameOver() {
  const key = bestKey();
  const prevBest = Number(store.get(key, 0));
  const isBest = game.score > prevBest;
  if (isBest) store.set(key, String(game.score));
  stopGame();
  $('over-score').textContent = game.score;
  $('over-walls').textContent = game.passed;
  $('over-perfect').textContent = game.perfect;
  $('over-emoji').textContent = isBest && game.score > 0 ? '🏆' : game.passed >= 5 ? '🌟' : '💪';
  $('over-title').textContent = isBest && game.score > 0 ? '최고 기록!' : '수고했어요!';
  const who = game.players === 2 ? ' (둘이서)' : '';
  $('over-best').textContent = `${game.diff.emoji} ${game.diff.label}${who} 최고 점수: ${Math.max(prevBest, game.score)}점`;
  showScreen('screen-over');
  speak(isBest && game.score > 0 ? '최고 기록이에요!' : '수고했어요!');
}

// 받침에 따라 조사 고르기: josa('왼팔', '이', '가') → '왼팔이'
function josa(word, withFinal, without) {
  const c = word.charCodeAt(word.length - 1) - 0xac00;
  return word + (c >= 0 && c <= 11171 && c % 28 ? withFinal : without);
}

// 가장 많이 틀린 마디
function worstPart(r) {
  if (!r) return null;
  let worst = null;
  for (const k of r.need) if (!worst || r.segs[k] > r.segs[worst]) worst = k;
  return worst;
}

function step(dt) {
  const d = game.diff;
  game.phaseT += dt;
  game.judges = bodies.map((b, i) => (game.wall ? judge(game.wall.poses[i], b.meas, d.tol, d.legs) : null));
  if (game.flash) { game.flash.t += dt; if (game.flash.t > 0.6) game.flash = null; }
  game.shake = Math.max(0, game.shake - dt * 2.5);
  const missing = bodies.map((b, i) => (b.present ? null : i)).filter((i) => i !== null);

  switch (game.phase) {
    case 'find':
      if (!missing.length && bodies.every((b) => b.seenFor > 0.8)) {
        setPhase('count');
        speak('준비!');
      } else if (game.players === 2) {
        const msg = missing.length === 2 ? '두 사람 모두 카메라 앞에 서요 👫'
          : missing.length ? `${missing[0] === 0 ? '1P(왼쪽)' : '2P(오른쪽)'} 어디 있어요? 🙋` : '찾았다! 👀';
        banner(msg, 'small');
      } else banner(missing.length ? '카메라 앞에 서요 🙋' : '찾았다! 👀', 'small');
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
      if (missing.length) {
        // 화면 밖으로 나가면 벽이 멈추고 기다려 준다
        const who = game.players === 2 ? `${missing.map((i) => `${i + 1}P`).join('·')}가 ` : '';
        banner(`${who}안 보여요! 화면 안으로 와요 🙈`, 'small');
        game.lostShown = true;
        break;
      }
      if (game.lostShown) { banner(''); game.lostShown = false; }
      const before = game.p;
      game.p = Math.min(1, game.p + dt / game.approach);
      if (game.morphAt != null && before < game.morphAt && game.p >= game.morphAt) {
        game.passed += 3; // 더 어려운 자세로 바뀌게
        game.wall = newWall();
        game.passed -= 3;
        game.lastId = game.wall.id;
        game.morphAt = null;
        banner(`바뀐다! 🔄 ${game.wall.emoji} ${game.wall.name}`, 'small gold', 1400);
        sfx.morph();
        if (DEMO && Math.random() < 0.5) demos[0].mistake = 0;
      }
      // 벽이 거의 다 왔을 때 사람마다 가장 잘 맞은 자세로 판정 (딱 그 순간 흔들려도 봐준다)
      if (game.p >= 0.9) {
        game.judges.forEach((j, i) => {
          const b = game.best[i];
          if (j && (!b || (j.pass && !b.pass) || (j.pass === b.pass && j.score > b.score))) game.best[i] = j;
        });
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

// 구멍은 언제나 화면 가운데 같은 자리·같은 크기에 뚫는다 (둘이서는 왼쪽 반·오른쪽 반 가운데).
// 서 있는 몸(머리 꼭대기~발끝, 몸통 길이의 3.5배)이 화면 세로의 3분의 2가 되게 맞추고, 세로 가운데에 둔다.
// (전에는 위·아래 글자 칸 자리를 픽셀로 빼고 남은 곳에 맞춰서, 세로가 짧은 화면에서는 구멍이 많이 작아졌다)
// 화면이 좁아 옆으로 쭉 뻗은 팔이 넘치면 그만큼만 줄인다.
const BODY_SHARE = 2 / 3;
function holeFrame(i) {
  const n = game.players;
  const S = Math.min((H * BODY_SHARE) / 3.5, ((W / n) * 0.94) / 3.4);
  const x = n === 2 ? W * (0.25 + i * 0.5) : W / 2;
  // 서 있는 몸의 가운데(어깨에서 몸통 0.9배 아래)를 화면 세로 가운데에
  return { anchor: { x, y: H / 2 - 0.9 * S }, S };
}

// 카메라 화면과 내 뼈대를 옮기고 키워서, 내 몸이 언제나 내 구멍에 딱 겹치게 한다.
// 카메라에서 멀리 서든 가까이 서든, 화면 어디에 비치든 자세만 맞추면 된다.
function applyView(c, i) {
  const body = bodies[i];
  if (!body?.anchor || !body.S) return 1;
  const hole = holeFrame(i);
  const k = clamp(hole.S / body.S, 0.4, 4); // 멀리 서도 구멍만큼 키운다
  c.translate(hole.anchor.x, hole.anchor.y);
  c.scale(k, k);
  c.translate(-body.anchor.x, -body.anchor.y);
  return k;
}

function drawBackground() {
  const r = !DEMO && videoRect();
  if (r && video.readyState >= 2) {
    ctx.fillStyle = '#1b1830'; // 카메라 화면을 줄였을 때 남는 가장자리
    ctx.fillRect(0, 0, W, H);
    const n = game.players;
    for (let i = 0; i < n; i++) {
      ctx.save();
      // 둘이서: 반쪽마다 그 사람에게 맞춰 따로 옮긴다
      ctx.beginPath();
      ctx.rect((W / n) * i, 0, W / n, H);
      ctx.clip();
      applyView(ctx, i);
      ctx.translate(r.x + r.w, r.y);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, r.w, r.h);
      ctx.restore();
    }
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
  if (game.players === 2) {
    // 가운데 나눔 선
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3 * DPR;
    ctx.setLineDash([14 * DPR, 12 * DPR]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.restore();
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
  if (!game.wall || !['wall', 'result'].includes(game.phase)) return;
  const frames = bodies.map((_, i) => holeFrame(i));
  const figs = frames.map((fr, i) => figure(fr.anchor, fr.S, game.wall.poses[i], bodies[i].props));
  const S = frames[0].S;
  const w = holeWidth(S);
  const res = game.result;
  const vp = { x: W / 2, y: frames[0].anchor.y + S * 0.6 };

  // 1) 벽 한 장을 따로 그린다: 벽돌 → 노란 테두리 → 구멍 뚫기
  wctx.setTransform(1, 0, 0, 1, 0, 0);
  wctx.globalCompositeOperation = 'source-over';
  wctx.clearRect(0, 0, W, H);
  wctx.fillStyle = brickPattern;
  wctx.fillRect(0, 0, W, H);
  if (res) {
    wctx.fillStyle = res.pass ? 'rgba(34,197,94,0.35)' : 'rgba(255,40,40,0.4)';
    wctx.fillRect(0, 0, W, H);
  }
  // 벽 가장자리 (멀리 있을 때 판처럼 보이게)
  wctx.strokeStyle = '#7a2e12';
  wctx.lineWidth = 18 * DPR;
  wctx.strokeRect(0, 0, W, H);
  // 구멍 테두리: 둘이서는 1P 주황·2P 파랑, 판정 뒤에는 맞은 사람 초록·틀린 사람 빨강
  figs.forEach((f, i) => {
    let rim = '#ffd23f';
    if (game.players === 2) rim = i === 0 ? '#ff9a4d' : '#5aa2ff';
    if (res) rim = res.each[i] ? '#7dffa8' : '#ff8080';
    wctx.fillStyle = wctx.strokeStyle = rim;
    traceSilhouette(wctx, f, w + 14 * DPR);
  });
  wctx.globalCompositeOperation = 'destination-out';
  wctx.fillStyle = wctx.strokeStyle = '#000';
  figs.forEach((f) => traceSilhouette(wctx, f, w));
  wctx.globalCompositeOperation = 'source-over';
  if (game.players === 2) {
    // 구멍 위에 1P·2P 표시
    wctx.font = `900 ${Math.round(S * 0.32)}px system-ui, sans-serif`;
    wctx.textAlign = 'center';
    figs.forEach((f, i) => {
      wctx.fillStyle = i === 0 ? '#ff8a3d' : '#3d8bff';
      wctx.strokeStyle = '#fff';
      wctx.lineWidth = 6 * DPR;
      const y = Math.max(S * 0.4, Math.min(f.head.y - f.head.r - S * 0.25, f.wrL.y - S * 0.2, f.wrR.y - S * 0.2));
      wctx.strokeText(`${i + 1}P`, f.anchor.x, y);
      wctx.fillText(`${i + 1}P`, f.anchor.x, y);
    });
  }

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
    figs.forEach((f) => {
      stickFigure(ctx, f, `rgba(255,210,63,${0.35 + 0.25 * Math.sin(now * 5) ** 2})`, Math.max(4, S * 0.07), [10 * DPR, 9 * DPR]);
    });
  }
}

// 내 몸 뼈대: 맞은 마디는 초록, 틀린 마디는 빨강
function drawPlayer(i) {
  const body = bodies[i];
  const pts = body.pts;
  if (!pts) return;
  const [L, R] = pts[11].x <= pts[12].x ? [[11, 13, 15, 23, 25, 27], [12, 14, 16, 24, 26, 28]] : [[12, 14, 16, 24, 26, 28], [11, 13, 15, 23, 25, 27]];
  const vis = (j) => pts[j] && pts[j].visibility > 0.5;
  const S = body.S || 100;
  ctx.save();
  if (game.players === 2) {
    ctx.beginPath();
    ctx.rect((W / 2) * i, 0, W / 2, H);
    ctx.clip();
  }
  const k = applyView(ctx, i);
  const lw = Math.max((5 * DPR) / k, S * 0.07);
  const live = game.phase === 'wall' ? game.judges[i] : null;
  const tol = game.diff?.tol ?? 30;
  const plain = game.players === 2 ? (i === 0 ? '#ffb27a' : '#8cbcff') : 'rgba(255,255,255,0.9)';
  const colorOf = (key) => {
    if (!live || !(key in live.segs)) return plain;
    return live.segs[key] <= tol ? '#22e06b' : '#ff4d4d';
  };
  const seg = (a, b, color) => {
    if (!vis(a) || !vis(b)) return;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = lw + (4 * DPR) / k;
    ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
  };
  ctx.lineCap = 'round';
  const torso = colorOf('lean');
  seg(11, 12, plain); seg(L[0], L[3], torso); seg(R[0], R[3], torso); seg(23, 24, plain);
  seg(L[0], L[1], colorOf('uL')); seg(L[1], L[2], colorOf('fL'));
  seg(R[0], R[1], colorOf('uR')); seg(R[1], R[2], colorOf('fR'));
  seg(L[3], L[4], colorOf('tL')); seg(L[4], L[5], colorOf('sL'));
  seg(R[3], R[4], colorOf('tR')); seg(R[4], R[5], colorOf('sR'));
  for (const j of [...L, ...R]) {
    if (!vis(j)) continue;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(pts[j].x, pts[j].y, lw * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  if (vis(11) && vis(12)) {
    const a = { x: (pts[11].x + pts[12].x) / 2, y: (pts[11].y + pts[12].y) / 2 };
    ctx.strokeStyle = plain;
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
  bodies.forEach((_, i) => drawPlayer(i));
  if (game.flash) {
    ctx.fillStyle = `rgba(${game.flash.color},${0.35 * (1 - game.flash.t / 0.6)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

let hudCache = '';
function hud() {
  const d = game.diff;
  const n = game.players;
  const hearts = '❤️'.repeat(Math.max(0, game.lives)) + '🤍'.repeat(Math.max(0, d.lives - game.lives));
  const lvl = `${d.emoji} ${d.label}${n === 2 ? ' · 👫' : ''} · 벽 ${game.wallNo}${game.combo >= 2 ? ` · 🔥${game.combo}연속` : ''}`;
  const playing = game.phase === 'wall' || game.phase === 'result' || game.phase === 'gap';
  const poseName = playing && game.wall ? `${game.wall.emoji} ${game.wall.name}` : '';
  const rows = bodies.map((b, i) => {
    const live = game.phase === 'wall' ? game.judges[i] : null;
    const pct = live ? Math.round(live.score * 100) : 0;
    let tip = '';
    if (game.phase === 'find' || game.phase === 'count') {
      tip = d.legs && performance.now() / 1000 - b.lastLegs > 1.5
        ? '뒤로 가서 발까지 보이면 다리 자세도 나와요'
        : '구멍 모양대로 몸을 맞춰요!';
    } else if (live && !live.pass) {
      const k = worstPart(live);
      if (k) tip = live.segs[k] === Infinity ? `${josa(SEG_NAME[k], '이', '가')} 안 보여요` : `${josa(SEG_NAME[k], '을', '를')} 구멍에 맞춰요`;
    } else if (live?.pass) tip = n === 2 ? '좋아요! 친구도 맞추면 통과 ✋' : '좋아요! 그대로 멈춰요 ✋';
    const label = live ? (live.pass ? '딱 맞아요! 👍' : `자세 맞추기 ${pct}%`) : '자세 맞추기';
    return { pct, good: !!live?.pass, label, tip };
  });
  const key = JSON.stringify([hearts, game.score, lvl, poseName, rows]);
  if (key === hudCache) return;
  hudCache = key;
  $('lives').textContent = hearts;
  $('score').textContent = `${game.score}점`;
  $('level').textContent = lvl;
  $('pose-name').textContent = poseName;
  const wraps = $('meters').children;
  rows.forEach((r, i) => {
    const w = wraps[i];
    if (!w) return;
    const fill = w.querySelector('.meter-fill');
    fill.style.width = `${r.pct}%`;
    fill.classList.toggle('good', r.good);
    const label = w.querySelector('.meter-label');
    label.textContent = r.label;
    if (n === 2) {
      const tag = document.createElement('span');
      tag.className = 'who';
      tag.textContent = `${i + 1}P`;
      label.prepend(tag);
    }
    w.querySelector('.tip').textContent = r.tip;
  });
}

// ---------- 매 프레임 ----------
let lastTs = 0;
function loop(ts) {
  if (!game.running) return;
  const now = ts / 1000;
  const dt = lastTs ? Math.min(0.1, now - lastTs) : 1 / 60;
  lastTs = now;
  resize();

  let all = [];
  if (DEMO) all = bodies.map((_, i) => demoPoints(i, dt, now));
  else {
    const res = sensor?.sample(dt);
    const r = videoRect();
    all = bodies.map((_, i) => {
      const s = res?.[i];
      if (!s?.present || !s.landmarks || !r) return null;
      return s.landmarks.map((p) => ({ x: r.x + p.x * r.w, y: r.y + p.y * r.h, visibility: p.visibility ?? 1 }));
    });
  }
  const t = performance.now() / 1000;
  bodies.forEach((b, i) => updateBody(b, all[i], t, dt));
  step(dt);
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
$('music-btn').addEventListener('click', () => {
  settings.music = settings.music === 'on' ? 'off' : 'on';
  store.set('music', settings.music);
  refreshMusicBtn();
  if (settings.music === 'on' && game.running) { unlockAudio(); startMusic(); } else stopMusic();
});

// 다른 화면으로 갔다 오면 음악을 멈췄다 다시 틀고, 화면 꺼짐 방지를 다시 건다
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') stopMusic();
  else if (game.running) {
    startMusic();
    if (!wakeLock) holdScreenOn();
  }
});

// 홈 화면 설치·오프라인
if ('serviceWorker' in navigator && !DEMO && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

if (DEMO) document.title += ' (연습 모드)';
