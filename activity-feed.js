/**
 * Live Activity Feed
 * Shows recent donations, registrations, and event sign-ups
 */

(function() {
  'use strict';

  // Configuration
  const MAX_ACTIVITIES = 10;
  const UPDATE_INTERVAL = 30000; // 30 seconds
  const ANIMATION_DELAY = 150; // ms between items

  // Activity types with icons and colors
  const ACTIVITY_TYPES = {
    donation: {
      icon: 'favorite',
      color: '#e74c3c',
      label: 'Donation'
    },
    registration: {
      icon: 'person_add',
      color: '#3498db',
      label: 'New Member'
    },
    event: {
      icon: 'event',
      color: '#2ecc71',
      label: 'Event Registration'
    },
    membership: {
      icon: 'card_membership',
      color: '#9b59b6',
      label: 'Membership'
    }
  };

  function init() {
    const feedContainer = document.getElementById('activity-feed');
    if (!feedContainer) return;

    renderFeed(feedContainer);
    
    // Update feed periodically
    setInterval(() => {
      renderFeed(feedContainer);
    }, UPDATE_INTERVAL);
  }

  function getActivities() {
    const activities = [];

    // Get donations
    try {
      const donations = JSON.parse(localStorage.getItem('buDonations') || '[]');
      donations.forEach(donation => {
        activities.push({
          type: 'donation',
          timestamp: new Date(donation.donatedAt || donation.timestamp || Date.now()),
          name: donation.anonymous ? 'Anonymous Donor' : donation.fullName,
          details: `Donated ${formatCurrency(donation.donationAmount || donation.amount, donation.currency)}`,
          amount: donation.donationAmount || donation.amount,
          currency: donation.currency || 'UGX'
        });
      });
    } catch (e) {
      console.error('Error loading donations:', e);
    }

    // Get event registrations
    try {
      const events = JSON.parse(localStorage.getItem('buEventRegistrations') || '[]');
      events.forEach(event => {
        activities.push({
          type: 'event',
          timestamp: new Date(event.registeredAt || event.timestamp || Date.now()),
          name: event.fullName || event.name,
          details: `Registered for ${event.eventTitle || 'an event'}`
        });
      });
    } catch (e) {
      console.error('Error loading events:', e);
    }

    // Get account registrations
    try {
      const accounts = JSON.parse(localStorage.getItem('bu_accounts') || '[]');
      accounts.forEach(account => {
        activities.push({
          type: 'registration',
          timestamp: new Date(account.createdAt || account.timestamp || Date.now()),
          name: account.fullName || account.name,
          details: `Joined the alumni network`
        });
      });
    } catch (e) {
      console.error('Error loading accounts:', e);
    }

    // Get memberships
    try {
      const memberships = JSON.parse(localStorage.getItem('bu_memberships') || '[]');
      memberships.forEach(membership => {
        activities.push({
          type: 'membership',
          timestamp: new Date(membership.joinedAt || membership.timestamp || Date.now()),
          name: membership.fullName || membership.name,
          details: `Became a ${membership.membershipType || 'member'}`
        });
      });
    } catch (e) {
      console.error('Error loading memberships:', e);
    }

    // Sort by timestamp (newest first) and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_ACTIVITIES);
  }

  function formatCurrency(amount, currency = 'UGX') {
    if (!amount) return '';
    
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

    return `${currency} ${formatted}`;
  }

  function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  function renderFeed(container) {
    const activities = getActivities();

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="activity-feed-empty">
          <span class="material-icons-round" style="font-size: 48px; opacity: 0.3;">notifications_none</span>
          <p>No recent activity yet</p>
          <p class="meta">Be the first to make an impact!</p>
        </div>
      `;
      return;
    }

    const html = activities.map((activity, index) => {
      const config = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.registration;
      const initials = activity.name ? activity.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
      
      return `
        <div class="activity-item" style="animation-delay: ${index * ANIMATION_DELAY}ms">
          <div class="activity-avatar" style="background: linear-gradient(135deg, ${config.color}22, ${config.color}44);">
            <span class="activity-icon material-icons-round" style="color: ${config.color};">${config.icon}</span>
          </div>
          <div class="activity-content">
            <div class="activity-header">
              <strong class="activity-name">${escapeHtml(activity.name)}</strong>
              <span class="activity-badge" style="background: ${config.color}22; color: ${config.color};">
                ${config.label}
              </span>
            </div>
            <p class="activity-details">${escapeHtml(activity.details)}</p>
            <span class="activity-time">${getTimeAgo(activity.timestamp)}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
