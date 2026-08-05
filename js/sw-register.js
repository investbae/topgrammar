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
 * 따라서 남는 경우는 "이미 열어 둔 화면이 옛 자산으로 그려져 있는 순간" 하나뿐이고,
 * 그때 한 번만 조용히 새로고침하면 된다.
 */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  /* 등록 시점에 이미 제어 중인 워커가 있었는지 = 최초 설치인지 재방문인지 구분.
     최초 설치 때는 지금 화면이 곧 최신이므로 새로고침하지 않는다. */
  var hadController = !!navigator.serviceWorker.controller;
  var reloading = false;

  /* 새 워커가 제어권을 넘겨받는 순간 = 자산이 갱신된 순간.
     한 번만 새로고침한다(플래그로 반복 진입 차단). */
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function (reg) {
        reg.update();

        /* 오래 열어 둔 탭 대응 — 다시 화면으로 돌아올 때마다 갱신을 확인한다.
           최소 간격을 둬서 탭 전환이 잦아도 요청이 몰리지 않게 한다. */
        var last = Date.now();
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState !== 'visible') return;
          if (Date.now() - last < 60000) return;
          last = Date.now();
          reg.update();
        });
      })
      .catch(function () { /* 등록 실패해도 사이트는 정상 동작한다 */ });
  });
})();
