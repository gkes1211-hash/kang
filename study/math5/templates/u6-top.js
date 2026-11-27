// 6단원 🏔️ 최상위 문제 (평균과 가능성) — 대표 문제 → 변형 3문제 (build의 v: 0 = 대표, 1~3 = 변형)
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text, F = M5.frac;
  const j = T.j;
  const form = M5.topForm;
  const top = (o) => Object.assign({ unit: 6, style: 'A', levels: [4, 4], tier: 'top' }, o);
  const M = F.mk, K = F.key;
  const notAns = (ans) => (pt) => Number(pt.value) > 0 && Number(pt.value) !== Number(ans) && Number.isInteger(Number(pt.value));
  const fpats = (ans, list) => {
    const seen = new Set([K(ans)]);
    return list.filter((pt) => {
      const f = F.parse(pt.value);
      if (!f || f.n <= 0 || f.d > 100) return false;
      const k = K(pt.value);
      if (seen.has(k)) return false;
      seen.add(k); pt.value = k; return true;
    });
  };
  const NAMES = ['수아', '은우', '시우', '서윤', '도윤', '예준', '하린', '지호'];

  // ---------------------------------------------------------------- u6s1 평균
  const tNew = top({
    id: 'u6s1-top-new', sub: 'u6s1', styleName: '최상위: 한 명이 더 들어오면',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const n = r.int(4, 9), A = r.int(30, 60);
      if (f === 0) {
        const B = A + r.int(-3, 4);
        const x = B * (n + 1) - n * A;
        if (B === A || x < 28 || x > 65) return null;
        return {
          text: `모둠 학생 ${n}명의 몸무게의 평균은 ${A} kg이에요. 몸무게가 ${x} kg인 학생 한 명이 모둠에 새로 들어왔어요. 모둠 학생 ${n + 1}명의 몸무게의 평균은 몇 kg인가요?`,
          answer: { type: 'num', value: String(B), unit: 'kg' },
          patterns: [{ value: String((A + x) / 2), cause: 'concept', msg: '두 수의 평균이 아니에요. 모든 학생의 몸무게 합을 학생 수로 나눠요.' }, { value: String((n * A + x) / n), cause: 'calc', msg: `학생 수가 ${n + 1}명이 되었어요.` }].filter(notAns(B)),
          hints: ['(자료의 합) = (평균) × (자료의 수)', `처음 ${n}명의 합: ${A} × ${n} = ${A * n}, 새 학생을 더하면 ${A * n} + ${x} = ${A * n + x}`, `${A * n + x} ÷ ${n + 1} = ${B}(kg)`],
          solution: [`처음 합: ${A} × ${n} = ${A * n}(kg)`, `${n + 1}명의 합: ${A * n} + ${x} = ${A * n + x}(kg)`, `평균: ${A * n + x} ÷ ${n + 1} = ${B}(kg)`],
          key: `u6s1-top-new|0|${n}|${A}|${x}`,
          data: { f, n, A, x, B },
        };
      }
      if (f === 1) {
        const d = r.int(1, 4), B = A + d;
        const x = B * (n + 1) - n * A;
        if (x < 28 || x > 65) return null;
        return {
          text: `모둠 학생 ${n}명의 몸무게의 평균은 ${A} kg이에요. 학생 한 명이 새로 들어왔더니 평균이 ${d} kg 늘었어요. 새로 들어온 학생의 몸무게는 몇 kg인가요?`,
          answer: { type: 'num', value: String(x), unit: 'kg' },
          patterns: [{ value: String(A + d), cause: 'concept', msg: '새 평균을 구했어요. 새로 들어온 학생의 몸무게를 구해요.' }, { value: String(A + d * n), cause: 'calc', msg: `새 평균 × ${n + 1}명에서 처음 합을 빼요.` }].filter(notAns(x)),
          hints: [`새 평균은 ${A} + ${d} = ${B} kg이에요.`, `${n + 1}명의 합: ${B} × ${n + 1} = ${B * (n + 1)}, 처음 ${n}명의 합: ${A} × ${n} = ${A * n}`, `${B * (n + 1)} - ${A * n} = ${x}(kg)`],
          solution: [`새 평균: ${B} kg`, `새 학생: ${B} × ${n + 1} - ${A} × ${n} = ${x}(kg)`],
          key: `u6s1-top-new|1|${n}|${A}|${d}`,
          data: { f, n, A, x, B },
        };
      }
      const B = A + r.int(-4, 4);
      const y = n * A - (n - 1) * B;
      if (B === A || y < 28 || y > 65) return null;
      return {
        text: `모둠 학생 ${n}명의 몸무게의 평균은 ${A} kg이에요. 학생 한 명이 전학을 가서 남은 ${n - 1}명의 몸무게의 평균이 ${B} kg이 되었어요. 전학 간 학생의 몸무게는 몇 kg인가요?`,
        answer: { type: 'num', value: String(y), unit: 'kg' },
        patterns: [{ value: String(Math.abs(A - B)), cause: 'concept', msg: '평균의 차가 몸무게는 아니에요. 합을 구해서 빼요.' }, { value: String(n * A - n * B), cause: 'calc', msg: `남은 학생은 ${n - 1}명이에요.` }].filter(notAns(y)),
        hints: ['(자료의 합) = (평균) × (자료의 수)', `${n}명의 합: ${A} × ${n} = ${A * n}, 남은 ${n - 1}명의 합: ${B} × ${n - 1} = ${B * (n - 1)}`, `${A * n} - ${B * (n - 1)} = ${y}(kg)`],
        solution: [`${n}명의 합: ${A * n} kg`, `${n - 1}명의 합: ${B * (n - 1)} kg`, `전학 간 학생: ${A * n} - ${B * (n - 1)} = ${y}(kg)`],
        key: `u6s1-top-new|2|${n}|${A}|${B}`,
        data: { f, n, A, y, B },
      };
    },
    verify(p) {
      const d = p.data, a = Number(p.answer.value);
      if (d.f === 0) return (d.n * d.A + d.x) === a * (d.n + 1);
      if (d.f === 1) return d.n * d.A + a === d.B * (d.n + 1);
      return d.n * d.A - a === d.B * (d.n - 1);
    },
  });

  const tGroups = top({
    id: 'u6s1-top-groups', sub: 'u6s1', styleName: '최상위: 두 모둠을 합친 평균',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const n1 = r.int(3, 9), n2 = r.int(3, 9), a1 = r.int(60, 95), a2 = r.int(60, 95);
      const tot = n1 * a1 + n2 * a2;
      if (a1 === a2 || tot % (n1 + n2)) return null;
      const A = tot / (n1 + n2);
      const tbl = (h) => ({ type: 'table', title: '모둠별 줄넘기 기록', head: ['모둠', '학생 수', '평균(번)'], rows: [['가', `${n1}명`, String(a1)], ['나', h === 'n' ? '□명' : `${n2}명`, h === 'a' ? '□' : String(a2)]] });
      if (f === 0) {
        return {
          text: `가 모둠과 나 모둠의 줄넘기 기록이에요. 두 모둠 학생 모두의 줄넘기 기록의 평균은 몇 번인가요?`,
          figure: tbl(),
          answer: { type: 'num', value: String(A), unit: '번' },
          patterns: [{ value: String((a1 + a2) / 2), cause: 'concept', msg: '두 모둠의 학생 수가 달라서 평균끼리 더해 2로 나누면 안 돼요. 전체 합 ÷ 전체 학생 수예요.' }].filter(notAns(A)),
          hints: ['모둠마다 기록의 합을 먼저 구해요. (합) = (평균) × (학생 수)', `가: ${a1} × ${n1} = ${n1 * a1}, 나: ${a2} × ${n2} = ${n2 * a2}`, `(${n1 * a1} + ${n2 * a2}) ÷ ${n1 + n2} = ${A}(번)`],
          solution: [`가 모둠의 합: ${n1 * a1}번, 나 모둠의 합: ${n2 * a2}번`, `전체 평균: ${tot} ÷ ${n1 + n2} = ${A}(번)`],
          key: `u6s1-top-groups|0|${n1}|${n2}|${a1}|${a2}`,
          data: { f, n1, n2, a1, a2 },
        };
      }
      if (f === 1) {
        return {
          text: `가 모둠과 나 모둠의 줄넘기 기록이에요. 두 모둠 학생 모두의 평균이 ${A}번일 때 나 모둠의 평균은 몇 번인가요?`,
          figure: tbl('a'),
          answer: { type: 'num', value: String(a2), unit: '번' },
          patterns: [{ value: String(2 * A - a1), cause: 'concept', msg: '학생 수가 달라서 평균끼리 계산하면 안 돼요. 합을 이용해요.' }].filter(notAns(a2)),
          hints: [`전체 합: ${A} × ${n1 + n2} = ${tot}`, `가 모둠의 합: ${a1} × ${n1} = ${n1 * a1} → 나 모둠의 합: ${tot} - ${n1 * a1} = ${n2 * a2}`, `${n2 * a2} ÷ ${n2} = ${a2}(번)`],
          solution: [`전체 합: ${tot}번, 가 모둠의 합: ${n1 * a1}번`, `나 모둠: (${tot} - ${n1 * a1}) ÷ ${n2} = ${a2}(번)`],
          key: `u6s1-top-groups|1|${n1}|${n2}|${a1}|${a2}`,
          data: { f, n1, n2, a1, a2 },
        };
      }
      if (A === a2) return null;
      return {
        text: `가 모둠과 나 모둠의 줄넘기 기록이에요. 두 모둠 학생 모두의 평균이 ${A}번일 때 나 모둠의 학생은 몇 명인가요?`,
        figure: tbl('n'),
        answer: { type: 'num', value: String(n2), unit: '명' },
        patterns: [{ value: String(n1), cause: 'concept', msg: '두 모둠의 학생 수가 같다고 생각했어요. 평균과의 차를 이용해 봐요.' }].filter(notAns(n2)),
        hints: [`가 모둠은 전체 평균보다 한 명당 ${Math.abs(a1 - A)}번 ${a1 > A ? '많고' : '적고'}, 나 모둠은 ${Math.abs(a2 - A)}번 ${a2 > A ? '많아요' : '적어요'}.`, `넘치는 만큼과 모자라는 만큼이 같아야 평균이 돼요: ${Math.abs(a1 - A)} × ${n1} = ${Math.abs(a1 - A) * n1}`, `${Math.abs(a1 - A) * n1} ÷ ${Math.abs(a2 - A)} = ${n2}(명)`],
        solution: [`가 모둠이 평균보다 ${a1 > A ? '많은' : '적은'} 양: ${Math.abs(a1 - A)} × ${n1} = ${Math.abs(a1 - A) * n1}`, `나 모둠 한 명당 ${Math.abs(a2 - A)}씩 → ${Math.abs(a1 - A) * n1} ÷ ${Math.abs(a2 - A)} = ${n2}(명)`],
        key: `u6s1-top-groups|2|${n1}|${n2}|${a1}|${a2}`,
        data: { f, n1, n2, a1, a2 },
      };
    },
    verify(p) {
      const d = p.data, a = Number(p.answer.value);
      const A = (d.n1 * d.a1 + d.n2 * d.a2) / (d.n1 + d.n2);
      if (d.f === 0) return a === A;
      if (d.f === 1) return d.n1 * d.a1 + d.n2 * a === A * (d.n1 + d.n2);
      return d.n1 * d.a1 + a * d.a2 === A * (d.n1 + a);
    },
  });

  // ---------------------------------------------------------------- u6s2 평균 이용하기
  const tTarget = top({
    id: 'u6s2-top-target', sub: 'u6s2', styleName: '최상위: 목표 평균 만들기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const k = r.int(3, 6), A = r.int(70, 88);
      if (f === 0) {
        const B = A + r.int(1, 5);
        const need = B * (k + 2) - k * A;
        if (need % 2 || need / 2 > 100) return null;
        const x = need / 2;
        return {
          text: `수학 시험을 ${k}번 보았는데 평균이 ${A}점이에요. 앞으로 2번 더 시험을 보는데 두 번 모두 같은 점수를 받아서 ${k + 2}번의 평균을 ${B}점으로 만들려고 해요. 한 번에 몇 점을 받아야 하나요?`,
          answer: { type: 'num', value: String(x), unit: '점' },
          patterns: [{ value: String(need), cause: 'condition', msg: '두 번 받을 점수의 합이에요. 한 번의 점수를 구해요.' }, { value: String(B), cause: 'concept', msg: '목표 평균만 받으면 평균이 오르지 않아요. 합을 이용해요.' }].filter(notAns(x)),
          hints: [`${k + 2}번의 합이 ${B} × ${k + 2} = ${B * (k + 2)}점이어야 해요.`, `지금까지의 합: ${A} × ${k} = ${A * k} → 남은 2번의 합: ${need}`, `${need} ÷ 2 = ${x}(점)`],
          solution: [`목표 합: ${B * (k + 2)}점, 지금까지 합: ${A * k}점`, `남은 2번의 합: ${need}점 → 한 번에 ${x}점`],
          key: `u6s2-top-target|0|${k}|${A}|${B}`,
          data: { f, k, A, B },
        };
      }
      if (f === 1) {
        const d = r.int(1, 4);
        const x = (A + d) * (k + 1) - k * A;
        if (x > 100) return null;
        return {
          text: `수학 시험을 ${k}번 보았는데 평균이 ${A}점이에요. 한 번 더 시험을 보아서 평균을 ${d}점 올리려면 몇 점을 받아야 하나요?`,
          answer: { type: 'num', value: String(x), unit: '점' },
          patterns: [{ value: String(A + d), cause: 'concept', msg: '새 평균만큼 받으면 평균은 그만큼 오르지 않아요. 합을 이용해요.' }].filter(notAns(x)),
          hints: [`새 평균: ${A} + ${d} = ${A + d}점`, `${k + 1}번의 합: ${A + d} × ${k + 1} = ${(A + d) * (k + 1)}, 지금까지 ${A * k}`, `${(A + d) * (k + 1)} - ${A * k} = ${x}(점)`],
          solution: [`새 평균 ${A + d}점 → ${k + 1}번의 합 ${(A + d) * (k + 1)}점`, `받아야 할 점수: ${(A + d) * (k + 1)} - ${A * k} = ${x}(점)`],
          key: `u6s2-top-target|1|${k}|${A}|${d}`,
          data: { f, k, A, d, x },
        };
      }
      const m = r.int(2, 3), B = A + r.int(2, 6);
      const x = B * (k + m) - k * A;
      if (x > 100 * m) return null;
      return {
        text: `수학 시험을 ${k}번 보았는데 평균이 ${A}점이에요. 앞으로 ${m}번 더 시험을 보아 ${k + m}번의 평균이 ${B}점 이상이 되게 하려고 해요. 남은 ${m}번의 시험 점수의 합은 적어도 몇 점이어야 하나요?`,
        answer: { type: 'num', value: String(x), unit: '점' },
        patterns: [{ value: String(B * m), cause: 'concept', msg: '앞에서 본 시험의 평균이 목표보다 낮아서 더 많이 받아야 해요. 전체 합으로 생각해요.' }, { value: String(x - 1), cause: 'condition', msg: "'이상'은 그 수도 들어가요." }].filter(notAns(x)),
        hints: [`${k + m}번의 합이 ${B} × ${k + m} = ${B * (k + m)}점 이상이어야 해요.`, `지금까지의 합: ${A} × ${k} = ${A * k}`, `${B * (k + m)} - ${A * k} = ${x}(점)`],
        solution: [`목표 합: ${B * (k + m)}점 이상`, `남은 ${m}번의 합: ${B * (k + m)} - ${A * k} = ${x}(점) 이상`],
        key: `u6s2-top-target|2|${k}|${A}|${m}|${B}`,
        data: { f, k, A, m, B, x },
      };
    },
    verify(p) {
      const d = p.data, a = Number(p.answer.value);
      if (d.f === 0) return d.k * d.A + 2 * a === d.B * (d.k + 2);
      if (d.f === 1) return d.k * d.A + a === (d.A + d.d) * (d.k + 1);
      return d.k * d.A + a === d.B * (d.k + d.m);
    },
  });

  const tWrong = top({
    id: 'u6s2-top-wrong', sub: 'u6s2', styleName: '최상위: 잘못 본 자료',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const n = r.int(4, 8), real = r.int(10, 90);
      const dlt = n * r.int(1, 5) * (f === 2 ? -1 : 1);
      const seen = real + dlt;
      if (seen <= 0 || seen > 99) return null;
      const W = r.int(30, 80), C = W - dlt / n;
      if (f === 0 || f === 2) {
        return {
          text: `${n}명의 수학 점수의 평균을 구했어요. 그런데 한 명의 점수 ${real}점을 ${seen}점으로 잘못 보고 계산해서 평균이 ${W}점이 나왔어요. 바르게 계산한 평균은 몇 점인가요?`,
          answer: { type: 'num', value: String(C), unit: '점' },
          patterns: [{ value: String(W - dlt), cause: 'concept', msg: '잘못 본 차이는 합에서 생긴 차이예요. 평균에서는 ' + n + '으로 나눈 만큼만 달라져요.' }, { value: String(W + dlt / n), cause: 'calc', msg: `${seen > real ? '크게' : '작게'} 보았으니 평균이 ${seen > real ? '더 크게' : '더 작게'} 나왔어요. 반대로 고쳐요.` }].filter(notAns(C)),
          hints: [`잘못 계산한 합: ${W} × ${n} = ${W * n}`, `바른 합: ${W * n} ${seen > real ? '-' : '+'} ${Math.abs(dlt)} = ${W * n - dlt}`, `${W * n - dlt} ÷ ${n} = ${C}(점)`],
          solution: [`잘못 계산한 합: ${W * n}`, `${Math.abs(dlt)}만큼 ${seen > real ? '크게' : '작게'} 더했으니 바른 합: ${W * n - dlt}`, `바른 평균: ${C}점`],
          key: `u6s2-top-wrong|${f}|${n}|${real}|${seen}|${W}`,
          data: { f, n, real, seen, W },
        };
      }
      const d = dlt / n;
      return {
        text: `${n}명의 수학 점수의 평균을 구했어요. 그런데 한 명의 점수 ${real}점을 잘못 보고 계산해서 평균이 실제보다 ${d}점 높게 나왔어요. 잘못 본 점수는 몇 점인가요?`,
        answer: { type: 'num', value: String(seen), unit: '점' },
        patterns: [{ value: String(real + d), cause: 'concept', msg: `평균이 ${d}점 커지려면 합은 ${d} × ${n} = ${dlt}점 커져야 해요.` }].filter(notAns(seen)),
        hints: ['평균이 커진 만큼에 사람 수를 곱하면 합이 커진 만큼이에요.', `합이 커진 만큼: ${d} × ${n} = ${dlt}(점)`, `${real} + ${dlt} = ${seen}(점)`],
        solution: [`합의 차이: ${d} × ${n} = ${dlt}(점)`, `잘못 본 점수: ${real} + ${dlt} = ${seen}(점)`],
        key: `u6s2-top-wrong|1|${n}|${real}|${seen}`,
        data: { f, n, real, seen, W },
      };
    },
    verify(p) {
      const d = p.data, a = Number(p.answer.value);
      if (d.f === 1) return a - d.real > 0 && (a - d.real) % d.n === 0;
      return a * d.n === d.W * d.n - (d.seen - d.real);
    },
  });

  // ---------------------------------------------------------------- u6s3 가능성을 수로
  const tCards = top({
    id: 'u6s3-top-cards', sub: 'u6s3', styleName: '최상위: 수 카드 뽑기의 가능성',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const n = r.pick([8, 10, 12, 15, 16, 20]);
      const nums = Array.from({ length: n }, (_, i) => i + 1);
      let cond, test, desc;
      if (f === 0) { const k = r.int(2, 5); test = (x) => x % k === 0; desc = `${k}의 배수`; cond = `${k}의 배수: ${nums.filter(test).join(', ')}`; }
      else if (f === 1) { const lo = r.int(2, Math.floor(n / 2)), hi = r.int(lo + 2, n); test = (x) => x >= lo && x < hi; desc = `${lo} 이상 ${hi} 미만인 수`; cond = `${lo} 이상 ${hi} 미만: ${nums.filter(test).join(', ')}`; }
      else { const k = r.pick([3, 5]); test = (x) => x % 2 === 1 && x % k === 0; desc = `홀수이면서 ${k}의 배수인 수`; cond = `홀수이면서 ${k}의 배수: ${nums.filter(test).join(', ')}`; }
      const c = nums.filter(test).length;
      if (!c || c === n) return null;
      const ans = F.make(c, n);
      return {
        text: `1부터 ${n}까지의 수가 하나씩 적힌 수 카드 ${n}장이 있어요. 이 중에서 한 장을 뽑을 때 ${desc}가 나올 가능성을 분수로 나타내세요.`.replace(`${desc}가`, j(desc, '이/가')),
        answer: { type: 'frac', value: K(ans) },
        patterns: fpats(ans, [{ value: F.make(n - c, n), cause: 'condition', msg: '나오지 않을 가능성을 구했어요.' }, { value: F.make(1, c), cause: 'concept', msg: '가능성 = (그 일이 일어나는 경우의 수) ÷ (전체 경우의 수)예요.' }]),
        hints: ['전체 경우는 카드 수만큼이에요.', cond, `${c}장 ÷ ${n}장 → ${M(ans)}`],
        solution: [cond, `가능성: ⟪${c}/${n}⟫ = ${M(ans)}`],
        key: `u6s3-top-cards|${f}|${n}|${desc}`,
        data: { n, c, desc },
      };
    },
    verify(p) { return F.eq(p.answer.value, F.make(p.data.c, p.data.n)) && p.data.c > 0; },
  });

  const tAdd = top({
    id: 'u6s3-top-add', sub: 'u6s3', styleName: '최상위: 구슬을 더 넣으면',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const red = r.int(1, 8), blue = r.int(red + 1, 14);
      let ask, ans, steps, wrong;
      if (f === 0) {
        ans = blue - red;
        ask = `빨간 구슬을 몇 개 더 넣으면 빨간 구슬을 꺼낼 가능성이 ⟪1/2⟫이 되나요?`;
        steps = `빨간 구슬과 파란 구슬의 수가 같아야 해요 → ${blue} - ${red} = ${ans}(개)`;
        wrong = Math.round((red + blue) / 2) - red;
      } else if (f === 1) {
        const [p, q] = r.pick([[2, 3], [3, 4], [3, 5], [4, 5]]);
        const top_ = p * (red + blue) - q * red, bot = q - p;
        if (top_ <= 0 || top_ % bot) return null;
        ans = top_ / bot;
        ask = `빨간 구슬을 몇 개 더 넣으면 빨간 구슬을 꺼낼 가능성이 ⟪${p}/${q}⟫이 되나요?`;
        steps = `전체를 ${q}묶음으로 보면 빨간 구슬 ${p}묶음, 파란 구슬 ${q - p}묶음이에요. 파란 구슬 ${blue}개가 ${q - p}묶음 → 1묶음 ${blue / (q - p)}개 → 빨간 구슬 ${(blue / (q - p)) * p}개 → ${(blue / (q - p)) * p} - ${red} = ${ans}(개)`;
        if (blue % (q - p)) return null;
        wrong = Math.round((red + blue) * p / q) - red;
      } else {
        ans = blue - red;
        ask = `파란 구슬을 몇 개 꺼내어 버리면 빨간 구슬을 꺼낼 가능성이 ⟪1/2⟫이 되나요?`;
        steps = `빨간 구슬과 파란 구슬의 수가 같아야 해요 → ${blue} - ${red} = ${ans}(개)`;
        wrong = blue - Math.floor((red + blue) / 2);
      }
      return {
        text: `주머니에 빨간 구슬 ${red}개, 파란 구슬 ${blue}개가 들어 있어요. ${ask}`,
        figure: { type: 'bag', balls: [{ color: 'red', n: red }, { color: 'blue', n: blue }] },
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [{ value: String(wrong), cause: 'concept', msg: '구슬을 넣거나 빼면 전체 구슬 수도 바뀌어요. 바뀐 뒤의 수로 생각해요.' }].filter(notAns(ans)),
        hints: ['가능성 = (빨간 구슬 수) ÷ (전체 구슬 수). 구슬을 넣거나 빼면 전체도 바뀌어요.', f === 1 ? '가능성이 ⟪3/4⟫이면 구슬 4개 중 3개가 빨강, 1개가 파랑인 셈이에요.' : '가능성이 ⟪1/2⟫이면 빨간 구슬과 파란 구슬의 수가 같아요.', steps],
        solution: [steps],
        key: `u6s3-top-add|${f}|${red}|${blue}|${ask}`,
        data: { f, red, blue, ask },
      };
    },
    verify(p) {
      const { f, red, blue, ask } = p.data, x = Number(p.answer.value);
      if (f === 2) return F.eq(F.make(red, red + blue - x), '1/2');
      const m = ask.match(/⟪(\d+)\/(\d+)⟫/);
      return F.eq(F.make(red + x, red + blue + x), `${m[1]}/${m[2]}`);
    },
  });

  // ---------------------------------------------------------------- u6s4 가능성 판단
  const tSpin = top({
    id: 'u6s4-top-spin', sub: 'u6s4', styleName: '최상위: 회전판 만들기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const n = r.pick([6, 8, 9, 10, 12, 15, 16, 18, 20, 24]);
      const a = r.int(2, 5), b = f === 1 ? 2 : 1; // 빨강 = 파랑의 a배, 노랑 = 파랑의 b배
      if (n % (a + b + 1)) return null;
      const blue = n / (a + b + 1), red = a * blue, yel = b * blue;
      const cond = `• 화살이 빨강에 멈출 가능성은 파랑에 멈출 가능성의 ${a}배예요.\n• 노랑에 멈출 가능성은 파랑${b === 1 ? '과 같아요' : `의 ${b}배예요`}.`;
      let ask, ans;
      if (f === 0) { ask = '빨강은 몇 칸 칠해야 하나요?'; ans = { type: 'num', value: String(red), unit: '칸' }; }
      else if (f === 1) { ask = '노랑은 몇 칸 칠해야 하나요?'; ans = { type: 'num', value: String(yel), unit: '칸' }; }
      else { ask = '화살이 빨강에 멈출 가능성을 분수로 나타내세요.'; ans = { type: 'frac', value: K(F.make(red, n)) }; }
      const steps = `파랑을 1묶음이라 하면 빨강 ${a}묶음, 노랑 ${b}묶음 → 모두 ${a + b + 1}묶음 = ${n}칸 → 1묶음 ${blue}칸`;
      const pl = f === 2
        ? fpats(F.make(red, n), [{ value: F.make(a, n), cause: 'concept', msg: `${a}배는 칸 수가 아니라 파랑 칸 수의 ${a}배라는 뜻이에요.` }].filter((pt) => F.cmp(pt.value, 1) < 0))
        : [{ value: String(f === 0 ? a : b), cause: 'concept', msg: `${f === 0 ? a : b}배는 칸 수가 아니라 파랑 칸 수의 ${f === 0 ? a : b}배라는 뜻이에요.` }, { value: String(Math.round(n / (a + 1))), cause: 'condition', msg: '노랑 칸도 생각해야 해요.' }].filter(notAns(f === 0 ? red : yel));
      return {
        text: `${n}칸으로 똑같이 나누어진 회전판을 빨강, 파랑, 노랑으로 칠하려고 해요.\n${cond}\n${ask}`,
        figure: { type: 'spinner', sectors: Array(n).fill('white') },
        answer: ans,
        patterns: pl,
        hints: ['가능성이 ■배라는 것은 칠한 칸 수가 ■배라는 뜻이에요.', steps, `빨강 ${red}칸, 파랑 ${blue}칸, 노랑 ${yel}칸${f === 2 ? ` → 빨강일 가능성 ⟪${red}/${n}⟫ = ${M(F.make(red, n))}` : ''}`],
        solution: [steps, `빨강 ${red}칸, 파랑 ${blue}칸, 노랑 ${yel}칸`],
        key: `u6s4-top-spin|${f}|${n}|${a}|${b}`,
        data: { f, n, a, b },
      };
    },
    verify(p) {
      const { f, n, a, b } = p.data;
      for (let blue = 1; blue <= n; blue++) {
        if (blue * (a + b + 1) !== n) continue;
        if (f === 0) return Number(p.answer.value) === a * blue;
        if (f === 1) return Number(p.answer.value) === b * blue;
        return F.eq(p.answer.value, F.make(a * blue, n));
      }
      return false;
    },
  });

  const tCompare = top({
    id: 'u6s4-top-compare', sub: 'u6s4', styleName: '최상위: 두 주머니 비교하기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const r1 = r.int(2, 9), b1 = r.int(1, 9), r2 = r.int(2, 9), b2 = r.int(1, 9);
      const p1 = F.make(r1, r1 + b1), p2 = F.make(r2, r2 + b2);
      const fig = { type: 'table', title: '주머니 속 구슬 수', head: ['주머니', '빨간 구슬', '파란 구슬'], rows: [['가', `${r1}개`, `${b1}개`], ['나', `${r2}개`, `${b2}개`]] };
      if (f === 0) {
        const c = F.cmp(p1, p2);
        const opts = [
          { text: '가 주머니', correct: c > 0, pattern: { cause: 'concept', msg: '빨간 구슬 수만 비교하면 안 돼요. 전체 구슬 중 빨간 구슬이 차지하는 부분을 비교해요.' } },
          { text: '나 주머니', correct: c < 0, pattern: { cause: 'concept', msg: '빨간 구슬 수만 비교하면 안 돼요. 전체 구슬 중 빨간 구슬이 차지하는 부분을 비교해요.' } },
          { text: '가능성이 같아요', correct: c === 0, pattern: { cause: 'concept', msg: `가는 ${M(p1)}, 나는 ${M(p2)}예요. 분모를 같게 해서 비교해요.` } },
        ].map((o) => (o.correct ? { text: o.text, correct: true } : o));
        if (r1 === r2 || (r1 > r2) === (c > 0) && c !== 0 && r.chance(0.6)) return null; // 빨간 구슬 수만 보면 틀리는 경우를 많이
        return {
          text: '가와 나 주머니에서 각각 구슬 하나를 꺼낼 때, 빨간 구슬이 나올 가능성이 더 큰 주머니를 고르세요.',
          figure: fig,
          answer: { type: 'choice', options: opts },
          keepOrder: true,
          hints: ['빨간 구슬이 나올 가능성 = (빨간 구슬 수) ÷ (전체 구슬 수)', `가: ⟪${r1}/${r1 + b1}⟫, 나: ⟪${r2}/${r2 + b2}⟫`, `분모를 같게 해서 비교해요: 가 ${M(p1)}, 나 ${M(p2)} → ${c > 0 ? '가' : c < 0 ? '나' : '같아요'}`],
          solution: [`가: ⟪${r1}/${r1 + b1}⟫, 나: ⟪${r2}/${r2 + b2}⟫`, c === 0 ? '두 가능성이 같아요.' : `${c > 0 ? '가' : '나'} 주머니의 가능성이 더 커요.`],
          key: `u6s4-top-compare|0|${r1}|${b1}|${r2}|${b2}`,
          data: { f, r1, b1, r2, b2 },
        };
      }
      if (f === 1) {
        // 가 주머니에 빨간 구슬을 x개 더 넣어 나와 가능성이 같아지게: (r1 + x) / b1 = r2 / b2
        if ((r2 * b1) % b2) return null;
        const x = (r2 * b1) / b2 - r1;
        if (x <= 0) return null;
        return {
          text: `가 주머니에 빨간 구슬을 몇 개 더 넣으면 가와 나 주머니에서 빨간 구슬이 나올 가능성이 같아지나요?`,
          figure: fig,
          answer: { type: 'num', value: String(x), unit: '개' },
          patterns: [{ value: String(r2 - r1), cause: 'concept', msg: '빨간 구슬 수를 같게 하는 것이 아니에요. 파란 구슬과의 비율이 같아야 해요.' }].filter(notAns(x)),
          hints: ['가능성이 같으려면 빨간 구슬과 파란 구슬의 비율이 같아야 해요.', `나 주머니는 파란 구슬 ${b2}개에 빨간 구슬 ${r2}개예요. 가 주머니는 파란 구슬이 ${b1}개예요.`, `가 주머니의 빨간 구슬은 ${(r2 * b1) / b2}개가 되어야 해요 → ${(r2 * b1) / b2} - ${r1} = ${x}(개)`],
          solution: [`가 주머니의 빨간 구슬: ${r2} × ${b1} ÷ ${b2} = ${(r2 * b1) / b2}개가 되어야 해요.`, `더 넣을 구슬: ${x}개`],
          key: `u6s4-top-compare|1|${r1}|${b1}|${r2}|${b2}`,
          data: { f, r1, b1, r2, b2 },
        };
      }
      const all = F.make(r1 + r2, r1 + b1 + r2 + b2);
      return {
        text: '가와 나 주머니의 구슬을 모두 한 주머니에 넣고 구슬 하나를 꺼낼 때, 빨간 구슬이 나올 가능성을 분수로 나타내세요.',
        figure: fig,
        answer: { type: 'frac', value: K(all) },
        patterns: fpats(all, [{ value: F.add(p1, p2), cause: 'concept', msg: '두 가능성을 더하면 안 돼요. 합친 구슬 수로 다시 구해요.' }, { value: F.make(b1 + b2, r1 + b1 + r2 + b2), cause: 'condition', msg: '파란 구슬이 나올 가능성이에요.' }].filter((pt) => F.cmp(pt.value, 1) < 0)),
        hints: ['두 주머니의 구슬을 합치면 빨간 구슬 수와 전체 구슬 수가 모두 바뀌어요.', `빨간 구슬 ${r1 + r2}개, 전체 ${r1 + b1 + r2 + b2}개`, `⟪${r1 + r2}/${r1 + b1 + r2 + b2}⟫ = ${M(all)}`],
        solution: [`빨간 구슬: ${r1} + ${r2} = ${r1 + r2}개, 전체: ${r1 + b1 + r2 + b2}개`, `가능성: ${M(all)}`],
        key: `u6s4-top-compare|2|${r1}|${b1}|${r2}|${b2}`,
        data: { f, r1, b1, r2, b2 },
      };
    },
    verify(p) {
      const { f, r1, b1, r2, b2 } = p.data;
      if (f === 0) {
        const c = F.cmp(F.make(r1, r1 + b1), F.make(r2, r2 + b2));
        return p.answer.options[p.answer.value].text === (c > 0 ? '가 주머니' : c < 0 ? '나 주머니' : '가능성이 같아요');
      }
      if (f === 1) { const x = Number(p.answer.value); return F.eq(F.make(r1 + x, r1 + x + b1), F.make(r2, r2 + b2)); }
      return F.eq(p.answer.value, F.make(r1 + r2, r1 + b1 + r2 + b2));
    },
  });

  // ---------------------------------------------------------------- 이야기 문제
  const tStory = top({
    id: 'u6s3-top-story', sub: 'u6s3', story: true, styleName: '최상위 이야기: 반 대표 뽑기',
    build(r) {
      const k = r.int(5, 7);
      const nm = r.sample(NAMES, k);
      const sc = nm.map(() => r.int(14, 30) * 3);
      const sum = sc.reduce((a, b) => a + b, 0);
      if (sum % k) return null;
      const avg = sum / k;
      const up = nm.filter((_, i) => sc[i] >= avg);
      if (up.length < 2 || up.length === k) return null;
      const who = r.pick(up);
      const ans = F.make(1, up.length);
      const eq = sc.some((s) => s === avg);
      return {
        text: `학급 퀴즈 대회 점수예요. 점수가 평균 이상인 학생 중에서 한 명을 제비뽑기로 뽑아 반 대표로 정하려고 해요. ${j(who, '이/가')} 반 대표로 뽑힐 가능성을 분수로 나타내세요.`,
        figure: { type: 'table', title: '퀴즈 대회 점수', head: ['이름', '점수(점)'], rows: nm.map((n, i) => [n, String(sc[i])]) },
        answer: { type: 'frac', value: K(ans) },
        patterns: fpats(ans, [
          { value: F.make(1, k), cause: 'condition', msg: '평균 이상인 학생 중에서만 뽑아요.' },
          ...(eq ? [{ value: F.make(1, up.length - sc.filter((s) => s === avg).length), cause: 'concept', msg: "'이상'은 평균과 같은 점수도 들어가요." }] : []),
          ...(up.length + 1 <= k ? [{ value: F.make(1, up.length + 1), cause: 'calc', msg: '평균을 다시 구해서 평균 이상인 학생을 세어 봐요.' }] : []),
        ]),
        hints: [`먼저 평균을 구해요: (점수의 합) ÷ ${k}`, `점수의 합 ${sum} ÷ ${k} = ${avg}점 → 평균 이상: ${up.join(', ')}`, `${up.length}명 중 한 명 → ${M(ans)}`],
        solution: [`평균: ${sum} ÷ ${k} = ${avg}(점)`, `평균 이상인 학생: ${up.join(', ')} (${up.length}명)`, `${j(who, '이/가')} 뽑힐 가능성: ${M(ans)}`],
        key: `u6s3-top-story|${sc.join(',')}|${who}`,
        data: { sc, nm, who },
      };
    },
    verify(p) {
      const { sc, nm, who } = p.data;
      const avg = sc.reduce((a, b) => a + b, 0) / sc.length;
      const up = nm.filter((_, i) => sc[i] >= avg);
      return up.includes(who) && F.eq(p.answer.value, F.make(1, up.length));
    },
  });

  M5.addTemplates([tNew, tGroups, tTarget, tWrong, tCards, tAdd, tStory, tSpin, tCompare]);
})();
