/* Service Worker - TopGrammar PWA */
var CACHE_NAME = 'tg-v50-mobile-20260919';

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
  '/css/home-20260919.css?v=3',
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
      return cache.addAll(STATIC_ASSETS.map(function (asset) { return new Request(asset, { cache: 'reload' }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

/* Activate: purge old caches */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k.indexOf('tg-') === 0 && k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
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
  /* Versioned URLs are distinct assets. Never reuse an older ?v= response. */
  e.respondWith(
    caches.open(CACHE_NAME).then(function (cache) { return cache.match(e.request); }).then(function (cached) {
      if (cached) return cached;
      var options = /\.(css|js)$/.test(url.pathname) ? { cache: 'no-cache' } : {};
      return fetch(e.request, options).then(function (res) {
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
