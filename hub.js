// 학습 앱 모음·주제 목록 화면 도우미
// 예전에 이 주소로 설치한 앱 아이콘(예: 맨 앞 주소로 설치한 "체육시간")으로 열리면, 그 앱의 새 주소로 바로 보내 준다.
(() => {
  const to = document.body.dataset.installedGo;
  const installed = matchMedia('(display-mode: fullscreen), (display-mode: standalone), (display-mode: minimal-ui)').matches || navigator.standalone;
  if (to && installed) location.replace(to);
})();
