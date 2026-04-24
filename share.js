/**
 * BU Alumni Portal — Social Sharing
 *
 * Provides:
 *  1. buShare(title, text, url)  — opens the share sheet or falls back to the
 *                                  dropdown menu
 *  2. Floating share FAB         — injected on every page automatically
 *  3. Inline share buttons       — auto-wired to any element with
 *                                  data-share-title / data-share-text attrs
 */

(function () {
  'use strict';

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function pageUrl()   { return window.location.href; }
  function pageTitle() { return document.title || 'BU Alumni Portal'; }

  function encode(s) { return encodeURIComponent(s); }

  /** Build share URLs for each platform */
  function shareLinks(title, text, url) {
    const full = text ? `${title} — ${text}` : title;
    return {
      whatsapp:  `https://wa.me/?text=${encode(full + '\n' + url)}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}&quote=${encode(full)}`,
      twitter:   `https://twitter.com/intent/tweet?text=${encode(full)}&url=${encode(url)}`,
      linkedin:  `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`,
      email:     `mailto:?subject=${encode(title)}&body=${encode(text + '\n\n' + url)}`,
    };
  }

  /** Copy text to clipboard and show brief feedback on the trigger element */
  function copyToClipboard(text, triggerEl) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = triggerEl.innerHTML;
      triggerEl.innerHTML = '&#10003; Copied!';
      triggerEl.style.color = '#16a34a';
      setTimeout(() => {
        triggerEl.innerHTML = orig;
        triggerEl.style.color = '';
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  // ── Dropdown menu ────────────────────────────────────────────────────────────

  let activeDropdown = null;

  function closeDropdown() {
    if (activeDropdown) {
      activeDropdown.remove();
      activeDropdown = null;
    }
  }

  function createDropdown(title, text, url, anchorEl) {
    closeDropdown();

    const links  = shareLinks(title, text, url);
    const menu   = document.createElement('div');
    menu.className = 'share-dropdown';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Share options');

    const items = [
      { icon: '💬', label: 'WhatsApp',  href: links.whatsapp,  cls: 'share-wa' },
      { icon: '📘', label: 'Facebook',  href: links.facebook,  cls: 'share-fb' },
      { icon: '𝕏',  label: 'X / Twitter', href: links.twitter, cls: 'share-tw' },
      { icon: 'in', label: 'LinkedIn',  href: links.linkedin,  cls: 'share-li' },
      { icon: '✉️', label: 'Email',     href: links.email,     cls: 'share-em' },
    ];

    items.forEach(({ icon, label, href, cls }) => {
      const a = document.createElement('a');
      a.className = `share-dropdown-item ${cls}`;
      a.href      = href;
      a.target    = '_blank';
      a.rel       = 'noopener noreferrer';
      a.setAttribute('role', 'menuitem');
      a.innerHTML = `<span class="share-item-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
      menu.appendChild(a);
    });

    // Copy link row
    const copyRow = document.createElement('button');
    copyRow.className = 'share-dropdown-item share-copy';
    copyRow.setAttribute('role', 'menuitem');
    copyRow.type = 'button';
    copyRow.innerHTML = '<span class="share-item-icon" aria-hidden="true">🔗</span><span>Copy link</span>';
    copyRow.addEventListener('click', () => copyToClipboard(url, copyRow.querySelector('span:last-child')));
    menu.appendChild(copyRow);

    // Position below anchor
    document.body.appendChild(menu);
    activeDropdown = menu;

    const rect   = anchorEl.getBoundingClientRect();
    const menuW  = menu.offsetWidth  || 200;
    const menuH  = menu.offsetHeight || 260;
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    let top  = rect.bottom + scrollY + 6;
    let left = rect.left   + scrollX;

    // Keep inside viewport
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
    if (left < 8) left = 8;
    // Flip above if not enough space below
    if (rect.bottom + menuH + 6 > window.innerHeight) {
      top = rect.top + scrollY - menuH - 6;
    }

    menu.style.top  = top  + 'px';
    menu.style.left = left + 'px';

    // Close on outside click / Escape
    setTimeout(() => {
      document.addEventListener('click', outsideClick, { once: true });
      document.addEventListener('keydown', escClose);
    }, 0);
  }

  function outsideClick(e) {
    if (activeDropdown && !activeDropdown.contains(e.target)) closeDropdown();
  }

  function escClose(e) {
    if (e.key === 'Escape') {
      closeDropdown();
      document.removeEventListener('keydown', escClose);
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * buShare(title, text, url, triggerEl)
   * Uses the native Web Share API when available, otherwise shows the dropdown.
   */
  window.buShare = function (title, text, url, triggerEl) {
    url   = url   || pageUrl();
    title = title || pageTitle();
    text  = text  || '';

    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {/* user cancelled */});
    } else {
      createDropdown(title, text, url, triggerEl || document.body);
    }
  };

  // ── Floating FAB ─────────────────────────────────────────────────────────────

  function injectFAB() {
    const fab = document.createElement('button');
    fab.className   = 'share-fab';
    fab.type        = 'button';
    fab.title       = 'Share this page';
    fab.setAttribute('aria-label', 'Share this page');
    fab.innerHTML   =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="22" height="22">' +
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>' +
      '<circle cx="18" cy="19" r="3"/>' +
      '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>' +
      '<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' +
      '</svg>';

    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      window.buShare(pageTitle(), '', pageUrl(), fab);
    });

    document.body.appendChild(fab);
  }

  // ── Inline share buttons (auto-wire) ─────────────────────────────────────────

  /**
   * Any element with class "share-btn" and optional data attributes:
   *   data-share-title  — title to share
   *   data-share-text   — body text
   *   data-share-url    — URL (defaults to current page)
   */
  function wireInlineButtons() {
    document.querySelectorAll('.share-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const title = btn.dataset.shareTitle || pageTitle();
        const text  = btn.dataset.shareText  || '';
        const url   = btn.dataset.shareUrl   || pageUrl();
        window.buShare(title, text, url, btn);
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    injectFAB();
    wireInlineButtons();
  });

})();
