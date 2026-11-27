// 3단원 🏔️ 최상위 문제 (합동과 대칭) — 대표 문제 → 변형 3문제 (build의 v: 0 = 대표, 1~3 = 변형)
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text;
  const j = T.j;
  const form = M5.topForm;
  const top = (o) => Object.assign({ unit: 3, style: 'A', levels: [4, 4], tier: 'top' }, o);
  const cm = (v) => `${v} cm`;
  const notAns = (ans) => (pt) => Number(pt.value) > 0 && Number(pt.value) !== Number(ans);
  const S3 = Math.sqrt(3) / 2;

  // ---------------------------------------------------------------- u3s1 도형의 합동
  const tStrip = top({
    id: 'u3s1-top-strip', sub: 'u3s1', styleName: '최상위: 합동인 도형으로 나누기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      if (f < 2) {
        const k = r.int(2, 6), s = k * r.int(2, 8);
        const P = 2 * (s + s / k);
        const segs = []; for (let i = 1; i < k; i++) segs.push({ a: [i * 5 / k, 0], b: [i * 5 / k, 5] });
        const fig = { type: 'geo', polys: [{ pts: [[0, 0], [5, 0], [5, 5], [0, 5]], cls: 'shape-a' }], segs, scale: 34, pad: 0.8, sides: f === 0 ? [{ a: [0, 5], b: [5, 5], t: cm(s), c: [2.5, 0] }] : [] };
        const ans = f === 0 ? P : s;
        return {
          text: f === 0
            ? `한 변이 ${cm(s)}인 정사각형을 그림처럼 크기와 모양이 같은 직사각형 ${k}개로 나누었어요. 나눈 직사각형 한 개의 둘레는 몇 cm인가요?`
            : `정사각형을 그림처럼 크기와 모양이 같은 직사각형 ${k}개로 나누었어요. 나눈 직사각형 한 개의 둘레가 ${cm(P)}일 때 처음 정사각형의 한 변은 몇 cm인가요?`,
          figure: fig,
          answer: { type: 'num', value: String(ans), unit: 'cm' },
          patterns: (f === 0
            ? [{ value: String(4 * s), cause: 'condition', msg: '처음 정사각형의 둘레를 구했어요. 나눈 직사각형 한 개의 둘레를 구해요.' }, { value: String(s + s / k), cause: 'calc', msg: '둘레는 (가로 + 세로) × 2예요.' }]
            : [{ value: String(P / 4), cause: 'concept', msg: '나눈 도형은 정사각형이 아니라 직사각형이에요.' }, { value: String(P / 2), cause: 'calc', msg: '(가로 + 세로)를 구했어요. 한 변을 구해야 해요.' }]).filter(notAns(ans)),
          hints: [
            '합동인 직사각형이라서 가로와 세로가 모두 같아요. 긴 변은 정사각형의 한 변과 같아요.',
            `짧은 변 = (정사각형의 한 변) ÷ ${k}`,
            f === 0 ? `긴 변 ${s}, 짧은 변 ${s} ÷ ${k} = ${s / k} → 둘레 (${s} + ${s / k}) × 2 = ${P}` : `짧은 변을 1조각이라 하면 긴 변은 ${k}조각 → (긴 변 + 짧은 변) = ${P / 2} cm가 ${k + 1}조각 → 1조각 ${s / k} cm → 한 변 ${s} cm`,
          ],
          solution: f === 0
            ? [`나눈 직사각형: 긴 변 ${cm(s)}, 짧은 변 ${s} ÷ ${k} = ${cm(s / k)}`, `둘레: (${s} + ${s / k}) × 2 = ${P}(cm)`]
            : [`짧은 변을 1조각이라 하면 긴 변(한 변)은 ${k}조각이에요.`, `(긴 변 + 짧은 변) = ${P} ÷ 2 = ${P / 2} → ${k + 1}조각이 ${P / 2} cm → 1조각 ${s / k} cm`, `한 변: ${s / k} × ${k} = ${s}(cm)`],
          key: `u3s1-top-strip|${f}|${k}|${s}`,
          data: { f, k, s, P },
        };
      }
      const m = r.int(2, 4), n = r.int(2, 3), w = m * r.int(2, 5), h = n * r.int(2, 5);
      if (w === h) return null;
      const one = 2 * (w / m + h / n), ans = one * m * n;
      const sc = 5 / Math.max(w, h);
      const segs = [];
      for (let i = 1; i < m; i++) segs.push({ a: [i * w / m * sc, 0], b: [i * w / m * sc, h * sc] });
      for (let i = 1; i < n; i++) segs.push({ a: [0, i * h / n * sc], b: [w * sc, i * h / n * sc] });
      return {
        text: `가로 ${cm(w)}, 세로 ${cm(h)}인 직사각형을 그림처럼 크기와 모양이 같은 작은 직사각형 ${m * n}개로 나누었어요. 나눈 작은 직사각형 ${m * n}개의 둘레를 모두 더하면 몇 cm인가요?`,
        figure: { type: 'geo', polys: [{ pts: [[0, 0], [w * sc, 0], [w * sc, h * sc], [0, h * sc]], cls: 'shape-a' }], segs, sides: [{ a: [0, h * sc], b: [w * sc, h * sc], t: cm(w), c: [w * sc / 2, 0] }, { a: [w * sc, 0], b: [w * sc, h * sc], t: cm(h), c: [0, h * sc / 2] }], scale: 40, pad: 0.9 },
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [{ value: String(one), cause: 'condition', msg: `작은 직사각형 한 개의 둘레예요. ${m * n}개를 모두 더해요.` }, { value: String(2 * (w + h)), cause: 'condition', msg: '큰 직사각형의 둘레예요. 나눈 직사각형마다 둘레를 구해요.' }].filter(notAns(ans)),
        hints: ['나눈 작은 직사각형은 모두 합동이라서 둘레도 모두 같아요.', `작은 직사각형: 가로 ${w} ÷ ${m} = ${w / m}, 세로 ${h} ÷ ${n} = ${h / n}`, `한 개의 둘레 (${w / m} + ${h / n}) × 2 = ${one} → ${one} × ${m * n} = ${ans}`],
        solution: [`작은 직사각형의 가로 ${cm(w / m)}, 세로 ${cm(h / n)}`, `한 개의 둘레: (${w / m} + ${h / n}) × 2 = ${one}(cm)`, `${m * n}개: ${one} × ${m * n} = ${ans}(cm)`],
        key: `u3s1-top-strip|2|${w}|${h}|${m}|${n}`,
        data: { f, w, h, m, n },
      };
    },
    verify(p) {
      const d = p.data, a = Number(p.answer.value);
      if (d.f === 0) return a === 2 * (d.s + d.s / d.k);
      if (d.f === 1) return 2 * (a + a / d.k) === d.P;
      return a === d.m * d.n * 2 * (d.w / d.m + d.h / d.n);
    },
  });

  // 큰 정삼각형을 작은 정삼각형으로 나눈 그림
  const triCount = (n, k) => { const up = n >= k ? ((n - k + 1) * (n - k + 2)) / 2 : 0; const dn = n >= 2 * k ? ((n - 2 * k + 1) * (n - 2 * k + 2)) / 2 : 0; return up + dn; };
  function triFig(n) {
    const pt = (i, jj) => [jj - i / 2, i * S3]; // i: 위에서부터 줄, jj: 그 줄에서 몇 번째
    const segs = [];
    for (let i = 1; i < n; i++) segs.push({ a: pt(i, 0), b: pt(i, i), cls: 'thin' });
    for (let k = 1; k < n; k++) { segs.push({ a: pt(k, 0), b: pt(n, n - k), cls: 'thin' }); segs.push({ a: pt(k, k), b: pt(n, k), cls: 'thin' }); }
    return { type: 'geo', polys: [{ pts: [pt(0, 0), pt(n, 0), pt(n, n)], cls: 'shape-a' }], segs, scale: Math.round(150 / n), pad: 0.3 };
  }
  const tTri = top({
    id: 'u3s1-top-tri', sub: 'u3s1', styleName: '최상위: 합동인 삼각형 세기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const n = r.int(3, 6), sz = f === 1 && n >= 5 && r.chance(0.5) ? 3 : 2;
      let ask, ans, steps, pats;
      if (f === 0) {
        ans = n * n;
        ask = '가장 작은 삼각형과 합동인 삼각형은 모두 몇 개인가요?';
        steps = `위쪽을 향한 것 ${(n * (n + 1)) / 2}개, 아래쪽을 향한 것 ${(n * (n - 1)) / 2}개 → ${ans}개`;
        pats = [{ value: String((n * (n + 1)) / 2), cause: 'condition', msg: '아래쪽을 향한 작은 삼각형도 돌리면 포개어지니 합동이에요.' }];
      } else if (f === 1) {
        ans = triCount(n, sz);
        const up = ((n - sz + 1) * (n - sz + 2)) / 2;
        ask = `가장 작은 삼각형 ${sz * sz}개로 이루어진 정삼각형과 합동인 삼각형은 모두 몇 개인가요?`;
        steps = `한 변이 작은 삼각형 ${sz}개 길이인 삼각형: 위쪽을 향한 것 ${up}개${ans > up ? `, 아래쪽을 향한 것 ${ans - up}개` : ''} → ${ans}개`;
        pats = [{ value: String(n * n), cause: 'condition', msg: `가장 작은 삼각형을 셌어요. 작은 삼각형 ${sz * sz}개로 된 삼각형을 세요.` }, ...(ans > up ? [{ value: String(up), cause: 'condition', msg: '아래쪽을 향한 삼각형(▽)도 세요.' }] : [])];
      } else {
        ans = 0; const parts = [];
        for (let k = 1; k <= n; k++) { ans += triCount(n, k); parts.push(`${k}칸짜리 ${triCount(n, k)}개`); }
        ask = '그림에서 찾을 수 있는 크고 작은 정삼각형은 모두 몇 개인가요?';
        steps = `${parts.join(', ')} → ${ans}개`;
        let upOnly = 0; for (let k = 1; k <= n; k++) upOnly += ((n - k + 1) * (n - k + 2)) / 2;
        pats = [{ value: String(n * n), cause: 'condition', msg: '크기가 다른 정삼각형도 모두 세요.' }, { value: String(upOnly), cause: 'condition', msg: '아래쪽을 향한 삼각형(▽)도 빠짐없이 세요.' }];
      }
      return {
        text: `큰 정삼각형의 각 변을 ${n}등분하여 크기가 같은 작은 정삼각형으로 나누었어요. ${ask}`,
        figure: triFig(n),
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: pats.filter(notAns(ans)),
        hints: ['위쪽을 향한 삼각형(△)과 아래쪽을 향한 삼각형(▽)을 나누어 세면 빠뜨리지 않아요.', '줄마다 몇 개인지 세어 보고 더해요. 크기가 다르면 크기별로 따로 세요.', steps],
        solution: [steps],
        key: `u3s1-top-tri|${f}|${n}|${sz}`,
        data: { f, n, sz },
      };
    },
    verify(p) {
      const { f, n, sz } = p.data;
      // 꼭짓점 좌표로 모든 정삼각형을 직접 세어 확인
      const pts = []; for (let i = 0; i <= n; i++) for (let jj = 0; jj <= i; jj++) pts.push([i, jj]);
      const key = (i, jj) => i * 100 + jj;
      const has = new Set(pts.map(([i, jj]) => key(i, jj)));
      const bySize = {};
      for (const [i, jj] of pts) for (let k = 1; k <= n; k++) {
        if (has.has(key(i + k, jj)) && has.has(key(i + k, jj + k))) bySize[k] = (bySize[k] || 0) + 1; // △
        if (has.has(key(i, jj + k)) && has.has(key(i + k, jj + k)) && i - 0 >= 0 && jj + k <= i) bySize[k] = (bySize[k] || 0) + 1; // ▽
      }
      const a = Number(p.answer.value);
      if (f === 0) return a === bySize[1];
      if (f === 1) return a === bySize[sz];
      return a === Object.values(bySize).reduce((s, x) => s + x, 0);
    },
  });

  // ---------------------------------------------------------------- u3s2 합동인 도형의 성질
  const PARA = [[0, 0], [4.4, 0], [5.8, 2.6], [1.4, 2.6]];
  const paraFig = (diag) => ({
    type: 'geo', polys: [{ pts: PARA, cls: 'shape-a' }], segs: diag ? [{ a: PARA[3], b: PARA[1] }] : [],
    labels: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'].map((t, i) => ({ p: PARA[[3, 0, 1, 2][i]], t, c: [2.9, 1.3] })), scale: 40, pad: 0.8,
  });
  const tPair = top({
    id: 'u3s2-top-pair', sub: 'u3s2', styleName: '최상위: 합동인 두 삼각형의 둘레',
    build(r, lv, v) {
      const f = form(r, v, 3);
      let a, b, c;
      do { a = r.int(4, 15); b = r.int(4, 15); c = r.int(4, 15); } while (a + b <= c || b + c <= a || a + c <= b || new Set([a, b, c]).size < 3);
      if (f === 0) {
        const P = a + b + c;
        return {
          text: `삼각형 ㄱㄴㄷ과 삼각형 ㄹㅁㅂ은 서로 합동이에요. 변 ㄱㄴ은 ${cm(a)}, 변 ㅁㅂ은 ${cm(b)}이고, 삼각형 ㄹㅁㅂ의 둘레는 ${cm(P)}예요. 변 ㄷㄱ은 몇 cm인가요?`,
          figure: { type: 'geo', polys: [{ pts: [[0, 3], [1.2, 0], [4, 3]], cls: 'shape-a' }, { pts: [[6, 3], [7.2, 0], [10, 3]], cls: 'shape-b' }], labels: [{ p: [1.2, 0], t: 'ㄱ', c: [1.7, 2] }, { p: [0, 3], t: 'ㄴ', c: [1.7, 2] }, { p: [4, 3], t: 'ㄷ', c: [1.7, 2] }, { p: [7.2, 0], t: 'ㄹ', c: [7.7, 2] }, { p: [6, 3], t: 'ㅁ', c: [7.7, 2] }, { p: [10, 3], t: 'ㅂ', c: [7.7, 2] }], scale: 34, pad: 0.8 },
          answer: { type: 'num', value: String(c), unit: 'cm' },
          patterns: [{ value: String(P - a), cause: 'calc', msg: '둘레에서 두 변을 모두 빼야 해요.' }, { value: String(P - 2 * a), cause: 'concept', msg: `변 ㅁㅂ에 대응하는 변은 ㄴㄷ이에요. ㄱㄴ과 ㅁㅂ은 대응변이 아니에요.` }].filter(notAns(c)),
          hints: ['합동인 두 삼각형은 대응변의 길이가 같아요. 순서대로 ㄱ↔ㄹ, ㄴ↔ㅁ, ㄷ↔ㅂ이 대응점이에요.', `변 ㄹㅁ = 변 ㄱㄴ = ${cm(a)}, 변 ㄴㄷ = 변 ㅁㅂ = ${cm(b)}`, `변 ㄷㄱ = 변 ㅂㄹ = ${P} - ${a} - ${b} = ${c}(cm)`],
          solution: [`대응변: ㄹㅁ = ㄱㄴ = ${cm(a)}, ㅁㅂ = ${cm(b)}`, `ㅂㄹ = ${P} - ${a} - ${b} = ${c}(cm)`, `ㄷㄱ은 ㅂㄹ의 대응변이라서 ${cm(c)}`],
          key: `u3s2-top-pair|0|${a}|${b}|${c}`,
          data: { f, a, b, c, P },
        };
      }
      const P = 2 * (a + b);
      const ans = f === 1 ? P : b;
      return {
        text: f === 1
          ? `삼각형 ㄱㄴㄷ과 삼각형 ㄷㄹㄱ은 서로 합동이에요. 두 삼각형을 이어 붙여 사각형 ㄱㄴㄷㄹ을 만들었어요. 변 ㄱㄴ은 ${cm(a)}, 변 ㄴㄷ은 ${cm(b)}, 선분 ㄱㄷ은 ${cm(c)}일 때 사각형 ㄱㄴㄷㄹ의 둘레는 몇 cm인가요?`
          : `삼각형 ㄱㄴㄷ과 삼각형 ㄷㄹㄱ은 서로 합동이에요. 두 삼각형을 이어 붙여 만든 사각형 ㄱㄴㄷㄹ의 둘레는 ${cm(P)}이고, 변 ㄱㄴ은 ${cm(a)}예요. 변 ㄴㄷ은 몇 cm인가요?`,
        figure: paraFig(true),
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: (f === 1
          ? [{ value: String(2 * (a + b) + 2 * c), cause: 'condition', msg: '선분 ㄱㄷ은 사각형 안쪽에 있어서 둘레가 아니에요.' }, { value: String(a + b + c), cause: 'condition', msg: '삼각형 하나의 둘레예요. 사각형의 둘레를 구해요.' }]
          : [{ value: String(P / 2), cause: 'calc', msg: '둘레의 반은 (ㄱㄴ + ㄴㄷ)이에요. ㄱㄴ을 빼야 해요.' }, { value: String(P - a), cause: 'concept', msg: '변 ㄷㄹ = 변 ㄱㄴ, 변 ㄹㄱ = 변 ㄴㄷ이에요. 둘레는 (ㄱㄴ + ㄴㄷ) × 2예요.' }]).filter(notAns(ans)),
        hints: ['순서대로 ㄱ↔ㄷ, ㄴ↔ㄹ, ㄷ↔ㄱ이 대응점이에요. 그래서 변 ㄱㄴ = 변 ㄷㄹ, 변 ㄴㄷ = 변 ㄹㄱ이에요.', f === 1 ? '선분 ㄱㄷ은 두 삼각형이 붙은 곳이라 둘레에 들어가지 않아요.' : '둘레 = (ㄱㄴ + ㄴㄷ) × 2', f === 1 ? `(${a} + ${b}) × 2 = ${P}(cm)` : `${P} ÷ 2 = ${P / 2} → ㄴㄷ = ${P / 2} - ${a} = ${b}(cm)`],
        solution: ['대응변: ㄱㄴ = ㄷㄹ, ㄴㄷ = ㄹㄱ', f === 1 ? `둘레: (${a} + ${b}) × 2 = ${P}(cm)` : `ㄱㄴ + ㄴㄷ = ${P} ÷ 2 = ${P / 2} → ㄴㄷ = ${b}(cm)`],
        key: `u3s2-top-pair|${f}|${a}|${b}|${c}`,
        data: { f, a, b, c, P },
      };
    },
    verify(p) {
      const { f, a, b, c, P } = p.data, x = Number(p.answer.value);
      if (f === 0) return a + b + x === P && x === c;
      if (f === 1) return x === 2 * (a + b);
      return 2 * (a + x) === P;
    },
  });

  const tAngle = top({
    id: 'u3s2-top-angle', sub: 'u3s2', styleName: '최상위: 합동인 도형의 각',
    build(r, lv, v) {
      const f = form(r, v, 3);
      if (f === 0) {
        const x = r.int(30, 100), y = r.int(25, 120 - Math.min(x, 90));
        const ans = 180 - x - y;
        if (ans < 15) return null;
        return {
          text: `삼각형 ㄱㄴㄷ과 삼각형 ㄹㅁㅂ은 서로 합동이에요. 각 ㄱ은 ${x}°, 각 ㅁ은 ${y}°일 때 각 ㅂ은 몇 도인가요?`,
          answer: { type: 'num', value: String(ans), unit: '°' },
          patterns: [{ value: String(y), cause: 'concept', msg: '각 ㅁ과 대응하는 각은 각 ㄴ이에요. 각 ㅂ은 각 ㄷ과 대응해요.' }, { value: String(x), cause: 'concept', msg: '각 ㄱ과 대응하는 각은 각 ㄹ이에요.' }, { value: String(360 - x - y), cause: 'concept', msg: '삼각형의 세 각의 합은 180°예요.' }].filter(notAns(ans)),
          hints: ['합동인 도형에서 대응각의 크기는 같아요. ㄱ↔ㄹ, ㄴ↔ㅁ, ㄷ↔ㅂ이에요.', `각 ㄴ = 각 ㅁ = ${y}°, 각 ㄹ = 각 ㄱ = ${x}°`, `각 ㅂ = 180° - ${x}° - ${y}° = ${ans}°`],
          solution: [`각 ㄹ = 각 ㄱ = ${x}°`, `각 ㅂ = 180° - ${x}° - ${y}° = ${ans}°`],
          key: `u3s2-top-angle|0|${x}|${y}`,
          data: { f, x, y },
        };
      }
      if (f === 1) {
        const a = r.int(60, 120), b = r.int(60, 120), c = r.int(60, 120);
        const ans = 360 - a - b - c;
        if (ans < 40 || ans > 150) return null;
        return {
          text: `사각형 ㄱㄴㄷㄹ과 사각형 ㅁㅂㅅㅇ은 서로 합동이에요. 각 ㄱ은 ${a}°, 각 ㅂ은 ${b}°, 각 ㄹ은 ${c}°일 때 각 ㅅ은 몇 도인가요?`,
          answer: { type: 'num', value: String(ans), unit: '°' },
          patterns: [{ value: String(180 - a), cause: 'concept', msg: '사각형의 네 각의 합은 360°예요.' }, { value: String(c), cause: 'concept', msg: '각 ㄹ과 대응하는 각은 각 ㅇ이에요. 각 ㅅ은 각 ㄷ과 대응해요.' }].filter(notAns(ans)),
          hints: ['대응점: ㄱ↔ㅁ, ㄴ↔ㅂ, ㄷ↔ㅅ, ㄹ↔ㅇ. 대응각의 크기는 같아요.', `사각형 ㄱㄴㄷㄹ에서 각 ㄴ = 각 ㅂ = ${b}°이고, 네 각의 합은 360°예요.`, `각 ㅅ = 각 ㄷ = 360° - ${a}° - ${b}° - ${c}° = ${ans}°`],
          solution: [`각 ㄴ = 각 ㅂ = ${b}°`, `각 ㄷ = 360° - ${a}° - ${b}° - ${c}° = ${ans}°`, `각 ㅅ = 각 ㄷ = ${ans}°`],
          key: `u3s2-top-angle|1|${a}|${b}|${c}`,
          data: { f, a, b, c },
        };
      }
      const x = r.int(25, 80), y = r.int(20, 70);
      if (x + y > 150) return null;
      const ans = x + y;
      return {
        text: `삼각형 ㄱㄴㄷ과 삼각형 ㄷㄹㄱ은 서로 합동이에요. 두 삼각형을 이어 붙여 사각형 ㄱㄴㄷㄹ을 만들었어요. 각 ㄴㄱㄷ은 ${x}°, 각 ㄱㄷㄴ은 ${y}°일 때 각 ㄴㄷㄹ은 몇 도인가요?`,
        figure: paraFig(true),
        answer: { type: 'num', value: String(ans), unit: '°' },
        patterns: [{ value: String(180 - x - y), cause: 'concept', msg: '각 ㄴ의 크기를 구했어요. 각 ㄴㄷㄹ은 각 ㄴㄷㄱ과 각 ㄱㄷㄹ을 합친 각이에요.' }, { value: String(2 * y), cause: 'concept', msg: '각 ㄱㄷㄹ의 대응각은 각 ㄷㄱㄴ이에요. 각 ㄴㄷㄱ이 아니에요.' }].filter(notAns(ans)),
        hints: ['대응점: ㄱ↔ㄷ, ㄴ↔ㄹ, ㄷ↔ㄱ. 그래서 각 ㄱㄷㄹ의 대응각은 각 ㄷㄱㄴ이에요.', `각 ㄱㄷㄹ = 각 ㄷㄱㄴ = ${x}°`, `각 ㄴㄷㄹ = 각 ㄴㄷㄱ + 각 ㄱㄷㄹ = ${y}° + ${x}° = ${ans}°`],
        solution: [`각 ㄱㄷㄹ은 각 ㄷㄱㄴ의 대응각이라서 ${x}°`, `각 ㄴㄷㄹ = ${y}° + ${x}° = ${ans}°`],
        key: `u3s2-top-angle|2|${x}|${y}`,
        data: { f, x, y },
      };
    },
    verify(p) {
      const d = p.data, a = Number(p.answer.value);
      if (d.f === 0) return d.x + d.y + a === 180;
      if (d.f === 1) return d.a + d.b + d.c + a === 360;
      return a === d.x + d.y;
    },
  });

  // ---------------------------------------------------------------- 모눈 칸 도우미
  const ck = (c) => `${c[0]},${c[1]}`;
  function grow(r, n, ok, start) {
    const S = new Map([[ck(start), start]]);
    for (let t = 0; t < 200 && S.size < n; t++) {
      const base = r.pick([...S.values()]);
      const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const c = [base[0] + dx, base[1] + dy];
      if (ok(c)) S.set(ck(c), c);
    }
    return [...S.values()];
  }
  function perim(cells) {
    const has = new Set(cells.map(ck));
    let e = 0;
    for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!has.has(ck([x + dx, y + dy]))) e++;
    return e;
  }
  const cellPolys = (cells, cls = 'shape-a') => cells.map(([x, y]) => ({ pts: [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]], cls }));
  function lineHalf(r) {
    const half = grow(r, r.int(4, 7), ([x, y]) => x >= 0 && x <= 2 && y >= 0 && y <= 4, [2, r.int(1, 3)]);
    const full = [...half, ...half.map(([x, y]) => [5 - x, y])];
    return { half, full, fig: { type: 'geo', grid: { w: 6, h: 5 }, polys: cellPolys(half), segs: [{ a: [3, -0.4], b: [3, 5.4], cls: 'axis' }], scale: 34, pad: 0.5 } };
  }

  // ---------------------------------------------------------------- u3s3 선대칭도형
  const tHalf = top({
    id: 'u3s3-top-half', sub: 'u3s3', styleName: '최상위: 선대칭도형 완성하기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const { half, full, fig } = lineHalf(r);
      const c = f === 2 ? 2 : 1;
      const A = full.length, Pm = perim(full);
      const ans = f === 1 ? Pm * c : A * c * c;
      const askP = f === 1;
      return {
        text: `직선을 대칭축으로 하는 선대칭도형의 반쪽을 모눈종이에 그렸어요. 선대칭도형을 완성했을 때 완성한 도형의 ${askP ? '둘레' : '넓이'}는 몇 ${askP ? 'cm' : 'cm²'}인가요? (모눈 한 칸은 한 변이 ${cm(c)}인 정사각형이에요.)`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: askP ? 'cm' : 'cm²' },
        patterns: (askP
          ? [{ value: String(perim(half) * c * 2), cause: 'concept', msg: '반쪽의 둘레를 두 배 하면 대칭축 위에서 맞닿는 변까지 세게 돼요. 완성한 도형의 바깥 둘레만 세요.' }, { value: String(perim(half) * c), cause: 'condition', msg: '반쪽만 셌어요. 도형을 완성해서 세요.' }]
          : [{ value: String(half.length * c * c), cause: 'condition', msg: '반쪽의 넓이예요. 완성한 도형은 두 배예요.' }, ...(c === 2 ? [{ value: String(A * c), cause: 'concept', msg: '한 칸의 넓이는 2 × 2 = 4 cm²예요.' }] : [])]).filter(notAns(ans)),
        hints: [
          '대칭축을 따라 접었을 때 반쪽과 완전히 겹치도록 반대쪽을 그려요.',
          askP ? '완성한 도형의 바깥 변을 하나씩 세요. 대칭축 위에서 맞닿은 변은 안쪽이라서 세지 않아요.' : `반쪽이 ${half.length}칸이니 완성한 도형은 ${A}칸이에요.`,
          askP ? `바깥 변 ${Pm}개 × ${c} = ${ans}(cm)` : `${A}칸 × ${c * c} cm² = ${ans} cm²`,
        ],
        solution: [`완성한 도형: ${A}칸`, askP ? `둘레의 변 ${Pm}개 → ${Pm} × ${c} = ${ans}(cm)` : `넓이: ${A} × ${c * c} = ${ans}(cm²)`],
        key: `u3s3-top-half|${f}|${half.map(ck).sort().join(' ')}`,
        data: { f, half, c },
      };
    },
    verify(p) {
      const { f, half, c } = p.data;
      const full = [...half, ...half.map(([x, y]) => [5 - x, y])];
      return Number(p.answer.value) === (f === 1 ? perim(full) * c : new Set(full.map(ck)).size * c * c);
    },
  });

  // 도형과 대칭축의 수
  const reg = (n, cx, rad = 1.1, rot = -Math.PI / 2) => Array.from({ length: n }, (_, i) => [cx + rad * Math.cos(rot + (2 * Math.PI * i) / n), 1.3 + rad * Math.sin(rot + (2 * Math.PI * i) / n)]);
  const SHAPES = [
    { nm: '정삼각형', ax: 3, pts: (x) => reg(3, x, 1.2) },
    { nm: '정사각형', ax: 4, pts: (x) => reg(4, x, 1.2, Math.PI / 4) },
    { nm: '정오각형', ax: 5, pts: (x) => reg(5, x) },
    { nm: '정육각형', ax: 6, pts: (x) => reg(6, x, 1.1, 0) },
    { nm: '정팔각형', ax: 8, pts: (x) => reg(8, x, 1.1, Math.PI / 8) },
    { nm: '직사각형', ax: 2, pts: (x) => [[x - 1.2, 0.6], [x + 1.2, 0.6], [x + 1.2, 2], [x - 1.2, 2]] },
    { nm: '마름모', ax: 2, pts: (x) => [[x, 0.1], [x + 0.9, 1.3], [x, 2.5], [x - 0.9, 1.3]] },
    { nm: '이등변삼각형', ax: 1, pts: (x) => [[x, 0.1], [x + 0.8, 2.4], [x - 0.8, 2.4]] },
    { nm: '평행사변형', ax: 0, pts: (x) => [[x - 1.2, 2.2], [x + 0.6, 2.2], [x + 1.2, 0.4], [x - 0.6, 0.4]] },
  ];
  const NM = ['가', '나', '다', '라', '마'];
  const tAxes = top({
    id: 'u3s3-top-axes', sub: 'u3s3', styleName: '최상위: 대칭축의 수',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const k = f === 0 ? 3 : f === 1 ? 4 : 5;
      const sh = r.sample(SHAPES, k);
      const fig = { type: 'geo', polys: sh.map((s, i) => ({ pts: s.pts(i * 3), cls: 'shape-a' })), texts: sh.map((s, i) => ({ p: [i * 3, 3.2], t: NM[i] })), scale: 30, pad: 0.4 };
      const list = sh.map((s, i) => `${NM[i]}: ${s.nm}`).join(', ');
      const ax = sh.map((s) => s.ax);
      let ask, ans, steps, pats;
      if (f === 0) {
        ans = ax.reduce((a, b) => a + b, 0);
        ask = '세 도형의 대칭축의 수를 모두 더하면 몇 개인가요?';
        steps = `${sh.map((s) => `${s.nm} ${s.ax}개`).join(', ')} → ${ans}개`;
        const rh = sh.filter((s) => s.nm === '직사각형' || s.nm === '마름모').length;
        pats = rh ? [{ value: String(ans + 2 * rh), cause: 'concept', msg: '직사각형의 대각선은 대칭축이 아니에요. 직사각형과 마름모의 대칭축은 2개씩이에요.' }] : [];
      } else if (f === 1) {
        ans = Math.max(...ax) - Math.min(...ax);
        ask = '대칭축이 가장 많은 도형과 가장 적은 도형의 대칭축의 수의 차는 몇 개인가요?';
        steps = `${sh.map((s) => `${s.nm} ${s.ax}개`).join(', ')} → ${Math.max(...ax)} - ${Math.min(...ax)} = ${ans}`;
        pats = [{ value: String(Math.max(...ax)), cause: 'concept', msg: '평행사변형처럼 대칭축이 없는 도형은 0개예요. 가장 적은 수를 빼요.' }];
      } else {
        const t = r.int(2, 4);
        ans = ax.filter((x) => x >= t).length;
        ask = `대칭축이 ${t}개 이상인 도형은 모두 몇 개인가요?`;
        steps = `${sh.map((s) => `${s.nm} ${s.ax}개`).join(', ')} → ${t}개 이상: ${ans}개`;
        pats = [{ value: String(ax.filter((x) => x > t).length), cause: 'concept', msg: `'이상'은 ${t}개인 것도 들어가요.` }];
      }
      if (!ans) return null;
      return {
        text: `도형을 보고 물음에 답하세요. (${list})\n${ask}`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: pats.filter(notAns(ans)),
        hints: ['대칭축은 도형을 접었을 때 완전히 겹치게 하는 직선이에요. 접는 방법을 모두 찾아요.', '정■각형의 대칭축은 ■개예요. 직사각형·마름모는 2개, 이등변삼각형은 1개, 평행사변형은 0개예요.', steps],
        solution: [steps],
        key: `u3s3-top-axes|${f}|${sh.map((s) => s.nm).join(',')}|${ask}`,
        data: { f, ax, ask },
      };
    },
    verify(p) {
      const { f, ax, ask } = p.data, a = Number(p.answer.value);
      if (f === 0) return a === ax.reduce((x, y) => x + y, 0);
      if (f === 1) return a === Math.max(...ax) - Math.min(...ax);
      const t = Number(ask.match(/(\d)개 이상/)[1]);
      return a === ax.filter((x) => x >= t).length;
    },
  });

  // ---------------------------------------------------------------- u3s4 점대칭도형
  const tPoint = top({
    id: 'u3s4-top-complete', sub: 'u3s4', styleName: '최상위: 점대칭도형 완성하기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const half = grow(r, r.int(4, 7), ([x, y]) => x >= 0 && x <= 5 && y >= 0 && y <= 2, [r.int(2, 3), 2]);
      const rot = ([x, y]) => [5 - x, 5 - y];
      const full = [...half, ...half.map(rot)];
      const c = f === 2 ? 2 : 1;
      const askP = f === 1;
      const A = full.length, Pm = perim(full);
      const ans = askP ? Pm * c : A * c * c;
      return {
        text: `점 ㅇ을 대칭의 중심으로 하는 점대칭도형의 일부분을 모눈종이에 그렸어요. 점대칭도형을 완성했을 때 완성한 도형의 ${askP ? '둘레' : '넓이'}는 몇 ${askP ? 'cm' : 'cm²'}인가요? (모눈 한 칸은 한 변이 ${cm(c)}인 정사각형이에요.)`,
        figure: { type: 'geo', grid: { w: 6, h: 6 }, polys: cellPolys(half), dots: [{ p: [3, 3], t: 'ㅇ', c: [3.5, 2.5] }], scale: 32, pad: 0.5 },
        answer: { type: 'num', value: String(ans), unit: askP ? 'cm' : 'cm²' },
        patterns: (askP
          ? [{ value: String(perim(half) * c * 2), cause: 'concept', msg: '두 부분이 맞닿는 변은 안쪽이라 둘레가 아니에요. 완성한 도형의 바깥 둘레만 세요.' }, { value: String(perim(half) * c), cause: 'condition', msg: '그려진 부분만 셌어요. 도형을 완성해서 세요.' }]
          : [{ value: String(half.length * c * c), cause: 'condition', msg: '그려진 부분의 넓이예요. 완성한 도형은 두 배예요.' }, ...(c === 2 ? [{ value: String(A * c), cause: 'concept', msg: '한 칸의 넓이는 2 × 2 = 4 cm²예요.' }] : [])]).filter(notAns(ans)),
        hints: [
          '각 칸을 점 ㅇ을 중심으로 180° 돌린 자리에 칸을 그려요. 대응점은 점 ㅇ에서 같은 거리, 반대쪽에 있어요.',
          askP ? '완성한 도형의 바깥 변을 하나씩 세요. 두 부분이 맞닿은 변은 세지 않아요.' : `그려진 부분이 ${half.length}칸이니 완성한 도형은 ${A}칸이에요.`,
          askP ? `바깥 변 ${Pm}개 × ${c} = ${ans}(cm)` : `${A}칸 × ${c * c} cm² = ${ans} cm²`,
        ],
        solution: [`완성한 도형: ${A}칸`, askP ? `둘레의 변 ${Pm}개 → ${Pm} × ${c} = ${ans}(cm)` : `넓이: ${A} × ${c * c} = ${ans}(cm²)`],
        key: `u3s4-top-complete|${f}|${half.map(ck).sort().join(' ')}`,
        data: { f, half, c },
      };
    },
    verify(p) {
      const { f, half, c } = p.data;
      const full = [...half, ...half.map(([x, y]) => [5 - x, 5 - y])];
      if (new Set(full.map(ck)).size !== full.length) return false;
      return Number(p.answer.value) === (f === 1 ? perim(full) * c : full.length * c * c);
    },
  });

  const HEX = [[-3, 0.2], [-1.2, -1.9], [2.2, -1.5], [3, -0.2], [1.2, 1.9], [-2.2, 1.5]];
  const tPSides = top({
    id: 'u3s4-top-sides', sub: 'u3s4', styleName: '최상위: 점대칭도형의 변',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const L = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ'];
      const hexFig = (diag) => ({ type: 'geo', polys: [{ pts: HEX, cls: 'shape-a' }], segs: diag ? [{ a: HEX[0], b: HEX[3], cls: 'dash' }, { a: HEX[1], b: HEX[4], cls: 'dash' }] : [], dots: [{ p: [0, 0], t: 'ㅇ', c: [0.4, -0.6] }], labels: HEX.map((p, i) => ({ p, t: L[i], c: [0, 0] })), scale: 34, pad: 0.8 });
      if (f === 0) {
        const a = r.int(4, 15), b = r.int(4, 15);
        if (a === b) return null;
        const P = 2 * (a + b);
        return {
          text: `사각형 ㄱㄴㄷㄹ은 점대칭도형이에요. 변 ㄱㄴ은 ${cm(a)}이고, 사각형의 둘레가 ${cm(P)}일 때 변 ㄴㄷ은 몇 cm인가요?`,
          figure: paraFig(false),
          answer: { type: 'num', value: String(b), unit: 'cm' },
          patterns: [{ value: String(P - a), cause: 'concept', msg: '점대칭도형에서 마주 보는 변(대응변)의 길이가 같아요. 둘레는 (ㄱㄴ + ㄴㄷ) × 2예요.' }, { value: String(P / 2), cause: 'calc', msg: '(ㄱㄴ + ㄴㄷ)을 구했어요. 변 ㄱㄴ을 빼요.' }].filter(notAns(b)),
          hints: ['점대칭도형을 180° 돌리면 ㄱ↔ㄷ, ㄴ↔ㄹ이 대응점이에요. 대응변의 길이는 같아요.', `변 ㄷㄹ = 변 ㄱㄴ = ${cm(a)}, 변 ㄹㄱ = 변 ㄴㄷ`, `${P} ÷ 2 = ${P / 2} → ${P / 2} - ${a} = ${b}(cm)`],
          solution: ['대응변: ㄱㄴ = ㄷㄹ, ㄴㄷ = ㄹㄱ', `ㄱㄴ + ㄴㄷ = ${P} ÷ 2 = ${P / 2}`, `ㄴㄷ = ${P / 2} - ${a} = ${b}(cm)`],
          key: `u3s4-top-sides|0|${a}|${b}`,
          data: { f, a, b, P },
        };
      }
      if (f === 1) {
        const a = r.int(3, 12), b = r.int(3, 12), c = r.int(3, 12);
        const ans = 2 * (a + b + c);
        return {
          text: `육각형 ㄱㄴㄷㄹㅁㅂ은 점 ㅇ을 대칭의 중심으로 하는 점대칭도형이에요. 변 ㄱㄴ은 ${cm(a)}, 변 ㄴㄷ은 ${cm(b)}, 변 ㄷㄹ은 ${cm(c)}일 때 육각형의 둘레는 몇 cm인가요?`,
          figure: hexFig(false),
          answer: { type: 'num', value: String(ans), unit: 'cm' },
          patterns: [{ value: String(a + b + c), cause: 'condition', msg: '세 변만 더했어요. 대응변 3개도 더해요.' }].filter(notAns(ans)),
          hints: ['점 ㅇ을 중심으로 180° 돌리면 ㄱ↔ㄹ, ㄴ↔ㅁ, ㄷ↔ㅂ이 대응점이에요.', `변 ㄹㅁ = 변 ㄱㄴ, 변 ㅁㅂ = 변 ㄴㄷ, 변 ㅂㄱ = 변 ㄷㄹ`, `(${a} + ${b} + ${c}) × 2 = ${ans}(cm)`],
          solution: ['대응변의 길이는 같아요: ㄱㄴ = ㄹㅁ, ㄴㄷ = ㅁㅂ, ㄷㄹ = ㅂㄱ', `둘레: (${a} + ${b} + ${c}) × 2 = ${ans}(cm)`],
          key: `u3s4-top-sides|1|${a}|${b}|${c}`,
          data: { f, a, b, c },
        };
      }
      const d = r.int(3, 15), e = r.int(3, 15);
      if (d === e) return null;
      const ans = 2 * d + 2 * e;
      return {
        text: `육각형 ㄱㄴㄷㄹㅁㅂ은 점 ㅇ을 대칭의 중심으로 하는 점대칭도형이에요. 선분 ㄱㅇ은 ${cm(d)}, 선분 ㄴㅇ은 ${cm(e)}일 때 선분 ㄱㄹ과 선분 ㄴㅁ의 길이의 합은 몇 cm인가요?`,
        figure: hexFig(true),
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [{ value: String(d + e), cause: 'concept', msg: '대칭의 중심은 대응점을 이은 선분을 둘로 똑같이 나눠요. 선분 ㄱㄹ은 ㄱㅇ의 2배예요.' }].filter(notAns(ans)),
        hints: ['ㄱ과 ㄹ, ㄴ과 ㅁ은 대응점이에요. 대응점을 이은 선분은 대칭의 중심을 지나요.', `대칭의 중심에서 대응점까지의 거리는 같아요: ㅇㄹ = ㄱㅇ = ${cm(d)}, ㅇㅁ = ㄴㅇ = ${cm(e)}`, `${d} × 2 + ${e} × 2 = ${ans}(cm)`],
        solution: [`선분 ㄱㄹ = ${d} × 2 = ${2 * d}(cm)`, `선분 ㄴㅁ = ${e} × 2 = ${2 * e}(cm)`, `합: ${ans} cm`],
        key: `u3s4-top-sides|2|${d}|${e}`,
        data: { f, d, e },
      };
    },
    verify(p) {
      const x = p.data, a = Number(p.answer.value);
      if (x.f === 0) return 2 * (x.a + a) === x.P;
      if (x.f === 1) return a === 2 * (x.a + x.b + x.c);
      return a === 2 * (x.d + x.e);
    },
  });

  // ---------------------------------------------------------------- 이야기 문제
  const tStory = top({
    id: 'u3s3-top-story', sub: 'u3s3', story: true, styleName: '최상위 이야기: 대칭 카드 꾸미기',
    build(r) {
      const { half, full, fig } = lineHalf(r);
      const A = full.length, Pm = perim(full);
      const gold = r.int(2, 6) * 10, rib = r.int(3, 9) * 10;
      const ans = A * gold + Pm * rib;
      return {
        text: `지우는 카드에 직선을 대칭축으로 하는 선대칭 모양을 꾸미려고 해요. 모눈종이에 반쪽을 그렸어요.\n• 모양을 완성하고 색칠한 칸마다 반짝이 스티커를 붙여요. 스티커는 한 칸에 ${gold}원이에요.\n• 완성한 모양의 둘레를 따라 리본을 붙여요. 리본은 1 cm에 ${rib}원이에요.\n모눈 한 칸이 한 변이 1 cm인 정사각형일 때, 필요한 돈은 모두 얼마인가요?`,
        figure: fig,
        answer: { type: 'num', value: String(ans), unit: '원' },
        patterns: [
          { value: String(half.length * gold + perim(half) * rib), cause: 'condition', msg: '반쪽만 계산했어요. 모양을 완성한 다음 계산해요.' },
          { value: String(A * gold + perim(half) * 2 * rib), cause: 'concept', msg: '대칭축 위에서 맞닿은 변은 둘레가 아니에요. 완성한 모양의 바깥 둘레만 세요.' },
          { value: String(A * gold), cause: 'condition', msg: '리본 값도 더해야 해요.' },
        ].filter(notAns(ans)),
        hints: ['먼저 대칭축을 기준으로 반대쪽을 그려서 모양을 완성해요.', `완성한 모양: ${A}칸, 둘레 ${Pm} cm`, `${A} × ${gold} + ${Pm} × ${rib} = ${A * gold} + ${Pm * rib} = ${ans}(원)`],
        solution: [`완성한 모양의 칸 수: ${half.length} × 2 = ${A}칸 → 스티커 ${A} × ${gold} = ${A * gold}(원)`, `둘레: ${Pm} cm → 리본 ${Pm} × ${rib} = ${Pm * rib}(원)`, `모두 ${ans}원`],
        key: `u3s3-top-story|${half.map(ck).sort().join(' ')}|${gold}|${rib}`,
        data: { half, gold, rib },
      };
    },
    verify(p) {
      const { half, gold, rib } = p.data;
      const full = [...half, ...half.map(([x, y]) => [5 - x, y])];
      return Number(p.answer.value) === full.length * gold + perim(full) * rib;
    },
  });

  M5.addTemplates([tStrip, tTri, tPair, tAngle, tHalf, tAxes, tStory, tPoint, tPSides]);
})();
