/* 탑그래머 2학기 중간고사 결과 팝업 v2 — apply.py 가 수치·기간을 채워 results-popup.js 로 낸다(v2.4: 토론 3회 + Opus 판정 반영).
   기간: 2026-11-06 00:00 ~ 2026-12-06 00:00 KST(달력 1달 = 11/6~12/5) · 한 방문(세션)에 한 번 · «7일간 보지 않기»=7일째 자정까지
   구글 검색에서 휴대폰으로 들어온 첫 화면은 본문을 가리지 않는 작은 띠(방해형 전면 광고 신호 회피) */
(function () {
  'use strict';
  var START = new Date('2026-11-06T00:00:00+09:00').getTime();
  var UNTIL = new Date('2026-12-06T00:00:00+09:00').getTime();
  var KEY = 'tg_pop_2026_2mid';
  var P100 = '20', OVER90 = '47', MOCK100 = '4';
  var now = Date.now();
  if (now < START || now >= UNTIL) return;
  if (location.hash === '#exam-results') return;
  function get(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }
  function set(store, k, v) { try { window[store].setItem(k, v); } catch (e) {} }
  if (+(get('localStorage', KEY + '_hide') || 0) > now) return;
  if (get('sessionStorage', KEY + '_seen')) return;
  set('sessionStorage', KEY + '_t', '1');                       // 저장이 안 되는 브라우저면 쪽마다 다시 뜨므로 자동 노출을 끈다
  if (get('sessionStorage', KEY + '_t') !== '1') return;
  try { sessionStorage.removeItem(KEY + '_t'); } catch (e) {}

  var onHome = !!document.getElementById('exam-results');
  var href = onHome ? '#exam-results' : 'index.html#exam-results';
  var mq = function (q) { return !!(window.matchMedia && matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var mobile = mq('(max-width: 640px)');
  var fromGoogle = /^https?:\/\/([a-z0-9-]+\.)*google\./i.test(document.referrer || '');
  var isBot = /Googlebot|Google-InspectionTool|AdsBot-Google|bingbot|Yeti|Daumoa|DuckDuckBot|Applebot|YandexBot|Baiduspider|crawler|spider|slurp/i.test(navigator.userAgent || '');
  // 구글 검색에서 휴대폰으로 온 사람과 검색 로봇(구글봇 포함)은 같은 «작은 띠»를 본다(R3 Gemini).
  // 리퍼러가 빈 사람(카카오톡·직접 입력 등)과 다른 곳에서 온 사람은 운영자 지시대로 시트 — 빈 리퍼러로 들어온 구글 검색 사용자는 가려내지 못한다(R3 GPT: 정책 선택이지 해결이 아님).
  var MINI = mobile && (fromGoogle || isBot);

  var css = '' +
  '.tgp{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit;-webkit-font-smoothing:antialiased}' +
  '.tgp__dim{position:absolute;inset:0;background:rgba(14,27,39,.64);opacity:0;transition:opacity .3s ease}' +
  '.tgp__card{position:relative;width:min(440px,100%);max-height:calc(100vh - 48px);overflow:auto;overscroll-behavior:contain;background:#fff;border-radius:24px;' +
    'box-shadow:0 34px 90px rgba(8,18,28,.45);opacity:0;transform:translateY(20px) scale(.97);' +
    'transition:opacity .34s cubic-bezier(.2,.8,.2,1),transform .34s cubic-bezier(.2,.8,.2,1);outline:none}' +
  '.tgp.is-on .tgp__dim{opacity:1}.tgp.is-on .tgp__card{opacity:1;transform:none}' +
  '.tgp__hero{position:relative;overflow:hidden;padding:34px 30px 28px;text-align:center;color:#fff;' +
    'background:radial-gradient(110% 80% at 50% -12%,rgba(235,203,139,.30),rgba(235,203,139,0) 58%),linear-gradient(165deg,#21405b 0%,#192f43 46%,#0f1f2e 100%)}' +
  '.tgp__hero:before{content:"";position:absolute;inset:0;opacity:.5;pointer-events:none;' +
    'background-image:radial-gradient(rgba(235,203,139,.16) 1px,transparent 1.4px);background-size:22px 22px;' +
    '-webkit-mask-image:linear-gradient(180deg,#000,transparent 75%);mask-image:linear-gradient(180deg,#000,transparent 75%)}' +
  '.tgp__hero:after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,#b8914a,#ebcb8b 50%,#b8914a)}' +
  '.tgp__hero>*{position:relative}' +
  '.tgp__x{position:absolute!important;z-index:3;top:10px;right:10px;width:44px;height:44px;border:0;border-radius:50%;background:transparent;color:#e7edf2;' +
    'font-family:inherit;font-size:30px;line-height:44px;font-weight:300;cursor:pointer;transition:background .2s}' +
  '.tgp__x:hover,.tgp__x:focus-visible{background:rgba(255,255,255,.14);outline:none}' +
  '.tgp__seal{width:66px;height:66px;margin:0 auto 14px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
    'font-family:inherit;font-size:21px;font-weight:900;letter-spacing:-.03em;color:#192f43;' +
    'background:radial-gradient(circle at 34% 28%,#fff6dd 0%,#ebcb8b 52%,#c9a45c 100%);' +
    'box-shadow:0 0 0 5px rgba(235,203,139,.18),0 0 0 6px rgba(235,203,139,.35),0 12px 26px rgba(0,0,0,.32)}' +
  '.tgp__kicker{font:italic 600 15px/1.3 Georgia,"Times New Roman",serif;color:#ebcb8b;letter-spacing:.02em;margin:0 0 6px}' +
  '.tgp__eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:13.5px;font-weight:700;color:#dfe6ec;letter-spacing:.03em;margin:0 0 12px}' +
  '.tgp__eyebrow:before,.tgp__eyebrow:after{content:"";width:18px;height:1px;background:#c9a45c}' +
  '.tgp__title{margin:0;font-size:33px;line-height:1.2;font-weight:800;letter-spacing:-.025em;color:#fff;word-break:keep-all}' +
  '.tgp__title em{font-style:normal;color:#ebcb8b}' +
  '.tgp__stats{display:grid;grid-template-columns:1fr 1fr;background:#faf6ee;border-bottom:1px solid #efe6d4}' +
  '.tgp__stat{padding:17px 12px 15px;text-align:center}.tgp__stat+.tgp__stat{border-left:1px solid #e8dcc4}' +
  '.tgp__stat span{display:block;font-size:13.5px;font-weight:700;color:#4a5866;margin-bottom:3px;word-break:keep-all}' +
  '.tgp__stat em{display:block;font-style:normal;font-size:13px;font-weight:600;color:#6a5a43;margin-top:2px}' +
  '.tgp__stat b{font-size:29px;font-weight:800;color:#775831;letter-spacing:-.02em}.tgp__stat b small{font-size:15px;margin-left:2px;color:#5d4524}' +
  '.tgp__body{padding:20px 26px 18px;text-align:center}' +
  '.tgp__lead{margin:0 0 16px;font-size:15.5px;line-height:1.55;color:#2f3d4a;font-weight:600;word-break:keep-all}' +
  '.tgp__cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:56px;border:0;border-radius:14px;cursor:pointer;' +
    'background:linear-gradient(180deg,#f0d59d 0%,#ddb873 55%,#c9a45c 100%);color:#192f43;font:inherit;font-size:17px;font-weight:800;' +
    'text-decoration:none;letter-spacing:-.01em;box-shadow:0 1px 0 rgba(255,255,255,.55) inset,0 10px 22px rgba(160,120,50,.32);' +
    'transition:transform .15s,box-shadow .15s,filter .15s}' +
  '.tgp__cta:hover{transform:translateY(-1px);filter:brightness(1.03);box-shadow:0 1px 0 rgba(255,255,255,.55) inset,0 14px 28px rgba(160,120,50,.38)}' +
  '.tgp__cta:focus-visible{outline:3px solid #192f43;outline-offset:3px}.tgp__cta i{font-style:normal}' +
  '.tgp__fine{margin:12px 0 0;font-size:13px;line-height:1.5;color:#5b6773;word-break:keep-all}' +
  '.tgp__foot{position:sticky;bottom:0;display:flex;border-top:1px solid #e3e7eb;background:#fbfbfa}' +
  '.tgp__foot button{flex:1;min-height:50px;border:0;background:transparent;font:inherit;font-size:14.5px;font-weight:600;color:#4a5866;cursor:pointer}' +
  '.tgp__foot button+button{border-left:1px solid #dfe3e8;color:#192f43;font-weight:800}' +
  '.tgp__foot button:hover{background:#f2f4f6}.tgp__foot button:focus-visible{outline:3px solid #c9a45c;outline-offset:-3px}' +
  '#exam-results:focus{outline:none}' +
  '@media (max-width:640px){' +
    '.tgp{align-items:flex-end;padding:0}' +
    '.tgp__card{width:100%;max-height:86vh;max-height:min(86dvh,700px);border-radius:24px 24px 0 0;transform:translateY(100%);padding-bottom:env(safe-area-inset-bottom)}' +
    '.tgp__grab{position:absolute;z-index:3;top:0;left:50%;width:120px;height:26px;margin-left:-60px;display:flex;justify-content:center;padding-top:8px;touch-action:none}' +
    '.tgp__grab:before{content:"";width:40px;height:4px;border-radius:4px;background:rgba(255,255,255,.42)}' +
    '.tgp__hero{padding:30px 22px 22px}.tgp__seal{width:54px;height:54px;font-size:18px;margin-bottom:10px}' +
    '.tgp__kicker{display:none}.tgp__eyebrow{margin-bottom:10px}' +
    '.tgp__title{font-size:27px}.tgp__stat{padding:14px 10px 12px}.tgp__stat b{font-size:25px}.tgp__body{padding:16px 20px 14px}' +
    '.tgp__lead{margin-bottom:13px;font-size:15px}.tgp__fine{margin-top:10px}' +
  '}' +
  '@media (max-height:760px){.tgp__hero{padding:22px 26px 18px}.tgp__seal{width:48px;height:48px;font-size:16px;margin-bottom:8px}.tgp__kicker{display:none}' +
    '.tgp__title{font-size:28px}.tgp__stat{padding:12px 10px 10px}.tgp__stat b{font-size:24px}.tgp__body{padding:14px 22px 12px}.tgp__lead{margin-bottom:10px;font-size:14.5px}}' +
  '@media (max-width:640px) and (max-height:760px){.tgp__hero{padding:26px 20px 16px}.tgp__title{font-size:25px}}' +
  '@media (max-width:640px) and (max-height:620px){.tgp__card{max-height:94vh;max-height:94dvh}.tgp__seal{display:none}.tgp__hero{padding:28px 20px 14px}.tgp__eyebrow{margin-bottom:8px}}' +
  '@media (min-width:641px){.tgp__grab{display:none}}' +
  /* 작은 띠(구글 검색 휴대폰 첫 화면) */
  '.tgm{position:fixed;left:12px;right:12px;z-index:9000;display:flex;align-items:center;gap:12px;padding:12px 8px 12px 14px;border-radius:16px;' +
    'background:linear-gradient(165deg,#21405b,#192f43 60%,#0f1f2e);color:#fff;box-shadow:0 16px 36px rgba(8,18,28,.38);font-family:inherit;' +
    'opacity:0;transform:translateY(16px);transition:opacity .3s,transform .3s cubic-bezier(.2,.8,.2,1)}' +
  '.tgm.is-on{opacity:1;transform:none}' +
  '.tgm__seal{flex:0 0 auto;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#192f43;' +
    'background:radial-gradient(circle at 34% 28%,#fff6dd,#ebcb8b 52%,#c9a45c)}' +
  '.tgm__txt{flex:1;min-width:0;line-height:1.3}.tgm__txt small{display:block;font-size:13.5px;font-weight:700;color:#dfe6ec}' +
  '.tgm__txt b{font-size:16px;font-weight:800}.tgm__txt b em{font-style:normal;color:#ebcb8b}' +
  '.tgm__go{flex:0 0 auto;min-height:44px;display:flex;align-items:center;padding:0 14px;border-radius:12px;font-size:14.5px;font-weight:800;color:#192f43;text-decoration:none;' +
    'background:linear-gradient(180deg,#f0d59d,#c9a45c)}' +
  '.tgm__x{flex:0 0 auto;width:40px;height:44px;border:0;background:transparent;color:#e7edf2;font-family:inherit;font-size:26px;line-height:44px;font-weight:300;cursor:pointer}' +
  '@media (prefers-reduced-motion:reduce){.tgp__dim,.tgp__card,.tgm{transition:none!important}}';

  function addCss() { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }

  function goResults(e) {
    if (!onHome) return;                         // 다른 쪽: 링크 그대로 index.html#exam-results 로 이동
    e.preventDefault();
    var sec = document.getElementById('exam-results');
    setTimeout(function () {
      sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (!sec.hasAttribute('tabindex')) sec.setAttribute('tabindex', '-1');
      try { sec.focus({ preventScroll: true }); } catch (err) {}
      if (history.replaceState) history.replaceState(null, '', '#exam-results');
    }, reduce ? 0 : 140);
  }

  /* ---------- 작은 띠 ---------- */
  function openMini() {
    addCss();
    var bar = document.createElement('div');
    bar.className = 'tgm';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', '2026학년도 2학기 중간고사 결과 안내');
    bar.innerHTML = '<span class="tgm__seal" aria-hidden="true">100</span>' +
      '<span class="tgm__txt"><small>2학기 중간고사 결과</small><b>영어 100점 <em>' + P100 + '명</em></b></span>' +
      '<a class="tgm__go" href="' + href + '">결과 보기</a>' +
      '<button type="button" class="tgm__x" aria-label="안내 닫기">×</button>';
    var sticky = document.querySelector('.tg-sticky');
    var off = (sticky && getComputedStyle(sticky).display !== 'none') ? sticky.offsetHeight : 0;
    bar.style.bottom = 'calc(' + (off + 18) + 'px + ' + (off ? '0px' : 'env(safe-area-inset-bottom)') + ')';
    document.body.appendChild(bar);
    set('sessionStorage', KEY + '_seen', '1');
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add('is-on'); }); });
    function rm() { bar.classList.remove('is-on'); setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, reduce ? 0 : 300); }
    bar.querySelector('.tgm__x').addEventListener('click', rm);
    bar.querySelector('.tgm__go').addEventListener('click', function (e) { goResults(e); if (onHome) rm(); });
  }

  /* ---------- 팝업 ---------- */
  var root, card, lastFocus, inerted = [];
  function build() {
    var r = document.createElement('div');
    r.className = 'tgp';
    r.innerHTML =
      '<div class="tgp__dim" data-close></div>' +
      '<div class="tgp__card" role="dialog" aria-modal="true" aria-labelledby="tgp-title" aria-describedby="tgp-lead" tabindex="-1">' +
        '<div class="tgp__grab" aria-hidden="true"></div>' +
        '<div class="tgp__hero">' +
          '<button type="button" class="tgp__x" data-close aria-label="닫기">×</button>' +
          '<div class="tgp__seal" aria-hidden="true">100</div>' +
          '<p class="tgp__kicker">Congratulations</p>' +
          '<p class="tgp__eyebrow">2026학년도 2학기 중간고사 결과</p>' +
          '<h2 class="tgp__title" id="tgp-title">영어 100점<br><em>' + P100 + '명</em>이 나왔습니다</h2>' +
        '</div>' +
        '<div class="tgp__stats">' +
          '<div class="tgp__stat"><span>내신 영어 90점 이상</span><b>' + OVER90 + '<small>명</small></b><em>100점 ' + P100 + '명 포함</em></div>' +
          '<div class="tgp__stat"><span>10월 모의고사 영어 100점</span><b>' + MOCK100 + '<small>명</small></b><em>고1·고2·고3 모두</em></div>' +
        '</div>' +
        '<div class="tgp__body">' +
          '<p class="tgp__lead" id="tgp-lead">학교별 명단과 원장이 꼽은<br>레전드 TOP 3를 확인해 보세요.</p>' +
          '<a class="tgp__cta" href="' + href + '" data-go>학교별 결과 보기 <i aria-hidden="true">→</i></a>' +
          '<p class="tgp__fine">학생·학부모가 알려 온 성적을 본원이 자체 집계한 결과입니다.</p>' +
        '</div>' +
        '<div class="tgp__foot">' +
          '<button type="button" data-week>7일간 보지 않기</button>' +
          '<button type="button" data-close>닫기</button>' +
        '</div>' +
      '</div>';
    return r;
  }
  function canKeep() { set('localStorage', KEY + '_t', '1'); var ok = get('localStorage', KEY + '_t') === '1'; try { localStorage.removeItem(KEY + '_t'); } catch (e) {} return ok; }
  function lock(on) {
    var de = document.documentElement;
    if (on) { var sbw = window.innerWidth - de.clientWidth; de.style.overflow = 'hidden'; if (sbw > 0) de.style.paddingRight = sbw + 'px'; }
    else { de.style.overflow = ''; de.style.paddingRight = ''; }
  }
  function close(mode) {
    if (!root) return;
    if (mode === 'week') { var t = new Date(); t.setHours(24, 0, 0, 0); set('localStorage', KEY + '_hide', String(t.getTime() + 6 * 864e5)); }
    root.classList.remove('is-on');
    card.style.transition = ''; card.style.transform = '';
    document.removeEventListener('keydown', onKey, true);
    inerted.forEach(function (el) { el.removeAttribute('inert'); }); inerted = [];
    var r = root; root = null;
    lock(false);
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, reduce ? 0 : 320);
    if (mode !== 'go' && lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close('x'); return; }
    if (e.key !== 'Tab') return;
    var f = card.querySelectorAll('a[href],button');
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function swipe() {                              // 휴대폰: 손잡이·머리를 아래로 끌어 닫기
    var y0 = null, dy = 0, h = 0;
    card.addEventListener('touchstart', function (e) {
      if (card.scrollTop > 0 || !e.target.closest('.tgp__grab,.tgp__hero')) { y0 = null; return; }
      y0 = e.touches[0].clientY; dy = 0; h = card.offsetHeight; card.style.transition = 'none';
    }, { passive: true });
    card.addEventListener('touchmove', function (e) {
      if (y0 === null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      card.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    card.addEventListener('touchend', function () {
      if (y0 === null) return;
      y0 = null; card.style.transition = '';
      if (dy > Math.min(120, h * 0.22)) close('x'); else card.style.transform = '';
    });
  }
  function openPopup() {
    addCss();
    lastFocus = document.activeElement;
    root = build(); card = root.querySelector('.tgp__card');
    if (!canKeep()) { var wk = root.querySelector('[data-week]'); if (wk) wk.parentNode.removeChild(wk); }
    document.body.appendChild(root);
    set('sessionStorage', KEY + '_seen', '1');
    lock(true);
    inerted = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el !== root && !el.hasAttribute('inert') && el.tagName !== 'SCRIPT') { el.setAttribute('inert', ''); inerted.push(el); }
    });
    root.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-close],[data-week],[data-go]') : null;
      if (!el) return;
      if (el.hasAttribute('data-week')) close('week');
      else if (el.hasAttribute('data-go')) { if (onHome) { goResults(e); close('go'); } }
      else close('x');
    });
    document.addEventListener('keydown', onKey, true);
    if (mobile) swipe();
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-on'); card.focus({ preventScroll: true }); }); });
  }
  function start() { setTimeout(function () { if (Date.now() >= UNTIL || location.hash === '#exam-results') return; (MINI ? openMini : openPopup)(); }, 700); }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
