// 앱 파일을 기기에 담아 두어 인터넷이 없어도 열리게 한다.
// 3D 엔진·연결 프로그램·주아체 글꼴은 vendor/ 에 있다. 글꼴 조각과 튼튼 운동장의 몸 인식 엔진은 처음 쓸 때 담아 둔다.
const PREFIX = 'yeolsoe-';
const CACHE = `${PREFIX}v8`;
const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './audio.js',
  './world.js',
  './buildings.js',
  './avatar.js',
  './toon.js',
  './puzzles.js',
  './content.js',
  './content/h.js',
  './content/kor.js',
  './content/eng.js',
  './content/math.js',
  './content/soc.js',
  './content/sci.js',
  './content/code.js',
  './content/arts.js',
  './content/fire.js',
  './content/market.js',
  './content/post.js',
  './net.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './vendor/three.module.min.js',
  './vendor/peerjs.min.js',
  './vendor/jua/jua.css',
  '../../pe/common/camera.js',
  '../../pe/common/sound.js',
  '../../pe/mugunghwa/pose.js',
];

// 화면·코드 파일은 매번 서버에 새것인지 물어본다 (바뀌지 않았으면 금방 끝난다).
// 그래야 고친 내용이 머지 뒤 바로 보인다. 큰 몸 인식 엔진 파일(vendor/)만 브라우저에 저장된 것을 그대로 써도 된다.
const fresh = (req) => (/\/vendor\//.test(req.url) ? fetch(req) : fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((u) => (/\/vendor\//.test(u) ? u : new Request(u, { cache: 'no-cache' }))))).then(() => self.skipWaiting()));
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
