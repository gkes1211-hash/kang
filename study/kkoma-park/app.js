// 꼬마 탐험대 공원: 첫 화면 → 캐릭터 꾸미기 → 3D 공원(혼자 / 친구들과) 또는 선생님 화면
import { World, AREAS } from './world.js';
import { SUBJECTS, SUBJECT, STAMPS_TO_FLY, puzzlesFor, finalPuzzles, JOBS, JOB, jobPuzzles } from './content.js';
import { ISLANDS } from './islands.js';
import { openPuzzle } from './puzzles.js';
import { Host, Client, EMOTES, cleanName } from './net.js';
import { randomLook, cleanLook, CATS, SPECIALS, nextSpecial, loadChars, charsReady, drawChar, charBox, drawThumb, SKINS, FACES, HAIRS, TOPS, BOTTOMS, SHOES, ACCS, PALETTE, HAIR_PALETTE, PART_KINDS, partNeed, partOpen } from './chars.js';
loadChars().catch(() => {});
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
let prog = { keys: 0, stamps: {}, stars: {}, flights: 0, right: 0, stage: {}, jobs: {} };
function loadProg() {
  try {
    const p = JSON.parse(store.get(progKey(), '{}'));
    return { keys: Math.max(0, p.keys | 0), stamps: p.stamps && typeof p.stamps === 'object' ? p.stamps : {}, stars: p.stars || {}, flights: p.flights | 0, right: p.right | 0, stage: p.stage && typeof p.stage === 'object' ? p.stage : {}, jobs: p.jobs && typeof p.jobs === 'object' ? p.jobs : {} };
  } catch { return { keys: 0, stamps: {}, stars: {}, flights: 0, right: 0, stage: {}, jobs: {} }; }
}
const saveProg = () => store.set(progKey(), JSON.stringify(prog));
const stampList = () => SUBJECTS.filter((s) => prog.stamps[s.id] > 0).map((s) => s.id);
const jobList = () => Object.keys(prog.jobs || {}).filter((k) => prog.jobs[k]);
function loadLook() { try { const l = JSON.parse(store.get(`look.${me.name}`, 'null')); return l ? cleanLook(l, prog.keys, jobList()) : randomLook(0); } catch { return randomLook(0); } }
const saveLook = () => store.set(`look.${me.name}`, JSON.stringify(me.look));

// ============================================================
// 캐릭터 꾸미기 화면
// ============================================================
const dresser = { onDone: null, mode: 'start', r: null, view: 0, paint: 'top' };
const VIEWS = ['front', 'sideL', 'back'];
// 미리보기: 받침대 위의 큰 캐릭터. 누르면 앞 → 옆 → 뒤로 돌려 본다
function setupPreview() {
  if (dresser.r) return;
  const canvas = $('av-canvas'); const g = canvas.getContext('2d');
  let drag = null; let moved = 0;
  canvas.addEventListener('pointerdown', (e) => { drag = e.clientX; moved = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (drag == null) return; moved += e.clientX - drag; drag = e.clientX; if (Math.abs(moved) > 40) { dresser.view = (dresser.view + (moved > 0 ? 2 : 1)) % 3; moved = 0; sfx.pop(); } });
  canvas.addEventListener('pointerup', () => { if (drag != null && Math.abs(moved) < 6) { dresser.view = (dresser.view + 1) % 3; sfx.pop(); } drag = null; });
  let t = 0; let last = performance.now();
  dresser.r = { canvas, g };
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!$('screen-avatar').classList.contains('active') || !charsReady()) return;
    t += (now - last) / 1000; last = now;
    const w = canvas.clientWidth; const h = canvas.clientHeight; const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height); g.imageSmoothingEnabled = false;
    const view = VIEWS[dresser.view];
    const c = drawChar(me.look, view); if (!c) return;
    const [bx, by, bw, bh] = charBox(me.look, view) || [0, 0, c.width, c.height];
    const sc = Math.min(canvas.width * 0.8 / bw, canvas.height * 0.8 / bh);
    const dw = bw * sc; const dh = bh * sc; const bob = Math.sin(t * 2.4) * 3 * dpr;
    const hasPet = me.look.pet && me.look.pet !== 'none';
    const cx = canvas.width / 2 - (hasPet ? dw * 0.08 : 0); const foot = canvas.height * 0.9;
    // 받침대
    const pr = Math.min(canvas.width * 0.42, dw * 0.75);
    g.fillStyle = '#b7a6e8'; g.beginPath(); g.ellipse(canvas.width / 2, foot + 8 * dpr, pr, pr * 0.24, 0, 0, 7); g.fill();
    g.fillStyle = '#e7e0ff'; g.beginPath(); g.ellipse(canvas.width / 2, foot, pr, pr * 0.24, 0, 0, 7); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 3 * dpr; g.beginPath(); g.ellipse(canvas.width / 2, foot, pr * 0.78, pr * 0.17, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(80,60,140,0.22)'; g.beginPath(); g.ellipse(cx, foot, dw * 0.3, dh * 0.03, 0, 0, 7); g.fill();
    g.drawImage(c, bx, by, bw, bh, cx - dw / 2, foot - dh + bob * 0.4, dw, dh);
    if (hasPet) { g.font = `${Math.round(dh * 0.17)}px sans-serif`; g.textAlign = 'center'; g.fillText({ chick: '🐥', puppy: '🐶', kitty: '🐱', turtle: '🐢', dragon: '🐉' }[me.look.pet] || '', canvas.width / 2 + dw * 0.42, foot - Math.abs(Math.sin(t * 3)) * 8 * dpr); }
  };
  requestAnimationFrame(loop);
}
function refreshPreview() { /* 그림은 매 화면마다 다시 그린다 */ }
// 색칠할 수 있는 것: [이름, look 의 색 칸, 팔레트]
const PAINT = { hair: ['머리', 'hc', HAIR_PALETTE], top: ['윗옷', 'tc', PALETTE], bot: ['아래옷', 'bc', PALETTE], shoe: ['신발', 'sc', PALETTE] };
// 꾸미기 판: [제목 아이콘, 제목, [[종류, 이름 목록], ...]]
const PANELS = [
  ['🎨', '피부색', [['skin', SKINS]]],
  ['😊', '얼굴 표정', [['face', FACES]]],
  ['💇', '머리 스타일', [['hair', HAIRS]]],
  ['👕', '옷 상의', [['top', TOPS]]],
  ['👖', '옷 하의 & 신발', [['bot', BOTTOMS], ['shoe', SHOES]]],
  ['🧢', '모자 & 소품', [['acc', ACCS.map((a) => a[0])]]],
];
const isOn = (kind, i) => (kind === 'acc' ? me.look[ACCS[i][1]] === i : me.look[kind] === i);
function pickPart(kind, i) {
  if (kind === 'acc') { const slot = ACCS[i][1]; me.look[slot] = me.look[slot] === i ? -1 : i; } else me.look[kind] = i;
  if (PAINT[kind]) dresser.paint = kind;
  if (kind === 'acc' && me.look[ACCS[i][1]] === i && dresser.view === 2 && ACCS[i][1] === 'eye') dresser.view = 0;
  sfx.pop(); renderDresser();
}
function renderDresser() {
  $('av-name').textContent = me.name;
  const body = $('av-body'); body.innerHTML = '';
  const ready = charsReady();
  for (const [icon, title, groups] of PANELS) {
    const panel = document.createElement('section'); panel.className = 'av-panel';
    panel.innerHTML = `<h3><i>${icon}</i>${esc(title)}</h3>`;
    const grid = document.createElement('div'); grid.className = 'partpick';
    for (const [kind, names] of groups) {
      names.forEach((nm, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(isOn(kind, i))); b.setAttribute('aria-label', nm); b.title = nm;
        const locked = kind !== 'skin' && !partOpen(kind, i, prog.keys); const need = kind !== 'skin' ? partNeed(kind, i) : 0;
        const th = ready ? drawThumb(kind, i, me.look) : null;
        if (th) { const c = document.createElement('canvas'); c.width = th.width; c.height = th.height; c.getContext('2d').drawImage(th, 0, 0); b.append(c); } else b.textContent = nm;
        if (locked) { b.classList.add('locked'); b.dataset.need = `🔒${need}`; b.title = `열쇠 ${need}개를 모으면 열려요`; }
        b.addEventListener('click', () => {
          if (locked) { sfx.fail(); flashKeys(`🔒 열쇠 ${need}개를 모으면 "${nm}"이(가) 열려요! (지금 ${prog.keys}개)`); return; }
          pickPart(kind, i);
        });
        grid.append(b);
      });
    }
    panel.append(grid); body.append(panel);
  }
  // 같이 다니는 친구 · 직업 배지
  for (const [title, key, list] of [['🐾 같이 다니는 친구', 'pet', CATS.pet], ['🏢 직업 배지 (직업 체험관에서 체험하면 열려요)', 'job', CATS.job]]) {
    const panel = document.createElement('section'); panel.className = 'av-panel wide';
    panel.innerHTML = `<h3>${esc(title)}</h3>`;
    const row = document.createElement('div'); row.className = 'chips';
    list.forEach(([id, label, need]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      const jobNeed = typeof need === 'string' ? JOB[need.slice(4)] : null;
      const locked = jobNeed ? !prog.jobs?.[jobNeed.id] : need > prog.keys;
      if (jobNeed || need > 0) b.classList.add('special');
      if (locked) { b.classList.add('locked'); b.dataset.need = jobNeed ? '🔒🏢' : `🔒🗝️${need}`; b.title = jobNeed ? `직업 체험관에서 ${jobNeed.name} 체험을 하면 열려요` : `열쇠 ${need}개를 모으면 열려요`; }
      b.setAttribute('aria-pressed', String(me.look[key] === id));
      b.addEventListener('click', () => {
        if (locked) { sfx.fail(); flashKeys(jobNeed ? `🔒 생활 섬 🏢 직업 체험관에서 ${jobNeed.emoji} ${jobNeed.name} 미션을 해내면 "${label}"이(가) 열려요!` : `🔒 열쇠 ${need}개를 모으면 "${label}"이(가) 열려요! (지금 ${prog.keys}개)`); return; }
        me.look[key] = id; sfx.pop(); renderDresser();
      });
      row.append(b);
    });
    panel.append(row); body.append(panel);
  }
  renderPalette();
  const nx = nextSpecial(prog.keys);
  $('av-keys').innerHTML = `🗝️ 모은 열쇠 <b>${prog.keys}</b>개<br>${nx ? `다음에 열리는 것: ${esc(nx.label)} (열쇠 ${nx.need}개)` : '🎉 꾸미기와 친구를 모두 열었어요!'}`;
}
// 색 고르기: 머리·윗옷·아래옷·신발 중 하나를 골라 색을 바꾼다
function renderPalette() {
  const el = $('av-palette'); const [name, key, pal] = PAINT[dresser.paint];
  el.innerHTML = `<div class="pal-tabs">${Object.entries(PAINT).map(([k, v]) => `<button type="button" data-paint="${k}" aria-pressed="${k === dresser.paint}">${v[0]}</button>`).join('')}</div>
    <div class="pal-row" aria-label="${esc(name)} 색"><button type="button" class="pal-orig" data-c="-1" aria-pressed="${me.look[key] === -1}" title="원래 색">원래</button>${pal.map((c, i) => `<button type="button" data-c="${i}" style="background:${c}" aria-label="${esc(name)} 색 ${i + 1}" aria-pressed="${me.look[key] === i}"></button>`).join('')}</div>`;
  el.querySelectorAll('[data-paint]').forEach((b) => b.addEventListener('click', () => { dresser.paint = b.dataset.paint; sfx.pop(); renderPalette(); }));
  el.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { me.look[key] = Number(b.dataset.c); sfx.pop(); renderDresser(); }));
}
function flashKeys(text) { const k = $('av-keys'); const old = k.innerHTML; k.innerHTML = text; k.style.background = '#ffe0d9'; setTimeout(() => { k.style.background = ''; renderDresser(); void old; }, 2200); }
$('av-random').addEventListener('click', () => { me.look = randomLook(prog.keys); sfx.good(3); renderDresser(); refreshPreview(); });
$('av-back').addEventListener('click', () => { if (dresser.mode === 'edit') { show('screen-game'); world?.resize(); } else show('screen-home'); });
$('av-go').addEventListener('click', () => { unlockAudio(); me.look = cleanLook(me.look, prog.keys, jobList()); saveLook(); const f = dresser.onDone; dresser.onDone = null; f?.(); });
function openDresser(mode, onDone) {
  dresser.mode = mode; dresser.onDone = onDone;
  $('av-go').textContent = mode === 'edit' ? '✔ 이대로 할래요!' : '✔ 공원으로 출발!';
  $('av-back').textContent = mode === 'edit' ? '◀ 그냥 돌아가기' : '◀ 뒤로';
  if (!me.look) me.look = loadLook();
  show('screen-avatar');
  setupPreview();
  renderDresser();
  if (!charsReady()) loadChars().then(() => { if ($('screen-avatar').classList.contains('active')) renderDresser(); }).catch(() => {});
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
  world.onOverview = (on, v) => {
    const b = $('overview'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    $('stamps').hidden = on;
    // 섬 전체 → "돌아가기"(내 캐릭터 쪽으로), 섬 하나 → "전체"(섬 전체로)
    const toAll = v !== 'all';
    b.querySelector('small').textContent = toAll ? '전체' : '돌아가기'; b.title = toAll ? '섬 전체 보기' : '내 캐릭터 쪽으로 돌아가기';
    showIsleCards(v === 'all');
    if (v === 'all') toast('🗺️ 가고 싶은 건물 이름을 누르면 바로 가요! 섬 이름을 누르면 그 섬을 크게 볼 수 있어요.', 4200);
    else if (on) toast('🏠 가고 싶은 건물을 누르면 그 건물 앞으로 바로 가요. 🗺️ 전체를 누르면 다른 섬도 볼 수 있어요.', 4200);
  };
  world.onQuick = (subj) => { const s2 = SUBJECT[subj]; toast(s2 ? `✨ ${s2.emoji} ${s2.name} 앞에 왔어요! 문으로 들어가 봐요.` : '✨ 열기구 언덕에 왔어요!', 3000); sfx.pop?.(); };
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
// ---------------- 섬 전체 보기: 섬마다 건물 이름 카드 ----------------
// 3D 이름표는 멀리서 작아지거나 겹치니, 화면 위·아래·왼쪽·오른쪽에 섬 방향대로 늘 같은 크기로 읽히는 카드를 놓는다.
function showIsleCards(on) {
  const host = $('isle-cards');
  if (!on) { host.hidden = true; host.innerHTML = ''; return; }
  host.innerHTML = '';
  for (const isl of ISLANDS) {
    const card = document.createElement('div'); card.className = `isle-card isle-${isl.id}`; card.style.setProperty('--c', isl.color || '#c98a52'); card.dataset.isl = isl.id;
    const t = document.createElement('button'); t.type = 'button'; t.className = 'isle-title';
    t.textContent = isl.id === 'hub' ? '⛲ 분수 광장' : `${isl.emoji} ${isl.name}`;
    if (isl.id !== 'hub') { t.title = `${isl.name} 크게 보기`; t.addEventListener('click', () => { sfx.pop(); world.setView(isl.id); }); }
    else t.addEventListener('click', () => { sfx.pop(); world.setView('normal'); });
    const list = document.createElement('div'); list.className = 'isle-blds';
    const items = isl.id === 'hub' ? [{ id: 'balloon', emoji: '🎈', name: '열기구 탈출장' }] : SUBJECTS.filter((s) => s.island === isl.id);
    for (const s of items) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'isle-bld';
      const done = prog.stamps[s.id] > 0;
      b.innerHTML = `<i>${s.emoji}</i><span>${esc(s.name)}</span>${done ? '<em>✅</em>' : ''}`;
      b.title = `${s.name} 앞으로 바로 가기`;
      b.addEventListener('click', () => { sfx.pop(); world.quickTravel(s.id); });
      list.append(b);
    }
    card.append(t, list); host.append(card);
  }
  host.hidden = false;
}
function areaChanged(a) { $('where').textContent = `${areaName(a)} · ${me.grade}학년`; $('minimap').hidden = a !== 'plaza'; $('overview').hidden = a !== 'plaza'; sendState(true); }
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
    speak(`${me.name}, 꼬마 탐험대 공원에 온 걸 환영해요! 가고 싶은 건물을 골라 봐요.`);
    // 처음 화면은 섬 전체 보기: 섬마다 건물 이름을 한눈에 보고 고른다
    setTimeout(() => world.setView('all'), 300);
  }
}

// ---------------- 안내하는 탐험대장 토리 ----------------
const GUIDE_LOOK = { v: 4, skin: 1, face: 0, hair: 0, hc: -1, top: 0, tc: -1, bot: 0, bc: 1, shoe: 0, sc: -1, hat: 0, pin: -1, eye: -1, back: 7, hand: -1, pet: 'none', job: 'none' }; // 야구모자 탐험대장
function guideLines() {
  return [
    ['👋', `안녕, ${me.name}! 나는 꼬마 탐험대의 대장, 토리야. 꼬마 탐험대 공원에 온 걸 환영해!`],
    ['🗺️', '여기는 섬마을 한가운데 분수 광장이야. 나무다리를 건너면 📚 공부 섬, 🎨 놀이 섬, 🏘️ 생활 섬, 💻 코딩 섬이 있어. 오른쪽 아래 🗺️ 전체를 누르고 섬 이름을 누르면 그 섬을 크게 볼 수 있어!'],
    ['🎁', '건물 안 놀이방마다 보물 상자가 3개 있어. 상자를 눌러서 퀴즈를 풀면 상자가 열려!'],
    ['🗝️', '상자 3개를 다 열면 열쇠가 나타나. 열쇠를 받으면 탐험 수첩에 도장도 쾅 찍혀.'],
    ['🎈', `아무 건물이든 도장 ${STAMPS_TO_FLY}개를 모으면, 분수 광장 옆 언덕의 열기구를 타고 하늘로 날아갈 수 있어!`],
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
  if (g.first) world.setView('all'); // 안내가 끝나면 섬 전체 보기에서 가고 싶은 건물 고르기
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
// 🗺️ 마을 전체 보기 (한 번 더 누르면 내 캐릭터 쪽으로 돌아와요)
$('overview').addEventListener('click', () => { if (!world) return; world.setView(world.view === 'all' ? 'normal' : 'all'); sfx.pop(); });
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

// 🏢 직업 체험관: 문 앞에서 직업 카드를 고른다
function pickJob(onPick) {
  sfx.pop?.();
  modal(`
    <div class="m-emoji">🃏</div>
    <h2>오늘은 어떤 직업을 해 볼까?</h2>
    <p>카드를 고르면 그 직업 미션 3개가 나와요. 해내면 그 직업 배지가 열려요!</p>
    <div class="job-grid">${JOBS.map((j) => `<button type="button" class="job-card${prog.jobs?.[j.id] ? ' done' : ''}" data-job="${j.id}" style="--c:${j.color}"><i>${j.emoji}</i>${esc(j.name)}${prog.jobs?.[j.id] ? '<small>✅ 배지 열림</small>' : ''}</button>`).join('')}</div>
  `, [['나중에 할래요', null, 'ghost']]);
  $('modal').querySelectorAll('.job-card').forEach((b) => b.addEventListener('click', () => { $('modal').hidden = true; $('modal').innerHTML = ''; if (world) world.paused = false; onPick(b.dataset.job); }));
}
function enterZone(subj, jobId = null) {
  const area = `zone:${subj}`;
  let z = zones[subj];
  if (subj === 'job' && (!z || z.taken) && !jobId) { pickJob((j) => enterZone('job', j)); return; }
  // 다 풀고 열쇠까지 받은 구역은 다시 들어오면 새 문제
  if (!z || z.taken) {
    const puzzles = subj === 'job' ? jobPuzzles(jobId, me.grade) : puzzlesFor(subj, me.grade, prog.stage[subj] | 0);
    z = zones[subj] = { puzzles, solved: [false, false, false], wrong: 0, hints: 0, taken: false, stage: prog.stage[subj] | 0, job: jobId };
    resetZoneView(subj);
  }
  world.goTo(area);
  const s = SUBJECT[subj];
  const times = prog.stamps[subj] | 0;
  if (subj === 'job') {
    const j = JOB[z.job];
    world.setBoardText(area, `오늘의 직업: ${j.emoji} ${j.name} · 미션 3개를 해내면 직업 배지! · ${me.grade}학년`);
    toast(`${s.host} ${s.hostName}: "${j.say} 미션 상자 3개를 열어 봐!"`, 5200); speak(`${j.say}`);
    return;
  }
  if (s.stages) world.setBoardText(area, `스테이지 ${(z.stage | 0) + 1} · 상자 3개를 열면 다음 스테이지! · ${me.grade}학년`);
  else world.setBoardText(area, times ? `도장 ✅ · 또 깨면 열쇠 하나 더! · ${me.grade}학년` : `보물 상자 3개를 열면 열쇠! · ${me.grade}학년`);
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
  if (SUBJECT[subj].stages) prog.stage[subj] = (z.stage | 0) + 1;
  const newJob = subj === 'job' && z.job && !prog.jobs[z.job] ? JOB[z.job] : null;
  if (subj === 'job' && z.job) prog.jobs[z.job] = true;
  saveProg();
  refreshHud();
  sendEv({ kind: 'key', subj, keys: prog.keys, stamps: stampList() });
  world.celebrate(world.pos.x, world.pos.z, true);
  sfx.win();
  const s = SUBJECT[subj];
  const n = stampList().length;
  const unlocked = SPECIALS.filter((x) => x.need > before && x.need <= prog.keys);
  const next = n >= STAMPS_TO_FLY ? `🎈 도장 ${STAMPS_TO_FLY}개를 모았어요! 분수 광장 옆 열기구 언덕으로 가 봐요!` : `열기구까지 도장 ${STAMPS_TO_FLY - n}개 더!`;
  speak(first ? `${s.name} 도장 쾅! 열쇠를 얻었어요!` : '열쇠를 하나 더 얻었어요!');
  const after = () => { if (newJob) showJobUnlock(newJob, () => { if (unlocked.length) showUnlock(unlocked); }); else if (unlocked.length) showUnlock(unlocked); };
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
  const parts = list.filter((x) => x.cat === 'part');
  speak(parts.length ? '새 꾸미기 부품이 열렸어요!' : '새 친구가 열렸어요!');
  modal(`
    <div class="m-emoji">🎁</div>
    <h2>${parts.length ? '새 꾸미기 부품이 열렸어요!' : '새 친구가 열렸어요!'}</h2>
    <div class="unlock-list">${list.map((x, k) => (x.cat === 'part' ? `<span class="unlock-char" data-k="${k}"><canvas></canvas>${esc(x.label)}</span>` : `<span class="unlock-item">${esc(x.label)}</span>`)).join(' ')}</div>
    <p>열쇠를 하나 모을 때마다 새 꾸미기가 하나씩 열려요.</p>
  `, [['👕 지금 입어 보기', () => {
    for (const x of parts) { if (x.kind === 'acc') me.look[ACCS[x.id][1]] = x.id; else me.look[x.kind] = x.id; }
    const p = list.find((x) => x.cat === 'pet'); if (p) me.look.pet = p.id;
    saveLook(); openDresser('edit', afterDress);
  }, 'ok'], ['계속 탐험하기', null, 'ghost']]);
  const paint = () => $('modal').querySelectorAll('.unlock-char').forEach((el) => {
    const x = list[Number(el.dataset.k)]; const th = drawThumb(x.kind, x.id, me.look); const cv = el.querySelector('canvas');
    if (th) { cv.width = th.width; cv.height = th.height; cv.getContext('2d').drawImage(th, 0, 0); }
  });
  if (charsReady()) paint(); else loadChars().then(paint).catch(() => {});
}
function showJobUnlock(j, then) {
  sfx.win();
  speak(`${j.name} 배지가 열렸어요!`);
  modal(`
    <div class="m-emoji">${j.emoji}</div>
    <h2>${esc(j.name)} 배지가 열렸어요!</h2>
    <p>꾸미기 → 🏢 <b>직업 배지</b>에서 달면 이름표 옆에 ${JOB[j.id]?.emoji || ''}가 보여요.<br>📒 직업 도감: <b>${jobList().length}</b> / ${JOBS.length}</p>
  `, [['🏅 지금 달기', () => { me.look.job = j.id; saveLook(); openDresser('edit', afterDress); }, 'ok'], ['계속 탐험하기', then, 'ghost']]);
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
    <p class="book-next">${n >= STAMPS_TO_FLY ? '🎈 열기구를 탈 수 있어요!' : `🎈 열기구까지 도장 ${STAMPS_TO_FLY - n}개`}<br>${nx ? `🎁 열쇠 ${nx.need - prog.keys}개 더 모으면 <b>${esc(nx.label)}</b>!` : '🎉 꾸미기와 친구를 모두 열었어요!'}</p>
    <p>👕 꾸미기 부품 <b>${Object.entries(PART_KINDS).reduce((n, [k, l]) => n + l.filter((_, i) => partOpen(k, i, prog.keys)).length, 0)}</b> / ${Object.values(PART_KINDS).reduce((n, l) => n + l.length, 0)}개 열림${opened.some((x) => x.cat === 'pet') ? ` · 같이 다니는 친구: ${opened.filter((x) => x.cat === 'pet').map((x) => esc(x.label)).join(' · ')}` : ''}</p>
    <h3 class="book-h">🏢 직업 도감 ${jobList().length} / ${JOBS.length}</h3>
    <div class="job-book">${JOBS.map((j) => `<span class="${prog.jobs?.[j.id] ? 'got' : ''}" title="${esc(j.name)}">${j.emoji}</span>`).join('')}</div>
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
        <td class="st">${SUBJECTS.map((x) => (s.stamps.includes(x.id) ? x.emoji : '·')).join('')} <small>${s.stamps.length}/${SUBJECTS.length}</small></td>
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
