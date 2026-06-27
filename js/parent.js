/* parent.js - Parent Portal */
if (typeof TG === 'undefined') window.TG = { escapeHTML: function(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'):''}, showToast: function(){}, isLoggedIn: function(){return false;}, getUser: function(){return null;}, apiRequest: function(){return Promise.reject(new Error('TG not loaded'));}, formatDate: function(d){return d||'';} };

(function () {
  'use strict';

  /* local escapeHTML helper - use TG.escapeHTML if available */
  function escapeHTML(s) {
    if (TG.escapeHTML) return TG.escapeHTML(s);
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
  }

  var now = new Date();
  var currentYear = now.getFullYear();
  var currentMonth = now.getMonth();
  var attendanceData = {};

  /* --- Auth: member 이상만 접근 --- */
  if (TG.isLoggedIn()) {
    var user = TG.getUser();
    if (!user || (user.role !== 'member' && user.role !== 'director' && user.role !== 'admin')) {
      TG.showToast('학부모(정회원) 권한이 필요합니다.', 'error');
      window.location.href = 'index.html';
      return;
    }
  }

  /* --- Initialize UI (no demo data) --- */
  initCalendar();
  initSettings();
  renderTeacherComments();

  if (TG.isLoggedIn()) {
    /* Show loading placeholders, then load real data from API */
    showLoadingStates();
    loadAttendanceFromAPI();
    loadGradesFromAPI();
    loadHomeworkFromAPI();
    loadEvalCards();
  } else {
    /* Not logged in: explicit empty states */
    showEmptyStates();
  }

  /* --- Loading / empty state helpers --- */
  function showLoadingStates() {
    setQuickStats('…', '…', '…');
    var gradeBody = document.getElementById('gradeBody');
    if (gradeBody) gradeBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-light);">불러오는 중...</td></tr>';
    var homeworkList = document.getElementById('homeworkList');
    if (homeworkList) homeworkList.innerHTML = '<div style="text-align:center;padding:var(--space-8);color:var(--color-text-light);">불러오는 중...</div>';
  }

  function showEmptyStates() {
    setQuickStats('-', '-', '-');
    updateSummary({});
    var gradeBody = document.getElementById('gradeBody');
    if (gradeBody) gradeBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-light);">성적 정보가 없습니다.</td></tr>';
    clearGradeChart();
    var homeworkList = document.getElementById('homeworkList');
    if (homeworkList) homeworkList.innerHTML = '<div style="text-align:center;padding:var(--space-8);color:var(--color-text-light);">숙제 정보가 없습니다.</div>';
  }

  function setQuickStats(attendance, grade, homework) {
    var el;
    el = document.getElementById('quickAttendance'); if (el) el.textContent = attendance;
    el = document.getElementById('quickGrade'); if (el) el.textContent = grade;
    el = document.getElementById('quickHomework'); if (el) el.textContent = homework;
  }

  /* 선생님 코멘트는 전용 API가 없어 빈 상태만 표시 (헤더 보존) */
  function renderTeacherComments() {
    var container = document.getElementById('teacherComments');
    if (!container) return;
    container.innerHTML = '<h4 style="font-size:1rem;font-weight:600;margin-bottom:.75rem">&#128172; 선생님 코멘트</h4>' +
      '<div style="text-align:center;padding:var(--space-6);color:var(--color-text-light);">선생님 의견이 없습니다.</div>';
  }

  /* ========================
     Attendance Calendar
     ======================== */
  function initCalendar() {
    var prevBtn = document.getElementById('prevMonth');
    var nextBtn = document.getElementById('nextMonth');
    if (prevBtn) prevBtn.addEventListener('click', function () { changeMonth(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { changeMonth(1); });
    renderCalendar();
  }

  function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
    if (TG.isLoggedIn()) loadAttendanceFromAPI();
  }

  function renderCalendar() {
    var titleEl = document.getElementById('calendarTitle');
    var daysEl = document.getElementById('calendarDays');
    if (!titleEl || !daysEl) return;

    titleEl.textContent = currentYear + '년 ' + (currentMonth + 1) + '월';

    var firstDay = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    var html = '';
    for (var i = 0; i < firstDay; i++) {
      html += '<div class="calendar__day"></div>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var key = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var status = attendanceData[key] || '';
      var cls = status ? ' calendar__day--' + status : '';
      var statusLabels = { present: '출석', absent: '결석', late: '지각', excused: '사유결석' };
      var label = statusLabels[status] || '';
      html += '<div class="calendar__day' + cls + '"' + (label ? ' title="' + label + '" aria-label="' + d + '일 ' + label + '"' : '') + '>' + d + '</div>';
    }
    daysEl.innerHTML = html;
  }

  async function loadAttendanceFromAPI() {
    try {
      var ym = currentYear + '-' + String(currentMonth + 1).padStart(2, '0');
      var res = await TG.apiRequest('/api/attendance?month=' + ym);
      if (!res || !res.ok) throw new Error('API unavailable');
      var data = await res.json();
      attendanceData = {};
      (data.data || data.records || []).forEach(function (r) {
        attendanceData[r.date] = r.status;
      });
      renderCalendar();
      updateSummary(data.summary || {});
    } catch (err) {
      /* API 실패: 캘린더는 빈 상태, 요약 수치는 '-'(가짜 0 표시 방지) */
      attendanceData = {};
      renderCalendar();
      var ids = ['presentCount', 'absentCount', 'lateCount', 'excusedCount', 'quickAttendance'];
      ids.forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = '-'; });
    }
  }

  function updateSummary(s) {
    var present = (s && s.present != null) ? s.present : 0;
    var absent = (s && s.absent != null) ? s.absent : 0;
    var late = (s && s.late != null) ? s.late : 0;
    var excused = (s && s.excused != null) ? s.excused : 0;
    var el;
    el = document.getElementById('presentCount'); if (el) el.textContent = present;
    el = document.getElementById('absentCount'); if (el) el.textContent = absent;
    el = document.getElementById('lateCount'); if (el) el.textContent = late;
    el = document.getElementById('excusedCount'); if (el) el.textContent = excused;
    /* 출석률 quick stat 갱신 */
    var quick = document.getElementById('quickAttendance');
    if (quick) {
      var total = present + absent + late + excused;
      quick.textContent = total ? Math.round(((present + late) / total) * 100) + '%' : '0%';
    }
  }

  /* ========================
     Grades
     ======================== */
  async function loadGradesFromAPI() {
    var tbody = document.getElementById('gradeBody');
    var canvas = document.getElementById('gradeChart');

    try {
      var res = await TG.apiRequest('/api/grades/scores');
      if (!res || !res.ok) throw new Error('API unavailable');
      var data = await res.json();
      var scores = data.data || data.scores || [];
      if (scores.length) {
        if (tbody) renderGradeTable(tbody, scores);
        var quick = document.getElementById('quickGrade');
        if (quick) quick.textContent = (scores[0].grade || '') + (scores[0].score != null ? ' (' + scores[0].score + ')' : '');
      } else {
        setGradeTableMessage(tbody, '성적 정보가 없습니다.');
        var q1 = document.getElementById('quickGrade'); if (q1) q1.textContent = '-';
      }
    } catch (err) {
      setGradeTableMessage(tbody, '데이터를 불러올 수 없습니다.');
      var q2 = document.getElementById('quickGrade'); if (q2) q2.textContent = '-';
    }

    try {
      var trendRes = await TG.apiRequest('/api/grades/scores/trend');
      if (!trendRes || !trendRes.ok) throw new Error('API unavailable');
      var trendData = await trendRes.json();
      if (canvas && trendData.labels && trendData.labels.length && trendData.values && trendData.values.length) {
        hideGradeChartFallback();
        drawSimpleChart(canvas.getContext('2d'), canvas, trendData.labels, trendData.values);
      } else {
        clearGradeChart();
      }
    } catch (err) {
      clearGradeChart();
    }
  }

  function setGradeTableMessage(tbody, msg) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-light);">' + msg + '</td></tr>';
  }

  /* 정적 가짜 막대 차트(gradeChartFallback)를 숨김 */
  function hideGradeChartFallback() {
    var fb = document.getElementById('gradeChartFallback');
    if (fb) fb.style.display = 'none';
  }

  /* 추이 데이터 없음/오류: 캔버스 비우고 가짜 막대 차트 제거, 빈 상태 표시 */
  function clearGradeChart() {
    var canvas = document.getElementById('gradeChart');
    if (canvas && canvas.getContext) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    var fb = document.getElementById('gradeChartFallback');
    if (fb) {
      fb.innerHTML = '<div style="width:100%;text-align:center;color:var(--color-text-light);align-self:center;">성적 추이 정보가 없습니다.</div>';
      fb.style.display = 'flex';
      fb.style.alignItems = 'center';
    }
  }

  function renderGradeTable(tbody, scores) {
    tbody.innerHTML = scores.map(function (s) {
      return '<tr>' +
        '<td>' + escapeHTML(s.exam_name || '') + '</td>' +
        '<td>' + escapeHTML(s.subject || '') + '</td>' +
        '<td>' + (s.score != null ? s.score : '-') + '</td>' +
        '<td>' + escapeHTML(s.grade || '') + '</td>' +
        '<td>' + escapeHTML(s.date || '') + '</td>' +
      '</tr>';
    }).join('');
  }

  function drawSimpleChart(ctx, canvas, labels, values) {
    var w = canvas.width = canvas.offsetWidth || canvas.parentElement.offsetWidth || 400;
    var h = canvas.height = 300;
    if (w <= 0) return;
    var padding = 40;
    var max = Math.max.apply(null, values) || 100;
    var min = Math.min.apply(null, values) || 0;
    var range = max - min || 1;
    var stepX = (w - padding * 2) / (labels.length - 1 || 1);

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      var y = padding + ((h - padding * 2) * i) / 4;
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(w - padding, y); ctx.stroke();
    }

    ctx.strokeStyle = '#E87A3A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    labels.forEach(function (label, idx) {
      var x = padding + idx * stepX;
      var y = h - padding - ((values[idx] - min) / range) * (h - padding * 2);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#E87A3A';
    labels.forEach(function (label, idx) {
      var x = padding + idx * stepX;
      var y = h - padding - ((values[idx] - min) / range) * (h - padding * 2);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = '#6B7280';
    ctx.font = '11px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach(function (label, idx) {
      var x = padding + idx * stepX;
      ctx.fillText(label, x, h - 10);
    });
  }

  /* ========================
     Homework
     ======================== */
  async function loadHomeworkFromAPI() {
    var container = document.getElementById('homeworkList');
    if (!container) return;
    try {
      var res = await TG.apiRequest('/api/homework');
      if (!res || !res.ok) throw new Error('API unavailable');
      var data = await res.json();
      var list = data.data || data.homework || [];
      if (!list.length) {
        container.innerHTML = '<div style="text-align:center;padding:var(--space-8);color:var(--color-text-light);">숙제 정보가 없습니다.</div>';
        var qEmpty = document.getElementById('quickHomework'); if (qEmpty) qEmpty.textContent = '-';
        return;
      }
      renderHomework(container, list);
      var submitted = list.filter(function (h) { return h.status === 'submitted'; }).length;
      var quick = document.getElementById('quickHomework'); if (quick) quick.textContent = submitted + '/' + list.length;
    } catch (err) {
      container.innerHTML = '<div style="text-align:center;padding:var(--space-8);color:var(--color-text-light);">데이터를 불러올 수 없습니다.</div>';
      var qErr = document.getElementById('quickHomework'); if (qErr) qErr.textContent = '-';
    }
  }

  function renderHomework(container, list) {
    container.innerHTML = list.map(function (hw) {
      var statusIcon = hw.status === 'submitted' ? '&#9989;' : (hw.status === 'overdue' ? '&#10060;' : '&#9744;');
      var statusText = hw.status === 'submitted' ? '제출완료' : (hw.status === 'overdue' ? '기한초과' : '미제출');
      return '<div class="hw-item">' +
        '<div class="hw-item__status" title="' + statusText + '" aria-label="' + statusText + '">' + statusIcon + '</div>' +
        '<div class="hw-item__title">' + escapeHTML(hw.title || '') + '</div>' +
        '<div class="hw-item__due">' + escapeHTML(hw.due_date || '') + '</div>' +
        (hw.status === 'pending'
          ? '<button class="btn btn--sm btn--primary" data-hw-id="' + hw.id + '">제출</button>'
          : '<span class="badge badge--' + (hw.status === 'submitted' ? 'success' : 'error') + '">' + (hw.status === 'submitted' ? '제출완료' : '기한초과') + '</span>'
        ) +
      '</div>';
    }).join('');

    if (container._hwClickHandler) {
      container.removeEventListener('click', container._hwClickHandler);
    }
    container._hwClickHandler = function (e) {
      var btn = e.target.closest('[data-hw-id]');
      if (!btn) return;
      submitHomework(btn.dataset.hwId, btn);
    };
    container.addEventListener('click', container._hwClickHandler);
  }

  async function submitHomework(hwId, btn) {
    btn.disabled = true;
    btn.textContent = '제출 중...';
    try {
      var res = await TG.apiRequest('/api/homework/' + encodeURIComponent(hwId) + '/submit', {
        method: 'PUT',
        body: JSON.stringify({ status: 'submitted' })
      });
      if (res && res.ok) {
        TG.showToast('숙제가 제출되었습니다.');
        var container = document.getElementById('homeworkList');
        if (container) {
          var refreshRes = await TG.apiRequest('/api/homework');
          if (refreshRes && refreshRes.ok) {
            var refreshData = await refreshRes.json();
            renderHomework(container, refreshData.data || []);
          }
        }
      } else {
        TG.showToast('제출에 실패했습니다.', 'error');
        btn.disabled = false;
        btn.textContent = '제출';
      }
    } catch (err) {
      TG.showToast('네트워크 오류가 발생했습니다.', 'error');
      btn.disabled = false;
      btn.textContent = '제출';
    }
  }

  /* ========================
     Settings
     ======================== */
  function initSettings() {
    var btn = document.getElementById('saveSettings');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      var settings = {
        attendance: document.getElementById('notify-attendance').checked,
        grade: document.getElementById('notify-grade').checked,
        homework: document.getElementById('notify-homework').checked,
        monthly: document.getElementById('notify-monthly').checked,
        event: document.getElementById('notify-event').checked
      };
      btn.disabled = true;
      var origText = btn.textContent;
      btn.textContent = '저장 중...';
      try {
        var res = await TG.apiRequest('/api/notify/settings', {
          method: 'PUT',
          body: JSON.stringify(settings)
        });
        if (res && res.ok) {
          TG.showToast('알림 설정이 저장되었습니다.');
        } else {
          TG.showToast('설정 저장에 실패했습니다.', 'error');
        }
      } catch (err) {
        TG.showToast('네트워크 오류가 발생했습니다.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
    });
  }

  // ── 일일평가 탭 ──
  async function loadEvalCards() {
    var container = document.getElementById('evalCards');
    if (!container) return;
    try {
      var res = await TG.apiRequest('/api/evaluations/my?per_page=5');
      if (!res || !res.ok) throw new Error('fetch');
      var data = await res.json();
      var rows = data.data || [];
      if (!rows.length) {
        container.innerHTML = '<div style="text-align:center;padding:var(--space-8);color:var(--color-text-light);">등록된 평가가 없습니다.</div>';
        return;
      }
      container.innerHTML = rows.map(function(ev) {
        var stars = function(n) { var s=''; for(var i=0;i<5;i++) s += i<n ? '\u2605' : '\u2606'; return s; };
        var html = '<div class="card" style="padding:var(--space-4);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2);">' +
            '<strong style="color:var(--color-primary);">' + escapeHTML(ev.date || '') + '</strong>' +
            '<span style="font-size:var(--text-xs);color:var(--color-text-sub);background:var(--color-bg);padding:2px 8px;border-radius:10px;">' + escapeHTML(ev.class_name || '') + '</span>' +
          '</div>' +
          '<div style="font-size:var(--text-xs);color:var(--color-text-sub);margin-bottom:var(--space-2);">' + escapeHTML(ev.teacher_name || '') + ' 선생님</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-1);font-size:var(--text-sm);">' +
            '<div>수업태도 <span style="color:#f6ad55;">' + stars(ev.attitude||0) + '</span></div>' +
            '<div>참여도 <span style="color:#f6ad55;">' + stars(ev.participation||0) + '</span></div>' +
            '<div>이해도 <span style="color:#f6ad55;">' + stars(ev.comprehension||0) + '</span></div>' +
            '<div>과제수행 <span style="color:#f6ad55;">' + stars(ev.task_performance||0) + '</span></div>' +
          '</div>';
        if (ev.comment) {
          html += '<div style="margin-top:var(--space-2);padding:var(--space-2) var(--space-3);background:var(--color-bg);border-radius:var(--radius-md);font-size:var(--text-sm);">' + escapeHTML(ev.comment) + '</div>';
        }
        html += '</div>';
        return html;
      }).join('');
    } catch(e) {
      container.innerHTML = '<div style="text-align:center;padding:var(--space-8);color:var(--color-text-light);">평가 데이터를 불러올 수 없습니다.</div>';
    }
  }
})();
