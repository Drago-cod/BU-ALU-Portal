/**
 * BU Alumni Portal — Auth Nav State
 *
 * Runs on every page. Reads buCurrentUser from localStorage.
 * If signed in:  replaces "Sign In / Sign Up" buttons with a member pill
 *                showing the user's initials + name + a dropdown (Profile, Sign Out)
 * If signed out: leaves the nav as-is.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'buCurrentUser';

  function getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    // Redirect to home
    window.location.href = 'index.html';
  }

  function initials(name) {
    if (!name) return 'BU';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  function buildMemberPill(user) {
    const name    = user.fullName || user.name || user.email || 'Member';
    const ini     = initials(name);
    const display = name.split(' ')[0]; // first name only

    // Wrapper
    const wrap = document.createElement('div');
    wrap.className = 'member-pill-wrap';
    wrap.setAttribute('data-open', 'false');

    // Pill button
    const pill = document.createElement('button');
    pill.type      = 'button';
    pill.className = 'member-pill';
    pill.setAttribute('aria-haspopup', 'true');
    pill.setAttribute('aria-expanded', 'false');
    pill.setAttribute('aria-label', 'Member menu');
    pill.innerHTML =
      `<span class="member-pill-avatar" aria-hidden="true">${ini}</span>` +
      `<span class="member-pill-name">${display}</span>` +
      `<span class="material-icons-round member-pill-chevron" aria-hidden="true">expand_more</span>`;

    // Dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'member-dropdown';
    dropdown.setAttribute('role', 'menu');
    dropdown.innerHTML =
      `<div class="member-dropdown-header">
         <span class="member-dropdown-avatar" aria-hidden="true">${ini}</span>
         <div>
           <strong class="member-dropdown-name">${name}</strong>
           <span class="member-dropdown-email">${user.email || ''}</span>
         </div>
       </div>
       <div class="member-dropdown-divider"></div>
       <a class="member-dropdown-item" href="auth.html#profile" role="menuitem">
         <span class="material-icons-round" aria-hidden="true">person</span> My Profile
       </a>
       <a class="member-dropdown-item" href="memberships.html" role="menuitem">
         <span class="material-icons-round" aria-hidden="true">card_membership</span> Membership
       </a>
       <div class="member-dropdown-divider"></div>
       <button class="member-dropdown-item member-dropdown-signout" type="button" role="menuitem" id="nav-signout-btn">
         <span class="material-icons-round" aria-hidden="true">logout</span> Sign Out
       </button>`;

    wrap.appendChild(pill);
    wrap.appendChild(dropdown);

    // Toggle
    let open = false;
    function openMenu() {
      open = true;
      wrap.setAttribute('data-open', 'true');
      pill.setAttribute('aria-expanded', 'true');
      setTimeout(() => document.addEventListener('click', outsideClick, { once: true }), 0);
    }
    function closeMenu() {
      open = false;
      wrap.setAttribute('data-open', 'false');
      pill.setAttribute('aria-expanded', 'false');
    }
    function outsideClick(e) {
      if (!wrap.contains(e.target)) closeMenu();
    }

    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      open ? closeMenu() : openMenu();
    });

    pill.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // Sign out
    dropdown.querySelector('#nav-signout-btn').addEventListener('click', signOut);

    return wrap;
  }

  function applyAuthState() {
    const user = getUser();

    // Target both desktop nav-actions and mobile nav
    const navActions  = document.querySelector('.nav-actions');
    const mobileNav   = document.getElementById('mobile-nav');

    if (!navActions) return;

    if (user) {
      // ── Signed in ──────────────────────────────────────────────────────────

      // Desktop: replace Sign In + Sign Up with member pill
      const signInBtn  = navActions.querySelector('a[href="auth.html"]');
      const signUpBtn  = navActions.querySelector('a[href="register.html"]');

      if (signInBtn)  signInBtn.remove();
      if (signUpBtn)  signUpBtn.remove();

      // Insert member pill before the Donate button
      const donateBtn = navActions.querySelector('a[href="donate.html"]');
      const pill      = buildMemberPill(user);
      if (donateBtn) {
        navActions.insertBefore(pill, donateBtn);
      } else {
        navActions.appendChild(pill);
      }

      // Mobile nav: replace Sign In + Sign Up links
      if (mobileNav) {
        const mSignIn = mobileNav.querySelector('a[href="auth.html"]');
        const mSignUp = mobileNav.querySelector('a[href="register.html"]');
        if (mSignIn) mSignIn.remove();
        if (mSignUp) mSignUp.remove();

        // Add member info + sign out to mobile nav
        const divider = mobileNav.querySelector('.mobile-nav-divider');
        const mMember = document.createElement('div');
        mMember.className = 'mobile-member-row';
        const name = user.fullName || user.name || user.email || 'Member';
        mMember.innerHTML =
          `<span class="mobile-member-avatar">${initials(name)}</span>` +
          `<span class="mobile-member-name">${name}</span>`;

        const mSignOut = document.createElement('button');
        mSignOut.type      = 'button';
        mSignOut.className = 'mobile-signout-btn';
        mSignOut.innerHTML =
          `<span class="material-icons-round" aria-hidden="true">logout</span> Sign Out`;
        mSignOut.addEventListener('click', signOut);

        if (divider) {
          mobileNav.insertBefore(mMember,   divider.nextSibling);
          mobileNav.insertBefore(mSignOut,  divider.nextSibling.nextSibling);
        } else {
          mobileNav.appendChild(mMember);
          mobileNav.appendChild(mSignOut);
        }
      }

    }
    // If not signed in — leave nav as-is
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAuthState);
  } else {
    applyAuthState();
  }

})();
