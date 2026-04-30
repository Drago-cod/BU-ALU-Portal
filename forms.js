/* Compatibility shim for legacy page includes.
   Some pages still load forms.js even though form logic now lives inline
   or in page-specific modules. Keep this file lightweight so local file
   previews do not fail on a missing script request. */
(function () {
  'use strict';

  if (!window.BUForms) {
    window.BUForms = {
      version: 'compat',
      init: function init() {
        return true;
      }
    };
  }
})();
