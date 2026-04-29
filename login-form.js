/**
 * BU Alumni Portal - Login Form Handler
 * Connects login.html to /api/login-account endpoint
 */

(function() {
  'use strict';

  // Setup real-time validation
  function setupValidation(form) {
    const emailInput = form.querySelector('input[name="email"], input[type="email"]');
    const passwordInput = form.querySelector('input[name="password"]');

    // Email validation
    if (emailInput) {
      emailInput.addEventListener('blur', () => {
        if (emailInput.value && !FormUtils.isValidEmail(emailInput.value)) {
          showFieldError(emailInput, 'Please enter a valid email address');
        } else {
          clearFieldError(emailInput);
        }
      });

      emailInput.addEventListener('input', () => {
        if (FormUtils.isValidEmail(emailInput.value)) {
          clearFieldError(emailInput);
        }
      });
    }

    // Clear errors on input
    form.querySelectorAll('input').forEach(field => {
      field.addEventListener('input', () => clearFieldError(field));
    });
  }

  function showFieldError(input, message) {
    input.classList.add('form-error');
    input.setAttribute('aria-invalid', 'true');
    
    let errorDiv = input.parentNode.querySelector('.field-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'field-error form-error-message';
      input.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
  }

  function clearFieldError(input) {
    input.classList.remove('form-error');
    input.removeAttribute('aria-invalid');
    const errorDiv = input.parentNode.querySelector('.field-error');
    if (errorDiv) errorDiv.remove();
  }

  function init() {
    const form = document.getElementById('login-form') || 
                 document.querySelector('form[action*="login"]') || 
                 document.querySelector('form');
    
    if (!form) {
      console.error('Login form not found');
      return;
    }

    // Setup validation
    setupValidation(form);
    
    form.addEventListener('submit', handleSubmit);
    console.log('✓ Login form handler initialized with real-time validation');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    
    // Clear previous errors
    form.querySelectorAll('.form-error').forEach(el => {
      el.classList.remove('form-error');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.field-error').forEach(el => el.remove());

    // Get form data
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe') === 'on';

    // Validate
    let hasError = false;
    
    if (!email || !email.trim()) {
      const emailInput = form.querySelector('input[name="email"]');
      if (emailInput) {
        showFieldError(emailInput, 'Please enter your email address');
        emailInput.focus();
      }
      hasError = true;
    } else if (!FormUtils.isValidEmail(email)) {
      const emailInput = form.querySelector('input[name="email"]');
      if (emailInput) {
        showFieldError(emailInput, 'Please enter a valid email address');
        emailInput.focus();
      }
      hasError = true;
    }

    if (!password) {
      const passwordInput = form.querySelector('input[name="password"]');
      if (passwordInput) {
        showFieldError(passwordInput, 'Please enter your password');
        if (!hasError) passwordInput.focus();
      }
      hasError = true;
    }
    
    if (hasError) {
      if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
        window.BUAlumniUI.Toast.warning('Please fill in all required fields');
      }
      return;
    }

    // Show loading
    if (submitBtn) {
      FormUtils.setLoading(submitBtn, true);
    }
    
    // Page loading overlay
    if (window.BUAlumniUI && window.BUAlumniUI.Loading) {
      window.BUAlumniUI.Loading.pageShow();
    }

    try {
      const result = await BUAlumniAPI.loginAccount(email, password);

      if (result.success) {
        // Toast notification
        if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
          window.BUAlumniUI.Toast.success(
            `Welcome back, ${result.data.account?.fullName || 'Member'}!`,
            'Login Successful'
          );
        }

        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('bu_alumni_remember_email', email);
        } else {
          localStorage.removeItem('bu_alumni_remember_email');
        }

        // Check for redirect URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'index.html';

        setTimeout(() => {
          window.location.href = redirect;
        }, 1500);
      } else {
        const errorMsg = result.error || 'Invalid email or password';
        
        // Show error on password field for security
        const passwordInput = form.querySelector('input[name="password"]');
        if (passwordInput) {
          showFieldError(passwordInput, errorMsg);
        }
        
        if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
          window.BUAlumniUI.Toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
        window.BUAlumniUI.Toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      if (submitBtn) {
        FormUtils.setLoading(submitBtn, false);
      }
      if (window.BUAlumniUI && window.BUAlumniUI.Loading) {
        window.BUAlumniUI.Loading.pageHide();
      }
    }
  }

  // Pre-fill email if remembered
  function prefillEmail() {
    const emailInput = document.querySelector('input[name="email"], input[type="email"]');
    const rememberedEmail = localStorage.getItem('bu_alumni_remember_email');
    
    if (emailInput && rememberedEmail) {
      emailInput.value = rememberedEmail;
      
      // Check remember me checkbox
      const rememberCheckbox = document.querySelector('input[name="rememberMe"]');
      if (rememberCheckbox) {
        rememberCheckbox.checked = true;
      }
      
      // Focus password field for convenience
      const passwordInput = document.querySelector('input[name="password"]');
      if (passwordInput) {
        setTimeout(() => passwordInput.focus(), 100);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      prefillEmail();
    });
  } else {
    init();
    prefillEmail();
  }

})();
