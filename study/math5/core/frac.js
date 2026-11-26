// 분수 계산 도우미 (기획서 9번: 소수로 바꾸지 않고 분자·분모 정수로 정확하게 계산한다)
// 분수 하나를 { n: 분자, d: 분모 }로 나타낸다. 계산 결과는 항상 기약분수(가분수 포함)로 돌려준다.
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  }
  const lcm = (a, b) => (a / gcd(a, b)) * b;

  function make(n, d = 1) {
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0) throw new Error(`frac: 잘못된 분수 ${n}/${d}`);
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  // 대분수 w n/d
  const mixed = (w, n, d) => make(w * d + n, d);

  // 글자·수·분수를 분수로. "7/3", "2 1/3", "5", { n, d }. 아니면 null
  function parse(v) {
    if (v && typeof v === 'object' && 'n' in v && 'd' in v) return make(v.n, v.d);
    if (typeof v === 'number') return Number.isInteger(v) ? make(v, 1) : null;
    if (v == null) return null;
    const s = String(v).trim();
    let m = /^(\d+)$/.exec(s);
    if (m) return make(+m[1], 1);
    m = /^(\d+)\/(\d+)$/.exec(s);
    if (m) return +m[2] ? make(+m[1], +m[2]) : null;
    m = /^(\d+)\s+(\d+)\/(\d+)$/.exec(s);
    if (m) return +m[3] ? mixed(+m[1], +m[2], +m[3]) : null;
    return null;
  }

  const mul = (...fs) => fs.map(parse).reduce((a, b) => make(a.n * b.n, a.d * b.d), { n: 1, d: 1 });
  const add = (a, b) => { a = parse(a); b = parse(b); return make(a.n * b.d + b.n * a.d, a.d * b.d); };
  const sub = (a, b) => { a = parse(a); b = parse(b); return make(a.n * b.d - b.n * a.d, a.d * b.d); };
  const cmp = (a, b) => { a = parse(a); b = parse(b); return Math.sign(a.n * b.d - b.n * a.d); };
  const eq = (a, b) => cmp(a, b) === 0;
  const isInt = (f) => parse(f).d === 1;
  // 대분수로 나눈 조각 { w, n, d } (n이 0이면 자연수)
  function parts(f) {
    f = parse(f);
    return { w: Math.floor(f.n / f.d), n: f.n % f.d, d: f.d };
  }
  // 비교·저장용 글자 ("7/3", 자연수면 "5")
  const key = (f) => { f = parse(f); return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`; };
  // 사람이 읽는 글자 ("2 1/3")
  const str = (f) => { const p = parts(f); return p.n ? (p.w ? `${p.w} ${p.n}/${p.d}` : `${p.n}/${p.d}`) : String(p.w); };

  // 화면에 위아래로 쌓인 분수로 보이게 하는 표시 (M5.text.html이 바꿔 준다)
  //   mk: 기약분수·대분수로 정리해서   mkRaw: 주어진 그대로 (약분 전, 가분수도)
  const mkRaw = (n, d, w = 0) => `⟪${w ? w + ' ' : ''}${n}/${d}⟫`;
  const mk = (f) => { const p = parts(f); return p.n ? mkRaw(p.n, p.d, p.w) : String(p.w); };

  const toNumber = (f) => { f = parse(f); return f.n / f.d; };

  M5.frac = { gcd, lcm, make, mixed, parse, mul, add, sub, cmp, eq, isInt, parts, key, str, mk, mkRaw, toNumber };
})();
