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
const D = M5.dec, G = M5.grade, T = M5.text, Fr = M5.frac;

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
  // 분수: 정수로만 계산
  check('frac', Fr.key(Fr.mul('2/3', '3/4')) === '1/2' && Fr.key(Fr.mul('1 1/2', '2 1/3')) === '7/2', '분수 곱셈');
  check('frac', Fr.key(Fr.add('1/3', '1/6')) === '1/2' && Fr.key(Fr.sub(1, '1/4')) === '3/4', '분수 덧셈·뺄셈');
  check('frac', Fr.str('7/3') === '2 1/3' && Fr.mk('7/3') === '⟪2 1/3⟫' && Fr.mk('6/3') === '2', '대분수로 나타내기');
  check('frac', Fr.eq('2/4', '1/2') && Fr.cmp('1/12', '1/3') < 0, '분수 비교 (단위분수: 분모가 클수록 작다)');
  check('text', T.j('⟪2/3⟫', '을/를') === '⟪2/3⟫를' && T.j('⟪1 3/4⟫', '이/가') === '⟪1 3/4⟫이', '분수 뒤 조사 (분자로 읽어요)');
  check('text', T.plain('⟪1 2/3⟫ × 4') === '1 2/3 × 4' && T.html('⟪2/3⟫').includes('class="fr"'), '분수 표시');
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
  const fr = P({ type: 'frac', value: '7/3' }, [{ value: '2', cause: 'concept', msg: '' }]);
  check('grade', G.grade(fr, { w: '2', n: '1', d: '3' }).ok, '분수: 대분수 정답');
  check('grade', G.grade(fr, { w: '2', n: '2', d: '6' }).form === 'reduce', '분수: 약분 안 함 → 틀림이 아니라 약분 안내');
  check('grade', G.grade(fr, { w: '', n: '7', d: '3' }).form === 'improper', '분수: 가분수 → 대분수 안내');
  check('grade', G.grade(fr, { w: '2', n: '', d: '' }).pattern, '분수: 오답 패턴 찾기');
  check('grade', G.grade(fr, { w: '', n: '3', d: '' }).invalid && G.grade(fr, { w: '', n: '1', d: '0' }).invalid, '분수: 잘못된 입력');
  const frInt = P({ type: 'frac', value: '4' });
  check('grade', G.grade(frInt, { w: '4', n: '', d: '' }).ok && G.grade(frInt, { w: '', n: '8', d: '2' }).form === 'reduce', '분수: 자연수 답');
  const multi = P({ type: 'multi', options: [{}, {}, {}], values: [0, 2] });
  check('grade', G.grade(multi, [2, 0]).ok && !G.grade(multi, [0]).ok, '여러 개 고르기');
}

// ---------------------------------------------------------------- 2-2. 오늘의 복습·기록 저장
console.log('2-2) 오늘의 복습(1일·7일·30일)과 백업 검사');
{
  const R = M5.review, S = M5.store;
  check('review', R.addDays('2026-11-26', 7) === '2026-12-03' && R.addDays('2026-12-30', 30) === '2027-01-29' && R.addDays('2027-02-28', 1) === '2027-03-01', '날짜 더하기');
  const st = S.fresh();
  const p = { tid: 'u1s4-basic', unit: 1, sub: 'u1s4', level: 2 };
  R.markWrong(st, p, '2026-11-26');
  check('review', R.dueList(st, '2026-11-26').length === 0 && R.dueList(st, '2026-11-27').length === 1, '틀린 다음 날 복습');
  let r = R.answered(st, p.tid, true, '2026-11-27');
  check('review', r.next === '2026-12-03' && !r.mastered, '1일 복습을 맞히면 틀린 날로부터 7일 뒤');
  check('review', R.dueList(st, '2026-12-02').length === 0 && R.dueList(st, '2026-12-03').length === 1, '7일 복습 날짜');
  r = R.answered(st, p.tid, true, '2026-12-05'); // 이틀 늦게 복습
  check('review', r.next === '2026-12-26' && !r.mastered, '7일 복습을 맞히면 틀린 날로부터 30일 뒤');
  r = R.answered(st, p.tid, true, '2026-12-26');
  check('review', r.mastered && !st.review[p.tid] && st.mastered[p.tid] === '2026-12-26', '3번 연속 맞히면 완전히 익힘');
  R.markWrong(st, p, '2027-01-10');
  check('review', !st.mastered[p.tid] && st.review[p.tid].due === '2027-01-11', '익힌 유형을 다시 틀리면 다시 복습');
  r = R.answered(st, p.tid, true, '2027-01-11');
  r = R.answered(st, p.tid, false, '2027-01-17');
  check('review', r.next === '2027-01-18' && st.review[p.tid].stage === 0 && st.review[p.tid].wrongDate === '2027-01-17', '복습에서 틀리면 그날부터 다시 1일');
  // 늦게 복습해도 다음 복습은 적어도 내일
  const q = { tid: 'u2s1-basic', unit: 2, sub: 'u2s1', level: 1 };
  R.markWrong(st, q, '2026-01-01');
  r = R.answered(st, q.tid, true, '2026-03-01');
  check('review', r.next === '2026-03-02', '아주 늦게 복습하면 다음 복습은 다음 날');

  // 백업 내보내기 → 불러오기
  st.stats.u1 = { s: 12, c: 9 };
  st.days['2026-11-26'] = { s: 12, c: 9, p: 1 };
  const back = S.importText(S.exportText(st));
  check('backup', JSON.stringify(back.state.review) === JSON.stringify(st.review) && back.state.stats.u1.s === 12 && back.state.days['2026-11-26'].c === 9, '백업 내보내고 불러오면 그대로');
  check('backup', S.summary(back.state).solved === 12, '백업 요약');
  let bad = 0;
  for (const txt of ['{', '{"app":"other","state":{}}', '[]', '{"app":"math5","state":{"v":2}}']) { try { S.importText(txt); } catch (e) { bad++; } }
  check('backup', bad === 4, '잘못된 백업 파일은 거절');
  // 예전 형식 기록(복습 칸이 없던 때)도 새 형식으로 채워지는지
  const old = S.normalize({ v: 1, stats: { u1: { s: 3, c: 1 } }, today: { date: '2026-01-01', solved: 3 } });
  check('backup', old.review && old.mastered && old.days && old.settings.mode === 'endless' && old.stats.u1.s === 3, '예전 기록 불러오기');
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
      check(where, d.s <= (tpl.unit === 4 ? 4 : 3), `소수 자리가 너무 길어요: ${v}`, p);
      check(where, D.cmp(d, 10000000) <= 0, `수가 너무 커요: ${v}`, p);
    }
    if (a.type === 'num' || a.type === 'pair') {
      for (const v of a.type === 'num' ? [a.value] : a.values) check(where, D.cmp(v, 0) > 0, `정답이 0 이하예요: ${v}`, p);
    }
    if (a.type === 'frac') {
      // 분수 답: 기약분수, 0보다 크고, 분모가 지나치게 크지 않은지 (기획서 9번)
      for (const v of [a.value, ...p.patterns.map((x) => x.value)]) {
        const f = Fr.parse(v);
        check(where, !!f && f.n > 0, `분수가 아니거나 0 이하예요: ${v}`, p);
        if (f) check(where, Fr.key(f) === String(v), `기약분수로 저장되지 않았어요: ${v}`, p);
      }
      const f = Fr.parse(a.value);
      check(where, f.d <= 100, `분모가 너무 커요: ${a.value}`, p);
      check(where, f.n / f.d < 500, `답이 너무 커요: ${a.value}`, p);
      // 값은 맞지만 약분하지 않거나 가분수로 쓰면 '틀림'이 아니라 안내 (기획서 8번)
      const pp = Fr.parts(f);
      if (pp.n) {
        check(where, G.grade(p, { w: pp.w ? String(pp.w) : '', n: String(pp.n * 2), d: String(pp.d * 2) }).form === 'reduce', '약분하지 않은 답을 약분 안내로 처리하지 않아요', p);
        if (pp.w) check(where, G.grade(p, { w: '', n: String(f.n), d: String(f.d) }).form === 'improper', '가분수 답을 대분수 안내로 처리하지 않아요', p);
      } else {
        check(where, G.grade(p, { w: '', n: String(pp.w * 3), d: '3' }).form === 'reduce', '자연수 답을 분수로 쓰면 약분 안내가 나와야 해요', p);
      }
    }

    // (6) 문장·힌트·풀이가 제대로 있는지
    const allText = [p.text, ...(p.hints || []), ...(p.solution || []), ...((a.options || []).map((o) => o.text || ''))].join(' ');
    check(where, !BAD_WORDS.test(allText), '문장에 이상한 글자(undefined 등)가 있어요', p);
    check(where, !/[⟪⟫]/.test(T.plain(allText)), '분수 표시가 깨졌어요', p);
    check(where, !/[가-힣]\(이\)|을\(를\)|이\/가|을\/를/.test(allText), '조사가 정리되지 않았어요', p);
    if (p.essay) check(where, Array.isArray(p.essay.checklist) && p.essay.checklist.length >= 2 && p.essay.checklist.every((c) => c.q && c.concept), '서술형 체크리스트가 없어요', p);
    check(where, Array.isArray(p.hints) && p.hints.length === 3 && p.hints.every((h) => typeof h === 'string' && h.length > 5), '힌트가 3단계가 아니에요', p);
    check(where, Array.isArray(p.solution) && p.solution.length > 0, '풀이가 없어요', p);
    check(where, !!M5.findSub(p.sub) && !!M5.findSub(p.sub).sub.concept, '개념 설명이 없어요', p);

    // (7) 그림이 오류 없이 그려지는지
    try {
      M5.figure.render(p.figure);
      if (p.figureAfter) M5.figure.render(p.figureAfter);
      for (const o of a.options || []) if (o.figure) M5.figure.render(o.figure);
    } catch (e) { fail(where, '그림 오류: ' + e.message, p); }
  }
  rows.push({ id: tpl.id, sub: tpl.sub, n: PER, kinds: keys.size, rej: rejected / PER, bad: failCount - before, ms: Date.now() - t0 });
}

// ---------------------------------------------------------------- 4. 무한 모드
console.log('4) 무한 모드 검사 (문제 3000개씩 흉내 내기)');
const engineRows = [];
{
  const scopes = M5.units.flatMap((u) => [{ unit: u.id }, ...u.subs.map((s) => ({ unit: u.id, sub: s.id }))]);
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
    const name = scope.sub ? `${scope.unit}단원 ${M5.findSub(scope.sub).sub.name}` : `${scope.unit}단원 전체 섞기`;
    check('무한 모드 ' + name, triple === 0, `같은 스타일이 3번 연속 ${triple}번 나왔어요`);
    check('무한 모드 ' + name, levelBad === 0, `난이도 조절이 규칙과 달라요 (${levelBad}번)`);
    check('무한 모드 ' + name, repeat / 3000 < 0.01, `최근 50문제와 같은 문제가 ${repeat}번 나왔어요`);
    const ratioA = a / 3000;
    check('무한 모드 ' + name, ratioA > 0.5 && ratioA < 0.72, `문제집 형식 비율이 ${Math.round(ratioA * 100)}%예요`);
    const nSubs = M5.units.find((u) => u.id === scope.unit).subs.length;
    if (!scope.sub) check('무한 모드 ' + name, Object.keys(subs).length === nSubs && Math.min(...Object.values(subs)) > 3000 / nSubs / 3, '소단원이 골고루 섞이지 않아요');
    engineRows.push({ name, ratioA, repeat, triple, levelBad, subs });
  }
}

// ---------------------------------------------------------------- 5. 비슷한 문제 도전
console.log('5) 비슷한 문제 5개 검사 (틀마다 원인별로 40세트)');
const simRows = { sets: 0, sibling: 0, dupSets: 0, fallback: 0 };
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
      if (q.simFallback) simRows.fallback++;
      else if (q.tid !== orig.tid) {
        simRows.sibling++;
        check(where, !!cause && M5.hasCause(q, cause), '다른 틀인데 같은 원인의 오답 패턴이 없어요', q);
      }
      check(where, M5.templates.find((t) => t.id === q.tid).verify(q) === true, '정답이 조건을 만족하지 않아요', q);
    }
    // 같은 틀로 새 문제를 만들 수 있으면 같은 틀이 3개 이상이어야 한다 (문장 종류가 적은 틀은 같은 소단원의 다른 틀로 채운다)
    if (!set.some((q) => q.simFallback)) check(where, set.filter((q) => q.tid === orig.tid).length >= 3, '같은 틀 문제가 3개보다 적어요');
  }
}
// 문제 종류가 아주 적은 틀(예: 수직선 한쪽)은 가끔 같은 문제가 겹칠 수 있다. 전체의 2% 아래면 통과.
check('비슷한 문제', simRows.dupSets / simRows.sets < 0.02, `같은 문제가 겹친 세트가 ${simRows.dupSets}개예요`);

// ---------------------------------------------------------------- 전개도 지퍼 설명 = 실제로 접은 결과
{
  const Bx = M5.box;
  let n = 0;
  for (const net of Bx.NETS) for (let k = 0; k < 8; k++) for (const L of [{ x: 1, y: 1, z: 1 }, { x: 2, y: 5, z: 3 }, { x: 7, y: 4, z: 2 }]) {
    const R = Bx.layout(Bx.fold(Bx.orient(net, k)), L);
    if (!R) continue;
    const S = Bx.boundary(R), Z = Bx.zipper(S), P = Bx.netPoints(R);
    const key = (q) => q.map((v) => v.toFixed(4)).join(',');
    const par = new Map(P.map((q) => [key(q.p), key(q.p)]));
    const find = (x) => (par.get(x) === x ? x : find(par.get(x)));
    for (const z of Z || []) { par.set(find(key(z.ends[0])), find(key(z.ends[1]))); par.set(find(key(z.corner[0])), find(key(z.corner[1]))); }
    const ok = Z && Z.length === 7 && Z.every((z) => Bx.gluePartner(S, z.s) === z.t && Math.abs(z.s.len - z.t.len) < 1e-9)
      && P.every((a) => P.every((b) => (a.cube === b.cube) === (find(key(a.p)) === find(key(b.p)))));
    check('전개도 지퍼', ok, `전개도 ${net.map((c) => c.join('')).join(' ')} 방향 ${k}: 지퍼로 닫은 결과가 실제로 접은 결과와 달라요`);
    n++;
  }
  // 만나는 점 문제: 풀이에 적힌 단계만 따라가도 정답 점에 모두 닿는지
  for (const id of ['u5s4-point', 'u5s5-point']) {
    const t = M5.templates.find((x) => x.id === id);
    for (let i = 0; i < 300; i++) {
      const p = M5.makeProblem(t, 1 + (i % 4), rng, null);
      const ans = p.answer.values.map((k) => p.answer.options[k].text.slice(2));
      const me = p.text.match(/점 (.)[과와]/)[1];
      const g = new Map();
      const link = (a, b) => { (g.get(a) || g.set(a, []).get(a)).push(b); (g.get(b) || g.set(b, []).get(b)).push(a); };
      for (const l of p.solution) {
        const m = l.match(/→ 점 (.)[과와] 점 (.)이 만나요/), c = l.match(/^. 점 (.)[과와] 점 (.)이 만난 곳/);
        if (m) link(m[1], m[2]);
        if (c) link(c[1], c[2]);
      }
      const seen = new Set([me]), q = [me];
      while (q.length) { const x = q.shift(); for (const y of g.get(x) || []) if (!seen.has(y)) { seen.add(y); q.push(y); } }
      check(id, ans.every((x) => seen.has(x)), '풀이 단계만으로는 닿지 않는 정답 점이 있어요', p);
    }
  }
  console.log(`\n[전개도 지퍼 설명] 전개도 ${n}개에서 맞닿는 선분·만나는 점이 실제로 접은 결과와 같아요`);
}
// ---------------------------------------------------------------- 5단계 도전: 소단원마다 다섯 칸 모두 문제가 있는지
{
  const top = [];
  for (const u of M5.units) for (const s of u.subs) {
    for (let k = 0; k < 5; k++) {
      const { items, fallback } = M5.tierItems(s.id, k);
      check('5단계 도전', items.length > 0, `${s.name}의 ${M5.TIERS[k]} 칸에 문제가 없어요`);
      if (k === 4 && !fallback) top.push(s.name);
      for (let i = 0; i < 5 && items.length; i++) { const p = M5.tierProblem(s.id, k, rng, null); check('5단계 도전', !!p && p.sub === s.id, `${s.name} ${M5.TIERS[k]} 문제를 만들지 못했어요`); }
    }
  }
  console.log(`\n[5단계 도전] 소단원 ${M5.units.reduce((n, u) => n + u.subs.length, 0)}개 × 5칸 확인, 최상위 전용 문제가 있는 소단원: ${top.join(', ')}`);
}
// ---------------------------------------------------------------- 문제집 오답 세트
{
  for (const h of M5.homework) {
    const where = '오답 세트 ' + h.id;
    const p = M5.hw.original(h);
    check(where, typeof h.check === 'function' && h.check() === true, '정답 검산(check)이 없거나 맞지 않아요');
    check(where, G.grade(p, G.inputFor(p.answer.type, G.answerValue(p.answer))).ok === true, '정답을 넣었는데 틀렸다고 해요', p);
    if (h.kind === 'wrong' && h.childValue != null) {
      const res = G.grade(p, G.inputFor(p.answer.type, h.childValue));
      check(where, res.ok === false && !!res.pattern, '아이가 쓴 답을 넣으면 틀림 + 원인이 나와야 해요', p);
    }
    for (const m of h.mistakes || []) {
      const res = G.grade(p, G.inputFor(p.answer.type, m.value));
      check(where, res.ok === false && res.pattern && res.pattern.title === m.title, `자주 하는 실수(${m.title})의 답을 넣으면 그 원인이 나와야 해요`, p);
    }
    try { M5.figure.render(p.figure); } catch (e) { fail(where, '그림 오류: ' + e.message); }
    check(where, h.solution.length >= 2 && h.hints.every((x) => x.length > 5), '풀이·힌트가 부족해요');
    const mk = M5.hw.practiceMaker(h, rng, []);
    for (let i = 0; i < 30; i++) {
      const q = mk.next();
      check(where, G.grade(q, G.inputFor(q.answer.type, G.answerValue(q.answer))).ok === true && Array.isArray(q.hints) && q.hints.length === 3 && !!M5.findSub(q.sub), '연습 문제가 이상해요', q);
    }
  }
  console.log(`\n[문제집 오답 세트] ${M5.homework.length}개 확인 (정답 검산, 아이 답 진단, 연습 문제 30개씩)`);
}
// ---------------------------------------------------------------- 난이도 직접 고르기
{
  const st = M5.store.fresh();
  const sess = M5.createSession({ scope: { unit: 1, sub: 'u1s1' }, state: st, rng });
  sess.record(true); sess.record(true);
  check('난이도 고르기', sess.setLevel(3) === 3 && st.levels.u1s1 === 3, '고른 난이도가 저장되지 않아요');
  check('난이도 고르기', sess.record(true) === 0 && sess.level === 3, '난이도를 고른 뒤 연속 정답 수가 처음부터 다시 세어지지 않아요');
  check('난이도 고르기', sess.next().level <= 3 && sess.setLevel(9) === 4 && sess.setLevel(0) === 1, '난이도 범위(1~4)를 벗어나요');
  console.log('\n[난이도 직접 고르기] 저장·범위·연속 정답 다시 세기 확인');
}
// ---------------------------------------------------------------- 인터넷 없이 열기 (sw.js)
{
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const need = [...files, 'app.js', 'index.html', 'style.css', 'manifest.webmanifest'];
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  for (const ic of man.icons) need.push(ic.src);
  for (const f of need) {
    check('sw.js', sw.includes(`'./${f}'`), `sw.js 의 FILES 에 ${f} 가 빠졌어요`);
    check('sw.js', fs.existsSync(path.join(ROOT, f)), `${f} 파일이 없어요`);
  }
  for (const m of sw.matchAll(/'\.\/([^']+)'/g)) check('sw.js', fs.existsSync(path.join(ROOT, m[1])), `sw.js 에 적힌 ${m[1]} 파일이 없어요`);
  console.log(`\n[인터넷 없이 열기] sw.js 가 담아 두는 파일 ${need.length}개 확인`);
}

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
console.log(`\n[비슷한 문제 도전]\n  ${simRows.dupSets / simRows.sets < 0.02 ? '✓' : '✗'} ${simRows.sets}세트 × 5문제, 같은 원인의 다른 틀에서 가져온 문제 ${simRows.sibling}개, 종류가 적은 틀이라 같은 소단원 다른 틀로 채운 문제 ${simRows.fallback}개, 겹친 문제가 있던 세트 ${simRows.dupSets}개`);
const subCount = {};
for (const t of M5.templates) subCount[t.sub] = (subCount[t.sub] || 0) + 1;
console.log('\n[소단원별 문제 틀 수]');
for (const s of M5.units.flatMap((u) => u.subs)) {
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
