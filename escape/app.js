// 열쇠 학교: 첫 화면 → 3D 학교(혼자 / 수업에 들어가기) 또는 선생님 화면(수업 열기)
import { World, AREAS } from './world.js';
import { SUBJECTS, SUBJECT, ROOF_KEYS, puzzlesFor, roofPuzzles } from './content.js';
import { openPuzzle } from './puzzles.js';
import { Host, Client, EMOTES, cleanName } from './net.js';
import { unlockAudio, sfx, speak, makeStore } from '../common/sound.js';

const $ = (id) => document.getElementById(id);
const TOUCH = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
if (TOUCH) document.documentElement.classList.add('touch');
const store = makeStore('yeolsoe');
const COLORS = ['#ff6b6b', '#ff9f43', '#feca57', '#1dd1a1', '#48dbfb', '#5b4bff', '#c56cf0', '#ff7eb3'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {});

// 열쇠 학교만 따로 여는 아이콘: 크롬·엣지·안드로이드는 "앱 설치", 아이패드·아이폰은 홈 화면에 추가, 윈도우는 바탕화면 아이콘
const installed = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; document.getElementById('install').hidden = false; });
document.getElementById('install').addEventListener('click', async () => {
  if (!installEvt) return;
  installEvt.prompt();
  try { await installEvt.userChoice; } catch { /* 무시 */ }
  installEvt = null;
  document.getElementById('install').hidden = true;
});
window.addEventListener('appinstalled', () => { document.getElementById('install').hidden = true; });
const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (ios && !installed) document.getElementById('ios-hint').hidden = false;
if (/Windows/.test(navigator.userAgent) && !installed) document.getElementById('win-shortcut').hidden = false;

// ---------------- 설정 ----------------
const me = {
  name: store.get('name', ''),
  grade: Math.min(6, Math.max(1, Number(store.get('grade', '3')) || 3)),
  color: COLORS.includes(store.get('color', '')) ? store.get('color', '') : COLORS[Math.floor(Math.random() * COLORS.length)],
};
$('name').value = me.name;
$('code').value = new URLSearchParams(location.search).get('code') || '';

function paintChoices() {
  document.querySelectorAll('[data-setting="grade"] button').forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.value) === me.grade)));
  $('colors').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.c === me.color)));
}
document.querySelectorAll('[data-setting="grade"] button').forEach((b) => b.addEventListener('click', () => { me.grade = Number(b.dataset.value); store.set('grade', me.grade); paintChoices(); }));
COLORS.forEach((c) => {
  const b = document.createElement('button');
  b.type = 'button'; b.dataset.c = c; b.style.background = c; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', `옷 색 ${c}`);
  b.addEventListener('click', () => { me.color = c; store.set('color', c); paintChoices(); });
  $('colors').append(b);
});
paintChoices();

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}
function homeError(text) { const m = $('home-msg'); m.textContent = text; m.hidden = !text; }

// ---------------- 진행 저장 (이름+학년마다) ----------------
const progKey = () => `prog.${me.grade}.${me.name}`;
function loadProg() {
  try { const p = JSON.parse(store.get(progKey(), '{}')); return { keys: Array.isArray(p.keys) ? p.keys.filter((k) => SUBJECT[k]) : [], stars: p.stars || {}, escaped: !!p.escaped, right: p.right | 0 }; } catch { return { keys: [], stars: {}, escaped: false, right: 0 }; }
}
function saveProg() { store.set(progKey(), JSON.stringify(prog)); }
let prog = { keys: [], stars: {}, escaped: false, right: 0 };

// ---------------- 3D 세상 ----------------
let world = null;
let mode = 'solo'; // solo | online | teacher
let client = null;
let host = null;
const rooms = {}; // subj -> {puzzles, solved[], wrong, hints}
let roof = null; // {puzzles, solved[], digits[], code}

function ensureWorld() {
  if (world) return world;
  world = new World($('world'), { onInteract: interact, onPrompt: prompt, onArea: areaChanged });
  return world;
}
function areaName(a) {
  if (a === 'lobby') return '🏫 복도';
  if (a === 'roof') return '🌤️ 옥상';
  const s = SUBJECT[AREAS[a]?.subj];
  return s ? `${s.emoji} ${s.name}` : a;
}
function areaChanged(a) { $('where').textContent = `${areaName(a)} · ${me.grade}학년`; sendState(true); }

function prompt(it) {
  const b = $('act');
  if (!it || world.paused) { b.hidden = true; return; }
  b.hidden = false;
  b.textContent = it.label;
  b.onclick = () => interact(it);
}
function toast(text, ms = 2600) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('on'), ms);
}
function refreshKeys() {
  const n = prog.keys.length;
  $('keys').textContent = `🗝️ ${n} / ${SUBJECTS.length}`;
  $('keylist').innerHTML = SUBJECTS.map((s) => `<span class="${prog.keys.includes(s.id) ? 'got' : ''}" title="${s.name}">${s.emoji}</span>`).join('');
  SUBJECTS.forEach((s) => world.setDoorKey(s.id, prog.keys.includes(s.id)));
  world.setRoofOpen(n >= ROOF_KEYS, n);
  world.setPlayerKeys(n);
}

function startGame(how) {
  mode = how;
  prog = loadProg();
  ensureWorld();
  world.spectate(null);
  $('world-wrap').append($('world'));
  for (const k of Object.keys(rooms)) delete rooms[k];
  roof = null;
  SUBJECTS.forEach((s) => resetRoomView(s.id));
  world.setPlayer(me.name, me.color, prog.keys.length);
  world.goTo('lobby');
  refreshKeys();
  show('screen-game');
  world.resize();
  $('net').hidden = how !== 'online';
  if (TOUCH) $('help').textContent = '👆 가고 싶은 곳을 누르거나 왼쪽 아래 동그라미로 움직여요. 문·상자를 누르면 걸어가서 열어요.';
  $('help').classList.remove('gone');
  setTimeout(() => $('help').classList.add('gone'), 9000);
  speak(`${me.name}, 열쇠 학교에 온 걸 환영해요!`);
  toast(`🗝️ 교실 문으로 가서 문제를 풀어요! 열쇠 ${ROOF_KEYS}개면 옥상이 열려요.`, 4500);
}

function resetRoomView(subj) {
  const area = `room:${subj}`;
  for (let i = 0; i < 3; i++) world.setStation(area, i, { solved: false });
  world.setKeyVisible(area, false);
}

// 문·상자·열쇠 앞에서
function interact(it) {
  if (!world || world.paused || world.frozen) return;
  unlockAudio();
  switch (it.kind) {
    case 'door': return enterRoom(it.data.subj);
    case 'exit': {
      const from = world.area;
      const subj = AREAS[from]?.subj;
      return world.goTo('lobby', subj ? world.lobbySpotFor(subj) : { x: 0, z: 0.5 });
    }
    case 'station': return openStation(it.data.area, it.data.index);
    case 'key': return takeKey(AREAS[it.data.area].subj);
    case 'roofdoor': return enterRoof();
    case 'gate': return openGate();
    default: return null;
  }
}

function enterRoom(subj) {
  const area = `room:${subj}`;
  let r = rooms[subj];
  if (!r || r.taken) {
    r = rooms[subj] = { puzzles: puzzlesFor(subj, me.grade), solved: [false, false, false], wrong: 0, hints: 0, taken: false };
    resetRoomView(subj);
  }
  world.goTo(area);
  const s = SUBJECT[subj];
  world.setBoardText(area, prog.keys.includes(subj) ? `🗝️ 찾은 열쇠! 또 풀어도 OK · ${me.grade}학년` : `상자 3개를 열면 열쇠! · ${me.grade}학년`);
  toast(`${s.emoji} ${s.name}에 들어왔어요. 상자를 눌러 문제를 풀어요!`);
}

function openPz(pz, { title, color, onSolved }) {
  world.paused = true;
  prompt(null);
  world.keysDown.clear();
  openPuzzle($('puzzle'), pz, {
    title, color, grade: me.grade,
    onSolved: (st) => { world.paused = false; prompt(world.near); onSolved(st); },
    onWrong: () => sendEv({ kind: 'wrong' }),
    onClose: () => { world.paused = false; prompt(world.near); },
  });
  // 힌트 단추를 누른 횟수는 퍼즐 안에서 세고, 여기서는 알림만
  $('puzzle').querySelector('.pz-icon[aria-label="힌트 보기"]')?.addEventListener('click', () => sendEv({ kind: 'hint' }));
}

function openStation(area, i) {
  if (area === 'roof') return openRoofStation(i);
  const subj = AREAS[area].subj;
  const r = rooms[subj];
  if (!r) return null;
  if (r.solved[i]) { toast('✅ 이미 연 상자예요. 다른 상자를 열어 봐요!'); return null; }
  const s = SUBJECT[subj];
  const pz = r.puzzles[i];
  return openPz(pz, {
    title: `${s.emoji} ${s.short} · ${i + 1}번 상자`, color: s.color,
    onSolved: (st) => {
      r.solved[i] = true; r.wrong += st.wrong; r.hints += st.hints;
      prog.right += 1; saveProg();
      world.setStation(area, i, { solved: true });
      sendEv({ kind: 'solve', subj });
      const left = r.solved.filter((x) => !x).length;
      if (left) toast(`🔓 상자가 열렸어요! 남은 상자 ${left}개`);
      else { world.setKeyVisible(area, true); sfx.win(); toast('✨ 열쇠가 나타났어요! 가운데로 가서 받아요!', 3500); speak('열쇠가 나타났어요!'); }
    },
  });
}

function takeKey(subj) {
  const r = rooms[subj];
  if (!r || r.taken) return;
  r.taken = true;
  world.setKeyVisible(`room:${subj}`, false);
  const stars = Math.max(1, 3 - (r.wrong >= 3 ? 1 : 0) - (r.hints >= 2 ? 1 : 0));
  const first = !prog.keys.includes(subj);
  if (first) prog.keys.push(subj);
  prog.stars[subj] = Math.max(prog.stars[subj] || 0, stars);
  saveProg();
  refreshKeys();
  if (first) sendEv({ kind: 'key', subj });
  sfx.win();
  const s = SUBJECT[subj];
  const n = prog.keys.length;
  const next = n >= ROOF_KEYS ? '🔓 옥상 탈출구가 열렸어요! 복도 가운데 계단으로 가 봐요.' : `옥상까지 열쇠 ${ROOF_KEYS - n}개 더!`;
  speak(first ? `${s.short} 열쇠를 얻었어요!` : '참 잘했어요!');
  modal(`
    <div class="m-emoji">🗝️</div>
    <h2>${first ? `${s.name} 열쇠를 얻었어요!` : '또 해냈어요!'}</h2>
    <p class="m-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</p>
    <p>${first ? next : '새 문제로 다시 풀어 볼 수 있어요.'}</p>
  `, [['🚪 복도로 나가기', () => world.goTo('lobby', world.lobbySpotFor(subj)), 'ok'], ['여기 더 있기', null, 'ghost']]);
}

// ---------------- 옥상 ----------------
function enterRoof() {
  const n = prog.keys.length;
  if (n < ROOF_KEYS) { toast(`🔒 열쇠가 ${ROOF_KEYS - n}개 더 있어야 옥상 문이 열려요!`); sfx.fail(); return; }
  if (!roof || roof.done) {
    const puzzles = roofPuzzles(me.grade);
    const digits = puzzles.map(() => Math.floor(Math.random() * 10));
    roof = { puzzles, solved: puzzles.map(() => false), digits, code: digits.join(''), done: false };
    puzzles.forEach((_, i) => world.setStation('roof', i, { solved: false }));
  }
  world.goTo('roof');
  toast('🌤️ 옥상이에요! 상자 4개에서 비밀번호 숫자를 찾아 탈출구를 열어요!', 4500);
  speak('상자 네 개에서 숫자를 찾아요!');
}
function openRoofStation(i) {
  if (roof.solved[i]) { toast(`${i + 1}번 상자의 숫자는 ${roof.digits[i]}이에요.`); return; }
  const pz = roof.puzzles[i];
  const s = SUBJECT[pz.subj] || SUBJECT.kor;
  openPz(pz, {
    title: `🌤️ 옥상 ${i + 1}번 상자 · ${s.short}`, color: s.color,
    onSolved: () => {
      roof.solved[i] = true;
      world.setStation('roof', i, { solved: true, text: `${i + 1}번 숫자: ${roof.digits[i]}` });
      sendEv({ kind: 'solve', subj: 'roof' });
      toast(`🔢 ${i + 1}번 숫자는 ${roof.digits[i]}! 잘 기억해요.`, 3500);
      speak(`${i + 1}번 숫자는 ${roof.digits[i]}`);
    },
  });
}
function openGate() {
  if (!roof) return;
  const found = roof.digits.map((d, i) => (roof.solved[i] ? d : '?')).join(' ');
  if (roof.solved.some((x) => !x)) { toast(`🔒 아직 못 연 상자가 있어요. 찾은 숫자: ${found}`); return; }
  openPz({ type: 'number', q: `상자에서 찾은 숫자 4개를\n1번 상자부터 차례대로 넣어요.\n찾은 숫자: ${found}`, a: roof.code, hint: '1번 → 2번 → 3번 → 4번 상자 순서예요.' }, {
    title: '🚪 탈출구 비밀번호', color: '#ffb300',
    onSolved: () => {
      roof.done = true;
      prog.escaped = true; saveProg();
      sendEv({ kind: 'escape' });
      sfx.win(); setTimeout(() => sfx.win(), 500);
      speak('탈출 성공! 정말 대단해요!');
      const stars = Object.values(prog.stars).reduce((a, b) => a + b, 0);
      modal(`
        <div class="m-emoji">🎉</div>
        <h2>탈출 성공!</h2>
        <p><b>${esc(me.name)}</b>, 열쇠 학교를 탈출했어요!</p>
        <p class="m-stars">🗝️ 열쇠 ${prog.keys.length}개 · ⭐ ${stars}개</p>
        <p>아직 안 가 본 교실도 도전해 보세요!</p>
      `, [['🏫 학교 계속 둘러보기', () => world.goTo('lobby'), 'ok'], ['🔄 열쇠 모으기 처음부터 (새 학기)', () => { prog = { keys: [], stars: {}, escaped: false, right: prog.right }; saveProg(); for (const k of Object.keys(rooms)) delete rooms[k]; SUBJECTS.forEach((s) => resetRoomView(s.id)); roof = null; refreshKeys(); world.goTo('lobby'); sendHello(); }, 'ghost']]);
    },
  });
}

// ---------------- 알림 창 ----------------
function modal(html, buttons = [['확인', null, 'ok']]) {
  const m = $('modal');
  world && (world.paused = true);
  prompt(null);
  m.innerHTML = `<div class="m-card">${html}<div class="m-btns"></div></div>`;
  const row = m.querySelector('.m-btns');
  buttons.forEach(([label, fn, cls]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls || ''; b.textContent = label;
    b.addEventListener('click', () => { m.hidden = true; m.innerHTML = ''; if (world) world.paused = false; fn?.(); if (world) prompt(world.near); });
    row.append(b);
  });
  m.hidden = false;
  row.querySelector('button')?.focus();
}
function banner(text, ms = 6000) {
  const b = $('banner');
  b.textContent = text; b.hidden = false;
  clearTimeout(banner.t);
  banner.t = setTimeout(() => { b.hidden = true; }, ms);
}

// ---------------- 기분 표현 ----------------
$('emote-btn').addEventListener('click', () => { const e = $('emotes'); e.hidden = !e.hidden; });
EMOTES.forEach((em) => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = em; b.setAttribute('aria-label', `기분 ${em}`);
  b.addEventListener('click', () => {
    $('emotes').hidden = true;
    if (mode === 'online' && client) client.send({ t: 'emo', e: em }); else world.emote(em);
  });
  $('emotes').append(b);
});

// ---------------- 움직이기 막대 (터치 화면) ----------------
(function joystick() {
  const stick = $('stick');
  const knob = stick.querySelector('i');
  let id = null; let cx = 0; let cy = 0;
  const R = 46;
  stick.addEventListener('pointerdown', (e) => {
    id = e.pointerId; stick.setPointerCapture(id);
    const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    move(e);
  });
  const move = (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - cx; let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    world?.setJoystick(dx / R, dy / R);
  };
  const end = (e) => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; world?.setJoystick(0, 0); };
  stick.addEventListener('pointermove', move);
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);
}());

$('quit').addEventListener('click', () => {
  modal('<div class="m-emoji">🚪</div><h2>열쇠 학교에서 나갈까요?</h2><p>모은 열쇠는 이 기기에 저장돼요.</p>', [
    ['나가기', leaveGame, 'ok'], ['계속하기', null, 'ghost'],
  ]);
});
function leaveGame() {
  client?.leave(); client = null;
  for (const id of [...world.remotes.keys()]) world.removeRemote(id);
  $('puzzle').hidden = true; $('frozen').hidden = true;
  world.paused = false; world.frozen = false;
  show('screen-home');
}

// ---------------- 함께하기 (학생) ----------------
let lastSent = '';
let sendTimer = null;
function sendState(force = false) {
  if (mode !== 'online' || !client || !world) return;
  const s = world.getState();
  const k = `${s.x},${s.z},${s.r},${s.a}`;
  if (!force && k === lastSent) return;
  lastSent = k;
  client.send({ t: 'st', ...s });
}
function sendEv(ev) { if (mode === 'online') client?.send({ t: 'ev', ...ev }); }
function sendHello() { if (mode === 'online') client?.hello({ name: me.name, grade: me.grade, color: me.color, keys: prog.keys }); }

let myId = null;
function onNet(m) {
  if (!m || !world) return;
  switch (m.t) {
    case 'welcome': myId = m.id; setFrozen(!!m.frozen); break;
    case 'ros': {
      const ids = new Set();
      for (const p of m.list || []) { if (p.id === myId) continue; ids.add(p.id); world.upsertRemote(p.id, p.n, p.c, p.k); }
      for (const id of [...world.remotes.keys()]) if (!ids.has(id)) world.removeRemote(id);
      break;
    }
    case 'snap': for (const [id, x, z, r, a] of m.p || []) if (id !== myId) world.moveRemote(id, x, z, r, a); break;
    case 'bye': world.removeRemote(m.id); break;
    case 'emo': if (m.id === myId) world.emote(m.e); else world.emoteRemote(m.id, m.e); break;
    case 'notice': banner(`📢 선생님: ${m.text}`, 9000); speak(m.text); sfx.go(); break;
    case 'freeze': setFrozen(m.on); break;
    case 'call':
      $('puzzle').hidden = true; $('puzzle').innerHTML = ''; world.paused = false;
      world.goTo('lobby'); banner('🏠 선생님이 모두 복도로 불렀어요!'); speak('모두 복도로 모여요!');
      break;
    case 'cheer':
      if (m.id !== myId) toast(m.kind === 'escape' ? `🎉 ${m.name} 친구가 탈출했어요!` : `🗝️ ${m.name} 친구가 ${SUBJECT[m.subj]?.name || ''} 열쇠를 찾았어요!`);
      break;
    case 'rank':
      modal(`<div class="m-emoji">🏆</div><h2>지금 순위</h2><ol class="m-rank">${(m.list || []).map((p) => `<li><b>${esc(p.n)}</b> 🗝️${p.k}${p.e ? ' 🎉탈출' : ''}</li>`).join('')}</ol>`);
      break;
    case 'kick': case 'end':
      client?.leave(); client = null;
      leaveGame();
      homeError(m.t === 'end' ? '선생님이 수업을 끝냈어요. 수고했어요! 👏' : '선생님이 수업에서 내보냈어요.');
      break;
    default: break;
  }
}
function setFrozen(on) {
  $('frozen').hidden = !on;
  if (world) { world.frozen = on; if (on) world.keysDown.clear(); }
}
function netStatus(s) {
  const n = $('net');
  n.hidden = mode !== 'online';
  if (s === 'online') { n.textContent = '🟢 수업 중'; n.className = 'pill'; sendHello(); sendState(true); }
  else if (s === 'reconnecting') { n.textContent = '🟡 다시 연결 중…'; n.className = 'pill warn'; }
  else if (s === 'lost') { n.textContent = '🔴 연결 끊김'; n.className = 'pill bad'; banner('선생님 기기와 연결이 끊겼어요. 나갔다가 다시 들어와 주세요.', 10000); }
}

// ---------------- 첫 화면 단추 ----------------
function readName() {
  me.name = cleanName($('name').value);
  if (!$('name').value.trim()) { $('name').value = me.name; }
  store.set('name', me.name);
}
$('solo').addEventListener('click', () => { unlockAudio(); readName(); homeError(''); startGame('solo'); });
$('code').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });
$('code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('join').click(); });
$('join').addEventListener('click', async () => {
  unlockAudio(); readName();
  const code = $('code').value.trim();
  if (!/^\d{4}$/.test(code)) { homeError('선생님이 알려 준 수업 코드 4자리를 넣어 주세요.'); $('code').focus(); return; }
  homeError('');
  const btn = $('join');
  btn.disabled = true; btn.textContent = '⏳ 연결하는 중…';
  prog = loadProg();
  client = new Client({ onMessage: onNet, onStatus: netStatus });
  mode = 'online';
  try {
    await client.join(code, { name: me.name, grade: me.grade, color: me.color, keys: prog.keys });
    startGame('online');
    netStatus('online');
    clearInterval(sendTimer);
    sendTimer = setInterval(() => sendState(), 125);
  } catch (err) {
    client?.leave(); client = null; mode = 'solo';
    homeError(err.message || '연결하지 못했어요.');
  } finally {
    btn.disabled = false; btn.textContent = '👫 수업에 들어가기';
  }
});

// ---------------- 선생님 ----------------
$('host').addEventListener('click', async () => {
  unlockAudio();
  const btn = $('host');
  btn.disabled = true; btn.textContent = '⏳ 수업 여는 중…';
  homeError('');
  host = new Host({ onRoster: () => drawTeacher(), onEvent: teacherEvent, onStatus: teacherStatus });
  try {
    const code = await host.open();
    mode = 'teacher';
    startTeacher(code);
  } catch (err) {
    host = null;
    homeError(err.message || '수업을 열지 못했어요.');
  } finally {
    btn.disabled = false; btn.textContent = '🧑‍🏫 선생님: 수업 열기';
  }
});

let viewArea = 'lobby';
let wakeLock = null;
function startTeacher(code) {
  ensureWorld();
  if (world.player) { world.scene.remove(world.player); world.player = null; }
  $('t-world-slot').append($('world'));
  world.spectate(viewArea);
  $('t-code').textContent = code;
  const url = new URL(location.href); url.search = ''; url.hash = '';
  $('t-url').textContent = `주소: ${url.href.replace(/index\.html$/, '')}`;
  show('screen-teacher');
  world.resize();
  drawAreas();
  drawTeacher();
  setInterval(syncTeacherWorld, 125);
  setInterval(drawTeacher, 2000);
  navigator.wakeLock?.request('screen').then((l) => { wakeLock = l; }).catch(() => {});
  window.addEventListener('beforeunload', (e) => { if (mode === 'teacher') { e.preventDefault(); e.returnValue = ''; } });
}
// 장소 단추는 한 번만 만들고 숫자·선택만 바꾼다 (자주 다시 만들면 누르기 어렵다)
function drawAreas() {
  const counts = {};
  if (host) for (const s of host.students.values()) if (s.online) counts[s.a] = (counts[s.a] || 0) + 1;
  const box = $('t-areas');
  if (!box.children.length) {
    const list = [['lobby', '🏫 복도'], ...SUBJECTS.map((s) => [`room:${s.id}`, `${s.emoji} ${s.short}`]), ['roof', '🌤️ 옥상']];
    for (const [a, label] of list) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.area = a;
      b.innerHTML = `${label} <b hidden></b>`;
      b.addEventListener('click', () => { viewArea = a; world.spectate(a); drawAreas(); });
      box.append(b);
    }
  }
  for (const b of box.children) {
    b.classList.toggle('on', b.dataset.area === viewArea);
    const n = counts[b.dataset.area] || 0;
    const tag = b.querySelector('b');
    tag.hidden = !n;
    tag.textContent = n;
  }
}
function syncTeacherWorld() {
  if (!host || !world) return;
  const seen = new Set();
  for (const s of host.students.values()) {
    if (!s.online) continue;
    seen.add(s.pid);
    world.upsertRemote(s.pid, s.name, s.color, s.keys.length);
    world.moveRemote(s.pid, s.x, s.z, s.r, s.a);
  }
  for (const id of [...world.remotes.keys()]) if (!seen.has(id)) world.removeRemote(id);
}
function teacherEvent(s, ev) {
  if (ev.kind === 'emo') { world?.emoteRemote(s.pid, ev.e); return; }
  const text = {
    join: `👋 ${s.name}(${s.grade}학년) 들어왔어요`,
    key: `🗝️ ${s.name} — ${SUBJECT[ev.subj]?.name || ''} 열쇠!`,
    escape: `🎉 ${s.name} 탈출 성공!`,
  }[ev.kind];
  if (text) logTeacher(text);
  if (ev.kind === 'key' || ev.kind === 'escape') sfx.good(4);
}
function logTeacher(text) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ${text}`;
  $('t-log').prepend(li);
  while ($('t-log').children.length > 30) $('t-log').lastChild.remove();
}
function teacherStatus(s, text) {
  const el = $('t-status');
  if (s === 'open') { el.textContent = '🟢 연결됨'; el.className = 't-status'; }
  else if (s === 'reconnecting') { el.textContent = '🟡 다시 연결 중'; el.className = 't-status warn'; }
  else if (s === 'error') { el.textContent = `🔴 ${text}`; el.className = 't-status bad'; }
}
let drawQueued = false;
function drawTeacher() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    if (!host) return;
    const list = [...host.students.values()].sort((a, b) => (b.online - a.online) || (b.escaped - a.escaped) || (b.keys.length - a.keys.length) || (b.right - a.right) || a.name.localeCompare(b.name));
    $('t-num').textContent = list.filter((s) => s.online).length;
    $('t-rows').innerHTML = list.length ? list.map((s) => `
      <tr class="${s.online ? '' : 'off'}">
        <td><i class="dot" style="background:${s.color}"></i>${esc(s.name)}${s.escaped ? ' 🎉' : ''}</td>
        <td>${s.grade}</td>
        <td>${s.online ? areaName(s.a) : '⚪ 나감'}</td>
        <td class="keys">${s.keys.map((k) => SUBJECT[k]?.emoji || '').join('')}<small>${s.keys.length}</small></td>
        <td>${s.right}</td><td>${s.wrong}</td><td>${s.hints}</td>
        <td><button type="button" class="kick" data-id="${esc(s.pid)}" title="내보내기" aria-label="${esc(s.name)} 내보내기">✕</button></td>
      </tr>`).join('') : '<tr><td colspan="8" class="empty">아직 아무도 안 들어왔어요. 수업 코드를 알려 주세요!</td></tr>';
    $('t-rows').querySelectorAll('.kick').forEach((b) => b.addEventListener('click', () => {
      const s = host.students.get(b.dataset.id);
      if (s && confirm(`${s.name}을(를) 수업에서 내보낼까요?`)) host.kick(s.pid);
    }));
    drawAreas();
  });
}
$('t-notice').addEventListener('click', () => {
  const text = window.prompt('아이들 화면에 보낼 알림을 써 주세요 (예: 5분 남았어요!)');
  if (text?.trim()) { host.notice(text.trim()); logTeacher(`📢 알림: ${text.trim()}`); }
});
$('t-freeze').addEventListener('click', () => {
  const on = !host.frozen;
  host.freeze(on);
  $('t-freeze').textContent = on ? '▶️ 다시 움직여요' : '⏸️ 모두 멈춰!';
  $('t-freeze').classList.toggle('on', on);
});
$('t-call').addEventListener('click', () => host.callLobby());
$('t-rank').addEventListener('click', () => {
  const list = host.ranking();
  modal(`<div class="m-emoji">🏆</div><h2>지금 순위</h2><ol class="m-rank">${list.map((p) => `<li><b>${esc(p.n)}</b> 🗝️${p.k}${p.e ? ' 🎉탈출' : ''}</li>`).join('') || '<li>아직 아무도 없어요</li>'}</ol>`);
});
$('t-end').addEventListener('click', () => {
  if (!confirm('수업을 끝낼까요? 아이들 화면도 모두 첫 화면으로 돌아가요.')) return;
  host.close(); host = null; mode = 'solo';
  wakeLock?.release?.(); wakeLock = null;
  for (const id of [...world.remotes.keys()]) world.removeRemote(id);
  location.reload();
});

// 시험용: ?auto=solo 면 바로 혼자 하기
const auto = new URLSearchParams(location.search).get('auto');
if (auto === 'solo') { if (!me.name) $('name').value = '시험'; $('solo').click(); }
// 시험용 손잡이 (?debug)
if (new URLSearchParams(location.search).has('debug')) window.__ys = { get world() { return world; }, interact, rooms, get roof() { return roof; }, get prog() { return prog; }, get host() { return host; } };
