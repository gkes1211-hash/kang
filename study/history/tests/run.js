// 역사 탐험대 데이터 확인:  node study/history/tests/run.js
// 이야기·인물·사건을 더한 뒤 돌려서 빠진 칸이나 실수가 없는지 봐요.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { window: {} };
ctx.H = undefined;
vm.createContext(ctx);
for (const f of ['eras', 'people', 'events', 'stories']) {
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

// 인터넷 없이 열기 (sw.js 가 모든 파일을 담는지)
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  check('sw.js', sw.includes(`'./${m[1]}'`), `sw.js 의 FILES 에 ${m[1]} 가 빠졌어요`);
  check('index.html', fs.existsSync(path.join(ROOT, m[1])), `${m[1]} 파일이 없어요`);
}
for (const m of sw.matchAll(/'\.\/([^']+)'/g)) check('sw.js', fs.existsSync(path.join(ROOT, m[1])), `sw.js 에 적힌 ${m[1]} 파일이 없어요`);

console.log(`시대 ${H.eras.length} · 인물 ${H.people.length} · 사건 ${H.events.length} · 이야기 ${H.stories.length}`);
if (bad) { console.log(`\n✗ ${bad}개 고쳐야 해요`); process.exit(1); }
console.log('✓ 모두 괜찮아요');
