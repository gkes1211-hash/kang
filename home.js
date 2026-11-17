// 체육시간 첫 화면: 홈 화면 설치·오프라인 준비, 설치 안내
const installBtn = document.getElementById('install');
const iosHint = document.getElementById('ios-hint');
const installed = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;

if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// 크롬·엣지·안드로이드: "앱 설치" 버튼
let deferred = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferred) return;
  deferred.prompt();
  try { await deferred.userChoice; } catch { /* 무시 */ }
  deferred = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

// 아이패드·아이폰 사파리는 설치 버튼이 없어서 방법을 글로 알려 준다
const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (ios && !installed) iosHint.hidden = false;
