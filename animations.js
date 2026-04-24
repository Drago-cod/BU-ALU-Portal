/* ── BU Alumni Portal — Shared Animations ── */

// Page fade-in on load
document.documentElement.classList.add('page-ready');

// Intersection Observer — triggers .in-view on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

// Observe all animatable elements
document.querySelectorAll(
  '.fade-up, .fade-in, .slide-left, .slide-right, ' +
  '.stagger-children, .scale-in'
).forEach(el => io.observe(el));

// Stagger children automatically
document.querySelectorAll('.stagger-children').forEach(parent => {
  [...parent.children].forEach((child, i) => {
    child.style.transitionDelay = `${i * 80}ms`;
  });
});

// Nav shrink on scroll
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('nav-scrolled', window.scrollY > 40);
  }, { passive: true });
}

// Mobile nav toggle (shared across all pages)
const navToggleButton = document.querySelector('.nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

function setMobileNavOpen(isOpen) {
  if (!mobileNav || !navToggleButton) return;
  mobileNav.classList.toggle('open', isOpen);
  navToggleButton.setAttribute('aria-expanded', String(isOpen));
  navToggleButton.innerHTML = isOpen ? '&#10005;' : '&#9776;';
}

if (navToggleButton && mobileNav) {
  navToggleButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMobileNavOpen(!mobileNav.classList.contains('open'));
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMobileNavOpen(false));
  });

  document.addEventListener('click', (event) => {
    const clickInsideMenu = event.target.closest('#mobile-nav');
    const clickOnButton = event.target.closest('.nav-toggle');
    if (!clickInsideMenu && !clickOnButton && mobileNav.classList.contains('open')) {
      setMobileNavOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 920 && mobileNav.classList.contains('open')) {
      setMobileNavOpen(false);
    }
  });
}

// Button ripple effect
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  const rect = btn.getBoundingClientRect();
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top  = `${e.clientY - rect.top}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});

// Animated stat counters (stats-bar)
function animateCounters() {
  document.querySelectorAll('.stat-bar-num[data-target]').forEach(el => {
    const target = +el.dataset.target;
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

window.BUAnimateCounters = animateCounters;

const statsBar = document.querySelector('.stats-bar');
if (statsBar) {
  const statsObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animateCounters(); statsObs.disconnect(); }
  }, { threshold: 0.3 });
  statsObs.observe(statsBar);
}

// Thermometer fill animation on scroll
document.querySelectorAll('.thermometer-fill').forEach(fill => {
  const target = fill.style.width;
  fill.style.width = '0%';
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      fill.style.width = target;
      obs.disconnect();
    }
  }, { threshold: 0.5 });
  obs.observe(fill);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
