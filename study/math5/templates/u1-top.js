// 1단원 🏔️ 최상위 문제 (수의 범위와 어림하기)
//   최상위 버튼에서는 '대표 문제 → 변형 3문제'로 풀어요. build(r, lv, v)의 v: 0 = 대표 문제, 1~3 = 변형
//   story: true 는 여러 내용을 이어서 푸는 이야기 문제예요.
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const T = M5.text;
  const j = T.j;
  const form = M5.topForm;
  const top = (o) => Object.assign({ unit: 1, style: 'A', levels: [4, 4], tier: 'top' }, o);
  const won = (v) => `${v.toLocaleString('ko-KR')}원`;
  const ceilTo = (x, u) => Math.ceil(x / u) * u;
  const floorTo = (x, u) => Math.floor(x / u) * u;
  const roundTo = (x, u) => Math.floor((x + u / 2) / u) * u;
  const PL = { 10: '십의 자리', 100: '백의 자리', 1000: '천의 자리' };
  const pos = (pt) => Number(pt.value) > 0;
  const notAns = (ans) => (pt) => pos(pt) && Number(pt.value) !== Number(ans);
  const count = (lo, hi, f) => { let c = 0; for (let x = lo; x <= hi; x++) if (f(x)) c++; return c; };
  const perms4 = (ds) => { const o = []; for (const a of ds) for (const b of ds) for (const c of ds) for (const d of ds) if (new Set([a, b, c, d]).size === 4 && a !== 0) o.push(a * 1000 + b * 100 + c * 10 + d); return o.sort((x, y) => x - y); };

  // ---------------------------------------------------------------- u1s1 이상과 이하
  const tBound = top({
    id: 'u1s1-top-bound', sub: 'u1s1', styleName: '최상위: 개수로 경계 찾기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const k = f === 2 ? r.int(5, 40) : r.int(5, 15);
      let text, ans, lo, hi, test;
      if (f === 0) {
        const N = r.int(20, 90); ans = N - k + 1;
        text = `□ 이상 ${N} 이하인 자연수는 모두 ${k}개예요. □ 안에 알맞은 자연수를 구하세요.`;
        test = (b) => count(b, N, () => true); lo = ans; hi = N;
      } else if (f === 1) {
        const M = r.int(10, 70); ans = M + k - 1;
        text = `${M} 이상 □ 이하인 자연수는 모두 ${k}개예요. □ 안에 알맞은 자연수를 구하세요.`;
        test = (b) => count(M, b, () => true); lo = M; hi = ans;
      } else {
        ans = 100 - k;
        text = `□ 이상인 두 자리 자연수는 모두 ${k}개예요. □ 안에 알맞은 자연수를 구하세요.`;
        test = (b) => count(b, 99, () => true); lo = ans; hi = 99;
      }
      const wrong = f === 1 ? ans + 1 : ans - 1;
      return {
        text,
        answer: { type: 'num', value: String(ans) },
        patterns: [
          { value: String(wrong), cause: 'concept', msg: "'이상', '이하'는 경계의 수도 들어가요. 경계의 수까지 세어서 개수를 맞춰 봐요." },
          { value: String(f === 1 ? ans - 1 : ans + 1), cause: 'calc', msg: '개수가 하나 모자라요. 양 끝 수를 모두 넣어 세어요.' },
        ].filter(notAns(ans)),
        hints: [
          '□에 수를 하나 넣어 보고, 범위에 드는 자연수를 직접 세어 봐요.',
          "'이상', '이하'는 경계의 수가 들어가요. 그래서 (큰 수) - (작은 수) + 1개예요.",
          `${lo}부터 ${hi}까지 세면 ${hi} - ${lo} + 1 = ${k}개 → □ = ${ans}`,
        ],
        solution: [`${lo} 이상 ${hi} 이하인 자연수는 ${hi} - ${lo} + 1 = ${k}(개)`, `그래서 □ = ${ans}`],
        key: `u1s1-top-bound|${f}|${text}`,
        data: { k, f, ans, chk: test(ans) },
      };
    },
    verify(p) { return p.data.chk === p.data.k && Number(p.answer.value) === p.data.ans; },
  });

  const tCommon = top({
    id: 'u1s1-top-common', sub: 'u1s1', styleName: '최상위: 두 범위에 모두 드는 수',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const a = r.int(10, 60), b = a + r.int(6, 20), c = r.int(a + 2, b - 2), d = b + r.int(3, 15);
      const both = (x) => x >= a && x <= b && x >= c && x <= d;
      const either = (x) => (x >= a && x <= b) || (x >= c && x <= d);
      let ask, ans, steps;
      if (f === 0) { ask = '두 범위에 모두 드는 자연수는 몇 개인가요?'; ans = count(a, d, both); steps = `두 범위에 모두 드는 수: ${c} 이상 ${b} 이하 → ${b} - ${c} + 1 = ${ans}(개)`; }
      else if (f === 1) { ask = '두 범위에 모두 드는 자연수 중에서 가장 작은 수와 가장 큰 수의 합을 구하세요.'; ans = c + b; steps = `가장 작은 수 ${c}, 가장 큰 수 ${b} → ${c} + ${b} = ${ans}`; }
      else { ask = '두 범위 중 적어도 한 범위에 드는 자연수는 몇 개인가요?'; ans = count(a, d, either); steps = `두 범위를 합치면 ${a} 이상 ${d} 이하 → ${d} - ${a} + 1 = ${ans}(개)`; }
      const pats = f === 1
        ? [{ value: String(a + d), cause: 'condition', msg: '두 범위에 "모두" 드는 수만 봐야 해요. 겹치는 부분을 먼저 찾아요.' }]
        : f === 0
          ? [{ value: String(b - c), cause: 'concept', msg: "'이상', '이하'는 경계의 수도 들어가요. 개수는 (큰 수) - (작은 수) + 1이에요." }, { value: String(count(a, d, either)), cause: 'condition', msg: '두 범위 중 한쪽에만 드는 수까지 셌어요. 모두 드는 수만 세요.' }]
          : [{ value: String(count(a, d, both)), cause: 'condition', msg: '겹치는 부분만 셌어요. 적어도 한 범위에 드는 수를 모두 세요.' }, { value: String((b - a + 1) + (d - c + 1)), cause: 'concept', msg: '겹치는 부분을 두 번 셌어요.' }];
      return {
        text: `두 수의 범위가 있어요.\n가: ${a} 이상 ${b} 이하인 수\n나: ${c} 이상 ${d} 이하인 수\n${ask}`,
        answer: { type: 'num', value: String(ans), unit: f === 1 ? '' : '개' },
        patterns: pats.filter(notAns(ans)),
        hints: ['두 범위를 수직선에 함께 나타내 보면 겹치는 부분이 잘 보여요.', `겹치는 부분은 ${c} 이상 ${b} 이하예요. 합친 범위는 ${a} 이상 ${d} 이하예요.`, steps],
        solution: [`가와 나가 겹치는 부분: ${c} 이상 ${b} 이하`, steps],
        key: `u1s1-top-common|${f}|${a}|${b}|${c}|${d}`,
        data: { a, b, c, d, f },
      };
    },
    verify(p) {
      const { a, b, c, d, f } = p.data;
      const n = Number(p.answer.value);
      if (f === 0) return n === count(0, 999, (x) => x >= a && x <= b && x >= c && x <= d);
      if (f === 1) { const xs = []; for (let x = 0; x < 999; x++) if (x >= a && x <= b && x >= c && x <= d) xs.push(x); return n === xs[0] + xs[xs.length - 1]; }
      return n === count(0, 999, (x) => (x >= a && x <= b) || (x >= c && x <= d));
    },
  });

  // ---------------------------------------------------------------- u1s2 초과와 미만
  const tBound2 = top({
    id: 'u1s2-top-bound', sub: 'u1s2', styleName: '최상위: 개수로 경계 찾기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      let text, ans, chk, k, sol, pats;
      if (f === 0) {
        const N = r.int(25, 95); k = r.int(5, 15); ans = N - k - 1;
        text = `□ 초과 ${N} 미만인 자연수는 모두 ${k}개예요. □ 안에 알맞은 자연수를 구하세요.`;
        chk = count(ans + 1, N - 1, () => true);
        sol = [`${ans} 초과 ${N} 미만인 자연수는 ${ans + 1}부터 ${N - 1}까지예요.`, `${N - 1} - ${ans + 1} + 1 = ${k}(개) → □ = ${ans}`];
        pats = [{ value: String(ans + 1), cause: 'concept', msg: "'초과', '미만'은 경계의 수가 들어가지 않아요. □도, " + N + '도 세지 않아요.' }, { value: String(N - k), cause: 'concept', msg: "'초과'는 □가 들어가지 않아요. □ 다음 수부터 세요." }];
      } else if (f === 1) {
        const M = r.int(10, 70); k = r.int(5, 15); ans = M + k + 1;
        text = `${M} 초과 □ 미만인 자연수는 모두 ${k}개예요. □ 안에 알맞은 자연수를 구하세요.`;
        chk = count(M + 1, ans - 1, () => true);
        sol = [`${M} 초과 ${ans} 미만인 자연수는 ${M + 1}부터 ${ans - 1}까지예요.`, `${ans - 1} - ${M + 1} + 1 = ${k}(개) → □ = ${ans}`];
        pats = [{ value: String(ans - 1), cause: 'concept', msg: "'미만'은 □가 들어가지 않아요. □ 바로 앞의 수까지 세요." }, { value: String(M + k), cause: 'concept', msg: "'초과', '미만'은 경계의 수가 들어가지 않아요." }];
      } else {
        const m = r.int(3, 9), A = r.int(20, 80), B = A + r.int(20, 60);
        k = count(1, 999, (x) => m * x > A && m * x < B); ans = k;
        const xs = []; for (let x = 1; x < 999; x++) if (m * x > A && m * x < B) xs.push(x);
        if (!xs.length) return null;
        text = `어떤 자연수에 ${m}을(를) 곱한 수는 ${A} 초과 ${B} 미만이에요. 어떤 자연수가 될 수 있는 수는 모두 몇 개인가요?`.replace(`${m}을(를)`, j(String(m), '을/를'));
        chk = ans;
        sol = [`${m} × □가 ${A}보다 크고 ${B}보다 작아야 해요.`, `□ = ${xs.join(', ')} → ${ans}개`];
        pats = [{ value: String(B - A - 1), cause: 'condition', msg: `범위에 드는 자연수를 모두 셌어요. ${m}을(를) 곱해서 범위에 드는 수만 세요.`.replace(`${m}을(를)`, j(String(m), '을/를')) }, { value: String(count(1, 999, (x) => m * x >= A && m * x <= B)), cause: 'concept', msg: "'초과', '미만'은 경계의 수가 들어가지 않아요." }];
      }
      return {
        text,
        answer: { type: 'num', value: String(ans), unit: f === 2 ? '개' : '' },
        patterns: pats.filter(notAns(ans)),
        hints: [
          "'초과', '미만'은 경계의 수가 들어가지 않아요.",
          f === 2 ? '곱한 수가 범위 안에 들어가는지 □에 1, 2, 3, …을 차례로 넣어 확인해요.' : '□에 수를 넣어 보고 범위에 드는 자연수를 직접 세어 봐요.',
          sol[sol.length - 1],
        ],
        solution: sol,
        key: `u1s2-top-bound|${f}|${text}`,
        data: { f, k, chk, ans },
      };
    },
    verify(p) { return p.data.chk === p.data.k && Number(p.answer.value) === p.data.ans; },
  });

  const tDec = top({
    id: 'u1s2-top-dec', sub: 'u1s2', styleName: '최상위: 소수의 범위',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const A = r.int(11, 80), B = A + r.int(8, 25);
      if (A % 10 === 0 && B % 10 === 0) return null;
      const s = (t) => (t % 10 ? (t / 10).toFixed(1) : String(t / 10));
      const W = [['초과', '미만'], ['이상', '미만'], ['초과', '이하']][f];
      const inside = (t, w) => (w[0] === '이상' ? t >= A : t > A) && (w[1] === '이하' ? t <= B : t < B);
      const cnt = (w) => count(A, B, (t) => t % 10 !== 0 && inside(t, w));
      const ans = cnt(W);
      const other = cnt(['이상', '이하']);
      return {
        text: `${s(A)} ${W[0]} ${s(B)} ${W[1]}인 수 중에서 소수 한 자리 수는 모두 몇 개인가요? (소수 한 자리 수는 3.5처럼 소수 첫째 자리 숫자가 0이 아닌 수예요.)`,
        answer: { type: 'num', value: String(ans), unit: '개' },
        patterns: [
          { value: String(other), cause: 'concept', msg: `'${W[0]}', '${W[1]}'에 경계의 수가 들어가는지 다시 봐요.` },
          { value: String(count(A, B, (t) => inside(t, W))), cause: 'condition', msg: '자연수(소수 첫째 자리 숫자가 0인 수)까지 셌어요. 자연수는 빼요.' },
        ].filter(notAns(ans)),
        hints: [
          '0.1씩 커지는 수를 차례로 적어 보면 빠짐없이 셀 수 있어요.',
          `${s(A)}${W[0] === '이상' ? '도 들어가고' : '는 들어가지 않고'}, ${s(B)}${W[1] === '이하' ? '도 들어가요' : '는 들어가지 않아요'}. 자연수는 빼요.`,
          `0.1 간격의 수 중 범위에 드는 수에서 자연수를 빼면 ${ans}개`,
        ],
        solution: (() => {
          const tot = count(A, B, (t) => inside(t, W)), ints = tot - ans;
          return [`${s(A)} ${W[0]} ${s(B)} ${W[1]}인 수 중 0.1 간격의 수: ${tot}개`, `그중 자연수: ${ints}개`, `소수 한 자리 수: ${tot} - ${ints} = ${ans}(개)`];
        })(),
        key: `u1s2-top-dec|${f}|${A}|${B}`,
        data: { A, B, W },
      };
    },
    verify(p) {
      const { A, B, W } = p.data;
      let c = 0;
      for (let t = 0; t < 1000; t++) if (t % 10 !== 0 && (W[0] === '이상' ? t >= A : t > A) && (W[1] === '이하' ? t <= B : t < B)) c++;
      return c === Number(p.answer.value);
    },
  });

  // ---------------------------------------------------------------- u1s3 활용
  function feeTable(r) {
    const cuts = [2, 5, 10, 20];
    let f = r.int(6, 8) * 500;
    const fees = cuts.map(() => { const x = f; f += r.int(2, 4) * 500; return x; });
    const fee = (w) => { for (let i = 0; i < cuts.length; i++) if (w <= cuts[i]) return fees[i]; return null; };
    const feeWrong = (w) => { for (let i = 0; i < cuts.length; i++) if (w < cuts[i]) return fees[i]; return fees[cuts.length - 1]; };
    const rows = cuts.map((c, i) => [i ? `${cuts[i - 1]} kg 초과 ${c} kg 이하` : `${c} kg 이하`, won(fees[i])]);
    return { cuts, fees, fee, feeWrong, fig: { type: 'table', title: '택배 요금표', head: ['무게', '요금'], rows } };
  }
  const tFee = top({
    id: 'u1s3-top-fee', sub: 'u1s3', styleName: '최상위: 택배 요금',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const tb = feeTable(r);
      const kg = (w) => `${w} kg`;
      let text, ans, wrong, steps;
      if (f === 0) {
        const ws = [r.pick([2, 5, 10]), r.int(11, 49) / 10, r.int(52, 199) / 10].map((x) => Math.round(x * 10) / 10);
        const fs = ws.map(tb.fee);
        ans = fs.reduce((a, b) => a + b, 0);
        wrong = ws.map(tb.feeWrong).reduce((a, b) => a + b, 0);
        text = `택배 요금표를 보고, 무게가 ${ws.map(kg).join(', ')}인 상자 3개를 각각 보낼 때 요금은 모두 얼마인지 구하세요.`;
        steps = ws.map((w, i) => `${kg(w)} → ${won(fs[i])}`).join(', ');
      } else if (f === 1) {
        const w = r.int(2, 4), n = r.int(2, 5), box = 1, tot = w * n + box;
        if (tot > 20) return null;
        ans = tb.fee(tot); wrong = tb.fee(w * n) !== ans ? tb.fee(w * n) : tb.feeWrong(tot);
        text = `한 개의 무게가 ${kg(w)}인 물건 ${n}개를 무게가 ${kg(box)}인 상자에 담아 택배로 보내려고 해요. 택배 요금표를 보고 요금은 얼마인지 구하세요.`;
        steps = `전체 무게: ${w} × ${n} + ${box} = ${kg(tot)} → ${won(ans)}`;
      } else {
        const a = r.int(1, 9), b = r.int(1, 10);
        if (a + b > 20) return null;
        const sep = tb.fee(a) + tb.fee(b), one = tb.fee(a + b);
        ans = Math.abs(sep - one);
        if (!ans) return null;
        wrong = Math.abs(tb.feeWrong(a) + tb.feeWrong(b) - tb.feeWrong(a + b));
        text = `무게가 ${kg(a)}, ${kg(b)}인 물건이 있어요. 두 물건을 각각 따로 보낼 때와 한 상자에 함께 담아 보낼 때의 요금의 차는 얼마인지 구하세요. (상자의 무게는 생각하지 않아요.)`;
        steps = `따로: ${won(tb.fee(a))} + ${won(tb.fee(b))} = ${won(sep)}, 함께(${kg(a + b)}): ${won(one)} → 차: ${won(ans)}`;
      }
      return {
        text,
        figure: tb.fig,
        answer: { type: 'num', value: String(ans), unit: '원' },
        patterns: [{ value: String(wrong), cause: 'concept', msg: "'이하'는 경계의 수가 들어가요. 예를 들어 5 kg은 '2 kg 초과 5 kg 이하' 칸이에요." }].filter(notAns(ans)),
        hints: ["무게가 요금표의 어느 칸에 들어가는지 찾아요. 경계의 수는 '이하'인 칸에 들어가요.", f === 1 ? '먼저 상자까지 더한 전체 무게를 구해요.' : f === 2 ? '따로 보낼 때의 요금 합과 함께 보낼 때의 요금을 각각 구해요.' : '상자마다 요금을 찾아서 더해요.', steps],
        solution: [steps, `답: ${won(ans)}`],
        key: `u1s3-top-fee|${f}|${tb.fees.join(',')}|${text}`,
        data: { f, fees: tb.fees, text },
      };
    },
    verify(p) {
      const { f, fees, text } = p.data;
      const fee = (w) => (w <= 2 ? fees[0] : w <= 5 ? fees[1] : w <= 10 ? fees[2] : fees[3]);
      const nums = (text.match(/[\d.]+(?= kg)/g) || []).map(Number);
      let ans;
      if (f === 0) ans = nums.slice(0, 3).map(fee).reduce((a, b) => a + b, 0);
      else if (f === 1) { const n = Number(text.match(/물건 (\d+)개/)[1]); ans = fee(nums[0] * n + nums[1]); }
      else ans = Math.abs(fee(nums[0]) + fee(nums[1]) - fee(nums[0] + nums[1]));
      return ans === Number(p.answer.value);
    },
  });

  const NAMES = ['수아', '은우', '시우', '서윤', '도윤', '예준', '하린', '지호'];
  const tClass = top({
    id: 'u1s3-top-class', sub: 'u1s3', styleName: '최상위: 체급 나누기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const b0 = r.int(28, 34), step = r.int(3, 5);
      const cuts = [b0, b0 + step, b0 + 2 * step, b0 + 3 * step];
      const cls = (w) => { for (let i = 0; i < cuts.length; i++) if (w <= cuts[i]) return i; return cuts.length; };
      const nm = r.sample(NAMES, 6);
      const ws = nm.map(() => r.int(b0 - 3, cuts[3] + 3));
      ws[r.int(0, 5)] = r.pick(cuts);
      const clsName = (i) => (i === 0 ? `${cuts[0]} kg 이하` : i === cuts.length ? `${cuts[cuts.length - 1]} kg 초과` : `${cuts[i - 1]} kg 초과 ${cuts[i]} kg 이하`);
      const rule = cuts.map((_, i) => `${i + 1}체급: ${clsName(i)}`).concat([`${cuts.length + 1}체급: ${clsName(cuts.length)}`]).join('\n');
      let ask, ans, steps, wrong;
      if (f === 0) {
        const t = r.int(0, 5), c = cls(ws[t]);
        ans = ws.filter((w, i) => i !== t && cls(w) === c).length;
        if (!ans) return null;
        const cw = (w) => cuts.findIndex((x) => w < x);
        wrong = ws.filter((w, i) => i !== t && (cw(w) < 0 ? 4 : cw(w)) === (cw(ws[t]) < 0 ? 4 : cw(ws[t]))).length;
        ask = `${j(nm[t], '와/과')} 같은 체급인 친구는 ${nm[t]}를 빼고 몇 명인가요?`.replace(`${nm[t]}를`, j(nm[t], '을/를'));
        steps = `${nm[t]}: ${ws[t]} kg → ${c + 1}체급, 같은 체급: ${nm.filter((_, i) => i !== t && cls(ws[i]) === c).join(', ')}`;
      } else if (f === 1) {
        const cnt = [0, 0, 0, 0, 0]; ws.forEach((w) => cnt[cls(w)]++);
        const mx = Math.max(...cnt);
        if (cnt.filter((c) => c === mx).length !== 1 || mx < 2) return null;
        ans = cnt.indexOf(mx) + 1;
        wrong = ans === 1 ? 2 : ans - 1;
        ask = '가장 많은 친구가 속한 체급은 몇 체급인가요?';
        steps = cnt.map((c, i) => `${i + 1}체급 ${c}명`).join(', ');
      } else {
        const t = ws.findIndex((w) => cls(w) < cuts.length);
        if (t < 0) return null;
        ans = cuts[cls(ws[t])];
        wrong = ans + 1;
        ask = `${j(nm[t], '이/가')} 한 체급 위로 올라가려면 몸무게가 몇 kg보다 무거워야 하나요?`;
        steps = `${nm[t]}: ${ws[t]} kg → ${cls(ws[t]) + 1}체급(${clsName(cls(ws[t]))}). ${ans} kg보다 무거워야 다음 체급이에요.`;
      }
      return {
        text: `태권도 대회의 체급표와 친구들의 몸무게예요.\n${rule}\n${ask}`,
        figure: { type: 'table', title: '친구들의 몸무게', head: ['이름', '몸무게(kg)'], rows: nm.map((n, i) => [n, String(ws[i])]) },
        answer: { type: 'num', value: String(ans), unit: f === 0 ? '명' : f === 1 ? '체급' : 'kg' },
        patterns: [{ value: String(wrong), cause: 'concept', msg: "경계의 몸무게는 '이하'인 체급에 들어가요. 예를 들어 " + cuts[0] + ' kg은 1체급이에요.' }].filter(notAns(ans)),
        hints: ['친구마다 몸무게가 어느 체급에 드는지 먼저 적어요.', "경계의 몸무게는 '이하'가 붙은 체급에 들어가요. '초과'는 경계를 넣지 않아요.", steps],
        solution: [steps, `답: ${ans}`],
        key: `u1s3-top-class|${f}|${cuts.join(',')}|${ws.join(',')}|${ask}`,
        data: { f, cuts, ws, ans },
      };
    },
    verify(p) {
      const { cuts, ws } = p.data;
      return ws.every((w) => w > 0) && cuts.every((c, i) => !i || c > cuts[i - 1]) && Number(p.answer.value) === p.data.ans;
    },
  });

  // ---------------------------------------------------------------- u1s4 올림
  const tCeilRange = top({
    id: 'u1s4-top-range', sub: 'u1s4', styleName: '최상위: 올림하기 전의 수',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const N = r.int(3, 49);
      let text, ans, steps, pats;
      if (f === 0) {
        ans = (N - 1) * 100 + 1;
        text = `어떤 자연수를 올림하여 백의 자리까지 나타내면 ${N * 100}이에요. 어떤 수가 될 수 있는 수 중에서 가장 작은 수를 구하세요.`;
        steps = `올림하여 ${N * 100}이 되는 자연수: ${(N - 1) * 100 + 1}부터 ${N * 100}까지`;
        pats = [{ value: String((N - 1) * 100), cause: 'concept', msg: `${(N - 1) * 100}은 올림해도 그대로 ${(N - 1) * 100}이에요.` }, { value: String(N * 100 - 50), cause: 'concept', msg: '반올림과 헷갈렸어요. 올림은 아래 자리가 0이 아니면 모두 올려요.' }];
      } else if (f === 1) {
        const m = r.int(3, 9);
        ans = count((N - 1) * 100 + 1, N * 100, (x) => x % m === 0);
        text = `올림하여 백의 자리까지 나타내면 ${N * 100}이 되는 자연수 중에서 ${m}의 배수는 모두 몇 개인가요?`;
        steps = `${(N - 1) * 100 + 1}부터 ${N * 100}까지에서 ${m}의 배수를 세면 ${ans}개`;
        pats = [{ value: String(count((N - 1) * 100, N * 100 - 1, (x) => x % m === 0)), cause: 'concept', msg: `범위는 ${(N - 1) * 100 + 1}부터 ${N * 100}까지예요. ${(N - 1) * 100}은 들어가지 않고 ${N * 100}은 들어가요.` }];
        text += ` (${m}의 배수: ${m}, ${2 * m}, ${3 * m}, …)`;
      } else {
        const M = r.int((N - 1) * 10 + 1, N * 10);
        ans = M * 10 - 9;
        text = `어떤 자연수를 올림하여 백의 자리까지 나타내면 ${N * 100}이고, 올림하여 십의 자리까지 나타내면 ${M * 10}이에요. 어떤 수가 될 수 있는 수 중에서 가장 작은 수를 구하세요.`;
        steps = `올림하여 십의 자리까지 ${M * 10}: ${M * 10 - 9} ~ ${M * 10}, 이 수는 모두 올림하여 백의 자리까지 ${N * 100}이 돼요.`;
        pats = [{ value: String((N - 1) * 100 + 1), cause: 'condition', msg: '두 조건을 모두 만족해야 해요. 십의 자리까지 올림한 조건도 확인해요.' }, { value: String(M * 10 - 10), cause: 'concept', msg: `${M * 10 - 10}은 올림해도 그대로 ${M * 10 - 10}이에요.` }];
      }
      return {
        text,
        answer: { type: 'num', value: String(ans), unit: f === 1 ? '개' : '' },
        patterns: pats.filter(notAns(ans)),
        hints: ['올림은 구하려는 자리 아래 수가 0이 아니면 올려요. 아래 자리가 모두 0이면 그대로예요.', `올림하여 백의 자리까지 ${N * 100}이 되는 수는 ${(N - 1) * 100 + 1}부터 ${N * 100}까지예요.`, steps],
        solution: [steps, `답: ${ans}`],
        key: `u1s4-top-range|${f}|${text}`,
        data: { f, N, text },
      };
    },
    verify(p) {
      const { f, N, text } = p.data, a = Number(p.answer.value);
      if (f === 0) return ceilTo(a, 100) === N * 100 && ceilTo(a - 1, 100) !== N * 100;
      if (f === 1) { const m = Number(text.match(/(\d)의 배수는/)[1]); return a === count(1, 9999, (x) => ceilTo(x, 100) === N * 100 && x % m === 0); }
      const M = Number(text.match(/십의 자리까지 나타내면 (\d+)/)[1]);
      return ceilTo(a, 10) === M && ceilTo(a, 100) === N * 100 && ceilTo(a - 1, 10) !== M;
    },
  });

  // 수 카드 4장으로 만든 네 자리 수
  const cardsTpl = (sub, mode, name) => top({
    id: `${sub}-top-cards`, sub, styleName: name,
    build(r, lv, v) {
      const f = form(r, v, 3);
      const ds = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      const all = perms4(ds);
      const MD = T.MODE[mode];
      const rd = (x, u) => (mode === 'ceil' ? ceilTo(x, u) : mode === 'floor' ? floorTo(x, u) : roundTo(x, u));
      let ask, ans, steps, pats;
      if (f === 0 || f === 1) {
        const big = f === 0;
        const x = big ? all[all.length - 1] : all[0];
        const u = big ? 100 : 10;
        ans = rd(x, u);
        if (ans === x) return null;
        ask = `만들 수 있는 가장 ${big ? '큰' : '작은'} 수를 ${MD}하여 ${PL[u]}까지 나타내세요.`;
        steps = `가장 ${big ? '큰' : '작은'} 수: ${x} → ${MD}하여 ${PL[u]}까지: ${ans}`;
        const others = { ceil: ceilTo(x, u), floor: floorTo(x, u), round: roundTo(x, u) };
        pats = Object.entries(others).filter(([k]) => k !== mode).map(([k, val]) => ({ value: String(val), cause: 'concept', msg: `${T.MODE[k]}을 했어요. ${MD}하는 방법을 다시 확인해요.` }))
          .concat([{ value: String(big ? all[0] : all[all.length - 1]), cause: 'condition', msg: `가장 ${big ? '큰' : '작은'} 수를 만들어야 해요.` }]);
        if (!big && ds.includes(0)) pats.push({ value: String(rd(Number(String(Math.min(...ds)) + [...ds].sort((a, b) => a - b).filter((d) => d !== Math.min(...ds)).join('')), u)), cause: 'condition', msg: '0은 맨 앞에 올 수 없어요. 0이 아닌 가장 작은 숫자를 맨 앞에 놓아요.' });
      } else {
        const K = rd(r.pick(all), 1000);
        ans = all.filter((x) => rd(x, 1000) === K).length;
        if (ans < 1) return null;
        ask = `만들 수 있는 수 중에서 ${MD}하여 천의 자리까지 나타내면 ${K}이 되는 수는 모두 몇 개인가요?`;
        steps = `${MD}하여 ${K}이 되는 수: ${all.filter((x) => rd(x, 1000) === K).join(', ')}`;
        pats = [{ value: String(all.filter((x) => Math.floor(x / 1000) * 1000 === K).length), cause: 'concept', msg: `천의 자리 숫자만 보고 셌어요. ${MD}하여 ${K}이 되는 수를 하나씩 확인해요.` }];
      }
      return {
        text: `수 카드 4장을 한 번씩 모두 사용하여 네 자리 수를 만들려고 해요. ${ask}`,
        figure: { type: 'cards', nums: ds },
        answer: { type: 'num', value: String(ans), unit: f === 2 ? '개' : '' },
        patterns: pats.filter(notAns(ans)),
        hints: [
          f === 2 ? '맨 앞 숫자(천의 자리)가 무엇인 수들이 답이 될 수 있는지 먼저 생각해요.' : `가장 ${f === 0 ? '큰' : '작은'} 수는 큰 숫자를 ${f === 0 ? '앞' : '뒤'}에 놓아요. 0은 맨 앞에 올 수 없어요.`,
          mode === 'ceil' ? '올림: 아래 자리가 0이 아니면 올려요.' : mode === 'floor' ? '버림: 아래 자리를 모두 0으로 바꿔요.' : '반올림: 바로 아래 자리 숫자가 5 이상이면 올리고, 4 이하이면 버려요.',
          steps,
        ],
        solution: [steps, `답: ${ans}`],
        key: `${sub}-top-cards|${f}|${ds.join('')}|${ask}`,
        data: { f, ds, ans },
      };
    },
    verify(p) { const all = perms4(p.data.ds); return all.length === 24 - (p.data.ds.includes(0) ? 6 : 0) && Number(p.answer.value) === p.data.ans; },
  });

  // ---------------------------------------------------------------- u1s5 버림
  const tFloorRange = top({
    id: 'u1s5-top-range', sub: 'u1s5', styleName: '최상위: 버림하기 전의 수',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const N = r.int(2, 49);
      let text, ans, steps, pats;
      if (f === 0) {
        ans = N * 100 + 99;
        text = `어떤 자연수를 버림하여 백의 자리까지 나타내면 ${N * 100}이에요. 어떤 수가 될 수 있는 수 중에서 가장 큰 수를 구하세요.`;
        steps = `버림하여 ${N * 100}이 되는 수: ${N * 100}부터 ${N * 100 + 99}까지`;
        pats = [{ value: String(N * 100 + 100), cause: 'concept', msg: `${N * 100 + 100}을 버림하면 ${N * 100 + 100}이에요.` }, { value: String(N * 100 + 49), cause: 'concept', msg: '반올림과 헷갈렸어요. 버림은 아래 자리를 모두 버려요.' }];
      } else if (f === 1) {
        const m = r.int(3, 9);
        ans = count(N * 100, N * 100 + 99, (x) => x % m === 0);
        text = `버림하여 백의 자리까지 나타내면 ${N * 100}이 되는 자연수 중에서 ${m}의 배수는 모두 몇 개인가요? (${m}의 배수: ${m}, ${2 * m}, ${3 * m}, …)`;
        steps = `${N * 100}부터 ${N * 100 + 99}까지에서 ${m}의 배수: ${ans}개`;
        pats = [{ value: String(count(N * 100 + 1, N * 100 + 100, (x) => x % m === 0)), cause: 'concept', msg: `범위는 ${N * 100}부터 ${N * 100 + 99}까지예요. ${N * 100}도 들어가요.` }];
      } else {
        const M = r.int(N * 10, N * 10 + 9);
        ans = M * 10 + 9;
        text = `어떤 자연수를 버림하여 백의 자리까지 나타내면 ${N * 100}이고, 버림하여 십의 자리까지 나타내면 ${M * 10}이에요. 어떤 수가 될 수 있는 수 중에서 가장 큰 수를 구하세요.`;
        steps = `버림하여 십의 자리까지 ${M * 10}: ${M * 10} ~ ${M * 10 + 9} → 가장 큰 수 ${ans}`;
        pats = [{ value: String(N * 100 + 99), cause: 'condition', msg: '두 조건을 모두 만족해야 해요. 십의 자리까지 버림한 조건도 확인해요.' }, { value: String(M * 10 + 10), cause: 'concept', msg: `${M * 10 + 10}을 버림하면 ${M * 10 + 10}이에요.` }];
      }
      return {
        text,
        answer: { type: 'num', value: String(ans), unit: f === 1 ? '개' : '' },
        patterns: pats.filter(notAns(ans)),
        hints: ['버림은 구하려는 자리 아래 수를 모두 0으로 바꿔요.', `버림하여 백의 자리까지 ${N * 100}이 되는 수는 ${N * 100}부터 ${N * 100 + 99}까지예요.`, steps],
        solution: [steps, `답: ${ans}`],
        key: `u1s5-top-range|${f}|${text}`,
        data: { f, N, text },
      };
    },
    verify(p) {
      const { f, N, text } = p.data, a = Number(p.answer.value);
      if (f === 0) return floorTo(a, 100) === N * 100 && floorTo(a + 1, 100) !== N * 100;
      if (f === 1) { const m = Number(text.match(/(\d)의 배수는/)[1]); return a === count(1, 9999, (x) => floorTo(x, 100) === N * 100 && x % m === 0); }
      const M = Number(text.match(/십의 자리까지 나타내면 (\d+)/)[1]);
      return floorTo(a, 10) === M && floorTo(a, 100) === N * 100 && floorTo(a + 1, 10) !== M;
    },
  });

  const tSum = top({
    id: 'u1s5-top-sum', sub: 'u1s5', styleName: '최상위: 올림과 버림의 합',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const u = f === 2 ? 10 : 100;
      const fl = r.int(2, 60);
      const S = fl * u * 2 + u;
      const big = f !== 1;
      const ans = big ? fl * u + u - 1 : fl * u + 1;
      return {
        text: `어떤 자연수를 올림하여 ${PL[u]}까지 나타낸 수와 버림하여 ${PL[u]}까지 나타낸 수의 합은 ${S}이에요. 어떤 수가 될 수 있는 수 중에서 가장 ${big ? '큰' : '작은'} 수를 구하세요.`,
        answer: { type: 'num', value: String(ans) },
        patterns: [
          { value: String(big ? fl * u + u : fl * u), cause: 'concept', msg: `${big ? fl * u + u : fl * u}처럼 아래 자리가 모두 0인 수는 올림해도 버림해도 같아서 합이 ${S}이 될 수 없어요.` },
          { value: String(S / 2), cause: 'concept', msg: '합을 2로 나누기만 했어요. 올림한 수와 버림한 수는 ' + u + '만큼 차이 나요.' },
        ].filter(notAns(ans)),
        hints: [
          `아래 자리가 0이 아니면 올림한 수는 버림한 수보다 ${u} 커요.`,
          `(버림한 수) + (버림한 수 + ${u}) = ${S} → 버림한 수 = ${fl * u}`,
          `어떤 수는 ${fl * u + 1}부터 ${fl * u + u - 1}까지 → 가장 ${big ? '큰' : '작은'} 수 ${ans}`,
        ],
        solution: [`버림한 수를 □라 하면 □ + (□ + ${u}) = ${S}, □ = ${fl * u}`, `올림한 수는 ${fl * u + u}, 어떤 수는 ${fl * u + 1} ~ ${fl * u + u - 1}`, `가장 ${big ? '큰' : '작은'} 수: ${ans}`],
        key: `u1s5-top-sum|${f}|${S}`,
        data: { u, S },
      };
    },
    verify(p) { const { u, S } = p.data, a = Number(p.answer.value); return ceilTo(a, u) + floorTo(a, u) === S; },
  });

  // ---------------------------------------------------------------- u1s6 반올림
  const tRoundRange = top({
    id: 'u1s6-top-range', sub: 'u1s6', styleName: '최상위: 반올림하기 전의 수',
    build(r, lv, v) {
      const f = form(r, v, 3);
      let text, ans, steps, pats, data;
      if (f === 0) {
        const M = r.int(5, 99) * 10;
        ans = (M - 5) + (M + 4);
        text = `어떤 자연수를 반올림하여 십의 자리까지 나타내면 ${M}이에요. 어떤 수가 될 수 있는 수 중에서 가장 작은 수와 가장 큰 수의 합을 구하세요.`;
        steps = `반올림하여 ${M}이 되는 수: ${M - 5}부터 ${M + 4}까지 → ${M - 5} + ${M + 4} = ${ans}`;
        pats = [{ value: String(M - 4 + M + 5), cause: 'concept', msg: '일의 자리 숫자가 5이면 올리고, 4이면 버려요.' }, { value: String(M - 9 + M), cause: 'concept', msg: '올림과 헷갈렸어요. 반올림은 바로 아래 자리 숫자를 봐요.' }];
        data = { f, M };
      } else if (f === 1) {
        const N = r.int(2, 49), odd = r.chance(0.5);
        ans = N * 100 + (odd ? 49 : 48);
        text = `반올림하여 백의 자리까지 나타내면 ${N * 100}이 되는 자연수 중에서 가장 큰 ${odd ? '홀수' : '짝수'}를 구하세요.`;
        steps = `반올림하여 ${N * 100}이 되는 수: ${N * 100 - 50}부터 ${N * 100 + 49}까지 → 가장 큰 ${odd ? '홀수' : '짝수'} ${ans}`;
        pats = [{ value: String(N * 100 + (odd ? 51 : 50)), cause: 'concept', msg: `${N * 100 + 50}부터는 반올림하면 ${N * 100 + 100}이에요.` }, { value: String(N * 100 + (odd ? 99 : 98)), cause: 'concept', msg: '버림과 헷갈렸어요. 반올림은 십의 자리 숫자가 5 이상이면 올려요.' }];
        data = { f, N, odd };
      } else {
        const u = r.pick([10, 100]), M = r.int(3, 60) * u, other = r.pick(['ceil', 'floor']);
        const fn = other === 'ceil' ? ceilTo : floorTo;
        ans = count(M - u, M + u, (x) => roundTo(x, u) === M && fn(x, u) === M);
        text = `어떤 자연수를 반올림하여 ${PL[u]}까지 나타내도 ${M}이고, ${T.MODE[other]}하여 ${PL[u]}까지 나타내도 ${M}이에요. 어떤 수가 될 수 있는 수는 모두 몇 개인가요?`;
        const rr = `${M - u / 2} ~ ${M + u / 2 - 1}`, oo = other === 'ceil' ? `${M - u + 1} ~ ${M}` : `${M} ~ ${M + u - 1}`;
        steps = `반올림: ${rr}, ${T.MODE[other]}: ${oo} → 겹치는 수 ${ans}개`;
        pats = [{ value: String(u), cause: 'condition', msg: `${T.MODE[other]}의 범위만 셌어요. 두 범위에 모두 드는 수를 세요.` }];
        data = { f, u, M, other };
      }
      return {
        text,
        answer: { type: 'num', value: String(ans), unit: f === 2 ? '개' : '' },
        patterns: pats.filter(notAns(ans)),
        hints: ['반올림은 바로 아래 자리 숫자가 0~4이면 버리고, 5~9이면 올려요.', '반올림하여 어떤 수가 되는 범위를 "~ 이상 ~ 이하"로 먼저 써 봐요.', steps],
        solution: [steps, `답: ${ans}`],
        key: `u1s6-top-range|${f}|${text}`,
        data,
      };
    },
    verify(p) {
      const d = p.data, a = Number(p.answer.value);
      if (d.f === 0) { const xs = []; for (let x = 1; x < 2000; x++) if (roundTo(x, 10) === d.M) xs.push(x); return a === xs[0] + xs[xs.length - 1]; }
      if (d.f === 1) return roundTo(a, 100) === d.N * 100 && a % 2 === (d.odd ? 1 : 0) && roundTo(a + 2, 100) !== d.N * 100;
      const fn = d.other === 'ceil' ? ceilTo : floorTo;
      return a === count(1, 9999, (x) => roundTo(x, d.u) === d.M && fn(x, d.u) === d.M);
    },
  });

  // ---------------------------------------------------------------- u1s7 활용
  const tPack = top({
    id: 'u1s7-top-pack', sub: 'u1s7', styleName: '최상위: 상자에 담아 팔기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      const fruit = r.pick(['사과', '귤', '감', '배']);
      const c = r.int(6, 15), N = r.int(80, 400);
      if (N % c === 0) return null;
      const p = r.int(8, 30) * 1000;
      let text, ans, steps, pats;
      if (f === 0) {
        ans = Math.floor(N / c) * p;
        text = `${fruit} ${N}개를 한 상자에 ${c}개씩 담아서 한 상자에 ${won(p)}을 받고 팔려고 해요. ${c}개를 꽉 채운 상자만 팔 수 있을 때, ${fruit}를 팔아서 받을 수 있는 돈은 최대 얼마인가요?`.replace(`${fruit}를`, j(fruit, '을/를'));
        steps = `${N} ÷ ${c} = ${Math.floor(N / c)} … ${N % c} → 버림: ${Math.floor(N / c)}상자 → ${Math.floor(N / c)} × ${p} = ${won(ans)}`;
        pats = [{ value: String(Math.ceil(N / c) * p), cause: 'concept', msg: '꽉 채운 상자만 팔 수 있으니 버림을 해야 해요.' }];
      } else if (f === 1) {
        const q = r.int(3, 9) * 100;
        ans = Math.ceil(N / c) * q;
        text = `${fruit} ${N}개를 한 상자에 ${c}개씩 모두 담으려고 해요. 상자는 한 개에 ${won(q)}이에요. 상자를 사는 데 드는 돈은 적어도 얼마인가요?`;
        steps = `${N} ÷ ${c} = ${Math.floor(N / c)} … ${N % c} → 남은 ${N % c}개도 담아야 하니 올림: ${Math.ceil(N / c)}상자 → ${Math.ceil(N / c)} × ${q} = ${won(ans)}`;
        pats = [{ value: String(Math.floor(N / c) * q), cause: 'concept', msg: '남은 것도 모두 담아야 하니 올림을 해야 해요.' }];
      } else {
        const d = r.int(3, 15), s = r.int(5, 15) * 100, left = N - d;
        if (left % c === 0) return null;
        ans = Math.floor(left / c) * p + (left % c) * s;
        text = `${fruit} ${N}개 중에서 ${d}개는 상해서 버렸어요. 남은 ${fruit}를 한 상자에 ${c}개씩 담아 한 상자에 ${won(p)}에 팔고, 상자에 담지 못한 ${fruit}는 한 개에 ${won(s)}에 팔았어요. 모두 판 돈은 얼마인가요?`.replace(`남은 ${fruit}를`, `남은 ${j(fruit, '을/를')}`);
        steps = `남은 ${fruit}: ${N} - ${d} = ${left}개 → ${left} ÷ ${c} = ${Math.floor(left / c)} … ${left % c} → ${Math.floor(left / c)} × ${p} + ${left % c} × ${s} = ${won(ans)}`;
        pats = [{ value: String(Math.floor(N / c) * p + (N % c) * s), cause: 'condition', msg: '상해서 버린 것을 빼지 않았어요.' }, { value: String(Math.floor(left / c) * p), cause: 'condition', msg: '낱개로 판 돈도 더해야 해요.' }];
      }
      return {
        text,
        answer: { type: 'num', value: String(ans), unit: '원' },
        patterns: pats.filter(notAns(ans)),
        hints: ['남김없이 모두 담아야 하면 올림, 꽉 채운 것만 셀 수 있으면 버림이에요.', '나눗셈의 몫과 나머지를 먼저 구해요.', steps],
        solution: [steps, `답: ${won(ans)}`],
        key: `u1s7-top-pack|${f}|${text}`,
        data: { f, N, c, p, ans },
      };
    },
    verify(p) { return Number(p.answer.value) === p.data.ans && p.data.ans > 0 && p.data.N % p.data.c !== 0; },
  });

  const tMoney = top({
    id: 'u1s7-top-money', sub: 'u1s7', styleName: '최상위: 지폐로 내기',
    build(r, lv, v) {
      const f = form(r, v, 3);
      let text, ans, steps, pats;
      if (f === 0 || f === 2) {
        const items = r.sample([['공책', 1], ['연필', 1], ['지우개', 1], ['색연필', 1], ['자', 1], ['풀', 1]], 3).map(([n]) => [n, r.int(5, 45) * 100 + r.pick([0, 50])]);
        const sum = items.reduce((s, x) => s + x[1], 0);
        if (sum % 1000 === 0) return null;
        const list = items.map(([n, pr]) => `${n} ${won(pr)}`).join(', ');
        if (f === 0) {
          ans = Math.ceil(sum / 1000);
          text = `${list}짜리 물건을 하나씩 샀어요. 1000원짜리 지폐로만 돈을 낸다면 적어도 몇 장을 내야 하나요?`;
          steps = `모두 ${won(sum)} → 1000원짜리로 내려면 올림하여 천의 자리까지: ${ans * 1000}원 → ${ans}장`;
          pats = [{ value: String(Math.floor(sum / 1000)), cause: 'concept', msg: '모자라지 않게 내야 하니 올림을 해야 해요.' }, { value: String(Math.round(sum / 1000)), cause: 'concept', msg: '반올림이 아니라 올림이에요. 모자라면 살 수 없어요.' }];
        } else {
          ans = Math.ceil(sum / 1000) * 1000 - sum;
          text = `${list}짜리 물건을 하나씩 사고 1000원짜리 지폐로만 가장 적게 냈어요. 거스름돈은 얼마인가요?`;
          steps = `모두 ${won(sum)} → 1000원짜리 ${Math.ceil(sum / 1000)}장(${Math.ceil(sum / 1000) * 1000}원)을 내요 → 거스름돈 ${Math.ceil(sum / 1000) * 1000} - ${sum} = ${won(ans)}`;
          pats = [{ value: String(sum - Math.floor(sum / 1000) * 1000), cause: 'concept', msg: '1000원짜리를 모자라지 않게 내야 해요. 올림해서 낸 돈에서 빼요.' }];
        }
      } else {
        const a = r.int(5, 40), b = r.int(3, 30), c = r.int(5, 60);
        const sum = a * 100 + b * 500 + c * 10;
        if (sum % 1000 === 0) return null;
        ans = Math.floor(sum / 1000);
        text = `저금통에 100원짜리 동전 ${a}개, 500원짜리 동전 ${b}개, 10원짜리 동전 ${c}개가 있어요. 이 돈을 1000원짜리 지폐로 바꾸면 최대 몇 장까지 바꿀 수 있나요?`;
        steps = `${a * 100} + ${b * 500} + ${c * 10} = ${won(sum)} → 버림하여 천의 자리까지 ${ans * 1000}원 → ${ans}장`;
        pats = [{ value: String(Math.ceil(sum / 1000)), cause: 'concept', msg: '1000원이 안 되는 돈은 지폐로 바꿀 수 없으니 버림을 해야 해요.' }];
      }
      return {
        text,
        answer: { type: 'num', value: String(ans), unit: f === 2 ? '원' : '장' },
        patterns: pats.filter(notAns(ans)),
        hints: ['먼저 전체 돈이 얼마인지 구해요.', '모자라지 않게 내야 하면 올림, 바꿀 수 있는 만큼만 세면 버림이에요.', steps],
        solution: [steps, `답: ${ans}${f === 2 ? '원' : '장'}`],
        key: `u1s7-top-money|${f}|${text}`,
        data: { f, ans },
      };
    },
    verify(p) { return Number(p.answer.value) === p.data.ans && p.data.ans > 0; },
  });

  // ---------------------------------------------------------------- 이야기 문제
  const tStory = top({
    id: 'u1s7-top-story', sub: 'u1s7', story: true, styleName: '최상위 이야기: 현장 체험 학습',
    build(r, lv, v) {
      const n = r.int(95, 230), t = r.int(4, 9), cap = r.pick([25, 35, 45]);
      const bus = Math.ceil((n + t) / cap);
      if ((n + t) % cap === 0) return null;
      const cost = r.int(25, 45) * 10000;
      const total = bus * cost;
      const per = total / n;
      const perUp = ceilTo(Math.ceil(per), 100);
      if (Number.isInteger(per) && per % 100 === 0) return null;
      const fee = r.int(2, 6) * 500;
      const ans = perUp + fee;
      return {
        text: `5학년 학생 ${n}명과 선생님 ${t}명이 현장 체험 학습을 가요.\n• 버스 한 대에는 ${cap}명까지 탈 수 있고, 모두 버스를 타고 가요.\n• 버스 한 대를 빌리는 돈은 ${won(cost)}이에요.\n• 버스 빌리는 돈은 학생들만 똑같이 나누어 내는데, 한 명이 낼 돈을 올림하여 백의 자리까지 나타낸 만큼씩 걷어요.\n• 학생은 입장료 ${won(fee)}도 따로 내요.\n학생 한 명이 내야 하는 돈은 모두 얼마인가요?`,
        answer: { type: 'num', value: String(ans), unit: '원' },
        patterns: [
          { value: String(ceilTo(Math.ceil((Math.ceil(n / cap) * cost) / n), 100) + fee), cause: 'condition', msg: '선생님도 버스를 타요. 버스 수를 셀 때 선생님까지 더해요.' },
          { value: String(ceilTo(Math.ceil(((n + t) / cap) * cost / n), 100) + fee), cause: 'concept', msg: '버스는 1대, 2대처럼 세어요. 남는 사람도 타야 하니 버스 수는 올림해요.' },
          { value: String(perUp), cause: 'condition', msg: '입장료도 더해야 해요.' },
          { value: String(floorTo(Math.floor(per), 100) + fee), cause: 'concept', msg: '모자라지 않게 걷어야 하니 올림해요.' },
        ].filter(notAns(ans)),
        hints: [
          `버스에 탈 사람은 학생과 선생님을 합쳐 ${n + t}명이에요. 남는 사람도 타야 하니 버스 수는 올림으로 구해요.`,
          `버스 ${bus}대 → 버스 빌리는 돈 ${won(total)} → 학생 한 명: ${total} ÷ ${n}`,
          `한 명이 낼 돈을 올림하여 ${won(perUp)}, 입장료를 더하면 ${perUp} + ${fee} = ${won(ans)}`,
        ],
        solution: [
          `버스에 탈 사람: ${n} + ${t} = ${n + t}명 → ${n + t} ÷ ${cap} = ${Math.floor((n + t) / cap)} … ${(n + t) % cap} → 버스 ${bus}대 (올림)`,
          `버스 빌리는 돈: ${bus} × ${cost} = ${won(total)}`,
          `학생 한 명: ${total} ÷ ${n} → 올림하여 백의 자리까지 ${won(perUp)}`,
          `입장료까지: ${perUp} + ${fee} = ${won(ans)}`,
        ],
        key: `u1s7-top-story|${n}|${t}|${cap}|${cost}|${fee}`,
        data: { n, t, cap, cost, fee },
      };
    },
    verify(p) {
      const { n, t, cap, cost, fee } = p.data;
      let bus = 0; while (bus * cap < n + t) bus++;
      let per = 0; while (per * n < bus * cost) per += 100;
      return Number(p.answer.value) === per + fee;
    },
  });

  M5.addTemplates([
    tBound, tCommon, tBound2, tDec, tFee, tClass, tCeilRange, cardsTpl('u1s4', 'ceil', '최상위: 수 카드와 올림'),
    tFloorRange, tSum, tRoundRange, cardsTpl('u1s6', 'round', '최상위: 수 카드와 반올림'), tPack, tMoney, tStory,
  ]);
})();
