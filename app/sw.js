// 휴대폰(웹앱)으로 설치했을 때 인터넷 없이도 열리도록 파일을 저장해 둡니다.
const CACHE = 'memotrain-v2';
const FILES = ['./', './index.html', './style.css', './app.js', './data.js', './buddy.js', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
