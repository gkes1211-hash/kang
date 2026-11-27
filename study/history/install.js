// 인터넷이 없어도 열리도록 앱 파일을 담아 둬요 (sw.js)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
