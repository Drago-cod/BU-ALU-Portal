# Quick Start - Email Ticket Delivery

## ⚡ 3-Minute Setup

### 1. Create `.env` file
```bash
cd "BU ALU Portal/backend"
cp .env.example .env
```

### 2. Add Gmail credentials to `.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_NAME=BU Alumni Portal
BASE_URL=http://localhost:5000
```

### 3. Get Gmail App Password
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Click **App passwords**
4. Generate password for "Mail"
5. Copy the 16-character code
6. Paste into `SMTP_PASS` in `.env`

### 4. Start server & test
```bash
python app.py
```

Visit http://localhost:5000/events.html and register for an event!

## ✅ What Happens

When someone registers for an event:

1. ✉️ **Email sent automatically** with PDF ticket attached
2. 📄 **PDF includes**: QR code, ticket ID, event details
3. 🔗 **Download link** provided as backup
4. ⚡ **Instant delivery** - arrives in seconds

## 🎯 Email Contains

- Professional HTML design
- Event name, date, time, location
- Ticket ID (e.g., TKT-ABC123)
- PDF attachment (ticket + receipt)
- Download button
- QR code for event entrance

## 🐛 Not Working?

**Check these:**
- [ ] `.env` file exists in `backend/` folder
- [ ] SMTP_USER and SMTP_PASS are filled in
- [ ] Using App Password (not regular password)
- [ ] 2-Step Verification enabled on Gmail
- [ ] No typos in email address

**View logs:**
```bash
python app.py
# Watch for: "[email] Sent event registration email to..."
```

## 📚 Full Documentation

See `EMAIL_SETUP_GUIDE.md` for:
- Alternative email providers
- Troubleshooting guide
- Production deployment
- Security best practices

---

**Need help?** Check the full guide or contact support.
