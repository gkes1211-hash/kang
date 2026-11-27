// 2단원 🏔️ 최상위 문제 (분수의 곱셈) — 대표 문제 → 변형 3문제 (build의 v: 0 = 대표, 1~3 = 변형)
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, F = M5.frac;
  const j = T.j;
  const form = M5.topForm;
  const top = (o) => Object.assign({ unit: 2, style: 'A', levels: [4, 4], tier: 'top' }, o);
  const M = F.mk, K = F.key;
  const okF = (f) => { f = F.parse(f); return !!f && f.n > 0 && f.d <= 100 && f.n / f.d < 500; };
  const FR = (f, unit = '') => ({ type: 'frac', value: K(f), unit });
  const pats = (ans, list) => {
    const seen = new Set([K(ans)]);
    return list.filter((pt) => {
      if (!okF(pt.value)) return false;
      const k = K(pt.value);
      if (seen.has(k)) return false;
      seen.add(k); pt.value = k; return true;
    });
  };
  const mixedR = (r, dMax = 6, wMax = 4) => {
    const d = r.int(2, dMax), n = r.int(1, d - 1);
    if (F.gcd(n, d) !== 1) return null;
    return F.mixed(r.int(1, wMax), n, d);
  };
  const properR = (r, dMax = 9) => {
    const d = r.int(2, dMax), n = r.int(1, d - 1);
    if (F.gcd(n, d) !== 1) return null;
    return F.make(n, d);
  };
  const imp = (f) => { f = F.parse(f); return `⟪${f.n}/${f.d}⟫`; }; // 가분수로 보이기

  // ---------------------------------------------------------------- u2s1 (분수)×(자연수)
  const tTape = top({
    id: 'u2s1-top-tape', sub: 'u2s1', styleName: '최상위: 이어 붙인 길이',
    build(r, lv, v) {
      const f = form(r, v, 3);
      if (f === 0) {
        const d = r.int(3, 9), L = F.mixed(r.int(5, 15), r.int(1, d - 1), d), o = F.make(r.int(1, d - 1), d), k = r.int(3, 7);
        const ans = F.sub(F.mul(L, k), F.mul(o, k - 1));
        if (!okF(ans) || !okF(o)) return null;
        return {
          text: `길이가 ${M(L)} cm인 색 테이프 ${k}장을 ${M(o)} cm씩 겹치게 한 줄로 이어 붙였어요. 이어 붙인 색 테이프의 전체 길이는 몇 cm인가요?`,
          answer: FR(ans, 'cm'),
          patterns: pats(ans, [
            { value: F.sub(F.mul(L, k), F.mul(o, k)), cause: 'concept', msg: `${k}장을 이으면 겹친 곳은 ${k - 1}군데예요.` },
            { value: F.mul(L, k), cause: 'condition', msg: '겹친 부분만큼 빼야 해요.' },
          ]),
          hints: [`${k}장을 한 줄로 이으면 겹친 곳은 ${k}군데가 아니라 ${k - 1}군데예요.`, `색 테이프 ${k}장의 길이: ${M(L)} × ${k} = ${M(F.mul(L, k))}`, `겹친 길이: ${M(o)} × ${k - 1} = ${M(F.mul(o, k - 1))} → ${M(F.mul(L, k))} - ${M(F.mul(o, k - 1))} = ${M(ans)}`],
          solution: [`색 테이프 ${k}장의 길이: ${M(L)} × ${k} = ${M(F.mul(L, k))}(cm)`, `겹친 곳 ${k - 1}군데: ${M(o)} × ${k - 1} = ${M(F.mul(o, k - 1))}(cm)`, `전체 길이: ${M(ans)} cm`],
          key: `u2s1-top-tape|0|${K(L)}|${K(o)}|${k}`,
          data: { f, L: K(L), o: K(o), k },
        };
      }
      if (f === 1) {
        const a = properR(r, 9); if (!a) return null;
        const k = r.int(5, 30);
        const ans = F.mul(a, k);
        if (!okF(ans)) return null;
        return {
          text: `어떤 시계는 하루에 ${M(a)}분씩 늦게 가요. 월요일 낮 12시에 시계를 정확히 맞추어 놓았다면, ${k}일 뒤 낮 12시에 이 시계는 몇 분 늦게 가고 있나요?`,
          answer: FR(ans, '분'),
          patterns: pats(ans, [{ value: F.mul(a, k - 1), cause: 'condition', msg: `${k}일 동안 늦어지니 ${M(a)} × ${k}예요.` }, { value: F.add(a, k), cause: 'concept', msg: `하루에 ${M(a)}분씩 ${k}일이면 곱해야 해요.` }]),
          hints: ['하루에 늦어지는 시간이 매일 똑같이 쌓여요.', `${k}일 동안 늦어진 시간 = ${M(a)} × ${k}`, `${M(a)} × ${k} = ${M(ans)}(분)`],
          solution: [`${M(a)} × ${k} = ${M(ans)}(분)`],
          key: `u2s1-top-tape|1|${K(a)}|${k}`,
          data: { f, a: K(a), k },
        };
      }
      const s = mixedR(r, 8, 6); if (!s) return null;
      const k = r.int(2, 6);
      const ans = F.mul(s, 2 * k + 2);
      if (!okF(ans)) return null;
      return {
        text: `한 변의 길이가 ${M(s)} cm인 정사각형 ${k}개를 겹치지 않게 한 줄로 이어 붙여 직사각형을 만들었어요. 만든 직사각형의 둘레는 몇 cm인가요?`,
        figure: { type: 'geo', polys: Array.from({ length: k }, (_, i) => ({ pts: [[i, 0], [i + 1, 0], [i + 1, 1], [i, 1]], cls: 'shape-a' })), scale: 40, pad: 0.4 },
        answer: FR(ans, 'cm'),
        patterns: pats(ans, [{ value: F.mul(s, 4 * k), cause: 'concept', msg: '정사각형끼리 붙은 변은 둘레가 아니에요.' }, { value: F.mul(s, k + 1), cause: 'calc', msg: '둘레는 위·아래·양옆을 모두 더해요.' }]),
        hints: ['붙은 변은 안쪽으로 들어가서 둘레가 아니에요.', `직사각형의 가로는 한 변의 ${k}배, 세로는 한 변과 같아요. 둘레는 한 변의 (${k} + 1) × 2 = ${2 * k + 2}배예요.`, `${M(s)} × ${2 * k + 2} = ${M(ans)}`],
        solution: [`둘레에 있는 변: 한 변의 ${2 * k + 2}배`, `${M(s)} × ${2 * k + 2} = ${M(ans)}(cm)`],
        key: `u2s1-top-tape|2|${K(s)}|${k}`,
        data: { f, s: K(s), k },
      };
    },
    verify(p) {
      const d = p.data;
      const want = d.f === 0 ? F.sub(F.mul(d.L, d.k), F.mul(d.o, d.k - 1)) : d.f === 1 ? F.mul(d.a, d.k) : F.mul(d.s, 2 * d.k + 2);
      return F.eq(p.answer.value, want);
    },
  });

  const tLess = top({
    id: 'u2s1-top-less', sub: 'u2s1', styleName: '최상위: □ 안에 들어갈 자연수',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const a = r.chance(0.5) ? properR(r, 9) : mixedR(r, 7, 3);
      if (!a) return null;
      const A = F.parse(a);
      let text, ans, steps, wrong;
      if (f === 0) {
        const N = r.int(10, 60);
        let x = 0; while (A.n * (x + 1) < N * A.d) x++;
        if (x < 2) return null;
        ans = x;
        text = `${M(a)} × □ < ${N}\n□ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.`;
        steps = `${M(a)} × ${x} = ${M(F.mul(a, x))} < ${N}, ${M(a)} × ${x + 1} = ${M(F.mul(a, x + 1))} ≥ ${N}`;
        wrong = x + 1;
      } else if (f === 1) {
        const lo = r.int(3, 20), hi = lo + r.int(5, 20);
        ans = 0; const xs = [];
        for (let x = 1; x < 500; x++) if (A.n * x > lo * A.d && A.n * x < hi * A.d) { ans++; xs.push(x); }
        if (ans < 2) return null;
        text = `${lo} < ${M(a)} × □ < ${hi}\n□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?`;
        steps = `□ = ${xs.join(', ')} → ${ans}개`;
        wrong = ans + 1;
      } else {
        if (A.d === 1) return null;
        ans = Math.ceil(10 / A.d) * A.d;
        if (ans > 99) return null;
        text = `${M(a)} × □의 계산 결과가 자연수가 되게 하려고 해요. □ 안에 들어갈 수 있는 두 자리 수 중에서 가장 작은 수를 구하세요.`;
        steps = `${M(a)} = ${imp(a)}이므로 □는 ${A.d}의 배수여야 해요. 가장 작은 두 자리 ${A.d}의 배수: ${ans}`;
        wrong = 10;
      }
      return {
        text,
        answer: { type: 'num', value: String(ans), unit: f === 1 ? '개' : '' },
        patterns: [{ value: String(wrong), cause: f === 2 ? 'concept' : 'condition', msg: f === 2 ? `분모 ${A.d}와 약분되어야 자연수가 돼요. □는 ${A.d}의 배수여야 해요.` : '부등호에 등호가 없어서 경계의 수는 들어가지 않아요. 넣어서 직접 확인해요.' }].filter((pt) => Number(pt.value) !== ans && Number(pt.value) > 0),
        hints: [
          A.n > A.d ? `${j(M(a), '을/를')} 가분수 ${imp(a)}로 바꾸면 계산이 쉬워요.` : '분수와 자연수의 곱은 분모는 그대로 두고 분자에 자연수를 곱해요.',
          f === 2 ? '분수 × 자연수가 자연수가 되려면 분모가 약분되어 1이 되어야 해요.' : '□에 자연수를 차례로 넣어서 곱을 구해 비교해요.',
          steps,
        ],
        solution: [steps, `답: ${ans}`],
        key: `u2s1-top-less|${f}|${text}`,
        data: { f, a: K(a), text },
      };
    },
    verify(p) {
      const { f, a, text } = p.data, A = F.parse(a), x = Number(p.answer.value);
      if (f === 0) { const N = Number(text.match(/< (\d+)/)[1]); return A.n * x < N * A.d && A.n * (x + 1) >= N * A.d; }
      if (f === 1) { const [, lo, hi] = text.match(/^(\d+) <.*< (\d+)/); let c = 0; for (let y = 1; y < 999; y++) if (A.n * y > lo * A.d && A.n * y < hi * A.d) c++; return c === x; }
      if (x < 10 || x > 99 || !F.isInt(F.mul(a, x))) return false;
      for (let y = 10; y < x; y++) if (F.isInt(F.mul(a, y))) return false;
      return true;
    },
  });

  // ---------------------------------------------------------------- u2s2 (자연수)×(분수)
  const tRest = top({
    id: 'u2s2-top-rest', sub: 'u2s2', styleName: '최상위: 남은 양 구하기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const a = properR(r, 6), b = properR(r, 5);
      if (!a || !b) return null;
      const A = F.parse(a), B = F.parse(b);
      const N = A.d * B.d * r.int(2, 8);
      const day1 = F.mul(N, a), rest1 = F.sub(N, day1), day2 = F.mul(rest1, b), rest2 = F.sub(rest1, day2);
      if (!F.isInt(rest2) || F.toNumber(rest2) < 1 || F.toNumber(day2) < 1) return null;
      const st = [`첫째 날: ${N} × ${M(a)} = ${K(day1)}쪽, 남은 쪽: ${N} - ${K(day1)} = ${K(rest1)}쪽`, `둘째 날: ${K(rest1)} × ${M(b)} = ${K(day2)}쪽, 남은 쪽: ${K(rest1)} - ${K(day2)} = ${K(rest2)}쪽`];
      let text, ans, pl;
      if (f === 0) {
        ans = rest2;
        text = `${N}쪽인 동화책을 첫째 날에는 전체의 ${M(a)}만큼 읽고, 둘째 날에는 나머지의 ${M(b)}만큼 읽었어요. 이틀 동안 읽고 남은 쪽은 몇 쪽인가요?`;
        pl = [{ value: F.sub(N, F.add(day1, F.mul(N, b))), cause: 'condition', msg: '둘째 날은 "전체"가 아니라 "나머지"의 ' + M(b) + '예요.' }, { value: rest1, cause: 'condition', msg: '둘째 날 읽은 쪽도 빼야 해요.' }];
      } else if (f === 1) {
        ans = day2;
        text = `${N}쪽인 동화책을 첫째 날에는 전체의 ${M(a)}만큼 읽고, 둘째 날에는 나머지의 ${M(b)}만큼 읽었어요. 둘째 날에 읽은 쪽은 몇 쪽인가요?`;
        pl = [{ value: F.mul(N, b), cause: 'condition', msg: '둘째 날은 "전체"가 아니라 "나머지"의 ' + M(b) + '예요.' }];
      } else {
        ans = F.make(N);
        text = `동화책을 첫째 날에는 전체의 ${M(a)}만큼 읽고, 둘째 날에는 나머지의 ${M(b)}만큼 읽었더니 ${K(rest2)}쪽이 남았어요. 동화책은 모두 몇 쪽인가요?`;
        pl = [{ value: F.add(rest2, day2), cause: 'condition', msg: '첫째 날에 읽은 쪽까지 거꾸로 생각해야 해요.' }];
        st.unshift(`남은 쪽은 나머지의 (1 - ${M(b)}) = ${M(F.sub(1, b))}, 나머지는 전체의 (1 - ${M(a)}) = ${M(F.sub(1, a))}이에요.`);
      }
      return {
        text,
        answer: { type: 'num', value: K(ans), unit: '쪽' },
        patterns: pats(ans, pl).filter((pt) => F.isInt(pt.value)),
        hints: [
          '"전체의 ~"와 "나머지의 ~"를 구별해요. 둘째 날은 첫째 날 읽고 남은 쪽이 기준이에요.',
          f === 2 ? `남은 ${K(rest2)}쪽은 전체의 ${M(F.sub(1, a))} × ${M(F.sub(1, b))} = ${M(F.mul(F.sub(1, a), F.sub(1, b)))}이에요.` : st[0],
          f === 2 ? `전체의 ${M(F.mul(F.sub(1, a), F.sub(1, b)))}만큼이 ${K(rest2)}쪽 → 전체는 ${N}쪽` : st[1],
        ],
        solution: [...st, `답: ${K(ans)}쪽`],
        key: `u2s2-top-rest|${f}|${N}|${K(a)}|${K(b)}`,
        data: { f, N, a: K(a), b: K(b) },
      };
    },
    verify(p) {
      const { f, N, a, b } = p.data;
      const rest1 = F.mul(N, F.sub(1, a)), day2 = F.mul(rest1, b), rest2 = F.sub(rest1, day2);
      return F.eq(p.answer.value, f === 0 ? rest2 : f === 1 ? day2 : N);
    },
  });

  const tBounce = top({
    id: 'u2s2-top-bounce', sub: 'u2s2', styleName: '최상위: 튀어 오르는 공',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const a = properR(r, 5); if (!a) return null;
      const A = F.parse(a);
      const k = f === 1 ? 3 : 2;
      const H = A.d ** k * r.int(1, Math.max(1, Math.floor(300 / A.d ** k)));
      if (H < 20 || H > 400) return null;
      const h = (i) => F.mul(H, ...Array(i).fill(a));
      let text, ans, steps, pl;
      if (f !== 2) {
        ans = h(k);
        text = `공을 ${H} cm 높이에서 떨어뜨렸어요. 이 공은 땅에 닿으면 떨어진 높이의 ${M(a)}만큼 튀어 올라요. 공이 땅에 ${k}번 닿았다가 튀어 오른 높이는 몇 cm인가요?`;
        steps = Array.from({ length: k }, (_, i) => `${i + 1}번째: ${K(h(i))} × ${M(a)} = ${K(h(i + 1))}(cm)`).join(', ');
        pl = [{ value: h(k - 1), cause: 'condition', msg: '튀어 오른 횟수를 다시 세어요.' }, { value: F.mul(H, a, k), cause: 'concept', msg: `튀어 오를 때마다 바로 앞 높이의 ${M(a)}예요. 처음 높이에 ${k}를 곱하면 안 돼요.` }];
      } else {
        ans = F.add(H, F.mul(h(1), 2));
        text = `공을 ${H} cm 높이에서 떨어뜨렸어요. 이 공은 땅에 닿으면 떨어진 높이의 ${M(a)}만큼 튀어 올라요. 공을 떨어뜨린 때부터 땅에 두 번째로 닿을 때까지 공이 움직인 거리는 모두 몇 cm인가요?`;
        steps = `내려감 ${H} + 올라감 ${K(h(1))} + 내려감 ${K(h(1))} = ${K(ans)}(cm)`;
        pl = [{ value: F.add(H, h(1)), cause: 'condition', msg: '튀어 오른 다음 다시 내려오는 거리도 더해요.' }];
      }
      return {
        text,
        answer: { type: 'num', value: K(ans), unit: 'cm' },
        patterns: pats(ans, pl).filter((pt) => F.isInt(pt.value)),
        hints: [`튀어 오르는 높이는 바로 앞에 떨어진 높이의 ${M(a)}예요.`, f === 2 ? '공이 움직인 길을 그림으로 그려 봐요: 내려감 → 올라감 → 내려감.' : `첫 번째로 튀어 오른 높이: ${H} × ${M(a)} = ${K(h(1))}(cm)`, steps],
        solution: [steps, `답: ${K(ans)} cm`],
        key: `u2s2-top-bounce|${f}|${H}|${K(a)}`,
        data: { f, H, a: K(a) },
      };
    },
    verify(p) {
      const { f, H, a } = p.data;
      const want = f === 0 ? F.mul(H, a, a) : f === 1 ? F.mul(H, a, a, a) : F.add(H, F.mul(H, a, 2));
      return F.eq(p.answer.value, want) && F.isInt(want);
    },
  });

  // ---------------------------------------------------------------- u2s3 진분수의 곱셈
  const tScale = top({
    id: 'u2s3-top-scale', sub: 'u2s3', styleName: '최상위: 넓이는 몇 배',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const a = properR(r, 9), b = properR(r, 9);
      if (!a || !b) return null;
      let text, ans, steps, pl, fig = null;
      if (f === 0) {
        ans = F.mul(a, a);
        text = `정사각형의 한 변의 길이를 처음 길이의 ${M(a)}로 줄여서 새로운 정사각형을 만들었어요. 새로운 정사각형의 넓이는 처음 정사각형의 넓이의 몇 배인가요?`;
        steps = `가로도 ${M(a)}배, 세로도 ${M(a)}배 → ${M(a)} × ${M(a)} = ${M(ans)}(배)`;
        pl = [{ value: a, cause: 'concept', msg: '가로와 세로가 모두 줄어들어요. 넓이는 두 번 곱해요.' }, { value: F.mul(a, 2), cause: 'concept', msg: '두 번 더한 것이 아니라 두 번 곱해야 해요.' }];
      } else if (f === 1) {
        if (F.eq(a, b)) return null;
        ans = F.mul(a, b);
        text = `직사각형의 가로를 처음 길이의 ${M(a)}로, 세로를 처음 길이의 ${M(b)}로 줄여서 새로운 직사각형을 만들었어요. 새로운 직사각형의 넓이는 처음 넓이의 몇 배인가요?`;
        steps = `${M(a)} × ${M(b)} = ${M(ans)}(배)`;
        pl = [{ value: F.add(a, b), cause: 'concept', msg: '넓이는 가로 × 세로라서 두 분수를 곱해요.' }];
      } else {
        const A = F.parse(a), B = F.parse(b);
        const area = r.int(2, 40);
        ans = F.mul(area, a, b);
        if (F.isInt(ans) && r.chance(0.5)) return null;
        text = `넓이가 ${area} m²인 직사각형 모양의 꽃밭이 있어요. 꽃밭의 가로를 처음의 ${M(a)}로, 세로를 처음의 ${M(b)}로 줄이면 줄인 꽃밭의 넓이는 몇 m²인가요?`;
        steps = `넓이는 처음의 ${M(a)} × ${M(b)} = ${M(F.mul(a, b))}배 → ${area} × ${M(F.mul(a, b))} = ${M(ans)}(m²)`;
        pl = [{ value: F.mul(area, a), cause: 'condition', msg: '세로도 줄였어요. 두 분수를 모두 곱해요.' }, { value: F.mul(area, F.add(a, b)), cause: 'concept', msg: '두 분수를 더하지 않고 곱해요.' }];
        if (A.d * B.d > 100) return null;
        fig = null;
      }
      if (!okF(ans)) return null;
      return {
        text,
        figure: fig,
        answer: FR(ans, f === 2 ? 'm²' : '배'),
        patterns: pats(ans, pl),
        hints: ['넓이 = 가로 × 세로예요. 가로와 세로가 각각 몇 배가 되는지 생각해요.', '가로가 ■배, 세로가 ▲배가 되면 넓이는 ■ × ▲배가 돼요. 예) 가로 2배, 세로 3배 → 넓이 6배', steps],
        solution: [steps],
        key: `u2s3-top-scale|${f}|${text}`,
        data: { f, a: K(a), b: K(b), text },
      };
    },
    verify(p) {
      const { f, a, b, text } = p.data;
      if (f === 0) return F.eq(p.answer.value, F.mul(a, a));
      if (f === 1) return F.eq(p.answer.value, F.mul(a, b));
      const area = Number(text.match(/넓이가 (\d+) m²/)[1]);
      return F.eq(p.answer.value, F.mul(area, a, b));
    },
  });

  const tPart = top({
    id: 'u2s3-top-part', sub: 'u2s3', styleName: '최상위: 전체의 몇 분의 몇',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const a = properR(r, 7), b = properR(r, 7);
      if (!a || !b) return null;
      const g = F.mul(a, b), ng = F.mul(a, F.sub(1, b));
      const t = r.pick([['반 학생', '여학생', '안경을 쓴'], ['농장 동물', '닭', '흰색인'], ['도서관 책', '동화책', '그림이 있는']]);
      const ask = () => `${t[2]} ${t[1]}`;
      let text, ans, steps, pl;
      if (f === 0) {
        ans = g;
        text = `${t[0]}의 ${j(M(a), '은/는')} ${t[1]}이고, ${t[1]}의 ${j(M(b), '은/는')} ${t[2]} ${t[1]}이에요. ${ask()}은 ${t[0]} 전체의 몇 분의 몇인가요?`;
        steps = `${M(a)} × ${M(b)} = ${M(g)}`;
        pl = [{ value: b, cause: 'condition', msg: `${M(b)}는 ${t[1]} 중에서의 부분이에요. 전체를 기준으로 바꾸려면 곱해요.` }];
      } else if (f === 1) {
        ans = ng;
        text = `${t[0]}의 ${j(M(a), '은/는')} ${t[1]}이고, ${t[1]}의 ${j(M(b), '은/는')} ${t[2]} ${t[1]}이에요. ${t[1]} 중에서 ${t[2]} ${t[1]}을 뺀 나머지는 ${t[0]} 전체의 몇 분의 몇인가요?`;
        steps = `${t[1]} 중 나머지: 1 - ${M(b)} = ${M(F.sub(1, b))} → ${M(a)} × ${M(F.sub(1, b))} = ${M(ng)}`;
        pl = [{ value: g, cause: 'condition', msg: `${t[2]} ${t[1]}을 구했어요. 나머지를 구해야 해요.` }, { value: F.sub(1, g), cause: 'condition', msg: `${t[1]}이 아닌 것까지 셌어요. ${t[1]} 중의 나머지만 구해요.` }];
      } else {
        const N = F.parse(a).d * F.parse(b).d * r.int(1, 6);
        if (N > 400) return null;
        ans = F.mul(N, g);
        text = `${t[0]} ${N}${t[0].includes('학생') ? '명' : t[0].includes('동물') ? '마리' : '권'} 중 ${j(M(a), '은/는')} ${t[1]}이고, ${t[1]}의 ${j(M(b), '은/는')} ${t[2]} ${t[1]}이에요. ${t[2]} ${t[1]}은 몇 ${t[0].includes('학생') ? '명' : t[0].includes('동물') ? '마리' : '권'}인가요?`;
        steps = `${N} × ${M(a)} = ${K(F.mul(N, a))}, ${K(F.mul(N, a))} × ${M(b)} = ${K(ans)}`;
        pl = [{ value: F.mul(N, a), cause: 'condition', msg: `${t[1]}의 수만 구했어요. ${t[1]}의 ${M(b)}까지 구해요.` }, { value: F.mul(N, b), cause: 'condition', msg: `${M(b)}는 전체가 아니라 ${t[1]}의 부분이에요.` }];
      }
      return {
        text,
        answer: f === 2 ? { type: 'num', value: K(ans), unit: t[0].includes('학생') ? '명' : t[0].includes('동물') ? '마리' : '권' } : FR(ans),
        patterns: f === 2 ? pats(ans, pl).filter((pt) => F.isInt(pt.value)) : pats(ans, pl),
        hints: ['"~의 ~"는 곱셈으로 나타내요. 기준이 전체인지, 일부분인지 살펴봐요.', `${t[1]}은 전체의 ${M(a)}, ${t[2]} ${t[1]}은 ${t[1]}의 ${M(b)}예요.`, steps],
        solution: [steps, `답: ${M(ans)}`],
        key: `u2s3-top-part|${f}|${text}`,
        data: { f, a: K(a), b: K(b), text },
      };
    },
    verify(p) {
      const { f, a, b, text } = p.data;
      if (f === 0) return F.eq(p.answer.value, F.mul(a, b));
      if (f === 1) return F.eq(p.answer.value, F.mul(a, F.sub(1, b)));
      const N = Number(text.match(/ (\d+)(명|마리|권) 중/)[1]);
      return F.eq(p.answer.value, F.mul(N, a, b));
    },
  });

  // ---------------------------------------------------------------- u2s4 (대분수)×(대분수)
  const tWalk = top({
    id: 'u2s4-top-walk', sub: 'u2s4', styleName: '최상위: 걸은 거리',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const s = mixedR(r, 5, 4); if (!s) return null;
      let text, ans, steps, pl;
      if (f === 0) {
        const t = mixedR(r, 5, 3); if (!t) return null;
        ans = F.mul(s, t);
        text = `한 시간에 ${M(s)} km를 걷는 빠르기로 ${M(t)}시간 동안 걸었어요. 걸은 거리는 몇 km인가요?`;
        steps = `${M(s)} × ${M(t)} = ${imp(s)} × ${imp(t)} = ${M(ans)}(km)`;
        const S = F.parts(s), Tt = F.parts(t);
        pl = [{ value: F.add(S.w * Tt.w, F.mul(F.make(S.n, S.d), F.make(Tt.n, Tt.d))), cause: 'concept', msg: '자연수끼리, 분수끼리 따로 곱하면 안 돼요. 가분수로 바꿔서 곱해요.' }];
      } else if (f === 1) {
        const h = r.int(1, 3), m = r.pick([10, 12, 15, 20, 30, 40, 45, 50]);
        const t = F.add(h, F.make(m, 60));
        ans = F.mul(s, t);
        text = `한 시간에 ${M(s)} km를 걷는 빠르기로 ${h}시간 ${m}분 동안 걸었어요. 걸은 거리는 몇 km인가요?`;
        steps = `${h}시간 ${m}분 = ${h}시간 + ${M(F.make(m, 60))}시간 = ${M(t)}시간 → ${M(s)} × ${M(t)} = ${M(ans)}(km)`;
        pl = [{ value: F.mul(s, F.add(h, F.make(m, 100))), cause: 'concept', msg: `1시간은 60분이에요. ${m}분은 ${M(F.make(m, 60))}시간이에요.` }, { value: F.mul(s, h), cause: 'condition', msg: `${m}분 동안 걸은 거리도 더해요.` }];
      } else {
        const s2 = mixedR(r, 5, 4), t = mixedR(r, 4, 2);
        if (!s2 || !t || F.eq(s, s2)) return null;
        ans = F.add(F.mul(s, t), F.mul(s2, t));
        text = `같은 곳에서 동시에 출발하여 서로 반대 방향으로 걸었어요. 민서는 한 시간에 ${M(s)} km, 준호는 한 시간에 ${M(s2)} km를 걸어요. ${M(t)}시간 뒤 두 사람 사이의 거리는 몇 km인가요?`;
        steps = `민서 ${M(s)} × ${M(t)} = ${M(F.mul(s, t))}, 준호 ${M(s2)} × ${M(t)} = ${M(F.mul(s2, t))} → 합: ${M(ans)}(km)`;
        pl = [{ value: F.sub(F.mul(F.cmp(s, s2) > 0 ? s : s2, t), F.mul(F.cmp(s, s2) > 0 ? s2 : s, t)), cause: 'condition', msg: '반대 방향으로 걸으면 두 사람이 걸은 거리를 더해요. 빼면 같은 방향일 때예요.' }];
      }
      if (!okF(ans) || F.parse(ans).d > 100) return null;
      return {
        text,
        answer: FR(ans, 'km'),
        patterns: pats(ans, pl),
        hints: ['(걸은 거리) = (한 시간에 걷는 거리) × (걸은 시간)', f === 1 ? '분을 시간으로 바꿀 때는 60분이 1시간이에요. 예) 15분 = ⟪15/60⟫시간 = ⟪1/4⟫시간' : '대분수는 가분수로 바꾼 다음 곱해요.', steps],
        solution: [steps],
        key: `u2s4-top-walk|${f}|${text}`,
        data: { f, ans: K(ans), text },
      };
    },
    verify(p) { return F.eq(p.answer.value, p.data.ans) && okF(p.data.ans); },
  });

  const tMistake = top({
    id: 'u2s4-top-mistake', sub: 'u2s4', styleName: '최상위: 잘못 계산한 어떤 수',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const m = mixedR(r, 5, 3), x = mixedR(r, 6, 4);
      if (!m || !x) return null;
      const right = F.mul(x, m);
      let text, ans, steps, pl;
      if (f === 0 || f === 2) {
        const S = F.add(x, m);
        ans = f === 0 ? right : F.sub(right, S);
        if (f === 2 && F.cmp(right, S) <= 0) return null;
        text = f === 0
          ? `어떤 수에 ${M(m)}을 곱해야 할 것을 잘못하여 더했더니 ${M(S)}이 되었어요. 바르게 계산하면 얼마인가요?`
          : `어떤 수에 ${M(m)}을 곱해야 할 것을 잘못하여 더했더니 ${M(S)}이 되었어요. 바르게 계산한 값은 잘못 계산한 값보다 얼마나 더 큰가요?`;
        steps = `어떤 수: ${M(S)} - ${M(m)} = ${M(x)} → 바르게 계산: ${M(x)} × ${M(m)} = ${M(right)}${f === 2 ? ` → ${M(right)} - ${M(S)} = ${M(ans)}` : ''}`;
        pl = [{ value: F.mul(S, m), cause: 'condition', msg: '잘못 계산한 값에 곱하면 안 돼요. 먼저 어떤 수를 구해요.' }, { value: x, cause: 'condition', msg: '어떤 수를 구했어요. 바르게 계산까지 해요.' }];
      } else {
        const S = F.sub(x, m);
        if (F.cmp(S, 0) <= 0) return null;
        ans = right;
        text = `어떤 수에 ${M(m)}을 곱해야 할 것을 잘못하여 뺐더니 ${M(S)}이 되었어요. 바르게 계산하면 얼마인가요?`;
        steps = `어떤 수: ${M(S)} + ${M(m)} = ${M(x)} → 바르게 계산: ${M(x)} × ${M(m)} = ${M(right)}`;
        pl = [{ value: F.mul(S, m), cause: 'condition', msg: '잘못 계산한 값에 곱하면 안 돼요. 먼저 어떤 수를 구해요.' }, { value: F.mul(F.sub(S, m), m), cause: 'concept', msg: '뺐더니 나온 값이니 거꾸로 더해야 어떤 수가 나와요.' }];
      }
      if (!okF(ans)) return null;
      return {
        text: text.replace(`${M(m)}을`, j(M(m), '을/를')).replace(/(⟪[^⟫]+⟫|\d+)이 되었어요/, (all, w) => `${j(w, '이/가')} 되었어요`),
        answer: FR(ans),
        patterns: pats(ans, pl),
        hints: ['먼저 잘못 계산한 식을 거꾸로 풀어서 어떤 수를 구해요.', f === 1 ? '빼서 나온 값에 다시 더하면 어떤 수가 돼요.' : '더해서 나온 값에서 다시 빼면 어떤 수가 돼요.', steps],
        solution: [steps],
        key: `u2s4-top-mistake|${f}|${K(m)}|${K(x)}`,
        data: { f, m: K(m), x: K(x) },
      };
    },
    verify(p) {
      const { f, m, x } = p.data;
      const right = F.mul(x, m);
      return F.eq(p.answer.value, f === 2 ? F.sub(right, F.add(x, m)) : right);
    },
  });

  // ---------------------------------------------------------------- 이야기 문제
  const tStory = top({
    id: 'u2s4-top-story', sub: 'u2s4', story: true, styleName: '최상위 이야기: 벽 칠하기',
    build(r) {
      const W = F.mixed(r.int(3, 6), 1, r.pick([2, 4])), H = F.mixed(r.int(2, 3), r.pick([1, 2]), 3);
      if (!okF(H)) return null;
      const dw = 1, dh = F.mixed(2, 1, 2);
      const p = F.make(r.pick([1, 2, 3, 4]), r.pick([5, 7]));
      const wall = F.mul(W, H), door = F.mul(dw, dh), area = F.sub(wall, door);
      const ans = F.mul(area, p);
      if (!okF(ans) || F.parse(ans).d > 100) return null;
      return {
        text: `가로가 ${M(W)} m, 세로가 ${M(H)} m인 직사각형 모양의 벽에 페인트를 칠하려고 해요.\n• 벽에는 가로 ${dw} m, 세로 ${M(dh)} m인 문이 있어서 문에는 칠하지 않아요.\n• 벽 1 m²를 칠하는 데 페인트가 ${M(p)} L 필요해요.\n필요한 페인트는 모두 몇 L인가요?`,
        answer: FR(ans, 'L'),
        patterns: pats(ans, [
          { value: F.mul(wall, p), cause: 'condition', msg: '문의 넓이는 빼야 해요.' },
          { value: area, cause: 'condition', msg: '칠할 넓이를 구했어요. 1 m²마다 필요한 페인트를 곱해요.' },
        ]),
        hints: ['칠할 넓이 = (벽의 넓이) - (문의 넓이)', `벽: ${M(W)} × ${M(H)} = ${M(wall)}(m²), 문: ${dw} × ${M(dh)} = ${M(door)}(m²) → 칠할 넓이 ${M(area)} m²`, `${M(area)} × ${M(p)} = ${M(ans)}(L)`],
        solution: [`벽의 넓이: ${M(W)} × ${M(H)} = ${M(wall)}(m²)`, `문의 넓이: ${dw} × ${M(dh)} = ${M(door)}(m²)`, `칠할 넓이: ${M(wall)} - ${M(door)} = ${M(area)}(m²)`, `페인트: ${M(area)} × ${M(p)} = ${M(ans)}(L)`],
        key: `u2s4-top-story|${K(W)}|${K(H)}|${K(p)}`,
        data: { W: K(W), H: K(H), p: K(p) },
      };
    },
    verify(p) { const { W, H } = p.data; return F.eq(p.answer.value, F.mul(F.sub(F.mul(W, H), F.mul(1, '5/2')), p.data.p)); },
  });

  M5.addTemplates([tTape, tLess, tRest, tBounce, tScale, tPart, tWalk, tMistake, tStory]);
})();
