/**
 * BU Alumni Portal - UI Components
 * Toast notifications, loading states, and user-friendly feedback
 */

(function() {
  'use strict';

  // Toast Notification System
  const Toast = {
    container: null,
    
    init() {
      // Create container if it doesn't exist
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(this.container);
      }
    },

    show(message, options = {}) {
      this.init();

      const {
        type = 'info',
        title = '',
        duration = 5000,
        dismissible = true
      } = options;

      // Create toast element
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'polite');

      // Icon based on type
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };

      // Build toast content
      const titleHtml = title ? `<div class="toast-title">${title}</div>` : '';
      const closeHtml = dismissible 
        ? `<button class="toast-close" aria-label="Dismiss notification">✕</button>` 
        : '';

      toast.innerHTML = `
        <span class="toast-icon" aria-hidden="true">${icons[type]}</span>
        <div class="toast-content">
          ${titleHtml}
          <div class="toast-message">${message}</div>
        </div>
        ${closeHtml}
      `;

      // Add to container
      this.container.appendChild(toast);

      // Handle close button
      if (dismissible) {
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.dismiss(toast));
      }

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => this.dismiss(toast), duration);
      }

      return toast;
    },

    dismiss(toast) {
      if (!toast || !toast.parentNode) return;
      
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    },

    // Convenience methods
    success(message, title = 'Success') {
      return this.show(message, { type: 'success', title });
    },

    error(message, title = 'Error') {
      return this.show(message, { type: 'error', title });
    },

    warning(message, title = 'Warning') {
      return this.show(message, { type: 'warning', title });
    },

    info(message, title = '') {
      return this.show(message, { type: 'info', title });
    }
  };

  // Loading State Manager
  const Loading = {
    show(element, text = 'Loading...') {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      if (!element) return;

      // Store original content
      element.dataset.originalContent = element.innerHTML;
      element.dataset.originalDisabled = element.disabled;

      // Add loading state
      element.disabled = true;
      element.classList.add('btn-loading');
      element.setAttribute('aria-busy', 'true');
      
      // For non-button elements
      if (!element.classList.contains('btn')) {
        element.classList.add('loading');
      }
    },

    hide(element) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      if (!element) return;

      // Restore original state
      element.disabled = element.dataset.originalDisabled === 'true';
      element.classList.remove('btn-loading', 'loading');
      element.removeAttribute('aria-busy');
    },

    // Global page loading
    pageShow() {
      let loader = document.getElementById('page-loader');
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.innerHTML = `
          <div class="spinner" style="width: 3rem; height: 3rem; border-width: 3px;"></div>
        `;
        loader.style.cssText = `
          position: fixed;
          inset: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          transition: opacity 0.3s;
        `;
        document.body.appendChild(loader);
      }
      loader.style.opacity = '1';
      loader.style.visibility = 'visible';
    },

    pageHide() {
      const loader = document.getElementById('page-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.style.visibility = 'hidden';
        }, 300);
      }
    }
  };

  // Form Validation Utilities
  const Validator = {
    rules: {
      required(value) {
        return value && value.trim().length > 0;
      },

      email(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },

      phone(value) {
        // Uganda phone format
        const digits = value.replace(/\D/g, '');
        const local = digits.startsWith('256') ? digits.slice(3) : digits;
        return /^(07[0-9]|03[0-9])/.test(local) && local.length === 9;
      },

      minLength(value, length) {
        return value.length >= length;
      },

      maxLength(value, length) {
        return value.length <= length;
      },

      match(value, compareValue) {
        return value === compareValue;
      },

      url(value) {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },

      number(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
      },

      min(value, min) {
        return parseFloat(value) >= min;
      },

      max(value, max) {
        return parseFloat(value) <= max;
      }
    },

    validate(field, rules) {
      const value = field.value;
      const errors = [];

      for (const rule of rules) {
        const [ruleName, ...params] = rule.split(':');
        const validator = this.rules[ruleName];

        if (validator && !validator(value, ...params)) {
          errors.push(this.getErrorMessage(ruleName, params, field));
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    },

    getErrorMessage(rule, params, field) {
      const messages = {
        required: `${field.name || 'This field'} is required`,
        email: 'Please enter a valid email address',
        phone: 'Please enter a valid Uganda phone number (e.g., 07XX XXX XXX)',
        minLength: `Must be at least ${params[0]} characters`,
        maxLength: `Must be no more than ${params[0]} characters`,
        match: 'Fields do not match',
        url: 'Please enter a valid URL',
        number: 'Please enter a valid number',
        min: `Must be at least ${params[0]}`,
        max: `Must be no more than ${params[0]}`
      };
      return messages[rule] || 'Invalid value';
    },

    // Real-time validation
    attach(field, rules) {
      const validateField = () => {
        const result = this.validate(field, rules);
        
        // Remove existing error
        const existingError = field.parentNode.querySelector('.form-error-message');
        if (existingError) {
          existingError.remove();
        }
        field.classList.remove('form-error');

        // Add new error if invalid
        if (!result.valid) {
          field.classList.add('form-error');
          const errorDiv = document.createElement('div');
          errorDiv.className = 'form-error-message';
          errorDiv.innerHTML = `
            <span class="material-icons-round" style="font-size: 14px;">error</span>
            <span>${result.errors[0]}</span>
          `;
          field.parentNode.appendChild(errorDiv);
        }

        return result.valid;
      };

      // Validate on blur
      field.addEventListener('blur', validateField);
      
      // Clear error on input
      field.addEventListener('input', () => {
        field.classList.remove('form-error');
        const error = field.parentNode.querySelector('.form-error-message');
        if (error) error.remove();
      });

      return validateField;
    }
  };

  // Modal System
  const Modal = {
    activeModal: null,

    create(options = {}) {
      const {
        title = '',
        content = '',
        footer = '',
        size = 'md', // sm, md, lg, xl, full
        closable = true,
        onClose = null
      } = options;

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;

      // Modal sizes
      const sizes = {
        sm: 'max-width: 400px;',
        md: 'max-width: 500px;',
        lg: 'max-width: 700px;',
        xl: 'max-width: 900px;',
        full: 'max-width: 100%; min-height: 100vh; border-radius: 0;'
      };

      // Create modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.style.cssText = `
        background: white;
        border-radius: 1rem;
        width: 100%;
        ${sizes[size] || sizes.md}
        max-height: 90vh;
        overflow-y: auto;
        transform: scale(0.95);
        transition: transform 0.3s ease;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      `;

      // Header
      const headerHtml = title ? `
        <div class="modal-header" style="padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0;">${title}</h3>
          ${closable ? `<button class="modal-close" style="background: none; border: none; cursor: pointer; font-size: 1.5rem; padding: 0.25rem; line-height: 1;">✕</button>` : ''}
        </div>
      ` : '';

      // Body
      const bodyHtml = `
        <div class="modal-body" style="padding: 1.5rem;">
          ${content}
        </div>
      `;

      // Footer
      const footerHtml = footer ? `
        <div class="modal-footer" style="padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.75rem;">
          ${footer}
        </div>
      ` : '';

      modal.innerHTML = headerHtml + bodyHtml + footerHtml;
      overlay.appendChild(modal);

      // Event handlers
      if (closable) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => this.close(overlay));
        }
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this.close(overlay);
        });
      }

      // Close on Escape
      const escapeHandler = (e) => {
        if (e.key === 'Escape' && closable) {
          this.close(overlay);
        }
      };

      this.close = (modalOverlay) => {
        modalOverlay.style.opacity = '0';
        modalOverlay.querySelector('.modal').style.transform = 'scale(0.95)';
        setTimeout(() => {
          if (modalOverlay.parentNode) {
            modalOverlay.parentNode.removeChild(modalOverlay);
          }
        }, 300);
        document.removeEventListener('keydown', escapeHandler);
        document.body.style.overflow = '';
        if (onClose) onClose();
      };

      // Show modal
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', escapeHandler);

      // Trigger animation
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
      });

      // Focus management
      const focusable = modal.querySelector('button, input, textarea, select, a[href]');
      if (focusable) focusable.focus();

      this.activeModal = overlay;
      return overlay;
    },

    alert(message, title = 'Alert') {
      return this.create({
        title,
        content: `<p>${message}</p>`,
        footer: '<button class="btn btn-primary modal-ok">OK</button>',
        closable: true
      });
    },

    confirm(message, title = 'Confirm', onConfirm = null, onCancel = null) {
      return this.create({
        title,
        content: `<p>${message}</p>`,
        footer: `
          <button class="btn btn-ghost modal-cancel">Cancel</button>
          <button class="btn btn-primary modal-confirm">Confirm</button>
        `,
        closable: true
      });
    }
  };

  // Mobile Navigation
  const MobileNav = {
    init() {
      const toggle = document.querySelector('.mobile-nav-toggle');
      const nav = document.querySelector('.mobile-nav');
      const overlay = document.querySelector('.mobile-nav-overlay');

      if (!toggle || !nav) return;

      toggle.addEventListener('click', () => {
        const isOpen = nav.classList.contains('active');
        
        if (isOpen) {
          this.close(nav, overlay, toggle);
        } else {
          this.open(nav, overlay, toggle);
        }
      });

      // Close on overlay click
      if (overlay) {
        overlay.addEventListener('click', () => {
          this.close(nav, overlay, toggle);
        });
      }

      // Close on link click
      const links = nav.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', () => {
          this.close(nav, overlay, toggle);
        });
      });
    },

    open(nav, overlay, toggle) {
      nav.classList.add('active');
      if (overlay) overlay.classList.add('active');
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    },

    close(nav, overlay, toggle) {
      nav.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  };

  // Smooth Scroll
  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;
          
          const target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });
    }
  };

  // Intersection Observer for animations
  const ScrollAnimations = {
    init() {
      const animatedElements = document.querySelectorAll('[data-animate]');
      
      if (!animatedElements.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      animatedElements.forEach(el => observer.observe(el));
    }
  };

  // Initialize everything on DOM ready
  function init() {
    MobileNav.init();
    SmoothScroll.init();
    ScrollAnimations.init();
    
    console.log('✅ UI Components initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose to global scope
  window.BUAlumniUI = {
    Toast,
    Loading,
    Validator,
    Modal,
    MobileNav,
    SmoothScroll,
    ScrollAnimations
  };

})();
