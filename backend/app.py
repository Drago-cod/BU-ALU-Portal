"""
BU Alumni Portal — Flask Backend
Mirrors all functionality from the Node.js server.js using Python,
SQLite (via database.py), JWT auth, and the existing email/PDF modules.
"""

import logging
import os
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS

import jwt
from datetime import datetime, timedelta

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=None)
CORS(app)

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent          # backend/
PORTAL_DIR = BASE_DIR.parent               # BU ALU Portal/
TICKETS_DIR = BASE_DIR / "data" / "tickets"
CERTIFICATES_DIR = BASE_DIR / "data" / "certificates"
DONATION_LETTERS_DIR = BASE_DIR / "data" / "donation_letters"
for directory in (TICKETS_DIR, CERTIFICATES_DIR, DONATION_LETTERS_DIR):
    directory.mkdir(parents=True, exist_ok=True)

BASE_URL   = os.getenv("BASE_URL", "http://localhost:5000").rstrip("/")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")

# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_token(account_id: str, email: str) -> str:
    payload = {
        "sub":   account_id,
        "email": email,
        "exp":   datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None


# ── Lazy imports (database / utils / email / pdf) ─────────────────────────────
# Imported inside each route so that init_db() is called before any DB access.

# ── Static file serving ───────────────────────────────────────────────────────

@app.route("/")
def serve_index():
    return send_from_directory(str(PORTAL_DIR), "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    # Prevent path traversal outside PORTAL_DIR
    target = (PORTAL_DIR / filename).resolve()
    if not str(target).startswith(str(PORTAL_DIR.resolve())):
        return jsonify({"error": "Forbidden"}), 403
    if target.is_file():
        return send_from_directory(str(PORTAL_DIR), filename)
    return jsonify({"error": "Not found"}), 404


# ── 1. GET /api/stats ─────────────────────────────────────────────────────────

@app.route("/api/stats", methods=["GET"])
def get_stats():
    try:
        import database
        stats = database.get_stats()
        return jsonify(stats), 200
    except Exception as exc:
        logger.error("[stats GET] %s", exc)
        return jsonify({"error": "Failed to read stats."}), 500


# ── 2. POST /api/stats ────────────────────────────────────────────────────────

@app.route("/api/stats", methods=["POST"])
def update_stats():
    try:
        import database
        body = request.get_json(force=True) or {}
        fields = ["alumniMembers", "jobsThisYear", "activeChapters", "mentorshipConnections"]
        data = {}
        for f in fields:
            val = body.get(f)
            if val is None:
                continue
            try:
                num = int(val)
            except (TypeError, ValueError):
                return jsonify({"error": f"'{f}' must be a non-negative integer."}), 400
            if num < 0:
                return jsonify({"error": f"'{f}' must be non-negative."}), 400
            data[f] = num
        updated = database.update_stats(data)
        return jsonify(updated), 200
    except Exception as exc:
        logger.error("[stats POST] %s", exc)
        return jsonify({"error": "Failed to update stats."}), 500


# ── 3. POST /api/register-account ────────────────────────────────────────────

@app.route("/api/register-account", methods=["POST"])
def register_account():
    try:
        import database
        import utils

        body = request.get_json(force=True) or {}
        email    = utils.sanitize(body.get("email", "")).lower()
        password = body.get("password", "")
        full_name = utils.sanitize(body.get("fullName", ""))

        if not email or not password or not full_name:
            return jsonify({"error": "email, password, and fullName are required."}), 400
        if not utils.validate_email(email):
            return jsonify({"error": "Invalid email address."}), 400

        # Check for duplicate
        existing = database.get_account_by_email(email)
        if existing:
            return jsonify({"error": "An account with this email already exists."}), 409

        account_id    = utils.generate_account_id()
        password_hash = utils.hash_password(password)

        account_data = {
            "id":              account_id,
            "email":           email,
            "password_hash":   password_hash,
            "fullName":        full_name,
            "accountType":     utils.sanitize(body.get("accountType", "Alumni")),
            "profession":      utils.sanitize(body.get("profession", "")),
            "program":         utils.sanitize(body.get("program", "")),
            "graduationYear":  utils.sanitize(body.get("graduationYear", "")),
            "serviceInterest": utils.sanitize(body.get("serviceInterest", "")),
            "paymentMethod":   utils.sanitize(body.get("paymentMethod", "")),
            "paymentStatus":   "pending",
            "createdAt":       utils.now_iso(),
        }

        account = database.create_account(account_data)
        token   = create_token(account_id, email)

        # Strip password_hash from response
        safe_account = {k: v for k, v in account.items() if k != "password_hash"}
        logger.info("[register-account] New account: %s (%s)", account_id, email)
        return jsonify({"token": token, "account": safe_account}), 201

    except Exception as exc:
        logger.error("[register-account] %s", exc)
        return jsonify({"error": "Failed to create account. Please try again."}), 500


# ── 4. POST /api/login-account ────────────────────────────────────────────────

@app.route("/api/login-account", methods=["POST"])
def login_account():
    try:
        import database
        import utils

        body     = request.get_json(force=True) or {}
        email    = utils.sanitize(body.get("email", "")).lower()
        password = body.get("password", "")

        if not email or not password:
            return jsonify({"error": "email and password are required."}), 400

        account = database.get_account_by_email(email)
        if not account:
            return jsonify({"error": "Invalid email or password."}), 401

        if not utils.check_password(password, account.get("password_hash", "")):
            return jsonify({"error": "Invalid email or password."}), 401

        token = create_token(account["id"], email)
        safe_account = {k: v for k, v in account.items() if k != "password_hash"}
        logger.info("[login-account] Login: %s", email)
        return jsonify({"token": token, "account": safe_account}), 200

    except Exception as exc:
        logger.error("[login-account] %s", exc)
        return jsonify({"error": "Login failed. Please try again."}), 500


# ── 5. POST /api/register-member ─────────────────────────────────────────────

@app.route("/api/register-member", methods=["POST"])
def register_member():
    try:
        import database
        import utils
        import email_sender
        import pdf_generator

        body = request.get_json(force=True) or {}
        full_name       = utils.sanitize(body.get("fullName", ""))
        email           = utils.sanitize(body.get("email", "")).lower()
        phone           = utils.sanitize(body.get("phone", ""))
        profession      = utils.sanitize(body.get("profession", ""))
        location        = utils.sanitize(body.get("location", ""))
        membership_type = utils.sanitize(body.get("membershipType", "Standard"))
        payment_method  = utils.sanitize(body.get("paymentMethod", ""))
        momo_phone      = utils.sanitize(body.get("momoPhone", ""))

        if not full_name or not email or not phone or not profession:
            return jsonify({"error": "fullName, email, phone, and profession are required."}), 400
        if not utils.validate_email(email):
            return jsonify({"error": "Invalid email address."}), 400

        member_id = utils.generate_member_id()
        member_data = {
            "id":              member_id,
            "fullName":        full_name,
            "email":           email,
            "phone":           phone,
            "profession":      profession,
            "location":        location,
            "membershipType":  membership_type,
            "paymentMethod":   payment_method,
            "momoPhone":       momo_phone,
            "registrationFee": "UGX 10,000",
            "registeredAt":    utils.now_iso(),
        }

        database.create_member(member_data)

        email_data = {
            "fullName":       full_name,
            "email":          email,
            "memberId":       member_id,
            "membershipType": membership_type,
            "profession":     profession,
            "location":       location,
            "paymentMethod":  payment_method,
            "registrationFee": "UGX 10,000",
            "registeredAt":   member_data["registeredAt"],
        }

        logo_path = str(PORTAL_DIR / "image" / "Bugema_logo.png")
        certificate_bytes = pdf_generator.generate_membership_certificate_pdf(
            email_data,
            logo_path=logo_path if Path(logo_path).exists() else None,
        )
        certificate_path = CERTIFICATES_DIR / f"{member_id}.pdf"
        certificate_path.write_bytes(certificate_bytes)

        email_sent = email_sender.send_membership_confirmation_email(
            email_data,
            certificate_bytes,
            BASE_URL,
        )
        certificate_url = f"{BASE_URL}/api/member-certificate/{member_id}"

        logger.info("[register-member] %s — %s", member_id, email)
        return jsonify({
            "success":        True,
            "memberId":       member_id,
            "certificateUrl": certificate_url,
            "emailSent":      email_sent,
            "message":        f"Membership registered successfully (ID: {member_id}). Your certificate has been emailed to {email}.",
        }), 201

    except Exception as exc:
        logger.error("[register-member] %s", exc)
        return jsonify({"error": "Failed to register membership. Please try again."}), 500


# ── 6. POST /api/register-event ──────────────────────────────────────────────

@app.route("/api/register-event", methods=["POST"])
def register_event():
    try:
        import database
        import utils
        import email_sender
        import pdf_generator

        body = request.get_json(force=True) or {}
        full_name      = utils.sanitize(body.get("fullName", ""))
        email          = utils.sanitize(body.get("email", "")).lower()
        phone          = utils.sanitize(body.get("phone", ""))
        event_name     = utils.sanitize(body.get("eventName", ""))
        event_date     = utils.sanitize(body.get("eventDate", ""))
        event_location = utils.sanitize(body.get("eventLocation", ""))
        event_time     = utils.sanitize(body.get("eventTime", ""))

        if not full_name or not email or not phone or not event_name:
            return jsonify({"error": "fullName, email, phone, and eventName are required."}), 400
        if not utils.validate_email(email):
            return jsonify({"error": "Invalid email address."}), 400

        ticket_id = utils.generate_ticket_id()

        # Build PDF
        logo_path = str(PORTAL_DIR / "image" / "Bugema_logo.png")
        pdf_data = {
            "ticketId":      ticket_id,
            "fullName":      full_name,
            "email":         email,
            "phone":         phone,
            "eventName":     event_name,
            "eventDate":     event_date,
            "eventLocation": event_location,
            "eventTime":     event_time,
        }
        pdf_bytes = pdf_generator.generate_ticket_pdf(
            pdf_data,
            logo_path=logo_path if Path(logo_path).exists() else None,
            base_url=BASE_URL,
        )

        # Save PDF to disk
        ticket_path = TICKETS_DIR / f"{ticket_id}.pdf"
        ticket_path.write_bytes(pdf_bytes)

        # Persist registration
        reg_data = {
            "id":            ticket_id,
            "fullName":      full_name,
            "email":         email,
            "phone":         phone,
            "eventName":     event_name,
            "eventDate":     event_date,
            "eventLocation": event_location,
            "eventTime":     event_time,
            "registeredAt":  utils.now_iso(),
        }
        database.create_event_registration(reg_data)

        # Send email
        email_data = {**pdf_data}
        email_sent = email_sender.send_event_registration_email(
            email_data, pdf_bytes, BASE_URL
        )

        download_url = f"{BASE_URL}/api/ticket/{ticket_id}"
        logger.info("[register-event] %s — %s for '%s'", ticket_id, email, event_name)
        return jsonify({
            "success":     True,
            "ticketId":    ticket_id,
            "downloadUrl": download_url,
            "emailSent":   email_sent,
            "message":     f"Registration confirmed (Ticket: {ticket_id}). Check your email for the PDF ticket.",
        }), 201

    except Exception as exc:
        logger.error("[register-event] %s", exc)
        return jsonify({"error": "Failed to register for event. Please try again."}), 500


# ── 7. GET /api/ticket/<ticketId> ─────────────────────────────────────────────

@app.route("/api/ticket/<ticket_id>", methods=["GET"])
def download_ticket(ticket_id):
    try:
        # Sanitise ticket_id — only allow alphanumeric and hyphens
        safe_id = "".join(c for c in ticket_id if c.isalnum() or c == "-")
        ticket_path = TICKETS_DIR / f"{safe_id}.pdf"

        if not ticket_path.exists():
            return jsonify({"error": "Ticket not found."}), 404

        return send_file(
            str(ticket_path),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"BU-Ticket-{safe_id}.pdf",
        )
    except Exception as exc:
        logger.error("[ticket] %s", exc)
        return jsonify({"error": "Failed to retrieve ticket."}), 500


# ── 7b. GET /api/member-certificate/<memberId> ───────────────────────────────

@app.route("/api/member-certificate/<member_id>", methods=["GET"])
def download_member_certificate(member_id):
    try:
        safe_id = "".join(c for c in member_id if c.isalnum() or c == "-")
        certificate_path = CERTIFICATES_DIR / f"{safe_id}.pdf"

        if not certificate_path.exists():
            return jsonify({"error": "Membership certificate not found."}), 404

        return send_file(
            str(certificate_path),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"BU-Membership-Certificate-{safe_id}.pdf",
        )
    except Exception as exc:
        logger.error("[member-certificate] %s", exc)
        return jsonify({"error": "Failed to retrieve membership certificate."}), 500


# ── 8. POST /api/post-job ─────────────────────────────────────────────────────

@app.route("/api/post-job", methods=["POST"])
def post_job():
    try:
        import database
        import utils

        body = request.get_json(force=True) or {}
        title         = utils.sanitize(body.get("title", ""))
        company       = utils.sanitize(body.get("company", ""))
        job_type      = utils.sanitize(body.get("type", ""))
        location      = utils.sanitize(body.get("location", ""))
        salary        = utils.sanitize(body.get("salary", ""))
        deadline      = utils.sanitize(body.get("deadline", ""))
        description   = utils.sanitize(body.get("description", ""))
        requirements  = utils.sanitize(body.get("requirements", ""))
        contact_email = utils.sanitize(body.get("contactEmail", ""))
        website       = utils.sanitize(body.get("website", ""))
        posted_by     = utils.sanitize(body.get("postedBy", "Anonymous"))

        if not title or not company or not job_type or not location or not description or not contact_email:
            return jsonify({
                "error": "title, company, type, location, description, and contactEmail are required."
            }), 400
        if not utils.validate_email(contact_email):
            return jsonify({"error": "Invalid contact email address."}), 400

        job_id = utils.generate_job_id()
        job_data = {
            "id":           job_id,
            "title":        title,
            "company":      company,
            "type":         job_type,
            "location":     location,
            "salary":       salary,
            "deadline":     deadline,
            "description":  description,
            "requirements": requirements,
            "contactEmail": contact_email,
            "website":      website,
            "postedBy":     posted_by,
            "status":       "pending_review",
            "postedAt":     utils.now_iso(),
        }
        database.create_job(job_data)

        logger.info("[post-job] %s — '%s' by %s", job_id, title, company)
        return jsonify({
            "success": True,
            "jobId":   job_id,
            "message": f'Job "{title}" posted successfully (ID: {job_id}). It will appear on the board after review.',
        }), 201

    except Exception as exc:
        logger.error("[post-job] %s", exc)
        return jsonify({"error": "Failed to post job. Please try again."}), 500


# ── 9. POST /api/momo-prompt ──────────────────────────────────────────────────

@app.route("/api/momo-prompt", methods=["POST"])
def momo_prompt():
    try:
        import database
        import utils

        body     = request.get_json(force=True) or {}
        provider = utils.sanitize(body.get("provider", "")).lower()
        phone    = utils.sanitize(body.get("phone", ""))
        amount   = float(body.get("amount", 10000) or 10000)
        currency = utils.sanitize(body.get("currency", "UGX")) or "UGX"
        reference = utils.sanitize(body.get("reference", "BU-ALUMNI")) or "BU-ALUMNI"

        if not phone:
            return jsonify({"success": False, "message": "Phone number is required."}), 400

        # Validate phone prefix
        digits = "".join(c for c in phone if c.isdigit())
        local  = digits[3:] if digits.startswith("256") else digits
        prefix = local[:3]

        MTN_PREFIXES    = {"077", "078", "076", "039"}
        AIRTEL_PREFIXES = {"075", "070", "074"}

        if provider == "mtn" and prefix not in MTN_PREFIXES:
            return jsonify({
                "success": False,
                "message": "Number does not appear to be an MTN Uganda line (077/078/076/039).",
            }), 400
        if provider == "airtel" and prefix not in AIRTEL_PREFIXES:
            return jsonify({
                "success": False,
                "message": "Number does not appear to be an Airtel Uganda line (075/070/074).",
            }), 400

        log_id = utils.generate_log_id()
        log_data = {
            "id":           log_id,
            "provider":     provider,
            "phone":        phone,
            "amount":       amount,
            "currency":     currency,
            "reference":    reference,
            "status":       "prompt_sent",
            "transactionId": None,
            "requestedAt":  utils.now_iso(),
            "confirmedAt":  None,
        }
        database.create_momo_log(log_data)
        logger.info("[momo-prompt] %s — %s %s %s via %s", log_id, currency, amount, phone, provider)

        # Simulate 3-second processing delay
        time.sleep(3)

        # Simulate confirmation
        import secrets
        transaction_id = "TXN-" + secrets.token_hex(6).upper()
        confirmed_at   = utils.now_iso()
        database.update_momo_log(log_id, "confirmed", transaction_id, confirmed_at)

        logger.info("[momo-prompt] Confirmed: %s → %s", log_id, transaction_id)
        return jsonify({
            "success":       True,
            "transactionId": transaction_id,
            "message":       f"Payment of {currency} {amount:,.0f} confirmed from {phone}.",
        }), 200

    except Exception as exc:
        logger.error("[momo-prompt] %s", exc)
        return jsonify({"success": False, "message": "MoMo prompt failed. Please try again."}), 500


# ── 10. POST /api/register-donation ──────────────────────────────────────────

@app.route("/api/register-donation", methods=["POST"])
def register_donation():
    try:
        import database
        import utils
        import email_sender
        import pdf_generator

        body = request.get_json(force=True) or {}
        full_name      = utils.sanitize(body.get("fullName", ""))
        email          = utils.sanitize(body.get("email", "")).lower()
        amount         = float(body.get("amount", 0) or 0)
        currency       = utils.sanitize(body.get("currency", "UGX")) or "UGX"
        payment_method = utils.sanitize(body.get("paymentMethod", ""))
        momo_phone     = utils.sanitize(body.get("momoPhone", ""))
        message        = utils.sanitize(body.get("message", ""))

        if not full_name or not email or not amount or not payment_method:
            return jsonify({"error": "fullName, email, amount, and paymentMethod are required."}), 400
        if not utils.validate_email(email):
            return jsonify({"error": "Invalid email address."}), 400
        if amount <= 0:
            return jsonify({"error": "Donation amount must be greater than zero."}), 400

        donation_id = utils.generate_donation_id()
        donation_data = {
            "id":            donation_id,
            "fullName":      full_name,
            "email":         email,
            "amount":        amount,
            "currency":      currency,
            "paymentMethod": payment_method,
            "momoPhone":     momo_phone,
            "message":       message,
            "status":        "pending",
            "donatedAt":     utils.now_iso(),
        }
        database.create_donation(donation_data)

        email_data = {
            "fullName":      full_name,
            "email":         email,
            "donationId":    donation_id,
            "amount":        amount,
            "currency":      currency,
            "paymentMethod": payment_method,
            "message":       message,
            "donatedAt":     donation_data["donatedAt"],
        }

        logo_path = str(PORTAL_DIR / "image" / "Bugema_logo.png")
        letter_bytes = pdf_generator.generate_donation_appreciation_pdf(
            email_data,
            logo_path=logo_path if Path(logo_path).exists() else None,
        )
        letter_path = DONATION_LETTERS_DIR / f"{donation_id}.pdf"
        letter_path.write_bytes(letter_bytes)

        email_sent = email_sender.send_donation_receipt_email(
            email_data,
            letter_bytes,
            BASE_URL,
        )
        letter_url = f"{BASE_URL}/api/donation-letter/{donation_id}"

        logger.info("[register-donation] %s — %s %s from %s", donation_id, currency, amount, email)
        return jsonify({
            "success":   True,
            "donationId": donation_id,
            "letterUrl":  letter_url,
            "emailSent":  email_sent,
            "message":    f"Thank you for your donation (ID: {donation_id}). An appreciation letter has been sent to {email}.",
        }), 201

    except Exception as exc:
        logger.error("[register-donation] %s", exc)
        return jsonify({"error": "Failed to process donation. Please try again."}), 500


# ── 10b. GET /api/donation-letter/<donationId> ───────────────────────────────

@app.route("/api/donation-letter/<donation_id>", methods=["GET"])
def download_donation_letter(donation_id):
    try:
        safe_id = "".join(c for c in donation_id if c.isalnum() or c == "-")
        letter_path = DONATION_LETTERS_DIR / f"{safe_id}.pdf"

        if not letter_path.exists():
            return jsonify({"error": "Donation appreciation letter not found."}), 404

        return send_file(
            str(letter_path),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"BU-Donation-Appreciation-{safe_id}.pdf",
        )
    except Exception as exc:
        logger.error("[donation-letter] %s", exc)
        return jsonify({"error": "Failed to retrieve donation appreciation letter."}), 500


# ── 11. POST /api/community/post ─────────────────────────────────────────────

@app.route("/api/community/post", methods=["POST"])
def community_post():
    try:
        import database
        import utils

        body = request.get_json(force=True) or {}
        author_name = utils.sanitize(body.get("authorName", ""))
        profession  = utils.sanitize(body.get("profession", ""))
        content     = utils.sanitize(body.get("content", ""))
        post_type   = utils.sanitize(body.get("postType", "update"))
        badge       = utils.sanitize(body.get("badge", ""))
        link_url    = utils.sanitize(body.get("linkUrl", ""))
        link_text   = utils.sanitize(body.get("linkText", ""))

        if not author_name or not content:
            return jsonify({"error": "authorName and content are required."}), 400

        post_id = utils.generate_post_id()
        post_data = {
            "id":         post_id,
            "authorName": author_name,
            "profession": profession,
            "content":    content,
            "postType":   post_type,
            "badge":      badge,
            "linkUrl":    link_url,
            "linkText":   link_text,
            "createdAt":  utils.now_iso(),
        }
        post = database.create_post(post_data)

        logger.info("[community/post] %s by %s", post_id, author_name)
        return jsonify({"success": True, "postId": post_id, "post": post}), 201

    except Exception as exc:
        logger.error("[community/post] %s", exc)
        return jsonify({"error": "Failed to create post. Please try again."}), 500


# ── 12. POST /api/community/like ─────────────────────────────────────────────

@app.route("/api/community/like", methods=["POST"])
def community_like():
    try:
        import database

        body       = request.get_json(force=True) or {}
        post_id    = (body.get("postId") or "").strip()
        user_email = (body.get("userEmail") or "").strip().lower()

        if not post_id or not user_email:
            return jsonify({"error": "postId and userEmail are required."}), 400

        result = database.toggle_like(post_id, user_email)
        return jsonify({"success": True, **result}), 200

    except Exception as exc:
        logger.error("[community/like] %s", exc)
        return jsonify({"error": "Failed to toggle like. Please try again."}), 500


# ── 13. POST /api/community/comment ──────────────────────────────────────────

@app.route("/api/community/comment", methods=["POST"])
def community_comment():
    try:
        import database
        import utils

        body        = request.get_json(force=True) or {}
        post_id     = (body.get("postId") or "").strip()
        author_name = utils.sanitize(body.get("authorName", ""))
        content     = utils.sanitize(body.get("content", ""))

        if not post_id or not author_name or not content:
            return jsonify({"error": "postId, authorName, and content are required."}), 400

        comment_id = utils.generate_id("CMT", 8)
        comment_data = {
            "id":         comment_id,
            "postId":     post_id,
            "authorName": author_name,
            "content":    content,
            "createdAt":  utils.now_iso(),
        }
        comment = database.create_comment(comment_data)

        logger.info("[community/comment] %s on post %s", comment_id, post_id)
        return jsonify({"success": True, "commentId": comment_id, "comment": comment}), 201

    except Exception as exc:
        logger.error("[community/comment] %s", exc)
        return jsonify({"error": "Failed to add comment. Please try again."}), 500


# ── 14. GET /api/community/posts ─────────────────────────────────────────────

@app.route("/api/community/posts", methods=["GET"])
def community_posts():
    try:
        import database

        limit  = int(request.args.get("limit",  20))
        offset = int(request.args.get("offset",  0))

        # Clamp to sane values
        limit  = max(1, min(limit,  100))
        offset = max(0, offset)

        posts = database.list_posts(limit=limit, offset=offset)
        for post in posts:
            post["comments"] = database.list_comments(post["id"])

        return jsonify({"success": True, "posts": posts}), 200

    except Exception as exc:
        logger.error("[community/posts] %s", exc)
        return jsonify({"error": "Failed to fetch posts. Please try again."}), 500


# ── 15. TASKS API ENDPOINTS ──────────────────────────────────────────────────

# GET /api/tasks — List all active tasks
@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    try:
        import database
        tasks = database.list_tasks(status="active")
        return jsonify({"success": True, "tasks": tasks}), 200
    except Exception as exc:
        logger.error("[tasks GET] %s", exc)
        return jsonify({"error": "Failed to fetch tasks."}), 500


# POST /api/tasks — Create a new task (Admin only)
@app.route("/api/tasks", methods=["POST"])
def create_task():
    try:
        import database
        import utils

        body = request.get_json(force=True) or {}
        title = utils.sanitize(body.get("title", ""))
        description = utils.sanitize(body.get("description", ""))
        category = utils.sanitize(body.get("category", ""))
        duration_hours = int(body.get("durationHours", 0))
        points = int(body.get("points", 0))
        certificate = body.get("certificate", True)
        requires_feedback = body.get("requiresFeedback", True)

        if not title or not description or not category:
            return jsonify({"error": "title, description, and category are required."}), 400

        task_id = utils.generate_id("TSK")
        task_data = {
            "id": task_id,
            "title": title,
            "description": description,
            "category": category,
            "durationHours": duration_hours,
            "points": points,
            "certificate": certificate,
            "requiresFeedback": requires_feedback,
            "status": "active",
            "createdAt": utils.now_iso(),
            "updatedAt": utils.now_iso(),
        }
        task = database.create_task(task_data)

        logger.info("[tasks POST] %s — '%s'", task_id, title)
        return jsonify({"success": True, "taskId": task_id, "task": task}), 201

    except Exception as exc:
        logger.error("[tasks POST] %s", exc)
        return jsonify({"error": "Failed to create task."}), 500


# GET /api/tasks/<taskId> — Get task details
@app.route("/api/tasks/<task_id>", methods=["GET"])
def get_task(task_id):
    try:
        import database
        safe_id = "".join(c for c in task_id if c.isalnum() or c == "-")
        task = database.get_task_by_id(safe_id)
        if not task:
            return jsonify({"error": "Task not found."}), 404
        return jsonify({"success": True, "task": task}), 200
    except Exception as exc:
        logger.error("[task GET] %s", exc)
        return jsonify({"error": "Failed to fetch task."}), 500


# POST /api/tasks/<taskId>/register — Register for a task
@app.route("/api/tasks/<task_id>/register", methods=["POST"])
def register_task(task_id):
    try:
        import database
        import utils

        body = request.get_json(force=True) or {}
        user_email = utils.sanitize(body.get("userEmail", "")).lower()
        full_name = utils.sanitize(body.get("fullName", ""))
        phone = utils.sanitize(body.get("phone", ""))

        if not user_email or not full_name:
            return jsonify({"error": "userEmail and fullName are required."}), 400
        if not utils.validate_email(user_email):
            return jsonify({"error": "Invalid email address."}), 400

        safe_task_id = "".join(c for c in task_id if c.isalnum() or c == "-")
        task = database.get_task_by_id(safe_task_id)
        if not task:
            return jsonify({"error": "Task not found."}), 404

        reg_id = utils.generate_id("REG")
        reg_data = {
            "id": reg_id,
            "taskId": safe_task_id,
            "userEmail": user_email,
            "fullName": full_name,
            "phone": phone,
            "registeredAt": utils.now_iso(),
        }
        registration = database.register_task(reg_data)

        logger.info("[register-task] %s — %s registered for %s", reg_id, user_email, safe_task_id)
        return jsonify({
            "success": True,
            "registrationId": reg_id,
            "registration": registration,
            "message": f"Successfully registered for {task['title']}",
        }), 201

    except Exception as exc:
        logger.error("[register-task] %s", exc)
        return jsonify({"error": "Failed to register for task."}), 500


# POST /api/task-completion — Complete a task
@app.route("/api/task-completion", methods=["POST"])
def complete_task_endpoint():
    try:
        import database
        import utils
        import pdf_generator

        body = request.get_json(force=True) or {}
        task_id = utils.sanitize(body.get("taskId", ""))
        registration_id = utils.sanitize(body.get("registrationId", ""))
        user_email = utils.sanitize(body.get("userEmail", "")).lower()
        full_name = utils.sanitize(body.get("fullName", ""))
        completion_hours = float(body.get("completionHours", 0))

        if not task_id or not registration_id or not user_email or not full_name:
            return jsonify({"error": "taskId, registrationId, userEmail, and fullName are required."}), 400

        # Verify task and registration exist
        task = database.get_task_by_id(task_id)
        if not task:
            return jsonify({"error": "Task not found."}), 404

        reg = database.get_task_registration(registration_id)
        if not reg:
            return jsonify({"error": "Registration not found."}), 404

        # Create completion record
        completion_id = utils.generate_id("COMP")
        completion_data = {
            "id": completion_id,
            "taskId": task_id,
            "registrationId": registration_id,
            "userEmail": user_email,
            "fullName": full_name,
            "completionDate": utils.now_iso(),
            "completionHours": completion_hours,
            "pointsEarned": task.get("points", 0),
            "certificateId": "",
            "ticketId": "",
            "receiptId": "",
            "status": "completed",
        }
        completion = database.complete_task(completion_data)

        # Generate Certificate
        cert_id = None
        if task.get("certificate"):
            cert_id = utils.generate_id("CERT")
            cert_number = f"BU-CERT-{cert_id}"
            cert_data = {
                "id": cert_id,
                "completionId": completion_id,
                "taskId": task_id,
                "userEmail": user_email,
                "fullName": full_name,
                "issueDate": utils.now_iso(),
                "certificateNumber": cert_number,
                "filePath": "",
            }

            logo_path = str(PORTAL_DIR / "image" / "Bugema_logo.png")
            cert_pdf = pdf_generator.generate_task_certificate_pdf(
                {
                    **cert_data,
                    "taskTitle": task.get("title", ""),
                    "completionHours": completion_hours,
                },
                logo_path=logo_path if Path(logo_path).exists() else None,
            )
            cert_path = CERTIFICATES_DIR / f"{cert_id}.pdf"
            cert_path.write_bytes(cert_pdf)
            cert_data["filePath"] = str(cert_path)
            database.create_certificate(cert_data)

        # Generate Ticket
        ticket_id = None
        if task.get("category") in ["workshop", "seminar", "conference", "training"]:
            ticket_id = utils.generate_id("TICKET")
            ticket_number = f"BU-TICKET-{ticket_id}"
            ticket_data = {
                "id": ticket_id,
                "completionId": completion_id,
                "taskId": task_id,
                "userEmail": user_email,
                "fullName": full_name,
                "ticketNumber": ticket_number,
                "issueDate": utils.now_iso(),
                "filePath": "",
            }

            logo_path = str(PORTAL_DIR / "image" / "Bugema_logo.png")
            ticket_pdf = pdf_generator.generate_task_ticket_pdf(
                {
                    **ticket_data,
                    "taskTitle": task.get("title", ""),
                },
                logo_path=logo_path if Path(logo_path).exists() else None,
            )
            ticket_path = TICKETS_DIR / f"{ticket_id}.pdf"
            ticket_path.write_bytes(ticket_pdf)
            ticket_data["filePath"] = str(ticket_path)
            database.create_ticket(ticket_data)

        # Generate Receipt
        receipt_id = None
        receipt_amount = float(body.get("receiptAmount", 0))
        if receipt_amount > 0:
            receipt_id = utils.generate_id("RCP")
            receipt_number = f"BU-RECEIPT-{receipt_id}"
            receipt_data = {
                "id": receipt_id,
                "completionId": completion_id,
                "taskId": task_id,
                "userEmail": user_email,
                "fullName": full_name,
                "receiptNumber": receipt_number,
                "issueDate": utils.now_iso(),
                "amount": receipt_amount,
                "currency": "UGX",
                "filePath": "",
            }

            logo_path = str(PORTAL_DIR / "image" / "Bugema_logo.png")
            receipt_pdf = pdf_generator.generate_task_receipt_pdf(
                {
                    **receipt_data,
                    "taskTitle": task.get("title", ""),
                },
                logo_path=logo_path if Path(logo_path).exists() else None,
            )
            receipt_path = DONATION_LETTERS_DIR / f"{receipt_id}.pdf"
            receipt_path.write_bytes(receipt_pdf)
            receipt_data["filePath"] = str(receipt_path)
            database.create_receipt(receipt_data)

        # Update completion with document IDs
        if cert_id or ticket_id or receipt_id:
            update_query = "UPDATE task_completions SET "
            updates = []
            params = []
            if cert_id:
                updates.append("certificate_id=?")
                params.append(cert_id)
            if ticket_id:
                updates.append("ticket_id=?")
                params.append(ticket_id)
            if receipt_id:
                updates.append("receipt_id=?")
                params.append(receipt_id)
            params.append(completion_id)
            if updates:
                from database import get_conn
                with get_conn() as conn:
                    conn.execute(
                        update_query + ", ".join(updates) + " WHERE id=?",
                        params
                    )

        logger.info("[task-completion] %s — %s completed %s", completion_id, user_email, task_id)
        return jsonify({
            "success": True,
            "completionId": completion_id,
            "certificateId": cert_id,
            "ticketId": ticket_id,
            "receiptId": receipt_id,
            "message": "Task completed successfully! Your certificates and documents are ready.",
        }), 201

    except Exception as exc:
        logger.error("[task-completion] %s", exc)
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to complete task."}), 500


# POST /api/task-feedback — Submit feedback for a completed task
@app.route("/api/task-feedback", methods=["POST"])
def submit_task_feedback():
    try:
        import database
        import utils

        body = request.get_json(force=True) or {}
        completion_id = utils.sanitize(body.get("completionId", ""))
        task_id = utils.sanitize(body.get("taskId", ""))
        user_email = utils.sanitize(body.get("userEmail", "")).lower()
        full_name = utils.sanitize(body.get("fullName", ""))
        rating = int(body.get("rating", 0))
        comments = utils.sanitize(body.get("comments", ""))
        would_recommend = body.get("wouldRecommend", False)

        if not completion_id or not task_id or not user_email or not full_name:
            return jsonify({"error": "completionId, taskId, userEmail, and fullName are required."}), 400

        if rating < 1 or rating > 5:
            return jsonify({"error": "rating must be between 1 and 5."}), 400

        # Check if feedback already exists
        existing = database.get_feedback_by_completion(completion_id)
        if existing:
            return jsonify({"error": "Feedback already submitted for this completion."}), 409

        feedback_id = utils.generate_id("FB")
        feedback_data = {
            "id": feedback_id,
            "completionId": completion_id,
            "taskId": task_id,
            "userEmail": user_email,
            "fullName": full_name,
            "rating": rating,
            "comments": comments,
            "wouldRecommend": would_recommend,
            "submittedAt": utils.now_iso(),
        }
        feedback = database.submit_feedback(feedback_data)

        logger.info("[task-feedback] %s — %s gave rating %d", feedback_id, user_email, rating)
        return jsonify({
            "success": True,
            "feedbackId": feedback_id,
            "message": "Thank you for your feedback!",
        }), 201

    except Exception as exc:
        logger.error("[task-feedback] %s", exc)
        return jsonify({"error": "Failed to submit feedback."}), 500


# GET /api/task-certificate/<certId> — Download task certificate
@app.route("/api/task-certificate/<cert_id>", methods=["GET"])
def download_task_certificate(cert_id):
    try:
        safe_id = "".join(c for c in cert_id if c.isalnum() or c == "-")
        cert_path = CERTIFICATES_DIR / f"{safe_id}.pdf"
        if not cert_path.exists():
            return jsonify({"error": "Certificate not found."}), 404
        return send_file(
            str(cert_path),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"BU-Task-Certificate-{safe_id}.pdf",
        )
    except Exception as exc:
        logger.error("[task-certificate] %s", exc)
        return jsonify({"error": "Failed to retrieve certificate."}), 500


# GET /api/task-ticket/<ticketId> — Download task ticket
@app.route("/api/task-ticket/<ticket_id>", methods=["GET"])
def download_task_ticket(ticket_id):
    try:
        safe_id = "".join(c for c in ticket_id if c.isalnum() or c == "-")
        ticket_path = TICKETS_DIR / f"{safe_id}.pdf"
        if not ticket_path.exists():
            return jsonify({"error": "Ticket not found."}), 404
        return send_file(
            str(ticket_path),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"BU-Task-Ticket-{safe_id}.pdf",
        )
    except Exception as exc:
        logger.error("[task-ticket] %s", exc)
        return jsonify({"error": "Failed to retrieve ticket."}), 500


# GET /api/task-receipt/<receiptId> — Download task receipt
@app.route("/api/task-receipt/<receipt_id>", methods=["GET"])
def download_task_receipt(receipt_id):
    try:
        safe_id = "".join(c for c in receipt_id if c.isalnum() or c == "-")
        receipt_path = DONATION_LETTERS_DIR / f"{safe_id}.pdf"
        if not receipt_path.exists():
            return jsonify({"error": "Receipt not found."}), 404
        return send_file(
            str(receipt_path),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"BU-Task-Receipt-{safe_id}.pdf",
        )
    except Exception as exc:
        logger.error("[task-receipt] %s", exc)
        return jsonify({"error": "Failed to retrieve receipt."}), 500


# GET /api/user-tasks/<userEmail> — Get user's registered tasks
@app.route("/api/user-tasks/<user_email>", methods=["GET"])
def get_user_tasks(user_email):
    try:
        import database
        from urllib.parse import unquote
        email = unquote(user_email).lower()
        tasks = database.list_user_tasks(email)
        return jsonify({"success": True, "tasks": tasks}), 200
    except Exception as exc:
        logger.error("[user-tasks] %s", exc)
        return jsonify({"error": "Failed to fetch user tasks."}), 500


# GET /api/user-completions/<userEmail> — Get user's completed tasks
@app.route("/api/user-completions/<user_email>", methods=["GET"])
def get_user_completions(user_email):
    try:
        import database
        from urllib.parse import unquote
        email = unquote(user_email).lower()
        completions = database.list_user_completions(email)
        return jsonify({"success": True, "completions": completions}), 200
    except Exception as exc:
        logger.error("[user-completions] %s", exc)
        return jsonify({"error": "Failed to fetch user completions."}), 500


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import database
    database.init_db()

    port = int(os.getenv("PORT", 5000))
    logger.info("[app] Starting BU Alumni Portal backend on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=True)
