'use strict';
const menu = document.querySelector('.site-header__hamburger');
const nav = document.querySelector('.site-nav');
nav.id = 'preview-navigation';
menu.setAttribute('aria-controls',nav.id);
menu.setAttribute('aria-expanded','false');
function closeMenu(){nav.classList.remove('preview-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','메뉴 열기');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('preview-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');if(open)nav.querySelector('a[href]')?.focus();});
document.addEventListener('keydown',e=>{
  if(menu.getAttribute('aria-expanded')!=='true')return;
  if(e.key==='Escape'){closeMenu();menu.focus();return;}
  if(e.key==='Tab'){
    const links=[...nav.querySelectorAll('a[href]')];
    const first=links[0],last=links[links.length-1];
    if(document.activeElement===menu){e.preventDefault();(e.shiftKey?last:first).focus();}
    else if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)){e.preventDefault();menu.focus();}
  }
});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
matchMedia('(min-width:1024px)').addEventListener('change',closeMenu);
