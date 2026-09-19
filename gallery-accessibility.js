'use strict';
(() => {
  const dialog = document.getElementById('galleryLightbox');
  if (!dialog) return;
  dialog.setAttribute('aria-modal', 'true');
  const image = dialog.querySelector('.lightbox__img');
  if (image && !image.getAttribute('src')) image.removeAttribute('src');
  let trigger = null;
  const controls = [...dialog.querySelectorAll('button')];
  document.querySelectorAll('.campus-gallery__item').forEach(item => {
    item.setAttribute('role', 'button');
    item.tabIndex = 0;
    item.setAttribute('aria-haspopup', 'dialog');
    item.setAttribute('aria-label', (item.querySelector('img')?.alt || '캠퍼스 사진') + ' 확대 보기');
    item.addEventListener('click', () => { trigger = item; });
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); item.click();
      }
    });
  });
  new MutationObserver(() => {
    if (dialog.classList.contains('is-active')) controls[0]?.focus();
    else trigger?.focus({preventScroll: true});
  }).observe(dialog, {attributes: true, attributeFilter: ['class']});
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
})();
