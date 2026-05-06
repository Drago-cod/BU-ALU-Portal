# BU Alumni Portal — Task Completion System

## Overview

The Task Completion System allows alumni to register for and complete skill-building tasks, with automatic generation of certificates, tickets, receipts, and feedback collection.

## Features

### 1. Task Management
- Create and manage skill-building tasks across multiple categories
- Tasks can include workshops, seminars, conferences, training, and more
- Earn points for completing tasks
- Track completion status

### 2. Registration & Enrollment
- Alumni register for tasks of interest
- Track registered tasks by user
- Registration data stored in database

### 3. Task Completion
- Mark tasks as complete with hours tracked
- Automatic document generation:
  - **Certificate** of task completion (landscape PDF)
  - **Ticket** for workshop/event attendance (if applicable)
  - **Receipt** for participated tasks (if amount is specified)

### 4. Feedback System
- Post-completion feedback collection
- 5-star rating system
- Comment field for detailed feedback
- Recommendation tracking
- All feedback stored for portal improvement

### 5. Document Management
- PDFs automatically generated and saved to server
- Download links provided via API
- Email distribution available (future enhancement)

## Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_hours INTEGER,
  points INTEGER,
  certificate BOOLEAN,
  requires_feedback BOOLEAN,
  status TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

### Task Registrations Table
```sql
CREATE TABLE task_registrations (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  registered_at TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

### Task Completions Table
```sql
CREATE TABLE task_completions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  registration_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  completion_date TEXT,
  completion_hours REAL,
  points_earned INTEGER,
  certificate_id TEXT,
  ticket_id TEXT,
  receipt_id TEXT,
  status TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

### Task Certificates Table
```sql
CREATE TABLE task_certificates (
  id TEXT PRIMARY KEY,
  completion_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  issue_date TEXT,
  certificate_number TEXT,
  file_path TEXT,
  FOREIGN KEY (completion_id) REFERENCES task_completions(id)
);
```

### Task Tickets Table
```sql
CREATE TABLE task_tickets (
  id TEXT PRIMARY KEY,
  completion_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  ticket_number TEXT,
  issue_date TEXT,
  file_path TEXT,
  FOREIGN KEY (completion_id) REFERENCES task_completions(id)
);
```

### Task Receipts Table
```sql
CREATE TABLE task_receipts (
  id TEXT PRIMARY KEY,
  completion_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  receipt_number TEXT,
  issue_date TEXT,
  amount REAL,
  currency TEXT,
  file_path TEXT,
  FOREIGN KEY (completion_id) REFERENCES task_completions(id)
);
```

### Task Feedbacks Table
```sql
CREATE TABLE task_feedbacks (
  id TEXT PRIMARY KEY,
  completion_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  rating INTEGER,
  comments TEXT,
  would_recommend BOOLEAN,
  submitted_at TEXT,
  FOREIGN KEY (completion_id) REFERENCES task_completions(id)
);
```

## API Endpoints

### Task Management

#### GET /api/tasks
List all active tasks

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "TSK-1234",
      "title": "Advanced Leadership Workshop",
      "description": "Develop leadership skills...",
      "category": "workshop",
      "duration_hours": 8,
      "points": 50,
      "certificate": true,
      "requires_feedback": true,
      "status": "active",
      "created_at": "2024-05-06T10:00:00Z"
    }
  ]
}
```

#### POST /api/tasks
Create a new task (Admin only)

**Request:**
```json
{
  "title": "Advanced Leadership Workshop",
  "description": "Develop leadership skills through interactive sessions",
  "category": "workshop",
  "durationHours": 8,
  "points": 50,
  "certificate": true,
  "requiresFeedback": true
}
```

#### GET /api/tasks/<taskId>
Get task details

#### POST /api/tasks/<taskId>/register
Register for a task

**Request:**
```json
{
  "userEmail": "alumni@example.com",
  "fullName": "John Doe",
  "phone": "+256700000000"
}
```

### Task Completion

#### POST /api/task-completion
Complete a task and generate documents

**Request:**
```json
{
  "taskId": "TSK-1234",
  "registrationId": "REG-5678",
  "userEmail": "alumni@example.com",
  "fullName": "John Doe",
  "completionHours": 8,
  "receiptAmount": 50000
}
```

**Response:**
```json
{
  "success": true,
  "completionId": "COMP-9012",
  "certificateId": "CERT-3456",
  "ticketId": "TICKET-7890",
  "receiptId": "RCP-2345",
  "message": "Task completed successfully!"
}
```

### Document Download

#### GET /api/task-certificate/<certId>
Download task certificate PDF

#### GET /api/task-ticket/<ticketId>
Download task ticket PDF

#### GET /api/task-receipt/<receiptId>
Download task receipt PDF

### Feedback

#### POST /api/task-feedback
Submit feedback for a completed task

**Request:**
```json
{
  "completionId": "COMP-9012",
  "taskId": "TSK-1234",
  "userEmail": "alumni@example.com",
  "fullName": "John Doe",
  "rating": 5,
  "comments": "Great experience!",
  "wouldRecommend": true
}
```

### User Tasks

#### GET /api/user-tasks/<userEmail>
Get user's registered tasks

#### GET /api/user-completions/<userEmail>
Get user's completed tasks with documents

## Frontend Usage

### Tasks Page
Navigate to `/tasks.html` to:
- Browse all available tasks
- Register for tasks
- View registered tasks
- Complete tasks
- Track completed tasks and download documents
- Submit feedback

### JavaScript API
```javascript
// Load tasks
loadTasks();

// Open registration modal
openRegisterModal(taskId);

// Submit registration
submitRegistration();

// Open completion modal
openCompleteModal(registration);

// Complete task and generate documents
submitCompletion();

// Submit feedback
submitFeedback();

// Load user's tasks and completions
loadUserTasks();
```

## Document Generation

### PDF Generation Functions
All PDFs are generated using ReportLab Python library:

1. **generate_task_certificate_pdf()** - Landscape A4 certificate
   - Task title
   - Participant name
   - Completion hours
   - Certificate number
   - Issue date
   - Signature blocks

2. **generate_task_ticket_pdf()** - A4 ticket
   - Task details
   - Participant information
   - Ticket number
   - Status confirmation
   - QR code (for events)

3. **generate_task_receipt_pdf()** - A4 receipt
   - Participation details
   - Amount and currency
   - Receipt number
   - Issue date
   - Official footer

### Color Scheme
- Primary: #1d4ed8 (Blue)
- Success: #16a34a (Green)
- Warning: #f59e0b (Amber)
- Muted: #6b7280 (Gray)

## Workflow Example

### Step 1: User Registers for Task
```
POST /api/tasks/TSK-1234/register
{
  "userEmail": "alumni@example.com",
  "fullName": "John Doe",
  "phone": "+256700000000"
}
→ Registration ID: REG-5678
```

### Step 2: User Completes Task
```
POST /api/task-completion
{
  "taskId": "TSK-1234",
  "registrationId": "REG-5678",
  "userEmail": "alumni@example.com",
  "fullName": "John Doe",
  "completionHours": 8,
  "receiptAmount": 50000
}
→ Completion ID: COMP-9012
→ Certificate: CERT-3456
→ Ticket: TICKET-7890
→ Receipt: RCP-2345
```

### Step 3: System Generates Documents
- Certificate saved to: /backend/data/certificates/CERT-3456.pdf
- Ticket saved to: /backend/data/tickets/TICKET-7890.pdf
- Receipt saved to: /backend/data/donation_letters/RCP-2345.pdf

### Step 4: User Downloads Documents
```
GET /api/task-certificate/CERT-3456 → Download certificate
GET /api/task-ticket/TICKET-7890 → Download ticket
GET /api/task-receipt/RCP-2345 → Download receipt
```

### Step 5: User Submits Feedback
```
POST /api/task-feedback
{
  "completionId": "COMP-9012",
  "rating": 5,
  "comments": "Great workshop!",
  "wouldRecommend": true
}
→ Feedback ID: FB-1357
```

## Database Initialization

Run the backend Flask app to automatically initialize the database:

```bash
cd backend
python app.py
```

This will create all tables including the new task-related tables.

## Configuration

### Environment Variables (Backend)
```
BASE_URL=http://localhost:5000
JWT_SECRET=your-secret-key
PORT=5000
```

### API Base URL (Frontend)
Update `tasks.js` if needed:
```javascript
const API_BASE_URL = 'http://localhost:5000';
```

## Future Enhancements

1. **Email Integration**
   - Send certificates via email automatically
   - Task reminders and follow-ups

2. **Gamification**
   - Badges and achievements
   - Leaderboards
   - Progress tracking dashboard

3. **Integration with Job Board**
   - Link tasks to job opportunities
   - Skills matching

4. **Mobile App**
   - Native iOS/Android apps
   - Offline certificate access

5. **Analytics**
   - Task completion rates
   - Popular tasks
   - Demographic insights

## Troubleshooting

### PDFs Not Generating
- Ensure ReportLab is installed: `pip install reportlab qrcode`
- Check file permissions on `backend/data/` directories
- Verify logo path exists at `image/Bugema_logo.png`

### API Errors
- Check API base URL matches your server
- Verify user is logged in for protected endpoints
- Check request body matches schema

### Documents Not Downloading
- Verify PDF file exists in storage directory
- Check file permissions
- Ensure correct cert/ticket/receipt ID

## Support

For issues or questions:
1. Check the API documentation above
2. Review browser console for errors
3. Check server logs: `backend/*.log`
4. Contact: alumni@bualumni.org
