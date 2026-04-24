/**
 * BU Alumni Portal — Social Sharing v2
 *
 * Webflow-style "fan-out" share button:
 *   • One pill button labelled "Share"
 *   • Click → expands into individual platform icon pills that fan out
 *   • Click again (or outside) → collapses back
 *   • On mobile: uses native Web Share API if available
 *
 * Two modes:
 *   1. Floating FAB  — fixed bottom-right, shares the current page
 *   2. Inline        — any element with class "share-btn" + data-share-* attrs
 *      gets replaced with a fan-out widget
 */

(function () {
  'use strict';

  /* ── SVG icons ────────────────────────────────────────────────────────────── */
  const ICONS = {
    share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"
              stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                 <path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2c-5.5 0-9.97 4.46-9.97 9.97
                   0 1.75.46 3.46 1.33 4.96L2 22l5.2-1.36a9.93 9.93 0 0 0 4.83 1.23h.01
                   c5.5 0 9.97-4.46 9.97-9.97a9.9 9.9 0 0 0-2.91-7zM12.04 20.18h-.01
                   a8.3 8.3 0 0 1-4.24-1.16l-.3-.18-3.09.81.82-3.01-.2-.31
                   a8.29 8.29 0 0 1-1.28-4.42c0-4.58 3.72-8.3 8.31-8.3 2.22 0 4.3.87
                   5.86 2.43a8.26 8.26 0 0 1 2.43 5.87c0 4.59-3.73 8.31-8.3 8.31z
                   m4.56-6.23c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.57.12
                   -.17.26-.65.8-.79.96-.15.17-.29.19-.54.07-.25-.13-1.05-.38-2-1.2
                   -.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.39.11-.52.11-.11.25-.29
                   .37-.43.12-.15.17-.25.25-.42.09-.17.04-.31-.02-.44-.06-.13-.57-1.38
                   -.78-1.89-.21-.5-.42-.43-.57-.43h-.49c-.17 0-.44.06-.67.31
                   -.23.26-.88.86-.88 2.09s.9 2.43 1.02 2.6c.12.17 1.77 2.7 4.28 3.79
                   .6.26 1.06.42 1.42.54.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19
                   .21-.59.21-1.09.15-1.19-.06-.11-.23-.17-.48-.3z"/>
               </svg>`,
    facebook: `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                 <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
               </svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817
                  L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52
                  h1.833L7.084 4.126H5.117z"/>
              </svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                 <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4
                   v-7a6 6 0 0 1 6-6z"/>
                 <rect x="2" y="9" width="4" height="12"/>
                 <circle cx="4" cy="4" r="2"/>
               </svg>`,
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6
                c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" width="17" height="17" aria-hidden="true">
             <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
             <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
           </svg>`,
  };

  /* ── Platform config ──────────────────────────────────────────────────────── */
  const PLATFORMS = [
    { key: 'whatsapp', label: 'WhatsApp', color: '#25d366', textColor: '#fff',
      href: (t, x, u) => `https://wa.me/?text=${enc(t + (x ? ' — ' + x : '') + '\n' + u)}` },
    { key: 'facebook', label: 'Facebook', color: '#1877f2', textColor: '#fff',
      href: (t, x, u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}&quote=${enc(t)}` },
    { key: 'twitter',  label: 'X',        color: '#000',    textColor: '#fff',
      href: (t, x, u) => `https://twitter.com/intent/tweet?text=${enc(t + (x ? ' — ' + x : ''))}&url=${enc(u)}` },
    { key: 'linkedin', label: 'LinkedIn', color: '#0a66c2', textColor: '#fff',
      href: (t, x, u) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}` },
    { key: 'email',    label: 'Email',    color: '#6366f1', textColor: '#fff',
      href: (t, x, u) => `mailto:?subject=${enc(t)}&body=${enc((x || t) + '\n\n' + u)}` },
    { key: 'copy',     label: 'Copy',     color: '#374151', textColor: '#fff', href: null },
  ];

  function enc(s) { return encodeURIComponent(s); }

  /* ── Copy to clipboard ────────────────────────────────────────────────────── */
  function copyLink(url, pill) {
    const label = pill.querySelector('.sfb-pill-label');
    const orig  = label ? label.textContent : '';
    navigator.clipboard.writeText(url).then(() => {
      if (label) label.textContent = 'Copied!';
      pill.style.background = '#16a34a';
      setTimeout(() => {
        if (label) label.textContent = orig;
        pill.style.background = '';
      }, 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url; ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    });
  }

  /* ── Build a fan-out widget ───────────────────────────────────────────────── */
  function buildWidget(opts) {
    /*
     * opts = { title, text, url, fab: bool, label: string }
     * Returns a <div class="sfb-wrap"> element.
     */
    const wrap = document.createElement('div');
    wrap.className = 'sfb-wrap' + (opts.fab ? ' sfb-wrap--fab' : '');
    wrap.setAttribute('data-open', 'false');

    /* Main trigger pill */
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'sfb-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Share');
    trigger.innerHTML =
      `<span class="sfb-trigger-icon sfb-trigger-icon--share">${ICONS.share}</span>` +
      `<span class="sfb-trigger-icon sfb-trigger-icon--close">${ICONS.close}</span>` +
      `<span class="sfb-trigger-label">${opts.label || 'Share'}</span>`;
    wrap.appendChild(trigger);

    /* Platform pills container */
    const pills = document.createElement('div');
    pills.className = 'sfb-pills';
    pills.setAttribute('role', 'group');
    pills.setAttribute('aria-label', 'Share on');

    PLATFORMS.forEach((p, i) => {
      const pill = document.createElement(p.href ? 'a' : 'button');
      pill.className = 'sfb-pill sfb-pill--' + p.key;
      pill.setAttribute('aria-label', p.label);
      pill.style.setProperty('--sfb-color', p.color);
      pill.style.setProperty('--sfb-text',  p.textColor);
      pill.style.setProperty('--sfb-delay', (i * 35) + 'ms');

      if (p.href) {
        pill.href   = p.href(opts.title, opts.text, opts.url);
        pill.target = '_blank';
        pill.rel    = 'noopener noreferrer';
      } else {
        pill.type = 'button';
        pill.addEventListener('click', () => copyLink(opts.url, pill));
      }

      pill.innerHTML =
        `<span class="sfb-pill-icon">${ICONS[p.key]}</span>` +
        `<span class="sfb-pill-label">${p.label}</span>`;

      pills.appendChild(pill);
    });

    wrap.appendChild(pills);

    /* Toggle logic */
    let open = false;

    function openWidget() {
      open = true;
      wrap.setAttribute('data-open', 'true');
      trigger.setAttribute('aria-expanded', 'true');
      // Update live hrefs in case URL changed (SPA-friendly)
      pills.querySelectorAll('a.sfb-pill').forEach((pill) => {
        const p = PLATFORMS.find((x) => pill.classList.contains('sfb-pill--' + x.key));
        if (p && p.href) pill.href = p.href(opts.title, opts.text, opts.url || pageUrl());
      });
      setTimeout(() => document.addEventListener('click', outsideClick, { once: true }), 0);
      document.addEventListener('keydown', escClose);
    }

    function closeWidget() {
      open = false;
      wrap.setAttribute('data-open', 'false');
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', escClose);
    }

    function outsideClick(e) {
      if (!wrap.contains(e.target)) closeWidget();
    }

    function escClose(e) {
      if (e.key === 'Escape') { closeWidget(); document.removeEventListener('keydown', escClose); }
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // On mobile use native share if available (FAB only)
      if (opts.fab && navigator.share) {
        navigator.share({ title: opts.title, text: opts.text, url: opts.url || pageUrl() })
          .catch(() => {});
        return;
      }
      open ? closeWidget() : openWidget();
    });

    return wrap;
  }

  /* ── Page helpers ─────────────────────────────────────────────────────────── */
  function pageUrl()   { return window.location.href; }
  function pageTitle() { return document.title || 'BU Alumni Portal'; }

  /* ── Floating FAB ─────────────────────────────────────────────────────────── */
  function injectFAB() {
    const widget = buildWidget({
      title: pageTitle(),
      text:  '',
      url:   pageUrl(),
      fab:   true,
      label: 'Share',
    });
    widget.classList.add('sfb-wrap--fab');
    document.body.appendChild(widget);
  }

  /* ── Inline share buttons ─────────────────────────────────────────────────── */
  function wireInlineButtons() {
    document.querySelectorAll('.share-btn').forEach((btn) => {
      const title = btn.dataset.shareTitle || pageTitle();
      const text  = btn.dataset.shareText  || '';
      const url   = btn.dataset.shareUrl   || pageUrl();
      const label = btn.textContent.trim().replace(/^share\s*/i, '') || 'Share';

      const widget = buildWidget({ title, text, url, fab: false, label: 'Share' });

      // Preserve any extra classes the original button had
      btn.classList.forEach((c) => { if (c !== 'share-btn') widget.classList.add(c); });
      btn.replaceWith(widget);
    });
  }

  /* ── Init ─────────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    injectFAB();
    wireInlineButtons();
  });

})();
