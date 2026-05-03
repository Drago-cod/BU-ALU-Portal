/**
 * BU Alumni Portal — Enhanced Animations v2
 *
 * Features:
 *  - Page entrance with blur + fade
 *  - Scroll-triggered reveals (fade-up, slide, scale) with spring easing
 *  - Staggered children with natural timing curve
 *  - Parallax hero visual on scroll
 *  - Magnetic hover on primary buttons
 *  - Ripple click effect
 *  - Animated stat counters with easing
 *  - Thermometer fill on scroll
 *  - Scroll progress bar
 *  - Nav shrink + blur on scroll
 *  - Mobile nav toggle
 *  - Smooth anchor scroll
 *  - Card tilt on hover (subtle 3-D)
 *  - Active nav link highlight based on scroll position
 */

'use strict';

/* ── Utilities ────────────────────────────────────────────── */

/** Ease-out cubic */
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/** Clamp a value between min and max */
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

/** Linear interpolate */
function lerp(a, b, t) { return a + (b - a) * t; }

/** Respect prefers-reduced-motion */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. Page entrance ─────────────────────────────────────── */
document.documentElement.classList.add('page-ready');

/* ── 2. Scroll progress bar ───────────────────────────────── */
(function () {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  function updateProgress() {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${total > 0 ? scrolled / total : 0})`;
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
})();

/* ── 3. Intersection Observer — scroll reveals ────────────── */
const REVEAL_CLASSES = [
  '.fade-up', '.fade-in', '.slide-left', '.slide-right',
  '.scale-in', '.stagger-children', '.scroll-reveal',
  '.fade-in-up', '.fade-in-left', '.fade-in-right',
];

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;

    if (reducedMotion) {
      el.classList.add('in-view');
      io.unobserve(el);
      return;
    }

    // Small random delay per element for a more organic feel
    const baseDelay = parseFloat(el.dataset.delay || 0);
    el.style.transitionDelay = baseDelay + 'ms';

    el.classList.add('in-view');
    io.unobserve(el);
  });
}, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }); // Reduced threshold and margin for earlier trigger

document.querySelectorAll(REVEAL_CLASSES.join(', ')).forEach((el) => io.observe(el));

/* ── 4. Stagger children — natural timing curve ───────────── */
document.querySelectorAll('.stagger-children').forEach((parent) => {
  const children = [...parent.children];
  children.forEach((child, i) => {
    // Ease-in timing: first items appear quickly, later ones slow down slightly
    const delay = Math.round(i * 70 + Math.pow(i, 1.2) * 8);
    child.style.transitionDelay = delay + 'ms';
  });
});

/* ── 5. Nav shrink + blur on scroll ──────────────────────── */
const header = document.querySelector('.site-header');
if (header) {
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('nav-scrolled', y > 40);
    // Hide nav when scrolling down fast, show when scrolling up
    if (!reducedMotion) {
      header.style.transform = (y > lastY + 8 && y > 120)
        ? 'translateY(-100%)'
        : 'translateY(0)';
    }
    lastY = y;
  }, { passive: true });
}

/* ── 6. Mobile nav toggle ─────────────────────────────────── */
const navToggleButton = document.querySelector('.nav-toggle');
const mobileNav       = document.getElementById('mobile-nav');

function setMobileNavOpen(isOpen) {
  if (!mobileNav || !navToggleButton) return;
  mobileNav.classList.toggle('open', isOpen);
  navToggleButton.setAttribute('aria-expanded', String(isOpen));
  navToggleButton.innerHTML = isOpen ? '&#10005;' : '&#9776;';
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

if (navToggleButton && mobileNav) {
  navToggleButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileNavOpen(!mobileNav.classList.contains('open'));
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMobileNavOpen(false));
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#mobile-nav') &&
        !e.target.closest('.nav-toggle') &&
        mobileNav.classList.contains('open')) {
      setMobileNavOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 920) setMobileNavOpen(false);
  });
}

/* ── 7. Button ripple ─────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn || reducedMotion) return;
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  const rect = btn.getBoundingClientRect();
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top  = (e.clientY - rect.top)  + 'px';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});

/* ── 8. Magnetic buttons ──────────────────────────────────── */
if (!reducedMotion) {
  document.querySelectorAll('.btn-primary, .sfb-trigger').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect   = btn.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) * 0.35;
      const dy     = (e.clientY - cy) * 0.35;
      btn.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
      btn.style.transition = 'transform 0.1s ease-out';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });
  });
}

/* ── 9. Card tilt (subtle 3-D) ────────────────────────────── */
if (!reducedMotion) {
  const TILT_CARDS = [
    '.alumni-hub-card', '.event-strip-card', '.testimonial-card',
    '.value-card', '.resource-card', '.tier-card', '.leader-card', '.stat-card', '.content-card', '.hero-card'
  ].join(', ');

  document.querySelectorAll(TILT_CARDS).forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect  = card.getBoundingClientRect();
      const x     = (e.clientX - rect.left) / rect.width  - 0.5;
      const y     = (e.clientY - rect.top)  / rect.height - 0.5;
      const rotX  = clamp(-y * 12, -10, 10);
      const rotY  = clamp( x * 12, -10, 10);
      card.style.transform =
        `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px) scale(1.02)`;
      card.style.transition = 'transform 0.1s ease-out';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.5s ease';
    });
  });
}

/* ── 10. Parallax hero visual ─────────────────────────────── */
if (!reducedMotion) {
  const heroVisuals = document.querySelectorAll('.hero-visual, .plog-slideshow');
  if (heroVisuals.length) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroVisuals.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        el.style.transform = `translateY(${y * 0.12}px)`;
      });
    }, { passive: true });
  }
}

/* ── 11. Animated stat counters with easing ──────────────── */
function animateCounter(el) {
  const target   = +el.dataset.target;
  const duration = reducedMotion ? 0 : 1600;
  const start    = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value    = Math.floor(easeOut(progress) * target);
    el.textContent = value.toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString();
  }

  requestAnimationFrame(tick);
}

window.BUAnimateCounters = function () {
  document.querySelectorAll('.stat-bar-num[data-target]').forEach(animateCounter);
};

const statsBar = document.querySelector('.stats-bar');
if (statsBar) {
  const statsObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      window.BUAnimateCounters();
      statsObs.disconnect();
    }
  }, { threshold: 0.3 });
  statsObs.observe(statsBar);
}

/* ── 12. Thermometer fill ─────────────────────────────────── */
document.querySelectorAll('.thermometer-fill').forEach((fill) => {
  const target = fill.style.width;
  fill.style.width = '0%';
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      // Small delay so the bar is visible before animating
      setTimeout(() => { fill.style.width = target; }, 200);
      obs.disconnect();
    }
  }, { threshold: 0.5 });
  obs.observe(fill);
});

/* ── 13. Smooth anchor scroll ─────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id     = a.getAttribute('href');
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
});

/* ── 14. Number ticker on stat cards (mission stats) ─────── */
(function () {
  const statNums = document.querySelectorAll('.mission-stat-num, .stat-value');
  if (!statNums.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el   = entry.target;
      const text = el.textContent.trim();
      // Extract leading number
      const match = text.match(/^[\d,]+/);
      if (!match) return;
      const target = parseInt(match[0].replace(/,/g, ''), 10);
      if (isNaN(target) || target === 0) return;
      const suffix = text.slice(match[0].length);
      const duration = reducedMotion ? 0 : 1400;
      const start    = performance.now();

      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.floor(easeOut(p) * target).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString() + suffix;
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.4 });

  statNums.forEach((el) => obs.observe(el));
})();

/* ── 15. Active nav link on scroll ───────────────────────── */
(function () {
  const sections = document.querySelectorAll('main [id]');
  const navLinks = document.querySelectorAll('.nav a, .mobile-nav a');
  if (!sections.length || !navLinks.length) return;

  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        link.classList.toggle('active', href === '#' + id || href.endsWith('#' + id));
      });
    });
  }, { threshold: 0.4 });

  sections.forEach((s) => sectionObs.observe(s));
})();

/* ── 16. Animate section title underline on reveal ───────── */
(function () {
  const titleObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        titleObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.section-title-wrap').forEach((el) => titleObs.observe(el));
})();

/* ── 17. Floating label inputs ────────────────────────────── */
document.querySelectorAll('.form-group input, .form-group textarea').forEach((input) => {
  function update() {
    input.classList.toggle('has-value', input.value.trim().length > 0);
  }
  input.addEventListener('input', update);
  input.addEventListener('blur',  update);
  update();
});
