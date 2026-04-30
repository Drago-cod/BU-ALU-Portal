/**
 * Share Widget - Quick Actions Style
 * Professional floating share button with popup menu
 */

(function() {
  'use strict';

  // Social platforms configuration
  const PLATFORMS = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      color: '#25d366',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2c-5.5 0-9.97 4.46-9.97 9.97 0 1.75.46 3.46 1.33 4.96L2 22l5.2-1.36a9.93 9.93 0 0 0 4.83 1.23h.01c5.5 0 9.97-4.46 9.97-9.97a9.9 9.9 0 0 0-2.91-7zM12.04 20.18h-.01a8.3 8.3 0 0 1-4.24-1.16l-.3-.18-3.09.81.82-3.01-.2-.31a8.29 8.29 0 0 1-1.28-4.42c0-4.58 3.72-8.3 8.31-8.3 2.22 0 4.3.87 5.86 2.43a8.26 8.26 0 0 1 2.43 5.87c0 4.59-3.73 8.31-8.3 8.31zm4.56-6.23c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.57.12-.17.26-.65.8-.79.96-.15.17-.29.19-.54.07-.25-.13-1.05-.38-2-1.2-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.39.11-.52.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.09-.17.04-.31-.02-.44-.06-.13-.57-1.38-.78-1.89-.21-.5-.42-.43-.57-.43h-.49c-.17 0-.44.06-.67.31-.23.26-.88.86-.88 2.09s.9 2.43 1.02 2.6c.12.17 1.77 2.7 4.28 3.79.6.26 1.06.42 1.42.54.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.21-.59.21-1.09.15-1.19-.06-.11-.23-.17-.48-.3z"/></svg>`,
      getUrl: (title, url) => `https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`
    },
    {
      key: 'facebook',
      label: 'Facebook',
      color: '#1877f2',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
      getUrl: (title, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      key: 'twitter',
      label: 'X (Twitter)',
      color: '#000',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
      getUrl: (title, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      color: '#0a66c2',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
      getUrl: (title, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      key: 'email',
      label: 'Email',
      color: '#6366f1',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
      getUrl: (title, url) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(title + '\n\n' + url)}`
    },
    {
      key: 'copy',
      label: 'Copy Link',
      color: '#374151',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
      getUrl: null // Special handling for copy
    }
  ];

  // Create the widget HTML
  const widgetHTML = `
    <div class="share-widget" id="shareWidget">
      <button class="share-trigger" id="shareTrigger" aria-label="Share" aria-expanded="false">
        <span class="share-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </span>
        <span class="share-label">Share</span>
      </button>
      
      <div class="share-menu" id="shareMenu">
        <div class="share-menu-header">
          <h3>Share this page</h3>
          <button class="share-close" id="shareClose" aria-label="Close menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="share-menu-items" id="shareMenuItems">
          <!-- Items will be populated by JS -->
        </div>
      </div>
      
      <div class="share-backdrop" id="shareBackdrop"></div>
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
    const trigger = document.getElementById('shareTrigger');
    const menu = document.getElementById('shareMenu');
    const backdrop = document.getElementById('shareBackdrop');
    const closeBtn = document.getElementById('shareClose');
    const menuItems = document.getElementById('shareMenuItems');

    if (!trigger || !menu || !backdrop) return;

    // Populate menu items
    populateMenuItems(menuItems);

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
  }

  function populateMenuItems(container) {
    const pageTitle = document.title || 'BU Alumni Portal';
    const pageUrl = window.location.href;

    const html = PLATFORMS.map((platform, index) => {
      const delay = index * 50;
      
      if (platform.key === 'copy') {
        return `
          <button class="share-item" data-platform="${platform.key}" style="animation-delay: ${delay}ms">
            <div class="share-item-icon" style="background: ${platform.color};">
              ${platform.icon}
            </div>
            <div class="share-item-content">
              <div class="share-item-title">${platform.label}</div>
            </div>
          </button>
        `;
      } else {
        const url = platform.getUrl(pageTitle, pageUrl);
        return `
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="share-item" style="animation-delay: ${delay}ms">
            <div class="share-item-icon" style="background: ${platform.color};">
              ${platform.icon}
            </div>
            <div class="share-item-content">
              <div class="share-item-title">${platform.label}</div>
            </div>
          </a>
        `;
      }
    }).join('');

    container.innerHTML = html;

    // Add copy functionality
    const copyBtn = container.querySelector('[data-platform="copy"]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyToClipboard(pageUrl, copyBtn);
      });
    }
  }

  function copyToClipboard(text, button) {
    const originalText = button.querySelector('.share-item-title').textContent;
    
    navigator.clipboard.writeText(text).then(() => {
      button.querySelector('.share-item-title').textContent = 'Copied!';
      button.querySelector('.share-item-icon').style.background = '#16a34a';
      
      setTimeout(() => {
        button.querySelector('.share-item-title').textContent = originalText;
        button.querySelector('.share-item-icon').style.background = '#374151';
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      button.querySelector('.share-item-title').textContent = 'Copied!';
      setTimeout(() => {
        button.querySelector('.share-item-title').textContent = originalText;
      }, 2000);
    });
  }

})();


/**
 * Inline Share Buttons Handler
 * Handles share buttons within event cards, blog posts, etc.
 */
(function() {
  'use strict';

  // Initialize inline share buttons
  function initInlineShareButtons() {
    // Find all share buttons with data attributes
    const shareButtons = document.querySelectorAll('[data-share-title], .event-share-btn, .blog-share-btn');
    
    shareButtons.forEach(button => {
      button.addEventListener('click', handleInlineShare);
    });
  }

  function handleInlineShare(event) {
    event.preventDefault();
    const button = event.currentTarget;
    
    // Get share data from button attributes
    const title = button.getAttribute('data-share-title') || document.title;
    const text = button.getAttribute('data-share-text') || '';
    const url = button.getAttribute('data-share-url') || window.location.href;

    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: url
      }).catch(err => {
        // User cancelled or error occurred
        if (err.name !== 'AbortError') {
          console.log('Share failed:', err);
          fallbackShare(title, text, url, button);
        }
      });
    } else {
      // Fallback for desktop - show share options
      fallbackShare(title, text, url, button);
    }
  }

  function fallbackShare(title, text, url, button) {
    // Create a temporary share menu
    const existingMenu = document.querySelector('.inline-share-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'inline-share-menu';
    menu.innerHTML = `
      <div class="inline-share-header">
        <span>Share via</span>
        <button class="inline-share-close" aria-label="Close">×</button>
      </div>
      <div class="inline-share-options">
        <a href="https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}" target="_blank" rel="noopener" class="inline-share-option" style="--color: #25d366">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2c-5.5 0-9.97 4.46-9.97 9.97 0 1.75.46 3.46 1.33 4.96L2 22l5.2-1.36a9.93 9.93 0 0 0 4.83 1.23h.01c5.5 0 9.97-4.46 9.97-9.97a9.9 9.9 0 0 0-2.91-7zM12.04 20.18h-.01a8.3 8.3 0 0 1-4.24-1.16l-.3-.18-3.09.81.82-3.01-.2-.31a8.29 8.29 0 0 1-1.28-4.42c0-4.58 3.72-8.3 8.31-8.3 2.22 0 4.3.87 5.86 2.43a8.26 8.26 0 0 1 2.43 5.87c0 4.59-3.73 8.31-8.3 8.31zm4.56-6.23c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.57.12-.17.26-.65.8-.79.96-.15.17-.29.19-.54.07-.25-.13-1.05-.38-2-1.2-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.39.11-.52.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.09-.17.04-.31-.02-.44-.06-.13-.57-1.38-.78-1.89-.21-.5-.42-.43-.57-.43h-.49c-.17 0-.44.06-.67.31-.23.26-.88.86-.88 2.09s.9 2.43 1.02 2.6c.12.17 1.77 2.7 4.28 3.79.6.26 1.06.42 1.42.54.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.21-.59.21-1.09.15-1.19-.06-.11-.23-.17-.48-.3z"/></svg>
          <span>WhatsApp</span>
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="inline-share-option" style="--color: #1877f2">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          <span>Facebook</span>
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="inline-share-option" style="--color: #000">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span>X</span>
        </a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="inline-share-option" style="--color: #0a66c2">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          <span>LinkedIn</span>
        </a>
        <button class="inline-share-option inline-share-copy" data-url="${url}" style="--color: #6366f1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>Copy Link</span>
        </button>
      </div>
    `;

    // Position menu near the button
    document.body.appendChild(menu);
    
    const buttonRect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    
    // Position above or below button depending on space
    if (buttonRect.top > menuRect.height + 20) {
      menu.style.top = (buttonRect.top - menuRect.height - 10) + 'px';
    } else {
      menu.style.top = (buttonRect.bottom + 10) + 'px';
    }
    
    // Center horizontally relative to button
    menu.style.left = Math.max(10, buttonRect.left + (buttonRect.width / 2) - (menuRect.width / 2)) + 'px';
    
    // Show menu
    setTimeout(() => menu.classList.add('show'), 10);

    // Close button
    menu.querySelector('.inline-share-close').addEventListener('click', () => {
      menu.classList.remove('show');
      setTimeout(() => menu.remove(), 200);
    });

    // Copy link button
    const copyBtn = menu.querySelector('.inline-share-copy');
    copyBtn.addEventListener('click', () => {
      const urlToCopy = copyBtn.getAttribute('data-url');
      navigator.clipboard.writeText(urlToCopy).then(() => {
        const span = copyBtn.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        copyBtn.style.setProperty('--color', '#16a34a');
        
        setTimeout(() => {
          span.textContent = originalText;
          copyBtn.style.setProperty('--color', '#6366f1');
        }, 2000);
      });
    });

    // Close when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== button) {
          menu.classList.remove('show');
          setTimeout(() => menu.remove(), 200);
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInlineShareButtons);
  } else {
    initInlineShareButtons();
  }

  // Re-initialize when new content is added (for dynamic content)
  const observer = new MutationObserver(() => {
    initInlineShareButtons();
  });
  
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

})();
