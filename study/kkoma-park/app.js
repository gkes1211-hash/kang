// 꼬마 탐험대 공원: 첫 화면 → 캐릭터 꾸미기 → 3D 공원(혼자 / 친구들과) 또는 선생님 화면
import { World, AREAS } from './world.js';
import { SUBJECTS, SUBJECT, STAMPS_TO_FLY, puzzlesFor, finalPuzzles } from './content.js';
import { openPuzzle } from './puzzles.js';
import { Host, Client, EMOTES, cleanName } from './net.js';
import { THREE } from './toon.js';
import { buildAvatar, buildPet, animateBody, randomLook, cleanLook, SKINS, HAIR_COLORS, SHIRTS, HAIRS, CATS, SPECIALS, nextSpecial } from './avatar.js';
import { makeStore } from '../../pe/common/sound.js';
import { unlockAudio, sfx, speak, speakNow, hush, sound, setSound, bgm } from './audio.js';

const $ = (id) => document.getElementById(id);
const store = makeStore('kkoma');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TOUCH = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
if (TOUCH) document.documentElement.classList.add('touch');
const Q = new URLSearchParams(location.search);

if ('serviceWorker' in navigator && window.isSecureContext && !Q.has('debug')) navigator.serviceWorker.register('sw.js').catch(() => {});

// ---------------- 앱 설치 (이 앱만 따로 여는 아이콘) ----------------
const installed = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; $('install').hidden = false; });
$('install').addEventListener('click', async () => {
  if (!installEvt) return;
  installEvt.prompt();
  try { await installEvt.userChoice; } catch { /* 무시 */ }
  installEvt = null; $('install').hidden = true;
});
window.addEventListener('appinstalled', () => { $('install').hidden = true; });
const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (ios && !installed) $('ios-hint').hidden = false;
if (/Windows/.test(navigator.userAgent) && !installed) $('win-shortcut').hidden = false;

// ---------------- 나 ----------------
const me = { name: store.get('name', ''), grade: Math.min(6, Math.max(1, Number(store.get('grade', '3')) || 3)), look: null };
$('name').value = me.name;
$('code').value = Q.get('code') || '';
function paintGrades() { document.querySelectorAll('.grades button').forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.grade) === me.grade))); }
document.querySelectorAll('.grades button').forEach((b) => b.addEventListener('click', () => { me.grade = Number(b.dataset.grade); store.set('grade', me.grade); paintGrades(); sfx.pop(); }));
paintGrades();
function readName() { me.name = cleanName($('name').value); if (!$('name').value.trim()) $('name').value = me.name; store.set('name', me.name); }
function show(id) { document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id)); window.scrollTo(0, 0); }
function homeError(text) { $('home-msg').textContent = text; $('home-msg').hidden = !text; }

// ---------------- 기록 (이름+학년마다) ----------------
// keys: 모은 열쇠 수, stamps: {구역: 깬 횟수}, stars: {구역: 가장 많이 받은 별}, flights: 열기구 탄 횟수
const progKey = () => `prog2.${me.grade}.${me.name}`;
let prog = { keys: 0, stamps: {}, stars: {}, flights: 0, right: 0 };
function loadProg() {
  try {
    const p = JSON.parse(store.get(progKey(), '{}'));
    return { keys: Math.max(0, p.keys | 0), stamps: p.stamps && typeof p.stamps === 'object' ? p.stamps : {}, stars: p.stars || {}, flights: p.flights | 0, right: p.right | 0 };
  } catch { return { keys: 0, stamps: {}, stars: {}, flights: 0, right: 0 }; }
}
const saveProg = () => store.set(progKey(), JSON.stringify(prog));
const stampList = () => SUBJECTS.filter((s) => prog.stamps[s.id] > 0).map((s) => s.id);
function loadLook() { try { const l = JSON.parse(store.get(`look.${me.name}`, 'null')); return l ? cleanLook(l, prog.keys) : randomLook(0); } catch { return randomLook(0); } }
const saveLook = () => store.set(`look.${me.name}`, JSON.stringify(me.look));

// ============================================================
// 캐릭터 꾸미기 화면
// ============================================================
const dresser = { tab: 'face', onDone: null, mode: 'start', r: null };
function setupPreview() {
  if (dresser.r) return;
  const canvas = $('av-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#a3d98a', 1.7));
  const sun = new THREE.DirectionalLight('#fff3d6', 1.8); sun.position.set(3, 6, 5); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  cam.position.set(0, 1.75, 5.0); cam.lookAt(0, 1.1, 0);
  const holder = new THREE.Group(); scene.add(holder);
  let rotY = 0.3; let drag = null; let vel = 0.4;
  canvas.addEventListener('pointerdown', (e) => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); vel = 0; });
  canvas.addEventListener('pointermove', (e) => { if (drag == null) return; rotY += (e.clientX - drag) * 0.012; vel = (e.clientX - drag) * 0.6; drag = e.clientX; });
  canvas.addEventListener('pointerup', () => { drag = null; });
  const clock = new THREE.Clock(); let t = 0;
  dresser.r = { renderer, scene, cam, holder, canvas };
  renderer.setAnimationLoop(() => {
    if (!$('screen-avatar').classList.contains('active')) return;
    const dt = Math.min(0.05, clock.getDelta()); t += dt;
    const w = canvas.clientWidth; const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    if (drag == null) { vel *= 0.95; rotY += (0.25 + vel) * dt; }
    holder.rotation.y = rotY;
    const av = holder.userData.av;
    if (av) animateBody(av, false, dt, t);
    const pet = holder.userData.pet; if (pet) pet.position.y = Math.abs(Math.sin(t * 3)) * 0.12;
    renderer.render(scene, cam);
  });
}
function refreshPreview() {
  const { holder } = dresser.r;
  holder.clear();
  const av = buildAvatar(me.look); holder.add(av); holder.userData.av = av;
  const pet = buildPet(me.look.pet);
  if (pet) { pet.position.set(0.95, 0, 0.5); pet.scale.setScalar(1.2); holder.add(pet); }
  holder.userData.pet = pet;
}
const TABS = {
  face: () => [['피부', 'swatch', 'skin', SKINS], ['얼굴 꾸미기', 'chips', 'face', CATS.face]],
  hair: () => [['머리 모양', 'chips', 'hair', HAIRS.map(([id, l]) => [id, l, 0])], ['머리 색', 'swatch', 'hairColor', HAIR_COLORS]],
  clothes: () => [['옷 색', 'swatch', 'shirt', SHIRTS], ['옷 무늬', 'chips', 'pattern', CATS.pattern]],
  items: () => [['머리에 쓰기', 'chips', 'hat', CATS.hat], ['등·손', 'chips', 'back', CATS.back]],
  pet: () => [['같이 다니는 친구', 'chips', 'pet', CATS.pet]],
};
function renderDresser() {
  $('av-name').textContent = me.name;
  document.querySelectorAll('#av-tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === dresser.tab)));
  const body = $('av-body'); body.innerHTML = '';
  for (const [title, kind, key, list] of TABS[dresser.tab]()) {
    const h = document.createElement('h3'); h.textContent = title; body.append(h);
    const row = document.createElement('div'); row.className = kind === 'swatch' ? 'swatches' : 'chips';
    if (kind === 'swatch') {
      list.forEach((c) => {
        const b = document.createElement('button'); b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', `${title} ${c}`);
        b.setAttribute('aria-pressed', String(me.look[key] === c));
        b.addEventListener('click', () => { me.look[key] = c; sfx.pop(); renderDresser(); refreshPreview(); });
        row.append(b);
      });
    } else {
      list.forEach(([id, label, need]) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        const locked = need > prog.keys;
        if (need > 0) b.classList.add('special');
        if (locked) { b.classList.add('locked'); b.dataset.need = `🔒🗝️${need}`; b.title = `열쇠 ${need}개를 모으면 열려요`; }
        b.setAttribute('aria-pressed', String(me.look[key] === id));
        b.addEventListener('click', () => {
          if (locked) { sfx.fail(); flashKeys(`🔒 열쇠 ${need}개를 모으면 "${label}"이(가) 열려요! (지금 ${prog.keys}개)`); return; }
          me.look[key] = id; sfx.pop(); renderDresser(); refreshPreview();
        });
        row.append(b);
      });
    }
    body.append(row);
  }
  const nx = nextSpecial(prog.keys);
  $('av-keys').innerHTML = `🗝️ 모은 열쇠 <b>${prog.keys}</b>개<br>${nx ? `다음 특별 꾸미기: ${esc(nx.label)} (열쇠 ${nx.need}개)` : '🎉 특별 꾸미기를 모두 열었어요!'}`;
}
function flashKeys(text) { const k = $('av-keys'); const old = k.innerHTML; k.innerHTML = text; k.style.background = '#ffe0d9'; setTimeout(() => { k.style.background = ''; renderDresser(); void old; }, 2200); }
document.querySelectorAll('#av-tabs button').forEach((b) => b.addEventListener('click', () => { dresser.tab = b.dataset.tab; sfx.pop(); renderDresser(); }));
$('av-random').addEventListener('click', () => { me.look = randomLook(prog.keys); sfx.good(3); renderDresser(); refreshPreview(); });
$('av-back').addEventListener('click', () => { if (dresser.mode === 'edit') { show('screen-game'); world?.resize(); } else show('screen-home'); });
$('av-go').addEventListener('click', () => { unlockAudio(); me.look = cleanLook(me.look, prog.keys); saveLook(); const f = dresser.onDone; dresser.onDone = null; f?.(); });
function openDresser(mode, onDone) {
  dresser.mode = mode; dresser.onDone = onDone;
  $('av-go').textContent = mode === 'edit' ? '이대로 할래요! ✨' : '공원으로 출발! 🌳';
  $('av-back').textContent = mode === 'edit' ? '◀ 그냥 돌아가기' : '◀ 뒤로';
  if (!me.look) me.look = loadLook();
  show('screen-avatar');
  setupPreview();
  renderDresser();
  refreshPreview();
}

// ============================================================
// 3D 공원
// ============================================================
let world = null;
let mode = 'solo'; // solo | online | teacher
let client = null;
let host = null;
const zones = {}; // subj -> {puzzles, solved[], wrong, hints, taken}
let final = null; // 열기구: {puzzles, solved[], digits[], code, done}

function ensureWorld() {
  if (!world) world = new World($('world'), { onInteract: interact, onPrompt: prompt, onArea: areaChanged });
  world.onZoom = (z) => store.set('zoom', z.toFixed(2));
  if (!world.minimap) {
    const mm = $('minimap'); world.minimap = mm;
    mm.addEventListener('pointerdown', (e) => { e.stopPropagation(); const r = mm.getBoundingClientRect(); world.mapTap((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
  }
  return world;
}
function areaName(a) {
  if (a === 'plaza') return '🏡 마을';
  if (a === 'balloon') return '🎈 열기구 탈출장';
  const s = SUBJECT[AREAS[a]?.subj];
  return s ? `${s.emoji} ${s.name}` : a;
}
function areaChanged(a) { $('where').textContent = `${areaName(a)} · ${me.grade}학년`; $('minimap').hidden = a !== 'plaza'; sendState(true); }
function prompt(it) {
  const b = $('act');
  if (!it || world.paused) { b.hidden = true; return; }
  b.hidden = false; b.textContent = it.label; b.onclick = () => interact(it);
}
function toast(text, ms = 2800) {
  const t = $('toast'); t.textContent = text; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms);
}
function refreshHud() {
  const n = stampList().length;
  $('keys').textContent = `🗝️ ${prog.keys}`;
  $('stamps').innerHTML = SUBJECTS.map((s) => `<span class="${prog.stamps[s.id] ? 'got' : ''}" title="${s.name}">${s.emoji}</span>`).join('');
  SUBJECTS.forEach((s) => world.setGateStamp(s.id, prog.stamps[s.id] > 0, prog.stamps[s.id] | 0));
  world.setBalloonOpen(n >= STAMPS_TO_FLY, n);
  world.setPlayerKeys(prog.keys);
}

function startGame(how) {
  mode = how;
  ensureWorld();
  world.spectate(null);
  $('world-wrap').append($('world'));
  for (const k of Object.keys(zones)) delete zones[k];
  final = null;
  SUBJECTS.forEach((s) => resetZoneView(s.id));
  for (let i = 0; i < 4; i++) world.setStation('balloon', i, { solved: false });
  world.landBalloon();
  world.setPlayer(me.name, me.look, prog.keys);
  world.goTo('plaza');
  refreshHud();
  show('screen-game');
  world.resize();
  $('net').hidden = how !== 'online';
  if (TOUCH) $('help').textContent = '👆 가고 싶은 곳을 누르거나 왼쪽 아래 동그라미로 움직여요. 문이나 상자를 누르면 걸어가서 열어요.';
  $('help').classList.remove('gone');
  setTimeout(() => $('help').classList.add('gone'), 9000);
  world.addGuide(GUIDE_LOOK, '🧭 토리 대장');
  world.setZoom(Number(store.get('zoom', '1')) || 1);
  bgm.wanted = true;
  if (sound.music) bgm.start();
  paintSettings();
  if (store.get(`guided.${me.name}`, '') !== 'yes') setTimeout(() => runGuide(true), 600);
  else {
    speak(`${me.name}, 꼬마 탐험대 공원에 온 걸 환영해요!`);
    toast(`🏠 건물 문으로 들어가 보물 상자를 열어요! 도장 ${STAMPS_TO_FLY}개를 모으면 열기구를 탈 수 있어요.`, 5000);
  }
}

// ---------------- 안내하는 탐험대장 토리 ----------------
const GUIDE_LOOK = { skin: '#f6c9a0', hair: 'messy', hairColor: '#7a4a24', shirt: '#6cc96c', hat: 'explorer', face: 'glasses', back: 'magnifier', pattern: 'stripes', pet: 'none' };
function guideLines() {
  return [
    ['👋', `안녕, ${me.name}! 나는 꼬마 탐험대의 대장, 토리야. 꼬마 탐험대 공원에 온 걸 환영해!`],
    ['🗺️', '여기는 마을 한가운데 분수 광장이야. 길을 따라가면 도서관, 성, 기차역 같은 건물이 9개 있어. 반짝이는 문으로 들어가면 놀이방이 나와. 왼쪽 위 작은 지도도 봐!'],
    ['🎁', '건물 안 놀이방마다 보물 상자가 3개 있어. 상자를 눌러서 퀴즈를 풀면 상자가 열려!'],
    ['🗝️', '상자 3개를 다 열면 열쇠가 나타나. 열쇠를 받으면 탐험 수첩에 도장도 쾅 찍혀.'],
    ['🎈', `도장 ${STAMPS_TO_FLY}개를 모두 모으면, 마을 북쪽 언덕의 열기구를 타고 하늘로 날아갈 수 있어!`],
    ['👕', '열쇠를 모을수록 날개나 왕관 같은 특별한 꾸미기가 열려. 건물에 다시 들어가면 새 문제가 나오니까 또 도전해 봐.'],
    ['🕹️', TOUCH ? '가고 싶은 곳을 손가락으로 누르면 걸어가. 모르는 게 있으면 언제든 나한테 와서 물어봐. 자, 출발!' : '가고 싶은 곳을 누르거나 방향키로 움직여. 모르는 게 있으면 언제든 나한테 와서 물어봐. 자, 출발!'],
  ];
}
let guideState = null;
function runGuide(first = false) {
  if (!world || guideState) return;
  const lines = guideLines();
  guideState = { i: 0, lines, first };
  world.paused = true; prompt(null); world.keysDown.clear();
  world.guideTalk(true);
  $('settings').hidden = true; $('emotes').hidden = true;
  $('guide').hidden = false;
  document.querySelector('.zoom').hidden = true;
  showGuideLine();
}
function showGuideLine() {
  const g = guideState; if (!g) return;
  const [face, text] = g.lines[g.i];
  $('guide').querySelector('.g-face span').textContent = face;
  $('g-step').textContent = `${g.i + 1} / ${g.lines.length}`;
  $('g-next').textContent = g.i === g.lines.length - 1 ? '출발! 🚀' : '다음 ▶';
  // 자막: 한 글자씩
  const p = $('g-text'); p.textContent = '';
  clearInterval(g.typer);
  let k = 0;
  g.typer = setInterval(() => { k += 2; p.textContent = text.slice(0, k); if (k >= text.length) clearInterval(g.typer); }, 30);
  speak(text);
  sfx.pop();
}
function endGuide() {
  const g = guideState; if (!g) return;
  clearInterval(g.typer);
  guideState = null;
  hush();
  $('guide').hidden = true;
  document.querySelector('.zoom').hidden = false;
  world.guideTalk(false);
  world.paused = false; prompt(world.near);
  store.set(`guided.${me.name}`, 'yes');
  if (g.first) toast('🏠 반짝이는 건물 문으로 들어가 봐요!', 3500);
}
$('g-next').addEventListener('click', () => {
  const g = guideState; if (!g) return;
  if (g.i < g.lines.length - 1) { g.i += 1; showGuideLine(); } else endGuide();
});
$('g-skip').addEventListener('click', endGuide);
$('g-voice').addEventListener('click', () => { const g = guideState; if (g) speakNow(g.lines[g.i][1]); });
$('guide-again').addEventListener('click', () => { $('settings').hidden = true; runGuide(false); });

// ---------------- 소리·화면 크기 설정 ----------------
function paintSettings() {
  document.querySelectorAll('#settings [data-sound]').forEach((b) => b.classList.toggle('on', !!sound[b.dataset.sound]));
  $('set-btn').textContent = sound.music || sound.sfx || sound.voice ? '⚙️' : '🔇';
}
document.querySelectorAll('#settings [data-sound]').forEach((b) => b.addEventListener('click', () => {
  unlockAudio();
  const k = b.dataset.sound;
  setSound(k, !sound[k]);
  paintSettings();
  if (k === 'sfx' && sound.sfx) sfx.good(3);
  if (k === 'voice' && sound.voice) speak('목소리 안내를 켰어요.');
}));
$('set-btn').addEventListener('click', () => { $('settings').hidden = !$('settings').hidden; $('emotes').hidden = true; paintSettings(); });
const zoomBy = (f) => { if (!world) return; world.setZoom(world.zoom * f); sfx.pop(); };
$('zoom-in').addEventListener('click', () => zoomBy(1 / 1.2));
$('zoom-out').addEventListener('click', () => zoomBy(1.2));
document.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => zoomBy(b.dataset.zoom === 'in' ? 1 / 1.2 : 1.2)));
function resetZoneView(subj) {
  const area = `zone:${subj}`;
  for (let i = 0; i < 3; i++) world.setStation(area, i, { solved: false });
  world.setKeyVisible(area, false);
}

function interact(it) {
  if (!world || world.paused || world.frozen || world.flying) return;
  unlockAudio();
  switch (it.kind) {
    case 'door': return enterZone(it.data.subj);
    case 'exit': { const subj = AREAS[world.area]?.subj; return world.goTo('plaza', subj ? world.plazaSpotFor(subj) : { x: -6, z: -33 }); }
    case 'station': return openStation(it.data.area, it.data.index);
    case 'key': return takeKey(AREAS[it.data.area].subj);
    case 'roofdoor': return enterBalloon();
    case 'gate': return openGate();
    case 'guide': return runGuide(false);
    default: return null;
  }
}

function enterZone(subj) {
  const area = `zone:${subj}`;
  let z = zones[subj];
  // 다 풀고 열쇠까지 받은 구역은 다시 들어오면 새 문제
  if (!z || z.taken) {
    z = zones[subj] = { puzzles: puzzlesFor(subj, me.grade), solved: [false, false, false], wrong: 0, hints: 0, taken: false };
    resetZoneView(subj);
  }
  world.goTo(area);
  const s = SUBJECT[subj];
  const times = prog.stamps[subj] | 0;
  world.setBoardText(area, times ? `도장 ✅ · 또 깨면 열쇠 하나 더! · ${me.grade}학년` : `보물 상자 3개를 열면 열쇠! · ${me.grade}학년`);
  toast(`${s.host} ${s.hostName}: "${s.hello}"`, 5200);
  speak(s.hello);
}

function openPz(pz, { title, color, onSolved }) {
  world.paused = true;
  prompt(null);
  world.keysDown.clear();
  bgm.duck(['melody', 'listen'].includes(pz.type) || (pz.type === 'match' && pz.speakLeft) ? 0.05 : 0.35);
  openPuzzle($('puzzle'), pz, {
    title, color, grade: me.grade, voice: sound.voice,
    onSolved: (st) => { bgm.duck(1); world.paused = false; prompt(world.near); onSolved(st); },
    onWrong: () => sendEv({ kind: 'wrong' }),
    onClose: () => { bgm.duck(1); world.paused = false; prompt(world.near); },
  });
  $('puzzle').querySelector('.pz-icon[aria-label="힌트 보기"]')?.addEventListener('click', () => sendEv({ kind: 'hint' }));
}

function openStation(area, i) {
  if (area === 'balloon') return openFinalStation(i);
  const subj = AREAS[area].subj;
  const z = zones[subj];
  if (!z) return null;
  if (z.solved[i]) { toast('✅ 이미 연 상자예요. 다른 상자를 열어 봐요!'); return null; }
  const s = SUBJECT[subj];
  return openPz(z.puzzles[i], {
    title: `${s.emoji} ${s.name} · ${i + 1}번 보물 상자`, color: s.color,
    onSolved: (st) => {
      z.solved[i] = true; z.wrong += st.wrong; z.hints += st.hints;
      prog.right += 1; saveProg();
      world.setStation(area, i, { solved: true });
      const p = world.stationPos(area, i); if (p) world.celebrate(p.x, p.z);
      sendEv({ kind: 'solve', subj });
      const left = z.solved.filter((x) => !x).length;
      if (left) toast(`🎁 상자가 열렸어요! 남은 상자 ${left}개`);
      else { world.setKeyVisible(area, true); sfx.win(); toast('✨ 열쇠가 나타났어요! 가운데로 가서 받아요!', 3500); speak('열쇠가 나타났어요!'); }
    },
  });
}

function takeKey(subj) {
  const z = zones[subj];
  if (!z || z.taken || z.solved.some((x) => !x)) return;
  z.taken = true;
  const area = `zone:${subj}`;
  world.setKeyVisible(area, false);
  const stars = Math.max(1, 3 - (z.wrong >= 3 ? 1 : 0) - (z.hints >= 2 ? 1 : 0));
  const before = prog.keys;
  const first = !(prog.stamps[subj] > 0);
  prog.keys += 1;
  prog.stamps[subj] = (prog.stamps[subj] | 0) + 1;
  prog.stars[subj] = Math.max(prog.stars[subj] || 0, stars);
  saveProg();
  refreshHud();
  sendEv({ kind: 'key', subj, keys: prog.keys, stamps: stampList() });
  world.celebrate(world.pos.x, world.pos.z, true);
  sfx.win();
  const s = SUBJECT[subj];
  const n = stampList().length;
  const unlocked = SPECIALS.filter((x) => x.need > before && x.need <= prog.keys);
  const next = n >= STAMPS_TO_FLY ? '🎈 도장을 다 모았어요! 마을 북쪽 언덕의 열기구로 가 봐요!' : `열기구까지 도장 ${STAMPS_TO_FLY - n}개 더!`;
  speak(first ? `${s.name} 도장 쾅! 열쇠를 얻었어요!` : '열쇠를 하나 더 얻었어요!');
  const after = () => { if (unlocked.length) showUnlock(unlocked); };
  modal(`
    <div class="m-emoji">🗝️</div>
    <h2>${first ? `${esc(s.name)} 도장 쾅! 📒` : '열쇠를 하나 더 얻었어요!'}</h2>
    <p class="m-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</p>
    <p>🗝️ 모은 열쇠 <b>${prog.keys}</b>개 · 📒 도장 <b>${n}</b>/${STAMPS_TO_FLY}<br>${first ? next : '이 건물에 다시 들어오면 새 문제가 나와요.'}</p>
  `, [['🏡 마을로 나가기', () => { world.goTo('plaza', world.plazaSpotFor(subj)); after(); }, 'ok'], ['여기 더 있기', after, 'ghost']]);
}

// 새로 열린 특별 꾸미기
function showUnlock(list) {
  sfx.win();
  speak('새 꾸미기가 열렸어요!');
  modal(`
    <div class="m-emoji">🎁</div>
    <h2>새 꾸미기가 열렸어요!</h2>
    <div>${list.map((x) => `<span class="unlock-item">${esc(x.label)}</span>`).join(' ')}</div>
    <p>열쇠를 더 모으면 더 멋진 꾸미기가 열려요.</p>
  `, [['👕 지금 꾸며 보기', () => openDresser('edit', afterDress), 'ok'], ['계속 탐험하기', null, 'ghost']]);
}
function afterDress() {
  world.setPlayer(me.name, me.look, prog.keys);
  show('screen-game'); world.resize();
  sendEv({ kind: 'look', look: me.look });
  toast('✨ 멋져요!');
}

// ---------------- 열기구 탈출장 ----------------
function enterBalloon() {
  const n = stampList().length;
  if (n < STAMPS_TO_FLY) {
    const miss = SUBJECTS.filter((s) => !(prog.stamps[s.id] > 0)).map((s) => s.emoji).join(' ');
    toast(`🔒 도장 ${STAMPS_TO_FLY - n}개가 더 필요해요! 아직 안 간 곳: ${miss}`, 4000); sfx.fail(); return;
  }
  if (!final || final.done) {
    const puzzles = finalPuzzles(me.grade);
    const digits = puzzles.map(() => Math.floor(Math.random() * 10));
    final = { puzzles, solved: puzzles.map(() => false), digits, code: digits.join(''), done: false };
    puzzles.forEach((_, i) => world.setStation('balloon', i, { solved: false }));
  }
  world.goTo('balloon');
  toast('🎈 열기구 탈출장! 상자 4개에서 비밀번호 숫자를 찾아 열기구를 깨워요!', 5000);
  speak('상자 네 개에서 숫자를 찾아요!');
}
function openFinalStation(i) {
  if (final.solved[i]) { toast(`${i + 1}번 상자의 숫자는 ${final.digits[i]}이에요.`); return; }
  const pz = final.puzzles[i];
  const s = SUBJECT[pz.subj] || SUBJECT.kor;
  openPz(pz, {
    title: `🎈 ${i + 1}번 상자 · ${s.short}`, color: s.color,
    onSolved: () => {
      final.solved[i] = true;
      world.setStation('balloon', i, { solved: true, text: `${i + 1}번 숫자: ${final.digits[i]}` });
      const p = world.stationPos('balloon', i); if (p) world.celebrate(p.x, p.z);
      sendEv({ kind: 'solve', subj: 'balloon' });
      toast(`🔢 ${i + 1}번 숫자는 ${final.digits[i]}! 잘 기억해요.`, 3500);
      speak(`${i + 1}번 숫자는 ${final.digits[i]}`);
    },
  });
}
function openGate() {
  if (!final) return;
  const found = final.digits.map((d, i) => (final.solved[i] ? d : '?')).join(' ');
  if (final.solved.some((x) => !x)) { toast(`🔒 아직 못 연 상자가 있어요. 찾은 숫자: ${found}`); return; }
  openPz({ type: 'number', q: `상자에서 찾은 숫자 4개를\n1번 상자부터 차례대로 넣어요.\n찾은 숫자: ${found}`, a: final.code, hint: '1번 → 2번 → 3번 → 4번 상자 순서예요.' }, {
    title: '🎈 열기구 비밀번호', color: '#ff6b8b',
    onSolved: () => {
      final.done = true;
      prog.flights += 1; saveProg();
      sendEv({ kind: 'escape' });
      sfx.win();
      speak('열기구가 날아올라요! 탐험 성공!');
      world.paused = true; prompt(null);
      world.flyAway(() => {
        world.paused = false;
        const stars = Object.values(prog.stars).reduce((a, b) => a + b, 0);
        modal(`
          <div class="m-emoji">🎈</div>
          <h2>탐험 성공!</h2>
          <p><b>${esc(me.name)}</b> 탐험대원, 열기구를 타고 날아올랐어요!</p>
          <p class="m-stars">🗝️ ${prog.keys} · ⭐ ${stars} · 🎈 ${prog.flights}번째 비행</p>
          <p>건물 놀이방을 다시 깨면 열쇠가 더 모이고, 특별 꾸미기가 계속 열려요!</p>
        `, [['🗺️ 공원으로 돌아가기', () => { world.landBalloon(); world.goTo('plaza'); }, 'ok']]);
      });
    },
  });
}

// ---------------- 탐험 수첩 ----------------
function openBook() {
  const n = stampList().length;
  const nx = nextSpecial(prog.keys);
  const opened = SPECIALS.filter((x) => x.need <= prog.keys);
  modal(`
    <div class="m-emoji">📒</div>
    <h2>${esc(me.name)}의 탐험 수첩</h2>
    <p>🗝️ 열쇠 <b>${prog.keys}</b>개 · 📒 도장 <b>${n}</b>/${STAMPS_TO_FLY} · 🎈 비행 <b>${prog.flights}</b>번</p>
    <div class="book-grid">${SUBJECTS.map((s) => `<div class="${prog.stamps[s.id] ? 'got' : ''}"><b>${s.emoji}</b>${esc(s.name)}<br>${prog.stamps[s.id] ? `✅ ${prog.stamps[s.id]}번 · ${'⭐'.repeat(prog.stars[s.id] || 0)}` : '아직이에요'}</div>`).join('')}</div>
    <p class="book-next">${n >= STAMPS_TO_FLY ? '🎈 열기구를 탈 수 있어요!' : `🎈 열기구까지 도장 ${STAMPS_TO_FLY - n}개`}<br>${nx ? `🎁 열쇠 ${nx.need - prog.keys}개 더 모으면 <b>${esc(nx.label)}</b>!` : '🎉 특별 꾸미기를 모두 열었어요!'}</p>
    ${opened.length ? `<p>열린 특별 꾸미기: ${opened.map((x) => esc(x.label)).join(' · ')}</p>` : ''}
  `, [['👕 꾸미기', () => openDresser('edit', afterDress), 'ok'], ['닫기', null, 'ghost']]);
}
$('book-btn').addEventListener('click', openBook);
$('keys').addEventListener('click', openBook);
$('dress-btn').addEventListener('click', () => openDresser('edit', afterDress));

// ---------------- 알림 창 ----------------
function modal(html, buttons = [['확인', null, 'ok']]) {
  const m = $('modal');
  if (world) world.paused = true;
  if (world) prompt(null);
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
  const b = $('banner'); b.textContent = text; b.hidden = false;
  clearTimeout(banner.t); banner.t = setTimeout(() => { b.hidden = true; }, ms);
}

// ---------------- 기분 표현·움직이기 막대·나가기 ----------------
$('emote-btn').addEventListener('click', () => { $('emotes').hidden = !$('emotes').hidden; $('settings').hidden = true; });
EMOTES.forEach((em) => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = em; b.setAttribute('aria-label', `기분 ${em}`);
  b.addEventListener('click', () => { $('emotes').hidden = true; if (mode === 'online' && client) client.send({ t: 'emo', e: em }); else world.emote(em); });
  $('emotes').append(b);
});
(function joystick() {
  const stick = $('stick'); const knob = stick.querySelector('i');
  let id = null; let cx = 0; let cy = 0; const R = 46;
  const move = (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - cx; let dy = e.clientY - cy; const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    world?.setJoystick(dx / R, dy / R);
  };
  stick.addEventListener('pointerdown', (e) => { id = e.pointerId; stick.setPointerCapture(id); const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); });
  stick.addEventListener('pointermove', move);
  const end = (e) => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; world?.setJoystick(0, 0); };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
}());
$('quit').addEventListener('click', () => {
  modal('<div class="m-emoji">🚪</div><h2>공원에서 나갈까요?</h2><p>모은 열쇠와 도장은 이 기기에 저장돼요.</p>', [['나가기', leaveGame, 'ok'], ['계속 탐험하기', null, 'ghost']]);
});
function leaveGame() {
  bgm.wanted = false; bgm.stop();
  if (guideState) endGuide();
  client?.leave(); client = null;
  for (const id of [...world.remotes.keys()]) world.removeRemote(id);
  $('puzzle').hidden = true; $('frozen').hidden = true;
  world.paused = false; world.frozen = false;
  show('screen-home');
}

// ---------------- 친구들과 (학생) ----------------
let lastSent = '';
function sendState(force = false) {
  if (mode !== 'online' || !client || !world) return;
  const s = world.getState();
  const k = `${s.x},${s.z},${s.r},${s.a}`;
  if (!force && k === lastSent) return;
  lastSent = k;
  client.send({ t: 'st', ...s });
}
function sendEv(ev) { if (mode === 'online') client?.send({ t: 'ev', ...ev }); }
const hello = () => ({ name: me.name, grade: me.grade, look: me.look, keys: prog.keys, stamps: stampList() });
let myId = null;
function onNet(m) {
  if (!m || !world) return;
  switch (m.t) {
    case 'welcome': myId = m.id; setFrozen(!!m.frozen); break;
    case 'ros': {
      const ids = new Set();
      for (const p of m.list || []) { if (p.id === myId) continue; ids.add(p.id); world.upsertRemote(p.id, p.n, p.l, p.k); }
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
      if ($('screen-avatar').classList.contains('active')) { show('screen-game'); world.resize(); }
      world.landBalloon(); world.goTo('plaza'); banner('🏠 선생님이 모두 분수 광장으로 불렀어요!'); speak('모두 분수 광장으로 모여요!');
      break;
    case 'cheer':
      if (m.id !== myId) { toast(m.kind === 'escape' ? `🎈 ${m.name} 대원이 열기구를 탔어요!` : `🗝️ ${m.name} 대원이 ${SUBJECT[m.subj]?.name || ''}에서 열쇠를 찾았어요!`); world.celebrateRemote(m.id); }
      break;
    case 'rank':
      modal(`<div class="m-emoji">🏆</div><h2>지금 순위</h2><ol class="m-rank">${(m.list || []).map((p) => `<li><b>${esc(p.n)}</b> 📒${p.st} 🗝️${p.k}${p.e ? ' 🎈' : ''}</li>`).join('')}</ol>`);
      break;
    case 'kick': case 'end':
      client?.leave(); client = null;
      leaveGame();
      homeError(m.t === 'end' ? '선생님이 수업을 끝냈어요. 수고했어요! 👏' : '선생님이 수업에서 내보냈어요.');
      break;
    default: break;
  }
}
function setFrozen(on) { $('frozen').hidden = !on; if (world) { world.frozen = on; if (on) world.keysDown.clear(); } }
function netStatus(s) {
  const n = $('net');
  n.hidden = mode !== 'online';
  if (s === 'online') { n.textContent = '🟢 함께하는 중'; n.className = 'pill'; client?.hello(hello()); sendState(true); }
  else if (s === 'reconnecting') { n.textContent = '🟡 다시 연결 중…'; n.className = 'pill warn'; }
  else if (s === 'lost') { n.textContent = '🔴 연결 끊김'; n.className = 'pill bad'; banner('선생님 기기와 연결이 끊겼어요. 나갔다가 다시 들어와 주세요.', 10000); }
}

// ---------------- 첫 화면 단추 ----------------
function beginWith(after) {
  readName(); homeError('');
  prog = loadProg();
  me.look = loadLook();
  openDresser('start', after);
}
$('solo').addEventListener('click', () => { unlockAudio(); beginWith(() => startGame('solo')); });
$('code').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });
$('code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('join').click(); });
let sendTimer = null;
$('join').addEventListener('click', () => {
  unlockAudio();
  const code = $('code').value.trim();
  if (!/^\d{4}$/.test(code)) { homeError('선생님이 알려 준 숫자 4개를 넣어 주세요.'); $('code').focus(); return; }
  beginWith(async () => {
    const go = $('av-go');
    go.disabled = true; go.textContent = '⏳ 친구들에게 가는 중…';
    client = new Client({ onMessage: onNet, onStatus: netStatus });
    mode = 'online';
    try {
      await client.join(code, hello());
      startGame('online');
      netStatus('online');
      clearInterval(sendTimer);
      sendTimer = setInterval(() => sendState(), 125);
    } catch (err) {
      client?.leave(); client = null; mode = 'solo';
      show('screen-home');
      homeError(err.message || '연결하지 못했어요.');
    } finally { go.disabled = false; go.textContent = '공원으로 출발! 🌳'; }
  });
});

// ---------------- 선생님 ----------------
$('host').addEventListener('click', async () => {
  unlockAudio();
  const btn = $('host');
  btn.disabled = true; btn.querySelector('b').textContent = '⏳ 공원을 여는 중…';
  homeError('');
  host = new Host({ onRoster: () => drawTeacher(), onEvent: teacherEvent, onStatus: teacherStatus });
  try {
    const code = await host.open();
    mode = 'teacher';
    startTeacher(code);
  } catch (err) {
    host = null;
    homeError(err.message || '공원을 열지 못했어요.');
  } finally { btn.disabled = false; btn.querySelector('b').textContent = '선생님: 공원 열기'; }
});
let viewArea = 'plaza';
let wakeLock = null;
function startTeacher(code) {
  ensureWorld();
  if (world.player) { world.scene.remove(world.player); if (world.player.userData.pet) world.scene.remove(world.player.userData.pet); world.player = null; }
  $('t-world-slot').append($('world'));
  world.spectate(viewArea);
  $('t-code').textContent = code;
  const url = new URL(location.href); url.search = ''; url.hash = '';
  $('t-url').textContent = `주소: ${url.href.replace(/index\.html$/, '')}`;
  show('screen-teacher');
  world.resize();
  drawAreas(); drawTeacher();
  setInterval(syncTeacherWorld, 125);
  setInterval(drawTeacher, 2000);
  navigator.wakeLock?.request('screen').then((l) => { wakeLock = l; }).catch(() => {});
  window.addEventListener('beforeunload', (e) => { if (mode === 'teacher') { e.preventDefault(); e.returnValue = ''; } });
}
function drawAreas() {
  const counts = {};
  if (host) for (const s of host.students.values()) if (s.online) counts[s.a] = (counts[s.a] || 0) + 1;
  const box = $('t-areas');
  if (!box.children.length) {
    const list = [['plaza', '🏡 마을'], ...SUBJECTS.map((s) => [`zone:${s.id}`, `${s.emoji} ${s.short}`]), ['balloon', '🎈 열기구']];
    for (const [a, label] of list) {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.area = a;
      b.innerHTML = `${label} <b hidden></b>`;
      b.addEventListener('click', () => { viewArea = a; world.spectate(a); drawAreas(); });
      box.append(b);
    }
  }
  for (const b of box.children) {
    b.classList.toggle('on', b.dataset.area === viewArea);
    const n = counts[b.dataset.area] || 0; const tag = b.querySelector('b');
    tag.hidden = !n; tag.textContent = n;
  }
}
function syncTeacherWorld() {
  if (!host || !world) return;
  const seen = new Set();
  for (const s of host.students.values()) {
    if (!s.online) continue;
    seen.add(s.pid);
    world.upsertRemote(s.pid, s.name, s.look, s.keys);
    world.moveRemote(s.pid, s.x, s.z, s.r, s.a);
  }
  for (const id of [...world.remotes.keys()]) if (!seen.has(id)) world.removeRemote(id);
}
function teacherEvent(s, ev) {
  if (ev.kind === 'emo') { world?.emoteRemote(s.pid, ev.e); return; }
  const text = {
    join: `👋 ${s.name}(${s.grade}학년) 들어왔어요`,
    key: `🗝️ ${s.name} — ${SUBJECT[ev.subj]?.name || ''} 열쇠! (도장 ${s.stamps.length}개)`,
    escape: `🎈 ${s.name} 열기구 탈출 성공!`,
  }[ev.kind];
  if (text) logTeacher(text);
  if (ev.kind === 'key' || ev.kind === 'escape') { sfx.good(4); world?.celebrateRemote(s.pid); }
}
function logTeacher(text) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ${text}`;
  $('t-log').prepend(li);
  while ($('t-log').children.length > 30) $('t-log').lastChild.remove();
}
function teacherStatus(s, text) {
  const el = $('t-status');
  if (s === 'open') el.textContent = '🟢 연결됨';
  else if (s === 'reconnecting') el.textContent = '🟡 다시 연결 중';
  else if (s === 'error') el.textContent = `🔴 ${text}`;
}
let drawQueued = false;
function drawTeacher() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    if (!host) return;
    const list = [...host.students.values()].sort((a, b) => (b.online - a.online) || (b.stamps.length - a.stamps.length) || (b.keys - a.keys) || (b.right - a.right) || a.name.localeCompare(b.name));
    $('t-num').textContent = list.filter((s) => s.online).length;
    $('t-rows').innerHTML = list.length ? list.map((s) => `
      <tr class="${s.online ? '' : 'off'}">
        <td><i class="dot" style="background:${esc(s.color)}"></i>${esc(s.name)}${s.flights ? ` 🎈${s.flights > 1 ? s.flights : ''}` : ''}</td>
        <td>${s.grade}</td>
        <td>${s.online ? areaName(s.a) : '⚪ 나감'}</td>
        <td class="st">${SUBJECTS.map((x) => (s.stamps.includes(x.id) ? x.emoji : '·')).join('')} <small>${s.stamps.length}/9</small></td>
        <td>${s.keys}</td><td>${s.right}</td><td>${s.wrong}</td><td>${s.hints}</td>
        <td><button type="button" class="kick" data-id="${esc(s.pid)}" title="내보내기" aria-label="${esc(s.name)} 내보내기">✕</button></td>
      </tr>`).join('') : '<tr><td colspan="9" class="empty">아직 아무도 안 들어왔어요. 수업 코드를 알려 주세요!</td></tr>';
    drawAreas();
  });
}
$('t-rows').addEventListener('click', (e) => {
  const b = e.target.closest('.kick'); if (!b) return;
  const s = host.students.get(b.dataset.id);
  if (s && confirm(`${s.name}을(를) 수업에서 내보낼까요?`)) host.kick(s.pid);
});
$('t-notice').addEventListener('click', () => {
  const text = window.prompt('아이들 화면에 보낼 알림을 써 주세요 (예: 5분 남았어요!)');
  if (text?.trim()) { host.notice(text.trim()); logTeacher(`📢 알림: ${text.trim()}`); }
});
$('t-freeze').addEventListener('click', () => {
  const on = !host.frozen; host.freeze(on);
  $('t-freeze').textContent = on ? '▶️ 다시 움직여요' : '⏸️ 모두 멈춰!';
  $('t-freeze').classList.toggle('on', on);
});
$('t-call').addEventListener('click', () => host.callLobby());
$('t-rank').addEventListener('click', () => {
  const list = host.ranking();
  modal(`<div class="m-emoji">🏆</div><h2>지금 순위</h2><ol class="m-rank">${list.map((p) => `<li><b>${esc(p.n)}</b> 📒${p.st} 🗝️${p.k}${p.e ? ' 🎈' : ''}</li>`).join('') || '<li>아직 아무도 없어요</li>'}</ol>`);
});
$('t-end').addEventListener('click', () => {
  if (!confirm('수업을 끝낼까요? 아이들 화면도 모두 첫 화면으로 돌아가요.')) return;
  host.close(); host = null; mode = 'solo';
  wakeLock?.release?.(); wakeLock = null;
  location.reload();
});

// 시험용 손잡이 (?debug)
if (Q.has('debug')) {
  window.__ys = {
    get world() { return world; }, interact, zones, get final() { return final; }, get prog() { return prog; }, set prog(p) { prog = p; },
    get host() { return host; }, me, refreshHud, saveProg,
  };
}
