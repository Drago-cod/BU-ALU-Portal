/**
 * BU Alumni Portal - Registration Form Handler
 * Connects register.html to /api/register-account endpoint
 */

(function() {
  'use strict';

  // Real-time validation setup
  function setupRealTimeValidation(form) {
    // Email validation
    const emailInput = form.querySelector('input[type="email"], input[name="email"]');
    if (emailInput) {
      emailInput.addEventListener('blur', () => {
        if (emailInput.value && !FormUtils.isValidEmail(emailInput.value)) {
          emailInput.classList.add('form-error');
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

    // Password strength indicator
    const passwordInput = form.querySelector('input[name="password"]');
    const confirmInput = form.querySelector('input[name="confirmPassword"], input[name="confirm_password"]');
    
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        updatePasswordStrength(passwordInput.value);
        if (confirmInput && confirmInput.value) {
          validatePasswordMatch(passwordInput, confirmInput);
        }
      });
    }

    if (confirmInput && passwordInput) {
      confirmInput.addEventListener('input', () => {
        validatePasswordMatch(passwordInput, confirmInput);
      });
    }

    // Clear errors on input
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => {
        clearFieldError(field);
      });
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

  function updatePasswordStrength(password) {
    const strengthIndicator = document.getElementById('password-strength');
    if (!strengthIndicator) return;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['#dc2626', '#ef4444', '#f59e0b', '#84cc16', '#22c55e', '#16a34a'];

    strengthIndicator.textContent = `Strength: ${levels[strength]}`;
    strengthIndicator.style.color = colors[strength];
  }

  function validatePasswordMatch(passwordInput, confirmInput) {
    if (confirmInput.value !== passwordInput.value) {
      confirmInput.classList.add('form-error');
      showFieldError(confirmInput, 'Passwords do not match');
      return false;
    } else {
      clearFieldError(confirmInput);
      return true;
    }
  }

  // Wait for DOM to be ready
  function init() {
    const form = document.getElementById('registration-form') || document.querySelector('form[action*="register"]') || document.querySelector('form');
    
    if (!form) {
      console.error('Registration form not found');
      return;
    }

    // Setup real-time validation
    setupRealTimeValidation(form);
    
    // Prevent default form submission
    form.addEventListener('submit', handleSubmit);

    console.log('✓ Registration form handler initialized with real-time validation');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    
    // Clear previous messages
    FormUtils.clearMessages(form);
    
    // Clear all field errors
    form.querySelectorAll('.form-error').forEach(el => {
      el.classList.remove('form-error');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.field-error').forEach(el => el.remove());

    // Collect form data
    const formData = new FormData(form);
    const data = {
      fullName: formData.get('fullName') || formData.get('fullname') || formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword') || formData.get('confirm_password'),
      accountType: formData.get('accountType') || 'Alumni',
      profession: formData.get('profession'),
      program: formData.get('program'),
      graduationYear: formData.get('graduationYear') || formData.get('graduation_year'),
      serviceInterest: formData.get('serviceInterest') || formData.get('service_interest'),
      paymentMethod: formData.get('paymentMethod') || formData.get('payment_method'),
      rating: formData.get('rating'),
      referralSource: formData.get('referralSource') || formData.get('referral_source'),
    };

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'password'];
    const missing = FormUtils.validateRequired(form, requiredFields);
    
    if (missing.length > 0) {
      // Show toast notification
      if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
        window.BUAlumniUI.Toast.warning('Please fill in all required fields');
      }
      return;
    }

    // Validate email
    if (!FormUtils.isValidEmail(data.email)) {
      const emailInput = form.querySelector('input[name="email"]');
      if (emailInput) {
        emailInput.classList.add('form-error');
        showFieldError(emailInput, 'Please enter a valid email address');
        emailInput.focus();
      }
      if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
        window.BUAlumniUI.Toast.error('Please enter a valid email address');
      }
      return;
    }

    // Validate password match
    if (data.password !== data.confirmPassword) {
      const confirmInput = form.querySelector('input[name="confirmPassword"], input[name="confirm_password"]');
      if (confirmInput) {
        confirmInput.classList.add('form-error');
        showFieldError(confirmInput, 'Passwords do not match');
        confirmInput.focus();
      }
      if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
        window.BUAlumniUI.Toast.error('Passwords do not match');
      }
      return;
    }

    // Validate password strength
    if (data.password.length < 6) {
      const passwordInput = form.querySelector('input[name="password"]');
      if (passwordInput) {
        passwordInput.classList.add('form-error');
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        passwordInput.focus();
      }
      if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
        window.BUAlumniUI.Toast.warning('Password must be at least 6 characters long');
      }
      return;
    }

    // Show loading state
    if (submitBtn) {
      FormUtils.setLoading(submitBtn, true);
    }
    
    // Show page loading overlay
    if (window.BUAlumniUI && window.BUAlumniUI.Loading) {
      window.BUAlumniUI.Loading.pageShow();
    }

    try {
      // Call API
      const result = await BUAlumniAPI.registerAccount(data);

      if (result.success) {
        // Show success message
        if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
          window.BUAlumniUI.Toast.success(
            `Welcome, ${result.data.account?.fullName || 'Member'}! Account created successfully.`,
            'Registration Complete'
          );
        }

        // Redirect after success
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      } else {
        // Show specific error
        const errorMsg = result.error || 'Failed to create account. Please try again.';
        
        if (result.error?.includes('email')) {
          const emailInput = form.querySelector('input[name="email"]');
          if (emailInput) {
            emailInput.classList.add('form-error');
            showFieldError(emailInput, 'This email is already registered');
            emailInput.focus();
          }
        }
        
        if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
          window.BUAlumniUI.Toast.error(errorMsg);
        } else {
          FormUtils.showError(form, errorMsg);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
        window.BUAlumniUI.Toast.error('An unexpected error occurred. Please try again.');
      } else {
        FormUtils.showError(form, 'An unexpected error occurred. Please try again.');
      }
    } finally {
      // Hide loading states
      if (submitBtn) {
        FormUtils.setLoading(submitBtn, false);
      }
      if (window.BUAlumniUI && window.BUAlumniUI.Loading) {
        window.BUAlumniUI.Loading.pageHide();
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
