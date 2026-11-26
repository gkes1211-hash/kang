// 채점 (기획서 8번)
// 답 형식: num(수 하나) · nums(여러 개) · pair(두 칸) · ineq(부등호) · choice(객관식) · multi(여러 개 고르기) · ox
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});
  const D = M5.dec;

  function numEq(a, b) {
    const x = D.parse(a);
    const y = D.parse(b);
    return !!x && !!y && D.eq(x, y);
  }
  // 수 목록을 순서와 상관없이 비교할 수 있게 (0.50과 0.5는 같은 값)
  const numSetKey = (list) => [...new Set(list.map((v) => D.str(D.parse(v))))].sort().join('|');
  const idxSetKey = (list) => [...new Set(list)].sort((a, b) => a - b).join('|');
  const splitList = (s) => String(s).split(/[,，、\s]+/).filter(Boolean);

  // 두 답이 같은 값인지 (오답 패턴 비교, 테스트에 쓴다)
  function sameValue(type, a, b) {
    switch (type) {
      case 'num': return numEq(a, b);
      case 'nums': return numSetKey(a) === numSetKey(b);
      case 'pair': return numEq(a[0], b[0]) && numEq(a[1], b[1]);
      case 'multi': return idxSetKey(a) === idxSetKey(b);
      case 'frac': return M5.frac.eq(a, b);
      case 'choice': case 'ineq': case 'ox': return a === b;
      default: throw new Error('모르는 답 형식: ' + type);
    }
  }

  function answerValue(a) {
    return a.type === 'nums' || a.type === 'pair' || a.type === 'multi' ? a.values : a.value;
  }

  const findPattern = (p, test) => (p.patterns || []).find((pt) => test(pt.value)) || null;

  // 아이가 입력한 답을 채점한다.
  // 결과: { ok } 또는 { empty } 또는 { invalid: 안내 } 또는 { ok:false, pattern, missing, extra, wrong, swapped }
  function grade(p, input) {
    const a = p.answer;
    switch (a.type) {
      case 'num': {
        if (input == null || String(input).trim() === '') return { empty: true };
        const d = D.parse(input);
        if (!d) return { invalid: '숫자만 써 주세요.' };
        if (numEq(d, a.value)) return { ok: true };
        return { ok: false, pattern: findPattern(p, (v) => numEq(v, d)) };
      }
      case 'nums': {
        const parts = splitList(input || '');
        if (!parts.length) return { empty: true };
        const ds = parts.map(D.parse);
        if (ds.some((x) => !x)) return { invalid: '숫자를 쉼표(,)로 나누어 써 주세요.' };
        const got = new Set(ds.map((x) => D.str(x)));
        const want = new Set(a.values.map((v) => D.str(D.parse(v))));
        const missing = [...want].filter((x) => !got.has(x)).length;
        const extra = [...got].filter((x) => !want.has(x)).length;
        if (!missing && !extra) return { ok: true };
        const key = numSetKey([...got]);
        return { ok: false, missing, extra, pattern: findPattern(p, (v) => numSetKey(v) === key) };
      }
      case 'pair': {
        const arr = Array.isArray(input) ? input : [];
        if (arr.length < 2 || arr.some((x) => x == null || String(x).trim() === '')) return { empty: true };
        const ds = arr.map(D.parse);
        if (ds.some((x) => !x)) return { invalid: '두 칸 모두 숫자로 써 주세요.' };
        const wrong = [0, 1].filter((i) => !numEq(ds[i], a.values[i]));
        if (!wrong.length) return { ok: true };
        const swapped = numEq(ds[0], a.values[1]) && numEq(ds[1], a.values[0]);
        return { ok: false, wrong, swapped, pattern: findPattern(p, (v) => numEq(v[0], ds[0]) && numEq(v[1], ds[1])) };
      }
      case 'frac': {
        // 입력: { w: 자연수 칸, n: 분자 칸, d: 분모 칸 }
        const F = M5.frac;
        const inp = input || {};
        const w = String(inp.w || '').trim(), n = String(inp.n || '').trim(), d = String(inp.d || '').trim();
        if (!w && !n && !d) return { empty: true };
        const nat = (s) => /^\d+$/.test(s);
        if ((w && !nat(w)) || (n && !nat(n)) || (d && !nat(d))) return { invalid: '칸마다 자연수만 써 주세요.' };
        if (!n !== !d) return { invalid: '분자와 분모를 모두 써 주세요.' };
        if (d && +d === 0) return { invalid: '분모에는 0을 쓸 수 없어요.' };
        if (n && +n === 0) return { invalid: '분자에 0은 쓰지 않아요. 자연수 답이면 자연수 칸에만 써요.' };
        const val = n ? F.make((+w || 0) * +d + +n, +d) : F.make(+w, 1);
        if (F.eq(val, a.value)) {
          // 값은 맞았는데 표현이 덜 된 경우: 틀림이 아니라 따로 안내한다 (기획서 8번)
          if (n && F.gcd(+n, +d) > 1) return { form: 'reduce' };
          if (n && +n >= +d) return { form: 'improper' };
          return { ok: true };
        }
        return { ok: false, pattern: findPattern(p, (v) => F.eq(v, val)) };
      }
      case 'ineq': {
        if (!['>', '<', '='].includes(input)) return { empty: true };
        if (input === a.value) return { ok: true };
        return { ok: false, pattern: findPattern(p, (v) => v === input) };
      }
      case 'choice': {
        if (input == null || !a.options[input]) return { empty: true };
        if (input === a.value) return { ok: true };
        return { ok: false, pattern: a.options[input].pattern || null };
      }
      case 'multi': {
        const arr = Array.isArray(input) ? input : [];
        if (!arr.length) return { empty: true };
        const got = new Set(arr);
        const want = new Set(a.values);
        const missing = [...want].filter((x) => !got.has(x)).length;
        const extra = [...got].filter((x) => !want.has(x)).length;
        if (!missing && !extra) return { ok: true };
        const key = idxSetKey([...got]);
        return { ok: false, missing, extra, pattern: findPattern(p, (v) => idxSetKey(v) === key) };
      }
      case 'ox': {
        if (input !== true && input !== false) return { empty: true };
        if (input === a.value) return { ok: true };
        return { ok: false, pattern: findPattern(p, (v) => v === input) };
      }
      default:
        throw new Error('모르는 답 형식: ' + a.type);
    }
  }

  // 정답을 화면에 보여 줄 글자
  function answerText(p) {
    const a = p.answer;
    const n = M5.text.num;
    const unit = a.unit ? ' ' + a.unit : '';
    switch (a.type) {
      case 'num': return n(a.value) + unit;
      case 'frac': return M5.frac.mk(a.value) + unit;
      case 'nums': return a.values.map(n).join(', ');
      case 'pair': return a.labels.map((l, i) => `${l}: ${n(a.values[i])}`).join(', ');
      case 'ineq': return a.value;
      case 'choice': return a.options[a.value].text || `${a.value + 1}번`;
      case 'multi': return a.values.map((i) => a.options[i].text).join(', ');
      case 'ox': return a.value ? 'O' : 'X';
      default: return '';
    }
  }

  // 테스트용: 정답을 아이가 입력한 것처럼 만들기
  function inputFor(type, value) {
    if (type === 'nums') return value.join(', ');
    if (type === 'frac') {
      const p = M5.frac.parts(value);
      return p.n ? { w: p.w ? String(p.w) : '', n: String(p.n), d: String(p.d) } : { w: String(p.w), n: '', d: '' };
    }
    return value;
  }

  M5.grade = { grade, sameValue, answerValue, answerText, inputFor, numEq };
})();
