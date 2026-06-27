/* payment.js - Campus tab switching + phone consultation helpers */
(function () {
  'use strict';

  function formatAmount(n) {
    return Number(n).toLocaleString('ko-KR');
  }
  window.formatAmount = formatAmount;

  /* --- Campus preference auto-select --- */
  function initCampusPref() {
    if (typeof TG === 'undefined' || !TG.getCampus) return;
    var pref = TG.getCampus();
    if (!pref) return;
    var map = { haengsin: 'campus-haengsin', hwajeong: 'campus-hwajeong' };
    var targetId = map[pref];
    if (!targetId) return;

    var campusTabs = document.querySelector('.tabs[aria-label="캠퍼스 선택"]');
    if (campusTabs) {
      campusTabs.querySelectorAll('.tab-btn').forEach(function (b) {
        var isTarget = b.dataset.tab === targetId;
        b.classList.toggle('is-active', isTarget);
        b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      });
    }
    document.querySelectorAll('.tab-panel').forEach(function (p) {
      if (p.id === 'campus-haengsin' || p.id === 'campus-hwajeong') {
        p.classList.toggle('is-active', p.id === targetId);
      }
    });
  }

  /* --- Init --- */
  function init() {
    initCampusPref();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
