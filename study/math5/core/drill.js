// ⚡ 연산 연습: 5학년 2학기 계산을 빠르고 정확하게
//   종류(CATS)마다 단계 1~3, 한 판에 10문제. 정확도 100%이면서 문제당 평균 시간이 목표(target) 안이면 통과 → 다음 단계가 열린다.
//   gen(r, lv) → { text, type: 'frac' | 'num', value }   (value: 분수는 F.key, 수는 D.str)
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const D = M5.dec, F = M5.frac, T = M5.text, G = M5.grade;
  const j = T.j;
  const M = F.mk, K = F.key;
  const ROUND = 10;

  const proper = (r, dMin, dMax) => { for (;;) { const d = r.int(dMin, dMax), n = r.int(1, d - 1); if (F.gcd(n, d) === 1) return [n, d]; } };
  const fr = (f) => ({ type: 'frac', value: K(f) });
  const ok = (f) => { f = F.parse(f); return f.d <= 100 && f.n / f.d < 500; };
  const ds = (n, s) => D.str(D.make(n, s));
  const nm = (v) => ({ type: 'num', value: D.str(D.parse(v)) });
  const comma = (n) => Number(n).toLocaleString('ko-KR');

  const CATS = [
    {
      id: 'fnat', unit: 2, name: '(분수) × (자연수)', ex: '⟪3/4⟫ × 6', target: [8, 10, 14],
      gen(r, lv) {
        for (;;) {
          const k = r.int(2, 9);
          if (lv === 3) { const [n, d] = proper(r, 2, 9); const f = F.mixed(r.int(1, 4), n, d); return { text: `${M(f)} × ${k}`, ...fr(F.mul(f, k)) }; }
          const [n, d] = proper(r, 2, 12);
          if ((F.gcd(k, d) > 1) !== (lv === 2)) continue;
          return { text: `${M(F.make(n, d))} × ${k}`, ...fr(F.mul(F.make(n, d), k)) };
        }
      },
    },
    {
      id: 'natf', unit: 2, name: '(자연수) × (분수)', ex: '8 × ⟪5/6⟫', target: [8, 10, 14],
      gen(r, lv) {
        for (;;) {
          const k = r.int(2, lv === 1 ? 9 : 24);
          if (lv === 3) { const [n, d] = proper(r, 2, 9); const f = F.mixed(r.int(1, 3), n, d); return { text: `${k} × ${M(f)}`, ...fr(F.mul(k, f)) }; }
          const [n, d] = proper(r, 2, 12);
          if ((F.gcd(k, d) > 1) !== (lv === 2)) continue;
          const res = F.mul(k, F.make(n, d));
          if (!ok(res)) continue;
          return { text: `${k} × ${M(F.make(n, d))}`, ...fr(res) };
        }
      },
    },
    {
      id: 'ff', unit: 2, name: '(진분수) × (진분수)', ex: '⟪2/3⟫ × ⟪9/10⟫', target: [7, 10, 13],
      gen(r, lv) {
        for (;;) {
          if (lv === 1) { const a = r.int(2, 9), b = r.int(2, 9); return { text: `${M(F.make(1, a))} × ${M(F.make(1, b))}`, ...fr(F.make(1, a * b)) }; }
          const [n1, d1] = proper(r, 2, lv === 2 ? 9 : 15), [n2, d2] = proper(r, 2, lv === 2 ? 9 : 15);
          const cross = F.gcd(n1, d2) > 1 || F.gcd(n2, d1) > 1;
          if (cross !== (lv === 3)) continue;
          const res = F.mul(F.make(n1, d1), F.make(n2, d2));
          if (!ok(res)) continue;
          return { text: `${M(F.make(n1, d1))} × ${M(F.make(n2, d2))}`, ...fr(res) };
        }
      },
    },
    {
      id: 'mm', unit: 2, name: '(대분수) × (대분수)', ex: '⟪1 1/2⟫ × ⟪2 2/3⟫', target: [15, 20, 30],
      gen(r, lv) {
        for (;;) {
          const mx = () => { const [n, d] = proper(r, 2, lv === 1 ? 5 : 7); return F.mixed(r.int(1, lv === 1 ? 2 : 3), n, d); };
          const a = mx(), b = mx();
          if (lv === 3) {
            const [n, d] = proper(r, 2, 9); const c = F.make(n, d);
            const res = F.mul(a, b, c);
            if (!ok(res)) continue;
            return { text: `${M(a)} × ${M(b)} × ${M(c)}`, ...fr(res) };
          }
          const res = F.mul(a, b);
          if (!ok(res)) continue;
          return { text: `${M(a)} × ${M(b)}`, ...fr(res) };
        }
      },
    },
    {
      id: 'dnat', unit: 4, name: '(소수) × (자연수)', ex: '2.7 × 4', target: [6, 8, 12],
      gen(r, lv) {
        const a = lv === 1 ? ds(r.int(1, 9), 1) : lv === 2 ? ds(r.int(11, 99), 1) : ds(r.int(101, 999), 2);
        const k = lv === 3 ? r.int(2, 19) : r.int(2, 9);
        return { text: `${a} × ${k}`, ...nm(D.mul(a, String(k))) };
      },
    },
    {
      id: 'natd', unit: 4, name: '(자연수) × (소수)', ex: '15 × 0.6', target: [6, 8, 12],
      gen(r, lv) {
        const k = lv === 1 ? r.int(2, 9) : r.int(11, lv === 2 ? 50 : 99);
        const a = lv === 3 ? ds(r.int(11, 99), r.int(1, 2)) : ds(r.int(1, 9), 1);
        return { text: `${k} × ${a}`, ...nm(D.mul(String(k), a)) };
      },
    },
    {
      id: 'dd', unit: 4, name: '(소수) × (소수)', ex: '1.2 × 0.35', target: [7, 11, 16],
      gen(r, lv) {
        const [a, b] = lv === 1 ? [ds(r.int(1, 9), 1), ds(r.int(1, 9), 1)]
          : lv === 2 ? [ds(r.int(11, 99), 1), ds(r.int(11, 49), 1)]
            : [ds(r.int(101, 999), 2), ds(r.int(11, 99), 1)];
        return { text: `${a} × ${b}`, ...nm(D.mul(a, b)) };
      },
    },
    {
      id: 'shift', unit: 4, name: '곱의 소수점 위치', ex: '3.25 × 100', target: [4, 5, 6],
      gen(r, lv) {
        const a = lv === 1 ? ds(r.int(11, 999), r.int(1, 2)) : lv === 2 ? String(r.int(2, 999)) : ds(r.int(11, 999), r.int(1, 2));
        const m = lv === 1 ? r.pick(['10', '100', '1000']) : lv === 2 ? r.pick(['0.1', '0.01', '0.001']) : r.pick(['10', '100', '1000', '0.1', '0.01']);
        const v = D.mul(a, m);
        return { text: `${a} × ${m}`, ...nm(v) };
      },
    },
    {
      id: 'round', unit: 1, name: '올림 · 버림 · 반올림', ex: '4382 → 백의 자리', target: [6, 7, 8],
      gen(r, lv) {
        const mode = r.pick(['ceil', 'floor', 'round']);
        let x, e;
        if (lv === 1) { x = String(r.int(101, 9999)); e = r.int(1, 2); }
        else if (lv === 2) { x = String(r.int(10001, 99999)); e = r.int(2, 3); }
        else { x = ds(r.int(1001, 99999), r.int(2, 3)); e = r.pick([-1, 0]); }
        const v = D.round(D.parse(x), mode, e);
        if (D.eq(v, x)) return this.gen(r, lv);
        const shown = D.isInt(D.parse(x)) ? comma(x) : x;
        return { text: `${j(shown, '을/를')} ${T.MODE[mode]}하여 ${T.place(e)}까지`, ...nm(v) };
      },
    },
    {
      id: 'avg', unit: 6, name: '평균 구하기', ex: '12, 15, 9의 평균', target: [10, 14, 18],
      gen(r, lv) {
        const n = lv + 2, hi = lv === 1 ? 20 : 99;
        for (;;) {
          const xs = Array.from({ length: n }, () => r.int(lv === 1 ? 1 : 10, hi));
          const s = xs.reduce((a, b) => a + b, 0);
          if (s % n) continue;
          return { text: `${xs.join(', ')}의 평균`, type: 'num', value: String(s / n) };
        }
      },
    },
  ];

  // 아이가 쓴 글자를 채점: { ok } / { form: 'reduce'|'improper' } / { invalid } / { ok: false }
  function judge(prob, str) {
    const s = String(str || '').trim().replace(/\s+/g, ' ').replace(/,/g, '');
    if (!s) return { empty: true };
    if (prob.type === 'frac') {
      let m, inp = null;
      if ((m = /^(\d+)$/.exec(s))) inp = { w: m[1], n: '', d: '' };
      else if ((m = /^(\d+)\/(\d+)$/.exec(s))) inp = { w: '', n: m[1], d: m[2] };
      else if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(s))) inp = { w: m[1], n: m[2], d: m[3] };
      if (!inp) return { invalid: '분수는 3/4, 대분수는 2 3/4처럼 띄어 써요.' };
      return G.grade({ answer: { type: 'frac', value: prob.value }, patterns: [] }, inp);
    }
    const d = D.parse(s);
    if (!d) return { invalid: '수로 써 주세요.' };
    return { ok: D.eq(d, prob.value) };
  }

  function makeRound(cat, lv, rng) {
    const seen = new Set(), out = [];
    for (let i = 0; out.length < ROUND && i < 400; i++) {
      const p = cat.gen(rng, lv);
      if (seen.has(p.text) && i < 300) continue;
      seen.add(p.text);
      out.push(p);
    }
    return out;
  }

  const answerText = (p) => (p.type === 'frac' ? M(p.value) : p.value);

  M5.drill = { CATS, ROUND, judge, makeRound, answerText };
})();
