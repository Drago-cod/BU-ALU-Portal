/**
 * Tasks Management System
 * Handles task registration, completion, certificate/ticket/receipt generation, and feedback
 */

const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:5000'
  : window.location.origin;

let currentTask = null;
let currentRegistration = null;
let currentCompletion = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  loadTasks();
  setupEventListeners();
  loadUserTasks();
});

// Setup Event Listeners
function setupEventListeners() {
  // Registration form
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitRegistration();
  });

  // Completion form
  document.getElementById('completeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitCompletion();
  });

  // Feedback form
  document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitFeedback();
  });

  // Star rating
  document.querySelectorAll('#ratingGroup .star').forEach(star => {
    star.addEventListener('click', function() {
      const rating = this.getAttribute('data-rating');
      document.getElementById('feedbackRating').value = rating;
      
      document.querySelectorAll('#ratingGroup .star').forEach((s, idx) => {
        if (idx < rating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });

    star.addEventListener('mouseover', function() {
      const rating = this.getAttribute('data-rating');
      document.querySelectorAll('#ratingGroup .star').forEach((s, idx) => {
        s.style.color = idx < rating ? '#f59e0b' : '#d1d5db';
      });
    });
  });

  document.getElementById('ratingGroup').addEventListener('mouseleave', function() {
    const rating = document.getElementById('feedbackRating').value || 0;
    document.querySelectorAll('#ratingGroup .star').forEach((s, idx) => {
      s.style.color = idx < rating ? '#f59e0b' : '#d1d5db';
    });
  });

  // Modal close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}

// Load and Display Tasks
async function loadTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks`);
    const data = await response.json();

    if (data.success && Array.isArray(data.tasks)) {
      displayTasks(data.tasks);
    } else {
      showEmptyState('No tasks available at this time.');
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
    showEmptyState('Unable to load tasks. Please try again later.');
  }
}

function displayTasks(tasks) {
  const container = document.getElementById('tasksContainer');
  
  if (!tasks.length) {
    showEmptyState('No tasks available at this time.');
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-card">
      <div class="task-header">
        <span class="task-category">${task.category}</span>
      </div>
      <h3 class="task-title">${escapeHtml(task.title)}</h3>
      <p class="task-description">${escapeHtml(task.description.substring(0, 100))}...</p>
      <div class="task-meta">
        <span>⏱️ ${task.duration_hours || 'Flexible'} hours</span>
        <span class="task-points">+${task.points} points</span>
      </div>
      <div class="task-actions">
        <button class="btn-task btn-register" onclick="openRegisterModal(${task.id})">
          Register
        </button>
      </div>
    </div>
  `).join('');
}

function showEmptyState(message) {
  const container = document.getElementById('tasksContainer');
  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <p>${message}</p>
    </div>
  `;
}

// Modal Functions
function openRegisterModal(taskId) {
  fetch(`${API_BASE_URL}/api/tasks/${taskId}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        currentTask = data.task;
        document.getElementById('registerModal').classList.add('active');
        
        // Pre-fill with logged-in user info if available
        const user = globalState.getUser();
        if (user) {
          document.getElementById('regFullName').value = user.fullName || '';
          document.getElementById('regEmail').value = user.email || '';
        }
      }
    })
    .catch(err => console.error('Error loading task:', err));
}

function openCompleteModal(registration) {
  currentRegistration = registration;
  
  // Fetch task info
  fetch(`${API_BASE_URL}/api/tasks/${registration.task_id}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        currentTask = data.task;
        const summary = document.getElementById('completionSummary');
        summary.innerHTML = `
          <h3>Task: ${escapeHtml(data.task.title)}</h3>
          <div class="completion-item">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            <span>Certificate of Completion</span>
          </div>
          <div class="completion-item">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            <span>Participation Ticket</span>
          </div>
          <div class="completion-item">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            <span>Transaction Receipt</span>
          </div>
        `;
        document.getElementById('completeModal').classList.add('active');
      }
    })
    .catch(err => console.error('Error loading task:', err));
}

function openFeedbackModal(completion) {
  currentCompletion = completion;
  document.getElementById('feedbackModal').classList.add('active');
  document.getElementById('feedbackRating').value = 0;
  document.getElementById('feedbackComments').value = '';
  document.getElementById('wouldRecommend').checked = false;
  
  // Reset stars
  document.querySelectorAll('#ratingGroup .star').forEach(s => s.classList.remove('active'));
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  
  if (modalId === 'registerModal') {
    document.getElementById('registerForm').reset();
  } else if (modalId === 'completeModal') {
    document.getElementById('completeForm').reset();
  } else if (modalId === 'feedbackModal') {
    document.getElementById('feedbackForm').reset();
  }
}

// Registration
async function submitRegistration() {
  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const phone = document.getElementById('regPhone').value.trim();

  if (!fullName || !email || !currentTask) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Registering...';

    const response = await fetch(`${API_BASE_URL}/api/tasks/${currentTask.id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: email,
        fullName: fullName,
        phone: phone,
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert(`Successfully registered for ${currentTask.title}!\n\nRegistration ID: ${data.registrationId}`);
      closeModal('registerModal');
      loadUserTasks();
    } else {
      alert(`Registration failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Failed to register. Please try again.');
  } finally {
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = false;
    button.textContent = 'Register';
  }
}

// Task Completion
async function submitCompletion() {
  if (!currentRegistration || !currentTask) {
    alert('Missing task information.');
    return;
  }

  const completionHours = parseFloat(document.getElementById('completionHours').value) || 0;
  const receiptAmount = parseFloat(document.getElementById('receiptAmount').value) || 0;
  const user = globalState.getUser();

  if (!user) {
    alert('Please sign in to complete a task.');
    return;
  }

  try {
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Completing...';

    const response = await fetch(`${API_BASE_URL}/api/task-completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: currentTask.id,
        registrationId: currentRegistration.id,
        userEmail: user.email,
        fullName: user.fullName,
        completionHours: completionHours,
        receiptAmount: receiptAmount,
      }),
    });

    const data = await response.json();

    if (data.success) {
      currentCompletion = {
        id: data.completionId,
        certificateId: data.certificateId,
        ticketId: data.ticketId,
        receiptId: data.receiptId,
      };

      let message = `Task completed successfully!\n\n${data.message}`;
      
      if (data.certificateId) {
        message += `\n\nCertificate ID: ${data.certificateId}`;
      }
      if (data.ticketId) {
        message += `\nTicket ID: ${data.ticketId}`;
      }
      if (data.receiptId) {
        message += `\nReceipt ID: ${data.receiptId}`;
      }

      alert(message);
      closeModal('completeModal');
      
      // Prompt for feedback
      setTimeout(() => {
        if (confirm('Would you like to share your feedback about this task?')) {
          openFeedbackModal(currentCompletion);
        }
      }, 500);

      loadUserTasks();
    } else {
      alert(`Completion failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Completion error:', error);
    alert('Failed to complete task. Please try again.');
  } finally {
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = false;
    button.textContent = 'Complete Task';
  }
}

// Feedback Submission
async function submitFeedback() {
  if (!currentCompletion) {
    alert('Missing completion information.');
    return;
  }

  const rating = parseInt(document.getElementById('feedbackRating').value) || 0;
  const comments = document.getElementById('feedbackComments').value.trim();
  const wouldRecommend = document.getElementById('wouldRecommend').checked;
  const user = globalState.getUser();

  if (rating < 1 || rating > 5) {
    alert('Please select a rating.');
    return;
  }

  try {
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Submitting...';

    const response = await fetch(`${API_BASE_URL}/api/task-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completionId: currentCompletion.id,
        taskId: currentTask.id,
        userEmail: user.email,
        fullName: user.fullName,
        rating: rating,
        comments: comments,
        wouldRecommend: wouldRecommend,
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert('Thank you for your feedback!');
      closeModal('feedbackModal');
      loadUserTasks();
    } else {
      alert(`Feedback submission failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Feedback error:', error);
    alert('Failed to submit feedback. Please try again.');
  } finally {
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = false;
    button.textContent = 'Submit Feedback';
  }
}

// Load User Tasks
async function loadUserTasks() {
  const user = globalState.getUser();
  
  if (!user) {
    document.getElementById('userTasksSection').style.display = 'none';
    document.getElementById('notLoggedInMessage').style.display = 'block';
    return;
  }

  try {
    const [registrationsRes, completionsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/user-tasks/${encodeURIComponent(user.email)}`),
      fetch(`${API_BASE_URL}/api/user-completions/${encodeURIComponent(user.email)}`),
    ]);

    const registrationsData = await registrationsRes.json();
    const completionsData = await completionsRes.json();

    const registrations = registrationsData.success ? registrationsData.tasks : [];
    const completions = completionsData.success ? completionsData.completions : [];

    if (registrations.length || completions.length) {
      document.getElementById('userTasksSection').style.display = 'block';
      document.getElementById('notLoggedInMessage').style.display = 'none';

      displayUserRegistrations(registrations);
      displayUserCompletions(completions);
    } else {
      document.getElementById('userTasksSection').style.display = 'none';
      document.getElementById('notLoggedInMessage').innerHTML = `
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 16px;">You haven't registered for any tasks yet.</p>
        <a href="#tasks" class="btn btn-primary">Browse Tasks</a>
      `;
      document.getElementById('notLoggedInMessage').style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading user tasks:', error);
  }
}

function displayUserRegistrations(registrations) {
  const container = document.getElementById('userTasksList');
  
  if (!registrations.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = registrations.map(reg => `
    <div class="task-card">
      <div class="task-header">
        <span class="task-category">Registered</span>
      </div>
      <h3 class="task-title">Pending Completion</h3>
      <p class="task-description">Registration ID: ${reg.id.substring(0, 12)}...</p>
      <div class="task-meta">
        <span>Status: Awaiting Completion</span>
      </div>
      <div class="task-actions">
        <button class="btn-task btn-complete" onclick="loadRegistrationAndComplete('${reg.id}', '${reg.task_id}')">
          Complete Task
        </button>
      </div>
    </div>
  `).join('');
}

function displayUserCompletions(completions) {
  const container = document.getElementById('userCompletionsList');
  
  if (!completions.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = completions.map(comp => `
    <div class="task-card">
      <div class="task-header">
        <span class="task-category">Completed</span>
      </div>
      <h3 class="task-title">Task Completed</h3>
      <p class="task-description">Completion ID: ${comp.id.substring(0, 12)}...</p>
      <div class="task-actions">
        ${comp.certificate_id ? `
          <a class="btn-task btn-register" href="${API_BASE_URL}/api/task-certificate/${comp.certificate_id}" download>
            Certificate
          </a>
        ` : ''}
        ${comp.ticket_id ? `
          <a class="btn-task btn-register" href="${API_BASE_URL}/api/task-ticket/${comp.ticket_id}" download>
            Ticket
          </a>
        ` : ''}
        ${comp.receipt_id ? `
          <a class="btn-task btn-register" href="${API_BASE_URL}/api/task-receipt/${comp.receipt_id}" download>
            Receipt
          </a>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function loadRegistrationAndComplete(registrationId, taskId) {
  // Fetch the registration and then open completion modal
  fetch(`${API_BASE_URL}/api/tasks/${taskId}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        currentTask = data.task;
        currentRegistration = { id: registrationId, task_id: taskId };
        openCompleteModal(currentRegistration);
      }
    })
    .catch(err => console.error('Error loading task:', err));
}

// Utility Functions
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
