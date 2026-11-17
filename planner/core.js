// 엄마 앱(planner/)과 아이 앱(planner/kid/)이 함께 쓰는 데이터 규칙.
// 기록은 각 기기 localStorage 에만 있고, 두 기기 사이는 카톡·문자로 보내는 "코드"로 이어진다.
(function () {
'use strict';
const HB = {};
HB.DOW = ['일','월','화','수','목','금','토'];
HB.DOW_ORDER = [1,2,3,4,5,6,0];
HB.COLORS = { // light bg, fg, border | dark bg, fg, border
  green:['#e3f0dc','#3e6b2e','#c5deb8','#213020','#a9d597','#35502f'],
  blue:['#dceaf3','#2d5f80','#b9d3e6','#1d2e3b','#9cc6e6','#2f4a5e'],
  orange:['#fbe7d4','#94531a','#f1cda9','#3a2a1c','#f2bc88','#5a4128'],
  red:['#f6dee0','#9a3340','#ebc0c5','#3a2226','#f0a5af','#5a3339'],
  yellow:['#f8efc8','#7a6410','#eadb98','#35301a','#e8d27a','#524a28'],
  teal:['#d9f0ee','#22675f','#b3deda','#18302e','#8fd8cf','#2a4b48'],
  purple:['#ece4f7','#5d3f8f','#d6c7ee','#2d2540','#c8b2f0','#45395f'],
  pink:['#fbe0ee','#94326a','#f0c0da','#3a2030','#f0a6cf','#5a3349'],
  gray:['#eceef2','#4f5868','#d6dae1','#262c36','#b5bcc8','#3a4250'],
};
(function injectColors() {
  let l = '', d = '', cls = '';
  for (const [n,c] of Object.entries(HB.COLORS)) {
    l += `--${n}-bg:${c[0]};--${n}-fg:${c[1]};--${n}-bd:${c[2]};`;
    d += `--${n}-bg:${c[3]};--${n}-fg:${c[4]};--${n}-bd:${c[5]};`;
    cls += `.c-${n}{--cbg:var(--${n}-bg);--cfg:var(--${n}-fg);--cbd:var(--${n}-bd)}`;
  }
  const s = document.createElement('style');
  s.textContent = `:root{${l}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${d}}}:root[data-theme="dark"]{${d}}${cls}`;
  document.head.appendChild(s);
})();

/* ---------- 날짜 ---------- */
const pad = n => String(n).padStart(2,'0');
HB.pad = pad;
HB.ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
HB.parse = k => { const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); };
HB.today = () => HB.ymd(new Date());
HB.addDays = (k,n) => { const d = HB.parse(k); d.setDate(d.getDate()+n); return HB.ymd(d); };
HB.dowOf = k => HB.parse(k).getDay();
HB.mondayOf = k => HB.addDays(k, -((HB.dowOf(k)+6)%7));
HB.md = k => { const d = HB.parse(k); return `${d.getMonth()+1}월 ${d.getDate()}일`; };
HB.mdw = k => `${HB.md(k)} (${HB.DOW[HB.dowOf(k)]})`;
HB.diffDays = (a,b) => Math.round((HB.parse(b)-HB.parse(a))/86400000);
HB.hm = iso => { const d = new Date(iso); const h = d.getHours(); return `${h<12?'오전':'오후'} ${h%12||12}:${pad(d.getMinutes())}`; };
HB.uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-3);
HB.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
HB.hash = s => { let h = 5381; for (const ch of 'hb:' + s) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };
HB.CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------- 저장 ---------- */
HB.load = key => { try { const s = JSON.parse(localStorage.getItem(key)); if (s && s.v === 1 && s.routine) return s; } catch (e) {} return null; };
HB.save = (key, S) => { try { localStorage.setItem(key, JSON.stringify(S)); } catch (e) {} };

HB.defaultState = function () {
  const uid = HB.uid;
  const subjects = [['math','수학','green'],['eng','영어','blue'],['hanja','한자','orange'],['hist','역사','red'],['soc','사회','yellow'],['sci','과학','teal'],['read','독서','purple'],['etc','기타','gray']]
    .map(([id,name,color]) => ({id,name,color}));
  const r = (subj,title,min,detail='') => ({id:uid(),subj,title,detail,min});
  const routine = {
    1:[r('math','수학 문제집 2쪽',30),r('eng','영어 숙제',30),r('hanja','한자 5자 쓰기',15)],
    2:[r('math','수학 문제집 2쪽',30),r('eng','영어 숙제',30),r('hist','역사책 읽기',20)],
    3:[r('math','수학 문제집 2쪽',30),r('eng','영어 숙제',30),r('soc','사회책 읽기',20),r('hanja','한자 5자 쓰기',15)],
    4:[r('math','수학 문제집 2쪽',30),r('eng','영어 숙제',30),r('sci','과학책 읽기',20)],
    5:[r('math','수학 문제집 2쪽',30),r('eng','영어 숙제',30),r('hist','역사책 읽기',20),r('hanja','한자 복습',10)],
    6:[r('math','틀린 문제 다시 풀기',30),r('sci','과학책 읽기',30),r('read','읽고 싶은 책 읽기',30)],
    0:[r('soc','사회책 읽기',20),r('hanja','이번 주 한자 쪽지시험',15),r('etc','다음 주 준비물 챙기기',10)],
  };
  const t = HB.today();
  return {
    v:1, name:'', subjects, routine, days:{}, stamps:{},
    homework:[{id:uid(),subj:'eng',title:'영어 학원 숙제 (단어 시험 준비)',due:HB.addDays(t,2),memo:'',done:false,doneAt:'',created:t,
      steps:[{id:uid(),t:'단어 20개 외우기',done:false},{id:uid(),t:'예문 5개 쓰기',done:false},{id:uid(),t:'엄마랑 단어 테스트',done:false}]}],
    lock:{enabled:false,pin:''}, sampleNote:true,
  };
};

/* ---------- 하루 데이터 ---------- */
HB.subj = (S,id) => S.subjects.find(s => s.id === id) || {id, name:'기타', color:'gray'};
HB.chip = (S,id) => { const s = HB.subj(S,id); return `<span class="chip c-${s.color}">${HB.esc(s.name)}</span>`; };
HB.routineItems = (S,k) => ((S.routine[HB.dowOf(k)]) || []).map(i => ({...i, src:'r'}));
HB.rawItems = (S,k) => { const d = S.days[k]; return d ? d.items : HB.routineItems(S,k); };
HB.itemsFor = (S,k) => { const d = S.days[k]; return HB.rawItems(S,k).filter(i => !(d && d.skip && d.skip[i.id])); };
HB.materialize = (S,k) => {
  if (!S.days[k]) S.days[k] = {items:HB.routineItems(S,k), done:{}, memo:{}, skip:{}};
  const d = S.days[k]; d.done ||= {}; d.memo ||= {}; d.skip ||= {};
  return d;
};
HB.isDone = (S,k,id) => !!(S.days[k] && S.days[k].done && S.days[k].done[id]);
HB.dayStats = (S,k) => {
  const items = HB.itemsFor(S,k); let done = 0, left = 0;
  for (const i of items) { if (HB.isDone(S,k,i.id)) done++; else left += (+i.min || 0); }
  return {total:items.length, done, left, pct: items.length ? Math.round(done/items.length*100) : 0};
};
// 루틴이 바뀌면 오늘부터의 날짜에 새 루틴을 적용한다. 체크한 것은 남긴다.
HB.syncRoutine = S => {
  const t = HB.today();
  for (const [k,d] of Object.entries(S.days)) {
    if (k < t) continue;
    d.done ||= {};
    const r = S.routine[HB.dowOf(k)] || [];
    const ids = new Set(r.map(i => i.id));
    d.items = [...r.map(i => ({...i, src:'r'})), ...d.items.filter(it => it.src === 'x' || (!ids.has(it.id) && d.done[it.id]))];
  }
};
HB.hwSteps = h => ({done:h.steps.filter(s => s.done).length, total:h.steps.length});
HB.ddayHtml = (due, base = HB.today()) => {
  const n = HB.diffDays(base, due);
  if (n < 0) return `<span class="dday late">${-n}일 지남</span>`;
  if (n === 0) return `<span class="dday soon">D-day</span>`;
  return `<span class="dday ${n<=1?'soon':''}">D-${n}</span>`;
};

/* ---------- 코드 (카톡으로 보내는 글 속 데이터) ---------- */
const b64u = bytes => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
const unb64u = str => { const s = atob(str.replace(/-/g,'+').replace(/_/g,'/')); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };
async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
HB.encode = async obj => {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  try { if (typeof CompressionStream === 'function') return 'HB1.' + b64u(await pipe(raw, new CompressionStream('deflate-raw'))); } catch (e) {}
  return 'HB0.' + b64u(raw);
};
// 붙여 넣은 글 어디에 있든 코드를 찾아 푼다. 줄바꿈이 끼어도 된다.
HB.decode = async text => {
  const m = String(text || '').replace(/\s+/g,'').match(/HB([01])\.([A-Za-z0-9_-]{8,})/);
  if (!m) throw new Error('nocode');
  let bytes = unb64u(m[2]);
  if (m[1] === '1') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  return JSON.parse(new TextDecoder().decode(bytes));
};

/* 엄마 → 아이: 이름, 과목, 루틴, 최근·앞으로의 날짜 목록, 숙제, 확인 도장 */
HB.momPacket = S => {
  const t = HB.today(), from = HB.addDays(t,-7);
  const days = {};
  for (const [k,d] of Object.entries(S.days)) if (k >= from) days[k] = {items:d.items, skip:d.skip||{}, done:Object.keys(d.done||{}).filter(id => d.done[id])};
  const stamps = {};
  for (const k of Object.keys(S.stamps)) if (S.stamps[k] && k >= HB.addDays(t,-35)) stamps[k] = 1;
  const hwFrom = HB.addDays(t,-14);
  return {k:'mom', v:1, at:new Date().toISOString(), name:S.name, subjects:S.subjects, routine:S.routine, days, stamps,
    homework:S.homework.filter(h => !h.done || (h.doneAt||'') >= hwFrom)};
};
// 아이 기기에 아직 안 보낸 변경이 있는지 볼 지문 (체크 상태는 빼고 계획만)
HB.planPrint = S => {
  const t = HB.today(), days = {};
  for (const [k,d] of Object.entries(S.days)) {
    if (k < t) continue;
    const extra = d.items.filter(i => i.src === 'x').map(i => i.id+i.title), skip = Object.keys(d.skip||{}).filter(id => d.skip[id]);
    if (extra.length || skip.length) days[k] = [extra, skip];
  }
  return HB.hash(JSON.stringify([S.name, S.subjects, S.routine, days, Object.keys(S.stamps).filter(k => S.stamps[k]).sort(),
    S.homework.map(h => [h.id,h.subj,h.title,h.due,h.memo,h.steps.map(s => s.id+s.t)])]));
};
HB.applyMomPacket = (K, p) => {
  K.name = p.name || ''; K.subjects = p.subjects; K.routine = p.routine;
  for (const [k,pd] of Object.entries(p.days || {})) {
    const old = K.days[k];
    const done = {...(old && old.done)}; for (const id of pd.done || []) done[id] = true;
    K.days[k] = {items:pd.items, skip:pd.skip || {}, done, memo:(old && old.memo) || {}};
  }
  HB.syncRoutine(K);
  const mine = new Map((K.homework || []).map(h => [h.id,h]));
  K.homework = (p.homework || []).map(h => {
    const o = mine.get(h.id); if (!o) return h;
    const stepDone = new Set(o.steps.filter(s => s.done).map(s => s.id));
    return {...h, done:h.done || o.done, doneAt:h.doneAt || o.doneAt, steps:h.steps.map(s => ({...s, done:s.done || stepDone.has(s.id)}))};
  });
  K.stamps = {...p.stamps};
  K.momAt = p.at; K.linked = true;
};

/* 아이 → 엄마: 최근 7일 체크·메모, 숙제 상태, 한마디 */
HB.kidPacket = (K, date, note) => {
  const t = HB.today(), days = {};
  for (let i = 0; i < 8; i++) {
    const k = HB.addDays(t,-i), d = K.days[k]; if (!d) continue;
    days[k] = {ids:d.items.map(x => x.id), done:Object.keys(d.done||{}).filter(id => d.done[id]), memo:d.memo || {}};
  }
  const st = HB.dayStats(K, date);
  return {k:'kid', v:1, at:new Date().toISOString(), date, note:note || '', total:st.total, doneN:st.done, days,
    hw:K.homework.map(h => ({id:h.id, done:!!h.done, doneAt:h.doneAt || '', steps:h.steps.filter(s => s.done).map(s => s.id)}))};
};
HB.applyKidPacket = (S, p) => {
  for (const [k,kd] of Object.entries(p.days || {})) {
    const d = HB.materialize(S,k);
    const known = new Set(kd.ids || []), done = new Set(kd.done || []);
    for (const it of d.items) if (known.has(it.id)) { if (done.has(it.id)) d.done[it.id] = true; else delete d.done[it.id]; }
    for (const [id,m] of Object.entries(kd.memo || {})) if (m) d.memo[id] = m;
  }
  for (const kh of p.hw || []) {
    const h = S.homework.find(x => x.id === kh.id); if (!h) continue;
    h.done = kh.done; h.doneAt = kh.doneAt;
    const sd = new Set(kh.steps); h.steps.forEach(s => { s.done = sd.has(s.id); });
  }
  S.kidInbox = [{at:p.at, date:p.date, note:p.note, total:p.total, done:p.doneN}, ...(S.kidInbox || []).filter(x => x.at !== p.at)].slice(0,20);
};

/* 앱 주소 (설치 안내 글에 넣는다) */
HB.PAGES = 'https://gkes1211-hash.github.io/kang/planner/';
HB.base = () => /github\.io$|localhost|127\.0\.0\.1/.test(location.hostname) ? new URL('.', location.href.replace(/\/kid\/[^/]*$/, '/')).href : HB.PAGES;

window.HB = HB;
})();
