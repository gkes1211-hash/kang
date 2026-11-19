// 예전 주소 → 새 주소로 옮겨 준다. ?물음표 뒤와 #샵 뒤(아이 기기 연결 정보 등)는 그대로 가져간다.
(() => {
  const s = document.currentScript;
  const to = new URL(s.dataset.to, location.href);
  location.replace(to.href.replace(/[?#].*$/, '') + location.search + location.hash);
})();
