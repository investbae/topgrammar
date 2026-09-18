/* sw-register.js — Service Worker 등록 및 자동 최신화
 *
 * 2026-08-05: "새 버전이 있습니다 [업데이트]" 배너를 없애고 자동 적용으로 바꿨다.
 * 방문자에게 버튼을 누르라고 요구하지 않는다.
 *
 * 자동화가 안전한 이유(sw.js 전략 실측):
 *   - HTML 은 network-first(`cache:'no-cache'`) → 문서는 언제나 최신을 먼저 받는다.
 *   - CSS·JS 는 배포마다 `?v=` 가 바뀌어 URL 자체가 달라진다 → 캐시 미스 → 새로 받는다.
 *   - sw.js 는 install 에서 skipWaiting(), activate 에서 clients.claim() 을 부른다
 *     → 새 워커가 대기 없이 즉시 제어권을 가져간다.
 * 문서 버전도 확인한다. 워커가 최신이어도 복원된 문서는 이전 버전일 수 있다.
 */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  /* 등록 시점에 이미 제어 중인 워커가 있었는지 = 최초 설치인지 재방문인지 구분.
     최초 설치 때는 지금 화면이 곧 최신이므로 새로고침하지 않는다. */
  var hadController = !!navigator.serviceWorker.controller;
  var reloading = false;
  var buildMeta = document.querySelector('meta[name="tg-home-build"]');
  var documentBuild = buildMeta ? buildMeta.content : null;

  navigator.serviceWorker.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'TG_GET_DOCUMENT_BUILD' && event.ports[0]) {
      event.ports[0].postMessage({ build: documentBuild });
    }
  });

  function checkDocumentBuild() {
    var controller = navigator.serviceWorker.controller;
    if (!documentBuild || !controller || reloading || !navigator.onLine) return;
    var channel = new MessageChannel();
    var timer = setTimeout(function () { channel.port1.close(); }, 1500);
    channel.port1.onmessage = function (event) {
      clearTimeout(timer);
      channel.port1.close();
      var build = event.data && event.data.build;
      if (!build || build === documentBuild || reloading) return;
      // Avoid a reload loop if a network intermediary still returns old HTML.
      try {
        if (sessionStorage.getItem('tg-home-reloaded-build') === build) return;
        sessionStorage.setItem('tg-home-reloaded-build', build);
      } catch (error) { /* Storage can be disabled; the current-document guard remains. */ }
      reloading = true;
      window.location.reload();
    };
    controller.postMessage({ type: 'TG_GET_BUILD' }, [channel.port2]);
  }

  /* 새 워커가 제어권을 넘겨받는 순간 = 자산이 갱신된 순간.
     한 번만 새로고침한다(플래그로 반복 진입 차단). */
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (documentBuild) { checkDocumentBuild(); return; }
    if (!hadController) { hadController = true; return; }
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  /* Do not wait for third-party fonts/images to finish loading on mobile. */
  (function registerWorker() {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(function (reg) {
        function checkUpdate() {
          if (!navigator.onLine) return;
          checkDocumentBuild();
          reg.update().catch(function () {});
        }
        checkUpdate();

        /* Mobile browsers can restore a page without firing load again. */
        window.addEventListener('pageshow', function (event) {
          if (event.persisted) checkUpdate();
        });
        window.addEventListener('online', checkUpdate);
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') checkUpdate();
        });
      })
      .catch(function () { /* 등록 실패해도 사이트는 정상 동작한다 */ });
  })();
})();
