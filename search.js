/**
 * Global Search Functionality
 * Search across pages, events, opportunities, and content
 */

(function() {
  'use strict';

  // Search index - pages and content
  const SEARCH_INDEX = [
    // Pages
    { title: 'Home', url: 'index.html', keywords: 'home welcome alumni network community', type: 'page' },
    { title: 'About Us', url: 'about.html', keywords: 'about mission vision history bugema university', type: 'page' },
    { title: 'Activities', url: 'activities.html', keywords: 'activities programs events initiatives impact', type: 'page' },
    { title: 'Community', url: 'community.html', keywords: 'community alumni network connect classmates', type: 'page' },
    { title: 'Events', url: 'events.html', keywords: 'events calendar gala networking reunion', type: 'page' },
    { title: 'Memberships', url: 'memberships.html', keywords: 'membership join register benefits tiers', type: 'page' },
    { title: 'Opportunities', url: 'opportunities.html', keywords: 'jobs careers opportunities employment hiring', type: 'page' },
    { title: 'Career Guide', url: 'career-guide.html', keywords: 'career guide resources mentorship development', type: 'page' },
    { title: 'Donate', url: 'donate.html', keywords: 'donate donation give back support scholarship', type: 'page' },
    
    // Features
    { title: 'Make a Donation', url: 'donate.html', keywords: 'donate money support scholarship fund', type: 'action' },
    { title: 'Register for Events', url: 'events.html#event-register', keywords: 'register event signup attend', type: 'action' },
    { title: 'Join Membership', url: 'memberships.html#signup-form', keywords: 'join membership register become member', type: 'action' },
    { title: 'Find Alumni', url: 'community.html', keywords: 'find search alumni classmates graduates', type: 'action' },
    { title: 'Browse Jobs', url: 'opportunities.html', keywords: 'jobs careers employment opportunities', type: 'action' },
    { title: 'Sign In', url: 'login.html', keywords: 'login signin account access', type: 'action' },
    { title: 'Sign Up', url: 'register.html', keywords: 'signup register create account', type: 'action' },
    
    // Events
    { title: 'Annual Alumni Gala 2026', url: 'events.html', keywords: 'gala annual event networking dinner', type: 'event' },
    { title: 'Career Fair & Networking Day', url: 'events.html', keywords: 'career fair networking jobs employment', type: 'event' },
    { title: 'Charity Run for Education', url: 'events.html', keywords: 'charity run education fundraising', type: 'event' }
  ];

  function init() {
    addSearchToHeader();
  }

  function addSearchToHeader() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    // Create search button
    const searchBtn = document.createElement('button');
    searchBtn.className = 'search-trigger';
    searchBtn.setAttribute('aria-label', 'Search');
    searchBtn.innerHTML = `
      <span class="material-icons-round">search</span>
    `;

    // Insert before first button
    navActions.insertBefore(searchBtn, navActions.firstChild);

    // Create search modal
    createSearchModal();

    // Event listeners
    searchBtn.addEventListener('click', openSearch);
    
    // Keyboard shortcut: Ctrl/Cmd + K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    });
  }

  function createSearchModal() {
    const modalHTML = `
      <div class="search-modal" id="searchModal">
        <div class="search-modal-backdrop" id="searchBackdrop"></div>
        <div class="search-modal-content">
          <div class="search-modal-header">
            <div class="search-input-wrapper">
              <span class="material-icons-round search-icon">search</span>
              <input 
                type="text" 
                id="searchInput" 
                placeholder="Search pages, events, opportunities..." 
                autocomplete="off"
                aria-label="Search"
              />
              <button class="search-clear" id="searchClear" hidden aria-label="Clear search">
                <span class="material-icons-round">close</span>
              </button>
            </div>
            <button class="search-close" id="searchClose" aria-label="Close search">
              <span class="material-icons-round">close</span>
            </button>
          </div>
          
          <div class="search-modal-body" id="searchResults">
            <div class="search-shortcuts">
              <div class="search-shortcuts-title">Quick Actions</div>
              <div class="search-shortcut-list">
                <a href="donate.html" class="search-shortcut">
                  <span class="material-icons-round">favorite</span>
                  <span>Make a Donation</span>
                </a>
                <a href="events.html#event-register" class="search-shortcut">
                  <span class="material-icons-round">event</span>
                  <span>Register for Event</span>
                </a>
                <a href="memberships.html#signup-form" class="search-shortcut">
                  <span class="material-icons-round">card_membership</span>
                  <span>Join Membership</span>
                </a>
                <a href="opportunities.html" class="search-shortcut">
                  <span class="material-icons-round">work</span>
                  <span>Browse Jobs</span>
                </a>
              </div>
            </div>
          </div>
          
          <div class="search-modal-footer">
            <div class="search-footer-hint">
              <kbd>↑</kbd><kbd>↓</kbd> to navigate
              <kbd>↵</kbd> to select
              <kbd>esc</kbd> to close
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get elements
    const modal = document.getElementById('searchModal');
    const backdrop = document.getElementById('searchBackdrop');
    const closeBtn = document.getElementById('searchClose');
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    const resultsContainer = document.getElementById('searchResults');

    // Close handlers
    closeBtn.addEventListener('click', closeSearch);
    backdrop.addEventListener('click', closeSearch);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeSearch();
      }
    });

    // Search input handler
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearBtn.hidden = !query;
      
      if (query.length >= 2) {
        performSearch(query, resultsContainer);
      } else {
        showShortcuts(resultsContainer);
      }
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.hidden = true;
      input.focus();
      showShortcuts(resultsContainer);
    });

    // Keyboard navigation
    let selectedIndex = -1;
    input.addEventListener('keydown', (e) => {
      const results = resultsContainer.querySelectorAll('.search-result-item, .search-shortcut');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
        updateSelection(results, selectedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection(results, selectedIndex);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        results[selectedIndex].click();
      }
    });
  }

  function openSearch() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchInput');
    
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      input.focus();
    }, 100);
  }

  function closeSearch() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    const resultsContainer = document.getElementById('searchResults');
    
    modal.classList.remove('open');
    document.body.style.overflow = '';
    input.value = '';
    clearBtn.hidden = true;
    showShortcuts(resultsContainer);
  }

  function performSearch(query, container) {
    const lowerQuery = query.toLowerCase();
    
    // Search through index
    const results = SEARCH_INDEX.filter(item => {
      return item.title.toLowerCase().includes(lowerQuery) ||
             item.keywords.toLowerCase().includes(lowerQuery);
    }).slice(0, 8); // Limit to 8 results

    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-no-results">
          <span class="material-icons-round">search_off</span>
          <p>No results found for "${escapeHtml(query)}"</p>
          <p class="meta">Try different keywords or browse our pages</p>
        </div>
      `;
      return;
    }

    // Group by type
    const grouped = {};
    results.forEach(item => {
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type].push(item);
    });

    const typeLabels = {
      page: 'Pages',
      action: 'Actions',
      event: 'Events'
    };

    const typeIcons = {
      page: 'description',
      action: 'bolt',
      event: 'event'
    };

    let html = '<div class="search-results-list">';
    
    Object.keys(grouped).forEach(type => {
      html += `<div class="search-results-group">`;
      html += `<div class="search-results-group-title">${typeLabels[type] || type}</div>`;
      
      grouped[type].forEach(item => {
        html += `
          <a href="${item.url}" class="search-result-item">
            <span class="material-icons-round">${typeIcons[type] || 'link'}</span>
            <div class="search-result-content">
              <div class="search-result-title">${highlightMatch(item.title, query)}</div>
            </div>
          </a>
        `;
      });
      
      html += `</div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function showShortcuts(container) {
    container.innerHTML = `
      <div class="search-shortcuts">
        <div class="search-shortcuts-title">Quick Actions</div>
        <div class="search-shortcut-list">
          <a href="donate.html" class="search-shortcut">
            <span class="material-icons-round">favorite</span>
            <span>Make a Donation</span>
          </a>
          <a href="events.html#event-register" class="search-shortcut">
            <span class="material-icons-round">event</span>
            <span>Register for Event</span>
          </a>
          <a href="memberships.html#signup-form" class="search-shortcut">
            <span class="material-icons-round">card_membership</span>
            <span>Join Membership</span>
          </a>
          <a href="opportunities.html" class="search-shortcut">
            <span class="material-icons-round">work</span>
            <span>Browse Jobs</span>
          </a>
        </div>
      </div>
    `;
  }

  function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function updateSelection(items, index) {
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
