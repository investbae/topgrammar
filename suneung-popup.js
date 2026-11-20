/* 탑그래머 자동 팝업 공용 관리자(2026-11-20 · 박사님 «팝업창은 2개 모두 띄어주세요»).
   apply.py 가 같은 코드를 suneung-popup.js·results-popup.js 맨 앞에 넣고, 먼저 실행된 쪽이 정의한다.
   넓은 PC(폭 1240px·높이 600px 이상): 두 카드를 한 겹 위에 나란히 · 그 밖: × ·닫기·7일로 닫으면 다음 카드(차례) · 작은 띠도 차례로.
   Esc·바깥 어두운 곳·아래로 끌기 = «팝업 그만»: 나란히면 둘 다 닫고, 차례면 남은 소식을 작은 띠로 돌린다(R1 GPT 4 · 어디서나 같은 뜻).
   어둡게 덮기·뒤 화면 잠금(inert·스크롤)·키보드(Tab 순환·Esc)·초점 복귀는 여기 한 곳에서만 한다. */
(function () {
  'use strict';
  if (window.__tgPopMgr) return;
  var mq = function (q) { return !!(window.matchMedia && matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var Q = [], open = [], layer = null, held = false, inerted = [], prevOv = '', prevPr = '', back = null, started = false;
  var CSS = '.tgpair{position:fixed;inset:0;z-index:10000;display:grid;grid-auto-flow:column;grid-auto-columns:auto;justify-content:center;align-content:center;align-items:stretch;gap:24px;padding:24px;overflow:auto;font-family:inherit}' +
    '.tgpair__dim{position:fixed;inset:0;background:rgba(7,15,23,.74);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .3s ease}' +
    '.tgpair.is-on .tgpair__dim{opacity:1}' +
    '.tgpair>.is-paired{position:relative;inset:auto;z-index:1;display:flex;align-items:stretch;justify-content:stretch;padding:0;min-width:0}' +
    '.tgpair .tgs__dim,.tgpair .tgp__dim{display:none}' +
    '.tgpair>.tgs.is-paired{width:600px}.tgpair>.tgp.is-paired{width:520px}.tgpair .tgs__card,.tgpair .tgp__card{width:100%;display:flex;flex-direction:column}' +
    '.tgpair .tgs__card>*,.tgpair .tgp__card>*{flex-shrink:0}.tgpair .tgs__body,.tgpair .tgp__body{flex-grow:1}' +
    /* 나란히 연 뒤 창을 줄이면(폭 1240·높이 600 미만) 두 카드를 세로로 쌓고 층 전체를 세로 스크롤(R3 GPT 3 — 화면 밖으로 넘치지 않게) */
    '@media (max-width:1239px),(max-height:599px){.tgpair{grid-auto-flow:row;justify-content:center;align-content:start;align-items:start;gap:16px;padding:16px;overflow-x:hidden;overflow-y:auto}' +
    '.tgpair>.tgs.is-paired,.tgpair>.tgp.is-paired{width:min(600px,calc(100vw - 32px))}.tgpair .tgs__card,.tgpair .tgp__card{max-height:none;overflow:hidden;border-radius:24px}.tgpair .tgs__foot,.tgpair .tgp__foot{position:static}}' +
    '@media (min-width:1240px) and (max-height:860px){.tgpair .tgp__title{font-size:40px}.tgpair .tgp__cta{min-height:58px}.tgpair .tgp__foot button{min-height:50px}}' +
    '@media (min-width:1240px) and (max-height:720px){.tgpair .tgp__title{font-size:32px}.tgpair .tgp__cta{min-height:52px;font-size:18px}}' +
    '@media (min-width:1240px) and (max-height:660px){.tgpair .tgp__hero{padding-top:22px}}' +
    '@media (min-width:1240px) and (max-height:600px){.tgpair .tgp__hero{padding-top:20px}.tgpair .tgp__title{font-size:28px}.tgpair .tgp__cta{min-height:50px}.tgpair .tgp__foot button{min-height:46px}}' +
    '.tgpair .tgp__cta{animation:none}.tgpair .tgp__cta:before{animation:tgpSweep 3s 4.2s ease-in-out 1}.tgpair .tgp__medal:after{animation-delay:1.8s;animation-iteration-count:1}' +
    '@media (prefers-reduced-motion:reduce){.tgpair__dim{transition:none}.tgpair .tgp__cta:before,.tgpair .tgp__medal:after{animation:none!important}}';
  function addCss() { if (document.getElementById('tgpair-css')) return; var st = document.createElement('style'); st.id = 'tgpair-css'; st.textContent = CSS; document.head.appendChild(st); }
  function raf2(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }
  function wide() { return mq('(min-width: 1240px) and (min-height: 600px)'); }
  function focusEl(el) { try { el.focus({ preventScroll: true }); } catch (e) {} }
  function hold() {                                  // 첫 카드가 열릴 때 한 번 — 차례로 다음 카드가 이어지는 동안은 풀지 않는다
    if (held) return;
    held = true; back = document.activeElement;
    var de = document.documentElement; prevOv = de.style.overflow; prevPr = de.style.paddingRight;
    var sbw = window.innerWidth - de.clientWidth; de.style.overflow = 'hidden'; if (sbw > 0) de.style.paddingRight = sbw + 'px';
    inerted = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (!el.hasAttribute('data-tgpop') && !el.hasAttribute('inert') && el.tagName !== 'SCRIPT') { el.setAttribute('inert', ''); inerted.push(el); }
    });
    document.addEventListener('keydown', onKey, true);
  }
  function unhold(mode) {                            // 마지막 카드가 닫힐 때 한 번 — 원래 값으로 되돌린다
    if (!held) return;
    held = false;
    inerted.forEach(function (el) { el.removeAttribute('inert'); }); inerted = [];
    var de = document.documentElement; de.style.overflow = prevOv; de.style.paddingRight = prevPr;
    document.removeEventListener('keydown', onKey, true);
    if (mode === 'go') return;
    var main = document.querySelector('main');
    var to = (back && back.focus && document.contains(back) && back !== document.body) ? back : (main || document.body);
    if (to === main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    focusEl(to);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeAll('esc'); return; }
    if (e.key !== 'Tab' || !open.length) return;
    var f = [];
    open.forEach(function (o) { Array.prototype.push.apply(f, o.card.querySelectorAll('a[href],button')); });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = document.activeElement;
    var inside = f.indexOf(a) >= 0 || open.some(function (o) { return o.card === a; });
    if (e.shiftKey && (a === first || a === open[0].card || !inside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !inside)) { e.preventDefault(); first.focus(); }
  }
  function show(p, paired) {
    var root = p.make(), card = root.querySelector(p.card);
    root.setAttribute('data-tgpop', p.id);
    if (paired) { root.classList.add('is-paired'); card.setAttribute('role', 'group'); card.removeAttribute('aria-modal'); layer.appendChild(root); }
    else document.body.appendChild(root);
    var o = { p: p, root: root, card: card };
    open.push(o);
    if (p.opened) p.opened(root, card, paired);
    raf2(function () { if (open.indexOf(o) >= 0) root.classList.add('is-on'); });
    return o;
  }
  function openOne(p) {
    hold();
    var o = show(p, false);
    raf2(function () { if (open.indexOf(o) >= 0) focusEl(o.card); });
  }
  function openPair(list) {
    addCss();
    var L = layer = document.createElement('div');
    L.className = 'tgpair'; L.setAttribute('data-tgpop', 'pair'); L.tabIndex = -1;
    L.setAttribute('role', 'dialog'); L.setAttribute('aria-modal', 'true'); L.setAttribute('aria-label', '탑그래머 성적 소식');   // 하나를 닫아도 맞도록 개수를 넣지 않는다(R1 GPT 3)
    L.innerHTML = '<div class="tgpair__dim"></div>';
    L.firstChild.addEventListener('click', function () { closeAll('esc'); });
    hold();
    document.body.appendChild(L);
    list.forEach(function (p) { show(p, true); });
    raf2(function () { if (layer === L) { L.classList.add('is-on'); if (open[0]) focusEl(open[0].card); } });
  }
  function take() { while (Q.length) { var p = Q.shift(); if (p.ok()) return p; } return null; }
  function next() { var n = take(); if (!n) return; if (n.mini) n.openMini(next); else openOne(n); }
  function close(id, mode) {
    var o = null;
    open.forEach(function (x) { if (x.p.id === id) o = x; });
    if (!o) return;
    open.splice(open.indexOf(o), 1);
    o.root.setAttribute('inert', '');               // 사라지는 320ms 동안 Tab·클릭이 닿지 않게(R1 GPT 2)
    if (o.p.closed) o.p.closed(mode);
    o.card.style.transition = ''; o.card.style.transform = '';
    o.root.classList.remove('is-on');
    var r = o.root;
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, reduce ? 0 : 320);
    if (open.length) {                               // 나란히: 남은 카드에 초점(잠금은 유지)
      var a = document.activeElement;
      if (!open.some(function (x) { return x.card.contains(a); })) focusEl(open[0].card);
      return;
    }
    if (layer) { var L = layer; layer = null; L.classList.remove('is-on'); setTimeout(function () { if (L.parentNode) L.parentNode.removeChild(L); }, reduce ? 0 : 320); }
    if (mode === 'go') { Q.forEach(function (p) { if (p.seen) p.seen(); }); Q = []; unhold('go'); return; }
    var n = take();
    if (n && !n.mini && mode !== 'esc') { openOne(n); return; }   // 차례: 잠금을 쥔 채 다음 카드를 띄운다
    unhold(mode);
    if (n) setTimeout(function () { if (n.ok()) n.openMini(next); else next(); }, reduce ? 0 : 360);   // 기다리는 동안 기간이 끝났으면 건너뛴다(R2 GPT 5)   // 작은 띠 차례이거나 Esc 로 끝냈으면 남은 소식은 작은 띠로
  }
  function closeAll(mode) {
    if (layer) open.slice().forEach(function (o) { close(o.p.id, mode); });
    else if (open[0]) close(open[0].p.id, mode);
  }
  function run() {
    Q.sort(function (a, b) { return a.order - b.order; });
    Q = Q.filter(function (p) { return p.ok(); });
    if (!Q.length) return;
    if (Q.length > 1 && !Q[0].mini && !Q[1].mini && wide()) { var l = Q; Q = []; openPair(l); return; }
    next();
  }
  window.__tgPopMgr = {
    add: function (p) {
      Q.push(p);
      if (started) return;
      started = true;
      var go = function () { setTimeout(run, 700); };
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
    },
    refocus: function () {                         // 작은 띠를 키보드로 닫았을 때 — 다음 띠의 버튼, 없으면 본문(R1 GPT 6)
      var to = document.querySelector('.tgsm__go,.tgm__go'), main = document.querySelector('main');
      if (!to) { to = main || document.body; if (to === main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1'); }
      focusEl(to);
    },
    openOne: function (p) { if (p.ok() && !open.some(function (o) { return o.p === p; })) openOne(p); },
    close: close, closeAll: closeAll, next: next
  };
})();
/* 탑그래머 2027학년도 수능 영어(가채점) 팝업 v1 — apply.py 가 학생 값·기간·CSS 를 채워 suneung-popup.js 로 낸다.
   기간: 2026-11-20 00:00 ~ 2026-12-11 00:00 KST · 한 방문(세션)에 한 번 · «7일간 보지 않기»=7일째 자정까지 · 결과 팝업(results-popup.js)과 키를 나눈다
   2026-11-20 박사님 «팝업창은 2개 모두 띄어주세요» → 결과 팝업과 함께 뜬다(넓은 PC 나란히 · 그 밖 차례). 잠금·키보드·초점은 공용 관리자(popup_mgr.js · window.__tgPopMgr)가 맡는다.
   구글 검색에서 휴대폰으로 들어온 첫 화면·검색 로봇은 본문을 가리지 않는 작은 띠(결과 팝업과 같은 정책) */
(function () {
  'use strict';
  var START = new Date('2026-11-20T00:00:00+09:00').getTime();
  var UNTIL = new Date('2026-12-11T00:00:00+09:00').getTime();
  var KEY = 'tg_pop_2027_suneung';
  var S = [{"school": "백양고", "grade": 3, "surname": "문", "score": 100}, {"school": "서정고", "grade": 3, "surname": "권", "score": 97}, {"school": "서정고", "grade": 3, "surname": "윤", "score": 94}];                            // [{school, grade, surname, score}] — 첫 줄이 만점(가운데 형광 메달)
  var now = Date.now();
  if (now < START || now >= UNTIL) return;
  var HASH = /^#(exam-results|suneung-results)$/;   // 첫 화면 결과 구획으로 바로 들어온 사람에게는 띄우지 않는다
  if (HASH.test(location.hash)) return;
  function get(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }
  function set(store, k, v) { try { window[store].setItem(k, v); } catch (e) {} }
  if (+(get('localStorage', KEY + '_hide') || 0) > now) return;
  if (get('sessionStorage', KEY + '_seen')) return;
  set('sessionStorage', KEY + '_t', '1');            // 저장이 안 되는 브라우저면 쪽마다 다시 뜨므로 자동 노출을 끈다
  if (get('sessionStorage', KEY + '_t') !== '1') return;
  try { sessionStorage.removeItem(KEY + '_t'); } catch (e) {}
  var M = window.__tgPopMgr;
  if (!M) return;
  var mq = function (q) { return !!(window.matchMedia && matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var mobile = mq('(max-width: 640px)');
  var fromGoogle = /^https?:\/\/([a-z0-9-]+\.)*google\./i.test(document.referrer || '');
  var isBot = /Googlebot|Google-InspectionTool|AdsBot-Google|bingbot|Yeti|Daumoa|DuckDuckBot|Applebot|YandexBot|Baiduspider|crawler|spider|slurp/i.test(navigator.userAgent || '');
  var MINI = mobile && (fromGoogle || isBot);

  var css = ".tgs{--neon:#e4ff3a;--ink:#192f43;--silver:#cfdae3;position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit;-webkit-font-smoothing:antialiased}.tgs__dim{position:absolute;inset:0;background:rgba(7,15,23,.74);opacity:0;transition:opacity .2s ease}.tgs__card{position:relative;width:min(600px,100%);max-height:calc(100vh - 48px);overflow:auto;overscroll-behavior:contain;background:#fff;border-radius:28px;box-shadow:0 0 0 1.5px rgba(228,255,58,.85),0 2px 8px rgba(0,0,0,.25),0 40px 100px rgba(0,0,0,.55);opacity:0;transform:translateY(24px) scale(.96);transition:opacity .22s cubic-bezier(.4,0,1,1),transform .22s cubic-bezier(.4,0,1,1);outline:none}.tgs.is-on .tgs__dim{opacity:1;transition:opacity .3s ease}.tgs.is-on .tgs__card{opacity:1;transform:none;transition:opacity .38s cubic-bezier(.2,.8,.2,1),transform .38s cubic-bezier(.2,.8,.2,1)}.tgs__hero{position:relative;overflow:hidden;padding:38px 40px 30px;text-align:center;color:#fff;background:radial-gradient(46% 34% at 50% 68%,rgba(130,170,205,.24),rgba(130,170,205,0) 70%),linear-gradient(170deg,#1d3a54 0%,#132637 52%,#0a1622 100%)}.tgs__hero:before{content:\"\";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.5px);background-size:24px 24px;-webkit-mask-image:linear-gradient(180deg,#000,transparent 75%);mask-image:linear-gradient(180deg,#000,transparent 75%)}.tgs__frame{position:absolute!important;inset:14px;border:1px solid rgba(255,255,255,.13);border-radius:18px;pointer-events:none}.tgs__frame:before,.tgs__frame:after{content:\"\";position:absolute;width:22px;height:22px;border:2px solid var(--neon)}.tgs__frame:before{top:-2px;left:-2px;border-right:0;border-bottom:0;border-radius:18px 0 0 0}.tgs__frame:after{bottom:-2px;right:-2px;border-left:0;border-top:0;border-radius:0 0 18px 0}.tgs__hero:after{content:\"\";position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--neon)}.tgs__hero>*{position:relative}.tgs__x{position:absolute!important;z-index:3;top:18px;right:18px;width:44px;height:44px;border:0;border-radius:50%;background:transparent;color:#eef3f6;font-family:inherit;font-size:30px;line-height:44px;font-weight:300;cursor:pointer;transition:background .2s,color .2s}.tgs__x:hover,.tgs__x:focus-visible{background:rgba(255,255,255,.12);color:var(--neon);outline:none}.tgs__x:focus-visible{outline:2px solid var(--neon);outline-offset:2px}.tgs__kicker{font:italic 400 18px/1.3 Georgia,\"Times New Roman\",serif;color:var(--neon);letter-spacing:.01em;margin:0 0 14px}.tgs__eyebrow{display:inline-flex;align-items:center;gap:12px;font-size:15px;font-weight:600;color:#e3e9ee;letter-spacing:.03em;margin:0 0 12px}.tgs__eyebrow:before,.tgs__eyebrow:after{content:\"\";width:24px;height:2px;border-radius:2px;background:var(--neon)}.tgs__eyebrow i{font-style:normal;font-size:13.5px;font-weight:700;color:var(--ink);background:#e3e9ee;border-radius:6px;padding:2px 7px;letter-spacing:0}.tgs__title{margin:0;font-size:46px;line-height:1.16;font-weight:800;letter-spacing:-.03em;color:#fff;word-break:keep-all}.tgs__title em{font-style:normal;color:var(--neon)}.tgs__podium{list-style:none;margin:26px auto 0;padding:0;max-width:470px;display:grid;grid-template-columns:1fr 1.3fr 1fr;grid-template-rows:auto auto;column-gap:10px;row-gap:0}.tgs__p{display:grid;grid-row:span 2;grid-template-rows:subgrid;justify-items:center;min-width:0;opacity:0;transform:translateY(14px) scale(.94);transition:opacity .45s ease,transform .6s cubic-bezier(.2,.8,.2,1)}.tgs.is-on .tgs__p{opacity:1;transform:none}.tgs__p--1{order:2}.tgs__p--2{order:1}.tgs__p--3{order:3}.tgs.is-on .tgs__p--1{transition-delay:.14s}.tgs.is-on .tgs__p--2,.tgs.is-on .tgs__p--3{transition-delay:.3s}.tgs__medal{position:relative;align-self:end;width:100%;max-width:112px;filter:drop-shadow(0 10px 16px rgba(0,0,0,.38))}.tgs__medal svg{display:block;width:100%;height:auto;overflow:visible}.tgs__p--1 .tgs__medal{max-width:156px;filter:drop-shadow(0 12px 20px rgba(0,0,0,.4))}.tgs__p--1 .tgs__medal:after{content:\"\";position:absolute;left:50%;top:50%;width:52%;height:52%;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.85) 50%,transparent 62%) no-repeat;background-size:260% 100%;background-position:130% 0;animation:tgsShine 1.5s .9s cubic-bezier(.3,.6,.3,1) 1}@keyframes tgsShine{to{background-position:-40% 0}}.tgs__who{align-self:start;margin-top:8px;text-align:center;line-height:1.3;white-space:nowrap}.tgs__who small{display:block;font-size:14px;font-weight:500;color:#dfe7ee;letter-spacing:.01em}.tgs__who b{display:block;font-size:19px;font-weight:800;color:#fff;letter-spacing:.02em;margin-top:2px}.tgs__p--1 .tgs__who small{font-size:15px;color:#eef3f6}.tgs__p--1 .tgs__who b{font-size:23px;color:var(--neon)}.tgs__who--sr{margin:0;height:0;overflow:hidden}.tgs--agg .tgs__podium{grid-template-rows:auto;align-items:end;margin-top:28px;max-width:500px}.tgs--agg .tgs__p{display:flex;flex-direction:column;align-items:center;grid-row:auto}.tgs--agg .tgs__medal{max-width:128px}.tgs--agg .tgs__p--1 .tgs__medal{max-width:176px}.tgs__mk{font-size:max(13.5px,.8em);font-weight:600;letter-spacing:.08em;margin-left:1px;vertical-align:.06em}.tgs__sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}.tgs__band{display:flex;align-items:center;justify-content:center;gap:18px;padding:22px 30px;background:#fff;border-bottom:1px solid #edf0f3}.tgs__band b{flex:0 0 auto;font-size:32px;line-height:1.05;font-weight:900;color:var(--ink);letter-spacing:-.03em;padding:0 6px;background:linear-gradient(180deg,transparent 64%,var(--neon) 64%,var(--neon) 90%,transparent 90%)}.tgs__band b small{font-size:16px;font-weight:800;margin-left:3px;letter-spacing:-.01em}.tgs__band p{margin:0;font-size:17px;line-height:1.45;font-weight:600;color:#24323f;word-break:keep-all;text-align:left}.tgs__band p strong{font-weight:800;color:var(--ink)}.tgs__body{padding:20px 34px 18px;text-align:center;background:linear-gradient(180deg,#fff,#f7f9fa)}.tgs__cta{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:64px;border:0;border-radius:16px;cursor:pointer;background:linear-gradient(180deg,#efff78 0%,#d8f71e 100%);color:var(--ink);font:inherit;font-size:19px;font-weight:800;text-decoration:none;letter-spacing:-.01em;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 0 0 1px rgba(25,47,67,.12),0 1px 2px rgba(25,47,67,.18),0 10px 18px -8px rgba(110,140,0,.55);transition:transform .15s,box-shadow .15s;animation:tgsPulse 2.4s 3.6s ease-in-out 2}.tgs__cta:before{content:\"\";position:absolute;top:0;bottom:0;left:-60%;width:40%;transform:skewX(-20deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);animation:tgsSweep 3s 2.4s ease-in-out 1}@keyframes tgsSweep{0%{left:-60%}35%,100%{left:130%}}@keyframes tgsPulse{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 0 0 1px rgba(25,47,67,.12),0 1px 2px rgba(25,47,67,.18),0 10px 18px -8px rgba(110,140,0,.55)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 0 0 1px rgba(25,47,67,.12),0 1px 2px rgba(25,47,67,.18),0 10px 18px -8px rgba(110,140,0,.55),0 0 0 6px rgba(228,255,58,.38)}}.tgs__cta:hover{transform:translateY(-1px)}.tgs__cta:active{transform:none}.tgs__cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}.tgs__cta i{font-style:normal;position:relative}.tgs__cta span{position:relative}.tgs__sub{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin-top:6px;padding:0 8px;font-size:15px;font-weight:700;color:var(--ink);text-decoration:none;border-radius:8px}.tgs__subt{text-decoration:underline;text-decoration-color:#c9ee12;text-decoration-thickness:3px;text-underline-offset:6px}.tgs__sub:hover{background:#f1f7d6}.tgs__sub:focus-visible{outline:3px solid var(--ink);outline-offset:2px}.tgs__fine{margin:6px 0 0;font-size:14px;line-height:1.5;color:#55626e;word-break:keep-all}.tgs__foot{position:sticky;bottom:0;display:flex;border-top:1px solid #e3e7eb;background:#fbfcfc}.tgs__foot button{flex:1;min-height:56px;border:0;background:transparent;font:inherit;font-size:15px;font-weight:500;color:#45525e;cursor:pointer}.tgs__foot button+button{border-left:1px solid #dfe3e8;color:var(--ink);font-weight:700}.tgs__foot button:hover{background:#f1f4f6}.tgs__foot button:focus-visible{outline:3px solid var(--ink);outline-offset:-3px}@media (min-width:641px){.tgs__grab{display:none}.tgs__dim{-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}}@media (max-width:640px){.tgs--agg .tgs__medal{max-width:104px}.tgs--agg .tgs__p--1 .tgs__medal{max-width:140px}.tgs--agg .tgs__podium{margin-top:20px}.tgs{align-items:flex-end;padding:0}.tgs__card{width:100%;max-height:90vh;max-height:min(90dvh,760px);border-radius:26px 26px 0 0;opacity:1;transform:translateY(100%);padding-bottom:env(safe-area-inset-bottom);box-shadow:0 0 0 1.5px rgba(228,255,58,.85),0 -12px 36px rgba(0,0,0,.35);transition:transform .26s cubic-bezier(.4,0,1,1)}.tgs.is-on .tgs__card{transition:transform .4s cubic-bezier(.22,1,.36,1)}.tgs__grab{position:absolute;z-index:3;top:0;left:50%;width:120px;height:26px;margin-left:-60px;display:flex;justify-content:center;padding-top:9px;touch-action:none}.tgs__grab:before{content:\"\";width:44px;height:4px;border-radius:4px;background:var(--neon)}.tgs__hero{padding:38px 16px 22px}.tgs__frame{inset:20px 10px 10px}.tgs__x{top:24px;right:14px}.tgs__kicker{display:none}.tgs__eyebrow{font-size:14px;margin-bottom:10px;gap:9px}.tgs__eyebrow i{font-size:13px}.tgs__title{font-size:31px}.tgs__podium{margin-top:18px;gap:4px;grid-template-columns:1fr 1.25fr 1fr}.tgs__medal{max-width:96px}.tgs__p--1 .tgs__medal{max-width:124px}.tgs__who small{font-size:13px}.tgs__who b{font-size:17px}.tgs__p--1 .tgs__who small{font-size:13.5px}.tgs__p--1 .tgs__who b{font-size:20px}.tgs__band{gap:12px;padding:14px 18px}.tgs__band b{font-size:26px}.tgs__band b small{font-size:14px}.tgs__band p{font-size:15.5px}.tgs__body{padding:16px 18px 12px}.tgs__cta{min-height:56px;font-size:18px}.tgs__sub{font-size:14.5px;margin-top:4px}.tgs__fine{font-size:13.5px;margin-top:2px}.tgs__foot button{min-height:52px;font-size:15px}}@media (max-width:380px){.tgs__eyebrow:before,.tgs__eyebrow:after{display:none}.tgs__who small{font-size:13px;letter-spacing:-.02em}}@media (min-width:641px) and (max-height:860px){.tgs--agg .tgs__p--1 .tgs__medal{max-width:150px}.tgs--agg .tgs__medal{max-width:112px}.tgs__hero{padding:30px 40px 24px}.tgs__kicker{display:none}.tgs__title{font-size:40px}.tgs__podium{margin-top:20px}.tgs__p--1 .tgs__medal{max-width:136px}.tgs__medal{max-width:100px}.tgs__band{padding:14px 30px}.tgs__band b{font-size:30px}.tgs__body{padding:14px 34px 10px}.tgs__cta{min-height:58px}.tgs__foot button{min-height:50px}}@media (min-width:641px) and (max-height:720px){.tgs--agg .tgs__p--1 .tgs__medal{max-width:136px}.tgs--agg .tgs__medal{max-width:104px}.tgs__hero{padding:22px 40px 18px}.tgs__title{font-size:32px}.tgs__title br{display:none}.tgs__eyebrow{margin-bottom:8px}.tgs__podium{margin-top:12px}.tgs__body{padding:12px 34px 10px}.tgs__p--1 .tgs__medal{max-width:124px}.tgs__medal{max-width:94px}.tgs__who b{font-size:17px}.tgs__p--1 .tgs__who b{font-size:19px}.tgs__band{padding:12px 30px}.tgs__band b{font-size:28px}.tgs__band p{font-size:16px}.tgs__cta{min-height:52px;font-size:18px}.tgs__sub{min-height:40px}}@media (min-width:641px) and (max-height:600px){.tgs--agg .tgs__p--1 .tgs__medal{max-width:116px}.tgs--agg .tgs__medal{max-width:88px}.tgs__hero{padding:20px 40px 16px}.tgs__title{font-size:28px}.tgs__p--1 .tgs__medal{max-width:104px}.tgs__medal{max-width:80px}.tgs__podium{margin-top:10px}.tgs__band{padding:10px 30px}.tgs__body{padding:10px 34px 8px}.tgs__cta{min-height:50px}.tgs__fine{margin-top:2px}.tgs__foot button{min-height:46px}}@media (max-width:640px) and (max-height:760px){.tgs--agg .tgs__medal{max-width:92px}.tgs--agg .tgs__p--1 .tgs__medal{max-width:120px}.tgs__hero{padding:34px 14px 16px}.tgs__title{font-size:27px}.tgs__eyebrow{margin-bottom:8px}.tgs__podium{margin-top:14px}.tgs__medal{max-width:82px}.tgs__p--1 .tgs__medal{max-width:106px}.tgs__who b{font-size:16px}.tgs__p--1 .tgs__who b{font-size:18px}.tgs__band{padding:8px 16px}.tgs__band b{font-size:24px}.tgs__band p{font-size:14.5px}.tgs__body{padding:10px 18px 6px}.tgs__cta{min-height:50px;font-size:17px}.tgs__sub{min-height:36px;margin-top:2px}.tgs__fine{font-size:13px;line-height:1.4}.tgs__foot button{min-height:48px}}@media (max-width:640px) and (max-height:620px){.tgs--agg .tgs__medal{max-width:76px}.tgs--agg .tgs__p--1 .tgs__medal{max-width:98px}.tgs__card{max-height:96vh;max-height:96dvh}.tgs__medal{max-width:68px}.tgs__p--1 .tgs__medal{max-width:88px}.tgs__title{font-size:24px}.tgs__who{margin-top:4px}}.tgsm{position:fixed;left:12px;right:12px;z-index:9000;display:flex;align-items:center;gap:12px;padding:12px 2px 12px 14px;border-radius:18px;border:1.5px solid #e4ff3a;background:linear-gradient(170deg,#1d3a54,#132637 55%,#0a1622);color:#fff;box-shadow:0 0 22px rgba(228,255,58,.28),0 16px 36px rgba(0,0,0,.4);font-family:inherit;opacity:0;transform:translateY(16px);transition:opacity .3s,transform .3s cubic-bezier(.2,.8,.2,1)}.tgsm.is-on{opacity:1;transform:none}.tgsm__seal{flex:0 0 auto;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#e4ff3a;background:#0c1b28;box-shadow:inset 0 0 0 1.5px #e4ff3a}.tgsm__txt{flex:1;min-width:0;line-height:1.3}.tgsm__txt small{display:block;font-size:13px;font-weight:500;color:#e3e9ee}.tgsm__txt b{display:flex;flex-wrap:wrap;align-items:center;column-gap:6px;row-gap:2px;font-size:17px;font-weight:800;letter-spacing:-.01em}.tgsm__txt b i{font-style:normal;font-size:13px;font-weight:700;color:#192f43;background:#e3e9ee;border-radius:5px;padding:1px 5px}.tgsm__go:focus-visible,.tgsm__x:focus-visible{outline:2px solid #e4ff3a;outline-offset:2px}@media (max-width:400px){.tgsm__seal{display:none}.tgsm{padding-left:16px}}.tgsm__go{flex:0 0 auto;min-height:44px;display:flex;align-items:center;padding:0 15px;border:0;border-radius:12px;font:inherit;font-size:15px;font-weight:800;color:#192f43;cursor:pointer;background:linear-gradient(180deg,#efff78,#d8f71e);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 6px 14px -6px rgba(110,140,0,.6)}.tgsm__x{flex:0 0 auto;width:40px;height:44px;border:0;background:transparent;color:#eef3f6;font-family:inherit;font-size:26px;line-height:44px;font-weight:300;cursor:pointer}@media (prefers-reduced-motion:reduce){.tgs__dim,.tgs__card,.tgs__p,.tgsm{transition:none!important}.tgs__p{opacity:1!important;transform:none!important}.tgs__medal:after,.tgs__cta,.tgs__cta:before{animation:none!important}}@media (min-width:641px){.tgsm{left:auto;right:24px;bottom:24px;width:min(460px,calc(100% - 48px))}}.tgsm{box-shadow:0 16px 36px rgba(0,0,0,.4)}@media (hover:none){.tgs__foot button:hover{background:transparent}}.tgs__card{box-shadow:0 0 0 1.5px #e4ff3a,0 2px 8px rgba(0,0,0,.25),0 40px 100px rgba(0,0,0,.55)}@media (max-width:640px){.tgs__card{box-shadow:0 0 0 1.5px #e4ff3a,0 -12px 36px rgba(0,0,0,.35)}}.tgs__fine{text-wrap:balance}.tgs__cta+.tgs__fine{margin-top:12px}@media (max-width:640px),(max-height:720px){.tgs__cta+.tgs__fine{margin-top:10px}}";                                // suneung_popup.css 를 apply.py 가 넣는다

  function laurel(color, n, scale) {                // 월계관 잎 — 원호를 따라 바깥·안쪽 잎을 엇갈려 V자로
    var cx = 60, cy = 60, g = '';
    function leaf(deg, r, tilt, s) {
      var a = deg * Math.PI / 180, x = (cx + r * Math.cos(a)).toFixed(1), y = (cy + r * Math.sin(a)).toFixed(1);
      return '<path d="M0 -11C4.6 -5.5 4.6 5.5 0 11C-4.6 5.5 -4.6 -5.5 0 -11Z" transform="translate(' + x + ' ' + y + ') scale(' + s + ') rotate(' + (deg + tilt) + ')"/>';
    }
    for (var i = 0; i < n; i++) {
      var d = 120 + i * 22, s = ((1 - i * 0.07) * scale).toFixed(2);
      g += leaf(d, 51, 32, s) + leaf(d + 9, 41, -30, s) + leaf(180 - d, 51, -32, s) + leaf(180 - d - 9, 41, 30, s);
    }
    return '<path d="M40.6 101.7A46 46 0 0 1 33.6 22.3M79.4 101.7A46 46 0 0 0 86.4 22.3" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round"/><g fill="' + color + '">' + g + '</g>';
  }
  function medalSvg(score, top, i) {
    var id = 'tgsCoin' + i, txt = String(score), fs = txt.length > 2 ? 25 : 29;
    if (top) {
      return '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs>' +
        '<radialGradient id="' + id + '" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#f2ff9a"/><stop offset=".6" stop-color="#e4ff3a"/><stop offset="1" stop-color="#d3f222"/></radialGradient></defs>' +
        laurel('#e4ff3a', 6, 1) +
        '<circle cx="60" cy="60" r="31" fill="url(#' + id + ')"/><circle cx="60" cy="60" r="26.5" fill="none" stroke="#192f43" stroke-opacity=".28" stroke-width="1.2"/>' +
        '<text x="60" y="61.5" text-anchor="middle" dominant-baseline="central" font-family="Pretendard,inherit,sans-serif" font-size="' + fs + '" font-weight="900" letter-spacing="-.5" fill="#192f43">' + txt + '</text></svg>';
    }
    return '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4d6b"/><stop offset="1" stop-color="#162c40"/></linearGradient></defs>' +
      laurel('#cfdae3', 6, 1) +
      '<circle cx="60" cy="60" r="31" fill="url(#' + id + ')"/><circle cx="60" cy="60" r="31" fill="none" stroke="#cfdae3" stroke-width="2"/><circle cx="60" cy="60" r="26" fill="none" stroke="#cfdae3" stroke-opacity=".45" stroke-width="1"/>' +
      '<text x="60" y="61.5" text-anchor="middle" dominant-baseline="central" font-family="Pretendard,inherit,sans-serif" font-size="' + fs + '" font-weight="900" letter-spacing="-.5" fill="#ffffff">' + txt + '</text></svg>';
  }
  var NAMED = S.some(function (s) { return !!s.surname; });   // 집계형(판정 J1 C2)이면 학교·학년·성 자료가 아예 없다
  function podium() {
    return S.map(function (s, i) {
      var who = s.surname
        ? '<p class="tgs__who"><small>' + s.school + ' ' + s.grade + '학년</small><b>' + s.surname + '<span class="tgs__mk" aria-hidden="true">○○</span><span class="tgs__sr">(이름 일부 비공개)</span></b>' +
          '<span class="tgs__sr"> 영어 ' + s.score + '점</span></p>'
        : '<p class="tgs__who tgs__who--sr"><span class="tgs__sr">영어 ' + s.score + '점</span></p>';
      return '<li class="tgs__p tgs__p--' + (i + 1) + '">' + '<div class="tgs__medal">' + medalSvg(s.score, i === 0, i) + '</div>' + who + '</li>';
    }).join('');
  }
  var scoreLine = S.map(function (s) { return s.score; }).join(' · ') + '점';

  function addCss() { if (document.getElementById('tgs-css')) return; var st = document.createElement('style'); st.id = 'tgs-css'; st.textContent = css; document.head.appendChild(st); }
  function expire(fn) {                              // 열려 있는 채로 종료 시각(12/11 0시)을 넘기면 스스로 닫는다(R2 GPT)
    var left = UNTIL - Date.now();
    if (left <= 0) { fn(); return; }                 // 이미 지났으면 곧바로 닫는다(R3 GPT)
    if (left < 2147483647) setTimeout(fn, left);
  }
  function seen() { set('sessionStorage', KEY + '_seen', '1'); }

  /* ---------- 작은 띠 ---------- */
  function openMini(done) {
    addCss();
    var bar = document.createElement('div');
    bar.className = 'tgsm';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', '2027학년도 수능 영어 결과 안내');
    bar.innerHTML = '<span class="tgsm__seal" aria-hidden="true">' + S[0].score + '</span>' +
      '<span class="tgsm__txt"><small>2027학년도 수능 영어</small><b>' + scoreLine + ' <i>가채점</i></b></span>' +
      '<button type="button" class="tgsm__go">자세히</button>' +
      '<button type="button" class="tgsm__x" aria-label="안내 닫기">×</button>';
    var sticky = document.querySelector('.tg-sticky');
    var off = (sticky && getComputedStyle(sticky).display !== 'none') ? sticky.offsetHeight : 0;
    bar.style.bottom = 'calc(' + (off + 18) + 'px + ' + (off ? '0px' : 'env(safe-area-inset-bottom)') + ')';
    document.body.appendChild(bar);
    seen();
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add('is-on'); }); });
    var gone = false;
    function rm() {                                  // 띠를 걷고 다음 차례(결과 팝업 띠)로
      if (gone) return; gone = true;
      var had = bar.contains(document.activeElement);
      bar.classList.remove('is-on'); setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); done(); if (had) M.refocus(); }, reduce ? 0 : 300);
    }
    bar.querySelector('.tgsm__x').addEventListener('click', function () { rm(); });
    bar.querySelector('.tgsm__go').addEventListener('click', function () {   // 사용자가 눌렀을 때만 큰 창 — 띠는 바로 걷어 초점 복귀 대상이 되지 않게(R2 GPT)
      if (gone) return; gone = true;
      if (bar.parentNode) bar.parentNode.removeChild(bar);
      if (P.ok()) M.openOne(P); else done();
    });
    expire(function () { rm(); });
  }

  /* ---------- 팝업 ---------- */
  function build() {
    var r = document.createElement('div');
    r.className = NAMED ? 'tgs' : 'tgs tgs--agg';
    r.innerHTML =
      '<div class="tgs__dim" data-close></div>' +
      '<div class="tgs__card" role="dialog" aria-modal="true" aria-labelledby="tgs-title" aria-describedby="tgs-desc tgs-fine" tabindex="-1">' +
        '<div class="tgs__grab" aria-hidden="true"></div>' +
        '<div class="tgs__hero">' +
          '<button type="button" class="tgs__x" data-close aria-label="닫기">×</button>' +
          '<span class="tgs__frame" aria-hidden="true"></span>' +
          '<p class="tgs__kicker" aria-hidden="true">Congratulations</p>' +
          '<p class="tgs__eyebrow">2027학년도 수능 영어 <i>가채점</i></p>' +
          '<h2 class="tgs__title" id="tgs-title">수능 영어 <em>만점</em>이 <br>나왔습니다</h2>' +
          '<ol class="tgs__podium" aria-label="학생별 영어 점수">' + podium() + '</ol>' +
        '</div>' +
        '<div class="tgs__band" id="tgs-desc">' +
          '<b>3<small>년 이상</small></b>' +
          '<p>세 학생 모두 <strong>탑그래머</strong>에서<br>3년 이상 공부했습니다.</p>' +
        '</div>' +
        '<div class="tgs__body">' +
          '<a class="tgs__cta" href="leveltest.html"><span>레벨테스트 신청하기</span> <i aria-hidden="true">→</i></a>' +
          '<p class="tgs__fine" id="tgs-fine">공식 성적 통지 전의 가채점 점수입니다.' + (NAMED ? ' 게재 내용의 수정·삭제를 원하시면 학원으로 연락 주십시오.' : '') + '</p>' +
        '</div>' +
        '<div class="tgs__foot">' +
          '<button type="button" data-week>7일간 보지 않기</button>' +
          '<button type="button" data-close>닫기</button>' +
        '</div>' +
      '</div>';
    r.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-close],[data-week]') : null;
      if (!el) return;
      if (el.classList.contains('tgs__dim')) M.closeAll('esc');   // 바깥 어두운 곳 = Esc 와 같은 뜻
      else M.close('suneung', el.hasAttribute('data-week') ? 'week' : 'x');
    });
    return r;
  }
  function canKeep() { set('localStorage', KEY + '_t', '1'); var ok = get('localStorage', KEY + '_t') === '1'; try { localStorage.removeItem(KEY + '_t'); } catch (e) {} return ok; }
  function swipe(card) {                             // 휴대폰: 손잡이·머리를 아래로 끌어 닫기
    var y0 = null, dy = 0, h = 0;
    card.addEventListener('touchstart', function (e) {
      if (card.scrollTop > 0 || !e.target.closest('.tgs__grab,.tgs__hero')) { y0 = null; return; }
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
      if (dy > Math.min(120, h * 0.22)) M.closeAll('esc'); else card.style.transform = '';
    });
  }
  var P = {
    id: 'suneung', order: 1, mini: MINI, card: '.tgs__card',
    ok: function () { return Date.now() < UNTIL && !HASH.test(location.hash); },   // 종료 직후 남은 띠의 «자세히»로 다시 열리지 않게(R3 GPT)
    make: function () { addCss(); var r = build(); if (!canKeep()) { var wk = r.querySelector('[data-week]'); if (wk) wk.parentNode.removeChild(wk); } return r; },
    opened: function (root, card, paired) { seen(); expire(function () { M.close('suneung', 'x'); }); if (mobile && !paired) swipe(card); },
    closed: function (mode) {                         // «7일간 보지 않기»는 이 팝업만 쉰다(2026-11-20 두 팝업 모두 띄우기로 교차 숨김 철회)
      if (mode !== 'week') return;
      var t = new Date(); t.setHours(24, 0, 0, 0); set('localStorage', KEY + '_hide', String(t.getTime() + 6 * 864e5));
    },
    openMini: openMini, seen: seen
  };
  M.add(P);
})();
