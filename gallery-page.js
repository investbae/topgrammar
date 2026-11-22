'use strict';
/* 탑그래머 사진 모음(gallery.html) — 확대 보기 · 2026-11-22
   · 사진(a.tg-pg__item)을 누르면 크게 보기, 좌우 버튼·화살표 키·밀기로 넘김, Esc·바깥 누르기로 닫음
   · 주소 끝 #사진번호(예: gallery.html#hj-05)로 들어오면 그 사진을 바로 연다(첫 화면 사진 링크)
   · 스크립트가 없으면 링크가 사진 파일을 그대로 연다 */
(() => {
  const items = Array.from(document.querySelectorAll('.tg-pg__item'));
  const lb = document.getElementById('pgLightbox');
  if (!items.length || !lb) return;
  const img = lb.querySelector('.lightbox__img');
  const cap = lb.querySelector('.tg-pg-lb__cap');
  const cnt = lb.querySelector('.lightbox__counter');
  const btnClose = lb.querySelector('.lightbox__close');
  const btnPrev = lb.querySelector('.lightbox__nav--prev');
  const btnNext = lb.querySelector('.lightbox__nav--next');
  const controls = [btnClose, btnPrev, btnNext];
  const base = location.pathname + location.search;
  let idx = -1;

  function setHash(id) {
    try { history.replaceState(null, '', id ? base + '#' + id : base); } catch (e) { /* 파일로 열 때 등 */ }
  }
  function preload(i) {
    const n = items[(i + items.length) % items.length];
    const p = new Image();
    p.src = n.getAttribute('href');
  }
  function show(i) {
    idx = (i + items.length) % items.length;
    const a = items[idx];
    const t = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = t ? t.alt : '';
    cap.textContent = a.getAttribute('data-cap') || img.alt;
    cnt.textContent = (idx + 1) + ' / ' + items.length;
    setHash(a.id);
    preload(idx + 1);
    preload(idx - 1);
  }
  function isOpen() { return lb.classList.contains('is-active'); }
  function open(i) {
    show(i);
    lb.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  }
  function close() {
    if (!isOpen()) return;
    lb.classList.remove('is-active');
    document.body.style.overflow = '';
    setHash('');
    const a = items[idx];
    if (a) {
      a.focus({ preventScroll: true });
      a.scrollIntoView({ block: 'nearest' });
    }
  }

  items.forEach((a, i) => {
    a.addEventListener('click', e => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;   // 새 탭 열기 등은 그대로
      e.preventDefault();
      open(i);
    });
  });
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => show(idx - 1));
  btnNext.addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => {
    if (e.target === lb || e.target.classList.contains('tg-pg-lb__fig')) close();
  });
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
    else if (e.key === 'Tab') {                                   // 확대 보기 안에서만 초점이 돈다
      const k = controls.indexOf(document.activeElement);
      e.preventDefault();
      const next = k < 0 ? 0 : (k + (e.shiftKey ? -1 : 1) + controls.length) % controls.length;
      controls[next].focus();
    }
  });
  let sx = null, sy = 0;
  lb.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  function fromHash() {
    let h = '';
    try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    const i = items.findIndex(a => a.id === h);
    if (i < 0) return;
    items[i].scrollIntoView({ block: 'center' });
    if (isOpen()) show(i); else open(i);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
