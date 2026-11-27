// 학습 앱 모음·주제 목록 화면 도우미
// 예전에 이 주소로 설치한 앱 아이콘(예: 맨 앞 주소로 설치한 "체육시간")으로 열리면, 그 앱의 새 주소로 바로 보내 준다.
// 단, "학습 앱 모음" 바탕화면 아이콘(주소 끝 ?desktop=1)으로 연 창은 전체 메뉴 그대로 둔다.
// 그 창 안에서 다른 화면에 갔다가 돌아와도 그대로 두도록 sessionStorage 에 표시해 둔다.
(() => {
  const DESK = 'kang-desktop-menu';
  let desk = false;
  try {
    if (new URLSearchParams(location.search).has('desktop')) sessionStorage.setItem(DESK, '1');
    desk = sessionStorage.getItem(DESK) === '1';
  } catch (e) { desk = new URLSearchParams(location.search).has('desktop'); }

  const to = document.body.dataset.installedGo;
  const installed = matchMedia('(display-mode: fullscreen), (display-mode: standalone), (display-mode: minimal-ui)').matches || navigator.standalone;
  if (to && installed && !desk) { location.replace(to); return; }

  // 윈도우 컴퓨터: 전체 메뉴 바탕화면 아이콘 만들기 파일 (이미 그 아이콘으로 열었으면 감춤)
  const kit = document.getElementById('win-shortcut');
  if (kit && /Windows/.test(navigator.userAgent) && !desk) kit.hidden = false;
})();
