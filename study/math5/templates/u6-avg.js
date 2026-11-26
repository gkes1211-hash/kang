// 6단원 평균과 가능성 — 평균 / 평균 이용하기 / 일이 일어날 가능성을 수로 나타내기 / 가능성 예상하고 판단하기
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const D = M5.dec, T = M5.text, W = M5.words, TB = M5.tb;
  const j = T.j, n = T.num;

  M5.addUnit({
    id: 6,
    name: '평균과 가능성',
    subs: [
      { id: 'u6s1', name: '평균', concept: '평균은 자료의 값을 고르게 해서 나타낸 수예요.\n(평균) = (자료의 값을 모두 더한 수) ÷ (자료의 수)\n예) 3, 5, 7의 평균 → (3 + 5 + 7) ÷ 3 = 15 ÷ 3 = 5\n막대그래프에서 높은 막대를 잘라 낮은 막대에 옮겨 높이를 고르게 해서 구할 수도 있어요.' },
      { id: 'u6s2', name: '평균 이용하기', concept: '(자료의 값을 모두 더한 수) = (평균) × (자료의 수)예요.\n평균을 알면 모르는 자료의 값을 구할 수 있어요.\n예) 4번의 평균이 8점이면 합은 8 × 4 = 32점, 세 번의 점수가 7, 9, 6이면 나머지 한 번은 32 - (7 + 9 + 6) = 10점\n자료의 수가 다를 때는 합이 아니라 평균으로 비교해요.' },
      { id: 'u6s3', name: '일이 일어날 가능성을 수로 나타내기', concept: '일이 일어날 가능성을 0부터 1까지의 수로 나타낼 수 있어요.\n불가능하다 → 0, 반반이다 → ⟪1/2⟫, 확실하다 → 1\n예) 주사위를 굴려 7이 나올 가능성은 0, 동전을 던져 앞면이 나올 가능성은 ⟪1/2⟫이에요.' },
      { id: 'u6s4', name: '가능성 예상하고 판단하기', concept: '일이 일어날 가능성은 "불가능하다, ~아닐 것 같다, 반반이다, ~일 것 같다, 확실하다"로 말할 수 있어요.\n예) 빨간 구슬 9개, 파란 구슬 1개가 든 주머니에서 구슬을 꺼낼 때 빨간 구슬이 나올 가능성은 "~일 것 같다"예요.\n전체 중에서 그 일이 일어나는 경우가 얼마나 많은지 비교해 봐요.' },
    ],
  });

  const tpl = (o) => Object.assign({ unit: 6 }, o);
  const COND = '문제에서 꼭 지켜야 할 조건을 다시 읽어 볼까요?';
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const close = (a, b) => Math.abs(a - b) < 1e-9;
  const num = (x) => Number(String(x).replace(/,/g, ''));
  const S = (x) => D.str(D.parse(x));

  // 평균이 자연수가 되는 자료 만들기 (n개, lo~hi)
  function dataWithMean(r, cnt, lo, hi, step = 1, fixed = null) {
    for (let t = 0; t < 200; t++) {
      const vals = Array.from({ length: cnt - 1 }, () => r.int(lo / step, hi / step) * step);
      const m = fixed != null ? fixed : r.int(lo / step, hi / step) * step;
      const last = m * cnt - sum(vals);
      if (last >= lo && last <= hi && last % step === 0) {
        const all = r.shuffle([...vals, last]);
        if (new Set(all).size >= Math.min(3, cnt)) return { vals: all, mean: m };
      }
    }
    return null;
  }

  const CTX = [
    { title: '줄넘기 기록', col: '횟수(번)', unit: '번', lab: (i) => `${i + 1}회`, lo: 40, hi: 90, ask: '줄넘기 기록의 평균' },
    { title: '과목별 점수', col: '점수(점)', unit: '점', lab: (i) => ['국어', '수학', '사회', '과학', '영어', '음악'][i], lo: 70, hi: 100, ask: '점수의 평균' },
    { title: '요일별 읽은 쪽수', col: '쪽수(쪽)', unit: '쪽', lab: (i) => ['월', '화', '수', '목', '금', '토'][i], lo: 15, hi: 45, ask: '하루에 읽은 쪽수의 평균' },
    { title: '모둠 학생들의 키', col: '키(cm)', unit: 'cm', lab: null, lo: 130, hi: 155, ask: '키의 평균' },
    { title: '월별 도서관 방문 횟수', col: '횟수(번)', unit: '번', lab: (i) => `${i + 3}월`, lo: 2, hi: 12, ask: '한 달 방문 횟수의 평균' },
  ];
  function meanPatterns(vals, mean, unit) {
    const sorted = vals.slice().sort((a, b) => a - b);
    const med = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : null;
    return [
      { value: String(sum(vals)), cause: 'condition', msg: `자료의 값을 모두 더한 다음 자료의 수 ${j(vals.length, '으로/로')} 나눠야 해요.` },
      ...(Number.isInteger(sum(vals) / (vals.length - 1)) ? [{ value: String(sum(vals) / (vals.length - 1)), cause: 'calc', msg: `자료의 수를 다시 세어 봐요. 모두 ${vals.length}개예요.` }] : []),
      ...(med != null && med !== mean ? [{ value: String(med), cause: 'concept', soft: true, msg: '가운데 값이 아니라 평균을 구해요. 모두 더해서 자료의 수로 나눠요.' }] : []),
      ...((sorted[0] + sorted[sorted.length - 1]) % 2 === 0 ? [{ value: String((sorted[0] + sorted[sorted.length - 1]) / 2), cause: 'concept', soft: true, msg: '가장 큰 값과 가장 작은 값만 보면 안 돼요. 모든 자료를 더해요.' }] : []),
    ];
  }
  const meanHints = (vals, mean) => [
    '(평균) = (자료의 값을 모두 더한 수) ÷ (자료의 수)',
    `${vals.join(' + ')} = ${sum(vals)}`,
    `${sum(vals)} ÷ ${vals.length} = ${mean}`,
  ];

  // ======================================================================
  // 소단원 1: 평균
  // ======================================================================
  const tTable = tpl({
    id: 'u6s1-table', sub: 'u6s1', style: 'A', styleName: '표에서 평균', levels: [1, 4],
    build(r, lv) {
      const c = r.pick(CTX);
      const cnt = lv === 1 ? 3 : lv === 2 ? 4 : r.int(5, 6);
      const d = dataWithMean(r, cnt, c.lo, c.hi);
      if (!d) return null;
      const labels = c.lab ? d.vals.map((_, i) => c.lab(i)) : r.sample(W.names, cnt);
      return {
        text: `${j(c.title, '을/를')} 표로 나타냈어요. ${j(c.ask, '은/는')} 몇 ${c.unit}인가요?`,
        figure: { type: 'table', title: c.title, head: [c.lab ? '구분' : '이름', c.col], rows: labels.map((l, i) => [l, String(d.vals[i])]) },
        answer: { type: 'num', value: String(d.mean), unit: c.unit },
        patterns: meanPatterns(d.vals, d.mean),
        hints: meanHints(d.vals, d.mean),
        solution: [`합: ${d.vals.join(' + ')} = ${sum(d.vals)}`, `평균: ${sum(d.vals)} ÷ ${cnt} = ${d.mean}(${c.unit})`],
        key: `u6s1-table|${c.title}|${d.vals.join(',')}`,
        data: { vals: d.vals },
      };
    },
    verify(p) { return close(num(p.answer.value), sum(p.data.vals) / p.data.vals.length); },
  });

  // 표·그래프 읽기: 막대그래프를 보고 평균
  const tBars = tpl({
    id: 'u6s1-bars', sub: 'u6s1', style: 'B', styleName: '표·그래프 읽기', levels: [1, 4],
    build(r, lv) {
      const step = lv <= 2 ? 10 : 5;
      const cnt = lv === 1 ? 3 : r.int(4, 5);
      const d = dataWithMean(r, cnt, step, step * 10, step);
      if (!d) return null;
      const c = r.pick([
        { title: '반별 모은 빈 병 수', unit: '개', lab: (i) => `${i + 1}반` },
        { title: '모둠별 칭찬 붙임딱지 수', unit: '장', lab: (i) => `${String.fromCharCode(0xac00 + i * 588)} 모둠` },
        { title: '요일별 운동한 시간', unit: '분', lab: (i) => ['월', '화', '수', '목', '금'][i] },
      ]);
      const labels = d.vals.map((_, i) => c.lab(i));
      return {
        text: `${j(c.title, '을/를')} 막대그래프로 나타냈어요. 그래프를 보고 평균을 구하세요.`,
        figure: { type: 'bars', title: c.title, unit: c.unit, labels, values: d.vals, step, max: step * 10, labelEvery: step === 5 ? 2 : 1 },
        answer: { type: 'num', value: String(d.mean), unit: c.unit },
        patterns: meanPatterns(d.vals, d.mean),
        hints: [`세로 눈금 한 칸은 ${j(`${step}${c.unit}`, '이에요/예요')}. 막대마다 값을 먼저 읽어요.`, `막대의 값: ${labels.map((l, i) => `${l} ${d.vals[i]}`).join(', ')}`, `(${d.vals.join(' + ')}) ÷ ${cnt} = ${sum(d.vals)} ÷ ${cnt} = ${d.mean}`],
        solution: [`${labels.map((l, i) => `${l} ${d.vals[i]}`).join(', ')}`, `${sum(d.vals)} ÷ ${cnt} = ${d.mean}(${c.unit})`],
        key: `u6s1-bars|${c.title}|${d.vals.join(',')}`,
        data: { vals: d.vals },
      };
    },
    verify(p) { return close(num(p.answer.value), sum(p.figure.values) / p.figure.values.length) && p.figure.values.every((v) => v % p.figure.step === 0); },
  });

  // 생활 속 상황: 경기 기록 (소수)
  const tRecord = tpl({
    id: 'u6s1-record', sub: 'u6s1', style: 'B', styleName: '생활 속 상황', levels: [2, 4],
    build(r, lv) {
      const c = r.pick([
        { what: '50 m 달리기 기록', unit: '초', lo: 80, hi: 110 },
        { what: '멀리뛰기 기록', unit: 'cm', lo: 1200, hi: 1800, int: true },
        { what: '공 던지기 기록', unit: 'm', lo: 150, hi: 350 },
      ]);
      const cnt = lv === 2 ? 3 : 4;
      const d = dataWithMean(r, cnt, c.lo, c.hi);
      if (!d) return null;
      const vals = c.int ? d.vals.map((v) => String(Math.round(v / 10))) : d.vals.map((v) => S(D.make(v, 1)));
      const meanS = c.int ? S(D.divInt(String(sum(vals.map(Number))), cnt) || '0') : S(D.make(d.mean, 1));
      if (c.int && !D.divInt(String(sum(vals.map(Number))), cnt)) return null;
      if (D.parse(meanS).s > 1) return null;
      const nm = r.pick(W.names);
      const total = vals.reduce((s, v) => D.add(s, v), D.make(0));
      return {
        text: `${nm}의 ${j(c.what, '이에요/예요')}. ${nm}의 ${c.what}의 평균은 몇 ${c.unit}인가요?\n${vals.map((v, i) => `${i + 1}회: ${v} ${c.unit}`).join(',  ')}`,
        answer: { type: 'num', value: meanS, unit: c.unit },
        patterns: [{ value: S(total), cause: 'condition', msg: `모두 더한 다음 ${cnt}번으로 나눠야 해요.` }],
        hints: ['(평균) = (기록을 모두 더한 값) ÷ (기록의 수)', `${vals.join(' + ')} = ${S(total)}`, `${S(total)} ÷ ${cnt} = ${meanS}`],
        solution: [`${vals.join(' + ')} = ${S(total)}`, `${S(total)} ÷ ${cnt} = ${meanS}(${c.unit})`],
        key: `u6s1-record|${c.what}|${vals.join(',')}`,
        data: { vals },
      };
    },
    verify(p) { const v = p.data.vals.map(Number); return close(num(p.answer.value), sum(v) / v.length); },
  });

  // 어림 먼저: 고르게 하면 대략 얼마인지
  const tLevel = tpl({
    id: 'u6s1-level', sub: 'u6s1', style: 'B', styleName: '어림 먼저', levels: [1, 3],
    build(r, lv) {
      const center = r.int(lv === 1 ? 2 : 3, lv === 1 ? 9 : 20) * (lv === 1 ? 1 : 5);
      const cnt = lv === 1 ? 3 : 5;
      const dev = lv === 1 ? [-1, 0, 1] : r.pick([[-2, -1, 0, 1, 2], [-3, -1, 0, 2, 2], [-4, 1, 1, 1, 1], [-2, -2, 1, 1, 2]]);
      const vals = r.shuffle(dev.map((d) => center + d));
      if (vals.some((v) => v <= 0)) return null;
      const opts = [center, center + 5, Math.max(1, center - 5), sum(vals)];
      if (new Set(opts).size < 4) return null;
      return {
        text: `계산하기 전에 어림해 보세요. 다음 자료의 평균에 가장 가까운 수를 고르세요.\n${vals.join(',  ')}`,
        answer: { type: 'choice', options: opts.map((v, i) => Object.assign({ text: String(v), correct: i === 0 }, i === 0 ? {} : { pattern: i === 3 ? { cause: 'condition', msg: '모두 더한 수예요. 평균은 자료의 수로 나눠야 해요.' } : { cause: 'concept', msg: `자료의 값이 모두 ${center} 근처에 모여 있어요. 큰 값을 작은 값 쪽으로 옮겨 고르게 해 봐요.` } })) },
        hints: ['자료의 값들이 어느 수 근처에 모여 있는지 봐요.', '큰 값에서 조금 떼어 작은 값에 주면 값들이 고르게 돼요.', `(${vals.join(' + ')}) ÷ ${cnt} = ${sum(vals)} ÷ ${cnt} = ${center}`],
        solution: [`${sum(vals)} ÷ ${cnt} = ${center}`],
        key: `u6s1-level|${vals.join(',')}`,
        data: { vals },
      };
    },
    verify(p) { return close(num(p.answer.options[p.answer.value].text), sum(p.data.vals) / p.data.vals.length); },
  });

  const tChoice1 = tpl({
    id: 'u6s1-choice', sub: 'u6s1', style: 'B', styleName: '객관식', levels: [1, 4],
    build(r, lv) {
      const cnt = lv <= 2 ? 4 : 5;
      const d = dataWithMean(r, cnt, 10, lv <= 2 ? 40 : 90);
      if (!d) return null;
      const pts = meanPatterns(d.vals, d.mean);
      const vals = [String(d.mean), ...pts.map((p) => p.value)];
      const extra = [String(d.mean + 1), String(Math.max(1, d.mean - 1)), String(d.mean + 2)];
      const all = [...new Set([...vals, ...extra])].slice(0, 4);
      if (all.length < 4) return null;
      const opts = all.map((v) => {
        const pt = pts.find((x) => x.value === v);
        return Object.assign({ text: v, v: Number(v), correct: v === String(d.mean) }, v === String(d.mean) ? {} : { pattern: pt ? { cause: pt.cause, msg: pt.msg } : { cause: 'calc', msg: '합과 나눗셈을 다시 확인해 봐요.' } });
      }).sort((a, b) => a.v - b.v);
      return {
        text: `다음 자료의 평균을 고르세요.\n${d.vals.join(',  ')}`,
        answer: { type: 'choice', options: opts },
        keepOrder: true,
        hints: meanHints(d.vals, d.mean),
        solution: [`${sum(d.vals)} ÷ ${cnt} = ${d.mean}`],
        key: `u6s1-choice|${d.vals.join(',')}`,
        data: { vals: d.vals },
      };
    },
    verify(p) { const m = sum(p.data.vals) / p.data.vals.length; return p.answer.options.every((o, i) => close(o.v, m) === (i === p.answer.value)); },
  });

  // 서술형: 평균을 두 가지 방법으로 (합 ÷ 수 / 고르게 옮기기)
  const tEssay1 = tpl({
    id: 'u6s1-essay', sub: 'u6s1', style: 'A', styleName: '서술형', levels: [1, 4],
    build(r, lv) {
      const cnt = lv <= 2 ? 3 : 4;
      const d = dataWithMean(r, cnt, 4, lv <= 2 ? 12 : 30);
      if (!d) return null;
      const moves = d.vals.map((v) => v - d.mean);
      const give = d.vals.map((v, i) => (moves[i] > 0 ? `${v}에서 ${moves[i]}만큼` : null)).filter(Boolean).join(', ');
      return {
        text: `다음 자료의 평균을 두 가지 방법으로 구하려고 해요. 풀이 과정을 쓰고 답을 구하세요.\n${d.vals.join(',  ')}`,
        figure: { type: 'bars', title: '자료', unit: '', labels: d.vals.map((_, i) => `${String.fromCharCode(0xac00 + i * 588)}`), values: d.vals, step: lv <= 2 ? 1 : 2, max: lv <= 2 ? 12 : 30, labelEvery: lv <= 2 ? 2 : 5 },
        answer: { type: 'num', value: String(d.mean) },
        patterns: meanPatterns(d.vals, d.mean),
        hints: ['방법 1: 모두 더해서 자료의 수로 나눠요. 방법 2: 높은 막대에서 떼어 낮은 막대에 옮겨 높이를 고르게 해요.', `방법 1: ${d.vals.join(' + ')} = ${sum(d.vals)}`, `방법 1: ${sum(d.vals)} ÷ ${cnt} = ${d.mean}\n방법 2: ${give}을 옮기면 모두 ${j(d.mean, '이/가')} 돼요.`],
        solution: [`방법 1 (합 ÷ 수): ${d.vals.join(' + ')} = ${sum(d.vals)}, ${sum(d.vals)} ÷ ${cnt} = ${d.mean}`, `방법 2 (고르게 하기): ${give}을 떼어 낮은 쪽에 옮기면 모두 ${j(d.mean, '이/가')} 돼요.`],
        essay: {
          checklist: [
            { q: '자료의 값을 모두 더했나요?', concept: `모든 자료를 빠짐없이 더해요. ${d.vals.join(' + ')} = ${sum(d.vals)}` },
            { q: '더한 값을 자료의 수로 나눴나요?', concept: `(평균) = (합) ÷ (자료의 수). 자료의 수는 ${cnt}개예요.` },
            { q: '높은 값에서 낮은 값으로 옮겨 고르게 해 봤나요?', concept: '평균은 자료를 고르게 했을 때의 값이에요. 막대를 잘라 옮겨서 높이를 같게 만들어 봐요.' },
          ],
        },
        key: `u6s1-essay|${d.vals.join(',')}`,
        data: { vals: d.vals },
      };
    },
    verify(p) { return close(num(p.answer.value), sum(p.data.vals) / p.data.vals.length); },
  });

  const OXWHY = {
    u6s1: [
      { s: '평균은 자료 중 가장 큰 값보다 클 수 있어요.', t: false, why: '평균은 자료를 고르게 한 값이라서 가장 작은 값과 가장 큰 값 사이에 있어요.', wrong: ['자료를 모두 더하면 가장 큰 값보다 커지니까요.', '자료의 수가 많으면 평균이 커지니까요.'] },
      { s: '3, 5, 7의 평균과 4, 5, 6의 평균은 같아요.', t: true, why: '두 자료 모두 합이 15이고 자료의 수가 3개라서 평균이 5예요.', wrong: ['가운데 수가 5로 같으니까 언제나 평균도 같아요.', '두 자료의 가장 큰 값이 달라서 평균도 달라요.'] },
      { s: '자료에 0이 있으면 평균을 구할 때 0은 세지 않아요.', t: false, why: '0도 자료의 하나라서 자료의 수에 넣어야 해요.', wrong: ['0은 더해도 합이 그대로라서 세지 않아요.', '0이 있으면 평균을 구할 수 없어요.'] },
    ],
    u6s2: [
      { s: '평균이 8이고 자료가 5개이면 자료의 합은 40이에요.', t: true, why: '(합) = (평균) × (자료의 수) = 8 × 5 = 40이에요.', wrong: ['평균에 5를 더하면 합이 되니까요.', '8 + 5 = 13이 합이에요.'] },
      { s: '자료의 수가 다른 두 모둠은 합이 큰 모둠이 더 잘한 거예요.', t: false, why: '자료의 수가 다르면 합이 아니라 평균으로 비교해야 해요.', wrong: ['합이 크면 항상 평균도 크니까요.', '자료의 수가 적은 모둠이 항상 잘한 거예요.'] },
      { s: '평균보다 큰 자료가 있으면 평균보다 작은 자료도 꼭 있어요.', t: true, why: '평균은 고르게 한 값이라서, 평균보다 큰 부분을 평균보다 작은 쪽에 옮겨야 고르게 되니까요.', wrong: ['평균보다 큰 자료는 하나뿐이니까요.', '자료가 모두 평균보다 클 수도 있으니까요.'] },
    ],
    u6s3: [
      { s: '주사위를 한 번 굴릴 때 6이 나올 가능성은 ⟪1/2⟫이에요.', t: false, why: '눈은 1부터 6까지 6가지라서 6이 나올 가능성은 반반보다 작아요. "~아닐 것 같다"예요.', wrong: ['6이 나오거나 안 나오거나 둘 중 하나라서 반반이에요.', '6은 가장 큰 눈이라서 잘 나와요.'] },
      { s: '흰 바둑돌만 들어 있는 통에서 바둑돌 하나를 꺼낼 때 흰 바둑돌일 가능성은 1이에요.', t: true, why: '흰 바둑돌만 있어서 꺼내면 반드시 흰 바둑돌이라 "확실하다"예요.', wrong: ['어떤 일이든 가능성은 ⟪1/2⟫이니까요.', '꺼내 보기 전에는 알 수 없으니까 0이에요.'] },
      { s: '일이 일어날 가능성은 1보다 클 수도 있어요.', t: false, why: '가장 확실한 일이 1이라서 가능성은 0부터 1까지의 수로 나타내요.', wrong: ['여러 번 일어나는 일은 1보다 커요.', '아주 쉬운 일은 2로 나타내요.'] },
    ],
    u6s4: [
      { s: '빨간 공 1개, 파란 공 9개가 든 주머니에서 공 하나를 꺼낼 때 빨간 공이 나올 가능성은 "~아닐 것 같다"예요.', t: true, why: '10개 중 빨간 공은 1개뿐이라 나올 가능성이 반반보다 작아요.', wrong: ['빨간 공이 들어 있으니까 "확실하다"예요.', '빨간 공이 들어 있으니까 반반이에요.'] },
      { s: '내일 아침 해가 서쪽에서 뜰 가능성은 "반반이다"예요.', t: false, why: '해는 항상 동쪽에서 떠서 서쪽에서 뜰 가능성은 "불가능하다"예요.', wrong: ['해가 동쪽이나 서쪽 중 한 곳에서 뜨니까 반반이에요.', '내일 일은 알 수 없으니까 반반이에요.'] },
      { s: '동전을 던져서 앞면이 나올 가능성과 뒷면이 나올 가능성은 같아요.', t: true, why: '앞면과 뒷면 두 가지가 똑같이 나올 수 있어서 둘 다 "반반이다"예요.', wrong: ['앞면이 그림이 있어서 더 잘 나와요.', '처음에는 항상 앞면이 나와요.'] },
    ],
  };
  const tOX = (sub) => TB.oxWhy({
    id: sub + '-oxwhy', unit: 6, sub, levels: [1, 4],
    gen(r) { const i = r.int(0, OXWHY[sub].length - 1); const q = OXWHY[sub][i]; return { statement: q.s, truth: q.t, why: q.why, wrong: r.shuffle(q.wrong), key: i }; },
  });

  // 기본 계산: 자료 목록만 보고 평균
  const tPlain = tpl({
    id: 'u6s1-plain', sub: 'u6s1', style: 'A', styleName: '기본 계산', levels: [1, 4],
    build(r, lv) {
      const cnt = lv === 1 ? 3 : lv === 2 ? 4 : r.int(5, 6);
      const d = dataWithMean(r, cnt, lv <= 2 ? 1 : 10, lv <= 2 ? 20 : 99);
      if (!d) return null;
      return {
        text: '다음 자료의 평균을 구하세요.',
        figure: { type: 'chips', items: d.vals.map(String) },
        answer: { type: 'num', value: String(d.mean) },
        patterns: meanPatterns(d.vals, d.mean),
        hints: meanHints(d.vals, d.mean),
        solution: [`${d.vals.join(' + ')} = ${sum(d.vals)}`, `${sum(d.vals)} ÷ ${cnt} = ${d.mean}`],
        key: `u6s1-plain|${d.vals.join(',')}`,
        data: { vals: d.vals },
      };
    },
    verify(p) { return close(num(p.answer.value), sum(p.data.vals) / p.data.vals.length); },
  });

  // 틀린 줄 찾기: 평균 풀이
  const tLine1 = TB.lineFind({
    id: 'u6s1-line', unit: 6, sub: 'u6s1', levels: [1, 4],
    gen(r, lv) {
      const cnt = lv <= 2 ? 4 : 5;
      const d = dataWithMean(r, cnt, 10, lv <= 2 ? 40 : 90);
      if (!d) return null;
      const S0 = sum(d.vals);
      const lines = [`① 자료를 모두 더하면 ${d.vals.join(' + ')} = ${S0}`, `② 자료의 수는 ${cnt}개`, `③ 평균은 ${S0} ÷ ${cnt} = ${d.mean}`];
      const k = r.int(0, 2);
      let bad, after;
      if (k === 0) {
        const wrong = S0 + r.pick([-10, 10]);
        if (wrong % cnt) return null;
        bad = { i: 0, line: `① 자료를 모두 더하면 ${d.vals.join(' + ')} = ${wrong}`, msg: '자료의 합을 다시 계산해 봐요.' };
        after = [`② 자료의 수는 ${cnt}개`, `③ 평균은 ${wrong} ÷ ${cnt} = ${wrong / cnt}`];
      } else if (k === 1) {
        if (S0 % (cnt - 1)) return null;
        bad = { i: 1, line: `② 자료의 수는 ${cnt - 1}개`, msg: `자료의 수를 다시 세어 봐요. 모두 ${cnt}개예요.` };
        after = [`③ 평균은 ${S0} ÷ ${cnt - 1} = ${S0 / (cnt - 1)}`];
      } else {
        bad = { i: 2, line: `③ 평균은 ${S0} ÷ ${cnt} = ${d.mean + r.pick([-1, 1, 2])}`, msg: `${S0} ÷ ${j(cnt, '을/를')} 다시 계산해 봐요.` };
        after = [];
      }
      return { problem: `${d.vals.join(', ')}의 평균을`, lines, bad, after, key: `${d.vals.join(',')}|${k}`, data: { vals: d.vals } };
    },
  });

  const U6S1 = [tTable, tPlain, tBars, tRecord, tLevel, tChoice1, tEssay1, tOX('u6s1'), tLine1];

  // ======================================================================
  // 소단원 2: 평균 이용하기
  // ======================================================================
  const tMissing = tpl({
    id: 'u6s2-missing', sub: 'u6s2', style: 'A', styleName: '모르는 값 구하기', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const c = r.pick(CTX.filter((x) => x.lab));
      const cnt = lv === 1 ? 3 : lv === 2 ? 4 : 5;
      const d = dataWithMean(r, cnt, c.lo, c.hi);
      if (!d) return null;
      const k = r.int(0, cnt - 1);
      const ans = d.vals[k];
      const others = d.vals.filter((_, i) => i !== k);
      const labels = d.vals.map((_, i) => c.lab(i));
      return {
        text: `${c.title}의 평균이 ${j(`${d.mean}${c.unit}`, '이에요/예요')}. ${labels[k]}의 값은 몇 ${c.unit}인가요?`,
        figure: { type: 'table', title: c.title, head: ['구분', c.col], rows: labels.map((l, i) => [l, i === k ? '?' : String(d.vals[i])]) },
        answer: { type: 'num', value: String(ans), unit: c.unit },
        patterns: [
          { value: String(d.mean), cause: 'concept', msg: '평균은 모르는 값이 아니에요. 평균으로 전체 합을 먼저 구해요.' },
          { value: String(d.mean * cnt), cause: 'condition', msg: `전체 합에서 나머지 값들을 빼야 해요.` },
        ],
        hints: [`${COND} 먼저 전체 합을 구해요. (합) = (평균) × (자료의 수)`, `전체 합: ${d.mean} × ${cnt} = ${d.mean * cnt}`, `${d.mean * cnt} - (${others.join(' + ')}) = ${d.mean * cnt} - ${sum(others)} = ${ans}`],
        solution: [`전체 합: ${d.mean} × ${cnt} = ${d.mean * cnt}`, `${labels[k]}: ${d.mean * cnt} - ${sum(others)} = ${ans}(${c.unit})`],
        key: `u6s2-missing|${c.title}|${d.vals.join(',')}|${k}`,
        data: { mean: d.mean, others, cnt },
      };
    },
    verify(p) { const { mean, others, cnt } = p.data; return close(sum([...others, num(p.answer.value)]) / cnt, mean); },
  });

  const tBarMissing = tpl({
    id: 'u6s2-barmissing', sub: 'u6s2', style: 'B', styleName: '표·그래프 읽기', levels: [1, 4],
    build(r, lv) {
      const step = lv <= 2 ? 10 : 5;
      const cnt = lv === 1 ? 3 : 4;
      const d = dataWithMean(r, cnt, step, step * 10, step);
      if (!d) return null;
      const k = r.int(0, cnt - 1);
      const labels = d.vals.map((_, i) => `${i + 1}모둠`);
      const others = d.vals.filter((_, i) => i !== k);
      return {
        text: `모둠별로 모은 재활용품의 무게를 막대그래프로 나타냈는데, ${labels[k]}의 막대가 지워졌어요.\n${['', '', '두', '세', '네', '다섯'][cnt]} 모둠의 평균이 ${d.mean} kg일 때, ${labels[k]}의 재활용품은 몇 kg인가요?`,
        figure: { type: 'bars', title: '모둠별 재활용품 무게', unit: 'kg', labels, values: d.vals.map((v, i) => (i === k ? null : v)), step, max: step * 10, labelEvery: step === 5 ? 2 : 1 },
        answer: { type: 'num', value: String(d.vals[k]), unit: 'kg' },
        patterns: [
          { value: String(d.mean), cause: 'concept', msg: '평균은 지워진 막대의 값이 아니에요. 평균으로 전체 합을 먼저 구해요.' },
          { value: String(d.mean * cnt), cause: 'condition', msg: '전체 합에서 다른 모둠의 무게를 빼야 해요.' },
        ],
        hints: ['(합) = (평균) × (자료의 수)', `전체 합: ${d.mean} × ${cnt} = ${d.mean * cnt}, 다른 모둠: ${others.join(' + ')} = ${sum(others)}`, `${d.mean * cnt} - ${sum(others)} = ${d.vals[k]}(kg)`],
        solution: [`${d.mean} × ${cnt} - ${sum(others)} = ${d.vals[k]}(kg)`],
        key: `u6s2-barmissing|${d.vals.join(',')}|${k}`,
        data: { mean: d.mean, others, cnt },
      };
    },
    verify(p) { const { mean, others, cnt } = p.data; return close(sum([...others, num(p.answer.value)]) / cnt, mean); },
  });

  const tTarget = tpl({
    id: 'u6s2-target', sub: 'u6s2', style: 'A', styleName: '평균 이용하기', levels: [2, 4], weak: ['condition'],
    build(r, lv) {
      const cnt = lv === 2 ? 3 : 4;
      const goal = r.int(16, 19) * 5;
      const prev = Array.from({ length: cnt }, () => r.int(goal - 12, 100));
      const need = goal * (cnt + 1) - sum(prev);
      if (need < 50 || need > 100) return null;
      const nm = r.pick(W.names);
      return {
        text: `${nm}의 수학 단원평가 점수는 ${prev.map((v, i) => `${i + 1}회 ${v}점`).join(', ')}이에요.\n${cnt + 1}회까지의 평균 점수가 ${goal}점 이상이 되려면 ${cnt + 1}회에는 적어도 몇 점을 받아야 하나요?`,
        answer: { type: 'num', value: String(need), unit: '점' },
        patterns: [
          { value: String(goal), cause: 'concept', msg: '평균이 되려면 앞의 점수들까지 생각해야 해요. 전체 합을 먼저 구해요.' },
          { value: String(goal * (cnt + 1)), cause: 'condition', msg: '필요한 전체 합에서 지금까지의 점수를 빼야 해요.' },
          { value: String(goal * cnt - sum(prev) > 0 ? goal * cnt - sum(prev) : 0), cause: 'condition', soft: true, msg: `${cnt + 1}회까지, 모두 ${cnt + 1}번의 평균이에요.` },
        ].filter((pt) => Number(pt.value) > 0),
        hints: [`${COND} 모두 ${cnt + 1}번의 평균이에요.`, `평균 ${goal}점이 되려면 합이 ${goal} × ${cnt + 1} = ${goal * (cnt + 1)}점 이상이어야 해요.`, `${goal * (cnt + 1)} - (${prev.join(' + ')}) = ${goal * (cnt + 1)} - ${sum(prev)} = ${need}(점)`],
        solution: [`필요한 합: ${goal} × ${cnt + 1} = ${goal * (cnt + 1)}`, `${goal * (cnt + 1)} - ${sum(prev)} = ${need}(점)`],
        key: `u6s2-target|${prev.join(',')}|${goal}`,
        data: { prev, goal },
      };
    },
    verify(p) { const { prev, goal } = p.data; const v = num(p.answer.value); return (sum(prev) + v) / (prev.length + 1) >= goal - 1e-9 && (sum(prev) + v - 1) / (prev.length + 1) < goal; },
  });

  const tTotal = tpl({
    id: 'u6s2-total', sub: 'u6s2', style: 'A', styleName: '생활 속 문장제', levels: [1, 4], weak: ['condition'],
    build(r, lv) {
      const c = r.pick([
        { q: (m, w) => `${j(r.pick(W.names), '은/는')} 하루에 평균 ${m}쪽씩 책을 읽어요. ${w.t} 동안 읽은 책은 모두 몇 쪽인가요?`, unit: '쪽', lo: 10, hi: 40 },
        { q: (m, w) => `우리 반은 하루 평균 ${m}개씩 우유갑을 모아요. ${w.t} 동안 모은 우유갑은 모두 몇 개인가요?`, unit: '개', lo: 15, hi: 30 },
        { q: (m, w) => `어느 빵집은 하루 평균 ${m}개의 빵을 팔아요. ${w.t} 동안 판 빵은 모두 몇 개인가요?`, unit: '개', lo: 40, hi: 90 },
      ]);
      const wk = r.pick(lv <= 2 ? [{ t: '일주일', d: 7 }, { t: '5일', d: 5 }] : [{ t: '일주일', d: 7 }, { t: '2주일', d: 14 }, { t: '3주일', d: 21 }]);
      const m = r.int(c.lo, c.hi);
      return {
        text: c.q(m, wk),
        answer: { type: 'num', value: String(m * wk.d), unit: c.unit },
        patterns: [
          { value: String(m), cause: 'condition', msg: `하루 평균이 아니라 ${wk.t} 동안의 합을 물었어요.` },
          ...(wk.d % 7 === 0 ? [{ value: String(m * (wk.d / 7) * 5), cause: 'condition', soft: true, msg: '일주일은 7일이에요.' }] : []),
        ],
        hints: [`${COND} ${j(wk.t, '은/는')} 며칠인지 확인해요.`, `(합) = (평균) × (날수), ${wk.t} = ${wk.d}일`, `${m} × ${wk.d} = ${m * wk.d}(${c.unit})`],
        solution: [`${m} × ${wk.d} = ${m * wk.d}(${c.unit})`],
        key: `u6s2-total|${c.unit}|${m}|${wk.d}`,
        data: { m, d: wk.d },
      };
    },
    verify(p) { return num(p.answer.value) === p.data.m * p.data.d; },
  });

  const tJoin = tpl({
    id: 'u6s2-join', sub: 'u6s2', style: 'A', styleName: '평균 이용하기', levels: [2, 4],
    build(r, lv) {
      const cnt = r.int(3, lv === 2 ? 4 : 6);
      const m1 = r.int(130, 150), m2 = m1 + r.pick([-2, -1, 1, 2, 3]);
      const nw = m2 * (cnt + 1) - m1 * cnt;
      if (nw < 120 || nw > 170) return null;
      return {
        text: `어느 모둠 ${cnt}명의 키의 평균은 ${m1} cm예요. 새로운 친구 한 명이 모둠에 들어왔더니 키의 평균이 ${m2} cm가 되었어요.\n새로 들어온 친구의 키는 몇 cm인가요?`,
        answer: { type: 'num', value: String(nw), unit: 'cm' },
        patterns: [
          { value: String(m2), cause: 'concept', msg: '새 평균이 새 친구의 키는 아니에요. 전체 합의 차이를 구해요.' },
          { value: String(Math.abs(m2 - m1)), cause: 'concept', msg: '평균의 차이가 아니라 합의 차이를 구해요.' },
        ],
        hints: [`처음 ${cnt}명의 키의 합과 새로 ${cnt + 1}명의 키의 합을 각각 구해요.`, `처음 합: ${m1} × ${cnt} = ${m1 * cnt}, 나중 합: ${m2} × ${cnt + 1} = ${m2 * (cnt + 1)}`, `${m2 * (cnt + 1)} - ${m1 * cnt} = ${nw}(cm)`],
        solution: [`${m2} × ${cnt + 1} - ${m1} × ${cnt} = ${m2 * (cnt + 1)} - ${m1 * cnt} = ${nw}(cm)`],
        key: `u6s2-join|${cnt}|${m1}|${m2}`,
        data: { cnt, m1, m2 },
      };
    },
    verify(p) { const { cnt, m1, m2 } = p.data; return close((m1 * cnt + num(p.answer.value)) / (cnt + 1), m2); },
  });

  const tCompare = tpl({
    id: 'u6s2-compare', sub: 'u6s2', style: 'A', styleName: '평균으로 비교하기', levels: [1, 4],
    build(r, lv) {
      // 가: 사람 수가 많아서 합은 크지만 평균은 작게 (또는 반대)
      const na = r.int(4, 6), nb = r.int(2, na - 1);
      const ma = r.int(20, 40), mb = ma + r.pick([-3, -2, 2, 3, 4]);
      const A = dataWithMean(r, na, ma - 8, ma + 8, 1, ma), B = dataWithMean(r, nb, mb - 8, mb + 8, 1, mb);
      if (!A || !B || A.mean !== ma || B.mean !== mb) return null;
      const better = mb > ma ? '나 모둠' : '가 모둠';
      const byTotal = sum(A.vals) > sum(B.vals) ? '가 모둠' : '나 모둠';
      if (better === byTotal) return null;
      return {
        text: '두 모둠의 단체 줄넘기 기록이에요. 평균 기록이 더 좋은 모둠은 어느 모둠인가요?',
        figure: { type: 'table', title: '단체 줄넘기 기록 (번)', head: ['모둠', '기록'], rows: [['가 모둠', A.vals.join(', ')], ['나 모둠', B.vals.join(', ')]] },
        answer: { type: 'choice', options: ['가 모둠', '나 모둠', '두 모둠이 같아요'].map((t) => Object.assign({ text: t, correct: t === better }, t === better ? {} : { pattern: t === byTotal ? { cause: 'concept', msg: '모둠의 사람 수가 달라서 합으로 비교하면 안 돼요. 평균으로 비교해요.' } : { cause: 'calc', msg: '두 모둠의 평균을 각각 구해서 비교해요.' } })) },
        keepOrder: true,
        hints: ['사람 수가 다를 때는 합이 아니라 평균으로 비교해요.', `가 모둠: ${sum(A.vals)} ÷ ${na} = ${ma}`, `나 모둠: ${sum(B.vals)} ÷ ${nb} = ${mb} → ${j(better, '이에요/예요')}`],
        solution: [`가 모둠 평균: ${sum(A.vals)} ÷ ${na} = ${ma}`, `나 모둠 평균: ${sum(B.vals)} ÷ ${nb} = ${mb}`],
        key: `u6s2-compare|${A.vals.join(',')}|${B.vals.join(',')}`,
        data: { A: A.vals, B: B.vals },
      };
    },
    verify(p) { const a = sum(p.data.A) / p.data.A.length, b = sum(p.data.B) / p.data.B.length; return p.answer.options[p.answer.value].text === (a > b ? '가 모둠' : b > a ? '나 모둠' : '두 모둠이 같아요'); },
  });

  // 퍼즐: 조건 여러 개로 수 맞히기
  const tPuzzle = tpl({
    id: 'u6s2-puzzle', sub: 'u6s2', style: 'B', styleName: '퍼즐', levels: [2, 4],
    build(r, lv) {
      const m = r.int(10, 40), half = r.int(2, lv === 4 ? 12 : 6);
      const small = m - half, big = m + half;
      if (small < 1) return null;
      return {
        text: `세 수가 있어요. 다음 조건을 모두 만족하는 가장 작은 수를 구하세요.\n· 세 수의 평균은 ${j(m, '이에요/예요')}.\n· 가운데 수는 ${j(m, '이에요/예요')}.\n· 가장 큰 수는 가장 작은 수보다 ${half * 2} 커요.`,
        answer: { type: 'num', value: String(small) },
        patterns: [
          { value: String(m - half * 2), cause: 'condition', msg: '가장 큰 수와 가장 작은 수의 차이가 반씩 나뉘어요. 평균에서 그 반만큼 작아요.' },
          { value: String(big), cause: 'condition', msg: '가장 작은 수를 물었어요.' },
          { value: String(m), cause: 'concept', soft: true, msg: '가운데 수가 아니라 가장 작은 수를 구해요.' },
        ].filter((pt) => Number(pt.value) > 0),
        hints: [`${COND} 세 수의 합은 ${m} × 3 = ${j(m * 3, '이에요/예요')}.`, `가운데 수를 빼면 나머지 두 수의 합은 ${m * 3} - ${m} = ${j(m * 2, '이에요/예요')}. 두 수의 차이는 ${j(half * 2, '이에요/예요')}.`, `가장 작은 수 + 가장 큰 수 = ${m * 2}, 차이 ${half * 2} → ${j(small, '와/과')} ${big}`],
        solution: [`세 수: ${small}, ${m}, ${big} (평균 ${m})`],
        key: `u6s2-puzzle|${m}|${half}`,
        data: { m, d: half * 2 },
      };
    },
    verify(p) { const { m, d } = p.data; const s = num(p.answer.value); return close((s + m + s + d) / 3, m); },
  });

  // 거꾸로 문제: 평균이 m인 자료 고르기
  const tReverse = tpl({
    id: 'u6s2-reverse', sub: 'u6s2', style: 'B', styleName: '거꾸로 문제', levels: [1, 4],
    build(r, lv) {
      const cnt = lv <= 2 ? 3 : 4;
      const m = r.int(5, 30);
      const right = dataWithMean(r, cnt, Math.max(1, m - 6), m + 6, 1, m);
      if (!right || right.mean !== m) return null;
      const off = [1, -1, 2].map((k) => { const v = right.vals.slice(); v[r.int(0, cnt - 1)] += k * cnt; return v; });
      const sets = [right.vals, ...off];
      const texts = sets.map((v) => v.join(', '));
      if (new Set(texts).size < 4 || sets.some((v) => v.some((x) => x <= 0))) return null;
      return {
        text: `평균이 ${m}인 자료를 고르세요.`,
        answer: { type: 'choice', options: sets.map((v, i) => Object.assign({ text: v.join(',  '), correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'calc', msg: `이 자료의 평균은 ${j(n(String(sum(v) / cnt)), '이에요/예요')}. 모두 더해서 ${j(cnt, '으로/로')} 나눠 봐요.` } })) },
        hints: [`평균이 ${m}이면 자료 ${cnt}개의 합은 ${m} × ${cnt} = ${m * cnt}이에요.`, '보기마다 자료를 모두 더해 봐요.', `${right.vals.join(' + ')} = ${m * cnt} → ${m * cnt} ÷ ${cnt} = ${m}`],
        solution: [`${right.vals.join(' + ')} = ${m * cnt}, ${m * cnt} ÷ ${cnt} = ${m}`],
        key: `u6s2-reverse|${texts.join('/')}`,
        data: { m },
      };
    },
    verify(p) { const v = p.answer.options[p.answer.value].text.split(',').map(Number); return close(sum(v) / v.length, p.data.m) && p.answer.options.filter((o) => { const w = o.text.split(',').map(Number); return close(sum(w) / w.length, p.data.m); }).length === 1; },
  });

  const U6S2 = [tMissing, tBarMissing, tTarget, tTotal, tJoin, tCompare, tPuzzle, tReverse, tOX('u6s2')];

  // ======================================================================
  // 소단원 3·4: 가능성
  // ======================================================================
  const WORDS = ['불가능하다', '~아닐 것 같다', '반반이다', '~일 것 같다', '확실하다'];
  const wordOf = (num, den) => (num === 0 ? 0 : num === den ? 4 : num * 2 === den ? 2 : num * 2 < den ? 1 : 3);
  const P_TEXT = ['0', '⟪1/2⟫', '1'];
  const COLORS = { red: '빨간', blue: '파란', yellow: '노란', green: '초록', white: '흰' };

  // 가능성이 0, 1/2, 1인 일 (주사위·동전·카드·생활)
  function event(r) {
    const k = r.int(0, 8);
    if (k === 0) return { text: `주사위를 한 번 굴릴 때 눈의 수가 ${r.int(7, 9)}이 나올 가능성`, p: 0, why: '주사위 눈은 1부터 6까지라서 나올 수 없어요.' };
    if (k === 1) return { text: '주사위를 한 번 굴릴 때 눈의 수가 6 이하로 나올 가능성', p: 2, why: '주사위 눈은 모두 6 이하라서 반드시 나와요.' };
    if (k === 2) { const ev = r.pick(['짝수', '홀수']); return { text: `주사위를 한 번 굴릴 때 눈의 수가 ${ev}로 나올 가능성`, p: 1, why: `6가지 중 ${ev}가 3가지라서 반반이에요.` }; }
    if (k === 3) { const f = r.pick(['그림 면', '숫자 면']); return { text: `동전을 한 번 던질 때 ${f}이 나올 가능성`, p: 1, why: '그림 면과 숫자 면 두 가지가 똑같이 나올 수 있어서 반반이에요.' }; }
    if (k === 4) { const m = r.int(2, 5) * 2; return { text: `1부터 ${m}까지의 수 카드 ${m}장 중 한 장을 뽑을 때 ${r.pick(['홀수', '짝수'])}가 나올 가능성`, p: 1, why: `${m}장 중 절반인 ${m / 2}장이라서 반반이에요.` }; }
    if (k === 5) { const m = r.int(5, 10); return { text: `1부터 ${m}까지의 수 카드 ${m}장 중 한 장을 뽑을 때 ${m}보다 큰 수가 나올 가능성`, p: 0, why: `${m}보다 큰 수 카드는 없어서 불가능해요.` }; }
    if (k === 6) return { text: '12월 다음 달이 1월일 가능성', p: 2, why: '12월 다음에는 항상 1월이 와서 확실해요.' };
    if (k === 7) { const c = r.pick(['red', 'blue', 'yellow']); return { text: `${COLORS[c]} 구슬만 ${r.int(3, 9)}개 들어 있는 주머니에서 구슬 하나를 꺼낼 때 ${COLORS[c]} 구슬일 가능성`, p: 2, why: `${COLORS[c]} 구슬만 있어서 확실해요.` }; }
    const c = r.pick(['red', 'blue']), o = c === 'red' ? 'yellow' : 'green';
    return { text: `${COLORS[c]} 구슬만 ${r.int(3, 9)}개 들어 있는 주머니에서 구슬 하나를 꺼낼 때 ${COLORS[o]} 구슬일 가능성`, p: 0, why: `${COLORS[o]} 구슬은 없어서 불가능해요.` };
  }
  const p3 = (correct, why) => P_TEXT.map((t, i) => Object.assign({ text: t, correct: i === correct }, i === correct ? {} : { pattern: { cause: 'concept', msg: why } }));

  const tEventNum = tpl({
    id: 'u6s3-event', sub: 'u6s3', style: 'A', styleName: '가능성을 수로', levels: [1, 4],
    build(r) {
      const e = event(r);
      return {
        text: `다음 일이 일어날 가능성을 수로 나타내면 얼마인가요?\n${e.text}`,
        answer: { type: 'choice', options: p3(e.p, `${e.why} 불가능하면 0, 반반이면 ⟪1/2⟫, 확실하면 1이에요.`) },
        keepOrder: true,
        hints: ['불가능하다 → 0, 반반이다 → ⟪1/2⟫, 확실하다 → 1', '일어날 수 있는 경우를 모두 떠올려 보고, 그중 이 일이 몇 가지인지 봐요.', `${e.why} → ${P_TEXT[e.p]}`],
        solution: [`${e.why} → ${P_TEXT[e.p]}`],
        key: `u6s3-event|${e.text}`,
        data: { p: e.p },
      };
    },
    verify(p) { return p.answer.value === p.data.p; },
  });

  const tSpin = tpl({
    id: 'u6s3-spin', sub: 'u6s3', style: 'A', styleName: '회전판', levels: [1, 4],
    build(r) {
      const cnt = r.pick([2, 4, 6, 8]);
      const kind = r.int(0, 2);
      const target = r.pick(['red', 'blue']);
      const other = target === 'red' ? 'yellow' : 'green';
      const k = kind === 0 ? 0 : kind === 1 ? cnt / 2 : cnt;
      const sectors = r.shuffle([...Array(k).fill(target), ...Array(cnt - k).fill(other)]);
      // 반반은 번갈아 칠한 모양으로
      const sec = kind === 1 && r.chance(0.5) ? sectors.map((_, i) => (i % 2 ? target : other)) : sectors;
      const why = kind === 0 ? `${COLORS[target]}색 칸이 없어서 불가능해요.` : kind === 1 ? `${cnt}칸 중 ${cnt / 2}칸이 ${COLORS[target]}색이라서 반반이에요.` : `모든 칸이 ${COLORS[target]}색이라서 확실해요.`;
      return {
        text: `회전판을 돌릴 때, 화살이 ${COLORS[target]}색에 멈출 가능성을 수로 나타내면 얼마인가요?`,
        figure: { type: 'spinner', sectors: sec },
        answer: { type: 'choice', options: p3(kind, `${why} 회전판에서 ${COLORS[target]}색 칸이 몇 칸인지 세어 봐요.`) },
        keepOrder: true,
        hints: [`회전판의 칸 수와 ${COLORS[target]}색 칸 수를 세어 봐요.`, '불가능하다 → 0, 반반이다 → ⟪1/2⟫, 확실하다 → 1', `${why} → ${P_TEXT[kind]}`],
        solution: [`${why} → ${P_TEXT[kind]}`],
        key: `u6s3-spin|${target}|${sec.join(',')}`,
        data: { sec, target },
      };
    },
    verify(p) {
      const k = p.data.sec.filter((c) => c === p.data.target).length, nn = p.data.sec.length;
      return p.answer.value === (k === 0 ? 0 : k === nn ? 2 : k * 2 === nn ? 1 : -1);
    },
  });

  const tBag = tpl({
    id: 'u6s3-bag', sub: 'u6s3', style: 'A', styleName: '구슬 주머니', levels: [1, 4],
    build(r) {
      const a = r.pick(['red', 'blue']), b = a === 'red' ? 'yellow' : 'green';
      const kind = r.int(0, 2);
      const m = r.int(2, 5);
      const balls = kind === 0 ? [{ color: b, n: m * 2 }] : kind === 1 ? [{ color: a, n: m }, { color: b, n: m }] : [{ color: a, n: m * 2 }];
      const why = kind === 0 ? `${COLORS[a]} 구슬이 없어서 불가능해요.` : kind === 1 ? `${COLORS[a]} 구슬과 ${COLORS[b]} 구슬의 수가 같아서 반반이에요.` : `${COLORS[a]} 구슬만 있어서 확실해요.`;
      return {
        text: `주머니에서 구슬 하나를 꺼낼 때, ${COLORS[a]} 구슬일 가능성을 수로 나타내면 얼마인가요?`,
        figure: { type: 'bag', balls },
        answer: { type: 'choice', options: p3(kind, `${why} 주머니에 든 구슬의 색과 수를 확인해요.`) },
        keepOrder: true,
        hints: [`주머니에 ${COLORS[a]} 구슬이 몇 개, 다른 구슬이 몇 개인지 봐요.`, '불가능하다 → 0, 반반이다 → ⟪1/2⟫, 확실하다 → 1', `${why} → ${P_TEXT[kind]}`],
        solution: [`${why} → ${P_TEXT[kind]}`],
        key: `u6s3-bag|${a}|${JSON.stringify(balls)}`,
        data: { balls, a },
      };
    },
    verify(p) {
      const k = p.data.balls.filter((x) => x.color === p.data.a).reduce((s, x) => s + x.n, 0), nn = p.data.balls.reduce((s, x) => s + x.n, 0);
      return p.answer.value === (k === 0 ? 0 : k === nn ? 2 : k * 2 === nn ? 1 : -1);
    },
  });

  const tCompareEv = tpl({
    id: 'u6s3-most', sub: 'u6s3', style: 'A', styleName: '가능성 비교', levels: [1, 4],
    build(r) {
      const evs = [];
      for (let t = 0; t < 40 && evs.length < 3; t++) { const e = event(r); if (!evs.some((x) => x.p === e.p)) evs.push(e); }
      if (evs.length < 3) return null;
      const big = r.chance(0.5);
      const pick = evs.reduce((a, b) => ((big ? b.p > a.p : b.p < a.p) ? b : a));
      return {
        text: `일이 일어날 가능성이 가장 ${big ? '큰' : '작은'} 것을 고르세요.`,
        answer: { type: 'choice', options: evs.map((e) => Object.assign({ text: e.text, correct: e === pick }, e === pick ? {} : { pattern: { cause: 'concept', msg: `이 일의 가능성은 ${j(P_TEXT[e.p], '이에요/예요')}. ${e.why}` } })) },
        keepOrder: true,
        hints: ['보기마다 가능성을 0, ⟪1/2⟫, 1 중 하나로 나타내 봐요.', evs.map((e) => `${P_TEXT[e.p]}`).join(', '), `${pick.why} → ${P_TEXT[pick.p]}`],
        solution: evs.map((e) => `${e.text}: ${P_TEXT[e.p]}`),
        key: `u6s3-most|${big}|${evs.map((e) => e.text).join('/')}`,
        data: { ps: evs.map((e) => e.p), big },
      };
    },
    verify(p) {
      const best = p.data.big ? Math.max(...p.data.ps) : Math.min(...p.data.ps);
      return p.data.ps.filter((x) => x === best).length === 1 && p.data.ps[p.answer.value] === best;
    },
  });

  const tWordNum = tpl({
    id: 'u6s3-word', sub: 'u6s3', style: 'B', styleName: '말과 수', levels: [1, 4],
    build(r) {
      const toNum = r.chance(0.5);
      const i = r.pick([0, 2, 4]);
      const idx = i / 2;
      if (toNum) {
        return {
          text: `일이 일어날 가능성이 '${WORDS[i]}'일 때, 이것을 수로 나타내면 얼마인가요?`,
          answer: { type: 'choice', options: p3(idx, '불가능하다 → 0, 반반이다 → ⟪1/2⟫, 확실하다 → 1이에요.') },
          keepOrder: true,
          hints: ['가능성은 0부터 1까지의 수로 나타내요.', '불가능하다는 가장 작은 수, 확실하다는 가장 큰 수예요.', `${WORDS[i]} → ${P_TEXT[idx]}`],
          solution: [`${WORDS[i]} → ${P_TEXT[idx]}`],
          key: `u6s3-word|num|${i}`,
          data: { i, toNum },
        };
      }
      return {
        text: `일이 일어날 가능성을 수로 나타냈더니 ${j(P_TEXT[idx], '이에요/예요')}. 이것을 말로 나타내면 어떤 말이 알맞은가요?`,
        answer: { type: 'choice', options: WORDS.map((w, k) => Object.assign({ text: w, correct: k === i }, k === i ? {} : { pattern: { cause: 'concept', msg: '0 → 불가능하다, ⟪1/2⟫ → 반반이다, 1 → 확실하다예요.' } })) },
        keepOrder: true,
        hints: ['가능성은 0부터 1까지의 수로 나타내요.', '0은 일어날 수 없는 일, 1은 반드시 일어나는 일이에요.', `${P_TEXT[idx]} → ${WORDS[i]}`],
        solution: [`${P_TEXT[idx]} → ${WORDS[i]}`],
        key: `u6s3-word|word|${i}`,
        data: { i, toNum },
      };
    },
    verify(p) { const { i, toNum } = p.data; return toNum ? p.answer.value === i / 2 : p.answer.options[p.answer.value].text === WORDS[i]; },
  });

  // 표 읽기: 주머니 여러 개 중 고르기
  const tBagTable = tpl({
    id: 'u6s3-table', sub: 'u6s3', style: 'B', styleName: '표·그래프 읽기', levels: [1, 4],
    build(r) {
      const want = r.int(0, 2);
      const names = ['가', '나', '다'];
      const kinds = r.shuffle([0, 1, 2]);
      const rows = kinds.map((k, i) => { const m = r.int(2, 6); return { name: `${names[i]} 주머니`, red: k === 0 ? 0 : k === 1 ? m : m * 2, blue: k === 0 ? m * 2 : k === 1 ? m : 0, k }; });
      const right = rows.find((x) => x.k === want);
      return {
        text: `빨간 구슬과 파란 구슬이 들어 있는 주머니 3개가 있어요. 구슬 하나를 꺼낼 때, 빨간 구슬일 가능성이 ${P_TEXT[want]}인 주머니를 고르세요.`,
        figure: { type: 'table', title: '주머니 속 구슬 수', head: ['주머니', '빨간 구슬', '파란 구슬'], rows: rows.map((x) => [x.name, `${x.red}개`, `${x.blue}개`]) },
        answer: { type: 'choice', options: rows.map((x) => Object.assign({ text: x.name, correct: x === right }, x === right ? {} : { pattern: { cause: 'concept', msg: `${x.name}에서 빨간 구슬일 가능성은 ${j(P_TEXT[x.k], '이에요/예요')}.` } })) },
        keepOrder: true,
        hints: ['표에서 주머니마다 빨간 구슬과 파란 구슬의 수를 비교해요.', '빨간 구슬이 없으면 0, 두 색의 수가 같으면 ⟪1/2⟫, 빨간 구슬만 있으면 1이에요.', `${right.name}: 빨간 구슬 ${right.red}개, 파란 구슬 ${right.blue}개 → ${P_TEXT[want]}`],
        solution: rows.map((x) => `${x.name}: ${P_TEXT[x.k]}`),
        key: `u6s3-table|${want}|${rows.map((x) => x.red + '-' + x.blue).join(',')}`,
        data: { rows: rows.map((x) => [x.red, x.blue]), want },
      };
    },
    verify(p) {
      const [red, blue] = p.data.rows[p.answer.value];
      const k = red === 0 ? 0 : blue === 0 ? 2 : red === blue ? 1 : -1;
      return k === p.data.want;
    },
  });

  const U6S3 = [tEventNum, tSpin, tBag, tCompareEv, tWordNum, tBagTable, tOX('u6s3'),
    TB.lineFind({
      id: 'u6s3-line', unit: 6, sub: 'u6s3', levels: [1, 4],
      gen(r) {
        const red = r.int(1, 4), blue = red;
        return {
          problem: `"빨간 구슬 ${red}개, 파란 구슬 ${blue}개가 든 주머니에서 구슬 하나를 꺼낼 때 빨간 구슬일 가능성"을`,
          verb: '생각한',
          lines: [`① 구슬은 모두 ${red + blue}개예요.`, `② 빨간 구슬과 파란 구슬의 수가 같아요.`, '③ 그래서 가능성은 "반반이다"예요.', '④ 수로 나타내면 ⟪1/2⟫이에요.'],
          bad: r.chance(0.5)
            ? { i: 2, line: '③ 그래서 가능성은 "확실하다"예요.', msg: '두 색의 수가 같으면 "반반이다"예요. 빨간 구슬만 있을 때 "확실하다"예요.' }
            : { i: 3, line: '④ 수로 나타내면 1이에요.', msg: '"반반이다"를 수로 나타내면 ⟪1/2⟫이에요. 1은 "확실하다"예요.' },
          after: [],
          key: `${red}`,
        };
      },
    })];

  // 소단원 4: 가능성 예상하고 판단하기
  const tBagWord = tpl({
    id: 'u6s4-bag', sub: 'u6s4', style: 'A', styleName: '가능성을 말로', levels: [1, 4],
    build(r) {
      const total = r.pick([4, 6, 8, 10]);
      const red = r.int(0, total);
      const w = wordOf(red, total);
      const balls = [{ color: 'red', n: red }, { color: 'blue', n: total - red }].filter((b) => b.n > 0);
      const why = `${total}개 중 빨간 구슬이 ${red}개예요.`;
      return {
        text: '주머니에서 구슬 하나를 꺼낼 때, 빨간 구슬이 나올 가능성을 말로 나타내면 어떤 말이 알맞은가요?',
        figure: { type: 'bag', balls },
        answer: { type: 'choice', options: WORDS.map((t, k) => Object.assign({ text: t, correct: k === w }, k === w ? {} : { pattern: { cause: 'concept', msg: `${why} 절반보다 많으면 "~일 것 같다", 절반이면 "반반이다", 절반보다 적으면 "~아닐 것 같다"예요.` } })) },
        keepOrder: true,
        hints: ['빨간 구슬이 전체의 절반보다 많은지, 같은지, 적은지 비교해요.', `${why} 절반은 ${total / 2}개예요.`, `→ ${WORDS[w]}`],
        solution: [`${why} → ${WORDS[w]}`],
        key: `u6s4-bag|${red}|${total}`,
        data: { red, total },
      };
    },
    verify(p) { return p.answer.options[p.answer.value].text === WORDS[wordOf(p.data.red, p.data.total)]; },
  });

  const tSpinWord = tpl({
    id: 'u6s4-spin', sub: 'u6s4', style: 'A', styleName: '회전판', levels: [1, 4],
    build(r) {
      const cnt = r.pick([4, 6, 8]);
      const k = r.int(0, cnt);
      const sec = r.shuffle([...Array(k).fill('red'), ...Array(cnt - k).fill('blue')]);
      const w = wordOf(k, cnt);
      return {
        text: '회전판을 돌릴 때, 화살이 빨간색에 멈출 가능성을 말로 나타내면 어떤 말이 알맞은가요?',
        figure: { type: 'spinner', sectors: sec },
        answer: { type: 'choice', options: WORDS.map((t, i) => Object.assign({ text: t, correct: i === w }, i === w ? {} : { pattern: { cause: 'concept', msg: `${cnt}칸 중 빨간색은 ${k}칸이에요. 절반(${cnt / 2}칸)과 비교해 봐요.` } })) },
        keepOrder: true,
        hints: ['빨간색 칸이 몇 칸인지 세어 봐요.', `${cnt}칸 중 빨간색 ${k}칸, 절반은 ${cnt / 2}칸이에요.`, `→ ${WORDS[w]}`],
        solution: [`${cnt}칸 중 빨간색 ${k}칸 → ${WORDS[w]}`],
        key: `u6s4-spin|${sec.join(',')}`,
        data: { sec },
      };
    },
    verify(p) { const k = p.data.sec.filter((c) => c === 'red').length; return p.answer.options[p.answer.value].text === WORDS[wordOf(k, p.data.sec.length)]; },
  });

  const LIFE = [
    ['내일 아침 해가 서쪽에서 뜰 가능성', 0, '해는 항상 동쪽에서 떠요.'],
    ['12월 31일 다음 날이 1월 1일일 가능성', 4, '날짜는 언제나 이렇게 이어져요.'],
    ['동전을 한 번 던질 때 그림 면이 나올 가능성', 2, '그림 면과 숫자 면 두 가지 중 하나예요.'],
    ['주사위를 한 번 굴릴 때 1이 나올 가능성', 1, '6가지 중 1가지라서 절반보다 훨씬 적어요.'],
    ['주사위를 한 번 굴릴 때 2 이상이 나올 가능성', 3, '6가지 중 5가지라서 절반보다 많아요.'],
    ['1부터 10까지의 수 카드 중 한 장을 뽑을 때 10이 나올 가능성', 1, '10장 중 1장이라서 절반보다 적어요.'],
    ['1부터 10까지의 수 카드 중 한 장을 뽑을 때 10 이하인 수가 나올 가능성', 4, '모든 카드가 10 이하예요.'],
    ['1부터 10까지의 수 카드 중 한 장을 뽑을 때 3 이상인 수가 나올 가능성', 3, '10장 중 8장이라서 절반보다 많아요.'],
    ['1부터 10까지의 수 카드 중 한 장을 뽑을 때 짝수가 나올 가능성', 2, '10장 중 짝수가 5장이라서 절반이에요.'],
    ['1부터 6까지의 수 카드 중 한 장을 뽑을 때 7이 나올 가능성', 0, '7이 적힌 카드가 없어요.'],
  ];
  const tLifeWord = tpl({
    id: 'u6s4-life', sub: 'u6s4', style: 'B', styleName: '생활 속 상황', levels: [1, 4],
    build(r) {
      const i = r.int(0, LIFE.length - 1);
      const [s, w, why] = LIFE[i];
      return {
        text: `다음 일이 일어날 가능성을 말로 나타내면 어떤 말이 알맞은가요?\n${s}`,
        answer: { type: 'choice', options: WORDS.map((t, k) => Object.assign({ text: t, correct: k === w }, k === w ? {} : { pattern: { cause: 'concept', msg: why } })) },
        keepOrder: true,
        hints: ['일어날 수 있는 경우를 모두 떠올려 봐요.', why, `→ ${WORDS[w]}`],
        solution: [`${why} → ${WORDS[w]}`],
        key: `u6s4-life|${i}`,
        data: { i },
      };
    },
    verify(p) { return p.answer.options[p.answer.value].text === WORDS[LIFE[p.data.i][1]]; },
  });

  const tWhichBag = tpl({
    id: 'u6s4-order', sub: 'u6s4', style: 'A', styleName: '가능성 비교', levels: [1, 4],
    build(r) {
      const total = r.pick([6, 8, 10]);
      const reds = r.sample(Array.from({ length: total + 1 }, (_, i) => i), 3);
      const big = r.chance(0.5);
      const pick = big ? Math.max(...reds) : Math.min(...reds);
      const byBlue = big ? Math.min(...reds) : Math.max(...reds);
      const names = ['가', '나', '다'];
      return {
        text: `구슬이 ${total}개씩 들어 있는 주머니 3개가 있어요. 구슬 하나를 꺼낼 때, 빨간 구슬이 나올 가능성이 가장 ${big ? '큰' : '작은'} 주머니를 고르세요.`,
        figure: { type: 'table', title: '주머니 속 구슬 수', head: ['주머니', '빨간 구슬', '파란 구슬'], rows: reds.map((x, i) => [`${names[i]} 주머니`, `${x}개`, `${total - x}개`]) },
        answer: { type: 'choice', options: reds.map((x, i) => Object.assign({ text: `${names[i]} 주머니`, correct: x === pick }, x === pick ? {} : { pattern: x === byBlue ? { cause: 'condition', msg: '빨간 구슬이 나올 가능성을 물었어요. 파란 구슬 수와 헷갈렸어요.' } : { cause: 'concept', msg: '구슬 수가 같을 때는 빨간 구슬이 많을수록 가능성이 커요.' } })) },
        keepOrder: true,
        hints: ['주머니마다 전체 구슬 수가 같아요. 빨간 구슬 수만 비교하면 돼요.', `빨간 구슬: ${reds.map((x, i) => `${names[i]} ${x}개`).join(', ')}`, `빨간 구슬이 가장 ${big ? '많은' : '적은'} 주머니 → ${names[reds.indexOf(pick)]} 주머니`],
        solution: [`빨간 구슬이 가장 ${big ? '많은' : '적은'} ${names[reds.indexOf(pick)]} 주머니`],
        key: `u6s4-order|${total}|${reds.join(',')}|${big}`,
        data: { reds, big },
      };
    },
    verify(p) { const { reds, big } = p.data; const best = big ? Math.max(...reds) : Math.min(...reds); return reds[p.answer.value] === best; },
  });

  // 거꾸로: 가능성이 '~'가 되도록 색칠한 회전판 고르기
  const tSpinPick = tpl({
    id: 'u6s4-spinpick', sub: 'u6s4', style: 'B', styleName: '거꾸로 문제', levels: [1, 4],
    build(r) {
      const cnt = 4;
      const want = r.int(0, 4);
      const ks = r.shuffle([0, 1, 2, 3, 4].filter((k) => k !== want)).slice(0, 3);
      ks.push(want);
      const opts = r.shuffle(ks).map((k) => ({ key: String(k), figure: { type: 'spinner', sectors: Array.from({ length: cnt }, (_, i) => (i < k ? 'red' : 'blue')) }, correct: k === want, pattern: k === want ? undefined : { cause: 'concept', msg: `이 회전판은 4칸 중 빨간색이 ${k}칸이라서 ${j(`'${WORDS[k]}'`, '이에요/예요')}.` } }));
      opts.forEach((o) => { if (!o.pattern) delete o.pattern; });
      return {
        text: `화살이 빨간색에 멈출 가능성이 ${j(`'${WORDS[want]}'`, '이/가')} 되도록 색칠한 회전판을 고르세요.`,
        answer: { type: 'choice', options: opts },
        keepOrder: true,
        hints: ['회전판마다 빨간색 칸이 몇 칸인지 세어 봐요.', '4칸 중 0칸 → 불가능하다, 1칸 → ~아닐 것 같다, 2칸 → 반반이다, 3칸 → ~일 것 같다, 4칸 → 확실하다', `빨간색 ${want}칸인 회전판`],
        solution: [`4칸 중 빨간색 ${want}칸 → ${WORDS[want]}`],
        key: `u6s4-spinpick|${want}|${ks.join(',')}`,
        data: { want },
      };
    },
    verify(p) { const o = p.answer.options[p.answer.value]; return o.figure.sectors.filter((c) => c === 'red').length === p.data.want; },
  });

  const tRange = tpl({
    id: 'u6s4-range', sub: 'u6s4', style: 'B', styleName: '말과 수', levels: [1, 4],
    build(r) {
      const i = r.pick([1, 3]);
      if (r.chance(0.5)) {
        // 수 범위 → 말
        const lowSide = i === 1;
        return {
          text: `일이 일어날 가능성을 수로 나타냈더니 ${lowSide ? '0보다 크고 ⟪1/2⟫보다 작은' : '⟪1/2⟫보다 크고 1보다 작은'} 수였어요. 이 가능성을 말로 나타내면 어떤 말이 알맞은가요?`,
          answer: { type: 'choice', options: WORDS.map((t, k) => Object.assign({ text: t, correct: k === i }, k === i ? {} : { pattern: { cause: 'concept', msg: `0은 불가능하다, ⟪1/2⟫은 반반이다, 1은 확실하다예요. 그 사이의 수는 반반보다 ${lowSide ? '작은' : '큰'} 가능성이에요.` } })) },
          keepOrder: true,
          hints: ['0 → 불가능하다, ⟪1/2⟫ → 반반이다, 1 → 확실하다', `반반(⟪1/2⟫)보다 ${lowSide ? '작고' : '크고'}, ${lowSide ? '불가능(0)보다는 커요' : '확실(1)보다는 작아요'}.`, `→ ${WORDS[i]}`],
          solution: [`→ ${WORDS[i]}`],
          key: `u6s4-range|toWord|${i}`,
          data: { i, right: i, toWord: true },
        };
      }
      const opts = ['0과 ⟪1/2⟫ 사이의 수', '⟪1/2⟫과 1 사이의 수', '1보다 큰 수', '0보다 작은 수'];
      const right = i === 1 ? 0 : 1;
      return {
        text: `일이 일어날 가능성이 '${WORDS[i]}'일 때, 이것을 수로 나타내면 어느 범위에 있나요?`,
        answer: { type: 'choice', options: opts.map((t, k) => Object.assign({ text: t, correct: k === right }, k === right ? {} : { pattern: { cause: 'concept', msg: k >= 2 ? '가능성은 0부터 1까지의 수로만 나타내요.' : `'${WORDS[i]}'는 반반(⟪1/2⟫)보다 ${i === 1 ? '작아요' : '커요'}.` } })) },
        keepOrder: true,
        hints: ['가능성은 0부터 1까지의 수로 나타내요. 반반은 ⟪1/2⟫이에요.', `'${WORDS[i]}'는 반반보다 ${i === 1 ? '작은' : '큰'} 가능성이에요.`, `→ ${opts[right]}`],
        solution: [`${WORDS[i]} → ${opts[right]}`],
        key: `u6s4-range|${i}`,
        data: { i, right },
      };
    },
    verify(p) { return p.answer.value === p.data.right; },
  });

  // 틀린 줄 찾기: 주머니 속 구슬로 가능성 판단하기
  const tLine4 = TB.lineFind({
    id: 'u6s4-line', unit: 6, sub: 'u6s4', levels: [1, 4],
    gen(r) {
      const total = r.pick([4, 6, 8, 10, 12]);
      let red = r.int(1, total - 1);
      if (red * 2 === total) red = r.chance(0.5) ? red - 1 : red + 1;
      const w = wordOf(red, total);
      const lines = [`① 구슬은 모두 ${total}개, 그중 빨간 구슬은 ${red}개예요.`, `② 전체의 절반은 ${total / 2}개예요.`, `③ 빨간 구슬이 절반보다 ${red * 2 > total ? '많아요' : '적어요'}.`, `④ 그래서 가능성은 '${WORDS[w]}'예요.`];
      const k = r.int(1, 3);
      let bad, after;
      if (k === 1) {
        bad = { i: 1, line: `② 전체의 절반은 ${total / 2 + 1}개예요.`, msg: `${total}의 절반은 ${total / 2}이에요.` };
        const more = red * 2 > total;
        after = [`③ 빨간 구슬이 절반보다 ${red > total / 2 + 1 ? '많아요' : red === total / 2 + 1 ? '많지 않아요' : '적어요'}.`, `④ 그래서 가능성은 '${red > total / 2 + 1 ? WORDS[3] : red === total / 2 + 1 ? WORDS[2] : WORDS[1]}'예요.`];
        if (after[1] === lines[3] && more) return null;
      } else if (k === 2) {
        bad = { i: 2, line: `③ 빨간 구슬이 절반보다 ${red * 2 > total ? '적어요' : '많아요'}.`, msg: `${red}개와 ${total / 2}개를 다시 비교해 봐요.` };
        after = [`④ 그래서 가능성은 '${WORDS[4 - w]}'예요.`];
      } else {
        bad = { i: 3, line: `④ 그래서 가능성은 '${w === 3 ? WORDS[4] : WORDS[0]}'예요.`, msg: `빨간 구슬과 파란 구슬이 둘 다 있으니까 '확실하다'나 '불가능하다'가 아니에요. 절반보다 ${red * 2 > total ? "많으면 '~일 것 같다'" : "적으면 '~아닐 것 같다'"}예요.` };
        after = [];
      }
      const blue = total - red;
      return { problem: `"빨간 구슬 ${red}개, 파란 구슬 ${blue}개가 든 주머니에서 구슬 하나를 꺼낼 때 빨간 구슬이 나올 가능성"을`, verb: '생각한', lines, bad, after, key: `${red}|${total}|${k}`, data: { red, total } };
    },
  });

  const U6S4 = [tBagWord, tSpinWord, tLifeWord, tWhichBag, tSpinPick, tRange, tOX('u6s4'), tLine4,
    tpl({
      id: 'u6s4-two', sub: 'u6s4', style: 'A', styleName: '가능성 비교', levels: [2, 4],
      build(r) {
        // 전체 수가 다른 두 주머니: 개수가 아니라 전체 중 비율로 비교
        const a = { red: r.int(1, 3), total: 0 }, b = { red: 0, total: 0 };
        a.total = a.red * 2;           // 가: 반반
        b.total = r.pick([8, 10]); b.red = r.int(1, 2); // 나: ~아닐 것 같다 (빨간 구슬 수는 적거나 비슷)
        const more = b.total - b.red; // 파란 구슬
        const pa = a.red / a.total, pb = b.red / b.total;
        if (pa <= pb) return null;
        const opts = ['가 주머니', '나 주머니', '두 주머니가 같아요'];
        return {
          text: '두 주머니 중 구슬 하나를 꺼낼 때 빨간 구슬이 나올 가능성이 더 큰 주머니를 고르세요.',
          figure: { type: 'table', title: '주머니 속 구슬 수', head: ['주머니', '빨간 구슬', '파란 구슬'], rows: [['가 주머니', `${a.red}개`, `${a.total - a.red}개`], ['나 주머니', `${b.red}개`, `${more}개`]] },
          answer: { type: 'choice', options: opts.map((t, i) => Object.assign({ text: t, correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'concept', msg: `빨간 구슬 수만 보면 안 돼요. 가 주머니는 ${a.total}개 중 ${a.red}개(반반), 나 주머니는 ${b.total}개 중 ${b.red}개(~아닐 것 같다)예요.` } })) },
          keepOrder: true,
          hints: ['전체 구슬 수가 달라요. 각 주머니에서 빨간 구슬이 전체의 절반보다 많은지 적은지 봐요.', `가: ${a.total}개 중 ${a.red}개 → 반반이다`, `나: ${b.total}개 중 ${b.red}개 → ~아닐 것 같다 → 가 주머니가 더 커요.`],
          solution: [`가: 반반이다, 나: ~아닐 것 같다 → 가 주머니`],
          key: `u6s4-two|${a.red}|${b.red}|${b.total}`,
          data: { pa, pb },
        };
      },
      verify(p) { return p.data.pa > p.data.pb && p.answer.value === 0; },
    })];

  M5.addTemplates([...U6S1, ...U6S2, ...U6S3, ...U6S4]);
})();
