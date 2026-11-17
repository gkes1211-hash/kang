import { MotionSensor } from './motion.js';
import { Game, CHANT, CALIBRATE_SECONDS } from './game.js';

const $ = (sel) => document.querySelector(sel);
const SAMPLE_INTERVAL = 1 / 15; // 1초에 15번 움직임을 잰다 (기기 속도와 상관없이 같은 기준)
const RUNNERS = ['🐰', '🐻'];
const COLORS = ['var(--p1)', 'var(--p2)'];

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
      g.gain.setValueAtTime(0.12, t);
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

// ---------- 게임 ----------
const video = $('#cam');
const sensor = new MotionSensor(video);
let stream = null;
let game = null;
let lanes = [];
let raf = 0;
let lastTime = 0;
let sampleAcc = 0;
let wakeLock = null;

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
      <div class="lane-status" hidden></div>`;
    box.appendChild(lane);
    lanes.push({
      root: lane,
      fill: lane.querySelector('.track-fill'),
      runner: lane.querySelector('.runner'),
      meter: lane.querySelector('.meter-fill'),
      status: lane.querySelector('.lane-status'),
      statusTimer: 0,
    });
  }
  $('#screen-game').classList.toggle('two', count === 2);
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

async function startGame() {
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
    return;
  } finally {
    btn.disabled = false;
  }
  beep([0]); // 사용자 터치 안에서 소리 장치를 깨워 둔다
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { wakeLock = null; }

  const players = Number(settings.players) === 2 ? 2 : 1;
  game = new Game({ players, difficulty: settings.difficulty });
  buildLanes(players);
  sensor.reset();
  $('#result').hidden = true;
  show('screen-game');
  handleEvents();
  lastTime = performance.now();
  sampleAcc = 0;
  clearInterval(raf);
  // 화면 새로고침 속도와 상관없이 일정하게 돌도록 타이머로 돌린다
  raf = setInterval(() => loop(performance.now()), 1000 / 30);
}

function stopGame() {
  clearInterval(raf);
  raf = 0;
  game = null;
  stopVoice();
  try { wakeLock?.release(); } catch { /* 무시 */ }
  wakeLock = null;
}

function loop(now) {
  const dt = Math.min(0.25, (now - lastTime) / 1000);
  lastTime = now;
  if (!game) return;
  sampleAcc += dt;
  if (sampleAcc >= SAMPLE_INTERVAL) {
    const m = sensor.sample();
    if (m) {
      const motions = game.players.length === 2 ? [m.left, m.right] : [m.all];
      game.update(sampleAcc, motions);
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
      if (ev.phase === 'go') {
        // 노래 길이에 맞춰 말 빠르기를 조절한다 (보통 빠르기로 약 2.2초)
        const rate = Math.min(1.8, Math.max(0.6, 2.2 / Math.max(1, ev.length - 0.3)));
        if (!say(CHANT, rate)) beep([523, 587, 659], 0.08, 'triangle');
      } else if (ev.phase === 'freeze') {
        stopVoice();
        if (!say('얼음!', 1.1)) beep([880, 880], 0.12);
      }
    } else if (ev.type === 'caught') {
      const lane = lanes[ev.player - 1];
      if (lane) {
        lane.status.textContent = '걸렸다! 뒤로~';
        lane.status.hidden = false;
        lane.statusTimer = 1.6;
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

function render(dt) {
  if (!game) return;
  const phase = game.phase;

  const tagger = $('#tagger');
  tagger.classList.toggle('look', phase === 'freeze');
  tagger.classList.toggle('back', phase !== 'freeze');

  const bubble = $('#bubble');
  bubble.textContent = phase === 'freeze' ? '얼음!' : game.chantText();
  bubble.classList.toggle('freeze', phase === 'freeze');

  const msg = $('#center-msg');
  if (phase === 'calibrate') {
    const left = Math.max(1, Math.ceil(game.length - game.t));
    const where = game.players.length === 2 ? '1P는 왼쪽, 2P는 오른쪽에 서서' : '카메라 앞에 서서';
    msg.innerHTML = `${where}<br>가만히 있어 봐요<span class="count">${left}</span>`;
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
    lane.runner.classList.toggle('moving', phase === 'go' && p.motion > p.noise + 0.02);
    const meterPct = Math.min(100, (p.motion / 0.15) * 100);
    lane.meter.style.width = `${meterPct}%`;
    lane.meter.classList.toggle('warn', phase === 'freeze' && p.motion > game.freezeLimit(p));
    if (lane.statusTimer > 0) {
      lane.statusTimer -= dt;
      if (lane.statusTimer <= 0) lane.status.hidden = true;
    }
  });
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
      phase: game.phase,
      round: game.round,
      players: game.players.map((p) => ({ id: p.id, progress: p.progress, motion: p.motion, noise: p.noise, caught: p.caughtCount })),
    };
  },
  calibrateSeconds: CALIBRATE_SECONDS,
};
