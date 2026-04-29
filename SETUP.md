# BU Alumni Portal - Complete Setup Guide

This guide will help you set up and run the fully functional BU Alumni Portal system.

## System Overview

The BU Alumni Portal consists of:
- **Frontend**: Static HTML/CSS/JS files
- **Backend**: Python Flask API (recommended) or Node.js server
- **Database**: SQLite (automatically created)
- **Features**: User authentication, membership registration, donations, event tickets, job postings, community features

## Prerequisites

1. **Python 3.8+** (for Flask backend) - Download from [python.org](https://python.org)
2. **Node.js 16+** (optional, for Node.js backend) - Download from [nodejs.org](https://nodejs.org)
3. **Modern web browser** (Chrome, Firefox, Edge)

## Quick Start (Windows)

### Step 1: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` with your settings:
   - Set `JWT_SECRET` to a random string
   - Configure SMTP settings for email (optional for testing)
   - Set `BASE_URL=http://localhost:5000`

### Step 2: Install Python Dependencies

```bash
cd "BU ALU Portal\backend"
pip install -r requirements.txt
```

### Step 3: Start the Backend Server

**Option A: Using the startup script (Recommended)**
```bash
cd "BU ALU Portal"
start-backend.bat
```

**Option B: Manual start**
```bash
cd "BU ALU Portal\backend"
python app.py
```

The server will start on `http://localhost:5000`

### Step 4: Access the Portal

1. Open your browser
2. Navigate to `http://localhost:5000`
3. The portal is now fully functional!

## Available API Endpoints

### Authentication
- `POST /api/register-account` - Create new account
- `POST /api/login-account` - Login

### Membership & Events
- `POST /api/register-member` - Register membership
- `POST /api/register-event` - Register for events (with PDF ticket)
- `GET /api/ticket/<ticketId>` - Download ticket PDF

### Donations
- `POST /api/register-donation` - Process donation
- `POST /api/momo-prompt` - Mobile Money payment

### Jobs
- `POST /api/post-job` - Post job listing

### Community
- `GET /api/community/posts` - Get posts
- `POST /api/community/post` - Create post
- `POST /api/community/like` - Like/unlike post
- `POST /api/community/comment` - Add comment

### Stats
- `GET /api/stats` - Get portal statistics
- `POST /api/stats` - Update statistics (admin)

## Frontend Integration

The following JavaScript files handle API communication:

| File | Purpose |
|------|---------|
| `api-client.js` | Core API client with all endpoints |
| `register-form.js` | Connects registration form to API |
| `login-form.js` | Connects login form to API |
| `membership-form.js` | Connects membership form to API |
| `donation-form.js` | Connects donation form to API |

To include in HTML pages, add these scripts before the closing `</body>` tag:

```html
<!-- API Client (required for all pages) -->
<script src="api-client.js"></script>

<!-- Page-specific form handlers -->
<script src="register-form.js"></script>  <!-- For register.html -->
<script src="login-form.js"></script>      <!-- For login.html -->
<script src="membership-form.js"></script> <!-- For auth.html -->
<script src="donation-form.js"></script>   <!-- For donate.html -->
```

## Database Schema

The SQLite database (`backend/data/bu_alumni.db`) includes tables for:
- **accounts** - User accounts with authentication
- **members** - Membership registrations
- **event_registrations** - Event signups with tickets
- **donations** - Donation records
- **jobs** - Job postings
- **community_posts** - Community feed
- **comments** - Post comments
- **momo_logs** - Mobile Money transactions
- **stats** - Portal statistics

## Testing the System

### Test Account Registration
1. Go to `http://localhost:5000/register.html`
2. Fill in: Name, Email, Password (min 6 chars)
3. Submit form
4. Account is created and token stored

### Test Login
1. Go to `http://localhost:5000/login.html`
2. Enter email and password
3. Login successful → redirects to home

### Test Membership Registration
1. Go to `http://localhost:5000/auth.html`
2. Fill membership form
3. Select payment method
4. Submit → Member ID generated

### Test Donation
1. Go to `http://localhost:5000/donate.html`
2. Enter amount and details
3. Submit → Donation ID generated

## Troubleshooting

### Port Already in Use
If port 5000 is busy, change in `.env`:
```
FLASK_PORT=5001
BASE_URL=http://localhost:5001
```

### CORS Errors
The Flask backend already includes CORS support. If you see CORS errors:
1. Ensure you're accessing via `http://localhost:5000`, not `file://`
2. Check that Flask-CORS is installed: `pip install flask-cors`

### Database Issues
Delete the database file to reset:
```bash
del "backend\data\bu_alumni.db"
```
The database will be recreated on next server start.

### Email Not Sending
For development, emails are simulated. To enable real emails:
1. Configure SMTP settings in `.env`
2. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)

## Production Deployment

### Security Checklist
- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use HTTPS (set `BASE_URL` to https://)
- [ ] Configure real SMTP credentials
- [ ] Set `ENVIRONMENT=production`
- [ ] Disable `debug=True` in `app.py`
- [ ] Set up proper database (PostgreSQL recommended)
- [ ] Configure CORS for your domain only

### Environment Variables for Production
```env
ENVIRONMENT=production
JWT_SECRET=your-very-strong-random-secret-key
BASE_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ENABLE_EMAILS=true
ENABLE_PDFS=true
```

## Support

For issues or questions:
1. Check the browser console for JavaScript errors
2. Check the terminal running the backend for server errors
3. Review the logs in the backend terminal

## File Structure

```
BU ALU Portal/
├── backend/
│   ├── app.py              # Flask main application
│   ├── database.py         # SQLite database layer
│   ├── utils.py            # Utility functions
│   ├── email_sender.py     # Email functionality
│   ├── pdf_generator.py    # PDF ticket generation
│   └── requirements.txt    # Python dependencies
├── *.html                  # Frontend pages
├── *.js                    # Frontend scripts
├── *.css                   # Stylesheets
├── .env                    # Environment configuration
├── .env.example            # Example configuration
├── start-backend.bat       # Windows startup script
└── SETUP.md               # This file
```

## Next Steps

After setup, consider:
1. Customizing the portal branding (logo, colors)
2. Adding real payment provider integration (not simulated)
3. Setting up automated backups for the database
4. Implementing admin dashboard for moderation
5. Adding analytics and reporting features

---

**You're all set! The BU Alumni Portal should now be fully functional.** 🎉
