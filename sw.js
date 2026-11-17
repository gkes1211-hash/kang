// 체육시간 앱: 첫 화면(게임 고르기) 파일을 기기에 담아 두어 인터넷이 없어도 열리게 한다.
// 게임 파일은 한 번 연 것을 담아 둔다. (벽 통과하기·무궁화는 자기 폴더의 sw.js 가 따로 담는다)
// 카메라 영상과는 아무 관련이 없다.
const PREFIX = 'cheyuk-';
const CACHE = `${PREFIX}v3`;
const FILES = [
  './',
  './index.html',
  './home.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './byeok/icons/icon-192.png',
  './balloon/icon.png',
  './mugunghwa/icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// 같은 주소 아래 다른 게임들의 저장소는 건드리지 않고, 내 예전 저장소만 지운다
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 인터넷이 되면 새 파일을, 안 되면 담아 둔 파일을 쓴다.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))),
  );
});
