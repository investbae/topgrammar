/* 탑그래머 2학기 중간고사 결과 팝업 v3(형광 노랑 × 남색 · 월계관 메달 · PC 560px) — apply.py 가 수치·기간을 채워 results-popup.js 로 낸다(v2.4: 토론 3회 + Opus 판정 반영).
   기간: 2026-11-06 00:00 ~ 2026-12-06 00:00 KST(달력 1달 = 11/6~12/5) · 한 방문(세션)에 한 번 · «7일간 보지 않기»=7일째 자정까지
   구글 검색에서 휴대폰으로 들어온 첫 화면은 본문을 가리지 않는 작은 띠(방해형 전면 광고 신호 회피) */
(function () {
  'use strict';
  var START = new Date('2026-11-06T00:00:00+09:00').getTime();
  var UNTIL = new Date('2026-12-06T00:00:00+09:00').getTime();
  var KEY = 'tg_pop_2026_2mid';
  var P100 = '20', OVER90 = '47', MOCK100 = '4', MOCKBY = '고1 2·고2 1·고3 1명';
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

  var css = ".tgp{--neon:#e4ff3a;--neon2:#c9ee12;--glow:rgba(228,255,58,.55);--ink:#192f43;position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit;-webkit-font-smoothing:antialiased}.tgp__dim{position:absolute;inset:0;background:rgba(7,15,23,.72);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .3s ease}.tgp__card{position:relative;width:min(560px,100%);max-height:calc(100vh - 48px);overflow:auto;overscroll-behavior:contain;background:#fff;border-radius:28px;box-shadow:0 0 0 1px rgba(228,255,58,.45),0 0 44px rgba(228,255,58,.22),0 40px 100px rgba(0,0,0,.55);opacity:0;transform:translateY(24px) scale(.96);transition:opacity .38s cubic-bezier(.2,.8,.2,1),transform .38s cubic-bezier(.2,.8,.2,1);outline:none}.tgp.is-on .tgp__dim{opacity:1}.tgp.is-on .tgp__card{opacity:1;transform:none}.tgp__hero{position:relative;overflow:hidden;padding:42px 44px 36px;text-align:center;color:#fff;background:radial-gradient(90% 70% at 50% 0%,rgba(228,255,58,.16),rgba(228,255,58,0) 60%),linear-gradient(170deg,#1d3a54 0%,#132637 52%,#0a1622 100%)}.tgp__hero:before{content:\"\";position:absolute;inset:0;pointer-events:none;opacity:.55;background-image:radial-gradient(rgba(228,255,58,.14) 1px,transparent 1.5px);background-size:24px 24px;-webkit-mask-image:linear-gradient(180deg,#000,transparent 80%);mask-image:linear-gradient(180deg,#000,transparent 80%)}.tgp__frame{position:absolute!important;inset:14px;border:1px solid rgba(228,255,58,.18);border-radius:18px;pointer-events:none}.tgp__frame:before,.tgp__frame:after{content:\"\";position:absolute;width:22px;height:22px;border:2px solid var(--neon);border-radius:4px}.tgp__frame:before{top:-2px;left:-2px;border-right:0;border-bottom:0;border-radius:18px 0 0 0}.tgp__frame:after{bottom:-2px;right:-2px;border-left:0;border-top:0;border-radius:0 0 18px 0}.tgp__hero:after{content:\"\";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,transparent,var(--neon) 20%,var(--neon) 80%,transparent);box-shadow:0 0 18px var(--glow)}.tgp__hero>*{position:relative}.tgp__x{position:absolute!important;z-index:3;top:18px;right:18px;width:44px;height:44px;border:0;border-radius:50%;background:transparent;color:#eef3f6;font-family:inherit;font-size:30px;line-height:44px;font-weight:300;cursor:pointer;transition:background .2s,color .2s}.tgp__x:hover,.tgp__x:focus-visible{background:rgba(228,255,58,.16);color:var(--neon);outline:none}.tgp__medal{position:relative;width:124px;height:124px;margin:0 auto 10px;filter:drop-shadow(0 0 14px rgba(228,255,58,.45)) drop-shadow(0 10px 18px rgba(0,0,0,.35))}.tgp__medal svg{display:block;width:100%;height:100%;overflow:visible}.tgp__medal:after{content:\"\";position:absolute;left:50%;top:50%;width:52%;height:52%;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.85) 50%,transparent 62%) no-repeat;background-size:260% 100%;background-position:130% 0;animation:tgpShine 1.5s .55s cubic-bezier(.3,.6,.3,1) 2}@keyframes tgpShine{to{background-position:-40% 0}}.tgp__kicker{font:italic 600 18px/1.3 Georgia,\"Times New Roman\",serif;color:var(--neon);letter-spacing:.02em;margin:0 0 8px;text-shadow:0 0 14px rgba(228,255,58,.35)}.tgp__eyebrow{display:inline-flex;align-items:center;gap:12px;font-size:15px;font-weight:700;color:#e3e9ee;letter-spacing:.03em;margin:0 0 14px}.tgp__eyebrow:before,.tgp__eyebrow:after{content:\"\";width:24px;height:2px;border-radius:2px;background:var(--neon);box-shadow:0 0 8px var(--glow)}.tgp__title{margin:0;font-size:46px;line-height:1.16;font-weight:800;letter-spacing:-.03em;color:#fff;word-break:keep-all}.tgp__title em{font-style:normal;color:var(--neon);text-shadow:0 0 22px rgba(228,255,58,.55),0 0 2px rgba(228,255,58,.6)}.tgp__stats{display:grid;grid-template-columns:1fr 1fr;background:#fff;border-bottom:1px solid #edf0f3}.tgp__stat{padding:22px 14px 18px;text-align:center}.tgp__stat+.tgp__stat{border-left:1px solid #e6eaee}.tgp__stat span{display:block;font-size:15px;font-weight:700;color:#3f4d5a;margin-bottom:6px;word-break:keep-all}.tgp__stat b{display:inline-block;font-size:42px;line-height:1.05;font-weight:900;color:var(--ink);letter-spacing:-.03em;padding:0 6px;background:linear-gradient(180deg,transparent 64%,var(--neon) 64%,var(--neon) 90%,transparent 90%)}.tgp__stat b small{font-size:18px;margin-left:2px;font-weight:800}.tgp__stat em{display:block;font-style:normal;font-size:13.5px;font-weight:600;color:#55626e;margin-top:6px}.tgp__body{padding:22px 34px 20px;text-align:center;background:linear-gradient(180deg,#fff,#f7f9fa)}.tgp__lead{margin:0 0 18px;font-size:17px;line-height:1.55;color:#24323f;font-weight:700;word-break:keep-all}.tgp__cta{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:64px;border:0;border-radius:16px;cursor:pointer;background:linear-gradient(180deg,#f1ff7a 0%,var(--neon) 45%,var(--neon2) 100%);color:var(--ink);font:inherit;font-size:19px;font-weight:900;text-decoration:none;letter-spacing:-.01em;box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 0 0 1px rgba(25,47,67,.10),0 12px 28px rgba(160,200,0,.38);transition:transform .15s,box-shadow .15s;animation:tgpPulse 2.4s 1.1s ease-in-out 3}.tgp__cta:before{content:\"\";position:absolute;top:0;bottom:0;left:-60%;width:40%;transform:skewX(-20deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);animation:tgpSweep 3s 1.3s ease-in-out 2}@keyframes tgpSweep{0%{left:-60%}35%,100%{left:130%}}@keyframes tgpPulse{0%,100%{box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 0 0 1px rgba(25,47,67,.10),0 12px 28px rgba(160,200,0,.38)}50%{box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 0 0 1px rgba(25,47,67,.10),0 12px 34px rgba(160,200,0,.55),0 0 0 6px rgba(228,255,58,.28)}}.tgp__cta:hover{transform:translateY(-2px)}.tgp__cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}.tgp__cta i{font-style:normal;position:relative}.tgp__cta span{position:relative}.tgp__fine{margin:13px 0 0;font-size:13.5px;line-height:1.5;color:#55626e;word-break:keep-all}.tgp__foot{position:sticky;bottom:0;display:flex;border-top:1px solid #e3e7eb;background:#fbfcfc}.tgp__foot button{flex:1;min-height:56px;border:0;background:transparent;font:inherit;font-size:15.5px;font-weight:600;color:#45525e;cursor:pointer}.tgp__foot button+button{border-left:1px solid #dfe3e8;color:var(--ink);font-weight:800}.tgp__foot button:hover{background:#f1f4f6}.tgp__foot button:focus-visible{outline:3px solid var(--ink);outline-offset:-3px}#exam-results:focus{outline:none}@media (max-width:640px){.tgp{align-items:flex-end;padding:0}.tgp__card{width:100%;max-height:88vh;max-height:min(88dvh,720px);border-radius:26px 26px 0 0;transform:translateY(100%);padding-bottom:env(safe-area-inset-bottom);box-shadow:0 0 0 1px rgba(228,255,58,.45),0 -10px 40px rgba(228,255,58,.18)}.tgp__grab{position:absolute;z-index:3;top:0;left:50%;width:120px;height:26px;margin-left:-60px;display:flex;justify-content:center;padding-top:9px;touch-action:none}.tgp__grab:before{content:\"\";width:44px;height:4px;border-radius:4px;background:rgba(228,255,58,.7)}.tgp__hero{padding:32px 24px 26px}.tgp__frame{inset:10px}.tgp__x{top:12px;right:12px}.tgp__medal{width:92px;height:92px;margin-bottom:6px}.tgp__kicker{font-size:16px;margin-bottom:6px}.tgp__eyebrow{font-size:14px;margin-bottom:10px;gap:10px}.tgp__title{font-size:33px}.tgp__stat{padding:16px 10px 14px}.tgp__stat span{font-size:14px}.tgp__stat b{font-size:34px}.tgp__stat b small{font-size:16px}.tgp__body{padding:20px 20px 16px}.tgp__lead{font-size:16px;margin-bottom:14px}.tgp__cta{min-height:58px;font-size:18px}.tgp__foot button{min-height:52px;font-size:15px}}@media (min-width:641px){.tgp__grab{display:none}}@media (max-width:400px){.tgp__eyebrow:before,.tgp__eyebrow:after{display:none}}@media (max-height:820px){.tgp__hero{padding:30px 40px 26px}.tgp__medal{width:96px;height:96px;margin-bottom:6px}.tgp__kicker{display:none}.tgp__title{font-size:40px}.tgp__stat{padding:16px 12px 14px}.tgp__stat b{font-size:36px}.tgp__body{padding:16px 30px 14px}.tgp__lead{margin-bottom:12px;font-size:16px}.tgp__cta{min-height:58px}.tgp__fine{margin-top:10px}.tgp__foot button{min-height:50px}}@media (max-height:660px){.tgp__medal{display:none}.tgp__hero{padding:30px 36px 22px}.tgp__title{font-size:34px}.tgp__stat b{font-size:30px}.tgp__stat em{margin-top:3px}}@media (max-width:640px) and (max-height:820px){.tgp__hero{padding:30px 20px 20px}.tgp__medal{width:76px;height:76px}.tgp__title{font-size:29px}.tgp__stat b{font-size:30px}.tgp__cta{min-height:54px;font-size:17px}}@media (max-width:640px) and (max-height:640px){.tgp__card{max-height:96vh;max-height:96dvh}.tgp__medal{display:none}.tgp__hero{padding-top:52px}.tgp__title{font-size:26px}.tgp__eyebrow{margin-bottom:8px}.tgp__stat{padding:12px 8px 10px}.tgp__stat b{font-size:27px}.tgp__lead{font-size:15px;margin-bottom:10px}.tgp__fine{font-size:13px}}.tgm{position:fixed;left:12px;right:12px;z-index:9000;display:flex;align-items:center;gap:12px;padding:12px 8px 12px 12px;border-radius:18px;border:1.5px solid rgba(228,255,58,.75);background:linear-gradient(170deg,#1d3a54,#132637 55%,#0a1622);color:#fff;box-shadow:0 0 22px rgba(228,255,58,.28),0 16px 36px rgba(0,0,0,.4);font-family:inherit;opacity:0;transform:translateY(16px);transition:opacity .3s,transform .3s cubic-bezier(.2,.8,.2,1)}.tgm.is-on{opacity:1;transform:none}.tgm__seal{flex:0 0 auto;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#192f43;background:radial-gradient(circle at 36% 30%,#fbffd0,#e4ff3a 55%,#b9d80f);box-shadow:0 0 14px rgba(228,255,58,.5)}.tgm__txt{flex:1;min-width:0;line-height:1.3}.tgm__txt small{display:block;font-size:13.5px;font-weight:700;color:#e3e9ee}.tgm__txt b{font-size:17px;font-weight:800}.tgm__txt b em{font-style:normal;color:#fff;font-weight:900}.tgm__go{flex:0 0 auto;min-height:44px;display:flex;align-items:center;padding:0 15px;border-radius:12px;font-size:15px;font-weight:900;color:#192f43;text-decoration:none;background:linear-gradient(180deg,#f1ff7a,#e4ff3a 50%,#c9ee12);box-shadow:0 6px 16px rgba(160,200,0,.35)}.tgm__x{flex:0 0 auto;width:40px;height:44px;border:0;background:transparent;color:#eef3f6;font-family:inherit;font-size:26px;line-height:44px;font-weight:300;cursor:pointer}@media (prefers-reduced-motion:reduce){.tgp__dim,.tgp__card,.tgm{transition:none!important}.tgp__medal:after,.tgp__cta,.tgp__cta:before{animation:none!important}}";                              // popup_v3.css 를 apply.py 가 넣는다

  function medalSvg() {                           // 월계관 메달(형광 노랑) — 잎은 원호를 따라 엇갈려 놓는다
    var cx = 60, cy = 60, g = '';
    function leaf(deg, r, tilt) {
      var a = deg * Math.PI / 180, x = (cx + r * Math.cos(a)).toFixed(1), y = (cy + r * Math.sin(a)).toFixed(1);
      return '<path d="M0 -11C4.6 -5.5 4.6 5.5 0 11C-4.6 5.5 -4.6 -5.5 0 -11Z" transform="translate(' + x + ' ' + y + ') rotate(' + (deg + tilt) + ')"/>';
    }
    for (var i = 0; i < 6; i++) {               // 바깥 잎·안쪽 잎을 엇갈려 V자로 — 위로 갈수록 작게
      var d = 120 + i * 22, s = (1 - i * 0.07).toFixed(2);
      g += leaf(d, 51, 32).replace('rotate(', 'scale(' + s + ') rotate(');
      g += leaf(d + 9, 41, -30).replace('rotate(', 'scale(' + s + ') rotate(');
      g += leaf(180 - d, 51, -32).replace('rotate(', 'scale(' + s + ') rotate(');
      g += leaf(180 - d - 9, 41, 30).replace('rotate(', 'scale(' + s + ') rotate(');
    }
    return '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs>' +
      '<radialGradient id="tgpCoin" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#f2ff9a"/><stop offset=".6" stop-color="#e4ff3a"/><stop offset="1" stop-color="#d3f222"/></radialGradient></defs>' +
      '<path d="M40.6 101.7A46 46 0 0 1 33.6 22.3M79.4 101.7A46 46 0 0 0 86.4 22.3" fill="none" stroke="#e4ff3a" stroke-width="1.8" stroke-linecap="round"/>' +
      '<g fill="#e4ff3a">' + g + '</g>' +
      '<circle cx="60" cy="60" r="31" fill="url(#tgpCoin)"/><circle cx="60" cy="60" r="26.5" fill="none" stroke="#192f43" stroke-opacity=".28" stroke-width="1.2"/>' +
      '<text x="60" y="61.5" text-anchor="middle" dominant-baseline="central" font-family="Pretendard,inherit,sans-serif" font-size="23" font-weight="900" letter-spacing="-.5" fill="#192f43">100</text></svg>';
  }

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
          '<span class="tgp__frame" aria-hidden="true"></span>' +
          '<div class="tgp__medal" aria-hidden="true">' + medalSvg() + '</div>' +
          '<p class="tgp__kicker">Congratulations</p>' +
          '<p class="tgp__eyebrow">2026학년도 2학기 중간고사 결과</p>' +
          '<h2 class="tgp__title" id="tgp-title">영어 100점<br><em>' + P100 + '명</em>이 나왔습니다</h2>' +
        '</div>' +
        '<div class="tgp__stats">' +
          '<div class="tgp__stat"><span>내신 영어 90점 이상</span><b>' + OVER90 + '<small>명</small></b><em>100점 ' + P100 + '명 포함</em></div>' +
          '<div class="tgp__stat"><span>10월 모의고사 영어 100점</span><b>' + MOCK100 + '<small>명</small></b><em>' + MOCKBY + '</em></div>' +
        '</div>' +
        '<div class="tgp__body">' +
          '<p class="tgp__lead" id="tgp-lead">학교별 명단과 원장이 꼽은<br>레전드 TOP 3를 확인해 보세요.</p>' +
          '<a class="tgp__cta" href="' + href + '" data-go><span>학교별 결과 보기</span> <i aria-hidden="true">→</i></a>' +
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
