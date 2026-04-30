/**
 * BU Alumni Portal - Community Profile Component
 * Shows user profile when signed in, sign-in prompt when not
 */

(function() {
  'use strict';

  function getUserInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function createUserProfileCard() {
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    if (!account) return null;

    const initials = getUserInitials(account.fullName);
    
    return `
      <div class="comm-card user-profile-card fade-up">
        <div class="user-profile-header">
          <div class="avatar-circle lg">
            ${initials}
          </div>
          <div class="user-profile-info">
            <h3 class="user-profile-name">${account.fullName || 'Alumni Member'}</h3>
            <p class="user-profile-email">${account.email || ''}</p>
            ${account.program ? `<p class="user-profile-program">${account.program}</p>` : ''}
            ${account.graduationYear ? `<p class="user-profile-year">Class of ${account.graduationYear}</p>` : ''}
          </div>
        </div>
        
        <div class="user-profile-stats">
          <div class="user-stat">
            <span class="user-stat-value">0</span>
            <span class="user-stat-label" data-i18n="profile.posts">Posts</span>
          </div>
          <div class="user-stat">
            <span class="user-stat-value">0</span>
            <span class="user-stat-label" data-i18n="profile.connections">Connections</span>
          </div>
          <div class="user-stat">
            <span class="user-stat-value">0</span>
            <span class="user-stat-label" data-i18n="profile.events">Events</span>
          </div>
        </div>
        
        <div class="user-profile-actions">
          <a href="#" class="btn btn-secondary btn-sm" onclick="return false;">
            <span class="material-icons-round" style="font-size: 1rem;">person</span>
            <span data-i18n="community.view_profile">View Profile</span>
          </a>
          <button class="btn btn-ghost btn-sm" onclick="window.BUAlumniAPI.Auth.logout()">
            <span class="material-icons-round" style="font-size: 1rem;">logout</span>
            <span data-i18n="nav.signout">Sign Out</span>
          </button>
        </div>
      </div>
      
      <style>
        .user-profile-card {
          background: linear-gradient(135deg, var(--primary), #3a5fe8);
          color: #fff;
          border: none;
        }
        
        .user-profile-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .user-profile-info {
          flex: 1;
        }
        
        .user-profile-name {
          font-size: 1.125rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }
        
        .user-profile-email {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 0.25rem 0;
        }
        
        .user-profile-program {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 0.125rem 0;
          font-weight: 600;
        }
        
        .user-profile-year {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
        }
        
        .user-profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .user-stat {
          text-align: center;
        }
        
        .user-stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.25rem;
        }
        
        .user-stat-label {
          display: block;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
        }
        
        .user-profile-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .user-profile-actions .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          padding: 0.625rem 1rem;
        }
        
        .user-profile-actions .btn-secondary {
          background: #fff;
          color: var(--primary);
          border: none;
        }
        
        .user-profile-actions .btn-ghost {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .user-profile-actions .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      </style>
    `;
  }

  function createSignInPrompt() {
    return `
      <div class="comm-card" style="background:linear-gradient(135deg,#1140d9,#3a5fe8);color:#fff;border:none;text-align:center;padding:2rem 1.5rem;">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
          <span class="material-icons-round" style="font-size:1.6rem;color:#fff;">groups</span>
        </div>
        <div style="font-weight:800;font-size:1rem;color:#fff;margin-bottom:0.3rem;" data-i18n="community.join">Join the Community</div>
        <div style="font-size:0.8rem;color:rgba(255,255,255,0.95) !important;margin-bottom:1rem;line-height:1.5;text-shadow:0 1px 3px rgba(0,0,0,0.2);" data-i18n="community.signin_prompt">Sign in to post, connect, and access all features.</div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          <a href="login.html" class="btn" style="text-align:center;font-size:0.85rem;background:#fff;color:#0c30a6;font-weight:700;" data-i18n="nav.signin">Sign In</a>
          <a href="auth.html" class="btn" style="text-align:center;font-size:0.85rem;background:rgba(255,255,255,0.15);color:#fff;font-weight:700;border:1px solid rgba(255,255,255,0.3);" data-i18n="nav.signup">Sign Up</a>
        </div>
      </div>
    `;
  }

  function updateCommunityProfile() {
    const container = document.getElementById('community-profile-container');
    if (!container) return;

    const isLoggedIn = window.BUAlumniAPI?.Auth?.isLoggedIn();
    
    if (isLoggedIn) {
      const profileHTML = createUserProfileCard();
      if (profileHTML) {
        container.innerHTML = profileHTML;
      }
    } else {
      container.innerHTML = createSignInPrompt();
    }
    
    // Re-translate if i18n is available
    if (window.BUi18n) {
      window.BUi18n.translatePage();
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCommunityProfile);
  } else {
    updateCommunityProfile();
  }

  // Update on auth state change
  window.addEventListener('storage', (e) => {
    if (e.key === 'bu_alumni_token' || e.key === 'bu_alumni_account') {
      updateCommunityProfile();
    }
  });

  // Expose API
  window.CommunityProfile = {
    update: updateCommunityProfile
  };

})();
