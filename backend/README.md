# BU Alumni Portal — Python Backend

A full-featured Flask backend for the BU Alumni Portal.

## Stack
- **Python 3.10+** · Flask 3 · flask-cors
- **SQLite** — single-file database (`data/bu_alumni.db`)
- **bcrypt** — password hashing
- **PyJWT** — JSON Web Tokens (7-day expiry)
- **ReportLab + qrcode** — PDF ticket generation with QR codes
- **smtplib** — email delivery (HTML + PDF attachments)

## Quick start

```bash
# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your SMTP credentials and JWT secret

# 4. Run the server
python app.py
# → http://localhost:5000
```

The SQLite database is created automatically on first run at `data/bu_alumni.db`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stats` | Read alumni stats |
| POST | `/api/stats` | Update alumni stats |
| POST | `/api/register-account` | Create account (sign up) |
| POST | `/api/login-account` | Sign in, returns JWT |
| POST | `/api/register-member` | Membership registration |
| POST | `/api/register-event` | Event registration + PDF ticket |
| GET | `/api/ticket/<id>` | Download PDF ticket |
| POST | `/api/post-job` | Post a job opportunity |
| POST | `/api/momo-prompt` | Mobile Money payment prompt |
| POST | `/api/register-donation` | Donation submission |
| POST | `/api/community/post` | Create community post |
| POST | `/api/community/like` | Toggle like on post |
| POST | `/api/community/comment` | Add comment to post |
| GET | `/api/community/posts` | List posts (paginated) |
| GET | `/<any>` | Serve static portal files |

## Authentication

Sign-up and login return a JWT token:
```json
{ "token": "eyJ...", "account": { "id": "ACC-...", "email": "...", ... } }
```

Include the token in subsequent requests:
```
Authorization: Bearer <token>
```

## File structure

```
backend/
  app.py            ← Flask application (all endpoints)
  database.py       ← SQLite schema + CRUD helpers
  email_sender.py   ← SMTP email with HTML + PDF attachments
  pdf_generator.py  ← ReportLab PDF ticket + receipt generator
  utils.py          ← ID generation, validation, bcrypt helpers
  requirements.txt  ← Python dependencies
  .env.example      ← Environment variable template
  data/
    bu_alumni.db    ← SQLite database (auto-created)
    tickets/        ← Generated PDF tickets
```

## Production notes

- Set `debug=False` in `app.run()` for production
- Use a WSGI server: `gunicorn -w 4 app:app`
- Set a strong `JWT_SECRET` (32+ random bytes)
- Use Gmail App Passwords or a transactional email service (SendGrid, Mailgun)
- Back up `data/bu_alumni.db` regularly
