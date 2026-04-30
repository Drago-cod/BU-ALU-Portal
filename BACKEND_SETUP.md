# Backend Setup Guide

This guide will help you set up and run the BU Alumni Portal backend to enable full functionality including email notifications, PDF ticket generation, and database storage.

## Prerequisites

- **Python 3.10 or higher** installed on your system
- **pip** (Python package manager)
- **Gmail account** (or other SMTP email service) for sending emails

## Step 1: Install Python Dependencies

Open a terminal in the `BU ALU Portal/backend` directory and run:

```bash
cd "BU ALU Portal/backend"
pip install -r requirements.txt
```

This will install all required Python packages:
- Flask (web framework)
- flask-cors (CORS support)
- bcrypt (password hashing)
- PyJWT (authentication tokens)
- ReportLab (PDF generation)
- qrcode (QR code generation)
- python-dotenv (environment variables)

## Step 2: Configure Email Settings

### Option A: Using Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your OS)
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Create `.env` file**:
   ```bash
   cd "BU ALU Portal/backend"
   copy .env.example .env
   ```

4. **Edit `.env` file** with your settings:
   ```env
   # Server Configuration
   PORT=5000
   BASE_URL=http://localhost:5000

   # JWT Secret (generate a random string)
   JWT_SECRET=your-super-secret-random-string-here-change-this

   # Gmail SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM_NAME=BU Alumni Portal
   ```

### Option B: Using Other Email Services

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Yahoo Mail:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

## Step 3: Generate a Strong JWT Secret

Run this command to generate a secure JWT secret:

**Windows (PowerShell):**
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

**Windows (Command Prompt):**
```cmd
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste it as your `JWT_SECRET` in the `.env` file.

## Step 4: Start the Backend Server

### Option 1: Using the Batch File (Windows)

Double-click `start-backend.bat` in the `BU ALU Portal` folder, or run:

```bash
cd "BU ALU Portal"
start-backend.bat
```

### Option 2: Manual Start

```bash
cd "BU ALU Portal/backend"
python app.py
```

You should see:
```
[2026-04-30 10:00:00] INFO — [app] Starting BU Alumni Portal backend on port 5000
 * Running on http://0.0.0.0:5000
```

## Step 5: Start the Frontend Server

Open a **new terminal** and run:

```bash
cd "BU ALU Portal"
node server.js
```

You should see:
```
Server running at http://localhost:3000
```

## Step 6: Test the System

1. **Open your browser** and go to: http://localhost:3000

2. **Test Event Registration**:
   - Go to Events page
   - Click "Register" on any event
   - Fill in the form and submit
   - Check your email for the PDF ticket

3. **Test Donation**:
   - Go to Donate page
   - Fill in the donation form
   - Submit and check your email for the receipt

4. **Test Sign Up**:
   - Go to Sign Up page
   - Create a new account
   - You should be logged in automatically

5. **Test Sign In**:
   - Sign out (if logged in)
   - Go to Sign In page
   - Log in with your credentials

6. **Test Membership**:
   - Go to Memberships page
   - Fill in the membership form
   - Test mobile money payment prompt
   - Check your email for confirmation

## Troubleshooting

### Email Not Sending

**Problem:** Emails are not being sent or you get authentication errors.

**Solutions:**
1. Verify your Gmail App Password is correct (16 characters, no spaces)
2. Make sure 2-Factor Authentication is enabled on your Gmail account
3. Check that `SMTP_USER` matches your Gmail address exactly
4. Try generating a new App Password
5. Check the backend terminal for error messages

### Backend Won't Start

**Problem:** `ModuleNotFoundError` or import errors.

**Solution:**
```bash
cd "BU ALU Portal/backend"
pip install -r requirements.txt --upgrade
```

### Port Already in Use

**Problem:** `Address already in use` error.

**Solution:**
- Change the `PORT` in `.env` to a different number (e.g., 5001)
- Or kill the process using port 5000:

**Windows:**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### CORS Errors

**Problem:** Browser shows CORS policy errors.

**Solution:**
- Make sure the backend is running on port 5000
- Make sure the frontend is running on port 3000
- Check that `flask-cors` is installed: `pip install flask-cors`

### Database Errors

**Problem:** SQLite database errors.

**Solution:**
- Delete `backend/data/bu_alumni.db` and restart the backend
- The database will be recreated automatically

## File Structure

```
BU ALU Portal/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── database.py            # SQLite database management
│   ├── email_sender.py        # Email sending functionality
│   ├── pdf_generator.py       # PDF ticket/receipt generation
│   ├── utils.py               # Helper functions
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Environment variables template
│   ├── .env                   # Your configuration (create this)
│   └── data/
│       ├── bu_alumni.db       # SQLite database (auto-created)
│       └── tickets/           # Generated PDF tickets
├── api-client.js              # Frontend API client
├── server.js                  # Frontend Node.js server
├── start-backend.bat          # Windows batch file to start backend
└── [HTML files]               # Frontend pages

```

## API Endpoints

The backend provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/register-account` | POST | Create new account (sign up) |
| `/api/login-account` | POST | Sign in and get JWT token |
| `/api/register-member` | POST | Register membership |
| `/api/register-event` | POST | Register for event + send ticket |
| `/api/register-donation` | POST | Submit donation + send receipt |
| `/api/momo-prompt` | POST | Mobile money payment prompt |
| `/api/ticket/<id>` | GET | Download PDF ticket |
| `/api/stats` | GET | Get alumni statistics |

## Email Templates

The backend sends these emails:

1. **Event Registration**: Includes PDF ticket with QR code
2. **Donation Receipt**: Thank you message with donation details
3. **Membership Confirmation**: Welcome message with member ID

## Security Notes

- **Never commit `.env` file** to version control
- Use a **strong JWT secret** (32+ characters)
- For production, use a **proper email service** (SendGrid, Mailgun, etc.)
- Enable **HTTPS** in production
- Set `debug=False` in `app.py` for production

## Production Deployment

For production deployment:

1. Use a production WSGI server:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. Use environment variables for all secrets
3. Set up proper database backups
4. Use a transactional email service
5. Enable HTTPS with SSL certificates
6. Set up monitoring and logging

## Support

For issues or questions:
- Check the backend terminal for error messages
- Review the `backend/README.md` file
- Check email configuration in `.env`
- Verify all dependencies are installed

## Next Steps

Once the backend is running:
1. Test all forms (events, donations, memberships, sign up/in)
2. Check your email for notifications
3. Verify PDF tickets are generated
4. Test mobile money payment prompts
5. Customize email templates in `backend/email_sender.py`
6. Customize PDF designs in `backend/pdf_generator.py`

---

**Congratulations!** Your BU Alumni Portal is now fully functional with backend integration.
