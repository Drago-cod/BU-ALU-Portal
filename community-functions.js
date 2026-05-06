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

  // Handle photo upload for posts
  window.handlePhotoUpload = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = function(e) {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      // Limit to 4 photos
      const limitedFiles = files.slice(0, 4);
      
      // Store files temporarily
      window.pendingPostPhotos = window.pendingPostPhotos || [];
      
      limitedFiles.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB.`);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
          window.pendingPostPhotos.push({
            name: file.name,
            data: event.target.result,
            type: file.type
          });
          
          // Show preview
          showPhotoPreview();
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  // Show photo preview in composer
  function showPhotoPreview() {
    const photos = window.pendingPostPhotos || [];
    if (photos.length === 0) return;
    
    let previewContainer = document.getElementById('photo-preview-container');
    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.id = 'photo-preview-container';
      previewContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;';
      
      const composerWrap = document.querySelector('.composer-wrap > div');
      if (composerWrap) {
        composerWrap.appendChild(previewContainer);
      }
    }
    
    previewContainer.innerHTML = photos.map((photo, index) => `
      <div style="position: relative; border-radius: 8px; overflow: hidden; aspect-ratio: 1;">
        <img src="${photo.data}" style="width: 100%; height: 100%; object-fit: cover;" alt="Preview ${index + 1}">
        <button onclick="removePhotoPreview(${index})" style="position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,0.7); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">&times;</button>
      </div>
    `).join('');
    
    togglePostBtn();
  }

  // Remove photo from preview
  window.removePhotoPreview = function(index) {
    window.pendingPostPhotos = window.pendingPostPhotos || [];
    window.pendingPostPhotos.splice(index, 1);
    
    if (window.pendingPostPhotos.length === 0) {
      const previewContainer = document.getElementById('photo-preview-container');
      if (previewContainer) previewContainer.remove();
    } else {
      showPhotoPreview();
    }
    
    togglePostBtn();
  };

  // Submit new post
  window.submitPost = async function() {
    const textarea = document.getElementById('post-textarea');
    const postBtn = document.getElementById('post-btn');
    
    if (!textarea || !postBtn) return;
    
    const content = textarea.value.trim();
    const photos = window.pendingPostPhotos || [];
    
    if (!content && photos.length === 0) return;
    
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
      
      // Get user initials
      const initials = getUserInitials(account.fullName);
      
      // Create post via API
      const result = await window.BUAlumniAPI.createPost({
        author: account.fullName,
        authorEmail: account.email,
        profession: account.program || 'BU Alumni',
        avatar: initials,
        content: content,
        type: type,
        photos: photos
      });
      
      if (result.success) {
        // Add to local posts array
        const newPost = result.data.post;
        posts.unshift(newPost);
        
        // Clear textarea and photos
        textarea.value = '';
        window.pendingPostPhotos = [];
        const previewContainer = document.getElementById('photo-preview-container');
        if (previewContainer) previewContainer.remove();
        
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
      } else {
        throw new Error(result.error || 'Failed to create post');
      }
      
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
    
    // Photo gallery
    const photosHTML = post.photos && post.photos.length > 0
      ? `<div class="post-photos" style="display: grid; grid-template-columns: ${post.photos.length === 1 ? '1fr' : 'repeat(2, 1fr)'}; gap: 0.5rem; margin-bottom: 0.8rem; border-radius: 12px; overflow: hidden;">
           ${post.photos.map(photo => `
             <img src="${photo.data}" alt="Post photo" style="width: 100%; height: ${post.photos.length === 1 ? '400px' : '200px'}; object-fit: cover; cursor: pointer;" onclick="openPhotoModal('${photo.data}')" />
           `).join('')}
         </div>`
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
    
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    const currentUserEmail = account?.email || '';
    
    const commentInputHTML = isLoggedIn
      ? `<div class="comment-input-wrap" style="margin-top: 0.75rem; display: none;" id="comment-input-${post.id}">
           <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
             <div class="avatar-circle sm">${getUserInitials(account?.fullName || 'U')}</div>
             <input type="text" class="comment-input" placeholder="Write a comment..." 
                    style="flex: 1; border: 1px solid var(--border); border-radius: 20px; padding: 0.5rem 1rem; font-size: 0.875rem;"
                    onkeypress="if(event.key==='Enter') addComment('${post.id}', this.value, this)" />
           </div>
         </div>`
      : '';
    
    // Connection button (if not own post)
    const isOwnPost = post.authorEmail === currentUserEmail;
    const connectionHTML = !isOwnPost && isLoggedIn
      ? `<button class="reaction-btn" onclick="sendConnectionRequest('${post.authorEmail}', '${post.author}')" title="Connect with ${post.author}">
           <span class="material-icons-round">person_add</span>
           <span>Connect</span>
         </button>`
      : '';
    
    // Message button (if not own post)
    const messageHTML = !isOwnPost && isLoggedIn
      ? `<button class="reaction-btn" onclick="openChatWith('${post.authorEmail}', '${post.author}')" title="Message ${post.author}">
           <span class="material-icons-round">chat</span>
           <span>Message</span>
         </button>`
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
        ${photosHTML}
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
          ${connectionHTML}
          ${messageHTML}
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
  window.toggleLike = async function(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    if (!account) {
      alert('Please sign in to like posts');
      return;
    }
    
    try {
      // Call API to toggle like
      const result = await window.BUAlumniAPI.toggleLike(postId, account.email);
      
      if (result.success) {
        post.liked = result.data.liked;
        post.likes = result.data.likeCount;
        renderFeed();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
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
  window.addComment = async function(postId, text, input) {
    if (!text || !text.trim()) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    if (!account) return;
    
    try {
      // Call API to add comment
      const result = await window.BUAlumniAPI.addComment(
        postId,
        account.fullName,
        text.trim()
      );
      
      if (result.success) {
        const newComment = {
          author: account.fullName,
          avatar: getUserInitials(account.fullName),
          text: text.trim()
        };
        
        post.comments.push(newComment);
        input.value = '';
        
        renderFeed();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
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

  // Open photo modal
  window.openPhotoModal = function(photoUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 2rem;';
    modal.onclick = function() { modal.remove(); };
    
    const img = document.createElement('img');
    img.src = photoUrl;
    img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;';
    img.onclick = function(e) { e.stopPropagation(); };
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position: absolute; top: 1rem; right: 1rem; width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.2); color: white; border: none; font-size: 32px; cursor: pointer; backdrop-filter: blur(10px);';
    closeBtn.onclick = function() { modal.remove(); };
    
    modal.appendChild(img);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
  };

  // Send connection request
  window.sendConnectionRequest = function(email, name) {
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    if (!account) {
      alert('Please sign in to connect with alumni');
      return;
    }
    
    // Store connection request
    const connections = JSON.parse(localStorage.getItem('buConnections') || '{}');
    if (!connections[account.email]) connections[account.email] = [];
    
    if (connections[account.email].includes(email)) {
      alert(`You are already connected with ${name}`);
      return;
    }
    
    connections[account.email].push(email);
    localStorage.setItem('buConnections', JSON.stringify(connections));
    
    alert(`Connection request sent to ${name}! 🤝`);
    
    // Update UI
    event.target.innerHTML = '<span class="material-icons-round">check</span><span>Connected</span>';
    event.target.disabled = true;
    event.target.style.opacity = '0.6';
  };

  // Open chat with user
  window.openChatWith = function(email, name) {
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    if (!account) {
      alert('Please sign in to message alumni');
      return;
    }
    
    // Open messages panel
    const msgPanel = document.getElementById('msg-panel');
    if (msgPanel) {
      msgPanel.classList.add('open');
      
      // Set active chat
      const msgPanelTitle = msgPanel.querySelector('.msg-panel-title');
      if (msgPanelTitle) {
        msgPanelTitle.textContent = `Chat with ${name}`;
      }
      
      // Load or create chat
      const chatKey = [account.email, email].sort().join(':');
      const chats = JSON.parse(localStorage.getItem('buChats') || '{}');
      
      if (!chats[chatKey]) {
        chats[chatKey] = {
          participants: [account.email, email],
          participantNames: [account.fullName, name],
          messages: []
        };
        localStorage.setItem('buChats', JSON.stringify(chats));
      }
      
      // Display chat messages
      displayChatMessages(chatKey);
    }
  };

  // Display chat messages
  function displayChatMessages(chatKey) {
    const chats = JSON.parse(localStorage.getItem('buChats') || '{}');
    const chat = chats[chatKey];
    
    if (!chat) return;
    
    const msgList = document.getElementById('msg-list');
    if (!msgList) return;
    
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    
    msgList.innerHTML = chat.messages.map(msg => {
      const isOwn = msg.sender === account.email;
      return `
        <div style="display: flex; flex-direction: column; align-items: ${isOwn ? 'flex-end' : 'flex-start'}; margin-bottom: 0.8rem;">
          <div style="background: ${isOwn ? 'var(--primary)' : 'var(--surface-alt)'}; color: ${isOwn ? '#fff' : 'var(--text)'}; padding: 0.6rem 1rem; border-radius: 18px; max-width: 70%; word-wrap: break-word;">
            ${msg.text}
          </div>
          <div style="font-size: 0.7rem; color: var(--muted); margin-top: 0.2rem;">
            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `;
    }).join('');
    
    // Scroll to bottom
    msgList.scrollTop = msgList.scrollHeight;
    
    // Store active chat
    window.activeChatKey = chatKey;
  }

  // Send message (update existing function)
  window.sendMessage = function() {
    const input = document.getElementById('msg-input');
    if (!input || !input.value.trim()) return;
    
    const account = window.BUAlumniAPI?.Auth?.getAccount();
    if (!account) return;
    
    const chatKey = window.activeChatKey;
    if (!chatKey) {
      alert('Please select a chat first');
      return;
    }
    
    const chats = JSON.parse(localStorage.getItem('buChats') || '{}');
    const chat = chats[chatKey];
    
    if (!chat) return;
    
    // Add message
    chat.messages.push({
      sender: account.email,
      text: input.value.trim(),
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('buChats', JSON.stringify(chats));
    
    // Clear input
    input.value = '';
    
    // Refresh display
    displayChatMessages(chatKey);
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
