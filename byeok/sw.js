// 앱 파일을 기기에 담아 두어 인터넷이 없어도 열리게 한다.
// 몸 인식 엔진은 옆 폴더 무궁화 게임의 것을 같이 쓴다.
const CACHE = 'byeok-v4';
const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './body.js',
  './poses.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  '../mugunghwa/pose.js',
  '../mugunghwa/vendor/vision_bundle.mjs',
  '../mugunghwa/vendor/wasm/vision_wasm_internal.js',
  '../mugunghwa/vendor/wasm/vision_wasm_internal.wasm',
  '../mugunghwa/vendor/pose_landmarker_lite.task',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('byeok-') && k !== CACHE).map((k) => caches.delete(k))))
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
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))),
  );
});
