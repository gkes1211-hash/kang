// 글자 도우미: 조사(이/가, 을/를 …) 붙이기, 수에 쉼표 넣기, 자리·어림 방법 이름
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});

  // 마지막 글자의 받침 정보 { bat: 받침 있음, rieul: 받침이 ㄹ }
  function tail(word) {
    // 분수 표시 ⟪2 3/4⟫는 "2와 4분의 3"처럼 분자로 끝나게 읽는다
    const fm = /(\d+|□|△)\/(?:\d+|□|△)⟫$/.exec(String(word).trim());
    if (fm) return tail(fm[1]);
    const s = String(word).replace(/[\s'"’”)\]}.,!?…]+$/, '');
    const c = s.charAt(s.length - 1);
    const code = c.charCodeAt(0);
    if (c === '°') return { bat: false, rieul: false }; // 40°(사십 도)
    // 점·변·각 이름 ㄱ, ㄴ … (기역, 니은 …)과 ㉠, ㉡ …: 이름이 모두 받침으로 끝나고, ㄹ(리을)만 ㄹ 받침
    const JAMO = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ';
    const ji = JAMO.indexOf(c) >= 0 ? JAMO.indexOf(c) : (code >= 0x3260 && code <= 0x326d ? code - 0x3260 : -1);
    if (ji >= 0) return { bat: true, rieul: ji === 3 };
    if (code >= 0xac00 && code <= 0xd7a3) {
      const jong = (code - 0xac00) % 28;
      return { bat: jong !== 0, rieul: jong === 8 };
    }
    if (/[0-9]/.test(c)) {
      // 0(영·십·백·천·만), 1(일), 3(삼), 6(육), 7(칠), 8(팔)은 받침이 있다. 1·7·8은 ㄹ 받침.
      return { bat: '013678'.includes(c), rieul: '178'.includes(c) };
    }
    const low = s.toLowerCase();
    if (/g$/.test(low)) return { bat: true, rieul: false }; // 그램, 킬로그램
    return { bat: false, rieul: false }; // cm(센티미터), m(미터), □(네모) 등
  }

  const PAIRS = {
    '이/가': ['이', '가'],
    '은/는': ['은', '는'],
    '을/를': ['을', '를'],
    '과/와': ['과', '와'],
    '와/과': ['과', '와'],
    '이에요/예요': ['이에요', '예요'],
    '이라서/라서': ['이라서', '라서'],
    '이라고/라고': ['이라고', '라고'],
    '아/야': ['아', '야'],
  };

  // j('사과', '을/를') → '사과를',  j(25, '이/가') → '25가'
  function j(word, pair) {
    const w = String(word);
    const t = tail(w);
    if (pair === '으로/로') return w + (t.bat && !t.rieul ? '으로' : '로');
    const p = PAIRS[pair];
    if (!p) throw new Error('모르는 조사: ' + pair);
    return w + (t.bat ? p[0] : p[1]);
  }

  // 수를 쉼표 있는 글자로 (12345 → "12,345")
  function num(x) {
    const d = M5.dec.parse(x);
    return d ? M5.dec.fmt(d) : String(x);
  }

  const PLACE = {
    4: '만의 자리', 3: '천의 자리', 2: '백의 자리', 1: '십의 자리', 0: '일의 자리',
    '-1': '소수 첫째 자리', '-2': '소수 둘째 자리', '-3': '소수 셋째 자리',
  };
  function place(e) {
    if (!(e in PLACE)) throw new Error('모르는 자리: ' + e);
    return PLACE[e];
  }

  const MODE = { ceil: '올림', floor: '버림', round: '반올림' };

  // 분수 표시 ⟪w n/d⟫
  const FR = /⟪(?:(\d+) )?(\d+|□|△)\/(\d+|□|△)⟫/g;
  const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 화면용 HTML: 특수 문자를 막고, 줄바꿈과 분수 표시를 바꾼다
  function html(s) {
    return escHtml(s).replace(/\n/g, '<br>').replace(FR, (m, w, n, d) =>
      `<span class="mixed" aria-label="${w ? j(w, '와/과') + ' ' : ''}${d}분의 ${n}">${w ? `<span class="fw">${w}</span>` : ''}<span class="fr"><span class="nu">${n}</span><span class="de">${d}</span></span></span>`);
  }
  // 글자만: ⟪2 3/4⟫ → 2 3/4
  const plain = (s) => String(s).replace(FR, (m, w, n, d) => `${w ? w + ' ' : ''}${n}/${d}`);

  M5.text = { tail, j, num, place, MODE, html, plain };
})();
