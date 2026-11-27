// 앱 파일을 기기에 담아 두어 인터넷이 없어도 열리게 한다.
// 파일을 새로 만들면 아래 FILES 에도 넣어 주세요. (tests/run.js 가 빠진 파일이 없는지 확인해요)
// 기록(별, 도감)은 여기가 아니라 브라우저의 localStorage('history5-v1')에 따로 저장돼요.
const PREFIX = 'history5-';
const CACHE = `${PREFIX}v2`;
const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './install.js',
  './data/eras.js',
  './data/people.js',
  './data/events.js',
  './data/stories.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

// 매번 서버에 새것인지 물어본다. 그래야 고친 내용(새 이야기 등)이 바로 보인다.
const fresh = (req) => fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((u) => new Request(u, { cache: 'no-cache' })))).then(() => self.skipWaiting()));
});

// 같은 주소 아래 다른 앱들의 저장소는 건드리지 않고, 이 앱의 예전 저장소만 지운다
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
    fresh(req)
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
