// 풍선 터트리기: 카메라로 손을 찾고, 손이 풍선에 닿으면 터진다. 폭탄에 닿으면 점수가 깎인다.
// 손 인식은 구글 MediaPipe 손 인식 모델을 이 기기 안에서 돌린다 (영상은 어디로도 보내지 않는다).
// 인식 엔진(vision_bundle.mjs, wasm)은 무궁화 게임 폴더에 있는 것을 같이 쓰고,
// 손 모델(hand_landmarker.task)만 이 폴더의 vendor/ 에 따로 둔다.

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const ctx = canvas.getContext('2d');
const video = $('cam');
const app = $('app');

// ---------- 게임 규칙 ----------
const POINTS = { balloon: 1, small: 2, gold: 5, bomb: -5 };
const COMBO_WINDOW = 1.5; // 이 시간(초) 안에 다음 풍선을 터트리면 콤보가 이어진다
const COMBO_BONUS_FROM = 5; // 콤보가 이만큼 넘으면 풍선마다 +1점 더
const BALLOON_COLORS = ['#ff4f6d', '#ff9f1c', '#ffd93d', '#3ddc84', '#38b6ff', '#9b5cff', '#ff6ec7'];
// 손바닥 가운데를 잡는 점: 손목과 네 손가락 뿌리
const PALM_POINTS = [0, 5, 9, 13, 17];
// 난이도. hand = 손 동그라미 크기(화면 짧은 쪽 대비), 풍선 반지름(보통 0.09, 작은 0.062)보다 조금 작게
const LEVELS = {
  easy: {
    name: '쉬움', hint: '천천히 올라오고 폭탄이 적어요',
    hand: 0.065, speed: 0.75, spawn: 1.25, bomb: [0.08, 0.08], small: 0.15, gold: 0.06,
  },
  normal: {
    name: '보통', hint: '보통 속도, 폭탄도 보통이에요',
    hand: 0.05, speed: 1, spawn: 1, bomb: [0.12, 0.13], small: 0.25, gold: 0.05,
  },
  hard: {
    name: '어려움', hint: '빠르고, 폭탄과 작은 풍선이 많아요. 손 동그라미도 작아요',
    hand: 0.038, speed: 1.35, spawn: 0.8, bomb: [0.18, 0.17], small: 0.4, gold: 0.04,
  },
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
const level = () => LEVELS[levelKey];

// ---------- 상태 ----------
let W = 0, H = 0, DPR = 1, unit = 1;
let hands = []; // [{ pts: [{x,y}...21], prev: [...], r }]
let lastHandSeen = 0;
let landmarker = null;
let lastVideoTime = -1;
let objects = [];
let particles = [];
let texts = [];
let flash = 0; // 폭탄 맞았을 때 화면 붉게
const game = {
  state: 'home', // home | countdown | play | over
  score: 0, timeLeft: 0, elapsed: 0, spawnIn: 0,
  combo: 0, lastPopAt: -99, bestCombo: 0,
  popped: 0, bombs: 0,
};

// ---------- 화면 크기 ----------
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  unit = Math.min(W, H);
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
    numHands: 2,
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
  const next = found.map((pts) => {
    let best = null, bestD = Infinity;
    for (const h of hands) {
      const d = Math.hypot(h.palm.x - pts[9].x, h.palm.y - pts[9].y);
      if (d < bestD) { bestD = d; best = h; }
    }
    const palm = { x: 0, y: 0 };
    for (const i of PALM_POINTS) { palm.x += pts[i].x / PALM_POINTS.length; palm.y += pts[i].y / PALM_POINTS.length; }
    // 빠르게 움직인 길도 치되, 한 번에 너무 멀리 뛴 건(인식 튐) 무시한다
    const prev = best && Math.hypot(best.palm.x - palm.x, best.palm.y - palm.y) < unit * 0.35 && now - best.at < 150 ? best.palm : null;
    return { pts, palm, prev, at: now };
  });
  hands = next;
  if (hands.length) lastHandSeen = now;
}

// ---------- 풍선 · 폭탄 ----------
function spawn() {
  const t = game.elapsed / roundTime; // 0 → 1 로 갈수록 어려워진다
  const L = level();
  const bombChance = L.bomb[0] + L.bomb[1] * t;
  const roll = Math.random();
  if (roll < bombChance) {
    // 폭탄은 위에서 떨어진다
    const r = unit * 0.055;
    objects.push({
      type: 'bomb', r, x: r + Math.random() * (W - 2 * r), y: -r * 2,
      vy: unit * (0.22 + 0.18 * t + Math.random() * 0.1) * L.speed, vx: (Math.random() - 0.5) * unit * 0.08,
      spin: (Math.random() - 0.5) * 3, angle: 0, phase: Math.random() * 6,
    });
    return;
  }
  const isGold = roll > 1 - L.gold;
  const isSmall = !isGold && Math.random() < L.small;
  const r = unit * (isSmall ? 0.062 : 0.09) * (0.9 + Math.random() * 0.2);
  objects.push({
    type: isGold ? 'gold' : isSmall ? 'small' : 'balloon',
    r, x: r + Math.random() * (W - 2 * r), y: H + r * 1.5,
    vy: -unit * (0.16 + 0.16 * t + Math.random() * 0.08) * (isSmall ? 1.25 : 1) * (isGold ? 1.4 : 1) * L.speed,
    color: isGold ? '#ffd23f' : BALLOON_COLORS[(Math.random() * BALLOON_COLORS.length) | 0],
    phase: Math.random() * 6, sway: unit * (0.02 + Math.random() * 0.03),
  });
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy;
  let k = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
  k = Math.max(0, Math.min(1, k));
  return Math.hypot(px - (ax + dx * k), py - (ay + dy * k));
}

function touched(o) {
  const reach = o.r + handRadius() * 0.8; // 동그라미가 풍선에 제법 겹쳐야 터진다
  for (const h of hands) {
    const q = h.prev || h.palm;
    if (segDist(o.x, o.y, q.x, q.y, h.palm.x, h.palm.y) < reach) return true;
  }
  return false;
}
const handRadius = () => unit * level().hand;

function addScore(n, x, y, color) {
  const before = game.score;
  game.score = Math.max(0, game.score + n);
  texts.push({ x, y, text: n > 0 ? `+${n}` : `${n}`, color, life: 1, vy: -unit * 0.12, big: n < 0 || n >= 5 });
  const pill = $('score').parentElement;
  pill.classList.remove('bump', 'hurt');
  void pill.offsetWidth;
  pill.classList.add(game.score >= before ? 'bump' : 'hurt');
  if (game.score < before || n < 0) setTimeout(() => pill.classList.remove('hurt'), 600);
  $('score').textContent = game.score;
}

function pop(o) {
  // 콤보
  if (game.elapsed - game.lastPopAt < COMBO_WINDOW) game.combo++; else game.combo = 1;
  game.lastPopAt = game.elapsed;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.popped++;
  const bonus = game.combo >= COMBO_BONUS_FROM ? 1 : 0;
  addScore(POINTS[o.type] + bonus, o.x, o.y - o.r, o.type === 'gold' ? '#ffb800' : '#ffffff');
  playPop(o.type === 'small' ? 1.4 : o.type === 'gold' ? 1.8 : 0.9 + Math.random() * 0.3);
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
  updateCombo();
}

function explode(o) {
  game.combo = 0;
  game.bombs++;
  addScore(POINTS.bomb, o.x, o.y - o.r, '#ff3b3b');
  playBoom();
  flash = 1;
  app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake');
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
  updateCombo();
}

function updateCombo() {
  const pill = $('combo-pill');
  pill.hidden = game.combo < 2;
  $('combo').textContent = game.combo >= COMBO_BONUS_FROM ? `${game.combo} 🔥` : game.combo;
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
  if (o.type === 'gold') {
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(r * 0.8)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 8);
    ctx.fillText('★', x, y + r * 0.05);
    ctx.globalAlpha = 1;
  }
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
  // 해골 표시
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `${Math.round(r * 0.8)}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('☠', 0, r * 0.08);
  ctx.restore();
}

function drawHands() {
  const r = handRadius();
  for (const h of hands) {
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
    // 실제로 풍선을 터트리는 동그라미
    const { x, y } = h.palm;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(120,190,255,0.35)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(40,30,70,0.8)';
    ctx.font = `${Math.round(r * 0.9)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✋', x, y + r * 0.05);
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
  const timePill = $('time').parentElement;
  timePill.classList.toggle('hurt', game.timeLeft <= 5);

  // 새로 나오기: 시간이 갈수록 자주
  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    spawn();
    const t = game.elapsed / roundTime;
    game.spawnIn = (0.85 - 0.45 * t) * (0.7 + Math.random() * 0.6) * level().spawn;
  }

  for (const o of objects) {
    if (o.type === 'bomb') {
      o.y += o.vy * dt;
      o.x += o.vx * dt;
      o.angle += o.spin * dt;
      if (o.x < o.r || o.x > W - o.r) o.vx *= -1;
    } else {
      o.y += o.vy * dt;
      o.x += Math.cos(time * 1.5 + o.phase) * o.sway * dt;
    }
    if (!o.dead && touched(o)) {
      o.dead = true;
      if (o.type === 'bomb') explode(o); else pop(o);
    }
  }
  objects = objects.filter((o) => !o.dead && o.y > -o.r * 4 && o.y < H + o.r * 4);

  if (game.combo && game.elapsed - game.lastPopAt > COMBO_WINDOW) { game.combo = 0; updateCombo(); }

  $('no-hand').hidden = performance.now() - lastHandSeen < 1500;

  if (game.timeLeft <= 0) endGame();
}

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const time = now / 1000;
  detectHands(now);
  if (now - (hands[0]?.at ?? 0) > 300) hands = []; // 손이 사라졌으면 지운다

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBackground();
  if (game.state === 'play') update(dt, time);
  for (const o of objects) (o.type === 'bomb' ? drawBomb : drawBalloon)(o, time);
  drawParticles(dt);
  drawHands();
  drawTexts(dt);
  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 30, 30, ${flash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
    flash = Math.max(0, flash - dt * 2.5);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- 화면 전환 ----------
function show(id) {
  for (const s of ['screen-home', 'screen-result']) $(s).hidden = s !== id;
}

function resetGame() {
  Object.assign(game, {
    score: 0, timeLeft: roundTime, elapsed: 0, spawnIn: 0.3,
    combo: 0, lastPopAt: -99, bestCombo: 0, popped: 0, bombs: 0,
  });
  objects = []; particles = []; texts = [];
  $('score').textContent = '0';
  $('time').textContent = roundTime;
  updateCombo();
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
  lastHandSeen = performance.now();
  await countdown();
  if (game.state !== 'countdown') return;
  game.state = 'play';
}

function endGame() {
  game.state = 'over';
  $('hud').hidden = true;
  $('no-hand').hidden = true;
  const best = Number(store.get(bestKey(), '0')) || 0;
  const isBest = game.score > best;
  if (isBest) store.set(bestKey(), String(game.score));
  $('final-score').textContent = game.score;
  $('result-emoji').textContent = isBest ? '🏆' : game.score >= 30 ? '🎉' : '🎈';
  $('result-title').textContent = isBest ? '최고 기록!' : '끝!';
  $('result-detail').textContent =
    `${level().name} · 풍선 ${game.popped}개 터트림 · 최대 콤보 ${game.bestCombo} · 폭탄 ${game.bombs}번 맞음`;
  show('screen-result');
  updateBest();
}

function quitGame() {
  game.state = 'home';
  $('countdown').hidden = true;
  $('hud').hidden = true;
  $('no-hand').hidden = true;
  objects = [];
  show('screen-home');
}

function bestKey() { return `balloon.best.${levelKey}`; }
function updateBest() {
  const best = Number(store.get(bestKey(), '0')) || 0;
  $('best-line').textContent = best ? `🏅 ${level().name} 최고 점수 ${best}점` : '';
}

// ---------- 버튼 ----------
const timeButtons = document.querySelectorAll('[data-time]');
function renderTime() {
  for (const b of timeButtons) b.setAttribute('aria-checked', String(Number(b.dataset.time) === roundTime));
}
for (const b of timeButtons) {
  b.addEventListener('click', () => {
    roundTime = Number(b.dataset.time);
    store.set('balloon.time', String(roundTime));
    renderTime();
  });
}
renderTime();

const levelButtons = document.querySelectorAll('[data-level]');
function renderLevel() {
  for (const b of levelButtons) b.setAttribute('aria-checked', String(b.dataset.level === levelKey));
  $('level-hint').textContent = level().hint;
  updateBest();
}
for (const b of levelButtons) {
  b.addEventListener('click', () => {
    levelKey = b.dataset.level;
    store.set('balloon.level', levelKey);
    renderLevel();
  });
}
renderLevel();

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
