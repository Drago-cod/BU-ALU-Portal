# 🚀 BU Alumni Portal - START HERE

## ⚠️ IMPORTANT: HTTP 405 Error Fix

If you're getting **HTTP 405: Method Not Allowed** when registering for events, it's because the backend server is not running.

## 🎯 Quick Fix (3 Steps)

### Step 1: Configure Backend

Edit `backend/.env` file and set:
- `JWT_SECRET` - Generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
- `SMTP_USER` - Your Gmail address
- `SMTP_PASS` - Your Gmail App Password (see below)

**Get Gmail App Password:**
1. Enable 2-Factor Auth: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" → Copy the 16-character password
4. Paste it in `SMTP_PASS` in `backend/.env`

### Step 2: Start Both Servers

**Option A: Automatic (Recommended)**

Double-click `start-servers.bat` (Windows Batch)

OR

Right-click `start-servers.ps1` → Run with PowerShell

**Option B: Manual**

Terminal 1 (Backend):
```bash
cd "BU ALU Portal/backend"
pip install -r requirements.txt
python app.py
```

Terminal 2 (Frontend):
```bash
cd "BU ALU Portal"
node server.js
```

### Step 3: Access the Site

Open your browser and go to: **http://localhost:3000**

❌ **DON'T** open HTML files directly (file://)
✅ **DO** use http://localhost:3000

---

## ✅ Test Event Registration

1. Go to http://localhost:3000/events.html
2. Click "Register Now" on any event
3. Fill in the form and submit
4. You should see:
   - ✅ Success message
   - Ticket card with your details
   - Download button for PDF ticket
   - Email with PDF ticket

---

## 📚 Documentation

- **Quick Start Guide:** `QUICK_START_GUIDE.md` - Detailed setup instructions
- **Backend Setup:** `BACKEND_SETUP.md` - Full backend configuration
- **Email Setup:** `backend/EMAIL_SETUP_GUIDE.md` - Email configuration
- **Integration:** `INTEGRATION_COMPLETE.md` - System architecture

---

## 🔧 Troubleshooting

### "ModuleNotFoundError: No module named 'flask'"
```bash
cd "BU ALU Portal/backend"
pip install -r requirements.txt
```

### "Address already in use"
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Still getting HTTP 405?
1. Check both servers are running (look at the terminal windows)
2. Make sure you're accessing via http://localhost:3000 (not file://)
3. Check browser console (F12) for error messages
4. Check backend terminal for error messages

---

## 📁 Project Structure

```
BU ALU Portal/
├── backend/                   # Backend server (Python Flask)
│   ├── app.py                # Main server file
│   ├── database.py           # SQLite database
│   ├── email_sender.py       # Email functionality
│   ├── pdf_generator.py      # PDF ticket generation
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Configuration (EDIT THIS!)
├── server.js                 # Frontend server (Node.js)
├── api-client.js             # API client
├── events.html               # Events page
├── start-servers.bat         # Start both servers (Windows)
├── start-servers.ps1         # Start both servers (PowerShell)
├── README_START_HERE.md      # This file
└── QUICK_START_GUIDE.md      # Detailed guide
```

---

## 🎯 What You Need

- **Python 3.10+** - https://python.org
- **Node.js 16+** - https://nodejs.org
- **Gmail Account** - For sending emails (optional but recommended)

---

## 🚀 Quick Commands

**Start servers:**
```bash
# Option 1: Automatic
start-servers.bat

# Option 2: Manual
cd backend && python app.py          # Terminal 1
cd "BU ALU Portal" && node server.js # Terminal 2
```

**Check if running:**
```bash
netstat -ano | findstr :5000    # Backend
netstat -ano | findstr :3000    # Frontend
```

**Generate JWT secret:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## ✨ Features

- ✅ Event registration with PDF tickets
- ✅ Email notifications with QR codes
- ✅ Donation system with receipts
- ✅ Membership registration
- ✅ User authentication (sign up/sign in)
- ✅ Mobile money payment integration
- ✅ Community posts and interactions
- ✅ Job opportunities board

---

## 🔐 Security

- Never commit `.env` file to version control
- Use strong JWT secret (32+ characters)
- Use Gmail App Password, not regular password
- For production, use proper email service (SendGrid, Mailgun)
- Enable HTTPS in production

---

## 📞 Need Help?

1. Check `QUICK_START_GUIDE.md` for detailed instructions
2. Check backend terminal for error messages
3. Check browser console (F12) for frontend errors
4. Review `BACKEND_SETUP.md` for backend configuration

---

**Ready to start?** Run `start-servers.bat` and open http://localhost:3000 🚀
