# 🔧 HTTP 405 Error - FIXED!

## ❌ The Problem

You were getting this error:
```
HTTP 405: Method Not Allowed
```

When trying to register for events.

## 🔍 Root Cause

The BU Alumni Portal needs **TWO servers** running:

```
┌─────────────────────────────────────────────────────────────┐
│                    BU Alumni Portal                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (HTML/JS)          Backend (Python Flask)        │
│  Port 3000                   Port 5000                     │
│  ├─ events.html              ├─ app.py                     │
│  ├─ api-client.js            ├─ database.py                │
│  └─ server.js                ├─ email_sender.py            │
│                              └─ pdf_generator.py            │
│                                                             │
│  User clicks "Register"  →   API Call  →  Backend          │
│                              POST /api/register-event       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Your issue:** Neither server was running! ❌

When you opened HTML files directly (`file:///C:/Users/...`), the API calls had nowhere to go, resulting in HTTP 405 errors.

## ✅ The Solution

### What I Fixed:

1. ✅ **Created `.env` configuration file** in `backend/` folder
2. ✅ **Created `start-servers.bat`** - One-click startup script
3. ✅ **Created `start-servers.ps1`** - PowerShell alternative
4. ✅ **Created comprehensive guides:**
   - `QUICK_START_GUIDE.md` - Detailed setup instructions
   - `README_START_HERE.md` - Quick reference
   - `HTTP_405_FIX.md` - This file

### What You Need to Do:

#### Step 1: Configure Backend (2 minutes)

Edit `backend/.env` file:

```env
# Generate this with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=your-generated-secret-here

# Your Gmail settings
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to https://myaccount.google.com/apppasswords
4. Generate password for "Mail"
5. Copy the 16-character password (no spaces)
6. Paste it in `SMTP_PASS`

#### Step 2: Start Servers (1 click)

**Double-click:** `start-servers.bat`

This will:
- ✅ Check Python and Node.js are installed
- ✅ Install Python dependencies if needed
- ✅ Start backend server on port 5000
- ✅ Start frontend server on port 3000
- ✅ Open two terminal windows (keep them open!)

#### Step 3: Access the Site

Open your browser and go to:
```
http://localhost:3000
```

**NOT** `file:///C:/Users/...` ❌

## 🧪 Test It Works

1. Go to http://localhost:3000/events.html
2. Click "Register Now" on any event
3. Fill in the form:
   ```
   Full Name: John Doe
   Email: john@example.com
   Phone: +256 700 000 000
   ```
4. Click "Register & Get Ticket"

### Expected Result: ✅

```
╔═══════════════════════════════════════════════════════════╗
║              Registration Confirmed! ✓                    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Your ticket has been sent to your email                 ║
║                                                           ║
║  Ticket ID: EVT-12345678                                 ║
║  Name: John Doe                                          ║
║  Email: john@example.com                                 ║
║  Phone: +256 700 000 000                                 ║
║                                                           ║
║  [Download Ticket & Receipt (PDF)]                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

You should also receive an email with:
- ✅ PDF ticket with QR code
- ✅ Event details
- ✅ Registration confirmation

## 📊 How It Works Now

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │         │   Frontend   │         │   Backend    │
│ localhost:   │   →     │   Server     │   →     │   Server     │
│   3000       │         │  (Node.js)   │         │   (Flask)    │
└──────────────┘         └──────────────┘         └──────────────┘
      ↓                         ↓                         ↓
  User clicks            Sends API call            Processes:
  "Register"             to backend                - Validates data
                         POST /api/                - Saves to DB
                         register-event            - Generates PDF
                                                   - Sends email
                                                   - Returns ticket
      ↓                         ↓                         ↓
  Shows success          Receives response         Returns JSON:
  message with           with ticket data          { ticketId, 
  ticket details                                     downloadUrl,
  and download link                                  message }
```

## 🔧 Troubleshooting

### Error: "Python is not installed"
**Solution:** Install Python 3.10+ from https://python.org

### Error: "Node.js is not installed"
**Solution:** Install Node.js 16+ from https://nodejs.org

### Error: "ModuleNotFoundError: No module named 'flask'"
**Solution:**
```bash
cd "BU ALU Portal/backend"
pip install -r requirements.txt
```

### Error: "Address already in use"
**Solution:** Kill the process using that port
```bash
# For port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# For port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Error: "SMTP Authentication failed"
**Solution:** 
- Make sure you're using Gmail **App Password**, not regular password
- Enable 2-Factor Authentication first
- Generate new App Password at https://myaccount.google.com/apppasswords

### Still getting HTTP 405?

**Check these:**

1. **Are both servers running?**
   ```bash
   netstat -ano | findstr :5000    # Should show backend
   netstat -ano | findstr :3000    # Should show frontend
   ```

2. **Are you using the correct URL?**
   - ✅ http://localhost:3000
   - ❌ file:///C:/Users/...

3. **Check browser console (F12):**
   - Look for error messages
   - Check Network tab for failed requests

4. **Check backend terminal:**
   - Look for error messages when you submit the form
   - Should show: `[register-event] EVT-12345678 — email@example.com for 'Event Name'`

## 📁 Files Created/Modified

### Created:
- ✅ `backend/.env` - Backend configuration
- ✅ `start-servers.bat` - Windows batch startup script
- ✅ `start-servers.ps1` - PowerShell startup script
- ✅ `QUICK_START_GUIDE.md` - Detailed setup guide
- ✅ `README_START_HERE.md` - Quick reference
- ✅ `HTTP_405_FIX.md` - This file

### Modified:
- ✅ `events.html` - Added `onsubmit` handler to form (line 800)
- ✅ `events.html` - Added `handleEventRegistration()` wrapper function

## 🎯 Quick Reference

**Start servers:**
```bash
start-servers.bat
```

**Check if running:**
```bash
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```

**Access site:**
```
http://localhost:3000
```

**Test event registration:**
```
http://localhost:3000/events.html
```

## ✅ Success Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 16+ installed
- [ ] `backend/.env` configured with JWT_SECRET
- [ ] `backend/.env` configured with SMTP settings (optional)
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] Accessing via http://localhost:3000
- [ ] Event registration works ✓
- [ ] PDF ticket downloads ✓
- [ ] Email received (if SMTP configured) ✓

---

## 🚀 You're All Set!

The HTTP 405 error is now fixed. Just:

1. **Configure** `backend/.env` (JWT_SECRET + SMTP)
2. **Run** `start-servers.bat`
3. **Open** http://localhost:3000
4. **Test** event registration

**Need more help?** See `QUICK_START_GUIDE.md` for detailed instructions.

---

**Happy coding! 🎉**
