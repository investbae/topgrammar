/* Service Worker - TopGrammar PWA */
var CACHE_NAME = 'tg-v28';

var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/curriculum.html',
  '/leveltest.html',
  '/resources.html',
  '/payment.html',
  '/campus.html',
  '/careers.html',
  '/privacy.html',
  '/terms.html',
  '/404.html',
  '/css/core.css',
  '/css/mobile.css',
  '/css/components.css',
  '/css/premium.css',
  '/js/core.js',
  '/js/leveltest.js',
  '/js/payment.js',
  '/js/resources.js',
  '/js/sw-register.js',
  '/manifest.json',
  '/images/logo-icon.svg'
];
/* 폰트(Pretendard CDN)는 precache에서 제외 — addAll은 원자적이라 CDN 일시 불통 시
   SW 설치 전체가 실패함. 폰트는 아래 fetch 핸들러의 런타임 cache-first로 처리한다. */

/* Install: pre-cache all static assets */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* Activate: purge old caches */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* Fetch: cache-first for static, network-first for API/navigation */
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  /* API calls: network-only, skip cache entirely */
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(function () {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  /* HTML navigation: network-first with cache fallback */
  if (e.request.mode === 'navigate' ||
      (e.request.headers.get('accept') || '').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(function (res) {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(e.request, clone);
          });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (r) {
          return r || caches.match('/404.html');
        });
      })
    );
    return;
  }

  /* Static assets (CSS, JS, fonts, images): cache-first with network fallback */
  /* ignoreSearch: HTML이 css/js를 ?v=N 버전쿼리로 부르므로 쿼리 무시해야 precache 적중 */
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (res) {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(e.request, clone);
          });
        }
        return res;
      });
    })
  );
});
