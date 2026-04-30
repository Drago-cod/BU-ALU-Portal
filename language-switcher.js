/**
 * BU Alumni Portal - Language Switcher Component
 * Creates a dropdown to switch between languages
 */

(function() {
  'use strict';

  function createLanguageSwitcher() {
    // Create language switcher HTML
    const switcher = document.createElement('div');
    switcher.className = 'language-switcher';
    switcher.innerHTML = `
      <button class="language-switcher-btn" id="lang-switcher-btn" aria-label="Change language" aria-haspopup="true" aria-expanded="false">
        <span class="language-flag" id="current-lang-flag"></span>
        <span class="language-code" id="current-lang-code"></span>
        <span class="material-icons-round" style="font-size: 1rem;">expand_more</span>
      </button>
      <div class="language-switcher-dropdown" id="lang-switcher-dropdown" hidden>
        <div class="language-option" data-lang="en">
          <span class="language-flag">🇬🇧</span>
          <span class="language-name">English</span>
          <span class="language-check material-icons-round">check</span>
        </div>
        <div class="language-option" data-lang="lg">
          <span class="language-flag">🇺🇬</span>
          <span class="language-name">Luganda</span>
          <span class="language-check material-icons-round">check</span>
        </div>
        <div class="language-option" data-lang="sw">
          <span class="language-flag">🇹🇿</span>
          <span class="language-name">Kiswahili</span>
          <span class="language-check material-icons-round">check</span>
        </div>
        <div class="language-option" data-lang="ar">
          <span class="language-flag">🇸🇦</span>
          <span class="language-name">العربية</span>
          <span class="language-check material-icons-round">check</span>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .language-switcher {
        position: relative;
        display: inline-block;
      }
      
      .language-switcher-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 8px;
        background: var(--surface, #fff);
        color: var(--text, #0f172a);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .language-switcher-btn:hover {
        border-color: var(--primary, #1140d9);
        background: var(--surface-alt, #f8fafc);
      }
      
      .language-flag {
        font-size: 1.25rem;
        line-height: 1;
      }
      
      .language-code {
        text-transform: uppercase;
        font-size: 0.75rem;
        font-weight: 700;
      }
      
      .language-switcher-dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        min-width: 200px;
        background: var(--surface, #fff);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        padding: 0.5rem;
        z-index: 1000;
        animation: slideDown 0.2s ease-out;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .language-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s;
      }
      
      .language-option:hover {
        background: var(--surface-alt, #f8fafc);
      }
      
      .language-option.active {
        background: var(--primary-light, #eff6ff);
      }
      
      .language-name {
        flex: 1;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text, #0f172a);
      }
      
      .language-check {
        font-size: 1rem;
        color: var(--primary, #1140d9);
        opacity: 0;
      }
      
      .language-option.active .language-check {
        opacity: 1;
      }
      
      /* Mobile responsive */
      @media (max-width: 768px) {
        .language-switcher-dropdown {
          right: auto;
          left: 0;
        }
      }
    `;
    document.head.appendChild(style);

    return switcher;
  }

  function initLanguageSwitcher() {
    // Find nav-actions or create a container
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    // Create and insert language switcher
    const switcher = createLanguageSwitcher();
    navActions.insertBefore(switcher, navActions.firstChild);

    // Get elements
    const btn = document.getElementById('lang-switcher-btn');
    const dropdown = document.getElementById('lang-switcher-dropdown');
    const currentFlag = document.getElementById('current-lang-flag');
    const currentCode = document.getElementById('current-lang-code');
    const options = dropdown.querySelectorAll('.language-option');

    // Update current language display
    function updateCurrentLanguage() {
      const lang = window.BUi18n.getCurrentLanguage();
      currentFlag.textContent = window.BUi18n.getLanguageFlag(lang);
      currentCode.textContent = lang.toUpperCase();
      
      // Update active state
      options.forEach(option => {
        if (option.getAttribute('data-lang') === lang) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });
    }

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dropdown.hidden;
      dropdown.hidden = !isHidden;
      btn.setAttribute('aria-expanded', !isHidden);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    });

    // Handle language selection
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = option.getAttribute('data-lang');
        window.BUi18n.setLanguage(lang);
        updateCurrentLanguage();
        dropdown.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    // Initialize
    updateCurrentLanguage();

    // Listen for language changes
    window.addEventListener('languageChanged', updateCurrentLanguage);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
  } else {
    initLanguageSwitcher();
  }

})();
