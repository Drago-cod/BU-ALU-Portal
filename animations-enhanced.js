/* ── PROFESSIONAL ANIMATIONS & MICRO-INTERACTIONS ── */

// ── SCROLL REVEAL ANIMATIONS ──
class ScrollReveal {
  constructor() {
    this.elements = document.querySelectorAll('.scroll-reveal');
    this.init();
  }

  init() {
    this.createObserver();
    this.checkElements();
  }

  createObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
  }

  checkElements() {
    this.elements.forEach(element => {
      this.observer.observe(element);
    });
  }
}

// ── PARALLAX EFFECTS ──
class ParallaxEffect {
  constructor() {
    this.elements = document.querySelectorAll('.parallax-bg');
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('scroll', () => this.handleScroll());
    window.addEventListener('resize', () => this.handleScroll());
  }

  handleScroll() {
    const scrolled = window.pageYOffset;
    
    this.elements.forEach(element => {
      const speed = element.dataset.speed || 0.5;
      const yPos = -(scrolled * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  }
}

// ── SMOOTH SCROLL WITH OFFSET ──
class SmoothScroll {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => this.handleClick(e));
    });
  }

  handleClick(e) {
    e.preventDefault();
    const target = document.querySelector(e.target.getAttribute('href'));
    if (target) {
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
      const targetPosition = target.offsetTop - headerHeight - 20;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }
}

// ── ENHANCED FORM INTERACTIONS ──
class FormInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.enhanceInputs();
    this.enhanceValidation();
  }

  enhanceInputs() {
    const inputs = document.querySelectorAll('.form-input, .form-control');
    
    inputs.forEach(input => {
      // Floating labels
      const label = input.previousElementSibling;
      if (label && label.tagName === 'LABEL') {
        input.addEventListener('focus', () => {
          label.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
          if (!input.value) {
            label.classList.remove('focused');
          }
        });

        // Check initial state
        if (input.value) {
          label.classList.add('focused');
        }
      }

      // Input ripple effect
      input.addEventListener('click', (e) => {
        this.createRipple(e, input);
      });
    });
  }

  createRipple(e, element) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(17, 64, 217, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  enhanceValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      });

      // Real-time validation
      const inputs = form.querySelectorAll('.form-input, .form-control');
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          this.validateField(input);
        });
      });
    });
  }

  validateForm(form) {
    const inputs = form.querySelectorAll('.form-input[required], .form-control[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    const errorElement = field.parentElement.querySelector('.field-error');
    
    // Remove existing error
    if (errorElement) {
      errorElement.remove();
    }

    // Validation rules
    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    } else if (field.type === 'tel' && value && !this.isValidPhone(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    }

    // Show error if invalid
    if (!isValid) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = errorMessage;
      field.parentElement.appendChild(errorDiv);
      
      field.style.borderColor = '#ef4444';
      setTimeout(() => {
        field.style.borderColor = '';
      }, 3000);
    }

    return isValid;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
}

// ── LOADING STATES ──
class LoadingStates {
  constructor() {
    this.init();
  }

  init() {
    this.enhanceButtons();
    this.createSkeletons();
  }

  enhanceButtons() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        if (button.dataset.loading !== 'false') {
          this.showButtonLoading(button);
        }
      });
    });
  }

  showButtonLoading(button) {
    const originalContent = button.innerHTML;
    const spinner = '<span class="loading-spinner"></span>';
    
    button.innerHTML = spinner;
    button.disabled = true;
    
    // Simulate loading (remove in production)
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.disabled = false;
    }, 2000);
  }

  createSkeletons() {
    // Create skeleton screens for dynamic content
    const skeletonContainers = document.querySelectorAll('[data-skeleton]');
    
    skeletonContainers.forEach(container => {
      const count = parseInt(container.dataset.skeleton) || 3;
      this.createSkeleton(container, count);
    });
  }

  createSkeleton(container, count) {
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton';
      skeleton.style.height = container.dataset.skeletonHeight || '20px';
      skeleton.style.marginBottom = '10px';
      container.appendChild(skeleton);
    }
  }
}

// ── MICRO-INTERACTIONS ──
class MicroInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.enhanceCards();
    this.enhanceImages();
    this.enhanceCounters();
  }

  enhanceCards() {
    const cards = document.querySelectorAll('.stat-card, .content-card, .event-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.classList.add('hover-lift');
      });
      
      card.addEventListener('mouseleave', () => {
        card.classList.remove('hover-lift');
      });
    });
  }

  enhanceImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      img.addEventListener('load', () => {
        img.style.animation = 'fadeInUp 0.6s ease-out';
      });
      
      img.addEventListener('error', () => {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY3Ii8+CjxwYXRoIGQ9Ik0yMCAyNkMxNi41IDI2IDEzLjUgMjMgMTMgMjBTOS41IDIwIDkgMjBTNS41IDIzIDUgMjBTMiAyNiAyIDI2UzUuNSAyOSA1IDI5UzkuNSAyNiA5IDI2UzEzLjUgMjMgMTMgMjNTMTYuNSAyNiAyMCAyNlMyMy41IDIzIDI3IDIzUzMxIDIwIDMxIDIwUzIzLjUgMTcgMjAgMTdaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
      });
    });
  }

  enhanceCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.counter);
      const duration = parseInt(counter.dataset.duration) || 2000;
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };

      // Start counter when visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updateCounter();
            observer.unobserve(entry.target);
          }
        });
      });

      observer.observe(counter);
    });
  }
}

// ── PERFORMANCE OPTIMIZATIONS ──
class PerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.lazyLoadImages();
    this.optimizeScroll();
  }

  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  optimizeScroll() {
    let ticking = false;
    
    const updateScroll = () => {
      // Update scroll-based animations
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    });
  }
}

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all components
  new ScrollReveal();
  new ParallaxEffect();
  new SmoothScroll();
  new FormInteractions();
  new LoadingStates();
  new MicroInteractions();
  new PerformanceOptimizer();

  // Add page load animations
  document.body.classList.add('loaded');
});

// ── UTILITY FUNCTIONS ──
window.utils = {
  // Debounce function for performance
  debounce: (func, wait) => {
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
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Animate number counting
  animateValue: (element, start, end, duration) => {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        element.textContent = end;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }
};

// ── CSS ANIMATIONS (added dynamically) ──
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  .loaded {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .form-input.focused + .form-label,
  .form-control.focused + .form-label {
    transform: translateY(-25px) scale(0.85);
    color: var(--primary);
  }

  .lazy {
    filter: blur(5px);
    transition: filter 0.3s;
  }

  .lazy.loaded {
    filter: blur(0);
  }
`;

document.head.appendChild(style);
