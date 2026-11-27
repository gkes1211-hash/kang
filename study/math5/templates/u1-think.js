// 1단원 🧩 사고력 문제 (수의 범위와 어림하기)
//   갈래: 경우의 수 · 논리·추론 · 거꾸로 생각하기
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, D = M5.dec;
  const j = T.j;
  const think = (o) => Object.assign({ unit: 1, style: 'B', levels: [1, 4] }, o);
  const perms3 = (ds) => { const o = []; for (const a of ds) for (const b of ds) for (const c of ds) if (a !== b && b !== c && a !== c && a !== 0) o.push(a * 100 + b * 10 + c); return o; };
  const perms4 = (ds) => { const o = []; for (const a of ds) for (const b of ds) for (const c of ds) for (const d of ds) if (new Set([a, b, c, d]).size === 4 && a !== 0) o.push(a * 1000 + b * 100 + c * 10 + d); return o; };
  const inR = (v, lo, hi, incl) => (incl ? v >= lo && v <= hi : v > lo && v < hi);
  const words = (lo, hi, incl) => (incl ? `${lo} 이상 ${hi} 이하` : `${lo} 초과 ${hi} 미만`);

  // 경우의 수: 수 카드로 만든 세 자리 수 중 범위에 드는 수
  const cardRange = (sub, incl) => think({
    id: `${sub}-think-cards`, sub, styleName: '경우의 수',
    build(r) {
      const ds = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
      const all = perms3(ds).sort((a, b) => a - b);
      const lo = r.chance(0.6) ? r.pick(all) : r.int(all[0], all[5]);
      const hi = r.chance(0.6) ? r.pick(all.filter((v) => v > lo)) || lo + 50 : lo + r.int(30, 400);
      if (!hi || hi <= lo) return null;
      const ans = all.filter((v) => inR(v, lo, hi, incl)).length;
      const other = all.filter((v) => inR(v, lo, hi, !incl)).length;
      if (ans < 1) return null;
      return {
        text: `수 카드 ${ds.join(', ')}을(를) 한 번씩 모두 사용하여 세 자리 수를 만들려고 해요. 만들 수 있는 수 중에서 ${words(lo, hi, incl)}인 수는 모두 몇 개인가요?`.replace('을(를)', j(String(ds[2]), '을/를').slice(1)),
        figure: { type: 'cards', nums: ds },
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(other), cause: 'condition', msg: incl ? "'이상', '이하'는 경계의 수를 포함해요." : "'초과', '미만'은 경계의 수를 포함하지 않아요." }].filter((pt) => Number(pt.value) !== ans && Number(pt.value) > 0),
        hints: ['만들 수 있는 세 자리 수를 작은 수부터 빠짐없이 적어 봐요. 모두 6개예요.', `만들 수 있는 수: ${all.join(', ')}`, `${words(lo, hi, incl)}인 수: ${all.filter((v) => inR(v, lo, hi, incl)).join(', ')} → ${ans}개`],
        solution: [`만들 수 있는 수: ${all.join(', ')}`, `${words(lo, hi, incl)}인 수: ${all.filter((v) => inR(v, lo, hi, incl)).join(', ')}`, `모두 ${ans}개`],
        key: `${sub}-think-cards|${ds.join('')}|${lo}|${hi}`,
        data: { ds, lo, hi, incl },
      };
    },
    verify(p) { const { ds, lo, hi, incl } = p.data; return perms3(ds).filter((v) => inR(v, lo, hi, incl)).length === Number(p.answer.value); },
  });

  // 논리·추론: 단서 3개로 수 찾기
  const clue = (sub, incl) => think({
    id: `${sub}-think-clue`, sub, styleName: '논리·추론',
    build(r, lv) {
      const n = r.int(lv <= 2 ? 15 : 30, lv <= 2 ? 60 : 99);
      const k = r.int(3, 9);
      if (n % k) return null;
      const par = n % 2;
      for (let t = 0; t < 20; t++) {
        const lo = n - r.int(1, 14), hi = n + r.int(1, 14);
        const useP = r.chance(0.5);
        const cand = [];
        for (let v = lo - 1; v <= hi + 1; v++) if (inR(v, lo, hi, incl) && v % k === 0 && (!useP || v % 2 === par)) cand.push(v);
        if (cand.length !== 1 || cand[0] !== n) continue;
        const clues = [`${words(lo, hi, incl)}인 자연수예요.`, `${k}의 배수예요.`, ...(useP ? [`${par ? '홀수' : '짝수'}예요.`] : [])];
        const loose = [];
        for (let v = lo; v <= hi; v++) if (v % k === 0 && (!useP || v % 2 === par)) loose.push(v);
        return {
          text: `단서를 모두 만족하는 수를 구하세요.\n${clues.map((c) => '• ' + c).join('\n')}`,
          answer: { type: 'num', value: String(n) },
          patterns: loose.filter((v) => v !== n).map((v) => ({ value: String(v), cause: 'condition', msg: incl ? `${j(String(v), '은/는')} 범위에 들지 않아요. '이상', '이하'인지 다시 봐요.` : `${j(String(v), '은/는')} 경계의 수라서 '초과', '미만'에 들지 않아요.` })),
          hints: ['단서를 하나씩 차례로 적용해 후보를 줄여 봐요.', `범위 안에서 ${k}의 배수: ${(() => { const o = []; for (let v = lo; v <= hi; v++) if (inR(v, lo, hi, incl) && v % k === 0) o.push(v); return o.join(', '); })()}`, useP ? `그중 ${par ? '홀수' : '짝수'}: ${n}` : `단서를 모두 만족하는 수: ${n}`],
          solution: [`${words(lo, hi, incl)}에서 ${k}의 배수를 찾고${useP ? `, 그중 ${par ? '홀수' : '짝수'}를 골라요` : ''}.`, `답: ${n}`],
          key: `${sub}-think-clue|${n}|${k}|${lo}|${hi}|${useP}`,
          data: { lo, hi, k, useP, par, incl },
        };
      }
      return null;
    },
    verify(p) {
      const { lo, hi, k, useP, par, incl } = p.data;
      const c = []; for (let v = lo - 2; v <= hi + 2; v++) if (inR(v, lo, hi, incl) && v % k === 0 && (!useP || v % 2 === par)) c.push(v);
      return c.length === 1 && c[0] === Number(p.answer.value);
    },
  });

  // 경우의 수: 두 범위에 모두 드는 자연수
  const RW = [['이상', (v, a) => v >= a], ['초과', (v, a) => v > a]];
  const RW2 = [['이하', (v, b) => v <= b], ['미만', (v, b) => v < b]];
  const tBoth = think({
    id: 'u1s3-think-both', sub: 'u1s3', styleName: '경우의 수',
    build(r) {
      const a1 = r.int(10, 40), b1 = a1 + r.int(15, 40), a2 = r.int(a1 + 3, b1 - 3), b2 = b1 + r.int(5, 30);
      const w = [r.pick(RW), r.pick(RW2), r.pick(RW), r.pick(RW2)];
      const ok = (v) => w[0][1](v, a1) && w[1][1](v, b1) && w[2][1](v, a2) && w[3][1](v, b2);
      let ans = 0; for (let v = 1; v <= 200; v++) if (ok(v)) ans++;
      let loose = 0; for (let v = 1; v <= 200; v++) if (v >= a2 && v <= b1) loose++;
      if (ans < 1) return null;
      return {
        text: `두 범위에 모두 들어가는 자연수는 몇 개인가요?\n가: ${a1} ${w[0][0]} ${b1} ${w[1][0]}인 수\n나: ${a2} ${w[2][0]} ${b2} ${w[3][0]}인 수`,
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(loose), cause: 'condition', msg: "경계의 수를 넣을지 뺄지 다시 봐요. '초과', '미만'은 경계의 수를 넣지 않아요." }].filter((pt) => Number(pt.value) !== ans),
        hints: ['두 범위를 수직선에 함께 그려 보면 겹치는 부분이 보여요.', `겹치는 부분은 ${a2} 근처부터 ${b1} 근처까지예요. 끝의 수가 들어가는지 하나씩 확인해요.`, `겹치는 자연수: ${(() => { const o = []; for (let v = 1; v <= 200; v++) if (ok(v)) o.push(v); return o.length > 8 ? `${o[0]}부터 ${o[o.length - 1]}까지` : o.join(', '); })()} → ${ans}개`],
        solution: [`가와 나의 범위가 겹치는 부분의 자연수를 세어요.`, `${ans}개`],
        key: `u1s3-think-both|${a1}|${b1}|${a2}|${b2}|${w.map((x) => x[0]).join('')}`,
        data: { a1, b1, a2, b2, w: w.map((x) => x[0]) },
      };
    },
    verify(p) {
      const { a1, b1, a2, b2, w } = p.data;
      const f = { 이상: (v, a) => v >= a, 초과: (v, a) => v > a, 이하: (v, b) => v <= b, 미만: (v, b) => v < b };
      let c = 0; for (let v = 1; v <= 300; v++) if (f[w[0]](v, a1) && f[w[1]](v, b1) && f[w[2]](v, a2) && f[w[3]](v, b2)) c++;
      return c === Number(p.answer.value);
    },
  });

  // 논리·추론: 두 조건을 모두 만족하는 사람 수 (표)
  const tRide = think({
    id: 'u1s3-think-ride', sub: 'u1s3', styleName: '논리·추론',
    build(r) {
      const names = r.sample(M5.words.names, 6);
      const hMin = r.int(12, 14) * 10, age = r.int(7, 10);
      const rows = names.map((nm) => ({ nm, h: hMin + r.int(-12, 12), a: age + r.int(-2, 2) }));
      const okH = (x) => x.h >= hMin, okA = (x) => x.a > age;
      const ans = rows.filter((x) => okH(x) && okA(x)).length;
      const onlyH = rows.filter(okH).length, onlyA = rows.filter(okA).length;
      if (ans < 1 || ans === 6) return null;
      return {
        text: `놀이 기구는 키가 ${hMin} cm 이상이고 나이가 ${age}살 초과인 사람만 탈 수 있어요. 표를 보고 놀이 기구를 탈 수 있는 사람은 모두 몇 명인지 구하세요.`,
        figure: { type: 'table', head: ['이름', '키(cm)', '나이(살)'], rows: rows.map((x) => [x.nm, String(x.h), String(x.a)]) },
        answer: { type: 'num', value: String(ans), unit: '명' },
        patterns: [
          { value: String(onlyH), cause: 'condition', msg: '키 조건만 봤어요. 나이 조건도 함께 만족해야 해요.' },
          { value: String(onlyA), cause: 'condition', msg: '나이 조건만 봤어요. 키 조건도 함께 만족해야 해요.' },
          { value: String(rows.filter((x) => x.h >= hMin && x.a >= age).length), cause: 'condition', msg: `'${age}살 초과'는 ${age}살을 넣지 않아요.` },
        ].filter((pt) => Number(pt.value) !== ans && Number(pt.value) > 0),
        hints: ['두 조건을 모두 만족해야 해요. 한 사람씩 키와 나이를 차례로 확인해요.', `키 ${hMin} cm 이상(같아도 돼요), 나이 ${age}살 초과(${age + 1}살부터)`, `탈 수 있는 사람: ${rows.filter((x) => okH(x) && okA(x)).map((x) => x.nm).join(', ')}`],
        solution: [`키 ${hMin} cm 이상: ${rows.filter(okH).map((x) => x.nm).join(', ')}`, `그중 나이 ${age + 1}살 이상: ${rows.filter((x) => okH(x) && okA(x)).map((x) => x.nm).join(', ')} → ${ans}명`],
        key: `u1s3-think-ride|${rows.map((x) => `${x.h}/${x.a}`).join(',')}|${hMin}|${age}`,
        data: { rows, hMin, age },
      };
    },
    verify(p) { const { rows, hMin, age } = p.data; return rows.filter((x) => x.h >= hMin && x.a > age).length === Number(p.answer.value); },
  });

  // 거꾸로 생각하기: 어림한 결과에서 처음 수 찾기
  const MODE = { ceil: '올림', floor: '버림', round: '반올림' };
  const range = (mode, R, u) => (mode === 'ceil' ? [R - u + 1, R] : mode === 'floor' ? [R, R + u - 1] : [R - u / 2, R + u / 2 - 1]);
  const rRev = (sub, mode) => think({
    id: `${sub}-think-back`, sub, styleName: '거꾸로 생각하기',
    build(r, lv) {
      const u = lv <= 2 ? 10 : r.pick([10, 100]);
      const R = r.int(lv <= 2 ? 3 : 5, lv <= 2 ? 90 : 99) * u * (u === 10 ? 1 : 1);
      const [mn, mx] = range(mode, R, u);
      if (mn < 1) return null;
      const ask = r.pick(['min', 'max', 'diff']);
      const ans = ask === 'min' ? mn : ask === 'max' ? mx : mx - mn;
      const place = u === 10 ? '십' : '백';
      const wrong = mode === 'ceil' ? [R - u, R + u - 1] : mode === 'floor' ? [R - u + 1, R + u] : [R - u / 2 + 1, R + u / 2];
      return {
        text: `어떤 자연수를 ${MODE[mode]}하여 ${place}의 자리까지 나타냈더니 ${R}이(가) 되었어요. 어떤 수가 될 수 있는 수 중에서 ${ask === 'min' ? '가장 작은 수' : ask === 'max' ? '가장 큰 수' : '가장 큰 수와 가장 작은 수의 차'}를 구하세요.`.replace(`${R}이(가)`, j(String(R), '이/가')),
        answer: { type: 'num', value: String(ans) },
        patterns: [{ value: String(ask === 'min' ? wrong[0] : ask === 'max' ? wrong[1] : wrong[1] - wrong[0]), cause: 'concept', msg: `${MODE[mode]}의 뜻을 다시 생각해요. ${mode === 'ceil' ? `${R}보다 작으면서 올림하면 ${R}이 되는 수는 ${R - u + 1}부터예요.` : mode === 'floor' ? `버림해서 ${R}이 되는 수는 ${R}부터 ${R + u - 1}까지예요.` : `반올림해서 ${R}이 되는 수는 ${R - u / 2}부터 ${R + u / 2 - 1}까지예요.`}` }].filter((pt) => Number(pt.value) !== ans && Number(pt.value) > 0),
        hints: [`${MODE[mode]}하여 ${place}의 자리까지 나타내면 ${R}이 되는 수를 생각해요. ${R} 근처의 수를 몇 개 직접 ${MODE[mode]}해 봐요.`, mode === 'ceil' ? `${j(String(R - u), '은/는')} 그대로 ${R - u}, ${R - u + 1}부터 ${R}까지는 올림하면 ${R}` : mode === 'floor' ? `${R}부터 ${R + u - 1}까지는 버림하면 ${R}, ${j(String(R + u), '은/는')} ${R + u}` : `${R - u / 2}부터 ${R + u / 2 - 1}까지는 반올림하면 ${R}`, `가장 작은 수 ${mn}, 가장 큰 수 ${mx}${ask === 'diff' ? ` → 차 ${mx - mn}` : ''}`],
        solution: [`${MODE[mode]}하여 ${R}이 되는 자연수: ${mn}부터 ${mx}까지`, ask === 'min' ? `가장 작은 수: ${mn}` : ask === 'max' ? `가장 큰 수: ${mx}` : `${mx} - ${mn} = ${mx - mn}`],
        key: `${sub}-think-back|${R}|${u}|${ask}`,
        data: { mode, R, u, ask },
      };
    },
    verify(p) {
      const { mode, R, u, ask } = p.data;
      const e = u === 10 ? 1 : 2;
      const ok = []; for (let v = Math.max(1, R - 2 * u); v <= R + 2 * u; v++) if (D.str(D.round(String(v), mode, e)) === String(R)) ok.push(v);
      const mn = Math.min(...ok), mx = Math.max(...ok);
      return Number(p.answer.value) === (ask === 'min' ? mn : ask === 'max' ? mx : mx - mn);
    },
  });

  // 경우의 수: 수 카드 네 자리 수를 어림했을 때 같은 결과가 되는 수
  const rCards = (sub, mode) => think({
    id: `${sub}-think-cards`, sub, styleName: '경우의 수',
    build(r) {
      const ds = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      const all = perms4(ds);
      if (all.length < 6) return null;
      const res = all.map((v) => Number(D.str(D.round(String(v), mode, 2))));
      const R = r.pick(res);
      const ans = res.filter((x) => x === R).length;
      const others = Object.keys(MODE).filter((m) => m !== mode).map((m) => all.filter((v) => Number(D.str(D.round(String(v), m, 2))) === R).length);
      return {
        text: `수 카드 4장을 한 번씩 모두 사용하여 네 자리 수를 만들려고 해요. 만든 수를 ${MODE[mode]}하여 백의 자리까지 나타내면 ${j(String(R), '이/가')} 되는 수는 모두 몇 개인가요?`,
        figure: { type: 'cards', nums: ds },
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: others.map((v, i) => ({ value: String(v), cause: 'concept', msg: `${MODE[Object.keys(MODE).filter((m) => m !== mode)[i]]}을 한 것과 헷갈렸어요. ${MODE[mode]}의 뜻을 다시 봐요.` })).filter((pt) => Number(pt.value) !== ans && Number(pt.value) > 0),
        hints: [`${MODE[mode]}하여 백의 자리까지 나타내면 ${R}이 되는 네 자리 수의 범위부터 구해요.`, `범위: ${range(mode, R, 100).join(' ~ ')}. 이 범위에 드는 수를 카드로 만들 수 있는지 찾아요.`, `만들 수 있는 수: ${all.filter((v, i) => res[i] === R).sort((a, b) => a - b).join(', ')} → ${ans}개`],
        solution: [`${MODE[mode]}하여 ${R}이 되는 범위: ${range(mode, R, 100).join(' ~ ')}`, `카드로 만들 수 있는 수: ${all.filter((v, i) => res[i] === R).sort((a, b) => a - b).join(', ')}`, `모두 ${ans}개`],
        key: `${sub}-think-cards|${ds.join('')}|${R}`,
        data: { ds, R, mode },
      };
    },
    verify(p) { const { ds, R, mode } = p.data; return perms4(ds).filter((v) => Number(D.str(D.round(String(v), mode, 2))) === R).length === Number(p.answer.value); },
  });

  // 논리·추론: 두 가지 어림을 모두 만족하는 수
  const tTwo = think({
    id: 'u1s7-think-two', sub: 'u1s7', styleName: '논리·추론',
    build(r) {
      for (let t = 0; t < 40; t++) { const q = twoOnce(r); if (q) return q; }
      return null;
    },
    verify(p) { return twoVerify(p); },
  });
  function twoOnce(r) {
    {
      const n0 = r.int(150, 950);
      const m1 = r.pick(['round', 'floor', 'ceil']), m2 = r.pick(['round', 'floor', 'ceil']);
      const R1 = Number(D.str(D.round(String(n0), m1, 1))), R2 = Number(D.str(D.round(String(n0), m2, 2)));
      const ok = (v) => Number(D.str(D.round(String(v), m1, 1))) === R1 && Number(D.str(D.round(String(v), m2, 2))) === R2;
      const list = []; for (let v = 1; v <= 1100; v++) if (ok(v)) list.push(v);
      const only1 = []; for (let v = 1; v <= 1100; v++) if (Number(D.str(D.round(String(v), m1, 1))) === R1) only1.push(v);
      const ans = list.length;
      if (ans === only1.length) return null;
      return {
        text: `어떤 자연수를 ${MODE[m1]}하여 십의 자리까지 나타내면 ${R1}이고, ${MODE[m2]}하여 백의 자리까지 나타내면 ${j(String(R2), '이에요/예요')}. 어떤 수가 될 수 있는 자연수는 모두 몇 개인가요?`,
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(only1.length), cause: 'condition', msg: '첫째 조건만 봤어요. 둘째 조건도 함께 만족해야 해요.' }].filter((pt) => Number(pt.value) !== ans),
        hints: ['조건마다 어떤 수의 범위를 따로 구한 다음, 두 범위가 겹치는 부분을 찾아요.', `${MODE[m1]}하여 ${R1}: ${only1[0]} ~ ${only1[only1.length - 1]}`, `두 조건을 모두 만족하는 수: ${list[0]} ~ ${list[list.length - 1]} → ${ans}개`],
        solution: [`첫째 조건의 범위: ${only1[0]} ~ ${only1[only1.length - 1]}`, `둘째 조건과 겹치는 수: ${list[0]} ~ ${list[list.length - 1]}`, `모두 ${ans}개`],
        key: `u1s7-think-two|${R1}|${R2}|${m1}|${m2}`,
        data: { R1, R2, m1, m2 },
      };
    }
  }
  function twoVerify(p) {
      const { R1, R2, m1, m2 } = p.data;
      let c = 0; for (let v = 1; v <= 1200; v++) if (Number(D.str(D.round(String(v), m1, 1))) === R1 && Number(D.str(D.round(String(v), m2, 2))) === R2) c++;
      return c === Number(p.answer.value) && c > 0;
    }


  // 경우의 수: 두 어림 방법의 결과가 같은 수
  const PAIRS = [['ceil', 'floor'], ['round', 'floor'], ['round', 'ceil']];
  const tSame = think({
    id: 'u1s7-think-same', sub: 'u1s7', styleName: '경우의 수',
    build(r) {
      const [m1, m2] = r.pick(PAIRS);
      const A = r.int(2, 7) * 100, B = A + r.int(1, 3) * 100;
      const f = (v, m) => Number(D.str(D.round(String(v), m, 2)));
      let ans = 0; for (let v = A; v < B; v++) if (f(v, m1) === f(v, m2)) ans++;
      return {
        text: `${A} 이상 ${B} 미만인 자연수 중에서 ${MODE[m1]}하여 백의 자리까지 나타낸 수와 ${MODE[m2]}하여 백의 자리까지 나타낸 수가 같은 수는 모두 몇 개인가요?`,
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(B - A), cause: 'concept', msg: '어림하는 방법에 따라 결과가 달라지는 수가 있어요. 몇 개의 수로 직접 해 봐요.' }, { value: String((B - A) / 100), cause: 'concept', msg: m1 === 'ceil' && m2 === 'floor' ? '' : '백의 자리 아래가 0인 수만 같은 것은 아니에요. 반올림과 같아지는 경우를 다시 봐요.' }].filter((pt) => Number(pt.value) !== ans && pt.msg),
        hints: [`예를 들어 ${A + 30}, ${A + 70}, ${A}을(를) 두 방법으로 어림해 봐요.`.replace(`${A}을(를)`, j(String(A), '을/를')), m1 === 'ceil' ? '올림과 버림이 같으려면 백의 자리 아래 숫자가 모두 0이어야 해요.' : m1 === 'round' && m2 === 'floor' ? '반올림과 버림이 같으려면 십의 자리 숫자가 0~4여야 해요.' : '반올림과 올림이 같으려면 십의 자리 숫자가 5~9이거나, 백의 자리 아래가 모두 0이어야 해요.', `백 개마다 ${m1 === 'ceil' ? 1 : m1 === 'round' && m2 === 'floor' ? 50 : 51}개씩 → ${ans}개`],
        solution: [m1 === 'ceil' ? '올림과 버림이 같은 수: 백의 자리 아래가 00인 수' : m1 === 'round' && m2 === 'floor' ? '반올림과 버림이 같은 수: 십의 자리 숫자가 0~4인 수' : '반올림과 올림이 같은 수: 십의 자리 숫자가 5~9인 수와 백의 자리 아래가 00인 수', `${A} 이상 ${B} 미만에서 ${ans}개`],
        key: `u1s7-think-same|${m1}${m2}|${A}|${B}`,
        data: { m1, m2, A, B },
      };
    },
    verify(p) { const { m1, m2, A, B } = p.data; const f = (v, m) => Number(D.str(D.round(String(v), m, 2))); let c = 0; for (let v = A; v < B; v++) if (f(v, m1) === f(v, m2)) c++; return c === Number(p.answer.value); },
  });

  M5.addTemplates([
    cardRange('u1s1', true), clue('u1s1', true), cardRange('u1s2', false), clue('u1s2', false),
    tBoth, tRide,
    rRev('u1s4', 'ceil'), rCards('u1s4', 'ceil'), rRev('u1s5', 'floor'), rCards('u1s5', 'floor'), rRev('u1s6', 'round'), rCards('u1s6', 'round'),
    tTwo, tSame,
  ]);
})();
