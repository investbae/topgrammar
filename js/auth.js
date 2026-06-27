/* auth.js - Login & Register (all validation integrated) */
(function () {
  'use strict';

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getOrCreateError(input) {
    var id = input.id + '-error';
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('span');
      el.id = id;
      el.className = 'form-error';
      el.setAttribute('role', 'alert');
      el.setAttribute('aria-live', 'assertive');
      el.style.cssText = 'display:block;font-size:var(--text-xs);color:#e53e3e;margin-top:4px;';
      input.parentNode.appendChild(el);
    }
    return el;
  }

  function toast(msg, type) {
    if (typeof TG !== 'undefined' && TG.showToast) TG.showToast(msg, type);
    else alert(msg);
  }

  /* =============================================
     LOGIN
     ============================================= */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    var lEmail = document.getElementById('login-email');
    var lPw = document.getElementById('login-password');

    function validateLoginEmail() {
      var err = getOrCreateError(lEmail);
      var v = lEmail.value.trim();
      if (!v) { err.textContent = ''; return true; }
      if (!emailRegex.test(v)) { err.textContent = '올바른 이메일 형식을 입력해 주세요.'; return false; }
      err.textContent = ''; return true;
    }
    function validateLoginPassword() {
      var err = getOrCreateError(lPw);
      var v = lPw.value;
      if (!v) { err.textContent = ''; return true; }
      if (v.length < 8) { err.textContent = '비밀번호는 8자 이상이어야 합니다.'; return false; }
      err.textContent = ''; return true;
    }

    lEmail.addEventListener('blur', validateLoginEmail);
    lEmail.addEventListener('input', function () {
      if (document.getElementById(lEmail.id + '-error').textContent) validateLoginEmail();
    });
    lPw.addEventListener('blur', validateLoginPassword);
    lPw.addEventListener('input', function () {
      if (document.getElementById(lPw.id + '-error').textContent) validateLoginPassword();
    });

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = lEmail.value.trim();
      var password = lPw.value;
      var ok = true;
      if (!email) { getOrCreateError(lEmail).textContent = '이메일을 입력해 주세요.'; ok = false; }
      else if (!validateLoginEmail()) ok = false;
      if (!password) { getOrCreateError(lPw).textContent = '비밀번호를 입력해 주세요.'; ok = false; }
      else if (!validateLoginPassword()) ok = false;
      if (!ok) return;

      var btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = '로그인 중...';
      try {
        var res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
        var data;
        try { data = await res.json(); } catch (_) { toast('서버 응답을 처리할 수 없습니다.', 'error'); return; }
        if (res.ok && data.token) {
          TG.setAuth(data.token, data.user);
          toast('로그인되었습니다.');
          var redirect = new URLSearchParams(window.location.search).get('redirect');
          if (redirect && !/^[\w-]+\.html$/.test(redirect)) redirect = null;
          setTimeout(function () { window.location.href = redirect || 'index.html'; }, 500);
        } else {
          toast(data.error || data.message || '로그인에 실패했습니다.', 'error');
        }
      } catch (err) {
        toast('네트워크 오류가 발생했습니다.', 'error');
      } finally {
        btn.disabled = false; btn.textContent = '로그인';
      }
    });
  }

  /* =============================================
     REGISTER
     ============================================= */
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    var rName = document.getElementById('reg-name');
    var rEmail = document.getElementById('reg-email');
    var rPw = document.getElementById('reg-password');
    var rPwConfirm = document.getElementById('reg-password-confirm');
    var rPhone = document.getElementById('reg-phone');
    var rRole = document.getElementById('reg-role');
    var rStaffCode = document.getElementById('reg-staff-code');
    var rCampus = document.getElementById('reg-campus');
    var rTerms = document.getElementById('agreeTerms');
    var rPrivacy = document.getElementById('agreePrivacy');
    var rAge = document.getElementById('agreeAge');
    var phoneRegex = /^010-\d{4}-\d{4}$/;

    function vName() {
      var err = getOrCreateError(rName); var v = rName.value.trim();
      if (!v) { err.textContent = ''; return true; }
      if (v.length < 2) { err.textContent = '이름은 2자 이상 입력해 주세요.'; return false; }
      err.textContent = ''; return true;
    }
    function vEmail() {
      var err = getOrCreateError(rEmail); var v = rEmail.value.trim();
      if (!v) { err.textContent = ''; return true; }
      if (!emailRegex.test(v)) { err.textContent = '올바른 이메일 형식을 입력해 주세요.'; return false; }
      err.textContent = ''; return true;
    }
    function vPw() {
      var err = getOrCreateError(rPw); var v = rPw.value;
      if (!v) { err.textContent = ''; return true; }
      if (v.length < 8) { err.textContent = '비밀번호는 8자 이상이어야 합니다.'; return false; }
      if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) { err.textContent = '영문과 숫자를 모두 포함해야 합니다.'; return false; }
      err.textContent = ''; return true;
    }
    function vPwConfirm() {
      var err = getOrCreateError(rPwConfirm); var v = rPwConfirm.value;
      if (!v) { err.textContent = ''; return true; }
      if (v !== rPw.value) { err.textContent = '비밀번호가 일치하지 않습니다.'; return false; }
      err.textContent = ''; return true;
    }
    function vPhone() {
      var err = getOrCreateError(rPhone); var v = rPhone.value.trim();
      if (!v) { err.textContent = ''; return true; }
      if (!phoneRegex.test(v)) { err.textContent = '연락처는 010-0000-0000 형식으로 입력해 주세요.'; return false; }
      err.textContent = ''; return true;
    }

    rName.addEventListener('blur', vName);
    rName.addEventListener('input', function () { if (getOrCreateError(rName).textContent) vName(); });
    rEmail.addEventListener('blur', vEmail);
    rEmail.addEventListener('input', function () { if (getOrCreateError(rEmail).textContent) vEmail(); });
    rPw.addEventListener('blur', vPw);
    rPw.addEventListener('input', function () {
      vPw(); if (rPwConfirm.value) vPwConfirm();
    });
    rPwConfirm.addEventListener('blur', vPwConfirm);
    rPwConfirm.addEventListener('input', function () { if (getOrCreateError(rPwConfirm).textContent) vPwConfirm(); });
    rPhone.addEventListener('blur', vPhone);

    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var ok = true;
      var role = rRole.value;

      if (!role) { toast('회원 유형을 선택해 주세요.', 'error'); ok = false; }
      if (!rName.value.trim()) { getOrCreateError(rName).textContent = '이름을 입력해 주세요.'; ok = false; }
      else if (!vName()) ok = false;
      if (!rEmail.value.trim()) { getOrCreateError(rEmail).textContent = '이메일을 입력해 주세요.'; ok = false; }
      else if (!vEmail()) ok = false;
      if (!rPw.value) { getOrCreateError(rPw).textContent = '비밀번호를 입력해 주세요.'; ok = false; }
      else if (!vPw()) ok = false;
      if (!rPwConfirm.value) { getOrCreateError(rPwConfirm).textContent = '비밀번호 확인을 입력해 주세요.'; ok = false; }
      else if (!vPwConfirm()) ok = false;
      if (!rPhone.value.trim()) { getOrCreateError(rPhone).textContent = '연락처를 입력해 주세요.'; ok = false; }
      else if (!vPhone()) ok = false;

      if ((role === 'teacher' || role === 'director') && !rStaffCode.value.trim()) {
        toast('직원 인증코드를 입력해 주세요.', 'error'); ok = false;
      }
      if ((role === 'teacher' || role === 'member') && !rCampus.value) {
        toast('캠퍼스를 선택해야 합니다.', 'error'); ok = false;
      }
      if (rTerms && !rTerms.checked) { toast('이용약관에 동의해 주세요.', 'error'); ok = false; }
      if (rPrivacy && !rPrivacy.checked) { toast('개인정보처리방침에 동의해 주세요.', 'error'); ok = false; }
      if (rAge && !rAge.checked) { toast('만 14세 이상 또는 법정대리인 동의에 체크해 주세요.', 'error'); ok = false; }
      if (!ok) return;

      var btn = registerForm.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = '가입 처리 중...';

      var regBody = {
        email: rEmail.value.trim(),
        password: rPw.value,
        name: rName.value.trim(),
        phone: rPhone.value.trim(),
        role: role,
        student_name: (document.getElementById('reg-student-name') || {}).value || '',
        student_grade: (document.getElementById('reg-student-grade') || {}).value || '',
        campus: rCampus.value
      };
      if (rStaffCode.value.trim()) regBody.staff_code = rStaffCode.value.trim();

      try {
        var res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(regBody)
        });
        var data;
        try { data = await res.json(); } catch (_) { toast('서버 응답을 처리할 수 없습니다.', 'error'); return; }
        if (res.ok) {
          var redirect = new URLSearchParams(window.location.search).get('redirect');
          if (redirect && !/^[\w-]+\.html$/.test(redirect)) redirect = null;
          if (data.token) {
            TG.setAuth(data.token, data.user);
            toast('회원가입이 완료되었습니다.');
            setTimeout(function () { window.location.href = redirect || 'index.html'; }, 500);
          } else {
            toast('회원가입이 완료되었습니다. 로그인해주세요.');
            setTimeout(function () { window.location.href = redirect ? 'login.html?redirect=' + encodeURIComponent(redirect) : 'login.html'; }, 500);
          }
        } else {
          toast(data.error || data.message || '회원가입에 실패했습니다.', 'error');
        }
      } catch (err) {
        toast('네트워크 오류가 발생했습니다.', 'error');
      } finally {
        btn.disabled = false; btn.textContent = '회원가입';
      }
    });
  }
})();
