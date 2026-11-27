// 4단원 🏔️ 최상위 문제 (소수의 곱셈) — 대표 문제 → 변형 3문제 (build의 v: 0 = 대표, 1~3 = 변형)
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, D = M5.dec;
  const j = T.j;
  const form = M5.topForm;
  const top = (o) => Object.assign({ unit: 4, style: 'A', levels: [4, 4], tier: 'top' }, o);
  const S = (x) => D.str(D.parse(x));
  const mul = (...xs) => S(xs.reduce((a, b) => D.mul(a, b)));
  const add = (a, b) => S(D.add(a, b));
  const sub = (a, b) => S(D.sub(a, b));
  const dec = (n, s) => S(D.make(n, s));
  const pos = (v) => D.cmp(v, 0) > 0;
  const pats = (ans, list) => {
    const seen = new Set([S(ans)]);
    return list.filter((pt) => {
      if (!pos(pt.value)) return false;
      const k = S(pt.value);
      if (seen.has(k) || D.parse(k).s > 4) return false;
      seen.add(k); pt.value = k; return true;
    });
  };
  const num = (v, unit = '') => ({ type: 'num', value: S(v), unit });
  const won = (v) => `${Number(v).toLocaleString('ko-KR')}원`;

  // ---------------------------------------------------------------- u4s1 (소수)×(자연수)
  const tTape = top({
    id: 'u4s1-top-tape', sub: 'u4s1', styleName: '최상위: 이어 붙인 길이',
    build(r, lv, v) {
      const f = form(r, v, 3);
      if (f === 0) {
        const L = dec(r.int(80, 250), 1), o = dec(r.int(5, 25), 1), k = r.int(3, 8);
        const ans = sub(mul(L, k), mul(o, k - 1));
        return {
          text: `길이가 ${L} cm인 색 테이프 ${k}장을 ${o} cm씩 겹치게 한 줄로 이어 붙였어요. 이어 붙인 색 테이프의 전체 길이는 몇 cm인가요?`,
          answer: num(ans, 'cm'),
          patterns: pats(ans, [{ value: sub(mul(L, k), mul(o, k)), cause: 'concept', msg: `${k}장을 이으면 겹친 곳은 ${k - 1}군데예요.` }, { value: mul(L, k), cause: 'condition', msg: '겹친 부분만큼 빼야 해요.' }]),
          hints: [`${k}장을 한 줄로 이으면 겹친 곳은 ${k - 1}군데예요.`, `색 테이프 ${k}장: ${L} × ${k} = ${mul(L, k)}(cm)`, `겹친 길이 ${o} × ${k - 1} = ${mul(o, k - 1)} → ${mul(L, k)} - ${mul(o, k - 1)} = ${ans}`],
          solution: [`${L} × ${k} = ${mul(L, k)}(cm)`, `겹친 곳 ${k - 1}군데: ${o} × ${k - 1} = ${mul(o, k - 1)}(cm)`, `전체 길이: ${ans} cm`],
          key: `u4s1-top-tape|0|${L}|${o}|${k}`,
          data: { f, L, o, k },
        };
      }
      if (f === 1) {
        const a = dec(r.int(15, 95), 2), b = r.int(2, 3), w = r.int(2, 4);
        const ans = mul(a, b * 7 * w);
        return {
          text: `한 병에 ${a} L씩 들어 있는 우유를 하루에 ${b}병씩 ${w}주일 동안 마셨어요. 마신 우유는 모두 몇 L인가요?`,
          answer: num(ans, 'L'),
          patterns: pats(ans, [{ value: mul(a, b * w), cause: 'condition', msg: `${w}주일은 ${w * 7}일이에요.` }, { value: mul(a, 7 * w), cause: 'condition', msg: `하루에 ${b}병씩 마셨어요.` }]),
          hints: [`${w}주일은 ${w} × 7 = ${7 * w}일이에요.`, `마신 병 수: ${b} × ${7 * w} = ${b * 7 * w}병`, `${a} × ${b * 7 * w} = ${ans}(L)`],
          solution: [`마신 날: ${7 * w}일, 마신 병: ${b * 7 * w}병`, `${a} × ${b * 7 * w} = ${ans}(L)`],
          key: `u4s1-top-tape|1|${a}|${b}|${w}`,
          data: { f, a, k: b * 7 * w },
        };
      }
      const s = dec(r.int(12, 95), 1), k = r.int(2, 6);
      const ans = mul(s, 2 * k + 2);
      return {
        text: `한 변의 길이가 ${s} cm인 정사각형 ${k}개를 겹치지 않게 한 줄로 이어 붙여 직사각형을 만들었어요. 만든 직사각형의 둘레는 몇 cm인가요?`,
        figure: { type: 'geo', polys: Array.from({ length: k }, (_, i) => ({ pts: [[i, 0], [i + 1, 0], [i + 1, 1], [i, 1]], cls: 'shape-a' })), scale: 40, pad: 0.4 },
        answer: num(ans, 'cm'),
        patterns: pats(ans, [{ value: mul(s, 4 * k), cause: 'concept', msg: '정사각형끼리 붙은 변은 둘레가 아니에요.' }]),
        hints: ['붙은 변은 안쪽으로 들어가서 둘레가 아니에요.', `둘레는 한 변의 (${k} + 1) × 2 = ${2 * k + 2}배예요.`, `${s} × ${2 * k + 2} = ${ans}(cm)`],
        solution: [`둘레에 있는 변: ${2 * k + 2}개`, `${s} × ${2 * k + 2} = ${ans}(cm)`],
        key: `u4s1-top-tape|2|${s}|${k}`,
        data: { f, s, k },
      };
    },
    verify(p) {
      const d = p.data;
      const want = d.f === 0 ? sub(mul(d.L, d.k), mul(d.o, d.k - 1)) : d.f === 1 ? mul(d.a, d.k) : mul(d.s, 2 * d.k + 2);
      return D.eq(p.answer.value, want);
    },
  });

  const tLess = top({
    id: 'u4s1-top-less', sub: 'u4s1', styleName: '최상위: □ 안에 들어갈 자연수',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const sc = r.int(1, 2);
      const a = dec(r.int(sc === 1 ? 11 : 105, sc === 1 ? 79 : 495), sc);
      if (D.isInt(D.parse(a))) return null;
      let text, ans, steps, wrong;
      if (f === 0) {
        const N = r.int(15, 80);
        let x = 0; while (D.cmp(mul(a, x + 1), N) < 0) x++;
        if (x < 2) return null;
        ans = x;
        text = `${a} × □ < ${N}\n□ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.`;
        steps = `${a} × ${x} = ${mul(a, x)} < ${N}, ${a} × ${x + 1} = ${mul(a, x + 1)} ≥ ${N}`;
        wrong = x + 1;
      } else if (f === 1) {
        const lo = r.int(5, 30), hi = lo + r.int(6, 25);
        const xs = []; for (let x = 1; x < 400; x++) { const y = mul(a, x); if (D.cmp(y, lo) > 0 && D.cmp(y, hi) < 0) xs.push(x); }
        if (xs.length < 2) return null;
        ans = xs.length;
        text = `${lo} < ${a} × □ < ${hi}\n□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?`;
        steps = `□ = ${xs.join(', ')} → ${ans}개`;
        wrong = ans + 1;
      } else {
        let x = 1; while (!D.isInt(D.parse(mul(a, x)))) x++;
        ans = x;
        if (ans < 2) return null;
        text = `${a} × □의 계산 결과가 자연수가 되게 하려고 해요. □ 안에 들어갈 수 있는 자연수 중에서 가장 작은 수를 구하세요.`;
        steps = `${a} × ${x} = ${mul(a, x)}이고, ${x}보다 작은 자연수를 곱하면 자연수가 되지 않아요.`;
        wrong = 10 ** sc;
      }
      return {
        text,
        answer: { type: 'num', value: String(ans), unit: f === 1 ? '개' : '' },
        patterns: [{ value: String(wrong), cause: f === 2 ? 'concept' : 'condition', msg: f === 2 ? `${10 ** sc}을 곱하면 자연수가 되지만, 더 작은 수로도 될 수 있어요. 끝자리 숫자를 보고 생각해요.` : '부등호에 등호가 없어서 경계의 수는 들어가지 않아요. 넣어서 직접 확인해요.' }].filter((pt) => Number(pt.value) !== ans && Number(pt.value) > 0),
        hints: [
          f === 2 ? `소수점 아래 끝자리 숫자에 □를 곱해서 0이 되어야 자연수가 돼요.` : '□에 자연수를 넣어 곱을 구하고 비교해요.',
          f === 2 ? '예) 0.5 × 2 = 1, 0.25 × 4 = 1, 0.2 × 5 = 1' : `${a} × 10 = ${mul(a, 10)}처럼 가까운 수부터 어림해 보면 빨라요.`,
          steps,
        ],
        solution: [steps, `답: ${ans}`],
        key: `u4s1-top-less|${f}|${text}`,
        data: { f, a, text },
      };
    },
    verify(p) {
      const { f, a, text } = p.data, x = Number(p.answer.value);
      if (f === 0) { const N = Number(text.match(/< (\d+)/)[1]); return D.cmp(mul(a, x), N) < 0 && D.cmp(mul(a, x + 1), N) >= 0; }
      if (f === 1) { const [, lo, hi] = text.match(/^(\d+) <.*< (\d+)/); let c = 0; for (let y = 1; y < 999; y++) { const z = mul(a, y); if (D.cmp(z, lo) > 0 && D.cmp(z, hi) < 0) c++; } return c === x; }
      if (!D.isInt(D.parse(mul(a, x)))) return false;
      for (let y = 1; y < x; y++) if (D.isInt(D.parse(mul(a, y)))) return false;
      return true;
    },
  });

  // ---------------------------------------------------------------- u4s2 (자연수)×(소수)
  const tPrice = top({
    id: 'u4s2-top-price', sub: 'u4s2', styleName: '최상위: 물건값 구하기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      if (f === 0) {
        const p1 = r.int(10, 40) * 100, p2 = r.int(10, 40) * 100;
        if (p1 === p2) return null;
        const w1 = dec(r.int(2, 9), 1), w2 = dec(r.int(11, 29), 1);
        const ans = add(mul(p1, w1), mul(p2, w2));
        if (!D.isInt(D.parse(ans))) return null;
        return {
          text: `돼지고기는 1 kg에 ${won(p1 * 10)}, 소고기는 1 kg에 ${won(p2 * 10)}이에요. 돼지고기 ${w1} kg과 소고기 ${w2} kg을 샀다면 모두 얼마를 내야 하나요?`,
          answer: num(add(mul(p1 * 10, w1), mul(p2 * 10, w2)), '원'),
          patterns: pats(add(mul(p1 * 10, w1), mul(p2 * 10, w2)), [{ value: String(p1 * 10 + p2 * 10), cause: 'condition', msg: '1 kg의 값을 더했어요. 산 무게만큼 곱해요.' }, { value: mul(p1 * 10 + p2 * 10, add(w1, w2)), cause: 'concept', msg: '고기마다 값이 달라요. 따로 곱한 다음 더해요.' }]),
          hints: ['(값) = (1 kg의 값) × (무게)예요. 고기마다 따로 구해요.', `돼지고기: ${p1 * 10} × ${w1} = ${mul(p1 * 10, w1)}(원)`, `소고기: ${p2 * 10} × ${w2} = ${mul(p2 * 10, w2)}(원) → 합: ${add(mul(p1 * 10, w1), mul(p2 * 10, w2))}원`],
          solution: [`돼지고기: ${p1 * 10} × ${w1} = ${mul(p1 * 10, w1)}(원)`, `소고기: ${p2 * 10} × ${w2} = ${mul(p2 * 10, w2)}(원)`, `모두 ${add(mul(p1 * 10, w1), mul(p2 * 10, w2))}원`],
          key: `u4s2-top-price|0|${p1}|${p2}|${w1}|${w2}`,
          data: { f, p1: p1 * 10, p2: p2 * 10, w1, w2 },
        };
      }
      const p = r.int(10, 90) * 1000;
      const rate = dec(r.pick([5, 10, 15, 20, 25, 30, 35, 40]), 2);
      if (f === 1) {
        const off = mul(p, rate), ans = sub(p, off);
        return {
          text: `${won(p)}인 운동화를 가격의 ${rate}만큼 할인해서 판대요. 할인받은 운동화를 사려면 얼마를 내야 하나요?`,
          answer: num(ans, '원'),
          patterns: pats(ans, [{ value: off, cause: 'condition', msg: '할인받는 돈을 구했어요. 원래 가격에서 빼야 해요.' }]),
          hints: [`할인받는 돈 = ${p} × ${rate}`, `${p} × ${rate} = ${off}(원)`, `${p} - ${off} = ${ans}(원)`],
          solution: [`할인받는 돈: ${p} × ${rate} = ${off}(원)`, `내야 하는 돈: ${p} - ${off} = ${ans}(원)`],
          key: `u4s2-top-price|1|${p}|${rate}`,
          data: { f, p, rate },
        };
      }
      const up = mul(p, rate), ans = add(p, up);
      return {
        text: `작년에 ${won(p)}이던 장난감 값이 올해는 작년 값의 ${rate}만큼 올랐어요. 올해 장난감 값은 얼마인가요?`,
        answer: num(ans, '원'),
        patterns: pats(ans, [{ value: up, cause: 'condition', msg: '오른 만큼의 돈을 구했어요. 작년 값에 더해요.' }, { value: mul(p, add(1, rate)) === ans ? '0' : mul(p, add(1, rate)), cause: 'calc', msg: '' }].filter((pt) => pt.msg)),
        hints: [`오른 돈 = ${p} × ${rate}`, `${p} × ${rate} = ${up}(원)`, `${p} + ${up} = ${ans}(원)`],
        solution: [`오른 돈: ${p} × ${rate} = ${up}(원)`, `올해 값: ${p} + ${up} = ${ans}(원)`],
        key: `u4s2-top-price|2|${p}|${rate}`,
        data: { f, p, rate },
      };
    },
    verify(p) {
      const d = p.data;
      if (d.f === 0) return D.eq(p.answer.value, add(mul(d.p1, d.w1), mul(d.p2, d.w2)));
      if (d.f === 1) return D.eq(p.answer.value, mul(d.p, sub(1, d.rate)));
      return D.eq(p.answer.value, mul(d.p, add(1, d.rate)));
    },
  });

  const tBounce = top({
    id: 'u4s2-top-bounce', sub: 'u4s2', styleName: '최상위: 튀어 오르는 공',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const a = r.pick(['0.4', '0.5', '0.6', '0.7', '0.8']);
      const H = r.int(4, 30) * 10;
      const k = f === 1 ? 3 : 2;
      const h = (i) => (i === 0 ? String(H) : mul(H, ...Array(i).fill(a)));
      let text, ans, steps, pl;
      if (f !== 2) {
        ans = h(k);
        text = `공을 ${H} cm 높이에서 떨어뜨렸어요. 이 공은 땅에 닿으면 떨어진 높이의 ${a}배만큼 튀어 올라요. 공이 땅에 ${k}번 닿았다가 튀어 오른 높이는 몇 cm인가요?`;
        steps = Array.from({ length: k }, (_, i) => `${i + 1}번째: ${h(i)} × ${a} = ${h(i + 1)}`).join(', ');
        pl = [{ value: h(k - 1), cause: 'condition', msg: '튀어 오른 횟수를 다시 세어요.' }, { value: mul(H, a, k), cause: 'concept', msg: `튀어 오를 때마다 바로 앞 높이의 ${a}배예요.` }];
      } else {
        ans = add(H, mul(h(1), 2));
        text = `공을 ${H} cm 높이에서 떨어뜨렸어요. 이 공은 땅에 닿으면 떨어진 높이의 ${a}배만큼 튀어 올라요. 공을 떨어뜨린 때부터 땅에 두 번째로 닿을 때까지 공이 움직인 거리는 모두 몇 cm인가요?`;
        steps = `내려감 ${H} + 올라감 ${h(1)} + 내려감 ${h(1)} = ${ans}(cm)`;
        pl = [{ value: add(H, h(1)), cause: 'condition', msg: '튀어 오른 다음 다시 내려오는 거리도 더해요.' }];
      }
      return {
        text,
        answer: num(ans, 'cm'),
        patterns: pats(ans, pl),
        hints: [`튀어 오르는 높이는 바로 앞에 떨어진 높이의 ${a}배예요.`, f === 2 ? '공이 움직인 길을 그려 봐요: 내려감 → 올라감 → 내려감.' : `첫 번째로 튀어 오른 높이: ${H} × ${a} = ${h(1)}(cm)`, steps],
        solution: [steps, `답: ${ans} cm`],
        key: `u4s2-top-bounce|${f}|${H}|${a}`,
        data: { f, H, a },
      };
    },
    verify(p) {
      const { f, H, a } = p.data;
      const want = f === 0 ? mul(H, a, a) : f === 1 ? mul(H, a, a, a) : add(H, mul(H, a, 2));
      return D.eq(p.answer.value, want);
    },
  });

  // ---------------------------------------------------------------- u4s3 (소수)×(소수)
  const tArea = top({
    id: 'u4s3-top-area', sub: 'u4s3', styleName: '최상위: 늘이고 줄인 넓이',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const k1 = r.pick(['1.2', '1.5', '1.4', '0.8', '1.1', '2.5']), k2 = r.pick(['0.5', '0.6', '0.4', '1.5', '0.9', '0.8']);
      if (f === 0) {
        const w = dec(r.int(20, 90), 1), h = dec(r.int(12, 60), 1);
        const nw = mul(w, k1), nh = mul(h, k2), ans = mul(nw, nh);
        if (D.parse(ans).s > 4) return null;
        return {
          text: `가로 ${w} m, 세로 ${h} m인 직사각형이 있어요. 가로를 ${k1}배, 세로를 ${k2}배로 바꾸어 새로운 직사각형을 만들었어요. 새로운 직사각형의 넓이는 몇 m²인가요?`,
          answer: num(ans, 'm²'),
          patterns: pats(ans, [{ value: mul(w, h), cause: 'condition', msg: '처음 직사각형의 넓이예요. 바꾼 가로와 세로로 구해요.' }, { value: mul(add(w, h), add(k1, k2)), cause: 'concept', msg: '넓이는 (바꾼 가로) × (바꾼 세로)예요.' }]),
          hints: ['먼저 바꾼 가로와 세로의 길이를 구해요.', `가로: ${w} × ${k1} = ${nw}, 세로: ${h} × ${k2} = ${nh}`, `${nw} × ${nh} = ${ans}(m²)`],
          solution: [`바꾼 가로: ${w} × ${k1} = ${nw}(m)`, `바꾼 세로: ${h} × ${k2} = ${nh}(m)`, `넓이: ${nw} × ${nh} = ${ans}(m²)`],
          key: `u4s3-top-area|0|${w}|${h}|${k1}|${k2}`,
          data: { f, w, h, k1, k2 },
        };
      }
      if (f === 1) {
        if (k1 === k2) return null;
        const ans = mul(k1, k2);
        return {
          text: `직사각형의 가로를 ${k1}배, 세로를 ${k2}배로 바꾸어 새로운 직사각형을 만들었어요. 새로운 직사각형의 넓이는 처음 직사각형의 넓이의 몇 배인가요?`,
          answer: num(ans, '배'),
          patterns: pats(ans, [{ value: add(k1, k2), cause: 'concept', msg: '넓이는 가로 × 세로라서 두 수를 곱해요.' }]),
          hints: ['넓이 = 가로 × 세로', '가로가 ■배, 세로가 ▲배가 되면 넓이는 ■ × ▲배가 돼요. 예) 가로 2배, 세로 3배 → 6배', `${k1} × ${k2} = ${ans}(배)`],
          solution: [`${k1} × ${k2} = ${ans}(배)`],
          key: `u4s3-top-area|1|${k1}|${k2}`,
          data: { f, k1, k2 },
        };
      }
      const s = dec(r.int(12, 60), 1), k = r.pick(['1.5', '1.2', '1.4', '2.5', '1.1']);
      const ns = mul(s, k), before = mul(s, s), after = mul(ns, ns), ans = sub(after, before);
      return {
        text: `한 변이 ${s} cm인 정사각형의 각 변의 길이를 ${k}배로 늘여서 새로운 정사각형을 만들었어요. 넓이는 처음보다 몇 cm² 늘어났나요?`,
        answer: num(ans, 'cm²'),
        patterns: pats(ans, [{ value: after, cause: 'condition', msg: '새 정사각형의 넓이예요. 늘어난 넓이를 구해야 해요.' }, { value: mul(before, k), cause: 'concept', msg: '가로와 세로가 모두 늘어나요. 새 한 변으로 넓이를 구해요.' }]),
        hints: ['새 정사각형의 한 변을 먼저 구해요.', `새 한 변: ${s} × ${k} = ${ns}(cm), 넓이 ${ns} × ${ns} = ${after}`, `처음 넓이 ${before} → ${after} - ${before} = ${ans}(cm²)`],
        solution: [`처음 넓이: ${s} × ${s} = ${before}(cm²)`, `새 넓이: ${ns} × ${ns} = ${after}(cm²)`, `늘어난 넓이: ${ans} cm²`],
        key: `u4s3-top-area|2|${s}|${k}`,
        data: { f, s, k },
      };
    },
    verify(p) {
      const d = p.data;
      if (d.f === 0) return D.eq(p.answer.value, mul(d.w, d.k1, d.h, d.k2));
      if (d.f === 1) return D.eq(p.answer.value, mul(d.k1, d.k2));
      return D.eq(add(p.answer.value, mul(d.s, d.s)), mul(d.s, d.k, d.s, d.k));
    },
  });

  const tMistake = top({
    id: 'u4s3-top-mistake', sub: 'u4s3', styleName: '최상위: 잘못 계산한 어떤 수',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const m = dec(r.int(12, 89), 1), x = dec(r.int(11, 99), 1);
      if (D.isInt(D.parse(m)) || D.isInt(D.parse(x))) return null;
      const right = mul(x, m);
      let text, ans, steps, pl;
      if (f === 0) {
        const Sx = add(x, m); ans = right;
        text = `어떤 수에 ${m}을(를) 곱해야 할 것을 잘못하여 더했더니 ${Sx}이(가) 되었어요. 바르게 계산하면 얼마인가요?`;
        steps = `어떤 수: ${Sx} - ${m} = ${x} → ${x} × ${m} = ${right}`;
        pl = [{ value: mul(Sx, m), cause: 'condition', msg: '잘못 계산한 값에 곱하면 안 돼요. 먼저 어떤 수를 구해요.' }, { value: x, cause: 'condition', msg: '어떤 수를 구했어요. 바르게 계산까지 해요.' }];
      } else if (f === 1) {
        if (D.cmp(x, m) <= 0) return null;
        const Sx = sub(x, m); ans = right;
        text = `어떤 수에 ${m}을(를) 곱해야 할 것을 잘못하여 뺐더니 ${Sx}이(가) 되었어요. 바르게 계산하면 얼마인가요?`;
        steps = `어떤 수: ${Sx} + ${m} = ${x} → ${x} × ${m} = ${right}`;
        pl = [{ value: mul(Sx, m), cause: 'condition', msg: '잘못 계산한 값에 곱하면 안 돼요. 먼저 어떤 수를 구해요.' }];
      } else {
        const mm = String(D.parse(m).n);
        const W = mul(x, mm); ans = right;
        text = `준서는 어떤 수에 ${m}을(를) 곱해야 할 것을 소수점을 빠뜨리고 ${mm}을(를) 곱했더니 ${W}이(가) 되었어요. 바르게 계산하면 얼마인가요?`;
        steps = `${m}은 ${mm}의 0.1배예요. 그래서 바른 답은 ${W}의 0.1배 → ${W} × 0.1 = ${right}`.replace(`${m}은`, j(m, '은/는'));
        pl = [{ value: mul(W, '0.01'), cause: 'concept', msg: `${m}은 ${mm}의 0.1배예요. 소수점을 왼쪽으로 한 자리만 옮겨요.`.replace(`${m}은`, j(m, '은/는')) }, { value: W, cause: 'condition', msg: '잘못 계산한 값이에요. 소수점을 옮겨요.' }];
      }
      const fix = (s) => s.replace(/(\S+)을\(를\)/g, (a, w) => j(w, '을/를')).replace(/(\S+)이\(가\)/g, (a, w) => j(w, '이/가'));
      return {
        text: fix(text),
        answer: num(ans),
        patterns: pats(ans, pl),
        hints: [f === 2 ? '곱하는 수가 10배가 되면 곱도 10배가 돼요. 거꾸로 생각해요.' : '먼저 잘못 계산한 식을 거꾸로 풀어서 어떤 수를 구해요.', f === 1 ? '빼서 나온 값에 다시 더하면 어떤 수예요.' : f === 0 ? '더해서 나온 값에서 다시 빼면 어떤 수예요.' : `${m} × 10 = ${D.parse(m).n}`, steps],
        solution: [steps],
        key: `u4s3-top-mistake|${f}|${m}|${x}`,
        data: { f, m, x },
      };
    },
    verify(p) { return D.eq(p.answer.value, mul(p.data.x, p.data.m)); },
  });

  // ---------------------------------------------------------------- u4s4 곱의 소수점 위치
  const tRelate = top({
    id: 'u4s4-top-relate', sub: 'u4s4', styleName: '최상위: 곱셈식으로 소수점 찾기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const a = r.int(12, 89), b = r.int(12, 89);
      if (a % 10 === 0 || b % 10 === 0) return null;
      const c = a * b;
      const sa = r.int(0, 2), sb = r.int(0, 3);
      const A = dec(a, sa), Bv = dec(b, sb), C = mul(A, Bv);
      let text, ans, steps, pl;
      if (f === 0) {
        if (sa + sb < 2) return null;
        ans = Bv;
        text = `${a} × ${b} = ${c}입니다. 이 식을 이용하여 □ 안에 알맞은 수를 구하세요.\n${A} × □ = ${C}`;
        steps = `${A}의 소수점 아래 ${sa}자리, 곱 ${C}의 소수점 아래 ${D.parse(C).s}자리 → □는 소수점 아래 ${sb}자리 → □ = ${Bv}`;
      } else if (f === 1) {
        if (sa + sb < 2) return null;
        ans = A;
        text = `${a} × ${b} = ${c}입니다. 이 식을 이용하여 □ 안에 알맞은 수를 구하세요.\n□ × ${Bv} = ${C}`;
        steps = `${Bv}의 소수점 아래 ${sb}자리, 곱 ${C}의 소수점 아래 ${D.parse(C).s}자리 → □ = ${A}`;
      } else {
        const t = r.pick(['0.1', '0.01', '10', '100']);
        const A2 = mul(A, t), B2 = Bv;
        const Cc = mul(A2, B2);
        if (D.parse(Cc).s === 0 || D.parse(A2).s > 3) return null;
        ans = Cc;
        text = `${a} × ${b} = ${c}입니다. 이 식을 이용하여 계산하세요.\n${A2} × ${B2}`;
        steps = `${a} × ${b} = ${c}에서 소수점 아래 자리 수만큼 소수점을 옮기면 ${A2} × ${B2} = ${Cc}`;
      }
      if (D.parse(ans).s > 4 || D.parse(C).s > 4) return null;
      pl = [{ value: mul(ans, 10), cause: 'concept', msg: '소수점 아래 자리 수를 다시 세어요. 곱의 소수점 아래 자리 수 = 두 수의 소수점 아래 자리 수의 합이에요.' }, { value: mul(ans, '0.1'), cause: 'concept', msg: '소수점 아래 자리 수를 다시 세어요.' }];
      return {
        text,
        answer: num(ans),
        patterns: pats(ans, pl),
        hints: ['곱하는 두 수의 소수점 아래 자리 수를 더하면 곱의 소수점 아래 자리 수가 돼요.', '숫자 부분은 주어진 식과 같아요. 소수점 위치만 정하면 돼요.', steps],
        solution: [steps],
        key: `u4s4-top-relate|${f}|${text}`,
        data: { f, A, Bv, C, text },
      };
    },
    verify(p) {
      const { f, A, Bv, C, text } = p.data;
      if (f === 0) return D.eq(mul(A, p.answer.value), C);
      if (f === 1) return D.eq(mul(p.answer.value, Bv), C);
      const [, x, y] = text.match(/\n([\d.]+) × ([\d.]+)$/);
      return D.eq(p.answer.value, mul(x, y));
    },
  });

  const tCards = top({
    id: 'u4s4-top-cards', sub: 'u4s4', styleName: '최상위: 수 카드로 만든 소수의 곱',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const ds = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      const all = [];
      if (f < 2) {
        for (const a of ds) for (const b of ds) for (const c of ds) for (const d of ds) if (new Set([a, b, c, d]).size === 4) all.push({ x: `${a}.${b}`, y: `${c}.${d}`, v: mul(`${a}.${b}`, `${c}.${d}`) });
      } else {
        for (const a of ds) for (const b of ds) for (const c of ds) for (const d of ds) if (new Set([a, b, c, d]).size === 4) all.push({ x: `${a}.${b}${c}`, y: String(d), v: mul(`${a}.${b}${c}`, d) });
      }
      all.sort((p, q) => D.cmp(p.v, q.v));
      const big = f !== 1;
      const best = big ? all[all.length - 1] : all[0];
      const shape = f < 2 ? '□.□ × □.□' : '□.□□ × □';
      return {
        text: `수 카드 4장을 한 번씩 모두 사용하여 ${shape} 꼴의 곱셈식을 만들려고 해요. 계산 결과가 가장 ${big ? '큰' : '작은'} 곱을 구하세요.`,
        figure: { type: 'cards', nums: ds },
        answer: num(best.v),
        patterns: pats(best.v, [{ value: (big ? all[0] : all[all.length - 1]).v, cause: 'condition', msg: `가장 ${big ? '큰' : '작은'} 곱을 구해야 해요.` }, { value: all[big ? all.length - 2 : 1].v, cause: 'calc', msg: '더 큰(작은) 곱을 만들 수 있어요. 카드의 자리를 바꾸어 다시 비교해요.' }]),
        hints: [
          f < 2 ? `가장 ${big ? '큰' : '작은'} 두 숫자를 두 수의 일의 자리에 놓아요.` : `곱하는 자연수 자리와 일의 자리가 가장 중요해요. ${big ? '큰' : '작은'} 숫자를 놓아 보며 비교해요.`,
          '후보가 되는 식 몇 개를 직접 계산해서 비교해 봐요.',
          `${best.x} × ${best.y} = ${best.v}`,
        ],
        solution: [`가장 ${big ? '큰' : '작은'} 곱: ${best.x} × ${best.y} = ${best.v}`],
        key: `u4s4-top-cards|${f}|${ds.join('')}`,
        data: { f, ds, big },
      };
    },
    verify(p) {
      const { f, ds, big } = p.data;
      let best = null;
      for (const a of ds) for (const b of ds) for (const c of ds) for (const d of ds) {
        if (new Set([a, b, c, d]).size !== 4) continue;
        const val = f < 2 ? mul(`${a}.${b}`, `${c}.${d}`) : mul(`${a}.${b}${c}`, d);
        if (best == null || (big ? D.cmp(val, best) > 0 : D.cmp(val, best) < 0)) best = val;
      }
      return D.eq(p.answer.value, best);
    },
  });

  // ---------------------------------------------------------------- 이야기 문제
  const tStory = top({
    id: 'u4s3-top-story', sub: 'u4s3', story: true, styleName: '최상위 이야기: 할머니 댁 가는 길',
    build(r) {
      const d = dec(r.int(155, 480), 1), e = dec(r.int(25, 120), 1), rate = r.pick(['0.06', '0.07', '0.08', '0.09']);
      const pr = r.int(15, 19) * 100;
      const dist = add(mul(d, 2), e), L = mul(dist, rate), cost = mul(L, pr);
      const ans = Math.floor(D.toNumber(D.parse(cost)) / 100) * 100;
      return {
        text: `지호네 가족은 자동차로 할머니 댁에 다녀왔어요.\n• 집에서 할머니 댁까지는 ${d} km이고, 갔다가 다시 집으로 돌아왔어요.\n• 할머니 댁에 있을 때 시장에 다녀오느라 ${e} km를 더 달렸어요.\n• 이 자동차는 1 km를 달리는 데 휘발유가 ${rate} L 들어요.\n• 휘발유는 1 L에 ${won(pr)}이에요.\n쓴 휘발유 값을 버림하여 백의 자리까지 나타내면 얼마인가요?`,
        answer: { type: 'num', value: String(ans), unit: '원' },
        patterns: [
          { value: String(Math.floor(D.toNumber(D.parse(mul(add(d, e), rate, pr))) / 100) * 100), cause: 'condition', msg: '할머니 댁에 갔다가 돌아왔어요. 집과 할머니 댁 사이는 두 번 달렸어요.' },
          { value: String(Math.ceil(D.toNumber(D.parse(cost)) / 100) * 100), cause: 'concept', msg: '버림은 백의 자리 아래 수를 모두 0으로 바꿔요.' },
          { value: String(Math.floor(D.toNumber(D.parse(mul(mul(d, 2), rate, pr))) / 100) * 100), cause: 'condition', msg: '시장에 다녀온 거리도 더해요.' },
        ].filter((pt) => Number(pt.value) > 0 && Number(pt.value) !== ans),
        hints: [`달린 거리 = ${d} × 2 + ${e}`, `달린 거리 ${dist} km → 휘발유 ${dist} × ${rate} = ${L}(L)`, `휘발유 값 ${L} × ${pr} = ${cost}(원) → 버림하여 백의 자리까지 ${won(ans)}`],
        solution: [`달린 거리: ${d} × 2 + ${e} = ${dist}(km)`, `휘발유: ${dist} × ${rate} = ${L}(L)`, `휘발유 값: ${L} × ${pr} = ${cost}(원)`, `버림하여 백의 자리까지: ${won(ans)}`],
        key: `u4s3-top-story|${d}|${e}|${rate}|${pr}`,
        data: { d, e, rate, pr },
      };
    },
    verify(p) {
      const { d, e, rate, pr } = p.data;
      const c = D.parse(mul(add(mul(d, 2), e), rate, pr));
      const whole = D.toNumber(c);
      const a = Number(p.answer.value);
      return a % 100 === 0 && a <= whole + 1e-9 && whole < a + 100;
    },
  });

  M5.addTemplates([tTape, tLess, tPrice, tBounce, tArea, tMistake, tStory, tRelate, tCards]);
})();
