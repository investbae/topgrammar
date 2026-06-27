/* director.js - 원장 관리 대시보드 */
(function () {
  'use strict';

  // 인증 확인: director 또는 admin만 접근
  if (!TG.isLoggedIn()) { window.location.href = 'login.html'; return; }
  var user = TG.getUser();
  if (!user || (user.role !== 'director' && user.role !== 'admin')) {
    TG.showToast('원장 또는 관리자 권한이 필요합니다.', 'error');
    window.location.href = 'index.html';
    return;
  }

  var ROLE_LABELS = {
    admin: '관리자', director: '원장님', teacher: '선생님',
    member: '정회원', general: '일반회원'
  };
  var ROLE_CLASSES = {
    admin: 'role-badge--admin', director: 'role-badge--director', teacher: 'role-badge--teacher',
    member: 'role-badge--member', general: 'role-badge--general'
  };
  var CAMPUS_LABELS = { haengsin: '행신', hwajeong: '화정' };
  var STATUS_LABELS = { new: '신규', contacted: '연락완료', completed: '완료' };

  var currentSection = 'dashboard';

  // ── Navigation ──
  document.querySelectorAll('[data-section]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  function switchSection(name) {
    currentSection = name;
    document.querySelectorAll('[data-section]').forEach(function (a) {
      a.classList.toggle('is-active', a.dataset.section === name);
    });
    document.querySelectorAll('[id^="sec-"]').forEach(function (sec) {
      sec.style.display = sec.id === 'sec-' + name ? '' : 'none';
    });
    if (name === 'dashboard') loadDashboard();
    else if (name === 'members') loadMembers();
    else if (name === 'teachers') loadTeachers();
    else if (name === 'classes') loadClasses();
    else if (name === 'students') loadStudents();
    else if (name === 'revenue') loadRevenue();
    else if (name === 'consults') loadConsults();
  }

  var hash = window.location.hash.replace('#', '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (hash && document.querySelector('[data-section="' + hash + '"]')) {
    switchSection(hash);
  } else {
    loadDashboard();
  }

  // ── Dashboard ──
  async function loadDashboard() {
    var dateEl = document.getElementById('directorDate');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    try {
      var res = await TG.apiRequest('/api/admin/dashboard');
      if (!res || !res.ok) throw new Error('fetch');
      var d = await res.json();
      setText('statTotalMembers', (d.total_members || 0) + '명');
      setText('statFullMembers', (d.full_members || 0) + '명');
      setText('statTeachers', (d.total_teachers || 0) + '명');
      setText('statStudents', (d.total_students || 0) + '명');
      setText('statClasses', (d.total_classes || 0) + '개');
      setText('statRevenue', formatWon(d.total_revenue || 0));
      setText('statAttendance', (d.attendance_rate || 0) + '%');
      setText('statConsults', (d.pending_consults || 0) + '건');
      var badge = document.getElementById('consultBadge');
      if (badge) badge.textContent = d.pending_consults || 0;
    } catch (e) {
      setText('statTotalMembers', '-');
      setText('statFullMembers', '-');
      setText('statTeachers', '-');
      setText('statStudents', '-');
      setText('statClasses', '-');
      setText('statRevenue', '-');
      setText('statAttendance', '-');
      setText('statConsults', '-');
    }
  }

  // ── Members ──
  var dMemberSearch = document.getElementById('dMemberSearch');
  var dMemberRole = document.getElementById('dMemberRole');
  var memberTimer;

  if (dMemberSearch) dMemberSearch.addEventListener('input', function () {
    clearTimeout(memberTimer);
    memberTimer = setTimeout(loadMembers, 400);
  });
  if (dMemberRole) dMemberRole.addEventListener('change', loadMembers);

  async function loadMembers() {
    var tbody = document.getElementById('dMemberTableBody');
    if (!tbody) return;
    var search = (dMemberSearch ? dMemberSearch.value : '').trim();
    var role = dMemberRole ? dMemberRole.value : '';

    try {
      var url = '/api/admin/users?per_page=50';
      if (search) url += '&search=' + encodeURIComponent(search);
      if (role) url += '&role=' + encodeURIComponent(role);
      var res = await TG.apiRequest(url);
      if (!res || !res.ok) throw new Error('fetch');
      var rows = (await res.json()).data || [];
      renderMembers(tbody, rows);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-table__empty">회원 목록을 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderMembers(tbody, rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-table__empty">회원이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (m) {
      var roleLabel = ROLE_LABELS[m.role] || m.role;
      var roleClass = ROLE_CLASSES[m.role] || 'role-badge--general';
      return '<tr>' +
        '<td>' + esc(m.name || '') + '</td>' +
        '<td>' + esc(m.email || '') + '</td>' +
        '<td>' + esc(m.phone || '') + '</td>' +
        '<td><span class="role-badge ' + roleClass + '">' + roleLabel + '</span></td>' +
        '<td>' + (CAMPUS_LABELS[m.campus] || '-') + '</td>' +
        '<td>' + (m.created_at || '').slice(0, 10) + '</td>' +
        '<td>' + (m.is_active ? '<span class="badge badge--accent">활성</span>' : '<span class="badge">비활성</span>') + '</td>' +
        '<td><button class="btn btn--sm btn--ghost" onclick="directorEditRole(' + m.id + ',\'' + esc(m.role || '') + '\')">역할변경</button></td>' +
      '</tr>';
    }).join('');
  }

  // Role change
  window.directorEditRole = async function (userId, currentRole) {
    var isAdmin = user.role === 'admin';
    var hint = 'general: 일반회원\nmember: 정회원\nteacher: 선생님';
    if (isAdmin) hint += '\ndirector: 원장님';
    var newRole = prompt('새 역할을 입력하세요.\n\n' + hint, currentRole);
    if (!newRole || newRole === currentRole) return;
    var validRoles = isAdmin ? ['general', 'member', 'teacher', 'director'] : ['general', 'member', 'teacher'];
    if (validRoles.indexOf(newRole) === -1) {
      TG.showToast('유효하지 않은 역할입니다.', 'error');
      return;
    }
    var btn = document.querySelector('button[onclick*="directorEditRole(' + userId + '"]');
    var originalText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '처리 중...'; }
    try {
      var res = await TG.apiRequest('/api/admin/users/' + userId + '/role', {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      if (!res || !res.ok) {
        var err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || '변경 실패');
      }
      TG.showToast('역할이 변경되었습니다.');
      loadMembers();
    } catch (e) {
      TG.showToast(e.message || '역할 변경 실패', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
  };

  // ── Teachers ──
  async function loadTeachers() {
    var tbody = document.getElementById('dTeacherTableBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/admin/teachers');
      if (!res || !res.ok) throw new Error('fetch');
      var rows = (await res.json()).data || [];
      renderTeachers(tbody, rows);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">선생님 목록을 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderTeachers(tbody, rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">선생님이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (t) {
      return '<tr>' +
        '<td><strong>' + esc(t.name || '') + '</strong></td>' +
        '<td>' + esc(t.email || '') + '</td>' +
        '<td>' + esc(t.phone || '') + '</td>' +
        '<td>' + (CAMPUS_LABELS[t.campus] || '-') + '</td>' +
        '<td>' + (t.created_at || '').slice(0, 10) + '</td>' +
        '<td>' + (t.is_active ? '<span class="badge badge--accent">활성</span>' : '<span class="badge">비활성</span>') + '</td>' +
        '<td><button class="btn btn--sm btn--ghost" onclick="directorToggleActive(' + t.id + ',' + (t.is_active ? 0 : 1) + ')">' + (t.is_active ? '비활성화' : '활성화') + '</button></td>' +
      '</tr>';
    }).join('');
  }

  window.directorToggleActive = async function (userId, active) {
    var btn = document.querySelector('button[onclick*="directorToggleActive(' + userId + '"]');
    var originalText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '처리 중...'; }
    try {
      var res = await TG.apiRequest('/api/admin/users/' + userId + '/active', {
        method: 'PUT',
        body: JSON.stringify({ is_active: active })
      });
      if (!res || !res.ok) {
        var err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || '변경 실패');
      }
      TG.showToast(active ? '활성화되었습니다.' : '비활성화되었습니다.');
    } catch (e) {
      TG.showToast(e.message || '상태 변경 실패', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
    loadTeachers();
  };

  // ── Classes ──
  var dAddClassBtn = document.getElementById('dAddClassBtn');
  var dClassFormWrap = document.getElementById('dClassFormWrap');
  var dClassForm = document.getElementById('dClassForm');
  var dClassCampus = document.getElementById('dClassCampus');

  if (dAddClassBtn && dClassFormWrap) {
    dAddClassBtn.addEventListener('click', function () {
      dClassFormWrap.style.display = dClassFormWrap.style.display === 'none' ? '' : 'none';
    });
  }
  if (dClassCampus) dClassCampus.addEventListener('change', loadClasses);

  if (dClassForm) {
    dClassForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(dClassForm);
      var body = {};
      fd.forEach(function (v, k) { body[k] = v; });
      body.max_students = parseInt(body.max_students) || 10;
      var btn = dClassForm.querySelector('button[type="submit"]');
      var originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = '처리 중...'; }
      try {
        var res = await TG.apiRequest('/api/admin/classes', { method: 'POST', body: JSON.stringify(body) });
        if (!res || !res.ok) {
          var err = await res.json().catch(function () { return {}; });
          throw new Error(err.error || '생성 실패');
        }
        TG.showToast('반이 생성되었습니다.');
        dClassForm.reset();
        dClassFormWrap.style.display = 'none';
        loadClasses();
      } catch (err2) {
        TG.showToast(err2.message || '생성 실패', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
      }
    });
  }

  async function loadClasses() {
    var tbody = document.getElementById('dClassTableBody');
    if (!tbody) return;
    var campus = dClassCampus ? dClassCampus.value : '';
    try {
      var url = '/api/admin/classes?per_page=50';
      if (campus) url += '&campus=' + encodeURIComponent(campus);
      var res = await TG.apiRequest(url);
      if (!res || !res.ok) throw new Error('fetch');
      var rows = (await res.json()).data || [];
      renderClasses(tbody, rows);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">반 목록을 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderClasses(tbody, rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">등록된 반이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (c) {
      return '<tr>' +
        '<td><strong>' + esc(c.name || '') + '</strong></td>' +
        '<td>' + (CAMPUS_LABELS[c.campus] || '-') + '</td>' +
        '<td>' + esc(c.teacher || '') + '</td>' +
        '<td>' + esc(c.schedule || '') + '</td>' +
        '<td>' + (c.student_count || 0) + '/' + (c.max_students || 10) + '</td>' +
        '<td>' + (c.is_active ? '<span class="badge badge--accent">활성</span>' : '<span class="badge">비활성</span>') + '</td>' +
      '</tr>';
    }).join('');
  }

  // ── Students ──
  var dStudentSearch = document.getElementById('dStudentSearch');
  var dStudentCampus = document.getElementById('dStudentCampus');
  var studentTimer;

  if (dStudentSearch) dStudentSearch.addEventListener('input', function () {
    clearTimeout(studentTimer);
    studentTimer = setTimeout(loadStudents, 400);
  });
  if (dStudentCampus) dStudentCampus.addEventListener('change', loadStudents);

  async function loadStudents() {
    var tbody = document.getElementById('dStudentTableBody');
    if (!tbody) return;
    var search = (dStudentSearch ? dStudentSearch.value : '').trim();
    var campus = dStudentCampus ? dStudentCampus.value : '';

    try {
      var url = '/api/admin/students?per_page=50';
      if (search) url += '&search=' + encodeURIComponent(search);
      if (campus) url += '&campus=' + encodeURIComponent(campus);
      var res = await TG.apiRequest(url);
      if (!res || !res.ok) throw new Error('fetch');
      var rows = (await res.json()).data || [];
      renderStudents(tbody, rows);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">학생 목록을 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderStudents(tbody, rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">학생이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (s) {
      return '<tr>' +
        '<td>' + esc(s.name || '') + '</td>' +
        '<td>' + esc(s.student_name || '') + '</td>' +
        '<td>' + esc(s.student_grade || '') + '</td>' +
        '<td>' + (CAMPUS_LABELS[s.campus] || '-') + '</td>' +
        '<td>' + esc(s.email || '') + '</td>' +
        '<td>' + esc(s.phone || '') + '</td>' +
        '<td>' + (s.created_at || '').slice(0, 10) + '</td>' +
      '</tr>';
    }).join('');
  }

  // ── Revenue ──
  var revenueChartData = [];

  async function loadRevenue() {
    var tbody = document.getElementById('dRevenueTableBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/admin/revenue');
      if (!res || !res.ok) throw new Error('fetch');
      var data = await res.json();
      var online = data.online || [];
      var offline = data.offline || [];
      var months = {};
      online.forEach(function (r) { months[r.month] = { online: r.total || 0, offline: 0 }; });
      offline.forEach(function (r) {
        if (!months[r.month]) months[r.month] = { online: 0, offline: 0 };
        months[r.month].offline = r.total || 0;
      });
      var sorted = Object.keys(months).sort().reverse();
      revenueChartData = sorted.map(function (m) { return { month: m, online: months[m].online, offline: months[m].offline }; });
      renderRevenue(tbody, revenueChartData);
      drawRevenueChart(revenueChartData);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">매출 데이터를 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderRevenue(tbody, rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">매출 데이터가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      return '<tr><td><strong>' + r.month + '</strong></td><td>' + formatWon(r.online) + '</td><td>' + formatWon(r.offline) + '</td><td><strong>' + formatWon(r.online + r.offline) + '</strong></td></tr>';
    }).join('');
  }

  function drawRevenueChart(rows) {
    var canvas = document.getElementById('dRevenueChart');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth;
    var h = canvas.clientHeight || 280;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    if (!rows.length) {
      ctx.fillStyle = '#999';
      ctx.font = '14px Pretendard';
      ctx.textAlign = 'center';
      ctx.fillText('데이터가 없습니다.', w / 2, h / 2);
      return;
    }

    var display = rows.slice(0, 6).reverse();
    var pad = { top: 30, right: 20, bottom: 50, left: 70 };
    var chartW = w - pad.left - pad.right;
    var chartH = h - pad.top - pad.bottom;

    var maxVal = 0;
    display.forEach(function (r) { maxVal = Math.max(maxVal, r.online + r.offline); });
    if (maxVal === 0) maxVal = 1;
    maxVal = Math.ceil(maxVal / 1000000) * 1000000;

    // grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '11px Pretendard';
    ctx.fillStyle = '#718096';
    ctx.textAlign = 'right';
    for (var i = 0; i <= 4; i++) {
      var y = pad.top + chartH - (chartH * i / 4);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      var val = (maxVal * i / 4);
      ctx.fillText(val >= 10000 ? Math.round(val / 10000) + '만' : val.toLocaleString(), pad.left - 8, y + 4);
    }

    var barGroupW = chartW / display.length;
    var barW = Math.min(barGroupW * 0.3, 30);
    var gap = 4;

    display.forEach(function (r, idx) {
      var cx = pad.left + barGroupW * idx + barGroupW / 2;

      // online bar
      var hOnline = (r.online / maxVal) * chartH;
      ctx.fillStyle = '#4299e1';
      ctx.fillRect(cx - barW - gap / 2, pad.top + chartH - hOnline, barW, hOnline);

      // offline bar
      var hOffline = (r.offline / maxVal) * chartH;
      ctx.fillStyle = '#48bb78';
      ctx.fillRect(cx + gap / 2, pad.top + chartH - hOffline, barW, hOffline);

      // month label
      ctx.fillStyle = '#4a5568';
      ctx.font = '11px Pretendard';
      ctx.textAlign = 'center';
      ctx.fillText(r.month.slice(5) + '월', cx, pad.top + chartH + 20);
    });

    // legend
    ctx.fillStyle = '#4299e1';
    ctx.fillRect(pad.left, h - 15, 12, 12);
    ctx.fillStyle = '#4a5568';
    ctx.font = '11px Pretendard';
    ctx.textAlign = 'left';
    ctx.fillText('온라인', pad.left + 16, h - 5);
    ctx.fillStyle = '#48bb78';
    ctx.fillRect(pad.left + 70, h - 15, 12, 12);
    ctx.fillStyle = '#4a5568';
    ctx.fillText('오프라인', pad.left + 86, h - 5);
  }

  // ── Consults ──
  async function loadConsults() {
    var tbody = document.getElementById('dConsultTableBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/consult?per_page=50');
      if (!res || !res.ok) throw new Error('fetch');
      var rows = (await res.json()).data || [];
      renderConsults(tbody, rows);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">상담 목록을 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderConsults(tbody, rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">상담 요청이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (c) {
      var statusOpts = '<select onchange="directorChangeConsultStatus(' + (c.id || 0) + ',this.value)" style="padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;font-size:12px;">';
      ['new', 'contacted', 'completed'].forEach(function (s) {
        statusOpts += '<option value="' + s + '"' + (c.status === s ? ' selected' : '') + '>' + (STATUS_LABELS[s] || s) + '</option>';
      });
      statusOpts += '</select>';
      return '<tr>' +
        '<td>' + esc(c.name || '') + '</td>' +
        '<td>' + esc(c.phone || '') + '</td>' +
        '<td>' + esc(c.student_grade || '') + '</td>' +
        '<td>' + (CAMPUS_LABELS[c.campus] || '-') + '</td>' +
        '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(c.message || '') + '</td>' +
        '<td>' + statusOpts + '</td>' +
        '<td>' + (c.created_at || '').slice(0, 10) + '</td>' +
      '</tr>';
    }).join('');
  }

  window.directorChangeConsultStatus = async function (consultId, newStatus) {
    var sel = document.querySelector('select[onchange*="directorChangeConsultStatus(' + consultId + '"]');
    if (sel) sel.disabled = true;
    try {
      var res = await TG.apiRequest('/api/consult/' + consultId, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res || !res.ok) {
        var err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || '변경 실패');
      }
      TG.showToast('상담 상태가 변경되었습니다.');
    } catch (e) {
      TG.showToast(e.message || '상태 변경 실패', 'error');
      loadConsults();
    } finally {
      if (sel) sel.disabled = false;
    }
  };

  // ── Helpers ──
  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
  function formatWon(n) { return n ? n.toLocaleString() + '원' : '0원'; }
  var esc = window.escapeHTML || (TG && TG.escapeHTML) || function(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'):'';};
})();
