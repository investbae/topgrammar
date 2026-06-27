/* leveltest.js — 레벨테스트 엔진 (중1~고3, 4영역) */
(function () {
  'use strict';

  if (typeof TG === 'undefined') {
    window.TG = {
      showToast: function () {},
      escapeHTML: function (s) {
        if (!s) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      },
      isLoggedIn: function () { return false; },
      getUser: function () { return null; },
      trackEvent: function () {}
    };
  }
  if (typeof TG.showToast !== 'function') TG.showToast = function () {};

  var _esc = (typeof escapeHTML === 'function') ? escapeHTML : TG.escapeHTML;

  /* --- DOM refs --- */
  var stepGate = document.getElementById('step-login-gate');
  var stepInfo = document.getElementById('step-info');
  var stepQuestions = document.getElementById('step-questions');
  var stepResult = document.getElementById('step-result');
  if (!stepInfo) return;

  /* --- State --- */
  var userInfo = {};
  var questions = [];      // flat array of all questions for selected grade
  var sectionMeta = [];    // [{name, icon, start, end}, ...]
  var answers = {};        // idx -> selected option (MC) or string (writing)
  var currentIdx = 0;
  var totalQ = 0;

  /* --- Sections config --- */
  var SECTIONS = [
    { key: 'listening', name: '듣기', icon: '\uD83C\uDFA7', count: 10 },
    { key: 'grammar',   name: '문법', icon: '\uD83D\uDCDD', count: 10 },
    { key: 'reading',   name: '독해', icon: '\uD83D\uDCD6', count: 10 },
    { key: 'writing',   name: '서술형', icon: '\u270D\uFE0F', count: 10 }
  ];

  var TIMER_LIMIT = 90 * 60;
  var timerInterval = null;
  var elapsedSeconds = 0;
  var timerEl = document.getElementById('testTimer');

  /* --- Timer --- */
  function startTimer() {
    stopTimer();
    elapsedSeconds = 0;
    updateTimer();
    timerInterval = setInterval(function () {
      elapsedSeconds++;
      updateTimer();
      if (elapsedSeconds >= TIMER_LIMIT) {
        TG.showToast('제한 시간(90분)이 초과되어 자동 제출됩니다.', 'error');
        submitTest();
      }
    }, 1000);
  }
  function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
  function updateTimer() {
    if (!timerEl) return;
    var m = Math.floor(elapsedSeconds / 60), s = elapsedSeconds % 60;
    timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    if (elapsedSeconds >= TIMER_LIMIT - 60) timerEl.style.color = 'var(--color-error)';
  }
  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + '분 ' + (s < 10 ? '0' : '') + s + '초';
  }

  /* --- Load questions for selected grade --- */
  function loadQuestions(grade) {
    if (typeof QUESTION_BANK === 'undefined' || !QUESTION_BANK[grade]) {
      TG.showToast('해당 학년의 문제가 준비되지 않았습니다.', 'error');
      return false;
    }
    var bank = QUESTION_BANK[grade];
    questions = [];
    sectionMeta = [];
    var idx = 0;
    SECTIONS.forEach(function (sec) {
      var pool = bank[sec.key] || [];
      var picked = pickWithPidGrouping(pool, sec.count);
      sectionMeta.push({ name: sec.name, icon: sec.icon, key: sec.key, start: idx, end: idx + picked.length - 1 });
      picked.forEach(function (q) {
        q._section = sec.key;
        q._sectionName = sec.name;
        questions.push(q);
        idx++;
      });
    });
    totalQ = questions.length;
    return totalQ > 0;
  }

  /* Pick questions keeping pid-grouped items adjacent */
  function pickWithPidGrouping(pool, count) {
    var grouped = {}, singles = [];
    pool.forEach(function (q) {
      if (q.pid) {
        if (!grouped[q.pid]) grouped[q.pid] = [];
        grouped[q.pid].push(q);
      } else {
        singles.push(q);
      }
    });
    var groups = Object.keys(grouped).map(function (k) { return grouped[k]; });
    groups = shuffle(groups);
    singles = shuffle(singles);
    var result = [], remaining = count;
    for (var i = 0; i < groups.length && remaining > 0; i++) {
      if (groups[i].length <= remaining) {
        groups[i].forEach(function (q) { result.push(q); });
        remaining -= groups[i].length;
      }
    }
    for (var j = 0; j < singles.length && remaining > 0; j++) {
      result.push(singles[j]);
      remaining--;
    }
    return result;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* --- Get current section info --- */
  function getCurrentSection() {
    for (var i = 0; i < sectionMeta.length; i++) {
      if (currentIdx >= sectionMeta[i].start && currentIdx <= sectionMeta[i].end) return sectionMeta[i];
    }
    return sectionMeta[0];
  }

  /* --- Render section tabs --- */
  function renderSectionTabs() {
    var tabsEl = document.getElementById('sectionTabs');
    if (!tabsEl) return;
    var html = '';
    sectionMeta.forEach(function (sec, i) {
      var cls = 'section-tab';
      if (currentIdx >= sec.start && currentIdx <= sec.end) cls += ' section-tab--active';
      // Count answered in this section
      var answered = 0;
      for (var j = sec.start; j <= sec.end; j++) {
        if (answers[j] !== undefined && answers[j] !== '') answered++;
      }
      var total = sec.end - sec.start + 1;
      html += '<button class="' + cls + '" data-sec="' + i + '">' +
        '<span class="section-tab__icon">' + sec.icon + '</span>' +
        '<span class="section-tab__name">' + _esc(sec.name) + '</span>' +
        '<span class="section-tab__count">' + answered + '/' + total + '</span>' +
      '</button>';
    });
    tabsEl.innerHTML = html;
    tabsEl.querySelectorAll('.section-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var si = parseInt(btn.dataset.sec, 10);
        currentIdx = sectionMeta[si].start;
        renderQuestion();
      });
    });
  }

  /* --- Render question --- */
  function renderQuestion() {
    var area = document.getElementById('questionArea');
    var counter = document.getElementById('questionCounter');
    var bar = document.getElementById('progressBar');
    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    if (!area) return;

    var q = questions[currentIdx];
    var sec = getCurrentSection();

    if (counter) counter.textContent = (currentIdx + 1) + ' / ' + totalQ;
    if (bar) bar.style.width = (((currentIdx + 1) / totalQ) * 100) + '%';
    if (prevBtn) prevBtn.disabled = currentIdx === 0;
    if (nextBtn) {
      var isLast = currentIdx === totalQ - 1;
      nextBtn.textContent = isLast ? '제출하기' : '다음';
      nextBtn.className = isLast ? 'btn btn--accent btn--lg' : 'btn btn--primary';
    }

    renderSectionTabs();

    /* Section header when entering new section */
    var sectionHeader = '';
    if (currentIdx === sec.start) {
      sectionHeader = '<div class="section-header">' +
        '<span class="section-header__icon">' + sec.icon + '</span>' +
        '<span class="section-header__title">' + _esc(sec.name) + ' 영역</span>' +
        '<span class="section-header__info">' + (sec.end - sec.start + 1) + '문항</span>' +
      '</div>';
    }

    var html = sectionHeader;

    if (q._section === 'writing') {
      html += renderWritingQuestion(q, currentIdx);
    } else {
      html += renderMCQuestion(q, currentIdx);
    }

    area.innerHTML = html;
    bindQuestionEvents(q, currentIdx);
  }

  /* --- MC question (listening, grammar, reading) --- */
  function renderMCQuestion(q, idx) {
    var passageHtml = '';
    if (q.passage) {
      // Check if same passage as previous question
      var showPassage = true;
      if (idx > 0 && questions[idx - 1].pid && q.pid && questions[idx - 1].pid === q.pid) {
        showPassage = false;
      }
      if (showPassage) {
        var pText = _esc(q.passage).replace(/\\n/g, '\n').replace(/\n/g, '<br>');
        var label = q._section === 'listening' ? '다음 대화를 읽고 물음에 답하시오.' : '다음 글을 읽고 물음에 답하시오.';
        passageHtml = '<div class="q-direction">' + label + '</div>' +
          '<div class="q-passage">' + pText + '</div>';
      }
    }

    var qText = _esc(q.question);
    var options = q.options || [];

    return '<div class="leveltest-question">' +
      passageHtml +
      '<fieldset style="border:none;margin:0;padding:0;">' +
      '<legend class="leveltest-question__text">' + (idx + 1) + '. ' + qText + '</legend>' +
      '<div class="q-options" role="radiogroup">' +
      options.map(function (opt, i) {
        var sel = answers[idx] === i ? ' is-selected' : '';
        var num = String.fromCharCode(9312 + i); // ①②③④
        return '<button class="leveltest-option' + sel + '" data-idx="' + i + '" role="radio" aria-checked="' + (answers[idx] === i) + '">' +
          '<span class="opt-num">' + num + '</span> ' + _esc(opt) +
        '</button>';
      }).join('') +
      '</div></fieldset></div>';
  }

  /* --- Writing question (서술형) --- */
  function renderWritingQuestion(q, idx) {
    var ctx = '';
    if (q.context) {
      ctx = '<div class="q-context">' + _esc(q.context).replace(/\\n/g, '\n').replace(/\n/g, '<br>') + '</div>';
    }
    var hint = '';
    if (q.hint) {
      hint = '<div class="q-hint"><strong>조건:</strong> ' + _esc(q.hint) + '</div>';
    }
    var val = answers[idx] !== undefined ? answers[idx] : '';

    return '<div class="leveltest-question leveltest-question--writing">' +
      '<div class="q-direction">다음 물음에 답을 직접 쓰시오.</div>' +
      ctx +
      '<div class="leveltest-question__text">' + (idx + 1) + '. ' + _esc(q.question) + '</div>' +
      hint +
      '<input type="text" class="form-input q-writing-input" id="writingAnswer" ' +
        'placeholder="답을 입력하세요" value="' + _esc(val) + '" autocomplete="off" spellcheck="false">' +
    '</div>';
  }

  /* --- Bind events --- */
  function bindQuestionEvents(q, idx) {
    if (q._section === 'writing') {
      var input = document.getElementById('writingAnswer');
      if (input) {
        input.addEventListener('input', function () { answers[idx] = input.value; });
        input.focus();
      }
    } else {
      var area = document.getElementById('questionArea');
      area.querySelectorAll('.leveltest-option').forEach(function (btn) {
        btn.addEventListener('click', function () {
          answers[idx] = parseInt(btn.dataset.idx, 10);
          area.querySelectorAll('.leveltest-option').forEach(function (b) {
            b.classList.remove('is-selected');
            b.setAttribute('aria-checked', 'false');
          });
          btn.classList.add('is-selected');
          btn.setAttribute('aria-checked', 'true');
        });
      });
    }
  }

  /* --- Submit & Score --- */
  function submitTest() {
    stopTimer();

    var sectionScores = {};
    sectionMeta.forEach(function (sec) {
      sectionScores[sec.key] = { correct: 0, total: 0, name: sec.name, icon: sec.icon };
    });

    questions.forEach(function (q, i) {
      var sec = q._section;
      sectionScores[sec].total++;

      if (sec === 'writing') {
        if (answers[i] !== undefined && answers[i] !== '') {
          var userAns = normalizeAnswer(answers[i]);
          var accepted = q.answers || [];
          for (var k = 0; k < accepted.length; k++) {
            if (normalizeAnswer(accepted[k]) === userAns) {
              sectionScores[sec].correct++;
              break;
            }
          }
        }
      } else {
        if (answers[i] !== undefined && answers[i] === q.answer) {
          sectionScores[sec].correct++;
        }
      }
    });

    var totalCorrect = 0, totalAll = 0;
    var analysisData = [];
    SECTIONS.forEach(function (s) {
      var sc = sectionScores[s.key];
      if (sc) {
        totalCorrect += sc.correct;
        totalAll += sc.total;
        analysisData.push({
          name: sc.icon + ' ' + sc.name,
          correct: sc.correct,
          total: sc.total,
          pct: sc.total > 0 ? Math.round((sc.correct / sc.total) * 100) : 0
        });
      }
    });

    var score = totalAll > 0 ? Math.round((totalCorrect / totalAll) * 100) : 0;
    var grade = userInfo.student_grade || '';

    var level, rec;
    if (score >= 90) { level = 'Advanced'; rec = gradeRec(grade, 'adv'); }
    else if (score >= 70) { level = 'Intermediate'; rec = gradeRec(grade, 'int'); }
    else if (score >= 50) { level = 'Pre-Intermediate'; rec = gradeRec(grade, 'pre'); }
    else { level = 'Beginner'; rec = gradeRec(grade, 'beg'); }

    // 결과를 백엔드에 저장 — 원장님이 관리자 페이지에서 응시 결과/연락처를 확인.
    // 저장 실패가 결과 화면을 막지 않도록 catch 후 무시.
    try {
      var payload = {
        name: (userInfo.name || ''),
        phone: (userInfo.phone || ''),
        student_grade: (userInfo.student_grade || ''),
        score: score,
        total: 100,
        level: level,
        detail: analysisData,
        consent: userInfo.consent === true
      };
      fetch('/api/leveltest/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) { /* ignore */ }

    showResult(score, level, rec, analysisData);
  }

  function gradeRec(grade, lvl) {
    var recs = {
      beg: '기초 문법부터 체계적으로 다지는 STEP 1 과정을 추천합니다.',
      pre: '핵심 문법을 집중 훈련하는 STEP 2 과정을 추천합니다.',
      int: '구문분석 중심의 STEP 3 과정을 추천합니다.',
      adv: '수능 실전 대비 STEP 4 과정을 추천합니다.'
    };
    if (grade.indexOf('고') === 0 && lvl === 'adv') {
      recs.adv = '수능 실전 모의고사 집중 훈련반을 추천합니다.';
    }
    return recs[lvl];
  }

  function normalizeAnswer(s) {
    return String(s).trim().toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,!?;:]+$/, '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s*,\s*/g, ', ');
  }

  /* --- Show Result --- 원장님 방침: 즉시 점수 비공개, 1~2일 내 상세분석을 문자·전화로 안내 --- */
  function showResult(score, level, rec, analysis) {
    showStep('result');
    var card = stepResult ? stepResult.querySelector('.result-card') : null;
    if (card) {
      card.innerHTML =
        '<div style="text-align:center;padding:var(--space-6) 0;">' +
          '<div style="font-size:3.2rem;line-height:1;margin-bottom:var(--space-4);">📩</div>' +
          '<h2 style="margin-bottom:var(--space-3);">레벨테스트가 정상 제출되었습니다</h2>' +
          '<p style="font-size:var(--text-base);color:var(--color-text-sub);line-height:1.85;margin-bottom:var(--space-6);">' +
            '응시해 주셔서 감사합니다.<br>영역별 <strong>상세 분석 결과(도표 포함)</strong>를 <strong>1~2일 이내</strong>에<br>' +
            '담당 강사가 <strong>문자와 전화</strong>로 자세히 안내드립니다.</p>' +
          '<div style="display:flex;justify-content:center;gap:var(--space-3);flex-wrap:wrap;">' +
            '<a href="tel:031-938-8889" class="btn btn--primary btn--lg btn--rounded">행신 031-938-8889</a>' +
            '<a href="tel:031-994-3090" class="btn btn--outline btn--lg btn--rounded">화정 031-994-3090</a>' +
            '<a href="payment.html#consult-form" class="btn btn--accent btn--lg btn--rounded">온라인 상담 신청</a>' +
          '</div>' +
        '</div>';
      var _h = card.querySelector('h2'); if (_h) { _h.setAttribute('tabindex','-1'); try { _h.focus(); } catch(e){} }
    }
  }
  /* --- Step switching --- */
  function showStep(step) {
    if (stepGate) stepGate.style.display = step === 'login-gate' ? '' : 'none';
    if (stepInfo) stepInfo.style.display = step === 'info' ? '' : 'none';
    if (stepQuestions) stepQuestions.style.display = step === 'questions' ? '' : 'none';
    if (stepResult) stepResult.style.display = step === 'result' ? '' : 'none';
    if (step === 'questions') startTimer();
    if (step === 'result') stopTimer();
  }

  /* --- Info form submit --- */
  var infoForm = document.getElementById('infoForm');
  if (infoForm) {
    infoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('lt-name').value.trim();
      var phone = document.getElementById('lt-phone').value.trim();
      var grade = document.getElementById('lt-grade').value;

      if (!name || !phone || !grade) {
        TG.showToast('모든 항목을 입력해 주세요.', 'error');
        return;
      }
      if (!/^[\d-]{10,13}$/.test(phone)) {
        TG.showToast('올바른 전화번호 형식이 아닙니다.', 'error');
        return;
      }
      var elConsent = document.getElementById('lt-consent');
      if (elConsent && !elConsent.checked) {
        TG.showToast('개인정보 수집·이용에 동의해 주세요.', 'error');
        return;
      }
      userInfo = { name: name, phone: phone, student_grade: grade, consent: true };

      if (!loadQuestions(grade)) {
        TG.showToast('문제를 불러올 수 없습니다.', 'error');
        return;
      }
      answers = {};
      currentIdx = 0;
      showStep('questions');
      renderQuestion();
    });
  }

  /* --- Navigation --- */
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  if (prevBtn) prevBtn.addEventListener('click', function () {
    if (currentIdx > 0) { currentIdx--; renderQuestion(); }
  });

  if (nextBtn) nextBtn.addEventListener('click', function () {
    if (currentIdx < totalQ - 1) {
      currentIdx++;
      renderQuestion();
    } else {
      // Confirm before submit
      var unanswered = 0;
      for (var i = 0; i < totalQ; i++) {
        if (answers[i] === undefined || answers[i] === '') unanswered++;
      }
      var msg = unanswered > 0
        ? '아직 ' + unanswered + '문제를 풀지 않았습니다. 제출하시겠습니까?'
        : '테스트를 제출하시겠습니까?';
      if (confirm(msg)) submitTest();
    }
  });

  /* --- Keyboard navigation --- */
  document.addEventListener('keydown', function (e) {
    if (stepQuestions && stepQuestions.style.display !== 'none') {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (e.target.tagName === 'INPUT') return;
        if (nextBtn) nextBtn.click();
      } else if (e.key === 'ArrowLeft') {
        if (prevBtn && !prevBtn.disabled) prevBtn.click();
      } else if (e.key >= '1' && e.key <= '4') {
        var q = questions[currentIdx];
        if (q && q._section !== 'writing') {
          var optIdx = parseInt(e.key, 10) - 1;
          var opts = document.querySelectorAll('.leveltest-option');
          if (opts[optIdx]) opts[optIdx].click();
        }
      }
    }
  });

  /* --- Prevent accidental navigation during test --- */
  window.addEventListener('beforeunload', function (e) {
    if (timerInterval) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* --- Init --- */
  // 누구나 무료 응시 가능(상담 리드 확보). 로그인 상태면 정보 자동 채움.
  showStep('info');
  if (TG.isLoggedIn && TG.isLoggedIn()) {
    var user = TG.getUser && TG.getUser();
    if (user) {
      var ni = document.getElementById('lt-name');
      var pi = document.getElementById('lt-phone');
      if (ni && (user.student_name || user.name)) ni.value = user.student_name || user.name;
      if (pi && user.phone) pi.value = user.phone;
    }
  }
})();
