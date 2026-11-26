// 무작위 수 도우미.
// 앱에서는 Math.random을 쓰고, 테스트에서는 같은 씨앗(seed)으로 같은 문제를 다시 만들 수 있게 한다.
(function () {
  'use strict';
  const M5 = (globalThis.M5 = globalThis.M5 || {});

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(rand) {
    const r = {
      next: rand,
      // a 이상 b 이하의 정수
      int(a, b) { return a + Math.floor(rand() * (b - a + 1)); },
      pick(arr) { return arr[Math.floor(rand() * arr.length)]; },
      chance(p) { return rand() < p; },
      shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const k = Math.floor(rand() * (i + 1));
          [a[i], a[k]] = [a[k], a[i]];
        }
        return a;
      },
      sample(arr, k) { return r.shuffle(arr).slice(0, k); },
      // 무게(weights)에 비례해서 하나 고르기
      weighted(items, weights) {
        const total = weights.reduce((s, w) => s + w, 0);
        let x = rand() * total;
        for (let i = 0; i < items.length; i++) {
          x -= weights[i];
          if (x < 0) return items[i];
        }
        return items[items.length - 1];
      },
    };
    return r;
  }

  M5.rand = {
    mulberry32,
    makeRng,
    seeded: (seed) => makeRng(mulberry32(seed)),
    system: () => makeRng(Math.random),
  };
})();
