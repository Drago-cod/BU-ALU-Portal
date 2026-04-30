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
      'nav.profile': 'My Profile',
      'nav.membership': 'Membership',
      
      // Community Page
      'community.title': 'Community',
      'community.join': 'Join the Community',
      'community.signin_prompt': 'Sign in to post, connect, and access all features.',
      'community.post_placeholder': 'Share an update, achievement, or question...',
      'community.post_button': 'Post',
      'community.my_profile': 'My Profile',
      'community.edit_profile': 'Edit Profile',
      'community.view_profile': 'View Profile',
      'community.posts': 'Posts',
      'community.connections': 'Connections',
      'community.events': 'Events',
      
      // Profile
      'profile.posts': 'Posts',
      'profile.connections': 'Connections',
      'profile.events': 'Events',
      
      // Forms
      'form.fullname': 'Full Name',
      'form.email': 'Email Address',
      'form.phone': 'Phone Number',
      'form.password': 'Password',
      'form.confirm_password': 'Confirm Password',
      'form.submit': 'Submit',
      'form.cancel': 'Cancel',
      'form.save': 'Save',
      'form.required': 'Required',
      
      // Buttons
      'btn.register': 'Register',
      'btn.login': 'Login',
      'btn.apply': 'Apply Now',
      'btn.learn_more': 'Learn More',
      'btn.view_all': 'View All',
      'btn.see_all': 'See All',
      'btn.join': 'Join',
      'btn.connect': 'Connect',
      'btn.share': 'Share',
      'btn.like': 'Like',
      'btn.comment': 'Comment',
      
      // Events
      'events.title': 'Events',
      'events.register': 'Register for Event',
      'events.upcoming': 'Upcoming Events',
      'events.past': 'Past Events',
      'events.add_to_calendar': 'Add to Calendar',
      
      // Memberships
      'memberships.title': 'Memberships',
      'memberships.join': 'Join Now',
      'memberships.benefits': 'Benefits',
      'memberships.pricing': 'Pricing',
      
      // Donations
      'donate.title': 'Donate',
      'donate.amount': 'Amount',
      'donate.message': 'Message',
      'donate.submit': 'Donate Now',
      
      // Currency
      'currency.symbol': '$',
      'currency.code': 'USD',
      
      // Common
      'common.welcome': 'Welcome',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.sort': 'Sort',
      'common.close': 'Close',
      'common.open': 'Open',
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
      'nav.profile': 'Ebikwata ku Nze',
      'nav.membership': 'Obwannannyini',
      
      // Community Page
      'community.title': 'Ekibiina',
      'community.join': 'Yingira mu Kibiina',
      'community.signin_prompt': 'Yingira okusobola okuwandiika, okukwatagana, n\'okukozesa ebintu byonna.',
      'community.post_placeholder': 'Gabana ebikwata ku ggwe, obuwanguzi, oba ekibuuzo...',
      'community.post_button': 'Sindika',
      'community.my_profile': 'Ebikwata ku Nze',
      'community.edit_profile': 'Kyusa Ebikwata ku Nze',
      'community.view_profile': 'Laba Ebikwata ku Nze',
      'community.posts': 'Ebiwandiikiddwa',
      'community.connections': 'Enkolagana',
      'community.events': 'Emikolo',
      
      // Profile
      'profile.posts': 'Ebiwandiikiddwa',
      'profile.connections': 'Enkolagana',
      'profile.events': 'Emikolo',
      
      // Forms
      'form.fullname': 'Erinnya Lyonna',
      'form.email': 'Email',
      'form.phone': 'Essimu',
      'form.password': 'Ekigambo ky\'Okuyingira',
      'form.confirm_password': 'Kakasa Ekigambo ky\'Okuyingira',
      'form.submit': 'Sindika',
      'form.cancel': 'Sazaamu',
      'form.save': 'Tereka',
      'form.required': 'Kyetaagisa',
      
      // Buttons
      'btn.register': 'Wandiisa',
      'btn.login': 'Yingira',
      'btn.apply': 'Saba Kati',
      'btn.learn_more': 'Manya Ebisingawo',
      'btn.view_all': 'Laba Byonna',
      'btn.see_all': 'Laba Byonna',
      'btn.join': 'Yingira',
      'btn.connect': 'Kwatagana',
      'btn.share': 'Gabana',
      'btn.like': 'Siima',
      'btn.comment': 'Yogera',
      
      // Events
      'events.title': 'Emikolo',
      'events.register': 'Wandiisa ku Mukolo',
      'events.upcoming': 'Emikolo Egijja',
      'events.past': 'Emikolo Egyayita',
      'events.add_to_calendar': 'Yongera ku Kalenda',
      
      // Memberships
      'memberships.title': 'Obwannannyini',
      'memberships.join': 'Yingira Kati',
      'memberships.benefits': 'Emiganyulo',
      'memberships.pricing': 'Emiwendo',
      
      // Donations
      'donate.title': 'Waayo',
      'donate.amount': 'Omuwendo',
      'donate.message': 'Obubaka',
      'donate.submit': 'Waayo Kati',
      
      // Currency
      'currency.symbol': 'UGX',
      'currency.code': 'UGX',
      
      // Common
      'common.welcome': 'Tukusanyukidde',
      'common.loading': 'Tukiteeka...',
      'common.error': 'Kiremye',
      'common.success': 'Kiwedde',
      'common.search': 'Noonya',
      'common.filter': 'Sengejja',
      'common.sort': 'Tegeka',
      'common.close': 'Ggalawo',
      'common.open': 'Ggulawo',
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
      'nav.profile': 'Wasifu Wangu',
      'nav.membership': 'Uanachama',
      
      // Community Page
      'community.title': 'Jamii',
      'community.join': 'Jiunge na Jamii',
      'community.signin_prompt': 'Ingia ili kuchapisha, kuunganisha, na kufikia vipengele vyote.',
      'community.post_placeholder': 'Shiriki habari, mafanikio, au swali...',
      'community.post_button': 'Chapisha',
      'community.my_profile': 'Wasifu Wangu',
      'community.edit_profile': 'Hariri Wasifu',
      'community.view_profile': 'Tazama Wasifu',
      'community.posts': 'Machapisho',
      'community.connections': 'Miunganisho',
      'community.events': 'Matukio',
      
      // Profile
      'profile.posts': 'Machapisho',
      'profile.connections': 'Miunganisho',
      'profile.events': 'Matukio',
      
      // Forms
      'form.fullname': 'Jina Kamili',
      'form.email': 'Barua Pepe',
      'form.phone': 'Nambari ya Simu',
      'form.password': 'Nenosiri',
      'form.confirm_password': 'Thibitisha Nenosiri',
      'form.submit': 'Wasilisha',
      'form.cancel': 'Ghairi',
      'form.save': 'Hifadhi',
      'form.required': 'Inahitajika',
      
      // Buttons
      'btn.register': 'Jisajili',
      'btn.login': 'Ingia',
      'btn.apply': 'Omba Sasa',
      'btn.learn_more': 'Jifunze Zaidi',
      'btn.view_all': 'Tazama Yote',
      'btn.see_all': 'Ona Yote',
      'btn.join': 'Jiunge',
      'btn.connect': 'Unganisha',
      'btn.share': 'Shiriki',
      'btn.like': 'Penda',
      'btn.comment': 'Toa Maoni',
      
      // Events
      'events.title': 'Matukio',
      'events.register': 'Jisajili kwa Tukio',
      'events.upcoming': 'Matukio Yanayokuja',
      'events.past': 'Matukio Yaliyopita',
      'events.add_to_calendar': 'Ongeza kwenye Kalenda',
      
      // Memberships
      'memberships.title': 'Uanachama',
      'memberships.join': 'Jiunge Sasa',
      'memberships.benefits': 'Faida',
      'memberships.pricing': 'Bei',
      
      // Donations
      'donate.title': 'Toa Mchango',
      'donate.amount': 'Kiasi',
      'donate.message': 'Ujumbe',
      'donate.submit': 'Toa Mchango Sasa',
      
      // Currency
      'currency.symbol': 'UGX',
      'currency.code': 'UGX',
      
      // Common
      'common.welcome': 'Karibu',
      'common.loading': 'Inapakia...',
      'common.error': 'Hitilafu',
      'common.success': 'Mafanikio',
      'common.search': 'Tafuta',
      'common.filter': 'Chuja',
      'common.sort': 'Panga',
      'common.close': 'Funga',
      'common.open': 'Fungua',
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
      'nav.profile': 'ملفي الشخصي',
      'nav.membership': 'العضوية',
      
      // Community Page
      'community.title': 'المجتمع',
      'community.join': 'انضم إلى المجتمع',
      'community.signin_prompt': 'سجل الدخول للنشر والتواصل والوصول إلى جميع الميزات.',
      'community.post_placeholder': 'شارك تحديثًا أو إنجازًا أو سؤالاً...',
      'community.post_button': 'نشر',
      'community.my_profile': 'ملفي الشخصي',
      'community.edit_profile': 'تعديل الملف الشخصي',
      'community.view_profile': 'عرض الملف الشخصي',
      'community.posts': 'المنشورات',
      'community.connections': 'الاتصالات',
      'community.events': 'الفعاليات',
      
      // Profile
      'profile.posts': 'المنشورات',
      'profile.connections': 'الاتصالات',
      'profile.events': 'الفعاليات',
      
      // Forms
      'form.fullname': 'الاسم الكامل',
      'form.email': 'البريد الإلكتروني',
      'form.phone': 'رقم الهاتف',
      'form.password': 'كلمة المرور',
      'form.confirm_password': 'تأكيد كلمة المرور',
      'form.submit': 'إرسال',
      'form.cancel': 'إلغاء',
      'form.save': 'حفظ',
      'form.required': 'مطلوب',
      
      // Buttons
      'btn.register': 'تسجيل',
      'btn.login': 'دخول',
      'btn.apply': 'تقدم الآن',
      'btn.learn_more': 'اعرف المزيد',
      'btn.view_all': 'عرض الكل',
      'btn.see_all': 'رؤية الكل',
      'btn.join': 'انضم',
      'btn.connect': 'اتصل',
      'btn.share': 'شارك',
      'btn.like': 'إعجاب',
      'btn.comment': 'تعليق',
      
      // Events
      'events.title': 'الفعاليات',
      'events.register': 'التسجيل في الفعالية',
      'events.upcoming': 'الفعاليات القادمة',
      'events.past': 'الفعاليات السابقة',
      'events.add_to_calendar': 'إضافة إلى التقويم',
      
      // Memberships
      'memberships.title': 'العضويات',
      'memberships.join': 'انضم الآن',
      'memberships.benefits': 'الفوائد',
      'memberships.pricing': 'التسعير',
      
      // Donations
      'donate.title': 'تبرع',
      'donate.amount': 'المبلغ',
      'donate.message': 'رسالة',
      'donate.submit': 'تبرع الآن',
      
      // Currency
      'currency.symbol': 'UGX',
      'currency.code': 'UGX',
      
      // Common
      'common.welcome': 'مرحبا',
      'common.loading': 'جار التحميل...',
      'common.error': 'خطأ',
      'common.success': 'نجاح',
      'common.search': 'بحث',
      'common.filter': 'تصفية',
      'common.sort': 'ترتيب',
      'common.close': 'إغلاق',
      'common.open': 'فتح',
    }
  };

  // Get current language from localStorage or default to English
  function getCurrentLanguage() {
    // Check if GlobalState is available
    if (window.GlobalState && window.GlobalState.Language) {
      return window.GlobalState.Language.getCurrentLanguage();
    }
    return localStorage.getItem('bu-language') || 'en';
  }

  // Set current language
  function setLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`Language '${lang}' not supported. Falling back to English.`);
      lang = 'en';
    }
    
    // Use GlobalState if available
    if (window.GlobalState && window.GlobalState.Language) {
      window.GlobalState.Language.setLanguage(lang);
      return;
    }
    
    // Fallback to local implementation
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
