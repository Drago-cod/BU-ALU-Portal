(function () {
  'use strict';

  function buildSwitcher(isMobile) {
    const wrapper = document.createElement('div');
    wrapper.className = isMobile ? 'lang-switcher lang-switcher--mobile' : 'lang-switcher';
    wrapper.setAttribute('data-i18n-skip', 'true');

    const label = document.createElement('label');
    label.className = 'lang-switcher-label';
    label.setAttribute('for', isMobile ? 'lang-switcher-mobile' : 'lang-switcher-desktop');
    label.innerHTML = '<span class="material-icons-round">translate</span><span class="lang-switcher-text">Language</span>';

    const control = document.createElement('div');
    control.className = 'lang-switcher-control';

    const select = document.createElement('select');
    select.className = 'lang-switcher-select';
    select.id = isMobile ? 'lang-switcher-mobile' : 'lang-switcher-desktop';
    select.setAttribute('aria-label', 'Select language');

    window.BUi18n.getSupportedLanguages().forEach((language) => {
      const option = document.createElement('option');
      option.value = language.code;
      option.textContent = language.nativeLabel;
      select.appendChild(option);
    });

    control.appendChild(select);
    wrapper.appendChild(label);
    wrapper.appendChild(control);

    return { wrapper, select, label };
  }

  function updateLabelText(switcher) {
    const labelText = switcher.label.querySelector('.lang-switcher-text');
    if (labelText) {
      labelText.textContent = window.BUi18n.translateText('Language', window.BUi18n.getCurrentLanguage());
    }
    switcher.select.setAttribute(
      'aria-label',
      window.BUi18n.translateText('Select language', window.BUi18n.getCurrentLanguage())
    );
  }

  function initLanguageSwitcher() {
    if (!window.BUi18n) return;

    const navActions = document.querySelector('.nav-actions');
    if (!navActions || navActions.querySelector('.lang-switcher')) return;

    const desktop = buildSwitcher(false);
    const mobile = buildSwitcher(true);

    navActions.insertBefore(desktop.wrapper, navActions.firstChild);

    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav && !mobileNav.querySelector('.lang-switcher--mobile')) {
      const divider = mobileNav.querySelector('.mobile-nav-divider');
      if (divider && divider.nextSibling) {
        mobileNav.insertBefore(mobile.wrapper, divider.nextSibling);
      } else {
        mobileNav.appendChild(mobile.wrapper);
      }
    }

    function syncControls() {
      const currentLanguage = window.BUi18n.getCurrentLanguage();
      desktop.select.value = currentLanguage;
      mobile.select.value = currentLanguage;
      updateLabelText(desktop);
      updateLabelText(mobile);
    }

    function handleChange(event) {
      window.BUi18n.setLanguage(event.target.value);
      syncControls();
    }

    desktop.select.addEventListener('change', handleChange);
    mobile.select.addEventListener('change', handleChange);

    window.addEventListener('languageChanged', syncControls);
    syncControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
  } else {
    initLanguageSwitcher();
  }
})();
