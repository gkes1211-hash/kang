import { MotionSensor } from './motion.js';
import { PoseSensor, BONES } from './pose.js';
import { Game, CHANT, PROFILES } from './game.js';

const $ = (sel) => document.querySelector(sel);
const SAMPLE_INTERVAL = 1 / 15; // 1초에 15번 움직임을 잰다 (기기 속도와 상관없이 같은 기준)
const RUNNERS = ['🐰', '🐻'];
const COLORS = ['#ff8a3d', '#3d8bff'];
const DEBUG = new URLSearchParams(location.search).has('debug');

// ---------- 설정 (이 기기에만 저장) ----------
const DEFAULTS = { players: '1', difficulty: 'normal', voice: 'on' };
const settings = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem('mugunghwa-settings') || '{}');
  for (const k of Object.keys(DEFAULTS)) if (saved[k]) settings[k] = String(saved[k]);
} catch { /* 저장소를 못 쓰면 기본값으로 */ }

function saveSettings() {
  try { localStorage.setItem('mugunghwa-settings', JSON.stringify(settings)); } catch { /* 무시 */ }
}

function renderSettings() {
  document.querySelectorAll('.choices').forEach((group) => {
    const key = group.dataset.setting;
    group.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.value === settings[key]));
    });
  });
  $('#players-hint').textContent = settings.players === '2'
    ? '1P는 화면 왼쪽, 2P는 화면 오른쪽에 서요.'
    : '카메라 앞, 몸이 다 보이게 서요.';
}

document.querySelectorAll('.choices').forEach((group) => {
  group.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    settings[group.dataset.setting] = b.dataset.value;
    saveSettings();
    renderSettings();
  });
});
renderSettings();

// ---------- 소리 ----------
let audioCtx = null;
function beep(freqs, dur = 0.15, type = 'square', gap = 0.02) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    let t = audioCtx.currentTime;
    for (const f of freqs) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(f ? 0.12 : 0, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + dur);
      t += dur + gap;
    }
  } catch { /* 소리 없이도 게임은 된다 */ }
}

// 술래 목소리: 기기 안에 설치된 한국어 목소리만 쓴다 (localService).
let koVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('ko'));
  koVoice = voices.find((v) => v.localService) || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

function say(text, rate = 1) {
  if (settings.voice !== 'on' || !koVoice) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = koVoice;
    u.lang = koVoice.lang;
    u.rate = rate;
    u.pitch = 1.1;
    speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

function stopVoice() {
  try { speechSynthesis.cancel(); } catch { /* 무시 */ }
}

// ---------- 화면 전환 ----------
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

function showError(msg) {
  const el = $('#error');
  el.textContent = msg;
  el.hidden = !msg;
}

// ---------- 몸 인식 엔진 미리 불러오기 ----------
// 시작 버튼을 누르기 전에 미리 받아 두면 시작이 빨라진다. (이 앱 폴더의 파일만 받는다)
let poseReady = null;
function preloadPose() {
  if (!poseReady) {
    poseReady = PoseSensor.load().then(() => true, (err) => {
      console.warn('몸 인식을 켜지 못함', err);
      poseReady = null;
      return false;
    });
  }
  return poseReady;
}
window.addEventListener('load', () => setTimeout(preloadPose, 300));

// ---------- 게임 ----------
const video = $('#cam');
const overlay = $('#skeleton');
const octx = overlay.getContext('2d');
let stream = null;
let game = null;
let sensor = null; // PoseSensor 또는 MotionSensor
let mode = 'pose';
let lanes = [];
let timer = 0;
let lastTime = 0;
let sampleAcc = 0;
let wakeLock = null;
let lastSample = null;

function buildLanes(count) {
  const box = $('#lanes');
  box.textContent = '';
  lanes = [];
  for (let i = 0; i < count; i++) {
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.style.setProperty('--player-color', COLORS[i]);
    lane.innerHTML = `
      <div class="track"><div class="track-fill"></div></div>
      <div class="runner">${RUNNERS[i]}</div>
      <div class="meter" title="움직임"><div class="meter-fill"></div></div>
      <div class="lane-label">${count === 1 ? '나' : `${i + 1}P`}</div>
      <div class="lane-status" hidden></div>
      <div class="lane-debug" ${DEBUG ? '' : 'hidden'}></div>`;
    box.appendChild(lane);
    lanes.push({
      root: lane,
      fill: lane.querySelector('.track-fill'),
      runner: lane.querySelector('.runner'),
      meter: lane.querySelector('.meter-fill'),
      status: lane.querySelector('.lane-status'),
      debug: lane.querySelector('.lane-debug'),
      statusTimer: 0,
    });
  }
  $('#screen-game').classList.toggle('two', count === 2);
}

function setStatus(lane, text, kind = 'bad', seconds = 0) {
  lane.status.textContent = text;
  lane.status.dataset.kind = kind;
  lane.status.hidden = !text;
  lane.statusTimer = seconds;
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('이 브라우저에서는 카메라를 쓸 수 없어요. 크롬이나 사파리 최신 버전에서 열어 주세요.');
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  } catch (err) {
    if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
      throw new Error('카메라를 쓸 수 있게 허락해 주세요. 주소창 옆 카메라 아이콘에서 "허용"을 누르면 돼요.');
    }
    if (err && (err.name === 'NotFoundError' || err.name === 'OverconstrainedError')) {
      throw new Error('카메라를 찾지 못했어요. 카메라가 달린 기기에서 해 주세요.');
    }
    throw new Error('카메라를 켜지 못했어요. 다른 앱이 카메라를 쓰고 있으면 끄고 다시 해 주세요.');
  }
}

function closeCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
}

let starting = false;
async function startGame() {
  if (starting) return;
  starting = true;
  showError('');
  const btn = $('#start');
  btn.disabled = true;
  try {
    if (!stream) {
      stream = await openCamera();
      video.srcObject = stream;
      await video.play().catch(() => {});
    }
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
    starting = false;
    return;
  }
  btn.disabled = false;
  beep([0]); // 사용자 터치 안에서 소리 장치를 깨워 둔다
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { wakeLock = null; }

  const players = Number(settings.players) === 2 ? 2 : 1;
  buildLanes(players);
  $('#result').hidden = true;
  show('screen-game');
  resizeOverlay();

  // 몸 인식 엔진 준비 (처음 한 번은 몇 초 걸릴 수 있음)
  $('#center-msg').innerHTML = '술래가 눈을 뜨는 중…<span class="sub-msg">처음 한 번은 조금 걸려요</span>';
  const ok = await Promise.race([preloadPose(), new Promise((r) => setTimeout(() => r(false), 45000))]);
  if (!$('#screen-game').classList.contains('active')) { starting = false; return; } // 기다리는 사이 그만하기
  if (ok) {
    mode = 'pose';
    sensor = await new PoseSensor(video, players).init();
  } else {
    // 몸 인식을 못 켜는 기기: 화면 움직임으로 대신한다
    mode = 'pixel';
    sensor = new MotionSensor(video);
  }
  $('#screen-game').dataset.mode = mode;
  sensor.reset();
  game = new Game({ players, difficulty: settings.difficulty, profile: mode });
  handleEvents();
  lastTime = performance.now();
  sampleAcc = 0;
  clearInterval(timer);
  // 화면 새로고침 속도와 상관없이 일정하게 돌도록 타이머로 돌린다
  timer = setInterval(() => loop(performance.now()), 1000 / 30);
  starting = false;
}

function stopGame() {
  clearInterval(timer);
  timer = 0;
  game = null;
  lastSample = null;
  stopVoice();
  try { wakeLock?.release(); } catch { /* 무시 */ }
  wakeLock = null;
}

function readSensor(dt) {
  if (mode === 'pose') {
    const res = sensor.sample(dt);
    if (!res) return null;
    return { motions: res.map((r) => r.motion), present: res.map((r) => r.present), people: res };
  }
  const m = sensor.sample();
  if (!m) return null;
  const motions = game.players.length === 2 ? [m.left, m.right] : [m.all];
  // 예비 방식에서는 "자기 자리에서 손을 흔들면" 찾은 것으로 친다
  const present = motions.map((v) => (game.phase === 'find' ? v > 0.015 : true));
  return { motions, present, people: null };
}

function loop(now) {
  const dt = Math.min(0.25, (now - lastTime) / 1000);
  lastTime = now;
  if (!game) return;
  sampleAcc += dt;
  if (sampleAcc >= SAMPLE_INTERVAL) {
    let s = null;
    try { s = readSensor(sampleAcc); } catch (err) { console.warn(err); }
    if (s) {
      lastSample = s;
      game.update(sampleAcc, s.motions, s.present);
      handleEvents();
    }
    sampleAcc = 0;
  }
  render(dt);
}

function handleEvents() {
  if (!game) return;
  for (const ev of game.takeEvents()) {
    if (ev.type === 'phase') {
      if (ev.phase === 'find') {
        say(game.players.length === 2 ? '두 사람 다 카메라 앞에 서 주세요' : '카메라 앞에 서 주세요', 1.05);
      } else if (ev.phase === 'calibrate') {
        say('좋아요! 잠깐 가만히 있어요', 1.1);
      } else if (ev.phase === 'go') {
        // 노래 길이에 맞춰 말 빠르기를 조절한다 (보통 빠르기로 약 2.2초)
        const rate = Math.min(1.8, Math.max(0.6, 2.2 / Math.max(1, ev.length - 0.3)));
        if (!say(CHANT, rate)) beep([523, 587, 659], 0.08, 'triangle');
      } else if (ev.phase === 'freeze') {
        stopVoice();
        if (!say('얼음!', 1.1)) beep([880, 880], 0.12);
      }
    } else if (ev.type === 'found') {
      const lane = lanes[ev.player - 1];
      if (lane) setStatus(lane, '찾았다! ✅', 'ok', 1.5);
      beep([660, 990], 0.1, 'triangle');
      if (!game.players.every((p) => p.found)) say('찾았다!', 1.1);
    } else if (ev.type === 'caught') {
      const lane = lanes[ev.player - 1];
      if (lane) {
        setStatus(lane, '걸렸다! 뒤로~', 'bad', 1.6);
        lane.root.classList.remove('flash');
        void lane.root.offsetWidth;
        lane.root.classList.add('flash');
        lane.runner.classList.add('caught');
        setTimeout(() => lane.runner.classList.remove('caught'), 800);
      }
      beep([220, 160], 0.2, 'sawtooth');
      const who = game.players.length === 2 ? `${ev.player}피` : '';
      say(`${who} 움직였다!`.trim(), 1.1);
    } else if (ev.type === 'win') {
      finish(ev.players);
    }
  }
}

// ---------- 몸 뼈대 그리기 ----------
function resizeOverlay() {
  const r = overlay.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  overlay.width = Math.round(r.width * dpr);
  overlay.height = Math.round(r.height * dpr);
}
window.addEventListener('resize', resizeOverlay);

// 비디오는 화면을 꽉 채우도록(cover) 잘려 보이므로 같은 방식으로 좌표를 맞춘다
function videoToScreen() {
  const W = overlay.width;
  const H = overlay.height;
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;
  const s = Math.max(W / vw, H / vh);
  const dw = vw * s;
  const dh = vh * s;
  const ox = (W - dw) / 2;
  const oy = (H - dh) / 2;
  return (p) => ({ x: ox + p.x * dw, y: oy + p.y * dh });
}

function drawSkeletons() {
  octx.clearRect(0, 0, overlay.width, overlay.height);
  if (!lastSample?.people) return;
  const map = videoToScreen();
  const lw = Math.max(4, overlay.width / 160);
  lastSample.people.forEach((person, i) => {
    const lm = person.landmarks;
    if (!lm) return;
    octx.strokeStyle = COLORS[i];
    octx.fillStyle = '#fff';
    octx.lineWidth = lw;
    octx.lineCap = 'round';
    octx.globalAlpha = 0.9;
    for (const [a, b] of BONES) {
      if ((lm[a].visibility ?? 1) < 0.5 || (lm[b].visibility ?? 1) < 0.5) continue;
      const pa = map(lm[a]);
      const pb = map(lm[b]);
      octx.beginPath();
      octx.moveTo(pa.x, pa.y);
      octx.lineTo(pb.x, pb.y);
      octx.stroke();
    }
    for (const idx of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
      if ((lm[idx].visibility ?? 1) < 0.5) continue;
      const p = map(lm[idx]);
      octx.beginPath();
      octx.arc(p.x, p.y, lw * (idx === 15 || idx === 16 ? 1.6 : 1), 0, Math.PI * 2);
      octx.fill();
    }
  });
  octx.globalAlpha = 1;
}

function render(dt) {
  if (!game) return;
  const phase = game.phase;
  const profile = PROFILES[mode];

  const tagger = $('#tagger');
  tagger.classList.toggle('look', phase === 'freeze' || phase === 'find');
  tagger.classList.toggle('back', !(phase === 'freeze' || phase === 'find'));

  const bubble = $('#bubble');
  bubble.textContent = phase === 'freeze' ? '얼음!' : game.chantText();
  bubble.classList.toggle('freeze', phase === 'freeze');

  const msg = $('#center-msg');
  const two = game.players.length === 2;
  if (phase === 'find') {
    const how = mode === 'pose'
      ? (two ? '1P는 왼쪽, 2P는 오른쪽에<br>몸이 보이게 서 주세요' : '카메라 앞에<br>몸이 보이게 서 주세요')
      : (two ? '1P는 왼쪽, 2P는 오른쪽에서<br>팔을 흔들어 주세요' : '카메라 앞에서<br>팔을 흔들어 주세요');
    msg.innerHTML = `${how}<span class="sub-msg">술래가 사람을 찾고 있어요 👀</span>`;
  } else if (phase === 'calibrate') {
    const left = Math.max(1, Math.ceil(game.length - game.t));
    msg.innerHTML = `찾았다! 이제 잠깐<br>가만히 있어 봐요<span class="count">${left}</span>`;
  } else if (msg.innerHTML) {
    msg.innerHTML = '';
  }

  game.players.forEach((p, i) => {
    const lane = lanes[i];
    if (!lane) return;
    const pct = Math.round(p.progress * 1000) / 10;
    lane.fill.style.height = `${pct}%`;
    // 출발선(트랙 아래 9%)에서 도착선(위 26%)까지
    lane.runner.style.bottom = `calc(9% + ${p.progress} * 65%)`;
    lane.runner.classList.toggle('moving', phase === 'go' && p.motion > p.noise + profile.idle);
    lane.runner.classList.toggle('missing', phase !== 'find' && !p.present);
    const meterPct = Math.min(100, (p.motion / profile.fullEffort) * 100);
    lane.meter.style.width = `${meterPct}%`;
    lane.meter.classList.toggle('warn', phase === 'freeze' && p.motion > game.freezeLimit(p));

    if (lane.statusTimer > 0) {
      lane.statusTimer -= dt;
      if (lane.statusTimer <= 0) setStatus(lane, '');
    } else if (phase === 'find') {
      setStatus(lane, p.found ? '찾았다! ✅' : (p.present ? '찾는 중…' : '어디 있니?'), p.found ? 'ok' : 'info');
    } else if (!p.present && phase !== 'end') {
      setStatus(lane, '안 보여요! 카메라 앞으로', 'info');
    } else if (lane.status.dataset.kind === 'info' || lane.status.dataset.kind === 'ok') {
      setStatus(lane, '');
    }

    if (DEBUG) {
      const parts = lastSample?.people?.[i]?.parts;
      lane.debug.textContent = `움직임 ${p.motion.toFixed(3)} · 잡음 ${p.noise.toFixed(3)} · 얼음기준 ${game.freezeLimit(p).toFixed(3)}`
        + (parts ? ` · 팔 ${parts.arms.toFixed(2)} 다리 ${parts.legs.toFixed(2)} 몸 ${parts.body.toFixed(2)}` : '')
        + ` · ${mode}`;
    }
  });
  drawSkeletons();
}

function finish(winners) {
  const g = game;
  const secs = Math.round(g.elapsed);
  const solo = g.players.length === 1;
  stopGame();
  game = g; // 마지막 화면을 그대로 보여 주기 위해 남겨 둔다
  render(0);
  game = null;
  beep([523, 659, 784, 1047], 0.14, 'triangle');

  let title;
  let detail;
  if (solo) {
    const caught = g.players[0].caughtCount;
    title = '도착! 술래를 잡았어요!';
    detail = `${secs}초 걸렸어요. 술래한테 ${caught}번 걸렸어요.`;
    $('#result-emoji').textContent = caught === 0 ? '🏆' : '🎉';
    say('도착! 잘했어요!', 1);
  } else if (winners.length === 2) {
    title = '둘 다 동시에 도착!';
    detail = '비겼어요! 한 번 더 해 볼까요?';
    $('#result-emoji').textContent = '🤝';
    say('비겼어요!', 1);
  } else {
    const w = winners[0];
    title = `${w}P ${RUNNERS[w - 1]} 승리!`;
    detail = g.players.map((p) => `${p.id}P: ${p.caughtCount}번 걸림`).join(' · ') + ` · ${secs}초`;
    $('#result-emoji').textContent = '🏆';
    say(`${w}피 승리!`, 1);
  }
  $('#result-title').textContent = title;
  $('#result-detail').textContent = detail;
  $('#result').hidden = false;
  $('#again').focus();
}

function goHome() {
  stopGame();
  closeCamera();
  octx.clearRect(0, 0, overlay.width, overlay.height);
  $('#center-msg').innerHTML = '';
  $('#result').hidden = true;
  show('screen-home');
}

$('#start').addEventListener('click', startGame);
$('#again').addEventListener('click', startGame);
$('#home').addEventListener('click', goHome);
$('#quit').addEventListener('click', goHome);

document.addEventListener('visibilitychange', () => {
  // 다른 앱으로 가면 카메라를 끄고 첫 화면으로 돌아간다
  if (document.hidden && stream) goHome();
});

// ---------- 홈 화면에 설치 (오프라인에서도 열리게) ----------
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// 시험용으로 현재 상태를 읽을 수만 있게 열어 둔다 (영상은 포함하지 않음)
window.mugunghwa = {
  get state() {
    if (!game) return null;
    return {
      mode,
      phase: game.phase,
      round: game.round,
      players: game.players.map((p) => ({
        id: p.id, progress: p.progress, motion: p.motion, noise: p.noise,
        present: p.present, found: p.found, caught: p.caughtCount,
      })),
    };
  },
};
