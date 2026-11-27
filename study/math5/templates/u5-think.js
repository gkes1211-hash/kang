// 5단원 🧩 사고력 문제 (새로운 유형, style 'B')
//   갈래: 규칙 찾기 · 논리·추론 · 경우의 수 · 공간 감각 · 생활 속 상자
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, B = M5.box, U = M5.u5;
  const j = T.j;
  const cm = (v) => `${v} cm`;
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const think = (o) => Object.assign({ unit: 5, style: 'B', levels: [1, 4] }, o);
  const GA = ['가', '나', '다', '라', '마', '바'];

  // ---------------------------------------------------------------- u5s1 직육면체와 정육면체
  // 규칙 찾기: 정육면체를 한 줄로 이어 붙인 직육면체의 모서리 합
  const tRow = think({
    id: 'u5s1-think-row', sub: 'u5s1', styleName: '규칙 찾기',
    build(r, lv) {
      const a = r.int(2, lv <= 2 ? 5 : 9);
      const k = r.int(lv <= 2 ? 4 : 6, lv <= 2 ? 6 : 12);
      const f = (n) => 4 * (n * a + 2 * a);
      const ans = f(k);
      return {
        text: `한 모서리가 ${cm(a)}인 정육면체를 한 줄로 이어 붙여 직육면체를 만들어요. 표를 보고 정육면체 ${k}개를 이어 붙였을 때 만든 직육면체의 모든 모서리의 길이의 합을 구하세요.`,
        figure: { type: 'table', head: ['정육면체 수(개)', '1', '2', '3', '…', String(k)], rows: [['모든 모서리의 길이의 합(cm)', String(f(1)), String(f(2)), String(f(3)), '…', '?']] },
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [
          { value: String(12 * a * k), cause: 'concept', msg: '정육면체 하나의 모서리 합에 개수를 곱하면 안 돼요. 붙인 곳의 모서리는 하나의 모서리로 이어져요.' },
          { value: String(f(3) + 4 * a * (k - 2)), cause: 'calc', msg: `3개일 때부터 ${k - 3}개를 더 붙였어요. 늘어난 횟수를 다시 세어요.` },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: ['표에서 정육면체가 1개 늘 때마다 합이 얼마씩 늘어나는지 봐요.', `하나 늘 때마다 ${4 * a}씩 늘어요. 가로 방향 모서리 4개가 ${cm(a)}씩 길어지기 때문이에요.`, `${f(1)} + ${4 * a} × ${k - 1} = ${ans}`],
        solution: [`정육면체가 1개 늘 때마다 가로 모서리 4개가 ${cm(a)}씩 길어져서 합이 ${4 * a}씩 늘어요.`, `${k}개: ${f(1)} + ${4 * a} × ${k - 1} = ${ans}(cm)`, `(또는 가로 ${a * k} cm, 세로·높이 ${a} cm인 직육면체: (${a * k} + ${a} + ${a}) × 4 = ${ans})`],
        key: `u5s1-think-row|${a}|${k}`,
        data: { a, k },
      };
    },
    verify(p) { const { a, k } = p.data; return Number(p.answer.value) === 4 * (k * a + a + a); },
  });

  // 논리·추론: 단서로 가로 구하기
  const tClue = think({
    id: 'u5s1-think-clue', sub: 'u5s1', styleName: '논리·추론',
    build(r, lv) {
      const x = r.int(2, lv <= 2 ? 6 : 12), d = r.int(1, 5);
      const hk = lv <= 2 ? 'times2' : r.pick(['times2', 'times3', 'plus']);
      const e = r.int(1, 4);
      const h = hk === 'times2' ? 2 * x : hk === 'times3' ? 3 * x : x + e;
      const w = x + d;
      const S = 4 * (w + x + h);
      const hText = hk === 'times2' ? '높이는 세로의 2배' : hk === 'times3' ? '높이는 세로의 3배' : `높이는 세로보다 ${cm(e)} 더 길어요`;
      const mult = hk === 'times2' ? 4 : hk === 'times3' ? 5 : 3;
      const extra = hk === 'plus' ? d + e : d;
      return {
        text: `직육면체 모양의 상자가 있어요. 단서를 보고 상자의 가로를 구하세요.\n• 가로는 세로보다 ${cm(d)} 더 길어요.\n• ${hText}${hk === 'plus' ? '.' : '예요.'}\n• 모든 모서리의 길이의 합은 ${cm(S)}예요.`,
        answer: { type: 'num', value: String(w), unit: 'cm' },
        patterns: [
          { value: String(x), cause: 'condition', msg: '세로를 구했어요. 묻는 것은 가로예요.' },
          { value: String(S / 4), cause: 'condition', msg: '가로 + 세로 + 높이를 구했어요. 단서로 하나씩 나누어 찾아요.' },
        ].filter((pt) => Number(pt.value) !== w),
        hints: ['모든 모서리의 합 = (가로 + 세로 + 높이) × 4 → 먼저 가로 + 세로 + 높이를 구해요.', `가로 + 세로 + 높이 = ${S} ÷ 4 = ${S / 4}. 세로를 □라 하면 가로는 □ + ${d}, 높이는 ${hk === 'plus' ? `□ + ${e}` : hk === 'times2' ? '□ × 2' : '□ × 3'}`, `□ × ${mult} + ${extra} = ${S / 4} → □ = ${x}, 가로 = ${x} + ${d} = ${w}`],
        solution: [`가로 + 세로 + 높이 = ${S} ÷ 4 = ${S / 4}(cm)`, `세로를 □라 하면 □ × ${mult} + ${extra} = ${S / 4}, □ = ${x}`, `가로 = ${x} + ${d} = ${w}(cm)`],
        key: `u5s1-think-clue|${x}|${d}|${hk}|${e}`,
        data: { w, x, h, S, d },
      };
    },
    verify(p) { const { w, x, h, S, d } = p.data; return 4 * (w + x + h) === S && w === x + d && Number(p.answer.value) === w; },
  });

  // 경우의 수: 철사로 만들 수 있는 직육면체의 가짓수
  function boxes(n) { const out = []; for (let a = 1; a <= n; a++) for (let b = 1; b <= a; b++) { const c = n - a - b; if (c >= 1 && c <= b) out.push([a, b, c]); } return out; }
  const tWays = think({
    id: 'u5s1-think-ways', sub: 'u5s1', styleName: '경우의 수',
    build(r, lv) {
      const n = r.int(lv <= 2 ? 5 : 7, lv <= 2 ? 8 : 12);
      const L = 4 * n;
      const all = boxes(n);
      const ans = all.length;
      const ordered = ((n - 1) * (n - 2)) / 2;
      const hasCube = n % 3 === 0;
      return {
        text: `길이가 ${cm(L)}인 철사를 남김없이 모두 써서 직육면체 모양을 만들려고 해요. 모서리의 길이는 모두 자연수(cm)예요. 만들 수 있는 모양은 모두 몇 가지인가요? (돌려 놓으면 같은 모양은 한 가지로 세요.)`,
        answer: { type: 'num', value: String(ans), unit: '가지' },
        patterns: [
          { value: String(ordered), cause: 'condition', msg: '가로·세로·높이의 순서만 바꾼 것은 돌려 놓으면 같은 모양이에요. 큰 수부터 차례로 정해서 세요.' },
          ...(hasCube ? [{ value: String(ans - 1), cause: 'concept', msg: '모서리가 모두 같은 정육면체도 직육면체라서 세어야 해요.' }] : []),
        ].filter((pt) => Number(pt.value) !== ans && Number(pt.value) > 0),
        hints: [`모든 모서리의 합 = (가로 + 세로 + 높이) × 4 → 가로 + 세로 + 높이 = ${L} ÷ 4 = ${n}`, '세 수를 큰 것부터 (가장 긴 것 ≥ 중간 ≥ 가장 짧은 것) 순서로 정하면 같은 모양을 두 번 세지 않아요.', `${all.map((x) => x.join('+')).join(', ')} → ${ans}가지`],
        solution: [`가로 + 세로 + 높이 = ${n}`, `큰 수부터: ${all.map((x) => `(${x.join(', ')})`).join(', ')}`, `모두 ${ans}가지`],
        key: `u5s1-think-ways|${n}`,
        data: { n },
      };
    },
    verify(p) { let c = 0; const n = p.data.n; for (let a = 1; a < n; a++) for (let b = 1; b <= a; b++) for (let d = 1; d <= b; d++) if (a + b + d === n) c++; return c === Number(p.answer.value); },
  });

  // ---------------------------------------------------------------- u5s2 겨냥도
  // 공간 감각: 작은 정육면체로 쌓은 직육면체에서 보이는/보이지 않는 정육면체 수
  function stackFig(a, h, c) {
    const d = U.drawDims({ a: a * 2, h: h * 2, c: c * 2 });
    const f = B.boxFig(d, { lens: { a: `${a}개`, h: `${h}개`, c: `${c}개` } });
    const P = (x, y, z) => B.proj([x, y, z], d);
    for (let i = 1; i < a; i++) f.segs.push({ a: P(i / a, 0, 0), b: P(i / a, 1, 0), cls: 'thin' }, { a: P(i / a, 1, 0), b: P(i / a, 1, 1), cls: 'thin' });
    for (let k = 1; k < h; k++) f.segs.push({ a: P(0, k / h, 0), b: P(1, k / h, 0), cls: 'thin' }, { a: P(1, k / h, 0), b: P(1, k / h, 1), cls: 'thin' });
    for (let m = 1; m < c; m++) f.segs.push({ a: P(0, 1, m / c), b: P(1, 1, m / c), cls: 'thin' }, { a: P(1, 0, m / c), b: P(1, 1, m / c), cls: 'thin' });
    return f;
  }
  const tStack = think({
    id: 'u5s2-think-stack', sub: 'u5s2', styleName: '공간 감각',
    build(r, lv) {
      const a = r.int(2, lv <= 2 ? 3 : 5), h = r.int(2, lv <= 2 ? 3 : 4), c = r.int(2, lv <= 2 ? 3 : 4);
      const all = a * h * c, hid = (a - 1) * (h - 1) * (c - 1);
      const askHid = r.chance(0.5);
      const ans = askHid ? hid : all - hid;
      return {
        text: `크기가 같은 작은 정육면체로 가로 ${a}개, 세로 ${c}개, 높이 ${h}개인 직육면체를 쌓았어요. 그림처럼 겨냥도 방향에서 볼 때 ${askHid ? '하나도 보이지 않는' : '한 면이라도 보이는'} 작은 정육면체는 모두 몇 개인가요?`,
        figure: stackFig(a, h, c),
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [
          { value: String(all), cause: 'condition', msg: '작은 정육면체 전체의 수예요.' },
          { value: String(askHid ? all - hid : hid), cause: 'concept', msg: askHid ? '보이는 정육면체의 수를 구했어요.' : '보이지 않는 정육면체의 수를 구했어요.' },
          { value: String(a * h + a * c + h * c), cause: 'concept', msg: '보이는 세 면의 칸을 더하면 모서리에 있는 정육면체를 두 번, 세 번 세게 돼요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: ['보이는 면은 앞면, 윗면, 오른쪽 옆면이에요. 이 세 면에 닿지 않은 정육면체는 보이지 않아요.', `보이지 않는 정육면체는 뒤·아래·왼쪽에 모인 덩어리예요: 가로 ${a - 1}개, 세로 ${c - 1}개, 높이 ${h - 1}개`, `보이지 않는 것: ${a - 1} × ${c - 1} × ${h - 1} = ${hid}${askHid ? '' : ` → 보이는 것: ${all} - ${hid} = ${all - hid}`}`],
        solution: [`전체: ${a} × ${c} × ${h} = ${all}(개)`, `보이지 않는 것: ${a - 1} × ${c - 1} × ${h - 1} = ${hid}(개)`, askHid ? `답: ${hid}개` : `보이는 것: ${all} - ${hid} = ${all - hid}(개)`],
        key: `u5s2-think-stack|${a}|${h}|${c}|${askHid}`,
        data: { a, h, c, askHid },
      };
    },
    verify(p) {
      const { a, h, c, askHid } = p.data;
      let vis = 0;
      for (let x = 0; x < a; x++) for (let y = 0; y < h; y++) for (let z = 0; z < c; z++) if (x === a - 1 || y === h - 1 || z === 0) vis++;
      return Number(p.answer.value) === (askHid ? a * h * c - vis : vis);
    },
  });

  // 공간 감각: 보이지 않는 면 고르기
  const tHidFace = think({
    id: 'u5s2-think-face', sub: 'u5s2', styleName: '공간 감각',
    build(r) {
      const ask = r.pick(['hidden', 'parallel']);
      const opts = r.shuffle(Object.keys(B.FACES));
      const hid = ['bottom', 'back', 'left'];
      const dd = U.drawDims({ a: r.int(5, 8), h: r.int(3, 5), c: r.int(3, 6) });
      return {
        text: ask === 'hidden' ? '직육면체의 겨냥도에서 보이지 않는 면을 모두 고르세요.' : '직육면체의 겨냥도에서 보이는 면과 평행한 면을 모두 고르세요.',
        figure: B.boxFig(dd, { labels: true, scale: 34 }),
        answer: { type: 'multi', options: opts.map((f) => ({ text: B.faceName(f), key: f, correct: hid.includes(f) })) },
        keepOrder: true,
        patterns: [{ value: ['top', 'front', 'right'], cause: 'concept', msg: '이 세 면은 보이는 면이에요. 보이지 않는 꼭짓점 ㅁ이 들어 있는 면을 찾아요.' }],
        hints: ['보이지 않는 꼭짓점은 ㅁ 하나예요.', '꼭짓점 ㅁ이 들어 있는 면 3개가 보이지 않는 면이에요. 이 면들은 보이는 면과 각각 마주 봐요.', `답: ${hid.map(B.faceName).join(', ')}`],
        solution: ['보이는 면: 윗면, 앞면, 오른쪽 옆면', `보이지 않는 면(= 보이는 면과 평행한 면): ${hid.map(B.faceName).join(', ')}`],
        key: `u5s2-think-face|${ask}|${opts.join(',')}`,
        data: {},
      };
    },
    verify(p) { return p.answer.options.every((o, i) => ['bottom', 'back', 'left'].includes(o.key) === p.answer.values.includes(i)) && p.answer.options.every((o) => o.text === B.faceName(o.key)); },
  });

  // ---------------------------------------------------------------- u5s3 성질
  // 논리·추론: 주사위를 이어 붙였을 때 겉면 눈의 합의 가장 큰 값·작은 값
  const tGlue = think({
    id: 'u5s3-think-glue', sub: 'u5s3', styleName: '논리·추론',
    build(r) {
      const n = r.int(2, 4), big = r.chance(0.5);
      const total = 21 * n;
      const middle = 7 * (n - 2); // 가운데 주사위는 마주 보는 두 면이 가려져서 7씩
      const ends = big ? 2 * 1 : 2 * 6;
      const ans = total - middle - ends;
      return {
        text: `주사위 ${n}개를 한 줄로 이어 붙였어요. 서로 맞닿아 가려진 면을 빼고, 바닥을 포함한 겉면의 눈의 수를 모두 더하려고 해요. 이 합이 가장 ${big ? '클' : '작을'} 때는 얼마인가요? (주사위는 마주 보는 면의 눈의 합이 7이에요.)`,
        answer: { type: 'num', value: String(ans) },
        patterns: [
          { value: String(total), cause: 'condition', msg: '가려진 면까지 모두 더했어요.' },
          { value: String(total - (big ? 2 * (n - 1) : 12 * (n - 1))), cause: 'concept', msg: '가운데 주사위는 양쪽이 가려지는데, 두 면은 마주 보는 면이라 합이 늘 7이에요.' },
          { value: String(total - middle - (big ? 12 : 2)), cause: 'condition', msg: big ? '가장 크게 하려면 가려지는 면이 가장 작아야 해요.' : '가장 작게 하려면 가려지는 면이 가장 커야 해요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: [`주사위 하나의 눈의 합은 1 + 2 + … + 6 = 21, ${n}개면 ${total}이에요.`, n > 2 ? `가운데 주사위 ${n - 2}개는 양쪽 면이 가려져요. 마주 보는 두 면이라 합이 7씩: ${middle}` : '두 주사위가 한 면씩 가려져요.', `양 끝 주사위는 한 면씩만 가려져요. 가장 ${big ? '크게 → 1이 가려지게' : '작게 → 6이 가려지게'}: ${total} - ${middle} - ${ends} = ${ans}`],
        solution: [`전체: 21 × ${n} = ${total}`, ...(n > 2 ? [`가운데 주사위 ${n - 2}개에서 가려지는 눈: 7 × ${n - 2} = ${middle}`] : []), `양 끝에서 가려지는 눈: ${big ? '1 + 1' : '6 + 6'} = ${ends}`, `${total} - ${middle} - ${ends} = ${ans}`],
        key: `u5s3-think-glue|${n}|${big}`,
        data: { n, big },
      };
    },
    verify(p) {
      // 모든 붙이는 방법을 직접 따져 보기: 양 끝은 한 면(1~6), 가운데는 마주 보는 두 면(합 7)
      const { n, big } = p.data;
      let best = big ? -1 : 1e9;
      for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) { const v = 21 * n - 7 * (n - 2) - x - y; best = big ? Math.max(best, v) : Math.min(best, v); }
      return best === Number(p.answer.value);
    },
  });

  // 공간·논리: 세 방향에서 본 글자 정육면체 → 마주 보는 글자
  const V3 = { U: [0, 0, 1], D: [0, 0, -1], N: [0, 1, 0], S: [0, -1, 0], E: [1, 0, 0], W: [-1, 0, 0] };
  const ROTS = (() => {
    const out = [];
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (const pm of perms) for (let sg = 0; sg < 8; sg++) {
      const s = [sg & 1 ? -1 : 1, sg & 2 ? -1 : 1, sg & 4 ? -1 : 1];
      const M = [0, 1, 2].map((i) => [0, 1, 2].map((k) => (pm[i] === k ? s[i] : 0)));
      const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      if (det === 1) out.push(M);
    }
    return out;
  })();
  const mul = (M, v) => M.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
  const dirOf = (v) => Object.keys(V3).find((k) => V3[k].every((x, i) => x === v[i]));
  function view(lab, M) {
    // 회전 M 뒤에 위(U)·앞(S)·오른쪽(E)에 오는 글자
    const at = {};
    for (const d of Object.keys(V3)) at[dirOf(mul(M, V3[d]))] = lab[d];
    return { top: at.U, front: at.S, right: at.E };
  }
  const tViews = think({
    id: 'u5s3-think-views', sub: 'u5s3', styleName: '공간 감각',
    build(r) {
      const letters = r.shuffle(GA.slice());
      const lab = {};
      Object.keys(V3).forEach((d, i) => { lab[d] = letters[i]; });
      const vs = r.sample(ROTS, 3).map((M) => view(lab, M));
      const X = r.pick(letters);
      const together = new Set();
      for (const v of vs) if ([v.top, v.front, v.right].includes(X)) [v.top, v.front, v.right].forEach((l) => together.add(l));
      const cand = letters.filter((l) => l !== X && !together.has(l));
      if (cand.length !== 1 || ![...together].length) return null;
      const opp = lab[{ U: 'D', D: 'U', N: 'S', S: 'N', E: 'W', W: 'E' }[Object.keys(lab).find((d) => lab[d] === X)]];
      if (cand[0] !== opp) return null;
      const dd = U.drawDims({ a: 4, h: 4, c: 4 });
      const P = (n) => B.proj(B.V[n], dd);
      const ctr = (f) => { const ps = B.FACES[f].map(P); return [ps.reduce((s, p) => s + p[0], 0) / 4, ps.reduce((s, p) => s + p[1], 0) / 4]; };
      const fig = { type: 'geo', polys: [], segs: [], texts: [], scale: 26, pad: 0.6 };
      vs.forEach((v, i) => {
        const ox = i * 6.5;
        const bf = B.boxFig(dd, {});
        for (const s of bf.segs) if (s.cls !== 'dash') fig.segs.push({ a: [s.a[0] + ox, s.a[1]], b: [s.b[0] + ox, s.b[1]], cls: 'box' });
        for (const [f, t] of [['top', v.top], ['front', v.front], ['right', v.right]]) { const c = ctr(f); fig.texts.push({ p: [c[0] + ox, c[1]], t }); }
      });
      const others = letters.filter((l) => l !== X).sort();
      return {
        text: `한 정육면체의 여섯 면에 가, 나, 다, 라, 마, 바를 하나씩 썼어요. 이 정육면체를 세 방향에서 본 그림을 보고, ${j(`'${X}'`, '과/와')} 마주 보는 면의 글자를 고르세요.`,
        figure: fig,
        answer: { type: 'choice', options: others.map((l) => Object.assign({ text: l, correct: l === opp }, l === opp ? {} : { pattern: { cause: 'concept', msg: `${j(`'${l}'`, '은/는')} 그림에서 ${j(`'${X}'`, '과/와')} 함께 보여요. 함께 보이는 면은 이웃한 면이라 마주 볼 수 없어요.` } })) },
        keepOrder: true,
        hints: ['한 그림에 함께 보이는 세 면은 서로 이웃한 면이에요. 마주 보는 면은 한 그림에 같이 보일 수 없어요.', `${j(`'${X}'`, '이/가')} 보이는 그림에서 ${j(`'${X}'`, '과/와')} 함께 보이는 글자를 모두 적어 봐요: ${[...together].filter((l) => l !== X).sort().join(', ')}`, `${j(`'${X}'`, '과/와')} 한 번도 함께 보이지 않은 글자: ${opp}`],
        solution: [`${j(`'${X}'`, '과/와')} 함께 보인 글자(이웃한 면): ${[...together].filter((l) => l !== X).sort().join(', ')}`, `남은 글자 '${opp}'가 마주 보는 면이에요.`],
        key: `u5s3-think-views|${letters.join('')}|${vs.map((v) => v.top + v.front + v.right).join('/')}|${X}`,
        data: { lab, X },
      };
    },
    verify(p) {
      const { lab, X } = p.data;
      const OPP = { U: 'D', D: 'U', N: 'S', S: 'N', E: 'W', W: 'E' };
      const d = Object.keys(lab).find((k) => lab[k] === X);
      return p.answer.options[p.answer.value].text === lab[OPP[d]];
    },
  });

  // ---------------------------------------------------------------- u5s4 정육면체의 전개도
  // 공간 감각: 접었을 때 한 점에 모이는 면 3개
  const tCorner = think({
    id: 'u5s4-think-corner', sub: 'u5s4', styleName: '공간 감각',
    build(r, lv) {
      const N = U.makeNet(r, true, lv);
      const p = r.pick(N.pts);
      const faces = N.rects.filter((rc) => p.cube.includes(rc.face));
      // 전개도에서 그 점을 실제로 꼭짓점으로 가진 면
      const touch = N.rects.filter((rc) => [[rc.x, rc.y], [rc.x + rc.w, rc.y], [rc.x, rc.y + rc.h], [rc.x + rc.w, rc.y + rc.h]].some((q) => Math.abs(q[0] - p.p[0]) < 1e-9 && Math.abs(q[1] - p.p[1]) < 1e-9));
      if (touch.length === 3) return null; // 이미 다 모여 있으면 생각할 거리가 없어요
      const opts = N.rects.slice().sort((a, b) => (a.name < b.name ? -1 : 1));
      return {
        text: `정육면체의 전개도를 접었을 때 점 ${p.name}에 모이는 면을 모두 고르세요.`,
        figure: U.netFig(N, { points: [p.name] }),
        answer: { type: 'multi', options: opts.map((rc) => ({ text: `면 ${rc.name}`, key: rc.name, correct: faces.includes(rc) })) },
        keepOrder: true,
        patterns: [{ value: touch.map((rc) => rc.name), cause: 'condition', msg: `전개도에서 점 ${p.name}에 닿아 있는 면만 골랐어요. 접으면 다른 면의 꼭짓점도 점 ${p.name}으로 모여요. 정육면체의 꼭짓점에는 면이 3개씩 모여요.` }],
        hints: ['정육면체의 꼭짓점 하나에는 면이 꼭 3개 모여요.', `점 ${p.name}에 닿아 있는 면: ${touch.map((rc) => '면 ' + rc.name).join(', ')}. 접었을 때 이 면과 붙는 면 중 점 ${p.name} 쪽으로 오는 면을 찾아요.`, `모이는 면: ${faces.map((rc) => '면 ' + rc.name).join(', ')}`],
        solution: [`점 ${p.name}에 모이는 면: ${faces.map((rc) => '면 ' + rc.name).join(', ')}`, '정육면체의 한 꼭짓점에는 서로 수직인 면 3개가 모여요.'],
        key: `u5s4-think-corner|${N.cells.map((c) => c.join(',')).join(' ')}|${p.name}`,
        data: { faces: faces.map((rc) => rc.name) },
      };
    },
    verify(p) { return p.data.faces.length === 3 && p.answer.options.every((o, i) => p.data.faces.includes(o.key) === p.answer.values.includes(i)); },
  });

  // 공간 감각: 같은 주사위가 되는 전개도 찾기 (마주 보는 수의 짝이 같은지)
  const tSame = think({
    id: 'u5s4-think-same', sub: 'u5s4', styleName: '공간 감각',
    build(r, lv) {
      const nums = r.shuffle([1, 2, 3, 4, 5, 6]);
      const num = { U: nums[0], D: nums[1], N: nums[2], S: nums[3], E: nums[4], W: nums[5] };
      const pairsKey = (m) => [[m.U, m.D], [m.N, m.S], [m.E, m.W]].map((p) => p.slice().sort().join('-')).sort().join(' ');
      const ref = U.makeNet(r, true, lv);
      const mk = (m) => { const N = U.makeNet(r, true, lv); return { N, m, fig: U.netFig(N, { faceText: (rc) => String(m[rc.face]), scale: 26 }) }; };
      const swapped = () => {
        const m = Object.assign({}, num);
        const [a, b] = r.pick([['U', 'N'], ['U', 'E'], ['N', 'E'], ['D', 'S'], ['S', 'W'], ['D', 'W']]);
        [m[a], m[b]] = [m[b], m[a]];
        return m;
      };
      const right = mk(num);
      const wrongs = [mk(swapped()), mk(swapped()), mk(swapped())];
      const all = [right, ...wrongs];
      const keys = all.map((o) => JSON.stringify(o.fig.texts.map((t) => t.t)) + o.N.cells.map((c) => c.join(',')).join(' '));
      if (new Set(keys).size < 4 || wrongs.some((w) => pairsKey(w.m) === pairsKey(num))) return null;
      return {
        text: '왼쪽 위의 주사위 전개도를 접었을 때와 마주 보는 두 수의 짝이 똑같은 전개도를 고르세요.',
        figure: U.netFig(ref, { faceText: (rc) => String(num[rc.face]), scale: 34 }),
        answer: { type: 'choice', options: all.map((o, i) => Object.assign({ figure: o.fig, key: keys[i], correct: i === 0 }, i === 0 ? {} : { pattern: { cause: 'concept', msg: '이 전개도는 마주 보는 두 수의 짝이 하나 이상 달라요. 전개도마다 마주 보는 짝 3개를 적어 비교해 봐요.' } })) },
        hints: ['먼저 위의 전개도에서 마주 보는 두 수의 짝 3개를 찾아요. 한 줄로 이어진 세 칸의 첫째와 셋째가 마주 봐요.', `위 전개도의 짝: ${pairsKey(num).split(' ').map((p) => `(${p.replace('-', ', ')})`).join(' ')}`, '보기마다 마주 보는 짝을 찾아서 세 짝이 모두 같은 것을 골라요.'],
        solution: [`마주 보는 짝: ${pairsKey(num).split(' ').map((p) => `(${p.replace('-', ', ')})`).join(' ')}`, '정답 전개도만 세 짝이 모두 같아요.'],
        key: `u5s4-think-same|${keys.join('/')}`,
        data: { ref: pairsKey(num), opts: all.map((o) => pairsKey(o.m)) },
      };
    },
    verify(p) { return p.data.opts.filter((k) => k === p.data.ref).length === 1 && p.data.opts[0] === p.data.ref; },
  });

  // ---------------------------------------------------------------- u5s5 직육면체의 전개도
  // 생활 속 상자: 네 귀퉁이를 잘라 뚜껑 없는 상자 만들기
  const tOpen = think({
    id: 'u5s5-think-open', sub: 'u5s5', styleName: '생활 속 상자',
    build(r, lv) {
      const k = r.int(1, lv <= 2 ? 3 : 5);
      const W = 2 * k + r.int(3, 12), H = 2 * k + r.int(3, 10);
      if (W === H) return null;
      const a = W - 2 * k, b = H - 2 * k;
      const ask = r.pick(lv <= 2 ? ['base', 'edges'] : ['base', 'edges', 'edgesum']);
      const ans = ask === 'base' ? a * b : ask === 'edges' ? 2 * (a + b) : 4 * (a + b) + 4 * k;
      const s = 5 / Math.max(W, H);
      const P = (x, y) => [x * s, y * s];
      const corners = [[0, 0], [W - k, 0], [0, H - k], [W - k, H - k]].map(([x, y]) => ({ pts: [P(x, y), P(x + k, y), P(x + k, y + k), P(x, y + k)], cls: 'shade' }));
      const fig = { type: 'geo', polys: [{ pts: [P(0, 0), P(W, 0), P(W, H), P(0, H)], cls: 'netface' }, ...corners], segs: [[0, 0, W, 0], [W, 0, W, H], [W, H, 0, H], [0, H, 0, 0]].map(([x1, y1, x2, y2]) => ({ a: P(x1, y1), b: P(x2, y2), cls: 'box' })).concat([[k, k, W - k, k], [W - k, k, W - k, H - k], [W - k, H - k, k, H - k], [k, H - k, k, k]].map(([x1, y1, x2, y2]) => ({ a: P(x1, y1), b: P(x2, y2), cls: 'dash' }))), sides: [{ a: P(0, H), b: P(W, H), t: cm(W), c: P(W / 2, 0) }, { a: P(W, 0), b: P(W, H), t: cm(H), c: P(0, H / 2) }, { a: P(0, 0), b: P(k, 0), t: cm(k), c: P(k / 2, H) }], scale: 40, pad: 0.8 };
      const q = { base: '상자의 밑면의 넓이는 몇 cm²', edges: '상자의 밑면의 둘레는 몇 cm', edgesum: '뚜껑 없는 상자의 모든 모서리의 길이의 합은 몇 cm' }[ask];
      return {
        text: `가로 ${cm(W)}, 세로 ${cm(H)}인 직사각형 종이의 네 귀퉁이에서 한 변이 ${cm(k)}인 정사각형을 잘라 내고, 점선을 따라 접어서 뚜껑 없는 상자를 만들었어요. ${q}인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: ask === 'base' ? 'cm²' : 'cm' },
        patterns: [
          { value: String(ask === 'base' ? (W - k) * (H - k) : ask === 'edges' ? 2 * (W - k + H - k) : 4 * (W - k + H - k) + 4 * k), cause: 'condition', msg: '귀퉁이는 양쪽에서 잘라 내요. 가로와 세로에서 각각 2번씩 빼야 해요.' },
          { value: String(ask === 'base' ? W * H : ask === 'edges' ? 2 * (W + H) : 4 * (W + H)), cause: 'concept', msg: '종이 전체의 크기를 썼어요. 상자의 밑면은 잘라 내고 남은 가운데 부분이에요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: ['접으면 가운데 직사각형이 밑면, 둘레의 네 날개가 옆면이 되고, 잘라 낸 정사각형의 한 변이 상자의 높이예요.', `밑면의 가로 = ${W} - ${k} × 2 = ${a}, 세로 = ${H} - ${k} × 2 = ${b}, 높이 = ${k}`, ask === 'base' ? `${a} × ${b} = ${ans}` : ask === 'edges' ? `(${a} + ${b}) × 2 = ${ans}` : `밑면 둘레 ${2 * (a + b)} + 윗면 테두리 ${2 * (a + b)} + 높이 4개 ${4 * k} = ${ans}`],
        solution: [`밑면: 가로 ${a} cm, 세로 ${b} cm, 높이: ${k} cm`, ask === 'base' ? `밑면의 넓이: ${a} × ${b} = ${ans}(cm²)` : ask === 'edges' ? `밑면의 둘레: (${a} + ${b}) × 2 = ${ans}(cm)` : `모서리: 가로 ${a} cm 4개, 세로 ${b} cm 4개, 높이 ${k} cm 4개 → (${a} + ${b} + ${k}) × 4 = ${ans}(cm)`],
        key: `u5s5-think-open|${W}|${H}|${k}|${ask}`,
        data: { W, H, k, ask },
      };
    },
    verify(p) { const { W, H, k, ask } = p.data; const a = W - 2 * k, b = H - 2 * k; return Number(p.answer.value) === (ask === 'base' ? a * b : ask === 'edges' ? 2 * (a + b) : 4 * (a + b + k)); },
  });

  // 논리·추론: 세 면의 넓이로 가로·세로·높이 찾기
  const tAreas = think({
    id: 'u5s5-think-areas', sub: 'u5s5', styleName: '논리·추론',
    build(r, lv) {
      const N = U.makeNet(r, false, lv);
      if (!N) return null;
      const { x, y, z } = N.L;
      const ans = 4 * (x + y + z);
      const areas = [x * y, y * z, z * x];
      return {
        text: '직육면체의 전개도에 면마다 넓이를 적었어요. 이 직육면체의 모든 모서리의 길이의 합은 몇 cm인가요? (모서리의 길이는 모두 자연수 cm예요.)',
        figure: U.netFig(N, { faceText: (rc) => `${rc.w * rc.h} cm²` }),
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [
          { value: String(sum(areas)), cause: 'concept', msg: '넓이를 더했어요. 넓이에서 가로·세로·높이를 먼저 찾아요.' },
          { value: String(x + y + z), cause: 'condition', msg: '가로 + 세로 + 높이예요. 모서리는 4개씩 있어요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: [`넓이가 다른 면은 3가지예요: ${areas.slice().sort((a, b) => a - b).join(', ')} cm². 마주 보는 면은 넓이가 같아요.`, '세 길이를 □, △, ○라 하면 □×△, △×○, ○×□가 세 넓이예요. 두 넓이에 같이 들어가는 길이를 찾아 곱셈표로 맞춰 봐요.', `길이: ${[x, y, z].sort((a, b) => a - b).join(', ')} cm → (${x} + ${y} + ${z}) × 4 = ${ans}`],
        solution: [`세 넓이 ${x * y}, ${y * z}, ${z * x} → 길이 ${x}, ${y}, ${z} cm (${x} × ${y} = ${x * y}, ${y} × ${z} = ${y * z}, ${z} × ${x} = ${z * x})`, `모든 모서리의 합: (${x} + ${y} + ${z}) × 4 = ${ans}(cm)`],
        key: `u5s5-think-areas|${N.cells.map((c) => c.join(',')).join(' ')}|${JSON.stringify(N.L)}`,
        data: { x, y, z },
      };
    },
    verify(p) {
      // 넓이 세 개를 만족하는 자연수 길이가 하나뿐인지 확인
      const { x, y, z } = p.data;
      const A = [x * y, y * z, z * x].sort((a, b) => a - b).join(',');
      const sols = new Set();
      for (let a = 1; a <= 30; a++) for (let b = a; b <= 30; b++) for (let c = b; c <= 30; c++) if ([a * b, b * c, c * a].sort((m, n) => m - n).join(',') === A) sols.add(4 * (a + b + c));
      return sols.size === 1 && sols.has(Number(p.answer.value));
    },
  });

  M5.addTemplates([tRow, tClue, tWays, tStack, tHidFace, tGlue, tViews, tCorner, tSame, tOpen, tAreas]);
})();
