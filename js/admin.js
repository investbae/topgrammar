/* admin.js - 관리자 대시보드 */
(function () {
  'use strict';

  /* --- Minimal TG shim if core.js not loaded yet --- */
  if (typeof TG === 'undefined') {
    window.TG = {
      apiRequest: function () { return Promise.reject(new Error('TG not loaded')); },
      isLoggedIn: function () { return false; },
      showToast: function () {},
      escapeHTML: function (s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;') : ''; },
      getToken: function () { return null; },
      getUser: function () { return null; }
    };
  }
  var escapeHTML = window.escapeHTML || TG.escapeHTML || function (s) {
    return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;') : '';
  };

  // 관리자 인증 확인
  if (!TG.isLoggedIn()) { window.location.href = 'login.html'; return; }
  var user = TG.getUser();
  if (!user || (user.role !== 'admin' && user.role !== 'director')) {
    TG.showToast('관리자 권한이 필요합니다.', 'error');
    window.location.href = 'index.html';
    return;
  }

  var currentSection = 'dashboard';
  var studentPage = 1;
  var classPage = 1;
  var consultPage = 1;
  var careersPage = 1;

  // ── Navigation ──────────────────────────────
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
    // Close mobile sidebar
    var sb = document.getElementById('adminSidebar');
    if (sb) sb.classList.remove('is-open');

    if (name === 'dashboard') loadDashboard();
    else if (name === 'students') { studentPage = 1; loadStudents(); }
    else if (name === 'classes') { classPage = 1; loadClasses(); }
    else if (name === 'revenue') loadRevenue();
    else if (name === 'consults') { consultPage = 1; loadConsults(); }
    else if (name === 'careers') { careersPage = 1; loadCareers(); }
    else if (name === 'resources') loadResources();
    else if (name === 'leveltest') loadLeveltest();
  }

  // Mobile menu
  var menuBtn = document.getElementById('adminMenuBtn');
  if (menuBtn) {
    if (window.innerWidth <= 768) menuBtn.style.display = 'block';
    menuBtn.addEventListener('click', function () {
      var sb = document.getElementById('adminSidebar');
      if (sb) sb.classList.toggle('is-open');
    });
  }

  // Hash routing
  var hash = window.location.hash.replace('#', '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (hash && document.querySelector('[data-section="' + hash + '"]')) {
    switchSection(hash);
  } else {
    loadDashboard();
  }

  // ── Dashboard ───────────────────────────────
  async function loadDashboard() {
    var dateEl = document.getElementById('dashboardDate');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    try {
      var res = await TG.apiRequest('/api/admin/dashboard');
      if (!res || !res.ok) throw new Error('fetch');
      var d = await res.json();
      setText('statStudents', (d.total_students || 0) + '명');
      setText('statCourses', (d.total_courses || 0) + '개');
      setText('statRevenue', formatWon(d.total_revenue || 0));
      setText('statAttendance', (d.attendance_rate || 0) + '%');
      setText('statClasses', (d.total_classes || 0) + '개');
      setText('statConsults', (d.pending_consults || 0) + '건');
    } catch (e) {
      setText('statStudents', '-');
      setText('statCourses', '-');
      setText('statRevenue', '-');
      setText('statAttendance', '-');
      setText('statClasses', '-');
      setText('statConsults', '-');
    }

    // Mini chart
    loadRevenueChart('dashboardChart');
  }

  // ── Students ────────────────────────────────
  var searchInput = document.getElementById('studentSearch');
  var campusSelect = document.getElementById('studentCampus');
  var searchTimer;
  var cachedStudents = null;

  // Event delegation for student detail buttons (replaces inline onclick)
  var studentTbody = document.getElementById('studentTableBody');
  if (studentTbody) {
    studentTbody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-student-id]');
      if (!btn) return;
      var sid = parseInt(btn.dataset.studentId, 10);
      if (!isNaN(sid)) window.adminViewStudent(sid);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { studentPage = 1; loadStudents(); }, 400);
    });
  }
  if (campusSelect) {
    campusSelect.addEventListener('change', function () { studentPage = 1; loadStudents(); });
  }

  async function loadStudents() {
    var tbody = document.getElementById('studentTableBody');
    if (!tbody) return;
    var search = (searchInput ? searchInput.value : '').trim();
    var campus = campusSelect ? campusSelect.value : '';
    var url = '/api/admin/students?page=' + studentPage + '&per_page=20';
    if (search) url += '&search=' + encodeURIComponent(search);
    if (campus) url += '&campus=' + encodeURIComponent(campus);

    try {
      var res = await TG.apiRequest(url);
      if (!res || !res.ok) throw new Error('fetch');
      var json = await res.json();
      var rows = json.data || [];
      cachedStudents = rows;
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="admin-table__empty">학생이 없습니다.</td></tr>';
        renderPagination('studentPagination', 0, studentPage, function (p) { studentPage = p; loadStudents(); });
        return;
      }
      tbody.innerHTML = rows.map(function (s) {
        return '<tr>' +
          '<td>' + escapeHTML(s.name || '') + '</td>' +
          '<td>' + escapeHTML(s.student_name || '') + '</td>' +
          '<td>' + escapeHTML(s.student_grade || '') + '</td>' +
          '<td>' + campusLabel(s.campus) + '</td>' +
          '<td>' + escapeHTML(s.email || '') + '</td>' +
          '<td>' + escapeHTML(s.phone || '') + '</td>' +
          '<td>' + formatDate(s.created_at) + '</td>' +
          '<td><button class="btn btn--sm btn--ghost" data-student-id="' + parseInt(s.id, 10) + '">상세</button></td>' +
        '</tr>';
      }).join('');
      renderPagination('studentPagination', json.total || 0, studentPage, function (p) { studentPage = p; loadStudents(); });
    } catch (e) {
      cachedStudents = null;
      tbody.innerHTML = '<tr><td colspan="8" class="admin-table__empty">데이터를 불러올 수 없습니다.</td></tr>';
      renderPagination('studentPagination', 0, studentPage, function (p) { studentPage = p; loadStudents(); });
    }
  }

  // Student detail modal
  window.adminViewStudent = async function (id) {
    var modal = document.getElementById('studentModal');
    var body = document.getElementById('studentModalBody');
    if (!modal || !body) return;
    body.innerHTML = '<p>로딩 중…</p>';
    modal.classList.add('is-open');

    try {
      var res = await TG.apiRequest('/api/admin/students/' + id);
      if (!res || !res.ok) throw new Error('fetch');
      var s = await res.json();
      var html = '<h2 style="margin-bottom:var(--space-4);">' + escapeHTML(s.name || '') + '</h2>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-6);font-size:var(--text-sm);">' +
          '<div><strong>이메일</strong><br>' + escapeHTML(s.email || '') + '</div>' +
          '<div><strong>연락처</strong><br>' + escapeHTML(s.phone || '') + '</div>' +
          '<div><strong>학생 이름</strong><br>' + escapeHTML(s.student_name || '') + '</div>' +
          '<div><strong>학년</strong><br>' + escapeHTML(s.student_grade || '') + '</div>' +
          '<div><strong>캠퍼스</strong><br>' + campusLabel(s.campus) + '</div>' +
          '<div><strong>가입일</strong><br>' + formatDate(s.created_at) + '</div>' +
        '</div>';

      // Classes
      if (s.classes && s.classes.length) {
        html += '<h3 style="margin-bottom:var(--space-2);">소속 반</h3><ul style="margin-bottom:var(--space-4);font-size:var(--text-sm);">';
        s.classes.forEach(function (c) { html += '<li>' + escapeHTML(c.name) + ' (' + campusLabel(c.campus) + ')</li>'; });
        html += '</ul>';
      }

      // Scores
      if (s.scores && s.scores.length) {
        html += '<h3 style="margin-bottom:var(--space-2);">최근 성적</h3><table class="admin-table" style="margin-bottom:var(--space-4);"><thead><tr><th>시험</th><th>점수</th><th>등급</th><th>날짜</th></tr></thead><tbody>';
        s.scores.forEach(function (sc) {
          html += '<tr><td>' + escapeHTML(sc.exam_title || '') + '</td><td>' + sc.score + '</td><td>' + escapeHTML(sc.grade || '') + '</td><td>' + formatDate(sc.exam_date) + '</td></tr>';
        });
        html += '</tbody></table>';
      }

      // Attendance
      if (s.attendance && s.attendance.length) {
        html += '<h3 style="margin-bottom:var(--space-2);">최근 출결</h3><table class="admin-table"><thead><tr><th>날짜</th><th>반</th><th>상태</th><th>등원</th></tr></thead><tbody>';
        s.attendance.forEach(function (a) {
          html += '<tr><td>' + formatDate(a.date) + '</td><td>' + escapeHTML(a.class_name || '') + '</td><td>' + attendanceLabel(a.status) + '</td><td>' + escapeHTML(a.check_in || '') + '</td></tr>';
        });
        html += '</tbody></table>';
      }

      body.innerHTML = html;
    } catch (e) {
      body.innerHTML = '<p style="text-align:center;padding:var(--space-8);color:var(--color-error);">데이터를 불러올 수 없습니다.</p>';
    }
  };

  // Modal close
  var modalClose = document.getElementById('studentModalClose');
  var modal = document.getElementById('studentModal');
  if (modalClose) modalClose.addEventListener('click', function () { modal.classList.remove('is-open'); });
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('is-open'); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var m = document.getElementById('studentModal');
      if (m && m.classList.contains('is-open')) {
        m.classList.remove('is-open');
      }
    }
  });

  // ── Classes ─────────────────────────────────
  var addClassBtn = document.getElementById('addClassBtn');
  var classFormWrap = document.getElementById('classFormWrap');
  var classForm = document.getElementById('classForm');

  if (addClassBtn && classFormWrap) {
    addClassBtn.addEventListener('click', function () {
      classFormWrap.style.display = classFormWrap.style.display === 'none' ? '' : 'none';
    });
  }

  if (classForm) {
    classForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(classForm);
      var body = {};
      fd.forEach(function (v, k) { body[k] = v; });
      body.max_students = parseInt(body.max_students) || 10;

      var btn = classForm.querySelector('button[type="submit"]') || classForm.querySelector('button:last-of-type');
      if (btn) {
        btn.disabled = true;
        var origText = btn.textContent;
        btn.textContent = '처리 중...';
      }

      try {
        var res = await TG.apiRequest('/api/admin/classes', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (!res || !res.ok) { var errMsg = 'fail'; try { var err = await res.json(); errMsg = err.error || errMsg; } catch (_) {} throw new Error(errMsg); }
        TG.showToast('반이 생성되었습니다.');
        classForm.reset();
        classFormWrap.style.display = 'none';
        loadClasses();
      } catch (e) {
        TG.showToast(e.message || '생성 실패', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = origText;
        }
      }
    });
  }

  async function loadClasses() {
    var tbody = document.getElementById('classTableBody');
    if (!tbody) return;

    try {
      var res = await TG.apiRequest('/api/admin/classes?page=' + classPage + '&per_page=20');
      if (!res || !res.ok) throw new Error('fetch');
      var json = await res.json();
      var rows = json.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">등록된 반이 없습니다.</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(function (c) {
        return '<tr>' +
          '<td><strong>' + escapeHTML(c.name || '') + '</strong></td>' +
          '<td>' + campusLabel(c.campus) + '</td>' +
          '<td>' + escapeHTML(c.teacher || '') + '</td>' +
          '<td>' + escapeHTML(c.schedule || '') + '</td>' +
          '<td>' + (c.student_count || 0) + '/' + (c.max_students || 10) + '</td>' +
          '<td>' + (c.is_active ? '<span class="badge badge--accent">활성</span>' : '<span class="badge">비활성</span>') + '</td>' +
        '</tr>';
      }).join('');
      renderPagination('classPagination', json.total || 0, classPage, function (p) { classPage = p; loadClasses(); });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">데이터를 불러올 수 없습니다.</td></tr>';
    }
  }

  // ── Revenue ─────────────────────────────────
  async function loadRevenue() {
    loadRevenueChart('revenueChart');
    loadRevenueTable();
  }

  async function loadRevenueChart(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    try {
      var res = await TG.apiRequest('/api/admin/revenue');
      if (!res || !res.ok) throw new Error('fetch');
      var data = await res.json();
      var online = data.online || [];
      var offline = data.offline || [];

      // Merge months
      var months = {};
      online.forEach(function (r) { months[r.month] = { online: r.total || 0, offline: 0 }; });
      offline.forEach(function (r) {
        if (!months[r.month]) months[r.month] = { online: 0, offline: 0 };
        months[r.month].offline = r.total || 0;
      });

      var sorted = Object.keys(months).sort();
      if (!sorted.length) {
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-text-light);">매출 데이터가 없습니다.</div>';
        return;
      }

      var maxVal = 1;
      sorted.forEach(function (m) {
        var t = months[m].online + months[m].offline;
        if (t > maxVal) maxVal = t;
      });

      container.innerHTML = sorted.map(function (m) {
        var d = months[m];
        var onH = Math.max((d.online / maxVal) * 100, 2);
        var offH = Math.max((d.offline / maxVal) * 100, 2);
        if (d.online === 0) onH = 0;
        if (d.offline === 0) offH = 0;
        return '<div class="revenue-bar">' +
          '<div style="display:flex;gap:2px;align-items:flex-end;height:100%;">' +
            '<div class="revenue-bar__fill revenue-bar__fill--online" style="height:' + onH + '%;"></div>' +
            '<div class="revenue-bar__fill revenue-bar__fill--offline" style="height:' + offH + '%;"></div>' +
          '</div>' +
          '<div class="revenue-bar__label">' + m.slice(5) + '월</div>' +
        '</div>';
      }).join('');
    } catch (e) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-error);">데이터를 불러올 수 없습니다.</div>';
    }
  }

  async function loadRevenueTable() {
    var tbody = document.getElementById('revenueTableBody');
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
      if (!sorted.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">매출 데이터가 없습니다.</td></tr>';
        return;
      }

      tbody.innerHTML = sorted.map(function (m) {
        var d = months[m];
        return '<tr>' +
          '<td><strong>' + m + '</strong></td>' +
          '<td>' + formatWon(d.online) + '</td>' +
          '<td>' + formatWon(d.offline) + '</td>' +
          '<td><strong>' + formatWon(d.online + d.offline) + '</strong></td>' +
        '</tr>';
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">데이터를 불러올 수 없습니다.</td></tr>';
    }
  }

  // ── Consults ────────────────────────────────
  async function loadConsults() {
    var tbody = document.getElementById('consultTableBody');
    if (!tbody) return;

    try {
      var res = await TG.apiRequest('/api/consult?page=' + consultPage + '&per_page=20');
      if (!res || !res.ok) throw new Error('fetch');
      var json = await res.json();
      var rows = json.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">상담 요청이 없습니다.</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(function (c) {
        return '<tr>' +
          '<td>' + escapeHTML(c.name || '') + '</td>' +
          '<td>' + escapeHTML(c.phone || '') + '</td>' +
          '<td>' + escapeHTML(c.student_grade || '') + '</td>' +
          '<td>' + campusLabel(c.campus) + '</td>' +
          '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHTML(c.message || '') + '</td>' +
          '<td>' + consultStatus(c.status) + '</td>' +
          '<td>' + formatDate(c.created_at) + '</td>' +
        '</tr>';
      }).join('');
      renderPagination('consultPagination', json.total || 0, consultPage, function (p) { consultPage = p; loadConsults(); });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">데이터를 불러올 수 없습니다.</td></tr>';
    }
  }

  // ── Careers (채용 지원) ──────────────────────
  async function loadCareers() {
    var tbody = document.getElementById('careerTableBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/careers?page=' + careersPage + '&per_page=20');
      if (!res || !res.ok) throw new Error('fetch');
      var json = await res.json();
      var rows = json.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="admin-table__empty">접수된 지원이 없습니다.</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(function (c) {
        return '<tr>' +
          '<td>' + escapeHTML(c.name || '') + '</td>' +
          '<td>' + escapeHTML(c.phone || '') + '</td>' +
          '<td>' + escapeHTML(c.email || '-') + '</td>' +
          '<td>' + (c.campus === 'any' ? '무관' : campusLabel(c.campus)) + '</td>' +
          '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHTML(c.experience || '-') + '</td>' +
          '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHTML(c.message || '-') + '</td>' +
          '<td>' + careerStatus(c.status) + '</td>' +
          '<td>' + formatDate(c.created_at) + '</td>' +
        '</tr>';
      }).join('');
      renderPagination('careerPagination', json.total || 0, careersPage, function (p) { careersPage = p; loadCareers(); });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-table__empty">데이터를 불러올 수 없습니다.</td></tr>';
    }
  }

  function careerStatus(s) {
    if (s === 'new') return '<span class="badge badge--accent">신규</span>';
    if (s === 'reviewing') return '<span class="badge badge--outline">검토중</span>';
    if (s === 'contacted') return '<span class="badge badge--outline">연락완료</span>';
    if (s === 'closed') return '<span class="badge">종료</span>';
    return escapeHTML(s || '-');
  }

  // ── Helpers ─────────────────────────────────
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function formatWon(n) {
    if (!n) return '0원';
    return n.toLocaleString() + '원';
  }

  function formatDate(d) {
    if (!d) return '-';
    return d.slice(0, 10);
  }

  function campusLabel(c) {
    if (c === 'haengsin') return '행신';
    if (c === 'hwajeong') return '화정';
    return escapeHTML(c || '-');
  }

  function attendanceLabel(s) {
    var map = { present: '출석', late: '지각', absent: '결석', excused: '사유결석' };
    return map[s] || escapeHTML(s || '-');
  }

  function consultStatus(s) {
    if (s === 'new') return '<span class="badge badge--accent">신규</span>';
    if (s === 'contacted') return '<span class="badge badge--outline">연락완료</span>';
    if (s === 'completed') return '<span class="badge">완료</span>';
    return escapeHTML(s || '-');
  }

  function renderPagination(containerId, total, current, onPage) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var perPage = 20;
    var totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    var html = '';
    html += '<button ' + (current <= 1 ? 'disabled' : '') + ' data-p="' + (current - 1) + '">&lt;</button>';
    var maxVisible = 10;
    var startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    var endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    if (startPage > 1) { html += '<button data-p="1">1</button>'; if (startPage > 2) html += '<span style="padding:0 4px;">&hellip;</span>'; }
    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="' + (i === current ? 'is-active' : '') + '" data-p="' + i + '">' + i + '</button>';
    }
    if (endPage < totalPages) { if (endPage < totalPages - 1) html += '<span style="padding:0 4px;">&hellip;</span>'; html += '<button data-p="' + totalPages + '">' + totalPages + '</button>'; }
    html += '<button ' + (current >= totalPages ? 'disabled' : '') + ' data-p="' + (current + 1) + '">&gt;</button>';
    container.innerHTML = html;

    if (container._paginationHandler) {
      container.removeEventListener('click', container._paginationHandler);
    }
    container._paginationHandler = function (e) {
      var btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      onPage(parseInt(btn.dataset.p));
    };
    container.addEventListener('click', container._paginationHandler);
  }

  // ── CSV Export ─────────────────────────────
  function exportStudentsCSV() {
    var headers = ['ID', '학부모명', '학생명', '학년', '캠퍼스', '이메일', '연락처', '가입일'];
    var source = (cachedStudents && cachedStudents.length) ? cachedStudents : [];
    if (!source.length) {
      TG.showToast('내보낼 학생 데이터가 없습니다.', 'error');
      return;
    }
    var rows = source.map(function (s) {
      return [
        s.id,
        s.name,
        s.student_name,
        s.student_grade,
        s.campus === 'haengsin' ? '행신' : s.campus === 'hwajeong' ? '화정' : s.campus,
        s.email,
        s.phone,
        s.created_at
      ].map(function (v) {
        var str = String(v == null ? '' : v);
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(',');
    });
    var csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'students_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  var exportBtn = document.getElementById('exportStudents') || document.querySelector('.export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function (e) {
      e.preventDefault();
      exportStudentsCSV();
    });
  }
  // Expose for external use
  window.exportStudentsCSV = exportStudentsCSV;

  // ── 자료실 관리 ────────────────────────────
  var TIER_LABEL = { free: '전체공개', basic: '회원', premium: '수강생', vip: '재원생' };
  var resourceUploadBound = false;

  async function loadResources() {
    bindResourceUpload();
    var tbody = document.getElementById('resourceTableBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/resources?per_page=100');
      if (!res || !res.ok) throw new Error('fail');
      var json = await res.json();
      var rows = json.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--space-8);color:var(--color-text-light);">등록된 자료가 없습니다. 위에서 첫 자료를 업로드하세요.</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(function (r) {
        return '<tr>' +
          '<td>' + escapeHTML(r.title) + '</td>' +
          '<td>' + escapeHTML(r.category || '-') + '</td>' +
          '<td>' + escapeHTML(r.target_grade || '-') + '</td>' +
          '<td><span class="badge">' + escapeHTML(TIER_LABEL[r.tier] || r.tier) + '</span></td>' +
          '<td>' + escapeHTML(r.file_type || '-') + '</td>' +
          '<td>' + (r.download_count || 0) + '</td>' +
          '<td><button class="btn btn--sm" data-del-resource="' + r.id + '" style="color:var(--color-error);">삭제</button></td>' +
        '</tr>';
      }).join('');
      tbody.querySelectorAll('[data-del-resource]').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteResource(btn.getAttribute('data-del-resource')); });
      });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--space-8);color:var(--color-error);">불러오기에 실패했습니다.</td></tr>';
    }
  }

  async function deleteResource(id) {
    if (!confirm('이 자료를 삭제하시겠습니까?')) return;
    try {
      var res = await TG.apiRequest('/api/resources/' + id, { method: 'DELETE' });
      if (res && res.ok) { TG.showToast('삭제되었습니다.'); loadResources(); }
      else { TG.showToast('삭제에 실패했습니다.', 'error'); }
    } catch (e) { TG.showToast('삭제 중 오류가 발생했습니다.', 'error'); }
  }

  function bindResourceUpload() {
    if (resourceUploadBound) return;
    var form = document.getElementById('resourceUploadForm');
    if (!form) return;
    resourceUploadBound = true;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fileEl = document.getElementById('ru-file');
      if (!fileEl || !fileEl.files || !fileEl.files[0]) { TG.showToast('파일을 선택해주세요.', 'error'); return; }
      var fd = new FormData();
      fd.append('file', fileEl.files[0]);
      fd.append('title', (document.getElementById('ru-title').value || '').trim());
      fd.append('category', (document.getElementById('ru-category').value || '').trim());
      fd.append('target_grade', (document.getElementById('ru-grade').value || '').trim());
      fd.append('tier', document.getElementById('ru-tier').value || 'free');
      fd.append('description', (document.getElementById('ru-desc').value || '').trim());
      var btn = document.getElementById('ru-submit');
      if (btn) { btn.disabled = true; btn.textContent = '업로드 중...'; }
      // FormData 전송: Content-Type은 브라우저가 boundary와 함께 자동 설정 (직접 fetch + 토큰만 부착)
      var tok = TG.getToken ? TG.getToken() : null;
      fetch('/api/resources/upload', {
        method: 'POST',
        headers: tok ? { 'Authorization': 'Bearer ' + tok } : {},
        body: fd
      }).then(function (res) {
        return res.json().then(function (d) { return { ok: res.ok, d: d }; });
      }).then(function (r) {
        if (r.ok) { TG.showToast('업로드되었습니다.'); form.reset(); loadResources(); }
        else { TG.showToast((r.d && r.d.error) || '업로드에 실패했습니다.', 'error'); }
      }).catch(function () {
        TG.showToast('업로드 중 오류가 발생했습니다.', 'error');
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = '업로드'; }
      });
    });
  }

  // ── 레벨테스트 결과 ────────────────────────
  async function loadLeveltest() {
    var tbody = document.getElementById('leveltestTableBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/leveltest/results?per_page=100');
      if (!res || !res.ok) throw new Error('fail');
      var json = await res.json();
      var rows = json.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--space-8);color:var(--color-text-light);">아직 응시 기록이 없습니다.</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(function (r) {
        return '<tr>' +
          '<td>' + escapeHTML(r.name) + '</td>' +
          '<td>' + escapeHTML(r.phone) + '</td>' +
          '<td>' + escapeHTML(r.student_grade || '-') + '</td>' +
          '<td>' + (r.score != null ? r.score + '점' : '-') + '</td>' +
          '<td><span class="badge">' + escapeHTML(r.level || '-') + '</span></td>' +
          '<td>' + formatDate(r.created_at) + '</td>' +
        '</tr>';
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--space-8);color:var(--color-error);">불러오기에 실패했습니다.</td></tr>';
    }
  }

})();
