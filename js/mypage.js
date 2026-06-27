/* mypage.js - My Page tabs (오프라인 학원·실데이터 전용. 데모/가짜데이터 미사용) */
if (typeof TG === 'undefined') window.TG = { escapeHTML: function(s){if(!s)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}, showToast: function(){}, isLoggedIn: function(){return false;}, getUser: function(){return null;}, apiRequest: function(){return Promise.reject();} };

(function () {
  'use strict';

  var _esc = (typeof escapeHTML === 'function') ? escapeHTML : TG.escapeHTML;

  /* --- Empty/error state helpers (가짜 데이터 대신 명시적 상태 표시) --- */
  function emptyRow(tbody, msg, cols) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="' + cols + '" style="text-align:center;color:var(--color-text-light);padding:var(--space-6);">' + _esc(msg) + '</td></tr>';
  }
  function emptyBlock(el, msg) {
    if (!el) return;
    el.innerHTML = '<div style="text-align:center;color:var(--color-text-light);padding:var(--space-8);">' + _esc(msg) + '</div>';
  }

  /* --- Render helpers --- */
  function renderPayments(tbody, payments) {
    tbody.innerHTML = payments.map(function (p) {
      var statusMap = { confirmed: '확정', pending: '대기', cancelled: '취소' };
      var statusClass = p.status === 'confirmed' ? 'badge--success' : (p.status === 'pending' ? 'badge--warning' : 'badge--error');
      var statusBadge = '<span class="badge ' + statusClass + '">' + _esc(statusMap[p.status] || p.status || '') + '</span>';
      return '<tr>' +
        '<td>' + _esc(p.order_id || '') + '</td>' +
        '<td>' + _esc(p.name || '') + (p.campus ? ' (' + _esc(p.campus) + ')' : '') + '</td>' +
        '<td>' + (p.amount ? p.amount.toLocaleString() + '원' : '-') + '</td>' +
        '<td>' + _esc(p.paid_at || p.created_at || '') + '</td>' +
        '<td>' + statusBadge + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderConsultations(container, list) {
    container.innerHTML = list.map(function (c) {
      var statusBadge = c.status === 'completed'
        ? '<span class="badge badge--success">완료</span>'
        : '<span class="badge badge--primary">접수</span>';
      return '<div class="card" style="padding:var(--space-5);margin-bottom:var(--space-3);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2);">' +
          '<span style="font-size:var(--text-sm);font-weight:600;">' + _esc(c.campus || '') + '</span>' +
          statusBadge +
        '</div>' +
        '<p style="font-size:var(--text-sm);color:var(--color-text-sub);">' + _esc(c.message || '') + '</p>' +
        '<div style="font-size:var(--text-xs);color:var(--color-text-light);margin-top:var(--space-2);">' + _esc(c.created_at || '') + '</div>' +
      '</div>';
    }).join('');
  }

  function fillProfile(user) {
    var emailEl = document.getElementById('profile-email');
    var nameEl = document.getElementById('profile-name');
    var phoneEl = document.getElementById('profile-phone');
    if (emailEl) emailEl.value = user.email || '';
    if (nameEl) nameEl.value = user.name || '';
    if (phoneEl) phoneEl.value = user.phone || '';

    var pName = user.name || '회원';
    var wEl = document.getElementById('welcomeName');
    if (wEl) wEl.textContent = pName + '님, 환영합니다!';
    var aEl = document.getElementById('profileAvatar');
    if (aEl) aEl.textContent = pName.charAt(0);
  }

  /* --- Init: 실데이터만 로드. 로그인 상태에서만 호출(페이지 자체가 로그인 가드) --- */
  function init() {
    var _user = (TG.getUser && TG.getUser()) || {};
    var _userName = _user.name || '회원';

    var welcomeEl = document.getElementById('welcomeName');
    if (welcomeEl) welcomeEl.textContent = _userName + '님, 환영합니다!';

    var avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.textContent = _userName.charAt(0);

    var paymentsEl = document.getElementById('paymentBody');
    var consultEl = document.getElementById('consultList');

    if (TG.isLoggedIn && TG.isLoggedIn()) {
      emptyRow(paymentsEl, '불러오는 중...', 5);
      emptyBlock(consultEl, '불러오는 중...');
      loadPayments(paymentsEl);
      loadConsultations(consultEl);
      loadProfile();
    } else {
      emptyRow(paymentsEl, '로그인 후 이용하실 수 있습니다.', 5);
      emptyBlock(consultEl, '로그인 후 이용하실 수 있습니다.');
    }
  }

  /* --- API load functions (실패/빈 결과 시 명시적 상태) --- */
  async function loadPayments(tbody) {
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/mypage/payments');
      if (!res || !res.ok) throw new Error('API unavailable');
      var data = await res.json();
      var payments = data.data || data.payments || [];
      if (!payments.length) { emptyRow(tbody, '등록 내역이 없습니다.', 5); return; }
      renderPayments(tbody, payments);
    } catch (err) { emptyRow(tbody, '등록 내역을 불러올 수 없습니다.', 5); }
  }

  async function loadConsultations(container) {
    if (!container) return;
    try {
      var res = await TG.apiRequest('/api/mypage/consultations');
      if (!res || !res.ok) throw new Error('API unavailable');
      var data = await res.json();
      var list = data.data || data.consultations || [];
      if (!list.length) { emptyBlock(container, '상담 이력이 없습니다.'); return; }
      renderConsultations(container, list);
    } catch (err) { emptyBlock(container, '상담 이력을 불러올 수 없습니다.'); }
  }

  async function loadProfile() {
    try {
      var res = await TG.apiRequest('/api/auth/profile');
      if (!res || !res.ok) throw new Error('API unavailable');
      var user = await res.json();
      fillProfile(user);
    } catch (err) { /* 로그인 사용자 정보는 토큰 기반 welcome으로 대체 */ }
  }

  /* --- Run init on DOMContentLoaded or immediately if already loaded --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* --- Profile Update --- */
  function setupForms() {
    var profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var name = document.getElementById('profile-name').value.trim();
        var phone = document.getElementById('profile-phone').value.trim();
        if (!name) { TG.showToast('이름을 입력해 주세요.', 'error'); return; }

        var btn = profileForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; var origText = btn.textContent; btn.textContent = '저장 중...'; }
        try {
          var res = await TG.apiRequest('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ name: name, phone: phone })
          });
          if (res && res.ok) {
            var data = await res.json();
            if (data.user && TG.setAuth) TG.setAuth(TG.getToken(), data.user);
            TG.showToast('프로필이 저장되었습니다.');
          } else {
            var err = res ? await res.json().catch(function () { return {}; }) : {};
            TG.showToast(err.message || '저장에 실패했습니다.', 'error');
          }
        } catch (err) {
          TG.showToast('네트워크 오류가 발생했습니다.', 'error');
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = origText; }
        }
      });
    }

    /* --- Password Change --- */
    var passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var current = document.getElementById('pw-current').value;
        var newPw = document.getElementById('pw-new').value;
        var confirm = document.getElementById('pw-confirm').value;

        if (!current || !newPw) { TG.showToast('비밀번호를 입력해 주세요.', 'error'); return; }
        if (newPw.length < 8) { TG.showToast('새 비밀번호는 8자 이상이어야 합니다.', 'error'); return; }
        if (newPw !== confirm) { TG.showToast('새 비밀번호가 일치하지 않습니다.', 'error'); return; }

        var btn = passwordForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; var origText = btn.textContent; btn.textContent = '저장 중...'; }
        try {
          var res = await TG.apiRequest('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ current_password: current, new_password: newPw })
          });
          if (res && res.ok) {
            TG.showToast('비밀번호가 변경되었습니다.');
            passwordForm.reset();
          } else {
            var err = res ? await res.json().catch(function () { return {}; }) : {};
            TG.showToast(err.message || '비밀번호 변경에 실패했습니다.', 'error');
          }
        } catch (err) {
          TG.showToast('네트워크 오류가 발생했습니다.', 'error');
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = origText; }
        }
      });
    }
  }

  /* Setup forms after DOM ready too */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupForms);
  } else {
    setupForms();
  }
})();
