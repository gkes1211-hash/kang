// 풍선 터트리기: 카메라로 손을 찾고, 손이 풍선에 닿으면 터진다. 폭탄에 닿으면 점수가 깎인다.
// 혼자 할 때는 화면 가운데 구역에서만, 둘이서 할 때는 화면을 반으로 나눠 왼쪽 1P · 오른쪽 2P 가 대결한다.
// 손 인식은 구글 MediaPipe 손 인식 모델을 이 기기 안에서 돌린다 (영상은 어디로도 보내지 않는다).
// 인식 엔진(vision_bundle.mjs, wasm)은 무궁화 게임 폴더에 있는 것을 같이 쓰고,
// 손 모델(hand_landmarker.task)만 이 폴더의 vendor/ 에 따로 둔다.

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const ctx = canvas.getContext('2d');
const video = $('cam');
const app = $('app');

// ---------- 게임 규칙 ----------
// 크기별 점수: 작을수록 점수가 크다. r = 반지름(화면 짧은 쪽 대비)
const BALLOON_SIZES = [ // 큰 것 → 작은 것
  { r: 0.10, points: 1 }, { r: 0.088, points: 2 }, { r: 0.076, points: 3 }, { r: 0.065, points: 4 }, { r: 0.055, points: 5 },
];
const BOMB_SIZES = [ // 작은 것 → 큰 것
  { r: 0.04, points: -1 }, { r: 0.05, points: -2 }, { r: 0.06, points: -3 }, { r: 0.07, points: -4 }, { r: 0.08, points: -5 },
];
const GOLD = { r: 0.07, points: 10 };
const COMBO_WINDOW = 1.5; // 이 시간(초) 안에 다음 풍선을 터트리면 콤보가 이어진다
const COMBO_BONUS_FROM = 5; // 콤보가 이만큼 넘으면 풍선마다 +1점 더
const BALLOON_COLORS = ['#ff4f6d', '#ff9f1c', '#ffd93d', '#3ddc84', '#38b6ff', '#9b5cff', '#ff6ec7'];
const PLAYER_COLORS = ['#ff8a3d', '#3d8bff'];
// 손바닥 가운데를 잡는 점: 손목과 네 손가락 뿌리
const PALM_POINTS = [0, 5, 9, 13, 17];
// 난이도. hand = 손 동그라미 크기(화면 짧은 쪽 대비)
const LEVELS = {
  easy: {
    name: '쉬움', hint: '천천히 올라오고 폭탄이 적어요',
    hand: 0.065, speed: 0.75, spawn: 1.25, bomb: [0.08, 0.08], sizes: [3, 3, 2, 1, 1], gold: 0.06,
  },
  normal: {
    name: '보통', hint: '보통 속도, 폭탄도 보통이에요',
    hand: 0.05, speed: 1, spawn: 1, bomb: [0.12, 0.13], sizes: [2, 2, 2, 2, 2], gold: 0.05,
  },
  hard: {
    name: '어려움', hint: '빠르고, 폭탄과 작은 풍선이 많아요. 손 동그라미도 작아요',
    hand: 0.038, speed: 1.35, spawn: 0.8, bomb: [0.18, 0.17], sizes: [1, 1, 2, 3, 3], gold: 0.04,
  },
};
const MODE_HINTS = {
  1: '화면 가운데 밝은 구역에서만 풍선이 나오고 터져요',
  2: '화면 왼쪽은 1P, 오른쪽은 2P! 똑같은 풍선이 나와요. 점수가 높은 쪽이 이겨요',
};
const HAND_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

// ---------- 저장된 설정 (없어도 동작) ----------
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* 저장 못 해도 괜찮다 */ } },
};
let roundTime = Number(store.get('balloon.time', '60')) || 60;
let levelKey = LEVELS[store.get('balloon.level', 'normal')] ? store.get('balloon.level', 'normal') : 'normal';
let mode = store.get('balloon.mode', '1') === '2' ? 2 : 1;
let musicOn = store.get('balloon.music', 'on') !== 'off';
const level = () => LEVELS[levelKey];

// ---------- 상태 ----------
let W = 0, H = 0, DPR = 1, unit = 1;
let zones = []; // 풍선이 나오고 터지는 구역: [{ x0, x1 }]
let hands = []; // [{ pts, palm, prev, at, zone }]
let landmarker = null;
let lastVideoTime = -1;
let objects = []; // 풍선·폭탄. o.p = 어느 구역(사람) 것인지
let particles = [];
let texts = [];
let players = []; // 구역마다 한 사람
const game = { state: 'home', timeLeft: 0, elapsed: 0, spawnIn: 0 }; // state: home | countdown | play | over

function newPlayer() {
  return { score: 0, combo: 0, lastPopAt: -99, bestCombo: 0, popped: 0, bombs: 0, lastHand: performance.now(), flash: 0 };
}

// ---------- 화면 크기 · 구역 ----------
function layoutZones() {
  if (mode === 2) {
    zones = [{ x0: 0, x1: W / 2 }, { x0: W / 2, x1: W }];
  } else {
    // 가운데 구역: 세로 화면이면 전체, 가로 화면이면 화면 높이만 한 폭
    const zw = Math.min(W, Math.max(H * 0.9, W * 0.5));
    zones = [{ x0: (W - zw) / 2, x1: (W + zw) / 2 }];
  }
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  unit = Math.min(W, H);
  layoutZones();
}
window.addEventListener('resize', resize);
resize();

// 영상을 화면에 꽉 차게(잘라서) 거울처럼 그릴 때의 위치
function videoView() {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return null;
  const s = Math.max(W / vw, H / vh);
  return { s, w: vw * s, h: vh * s, dx: (W - vw * s) / 2, dy: (H - vh * s) / 2 };
}
// 손 인식 결과(0~1)를 화면 좌표로 (거울)
function toScreen(p, v) {
  return { x: W - (v.dx + p.x * v.w), y: v.dy + p.y * v.h };
}
const zoneAt = (x) => zones.findIndex((z) => x >= z.x0 && x < z.x1);

// ---------- 소리 ----------
let audio = null;
function initAudio() {
  if (audio) { audio.resume?.(); return; }
  try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { audio = null; }
}
function noiseBuffer(sec) {
  const buf = audio.createBuffer(1, Math.max(1, Math.floor(audio.sampleRate * sec)), audio.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  return buf;
}
function playPop(pitch = 1) {
  if (!audio) return;
  const t = audio.currentTime;
  const n = audio.createBufferSource();
  n.buffer = noiseBuffer(0.08);
  const bp = audio.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1800 * pitch; bp.Q.value = 0.8;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n.connect(bp).connect(g).connect(audio.destination);
  n.start(t);
  const o = audio.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(700 * pitch, t); o.frequency.exponentialRampToValueAtTime(1400 * pitch, t + 0.08);
  const og = audio.createGain();
  og.gain.setValueAtTime(0.25, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(og).connect(audio.destination);
  o.start(t); o.stop(t + 0.12);
}
function playBoom() {
  if (!audio) return;
  const t = audio.currentTime;
  const n = audio.createBufferSource();
  n.buffer = noiseBuffer(0.7);
  const lp = audio.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(1200, t); lp.frequency.exponentialRampToValueAtTime(100, t + 0.6);
  const g = audio.createGain();
  g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
  n.connect(lp).connect(g).connect(audio.destination);
  n.start(t);
  const o = audio.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.5);
  const og = audio.createGain();
  og.gain.setValueAtTime(0.8, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.connect(og).connect(audio.destination);
  o.start(t); o.stop(t + 0.55);
}
function playBeep(freq, dur = 0.15) {
  if (!audio) return;
  const t = audio.currentTime;
  const o = audio.createOscillator();
  o.type = 'square'; o.frequency.value = freq;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(audio.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

// ---------- 배경음악 (직접 만든 신나는 8마디 멜로디를 되풀이) ----------
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
// 한 마디 = 8분음표 8개. 0 = 쉼
const LEAD = [
  [72, 76, 79, 76, 81, 79, 76, 72], // C
  [69, 72, 76, 72, 77, 76, 72, 69], // Am
  [65, 69, 72, 77, 76, 72, 69, 72], // F
  [74, 71, 67, 71, 74, 79, 77, 74], // G
  [79, 0, 79, 76, 0, 76, 72, 74], // C
  [76, 0, 76, 72, 0, 72, 69, 71], // Am
  [72, 74, 76, 77, 79, 81, 79, 77], // F
  [76, 74, 71, 74, 79, 0, 0, 0], // G
];
const BASS = [[48, 55, 48, 55], [45, 52, 45, 52], [41, 48, 41, 48], [43, 50, 43, 50]]; // 4분음표
const music = { timer: null, step: 0, nextTime: 0, tempo: 132, out: null, hat: null };

function musicNote(type, freq, t, dur, vol) {
  const o = audio.createOscillator();
  o.type = type; o.frequency.value = freq;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(music.out);
  o.start(t); o.stop(t + dur + 0.02);
}
function musicStep(step, t) {
  const eighth = 60 / music.tempo / 2;
  const bar = Math.floor(step / 8) % LEAD.length, i = step % 8;
  const note = LEAD[bar][i];
  if (note) musicNote('square', midiHz(note), t, eighth * 0.9, 0.16);
  if (i % 2 === 0) musicNote('triangle', midiHz(BASS[bar % 4][i / 2]), t, eighth * 1.8, 0.45);
  if (i === 0 || i === 4) { // 쿵
    const o = audio.createOscillator();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const g = audio.createGain();
    g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g).connect(music.out); o.start(t); o.stop(t + 0.16);
  }
  if (i % 2 === 1) { // 칙
    const n = audio.createBufferSource();
    n.buffer = music.hat;
    const hp = audio.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = audio.createGain();
    g.gain.value = 0.25;
    n.connect(hp).connect(g).connect(music.out); n.start(t);
  }
}
function startMusic() {
  stopMusic();
  if (!audio || !musicOn) return;
  music.out = audio.createGain();
  music.out.gain.value = 0.11;
  music.out.connect(audio.destination);
  music.hat = music.hat || noiseBuffer(0.04);
  music.step = 0;
  music.tempo = 132;
  music.nextTime = audio.currentTime + 0.06;
  music.timer = setInterval(() => {
    while (music.nextTime < audio.currentTime + 0.15) {
      musicStep(music.step, music.nextTime);
      music.nextTime += 60 / music.tempo / 2;
      music.step++;
    }
  }, 25);
}
function stopMusic() {
  if (music.timer) clearInterval(music.timer);
  music.timer = null;
  if (music.out && audio) {
    const out = music.out;
    out.gain.setTargetAtTime(0.0001, audio.currentTime, 0.05);
    setTimeout(() => out.disconnect(), 400);
  }
  music.out = null;
}
function playFanfare() {
  if (!audio) return;
  const t = audio.currentTime;
  [72, 76, 79, 84].forEach((m, i) => {
    const o = audio.createOscillator();
    o.type = 'square'; o.frequency.value = midiHz(m);
    const g = audio.createGain();
    const s = t + i * 0.12, d = i === 3 ? 0.6 : 0.12;
    g.gain.setValueAtTime(0.12, s); g.gain.exponentialRampToValueAtTime(0.001, s + d);
    o.connect(g).connect(audio.destination); o.start(s); o.stop(s + d + 0.02);
  });
}

// ---------- 카메라 · 손 인식 ----------
async function startCamera() {
  if (video.srcObject) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('이 브라우저에서는 카메라를 쓸 수 없어요. 크롬이나 사파리 최신 버전에서 https 주소로 열어 주세요.');
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch (e) {
    if (e?.name === 'NotAllowedError') throw new Error('카메라 사용을 허락해 주세요. 주소창의 카메라 아이콘에서 바꿀 수 있어요.');
    if (e?.name === 'NotFoundError') throw new Error('카메라를 찾을 수 없어요.');
    throw new Error('카메라를 켤 수 없어요. 다른 앱이 카메라를 쓰고 있는지 확인해 주세요.');
  }
  video.srcObject = stream;
  await video.play().catch(() => {});
  if (!video.videoWidth) await new Promise((r) => video.addEventListener('loadedmetadata', r, { once: true }));
}

// 파일 하나짜리(더블클릭으로 여는) 판에서는 엔진과 모델이 이 HTML 안에 글자(base64)로 들어 있다
function inlineBytes(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const s = atob(el.textContent.trim());
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  el.remove();
  return out;
}
function blobUrl(bytes, type) {
  return URL.createObjectURL(new Blob([bytes], { type }));
}

async function loadHands() {
  if (landmarker) return landmarker;
  let HandLandmarker, fileset, model;
  if (document.getElementById('inline-bundle')) {
    ({ HandLandmarker } = await import(blobUrl(inlineBytes('inline-bundle'), 'text/javascript')));
    fileset = {
      wasmLoaderPath: blobUrl(inlineBytes('inline-loader'), 'text/javascript'),
      wasmBinaryPath: blobUrl(inlineBytes('inline-wasm'), 'application/wasm'),
    };
    model = { modelAssetBuffer: inlineBytes('inline-model') };
  } else {
    let FilesetResolver;
    ({ FilesetResolver, HandLandmarker } = await import('../mugunghwa/vendor/vision_bundle.mjs'));
    fileset = await FilesetResolver.forVisionTasks(new URL('../mugunghwa/vendor/wasm', import.meta.url).href);
    model = { modelAssetPath: new URL('./vendor/hand_landmarker.task', import.meta.url).href };
  }
  const options = (delegate) => ({
    baseOptions: { ...model, delegate },
    runningMode: 'VIDEO',
    numHands: 4, // 둘이서 할 때 손 넷까지
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  try {
    landmarker = await HandLandmarker.createFromOptions(fileset, options('GPU'));
  } catch {
    landmarker = await HandLandmarker.createFromOptions(fileset, options('CPU'));
  }
  return landmarker;
}

function detectHands(now) {
  if (!landmarker || video.readyState < 2 || video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;
  const v = videoView();
  if (!v) return;
  let res;
  try { res = landmarker.detectForVideo(video, now); } catch { return; }
  const found = (res?.landmarks || []).map((lm) => lm.map((p) => toScreen(p, v)));
  // 직전 손과 짝지어 빠르게 휘두른 길도 맞은 걸로 치게 한다
  hands = found.map((pts) => {
    const palm = { x: 0, y: 0 };
    for (const i of PALM_POINTS) { palm.x += pts[i].x / PALM_POINTS.length; palm.y += pts[i].y / PALM_POINTS.length; }
    let best = null, bestD = Infinity;
    for (const h of hands) {
      const d = Math.hypot(h.palm.x - palm.x, h.palm.y - palm.y);
      if (d < bestD) { bestD = d; best = h; }
    }
    // 한 번에 너무 멀리 뛴 건(인식 튐) 이어 보지 않는다
    const prev = best && bestD < unit * 0.35 && now - best.at < 150 ? best.palm : null;
    const zone = zoneAt(palm.x);
    if (zone >= 0 && players[zone]) players[zone].lastHand = now;
    return { pts, palm, prev, at: now, zone };
  });
}

// ---------- 풍선 · 폭탄 ----------
function pickWeighted(weights) {
  let n = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) { n -= weights[i]; if (n < 0) return i; }
  return weights.length - 1;
}

// 한 번 정한 풍선(폭탄)을 모든 구역에 같은 자리로 내보낸다 (둘이서 할 때 공평하게)
function spawn() {
  const t = game.elapsed / roundTime; // 0 → 1 로 갈수록 어려워진다
  const L = level();
  const roll = Math.random();
  const rel = Math.random(); // 구역 안 가로 위치 (0~1)
  let make;
  if (roll < L.bomb[0] + L.bomb[1] * t) {
    // 폭탄은 위에서 떨어진다. 클수록 많이 깎인다
    const size = BOMB_SIZES[(Math.random() * BOMB_SIZES.length) | 0];
    const vy = unit * (0.22 + 0.18 * t + Math.random() * 0.1) * L.speed;
    const vx = (Math.random() - 0.5) * unit * 0.08, spin = (Math.random() - 0.5) * 3;
    make = (z) => {
      const r = unit * size.r;
      return { type: 'bomb', r, points: size.points, x: z.x0 + r + rel * (z.x1 - z.x0 - 2 * r), y: -r * 2, vy, vx, spin, angle: 0, phase: rel * 6 };
    };
  } else {
    const isGold = roll > 1 - L.gold;
    const tier = isGold ? -1 : pickWeighted(L.sizes); // 0 = 가장 큰 풍선
    const size = isGold ? GOLD : BALLOON_SIZES[tier];
    // 작은 풍선일수록 빨리 올라간다
    const vy = -unit * (0.16 + 0.16 * t + Math.random() * 0.08) * (isGold ? 1.5 : 1 + tier * 0.1) * L.speed;
    const color = isGold ? '#ffd23f' : BALLOON_COLORS[(Math.random() * BALLOON_COLORS.length) | 0];
    const phase = Math.random() * 6, sway = unit * (0.02 + Math.random() * 0.03);
    make = (z) => {
      const r = unit * size.r;
      return { type: isGold ? 'gold' : 'balloon', points: size.points, tier, r, x: z.x0 + r + rel * (z.x1 - z.x0 - 2 * r), y: H + r * 1.5, vy, color, phase, sway };
    };
  }
  zones.forEach((z, p) => objects.push({ ...make(z), p }));
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy;
  let k = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
  k = Math.max(0, Math.min(1, k));
  return Math.hypot(px - (ax + dx * k), py - (ay + dy * k));
}

// 자기 구역 안에 있는 손만 자기 풍선을 터트릴 수 있다
function touched(o) {
  const reach = o.r + handRadius() * 0.8; // 동그라미가 풍선에 제법 겹쳐야 터진다
  for (const h of hands) {
    if (h.zone !== o.p) continue;
    const q = h.prev || h.palm;
    if (segDist(o.x, o.y, q.x, q.y, h.palm.x, h.palm.y) < reach) return true;
  }
  return false;
}
const handRadius = () => unit * level().hand;

// ---------- 점수판 ----------
const hudPlayer = (p) => document.querySelector(`.hud-player[data-p="${p}"]`);
function renderPlayer(p, effect) {
  const pl = players[p], el = hudPlayer(p);
  if (!pl || !el) return;
  const pill = el.querySelector('.score-pill');
  el.querySelector('.score').textContent = pl.score;
  if (effect) {
    pill.classList.remove('bump', 'hurt');
    void pill.offsetWidth;
    pill.classList.add(effect);
    if (effect === 'hurt') setTimeout(() => pill.classList.remove('hurt'), 600);
  }
  const combo = el.querySelector('.combo-pill');
  combo.hidden = pl.combo < 2;
  el.querySelector('.combo').textContent = pl.combo >= COMBO_BONUS_FROM ? `${pl.combo} 🔥` : pl.combo;
}

function addScore(p, n, x, y, color) {
  const pl = players[p];
  pl.score = Math.max(0, pl.score + n);
  texts.push({ x, y, text: n > 0 ? `+${n}` : `${n}`, color, life: 1, vy: -unit * 0.12, big: n < 0 || n >= 5 });
  renderPlayer(p, n < 0 ? 'hurt' : 'bump');
}

function pop(o) {
  const pl = players[o.p];
  if (game.elapsed - pl.lastPopAt < COMBO_WINDOW) pl.combo++; else pl.combo = 1;
  pl.lastPopAt = game.elapsed;
  pl.bestCombo = Math.max(pl.bestCombo, pl.combo);
  pl.popped++;
  const bonus = pl.combo >= COMBO_BONUS_FROM ? 1 : 0;
  addScore(o.p, o.points + bonus, o.x, o.y - o.r, o.type === 'gold' ? '#ffb800' : '#ffffff');
  playPop(o.type === 'gold' ? 1.8 : 0.85 + o.tier * 0.15); // 작은 풍선은 높은 소리
  // 조각
  const n = o.type === 'gold' ? 26 : 14;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = unit * (0.2 + Math.random() * 0.5);
    particles.push({
      x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: unit * 0.9,
      size: o.r * (0.12 + Math.random() * 0.15), color: o.type === 'gold' && i % 2 ? '#fff6b0' : o.color,
      life: 0.6 + Math.random() * 0.3, max: 0.9, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, shape: 'shard',
    });
  }
  particles.push({ x: o.x, y: o.y, ring: true, r: o.r, life: 0.3, max: 0.3, color: o.color });
}

function explode(o) {
  const pl = players[o.p];
  pl.combo = 0;
  pl.bombs++;
  pl.flash = 1;
  addScore(o.p, o.points, o.x, o.y - o.r, '#ff3b3b');
  playBoom();
  if (mode === 1) { app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake'); }
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2, sp = unit * (0.15 + Math.random() * 0.7);
    const fire = i < 26;
    particles.push({
      x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (fire ? 0 : unit * 0.1), g: fire ? unit * 0.3 : -unit * 0.05,
      size: o.r * (fire ? 0.15 + Math.random() * 0.25 : 0.4 + Math.random() * 0.4),
      color: fire ? ['#ffdd57', '#ff8c1a', '#ff3b1a'][i % 3] : 'rgba(70,70,80,0.5)',
      life: fire ? 0.5 + Math.random() * 0.4 : 0.9 + Math.random() * 0.5, max: 1.4, shape: fire ? 'dot' : 'smoke',
    });
  }
  particles.push({ x: o.x, y: o.y, ring: true, r: o.r * 1.5, life: 0.4, max: 0.4, color: '#ff8c1a', boom: true });
}

// ---------- 그리기 ----------
function drawBackground() {
  const v = videoView();
  if (v && video.readyState >= 2) {
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, v.dx, v.dy, v.w, v.h);
    ctx.restore();
    // 풍선이 잘 보이게 살짝 밝은 막을 씌운다
    ctx.fillStyle = 'rgba(200, 230, 255, 0.18)';
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8fd3ff'); g.addColorStop(1, '#e6f6ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

// 구역 밖은 어둡게, 구역 테두리와 1P·2P 표시
function drawZones() {
  if (mode === 1) {
    const z = zones[0];
    if (z.x0 > 0) {
      ctx.fillStyle = 'rgba(20, 15, 40, 0.55)';
      ctx.fillRect(0, 0, z.x0, H);
      ctx.fillRect(z.x1, 0, W - z.x1, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 4;
      ctx.setLineDash([16, 12]);
      ctx.beginPath();
      ctx.moveTo(z.x0, 0); ctx.lineTo(z.x0, H);
      ctx.moveTo(z.x1, 0); ctx.lineTo(z.x1, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    return;
  }
  zones.forEach((z, p) => {
    ctx.fillStyle = p === 0 ? 'rgba(255, 138, 61, 0.10)' : 'rgba(61, 139, 255, 0.10)';
    ctx.fillRect(z.x0, 0, z.x1 - z.x0, H);
    ctx.font = `900 ${Math.round(unit * 0.12)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = p === 0 ? 'rgba(255, 138, 61, 0.55)' : 'rgba(61, 139, 255, 0.55)';
    ctx.fillText(`${p + 1}P`, (z.x0 + z.x1) / 2, H - 12);
  });
  ctx.fillStyle = '#fff';
  ctx.fillRect(W / 2 - 3, 0, 6, H);
}

// 손이 안 보이는 구역에 안내
function drawNoHand(now) {
  if (game.state !== 'play') return;
  zones.forEach((z, p) => {
    if (now - players[p].lastHand < 1500) return;
    const text = mode === 2 ? `✋ ${p + 1}P 손을 보여 주세요!` : '✋ 카메라에 손을 보여 주세요!';
    const size = Math.round(Math.min(unit * 0.045, (z.x1 - z.x0) / text.length * 1.4));
    ctx.font = `800 ${size}px system-ui, sans-serif`;
    const w = ctx.measureText(text).width + size * 1.6, cx = (z.x0 + z.x1) / 2, cy = H - unit * 0.2;
    ctx.fillStyle = 'rgba(36, 31, 51, 0.85)';
    ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - size, w, size * 2, size); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
  });
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
}

function drawBalloon(o, time) {
  const { x, y, r } = o;
  const ry = r * 1.18;
  // 줄
  ctx.strokeStyle = 'rgba(80, 80, 90, 0.7)';
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  ctx.beginPath();
  ctx.moveTo(x, y + ry + r * 0.12);
  for (let i = 1; i <= 6; i++) {
    const yy = y + ry + r * 0.12 + i * r * 0.28;
    ctx.lineTo(x + Math.sin(time * 4 + o.phase + i) * r * 0.1, yy);
  }
  ctx.stroke();
  // 매듭
  ctx.fillStyle = shade(o.color, -40);
  ctx.beginPath();
  ctx.moveTo(x, y + ry - 2);
  ctx.lineTo(x - r * 0.13, y + ry + r * 0.15);
  ctx.lineTo(x + r * 0.13, y + ry + r * 0.15);
  ctx.closePath();
  ctx.fill();
  // 몸통
  const g = ctx.createRadialGradient(x - r * 0.35, y - ry * 0.4, r * 0.1, x, y, ry * 1.1);
  g.addColorStop(0, shade(o.color, 70));
  g.addColorStop(0.5, o.color);
  g.addColorStop(1, shade(o.color, -60));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  // 반짝
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.38, y - ry * 0.42, r * 0.16, r * 0.3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // 점수 숫자
  const label = String(o.points);
  ctx.font = `900 ${Math.round(r * (label.length > 1 ? 0.7 : 0.85))}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.strokeStyle = 'rgba(40, 20, 60, 0.45)';
  ctx.strokeText(label, x, y + r * 0.05);
  ctx.fillStyle = o.type === 'gold' ? `rgba(255,255,255,${0.7 + 0.3 * Math.sin(time * 8)})` : '#fff';
  ctx.fillText(label, x, y + r * 0.05);
}

function drawBomb(o, time) {
  const { x, y, r } = o;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(o.angle);
  // 위험 빛
  const pulse = 0.5 + 0.5 * Math.sin(time * 10 + o.phase);
  ctx.fillStyle = `rgba(255, 40, 40, ${0.15 + 0.2 * pulse})`;
  ctx.beginPath(); ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2); ctx.fill();
  // 몸통
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#6b6b78'); g.addColorStop(1, '#14141a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  // 뚜껑
  ctx.fillStyle = '#3a3a44';
  ctx.fillRect(-r * 0.25, -r * 1.15, r * 0.5, r * 0.3);
  // 심지
  ctx.strokeStyle = '#c99a5b';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.15);
  ctx.quadraticCurveTo(r * 0.3, -r * 1.5, r * 0.5, -r * 1.4);
  ctx.stroke();
  // 불꽃
  const sx = r * 0.5, sy = -r * 1.4;
  ctx.fillStyle = pulse > 0.5 ? '#ffdd57' : '#ff8c1a';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const rr = (i % 2 ? 0.12 : 0.28) * r * (0.8 + 0.4 * pulse);
    ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
  // 깎이는 점수
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.rotate(-o.angle); // 숫자는 똑바로
  ctx.font = `900 ${Math.round(r * 0.75)}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff6b6b';
  ctx.fillText(String(o.points), 0, r * 0.08);
  ctx.restore();
}

function drawHands() {
  const r = handRadius();
  for (const h of hands) {
    const active = h.zone >= 0;
    // 손 뼈대는 흐리게 (어디가 손인지만 보이게)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [a, b] of HAND_BONES) {
      ctx.moveTo(h.pts[a].x, h.pts[a].y);
      ctx.lineTo(h.pts[b].x, h.pts[b].y);
    }
    ctx.stroke();
    // 실제로 풍선을 터트리는 동그라미 (구역 밖이면 흐린 회색 = 못 터트림)
    const { x, y } = h.palm;
    ctx.globalAlpha = active ? 1 : 0.45;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, active ? 'rgba(120,190,255,0.35)' : 'rgba(150,150,150,0.35)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = !active ? 'rgba(200,200,200,0.9)' : mode === 2 ? PLAYER_COLORS[h.zone] : 'rgba(255,255,255,0.95)';
    ctx.lineWidth = mode === 2 ? 6 : 4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(40,30,70,0.8)';
    ctx.font = `${Math.round(r * 0.9)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✋', x, y + r * 0.05);
    ctx.globalAlpha = 1;
  }
}

function drawParticles(dt) {
  for (const p of particles) {
    p.life -= dt;
    const a = Math.max(0, p.life / p.max);
    if (p.ring) {
      const k = 1 - p.life / p.max;
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = a;
      ctx.lineWidth = p.boom ? 10 : 4;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k * (p.boom ? 3 : 1.2)), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }
    p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    ctx.globalAlpha = Math.min(1, a * 1.5);
    ctx.fillStyle = p.color;
    if (p.shape === 'shard') {
      p.rot += p.vr * dt;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      ctx.restore();
    } else {
      const s = p.shape === 'smoke' ? p.size * (1.5 - a * 0.5) : p.size;
      ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  particles = particles.filter((p) => p.life > 0);
}

function drawTexts(dt) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of texts) {
    t.life -= dt * 1.1;
    t.y += t.vy * dt;
    const size = Math.round(unit * (t.big ? 0.09 : 0.06));
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    ctx.globalAlpha = Math.max(0, Math.min(1, t.life * 2));
    ctx.lineWidth = size * 0.14;
    ctx.strokeStyle = 'rgba(30, 20, 50, 0.8)';
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
    ctx.globalAlpha = 1;
  }
  texts = texts.filter((t) => t.life > 0);
}

// ---------- 게임 진행 ----------
function update(dt, time) {
  game.elapsed += dt;
  game.timeLeft = Math.max(0, roundTime - game.elapsed);
  $('time').textContent = Math.ceil(game.timeLeft);
  $('time').parentElement.classList.toggle('hurt', game.timeLeft <= 10);
  music.tempo = game.timeLeft <= 10 ? 160 : 132; // 마지막 10초는 음악이 빨라진다

  // 새로 나오기: 시간이 갈수록 자주
  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    spawn();
    const t = game.elapsed / roundTime;
    game.spawnIn = (0.85 - 0.45 * t) * (0.7 + Math.random() * 0.6) * level().spawn;
  }

  for (const o of objects) {
    const z = zones[o.p];
    if (o.type === 'bomb') {
      o.y += o.vy * dt;
      o.x += o.vx * dt;
      o.angle += o.spin * dt;
      if (o.x < z.x0 + o.r || o.x > z.x1 - o.r) o.vx *= -1;
    } else {
      o.y += o.vy * dt;
      o.x += Math.cos(time * 1.5 + o.phase) * o.sway * dt;
    }
    o.x = Math.max(z.x0 + o.r, Math.min(z.x1 - o.r, o.x)); // 자기 구역 밖으로 안 나간다
    if (!o.dead && touched(o)) {
      o.dead = true;
      if (o.type === 'bomb') explode(o); else pop(o);
    }
  }
  objects = objects.filter((o) => !o.dead && o.y > -o.r * 4 && o.y < H + o.r * 4);

  players.forEach((pl, p) => {
    if (pl.combo && game.elapsed - pl.lastPopAt > COMBO_WINDOW) { pl.combo = 0; renderPlayer(p); }
  });

  if (game.timeLeft <= 0) endGame();
}

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const time = now / 1000;
  detectHands(now);
  if (hands.length && now - hands[0].at > 300) hands = []; // 손이 사라졌으면 지운다

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBackground();
  if (game.state !== 'home') drawZones();
  if (game.state === 'play') update(dt, time);
  // 풍선은 자기 구역 안에만 그린다
  zones.forEach((z, p) => {
    ctx.save();
    ctx.beginPath(); ctx.rect(z.x0, 0, z.x1 - z.x0, H); ctx.clip();
    for (const o of objects) if (o.p === p) (o.type === 'bomb' ? drawBomb : drawBalloon)(o, time);
    const pl = players[p];
    if (pl?.flash > 0) {
      ctx.fillStyle = `rgba(255, 30, 30, ${pl.flash * 0.35})`;
      ctx.fillRect(z.x0, 0, z.x1 - z.x0, H);
      pl.flash = Math.max(0, pl.flash - dt * 2.5);
    }
    ctx.restore();
  });
  drawParticles(dt);
  drawHands();
  drawTexts(dt);
  drawNoHand(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- 화면 전환 ----------
function show(id) {
  for (const s of ['screen-home', 'screen-result']) $(s).hidden = s !== id;
}

function resetGame() {
  layoutZones();
  Object.assign(game, { timeLeft: roundTime, elapsed: 0, spawnIn: 0.3 });
  players = zones.map(newPlayer);
  objects = []; particles = []; texts = [];
  $('time').textContent = roundTime;
  $('time').parentElement.classList.remove('hurt');
  $('hud').classList.toggle('two', mode === 2);
  hudPlayer(1).hidden = mode !== 2;
  for (let p = 0; p < 2; p++) {
    const pill = hudPlayer(p).querySelector('.score-pill');
    pill.classList.toggle('p0', mode === 2 && p === 0);
    pill.classList.toggle('p1', mode === 2 && p === 1);
    pill.querySelector('.tag').textContent = mode === 2 ? `${p + 1}P` : '점수';
  }
  players.forEach((_, p) => renderPlayer(p));
}

async function countdown() {
  game.state = 'countdown';
  const el = $('countdown');
  el.hidden = false;
  for (const n of ['3', '2', '1', '시작!']) {
    el.textContent = n;
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    playBeep(n === '시작!' ? 880 : 440, n === '시작!' ? 0.3 : 0.15);
    await new Promise((r) => setTimeout(r, n === '시작!' ? 600 : 900));
    if (game.state !== 'countdown') break;
  }
  el.hidden = true;
}

async function startGame() {
  show(null);
  resetGame();
  $('hud').hidden = false;
  renderMusic();
  await countdown();
  if (game.state !== 'countdown') return;
  const now = performance.now();
  players.forEach((pl) => { pl.lastHand = now; });
  game.state = 'play';
  startMusic();
}

function endGame() {
  game.state = 'over';
  stopMusic();
  playFanfare();
  $('hud').hidden = true;
  if (mode === 2) {
    const [a, b] = players;
    const win = a.score === b.score ? -1 : a.score > b.score ? 0 : 1;
    $('result-emoji').textContent = win < 0 ? '🤝' : '🏆';
    $('result-title').textContent = win < 0 ? '비겼어요!' : `${win + 1}P 승리!`;
    $('final-score').textContent = `${a.score} : ${b.score}`;
    $('final-unit').hidden = true;
    $('result-detail').textContent = players
      .map((pl, p) => `${p + 1}P 풍선 ${pl.popped}개 · 폭탄 ${pl.bombs}번`).join('  /  ');
  } else {
    const pl = players[0];
    const best = Number(store.get(bestKey(), '0')) || 0;
    const isBest = pl.score > best;
    if (isBest) store.set(bestKey(), String(pl.score));
    $('final-score').textContent = pl.score;
    $('final-unit').hidden = false;
    $('result-emoji').textContent = isBest ? '🏆' : pl.score >= 30 ? '🎉' : '🎈';
    $('result-title').textContent = isBest ? '최고 기록!' : '끝!';
    $('result-detail').textContent =
      `${level().name} · 풍선 ${pl.popped}개 터트림 · 최대 콤보 ${pl.bestCombo} · 폭탄 ${pl.bombs}번 맞음`;
  }
  show('screen-result');
  updateBest();
}

function quitGame() {
  game.state = 'home';
  stopMusic();
  $('countdown').hidden = true;
  $('hud').hidden = true;
  objects = [];
  show('screen-home');
}

function bestKey() { return `balloon.best.${levelKey}`; }
function updateBest() {
  const best = Number(store.get(bestKey(), '0')) || 0;
  $('best-line').textContent = mode === 1 && best ? `🏅 ${level().name} 최고 점수 ${best}점` : '';
}

// ---------- 설정 버튼 ----------
function radioGroup(attr, isOn, onPick) {
  const buttons = document.querySelectorAll(`[data-${attr}]`);
  const render = () => { for (const b of buttons) b.setAttribute('aria-checked', String(isOn(b.dataset[attr]))); };
  for (const b of buttons) b.addEventListener('click', () => { onPick(b.dataset[attr]); render(); });
  render();
  return render;
}
radioGroup('time', (v) => Number(v) === roundTime, (v) => { roundTime = Number(v); store.set('balloon.time', v); });
radioGroup('level', (v) => v === levelKey, (v) => {
  levelKey = v; store.set('balloon.level', v);
  $('level-hint').textContent = level().hint; updateBest();
});
radioGroup('mode', (v) => Number(v) === mode, (v) => {
  mode = Number(v); store.set('balloon.mode', v);
  $('mode-hint').textContent = MODE_HINTS[mode]; updateBest();
});
const renderMusicRadio = radioGroup('music', (v) => (v === 'on') === musicOn, (v) => setMusic(v === 'on'));
$('level-hint').textContent = level().hint;
$('mode-hint').textContent = MODE_HINTS[mode];
updateBest();

function renderMusic() {
  $('music-btn').classList.toggle('off', !musicOn);
  renderMusicRadio();
}
function setMusic(on) {
  musicOn = on;
  store.set('balloon.music', on ? 'on' : 'off');
  if (!on) stopMusic(); else if (game.state === 'play') startMusic();
  renderMusic();
}
$('music-btn').addEventListener('click', () => { initAudio(); setMusic(!musicOn); });

const status = $('status');
$('start').addEventListener('click', async () => {
  initAudio();
  const btn = $('start');
  btn.disabled = true;
  status.classList.remove('error');
  try {
    status.textContent = '📷 카메라를 켜는 중…';
    await startCamera();
    status.textContent = '✋ 손 인식 준비 중… (처음엔 몇 초 걸려요)';
    await loadHands();
    status.textContent = '';
    startGame();
  } catch (e) {
    status.classList.add('error');
    status.textContent = e?.message || '시작하지 못했어요. 새로고침 후 다시 해 주세요.';
  } finally {
    btn.disabled = false;
  }
});
$('again').addEventListener('click', () => { initAudio(); startGame(); });
$('home').addEventListener('click', quitGame);
$('quit').addEventListener('click', quitGame);
