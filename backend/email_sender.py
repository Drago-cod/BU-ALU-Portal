"""
BU Alumni Portal — Email Sender
Sends HTML emails with optional PDF attachments using smtplib + email.mime.
All send functions are best-effort: they log errors but never raise.
"""

import logging
import os
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SMTP configuration (read from environment at call time so .env is loaded)
# ---------------------------------------------------------------------------

def _smtp_config() -> dict:
    return {
        "host":     os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port":     int(os.getenv("SMTP_PORT", "587")),
        "user":     os.getenv("SMTP_USER", ""),
        "password": os.getenv("SMTP_PASS", ""),
        "from_name": os.getenv("SMTP_FROM_NAME", "BU Alumni Portal"),
    }


def _build_from(cfg: dict) -> str:
    return f'"{cfg["from_name"]}" <{cfg["user"]}>'


def _send(msg: MIMEMultipart) -> bool:
    """Low-level send helper.  Returns True on success, False on failure."""
    cfg = _smtp_config()
    if not cfg["user"] or not cfg["password"]:
        logger.warning("[email] SMTP credentials not configured — skipping send.")
        return False
    try:
        use_ssl = cfg["port"] == 465
        if use_ssl:
            with smtplib.SMTP_SSL(cfg["host"], cfg["port"]) as server:
                server.login(cfg["user"], cfg["password"])
                server.send_message(msg)
        else:
            with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
                server.ehlo()
                server.starttls()
                server.login(cfg["user"], cfg["password"])
                server.send_message(msg)
        return True
    except Exception as exc:
        logger.error("[email] Failed to send email: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Event registration email
# ---------------------------------------------------------------------------

def send_event_registration_email(
    data: dict,
    pdf_bytes: bytes,
    base_url: str,
) -> bool:
    """Send event registration confirmation with PDF ticket attached.

    Args:
        data:      Dict with keys: fullName, email, eventName, eventDate,
                   eventLocation, eventTime, ticketId.
        pdf_bytes: Raw PDF bytes to attach.
        base_url:  Public base URL for the download link.

    Returns:
        True if the email was sent successfully.
    """
    cfg = _smtp_config()
    ticket_id    = data.get("ticketId", "")
    full_name    = data.get("fullName", "")
    event_name   = data.get("eventName", "")
    event_date   = data.get("eventDate", "See event details")
    event_loc    = data.get("eventLocation", "See event details")
    event_time   = data.get("eventTime", "See event details")
    download_url = f"{base_url}/api/ticket/{ticket_id}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your BU Event Ticket</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

  <!-- Header -->
  <tr><td style="background:#1d4ed8;padding:28px 40px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">BU Alumni Portal</h1>
    <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px;">Event Registration Confirmation</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:32px 40px 0;">
    <p style="color:#111827;font-size:16px;margin:0 0 8px;">
      Hi <strong>{full_name}</strong>,
    </p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px;">
      You're confirmed for <strong>{event_name}</strong>!
      Your ticket and receipt are attached as a PDF — you can also download them any time using the button below.
    </p>
  </td></tr>

  <!-- Event summary card -->
  <tr><td style="padding:0 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 4px;font-size:11px;color:#6b7280;font-weight:700;
                text-transform:uppercase;letter-spacing:.6px;">Event</p>
      <p style="margin:0 0 14px;font-size:17px;font-weight:800;color:#1d4ed8;">{event_name}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#374151;padding-bottom:6px;width:50%;">
            &#128197;&nbsp; <strong>{event_date}</strong>
          </td>
          <td style="font-size:13px;color:#374151;padding-bottom:6px;">
            &#128205;&nbsp; <strong>{event_loc}</strong>
          </td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#374151;">
            &#128336;&nbsp; <strong>{event_time}</strong>
          </td>
          <td style="font-size:13px;color:#374151;">
            &#127915;&nbsp; <strong>{ticket_id}</strong>
          </td>
        </tr>
      </table>
    </td></tr>
    </table>
  </td></tr>

  <!-- Download button -->
  <tr><td style="padding:28px 40px;text-align:center;">
    <a href="{download_url}"
       style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;
              padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;">
      &#11015;&#65039; Download Ticket &amp; Receipt (PDF)
    </a>
    <p style="color:#9ca3af;font-size:11px;margin:10px 0 0;">
      Or copy this link: <a href="{download_url}" style="color:#1d4ed8;">{download_url}</a>
    </p>
  </td></tr>

  <!-- Note -->
  <tr><td style="padding:0 40px 28px;">
    <p style="color:#374151;font-size:13px;line-height:1.6;margin:0 0 8px;">
      The PDF is also attached to this email for offline access.
      Please present your ticket at the event entrance.
    </p>
    <p style="color:#6b7280;font-size:12px;margin:0;">
      Questions? Reply to this email or write to
      <a href="mailto:alumni@bualumni.org" style="color:#1d4ed8;">alumni@bualumni.org</a>.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;padding:18px 40px;text-align:center;
                 border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:11px;margin:0;">
      &copy; 2026 BU Alumni Association &nbsp;&middot;&nbsp;
      Bugema University, Kampala, Uganda
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""

    msg = MIMEMultipart("mixed")
    msg["From"]    = _build_from(cfg)
    msg["To"]      = f'"{full_name}" <{data.get("email", "")}>'
    msg["Subject"] = f"Your Ticket: {event_name} [{ticket_id}]"

    msg.attach(MIMEText(html, "html", "utf-8"))

    attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
    attachment.add_header(
        "Content-Disposition",
        "attachment",
        filename=f"BU-Ticket-{ticket_id}.pdf",
    )
    msg.attach(attachment)

    return _send(msg)


# ---------------------------------------------------------------------------
# Membership confirmation email
# ---------------------------------------------------------------------------

def send_membership_confirmation_email(
    data: dict,
    pdf_bytes: Optional[bytes] = None,
    base_url: Optional[str] = None,
) -> bool:
    """Send membership registration confirmation email.

    Args:
        data: Dict with keys: fullName, email, memberId, membershipType,
              profession, location.
        pdf_bytes: Optional membership certificate PDF bytes.
        base_url: Optional public base URL for the certificate download link.

    Returns:
        True if sent successfully.
    """
    cfg         = _smtp_config()
    full_name   = data.get("fullName", "")
    member_id   = data.get("memberId", "")
    mem_type    = data.get("membershipType", "Standard")
    profession  = data.get("profession", "")
    location    = data.get("location", "")
    certificate_url = f"{base_url.rstrip('/')}/api/member-certificate/{member_id}" if base_url else ""
    certificate_button = ""
    if certificate_url:
        certificate_button = f"""
  <tr><td style="padding:0 40px 28px;text-align:center;">
    <a href="{certificate_url}"
       style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;
              padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
      Download Membership Certificate
    </a>
    <p style="color:#9ca3af;font-size:11px;margin:10px 0 0;">
      The PDF certificate is also attached to this email.
    </p>
  </td></tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>BU Alumni Membership Confirmation</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <tr><td style="background:#1d4ed8;padding:28px 40px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">BU Alumni Portal</h1>
    <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px;">Membership Registration Confirmation</p>
  </td></tr>
  <tr><td style="padding:32px 40px 0;">
    <p style="color:#111827;font-size:16px;margin:0 0 8px;">Hi <strong>{full_name}</strong>,</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Welcome to the BU Alumni community! Your <strong>{mem_type}</strong> membership has been registered.
      Your personalized membership certificate is attached as a PDF.
    </p>
  </td></tr>
  <tr><td style="padding:0 40px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 10px;font-size:11px;color:#6b7280;font-weight:700;
                text-transform:uppercase;letter-spacing:.6px;">Membership Details</p>
      <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;color:#374151;">
        <tr><td style="width:40%;color:#6b7280;font-weight:600;">Member ID</td>
            <td><strong>{member_id}</strong></td></tr>
        <tr><td style="color:#6b7280;font-weight:600;">Type</td>
            <td>{mem_type}</td></tr>
        <tr><td style="color:#6b7280;font-weight:600;">Profession</td>
            <td>{profession}</td></tr>
        <tr><td style="color:#6b7280;font-weight:600;">Location</td>
            <td>{location}</td></tr>
      </table>
    </td></tr>
    </table>
  </td></tr>
  {certificate_button}
  <tr><td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:11px;margin:0;">
      &copy; 2026 BU Alumni Association &nbsp;&middot;&nbsp; Bugema University, Kampala, Uganda
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""

    msg = MIMEMultipart("mixed")
    msg["From"]    = _build_from(cfg)
    msg["To"]      = f'"{full_name}" <{data.get("email", "")}>'
    msg["Subject"] = f"BU Alumni Membership Confirmed [{member_id}]"
    msg.attach(MIMEText(html, "html", "utf-8"))

    if pdf_bytes:
        attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=f"BU-Membership-Certificate-{member_id}.pdf",
        )
        msg.attach(attachment)

    return _send(msg)


# ---------------------------------------------------------------------------
# Donation receipt email
# ---------------------------------------------------------------------------

def send_donation_receipt_email(
    data: dict,
    pdf_bytes: Optional[bytes] = None,
    base_url: Optional[str] = None,
) -> bool:
    """Send donation receipt email with optional PDF attachment.

    Args:
        data:      Dict with keys: fullName, email, donationId, amount,
                   currency, paymentMethod, message.
        pdf_bytes: Optional PDF receipt bytes.
        base_url:  Optional public base URL for the letter download link.

    Returns:
        True if sent successfully.
    """
    cfg         = _smtp_config()
    full_name   = data.get("fullName", "")
    donation_id = data.get("donationId", "")
    amount      = data.get("amount", 0)
    currency    = data.get("currency", "UGX")
    method      = data.get("paymentMethod", "")
    letter_url  = f"{base_url.rstrip('/')}/api/donation-letter/{donation_id}" if base_url else ""
    letter_button = ""
    if letter_url:
        letter_button = f"""
  <tr><td style="padding:0 40px 28px;text-align:center;">
    <a href="{letter_url}"
       style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;
              padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
      Download Appreciation Letter
    </a>
    <p style="color:#9ca3af;font-size:11px;margin:10px 0 0;">
      The appreciation letter is also attached to this email as a PDF.
    </p>
  </td></tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>BU Donation Appreciation Letter</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <tr><td style="background:#1d4ed8;padding:28px 40px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">BU Alumni Portal</h1>
    <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px;">Donation Appreciation Letter</p>
  </td></tr>
  <tr><td style="padding:32px 40px 0;">
    <p style="color:#111827;font-size:16px;margin:0 0 8px;">Hi <strong>{full_name}</strong>,</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Thank you for your generous donation to the BU Alumni community. Your appreciation letter and receipt are attached as a PDF.
    </p>
  </td></tr>
  <tr><td style="padding:0 40px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 10px;font-size:11px;color:#6b7280;font-weight:700;
                text-transform:uppercase;letter-spacing:.6px;">Donation Summary</p>
      <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;color:#374151;">
        <tr><td style="width:40%;color:#6b7280;font-weight:600;">Receipt ID</td>
            <td><strong>{donation_id}</strong></td></tr>
        <tr><td style="color:#6b7280;font-weight:600;">Amount</td>
            <td><strong>{currency} {amount:,}</strong></td></tr>
        <tr><td style="color:#6b7280;font-weight:600;">Payment Method</td>
            <td>{method}</td></tr>
      </table>
    </td></tr>
    </table>
  </td></tr>
  {letter_button}
  <tr><td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:11px;margin:0;">
      &copy; 2026 BU Alumni Association &nbsp;&middot;&nbsp; Bugema University, Kampala, Uganda
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""

    msg = MIMEMultipart("mixed")
    msg["From"]    = _build_from(cfg)
    msg["To"]      = f'"{full_name}" <{data.get("email", "")}>'
    msg["Subject"] = f"BU Donation Receipt [{donation_id}]"
    msg.attach(MIMEText(html, "html", "utf-8"))

    if pdf_bytes:
        attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=f"BU-Donation-Appreciation-{donation_id}.pdf",
        )
        msg.attach(attachment)

    return _send(msg)
