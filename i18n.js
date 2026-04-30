/**
 * BU Alumni Portal - Internationalization (i18n)
 * Supports: English, Luganda, Kiswahili, Arabic
 */

(function() {
  'use strict';

  // Translation dictionary
  const translations = {
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.activities': 'Activities',
      'nav.community': 'Community',
      'nav.events': 'Events',
      'nav.memberships': 'Memberships',
      'nav.opportunities': 'Opportunities',
      'nav.signin': 'Sign In',
      'nav.signup': 'Sign Up',
      'nav.donate': 'Donate',
      'nav.signout': 'Sign Out',
      
      // Community Page
      'community.title': 'Community',
      'community.join': 'Join the Community',
      'community.signin_prompt': 'Sign in to post, connect, and access all features.',
      'community.post_placeholder': 'Share an update, achievement, or question...',
      'community.post_button': 'Post',
      'community.my_profile': 'My Profile',
      'community.edit_profile': 'Edit Profile',
      'community.view_profile': 'View Profile',
      
      // Currency
      'currency.symbol': '$',
      'currency.code': 'USD',
      
      // Common
      'common.welcome': 'Welcome',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
    },
    
    lg: { // Luganda
      // Navigation
      'nav.home': 'Awaka',
      'nav.about': 'Ebikwata ku Ffe',
      'nav.activities': 'Emirimu',
      'nav.community': 'Ekibiina',
      'nav.events': 'Emikolo',
      'nav.memberships': 'Obwannannyini',
      'nav.opportunities': 'Emikisa',
      'nav.signin': 'Yingira',
      'nav.signup': 'Wandiisa',
      'nav.donate': 'Waayo',
      'nav.signout': 'Fuluma',
      
      // Community Page
      'community.title': 'Ekibiina',
      'community.join': 'Yingira mu Kibiina',
      'community.signin_prompt': 'Yingira okusobola okuwandiika, okukwatagana, n\'okukozesa ebintu byonna.',
      'community.post_placeholder': 'Gabana ebikwata ku ggwe, obuwanguzi, oba ekibuuzo...',
      'community.post_button': 'Sindika',
      'community.my_profile': 'Ebikwata ku Nze',
      'community.edit_profile': 'Kyusa Ebikwata ku Nze',
      'community.view_profile': 'Laba Ebikwata ku Nze',
      
      // Currency
      'currency.symbol': 'UGX',
      'currency.code': 'UGX',
      
      // Common
      'common.welcome': 'Tukusanyukidde',
      'common.loading': 'Tukiteeka...',
      'common.error': 'Kiremye',
      'common.success': 'Kiwedde',
    },
    
    sw: { // Kiswahili
      // Navigation
      'nav.home': 'Nyumbani',
      'nav.about': 'Kuhusu',
      'nav.activities': 'Shughuli',
      'nav.community': 'Jamii',
      'nav.events': 'Matukio',
      'nav.memberships': 'Uanachama',
      'nav.opportunities': 'Fursa',
      'nav.signin': 'Ingia',
      'nav.signup': 'Jisajili',
      'nav.donate': 'Toa Mchango',
      'nav.signout': 'Toka',
      
      // Community Page
      'community.title': 'Jamii',
      'community.join': 'Jiunge na Jamii',
      'community.signin_prompt': 'Ingia ili kuchapisha, kuunganisha, na kufikia vipengele vyote.',
      'community.post_placeholder': 'Shiriki habari, mafanikio, au swali...',
      'community.post_button': 'Chapisha',
      'community.my_profile': 'Wasifu Wangu',
      'community.edit_profile': 'Hariri Wasifu',
      'community.view_profile': 'Tazama Wasifu',
      
      // Currency
      'currency.symbol': 'UGX',
      'currency.code': 'UGX',
      
      // Common
      'common.welcome': 'Karibu',
      'common.loading': 'Inapakia...',
      'common.error': 'Hitilafu',
      'common.success': 'Mafanikio',
    },
    
    ar: { // Arabic
      // Navigation
      'nav.home': 'الرئيسية',
      'nav.about': 'عن',
      'nav.activities': 'الأنشطة',
      'nav.community': 'المجتمع',
      'nav.events': 'الفعاليات',
      'nav.memberships': 'العضويات',
      'nav.opportunities': 'الفرص',
      'nav.signin': 'تسجيل الدخول',
      'nav.signup': 'إنشاء حساب',
      'nav.donate': 'تبرع',
      'nav.signout': 'تسجيل الخروج',
      
      // Community Page
      'community.title': 'المجتمع',
      'community.join': 'انضم إلى المجتمع',
      'community.signin_prompt': 'سجل الدخول للنشر والتواصل والوصول إلى جميع الميزات.',
      'community.post_placeholder': 'شارك تحديثًا أو إنجازًا أو سؤالاً...',
      'community.post_button': 'نشر',
      'community.my_profile': 'ملفي الشخصي',
      'community.edit_profile': 'تعديل الملف الشخصي',
      'community.view_profile': 'عرض الملف الشخصي',
      
      // Currency
      'currency.symbol': 'UGX',
      'currency.code': 'UGX',
      
      // Common
      'common.welcome': 'مرحبا',
      'common.loading': 'جار التحميل...',
      'common.error': 'خطأ',
      'common.success': 'نجاح',
    }
  };

  // Get current language from localStorage or default to English
  function getCurrentLanguage() {
    return localStorage.getItem('bu-language') || 'en';
  }

  // Set current language
  function setLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`Language '${lang}' not supported. Falling back to English.`);
      lang = 'en';
    }
    localStorage.setItem('bu-language', lang);
    
    // Set HTML lang attribute
    document.documentElement.lang = lang;
    
    // Set direction for Arabic
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Translate the page
    translatePage();
    
    // Dispatch event for other scripts to listen
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }

  // Get translation for a key
  function t(key, lang = null) {
    lang = lang || getCurrentLanguage();
    return translations[lang]?.[key] || translations.en[key] || key;
  }

  // Translate all elements with data-i18n attribute
  function translatePage() {
    const lang = getCurrentLanguage();
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = t(key, lang);
      
      // Check if we should translate placeholder
      if (element.hasAttribute('data-i18n-placeholder')) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    // Update currency symbols
    updateCurrency();
  }

  // Update currency symbols based on language
  function updateCurrency() {
    const lang = getCurrentLanguage();
    const currencySymbol = t('currency.symbol', lang);
    const currencyCode = t('currency.code', lang);
    
    // Update all elements with data-currency attribute
    const currencyElements = document.querySelectorAll('[data-currency]');
    currencyElements.forEach(element => {
      const amount = element.getAttribute('data-currency');
      if (currencyCode === 'UGX') {
        // Convert USD to UGX (approximate rate: 1 USD = 3700 UGX)
        const ugxAmount = Math.round(parseFloat(amount) * 3700);
        element.textContent = `${currencySymbol} ${ugxAmount.toLocaleString()}`;
      } else {
        element.textContent = `${currencySymbol}${amount}`;
      }
    });
  }

  // Get language name
  function getLanguageName(code) {
    const names = {
      en: 'English',
      lg: 'Luganda',
      sw: 'Kiswahili',
      ar: 'العربية'
    };
    return names[code] || code;
  }

  // Get language flag emoji
  function getLanguageFlag(code) {
    const flags = {
      en: '🇬🇧',
      lg: '🇺🇬',
      sw: '🇹🇿',
      ar: '🇸🇦'
    };
    return flags[code] || '🌐';
  }

  // Expose API
  window.BUi18n = {
    getCurrentLanguage,
    setLanguage,
    t,
    translatePage,
    getLanguageName,
    getLanguageFlag,
    updateCurrency,
    languages: Object.keys(translations)
  };

  // Auto-translate on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', translatePage);
  } else {
    translatePage();
  }

})();
