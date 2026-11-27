// 앱 첫 화면에 "← 🎒 학습 앱 모음" 버튼을 넣어, 전체 메뉴로 돌아갈 수 있게 한다.
// 쓰는 법: <script src="../../menu-link.js" data-before="#title" defer></script>
//   data-before : 버튼을 넣을 자리 (이 요소 바로 앞). 없으면 버튼은 안 만들고 아래 규칙만 적용.
// 보이는 때: 보통 브라우저 창, 또는 "학습 앱 모음" 바탕화면 아이콘으로 연 창(hub.js 가 남긴 표시).
// 감추는 때: 그 앱만 따로 설치한 아이콘으로 열었을 때 (그 앱 창에서 메뉴로 나가면 헷갈려서).
(() => {
  const me = document.currentScript;
  if (!me) return;
  const root = new URL('./', me.src).href;
  let desk = false;
  try { desk = sessionStorage.getItem('kang-desktop-menu') === '1'; } catch (e) { /* 표시 없음 */ }
  const solo = matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches || navigator.standalone;
  if (solo && !desk) return;

  // 체육시간 목록의 원래 링크는 앱 창에서 숨겨 두는데, 메뉴 아이콘 창에서는 다시 보이게
  document.querySelectorAll('a.to-hub').forEach((a) => a.style.setProperty('display', 'table', 'important'));

  const at = me.dataset.before && document.querySelector(me.dataset.before);
  if (!at) return;
  const a = document.createElement('a');
  a.href = root;
  a.className = 'kang-menu-link';
  a.textContent = '← 🎒 학습 앱 모음';
  Object.assign(a.style, {
    display: 'table', margin: me.dataset.margin || '0 0 10px', padding: '6px 14px', borderRadius: '999px',
    background: '#fff', border: '2px solid #f0dcc0', color: '#5a3d22', fontWeight: '800', fontSize: '15px',
    lineHeight: '1.4', textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
  });
  at.parentNode.insertBefore(a, at);
})();
