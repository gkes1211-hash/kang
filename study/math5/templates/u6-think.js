// 6단원 🧩 사고력 문제 (평균과 가능성)
//   갈래: 논리·추론 · 규칙 찾기 · 거꾸로 생각하기 · 조건 맞추기
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, F = M5.frac;
  const j = T.j;
  const think = (o) => Object.assign({ unit: 6, style: 'B', levels: [1, 4] }, o);
  const sum = (a) => a.reduce((s, v) => s + v, 0);

  // 논리·추론: 고르게 하려면 적어도 몇 개를 옮겨야 할까
  const tMove = think({
    id: 'u6s1-think-move', sub: 'u6s1', styleName: '논리·추론',
    build(r, lv) {
      const n = lv <= 2 ? 3 : r.int(4, 5);
      const m = r.int(4, lv <= 2 ? 8 : 12);
      const dev = Array.from({ length: n - 1 }, () => r.int(-3, 3));
      dev.push(-sum(dev));
      const v = dev.map((d) => m + d);
      if (v.some((x) => x < 1) || dev.every((d) => d === 0) || Math.abs(dev[n - 1]) > 5) return null;
      const ans = sum(dev.filter((d) => d > 0));
      const labels = ['가', '나', '다', '라', '마'].slice(0, n);
      return {
        text: `모둠마다 모은 구슬의 수를 막대그래프로 나타냈어요. 구슬을 옮겨서 모든 모둠의 구슬 수를 똑같게 하려고 해요. 구슬을 적어도 몇 개 옮겨야 하나요?`,
        figure: { type: 'bars', title: '모둠별 구슬 수', unit: '개', labels: labels.map((l) => l + ' 모둠'), values: v, step: 1, max: Math.max(...v) + 2, labelEvery: 2 },
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [
          { value: String(sum(dev.map(Math.abs))), cause: 'concept', msg: '많은 모둠에서 꺼낸 구슬이 바로 적은 모둠으로 가요. 한 번 옮긴 구슬을 두 번 세지 않아요.' },
          { value: String(Math.max(...v) - Math.min(...v)), cause: 'condition', msg: '가장 많은 모둠과 가장 적은 모둠만 봤어요. 모든 모둠을 평균에 맞춰요.' },
          { value: String(m), cause: 'condition', msg: '평균을 구했어요. 옮겨야 하는 구슬의 수를 구해요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: [`먼저 평균을 구해요: (${v.join(' + ')}) ÷ ${n} = ${m}`, '평균보다 많은 모둠에서 넘치는 만큼만 꺼내서 적은 모둠에 주면 가장 적게 옮겨요.', `평균보다 많은 만큼: ${dev.map((d, i) => (d > 0 ? `${labels[i]} ${d}개` : null)).filter(Boolean).join(', ')} → ${ans}개`],
        solution: [`평균: ${sum(v)} ÷ ${n} = ${m}(개)`, `평균보다 많은 모둠에서 옮길 구슬: ${dev.filter((d) => d > 0).join(' + ')} = ${ans}(개)`],
        key: `u6s1-think-move|${v.join(',')}`,
        data: { v },
      };
    },
    verify(p) { const v = p.data.v, m = sum(v) / v.length; return Number.isInteger(m) && sum(v.filter((x) => x > m).map((x) => x - m)) === Number(p.answer.value); },
  });

  // 규칙 찾기: 연속하는 자연수의 합과 평균
  const tConsec = think({
    id: 'u6s1-think-consec', sub: 'u6s1', styleName: '규칙 찾기',
    build(r, lv) {
      const n = r.pick(lv <= 2 ? [3, 5] : [3, 5, 7, 9]);
      const odd = lv >= 3 && r.chance(0.4);
      const step = odd ? 2 : 1;
      const mid = r.int(10, lv <= 2 ? 40 : 90);
      const list = Array.from({ length: n }, (_, i) => mid + (i - (n - 1) / 2) * step);
      if (odd && mid % 2 === 0) return null;
      const S0 = sum(list);
      const askBig = r.chance(0.5);
      const ans = askBig ? list[n - 1] : list[0];
      return {
        text: `연속하는 ${odd ? '홀수' : '자연수'} ${n}개의 합이 ${j(String(S0), '이에요/예요')}. 이 ${n}개의 수 중에서 가장 ${askBig ? '큰' : '작은'} 수는 얼마인가요?`,
        answer: { type: 'num', value: String(ans) },
        patterns: [{ value: String(mid), cause: 'condition', msg: '평균, 즉 가운데 수를 구했어요. 가장 ' + (askBig ? '큰' : '작은') + ' 수까지 가야 해요.' }, { value: String(askBig ? list[0] : list[n - 1]), cause: 'condition', msg: `가장 ${askBig ? '작은' : '큰'} 수를 구했어요.` }].filter((pt) => Number(pt.value) !== ans),
        hints: ['연속하는 수는 고르게 늘어나서, 평균이 가운데 수와 같아요.', `평균 = ${S0} ÷ ${n} = ${mid} → 가운데 수가 ${mid}`, `${list.join(', ')} → 가장 ${askBig ? '큰' : '작은'} 수 ${ans}`],
        solution: [`가운데 수(평균): ${S0} ÷ ${n} = ${mid}`, `${n}개의 수: ${list.join(', ')}`, `가장 ${askBig ? '큰' : '작은'} 수: ${ans}`],
        key: `u6s1-think-consec|${n}|${mid}|${odd}|${askBig}`,
        data: { list },
      };
    },
    verify(p) { const l = p.data.list; return l.every((x, i) => i === 0 || x - l[i - 1] === l[1] - l[0]) && [l[0], l[l.length - 1]].includes(Number(p.answer.value)); },
  });

  // 거꾸로 생각하기: 목표 평균을 넘으려면 다음 시험에서 몇 점 이상
  const tGoal = think({
    id: 'u6s2-think-goal', sub: 'u6s2', styleName: '거꾸로 생각하기',
    build(r, lv) {
      const n = r.int(3, lv <= 2 ? 4 : 6), m = r.int(70, 90), t = m + r.int(1, 4);
      const need = t * (n + 1) - m * n;
      if (need > 100 || need <= 0) return null;
      const nm = r.pick(M5.words.names);
      return {
        text: `${j(nm, '이/가')} 지금까지 본 수학 시험 ${n}번의 평균 점수는 ${m}점이에요. 다음 시험까지 ${n + 1}번의 평균 점수가 ${t}점 이상이 되려면 다음 시험에서 적어도 몇 점을 받아야 하나요?`,
        answer: { type: 'num', value: String(need), unit: '점' },
        patterns: [{ value: String(t), cause: 'concept', msg: `다음 시험에서 ${t}점을 받으면 평균은 ${t}점보다 낮아요. 총점으로 생각해요.` }, { value: String(t * (n + 1)), cause: 'condition', msg: `${n + 1}번의 총점이에요. 지금까지의 총점을 빼야 해요.` }, { value: String(m + (t - m) * 2), cause: 'calc', msg: '총점의 차이로 다시 계산해 봐요.' }].filter((pt) => Number(pt.value) !== need && Number(pt.value) <= 400),
        hints: ['(평균) × (횟수) = (총점)이에요. 총점으로 바꾸어 생각해요.', `지금까지의 총점: ${m} × ${n} = ${m * n}, 목표 총점: ${t} × ${n + 1} = ${t * (n + 1)}`, `${t * (n + 1)} - ${m * n} = ${need}점 이상`],
        solution: [`지금까지의 총점: ${m} × ${n} = ${m * n}(점)`, `${n + 1}번의 목표 총점: ${t} × ${n + 1} = ${t * (n + 1)}(점)`, `다음 시험: ${t * (n + 1)} - ${m * n} = ${need}(점) 이상`],
        key: `u6s2-think-goal|${n}|${m}|${t}`,
        data: { n, m, t },
      };
    },
    verify(p) { const { n, m, t } = p.data; const s = Number(p.answer.value); return (m * n + s) / (n + 1) >= t && (m * n + s - 1) / (n + 1) < t; },
  });

  // 논리·추론: 한 명이 빠진 뒤 평균이 바뀌었을 때 빠진 사람의 점수
  const tLeave = think({
    id: 'u6s2-think-leave', sub: 'u6s2', styleName: '논리·추론',
    build(r) {
      const n = r.int(4, 8), m1 = r.int(70, 90), up = r.chance(0.6);
      const m2 = m1 + (up ? r.int(1, 3) : -r.int(1, 3));
      const x = n * m1 - (n - 1) * m2;
      if (x < 30 || x > 100) return null;
      return {
        text: `모둠 학생 ${n}명의 수학 점수 평균은 ${m1}점이에요. 한 명이 다른 모둠으로 옮겨 갔더니 남은 학생들의 평균이 ${m2}점이 되었어요. 옮겨 간 학생의 점수는 몇 점인가요?`,
        answer: { type: 'num', value: String(x), unit: '점' },
        patterns: [{ value: String(Math.abs(m1 - m2)), cause: 'concept', msg: '평균의 차이가 아니라 총점의 차이를 구해야 해요.' }, { value: String(m1), cause: 'concept', msg: '옮겨 간 학생의 점수가 평균과 같다면 남은 학생의 평균은 그대로예요.' }].filter((pt) => Number(pt.value) !== x),
        hints: ['평균이 바뀐 이유를 총점으로 생각해요.', `처음 총점: ${m1} × ${n} = ${n * m1}, 남은 학생 총점: ${m2} × ${n - 1} = ${(n - 1) * m2}`, `옮겨 간 학생: ${n * m1} - ${(n - 1) * m2} = ${x}점`],
        solution: [`${n}명의 총점: ${m1} × ${n} = ${n * m1}(점)`, `남은 ${n - 1}명의 총점: ${m2} × ${n - 1} = ${(n - 1) * m2}(점)`, `옮겨 간 학생: ${n * m1} - ${(n - 1) * m2} = ${x}(점)`],
        key: `u6s2-think-leave|${n}|${m1}|${m2}`,
        data: { n, m1, m2 },
      };
    },
    verify(p) { const { n, m1, m2 } = p.data; const x = Number(p.answer.value); return (n * m1 - x) / (n - 1) === m2; },
  });

  // 조건 맞추기: 반반이 되도록 구슬 더 넣기
  const tBag = think({
    id: 'u6s3-think-bag', sub: 'u6s3', styleName: '조건 맞추기',
    build(r) {
      const a = r.int(4, 12), b = r.int(1, a - 1);
      const addBlue = r.chance(0.5);
      const ans = a - b;
      return {
        text: `주머니에 빨간 구슬 ${a}개, 파란 구슬 ${b}개가 들어 있어요. ${addBlue ? '파란 구슬을 몇 개 더 넣어야' : '빨간 구슬을 몇 개 꺼내야'} 구슬 하나를 꺼낼 때 빨간 구슬이 나올 가능성이 ⟪1/2⟫이 될까요?`,
        figure: { type: 'bag', balls: [{ color: 'red', n: a }, { color: 'blue', n: b }] },
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(a + b), cause: 'concept', msg: '가능성이 ⟪1/2⟫이면 빨간 구슬과 파란 구슬의 수가 같아요.' }, { value: String(Math.round(a / 2)), cause: 'concept', msg: '빨간 구슬의 절반이 아니라, 두 색의 수가 같아지게 해요.' }].filter((pt) => Number(pt.value) !== ans && Number(pt.value) > 0),
        hints: ['가능성이 ⟪1/2⟫(반반)이 되려면 빨간 구슬과 파란 구슬의 수가 같아야 해요.', `지금 빨간 구슬이 ${a - b}개 더 많아요.`, addBlue ? `파란 구슬 ${ans}개를 더 넣으면 ${a}개씩 같아져요.` : `빨간 구슬 ${ans}개를 꺼내면 ${b}개씩 같아져요.`],
        solution: [`반반 → 두 색의 수가 같아야 해요.`, `${a} - ${b} = ${ans} → ${ans}개 ${addBlue ? '더 넣어요' : '꺼내요'}`],
        key: `u6s3-think-bag|${a}|${b}|${addBlue}`,
        data: { a, b, addBlue },
      };
    },
    verify(p) { const { a, b, addBlue } = p.data; const k = Number(p.answer.value); const red = addBlue ? a : a - k, blue = addBlue ? b + k : b; return F.eq(F.make(red, red + blue), F.make(1, 2)); },
  });

  // 조건 맞추기: 회전판을 반반이 되게 색칠하기
  const tSpin = think({
    id: 'u6s3-think-spin', sub: 'u6s3', styleName: '조건 맞추기',
    build(r) {
      const n = r.pick([6, 8, 10, 12]), red = r.int(0, n / 2 - 1), blue = r.int(1, n / 2), white = n - red - blue;
      const need = n / 2 - red;
      if (white < need || white < 1) return null;
      const sectors = r.shuffle([...Array(red).fill('red'), ...Array(blue).fill('blue'), ...Array(white).fill('white')]);
      return {
        text: `똑같이 ${n}칸으로 나눈 회전판에 빨강 ${red}칸, 파랑 ${blue}칸을 칠했어요. 흰 칸 중 몇 칸을 더 빨강으로 칠해야 화살이 빨강에 멈출 가능성이 ⟪1/2⟫이 될까요?`,
        figure: { type: 'spinner', sectors },
        answer: { type: 'num', value: String(need), unit: '칸' },
        patterns: [{ value: String(n / 2), cause: 'condition', msg: '이미 빨강인 칸이 있어요. 모자란 만큼만 더 칠해요.' }, { value: String(white), cause: 'concept', msg: '흰 칸을 모두 칠하면 반반보다 많아질 수 있어요.' }].filter((pt) => Number(pt.value) !== need && Number(pt.value) > 0),
        hints: [`가능성이 ⟪1/2⟫이 되려면 ${n}칸의 절반, ${n / 2}칸이 빨강이어야 해요.`, `지금 빨강은 ${red}칸이에요.`, `${n / 2} - ${red} = ${need}칸 더`],
        solution: [`빨강이 ${n / 2}칸이어야 해요.`, `${n / 2} - ${red} = ${need}(칸)`],
        key: `u6s3-think-spin|${n}|${red}|${blue}|${sectors.join('')}`,
        data: { n, red },
      };
    },
    verify(p) { const { n, red } = p.data; return F.eq(F.make(red + Number(p.answer.value), n), F.make(1, 2)); },
  });

  // 논리·추론: 세 주머니에서 빨간 구슬이 나올 가능성이 큰 순서
  const tRank = think({
    id: 'u6s4-think-rank', sub: 'u6s4', styleName: '논리·추론',
    build(r) {
      const bags = ['가', '나', '다'].map((nm) => { const t = r.int(4, 12); return { nm, red: r.int(1, t - 1), t }; });
      const p = bags.map((b) => F.make(b.red, b.t));
      if (new Set(p.map(F.key)).size < 3) return null;
      const order = bags.map((b, i) => ({ b, f: p[i] })).sort((x, y) => F.cmp(y.f, x.f)).map((x) => x.b.nm).join(', ');
      const byRed = bags.slice().sort((x, y) => y.red - x.red).map((x) => x.nm).join(', ');
      const perms = ['가, 나, 다', '가, 다, 나', '나, 가, 다', '나, 다, 가', '다, 가, 나', '다, 나, 가'];
      const opts = r.shuffle([order, ...(byRed !== order ? [byRed] : []), ...r.sample(perms.filter((x) => x !== order && x !== byRed), byRed !== order ? 2 : 3)]);
      return {
        text: '세 주머니에서 각각 구슬 하나를 꺼낼 때, 빨간 구슬이 나올 가능성이 큰 주머니부터 차례로 쓴 것을 고르세요.',
        figure: { type: 'table', title: '주머니 속 구슬 수', head: ['주머니', '빨간 구슬', '파란 구슬'], rows: bags.map((b) => [b.nm, `${b.red}개`, `${b.t - b.red}개`]) },
        answer: { type: 'choice', options: opts.map((o) => Object.assign({ text: o, correct: o === order }, o === order ? {} : { pattern: { cause: o === byRed ? 'concept' : 'calc', msg: o === byRed ? '빨간 구슬의 수만 비교했어요. 전체 구슬 수가 달라서 "전체 중 얼마나"로 비교해야 해요.' : '주머니마다 빨간 구슬이 전체의 몇 분의 몇인지 구해서 비교해요.' } })) },
        keepOrder: true,
        hints: ['전체 구슬 수가 달라요. 빨간 구슬이 전체의 몇 분의 몇인지 구해요.', bags.map((b, i) => `${b.nm}: ${F.mk(F.make(b.red, b.t))}`).join(', '), `큰 것부터: ${order}`],
        solution: [bags.map((b) => `${b.nm} 주머니: ${b.t}개 중 ${b.red}개 → ${F.mk(F.make(b.red, b.t))}`).join(' / '), `큰 순서: ${order}`],
        key: `u6s4-think-rank|${bags.map((b) => `${b.red}/${b.t}`).join(',')}`,
        data: { bags },
      };
    },
    verify(p) { const bags = p.data.bags; const o = bags.slice().sort((x, y) => F.cmp(F.make(y.red, y.t), F.make(x.red, x.t))).map((x) => x.nm).join(', '); return p.answer.options[p.answer.value].text === o; },
  });

  // 조건 맞추기: 주사위에서 가능성이 '반반이다'인 일 고르기
  const EVENTS = [
    ['짝수가 나와요', (v) => v % 2 === 0], ['홀수가 나와요', (v) => v % 2 === 1], ['4 이상인 수가 나와요', (v) => v >= 4], ['3 이하인 수가 나와요', (v) => v <= 3],
    ['3의 배수가 나와요', (v) => v % 3 === 0], ['5 이상인 수가 나와요', (v) => v >= 5], ['2 이상인 수가 나와요', (v) => v >= 2], ['6의 약수가 나와요', (v) => 6 % v === 0],
    ['7보다 작은 수가 나와요', (v) => v < 7], ['소수점이 있는 수가 나와요', () => false], ['1이 나와요', (v) => v === 1], ['3 초과 6 이하인 수가 나와요', (v) => v > 3 && v <= 6],
  ];
  const cnt = (f) => [1, 2, 3, 4, 5, 6].filter(f).length;
  const WORD = (k) => (k === 0 ? '불가능하다' : k === 6 ? '확실하다' : k === 3 ? '반반이다' : k > 3 ? '~일 것 같다' : '~아닐 것 같다');
  const tDice = think({
    id: 'u6s4-think-dice', sub: 'u6s4', styleName: '조건 맞추기',
    build(r) {
      const half = EVENTS.filter((e) => cnt(e[1]) === 3), not = EVENTS.filter((e) => cnt(e[1]) !== 3);
      const right = r.pick(half), wrong = r.sample(not, 3);
      const opts = [right, ...wrong];
      return {
        text: '주사위를 한 번 던질 때, 일이 일어날 가능성이 "반반이다"인 것을 고르세요.',
        answer: { type: 'choice', options: opts.map((e, i) => Object.assign({ text: e[0], correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'concept', msg: `이 일이 일어나는 눈은 6가지 중 ${cnt(e[1])}가지라서 "${WORD(cnt(e[1]))}"예요.` } })) },
        hints: ['주사위의 눈은 1, 2, 3, 4, 5, 6의 6가지예요. 반반이려면 그중 3가지여야 해요.', '보기마다 그 일이 일어나는 눈을 직접 적어 봐요.', `"${right[0]}" → ${[1, 2, 3, 4, 5, 6].filter(right[1]).join(', ')}의 3가지`],
        solution: opts.map((e) => `${e[0]}: ${cnt(e[1])}가지 → ${WORD(cnt(e[1]))}`),
        key: `u6s4-think-dice|${opts.map((e) => e[0]).join('/')}`,
        data: {},
      };
    },
    verify(p) { const t = p.answer.options[p.answer.value].text; const e = EVENTS.find((x) => x[0] === t); return cnt(e[1]) === 3 && p.answer.options.filter((o) => cnt(EVENTS.find((x) => x[0] === o.text)[1]) === 3).length === 1; },
  });

  M5.addTemplates([tMove, tConsec, tGoal, tLeave, tBag, tSpin, tRank, tDice]);
})();
