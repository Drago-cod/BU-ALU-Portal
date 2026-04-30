/**
 * Quick Actions Floating Widget
 * Professional floating action button with quick access menu
 */

(function() {
  'use strict';

  // Create the widget HTML
  const widgetHTML = `
    <div class="quick-actions-widget" id="quickActionsWidget">
      <button class="qa-trigger" id="qaTrigger" aria-label="Quick Actions" aria-expanded="false">
        <span class="qa-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </span>
        <span class="qa-label">Quick Actions</span>
      </button>
      
      <div class="qa-menu" id="qaMenu">
        <div class="qa-menu-header">
          <h3>Quick Actions</h3>
          <button class="qa-close" id="qaClose" aria-label="Close menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="qa-menu-items">
          <a href="donate.html" class="qa-item qa-item-primary">
            <div class="qa-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div class="qa-item-content">
              <div class="qa-item-title">Make a Donation</div>
              <div class="qa-item-desc">Support BU students</div>
            </div>
          </a>
          
          <a href="events.html#event-register" class="qa-item">
            <div class="qa-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div class="qa-item-content">
              <div class="qa-item-title">Register for Event</div>
              <div class="qa-item-desc">Join upcoming events</div>
            </div>
          </a>
          
          <a href="memberships.html#signup-form" class="qa-item">
            <div class="qa-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="qa-item-content">
              <div class="qa-item-title">Join Membership</div>
              <div class="qa-item-desc">Become a member</div>
            </div>
          </a>
          
          <a href="community.html" class="qa-item">
            <div class="qa-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
            <div class="qa-item-content">
              <div class="qa-item-title">Find Alumni</div>
              <div class="qa-item-desc">Connect with graduates</div>
            </div>
          </a>
          
          <a href="opportunities.html" class="qa-item">
            <div class="qa-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div class="qa-item-content">
              <div class="qa-item-title">Browse Jobs</div>
              <div class="qa-item-desc">Career opportunities</div>
            </div>
          </a>
        </div>
      </div>
      
      <div class="qa-backdrop" id="qaBackdrop"></div>
    </div>
  `;

  // Add widget to page when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  function initWidget() {
    // Insert widget HTML
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // Get elements
    const trigger = document.getElementById('qaTrigger');
    const menu = document.getElementById('qaMenu');
    const backdrop = document.getElementById('qaBackdrop');
    const closeBtn = document.getElementById('qaClose');

    if (!trigger || !menu || !backdrop) return;

    // Toggle menu
    function toggleMenu(show) {
      const isOpen = show !== undefined ? show : !menu.classList.contains('open');
      
      menu.classList.toggle('open', isOpen);
      backdrop.classList.toggle('open', isOpen);
      trigger.classList.toggle('active', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
      
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    // Event listeners
    trigger.addEventListener('click', () => toggleMenu());
    closeBtn.addEventListener('click', () => toggleMenu(false));
    backdrop.addEventListener('click', () => toggleMenu(false));

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        toggleMenu(false);
      }
    });

    // Hide widget on scroll down, show on scroll up
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      const widget = document.getElementById('quickActionsWidget');
      
      if (currentScroll > lastScroll && currentScroll > 300) {
        widget.style.transform = 'translateY(120px)';
      } else {
        widget.style.transform = 'translateY(0)';
      }
      
      lastScroll = currentScroll;
    }, { passive: true });
  }
})();
