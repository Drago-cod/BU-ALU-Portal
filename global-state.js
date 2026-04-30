/**
 * BU Alumni Portal - Global State Management
 * Manages authentication state and language preferences across ALL pages
 */

(function() {
  'use strict';

  // Storage keys
  const STORAGE_KEYS = {
    TOKEN: 'bu_alumni_token',
    ACCOUNT: 'bu_alumni_account',
    USER: 'buCurrentUser', // Legacy support
    LANGUAGE: 'bu-language',
    THEME: 'bu-theme'
  };

  // ============================================================================
  // AUTHENTICATION STATE MANAGEMENT
  // ============================================================================

  const GlobalAuth = {
    // Get authentication token
    getToken() {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    },

    // Set authentication token
    setToken(token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      this.broadcastAuthChange();
    },

    // Get user account data
    getAccount() {
      const account = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
      if (account) {
        try {
          return JSON.parse(account);
        } catch (e) {
          console.error('Failed to parse account data:', e);
          return null;
        }
      }
      
      // Fallback to legacy user storage
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      if (user) {
        try {
          return JSON.parse(user);
        } catch (e) {
          return null;
        }
      }
      
      return null;
    },

    // Set user account data
    setAccount(account) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
      // Also set legacy format for backward compatibility
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(account));
      this.broadcastAuthChange();
    },

    // Check if user is logged in
    isLoggedIn() {
      return !!this.getToken() || !!this.getAccount();
    },

    // Get user initials for avatar
    getUserInitials(name) {
      if (!name) {
        const account = this.getAccount();
        name = account?.fullName || account?.name || 'BU';
      }
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    },

    // Sign in user
    signIn(token, account) {
      this.setToken(token);
      this.setAccount(account);
      this.updateAllPages();
    },

    // Sign out user
    signOut(redirectUrl = 'index.html') {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ACCOUNT);
      localStorage.removeItem(STORAGE_KEYS.USER);
      this.broadcastAuthChange();
      
      // Redirect to home or specified page
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },

    // Broadcast authentication state change to all tabs/windows
    broadcastAuthChange() {
      // Trigger storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.ACCOUNT,
        newValue: localStorage.getItem(STORAGE_KEYS.ACCOUNT),
        url: window.location.href
      }));
      
      // Trigger custom event for current page
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: {
          isLoggedIn: this.isLoggedIn(),
          account: this.getAccount()
        }
      }));
    },

    // Update all page elements based on auth state
    updateAllPages() {
      this.updateNavigation();
      this.updateProfileElements();
      this.updateProtectedContent();
    },

    // Update navigation bar
    updateNavigation() {
      const isLoggedIn = this.isLoggedIn();
      const account = this.getAccount();
      
      // Desktop navigation
      const navActions = document.querySelector('.nav-actions');
      if (navActions && isLoggedIn && account) {
        const signInLink = navActions.querySelector('a[href="login.html"], a[href="auth.html"]');
        const signUpLink = navActions.querySelector('a[href="register.html"]');
        
        if (signInLink || signUpLink) {
          // Remove sign in/up buttons
          if (signInLink) signInLink.remove();
          if (signUpLink) signUpLink.remove();
          
          // Add user menu
          const userName = account.fullName || account.name || account.email || 'User';
          const initials = this.getUserInitials(userName);
          const donateBtn = navActions.querySelector('a[href="donate.html"]');
          
          const userMenu = document.createElement('div');
          userMenu.className = 'member-pill-wrap';
          userMenu.setAttribute('data-open', 'false');
          userMenu.innerHTML = `
            <button type="button" class="member-pill" aria-haspopup="true" aria-expanded="false">
              <span class="member-pill-avatar">${initials}</span>
              <span class="member-pill-name">${userName.split(' ')[0]}</span>
              <span class="material-icons-round member-pill-chevron">expand_more</span>
            </button>
            <div class="member-dropdown" role="menu">
              <div class="member-dropdown-header">
                <span class="member-dropdown-avatar">${initials}</span>
                <div>
                  <strong class="member-dropdown-name">${userName}</strong>
                  <span class="member-dropdown-email">${account.email || ''}</span>
                </div>
              </div>
              <div class="member-dropdown-divider"></div>
              <a class="member-dropdown-item" href="community.html" role="menuitem">
                <span class="material-icons-round">person</span> My Profile
              </a>
              <a class="member-dropdown-item" href="memberships.html" role="menuitem">
                <span class="material-icons-round">card_membership</span> Membership
              </a>
              <a class="member-dropdown-item" href="community.html" role="menuitem">
                <span class="material-icons-round">groups</span> Community
              </a>
              <div class="member-dropdown-divider"></div>
              <button class="member-dropdown-item member-dropdown-signout" type="button" role="menuitem">
                <span class="material-icons-round">logout</span> Sign Out
              </button>
            </div>
          `;
          
          if (donateBtn) {
            navActions.insertBefore(userMenu, donateBtn);
          } else {
            navActions.appendChild(userMenu);
          }
          
          // Add dropdown toggle functionality
          const pill = userMenu.querySelector('.member-pill');
          const dropdown = userMenu.querySelector('.member-dropdown');
          const signOutBtn = userMenu.querySelector('.member-dropdown-signout');
          
          pill.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = userMenu.getAttribute('data-open') === 'true';
            userMenu.setAttribute('data-open', !isOpen);
            pill.setAttribute('aria-expanded', !isOpen);
            
            if (!isOpen) {
              setTimeout(() => {
                document.addEventListener('click', () => {
                  userMenu.setAttribute('data-open', 'false');
                  pill.setAttribute('aria-expanded', 'false');
                }, { once: true });
              }, 0);
            }
          });
          
          signOutBtn.addEventListener('click', () => this.signOut());
        }
      }
      
      // Mobile navigation
      const mobileNav = document.getElementById('mobile-nav');
      if (mobileNav && isLoggedIn && account) {
        const mSignIn = mobileNav.querySelector('a[href="login.html"], a[href="auth.html"]');
        const mSignUp = mobileNav.querySelector('a[href="register.html"]');
        
        if (mSignIn || mSignUp) {
          if (mSignIn) mSignIn.remove();
          if (mSignUp) mSignUp.remove();
          
          const divider = mobileNav.querySelector('.mobile-nav-divider');
          const userName = account.fullName || account.name || account.email || 'User';
          const initials = this.getUserInitials(userName);
          
          const mobileUser = document.createElement('div');
          mobileUser.className = 'mobile-member-section';
          mobileUser.innerHTML = `
            <div class="mobile-member-row">
              <span class="mobile-member-avatar">${initials}</span>
              <span class="mobile-member-name">${userName}</span>
            </div>
            <a href="community.html" class="mobile-nav-link">
              <span class="material-icons-round">person</span> My Profile
            </a>
            <a href="memberships.html" class="mobile-nav-link">
              <span class="material-icons-round">card_membership</span> Membership
            </a>
            <button class="mobile-signout-btn" type="button">
              <span class="material-icons-round">logout</span> Sign Out
            </button>
          `;
          
          if (divider) {
            divider.parentNode.insertBefore(mobileUser, divider.nextSibling);
          } else {
            mobileNav.appendChild(mobileUser);
          }
          
          const mSignOutBtn = mobileUser.querySelector('.mobile-signout-btn');
          mSignOutBtn.addEventListener('click', () => this.signOut());
        }
      }
    },

    // Update profile-specific elements
    updateProfileElements() {
      const account = this.getAccount();
      if (!account) return;
      
      // Update any profile containers
      const profileContainers = document.querySelectorAll('[data-profile-container]');
      profileContainers.forEach(container => {
        const initials = this.getUserInitials();
        container.innerHTML = `
          <div class="user-profile-mini">
            <div class="avatar-circle">${initials}</div>
            <div>
              <div class="profile-name">${account.fullName || account.name || 'User'}</div>
              <div class="profile-email">${account.email || ''}</div>
            </div>
          </div>
        `;
      });
    },

    // Show/hide protected content based on auth state
    updateProtectedContent() {
      const isLoggedIn = this.isLoggedIn();
      
      // Show elements that require auth
      document.querySelectorAll('[data-require-auth]').forEach(el => {
        el.style.display = isLoggedIn ? '' : 'none';
      });
      
      // Hide elements that should only show when logged out
      document.querySelectorAll('[data-hide-when-auth]').forEach(el => {
        el.style.display = isLoggedIn ? 'none' : '';
      });
    },

    // Require authentication (redirect if not logged in)
    requireAuth(redirectUrl = 'login.html') {
      if (!this.isLoggedIn()) {
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `${redirectUrl}?redirect=${returnUrl}`;
        return false;
      }
      return true;
    }
  };

  // ============================================================================
  // LANGUAGE STATE MANAGEMENT
  // ============================================================================

  const GlobalLanguage = {
    // Get current language
    getCurrentLanguage() {
      return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
    },

    // Set language and update all pages
    setLanguage(lang) {
      if (!['en', 'lg', 'sw', 'ar'].includes(lang)) {
        console.warn(`Unsupported language: ${lang}. Defaulting to English.`);
        lang = 'en';
      }
      
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      
      this.broadcastLanguageChange(lang);
      this.translateCurrentPage();
    },

    // Broadcast language change to all tabs/windows
    broadcastLanguageChange(lang) {
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: lang }
      }));
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.LANGUAGE,
        newValue: lang,
        url: window.location.href
      }));
    },

    // Translate current page
    translateCurrentPage() {
      if (window.BUi18n && typeof window.BUi18n.translatePage === 'function') {
        window.BUi18n.translatePage();
      }
    },

    // Initialize language on page load
    initLanguage() {
      const lang = this.getCurrentLanguage();
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function initialize() {
    // Initialize language
    GlobalLanguage.initLanguage();
    
    // Initialize auth state
    GlobalAuth.updateAllPages();
    
    // Listen for storage changes (from other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.ACCOUNT || e.key === STORAGE_KEYS.TOKEN || e.key === STORAGE_KEYS.USER) {
        GlobalAuth.updateAllPages();
      }
      if (e.key === STORAGE_KEYS.LANGUAGE) {
        GlobalLanguage.initLanguage();
        GlobalLanguage.translateCurrentPage();
      }
    });
    
    // Listen for custom auth state changes
    window.addEventListener('authStateChanged', () => {
      GlobalAuth.updateAllPages();
    });
    
    // Listen for custom language changes
    window.addEventListener('languageChanged', () => {
      GlobalLanguage.translateCurrentPage();
    });
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // ============================================================================
  // GLOBAL API
  // ============================================================================

  window.GlobalState = {
    Auth: GlobalAuth,
    Language: GlobalLanguage,
    
    // Convenience methods
    isLoggedIn: () => GlobalAuth.isLoggedIn(),
    getAccount: () => GlobalAuth.getAccount(),
    signOut: (url) => GlobalAuth.signOut(url),
    getCurrentLanguage: () => GlobalLanguage.getCurrentLanguage(),
    setLanguage: (lang) => GlobalLanguage.setLanguage(lang)
  };

  // Backward compatibility
  window.requireAuth = GlobalAuth.requireAuth.bind(GlobalAuth);

})();
