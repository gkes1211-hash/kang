// 역사 탐험대 데이터 확인:  node study/history/tests/run.js
// 이야기·인물·사건을 더한 뒤 돌려서 빠진 칸이나 실수가 없는지 봐요.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { window: {} };
ctx.H = undefined;
vm.createContext(ctx);
for (const f of ['eras', 'people', 'facts', 'events', 'stories', 'adventures', 'adventures-2', 'adventures-3', 'adventures-4', 'words', 'rulers']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', `${f}.js`), 'utf8').replace('window.H = window.H || {};', 'var H = window.H = window.H || {};'), ctx, { filename: `data/${f}.js` });
}
const H = ctx.window.H;
let bad = 0;
const check = (where, ok, msg) => { if (!ok) { bad++; console.log(`✗ [${where}] ${msg}`); } };
const uniq = (list, where) => { const seen = new Set(); for (const x of list) { check(where, !seen.has(x.id), `id "${x.id}" 가 두 번 있어요`); seen.add(x.id); } };
const eraIds = new Set(H.eras.map((e) => e.id));
const filled = (s) => typeof s === 'string' && s.trim().length > 0;

// 시대
uniq(H.eras, '시대');
for (const e of H.eras) for (const k of ['name', 'emoji', 'color', 'span', 'one']) check(`시대 ${e.id}`, filled(e[k]), `${k} 가 비었어요`);

// 인물
uniq(H.people, '인물');
for (const p of H.people) {
  const w = `인물 ${p.id}`;
  check(w, eraIds.has(p.era), `era "${p.era}" 가 eras.js 에 없어요`);
  for (const k of ['name', 'emoji', 'about']) check(w, filled(p[k]), `${k} 가 비었어요`);
  check(w, Array.isArray(p.hints) && p.hints.length === 4, '힌트는 4개여야 해요');
  const core = p.name.replace(/(대왕|여왕|왕검|왕)$/, '');
  for (const h of p.hints || []) check(w, !h.includes(core), `힌트에 이름("${core}")이 들어 있어요: ${h}`);
}
check('인물', H.people.length >= 4, '보기 4개를 만들려면 인물이 4명 이상 있어야 해요');
// 인물 카드의 업적 정리 (data/facts.js)
for (const p of H.people) {
  const f = (H.facts || {})[p.id];
  check(`업적 ${p.id}`, f && filled(f.when) && Array.isArray(f.items) && f.items.length === 4 && f.items.every(filled), '업적 정리(when, items 4줄)가 있어야 해요');
}
for (const id of Object.keys(H.facts || {})) check('업적', H.people.some((p) => p.id === id), `facts.js 의 "${id}" 는 people.js 에 없는 인물이에요`);

// 사건
uniq(H.events, '사건');
const years = new Map();
for (const v of H.events) {
  const w = `사건 ${v.id}`;
  check(w, eraIds.has(v.era), `era "${v.era}" 가 eras.js 에 없어요`);
  check(w, Number.isInteger(v.year), 'year 는 정수여야 해요 (기원전은 음수)');
  for (const k of ['when', 'emoji', 'title', 'why']) check(w, filled(v[k]), `${k} 가 비었어요`);
  // 연표 기차는 해로 순서를 정하니, 같은 해가 둘이면 정답이 둘이 돼요
  check(w, !years.has(v.year), `${v.year}년 사건이 이미 있어요 (${years.get(v.year)})`);
  years.set(v.year, v.id);
}
// 사건의 시대 순서가 시대 열차 순서와 맞는지
const order = Object.fromEntries(H.eras.map((e, i) => [e.id, i]));
const sorted = H.events.slice().sort((a, b) => a.year - b.year);
for (let i = 1; i < sorted.length; i++) {
  check('사건 순서', order[sorted[i].era] >= order[sorted[i - 1].era], `${sorted[i - 1].id}(${sorted[i - 1].era}) 다음에 ${sorted[i].id}(${sorted[i].era}) 가 와요. 시대가 거꾸로예요`);
}
// 모든 시대에 사건이 있어야 연표 기차 2단계가 돼요 / 이웃한 두 시대 사건이 4개 이상이어야 4단계가 돼요
for (const e of H.eras) check(`시대 ${e.id}`, H.events.some((v) => v.era === e.id), '이 시대 사건이 하나도 없어요');
for (let i = 0; i + 1 < H.eras.length; i++) {
  const n = H.events.filter((v) => order[v.era] === i || order[v.era] === i + 1).length;
  check('연표 기차 4단계', n >= 4, `${H.eras[i].name}+${H.eras[i + 1].name} 사건이 ${n}개뿐이에요 (4개 이상 필요)`);
}

// 이야기
uniq(H.stories, '이야기');
for (const s of H.stories) {
  const w = `이야기 ${s.id}`;
  check(w, eraIds.has(s.era), `era "${s.era}" 가 eras.js 에 없어요`);
  for (const k of ['emoji', 'title', 'hook', 'think']) check(w, filled(s[k]), `${k} 가 비었어요`);
  check(w, Array.isArray(s.paras) && s.paras.length >= 2 && s.paras.every(filled), '문단(paras)이 2개 이상 있어야 해요');
  if (s.person) check(w, H.people.some((p) => p.id === s.person), `person "${s.person}" 가 people.js 에 없어요`);
  const q = s.quiz || {};
  check(w, filled(q.q) && filled(q.why), '퀴즈 질문(q)과 설명(why)이 있어야 해요');
  check(w, Array.isArray(q.choices) && q.choices.length >= 2 && new Set(q.choices).size === q.choices.length, '퀴즈 보기가 2개 이상이고 서로 달라야 해요');
  check(w, Number.isInteger(q.answer) && q.answer >= 0 && q.answer < (q.choices || []).length, '퀴즈 answer 번호가 보기 범위 밖이에요');
}

// 모험 편
uniq(H.adventures, '모험');
const BGS = new Set(['land', 'camp', 'river', 'castle', 'night', 'sea', 'cave']);
for (const A of H.adventures) {
  const w = `모험 ${A.id}`;
  check(w, eraIds.has(A.era), `era "${A.era}" 가 eras.js 에 없어요`);
  if (A.person) check(w, H.people.some((p) => p.id === A.person), `person "${A.person}" 가 people.js 에 없어요`);
  else check(w, A.treasure && filled(A.treasure.emoji) && filled(A.treasure.name) && filled(A.treasure.when) && Array.isArray(A.treasure.facts) && A.treasure.facts.length === 4, '인물(person)이 없으면 보물 카드(treasure: emoji, name, when, facts 4줄)가 있어야 해요');
  for (const k of ['emoji', 'title', 'hook', 'think']) check(w, filled(A[k]), `${k} 가 비었어요`);
  const c = A.card || {};
  for (const k of ['title', 'when', 'who', 'how']) check(w, filled(c[k]), `진짜 역사 카드의 ${k} 가 비었어요`);
  check(w, Number.isInteger(A.year), 'year(정수)가 있어야 순서대로 놓여요');
  check(w, H.events.some((v) => v.id === A.event), `event "${A.event}" 가 events.js 에 없어요 (연표에 놓기 단계에 필요)`);
  check(w, Array.isArray(c.words) && c.words.length >= 3, '카드의 핵심 단어(words)는 3개 이상');
  check(w, Array.isArray(A.scenes) && A.scenes.length >= 3, '장면이 3개 이상 있어야 해요');
  (A.scenes || []).forEach((sc, k) => {
    const ws = `${w} 장면 ${k + 1}`;
    check(ws, ['talk', 'choice', 'repeat', 'timing', 'match'].includes(sc.type), `type "${sc.type}" 을 몰라요`);
    check(ws, sc.who === 'me' || (A.cast && A.cast[sc.who]), `말하는 사람 "${sc.who}" 가 cast 에 없어요`);
    check(ws, filled(sc.say), '말풍선(say)이 비었어요');
    // 말풍선은 짧게: 아이가 읽기 부담 없도록 (이름 자리 {name} 은 빼고 셈)
    check(ws, (sc.say || '').replace('{name}', '').length <= 70, `말풍선이 너무 길어요 (${(sc.say || '').length}자, 70자까지)`);
    check(ws, sc.stage && BGS.has(sc.stage.bg) && Array.isArray(sc.stage.sprites), 'stage 의 bg 나 sprites 가 이상해요');
    if (sc.type === 'choice') {
      const os = sc.options || [];
      check(ws, os.length >= 2, '보기는 2개 이상');
      check(ws, os.filter((o) => o.ok).length === 1, '정답 보기(ok)는 딱 1개여야 해요');
      for (const o of os) {
        check(ws, filled(o.e) && filled(o.t), '보기에 그림(e)과 글(t)이 있어야 해요');
        if (!o.ok) check(ws, filled(o.fb), `틀린 보기 "${o.t}" 에 다시 생각할 힌트(fb)가 없어요`);
      }
      check(ws, filled(sc.after), '맞힌 뒤 한마디(after)가 없어요');
    }
    if (sc.type === 'repeat') {
      check(ws, Number.isInteger(sc.times) && sc.times > 1 && filled(sc.done) && filled(sc.button), 'times(2 이상), button, done 이 있어야 해요');
      for (const v of sc.movers || []) check(ws, filled(v.e) && Array.isArray(v.x) && v.x.length === 2 && typeof v.y === 'number', `mover "${v.e}" 의 x:[시작,끝], y 를 확인해요`);
      if (sc.meter) check(ws, filled(sc.meter.label) && typeof sc.meter.from === 'number' && typeof sc.meter.to === 'number', 'meter 에 label, from, to 가 있어야 해요');
    }
    if (sc.type === 'timing') {
      const z = sc.zone || {};
      check(ws, filled(sc.hit) && sc.mover && filled(sc.mover.e), 'hit 와 mover 가 있어야 해요');
      check(ws, ['river', 'band'].includes(z.kind) && z.from >= 0 && z.to <= 100 && z.to - z.from >= 16, 'zone 은 river/band, 폭 16% 이상이어야 맞히기 쉬워요');
    }
    if (sc.type === 'match') {
      const ps = sc.pairs || [];
      check(ws, ps.length >= 2 && ps.length <= 6 && filled(sc.done), '짝은 2~6개, done 이 있어야 해요');
      check(ws, new Set(ps.map((x) => x.a)).size === ps.length && new Set(ps.map((x) => x.b)).size === ps.length, '짝 카드 글이 서로 달라야 해요');
      for (const x of ps) check(ws, filled(x.a) && filled(x.b) && x.b.length <= 40, `짝 "${x.a}" 의 글이 비었거나 너무 길어요 (40자까지)`);
    }
    if (sc.type === 'timing') check(ws, filled(sc.hint), 'hint 가 있어야 해요');
  });
  check(w, Array.isArray(A.review) && A.review.length >= 2, '기억 퀴즈(review)는 2개 이상');
  for (const q of A.review || []) {
    check(w, filled(q.q) && filled(q.why) && Array.isArray(q.choices) && q.answer >= 0 && q.answer < q.choices.length, `기억 퀴즈 "${q.q}" 가 이상해요`);
  }
}

// 낱말 사전
const W = H.words || {};
const allText = [];
for (const p of H.people) allText.push(...p.hints, p.about);
for (const st of H.stories) allText.push(...st.paras, st.think, st.quiz.why);
for (const v of H.events) allText.push(v.title, v.why);
for (const e of H.eras) allText.push(e.one);
for (const A of H.adventures) {
  for (const sc of A.scenes) { allText.push(sc.say, sc.after || '', sc.done || ''); for (const o of sc.options || []) allText.push(o.fb || ''); }
  allText.push(A.card.how); for (const q of A.review) allText.push(q.why);
}
const joined = allText.join('\n');
const unused = [];
for (const [w, m] of Object.entries(W)) {
  check('낱말', w.length >= 2, `"${w}" 는 너무 짧아요 (2글자 이상, 다른 말 속에 섞여 잘못 잡혀요)`);
  check('낱말', filled(m) && m.length <= 90, `"${w}" 의 뜻이 비었거나 너무 길어요 (${(m || '').length}자, 90자까지)`);
  // 뜻에 인물 이름이 있으면 "나는 누구일까요?" 힌트에서 정답이 보여요
  for (const p of H.people) check('낱말', !m.includes(p.name.replace(/(대왕|여왕|왕검)$/, '')), `"${w}" 의 뜻에 인물 이름 "${p.name}" 이 들어 있어요 (퀴즈 정답이 보여요)`);
  if (!joined.includes(w)) unused.push(w);
}
// 다른 말 속에 섞여 잘못 잡히는 낱말이 없게: 낱말 앞뒤가 흔한 말의 일부인 경우를 몇 가지 확인
for (const bad of ['이어진', '떨어진', '만들어진']) check('낱말', !Object.keys(W).some((w) => bad.includes(w) && w.length < bad.length), `"${bad}" 안에 사전 낱말이 잘못 잡혀요`);
console.log(`낱말 사전 ${Object.keys(W).length}개 (글에 나오는 것 ${Object.keys(W).length - unused.length}개${unused.length ? `, 아직 글에 없는 것: ${unused.join(', ')}` : ''})`);

// 왕 카드 판 (data/rulers.js)
for (const [era, R] of Object.entries(H.rulers || {})) {
  const w = `왕 ${era}`;
  check(w, eraIds.has(era), `시대 "${era}" 가 eras.js 에 없어요`);
  check(w, ['kings', 'presidents'].includes(R.kind), 'kind 는 kings 나 presidents');
  const list = R.groups.flatMap((g) => g.list);
  check(w, list.length === R.list.length && list.length > 0, '왕 목록이 비었어요');
  for (const g of R.groups) check(w, filled(g.name) && filled(g.color) && filled(g.note), `묶음 "${g.name}" 의 name, color, note 를 확인해요`);
  if (R.kind === 'presidents') { for (const p of list) check(w, filled(p.name) && filled(p.no), '대통령 이름이 비었어요'); continue; }
  for (const k of list) {
    const wk = `${w} ${k.no} ${k.name}`;
    check(wk, filled(k.no) && filled(k.name) && filled(k.em) && filled(k.line) && filled(k.years), 'no, name, em, line, years 가 있어야 해요');
    check(wk, (k.line || '').length <= 18, `카드 한 줄이 너무 길어요 (${(k.line || '').length}자, 18자까지)`);
    if (k.person) check(wk, H.people.some((p) => p.id === k.person), `person "${k.person}" 가 people.js 에 없어요`);
    if (k.adv) check(wk, H.adventures.some((a) => a.id === k.adv), `adv "${k.adv}" 가 모험에 없어요`);
  }
  // 앞 글자 묶음은 왕 이름 첫 글자와 하나씩 맞아야 해요
  if (R.rhyme) {
    const letters = [...R.rhyme.join('')];
    check(w, letters.length === list.length, `앞 글자 ${letters.length}개 ≠ 왕 ${list.length}명`);
    letters.forEach((ch, i) => { if (list[i]) check(w, list[i].name[0] === ch, `앞 글자 ${i + 1}번째 "${ch}" ≠ ${list[i].no} ${list[i].name}`); });
  }
}
check('왕', H.rulers.joseon && H.rulers.joseon.list.length === 27, '조선 왕은 27명이에요');
check('왕', H.rulers.goryeo && H.rulers.goryeo.list.length === 34, '고려 왕은 34명이에요');

// 인터넷 없이 열기 (sw.js 가 모든 파일을 담는지)
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  check('sw.js', sw.includes(`'./${m[1]}'`), `sw.js 의 FILES 에 ${m[1]} 가 빠졌어요`);
  check('index.html', fs.existsSync(path.join(ROOT, m[1])), `${m[1]} 파일이 없어요`);
}
for (const m of sw.matchAll(/'\.\/([^']+)'/g)) check('sw.js', fs.existsSync(path.join(ROOT, m[1])), `sw.js 에 적힌 ${m[1]} 파일이 없어요`);

console.log(`시대 ${H.eras.length} · 인물 ${H.people.length} · 사건 ${H.events.length} · 이야기 ${H.stories.length} · 모험 ${H.adventures.length}`);
if (bad) { console.log(`\n✗ ${bad}개 고쳐야 해요`); process.exit(1); }
console.log('✓ 모두 괜찮아요');
