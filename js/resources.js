/* resources.js - 자료실 (회원 등급별 다운로드) */
(function () {
  'use strict';

  /* ── safe wrappers: TG may not be loaded yet ── */
  function safeEscape(str) {
    if (typeof TG !== 'undefined' && TG.escapeHTML) return TG.escapeHTML(str);
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }
  function safeIsLoggedIn() {
    return (typeof TG !== 'undefined' && typeof TG.isLoggedIn === 'function') ? TG.isLoggedIn() : false;
  }
  function safeShowToast(msg, type) {
    if (typeof TG !== 'undefined' && TG.showToast) { TG.showToast(msg, type); return; }
    alert(msg);
  }

  var TIER_LABELS = { free: '무료', basic: '회원', premium: '수강생', vip: '재원생' };
  var TIER_COLORS = { free: '#10B981', basic: '#3B82F6', premium: '#E87A3A', vip: '#8B5CF6' };
  var CATEGORY_LABELS = { grammar: '문법', vocab: '어휘', exam: '시험/기출', worksheet: '워크시트', special: '특별자료' };
  var CATEGORY_ICONS = { grammar: '&#128214;', vocab: '&#128221;', exam: '&#128203;', worksheet: '&#128196;', special: '&#11088;' };

  var currentCategory = '';
  var currentGrade = '';
  var currentSearch = '';
  var userTier = 'free';

  var TIER_ORDER = { free: 0, basic: 1, premium: 2, vip: 3 };

  function init() {
    /* read tier from localStorage tg_user */
    try {
      var u = JSON.parse(localStorage.getItem('tg_user'));
      if (u && (u.tier || u.role)) { userTier = u.tier || u.role; }
    } catch (e) { /* ignore */ }
    renderTierBadge();

    bindFilters();
    bindSearch();

    /* Load resources from API; show loading/error/empty states explicitly */
    showLoadingState();
    loadResourcesAsync();
  }

  /* ── explicit loading/error/empty states (no fake data) ── */
  function setListState(icon, title) {
    var wrap = document.getElementById('resourceList');
    if (!wrap) return;
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state__icon">' + icon + '</div><div class="empty-state__title">' + title + '</div></div>';
  }
  function showLoadingState() { setListState('&#128218;', '자료를 불러오는 중입니다...'); }
  function showErrorState() { setListState('&#9888;&#65039;', '자료를 불러올 수 없습니다.'); }
  function showEmptyState() { setListState('&#128218;', '등록된 자료가 준비 중입니다.'); }

  function bindFilters() {
    document.querySelectorAll('[data-filter-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-filter-cat]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentCategory = btn.dataset.filterCat;
        applyFiltersToCards();
      });
    });
    document.querySelectorAll('[data-filter-grade]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-filter-grade]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentGrade = btn.dataset.filterGrade;
        applyFiltersToCards();
      });
    });
  }

  function bindSearch() {
    var searchInput = document.getElementById('resourceSearch');
    if (!searchInput) return;
    searchInput.addEventListener('input', function () {
      currentSearch = searchInput.value.trim().toLowerCase();
      applyFiltersToCards();
    });
  }

  /* ── Filter already-rendered cards via display:none/block ── */
  function applyFiltersToCards() {
    var wrap = document.getElementById('resourceList');
    if (!wrap) return;
    var cards = wrap.querySelectorAll('.resource-card');
    var visibleCount = 0;

    cards.forEach(function (card) {
      var cat = card.getAttribute('data-category') || '';
      var grade = card.getAttribute('data-grade') || '';
      var title = (card.getAttribute('data-title') || '').toLowerCase();
      var desc = (card.getAttribute('data-desc') || '').toLowerCase();

      var show = true;
      if (currentCategory && cat !== currentCategory) show = false;
      if (currentGrade && grade.indexOf(currentGrade) === -1) show = false;
      if (currentSearch && title.indexOf(currentSearch) === -1 && desc.indexOf(currentSearch) === -1) show = false;

      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    /* manage empty state */
    var emptyEl = wrap.querySelector('.resource-empty-state');
    if (visibleCount === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'empty-state resource-empty-state';
        emptyEl.innerHTML = '<div class="empty-state__icon">&#128218;</div><div class="empty-state__title">해당 조건의 자료가 없습니다</div>';
        wrap.appendChild(emptyEl);
      }
      emptyEl.style.display = '';
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }
  }

  var cachedItems = null;

  /* Fetch resources from API; resolve to error/empty/success state on every path */
  async function loadResourcesAsync() {
    var url = '/api/resources?per_page=50';

    try {
      if (typeof TG === 'undefined' || !TG.apiRequest) { showErrorState(); return; }
      var res = await TG.apiRequest(url);
      if (!res || !res.ok) { showErrorState(); return; }
      var data = await res.json();
      userTier = data.user_tier || 'free';
      renderTierBadge();
      var apiItems = data.data || [];
      if (apiItems.length) {
        cachedItems = apiItems;
        renderFiltered(null);
        applyFiltersToCards();
      } else {
        showEmptyState();
      }
    } catch (e) {
      showErrorState();
    }
  }

  function renderFiltered(wrap) {
    wrap = wrap || document.getElementById('resourceList');
    if (!wrap || !cachedItems) return;

    wrap.innerHTML = cachedItems.map(renderCard).join('');

    /* event delegation for download/lock buttons */
    if (!wrap._resHandler) {
      wrap._resHandler = function (e) {
        var btn = e.target.closest('[data-download-id]');
        if (btn) { download(parseInt(btn.dataset.downloadId, 10), btn); return; }
        btn = e.target.closest('[data-lock-tier]');
        if (btn) { showLocked(btn.dataset.lockTier); }
      };
      wrap.addEventListener('click', wrap._resHandler);
    }
  }

  function renderTierBadge() {
    var el = document.getElementById('userTierBadge');
    if (!el) return;
    var label = TIER_LABELS[userTier] || '비회원';
    var color = TIER_COLORS[userTier] || '#6B7280';
    el.innerHTML = '내 등급: <strong style="color:' + color + ';">' + safeEscape(label) + '</strong>';
  }

  function isNewResource(item) {
    if (item.is_new) return true;
    if (item.created_at) {
      var diff = Date.now() - new Date(item.created_at).getTime();
      return diff < 30 * 24 * 60 * 60 * 1000;
    }
    return false;
  }

  function renderCard(item) {
    /* recalc accessible based on current userTier */
    var userLevel = TIER_ORDER[userTier] || 0;
    var itemLevel = TIER_ORDER[item.tier] || 0;
    item.accessible = userLevel >= itemLevel;
    var icon = CATEGORY_ICONS[item.category] || '&#128196;';
    var catLabel = CATEGORY_LABELS[item.category] || item.category;
    var tierLabel = TIER_LABELS[item.tier] || item.tier;
    var tierColor = TIER_COLORS[item.tier] || '#6B7280';
    var locked = !item.accessible;

    var html = '<div class="card resource-card' + (locked ? ' resource-card--locked' : '') + '"'
      + ' data-category="' + safeEscape(item.category) + '"'
      + ' data-grade="' + safeEscape(item.target_grade || '') + '"'
      + ' data-title="' + safeEscape(item.title) + '"'
      + ' data-desc="' + safeEscape(item.description) + '"'
      + ' style="padding:var(--space-5);margin-bottom:var(--space-4);">';
    html += '<div style="display:flex;align-items:flex-start;gap:var(--space-4);">';
    html += '<div class="resource-card__icon">' + icon + '</div>';
    html += '<div style="flex:1;min-width:0;">';
    html += '<div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-1);">';
    html += '<span class="badge" style="background:' + tierColor + ';color:#fff;font-size:var(--text-xs);">' + safeEscape(tierLabel) + '</span>';
    html += '<span class="badge badge--outline" style="font-size:var(--text-xs);">' + safeEscape(catLabel) + '</span>';
    if (item.target_grade) html += '<span class="badge badge--outline" style="font-size:var(--text-xs);">' + safeEscape(item.target_grade) + '</span>';
    if (isNewResource(item)) html += '<span class="badge" style="background:#EF4444;color:#fff;font-size:var(--text-xs);">&#x1F195; 새 자료</span>';
    html += '</div>';
    html += '<h3 style="font-size:var(--text-base);font-weight:600;margin-bottom:var(--space-1);">' + safeEscape(item.title) + '</h3>';
    html += '<p style="font-size:var(--text-sm);color:var(--color-text-sub);margin-bottom:var(--space-3);">' + safeEscape(item.description) + '</p>';
    html += '<div style="display:flex;align-items:center;gap:var(--space-4);font-size:var(--text-sm);color:var(--color-text-light);">';
    html += '<span>' + safeEscape(item.file_type.toUpperCase()) + ' &middot; ' + safeEscape(item.file_size) + '</span>';
    html += '</div>';
    html += '</div>';
    html += '<div style="flex-shrink:0;">';
    if (locked) {
      var lockMsg = !safeIsLoggedIn() ? '로그인 필요' : '수강생 전용';
      html += '<button class="btn btn--outline btn--sm" data-lock-tier="' + safeEscape(item.tier) + '" style="white-space:nowrap;">&#128274; ' + lockMsg + '</button>';
    } else {
      html += '<button class="btn btn--primary btn--sm" data-download-id="' + item.id + '" style="white-space:nowrap;">&#128229; 다운로드</button>';
    }
    html += '</div></div></div>';
    return html;
  }

  async function download(id, btn) {
    /* 자료 다운로드는 회원 전용 — 비로그인 시 회원가입으로 유도 */
    if (!safeIsLoggedIn()) {
      safeShowToast('자료 다운로드는 회원가입 후 이용하실 수 있습니다.', 'error');
      setTimeout(function () { window.location.href = 'register.html'; }, 1500);
      return;
    }
    if (btn) {
      btn.disabled = true;
      var origText = btn.textContent;
      btn.textContent = '다운로드 중...';
    }
    try {
      if (typeof TG === 'undefined' || !TG.apiRequest) { safeShowToast('다운로드 서비스 준비 중입니다.', 'error'); return; }
      var res = await TG.apiRequest('/api/resources/' + id + '/download', { method: 'POST' });
      if (!res || !res.ok) { safeShowToast('다운로드 실패', 'error'); return; }
      var data = await res.json();
      if (data.url) {
        safeShowToast('다운로드를 시작합니다.', 'success');
        var a = document.createElement('a');
        a.href = data.url;
        a.download = data.title || '';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        loadResourcesAsync();
      } else {
        safeShowToast(data.error || '다운로드 실패', 'error');
      }
    } catch (e) {
      safeShowToast('다운로드에 실패했습니다.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = origText;
      }
    }
  }

  function showLocked(tier) {
    var labels = { basic: '회원 가입', premium: '수강 상담', vip: '오프라인 수강 등록' };
    var msg = (labels[tier] || '상위 등급') + ' 후 이용 가능합니다.';
    var links = { basic: 'login.html', premium: 'payment.html', vip: 'about.html' };
    var href = links[tier] || '';
    if (href && (tier !== 'basic' || !safeIsLoggedIn())) {
      safeShowToast(msg, 'error');
      setTimeout(function () { window.location.href = href; }, 1500);
    } else {
      safeShowToast(msg, 'error');
    }
  }

  window.TGResources = { download: download, showLocked: showLocked };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
