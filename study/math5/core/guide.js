// 🧭 같이 풀기: 풀이를 한 단계씩 나누고, 단계마다 계산 결과를 □로 비워서 아이가 직접 채우게 한다.
//   풀이 한 줄을 ' → '로 나눈 조각마다 마지막 '= 값' 또는 '이름: 값'을 □로 바꾼다. 값이 수나 분수가 아니면 읽기만 하는 조각.
//   steps(p) → [{ kind: 'read', text, cont } | { kind: 'ask', before, after, value, type: 'num'|'frac', cont }]
//     cont: 앞 조각과 같은 줄에 이어지는지 (화면에서 → 로 이어 붙인다)
(function () {
  'use strict';
  const M5 = globalThis.M5;
  const D = M5.dec, F = M5.frac, T = M5.text;

  const BLANK = /^(.*[=:]\s*)(⟪(?:\d+ )?\d+\/\d+⟫|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(\s*(?:\([^()]*\))?[^\d⟪⟫=()…]*)$/;

  function chunk(c, cont) {
    const m = BLANK.exec(c);
    if (!m) return { kind: 'read', text: c, cont };
    const raw = m[2];
    if (raw.startsWith('⟪')) {
      const f = F.parse(T.plain(raw));
      if (!f) return { kind: 'read', text: c, cont };
      return { kind: 'ask', before: m[1], after: m[3], value: F.key(f), shown: raw, type: 'frac', cont };
    }
    const d = D.parse(raw.replace(/,/g, ''));
    if (!d) return { kind: 'read', text: c, cont };
    return { kind: 'ask', before: m[1], after: m[3], value: D.str(d), shown: raw, type: 'num', cont };
  }

  function steps(p) {
    const out = [];
    for (const line of p.solution || []) {
      String(line).split(' → ').forEach((c, i) => out.push(chunk(c.trim(), i > 0)));
    }
    return out;
  }

  // 아이가 쓴 답이 맞는지: 분수는 약분하지 않아도, 가분수로 써도 맞게 본다
  function check(step, input) {
    const s = String(input || '').trim().replace(/\s+/g, ' ');
    if (!s) return false;
    if (step.type === 'frac') {
      const f = F.parse(s);
      return !!f && F.eq(f, step.value);
    }
    const d = D.parse(s);
    if (d) return D.eq(d, step.value);
    const f = F.parse(s);
    return !!f && F.isInt(f) && D.eq(String(F.parse(f).n), step.value);
  }

  // 채운 조각 전체를 글로 (다 푼 단계 보여 줄 때)
  const filled = (st) => (st.kind === 'ask' ? st.before + st.shown + st.after : st.text);

  M5.guide = { steps, check, filled };
})();
