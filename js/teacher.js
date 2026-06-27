/* teacher.js - 선생님 관리 대시보드 */
(function () {
  'use strict';

  // 인증 확인
  if (!TG.isLoggedIn()) { window.location.href = 'login.html'; return; }
  var user = TG.getUser();
  if (!user || (user.role !== 'teacher' && user.role !== 'director' && user.role !== 'admin')) {
    TG.showToast('선생님 권한이 필요합니다.', 'error');
    window.location.href = 'index.html';
    return;
  }

  var myCampus = user.campus || '';
  var campusNames = { haengsin: '행신본원', hwajeong: '화정캠퍼스' };

  // 상단 정보 표시
  var campusBadge = document.getElementById('teacherCampusBadge');
  var teacherNameEl = document.getElementById('teacherName');
  if (campusBadge) campusBadge.textContent = campusNames[myCampus] || myCampus;
  if (teacherNameEl) teacherNameEl.textContent = user.name + ' 선생님';

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
    else if (name === 'students') loadStudents();
    else if (name === 'classes') loadClasses();
    else if (name === 'attendance') loadAttendance();
    else if (name === 'evaluations') loadEvaluations();
    else if (name === 'homework') loadHomework();
    else if (name === 'scores') loadScores();
  }

  var hash = window.location.hash.replace('#', '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (hash && document.querySelector('[data-section="' + hash + '"]')) {
    switchSection(hash);
  } else {
    loadDashboard();
  }

  // ── Dashboard ──
  async function loadDashboard() {
    try {
      var res = await TG.apiRequest('/api/teacher/dashboard');
      if (!res || !res.ok) throw new Error('데이터를 불러올 수 없습니다.');
      var d = await res.json();
      setText('statMyStudents', (d.total_students || 0) + '명');
      setText('statMyClasses', (d.total_classes || 0) + '개');
      setText('statMyAttendance', (d.attendance_rate || 0) + '%');
      setText('statPendingHw', (d.pending_homework || 0) + '건');
    } catch (e) {
      setText('statMyStudents', '-');
      setText('statMyClasses', '-');
      setText('statMyAttendance', '-');
      setText('statPendingHw', '-');
    }

    // Today's classes
    var tbody = document.getElementById('todayClassesBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/teacher/classes');
      if (!res || !res.ok) throw new Error('fetch');
      var classes = (await res.json()).data || [];
      renderTodayClasses(tbody, classes);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">수업 목록을 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderTodayClasses(tbody, classes) {
    if (!classes.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">등록된 수업이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = classes.map(function (c) {
      return '<tr><td><strong>' + esc(c.name) + '</strong></td><td>' + esc(c.schedule || '') + '</td><td>' +
        (c.student_count || 0) + '/' + (c.max_students || 10) + '</td><td>' +
        (c.is_active ? '<span class="badge badge--accent">활성</span>' : '<span class="badge">비활성</span>') + '</td></tr>';
    }).join('');
  }

  // ── Students ──
  var tSearchInput = document.getElementById('tStudentSearch');
  var searchTimer;
  if (tSearchInput) {
    tSearchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadStudents, 400);
    });
  }

  async function loadStudents() {
    var tbody = document.getElementById('tStudentTableBody');
    if (!tbody) return;
    var search = (tSearchInput ? tSearchInput.value : '').trim();

    try {
      var url = '/api/teacher/students';
      if (search) url += '?search=' + encodeURIComponent(search);
      var res = await TG.apiRequest(url);
      if (!res || !res.ok) throw new Error('fetch');
      var rows = (await res.json()).data || [];
      renderStudents(tbody, rows);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">학생 목록을 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderStudents(tbody, rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">학생이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (s) {
      return '<tr><td>' + esc(s.name || '') + '</td><td>' + esc(s.student_name || '') + '</td><td>' +
        esc(s.student_grade || '') + '</td><td>' + esc(s.email || '') + '</td><td>' +
        esc(s.phone || '') + '</td><td>' + (s.created_at || '').slice(0, 10) + '</td></tr>';
    }).join('');
  }

  // ── Classes (read-only) ──
  async function loadClasses() {
    var tbody = document.getElementById('tClassTableBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/teacher/classes');
      if (!res || !res.ok) throw new Error('fetch');
      var rows = (await res.json()).data || [];
      renderClasses(tbody, rows);
      populateClassSelects(rows);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">반 목록을 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderClasses(tbody, rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">등록된 반이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (c) {
      return '<tr><td><strong>' + esc(c.name) + '</strong></td><td>' + esc(c.schedule || '') + '</td><td>' +
        (c.student_count || 0) + '/' + (c.max_students || 10) + '</td><td>' +
        (c.is_active ? '<span class="badge badge--accent">활성</span>' : '<span class="badge">비활성</span>') + '</td></tr>';
    }).join('');
  }

  function populateClassSelects(classes) {
    var selects = [
      document.getElementById('tAttendanceClass'),
      document.getElementById('tHwClassSelect'),
      document.getElementById('tExamClassSelect')
    ];
    selects.forEach(function (sel) {
      if (!sel) return;
      var val = sel.value;
      var opts = '<option value="">반 선택</option>';
      classes.forEach(function (c) {
        opts += '<option value="' + (c.id || '') + '">' + esc(c.name) + '</option>';
      });
      sel.innerHTML = opts;
      sel.value = val;
    });
  }

  // ── Attendance ──
  var tAttendanceDate = document.getElementById('tAttendanceDate');
  if (tAttendanceDate) tAttendanceDate.value = new Date().toISOString().slice(0, 10);

  async function loadAttendance() {
    var tbody = document.getElementById('tAttendanceBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/teacher/classes');
      if (!res || !res.ok) throw new Error('fetch');
      populateClassSelects((await res.json()).data || []);
    } catch (e) { /* selects stay empty */ }
    tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">반을 선택해주세요.</td></tr>';
  }

  var tAttendanceClass = document.getElementById('tAttendanceClass');
  if (tAttendanceClass) tAttendanceClass.addEventListener('change', loadAttendanceStudents);
  if (tAttendanceDate) tAttendanceDate.addEventListener('change', loadAttendanceStudents);

  async function loadAttendanceStudents() {
    var tbody = document.getElementById('tAttendanceBody');
    var classId = tAttendanceClass ? tAttendanceClass.value : '';
    if (!tbody || !classId) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">반을 선택해주세요.</td></tr>';
      return;
    }
    try {
      var res = await TG.apiRequest('/api/teacher/attendance?class_id=' + classId + '&date=' + (tAttendanceDate ? tAttendanceDate.value : ''));
      if (!res || !res.ok) throw new Error('fetch');
      var students = (await res.json()).data || [];
      renderAttendance(tbody, students);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">출결 데이터를 불러올 수 없습니다.</td></tr>';
    }
  }

  function renderAttendance(tbody, students) {
    if (!students.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">학생이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = students.map(function (s) {
      var id = s.user_id || s.id;
      return '<tr>' +
        '<td>' + esc(s.student_name || s.name || '') + '</td>' +
        '<td>' + esc(s.student_grade || '') + '</td>' +
        '<td><input type="radio" name="att_' + id + '" value="present"' + (s.status === 'present' || !s.status ? ' checked' : '') + '></td>' +
        '<td><input type="radio" name="att_' + id + '" value="late"' + (s.status === 'late' ? ' checked' : '') + '></td>' +
        '<td><input type="radio" name="att_' + id + '" value="absent"' + (s.status === 'absent' ? ' checked' : '') + '></td>' +
        '<td><input type="text" value="' + esc(s.note || '') + '" data-uid="' + id + '" class="att-note" style="width:100px;padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;font-size:12px;"></td>' +
      '</tr>';
    }).join('');
  }

  var saveAttBtn = document.getElementById('tSaveAttendance');
  if (saveAttBtn) {
    saveAttBtn.addEventListener('click', async function () {
      var classId = tAttendanceClass ? tAttendanceClass.value : '';
      var date = tAttendanceDate ? tAttendanceDate.value : '';
      if (!classId) { TG.showToast('반을 선택해주세요.', 'error'); return; }
      var records = [];
      document.querySelectorAll('#tAttendanceBody tr').forEach(function (tr) {
        var radio = tr.querySelector('input[type="radio"]:checked');
        var noteInput = tr.querySelector('.att-note');
        if (radio && noteInput) {
          records.push({ user_id: parseInt(noteInput.dataset.uid), status: radio.value, note: noteInput.value });
        }
      });
      var originalText = saveAttBtn.textContent;
      saveAttBtn.disabled = true;
      saveAttBtn.textContent = '저장 중...';
      try {
        var res = await TG.apiRequest('/api/teacher/attendance', {
          method: 'POST',
          body: JSON.stringify({ class_id: parseInt(classId), date: date, records: records })
        });
        if (!res || !res.ok) {
          var err = await res.json().catch(function () { return {}; });
          throw new Error(err.error || '저장 실패');
        }
        TG.showToast('출결이 저장되었습니다.');
      } catch (e) {
        TG.showToast(e.message || '출결 저장 실패', 'error');
      } finally {
        saveAttBtn.disabled = false;
        saveAttBtn.textContent = originalText;
      }
    });
  }

  // ── Daily Evaluations ──
  var tEvalClass = document.getElementById('tEvalClass');
  var tEvalDate = document.getElementById('tEvalDate');
  if (tEvalDate) tEvalDate.value = new Date().toISOString().slice(0, 10);

  async function loadEvaluations() {
    try {
      var res = await TG.apiRequest('/api/teacher/classes');
      if (!res || !res.ok) throw new Error('fetch');
      var classes = (await res.json()).data || [];
      if (tEvalClass) {
        var val = tEvalClass.value;
        var opts = '<option value="">반 선택</option>';
        classes.forEach(function (c) {
          opts += '<option value="' + (c.id || '') + '">' + esc(c.name) + '</option>';
        });
        tEvalClass.innerHTML = opts;
        tEvalClass.value = val;
      }
      populateClassSelects(classes);
    } catch (e) { /* skip */ }
    var tbody = document.getElementById('tEvalBody');
    if (tbody && tEvalClass && tEvalClass.value) {
      loadEvalStudents();
    } else if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">반과 날짜를 선택해주세요.</td></tr>';
    }
  }

  if (tEvalClass) tEvalClass.addEventListener('change', loadEvalStudents);
  if (tEvalDate) tEvalDate.addEventListener('change', loadEvalStudents);

  async function loadEvalStudents() {
    var tbody = document.getElementById('tEvalBody');
    var classId = tEvalClass ? tEvalClass.value : '';
    var date = tEvalDate ? tEvalDate.value : '';
    if (!tbody || !classId || !date) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">반과 날짜를 선택해주세요.</td></tr>';
      return;
    }
    try {
      var res = await TG.apiRequest('/api/evaluations/students?class_id=' + classId + '&date=' + date);
      if (!res || !res.ok) throw new Error('fetch');
      var students = (await res.json()).data || [];
      renderEvalStudents(tbody, students);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">데이터를 불러올 수 없습니다.</td></tr>';
    }
  }

  function ratingSelect(name, uid, val) {
    var v = val || 3;
    var opts = '';
    for (var i = 5; i >= 1; i--) {
      var stars = '';
      for (var j = 0; j < 5; j++) stars += j < i ? '\u2605' : '\u2606';
      opts += '<option value="' + i + '"' + (v === i ? ' selected' : '') + '>' + stars + '</option>';
    }
    return '<select data-uid="' + uid + '" class="eval-' + name + '" style="padding:2px 4px;border:1px solid var(--color-border);border-radius:4px;font-size:12px;">' + opts + '</select>';
  }

  function renderEvalStudents(tbody, students) {
    if (!students.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">학생이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = students.map(function (s) {
      var id = s.user_id;
      return '<tr data-student="' + id + '">' +
        '<td><strong>' + esc(s.student_name || '') + '</strong><br><span style="font-size:11px;color:var(--color-text-sub);">' + esc(s.student_grade || '') + '</span></td>' +
        '<td style="text-align:center;">' + ratingSelect('attitude', id, s.attitude) + '</td>' +
        '<td style="text-align:center;">' + ratingSelect('participation', id, s.participation) + '</td>' +
        '<td style="text-align:center;">' + ratingSelect('comprehension', id, s.comprehension) + '</td>' +
        '<td style="text-align:center;">' + ratingSelect('task_performance', id, s.task_performance) + '</td>' +
        '<td><input type="text" value="' + esc(s.comment || '') + '" data-uid="' + id + '" class="eval-comment" placeholder="코멘트" style="width:120px;padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;font-size:12px;"></td>' +
      '</tr>';
    }).join('');
  }

  var saveEvalBtn = document.getElementById('tSaveEval');
  if (saveEvalBtn) {
    saveEvalBtn.addEventListener('click', async function () {
      var classId = tEvalClass ? tEvalClass.value : '';
      var date = tEvalDate ? tEvalDate.value : '';
      if (!classId || !date) { TG.showToast('반과 날짜를 선택해주세요.', 'error'); return; }

      var records = [];
      document.querySelectorAll('#tEvalBody tr[data-student]').forEach(function (tr) {
        var uid = tr.dataset.student;
        records.push({
          student_id: parseInt(uid),
          attitude: parseInt((tr.querySelector('.eval-attitude') || {}).value || 3),
          participation: parseInt((tr.querySelector('.eval-participation') || {}).value || 3),
          comprehension: parseInt((tr.querySelector('.eval-comprehension') || {}).value || 3),
          task_performance: parseInt((tr.querySelector('.eval-task_performance') || {}).value || 3),
          comment: (tr.querySelector('.eval-comment') || {}).value || ''
        });
      });

      if (!records.length) { TG.showToast('평가할 학생이 없습니다.', 'error'); return; }

      saveEvalBtn.disabled = true;
      saveEvalBtn.textContent = '저장 중...';
      try {
        var res = await TG.apiRequest('/api/evaluations', {
          method: 'POST',
          body: JSON.stringify({ class_id: parseInt(classId), date: date, records: records })
        });
        if (!res || !res.ok) {
          var err = await res.json().catch(function () { return {}; });
          throw new Error(err.error || '저장 실패');
        }
        var result = await res.json().catch(function () { return {}; });
        TG.showToast(result.message || '평가가 저장되었습니다.');
      } catch (e) {
        TG.showToast(e.message || '평가 저장 실패', 'error');
      } finally {
        saveEvalBtn.disabled = false;
        saveEvalBtn.textContent = '평가 저장 & 학부모 알림';
      }
    });
  }

  // ── Homework ──
  var tAddHwBtn = document.getElementById('tAddHwBtn');
  var tHwFormWrap = document.getElementById('tHwFormWrap');
  var tHwForm = document.getElementById('tHwForm');

  if (tAddHwBtn && tHwFormWrap) {
    tAddHwBtn.addEventListener('click', function () {
      tHwFormWrap.style.display = tHwFormWrap.style.display === 'none' ? '' : 'none';
    });
  }

  if (tHwForm) {
    tHwForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(tHwForm);
      var body = {};
      fd.forEach(function (v, k) { body[k] = v; });
      var btn = tHwForm.querySelector('button[type="submit"]');
      var originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
      try {
        var res = await TG.apiRequest('/api/teacher/homework', { method: 'POST', body: JSON.stringify(body) });
        if (!res || !res.ok) {
          var err = await res.json().catch(function () { return {}; });
          throw new Error(err.error || '등록 실패');
        }
        TG.showToast('숙제가 등록되었습니다.');
        tHwForm.reset();
        tHwFormWrap.style.display = 'none';
        loadHomework();
      } catch (e) {
        TG.showToast(e.message || '숙제 등록 실패', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
      }
    });
  }

  async function loadHomework() {
    var tbody = document.getElementById('tHwTableBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/teacher/homework');
      if (!res || !res.ok) throw new Error('fetch');
      var rows = (await res.json()).data || [];
      renderHomework(tbody, rows);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">숙제 목록을 불러올 수 없습니다.</td></tr>';
    }
    // Populate class select
    try {
      var res2 = await TG.apiRequest('/api/teacher/classes');
      if (!res2 || !res2.ok) throw new Error('fetch');
      populateClassSelects((await res2.json()).data || []);
    } catch (e) { /* selects stay as-is */ }
  }

  function renderHomework(tbody, rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">등록된 숙제가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (h) {
      var done = h.done_count || 0;
      var total = h.total_count || 0;
      var pct = total ? Math.round((done / total) * 100) : 0;
      return '<tr><td>' + esc(h.class_name || '') + '</td><td>' + esc(h.title || '') + '</td><td>' +
        (h.due_date || '').slice(0, 10) + '</td><td>' + done + '/' + total + ' (' + pct + '%)</td></tr>';
    }).join('');
  }

  // ── Scores ──
  var tAddExamBtn = document.getElementById('tAddExamBtn');
  var tExamFormWrap = document.getElementById('tExamFormWrap');
  var tExamForm = document.getElementById('tExamForm');

  if (tAddExamBtn && tExamFormWrap) {
    tAddExamBtn.addEventListener('click', function () {
      tExamFormWrap.style.display = tExamFormWrap.style.display === 'none' ? '' : 'none';
    });
  }

  if (tExamForm) {
    tExamForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(tExamForm);
      var body = {};
      fd.forEach(function (v, k) { body[k] = v; });
      var btn = tExamForm.querySelector('button[type="submit"]');
      var originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
      try {
        var res = await TG.apiRequest('/api/teacher/exams', { method: 'POST', body: JSON.stringify(body) });
        if (!res || !res.ok) {
          var err = await res.json().catch(function () { return {}; });
          throw new Error(err.error || '등록 실패');
        }
        TG.showToast('시험이 등록되었습니다.');
        tExamForm.reset();
        tExamFormWrap.style.display = 'none';
        loadScores();
      } catch (e) {
        TG.showToast(e.message || '시험 등록 실패', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
      }
    });
  }

  async function loadScores() {
    var tbody = document.getElementById('tExamTableBody');
    if (!tbody) return;
    try {
      var res = await TG.apiRequest('/api/teacher/exams');
      if (!res || !res.ok) throw new Error('fetch');
      var rows = (await res.json()).data || [];
      renderExams(tbody, rows);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">시험 목록을 불러올 수 없습니다.</td></tr>';
    }
    try {
      var res2 = await TG.apiRequest('/api/teacher/classes');
      if (!res2 || !res2.ok) throw new Error('fetch');
      populateClassSelects((await res2.json()).data || []);
    } catch (e) { /* selects stay as-is */ }
  }

  function renderExams(tbody, rows) {
    var typeLabels = { midterm: '중간고사', final: '기말고사', quiz: '단원평가', mock: '모의고사' };
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">등록된 시험이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (ex) {
      return '<tr><td>' + esc(ex.class_name || '') + '</td><td>' + esc(ex.title || '') + '</td><td>' +
        (typeLabels[ex.exam_type] || esc(ex.exam_type || '')) + '</td><td>' +
        (ex.date || '').slice(0, 10) + '</td><td>' + (ex.score_count || 0) + '명</td>' +
        '<td><button class="btn btn--sm btn--ghost" data-exam-id="' + ex.id + '" data-exam-title="' + esc(ex.title || '') + '">성적 입력</button></td></tr>';
    }).join('');
    tbody.querySelectorAll('[data-exam-id]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        openScoreModal(parseInt(btn.dataset.examId), btn.dataset.examTitle);
      });
    });
  }

  // ── Score Entry Modal ──
  var scoreModal = document.getElementById('scoreModal');
  var scoreModalClose = document.getElementById('scoreModalClose');
  var saveScoresBtn = document.getElementById('saveScoresBtn');
  var currentExamId = null;

  if (scoreModalClose) {
    scoreModalClose.addEventListener('click', function () {
      if (scoreModal) scoreModal.style.display = 'none';
    });
  }
  if (scoreModal) {
    scoreModal.addEventListener('click', function (e) {
      if (e.target === scoreModal) scoreModal.style.display = 'none';
    });
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('scoreModal');
      if (modal && modal.style.display !== 'none') {
        modal.style.display = 'none';
      }
    }
  });

  window.openScoreModal = async function (examId, examTitle) {
    currentExamId = examId;
    var titleEl = document.getElementById('scoreModalTitle');
    var tbody = document.getElementById('scoreModalBody');
    if (titleEl) titleEl.textContent = examTitle + ' - 성적 입력';
    if (scoreModal) scoreModal.style.display = 'flex';
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">로딩 중...</td></tr>';

    try {
      var res = await TG.apiRequest('/api/teacher/exams/' + examId + '/scores');
      if (!res || !res.ok) throw new Error('fetch');
      var students = (await res.json()).data || [];
      if (!students.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">학생이 없습니다.</td></tr>';
        return;
      }
      tbody.innerHTML = students.map(function (s) {
        return '<tr>' +
          '<td>' + esc(s.student_name || '') + '</td>' +
          '<td><input type="number" value="' + (s.score != null ? s.score : '') + '" data-uid="' + s.user_id + '" class="score-input" min="0" style="width:70px;padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;font-size:13px;"></td>' +
          '<td><input type="text" value="' + esc(s.grade || '') + '" data-uid="' + s.user_id + '" class="grade-input" style="width:50px;padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;font-size:13px;" placeholder="A+"></td>' +
          '<td><input type="text" value="' + esc(s.note || '') + '" data-uid="' + s.user_id + '" class="score-note" style="width:100px;padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;font-size:13px;"></td>' +
        '</tr>';
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table__empty">성적 데이터를 불러올 수 없습니다.</td></tr>';
    }
  };

  if (saveScoresBtn) {
    saveScoresBtn.addEventListener('click', async function () {
      if (!currentExamId) return;
      var records = [];
      document.querySelectorAll('#scoreModalBody tr').forEach(function (tr) {
        var scoreInput = tr.querySelector('.score-input');
        var gradeInput = tr.querySelector('.grade-input');
        var noteInput = tr.querySelector('.score-note');
        if (scoreInput && scoreInput.value !== '') {
          records.push({
            user_id: parseInt(scoreInput.dataset.uid),
            score: parseInt(scoreInput.value),
            grade: gradeInput ? gradeInput.value : '',
            note: noteInput ? noteInput.value : ''
          });
        }
      });
      if (!records.length) { TG.showToast('입력된 점수가 없습니다.', 'error'); return; }
      var originalText = saveScoresBtn.textContent;
      saveScoresBtn.disabled = true;
      saveScoresBtn.textContent = '저장 중...';
      try {
        var res = await TG.apiRequest('/api/teacher/exams/' + currentExamId + '/scores', {
          method: 'POST',
          body: JSON.stringify({ records: records })
        });
        if (!res || !res.ok) {
          var err = await res.json().catch(function () { return {}; });
          throw new Error(err.error || '저장 실패');
        }
        TG.showToast('성적이 저장되었습니다.');
        scoreModal.style.display = 'none';
        loadScores();
      } catch (e) {
        TG.showToast(e.message || '성적 저장 실패', 'error');
      } finally {
        saveScoresBtn.disabled = false;
        saveScoresBtn.textContent = originalText;
      }
    });
  }

  // ── Helpers ──
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  var esc = window.escapeHTML || (TG && TG.escapeHTML) || function(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'):'';};
})();
