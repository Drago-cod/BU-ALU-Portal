# 🚀 Quick Start Guide - Fix HTTP 405 Error

## Problem
You're getting **HTTP 405: Method Not Allowed** when registering for events because the backend server is not running.

## Root Cause
The BU Alumni Portal requires **TWO servers** to work:
1. **Backend Server** (Python Flask) on port 5000 - Handles API requests, database, emails, PDF generation
2. **Frontend Server** (Node.js) on port 3000 - Serves the HTML pages and proxies API calls

Currently, **neither server is running**, which is why you're getting the 405 error.

---

## ✅ Solution: Start Both Servers

### Step 1: Install Python Dependencies

Open a terminal and run:

```bash
cd "BU ALU Portal/backend"
pip install -r requirements.txt
```

This installs Flask, bcrypt, JWT, ReportLab (PDF), and other dependencies.

### Step 2: Create Backend Configuration

Create a `.env` file in the `backend` folder:

```bash
cd "BU ALU Portal/backend"
copy .env.example .env
```

Then edit `backend/.env` with these settings:

```env
# Server Configuration
PORT=5000
BASE_URL=http://localhost:5000

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-random-string-change-this-now

# Gmail SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_NAME=BU Alumni Portal
```

**Important:** 
- Generate a strong JWT secret: `python -c "import secrets; print(secrets.token_hex(32))"`
- For Gmail, you need an **App Password** (not your regular password):
  1. Enable 2-Factor Authentication on your Gmail
  2. Go to https://myaccount.google.com/apppasswords
  3. Generate an app password for "Mail"
  4. Use that 16-character password in `SMTP_PASS`

### Step 3: Start the Backend Server

**Option A: Using the Batch File (Easiest)**

Double-click `start-backend.bat` in the `BU ALU Portal` folder.

**Option B: Manual Start**

```bash
cd "BU ALU Portal/backend"
python app.py
```

You should see:
```
🚀 Starting Flask server...
 * Running on http://0.0.0.0:5000
```

**Keep this terminal window open!**

### Step 4: Start the Frontend Server

Open a **NEW terminal** (don't close the backend terminal) and run:

```bash
cd "BU ALU Portal"
node server.js
```

You should see:
```
Server running at http://localhost:3000
```

**Keep this terminal window open too!**

### Step 5: Access the Site Correctly

**❌ WRONG:** Opening HTML files directly (file:///C:/Users/...)
**✅ CORRECT:** Go to http://localhost:3000 in your browser

---

## 🧪 Test Event Registration

1. Open http://localhost:3000/events.html
2. Click "Register Now" on any event
3. Fill in the form:
   - Full Name: Your Name
   - Email: your@email.com
   - Phone: +256 700 000 000
4. Click "Register & Get Ticket"
5. You should see:
   - ✅ Success message
   - Ticket card with your details
   - Download button for PDF ticket
   - Email with PDF ticket (if SMTP is configured)

---

## 🔧 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'flask'"

**Solution:** Install Python dependencies
```bash
cd "BU ALU Portal/backend"
pip install -r requirements.txt
```

### Error: "Address already in use" (Port 5000 or 3000)

**Solution:** Kill the process using that port

**For Port 5000:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**For Port 3000:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Error: "SMTP Authentication failed"

**Solution:** 
1. Make sure you're using a Gmail **App Password**, not your regular password
2. Enable 2-Factor Authentication on your Gmail account
3. Generate a new App Password at https://myaccount.google.com/apppasswords
4. Update `SMTP_PASS` in `backend/.env`

### Still Getting HTTP 405 Error?

**Check these:**

1. **Are both servers running?**
   - Backend: http://localhost:5000 should show a response
   - Frontend: http://localhost:3000 should show the homepage

2. **Are you accessing via localhost?**
   - ❌ Don't open HTML files directly (file://)
   - ✅ Use http://localhost:3000

3. **Check browser console for errors:**
   - Press F12 in your browser
   - Go to Console tab
   - Look for error messages

4. **Check backend terminal for errors:**
   - Look at the terminal where you ran `python app.py`
   - Check for error messages when you submit the form

---

## 📁 File Structure

```
BU ALU Portal/
├── backend/
│   ├── app.py                 # Backend server (Flask)
│   ├── database.py            # SQLite database
│   ├── email_sender.py        # Email functionality
│   ├── pdf_generator.py       # PDF ticket generation
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Configuration template
│   └── .env                   # Your configuration (CREATE THIS)
├── server.js                  # Frontend server (Node.js)
├── api-client.js              # API client (connects to backend)
├── events.html                # Events page
├── start-backend.bat          # Quick start script
└── QUICK_START_GUIDE.md       # This file
```

---

## 🎯 Quick Commands Reference

**Start Backend:**
```bash
cd "BU ALU Portal/backend"
python app.py
```

**Start Frontend:**
```bash
cd "BU ALU Portal"
node server.js
```

**Check if servers are running:**
```bash
netstat -ano | findstr :5000    # Backend
netstat -ano | findstr :3000    # Frontend
```

**Install Python dependencies:**
```bash
cd "BU ALU Portal/backend"
pip install -r requirements.txt
```

**Generate JWT secret:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## ✨ What Happens When You Register?

1. **Frontend** (events.html) collects form data
2. **API Client** (api-client.js) sends POST request to backend
3. **Backend** (app.py) receives request at `/api/register-event`
4. **Database** (database.py) saves registration
5. **PDF Generator** (pdf_generator.py) creates ticket with QR code
6. **Email Sender** (email_sender.py) sends ticket to your email
7. **Frontend** displays success message and download link

---

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use strong JWT secret (32+ characters)
- Use Gmail App Password, not your regular password
- For production, use a proper email service (SendGrid, Mailgun)
- Enable HTTPS in production

---

## 📚 Additional Resources

- **Full Backend Setup:** See `BACKEND_SETUP.md`
- **Email Configuration:** See `backend/EMAIL_SETUP_GUIDE.md`
- **Email Flow:** See `backend/EMAIL_FLOW.md`
- **API Documentation:** See `backend/README.md`

---

## ✅ Success Checklist

- [ ] Python 3.10+ installed
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created in `backend/` folder
- [ ] JWT_SECRET configured in `.env`
- [ ] SMTP settings configured in `.env` (optional but recommended)
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Accessing site via http://localhost:3000 (not file://)
- [ ] Event registration works without errors
- [ ] PDF ticket downloads successfully
- [ ] Email received with ticket (if SMTP configured)

---

**Need Help?** Check the backend terminal for error messages and review the troubleshooting section above.
