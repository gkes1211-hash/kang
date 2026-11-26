#!/usr/bin/env node
// 자동 테스트 (기획서 9번)
// 실행:  node study/math5/tests/run.js     (저장소 맨 위 폴더에서)
//        node tests/run.js                 (study/math5 폴더에서)
// 옵션:  --n 1000   틀마다 만들 문제 수 (기본 1000)
//        --seed 1   무작위 씨앗 (같은 씨앗이면 같은 문제가 나온다)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? Number(args[i + 1]) : def; };
const PER = opt('n', 1000);
const SEED = opt('seed', 20261126);

// index.html에 적힌 순서대로 앱 파일을 불러온다 (화면 파일 app.js만 빼고)
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((f) => f !== 'app.js');
for (const f of files) require(path.join(ROOT, f));
const M5 = globalThis.M5;
const D = M5.dec, G = M5.grade, T = M5.text;

let failCount = 0;
const failures = [];
function fail(where, msg, p) {
  failCount++;
  if (failures.length < 40) failures.push(`  ✗ [${where}] ${msg}${p ? `\n      문제: ${p.text.replace(/\n/g, ' / ')}\n      정답: ${G.answerText(p)}` : ''}`);
}
function check(where, cond, msg, p) { if (!cond) fail(where, msg, p); }

// ---------------------------------------------------------------- 1. 계산 도우미
console.log('1) 소수 계산·어림 도우미 검사');
{
  const cases = [
    ['2731', 'ceil', 2, '2800'], ['2700', 'ceil', 2, '2700'], ['2789', 'floor', 2, '2700'],
    ['2749', 'round', 2, '2700'], ['2750', 'round', 2, '2800'], ['3961', 'ceil', 2, '4000'],
    ['2.347', 'ceil', -1, '2.4'], ['2.347', 'floor', -2, '2.34'], ['2.345', 'round', -2, '2.35'],
    ['0.05', 'ceil', -1, '0.1'], ['9.96', 'round', -1, '10'], ['99999', 'ceil', 3, '100000'],
    ['12.5', 'round', 0, '13'], ['12.49', 'round', 0, '12'], ['4002', 'ceil', 2, '4100'],
  ];
  for (const [x, m, e, want] of cases) check('dec', D.str(D.round(x, m, e)) === want, `${x} ${m} ${e} → ${D.str(D.round(x, m, e))} (기대 ${want})`);
  check('dec', D.eq('0.50', '0.5'), '0.50과 0.5가 같아야 해요');
  check('dec', D.str(D.add('0.1', '0.2')) === '0.3', '0.1 + 0.2 = 0.3');
  check('dec', D.fmt('1234567.25') === '1,234,567.25', '쉼표 넣기');
  check('dec', D.parse('1,200') && D.str(D.parse('1,200')) === '1200', '쉼표 있는 입력');
  check('dec', D.parse('abc') === null && D.parse('') === null && D.parse('.') === null, '숫자가 아닌 입력');
  check('dec', D.digitAt('2749', 1) === 4 && D.digitAt('2.347', -2) === 4, '자리 숫자');
  check('text', T.j('25', '이/가') === '25가' && T.j('30', '이/가') === '30이' && T.j('7', '으로/로') === '7로', '조사 붙이기');
  check('text', T.j('사과', '을/를') === '사과를' && T.j('귤', '을/를') === '귤을' && T.j('5 kg', '은/는') === '5 kg은' && T.j('3 cm', '은/는') === '3 cm는', '조사 붙이기 2');
}

// ---------------------------------------------------------------- 2. 채점
console.log('2) 채점 규칙 검사');
{
  const P = (answer, patterns = []) => ({ answer, patterns, text: '' });
  const num = P({ type: 'num', value: '0.5' }, [{ value: '5', cause: 'calc', msg: '' }]);
  check('grade', G.grade(num, '0.50').ok, '0.50을 0.5와 같게');
  check('grade', G.grade(num, ' 0.5 ').ok, '띄어쓰기 무시');
  check('grade', G.grade(num, '5').pattern, '오답 패턴 찾기');
  check('grade', G.grade(num, '').empty && G.grade(num, '오').invalid, '빈 답·잘못된 입력');
  const nums = P({ type: 'nums', values: ['12', '15', '18'] });
  check('grade', G.grade(nums, '18, 12,15').ok, '여러 개: 순서 상관없이');
  const r1 = G.grade(nums, '12, 15');
  check('grade', !r1.ok && r1.missing === 1 && r1.extra === 0, '여러 개: 빠진 수');
  const r2 = G.grade(nums, '12, 15, 18, 20');
  check('grade', !r2.ok && r2.missing === 0 && r2.extra === 1, '여러 개: 남는 수');
  const pair = P({ type: 'pair', labels: ['a', 'b'], values: ['241', '250'] });
  check('grade', G.grade(pair, ['241', '250']).ok && G.grade(pair, ['250', '241']).swapped, '두 칸: 정답·바뀜');
  const multi = P({ type: 'multi', options: [{}, {}, {}], values: [0, 2] });
  check('grade', G.grade(multi, [2, 0]).ok && !G.grade(multi, [0]).ok, '여러 개 고르기');
}

// ---------------------------------------------------------------- 3. 문제 틀 (틀마다 1000문제)
console.log(`3) 문제 틀 검사 — 틀 ${M5.templates.length}개 × ${PER}문제`);
const rng = M5.rand.seeded(SEED);
const BAD_WORDS = /undefined|NaN|null|\[object|Infinity/;
const rows = [];
const allNumbers = (p) => {
  const a = p.answer;
  const out = [];
  if (a.type === 'num') out.push(a.value);
  if (a.type === 'nums' || a.type === 'pair') out.push(...a.values);
  for (const pt of p.patterns) {
    if (a.type === 'num') out.push(pt.value);
    if (a.type === 'nums' || a.type === 'pair') out.push(...pt.value);
  }
  return out;
};

for (const tpl of M5.templates) {
  const t0 = Date.now();
  const before = failCount;
  const keys = new Set();
  let rejected = 0;
  const [lo, hi] = tpl.levels;
  for (let i = 0; i < PER; i++) {
    const level = lo + (i % (hi - lo + 1));
    let p;
    try { p = M5.makeProblem(tpl, level, rng, null); } catch (e) { fail(tpl.id, '문제를 만들다 오류: ' + e.message); continue; }
    rejected += p.rejected;
    keys.add(p.key);
    const where = `${tpl.id} 난이도${p.level}`;
    const a = p.answer;

    // (1) 정답이 문제 조건을 실제로 만족하는지 — 틀마다 다른 방법으로 다시 확인
    let ok = false;
    try { ok = tpl.verify(p) === true; } catch (e) { fail(where, '검사 중 오류: ' + e.message, p); }
    check(where, ok, '정답이 조건을 만족하지 않아요', p);

    // (2) 정답을 입력하면 맞았다고 채점하는지
    check(where, G.grade(p, G.inputFor(a.type, G.answerValue(a))).ok === true, '정답을 넣었는데 틀렸다고 해요', p);

    // (3) 오답 패턴 값이 정답과 같지 않은지, 넣으면 틀림 + 원인을 찾는지
    for (const pt of p.patterns) {
      check(where, !G.sameValue(a.type, pt.value, G.answerValue(a)), '오답 패턴 값이 정답과 같아요', p);
      const res = G.grade(p, G.inputFor(a.type, pt.value));
      check(where, res.ok === false && !!res.pattern, `오답 패턴(${pt.msg.slice(0, 20)}…)을 넣었는데 원인을 못 찾아요`, p);
      check(where, ['concept', 'calc', 'condition', 'form'].includes(pt.cause) && pt.msg, '오답 원인 분류·설명이 없어요', p);
    }

    // (4) 객관식 선택지가 겹치지 않는지, 정답이 하나인지, 오답 보기에 설명이 있는지
    if (a.type === 'choice' || a.type === 'multi') {
      const texts = a.options.map((o) => (o.figure ? JSON.stringify(o.figure) : o.text));
      check(where, new Set(texts).size === texts.length, '선택지가 겹쳐요', p);
      check(where, a.options.length >= 3, '선택지가 너무 적어요', p);
      if (a.type === 'choice') {
        a.options.forEach((o, k) => {
          if (k === a.value) return;
          check(where, G.grade(p, k).ok === false, '틀린 보기를 맞았다고 해요', p);
          check(where, !!(o.pattern && o.pattern.msg), '틀린 보기에 이유 설명이 없어요', p);
        });
      }
    }
    if (a.type === 'ox') check(where, G.grade(p, !a.value).ok === false, 'O/X 반대가 맞았다고 해요', p);

    // (5) 5학년 수준: 음수 없음, 소수는 셋째 자리까지, 너무 큰 수 없음
    for (const v of allNumbers(p)) {
      const d = D.parse(v);
      check(where, !!d, `수가 아닌 값: ${v}`, p);
      if (!d) continue;
      check(where, d.n >= 0, `음수가 나왔어요: ${v}`, p);
      check(where, d.s <= 3, `소수 자리가 너무 길어요: ${v}`, p);
      check(where, D.cmp(d, 10000000) <= 0, `수가 너무 커요: ${v}`, p);
    }
    if (a.type === 'num' || a.type === 'pair') {
      for (const v of a.type === 'num' ? [a.value] : a.values) check(where, D.cmp(v, 0) > 0, `정답이 0 이하예요: ${v}`, p);
    }

    // (6) 문장·힌트·풀이가 제대로 있는지
    const allText = [p.text, ...(p.hints || []), ...(p.solution || []), ...((a.options || []).map((o) => o.text || ''))].join(' ');
    check(where, !BAD_WORDS.test(allText), '문장에 이상한 글자(undefined 등)가 있어요', p);
    check(where, Array.isArray(p.hints) && p.hints.length === 3 && p.hints.every((h) => typeof h === 'string' && h.length > 5), '힌트가 3단계가 아니에요', p);
    check(where, Array.isArray(p.solution) && p.solution.length > 0, '풀이가 없어요', p);
    check(where, !!M5.findSub(p.sub) && !!M5.findSub(p.sub).sub.concept, '개념 설명이 없어요', p);

    // (7) 그림이 오류 없이 그려지는지
    try {
      M5.figure.render(p.figure);
      for (const o of a.options || []) if (o.figure) M5.figure.render(o.figure);
    } catch (e) { fail(where, '그림 오류: ' + e.message, p); }
  }
  rows.push({ id: tpl.id, sub: tpl.sub, n: PER, kinds: keys.size, rej: rejected / PER, bad: failCount - before, ms: Date.now() - t0 });
}

// ---------------------------------------------------------------- 4. 무한 모드
console.log('4) 무한 모드 검사 (문제 3000개씩 흉내 내기)');
const engineRows = [];
{
  const scopes = [{ unit: 1 }, ...M5.units[0].subs.map((s) => ({ unit: 1, sub: s.id }))];
  for (const scope of scopes) {
    const state = M5.store.fresh();
    const sess = M5.createSession({ scope, state, rng });
    let a = 0, repeat = 0, triple = 0, levelBad = 0;
    const subs = {};
    const hist = [];
    let okRun = 0, badRun = 0;
    for (let i = 0; i < 3000; i++) {
      const before = sess.level;
      const recentKeys = new Set(state.recent.map((x) => x.key));
      const p = sess.next();
      if (recentKeys.has(p.key)) repeat++;
      hist.push(p.styleName);
      if (hist.length >= 3 && hist.slice(-3).every((s) => s === p.styleName)) triple++;
      if (p.style === 'A') a++;
      subs[p.sub] = (subs[p.sub] || 0) + 1;
      // 난이도 규칙: 3번 연속 맞히면 한 단계 위, 2번 연속 틀리면 한 단계 아래
      const correct = rng.chance(0.65);
      const ch = sess.record(correct);
      if (correct) { okRun++; badRun = 0; } else { badRun++; okRun = 0; }
      let want = 0;
      if (okRun === 3) { okRun = 0; if (before < 4) want = 1; }
      if (badRun === 2) { badRun = 0; if (before > 1) want = -1; }
      if (ch !== want || sess.level !== before + want) levelBad++;
    }
    const name = scope.sub ? M5.findSub(scope.sub).sub.name : '1단원 전체 섞기';
    check('무한 모드 ' + name, triple === 0, `같은 스타일이 3번 연속 ${triple}번 나왔어요`);
    check('무한 모드 ' + name, levelBad === 0, `난이도 조절이 규칙과 달라요 (${levelBad}번)`);
    check('무한 모드 ' + name, repeat / 3000 < 0.01, `최근 50문제와 같은 문제가 ${repeat}번 나왔어요`);
    const ratioA = a / 3000;
    check('무한 모드 ' + name, ratioA > 0.5 && ratioA < 0.72, `문제집 형식 비율이 ${Math.round(ratioA * 100)}%예요`);
    if (!scope.sub) check('무한 모드 ' + name, Object.keys(subs).length === 7 && Math.min(...Object.values(subs)) > 250, '소단원이 골고루 섞이지 않아요');
    engineRows.push({ name, ratioA, repeat, triple, levelBad, subs });
  }
}

// ---------------------------------------------------------------- 5. 비슷한 문제 도전
console.log('5) 비슷한 문제 5개 검사 (틀마다 원인별로 40세트)');
const simRows = { sets: 0, sibling: 0, dupSets: 0 };
for (const tpl of M5.templates) {
  for (let i = 0; i < 40; i++) {
    const level = tpl.levels[0] + (i % (tpl.levels[1] - tpl.levels[0] + 1));
    const orig = M5.makeProblem(tpl, level, rng, null);
    // 실제로 틀렸을 때 나올 수 있는 원인 (패턴이 없으면 null)
    const causes = [...new Set([...orig.patterns.map((x) => x.cause), ...(orig.answer.options || []).filter((o) => o.pattern).map((o) => o.pattern.cause)])];
    const cause = i % 3 === 0 || !causes.length ? null : causes[i % causes.length];
    const set = M5.similarProblems(orig, cause, rng, []);
    const where = `${tpl.id} 비슷한 문제`;
    simRows.sets++;
    check(where, set.length === 5, `5개가 아니에요 (${set.length}개)`);
    const keys = new Set(set.map((q) => q.key));
    if (keys.size !== 5 || keys.has(orig.key)) simRows.dupSets++;
    for (const q of set) {
      check(where, q.sub === orig.sub, '다른 소단원 문제가 섞였어요', q);
      check(where, q.level === Math.max(M5.templates.find((t) => t.id === q.tid).levels[0], Math.min(orig.level, M5.templates.find((t) => t.id === q.tid).levels[1])), '난이도가 달라요', q);
      if (q.tid !== orig.tid) {
        simRows.sibling++;
        check(where, !!cause && M5.hasCause(q, cause), '다른 틀인데 같은 원인의 오답 패턴이 없어요', q);
      }
      check(where, M5.templates.find((t) => t.id === q.tid).verify(q) === true, '정답이 조건을 만족하지 않아요', q);
    }
    check(where, set.filter((q) => q.tid === orig.tid).length >= 3, '같은 틀 문제가 3개보다 적어요');
  }
}
// 문제 종류가 아주 적은 틀(예: 수직선 한쪽)은 가끔 같은 문제가 겹칠 수 있다. 전체의 2% 아래면 통과.
check('비슷한 문제', simRows.dupSets / simRows.sets < 0.02, `같은 문제가 겹친 세트가 ${simRows.dupSets}개예요`);

// ---------------------------------------------------------------- 결과
console.log('\n================ 결과 ================');
const subName = (id) => M5.findSub(id).sub.name;
let lastSub = '';
for (const r of rows) {
  if (r.sub !== lastSub) { console.log(`\n[${subName(r.sub)}]`); lastSub = r.sub; }
  console.log(`  ${r.bad ? '✗' : '✓'} ${r.id.padEnd(22)} ${String(r.n).padStart(5)}문제  서로 다른 문제 ${String(r.kinds).padStart(4)}개  버리고 다시 만든 비율 ${(r.rej * 100).toFixed(0).padStart(3)}%${r.bad ? `  문제 ${r.bad}건` : ''}`);
}
console.log('\n[무한 모드]');
for (const e of engineRows) {
  console.log(`  ${e.triple || e.levelBad ? '✗' : '✓'} ${e.name.padEnd(28)} 문제집 형식 ${Math.round(e.ratioA * 100)}%  최근 문제 반복 ${e.repeat}번  같은 스타일 3연속 ${e.triple}번  난이도 규칙 어김 ${e.levelBad}번`);
}
console.log(`\n[비슷한 문제 도전]\n  ${simRows.dupSets / simRows.sets < 0.02 ? '✓' : '✗'} ${simRows.sets}세트 × 5문제, 같은 원인의 다른 틀에서 가져온 문제 ${simRows.sibling}개, 겹친 문제가 있던 세트 ${simRows.dupSets}개`);
const subCount = {};
for (const t of M5.templates) subCount[t.sub] = (subCount[t.sub] || 0) + 1;
console.log('\n[소단원별 문제 틀 수]');
for (const s of M5.units[0].subs) {
  const c = subCount[s.id] || 0;
  check('틀 수', c >= 8, `${s.name} 소단원의 틀이 ${c}개예요 (8개 이상 필요)`);
  console.log(`  ${c >= 8 ? '✓' : '✗'} ${s.name}: ${c}개`);
}

const total = rows.reduce((s, r) => s + r.n, 0);
console.log(`\n문제 틀 ${M5.templates.length}개, 만든 문제 ${total.toLocaleString()}개`);
if (failCount) {
  console.log(`\n✗ 실패 ${failCount}건\n${failures.join('\n')}`);
  process.exit(1);
} else {
  console.log('✓ 모든 검사 통과');
}
