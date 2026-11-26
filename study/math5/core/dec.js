// 소수·자연수 계산 도우미 (기획서 9번: 부동소수점 오차가 없게 정수로 계산한다)
// 수 하나를 { n: 정수, s: 소수 자리 수 }로 나타낸다.  예) 2.35 → { n: 235, s: 2 }
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});
  const P = [];
  for (let i = 0, v = 1; i <= 15; i++, v *= 10) P.push(v);

  function make(n, s = 0) {
    if (!Number.isSafeInteger(n)) throw new Error('dec: 정수가 아니에요: ' + n);
    while (s > 0 && n % 10 === 0) { n /= 10; s--; }
    return { n: n === 0 ? 0 : n, s: n === 0 ? 0 : s };
  }

  // 글자나 수를 받아서 수로 바꾼다. 쉼표와 띄어쓰기는 무시. 숫자가 아니면 null.
  function parse(v) {
    if (v && typeof v === 'object' && 'n' in v && 's' in v) return v;
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return make(v, 0);
      v = String(v);
    }
    if (v == null) return null;
    const str = String(v).replace(/[,\s]/g, '');
    const m = /^(-?)(\d*)(?:\.(\d*))?$/.exec(str);
    if (!m || (m[2] === '' && !m[3])) return null;
    const ip = m[2] || '0';
    const fp = m[3] || '';
    if (ip.length + fp.length > 15) return null;
    let n = parseInt(ip + fp, 10);
    if (m[1]) n = -n;
    return make(n, fp.length);
  }

  function align(a, b) {
    const S = Math.max(a.s, b.s);
    return [a.n * P[S - a.s], b.n * P[S - b.s], S];
  }
  function cmp(a, b) {
    a = parse(a); b = parse(b);
    const [x, y] = align(a, b);
    return x < y ? -1 : x > y ? 1 : 0;
  }
  const eq = (a, b) => cmp(a, b) === 0;
  function add(a, b) { a = parse(a); b = parse(b); const [x, y, S] = align(a, b); return make(x + y, S); }
  function sub(a, b) { a = parse(a); b = parse(b); const [x, y, S] = align(a, b); return make(x - y, S); }
  function mulInt(a, k) { a = parse(a); return make(a.n * k, a.s); }
  // 소수 × 소수: 자연수처럼 곱하고 소수점 아래 자리 수를 더한다
  function mul(a, b) { a = parse(a); b = parse(b); return make(a.n * b.n, a.s + b.s); }
  // 나누어떨어질 때만 (평균): 아니면 null
  function divInt(a, k) {
    a = parse(a);
    for (let s = a.s; s <= a.s + 3; s++) {
      const N = a.n * P[s - a.s];
      if (N % k === 0) return make(N / k, s);
    }
    return null;
  }

  // 10의 e제곱 (e = 2 → 100, e = -1 → 0.1)
  function pow10(e) { return e >= 0 ? make(P[e], 0) : make(1, -e); }

  // 쉼표 없는 글자 (예: "1234.5")
  function str(d) {
    d = parse(d);
    const neg = d.n < 0;
    let a = Math.abs(d.n).toString();
    if (d.s === 0) return (neg ? '-' : '') + a;
    a = a.padStart(d.s + 1, '0');
    return (neg ? '-' : '') + a.slice(0, -d.s) + '.' + a.slice(-d.s);
  }
  // 쉼표 있는 글자 (예: "1,234.5")
  function fmt(d) {
    const s = str(d);
    const [ip, fp] = s.split('.');
    const withComma = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return fp ? withComma + '.' + fp : withComma;
  }

  // 올림·버림·반올림. e는 나타낼 자리 (3 천, 2 백, 1 십, 0 일, -1 소수 첫째, -2 소수 둘째)
  function round(d, mode, e) {
    d = parse(d);
    if (d.n < 0) throw new Error('dec.round: 음수는 다루지 않아요');
    const S = Math.max(d.s, -e, 0);
    const N = d.n * P[S - d.s];
    const u = P[e + S];
    let q = Math.floor(N / u);
    const r = N - q * u;
    if (mode === 'ceil' && r > 0) q++;
    else if (mode === 'round' && r * 2 >= u) q++;
    else if (mode !== 'ceil' && mode !== 'floor' && mode !== 'round') throw new Error('dec.round: 모르는 방법 ' + mode);
    return make(q * u, S);
  }

  // 10의 p제곱 자리 숫자 (p = 2 → 백의 자리 숫자, p = -1 → 소수 첫째 자리 숫자)
  function digitAt(d, p) {
    d = parse(d);
    const S = Math.max(d.s, -p, 0);
    const N = Math.abs(d.n) * P[S - d.s];
    return Math.floor(N / P[p + S]) % 10;
  }

  const isInt = (d) => parse(d).s === 0;
  const toNumber = (d) => { d = parse(d); return d.n / P[d.s]; };

  M5.dec = { make, parse, cmp, eq, add, sub, mulInt, mul, divInt, pow10, str, fmt, round, digitAt, isInt, toNumber };
})();
