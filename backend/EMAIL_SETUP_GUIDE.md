# Email Setup Guide - Event Ticket Delivery

## 📧 Overview

The BU Alumni Portal automatically sends event tickets via email when users register for events. The system includes:

- ✅ **PDF Ticket Generation** - Professional ticket with QR code
- ✅ **Email Delivery** - HTML email with PDF attachment
- ✅ **Download Link** - Backup download link in email
- ✅ **Receipt Included** - Combined ticket and receipt in one PDF

## 🚀 Quick Setup

### Step 1: Configure SMTP Settings

1. **Copy the example environment file:**
   ```bash
   cd "BU ALU Portal/backend"
   cp .env.example .env
   ```

2. **Edit `.env` file with your SMTP credentials:**
   ```env
   # Server Configuration
   PORT=5000
   BASE_URL=http://localhost:5000  # Change to your production URL

   # JWT Secret (generate a strong one)
   JWT_SECRET=your-strong-random-secret-here

   # SMTP Configuration (Gmail example)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password-here
   SMTP_FROM_NAME=BU Alumni Portal
   ```

### Step 2: Get Gmail App Password (Recommended)

If using Gmail:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Select **Mail** and **Other (Custom name)**
5. Enter "BU Alumni Portal" as the name
6. Click **Generate**
7. Copy the 16-character password (no spaces)
8. Paste it into `SMTP_PASS` in your `.env` file

### Step 3: Test the Setup

1. **Start the backend server:**
   ```bash
   cd "BU ALU Portal/backend"
   python app.py
   ```

2. **Register for a test event:**
   - Go to http://localhost:5000/events.html
   - Click "Register" on any event
   - Fill in the form with your email
   - Submit the registration

3. **Check your email:**
   - You should receive an email within seconds
   - Email includes:
     - Event details
     - Ticket ID
     - PDF attachment
     - Download link

## 📧 Email Features

### What Gets Sent

When a user registers for an event, they receive:

1. **Professional HTML Email** with:
   - BU Alumni Portal branding
   - Event name, date, time, location
   - Ticket ID
   - Download button
   - Event summary card

2. **PDF Ticket Attachment** containing:
   - QR code for scanning at entrance
   - Ticket ID
   - Attendee details
   - Event information
   - BU Alumni Portal logo

3. **Backup Download Link**:
   - Direct link to download PDF
   - Works even if attachment fails
   - Format: `{BASE_URL}/api/ticket/{ticketId}`

### Email Template Preview

```
┌─────────────────────────────────────┐
│   BU Alumni Portal                  │
│   Event Registration Confirmation   │
├─────────────────────────────────────┤
│                                     │
│ Hi John Doe,                        │
│                                     │
│ You're confirmed for Annual Alumni  │
│ Gala 2026! Your ticket and receipt  │
│ are attached as a PDF.              │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Event: Annual Alumni Gala   │    │
│ │ Date: May 10, 2026          │    │
│ │ Location: Kampala Serena    │    │
│ │ Time: 6:00 PM EAT           │    │
│ │ Ticket: TKT-ABC123          │    │
│ └─────────────────────────────┘    │
│                                     │
│   [Download Ticket & Receipt]       │
│                                     │
│ Questions? Reply to this email or   │
│ write to alumni@bualumni.org        │
│                                     │
└─────────────────────────────────────┘
```

## 🔧 Alternative SMTP Providers

### Using Other Email Services

#### **Outlook/Office 365**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### **Yahoo Mail**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

#### **SendGrid**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### **Mailgun**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

#### **Custom SMTP Server**
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

## 🐛 Troubleshooting

### Email Not Sending

**Check 1: SMTP Credentials**
```bash
# Verify your .env file has correct values
cat backend/.env | grep SMTP
```

**Check 2: Server Logs**
```bash
# Look for email-related errors
python app.py
# Watch for lines like: "[email] Failed to send email: ..."
```

**Check 3: Gmail Security**
- Ensure 2-Step Verification is enabled
- Use App Password, not regular password
- Check [Less Secure Apps](https://myaccount.google.com/lesssecureapps) (if not using App Password)

**Check 4: Firewall/Network**
```bash
# Test SMTP connection
telnet smtp.gmail.com 587
# Should connect successfully
```

### Common Errors

#### "SMTP credentials not configured"
- **Cause**: `.env` file missing or SMTP_USER/SMTP_PASS empty
- **Fix**: Create `.env` file and add credentials

#### "Authentication failed"
- **Cause**: Wrong password or App Password not used
- **Fix**: Generate new App Password from Google Account

#### "Connection refused"
- **Cause**: Wrong SMTP_HOST or SMTP_PORT
- **Fix**: Verify provider's SMTP settings

#### "Recipient address rejected"
- **Cause**: Invalid email address format
- **Fix**: Check email validation in form

## 📊 Email Delivery Status

### How to Check if Email Was Sent

The API response includes an `emailSent` field:

```json
{
  "success": true,
  "ticketId": "TKT-ABC123",
  "downloadUrl": "http://localhost:5000/api/ticket/TKT-ABC123",
  "emailSent": true,  // ← Check this
  "message": "Registration confirmed..."
}
```

### Backend Logs

Monitor the console for email status:

```
[2026-04-29 15:30:45] INFO — [register-event] TKT-ABC123 — user@example.com for 'Annual Alumni Gala 2026'
[2026-04-29 15:30:46] INFO — [email] Sent event registration email to user@example.com
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use App Passwords** - Not your main account password
3. **Rotate credentials** - Change passwords periodically
4. **Limit permissions** - Use dedicated email account
5. **Monitor usage** - Check for unusual activity

## 🚀 Production Deployment

### Environment Variables

For production, set environment variables directly (not `.env` file):

**Heroku:**
```bash
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password
heroku config:set BASE_URL=https://your-app.herokuapp.com
```

**Vercel/Netlify:**
- Add environment variables in dashboard
- Set `BASE_URL` to your production domain

**Docker:**
```bash
docker run -e SMTP_HOST=smtp.gmail.com \
           -e SMTP_PORT=587 \
           -e SMTP_USER=your-email@gmail.com \
           -e SMTP_PASS=your-app-password \
           -e BASE_URL=https://yourdomain.com \
           your-image
```

## 📝 Testing Checklist

- [ ] `.env` file created with SMTP credentials
- [ ] Backend server starts without errors
- [ ] Event registration form submits successfully
- [ ] Email received within 30 seconds
- [ ] PDF attachment opens correctly
- [ ] Download link works
- [ ] QR code is visible in PDF
- [ ] Event details are correct
- [ ] Ticket ID matches registration

## 🎯 Next Steps

1. **Configure SMTP** - Follow Step 1 & 2 above
2. **Test locally** - Register for a test event
3. **Verify email** - Check inbox and PDF
4. **Deploy to production** - Set environment variables
5. **Monitor logs** - Watch for email delivery issues

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs for error messages
3. Verify SMTP credentials are correct
4. Test with a different email provider
5. Contact support at alumni@bualumni.org

---

**Status**: ✅ Email system fully implemented and ready to use
**Last Updated**: April 29, 2026
**Version**: 1.0
