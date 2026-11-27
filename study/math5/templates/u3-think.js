// 3단원 🧩 사고력 문제 (합동과 대칭)
//   갈래: 경우의 수 · 규칙 찾기 · 공간 감각 · 논리·추론
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text;
  const j = T.j;
  const think = (o) => Object.assign({ unit: 3, style: 'B', levels: [1, 4] }, o);
  const cm = (v) => `${v} cm`;

  // 경우의 수: 점판에서 주어진 삼각형과 합동인 삼각형 세기
  const sq = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
  const triKey = (t) => [sq(t[0], t[1]), sq(t[1], t[2]), sq(t[2], t[0])].sort((a, b) => a - b).join(',');
  const area2 = (t) => Math.abs((t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[2][0] - t[0][0]) * (t[1][1] - t[0][1]));
  function allTris(n) {
    const P = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) P.push([x, y]);
    const o = [];
    for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) for (let c = b + 1; c < P.length; c++) { const t = [P[a], P[b], P[c]]; if (area2(t)) o.push(t); }
    return o;
  }
  const TRIS = { 3: allTris(3), 4: allTris(4) };
  const tLattice = think({
    id: 'u3s1-think-lattice', sub: 'u3s1', styleName: '경우의 수',
    build(r, lv) {
      const n = lv <= 2 ? 3 : 4;
      const t = r.pick(TRIS[n]);
      const ans = TRIS[n].filter((x) => triKey(x) === triKey(t)).length;
      const pts = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) pts.push({ p: [x, y] });
      return {
        text: `점판 위에 삼각형을 그렸어요. 점판의 점을 꼭짓점으로 하여 그린 삼각형과 합동인 삼각형을 그리려고 해요. 그린 삼각형을 포함하여 모두 몇 개 그릴 수 있나요? (위치가 다르면 다른 삼각형으로 세요.)`,
        figure: { type: 'geo', polys: [{ pts: t, cls: 'shape-a' }], dots: pts, scale: 60, pad: 0.5 },
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(ans - 1), cause: 'condition', msg: '그린 삼각형도 포함해서 세어요.' }].filter((pt) => Number(pt.value) > 0),
        hints: ['합동인 삼각형은 세 변의 길이가 같아요. 돌리거나 뒤집은 모양, 자리를 옮긴 모양을 모두 찾아요.', '한 가지 방향으로 놓인 모양이 점판 안에서 몇 자리에 들어가는지 세고, 돌리거나 뒤집은 방향마다 다시 세요.', `모두 ${ans}개예요.`],
        solution: ['같은 모양을 돌리거나 뒤집고, 옮겨서 점판 안에 들어가는 자리를 빠짐없이 세어요.', `모두 ${ans}개`],
        key: `u3s1-think-lattice|${n}|${t.map((p) => p.join(',')).join(' ')}`,
        data: { n, t },
      };
    },
    verify(p) { const { n, t } = p.data; return TRIS[n].filter((x) => triKey(x) === triKey(t)).length === Number(p.answer.value); },
  });

  // 논리·추론: 합동인 직사각형 2개를 이어 붙인 둘레
  const tGlue = think({
    id: 'u3s1-think-glue', sub: 'u3s1', styleName: '논리·추론',
    build(r) {
      const a = r.int(4, 15), b = r.int(2, a - 1), big = r.chance(0.5);
      const P1 = 2 * (2 * a + b), P2 = 2 * (a + 2 * b);
      const ans = big ? Math.max(P1, P2) : Math.min(P1, P2);
      return {
        text: `가로 ${cm(a)}, 세로 ${cm(b)}인 합동인 직사각형 2개의 변끼리 꼭 맞게 이어 붙여 새로운 직사각형을 만들려고 해요. 만든 직사각형의 둘레가 가장 ${big ? '길' : '짧'} 때는 몇 cm인가요?`,
        figure: { type: 'geo', polys: [{ pts: [[0, 0], [a, 0], [a, b], [0, b]].map(([x, y]) => [x * 5 / a, y * 5 / a]), cls: 'shape-a' }], sides: [{ a: [0, b * 5 / a], b: [5, b * 5 / a], t: cm(a), c: [2.5, 0] }, { a: [5, 0], b: [5, b * 5 / a], t: cm(b), c: [0, 0] }], scale: 36, pad: 0.8 },
        answer: { type: 'num', value: String(ans), unit: 'cm' },
        patterns: [{ value: String(big ? Math.min(P1, P2) : Math.max(P1, P2)), cause: 'condition', msg: big ? '가장 짧을 때예요. 짧은 변끼리 붙이면 둘레가 길어져요.' : '가장 길 때예요. 긴 변끼리 붙이면 둘레가 짧아져요.' }, { value: String(4 * (a + b)), cause: 'concept', msg: '두 직사각형의 둘레를 그냥 더했어요. 붙인 변 2개는 둘레에서 빠져요.' }].filter((pt) => Number(pt.value) !== ans),
        hints: ['붙인 변은 안쪽으로 들어가서 둘레에서 빠져요. 어느 변끼리 붙이느냐에 따라 둘레가 달라요.', `긴 변(${cm(a)})끼리 붙이면: (${a} + ${b * 2}) × 2 = ${P2} / 짧은 변(${cm(b)})끼리 붙이면: (${a * 2} + ${b}) × 2 = ${P1}`, `가장 ${big ? '긴' : '짧은'} 둘레: ${ans} cm`],
        solution: [`긴 변끼리: 가로 ${a}, 세로 ${2 * b} → 둘레 ${P2} cm`, `짧은 변끼리: 가로 ${2 * a}, 세로 ${b} → 둘레 ${P1} cm`, `가장 ${big ? '길' : '짧'} 때: ${ans} cm`],
        key: `u3s1-think-glue|${a}|${b}|${big}`,
        data: { a, b, big },
      };
    },
    verify(p) { const { a, b, big } = p.data; const P = [2 * (2 * a + b), 2 * (a + 2 * b)]; return Number(p.answer.value) === (big ? Math.max(...P) : Math.min(...P)); },
  });

  // 규칙 찾기: 합동인 정삼각형을 한 줄로 이어 붙인 둘레
  const tStrip = think({
    id: 'u3s2-think-strip', sub: 'u3s2', styleName: '규칙 찾기',
    build(r, lv) {
      const s = r.int(2, lv <= 2 ? 6 : 12), k = r.int(lv <= 2 ? 5 : 8, lv <= 2 ? 9 : 20);
      const P = (n) => (n + 2) * s;
      const h = Math.sqrt(3) / 2;
      const polys = [];
      for (let i = 0; i < 4; i++) polys.push({ pts: i % 2 === 0 ? [[i / 2, h], [i / 2 + 1, h], [i / 2 + 0.5, 0]] : [[(i - 1) / 2 + 0.5, 0], [(i + 1) / 2 + 0.5, 0], [(i + 1) / 2, h]], cls: i % 2 ? 'shape-b' : 'shape-a' });
      return {
        text: `한 변이 ${cm(s)}인 합동인 정삼각형을 그림처럼 한 줄로 이어 붙여요. 정삼각형 ${k}개를 이어 붙였을 때 만든 도형의 둘레는 몇 cm인가요?`,
        figure: { type: 'geo', polys: polys.map((q) => ({ pts: q.pts.map(([x, y]) => [x * 1.6, y * 1.6]), cls: q.cls })), scale: 44, pad: 0.6 },
        answer: { type: 'num', value: String(P(k)), unit: 'cm' },
        patterns: [{ value: String(3 * s * k), cause: 'concept', msg: '붙인 변은 안쪽이라 둘레가 아니에요. 정삼각형을 하나 붙일 때마다 둘레는 한 변만큼만 늘어요.' }, { value: String(P(k - 1)), cause: 'calc', msg: '정삼각형의 수를 다시 세어 봐요.' }].filter((pt) => Number(pt.value) !== P(k)),
        hints: [`1개: ${P(1)} cm, 2개: ${P(2)} cm, 3개: ${P(3)} cm처럼 하나씩 늘려 봐요.`, `정삼각형이 하나 늘 때마다 둘레는 ${cm(s)}씩 늘어요.`, `${k}개: (${k} + 2) × ${s} = ${P(k)}`],
        solution: [`정삼각형 1개의 둘레는 ${3 * s} cm이고, 하나 붙일 때마다 ${s} cm씩 늘어요.`, `${k}개: ${3 * s} + ${s} × ${k - 1} = ${P(k)}(cm)`],
        key: `u3s2-think-strip|${s}|${k}`,
        data: { s, k },
      };
    },
    verify(p) { const { s, k } = p.data; return Number(p.answer.value) === 3 * s + s * (k - 1); },
  });

  // 공간 감각: 합동인 직각삼각형 4개로 만든 정사각형 안의 정사각형
  const tPin = think({
    id: 'u3s2-think-pin', sub: 'u3s2', styleName: '공간 감각',
    build(r) {
      const a = r.int(2, 8), b = r.int(a + 1, 12);
      const S = a + b, ans = S * S - 2 * a * b;
      const u = 5 / S;
      const P = (x, y) => [x * u, y * u];
      const q = [P(a, 0), P(S, a), P(b, S), P(0, b)];
      const tri = [[P(0, 0), P(a, 0), P(0, b)], [P(a, 0), P(S, 0), P(S, a)], [P(S, a), P(S, S), P(b, S)], [P(b, S), P(0, S), P(0, b)]];
      return {
        text: `직각을 낀 두 변이 ${cm(a)}, ${cm(b)}인 합동인 직각삼각형 4개를 그림처럼 놓았더니, 바깥에 큰 정사각형이 생기고 가운데에 기울어진 정사각형이 생겼어요. 가운데 정사각형의 넓이는 몇 cm²인가요?`,
        figure: { type: 'geo', polys: [...tri.map((pts) => ({ pts, cls: 'shape-b' })), { pts: q, cls: 'shape-a' }], sides: [{ a: P(0, 0), b: P(a, 0), t: cm(a), c: P(S / 2, S / 2) }, { a: P(0, 0), b: P(0, b), t: cm(b), c: P(S / 2, S / 2) }], scale: 52, pad: 0.8 },
        answer: { type: 'num', value: String(ans), unit: 'cm²' },
        patterns: [{ value: String(S * S), cause: 'condition', msg: '큰 정사각형 전체의 넓이예요. 삼각형 4개를 빼야 해요.' }, { value: String(S * S - 4 * a * b), cause: 'calc', msg: `직각삼각형 하나의 넓이는 ${a} × ${b} ÷ 2예요. 2로 나누는 것을 빠뜨렸어요.` }, { value: String((b - a) ** 2), cause: 'concept', msg: '가운데 정사각형의 한 변은 두 변의 차가 아니에요. 큰 정사각형에서 삼각형 4개를 빼서 구해요.' }].filter((pt) => Number(pt.value) !== ans && Number(pt.value) > 0),
        hints: ['가운데 정사각형의 넓이 = (큰 정사각형의 넓이) - (직각삼각형 4개의 넓이)', `큰 정사각형의 한 변 = ${a} + ${b} = ${S} cm → 넓이 ${S * S} cm²`, `삼각형 4개: ${a} × ${b} ÷ 2 × 4 = ${2 * a * b} → ${S * S} - ${2 * a * b} = ${ans}`],
        solution: [`큰 정사각형: ${S} × ${S} = ${S * S}(cm²)`, `직각삼각형 4개: ${a} × ${b} ÷ 2 × 4 = ${2 * a * b}(cm²)`, `가운데 정사각형: ${S * S} - ${2 * a * b} = ${ans}(cm²)`],
        key: `u3s2-think-pin|${a}|${b}`,
        data: { a, b },
      };
    },
    verify(p) { const { a, b } = p.data; return Number(p.answer.value) === (a + b) ** 2 - 4 * (a * b) / 2; },
  });

  // 공간 감각: 거울에 비친 디지털 시계
  const MIR = { 0: '0', 1: '1', 2: '5', 5: '2', 8: '8' };
  const mirror = (s) => s.split('').reverse().map((c) => MIR[c]).join('');
  const validT = (s) => Number(s.slice(0, 2)) <= 23 && Number(s.slice(2)) <= 59;
  const tMirror = think({
    id: 'u3s3-think-mirror', sub: 'u3s3', styleName: '공간 감각',
    build(r) {
      const ds = Object.keys(MIR);
      let real;
      for (let t = 0; t < 50; t++) { const c = Array.from({ length: 4 }, () => r.pick(ds)).join(''); if (validT(c) && validT(mirror(c)) && mirror(c) !== c && Number(c.slice(0, 2)) > 0 && Number(c.slice(2)) > 0) { real = c; break; } }
      if (!real) return null;
      const seen = mirror(real);
      const H = Number(real.slice(0, 2)), Mi = Number(real.slice(2));
      const mapOnly = seen.split('').map((c) => MIR[c]).join(''), revOnly = seen.split('').reverse().join('');
      const pats = [mapOnly, revOnly].filter((x) => x !== real && validT(x)).map((x) => ({ value: [String(Number(x.slice(0, 2))), String(Number(x.slice(2)))], cause: 'concept', msg: x === mapOnly ? '거울에 비치면 왼쪽과 오른쪽이 바뀌어서 숫자의 순서도 거꾸로 돼요.' : '거울에 비치면 디지털 숫자 2는 5처럼, 5는 2처럼 보여요.' }));
      return {
        text: `거울에 비친 디지털 시계가 ${seen.slice(0, 2)}:${seen.slice(2)}처럼 보여요. 실제 시각은 몇 시 몇 분인가요?`,
        figure: { type: 'digits', nums: seen.split('') },
        answer: { type: 'pair', labels: ['시', '분'], values: [String(H), String(Mi)] },
        patterns: pats,
        hints: ['거울에 비치면 왼쪽과 오른쪽이 바뀌어요. 시계 전체가 뒤집히니까 숫자의 순서도 거꾸로 돼요.', '디지털 숫자 0, 1, 8은 거울에 비쳐도 그대로이고, 2와 5는 서로 바뀌어 보여요.', `${seen} → 순서를 거꾸로 ${seen.split('').reverse().join('')} → 2와 5를 바꾸면 ${real} → ${H}시 ${Mi}분`],
        solution: [`보이는 숫자를 거꾸로: ${seen.split('').reverse().join('')}`, `2 ↔ 5 바꾸기: ${real}`, `실제 시각: ${H}시 ${Mi}분`],
        key: `u3s3-think-mirror|${real}`,
        data: { real, seen },
      };
    },
    verify(p) { return mirror(p.data.seen) === p.data.real && Number(p.data.real.slice(0, 2)) === Number(p.answer.values[0]) && Number(p.data.real.slice(2)) === Number(p.answer.values[1]); },
  });

  // 경우의 수: 한 칸 더 색칠해서 선대칭도형 만들기
  const AX = { V: ([x, y]) => [3 - x, y], H: ([x, y]) => [x, 3 - y], D: ([x, y]) => [y, x], A: ([x, y]) => [3 - y, 3 - x] };
  const ck = (c) => c.join(',');
  const symAx = (S, f) => { const set = new Set(S.map(ck)); return S.every((c) => set.has(ck(f(c)))); };
  const cellsFig = (S) => ({ type: 'geo', grid: { w: 4, h: 4 }, polys: S.map(([x, y]) => ({ pts: [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]], cls: 'shape-a' })), scale: 44, pad: 0.4 });
  const tAdd = think({
    id: 'u3s3-think-add', sub: 'u3s3', styleName: '경우의 수',
    build(r) {
      const ax = r.pick(Object.keys(AX));
      const half = [];
      for (let t = 0; t < 4; t++) half.push([r.int(0, 3), r.int(0, 3)]);
      const full = [...new Map([...half, ...half.map(AX[ax])].map((c) => [ck(c), c])).values()];
      const movable = full.filter((c) => ck(AX[ax](c)) !== ck(c));
      if (full.length < 4 || !movable.length) return null;
      const rm = r.pick(movable);
      const S = full.filter((c) => c !== rm);
      if (Object.values(AX).some((f) => symAx(S, f))) return null;
      const empty = []; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!S.some((c) => c[0] === x && c[1] === y)) empty.push([x, y]);
      const good = empty.filter((c) => Object.values(AX).some((f) => symAx([...S, c], f)));
      return {
        text: '모눈판의 칸을 색칠했어요. 한 칸을 더 색칠하여 색칠한 부분 전체가 선대칭도형이 되게 하려고 해요. 색칠할 수 있는 칸은 모두 몇 군데인가요? (대칭축은 모눈판을 반으로 나누는 가로선, 세로선, 대각선 중 하나예요.)',
        figure: cellsFig(S),
        answer: { type: 'num', value: String(good.length), unit: '군데' },
        patterns: [{ value: '1', cause: 'condition', msg: '대칭축을 하나만 생각했어요. 가로, 세로, 두 대각선을 모두 대칭축으로 생각해 봐요.' }].filter(() => good.length > 1),
        hints: ['모눈판을 반으로 나누는 대칭축 후보는 4개예요: 세로선, 가로선, 두 대각선.', '대칭축마다 접었을 때 짝이 없는 칸이 딱 하나인지 확인해요. 그 칸의 짝 자리가 색칠할 칸이에요.', `색칠할 수 있는 칸: ${good.length}군데`],
        solution: ['대칭축 4개를 하나씩 따져 보고, 한 칸만 더 칠하면 대칭이 되는 경우를 찾아요.', `모두 ${good.length}군데`],
        key: `u3s3-think-add|${S.map(ck).sort().join(' ')}`,
        data: { S },
      };
    },
    verify(p) {
      const S = p.data.S;
      let c = 0; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!S.some((q) => q[0] === x && q[1] === y) && Object.values(AX).some((f) => symAx([...S, [x, y]], f))) c++;
      return c === Number(p.answer.value) && c > 0;
    },
  });

  // 공간 감각: 점대칭도형이 되도록 적어도 몇 칸 더 칠하기
  const rot = ([x, y]) => [3 - x, 3 - y];
  const tFill = think({
    id: 'u3s4-think-fill', sub: 'u3s4', styleName: '공간 감각',
    build(r, lv) {
      const n = r.int(3, lv <= 2 ? 4 : 6);
      const S = [...new Map(Array.from({ length: n }, () => [r.int(0, 3), r.int(0, 3)]).map((c) => [ck(c), c])).values()];
      if (S.length < 3) return null;
      const set = new Set(S.map(ck));
      const need = S.filter((c) => !set.has(ck(rot(c))));
      if (!need.length) return null;
      return {
        text: '모눈판의 가운데 점을 대칭의 중심으로 하는 점대칭도형을 만들려고 해요. 색칠한 칸에 몇 칸을 더 색칠해야 하나요? (가장 적게 색칠할 때)',
        figure: Object.assign(cellsFig(S), { dots: [{ p: [2, 2] }] }),
        answer: { type: 'num', value: String(need.length), unit: '칸' },
        patterns: [{ value: String(S.length), cause: 'concept', msg: '이미 짝이 있는 칸은 더 칠할 필요가 없어요. 180° 돌렸을 때 짝이 없는 칸만 세요.' }].filter((pt) => Number(pt.value) !== need.length),
        hints: ['색칠한 칸마다 가운데 점을 중심으로 180° 돌린 자리를 찾아요.', '그 자리가 이미 색칠되어 있으면 더 칠할 필요가 없어요.', `짝이 없는 칸: ${need.length}개 → ${need.length}칸 더 칠해요.`],
        solution: [`색칠한 ${S.length}칸 중 180° 돌린 자리가 비어 있는 칸: ${need.length}개`, `${need.length}칸을 더 칠하면 점대칭도형이 돼요.`],
        key: `u3s4-think-fill|${S.map(ck).sort().join(' ')}`,
        data: { S },
      };
    },
    verify(p) { const S = p.data.S, set = new Set(S.map(ck)); const add = new Set(S.map(rot).map(ck).filter((k) => !set.has(k))); return add.size === Number(p.answer.value); },
  });

  M5.addTemplates([tLattice, tGlue, tStrip, tPin, tMirror, tAdd, tFill]);
})();
