'use strict';
// Keep test visits out of production analytics. Failure never blocks the page.
if (location.protocol === 'https:' && location.hostname === 'topgrammar.co.kr') {
  window.wcs_add = window.wcs_add || {};
  window.wcs_add.wa = '2c0f51c3a609be';
  const analytics = document.createElement('script');
  analytics.src = 'https://wcs.pstatic.net/wcslog.js';
  analytics.async = true;
  analytics.onload = () => { if (typeof window.wcs_do === 'function') window.wcs_do(); };
  document.head.appendChild(analytics);
}
