// 노래 연습장: 화면과 연습 흐름.
// 기록은 이 기기의 localStorage 에만, 녹음은 앱을 닫기 전까지 이 기기 메모리에만 둔다.
'use strict';

// ---------- 도우미 ----------
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nowS = () => performance.now() / 1000;
const stars = (sc) => (sc >= 0.8 ? '⭐⭐⭐' : sc >= 0.55 ? '⭐⭐' : sc >= 0.3 ? '⭐' : '🌱');
const fold = (m, ref) => m - 12 * Math.round((m - ref) / 12); // 옥타브 차이는 같은 음으로 본다
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------- 목소리·판정 ----------
const VOICES = {
  low: { emoji: '🐻', name: '낮은 남자 목소리', sub: '베이스·바리톤', lo: 43, hi: 64 },
  mid: { emoji: '🦁', name: '높은 남자 목소리', sub: '테너', lo: 48, hi: 69 },
  alto: { emoji: '🐬', name: '낮은 여자 목소리', sub: '알토 · 변성기 지난 중학생', lo: 53, hi: 74 },
  high: { emoji: '🐦', name: '높은 여자 목소리', sub: '소프라노', lo: 60, hi: 81 },
  kid: { emoji: '🐥', name: '어린이 목소리', sub: '초등학생 · 변성기 전', lo: 57, hi: 76 },
};
const JUDGE = {
  easy: { tol: 50, name: '😊 쉬움 (반음 안쪽이면 맞아요)' },
  normal: { tol: 30, name: '🙂 보통' },
  hard: { tol: 15, name: '😤 어려움 (아주 정확하게)' },
};
const TIPS = [
  '노래하기 전에 <b>어깨를 내리고 턱에 힘을 빼요.</b> 목이 편해야 음이 잘 맞아요.',
  '숨은 <b>배가 볼록해지게</b> 들이마셔요. 어깨가 올라가면 숨이 얕아져요.',
  '높은 음에서 <b>소리를 지르지 말아요.</b> 작고 가볍게 내면 더 쉽게 올라가요.',
  '음이 자꾸 낮아지면, 음을 <b>위에서 살짝 내려 짚는</b> 느낌으로 불러 봐요.',
  '목이 아프거나 따끔하면 <b>바로 쉬어요.</b> 물을 조금씩 마시면 좋아요.',
  '녹음해서 들어 보면 내 노래의 좋은 점과 고칠 점이 잘 들려요. 📼',
  '매일 5분이 일주일에 한 번 1시간보다 훨씬 좋아요. 🔥 연속 기록을 이어 가 보세요!',
  '<b>립트릴</b>(입술을 "부르르" 떨면서 소리 내기)은 목을 편하게 풀어 줘요.',
  '음 맞추기가 어려우면 설정에서 판정을 <b>😊 쉬움</b>으로 바꿔 봐요.',
];

// ---------- 저장 ----------
const KEY = 'sing-practice-v1';
const DEFAULT = () => ({
  settings: { voice: null, lo: null, hi: null, judge: 'normal', names: 'ko', theme: 'system' },
  days: {}, // 날짜 → 연습한 초
  best: {}, // match(0~100), long(초), warm-<id>(0~100)
  routine: {}, // 날짜 → 오늘의 연습 다 했나
  measured: null, // 잰 음역 {lo, hi}
});
let S = load();
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === 'object') { const d = DEFAULT(); return { ...d, ...raw, settings: { ...d.settings, ...raw.settings } }; }
  } catch { /* 처음 */ }
  return DEFAULT();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* 저장 못 해도 연습은 된다 */ } }

function range() {
  const st = S.settings;
  if (st.voice === 'custom' && st.lo != null && st.hi != null) return { lo: st.lo, hi: st.hi };
  const v = VOICES[st.voice] || VOICES.alto;
  return { lo: v.lo, hi: v.hi };
}
const tol = () => (JUDGE[S.settings.judge] || JUDGE.normal).tol;
function nm(m) { // 큰 음 이름
  const n = S.settings.names;
  return n === 'en' ? Notes.en(m) : Notes.ko(m);
}
function nm2(m) { // 작은 보조 이름
  return S.settings.names === 'en' ? `${Notes.ko(m)}` : Notes.en(m);
}
function laneLabel(m) { return S.settings.names === 'en' ? Notes.en(m) : `${Notes.ko(m)}${Notes.oct(m)}`; }
function rangeText(lo, hi) { return `${nm(lo)}(${Notes.en(lo)}) ~ ${nm(hi)}(${Notes.en(hi)})`; }

function addTime(sec) {
  if (!(sec > 0)) return;
  const k = dayKey();
  S.days[k] = Math.round((S.days[k] || 0) + sec);
  save();
}
function streak() {
  const d = new Date();
  if (!(S.days[dayKey(d)] >= 20)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (S.days[dayKey(d)] >= 20) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function setBest(k, v) {
  const old = S.best[k];
  if (old == null || v > old) { S.best[k] = v; save(); return true; }
  return false;
}

// ---------- 화면 공통 ----------
function toast(msg) {
  const t = $('#toast');
  t.innerHTML = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}
function applyTheme() {
  const th = S.settings.theme;
  if (th === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', th);
}
let tab = 'home';
function render() {
  document.querySelectorAll('.tabs button').forEach((b) => { if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const st = streak();
  $('#top-streak').textContent = st ? `🔥 ${st}일` : '';
  const v = $('#view');
  v.innerHTML = ({ home: viewHome, rec: viewRec, stats: viewStats, settings: viewSettings })[tab]();
  if (tab === 'rec') drawRecList();
}

// ---------- 첫 화면 ----------
function voicePicker() {
  return `<div class="voice-grid">${Object.entries(VOICES).map(([id, v]) => `
    <button type="button" class="voice${S.settings.voice === id ? ' on' : ''}" data-act="voice" data-id="${id}">
      <span class="v-emoji">${v.emoji}</span><b>${esc(v.name)}</b><small>${esc(v.sub)}</small></button>`).join('')}
    <button type="button" class="voice measure${S.settings.voice === 'custom' ? ' on' : ''}" data-act="ex" data-ex="range">
      <span class="v-emoji">📏</span><b>직접 재서 찾기</b><small>가장 낮은 음·높은 음을 불러 봐요</small></button></div>`;
}
function viewHome() {
  const { lo, hi } = range();
  const today = Math.round((S.days[dayKey()] || 0) / 60);
  const done = S.routine[dayKey()];
  const first = !S.settings.voice;
  return `
    ${first ? `<div class="card"><h2>👋 먼저 내 목소리를 골라요</h2>
      <p>목소리에 맞는 높이로 연습 음을 들려줘요. 나중에 설정에서 바꿀 수 있어요.</p>${voicePicker()}</div>` : ''}
    <div class="card hero">
      <h2>${done ? '오늘 연습 끝! 🎉' : '오늘의 노래 연습 🎤'}</h2>
      <p>${done ? '잘했어요! 더 하고 싶으면 아래에서 골라 해요.' : '숨 고르기 → 목 풀기 → 음 맞추기 → 화음 타기'}</p>
      <div class="stats">
        <div><b>${streak()}</b><span>🔥 연속 일</span></div>
        <div><b>${today}</b><span>⏱️ 오늘 분</span></div>
        <div><b>${nm(lo)}~${nm(hi)}</b><span>🎵 내 음역</span></div>
      </div>
      <button type="button" class="big-btn" data-act="routine">${done ? '↺ 한 번 더 하기' : '▶ 오늘의 연습 시작'} <small>(약 5분)</small></button>
    </div>
    <div class="sec-title">연습 골라 하기</div>
    ${row('tuner', '🎚️', '음정 보기', '부르는 음이 무슨 음인지, 높은지 낮은지 바로 보여 줘요')}
    ${row('match', '🎯', '음 맞추기', '들려주는 음을 똑같이 불러요', S.best.match != null ? `최고 ${S.best.match}점` : '')}
    ${row('warm', '🪜', '발성 연습 (목 풀기)', '도레미 오르내리기, 화음 타기, 사이렌')}
    ${row('long', '💨', '길게 소리 내기', '숨을 아껴 쓰는 연습. 몇 초 버틸까요?', S.best.long != null ? `최고 ${S.best.long}초` : '')}
    ${row('range', '📏', '내 음역 찾기', '가장 낮은 음과 가장 높은 음을 재요', S.measured ? `${Notes.en(S.measured.lo)}~${Notes.en(S.measured.hi)}` : '')}
    <div class="card tip"><b>💡 노래 꿀팁</b><p>${pick(TIPS)}</p></div>
    <p class="note">🔒 마이크 소리는 이 기기 안에서만 써요. 어디로도 보내지 않아요.<br>🎧 이어폰을 끼면 기준음이 마이크로 새지 않아 더 정확해요.</p>`;
}
function row(ex, ico, title, sub, pill = '') {
  return `<button type="button" class="row" data-act="ex" data-ex="${ex}"><span class="ico">${ico}</span>
    <span class="txt"><b>${title} ${pill ? `<span class="pill">${esc(pill)}</span>` : ''}</b><small>${sub}</small></span><span class="go">›</span></button>`;
}

// ---------- 녹음 목록 ----------
const recordings = []; // { url, type, dur, trace, at }
function viewRec() {
  return `
    <div class="card"><h2>📼 녹음해서 들어 보기</h2>
      <p>노래를 녹음하면 내가 부른 음 높이 그래프도 같이 남아요. 들으면서 음이 흔들리는 곳을 찾아봐요.</p>
      <button type="button" class="big-btn rec-btn" data-act="ex" data-ex="record">🎙️ 녹음 시작</button>
      <p class="small muted" style="margin-top:10px">반주는 다른 기기로 작게 틀거나, 반주 없이 불러요. 녹음은 앱을 닫으면 지워지니 남기고 싶으면 💾 저장을 눌러요.</p>
    </div>
    ${recordings.length ? recordings.map((r, i) => `
      <div class="card rec-item">
        <div class="rec-head"><b>🎵 ${esc(r.at)}</b><span class="muted small">${r.dur.toFixed(1)}초</span></div>
        <canvas class="roll mini" data-rec="${i}"></canvas>
        <audio controls preload="metadata" src="${r.url}" data-rec="${i}"></audio>
        <div class="btn-row"><a class="big-btn ghost small-btn" href="${r.url}" download="노래연습-${esc(r.at.replace(/[: ]/g, ''))}.${r.type.includes('mp4') ? 'm4a' : r.type.includes('ogg') ? 'ogg' : 'webm'}">💾 저장</a>
        <button type="button" class="big-btn ghost small-btn" data-act="del-rec" data-i="${i}">🗑️ 지우기</button></div>
      </div>`).join('') : '<p class="empty">아직 녹음이 없어요 🎤</p>'}`;
}
function traceRange(trace) {
  if (!trace.length) { const { lo, hi } = range(); return [lo, hi]; }
  let a = Infinity, b = -Infinity;
  for (const p of trace) { a = Math.min(a, p.m); b = Math.max(b, p.m); }
  return [a - 2, b + 2];
}
function drawRecList() {
  document.querySelectorAll('canvas[data-rec]').forEach((c) => {
    const r = recordings[Number(c.dataset.rec)];
    const roll = new Roll(c, laneLabel);
    const [a, b] = traceRange(r.trace);
    roll.setRange(a, b);
    const draw = (now) => roll.draw({ t0: 0, t1: Math.max(r.dur, 1), now, trace: r.trace, showNow: now > 0 });
    draw(0);
    const au = $(`audio[data-rec="${c.dataset.rec}"]`);
    let raf = 0;
    const loop = () => { draw(au.currentTime); if (!au.paused) raf = requestAnimationFrame(loop); };
    au.addEventListener('play', () => { cancelAnimationFrame(raf); loop(); });
    au.addEventListener('pause', () => draw(au.currentTime));
    au.addEventListener('seeked', () => draw(au.currentTime));
  });
}

// ---------- 기록 ----------
function viewStats() {
  const total = Object.values(S.days).reduce((a, b) => a + b, 0);
  const days = Object.values(S.days).filter((s) => s >= 20).length;
  // 최근 4주 달력
  const cells = [];
  const d = new Date(); d.setDate(d.getDate() - 27);
  for (let i = 0; i < 28; i++) {
    const s = S.days[dayKey(d)] || 0;
    const lv = s >= 600 ? 3 : s >= 240 ? 2 : s >= 20 ? 1 : 0;
    cells.push(`<i class="lv${lv}" title="${d.getMonth() + 1}/${d.getDate()} ${Math.round(s / 60)}분"></i>`);
    d.setDate(d.getDate() + 1);
  }
  const warm = PATTERNS.filter((p) => S.best[`warm-${p.id}`] != null)
    .map((p) => `<div class="setting"><span class="lbl">${p.emoji} ${esc(p.name)}</span><b>${S.best[`warm-${p.id}`]}%</b></div>`).join('');
  return `
    <div class="card"><h2>📊 내 연습 기록</h2>
      <div class="stats plain">
        <div><b>${streak()}</b><span>🔥 연속 일</span></div>
        <div><b>${days}</b><span>📅 연습한 날</span></div>
        <div><b>${Math.round(total / 60)}</b><span>⏱️ 모두 분</span></div>
      </div>
      <div class="cal-label small muted">최근 4주 (진할수록 오래 연습)</div>
      <div class="cal">${cells.join('')}</div>
    </div>
    <div class="card"><h2>🏆 최고 기록</h2>
      <div class="setting"><span class="lbl">🎯 음 맞추기</span><b>${S.best.match != null ? `${S.best.match}점` : '–'}</b></div>
      <div class="setting"><span class="lbl">💨 길게 소리 내기</span><b>${S.best.long != null ? `${S.best.long}초` : '–'}</b></div>
      ${warm}
    </div>
    <div class="card"><h2>📏 내 음역</h2>
      ${S.measured ? `<p>잰 음역: <b>${rangeText(S.measured.lo, S.measured.hi)}</b><br>반음 ${S.measured.hi - S.measured.lo}개, 약 ${((S.measured.hi - S.measured.lo) / 12).toFixed(1)}옥타브</p>`
    : '<p>아직 재지 않았어요.</p>'}
      <button type="button" class="link-btn" data-act="ex" data-ex="range">📏 ${S.measured ? '다시 재기' : '지금 재기'} ›</button>
    </div>`;
}

// ---------- 설정 ----------
const opt = (v, cur, label) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
function viewSettings() {
  const st = S.settings;
  return `
    <div class="card"><h2>🎵 내 목소리</h2><p class="small">연습 음을 이 높이에 맞춰 들려줘요. 지금: <b>${rangeText(range().lo, range().hi)}</b></p>${voicePicker()}</div>
    <div class="card">
      <div class="setting"><div><span class="lbl">판정</span><small>얼마나 정확해야 "맞았다"로 볼지</small></div>
        <select data-set="judge">${Object.entries(JUDGE).map(([k, j]) => opt(k, st.judge, j.name)).join('')}</select></div>
      <div class="setting"><div><span class="lbl">음 이름</span></div>
        <select data-set="names">${opt('ko', st.names, '도레미')}${opt('en', st.names, 'CDE (C4, D4…)')}</select></div>
      <div class="setting"><div><span class="lbl">화면</span></div>
        <select data-set="theme">${opt('system', st.theme, '기기 설정 따라')}${opt('light', st.theme, '밝게')}${opt('dark', st.theme, '어둡게')}</select></div>
    </div>
    <div class="card"><div class="setting"><div><span class="lbl danger">기록 모두 지우기</span><small>연속 일, 최고 기록, 음역이 지워져요</small></div>
      <button type="button" class="big-btn ghost small-btn" data-act="reset">지우기</button></div></div>
    <p class="note">🔒 마이크 소리는 이 기기 안에서만 음 높이를 계산하는 데 써요. 녹음은 내가 💾 저장하지 않으면 앱을 닫을 때 지워져요.</p>`;
}

// ---------- 연습 화면 (전체 화면) ----------
const Run = { raf: 0, gen: 0, timers: [], muteUntil: 0, stopFns: [] };
let routine = null; // { i }

function openPlay(title) {
  stopRun();
  $('#play').hidden = false;
  $('#play-title').textContent = title;
  if (routine) {
    $('#play-count').textContent = `${routine.i + 1} / ${ROUTINE.length}`;
    $('#play-progress').style.width = `${(routine.i / ROUTINE.length) * 100}%`;
    $('#play-progress').parentElement.hidden = false;
  } else {
    $('#play-count').textContent = '';
    $('#play-progress').parentElement.hidden = true;
  }
  document.body.classList.add('playing');
}
function body(html) { $('#play-body').innerHTML = html; }
function stopRun() {
  Run.gen++;
  cancelAnimationFrame(Run.raf);
  Run.timers.forEach(clearTimeout);
  Run.timers = [];
  Run.stopFns.forEach((f) => { try { f(); } catch { /* 무시 */ } });
  Run.stopFns = [];
  Run.muteUntil = 0;
  Synth.stopAll();
}
function closePlay() {
  stopRun();
  addTime(Mic.close());
  routine = null;
  $('#play').hidden = true;
  document.body.classList.remove('playing');
  render();
}
function later(ms, fn) { Run.timers.push(setTimeout(fn, ms)); }
function frame(fn) {
  let last = nowS();
  const gen = Run.gen;
  const tick = () => {
    if (gen !== Run.gen) return;
    const now = nowS();
    const dt = Math.min(0.1, now - last);
    last = now;
    if (fn(now, dt) === false || gen !== Run.gen) return; // 그 사이 연습이 끝났으면 멈춘다
    Run.raf = requestAnimationFrame(tick);
  };
  Run.raf = requestAnimationFrame(tick);
}
function mute(sec) { Run.muteUntil = Math.max(Run.muteUntil, nowS() + sec); }
function hear(now) { return now < Run.muteUntil ? { rms: 0, voiced: false, muted: true } : Mic.read(); }
async function needMic() {
  try { await Mic.open(); return true; } catch (e) {
    body(`<div class="done-pic">🎙️</div><div class="done-title">마이크를 쓸 수 없어요</div>
      <div class="feedback bad">${e && e.message === 'nomic' ? '이 브라우저는 마이크를 지원하지 않아요. 크롬이나 사파리로 열어 주세요.'
    : '마이크 사용을 <b>허용</b>해 주세요.<br><span class="small">주소창 왼쪽 🔒(또는 ⓘ) → 마이크 → 허용, 그다음 다시 해 봐요.</span>'}</div>
      <div class="spacer"></div><button type="button" class="big-btn" data-act="close">닫기</button>`);
    return false;
  }
}
// 연습 하나가 끝났을 때 화면
function finish({ pic, title, html, again }) {
  stopRun();
  let btns;
  if (routine) {
    const last = routine.i >= ROUTINE.length - 1;
    btns = `<button type="button" class="big-btn" data-act="next-step">${last ? '🎉 오늘 연습 끝!' : `다음: ${ROUTINE[routine.i + 1].name} →`}</button>`;
  } else {
    btns = `<div class="btn-row"><button type="button" class="big-btn ghost" data-act="close">그만하기</button><button type="button" class="big-btn" id="again">↺ 다시 하기</button></div>`;
  }
  body(`<div class="done-pic">${pic}</div><div class="done-title">${title}</div>${html}<div class="spacer"></div>${btns}`);
  const a = $('#again');
  if (a) a.onclick = again;
}

// ---------- 🎚️ 음정 보기 ----------
async function exTuner() {
  openPlay('🎚️ 음정 보기');
  body(`
    <div class="note-big"><b id="tn-note">🎤</b><span id="tn-sub">'아~' 하고 소리를 내 보세요</span></div>
    <div class="meter" aria-hidden="true"><div class="meter-track"><i class="meter-zone" id="tn-zone"></i><i class="meter-needle" id="tn-needle"></i></div>
      <div class="meter-scale"><span>♭ 낮아요</span><span>딱!</span><span>높아요 ♯</span></div></div>
    <p class="hint" id="tn-hint">&nbsp;</p>
    <canvas class="roll" id="tn-roll"></canvas>
    <div class="btn-row"><button type="button" class="big-btn ghost" id="tn-play">🔊 가까운 음 들어 보기</button></div>`);
  if (!(await needMic())) return;
  const roll = new Roll($('#tn-roll'), laneLabel);
  let { lo, hi } = range();
  lo -= 3; hi += 3;
  roll.setRange(lo, hi);
  const t = tol();
  $('#tn-zone').style.cssText = `left:${50 - t}%;width:${2 * t}%`;
  const trace = [];
  let lastNote = null, lastShown = 0;
  frame((now) => {
    const r = hear(now);
    if (r.voiced) {
      const n = Math.round(r.midi), cents = Math.round((r.midi - n) * 100), ok = Math.abs(cents) <= t;
      trace.push({ t: now, m: r.midi, ok });
      lastNote = n;
      if (r.midi < lo + 1 || r.midi > hi - 1) { lo = Math.min(lo, Math.floor(r.midi) - 2); hi = Math.max(hi, Math.ceil(r.midi) + 2); roll.setRange(lo, hi); }
      if (now - lastShown > 0.06) {
        lastShown = now;
        $('#tn-note').textContent = nm(n);
        $('#tn-sub').textContent = `${nm2(n)} · ${Math.round(r.freq)}Hz`;
        const nd = $('#tn-needle');
        nd.style.left = `${clamp(50 + cents, 0, 100)}%`;
        nd.classList.toggle('ok', ok);
        $('#tn-note').classList.toggle('ok', ok);
        $('#tn-hint').innerHTML = ok ? '<b class="good-t">딱 맞아요! 👍</b>' : cents > 0 ? `조금 높아요 ↓ <span class="muted">(+${cents})</span>` : `조금 낮아요 ↑ <span class="muted">(${cents})</span>`;
      }
    } else if (now - lastShown > 0.6) {
      $('#tn-note').classList.remove('ok');
      $('#tn-needle').classList.remove('ok');
      $('#tn-hint').innerHTML = r.muted ? '🔊 듣는 중…' : '&nbsp;';
    }
    while (trace.length && trace[0].t < now - 8) trace.shift();
    roll.draw({ t0: now - 6, t1: now + 0.3, now, trace });
  });
  $('#tn-play').onclick = () => {
    if (lastNote == null) { toast('먼저 소리를 내 보세요 🎤'); return; }
    Synth.note(lastNote, 1.2); mute(1.4);
  };
}

// ---------- 🎯 음 맞추기 ----------
async function exMatch(rounds = 8) {
  openPlay('🎯 음 맞추기');
  body(`
    <div class="q-label" id="mt-label">들려주는 음을 듣고 똑같이 불러요</div>
    <div class="target-card"><span class="small muted" id="mt-round"></span><b id="mt-note">🎵</b><span id="mt-sub"></span>
      <div class="hold"><i id="mt-hold"></i></div><div class="hint" id="mt-hint">&nbsp;</div></div>
    <canvas class="roll" id="mt-roll"></canvas>
    <div class="btn-row"><button type="button" class="big-btn ghost" id="mt-again">🔊 다시 듣기</button><button type="button" class="big-btn ghost" id="mt-skip">⏭️ 넘어가기</button></div>`);
  if (!(await needMic())) return;
  const { lo, hi } = range();
  const roll = new Roll($('#mt-roll'), laneLabel);
  const t = tol();
  const HOLD = 1.0, LIMIT = 10;
  const points = [];
  let i = -1, target = null, phase = 'idle', phaseAt = 0, held = 0, trace = [], targets = [];
  const next = () => {
    i++;
    if (i >= rounds) return done();
    let n;
    do { n = Math.round(lo + 2 + Math.random() * Math.max(1, hi - lo - 4)); } while (n === target && hi - lo > 5);
    target = n; held = 0; trace = [];
    roll.setRange(target - 7, target + 7);
    $('#mt-round').textContent = `${i + 1} / ${rounds}`;
    $('#mt-note').textContent = nm(target);
    $('#mt-sub').textContent = nm2(target);
    $('#mt-note').className = '';
    $('#mt-hold').style.width = '0';
    listen();
  };
  const listen = () => {
    phase = 'listen'; phaseAt = nowS();
    Synth.note(target, 1.3); mute(1.6);
    targets = [{ s: phaseAt, e: phaseAt + LIMIT + 1.6, m: target }];
    $('#mt-label').textContent = '👂 잘 들어요…';
    $('#mt-hint').innerHTML = '&nbsp;';
  };
  const done = () => {
    const score = Math.round(points.reduce((a, b) => a + b, 0) / rounds);
    const nb = setBest('match', score);
    finish({
      pic: score >= 80 ? '🏆' : score >= 50 ? '🎉' : '🌱', title: `${score}점 ${stars(score / 100)}`,
      html: `<div class="feedback ${score >= 50 ? 'good' : 'info'}">${nb ? '🆕 최고 기록이에요! ' : ''}${score >= 80 ? '귀가 정말 좋아요!' : score >= 50 ? '잘했어요! 매일 하면 점점 빨리 맞춰요.' : '처음엔 다 어려워요. 판정을 😊 쉬움으로 바꿔 봐도 좋아요.'}</div>
        <div class="dots">${points.map((p) => `<span class="${p ? 'ok' : ''}">${p ? (p >= 80 ? '⭐' : '✔️') : '·'}</span>`).join('')}</div>`,
      again: () => exMatch(rounds),
    });
  };
  $('#mt-again').onclick = () => { if (phase === 'sing' || phase === 'listen') { Synth.stopAll(); listen(); } };
  $('#mt-skip').onclick = () => { if (phase === 'sing' || phase === 'listen') { Synth.stopAll(); Run.muteUntil = 0; points.push(0); next(); } };
  frame((now, dt) => {
    const r = hear(now);
    if (phase === 'listen' && now >= Run.muteUntil) { phase = 'sing'; phaseAt = now; $('#mt-label').textContent = '🎤 이제 불러요!'; }
    if (phase === 'sing') {
      const el = now - phaseAt;
      if (r.voiced) {
        const m = fold(r.midi, target);
        const c = Math.round((m - target) * 100);
        const ok = Math.abs(c) <= t;
        trace.push({ t: now, m, ok });
        if (ok) held += dt;
        $('#mt-hint').innerHTML = ok ? '<b class="good-t">좋아요, 그대로 쭉~ 👍</b>' : c > 0 ? '조금 <b>낮게</b> ↓' : '조금 <b>높게</b> ↑';
      }
      $('#mt-hold').style.width = `${Math.min(100, (held / HOLD) * 100)}%`;
      if (held >= HOLD) {
        const p = Math.round(clamp(100 - (el - 1.2) * 9, 40, 100));
        points.push(p); phase = 'result';
        $('#mt-note').className = 'ok';
        $('#mt-label').textContent = pick(['맞았어요! 🎉', '정확해요! 👏', '최고예요! ✨']);
        Synth.note(target + 12, 0.15, 0, null, 0.08);
        later(1100, next);
      } else if (el > LIMIT) {
        points.push(0); phase = 'result';
        $('#mt-label').textContent = '괜찮아요, 다음 음! 💪';
        later(1100, next);
      }
    }
    while (trace.length && trace[0].t < now - 6) trace.shift();
    roll.draw({ t0: now - 5, t1: now + 0.3, now, trace, targets });
  });
  next();
}

// ---------- 🪜 발성 연습 ----------
const PATTERNS = [
  { id: 'five', emoji: '🪜', name: '다섯 음 오르내리기', desc: '도레미파솔파미레도', notes: [0, 2, 4, 5, 7, 5, 4, 2, 0], beat: 0.5 },
  { id: 'arp', emoji: '🎈', name: '도미솔 화음 타기', desc: '도미솔미도', notes: [0, 4, 7, 4, 0], beat: 0.6 },
  { id: 'scale', emoji: '🌈', name: '도레미 음계', desc: '도레미파솔라시도 올라갔다 내려오기', notes: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0], beat: 0.42 },
  { id: 'octave', emoji: '🏔️', name: '옥타브 계단', desc: '도미솔 높은도 솔미도', notes: [0, 4, 7, 12, 7, 4, 0], beat: 0.55 },
  { id: 'siren', emoji: '🚑', name: '사이렌 미끄럼', desc: "'우~' 하고 도에서 솔까지 미끄러지듯", seq: [[0, null, 0.7], [0, 7, 1.3], [7, null, 0.6], [7, 0, 1.3], [0, null, 0.7]] },
];
const spanOf = (p) => (p.seq ? Math.max(...p.seq.map(([m, to]) => Math.max(m, to ?? m))) : Math.max(...p.notes));
function buildSeq(p, root) {
  const out = []; let t = 0;
  if (p.seq) for (const [m, to, d] of p.seq) { out.push({ s: t, e: t + d, m: root + m, to: to == null ? null : root + to }); t += d; }
  else p.notes.forEach((m, i) => { const d = p.beat * (i === p.notes.length - 1 ? 2 : 1); out.push({ s: t, e: t + d * 0.9, m: root + m }); t += d; });
  return { notes: out, len: t };
}
function expected(notes, t) {
  for (const n of notes) {
    if (t >= n.s + 0.15 && t <= n.e) return n.to == null ? n.m : n.m + ((n.to - n.m) * (t - n.s)) / (n.e - n.s);
  }
  return null;
}
function warmChooser() {
  openPlay('🪜 발성 연습');
  body(`<div class="q-label">어떤 연습을 할까요? 들려주는 대로 따라 불러요. 한 번 끝날 때마다 반음씩 올라가요.</div>
    ${PATTERNS.map((p) => `<button type="button" class="row" data-act="warm" data-id="${p.id}"><span class="ico">${p.emoji}</span>
      <span class="txt"><b>${esc(p.name)} ${S.best[`warm-${p.id}`] != null ? `<span class="pill">최고 ${S.best[`warm-${p.id}`]}%</span>` : ''}</b><small>${esc(p.desc)}</small></span><span class="go">›</span></button>`).join('')}
    <p class="note">🎧 이어폰을 끼면 더 정확하게 채점돼요. 목이 아프면 바로 쉬어요.</p>`);
}
async function exWarm(pid, reps = 5) {
  const p = PATTERNS.find((x) => x.id === pid) || PATTERNS[0];
  openPlay(`${p.emoji} ${p.name}`);
  body(`
    <div class="q-label" id="wm-label">👂 먼저 잘 들어요</div>
    <div class="wm-info"><span id="wm-key"></span><span class="dots" id="wm-dots"></span></div>
    <canvas class="roll tall" id="wm-roll"></canvas>
    <div class="hint" id="wm-hint">${esc(p.desc)}</div>
    <div class="btn-row"><button type="button" class="big-btn ghost" id="wm-redo">↺ 이 높이 다시</button></div>`);
  if (!(await needMic())) return;
  const { lo, hi } = range();
  const sp = spanOf(p);
  const avail = hi - lo - sp;
  const start = avail <= 0 ? lo : lo + Math.round(avail * 0.2);
  const count = clamp(Math.max(lo, hi - sp) - start + 1, 1, reps);
  const roots = Array.from({ length: count }, (_, k) => start + k);
  const roll = new Roll($('#wm-roll'), laneLabel);
  const tl = tol() + 10; // 음을 옮겨 가는 동안이 있어서 조금 넉넉하게
  const scores = [];
  let k = 0, phase = '', at = 0, seq = null, trace = [], ok = 0, total = 0, lastExp = null;
  const dots = () => { $('#wm-dots').innerHTML = roots.map((_, j) => `<i class="${j < scores.length ? (scores[j] >= 55 ? 'ok' : 'meh') : j === k ? 'cur' : ''}"></i>`).join(''); };
  const rep = () => {
    Synth.stopAll();
    const root = roots[k];
    seq = buildSeq(p, root);
    roll.setRange(root - 2, root + sp + 2);
    $('#wm-key').textContent = `${nm(root)}(${Notes.en(root)})에서 시작`;
    phase = 'listen'; at = nowS() + 0.05; trace = []; ok = 0; total = 0; lastExp = null;
    $('#wm-label').textContent = '👂 먼저 잘 들어요';
    for (const n of seq.notes) Synth.note(n.m, n.e - n.s, n.s + 0.05, n.to);
    mute(seq.len + 0.4);
    dots();
  };
  const done = () => {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const nb = setBest(`warm-${p.id}`, avg);
    finish({
      pic: avg >= 80 ? '🏆' : avg >= 55 ? '🎉' : '🌱', title: `음 정확도 ${avg}% ${stars(avg / 100)}`,
      html: `<div class="feedback ${avg >= 55 ? 'good' : 'info'}">${nb ? '🆕 최고 기록이에요! ' : ''}${avg >= 80 ? '음이 아주 정확해요!' : avg >= 55 ? '목이 잘 풀렸어요!' : '천천히 들으면서 해 봐요. 판정을 😊 쉬움으로 바꿔 봐도 좋아요.'}</div>
        <div class="score-list">${scores.map((s, j) => `<div class="setting"><span>${nm(roots[j])}(${Notes.en(roots[j])})에서</span><b>${s}% ${stars(s / 100)}</b></div>`).join('')}</div>`,
      again: () => exWarm(pid, reps),
    });
  };
  $('#wm-redo').onclick = () => { if (phase === 'listen' || phase === 'sing' || phase === 'ready') rep(); };
  frame((now, dt) => {
    let t = now - at;
    if (phase === 'listen' && t > seq.len + 0.3) {
      phase = 'ready'; at = now; t = 0;
      $('#wm-label').textContent = '🎤 준비…';
      const b = p.beat || 0.6;
      Synth.tick(0); Synth.tick(b);
      mute(b + 0.15); // 똑딱 소리는 듣지 않는다
      at = now + 2 * b; // 두 번 똑딱 뒤 시작
    } else if (phase === 'ready' && t >= 0) {
      phase = 'sing';
      $('#wm-label').textContent = '🎤 따라 불러요!';
    }
    if (phase === 'sing') {
      const exp = expected(seq.notes, t);
      if (exp != null) lastExp = exp;
      const r = hear(now);
      if (r.voiced && t >= -0.1) {
        const m = fold(r.midi, lastExp ?? seq.notes[0].m);
        const hit = exp != null && Math.abs(m - exp) * 100 <= tl;
        trace.push({ t, m, ok: hit });
      }
      if (exp != null) { total += dt; if (r.voiced && Math.abs(fold(r.midi, exp) - exp) * 100 <= tl) ok += dt; }
      if (t > seq.len + 0.3) {
        const s = Math.round((total ? ok / total : 0) * 100);
        scores.push(s); phase = 'result';
        $('#wm-label').textContent = `${s}% ${stars(s / 100)} ${s >= 80 ? '훌륭해요!' : s >= 55 ? '좋아요!' : '괜찮아요!'}`;
        k++;
        dots();
        later(1500, () => (k < roots.length ? rep() : done()));
      }
    }
    const shown = phase === 'listen' ? t : phase === 'sing' || phase === 'result' ? (phase === 'result' ? seq.len : t) : -0.2;
    roll.draw({ t0: -0.3, t1: seq.len + 0.3, now: shown, targets: seq.notes, trace: phase === 'listen' ? [] : trace, activeTarget: phase !== 'result' });
  });
  rep();
}

// ---------- 💨 길게 소리 내기 ----------
async function exLong() {
  openPlay('💨 길게 소리 내기');
  body(`
    <div class="breath" id="lg-circle"><b id="lg-big">준비</b><span id="lg-small"></span></div>
    <div class="q-label center" id="lg-label">숨을 크게 들이마시고, 편한 음으로 '아~' 하고 길~게 소리 내요</div>
    <div class="stab"><span>음 흔들림 없이</span><div class="bar"><i id="lg-stab"></i></div></div>
    <div class="spacer"></div>
    <button type="button" class="big-btn ghost" id="lg-skip">숨 쉬기 건너뛰고 바로 시작</button>`);
  if (!(await needMic())) return;
  const circle = $('#lg-circle');
  let phase = 'in', at = nowS(), start = 0, lastSound = 0, soundRun = 0;
  const mids = [];
  const goReady = () => { phase = 'ready'; circle.className = 'breath ready'; $('#lg-big').textContent = '🎤'; $('#lg-small').textContent = "'아~'"; $('#lg-label').textContent = "이제 '아~' 하고 길게! 소리가 끊기면 멈춰요"; $('#lg-skip').hidden = true; };
  $('#lg-skip').onclick = goReady;
  circle.className = 'breath in';
  $('#lg-big').textContent = '들이마셔요';
  frame((now, dt) => {
    const t = now - at;
    if (phase === 'in') {
      $('#lg-small').textContent = `${Math.ceil(4 - t)}`;
      if (t >= 4) { phase = 'hold'; at = now; circle.className = 'breath hold'; $('#lg-big').textContent = '잠깐 멈춰요'; }
    } else if (phase === 'hold') {
      $('#lg-small').textContent = `${Math.ceil(2 - t)}`;
      if (t >= 2) goReady();
    } else if (phase === 'ready' || phase === 'going') {
      const r = hear(now);
      const sound = r.rms > Mic.gate * 1.6;
      if (phase === 'ready') {
        soundRun = sound ? soundRun + dt : 0;
        if (soundRun > 0.15) { phase = 'going'; start = now - soundRun; lastSound = now; circle.className = 'breath going'; }
      } else {
        if (sound) lastSound = now;
        if (r.voiced) mids.push(r.midi);
        const sec = now - start;
        $('#lg-big').textContent = `${sec.toFixed(1)}초`;
        $('#lg-small').textContent = S.best.long ? `최고 ${S.best.long}초` : '';
        circle.style.setProperty('--p', `${Math.min(1, sec / Math.max(10, S.best.long || 15)) * 360}deg`);
        if (mids.length > 10) {
          const md = median(mids.slice(-120));
          const recent = mids.slice(-60);
          $('#lg-stab').style.width = `${(recent.filter((m) => Math.abs(m - md) < 0.35).length / recent.length) * 100}%`;
        }
        if (now - lastSound > 0.5 || sec > 90) end(lastSound - start);
      }
    }
  });
  const end = (sec) => {
    sec = Math.round(sec * 10) / 10;
    const md = mids.length ? median(mids) : null;
    const stab = mids.length ? Math.round((mids.filter((m) => Math.abs(m - md) < 0.35).length / mids.length) * 100) : 0;
    const nb = setBest('long', sec);
    finish({
      pic: sec >= 20 ? '🐳' : sec >= 12 ? '🐬' : '🐟', title: `${sec}초`,
      html: `<div class="feedback ${sec >= 12 ? 'good' : 'info'}">${nb ? '🆕 최고 기록이에요! ' : ''}${sec >= 25 ? '숨을 정말 잘 써요! 폐활량 왕 👑' : sec >= 15 ? '훌륭해요! 숨을 아껴 쓸 줄 알아요.' : sec >= 8 ? '좋아요! 숨을 조금씩 천천히 내보내 봐요.' : '배로 숨을 크게 들이마시고, 조금씩 아껴서 내보내 봐요.'}</div>
        ${md != null ? `<div class="setting"><span>부른 음</span><b>${nm(Math.round(md))} (${Notes.en(Math.round(md))})</b></div>
        <div class="setting"><span>음 흔들림 없이</span><b>${stab}%</b></div>` : ''}`,
      again: () => exLong(),
    });
  };
}

// ---------- 📏 내 음역 찾기 ----------
async function exRange() {
  openPlay('📏 내 음역 찾기');
  body(`
    <div class="q-label" id="rg-label"></div>
    <div class="target-card"><span class="small muted">지금 내는 음</span><b id="rg-now">–</b><span id="rg-now2">&nbsp;</span>
      <div class="rg-rec">기록: <b id="rg-rec">아직 없어요</b></div></div>
    <canvas class="roll" id="rg-roll"></canvas>
    <div class="hint small" id="rg-tip"></div>
    <div class="btn-row"><button type="button" class="big-btn ghost" id="rg-reset">↺ 다시</button><button type="button" class="big-btn" id="rg-next" disabled>다음 →</button></div>`);
  if (!(await needMic())) return;
  const roll = new Roll($('#rg-roll'), laneLabel);
  roll.setRange(40, 84);
  let step = 'low', rec = null, low = null;
  let win = [], trace = [];
  const setStep = (s) => {
    step = s; rec = null; win = [];
    $('#rg-rec').textContent = '아직 없어요';
    $('#rg-next').disabled = true;
    if (s === 'low') {
      $('#rg-label').innerHTML = '1단계: <b>가장 낮은 음</b>을 내 보세요 ⬇️<br><span class="small muted">"어~" 하고 1초쯤 길게. 점점 내려가 봐요.</span>';
      $('#rg-tip').textContent = '목을 누르지 말고, 편하게 낼 수 있는 데까지만요.';
    } else {
      $('#rg-label').innerHTML = '2단계: <b>가장 높은 음</b>을 내 보세요 ⬆️<br><span class="small muted">"이~"나 "우~" 하고 1초쯤 길게. 점점 올라가 봐요.</span>';
      $('#rg-tip').textContent = '소리 지르지 말고 가볍게! 목이 아프면 바로 멈춰요.';
    }
  };
  $('#rg-reset').onclick = () => setStep(step);
  $('#rg-next').onclick = () => {
    if (step === 'low') { low = rec; setStep('high'); return; }
    let a = low, b = rec;
    if (b - a < 5) { toast('높은 음을 조금 더 올려 봐요 ⬆️'); return; }
    S.measured = { lo: a, hi: b };
    // 연습에는 양 끝 한 음씩 안쪽(편한 음역)을 쓴다
    if (b - a >= 12) { a += 1; b -= 1; }
    while (b - a < 10) { a -= 1; b += 1; }
    S.settings.voice = 'custom'; S.settings.lo = a; S.settings.hi = b;
    save();
    const c = (S.measured.lo + S.measured.hi) / 2;
    const near = Object.values(VOICES).reduce((x, v) => (Math.abs((v.lo + v.hi) / 2 - c) < Math.abs((x.lo + x.hi) / 2 - c) ? v : x));
    const semis = S.measured.hi - S.measured.lo;
    finish({
      pic: '📏', title: `${nm(S.measured.lo)} ~ ${nm(S.measured.hi)}`,
      html: `<div class="feedback good">내 음역은 <b>${rangeText(S.measured.lo, S.measured.hi)}</b>, 반음 ${semis}개 (약 ${(semis / 12).toFixed(1)}옥타브)예요.<br>
        ${near.emoji} <b>${esc(near.name)}</b>(${esc(near.sub)})에 가까워요.</div>
        <p class="muted small">이제 연습 음을 이 음역에 맞춰 들려줘요. 연습할수록 음역이 넓어지니 가끔 다시 재 봐요!</p>`,
      again: () => exRange(),
    });
  };
  setStep('low');
  frame((now) => {
    const r = hear(now);
    if (r.voiced) {
      const n = Math.round(r.midi);
      $('#rg-now').textContent = nm(n);
      $('#rg-now2').textContent = nm2(n);
      win.push({ t: now, m: r.midi });
      trace.push({ t: now, m: r.midi, ok: false });
    } else win = [];
    while (win.length && win[0].t < now - 0.5) win.shift();
    if (win.length > 8 && now - win[0].t > 0.4) {
      const ms = win.map((p) => p.m);
      if (Math.max(...ms) - Math.min(...ms) < 0.8) {
        const n = Math.round(median(ms));
        if (rec == null || (step === 'low' ? n < rec : n > rec)) {
          rec = n;
          $('#rg-rec').textContent = `${nm(n)} (${Notes.en(n)})`;
          $('#rg-next').disabled = false;
        }
      }
    }
    while (trace.length && trace[0].t < now - 6) trace.shift();
    const tg = rec != null ? [{ s: now - 6, e: now + 1, m: rec }] : [];
    roll.draw({ t0: now - 5, t1: now + 0.3, now, trace, targets: tg, activeTarget: false });
  });
}

// ---------- 🎙️ 녹음 ----------
async function exRecord() {
  if (!window.MediaRecorder) { toast('이 브라우저는 녹음을 지원하지 않아요 😢'); return; }
  openPlay('🎙️ 녹음하기');
  body(`
    <div class="note-big"><b id="rc-time">0:00</b><span id="rc-state">버튼을 누르면 녹음해요</span></div>
    <canvas class="roll" id="rc-roll"></canvas>
    <div class="spacer"></div>
    <button type="button" class="mic" id="rc-btn" aria-label="녹음 시작">●</button>
    <div class="mic-label" id="rc-label">녹음 시작</div>`);
  if (!(await needMic())) return;
  const roll = new Roll($('#rc-roll'), laneLabel);
  const { lo, hi } = range();
  let rlo = lo - 3, rhi = hi + 3;
  roll.setRange(rlo, rhi);
  let rec = null, chunks = [], t0 = 0, trace = [], alive = true;
  const btn = $('#rc-btn');
  btn.onclick = () => {
    if (!rec) {
      chunks = []; trace = [];
      try { rec = new MediaRecorder(Mic.stream); } catch { toast('녹음을 시작할 수 없어요'); return; }
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || chunks[0]?.type || 'audio/webm';
        const blob = new Blob(chunks, { type });
        const d = new Date();
        recordings.unshift({ url: URL.createObjectURL(blob), type, dur: nowS() - t0, trace, at: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` });
        if (alive) { tab = 'rec'; closePlay(); toast('녹음했어요! ▶ 눌러서 들어 봐요'); } else if (tab === 'rec' && $('#play').hidden) render();
      };
      rec.start();
      t0 = nowS();
      btn.classList.add('on'); btn.textContent = '■'; btn.setAttribute('aria-label', '녹음 멈추기');
      $('#rc-label').textContent = '멈추기';
      $('#rc-state').textContent = '🔴 녹음 중…';
    } else {
      rec.stop();
      btn.disabled = true;
    }
  };
  // 창을 닫거나 다른 앱으로 가도 그때까지 녹음한 것은 남긴다
  Run.stopFns.push(() => { alive = false; if (rec && rec.state === 'recording') rec.stop(); });
  frame((now) => {
    const r = hear(now);
    const t = rec ? now - t0 : 0;
    if (r.voiced) {
      if (rec) trace.push({ t, m: r.midi, ok: false });
      if (r.midi < rlo + 1 || r.midi > rhi - 1) { rlo = Math.min(rlo, Math.floor(r.midi) - 2); rhi = Math.max(rhi, Math.ceil(r.midi) + 2); roll.setRange(rlo, rhi); }
    }
    if (rec) $('#rc-time').textContent = `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    roll.draw({ t0: t - 6, t1: t + 0.3, now: t, trace });
    if (rec && t > 600) btn.click(); // 10분까지
  });
}

// ---------- 오늘의 연습 ----------
const ROUTINE = [
  { name: '💨 숨 고르고 길게', run: () => exLong() },
  { name: '🪜 다섯 음 오르내리기', run: () => exWarm('five', 3) },
  { name: '🎯 음 맞추기', run: () => exMatch(5) },
  { name: '🎈 도미솔 화음 타기', run: () => exWarm('arp', 3) },
];
function startRoutine() { routine = { i: 0 }; ROUTINE[0].run(); }
function nextStep() {
  if (!routine) return;
  routine.i++;
  if (routine.i < ROUTINE.length) { ROUTINE[routine.i].run(); return; }
  S.routine[dayKey()] = true; save();
  routine = null;
  openPlay('🎉 오늘 연습 끝');
  $('#play-progress').parentElement.hidden = false;
  $('#play-progress').style.width = '100%';
  body(`<div class="done-pic">🎉</div><div class="done-title">오늘 연습 끝!</div>
    <div class="feedback good">🔥 ${streak()}일째 연습하고 있어요. 내일도 만나요!</div>
    <div class="spacer"></div><button type="button" class="big-btn" data-act="close">처음으로</button>`);
}

// ---------- 버튼 ----------
const EX = { tuner: exTuner, match: () => exMatch(8), warm: warmChooser, long: exLong, range: exRange, record: exRecord };
document.addEventListener('click', (e) => {
  const tb = e.target.closest('.tabs button');
  if (tb) { tab = tb.dataset.tab; render(); window.scrollTo(0, 0); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (act === 'ex') { routine = null; EX[b.dataset.ex](); }
  else if (act === 'warm') exWarm(b.dataset.id);
  else if (act === 'routine') startRoutine();
  else if (act === 'next-step') nextStep();
  else if (act === 'close') closePlay();
  else if (act === 'voice') {
    S.settings.voice = b.dataset.id; save(); render();
    const v = VOICES[b.dataset.id];
    toast(`${v.emoji} ${esc(v.name)}에 맞춰 연습해요`);
  } else if (act === 'del-rec') {
    const [r] = recordings.splice(Number(b.dataset.i), 1);
    if (r) URL.revokeObjectURL(r.url);
    render();
  } else if (act === 'reset') {
    if (confirm('기록을 모두 지울까요? 되돌릴 수 없어요.')) { S = DEFAULT(); save(); applyTheme(); render(); toast('기록을 지웠어요'); }
  }
});
document.addEventListener('change', (e) => {
  const k = e.target.dataset.set;
  if (!k) return;
  S.settings[k] = e.target.value; save();
  if (k === 'theme') applyTheme();
  render();
});
$('#play-close').addEventListener('click', closePlay);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#play').hidden) closePlay(); });
// 다른 앱으로 가면 마이크를 끈다
document.addEventListener('visibilitychange', () => { if (document.hidden && !$('#play').hidden) closePlay(); });

if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {});
applyTheme();
render();
