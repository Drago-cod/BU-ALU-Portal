/**
 * BU Alumni Portal — Theme System
 *
 * Three themes: default (light blue), light (pure white), dark
 * - Persisted in localStorage
 * - Respects prefers-color-scheme on first visit
 * - Injects a toggle button into the header nav-actions
 * - Smooth CSS transition on every colour change
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'bu-theme';
  const THEMES      = ['default', 'light', 'dark'];

  const LABELS = {
    default: 'Default',
    light:   'Light',
    dark:    'Dark',
  };

  // Material icon names for each theme
  const ICONS = {
    default: 'auto_awesome',
    light:   'light_mode',
    dark:    'dark_mode',
  };

  // ── Resolve initial theme ──────────────────────────────────────────────────
  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.includes(stored)) return stored;
    // Respect OS preference on first visit
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'default';
  }

  // ── Apply theme to <html> ──────────────────────────────────────────────────
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // ── Cycle: default → light → dark → default ───────────────────────────────
  function nextTheme(current) {
    const idx = THEMES.indexOf(current);
    return THEMES[(idx + 1) % THEMES.length];
  }

  // ── Build the toggle button ────────────────────────────────────────────────
  function buildToggle(currentTheme) {
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.id        = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Switch theme');
    btn.setAttribute('title', 'Switch theme');
    updateToggleUI(btn, currentTheme);
    return btn;
  }

  function updateToggleUI(btn, theme) {
    btn.innerHTML =
      `<span class="material-icons-round theme-toggle-icon">${ICONS[theme]}</span>` +
      `<span class="theme-toggle-label">${LABELS[theme]}</span>`;
    btn.setAttribute('data-theme-current', theme);
  }

  // ── Inject into header ─────────────────────────────────────────────────────
  function injectToggle(theme) {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const btn = buildToggle(theme);

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'default';
      const next    = nextTheme(current);
      applyTheme(next);
      updateToggleUI(btn, next);

      // Also update mobile nav toggle if it exists
      const mobileBtn = document.getElementById('theme-toggle-mobile');
      if (mobileBtn) updateToggleUI(mobileBtn, next);
    });

    // Insert before the first child (before Login/Register)
    navActions.insertBefore(btn, navActions.firstChild);

    // Also add to mobile nav
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
      const mobileBtn = btn.cloneNode(true);
      mobileBtn.id = 'theme-toggle-mobile';
      mobileBtn.className = 'theme-toggle theme-toggle--mobile';
      mobileBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'default';
        const next    = nextTheme(current);
        applyTheme(next);
        updateToggleUI(btn, next);
        updateToggleUI(mobileBtn, next);
      });
      // Insert after the divider
      const divider = mobileNav.querySelector('.mobile-nav-divider');
      if (divider) {
        mobileNav.insertBefore(mobileBtn, divider.nextSibling);
      } else {
        mobileNav.appendChild(mobileBtn);
      }
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  // Apply theme immediately (before paint) to avoid flash
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  document.addEventListener('DOMContentLoaded', () => {
    injectToggle(initialTheme);
  });

})();
