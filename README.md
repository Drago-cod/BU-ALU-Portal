# BU Alumni Portal 🎓

A **fully functional** centralized digital platform connecting Bugema University graduates with professional opportunities, institutional news, and community initiatives.

## ✨ Features

The BU Alumni Portal is now **fully functional** with a complete backend API:

### 🔐 Authentication & Accounts
- ✅ User registration with email/password
- ✅ Secure login with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Session management

### 👥 Membership Management
- ✅ Membership registration (UGX 10,000 fee)
- ✅ Payment method selection (MTN MoMo, Airtel Money, Bank Transfer)
- ✅ Member ID generation
- ✅ Email confirmations

### 🎟️ Events & Ticketing
- ✅ Event registration
- ✅ Automatic PDF ticket generation
- ✅ Ticket download by ID
- ✅ Email ticket delivery

### 💝 Donations
- ✅ Donation processing
- ✅ Mobile Money (MoMo) integration (simulated)
- ✅ Receipt generation
- ✅ Donation tracking

### 💼 Job Board
- ✅ Job posting (with moderation)
- ✅ Job search and filtering
- ✅ Contact employers

### 👨‍👩‍👧‍👦 Community
- ✅ Community feed/posts
- ✅ Like/unlike posts
- ✅ Comments system
- ✅ Real-time interactions

### � Tasks & Skill Development
- ✅ Task registration and enrollment
- ✅ Task completion tracking
- ✅ Automatic certificate generation (PDF)
- ✅ Event ticket generation
- ✅ Participation receipt generation
- ✅ Post-completion feedback system
- ✅ 5-star rating and comments
- ✅ User task history and document downloads

### �📊 Statistics & Admin
- ✅ Dynamic statistics
- ✅ Admin stats updates
- ✅ Real-time counters

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Environment
```bash
copy .env.example .env
```
Edit `.env` with your settings (optional for testing).

### Step 2: Install Dependencies
```bash
cd "BU ALU Portal\backend"
pip install -r requirements.txt
```

### Step 3: Start the Server
**Option A: Double-click start-backend.bat**

**Option B: Command line**
```bash
cd "BU ALU Portal\backend"
python app.py
```

🌐 **Access the portal at: http://localhost:5000**

## 📁 Project Structure

```
BU ALU Portal/
├── 📄 Frontend (HTML/CSS/JS)
│   ├── *.html              # Page templates
│   ├── api-client.js       # API communication layer
│   ├── register-form.js    # Registration handler
│   ├── login-form.js       # Login handler
│   ├── membership-form.js  # Membership handler
│   ├── donation-form.js    # Donation handler
│   └── *.css               # Stylesheets
│
├── ⚙️ Backend (Python Flask)
│   ├── app.py              # Main Flask application
│   ├── database.py         # SQLite database layer
│   ├── utils.py            # Utility functions
│   ├── email_sender.py     # Email functionality
│   ├── pdf_generator.py    # PDF ticket generation
│   └── requirements.txt    # Python dependencies
│
├── 🗄️ Database
│   └── data/
│       └── bu_alumni.db    # SQLite database (auto-created)
│
├── 🔧 Configuration
│   ├── .env                # Environment variables (create this)
│   ├── .env.example        # Example configuration
│   └── start-backend.bat   # Windows startup script
│
└── 📖 Documentation
    ├── README.md           # This file
    ├── SETUP.md            # Detailed setup guide
    └── backend/test_api.py # API testing script
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/register-account` | POST | Create new user account |
| `/api/login-account` | POST | User login |
| `/api/register-member` | POST | Register membership |
| `/api/register-event` | POST | Register for event + PDF ticket |
| `/api/ticket/<id>` | GET | Download ticket PDF |
| `/api/register-donation` | POST | Process donation |
| `/api/momo-prompt` | POST | Mobile Money payment |
| `/api/post-job` | POST | Post job listing |
| `/api/community/posts` | GET | Get community posts |
| `/api/community/post` | POST | Create post |
| `/api/community/like` | POST | Like/unlike post |
| `/api/community/comment` | POST | Add comment |
| `/api/stats` | GET/POST | Get/update stats |

## 🧪 Testing the System

### Run API Tests
```bash
cd "BU ALU Portal\backend"
python test_api.py
```

### Manual Testing
1. **Register**: Go to `/register.html` → Create account
2. **Login**: Go to `/login.html` → Login with credentials
3. **Membership**: Go to `/auth.html` → Register as member
4. **Donate**: Go to `/donate.html` → Make donation
5. **Events**: Register for events and download tickets

## 📦 Technology Stack

### Backend
- **Python 3.8+**
- **Flask** - Web framework
- **SQLite** - Database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **ReportLab** - PDF generation
- **Flask-CORS** - Cross-origin support

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling
- **Vanilla JavaScript** - Interactivity
- **Fetch API** - Backend communication
- **Material Icons** - Icons

## ⚙️ Configuration

Create a `.env` file with:

```env
# Server
PORT=5000
BASE_URL=http://localhost:5000

# Security
JWT_SECRET=your-secret-key-here

# Email (optional for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Features
ENABLE_EMAILS=true
ENABLE_PDFS=true
ENVIRONMENT=development
```

## 🛠️ Development vs Production

### Development (default)
- ✅ Simulated MoMo payments
- ✅ Console email logging
- ✅ Debug mode enabled
- ✅ Auto-reload on changes

### Production
- 🔒 Real payment providers
- 📧 Real email sending
- 🚀 Optimized performance
- 🗄️ PostgreSQL recommended

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Change `PORT` in `.env` |
| CORS errors | Access via `http://localhost:5000`, not `file://` |
| Database locked | Delete `backend/data/bu_alumni.db` |
| Email not sending | Check SMTP settings or set `ENABLE_EMAILS=false` |
| Import errors | Run `pip install -r requirements.txt` |

## 📚 Documentation

- **SETUP.md** - Detailed setup instructions
- **TASK_SYSTEM.md** - Task system documentation
- **backend/test_api.py** - API testing script
- **backend/seed_tasks.py** - Sample task seeding script
- **Code comments** - Inline documentation

## 📚 Task Completion System

The portal now includes a **complete task management system** for alumni skill development:

### Features
- 📝 Task registration with detailed information
- ✅ Task completion tracking with hours
- 🎖️ Automatic certificate generation (PDF)
- 🎫 Event ticket generation
- 💰 Participation receipt generation
- ⭐ Post-completion feedback (5-star rating)
- 📥 Document downloads
- 📊 User task history

### Getting Started with Tasks

#### 1. Seed Sample Tasks (Run Once)
```bash
cd "BU ALU Portal\backend"
python seed_tasks.py
```

This creates 10 sample tasks including:
- Advanced Leadership Workshop
- Digital Marketing Fundamentals Seminar
- Professional Networking Conference 2024
- Python Programming Bootcamp
- Financial Planning for Young Professionals
- And 5 more skill-building tasks

#### 2. Access the Tasks Page
```
http://localhost:5000/tasks.html
```

#### 3. Complete Task Workflow
1. **Register** for a task (name/email/phone)
2. **Complete** the task (track hours spent, optional amount)
3. **Get Documents** (certificate, ticket, receipt auto-generated)
4. **Leave Feedback** (5-star rating + comments)

### API Endpoints for Tasks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List all tasks |
| `/api/tasks` | POST | Create task (admin) |
| `/api/tasks/<id>` | GET | Get task details |
| `/api/tasks/<id>/register` | POST | Register for task |
| `/api/task-completion` | POST | Complete task + generate docs |
| `/api/task-feedback` | POST | Submit task feedback |
| `/api/user-tasks/<email>` | GET | Get user's registrations |
| `/api/user-completions/<email>` | GET | Get user's completions |
| `/api/task-certificate/<id>` | GET | Download certificate |
| `/api/task-ticket/<id>` | GET | Download ticket |
| `/api/task-receipt/<id>` | GET | Download receipt |

### Generated Documents

When a task is completed, the system automatically generates:

1. **Certificate** - Landscape PDF with task details, hours, signature block
2. **Ticket** - Event/workshop participation ticket (A4)
3. **Receipt** - Amount and participation details (A4)

All documents are saved to:
- Certificates: `backend/data/certificates/`
- Tickets: `backend/data/tickets/`
- Receipts: `backend/data/donation_letters/`

### Database Schema

Task system uses 8 interconnected tables:
- `tasks` - Task definitions
- `task_registrations` - User registrations
- `task_completions` - Completion records
- `task_certificates` - Certificate metadata
- `task_tickets` - Ticket metadata
- `task_receipts` - Receipt metadata
- `task_feedbacks` - User feedback

See [TASK_SYSTEM.md](TASK_SYSTEM.md) for complete API documentation.

## 🗺️ Roadmap

- [x] ✅ Core authentication system
- [x] ✅ Membership registration
- [x] ✅ Event ticketing with PDFs
- [x] ✅ Donation processing
- [x] ✅ Job board
- [x] ✅ Community features
- [x] ✅ Task completion system with auto document generation
- [x] ✅ Feedback collection system
- [ ] Real payment gateway integration
- [ ] Admin dashboard
- [ ] Analytics & reporting
- [ ] Mobile app
- [ ] AI mentor matching

## 🤝 Support

Need help?
1. Check the browser console for JavaScript errors
2. Check the terminal for backend logs
3. Run the API test script: `python backend/test_api.py`
4. Review SETUP.md for detailed instructions

---

**🎉 The BU Alumni Portal is now fully functional and ready to use!**
