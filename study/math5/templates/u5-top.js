// 5단원 최상위 문제 (5단계 도전의 마지막 칸 · 무한 모드에서는 '도전' 난이도에서만)
//   tier: 'top' 인 틀은 5단계 도전에서 최상위 칸에 나와요.
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, B = M5.box, U = M5.u5;
  const j = T.j;
  const cm = (v) => `${v} cm`;
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const top = (o) => Object.assign({ unit: 5, style: 'A', levels: [4, 4], tier: 'top' }, o);
  const pos = (pt) => Number(pt.value) > 0;

  // ---------------------------------------------------------------- u5s1
  const tCut = top({
    id: 'u5s1-top-cut', sub: 'u5s1', styleName: '최상위: 정육면체로 나누기',
    build(r) {
      const g = r.int(2, 6);
      let p, q, s;
      do { p = r.int(1, 4); q = r.int(1, 4); s = r.int(1, 4); } while (gcd(gcd(p, q), s) !== 1 || (p === q && q === s));
      const [a, b, c] = [g * p, g * q, g * s];
      const ans = p * q * s;
      const subG = [...Array(g).keys()].map((x) => x + 1).filter((d) => d > 1 && d < g && g % d === 0);
      const pats = [{ value: String(a * b * c), cause: 'concept', msg: '한 모서리가 1 cm인 정육면체로 나눈 개수예요. "가장 큰" 정육면체를 찾아야 해요.' }];
      if (subG.length) { const d = subG[0]; pats.push({ value: String((a / d) * (b / d) * (c / d)), cause: 'condition', msg: `한 모서리가 ${cm(d)}인 것보다 더 큰 정육면체로도 나눌 수 있어요. 세 수의 최대공약수를 찾아요.` }); }
      return {
        text: `가로 ${cm(a)}, 세로 ${cm(b)}, 높이 ${cm(c)}인 직육면체를 잘라서 크기가 같은 정육면체 여러 개로 남김없이 나누려고 해요. 정육면체를 가장 크게 만들면 모두 몇 개가 되나요?`,
        figure: B.boxFig(U.drawDims({ a, h: c, c: b }), { lens: { a: cm(a), h: cm(c), c: cm(b) } }),
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: pats.filter((pt) => Number(pt.value) !== ans),
        hints: ['정육면체의 한 모서리는 가로, 세로, 높이를 모두 나누어떨어지게 하는 길이여야 해요.', `가장 큰 정육면체의 한 모서리 = ${a}, ${b}, ${c}의 최대공약수 = ${g} cm`, `가로 ${a / g}개, 세로 ${b / g}개, 높이 ${c / g}층 → ${p} × ${q} × ${s} = ${ans}`],
        solution: [`${a}, ${b}, ${c}의 최대공약수는 ${g}이라서 한 모서리가 ${cm(g)}인 정육면체가 가장 커요.`, `가로 ${a} ÷ ${g} = ${p}개, 세로 ${b} ÷ ${g} = ${q}개, 높이 ${c} ÷ ${g} = ${s}층`, `모두 ${p} × ${q} × ${s} = ${ans}(개)`],
        key: `u5s1-top-cut|${a}|${b}|${c}`,
        data: { a, b, c },
      };
    },
    verify(p) { const { a, b, c } = p.data; const g = gcd(gcd(a, b), c); return Number(p.answer.value) === (a / g) * (b / g) * (c / g); },
  });

  const tSame = top({
    id: 'u5s1-top-same', sub: 'u5s1', styleName: '최상위: 모서리 합이 같은 두 상자',
    build(r) {
      let a, b, c;
      do { a = r.int(3, 16); b = r.int(2, 14); c = r.int(2, 14); } while ((a + b + c) % 3 || new Set([a, b, c]).size < 3);
      const e = (a + b + c) / 3;
      const askArea = r.chance(0.5);
      const ans = askArea ? e * e : e;
      return {
        text: `가로 ${cm(a)}, 세로 ${cm(b)}, 높이 ${cm(c)}인 직육면체와 모든 모서리의 길이의 합이 같은 정육면체가 있어요. 이 정육면체의 ${askArea ? '한 면의 넓이는 몇 cm²' : '한 모서리는 몇 cm'}인가요?`,
        answer: { type: 'num', value: String(ans), unit: askArea ? 'cm²' : 'cm' },
        patterns: [
          { value: String(a + b + c), cause: 'concept', msg: '직육면체의 모서리 합은 (가로+세로+높이)×4, 정육면체는 (한 모서리)×12예요.' },
          { value: String(askArea ? e : 4 * (a + b + c)), cause: 'condition', msg: askArea ? '한 모서리를 구했어요. 한 면의 넓이를 구해야 해요.' : '모서리 길이의 합을 구했어요. 12로 나눠야 해요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: ['직육면체의 모든 모서리의 합 = (가로 + 세로 + 높이) × 4', `(${a} + ${b} + ${c}) × 4 = ${4 * (a + b + c)} → 정육면체의 모서리 12개의 합도 ${4 * (a + b + c)}`, `한 모서리 = ${4 * (a + b + c)} ÷ 12 = ${e}${askArea ? ` → 넓이 ${e} × ${e} = ${e * e}` : ''}`],
        solution: [`직육면체의 모서리 합: (${a} + ${b} + ${c}) × 4 = ${4 * (a + b + c)}(cm)`, `정육면체의 한 모서리: ${4 * (a + b + c)} ÷ 12 = ${e}(cm)`, askArea ? `한 면의 넓이: ${e} × ${e} = ${e * e}(cm²)` : `답: ${e} cm`],
        key: `u5s1-top-same|${a}|${b}|${c}|${askArea}`,
        data: { a, b, c, askArea },
      };
    },
    verify(p) { const { a, b, c, askArea } = p.data; const e = (4 * (a + b + c)) / 12; return Number(p.answer.value) === (askArea ? e * e : e); },
  });

  // ---------------------------------------------------------------- u5s2
  const tDiff = top({
    id: 'u5s2-top-diff', sub: 'u5s2', styleName: '최상위: 거꾸로 구하기',
    build(r) {
      const a = r.int(3, 15), b = r.int(2, 12), c = r.int(2, 12);
      if (new Set([a, b, c]).size < 3) return null;
      const S = a + b + c, D = 2 * S;
      return {
        text: `직육면체의 겨냥도에서 보이는 모서리의 길이의 합은 보이지 않는 모서리의 길이의 합보다 ${cm(D)} 더 길어요. 가로가 ${cm(a)}, 세로가 ${cm(b)}일 때 높이는 몇 cm인가요?`,
        figure: B.boxFig(U.drawDims({ a, h: c, c: b }), { lens: { a: cm(a), c: cm(b), h: '□ cm' } }),
        answer: { type: 'num', value: String(c), unit: 'cm' },
        patterns: [
          { value: String(D - a - b), cause: 'concept', msg: '보이는 모서리는 가로·세로·높이가 3개씩, 보이지 않는 모서리는 1개씩이라서 차이는 (가로+세로+높이) × 2예요.' },
          ...(D % 3 === 0 ? [{ value: String(D / 3 - a - b), cause: 'concept', msg: '차이는 (가로+세로+높이) × 2예요. 3으로 나누면 안 돼요.' }] : []),
          ...(D % 4 === 0 ? [{ value: String(D / 4 - a - b), cause: 'calc', msg: '차이는 (가로+세로+높이) × 2라서 2로 나눠요.' }] : []),
        ].filter((pt) => pos(pt) && Number(pt.value) !== c),
        hints: ['보이는 모서리 9개 = 가로·세로·높이 3개씩, 보이지 않는 모서리 3개 = 1개씩이에요.', '(보이는 합) - (보이지 않는 합) = (가로 + 세로 + 높이) × 2', `${D} ÷ 2 = ${S} → 높이 = ${S} - ${a} - ${b} = ${c}`],
        solution: [`차이 = (가로 + 세로 + 높이) × 3 - (가로 + 세로 + 높이) × 1 = (가로 + 세로 + 높이) × 2`, `가로 + 세로 + 높이 = ${D} ÷ 2 = ${S}`, `높이 = ${S} - ${a} - ${b} = ${c}(cm)`],
        key: `u5s2-top-diff|${a}|${b}|${c}`,
        data: { a, b, c, D },
      };
    },
    verify(p) { const { a, b, D } = p.data; return Number(p.answer.value) === D / 2 - a - b; },
  });

  const tSeen = top({
    id: 'u5s2-top-seen', sub: 'u5s2', styleName: '최상위: 보이는 면의 넓이',
    build(r) {
      const a = r.int(3, 12), b = r.int(2, 10), c = r.int(2, 10);
      if (new Set([a, b, c]).size < 3) return null;
      const seen = a * b + b * c + c * a;
      const hidden = r.chance(0.3);
      const ans = seen;
      return {
        text: `가로 ${cm(a)}, 세로 ${cm(b)}, 높이 ${cm(c)}인 직육면체의 겨냥도에서 ${hidden ? '보이지 않는' : '보이는'} 면 3개의 넓이의 합은 몇 cm²인가요?`,
        figure: B.boxFig(U.drawDims({ a, h: c, c: b }), { lens: { a: cm(a), c: cm(b), h: cm(c) }, shade: hidden ? null : ['front', 'top', 'right'] }),
        answer: { type: 'num', value: String(ans), unit: 'cm²' },
        patterns: [
          { value: String(2 * seen), cause: 'condition', msg: '면 6개의 넓이를 모두 더했어요. 3개만 더해요.' },
          { value: String(a * b * c), cause: 'concept', msg: '세 길이를 모두 곱했어요. 면마다 (가로) × (세로)를 구해 더해요.' },
          { value: String(3 * a * b), cause: 'condition', msg: '세 면의 크기가 모두 같지 않아요. 앞면, 윗면, 옆면을 따로 구해요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: [hidden ? '보이지 않는 면 3개는 보이는 면 3개와 각각 마주 보는 면이라서 크기가 같아요.' : '보이는 면은 앞면, 윗면, 오른쪽 옆면이에요.', `앞면 ${a} × ${c} = ${a * c}, 윗면 ${a} × ${b} = ${a * b}, 옆면 ${b} × ${c} = ${b * c}`, `${a * c} + ${a * b} + ${b * c} = ${seen}`],
        solution: [`앞면 ${a * c} cm², 윗면 ${a * b} cm², 옆면 ${b * c} cm²`, `${a * c} + ${a * b} + ${b * c} = ${seen}(cm²)`, ...(hidden ? ['보이지 않는 면은 보이는 면과 마주 보아 크기가 같아서 합도 같아요.'] : [])],
        key: `u5s2-top-seen|${a}|${b}|${c}|${hidden}`,
        data: { a, b, c },
      };
    },
    verify(p) { const { a, b, c } = p.data; return Number(p.answer.value) === a * b + b * c + c * a; },
  });

  // ---------------------------------------------------------------- u5s3
  const tDiceRow = top({
    id: 'u5s3-top-dicerow', sub: 'u5s3', styleName: '최상위: 주사위 잇기',
    build(r) {
      const n = r.int(2, 3), S = r.int(5, 9), L = r.int(1, 6);
      // 왼쪽 주사위부터: 오른쪽 면 = 7 - 왼쪽 면, 다음 주사위 왼쪽 면 = S - 앞 주사위 오른쪽 면
      let left = L;
      const rows = [];
      for (let i = 0; i < n; i++) {
        const right = 7 - left;
        rows.push([left, right]);
        if (i < n - 1) { left = S - right; if (left < 1 || left > 6) return null; }
      }
      const ans = rows[n - 1][1];
      const fig = { type: 'geo', polys: rows.map((_, i) => ({ pts: [[i * 2.4, 0], [i * 2.4 + 2.2, 0], [i * 2.4 + 2.2, 2.2], [i * 2.4, 2.2]], cls: 'netface' })), segs: [], texts: rows.map((_, i) => ({ p: [i * 2.4 + 1.1, 1.1], t: `주사위 ${i + 1}` })), scale: 34, pad: 0.4 };
      return {
        text: `주사위 ${n}개를 한 줄로 이어 붙였어요. 주사위는 마주 보는 면의 눈의 합이 7이고, 서로 맞닿은 두 면의 눈의 합은 모두 ${S}예요. 맨 왼쪽 면의 눈이 ${L}일 때 맨 오른쪽 면의 눈은 얼마인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans) },
        patterns: [
          { value: String(7 - L), cause: 'condition', msg: '첫째 주사위의 오른쪽 면만 구했어요. 맞닿은 면을 따라 끝까지 가요.' },
          { value: String(L), cause: 'concept', msg: '맞닿은 면의 눈의 합이 7이 아니라 문제에 나온 수예요. 주사위마다 차례로 구해요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: ['한 주사위 안에서는 왼쪽 면과 오른쪽 면이 마주 보는 면이라서 합이 7이에요.', `맞닿은 두 면의 합은 ${S}예요. 왼쪽부터 차례로: ${rows[0][0]} → 오른쪽 ${rows[0][1]} → 다음 주사위 왼쪽 ${S} - ${rows[0][1]} = ${n > 1 ? rows[1][0] : ''}`, rows.map((x, i) => `주사위 ${i + 1}: 왼쪽 ${x[0]}, 오른쪽 ${x[1]}`).join(' / ')],
        solution: rows.map((x, i) => `주사위 ${i + 1}: 왼쪽 ${x[0]} → 오른쪽 7 - ${x[0]} = ${x[1]}${i < n - 1 ? ` → 맞닿은 면 ${S} - ${x[1]} = ${rows[i + 1][0]}` : ''}`).concat([`맨 오른쪽 면: ${ans}`]),
        key: `u5s3-top-dicerow|${n}|${S}|${L}`,
        data: { n, S, L },
      };
    },
    verify(p) { let { n, S, L } = p.data; let right = 0; for (let i = 0; i < n; i++) { right = 7 - L; L = S - right; } return Number(p.answer.value) === right; },
  });

  const tPerpArea = top({
    id: 'u5s3-top-perparea', sub: 'u5s3', styleName: '최상위: 수직인 면의 넓이',
    build(r) {
      const a = r.int(3, 12), b = r.int(2, 10), c = r.int(2, 10);
      if (new Set([a, b, c]).size < 3) return null;
      const f = r.pick(['top', 'front', 'right']);
      // f와 수직인 면 4개의 넓이 합
      const area = { top: a * b, front: a * c, right: b * c };
      const total = 2 * (a * b + b * c + c * a);
      const ans = total - 2 * area[f];
      return {
        text: `가로 ${cm(a)}, 세로 ${cm(b)}, 높이 ${cm(c)}인 직육면체에서 색칠한 면과 수직인 면 4개의 넓이의 합은 몇 cm²인가요?`,
        figure: B.boxFig(U.drawDims({ a, h: c, c: b }), { lens: { a: cm(a), c: cm(b), h: cm(c) }, shade: f }),
        answer: { type: 'num', value: String(ans), unit: 'cm²' },
        patterns: [
          { value: String(total), cause: 'condition', msg: '면 6개를 모두 더했어요. 색칠한 면과 평행한 면 2개는 빼요.' },
          { value: String(total - area[f]), cause: 'condition', msg: '색칠한 면과 마주 보는(평행한) 면도 빼야 해요.' },
          { value: String(ans / 2), cause: 'concept', msg: '수직인 면은 4개예요. 크기가 같은 면이 2개씩 있어요.' },
        ].filter((pt) => Number(pt.value) !== ans),
        hints: ['한 면과 수직인 면은 4개이고, 마주 보는 면끼리 크기가 같아서 2개씩 짝이에요.', `색칠한 면과 평행한 면 2개를 뺀 나머지 4개예요.`, `면 6개의 넓이 합 ${total} - 색칠한 면 2개 ${2 * area[f]} = ${ans}`],
        solution: [`면 6개의 넓이 합: (${a * b} + ${b * c} + ${c * a}) × 2 = ${total}(cm²)`, `색칠한 면과 평행한 면: ${area[f]} × 2 = ${2 * area[f]}(cm²)`, `수직인 면 4개: ${total} - ${2 * area[f]} = ${ans}(cm²)`],
        key: `u5s3-top-perparea|${a}|${b}|${c}|${f}`,
        data: { a, b, c, f },
      };
    },
    verify(p) { const { a, b, c, f } = p.data; const ar = { top: a * b, front: a * c, right: b * c }; return Number(p.answer.value) === 2 * (a * b + b * c + c * a) - 2 * ar[f]; },
  });

  // ---------------------------------------------------------------- u5s4
  const tAddOne = top({
    id: 'u5s4-top-addone', sub: 'u5s4', styleName: '최상위: 한 칸 더 붙이기',
    build(r) {
      const net = B.orient(r.pick(B.NETS), r.int(0, 7));
      const key = (c) => c.join(',');
      const set = new Set(net.map(key));
      const nb = (c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [c[0] + dx, c[1] + dy]);
      // 한 칸을 빼도 이어져 있는 칸만 뺀다
      const leaves = net.filter((c) => nb(c).filter((n) => set.has(key(n))).length === 1);
      const rm = r.pick(leaves);
      const five = net.filter((c) => c !== rm);
      const five2 = new Set(five.map(key));
      const empties = [];
      for (const c of five) for (const n of nb(c)) if (!five2.has(key(n)) && !empties.some((e) => key(e) === key(n))) empties.push(n);
      const good = empties.filter((e) => B.fold([...five, e]));
      const ans = good.length;
      const mx = Math.min(...five.map((c) => c[0]), ...empties.map((c) => c[0])), my = Math.min(...five.map((c) => c[1]), ...empties.map((c) => c[1]));
      const sh = five.map(([x, y]) => [x - mx, y - my]);
      return {
        text: '정사각형 5개를 이어 붙였어요. 정사각형 1개를 더 붙여서 정육면체의 전개도를 만들려고 해요. 붙일 수 있는 자리는 모두 몇 군데인가요? (변끼리 꼭 맞게 붙여요.)',
        figure: U.cellFig(sh, 34),
        answer: { type: 'num', value: String(ans), unit: '군데' },
        patterns: [{ value: String(empties.length), cause: 'concept', msg: '붙일 수 있는 모든 자리를 셌어요. 붙인 뒤 접었을 때 겹치는 면이 생기는 자리는 빼야 해요.' }].filter((pt) => Number(pt.value) !== ans),
        hints: ['빈 자리마다 한 칸을 붙여 보고, 접었을 때 6개 면이 겹치지 않는지 확인해요.', '한 줄로 5칸 이상이 되거나, 접었을 때 이미 있는 면과 같은 자리로 가는 칸은 안 돼요. 마주 보는 면이 빠진 자리를 찾아요.', `붙일 수 있는 빈 자리 ${empties.length}군데 중 전개도가 되는 곳: ${ans}군데`],
        solution: [`정사각형 5개 둘레에 붙일 수 있는 자리는 ${empties.length}군데예요.`, `그중 접었을 때 겹치지 않고 정육면체가 되는 자리는 ${ans}군데예요.`, '빠진 면은 이미 있는 어떤 면과 마주 보는 면이어야 하고, 그 자리에 오도록 붙여야 해요.'],
        key: `u5s4-top-addone|${sh.map(key).sort().join(' ')}`,
        data: { five: sh },
      };
    },
    verify(p) {
      const five = p.data.five, key = (c) => c.join(',');
      const s5 = new Set(five.map(key));
      const em = new Map();
      for (const c of five) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = [c[0] + dx, c[1] + dy]; if (!s5.has(key(n))) em.set(key(n), n); }
      return [...em.values()].filter((e) => B.fold([...five, e])).length === Number(p.answer.value) && Number(p.answer.value) > 0;
    },
  });

  const tDice2 = top({
    id: 'u5s4-top-dice2', sub: 'u5s4', styleName: '최상위: 주사위 전개도',
    build(r) {
      const N = U.makeNet(r, true, 4);
      const pairs = r.shuffle([[1, 6], [2, 5], [3, 4]]);
      const num = {};
      ['U', 'N', 'E'].forEach((f, i) => { const sw = r.chance(0.5); num[f] = pairs[i][sw ? 1 : 0]; num[B.DOPP[f]] = pairs[i][sw ? 0 : 1]; });
      // 서로 마주 보지 않는 두 면에 ?
      let q1, q2;
      do { [q1, q2] = r.sample(N.rects, 2); } while (q1.face === B.DOPP[q2.face]);
      const askSum = r.chance(0.5);
      const v1 = num[q1.face], v2 = num[q2.face];
      const ans = askSum ? v1 + v2 : v1 * v2;
      const o1 = N.rects.find((x) => x.face === B.DOPP[q1.face]), o2 = N.rects.find((x) => x.face === B.DOPP[q2.face]);
      return {
        text: `주사위의 전개도예요. 마주 보는 면의 눈의 합은 7이에요. ㉠과 ㉡에 알맞은 눈의 수의 ${askSum ? '합' : '곱'}은 얼마인가요?`,
        figure: U.netFig(N, { faceText: (rc) => (rc === q1 ? '㉠' : rc === q2 ? '㉡' : String(num[rc.face])) }),
        answer: { type: 'num', value: String(ans) },
        patterns: [{ value: String(askSum ? (7 - v1) + (7 - v2) : (7 - v1) * (7 - v2)), cause: 'concept', msg: '마주 보는 면의 눈을 그대로 썼어요. 7에서 빼야 해요.' }, { value: String(askSum ? v1 * v2 : v1 + v2), cause: 'condition', msg: askSum ? '곱이 아니라 합을 구해요.' : '합이 아니라 곱을 구해요.' }].filter((pt) => Number(pt.value) !== ans),
        hints: ['한 줄로 이어진 세 면에서 첫째와 셋째가 마주 봐요. 마주 보는 면의 합은 7이에요.', `㉠과 마주 보는 면: ${num[o1.face]}, ㉡과 마주 보는 면: ${num[o2.face]}`, `㉠ = 7 - ${num[o1.face]} = ${v1}, ㉡ = 7 - ${num[o2.face]} = ${v2} → ${askSum ? `${v1} + ${v2}` : `${v1} × ${v2}`} = ${ans}`],
        solution: [`㉠과 마주 보는 면은 ${num[o1.face]} → ㉠ = ${v1}`, `㉡과 마주 보는 면은 ${num[o2.face]} → ㉡ = ${v2}`, `${askSum ? `${v1} + ${v2}` : `${v1} × ${v2}`} = ${ans}`],
        key: `u5s4-top-dice2|${N.cells.map((c) => c.join(',')).join(' ')}|${N.rects.map((x) => num[x.face]).join('')}|${q1.name}${q2.name}|${askSum}`,
        data: { v1, v2, o1: num[o1.face], o2: num[o2.face], askSum },
      };
    },
    verify(p) { const d = p.data; return d.v1 + d.o1 === 7 && d.v2 + d.o2 === 7 && Number(p.answer.value) === (d.askSum ? d.v1 + d.v2 : d.v1 * d.v2); },
  });

  // ---------------------------------------------------------------- u5s5
  // 가로·세로·높이 a, b, c인 직육면체 전개도의 둘레를 모든 전개도(11가지 × 돌리기 × 축 바꾸기)에서 계산
  const PR = new Map();
  function perimRange(a, b, c) {
    const key = [a, b, c].sort((x, y) => x - y).join(',');
    if (PR.has(key)) return PR.get(key);
    let mn = Infinity, mx = -Infinity;
    const perms = [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]];
    for (const net of B.NETS) for (let k = 0; k < 8; k++) for (const [x, y, z] of perms) {
      const R = B.layout(B.fold(B.orient(net, k)), { x, y, z });
      if (!R) continue;
      const P = sum(B.boundary(R).map((s) => s.len));
      mn = Math.min(mn, P); mx = Math.max(mx, P);
    }
    PR.set(key, { mn, mx });
    return { mn, mx };
  }
  const tPerimMax = top({
    id: 'u5s5-top-perimmax', sub: 'u5s5', styleName: '최상위: 가장 긴 둘레',
    build(r) {
      const v = r.shuffle([r.int(2, 4), r.int(5, 7), r.int(8, 10)]);
      const [a, b, c] = v;
      const { mn, mx } = perimRange(a, b, c);
      const big = r.chance(0.5);
      const ans = big ? mx : mn;
      const s = [a, b, c].slice().sort((x, y) => y - x);
      return {
        text: `가로 ${cm(a)}, 세로 ${cm(b)}, 높이 ${cm(c)}인 직육면체의 모서리를 잘라 전개도를 만들려고 해요. 전개도의 둘레가 가장 ${big ? '길' : '짧'} 때 둘레는 몇 cm인가요?`,
        figure: B.boxFig(U.drawDims({ a, h: c, c: b }), { lens: { a: cm(a), c: cm(b), h: cm(c) } }),
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [{ value: String(4 * (a + b + c)), cause: 'concept', msg: '직육면체의 모든 모서리의 합이에요. 전개도의 둘레는 자른 모서리의 2배예요.' }, { value: String(big ? mn : mx), cause: 'condition', msg: big ? '가장 짧은 둘레예요. 긴 모서리를 많이 잘라야 둘레가 길어요.' : '가장 긴 둘레예요. 짧은 모서리를 많이 잘라야 둘레가 짧아요.' }].filter((pt) => Number(pt.value) !== ans),
        hints: ['전개도를 만들려면 모서리 7개를 잘라요. 자른 모서리 하나는 전개도의 둘레에 두 번 나와요.', '그래서 전개도의 둘레 = (자른 모서리 7개의 길이의 합) × 2예요.', big ? `길이가 같은 모서리는 4개씩이에요. 가장 긴 ${cm(s[0])} 모서리를 최대한 많이 자르고 나머지를 골라요 → ${ans} cm` : `가장 짧은 ${cm(s[2])} 모서리를 최대한 많이 잘라요 → ${ans} cm`],
        solution: ['전개도의 둘레 = (자른 모서리 7개의 길이의 합) × 2', big ? `긴 모서리를 많이 자를수록 길어져요. 가능한 가장 긴 둘레: ${ans} cm` : `짧은 모서리를 많이 자를수록 짧아져요. 가능한 가장 짧은 둘레: ${ans} cm`, `(앱이 11가지 전개도를 모든 방향으로 펼쳐 보고 확인했어요.)`],
        key: `u5s5-top-perimmax|${a}|${b}|${c}|${big}`,
        data: { a, b, c, big },
      };
    },
    verify(p) { const { a, b, c, big } = p.data; const R = perimRange(a, b, c); return Number(p.answer.value) === (big ? R.mx : R.mn) && R.mx % 2 === 0; },
  });

  const tFindC = top({
    id: 'u5s5-top-findc', sub: 'u5s5', styleName: '최상위: 둘레로 길이 구하기',
    build(r, lv) {
      const N = U.makeNet(r, false, 4);
      if (!N) return null;
      const { x, y, z } = N.L;
      const cnt = { [x]: 0, [y]: 0, [z]: 0 };
      for (const s of N.segs) cnt[s.len]++;
      const P = sum(N.segs.map((s) => s.len));
      const c0 = [N.W / 2, N.H / 2];
      // z 길이의 선분에 □, x·y는 하나씩 적는다
      const sx = N.segs.find((s) => s.len === x), sy = N.segs.find((s) => s.len === y), sz = N.segs.find((s) => s.len === z);
      if (!sx || !sy || !sz || cnt[z] < 2) return null;
      return {
        text: `직육면체의 전개도예요. 전개도의 둘레가 ${cm(P)}일 때 □ 안에 알맞은 수를 구하세요.`,
        figure: U.netFig(N, { faces: false, sides: [sx, sy, sz].map((s, i) => ({ a: s.a, b: s.b, t: i === 2 ? '□ cm' : cm(s.len), c: c0, d: 0.55 })) }),
        answer: { type: 'num', value: String(z), unit: 'cm' },
        patterns: [{ value: String(P - cnt[x] * x - cnt[y] * y), cause: 'condition', msg: `□ 길이의 선분은 둘레에 ${cnt[z]}번 나와요. 그 수로 나눠야 해요.` }, { value: String((P - x - y)), cause: 'concept', msg: '둘레에는 같은 길이의 선분이 여러 번 나와요. 길이마다 몇 번 나오는지 세어요.' }].filter((pt) => pos(pt) && Number(pt.value) !== z),
        hints: ['전개도 둘레의 선분 14개를 길이별로 세어 봐요. 맞닿는 선분끼리 길이가 같아요.', `${cm(x)} 선분 ${cnt[x]}개, ${cm(y)} 선분 ${cnt[y]}개, □ cm 선분 ${cnt[z]}개`, `${x} × ${cnt[x]} + ${y} × ${cnt[y]} = ${cnt[x] * x + cnt[y] * y} → □ = (${P} - ${cnt[x] * x + cnt[y] * y}) ÷ ${cnt[z]} = ${z}`],
        solution: [`길이별 선분 수: ${cm(x)} ${cnt[x]}개, ${cm(y)} ${cnt[y]}개, □ ${cnt[z]}개`, `${P} - ${x} × ${cnt[x]} - ${y} × ${cnt[y]} = ${P - cnt[x] * x - cnt[y] * y}`, `□ = ${P - cnt[x] * x - cnt[y] * y} ÷ ${cnt[z]} = ${z}`],
        key: `u5s5-top-findc|${N.cells.map((c) => c.join(',')).join(' ')}|${JSON.stringify(N.L)}`,
        data: { x, y, z, P, cnt },
      };
    },
    verify(p) { const { x, y, z, P, cnt } = p.data; return cnt[x] * x + cnt[y] * y + cnt[z] * z === P && Number(p.answer.value) === z; },
  });

  M5.addTemplates([tCut, tSame, tDiff, tSeen, tDiceRow, tPerpArea, tAddOne, tDice2, tPerimMax, tFindC]);
})();
