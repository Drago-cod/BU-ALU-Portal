/**
 * BU Alumni Portal - Community Functions
 * Handles posting, commenting, reacting, and calendar integration
 */

(function() {
  'use strict';

  // Sample posts data (will be replaced with API calls)
  let posts = [
    {
      id: 'post-1',
      author: 'Sarah Nakato',
      profession: 'Software Engineer at Google',
      avatar: 'SN',
      time: '2 hours ago',
      content: 'Excited to announce that I\'ll be speaking at the East Africa Tech Summit next month! Looking forward to connecting with fellow BU alumni in the tech space. 🚀',
      likes: 24,
      comments: [
        { author: 'James Okello', avatar: 'JO', text: 'Congratulations Sarah! Will definitely attend.' },
        { author: 'Mary Achieng', avatar: 'MA', text: 'So proud of you! 👏' }
      ],
      liked: false,
      type: 'achievement'
    },
    {
      id: 'post-2',
      author: 'David Musoke',
      profession: 'Marketing Manager',
      avatar: 'DM',
      time: '5 hours ago',
      content: 'Does anyone have recommendations for good co-working spaces in Kampala? Looking for a place with reliable internet and a professional environment.',
      likes: 8,
      comments: [
        { author: 'Grace Nambi', avatar: 'GN', text: 'Check out Outbox Hub in Kamwokya. Great community there!' }
      ],
      liked: false,
      type: 'question'
    },
    {
      id: 'post-3',
      author: 'Patricia Namusoke',
      profession: 'Entrepreneur',
      avatar: 'PN',
      time: '1 day ago',
      content: 'Just launched my new business! Check out our website and let me know what you think. Would love to connect with fellow alumni entrepreneurs.',
      link: { title: 'Visit Website', url: '#' },
      likes: 42,
      comments: [],
      liked: false,
      type: 'update'
    }
  ];

  // Initialize community features
  function initCommunity() {
    const isLoggedIn = window.BUAlumniAPI?.Auth?.isLoggedIn();
    
    // Show/hide composer based on auth state
    const composerSignedIn = document.getElementById('composer-signed-in');
    const composerSignedOut = document.getElementById('composer-signed-out');
    
    if (isLoggedIn) {
      if (composerSignedIn) composerSignedIn.style.display = 'block';
      if (composerSignedOut) composerSignedOut.style.display = 'none';
      
      // Update composer avatar
      updateComposerAvatar();
    } else {
      if (composerSignedIn) composerSignedIn.style.display = 'none';
      if (composerSignedOut) composerSignedOut.style.display = 'block';
    }
    
    // Render feed
    renderFeed();
  }

  // Update composer avatar with user initials
  function updateComposerAvatar() {
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    if (!account) return;
    
    const avatar = document.getElementById('composer-avatar');
    if (avatar) {
      const initials = getUserInitials(account.fullName);
      avatar.textContent = initials;
    }
  }

  // Get user initials
  function getUserInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Toggle post button based on textarea content
  window.togglePostBtn = function() {
    const textarea = document.getElementById('post-textarea');
    const postBtn = document.getElementById('post-btn');
    
    if (textarea && postBtn) {
      postBtn.disabled = textarea.value.trim().length === 0;
    }
  };

  // Insert tag into textarea
  window.insertTag = function(tag) {
    const textarea = document.getElementById('post-textarea');
    if (!textarea) return;
    
    const tags = {
      'Photo': '📷 ',
      'Achievement': '🏆 ',
      'Question': '❓ ',
      'Link': '🔗 '
    };
    
    const tagText = tags[tag] || '';
    textarea.value = tagText + textarea.value;
    textarea.focus();
    togglePostBtn();
  };

  // Submit new post
  window.submitPost = async function() {
    const textarea = document.getElementById('post-textarea');
    const postBtn = document.getElementById('post-btn');
    
    if (!textarea || !postBtn) return;
    
    const content = textarea.value.trim();
    if (!content) return;
    
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    if (!account) {
      alert('Please sign in to post');
      return;
    }
    
    // Disable button and show loading
    postBtn.disabled = true;
    postBtn.innerHTML = '<span class="material-icons-round" style="animation: spin 1s linear infinite;">sync</span> Posting...';
    
    try {
      // Determine post type
      let type = 'update';
      if (content.includes('🏆') || content.toLowerCase().includes('achievement')) type = 'achievement';
      if (content.includes('❓') || content.includes('?')) type = 'question';
      
      // Create new post
      const newPost = {
        id: 'post-' + Date.now(),
        author: account.fullName,
        profession: account.program || 'BU Alumni',
        avatar: getUserInitials(account.fullName),
        time: 'Just now',
        content: content,
        likes: 0,
        comments: [],
        liked: false,
        type: type
      };
      
      // Add to posts array
      posts.unshift(newPost);
      
      // Clear textarea
      textarea.value = '';
      togglePostBtn();
      
      // Re-render feed
      renderFeed();
      
      // Show success
      postBtn.innerHTML = '<span class="material-icons-round">check</span> Posted!';
      postBtn.style.background = '#10b981';
      
      setTimeout(() => {
        postBtn.innerHTML = 'Post';
        postBtn.style.background = '';
      }, 2000);
      
    } catch (error) {
      console.error('Error posting:', error);
      alert('Failed to post. Please try again.');
      postBtn.disabled = false;
      postBtn.innerHTML = 'Post';
    }
  };

  // Render feed
  function renderFeed() {
    const container = document.getElementById('feed-container');
    if (!container) return;
    
    const isLoggedIn = window.BUAlumniAPI?.Auth?.isLoggedIn();
    
    container.innerHTML = posts.map(post => createPostHTML(post, isLoggedIn)).join('');
  }

  // Create post HTML
  function createPostHTML(post, isLoggedIn) {
    const badgeHTML = post.type === 'achievement' 
      ? '<div class="achievement-badge"><span class="material-icons-round" style="font-size:0.85rem;">emoji_events</span> Achievement</div>'
      : '';
    
    const linkHTML = post.link 
      ? `<a class="post-link-card" href="${post.link.url}" target="_blank" rel="noopener">
           <span class="material-icons-round">link</span>
           ${post.link.title}
         </a>`
      : '';
    
    const commentsHTML = post.comments.length > 0
      ? `<div class="comments-section">
           ${post.comments.map(comment => `
             <div class="comment-item">
               <div class="avatar-circle sm">${comment.avatar}</div>
               <div class="comment-bubble">
                 <div class="comment-author">${comment.author}</div>
                 <div class="comment-text">${comment.text}</div>
               </div>
             </div>
           `).join('')}
         </div>`
      : '';
    
    const commentInputHTML = isLoggedIn
      ? `<div class="comment-input-wrap" style="margin-top: 0.75rem; display: none;" id="comment-input-${post.id}">
           <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
             <div class="avatar-circle sm">${getUserInitials(window.BUAlumniAPI?.Auth?.getAccount()?.fullName || 'U')}</div>
             <input type="text" class="comment-input" placeholder="Write a comment..." 
                    style="flex: 1; border: 1px solid var(--border); border-radius: 20px; padding: 0.5rem 1rem; font-size: 0.875rem;"
                    onkeypress="if(event.key==='Enter') addComment('${post.id}', this.value, this)" />
           </div>
         </div>`
      : '';
    
    return `
      <div class="feed-post" id="${post.id}">
        <div class="post-header">
          <div class="avatar-circle">${post.avatar}</div>
          <div class="post-meta">
            <div class="post-author">${post.author}</div>
            <div class="post-profession">${post.profession}</div>
            <div class="post-time">${post.time}</div>
          </div>
        </div>
        ${badgeHTML}
        <div class="post-content">${post.content}</div>
        ${linkHTML}
        <div class="reaction-bar">
          <button class="reaction-btn ${post.liked ? 'liked' : ''}" onclick="toggleLike('${post.id}')" ${!isLoggedIn ? 'disabled title="Sign in to react"' : ''}>
            <span class="material-icons-round">${post.liked ? 'favorite' : 'favorite_border'}</span>
            <span>${post.likes}</span>
          </button>
          <button class="reaction-btn" onclick="toggleCommentInput('${post.id}')" ${!isLoggedIn ? 'disabled title="Sign in to comment"' : ''}>
            <span class="material-icons-round">chat_bubble_outline</span>
            <span>${post.comments.length}</span>
          </button>
          <button class="reaction-btn" onclick="sharePost('${post.id}')" ${!isLoggedIn ? 'disabled title="Sign in to share"' : ''}>
            <span class="material-icons-round">share</span>
          </button>
        </div>
        ${commentsHTML}
        ${commentInputHTML}
      </div>
    `;
  }

  // Toggle like
  window.toggleLike = function(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    
    renderFeed();
  };

  // Toggle comment input
  window.toggleCommentInput = function(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    if (commentInput) {
      commentInput.style.display = commentInput.style.display === 'none' ? 'block' : 'none';
      if (commentInput.style.display === 'block') {
        commentInput.querySelector('input').focus();
      }
    }
  };

  // Add comment
  window.addComment = function(postId, text, input) {
    if (!text || !text.trim()) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    if (!account) return;
    
    const newComment = {
      author: account.fullName,
      avatar: getUserInitials(account.fullName),
      text: text.trim()
    };
    
    post.comments.push(newComment);
    input.value = '';
    
    renderFeed();
  };

  // Share post
  window.sharePost = function(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author}`,
        text: post.content,
        url: window.location.href
      }).catch(err => console.log('Share cancelled'));
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Add event to calendar
  window.addToCalendar = function(eventName, eventDate, eventLocation, eventTime) {
    // Create ICS file content
    const startDate = new Date(eventDate + ' ' + eventTime);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BU Alumni Portal//Event//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@bualumni.org`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${eventName}`,
      `LOCATION:${eventLocation}`,
      `DESCRIPTION:BU Alumni Event: ${eventName}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    // Create download link
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventName.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    if (window.BUAlumniUI && window.BUAlumniUI.Toast) {
      window.BUAlumniUI.Toast.success('Event added to calendar!');
    } else {
      alert('Event added to calendar! Check your downloads.');
    }
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommunity);
  } else {
    initCommunity();
  }

  // Re-initialize on auth state change
  window.addEventListener('storage', (e) => {
    if (e.key === 'bu_alumni_token' || e.key === 'bu_alumni_account') {
      initCommunity();
    }
  });

  // Expose API
  window.CommunityFunctions = {
    init: initCommunity,
    renderFeed: renderFeed,
    addPost: (post) => {
      posts.unshift(post);
      renderFeed();
    }
  };

})();
