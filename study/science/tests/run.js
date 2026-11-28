// 과학 실험실 데이터 확인:  node study/science/tests/run.js
// 실험·카드·문제를 더한 뒤 돌려서 빠진 칸이나 실수가 없는지 봐요.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const ctx = { window: {}, console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of scripts.filter((s) => s.startsWith('data/') || s === 'lab.js')) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const SCI = ctx.SCI;
let bad = 0; let n = 0;
const check = (where, ok, msg) => { n++; if (!ok) { bad++; console.log(`✗ [${where}] ${msg}`); } };
const filled = (s) => typeof s === 'string' && s.trim().length > 0;
const MAX = 70;
const bubbleOk = (where, s) => { check(where, filled(s), '말풍선 글이 비었어요'); if (filled(s)) check(where, s.length <= MAX, `말풍선이 ${s.length}자예요 (${MAX}자 이하): ${s}`); };
const question = (where, q) => {
  bubbleOk(`${where} 질문`, q.q);
  check(where, Array.isArray(q.choices) && q.choices.length >= 2 && q.choices.length <= 4, '보기는 2~4개');
  check(where, new Set(q.choices).size === q.choices.length, '보기가 겹쳐요');
  (q.choices || []).forEach((c) => check(where, filled(c) && c.length <= 30, `보기가 비었거나 너무 길어요: ${c}`));
  bubbleOk(`${where} 힌트`, `앗, 아니야. 힌트! ${q.hint}`);
  bubbleOk(`${where} 풀이`, `딩동댕! ${q.why}`);
};

// 학기 → 단원 → 판
check('학기', Array.isArray(SCI.order) && SCI.order.length > 0, '학기가 하나도 없어요');
for (const sid of SCI.order) {
  const S = SCI.semesters[sid];
  check(sid, S && filled(S.name) && Array.isArray(S.units), '학기 모양이 이상해요');
  const planIds = S.units.flatMap((u) => u.plan.map((p) => p[0]));
  check(sid, new Set(planIds).size === planIds.length, '판 id 가 겹쳐요');
  for (const u of S.units) {
    for (const k of ['id', 'name', 'em', 'color']) check(`${sid} ${u.id}`, filled(u[k]), `${k} 가 비었어요`);
    u.plan.forEach((p) => check(`${sid} ${u.id}`, p[0].startsWith(`${u.id}-`) && filled(p[1]), `차례 칸이 이상해요: ${p}`));
  }
  for (const rid of Object.keys(S.rounds)) check(sid, planIds.includes(rid), `판 ${rid} 이 단원 차례(plan)에 없어요`);

  for (const [rid, r] of Object.entries(S.rounds)) {
    const w = `${sid} ${rid}`;
    for (const k of ['title', 'q']) check(w, filled(r[k]), `${k} 가 비었어요`);
    // 예상
    bubbleOk(`${w} 예상`, r.predict && r.predict.say);
    check(w, r.predict.choices.length >= 2 && r.predict.choices.length <= 3, '예상 보기는 2~3개');
    check(w, Number.isInteger(r.predict.a) && r.predict.a >= 0 && r.predict.a < r.predict.choices.length, '예상 정답 번호(a)가 이상해요');
    r.predict.choices.forEach((c) => check(w, filled(c[0]) && filled(c[1]), '예상 보기는 [그림, 글]'));
    // 실험
    check(w, r.lab && typeof SCI.kits[r.lab.kit] === 'function', `실험 장치 "${r.lab && r.lab.kit}" 가 lab.js 에 없어요`);
    Object.entries(r.lab.lines || {}).forEach(([k, s]) => bubbleOk(`${w} 실험 ${k}`, s));
    if (r.lab.kit === 'filterEvap') r.lab.steps.forEach((s, i) => { bubbleOk(`${w} 단계 ${i + 1}`, s.line); check(w, filled(s.em) && filled(s.name), '단계에 그림과 이름이 있어야 해요'); });
    if (r.lab.kit === 'sort') {
      const bins = new Set(r.lab.bins.map((b) => b[0]));
      r.lab.items.forEach((it) => { check(w, bins.has(it.bin), `분류 카드 "${it.t}" 의 상자 ${it.bin} 이 없어요`); bubbleOk(`${w} 분류 힌트`, `${r.lab.lines.wrong} ${it.hint}`); });
    }
    if (r.lab.kit === 'sieve') {
      const [big, small] = r.lab.sieves;
      const pass = (g, s) => g.r * 2 < s.hole;
      check(w, r.lab.grains.filter((g) => !pass(g, big)).length === 1, '구멍 큰 체에는 한 가지만 남아야 해요');
      check(w, r.lab.grains.filter((g) => pass(g, big) && !pass(g, small)).length === 1, '구멍 작은 체에는 한 가지만 남아야 해요');
    }
    if (r.lab.kit === 'mix') check(w, r.lab.items.length >= 3, '섞기 재료는 3개 이상 (돋보기로 3가지를 찾아요)');
    // 관찰 · 퀴즈
    check(w, Array.isArray(r.observe) && r.observe.length >= 1, '관찰 질문이 있어야 해요');
    r.observe.forEach((q, i) => question(`${w} 관찰${i + 1}`, q));
    check(w, Array.isArray(r.quiz) && r.quiz.length === 3, '퀴즈는 3개');
    r.quiz.forEach((q, i) => question(`${w} 퀴즈${i + 1}`, q));
    // 알게 된 것
    const L = r.learn;
    bubbleOk(`${w} 맞았을 때`, L.right); bubbleOk(`${w} 틀렸을 때`, L.wrong);
    check(w, L.flow.length >= 3 && L.flow.length <= 4 && L.flow.every((f) => f.length === 3 && filled(f[0]) && filled(f[1])), '정리 그림(flow)은 3~4칸 [그림, 이름, 설명]');
    check(w, L.cards.length >= 1 && L.cards.every((id) => S.cards[id]), '용어 카드 id 가 cards 에 없어요');
    L.cards.forEach((id) => check(w, S.cards[id].round === rid, `카드 ${id} 의 round 가 ${rid} 가 아니에요`));
    check(w, filled(L.home), '집에서 해 보기가 비었어요');
    check(w, Array.isArray(L.more) && L.more.length >= 2 && L.more.every(filled), '더 알아보기는 2줄 이상');
  }

  // 카드
  for (const [id, c] of Object.entries(S.cards)) {
    for (const k of ['em', 'name', 'say', 'unit', 'round']) check(`${sid} 카드 ${id}`, filled(c[k]), `${k} 가 비었어요`);
    check(`${sid} 카드 ${id}`, S.rounds[c.round] && S.rounds[c.round].learn.cards.includes(id), '카드가 그 판의 learn.cards 에 없어요');
    check(`${sid} 카드 ${id}`, c.say.length <= 40, `카드 설명이 ${c.say.length}자예요 (40자 이하)`);
  }
  const names = Object.values(S.cards).map((c) => c.name);
  check(sid, new Set(names).size === names.length, '같은 이름의 카드가 있어요');

  // 단원 마무리
  for (const [uid, Wd] of Object.entries(S.wrap)) {
    check(`${sid} 마무리 ${uid}`, S.units.some((u) => u.id === uid), '없는 단원이에요');
    check(`${sid} 마무리 ${uid}`, Wd.summary.length >= 3 && Wd.summary.every((s) => s.length === 3 && s.every(filled)), '정리 카드는 3장 이상 [그림, 이름, 설명]');
    check(`${sid} 마무리 ${uid}`, Wd.quiz.length >= 6, '확인 문제는 6개 이상');
    Wd.quiz.forEach((q, i) => question(`${sid} 마무리 ${uid} 문제${i + 1}`, q));
  }
}

// 앱 파일: index.html 이 부르는 파일이 있고, sw.js 가 모두 담는지
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
for (const f of [...scripts, 'style.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png']) {
  check('파일', fs.existsSync(path.join(ROOT, f)), `${f} 파일이 없어요`);
  check('sw.js', sw.includes(`'./${f}'`), `sw.js FILES 에 ./${f} 가 없어요`);
}

console.log(bad ? `\n✗ ${bad}개 문제 (확인 ${n}개)` : `✓ 모두 괜찮아요 (확인 ${n}개)`);
process.exit(bad ? 1 : 0);
