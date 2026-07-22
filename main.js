/* Savitur Swarup — interactions
   Kept dependency-free and light: scroll reveals, nav state,
   ambient cursor glow, subtle aura parallax. */

(function () {
  'use strict';

  /* ---- staggered scroll reveals ----
     Scroll-driven (not IntersectionObserver) so it's robust to instant
     anchor jumps that skip sections entirely: after any scroll settles,
     everything above the threshold line is revealed. */
  const reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  // stagger siblings within a shared parent for a nicer cascade
  const grouped = new Map();
  reveals.forEach((el) => {
    const key = el.parentElement;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(el);
  });
  grouped.forEach((els) => {
    els.forEach((el, i) => { el.style.transitionDelay = (i * 80) + 'ms'; });
  });

  let pending = reveals.slice();
  let ticking = false;
  const checkReveals = () => {
    ticking = false;
    const line = window.innerHeight * 0.9;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top < line) {
        el.classList.add('is-in');
        return false;
      }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', requestCheck);
      window.removeEventListener('resize', requestCheck);
    }
  };
  const requestCheck = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(checkReveals); }
  };
  window.addEventListener('scroll', requestCheck, { passive: true });
  window.addEventListener('resize', requestCheck, { passive: true });
  requestCheck();

  /* ---- count-up for research stats ---- */
  const statNums = document.querySelectorAll('.stat b');
  if (statNums.length && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        countIO.unobserve(el);
        const target = parseFloat(el.textContent);
        const decimals = (el.textContent.split('.')[1] || '').length;
        const dur = 1100, t0 = performance.now();
        const step = (now) => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target.toFixed(decimals);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    statNums.forEach((el) => countIO.observe(el));
  }

  /* ---- scroll-spy: highlight the section you're in (deterministic) ---- */
  const spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[data-spy]'));
  const spyTargets = spyLinks
    .map((a) => document.getElementById(a.getAttribute('data-spy')))
    .filter(Boolean);
  let spyActive = null;
  const updateSpy = () => {
    if (!spyTargets.length) return;
    const line = window.innerHeight * 0.35;
    let current = spyTargets[0].id;
    for (let i = 0; i < spyTargets.length; i++) {
      if (spyTargets[i].getBoundingClientRect().top - line <= 0) current = spyTargets[i].id;
    }
    // clear highlight at the very top (hero, above the first section)
    if (spyTargets[0].getBoundingClientRect().top - line > 0) current = null;
    if (current === spyActive) return;
    spyActive = current;
    spyLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('data-spy') === current));
  };

  /* ---- nav background + scroll-progress bar + scroll-spy ---- */
  const nav = document.getElementById('nav');
  const prog = document.getElementById('scrollProg');
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
    if (prog) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    }
    updateSpy();
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- cursor glow (pointer devices only) ---- */
  const glow = document.querySelector('.cursor-glow');
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (glow && finePointer) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const render = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.left = cx + 'px';
      glow.style.top = cy + 'px';
      raf = Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5
        ? requestAnimationFrame(render) : null;
    };
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(render);
    });
    window.addEventListener('pointerleave', () => { glow.style.opacity = '0'; });
  }

  /* ---- subtle aura parallax on scroll ---- */
  const aura = document.querySelector('.aura');
  if (aura && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY * 0.15;
      aura.style.transform = 'translateX(-50%) translateY(' + y + 'px)';
    }, { passive: true });
  }

})();
