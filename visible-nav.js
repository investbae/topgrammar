'use strict';
// The shared legacy menu marks closed mobile navigation inert. This layout
// keeps navigation visible at every breakpoint, so its links stay interactive.
(() => {
 const nav = document.querySelector('.site-nav');
 if (!nav) return;
 const enable = () => { if (nav.inert) nav.inert = false; };
 enable();
 new MutationObserver(enable).observe(nav, {attributes:true, attributeFilter:['inert']});
})();
