/* Service Worker - TopGrammar PWA */
var CACHE_NAME = 'tg-v52-mobile-20260919';
var HOME_BUILD = '20260919-mobile52';

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'TG_GET_BUILD' && event.ports[0]) {
    event.ports[0].postMessage({ build: HOME_BUILD });
  }
});

function documentBuild(client, timeout) {
  return new Promise(function (resolve) {
    var channel = new MessageChannel();
    var timer = setTimeout(function () { finish(null); }, timeout);
    function finish(build) {
      clearTimeout(timer);
      channel.port1.close();
      resolve(build);
    }
    channel.port1.onmessage = function (event) {
      finish(event.data && event.data.build);
    };
    try {
      client.postMessage({ type: 'TG_GET_DOCUMENT_BUILD' }, [channel.port2]);
    } catch (error) { finish(null); }
  });
}

function refreshOldHomepages() {
  return self.clients.matchAll({ type: 'window' }).then(function (clients) {
    return Promise.all(clients.map(function (client) {
      var url = new URL(client.url);
      if (url.origin !== self.location.origin ||
          (url.pathname !== '/' && url.pathname !== '/index.html')) return;
      return documentBuild(client, 1000).then(function (build) {
        if (build === HOME_BUILD) return;
        // A legacy controllerchange handler may already have reloaded this tab.
        return self.clients.get(client.id).then(function (current) {
          if (!current) return;
          return documentBuild(current, 200).then(function (latest) {
            if (latest === HOME_BUILD) return;
            return self.clients.get(current.id).then(function (target) {
              if (!target) return;
              var destination = new URL(target.url);
              if (destination.origin === self.location.origin &&
                  (destination.pathname === '/' || destination.pathname === '/index.html')) {
                // Start navigation, but do not await its response during activate:
                // that response can itself wait for this worker to finish activating.
                target.navigate(target.url).catch(function () {});
              }
            });
          });
        });
      }).catch(function () { /* A closed/navigating tab needs no intervention. */ });
    }));
  });
}

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

/* Only homepage documents are required for a homepage update. A temporary
   failure of a secondary page must not leave returning visitors on old HTML. */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(['/', '/index.html'].map(function (asset) {
        return new Request(asset, { cache: 'reload' });
      })).then(function () {
        return Promise.all(STATIC_ASSETS.filter(function (asset) {
          return asset !== '/' && asset !== '/index.html';
        }).map(function (asset) {
          var controller = new AbortController();
          var timer = setTimeout(function () { controller.abort(); }, 5000);
          return fetch(new Request(asset, { cache: 'reload', signal: controller.signal }))
            .then(function (response) {
              if (response.ok) return cache.put(asset, response);
            }).catch(function () {
              /* Runtime fetch retries missing optional assets when requested. */
            }).then(function () { clearTimeout(timer); });
        }));
      });
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
      .then(refreshOldHomepages)
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
