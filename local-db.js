/* Legacy compatibility shim.
   Older pages reference local-db.js, but current flows already use
   localStorage directly. Expose a minimal helper object so those pages
   keep loading without missing-file errors. */
(function () {
  'use strict';

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  if (!window.LocalDB) {
    window.LocalDB = {
      get: read,
      set: write,
      remove: function remove(key) {
        try {
          localStorage.removeItem(key);
          return true;
        } catch (error) {
          return false;
        }
      }
    };
  }
})();
