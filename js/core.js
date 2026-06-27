/* ===================================
   TopGrammar Core JS
   Header, Nav, escapeHTML, GA4, Scroll Reveal, Auth State
   =================================== */
(function () {
  'use strict';

  // Ensure TG namespace exists even if script partially fails
  if (!window.TG) window.TG = {};

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* --- escapeHTML --- */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  window.escapeHTML = escapeHTML;

  /* --- GA4 --- */
  var GA_ID = document.documentElement.dataset.gaId || '';
  (function loadGA4() {
    if (!GA_ID || GA_ID === 'G-XXXXXXXXXX') return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: true });
  })();

  function trackEvent(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  window.trackEvent = trackEvent;

  /* --- Header Scroll --- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          header.classList.toggle('site-header--scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    if (window.scrollY > 10) header.classList.add('site-header--scrolled');
  }

  /* --- Mobile Nav --- */
  function initMobileNav() {
    var hamburger = document.querySelector('.site-header__hamburger');
    var nav = document.querySelector('.site-nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', function () {
      var isOpen = nav.classList.contains('site-nav--open');
      hamburger.classList.toggle('is-active');
      nav.classList.toggle('site-nav--open');
      hamburger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      document.body.style.overflow = nav.classList.contains('site-nav--open') ? 'hidden' : '';
    });

    hamburger.setAttribute('aria-expanded', 'false');

    nav.addEventListener('click', function (e) {
      if (e.target.closest('.site-nav__link')) {
        hamburger.classList.remove('is-active');
        nav.classList.remove('site-nav--open');
        document.body.style.overflow = '';
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        hamburger.classList.remove('is-active');
        nav.classList.remove('site-nav--open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* --- Active Nav Link --- */
  function initActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav__link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === path || (path === 'index.html' && (href === '/' || href === 'index.html'))) {
        link.classList.add('site-nav__link--active');
      }
    });
  }

  /* --- Scroll Reveal (with stagger support) --- */
  function initScrollReveal() {
    var els = document.querySelectorAll('.slide-up, .img-reveal');
    if (!els.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { observer.observe(el); });

    // Auto-stagger grid children
    document.querySelectorAll('.grid--2, .grid--3, .grid--4').forEach(function (grid) {
      var children = grid.children;
      for (var i = 0; i < children.length; i++) {
        if (!children[i].style.transitionDelay) {
          children[i].style.transitionDelay = (i * 0.08) + 's';
        }
      }
    });
  }

  /* --- Counter Animation --- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]:not([data-counted])');
    if (!counters.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.setAttribute('data-counted', '1');
          var target = parseInt(el.dataset.count, 10);
          var suffix = el.dataset.suffix || '';
          var duration = 1500;
          var startTime = null;
          function animate(ts) {
            if (!startTime) startTime = ts;
            var progress = Math.min((ts - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    counters.forEach(function (el) { observer.observe(el); });
  }

  /* --- Toast --- */
  var TOAST_ICONS = { success: '\u2713', error: '\u2715', warning: '\u26A0', info: '\u2139' };
  function showToast(msg, type) {
    type = type || 'success';
    var container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'status');
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    var icon = TOAST_ICONS[type] || '';
    toast.innerHTML = (icon ? '<span class="toast__icon">' + icon + '</span> ' : '') + escapeHTML(msg);
    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
  }

  /* --- Loading Overlay --- */
  var loadingEl = null;
  function showLoading(msg) {
    if (loadingEl) return;
    loadingEl = document.createElement('div');
    loadingEl.className = 'tg-loading-overlay';
    loadingEl.innerHTML =
      '<div class="tg-loading-overlay__inner">' +
        '<div class="tg-spinner"></div>' +
        (msg ? '<p class="tg-loading-overlay__msg">' + escapeHTML(msg) + '</p>' : '') +
      '</div>';
    document.body.appendChild(loadingEl);
  }
  function hideLoading() {
    if (loadingEl) { loadingEl.remove(); loadingEl = null; }
  }

  /* --- Format Helpers --- */
  function formatNumber(num) {
    if (num == null || isNaN(num)) return '';
    return Number(num).toLocaleString('ko-KR');
  }
  function formatDate(dateStr) {
    if (!dateStr) return '';
    return String(dateStr).slice(0, 10).replace(/-/g, '.');
  }
  window.showToast = showToast;

  /* --- Auth State --- */
  function getToken() { return localStorage.getItem('tg_token'); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem('tg_user')); } catch (e) { return null; }
  }
  function setAuth(token, user) {
    localStorage.setItem('tg_token', token);
    localStorage.setItem('tg_user', JSON.stringify(user));
    updateAuthUI();
  }
  function clearAuth(skipUI) {
    localStorage.removeItem('tg_token');
    localStorage.removeItem('tg_user');
    if (!skipUI) updateAuthUI();
  }
  function isTokenExpired() {
    var token = getToken();
    if (!token) return true;
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch (e) { return true; }
  }
  function isLoggedIn() { return !!getToken() && !isTokenExpired(); }

  function updateAuthUI() {
    if (isTokenExpired() && getToken()) { clearAuth(true); }
    var user = getUser();
    var authLinks = document.querySelectorAll('.auth-link');
    authLinks.forEach(function (el) {
      var show = el.dataset.auth;
      if (show === 'logged-in') el.style.display = user ? '' : 'none';
      else if (show === 'logged-out') el.style.display = user ? 'none' : '';
    });
    var nameEl = document.querySelector('.user-name');
    if (nameEl && user) nameEl.textContent = user.name || '';

    // 역할별 관리 링크
    var nav = document.querySelector('.site-nav');
    if (nav) {
      // 기존 역할 링크 모두 제거
      nav.querySelectorAll('.role-nav-link').forEach(function (el) { el.remove(); });

      if (user) {
        var role = user.role;
        var insertBefore = nav.querySelector('.auth-link');
        var links = [];

        if (role === 'admin') {
          links.push({ href: 'admin.html', text: '관리자' });
        }
        if (role === 'director') {
          links.push({ href: 'director.html', text: '원장 관리' });
        }
        if (role === 'teacher') {
          links.push({ href: 'teacher.html', text: '선생님 관리' });
        }

        links.forEach(function (link) {
          var a = document.createElement('a');
          a.href = link.href;
          a.className = 'site-nav__link role-nav-link';
          a.textContent = link.text;
          nav.insertBefore(a, insertBefore);
        });
      }
    }
  }

  async function apiRequest(url, options) {
    options = options || {};
    var headers = options.headers || {};
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    var token = getToken();
    if (token) {
      if (isTokenExpired()) {
        clearAuth();
        window.location.href = 'login.html';
        return null;
      }
      headers['Authorization'] = 'Bearer ' + token;
    }
    options.headers = headers;
    var res = await fetch(url, options);
    if (res.status === 401) {
      clearAuth();
      window.location.href = 'login.html';
      return null;
    }
    return res;
  }

  /* --- Campus Preference --- */
  var CAMPUS_DATA = {
    haengsin: { name: '행신본원', phone: '031-938-8889', addr: '중앙로 559, 201호 (그랑프리빌딩)' },
    hwajeong: { name: '화정캠퍼스', phone: '031-994-3090', addr: '중앙로 628, 307호 (예일프라자)' }
  };
  function getCampus() { return localStorage.getItem('tg_campus') || ''; }
  function setCampus(c) {
    localStorage.setItem('tg_campus', c);
    document.body.dataset.campus = c;
    document.dispatchEvent(new CustomEvent('campusChanged', { detail: c }));
    renderCampusBanner();
  }

  /* --- Global Campus Banner (모든 페이지 상단) --- */
  function renderCampusBanner() {
    var pref = getCampus();
    var existing = document.getElementById('campus-banner');
    if (!pref) { if (existing) existing.remove(); return; }
    var info = CAMPUS_DATA[pref];
    if (!info) return;
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'campus-banner';
      var header = document.querySelector('.site-header');
      if (header && header.nextSibling) header.parentNode.insertBefore(existing, header.nextSibling);
      else document.body.prepend(existing);
    }
    existing.className = 'campus-banner';
    var otherKey = pref === 'haengsin' ? 'hwajeong' : 'haengsin';
    existing.innerHTML =
      '<div class="campus-banner__inner">' +
        '<span class="campus-banner__label">&#127963; 현재 캠퍼스</span>' +
        '<strong class="campus-banner__name">' + escapeHTML(info.name) + '</strong>' +
        '<span class="campus-banner__phone">' + escapeHTML(info.phone) + '</span>' +
        '<button class="campus-banner__change" data-switch-campus="' + otherKey + '">&#8644; ' + escapeHTML(CAMPUS_DATA[otherKey].name) + '으로 변경</button>' +
      '</div>';
    existing.querySelector('[data-switch-campus]').addEventListener('click', function () {
      TG.setCampus(this.getAttribute('data-switch-campus'));
      location.reload();
    });
  }

  Object.assign(window.TG, {
    escapeHTML: escapeHTML,
    trackEvent: trackEvent,
    showToast: showToast,
    getToken: getToken,
    getUser: getUser,
    setAuth: setAuth,
    clearAuth: clearAuth,
    isLoggedIn: isLoggedIn,
    isTokenExpired: isTokenExpired,
    apiRequest: apiRequest,
    getCampus: getCampus,
    setCampus: setCampus,
    CAMPUS_DATA: CAMPUS_DATA,
    initCounters: initCounters,
    initScrollReveal: initScrollReveal,
    toggleTheme: toggleTheme,
    showLoading: showLoading,
    hideLoading: hideLoading,
    formatNumber: formatNumber,
    formatDate: formatDate,
    updateAuthUI: updateAuthUI
  });

  /* --- Tabs --- */
  function initTabs() {
    document.querySelectorAll('.tabs').forEach(function (tabGroup) {
      var btns = tabGroup.querySelectorAll('.tab-btn');
      var parent = tabGroup.parentElement;

      /* Auto-select campus tab — URL hash (#haengsin/#hwajeong) takes priority over saved preference */
      var map = { haengsin: 'tab-haengsin', hwajeong: 'tab-hwajeong' };
      var hashKey = (window.location.hash || '').replace('#', '');
      var pref = map[hashKey] ? hashKey : getCampus();
      if (pref) {
        var prefTab = map[pref];
        if (prefTab) {
          var prefBtn = tabGroup.querySelector('[data-tab="' + prefTab + '"]');
          if (prefBtn) {
            btns.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
            prefBtn.classList.add('is-active');
            prefBtn.setAttribute('aria-selected', 'true');
            if (parent) {
              parent.querySelectorAll('.tab-panel').forEach(function (p) {
                p.classList.toggle('is-active', p.id === prefTab);
              });
            }
          }
        }
      }

      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
          btn.classList.add('is-active');
          btn.setAttribute('aria-selected', 'true');
          var target = btn.dataset.tab;
          if (parent) {
            parent.querySelectorAll('.tab-panel').forEach(function (p) {
              p.classList.toggle('is-active', p.id === target);
            });
          }
        });
      });

      /* Same-page hash change (e.g., footer link while already on campus page) */
      window.addEventListener('hashchange', function () {
        var key = (window.location.hash || '').replace('#', '');
        var tabId = map[key];
        if (!tabId) return;
        var btn = tabGroup.querySelector('[data-tab="' + tabId + '"]');
        if (btn) btn.click();
      });
    });
  }

  /* --- Logout --- */
  function initLogout() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('.logout-btn')) {
        e.preventDefault();
        clearAuth();
        showToast('로그아웃되었습니다');
        setTimeout(function () { window.location.href = 'index.html'; }, 500);
      }
    });
  }

  /* --- Dark Mode --- */
  function getThemePref() {
    var stored = localStorage.getItem('tg_theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    var btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }

  function toggleTheme() {
    var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem('tg_theme', next);
    applyTheme(next);
  }

  function initThemeToggle() {
    applyTheme(getThemePref());
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', '다크모드 전환');
    btn.textContent = getThemePref() === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    btn.addEventListener('click', toggleTheme);
    document.body.appendChild(btn);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem('tg_theme')) applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  /* --- Init --- */
  document.addEventListener('DOMContentLoaded', function () {
    try { initThemeToggle(); } catch(e) { /* silent */ }
    var savedCampus = getCampus();
    if (savedCampus) document.body.dataset.campus = savedCampus;
    try { initHeader(); } catch(e) { /* silent */ }
    try { initMobileNav(); } catch(e) { /* silent */ }
    try { initActiveNav(); } catch(e) { /* silent */ }
    try { initScrollReveal(); } catch(e) { /* silent */ }
    try { initCounters(); } catch(e) { /* silent */ }
    try { initTabs(); } catch(e) { /* silent */ }
    try { initLogout(); } catch(e) { /* silent */ }
    try { updateAuthUI(); } catch(e) { /* silent */ }
    try { renderCampusBanner(); } catch(e) { /* silent */ }

    // Auto lazy-load iframes
    document.querySelectorAll('iframe:not([loading])').forEach(function (iframe) {
      iframe.setAttribute('loading', 'lazy');
    });

    // Breadcrumb auto-title
    var bcTitle = document.getElementById('breadcrumbTitle');
    if (bcTitle) {
      var h = document.querySelector('main h1, main h2, #videoTitle');
      if (h && h.textContent.trim()) bcTitle.textContent = h.textContent.trim();
    }

    // Safety net: force all slide-up elements visible after 2s
    setTimeout(function() {
      document.querySelectorAll('.slide-up:not(.is-visible), .img-reveal:not(.is-visible)').forEach(function(el) {
        el.classList.add('is-visible');
      });
    }, 2000);
  });

  // Scroll to top button
  (function () {
    var btn = document.createElement('button');
    btn.className = 'scroll-top';
    btn.setAttribute('aria-label', '맨 위로');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', function () {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();
})();
