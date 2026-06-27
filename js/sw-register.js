/* sw-register.js - Service Worker Registration */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    /* Force update check on every page load */
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function (reg) {
        /* Immediately check for updates */
        reg.update();

        reg.addEventListener('updatefound', function () {
          var newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              /* Show update banner instead of auto-reload */
              var banner = document.createElement('div');
              banner.className = 'sw-update-banner';
              banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1B3A5C;color:#fff;padding:12px 20px;display:flex;align-items:center;gap:12px;z-index:9999;font-size:14px;';

              var msg = document.createElement('span');
              msg.textContent = '새 버전이 있습니다.';
              banner.appendChild(msg);

              var updateBtn = document.createElement('button');
              updateBtn.textContent = '업데이트';
              updateBtn.style.cssText = 'background:#E87A3A;color:#fff;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:14px;';
              updateBtn.addEventListener('click', function () { window.location.reload(); });
              banner.appendChild(updateBtn);

              var closeBtn = document.createElement('button');
              closeBtn.textContent = '\u00D7';
              closeBtn.style.cssText = 'background:none;border:none;color:#fff;cursor:pointer;font-size:18px;padding:0 4px;';
              closeBtn.addEventListener('click', function () { banner.remove(); });
              banner.appendChild(closeBtn);

              document.body.appendChild(banner);
            }
          });
        });
      })
      .catch(function (err) {
        /* silent */
      });
  });
})();
