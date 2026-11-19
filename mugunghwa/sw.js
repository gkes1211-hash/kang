// 이 앱은 새 주소로 옮겼어요. 예전 주소에 남은 오프라인 저장과 서비스 워커를 깨끗이 지운다.
const OLD = ['mugunghwa-v6'];
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await Promise.all(OLD.map((k) => caches.delete(k)));
    await self.registration.unregister();
  })());
});
