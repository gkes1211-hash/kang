// 여행 영어 첫걸음: 화면과 학습 흐름
// 기록은 이 기기의 localStorage 에만 저장한다.
'use strict';

// ---------- 도우미 ----------
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const stars = (sc) => (sc >= 0.9 ? '⭐⭐⭐' : sc >= 0.6 ? '⭐⭐' : sc >= 0.3 ? '⭐' : '');

const ALL = {
  words: LEVELS.flatMap((l) => l.words),
  say: LEVELS.flatMap((l) => l.say),
  hear: LEVELS.flatMap((l) => l.hear),
  talks: LEVELS.flatMap((l) => l.talks),
};
const levelOf = (id) => LEVELS.find((l) => l.id === id);

const PRAISE = ['맞았어요! 🎉', '잘했어요! 👏', '훌륭해요! ✨', '정답! 💯', '최고예요! 🙌'];
const CHEER = ['괜찮아요, 이렇게 외우는 거예요 💪', '틀려도 괜찮아요! 곧 다시 나와요 🙂', '아깝다! 한 번 더 보면 기억나요 💡'];
const TIPS = [
  '못 알아들었으면 <b>"Sorry, slowly, please."</b> (쏘리, 슬로울리, 플리즈) 하면 천천히 다시 말해 줘요.',
  '문장이 생각 안 나면 단어만 말해도 돼요. <b>"Water, please."</b> 만으로도 물을 받을 수 있어요.',
  '<b>please</b> 는 마법의 말이에요. 무엇이든 뒤에 붙이면 "~주세요"가 돼요.',
  '틀려도 괜찮아요. 여행지 사람들은 완벽한 영어보다 <b>말하려는 마음</b>을 반가워해요.',
  '들을 때 모든 낱말을 알아들을 필요는 없어요. <b>아는 단어 한두 개</b>만 잡아도 뜻을 알 수 있어요.',
  '물건을 건넬 때는 <b>"Here you are."</b> (히어 유 아) 한마디면 충분해요.',
  '매일 5분이 일주일에 한 번 1시간보다 훨씬 잘 외워져요. 🔥 연속 기록을 이어 가 보세요!',
  '말하기 연습할 때는 <b>크게, 또박또박</b> 말해야 기계가 잘 알아들어요.',
];

// ---------- 저장 ----------
const KEY = 'travel-english-v1';
const DEFAULT_SETTINGS = { rate: 0.8, voice: '', pron: true, newPerDay: 6, unlockAll: false, theme: 'system', subs: 'both', hint: true };
let S = load();
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; }
  s = s && typeof s === 'object' ? s : {};
  return {
    words: s.words || {}, say: s.say || {}, hear: s.hear || {}, talks: s.talks || {}, days: s.days || {},
    settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) },
  };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* 저장이 막힌 브라우저 */ } }

// ---------- 날짜·연속 기록 ----------
function today() { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5); }
const dayKey = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
function addActivity(n = 1) { const k = dayKey(today()); S.days[k] = (S.days[k] || 0) + n; }
function streak() {
  let d = today();
  if (!S.days[dayKey(d)]) d -= 1; // 오늘 아직 안 했으면 어제까지의 연속 기록
  let n = 0;
  while (S.days[dayKey(d)]) { n++; d--; }
  return n;
}
const studiedToday = () => (S.days[dayKey(today())] || 0) >= 5;

// ---------- 단어 기억 상자 (틀린 건 자주, 아는 건 드물게) ----------
const INTERVAL = [0, 1, 2, 4, 8, 16, 30]; // 상자 번호별 다음 복습까지 날짜
const ws = (id) => S.words[id] || { box: 0, due: 0, right: 0, wrong: 0, seen: false };
function markWord(id, ok) {
  const w = { ...ws(id), seen: true };
  if (ok) { w.box = Math.min(w.box + 1, INTERVAL.length - 1); w.right++; } else { w.box = 1; w.wrong++; }
  w.due = today() + (ok ? INTERVAL[w.box] : 0);
  S.words[id] = w;
}
function seeWord(id) { S.words[id] = { ...ws(id), seen: true }; }
const wordStatus = (id) => { const w = ws(id); return w.box >= 3 ? 'known' : w.seen ? 'learning' : 'new'; };
const dueWords = () => ALL.words.filter((w) => { const s = ws(w.id); return s.seen && s.box > 0 && s.due <= today(); });
const confusing = () => ALL.words.filter((w) => { const s = ws(w.id); return s.wrong > 0 && s.box < 3; });
const knownCount = () => ALL.words.filter((w) => wordStatus(w.id) === 'known').length;

// ---------- 단계 진행 ----------
function levelProgress(lv) {
  const wordPart = lv.words.reduce((a, w) => a + Math.min(ws(w.id).box, 3) / 3, 0) / lv.words.length;
  const sayOk = lv.say.filter((x) => (S.say[x.id]?.best || 0) >= 0.6).length;
  const hearOk = lv.hear.filter((x) => (S.hear[x.id]?.right || 0) > 0).length;
  const talkOk = lv.talks.filter((x) => S.talks[x.id]?.done).length;
  const pct = Math.round(100 * (wordPart * 0.4 + (sayOk / lv.say.length) * 0.2 + (hearOk / lv.hear.length) * 0.2 + (talkOk / lv.talks.length) * 0.2));
  return {
    pct, sayOk, hearOk, talkOk,
    known: lv.words.filter((w) => wordStatus(w.id) === 'known').length,
    unseen: lv.words.filter((w) => !ws(w.id).seen).length,
  };
}
const UNLOCK = 50;
function unlocked(lv) {
  if (S.settings.unlockAll || lv.id === 1) return true;
  return levelProgress(levelOf(lv.id - 1)).pct >= UNLOCK;
}
function currentLevel() {
  const open = LEVELS.filter(unlocked);
  return open.find((l) => levelProgress(l).pct < 90) || open[open.length - 1];
}

// ---------- 효과음 ----------
let actx = null;
function beep(ok) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = ok ? [660, 880] : [300, 220];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = f; o.type = 'sine';
      const t = actx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.2);
    });
  } catch { /* 소리 없이 진행 */ }
}

function toast(msg) {
  const t = $('#toast');
  t.innerHTML = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

function applySettings() {
  Speech.rate = S.settings.rate;
  Speech.voiceName = S.settings.voice;
  const th = S.settings.theme;
  if (th === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', th);
}

// =====================================================================
// 메인 화면 (탭)
// =====================================================================
let tab = 'today';
let levelPage = null; // 단계 탭 안에서 연 단계 번호

function go(t, opts = {}) {
  tab = t;
  levelPage = opts.level ?? null;
  render();
  window.scrollTo(0, 0);
}

function render() {
  document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
  const s = streak();
  $('#top-streak').textContent = s ? `🔥 ${s}일` : '';
  const v = $('#view');
  if (tab === 'today') v.innerHTML = viewToday();
  else if (tab === 'levels') v.innerHTML = levelPage ? viewLevel(levelOf(levelPage)) : viewLevels();
  else if (tab === 'words') { v.innerHTML = viewWords(); fillWordList(); }
  else if (tab === 'settings') v.innerHTML = viewSettings();
  $('#top-title').textContent = { today: '여행 영어 첫걸음', levels: '단계별 공부', words: '내 단어장', settings: '설정' }[tab];
}

function row({ act, arg = '', ico, title, sub = '', right = '', cls = '', bar = null }) {
  return `<button type="button" class="row ${cls}" data-act="${act}" data-arg="${esc(arg)}">
    <span class="ico" aria-hidden="true">${ico}</span>
    <span class="txt"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}${bar != null ? `<span class="bar"><i style="width:${bar}%"></i></span>` : ''}</span>
    ${right}<span class="go" aria-hidden="true">›</span></button>`;
}

// ---------- 오늘 ----------
function viewToday() {
  const lv = currentLevel();
  const p = levelProgress(lv);
  const due = dueWords().length;
  const done = studiedToday();
  const nextTalk = lv.talks.find((t) => !S.talks[t.id]?.done) || pick(lv.talks);
  const tipIdx = today() % TIPS.length;
  return `
  <section class="card hero">
    <h2>${done ? '오늘 공부 완료! 🎉' : '오늘도 5분만 해 볼까요? 🙂'}</h2>
    <p>${done ? '잘했어요. 더 하고 싶으면 한 번 더 해도 좋아요.' : `새 단어 ${S.settings.newPerDay}개 + 복습 + 말하기·듣기를 한 번에 해요.`}</p>
    <div class="stats">
      <div><b>${streak()}</b><span>🔥 연속 일</span></div>
      <div><b>${knownCount()}</b><span>📚 외운 단어</span></div>
      <div><b>${due}</b><span>🔁 복습할 단어</span></div>
    </div>
    <button type="button" class="big-btn" data-act="today">${done ? '▶ 한 번 더 하기' : '▶ 오늘 공부 시작'}</button>
  </section>
  ${Speech.canListen ? '' : `<div class="card"><h2>🎤 말하기 채점이 안 되는 브라우저예요</h2><p class="small">말하기 채점은 <b>크롬</b>(안드로이드·PC)이나 <b>사파리</b>(아이폰)에서 돼요. 지금은 소리 내어 따라 읽고 스스로 확인하는 방식으로 연습할 수 있어요.</p></div>`}
  <div class="sec-title">지금 단계</div>
  ${row({ act: 'level', arg: lv.id, ico: lv.emoji, title: `${lv.id}단계 · ${lv.title}`, sub: `${lv.desc} · ${p.pct}%`, bar: p.pct })}
  <div class="sec-title">💬 오늘의 회화</div>
  ${row({ act: 'talk', arg: nextTalk.id, ico: nextTalk.emoji, title: nextTalk.title, sub: S.talks[nextTalk.id]?.done ? `완료 ${stars(S.talks[nextTalk.id].best)}` : '역할극으로 실제 여행처럼 말해 봐요' })}
  <div class="sec-title">바로 연습</div>
  ${row({ act: 'speak', arg: lv.id, ico: '🗣️', title: '따라 말하기', sub: '듣고 따라 말하면 발음을 채점해 줘요' })}
  ${row({ act: 'listen', arg: lv.id, ico: '👂', title: '듣고 알아듣기', sub: '여행지에서 듣게 되는 말을 알아들어요' })}
  ${due ? row({ act: 'review', ico: '🔁', title: `복습할 단어 ${due}개`, sub: '잊어버리기 전에 다시 봐요' }) : ''}
  <div class="sec-title">💡 오늘의 팁</div>
  <div class="card"><p>${TIPS[tipIdx]}</p></div>`;
}

// ---------- 단계 목록 ----------
function viewLevels() {
  return `<p class="muted small" style="margin:4px 4px 14px">쉬운 단계부터 차근차근! 앞 단계를 ${UNLOCK}% 넘게 하면 다음 단계가 열려요.</p>` +
    LEVELS.map((lv) => {
      const p = levelProgress(lv);
      const open = unlocked(lv);
      return row({
        act: open ? 'level' : 'locked', arg: lv.id, ico: open ? lv.emoji : '🔒',
        title: `${lv.id}단계 · ${lv.title}`, sub: lv.desc, bar: open ? p.pct : null,
        cls: open ? (p.pct >= 90 ? 'done' : '') : 'locked',
        right: open ? `<span class="pill ${p.pct >= 90 ? 'good' : ''}">${p.pct >= 90 ? '완료' : `${p.pct}%`}</span>` : '',
      });
    }).join('');
}

// ---------- 단계 하나 ----------
function viewLevel(lv) {
  const p = levelProgress(lv);
  return `
  <button type="button" class="link-btn" data-act="levels">‹ 단계 목록</button>
  <section class="card">
    <h2>${lv.emoji} ${lv.id}단계 · ${lv.title}</h2>
    <p>${lv.desc}</p>
    <div class="bar" style="margin-top:12px"><i style="width:${p.pct}%"></i></div>
    <p class="small" style="margin-top:6px">진행 ${p.pct}% ${p.pct >= UNLOCK && lv.id < LEVELS.length ? '· 다음 단계 열림 🔓' : ''}</p>
  </section>
  <div class="sec-title">1. 단어</div>
  ${row({ act: 'learn', arg: lv.id, ico: '📖', title: p.unseen ? '새 단어 배우기' : '단어 다시 보기', sub: p.unseen ? `새 단어 ${p.unseen}개 남았어요` : '모든 단어를 한 번씩 봤어요' })}
  ${row({ act: 'quiz', arg: lv.id, ico: '✏️', title: '단어 퀴즈', sub: `외운 단어 ${p.known} / ${lv.words.length}` })}
  <div class="sec-title">2. 말하기·듣기</div>
  ${row({ act: 'speak', arg: lv.id, ico: '🗣️', title: '따라 말하기', sub: `잘 말한 문장 ${p.sayOk} / ${lv.say.length}` })}
  ${row({ act: 'listen', arg: lv.id, ico: '👂', title: '듣고 알아듣기', sub: `알아들은 말 ${p.hearOk} / ${lv.hear.length}` })}
  <div class="sec-title">3. 실전 회화 (역할극)</div>
  ${lv.talks.map((t) => row({ act: 'talk', arg: t.id, ico: t.emoji, title: t.title, sub: S.talks[t.id]?.done ? `완료 ${stars(S.talks[t.id].best)} · ${S.talks[t.id].done}번 함` : '아직 안 했어요', cls: S.talks[t.id]?.done ? 'done' : '' })).join('')}`;
}

// ---------- 단어장 ----------
let wordFilter = 'all';
let wordQuery = '';
function viewWords() {
  const counts = {
    all: ALL.words.length,
    new: ALL.words.filter((w) => wordStatus(w.id) === 'new').length,
    learning: ALL.words.filter((w) => wordStatus(w.id) === 'learning').length,
    known: knownCount(),
    hard: confusing().length,
  };
  const chip = (k, label) => `<button type="button" data-filter="${k}" aria-pressed="${wordFilter === k}">${label} ${counts[k]}</button>`;
  return `
  <input class="search" id="word-q" type="search" placeholder="🔍 영어나 뜻으로 찾기" value="${esc(wordQuery)}" autocomplete="off">
  <div class="chips">${chip('all', '전체')}${chip('new', '새 단어')}${chip('learning', '🟠 배우는 중')}${chip('known', '🟢 외움')}${chip('hard', '😵 헷갈려요')}</div>
  ${counts.hard ? `<button type="button" class="big-btn ghost" data-act="hard" style="margin:6px 0 10px">😵 헷갈리는 단어 ${counts.hard}개 연습하기</button>` : ''}
  <div id="word-list"></div>
  <p class="muted small" style="margin-top:12px">줄을 누르면 소리가 나와요.</p>`;
}
function fillWordList() {
  const q = wordQuery.trim().toLowerCase();
  const hard = new Set(confusing().map((w) => w.id));
  let html = '';
  for (const lv of LEVELS) {
    const list = lv.words.filter((w) => {
      const st = wordStatus(w.id);
      if (wordFilter === 'hard' ? !hard.has(w.id) : wordFilter !== 'all' && st !== wordFilter) return false;
      return !q || w.en.toLowerCase().includes(q) || w.ko.includes(q);
    });
    if (!list.length) continue;
    html += `<div class="sec-title">${lv.emoji} ${lv.id}단계 · ${lv.title}</div><div class="card" style="padding:4px 14px">` +
      list.map((w) => `<button type="button" class="word-row" data-say="${esc(w.en)}">
        <span class="pic" aria-hidden="true">${w.pic}</span>
        <span><span class="en">${esc(w.en)}</span>${S.settings.pron ? `<span class="pr">${esc(w.pron)}</span>` : ''}<span class="ko">${esc(w.ko)}</span></span>
        <span class="dot ${wordStatus(w.id)}" title="${{ new: '새 단어', learning: '배우는 중', known: '외움' }[wordStatus(w.id)]}"></span></button>`).join('') + '</div>';
  }
  $('#word-list').innerHTML = html || '<p class="muted" style="text-align:center;margin-top:30px">해당하는 단어가 없어요.</p>';
}

// ---------- 설정 ----------
function viewSettings() {
  const st = S.settings;
  const voices = Speech.voices;
  const opt = (v, cur, label) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(label)}</option>`;
  return `
  <section class="card">
    <h2>🔊 소리</h2>
    <div class="setting"><span class="lbl">말하기 속도<small>처음엔 천천히가 좋아요</small></span>
      <select data-set="rate">${opt(0.6, st.rate, '🐢 아주 천천히')}${opt(0.8, st.rate, '🚶 천천히')}${opt(1, st.rate, '🏃 보통')}</select></div>
    <div class="setting"><span class="lbl">목소리</span>
      <select data-set="voice">${opt('', st.voice, '자동 (미국 영어)')}${voices.map((v) => opt(v.name, st.voice, `${v.name} (${v.lang})`)).join('')}</select></div>
    <div class="setting"><span class="lbl">들어 보기</span><button type="button" class="audio-btn" data-say="Hello! Nice to meet you.">🔊 Hello!</button></div>
  </section>
  <section class="card">
    <h2>📚 공부</h2>
    <div class="setting"><label for="s-pron">한글 발음 보기<small>익숙해지면 꺼 보세요</small></label><input id="s-pron" class="switch" type="checkbox" data-set="pron" ${st.pron ? 'checked' : ''}></div>
    <div class="setting"><label for="s-hint">회화에서 정답 힌트 바로 보기<small>끄면 💡 버튼을 눌러야 보여요</small></label><input id="s-hint" class="switch" type="checkbox" data-set="hint" ${st.hint ? 'checked' : ''}></div>
    <div class="setting"><span class="lbl">하루 새 단어</span>
      <select data-set="newPerDay">${[4, 6, 8, 10].map((n) => opt(n, st.newPerDay, `${n}개`)).join('')}</select></div>
    <div class="setting"><label for="s-unlock">모든 단계 열기<small>순서 상관없이 아무 단계나 공부해요</small></label><input id="s-unlock" class="switch" type="checkbox" data-set="unlockAll" ${st.unlockAll ? 'checked' : ''}></div>
    <div class="setting"><span class="lbl">화면</span>
      <select data-set="theme">${opt('system', st.theme, '기기 설정 따라')}${opt('light', st.theme, '밝게')}${opt('dark', st.theme, '어둡게')}</select></div>
  </section>
  <section class="card">
    <h2>💾 기록 옮기기</h2>
    <p class="small">기록은 이 기기에만 저장돼요. 다른 기기로 옮기려면 코드를 복사해서 새 기기에 붙여 넣어요.</p>
    <div class="btn-row"><button type="button" class="big-btn ghost" data-act="export">📋 코드 복사</button><button type="button" class="big-btn ghost" data-act="import">📥 코드 넣기</button></div>
    <textarea class="code" id="code" hidden placeholder="여기에 코드를 붙여 넣고 아래 버튼을 눌러요"></textarea>
    <button type="button" class="big-btn" id="code-apply" data-act="import-apply" hidden style="margin-top:10px">기록 불러오기</button>
  </section>
  <section class="card">
    <button type="button" class="link-btn danger" data-act="reset">🗑️ 기록 모두 지우기</button>
    <p class="small">🔒 마이크 소리는 말한 문장을 알아듣는 데에만 쓰고 저장하지 않아요.</p>
  </section>`;
}

// =====================================================================
// 문제 풀기 화면
// =====================================================================
let P = null; // 지금 하고 있는 것

function openPlay() {
  $('#play').hidden = false;
  document.body.style.overflow = 'hidden';
  if (!history.state?.play) history.pushState({ play: 1 }, '');
}
function hidePlay() {
  Speech.stop();
  Speech.stopListening();
  $('#play').hidden = true;
  document.body.style.overflow = '';
  P = null;
  save();
  render();
}
function closePlay() {
  if (history.state?.play) history.back(); else hidePlay();
}
window.addEventListener('popstate', () => { if (!$('#play').hidden) hidePlay(); });

function setProgress(i, n) {
  $('#play-progress').style.width = `${Math.round((100 * i) / Math.max(n, 1))}%`;
  $('#play-count').textContent = n ? `${Math.min(i + 1, n)}/${n}` : '';
}

// ---------- 문제 묶음 만들기 ----------
const sentence = (it) => !it.id.startsWith('w');
function choicesFor(item, field) {
  const pool = (sentence(item) ? [...ALL.hear, ...ALL.say] : ALL.words).filter((x) => x[field] !== item[field]);
  const same = shuffle(pool.filter((x) => x.level === item.level));
  const other = shuffle(pool.filter((x) => x.level !== item.level));
  const out = [];
  for (const x of [...same, ...other]) {
    if (out.length >= 3) break;
    if (!out.some((o) => o[field] === x[field])) out.push(x);
  }
  return shuffle([item, ...out]);
}
function reviewKind(w) { const b = ws(w.id).box; return b <= 1 ? 'ko' : b === 2 ? 'listen' : pick(['en', 'listen', 'ko']); }

function buildLearn(words) {
  const q = [];
  for (let i = 0; i < words.length; i += 4) {
    const chunk = words.slice(i, i + 4);
    chunk.forEach((w) => q.push({ k: 'learn', item: w }));
    shuffle(chunk).forEach((w) => q.push({ k: 'ko', item: w }));
  }
  shuffle(words).forEach((w) => q.push({ k: 'en', item: w }));
  return q;
}
function buildToday() {
  const lv = currentLevel();
  let q = [];
  const due = shuffle(dueWords()).slice(0, 10);
  q.push(...due.map((w) => ({ k: reviewKind(w), item: w })));
  // 새 단어: 지금 단계부터, 다 봤으면 열린 다음 단계에서
  const fresh = [];
  for (const l of LEVELS.filter(unlocked).filter((x) => x.id >= lv.id)) {
    for (const w of l.words) if (!ws(w.id).seen && fresh.length < S.settings.newPerDay) fresh.push(w);
  }
  q.push(...buildLearn(fresh));
  if (!due.length && !fresh.length) {
    const seen = ALL.words.filter((w) => ws(w.id).seen && w.level <= lv.id);
    q.push(...shuffle(seen).slice(0, 8).map((w) => ({ k: reviewKind(w), item: w })));
  }
  const says = [...lv.say].sort((a, b) => (S.say[a.id]?.best || 0) - (S.say[b.id]?.best || 0)).slice(0, 2);
  const hears = shuffle(lv.hear.filter((h) => !(S.hear[h.id]?.right > 0))).concat(shuffle(lv.hear)).slice(0, 2);
  q.push(...says.map((x) => ({ k: 'speak', item: x })), ...hears.map((x) => ({ k: 'listen', item: x })));
  return q;
}

function startSession(title, queue, finishMsg) {
  if (!queue.length) { toast('지금은 할 문제가 없어요 🙂'); return; }
  P = { mode: 'session', title, queue, i: 0, right: 0, wrong: 0, missed: [], requeued: new Set(), finishMsg };
  openPlay();
  showStep();
}

// ---------- 한 문제 보여 주기 ----------
function showStep() {
  const ex = P.queue[P.i];
  setProgress(P.i, P.queue.length);
  if (!ex) { showFinish(); return; }
  P.answered = false;
  P.best = 0;
  const body = $('#play-body');
  body.scrollTop = 0;
  const it = ex.item;
  const pron = S.settings.pron && it.pron ? `<div class="q-pron">${esc(it.pron)}</div>` : '';
  const audio = (txt) => `<div class="audio-btns"><button type="button" class="audio-btn" data-say="${esc(txt)}">🔊 듣기</button><button type="button" class="audio-btn" data-say-slow="${esc(txt)}">🐢 천천히</button></div>`;

  if (ex.k === 'learn') {
    body.innerHTML = `
      <div class="q-label">✨ 새 단어</div>
      <div class="q-card">
        <div class="q-pic">${it.pic}</div>
        <div class="q-en">${esc(it.en)}</div>${pron}
        <div class="q-ko">${esc(it.ko)}</div>
        ${audio(it.en)}
      </div>
      ${micBlock('소리 내어 따라 말해 보세요 (선택)')}
      <div class="spacer"></div>
      <button type="button" class="big-btn" data-act="next">알겠어요 →</button>`;
    seeWord(it.id);
    Speech.say(it.en);
  } else if (ex.k === 'ko' || ex.k === 'listen') {
    const audioOnly = ex.k === 'listen';
    body.innerHTML = `
      <div class="q-label">${audioOnly ? '👂 잘 듣고 뜻을 골라요' : '🤔 무슨 뜻일까요?'}</div>
      <div class="q-card">
        ${audioOnly
          ? `<button type="button" class="audio-big" data-say="${esc(it.en)}" aria-label="다시 듣기">🔊</button><div class="audio-btns"><button type="button" class="audio-btn" data-say-slow="${esc(it.en)}">🐢 천천히 듣기</button></div><div id="reveal"></div>`
          : `${it.pic ? `<div class="q-pic">${it.pic}</div>` : ''}<div class="q-en ${sentence(it) ? 'sentence' : ''}">${esc(it.en)}</div>${pron}${audio(it.en)}`}
      </div>
      <div class="choices">${choicesFor(it, 'ko').map((c) => `<button type="button" class="choice" data-pick="${esc(c.id)}">${esc(c.ko)}</button>`).join('')}</div>
      <div id="fb"></div><div class="spacer"></div><div id="next-slot"></div>`;
    Speech.say(it.en);
  } else if (ex.k === 'en') {
    body.innerHTML = `
      <div class="q-label">✏️ 영어로 뭐라고 할까요?</div>
      <div class="q-card">${it.pic ? `<div class="q-pic">${it.pic}</div>` : ''}<div class="q-ko main">${esc(it.ko)}</div></div>
      <div class="choices">${choicesFor(it, 'en').map((c) => `<button type="button" class="choice" data-pick="${esc(c.id)}">${esc(c.en)}</button>`).join('')}</div>
      <div id="fb"></div><div class="spacer"></div><div id="next-slot"></div>`;
  } else if (ex.k === 'speak') {
    body.innerHTML = `
      <div class="q-label">🗣️ 듣고 따라 말해요</div>
      <div class="q-card">
        <div class="q-ko main">${esc(it.ko)}</div>
        <div class="q-en sentence" style="margin-top:10px">${esc(it.en)}</div>${pron}
        ${audio(it.en)}
      </div>
      ${micBlock('버튼을 누르고 영어로 말해요')}
      <div id="fb"></div><div class="spacer"></div>
      <div class="btn-row"><button type="button" class="big-btn ghost" data-act="next">건너뛰기</button></div>`;
    Speech.say(it.en);
  }
}

function micBlock(label) {
  if (!Speech.canListen) {
    return `<p class="mic-label" style="margin-top:16px">🔊 듣고 <b>소리 내어 3번</b> 따라 말해 보세요</p>
      <button type="button" class="big-btn ghost" data-act="self-said" style="margin-top:8px">🗣️ 따라 말했어요</button>`;
  }
  return `<button type="button" class="mic" data-act="mic" aria-label="말하기">🎤</button><p class="mic-label" id="mic-label">${label}</p>`;
}

function onPick(id) {
  if (P.answered) return;
  P.answered = true;
  const ex = P.queue[P.i];
  const it = ex.item;
  const ok = id === it.id;
  document.querySelectorAll('[data-pick]').forEach((b) => {
    b.disabled = true;
    if (b.dataset.pick === it.id) b.classList.add('right');
    else if (b.dataset.pick === id) b.classList.add('wrong');
  });
  beep(ok);
  if (ok) P.right++; else {
    P.wrong++;
    if (!P.missed.includes(it)) P.missed.push(it);
    // 틀린 건 조금 뒤에 한 번 더 나온다
    if (!P.requeued.has(it.id + ex.k)) {
      P.requeued.add(it.id + ex.k);
      P.queue.splice(Math.min(P.i + 4, P.queue.length), 0, { ...ex });
    }
  }
  if (it.id.startsWith('w')) markWord(it.id, ok);
  else if (it.id.startsWith('h')) { const h = S.hear[it.id] || { right: 0, wrong: 0 }; h[ok ? 'right' : 'wrong']++; S.hear[it.id] = h; }
  addActivity();
  save();
  const pron = S.settings.pron && it.pron ? ` <span class="small">[${esc(it.pron)}]</span>` : '';
  $('#fb').innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}">${ok ? pick(PRAISE) : pick(CHEER)}
    <span class="fx-en">${esc(it.en)}${pron}</span><span class="fx-ko">${esc(it.ko)}</span></div>`;
  $('#next-slot').innerHTML = `<button type="button" class="big-btn ${ok ? 'good' : ''}" data-act="next">계속 →</button>`;
  setTimeout(() => Speech.say(it.en), 250);
}

async function onMic(btn) {
  const ex = P?.queue?.[P.i];
  const target = P.mode === 'talk' ? null : ex.item;
  if (btn.classList.contains('on')) { Speech.stopListening(); return; }
  btn.classList.add('on');
  const label = $('#mic-label');
  if (label) label.textContent = '듣고 있어요… 말해 보세요 👂';
  let heard;
  try {
    heard = await Speech.listen();
  } catch (err) {
    btn.classList.remove('on');
    const m = err.message;
    const msg = m === 'not-allowed' || m === 'service-not-allowed' ? '마이크를 쓸 수 있게 허락해 주세요 (주소창의 🔒 또는 설정에서)'
      : m === 'network' ? '음성 인식은 인터넷이 연결되어 있어야 해요'
        : '잘 안 들렸어요. 조금 더 크게 말해 볼까요? 🙂';
    if (label) label.textContent = msg;
    return;
  }
  btn.classList.remove('on');
  if (P.mode === 'talk') { talkHeard(heard); return; }
  const r = Grade.best([target.en], heard);
  if (label) label.textContent = '한 번 더 하려면 다시 눌러요';
  if (ex.k === 'speak') {
    const s = S.say[target.id] || { best: 0, tries: 0 };
    s.tries++; s.best = Math.max(s.best, r.score); S.say[target.id] = s;
    if (r.score >= 0.6 && !P.countedSpeak) { P.right++; P.countedSpeak = true; }
    addActivity();
    save();
  }
  beep(r.score >= 0.6);
  showSaid(r, target.en);
  if (ex.k === 'speak') {
    $('.btn-row').innerHTML = `<button type="button" class="big-btn ${r.score >= 0.6 ? 'good' : ''}" data-act="next">${r.score >= 0.6 ? '계속 →' : '넘어가기 →'}</button>`;
  }
}

function showSaid(r, target) {
  const marks = Grade.marks(target, r.heard);
  const sc = r.score;
  const msg = sc >= 0.9 ? '완벽해요! 원어민 같아요 🎉' : sc >= 0.6 ? '잘했어요! 충분히 알아들어요 👏' : sc >= 0.3 ? '조금만 더! 빨간 부분을 다시 들어 봐요 💪' : '괜찮아요! 천천히 다시 해 볼까요? 🙂';
  let fb = $('#fb');
  if (!fb) { fb = document.createElement('div'); fb.id = 'fb'; $('#mic-label').after(fb); }
  fb.innerHTML = `<div class="feedback ${sc >= 0.6 ? 'good' : 'info'}">
    <div class="score-stars">${stars(sc) || '🌱'}</div>${msg}
    <div class="said">${marks.map((m) => `<span class="${m.ok ? 'hit' : 'miss'}">${esc(m.w)}</span>`).join(' ')}</div>
    <span class="fx-ko">들린 말: "${esc(r.heard)}"</span></div>`;
}

function next() {
  P.i++;
  P.countedSpeak = false;
  showStep();
}

function showFinish() {
  setProgress(P.queue.length, P.queue.length);
  addActivity(5); // 한 묶음을 끝내면 오늘 공부한 날로 친다
  save();
  const total = P.right + P.wrong;
  const missed = P.missed;
  $('#play-count').textContent = '';
  $('#play-body').innerHTML = `
    <div class="done-pic">${P.wrong === 0 ? '🏆' : '🎉'}</div>
    <div class="done-title">${esc(P.finishMsg || '다 했어요!')}</div>
    <p class="muted" style="text-align:center;margin:0">${total ? `${total}문제 중 ${P.right}개 맞혔어요` : '잘했어요!'} · 🔥 연속 ${streak()}일</p>
    ${missed.length ? `<div class="sec-title">다시 보면 좋은 것</div><div class="card review-list" style="padding:4px 14px">${missed.map((w) => `
      <button type="button" class="word-row" data-say="${esc(w.en)}"><span class="pic">${w.pic || '💬'}</span><span><span class="en">${esc(w.en)}</span><span class="ko">${esc(w.ko)}</span></span><span class="go">🔊</span></button>`).join('')}</div>` : ''}
    <div class="spacer"></div>
    ${missed.length ? '<button type="button" class="big-btn ghost" data-act="retry-missed" style="margin-bottom:12px">틀린 것만 다시 하기</button>' : ''}
    <button type="button" class="big-btn" data-act="close">끝내기</button>`;
}

// =====================================================================
// 역할극 회화
// =====================================================================
function startTalk(id) {
  const talk = ALL.talks.find((t) => t.id === id);
  if (!talk) return;
  P = { mode: 'talk', talk, t: 0, log: [], scores: [], tries: 0, showHint: S.settings.hint };
  openPlay();
  renderTalk();
  talkStep();
}

function bubbleHtml(b, idx) {
  const subs = S.settings.subs;
  if (b.who === 'them') {
    const showEn = subs !== 'none' || b.reveal;
    const koCls = subs === 'both' || b.reveal ? '' : 'blur';
    return `<div class="who">상대방</div><div class="bubble them">
      <div class="b-en">${showEn ? esc(b.en) : '🔊 …'}</div>
      ${showEn ? `<div class="b-ko ${koCls}" data-reveal="${idx}">${esc(b.ko)}</div>` : ''}
      <div class="b-tools"><button type="button" data-say="${esc(b.en)}">🔊 다시</button><button type="button" data-say-slow="${esc(b.en)}">🐢 천천히</button>${showEn && koCls === '' ? '' : `<button type="button" data-reveal="${idx}">👀 ${showEn ? '뜻' : '글자'} 보기</button>`}</div></div>`;
  }
  return `<div class="who me">나 ${b.stars || ''}</div><div class="bubble me"><div class="b-en">${esc(b.en)}</div><div class="b-ko">${esc(b.ko)}</div></div>`;
}

function renderTalk() {
  const { talk } = P;
  const subs = S.settings.subs;
  const seg = (v, label) => `<button type="button" data-subs="${v}" aria-pressed="${subs === v}">${label}</button>`;
  $('#play-body').innerHTML = `
    <div class="q-label">${talk.emoji} ${esc(talk.title)}</div>
    <div class="seg" role="group" aria-label="상대방 말 자막">${seg('both', '영어+뜻')}${seg('en', '영어만')}${seg('none', '소리만 (어려움)')}</div>
    <div class="chat" id="chat">${P.log.map(bubbleHtml).join('')}</div>
    <div id="turn"></div>`;
  setProgress(P.t, talk.turns.length);
  if (P.finished != null) renderTalkDone();
}

function appendBubble(b) {
  P.log.push(b);
  const chat = $('#chat');
  chat.insertAdjacentHTML('beforeend', bubbleHtml(b, P.log.length - 1));
  requestAnimationFrame(() => { const body = $('#play-body'); body.scrollTop = body.scrollHeight; });
}

async function talkStep() {
  const { talk } = P;
  setProgress(P.t, talk.turns.length);
  const turn = talk.turns[P.t];
  const tb = $('#turn');
  if (!turn) { talkFinish(); return; }
  if (turn.who === 'them') {
    tb.innerHTML = '';
    appendBubble({ who: 'them', en: turn.en, ko: turn.ko });
    const mine = P;
    await Speech.say(turn.en);
    if (P !== mine) return; // 그 사이 닫았으면 멈춤
    await new Promise((r) => setTimeout(r, 350));
    if (P !== mine) return;
    P.t++;
    talkStep();
    return;
  }
  P.tries = 0;
  renderTurnBox();
}

function renderTurnBox(feedback = '') {
  const turn = P.talk.turns[P.t];
  const ans = turn.answers[0];
  const hint = P.showHint
    ? `<div class="tb-hint"><b>${esc(ans)}</b>${S.settings.pron ? `<span>${esc(turn.pron)}</span>` : ''}</div>`
    : '<button type="button" class="link-btn" data-act="hint">💡 힌트 보기</button>';
  let action;
  if (Speech.canListen) {
    action = `<button type="button" class="mic" data-act="mic" aria-label="말하기">🎤</button><p class="mic-label" id="mic-label">${P.tries ? '다시 눌러서 말해 보세요' : '버튼을 누르고 영어로 말해요'}</p>`;
  } else {
    // 마이크가 안 되는 브라우저: 소리 내어 읽으며 알맞은 말을 고른다
    const others = shuffle(ALL.talks.flatMap((t) => t.turns).filter((x) => x.who === 'me' && !x.answers.includes(ans)).map((x) => x.answers[0]));
    const opts = shuffle([ans, ...[...new Set(others)].slice(0, 2)]);
    action = `<p class="mic-label" style="margin-top:10px">알맞은 말을 <b>소리 내어 읽고</b> 골라요</p>
      <div class="choices">${opts.map((o) => `<button type="button" class="choice" data-talk-pick="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
  }
  $('#turn').innerHTML = `<div class="turn-box">
    <div class="small muted">나: 이렇게 말해 보세요</div>
    <div class="tb-ko">${esc(turn.ko)}</div>
    ${hint}
    ${action}
    <div id="fb">${feedback}</div>
    <div class="audio-btns"><button type="button" class="audio-btn" data-say="${esc(ans)}">🔊 정답 듣기</button><button type="button" class="audio-btn" data-act="talk-skip">넘어가기 ›</button></div>
  </div>`;
  requestAnimationFrame(() => { const body = $('#play-body'); body.scrollTop = body.scrollHeight; });
}

function talkAccept(text, score) {
  const turn = P.talk.turns[P.t];
  P.scores.push(score);
  appendBubble({ who: 'me', en: text, ko: turn.ko, stars: stars(score) });
  $('#turn').innerHTML = '';
  addActivity();
  P.t++;
  const mine = P;
  setTimeout(() => { if (P === mine) talkStep(); }, 500);
}

function talkHeard(heard) {
  const turn = P.talk.turns[P.t];
  const r = Grade.best(turn.answers, heard);
  P.tries++;
  if (r.score >= 0.5) {
    beep(true);
    const text = r.heard.charAt(0).toUpperCase() + r.heard.slice(1);
    talkAccept(text, r.score);
    return;
  }
  beep(false);
  const marks = Grade.marks(r.answer, r.heard);
  const fb = `<div class="feedback info">${P.tries >= 2 ? '괜찮아요! 🔊 정답 듣기를 누르고 천천히 따라 해 봐요' : '아깝다! 한 번 더 해 볼까요? 🙂'}
    <div class="said">${marks.map((m) => `<span class="${m.ok ? 'hit' : 'miss'}">${esc(m.w)}</span>`).join(' ')}</div>
    <span class="fx-ko">들린 말: "${esc(r.heard)}"</span></div>`;
  P.showHint = true;
  renderTurnBox(fb);
}

function talkFinish() {
  const avg = P.scores.length ? P.scores.reduce((a, b) => a + b, 0) / P.scores.length : 0;
  const rec = S.talks[P.talk.id] || { done: 0, best: 0 };
  rec.done++; rec.best = Math.max(rec.best, avg); S.talks[P.talk.id] = rec;
  addActivity(5);
  save();
  P.finished = avg;
  renderTalkDone();
}
function renderTalkDone() {
  const avg = P.finished;
  setProgress(1, 1);
  $('#play-count').textContent = '';
  $('#turn').innerHTML = `<div class="turn-box" style="text-align:center">
    <div class="done-pic" style="margin-top:0">🎉</div>
    <div class="done-title">회화 완료!</div>
    <div class="score-stars">${stars(avg) || '🌱'}</div>
    <p class="muted">${avg >= 0.6 ? '실제 여행에서도 이렇게 말하면 돼요!' : '끝까지 해낸 게 대단해요. 한 번 더 하면 훨씬 쉬워져요!'}</p>
    <div class="btn-row"><button type="button" class="big-btn ghost" data-act="talk-again">다시 하기</button><button type="button" class="big-btn" data-act="close">끝내기</button></div>
  </div>`;
  requestAnimationFrame(() => { const body = $('#play-body'); body.scrollTop = body.scrollHeight; });
}

// =====================================================================
// 누르기 처리
// =====================================================================
function lvArg(arg) { return levelOf(Number(arg)) || currentLevel(); }

document.addEventListener('click', (e) => {
  const t = e.target.closest('button, [data-reveal]');
  if (!t) return;
  if (t.dataset.tab) { go(t.dataset.tab); return; }
  if (t.dataset.say) { Speech.say(t.dataset.say); return; }
  if (t.dataset.saySlow) { Speech.say(t.dataset.saySlow, { rate: 0.55 }); return; }
  if (t.dataset.pick) { onPick(t.dataset.pick); return; }
  if (t.dataset.filter) { wordFilter = t.dataset.filter; render(); return; }
  if (t.dataset.subs) { S.settings.subs = t.dataset.subs; save(); renderTalk(); if (P.talk.turns[P.t]?.who === 'me') renderTurnBox(); return; }
  if (t.dataset.reveal != null && P?.log) { P.log[Number(t.dataset.reveal)].reveal = true; const fbHtml = $('#fb')?.innerHTML || ''; const meTurn = P.talk.turns[P.t]?.who === 'me'; renderTalk(); if (meTurn) renderTurnBox(fbHtml); return; }
  if (t.dataset.talkPick) {
    const turn = P.talk.turns[P.t];
    if (turn.answers.includes(t.dataset.talkPick)) { beep(true); Speech.say(t.dataset.talkPick); talkAccept(t.dataset.talkPick, 0.7); } else { beep(false); t.classList.add('wrong'); t.disabled = true; }
    return;
  }
  const act = t.dataset.act;
  const arg = t.dataset.arg;
  switch (act) {
    case 'today': startSession('오늘 공부', buildToday(), '오늘 공부 끝! 🎉'); break;
    case 'level': go('levels', { level: Number(arg) }); break;
    case 'levels': go('levels'); break;
    case 'locked': toast(`앞 단계를 ${UNLOCK}% 넘게 하면 열려요 🔒<br><span class="small">설정 › 모든 단계 열기로 바로 열 수도 있어요</span>`); break;
    case 'learn': {
      const lv = lvArg(arg);
      const fresh = lv.words.filter((w) => !ws(w.id).seen).slice(0, 8);
      startSession('새 단어', buildLearn(fresh.length ? fresh : shuffle(lv.words).slice(0, 8)), '단어 공부 끝!');
      break;
    }
    case 'quiz': {
      const lv = lvArg(arg);
      const seen = lv.words.filter((w) => ws(w.id).seen);
      if (!seen.length) { toast('먼저 📖 새 단어 배우기를 해 봐요'); break; }
      startSession('단어 퀴즈', shuffle(seen).slice(0, 12).map((w) => ({ k: pick(['ko', 'en', 'listen']), item: w })), '퀴즈 끝!');
      break;
    }
    case 'speak': {
      const lv = lvArg(arg);
      const list = [...lv.say].sort((a, b) => (S.say[a.id]?.best || 0) - (S.say[b.id]?.best || 0)).slice(0, 6);
      startSession('따라 말하기', shuffle(list).map((x) => ({ k: 'speak', item: x })), '말하기 연습 끝!');
      break;
    }
    case 'listen': {
      const lv = lvArg(arg);
      startSession('듣기', shuffle(lv.hear).slice(0, 8).map((x) => ({ k: 'listen', item: x })), '듣기 연습 끝!');
      break;
    }
    case 'review': startSession('복습', shuffle(dueWords()).slice(0, 15).map((w) => ({ k: reviewKind(w), item: w })), '복습 끝!'); break;
    case 'hard': startSession('헷갈리는 단어', buildLearn(shuffle(confusing()).slice(0, 8)), '헷갈리는 단어 연습 끝!'); break;
    case 'talk': startTalk(arg); break;
    case 'talk-again': startTalk(P.talk.id); break;
    case 'talk-skip': talkAccept(P.talk.turns[P.t].answers[0], 0.1); break;
    case 'hint': P.showHint = true; renderTurnBox($('#fb')?.innerHTML || ''); break;
    case 'mic': onMic(t); break;
    case 'self-said': {
      const ex = P.queue[P.i];
      if (ex.k === 'speak') { const s = S.say[ex.item.id] || { best: 0, tries: 0 }; s.tries++; s.best = Math.max(s.best, 0.6); S.say[ex.item.id] = s; addActivity(); save(); }
      next();
      break;
    }
    case 'next': next(); break;
    case 'retry-missed': {
      const items = P.missed;
      startSession('다시 하기', shuffle(items).map((it) => ({ k: it.id.startsWith('w') ? 'ko' : 'listen', item: it })), '다시 하기 끝!');
      break;
    }
    case 'close': closePlay(); break;
    case 'export': {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
      navigator.clipboard?.writeText(code).then(() => toast('코드를 복사했어요. 새 기기에 붙여 넣어요 📋'), () => { const ta = $('#code'); ta.hidden = false; ta.value = code; ta.select(); toast('코드를 길게 눌러 복사해요'); });
      if (!navigator.clipboard) { const ta = $('#code'); ta.hidden = false; ta.value = code; ta.select(); }
      break;
    }
    case 'import': $('#code').hidden = false; $('#code').value = ''; $('#code-apply').hidden = false; $('#code').focus(); break;
    case 'import-apply': {
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob($('#code').value.trim()))));
        if (!data || typeof data !== 'object' || !data.words) throw new Error('bad');
        localStorage.setItem(KEY, JSON.stringify(data));
        S = load(); applySettings(); render(); toast('기록을 불러왔어요 ✅');
      } catch { toast('코드가 올바르지 않아요'); }
      break;
    }
    case 'reset':
      if (confirm('공부 기록을 모두 지울까요? 되돌릴 수 없어요.')) {
        const settings = S.settings;
        S = load(); S.words = {}; S.say = {}; S.hear = {}; S.talks = {}; S.days = {}; S.settings = settings;
        save(); render(); toast('기록을 지웠어요');
      }
      break;
    default: break;
  }
});

$('#play-close').addEventListener('click', closePlay);

document.addEventListener('input', (e) => {
  if (e.target.id === 'word-q') { wordQuery = e.target.value; fillWordList(); }
});
document.addEventListener('change', (e) => {
  const key = e.target.dataset.set;
  if (!key) return;
  const el = e.target;
  let val = el.type === 'checkbox' ? el.checked : el.value;
  if (key === 'rate' || key === 'newPerDay') val = Number(val);
  S.settings[key] = val;
  save();
  applySettings();
  if (key === 'rate' || key === 'voice') Speech.say('Hello! Nice to meet you.');
  if (key === 'theme') render();
});

// 시작
applySettings();
render();
// 목소리 목록은 늦게 도착하는 브라우저가 있다
window.speechSynthesis?.addEventListener?.('voiceschanged', () => { if (tab === 'settings') render(); });

if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {});
