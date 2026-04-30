/**
 * Newsletter Popup
 * Professional popup that appears to encourage newsletter signups
 */

(function() {
  'use strict';

  // Configuration
  const POPUP_DELAY = 8000; // Show after 8 seconds
  const STORAGE_KEY = 'bu_newsletter_popup_dismissed';
  const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  function init() {
    // Check if user has dismissed popup recently
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const timeSinceDismiss = Date.now() - parseInt(dismissedAt, 10);
      if (timeSinceDismiss < DISMISS_DURATION) {
        return; // Don't show popup
      }
    }

    // Show popup after delay
    setTimeout(showPopup, POPUP_DELAY);
  }

  function showPopup() {
    // Create popup HTML
    const popupHTML = `
      <div class="newsletter-popup-overlay" id="newsletterPopupOverlay">
        <div class="newsletter-popup" id="newsletterPopup">
          <button class="newsletter-popup-close" id="newsletterPopupClose" aria-label="Close popup">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          
          <div class="newsletter-popup-content">
            <div class="newsletter-popup-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            
            <h3>Stay Connected with BU Alumni</h3>
            <p>Get the latest news, events, and opportunities delivered to your inbox every month.</p>
            
            <form class="newsletter-popup-form" id="newsletterPopupForm">
              <div class="newsletter-popup-input-group">
                <input 
                  type="email" 
                  id="newsletterPopupEmail" 
                  placeholder="Enter your email address" 
                  required 
                  aria-label="Email address"
                />
                <button type="submit" class="btn btn-primary">
                  Subscribe
                </button>
              </div>
              <p class="newsletter-popup-privacy">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </form>
            
            <div class="newsletter-popup-success" id="newsletterPopupSuccess" hidden>
              <div class="newsletter-popup-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h4>You're all set!</h4>
              <p>Check your inbox for a confirmation email.</p>
            </div>
            
            <div class="newsletter-popup-benefits">
              <div class="newsletter-popup-benefit">
                <span class="material-icons-round">event</span>
                <span>Event updates</span>
              </div>
              <div class="newsletter-popup-benefit">
                <span class="material-icons-round">work</span>
                <span>Job opportunities</span>
              </div>
              <div class="newsletter-popup-benefit">
                <span class="material-icons-round">people</span>
                <span>Alumni stories</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert popup into page
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // Get elements
    const overlay = document.getElementById('newsletterPopupOverlay');
    const popup = document.getElementById('newsletterPopup');
    const closeBtn = document.getElementById('newsletterPopupClose');
    const form = document.getElementById('newsletterPopupForm');
    const successMsg = document.getElementById('newsletterPopupSuccess');

    // Show popup with animation
    requestAnimationFrame(() => {
      overlay.classList.add('show');
      popup.classList.add('show');
    });

    // Close handlers
    function closePopup() {
      overlay.classList.remove('show');
      popup.classList.remove('show');
      
      // Store dismissal timestamp
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      
      // Remove from DOM after animation
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }

    closeBtn.addEventListener('click', closePopup);
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closePopup();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        closePopup();
        document.removeEventListener('keydown', escapeHandler);
      }
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = document.getElementById('newsletterPopupEmail');
      const email = emailInput.value.trim();

      if (!email) return;

      // Save to localStorage
      const subscribers = JSON.parse(localStorage.getItem('buNewsletterSubscribers') || '[]');
      
      // Check if already subscribed
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('buNewsletterSubscribers', JSON.stringify(subscribers));
      }

      // Show success message
      form.hidden = true;
      successMsg.hidden = false;

      // Close popup after 3 seconds
      setTimeout(closePopup, 3000);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
