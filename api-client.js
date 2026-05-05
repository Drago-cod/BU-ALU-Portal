/**
 * BU Alumni Portal - API Client
 * Handles all API communication with the backend
 */

(function() {
  'use strict';

  // API Configuration
  const localHostnames = ['localhost', '127.0.0.1', ''];
  const isLocal = localHostnames.includes(window.location.hostname);
  const isBackendPort = window.location.port === '8080';
  const API_BASE_URL = isLocal && !isBackendPort
    ? 'http://localhost:8080'
    : '';

  const API_ENDPOINTS = {
    // Auth
    REGISTER_ACCOUNT: '/api/register-account',
    LOGIN_ACCOUNT: '/api/login-account',
    
    // Membership & Events
    REGISTER_MEMBER: '/api/register-member',
    REGISTER_EVENT: '/api/register-event',
    
    // Donations
    REGISTER_DONATION: '/api/register-donation',
    MOMO_PROMPT: '/api/momo-prompt',
    
    // Jobs
    POST_JOB: '/api/post-job',
    
    // Community
    COMMUNITY_POSTS: '/api/community/posts',
    COMMUNITY_POST: '/api/community/post',
    COMMUNITY_LIKE: '/api/community/like',
    COMMUNITY_COMMENT: '/api/community/comment',
    
    // Stats
    STATS: '/api/stats',
    
    // Tickets
    TICKET: '/api/ticket',
  };

  // Token management
  const TOKEN_KEY = 'bu_alumni_token';
  const ACCOUNT_KEY = 'bu_alumni_account';

  const Auth = {
    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token) {
      localStorage.setItem(TOKEN_KEY, token);
    },

    clearToken() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ACCOUNT_KEY);
    },

    getAccount() {
      const account = localStorage.getItem(ACCOUNT_KEY);
      return account ? JSON.parse(account) : null;
    },

    setAccount(account) {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    },

    isLoggedIn() {
      return !!this.getToken();
    },

    logout() {
      this.clearToken();
      window.location.href = 'index.html';
    }
  };

  // API Helper
  async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = Auth.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add body if provided
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 
          data?.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return { success: true, data, response };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return { success: false, error: error.message };
    }
  }

  // API Methods
  window.BUAlumniAPI = {
    // Auth
    Auth,

    // Account Registration
    async registerAccount(userData) {
      const result = await apiCall(API_ENDPOINTS.REGISTER_ACCOUNT, {
        method: 'POST',
        body: userData
      });

      if (result.success && result.data.token) {
        Auth.setToken(result.data.token);
        Auth.setAccount(result.data.account);
      }

      return result;
    },

    // Login
    async loginAccount(email, password) {
      const result = await apiCall(API_ENDPOINTS.LOGIN_ACCOUNT, {
        method: 'POST',
        body: { email, password }
      });

      if (result.success && result.data.token) {
        Auth.setToken(result.data.token);
        Auth.setAccount(result.data.account);
      }

      return result;
    },

    // Membership Registration
    async registerMember(memberData) {
      return await apiCall(API_ENDPOINTS.REGISTER_MEMBER, {
        method: 'POST',
        body: memberData
      });
    },

    // Event Registration
    async registerEvent(eventData) {
      return await apiCall(API_ENDPOINTS.REGISTER_EVENT, {
        method: 'POST',
        body: eventData
      });
    },

    // Download Ticket
    downloadTicket(ticketId) {
      const url = `${API_BASE_URL}${API_ENDPOINTS.TICKET}/${ticketId}`;
      window.open(url, '_blank');
    },

    // Donation
    async registerDonation(donationData) {
      return await apiCall(API_ENDPOINTS.REGISTER_DONATION, {
        method: 'POST',
        body: donationData
      });
    },

    // Mobile Money Payment
    async momoPrompt(provider, phone, amount, currency = 'UGX', reference = 'BU-ALUMNI') {
      return await apiCall(API_ENDPOINTS.MOMO_PROMPT, {
        method: 'POST',
        body: { provider, phone, amount, currency, reference }
      });
    },

    // Post Job
    async postJob(jobData) {
      return await apiCall(API_ENDPOINTS.POST_JOB, {
        method: 'POST',
        body: jobData
      });
    },

    // Get Stats
    async getStats() {
      return await apiCall(API_ENDPOINTS.STATS, {
        method: 'GET'
      });
    },

    // Update Stats (admin only)
    async updateStats(statsData) {
      return await apiCall(API_ENDPOINTS.STATS, {
        method: 'POST',
        body: statsData
      });
    },

    // Community - Get Posts
    async getPosts(limit = 20, offset = 0) {
      const query = new URLSearchParams({ limit, offset }).toString();
      return await apiCall(`${API_ENDPOINTS.COMMUNITY_POSTS}?${query}`, {
        method: 'GET'
      });
    },

    // Community - Create Post
    async createPost(postData) {
      return await apiCall(API_ENDPOINTS.COMMUNITY_POST, {
        method: 'POST',
        body: postData
      });
    },

    // Community - Toggle Like
    async toggleLike(postId, userEmail) {
      return await apiCall(API_ENDPOINTS.COMMUNITY_LIKE, {
        method: 'POST',
        body: { postId, userEmail }
      });
    },

    // Community - Add Comment
    async addComment(postId, authorName, content) {
      return await apiCall(API_ENDPOINTS.COMMUNITY_COMMENT, {
        method: 'POST',
        body: { postId, authorName, content }
      });
    }
  };

  // Enhanced Form Utilities with UI feedback
  window.FormUtils = {
    // Show loading state on button
    setLoading(button, isLoading) {
      if (typeof button === 'string') {
        button = document.querySelector(button);
      }
      if (!button) return;

      if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.classList.add('btn-loading');
        button.setAttribute('aria-busy', 'true');
      } else {
        button.disabled = false;
        button.classList.remove('btn-loading');
        button.removeAttribute('aria-busy');
        if (button.dataset.originalText) {
          button.textContent = button.dataset.originalText;
        }
      }
    },

    // Show success message - uses Toast if available, fallback to form
    showSuccess(form, message, useToast = true) {
      this.clearMessages(form);
      
      if (useToast && window.BUAlumniUI && window.BUAlumniUI.Toast) {
        window.BUAlumniUI.Toast.success(message);
      } else {
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success';
        successDiv.style.cssText = 'background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #a7f3d0;';
        successDiv.innerHTML = `<strong>✓ Success!</strong> ${message}`;
        successDiv.setAttribute('role', 'alert');
        form.insertBefore(successDiv, form.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => successDiv.remove(), 5000);
      }
    },

    // Show error message - uses Toast if available, fallback to form
    showError(form, message, useToast = true) {
      this.clearMessages(form);
      
      if (useToast && window.BUAlumniUI && window.BUAlumniUI.Toast) {
        window.BUAlumniUI.Toast.error(message);
      } else {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.style.cssText = 'background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #fecaca;';
        errorDiv.innerHTML = `<strong>✗ Error:</strong> ${message}`;
        errorDiv.setAttribute('role', 'alert');
        form.insertBefore(errorDiv, form.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
      }
    },

    // Clear messages
    clearMessages(form) {
      const messages = form.querySelectorAll('.form-success, .form-error');
      messages.forEach(m => m.remove());
    },

    // Collect form data
    getFormData(form) {
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        // Handle checkbox arrays
        if (data[key]) {
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      });
      return data;
    },

    // Validate required fields with better UX
    validateRequired(form, fields) {
      const missing = [];
      let firstInvalid = null;
      
      fields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        if (!input || !input.value.trim()) {
          missing.push(field);
          if (input) {
            input.classList.add('form-error');
            input.setAttribute('aria-invalid', 'true');
            
            // Add error message below field
            let errorDiv = input.parentNode.querySelector('.field-error');
            if (!errorDiv) {
              errorDiv = document.createElement('div');
              errorDiv.className = 'field-error form-error-message';
              errorDiv.style.cssText = 'margin-top: 0.25rem; font-size: 0.875rem;';
              input.parentNode.appendChild(errorDiv);
            }
            errorDiv.textContent = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
            
            if (!firstInvalid) firstInvalid = input;
          }
        } else {
          // Clear error if field is now valid
          if (input) {
            input.classList.remove('form-error');
            input.removeAttribute('aria-invalid');
            const errorDiv = input.parentNode.querySelector('.field-error');
            if (errorDiv) errorDiv.remove();
          }
        }
      });
      
      // Focus first invalid field
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return missing;
    },

    // Validate email
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validate phone (Uganda format)
    isValidUgandaPhone(phone) {
      const digits = phone.replace(/\D/g, '');
      const local = digits.startsWith('256') ? digits.slice(3) : digits;
      return /^(07[0-9]|03[0-9])/.test(local) && local.length === 9;
    },

    // Format phone number as user types
    formatPhone(input) {
      let value = input.value.replace(/\D/g, '');
      if (value.startsWith('256')) {
        value = value.slice(3);
      }
      if (value.startsWith('0')) {
        value = value.slice(1);
      }
      if (value.length > 9) {
        value = value.slice(0, 9);
      }
      if (value.length > 0) {
        input.value = '0' + value;
      }
    },

    // Debounce function for search inputs
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  };

  // Update navigation based on auth state
  function updateNavigation() {
    const isLoggedIn = Auth.isLoggedIn();
    const account = Auth.getAccount();

    // Find auth-related nav elements
    const signInLink = document.querySelector('a[href="auth.html"], a[href="login.html"]');
    const signUpLink = document.querySelector('a[href="register.html"]');
    const navActions = document.querySelector('.nav-actions');

    if (isLoggedIn && navActions) {
      // Replace Sign In/Sign Up with user menu
      const userName = account?.fullName || account?.email || 'User';
      navActions.innerHTML = `
        <span style="color: var(--text); font-weight: 500; margin-right: 1rem;">
          👤 ${userName}
        </span>
        <button class="btn btn-ghost" onclick="BUAlumniAPI.Auth.logout()" style="cursor: pointer;">
          Sign Out
        </button>
      `;
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavigation);
  } else {
    updateNavigation();
  }

  // Expose auth check globally
  window.requireAuth = function(redirectUrl = 'login.html') {
    if (!Auth.isLoggedIn()) {
      window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(window.location.href)}`;
      return false;
    }
    return true;
  };

})();
