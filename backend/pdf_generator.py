"""
BU Alumni Portal — PDF Generator
Generates 2-page event ticket + receipt PDFs using ReportLab.
Page 1: EVENT TICKET  (with QR code)
Page 2: REGISTRATION RECEIPT  (striped table)
"""

import io
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Colour palette (matches the Node.js / CSS design system)
PRIMARY  = "#1d4ed8"
MUTED    = "#6b7280"
BORDER   = "#e5e7eb"
SUCCESS  = "#16a34a"
LIGHT_BG = "#eff6ff"
LIGHT_BD = "#bfdbfe"
ROW_ODD  = "#f9fafb"
ROW_EVEN = "#ffffff"
DARK     = "#111827"
BLUE_DK  = "#1e40af"


def _hex_to_rgb(hex_color: str):
    """Convert a CSS hex colour string to an (R, G, B) tuple (0–1 floats)."""
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return r / 255, g / 255, b / 255


def _qr_image(url: str, size: int = 120):
    """Generate a QR code PIL Image for *url*.

    Returns None if the qrcode library is not installed.
    """
    try:
        import qrcode  # type: ignore
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=4,
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        return img
    except ImportError:
        logger.warning("[pdf] qrcode library not installed — QR code skipped.")
        return None
    except Exception as exc:
        logger.warning("[pdf] QR generation failed: %s", exc)
        return None


def generate_ticket_pdf(
    data: dict,
    logo_path: Optional[str] = None,
    base_url: str = "http://localhost:8080",
) -> bytes:
    """Generate a 2-page PDF ticket + receipt.

    Args:
        data:      Dict with keys: ticketId, fullName, email, phone,
                   eventName, eventDate, eventLocation, eventTime.
        logo_path: Absolute path to the logo PNG (optional).
        base_url:  Public base URL used to build the QR check-in link.

    Returns:
        Raw PDF bytes.

    Raises:
        ImportError: If ReportLab is not installed.
    """
    from reportlab.lib.pagesizes import A4  # type: ignore
    from reportlab.lib.units import mm  # type: ignore
    from reportlab.pdfgen.canvas import Canvas  # type: ignore
    from reportlab.lib import colors  # type: ignore

    ticket_id     = data.get("ticketId", "")
    full_name     = data.get("fullName", "")
    email         = data.get("email", "")
    phone         = data.get("phone", "")
    event_name    = data.get("eventName", "")
    event_date    = data.get("eventDate", "See event details")
    event_loc     = data.get("eventLocation", "See event details")
    event_time    = data.get("eventTime", "See event details")
    checkin_url   = f"{base_url}/api/checkin/{ticket_id}"
    registered_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    buf    = io.BytesIO()
    W, H   = A4          # 595.27 x 841.89 pts
    MARGIN = 50
    CW     = W - 2 * MARGIN   # content width

    c = Canvas(buf, pagesize=A4)

    # ------------------------------------------------------------------
    # Helper: draw horizontal rule
    # ------------------------------------------------------------------
    def hr(y: float, color: str = BORDER, width: float = 1.0):
        r, g, b = _hex_to_rgb(color)
        c.setStrokeColorRGB(r, g, b)
        c.setLineWidth(width)
        c.line(MARGIN, y, MARGIN + CW, y)

    # ------------------------------------------------------------------
    # Helper: draw page header (logo + portal name)
    # ------------------------------------------------------------------
    def page_header(y_top: float = H - 50) -> float:
        """Draw header; return the y position below the header rule."""
        # Logo
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(logo_path, MARGIN, y_top - 40, width=40, height=40,
                            preserveAspectRatio=True, mask="auto")
            except Exception:
                pass

        # Portal name (right-aligned)
        r, g, b = _hex_to_rgb(MUTED)
        c.setFillColorRGB(r, g, b)
        c.setFont("Helvetica", 10)
        c.drawRightString(MARGIN + CW, y_top - 10, "BU Alumni Portal")
        c.setFont("Helvetica", 8)
        c.drawRightString(MARGIN + CW, y_top - 22, "alumni@bualumni.org  ·  bualumni.org")

        rule_y = y_top - 55
        hr(rule_y)
        return rule_y - 20   # return y below the rule

    # ------------------------------------------------------------------
    # Helper: set fill colour from hex
    # ------------------------------------------------------------------
    def fill(hex_color: str):
        r, g, b = _hex_to_rgb(hex_color)
        c.setFillColorRGB(r, g, b)

    def stroke(hex_color: str):
        r, g, b = _hex_to_rgb(hex_color)
        c.setStrokeColorRGB(r, g, b)

    # ==================================================================
    # PAGE 1 — EVENT TICKET
    # ==================================================================
    y = page_header()

    # Title
    fill(PRIMARY)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(W / 2, y, "EVENT TICKET")
    y -= 22

    # Ticket ID
    fill(SUCCESS)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(W / 2, y, f"Ticket ID: {ticket_id}")
    y -= 28

    # Event info box (blue background)
    box_h = 90
    r, g, b = _hex_to_rgb(LIGHT_BG)
    c.setFillColorRGB(r, g, b)
    stroke(PRIMARY)
    c.setLineWidth(1.5)
    c.roundRect(MARGIN, y - box_h, CW, box_h, 8, fill=1, stroke=1)

    fill(PRIMARY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN + 20, y - 18, event_name[:70])

    fill(BLUE_DK)
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN + 20, y - 36, f"Date:      {event_date}")
    c.drawString(MARGIN + 20, y - 50, f"Location:  {event_loc}")
    c.drawString(MARGIN + 20, y - 64, f"Time:      {event_time}")

    y -= box_h + 20

    # Attendee details
    fill(DARK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN, y, "Attendee Details")
    y -= 18

    attendee_rows = [
        ("Full Name",   full_name),
        ("Email",       email),
        ("Phone",       phone),
        ("Registered",  registered_at),
    ]
    for label, value in attendee_rows:
        fill(MUTED)
        c.setFont("Helvetica", 10)
        c.drawString(MARGIN, y, f"{label}:")
        fill(DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MARGIN + 100, y, str(value))
        y -= 16

    y -= 10

    # QR code
    qr_img = _qr_image(checkin_url, size=120)
    if qr_img is not None:
        try:
            # Save QR to a temp buffer and draw via ReportLab ImageReader
            from reportlab.lib.utils import ImageReader  # type: ignore
            qr_buf = io.BytesIO()
            qr_img.save(qr_buf, format="PNG")
            qr_buf.seek(0)
            qr_size = 110
            qr_x = MARGIN + CW - qr_size - 10
            qr_y = y - qr_size
            c.drawImage(ImageReader(qr_buf), qr_x, qr_y,
                        width=qr_size, height=qr_size)
            fill(MUTED)
            c.setFont("Helvetica", 7)
            c.drawCentredString(qr_x + qr_size / 2, qr_y - 10, "Scan to check in")
            y = min(y, qr_y - 20)
        except Exception as exc:
            logger.warning("[pdf] Could not embed QR image: %s", exc)

    y -= 10
    hr(y)
    y -= 16

    fill(MUTED)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, y, "Present this ticket (printed or on your device) at the event entrance.")

    c.showPage()

    # ==================================================================
    # PAGE 2 — REGISTRATION RECEIPT
    # ==================================================================
    y = page_header()

    fill(PRIMARY)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(W / 2, y, "REGISTRATION RECEIPT")
    y -= 20

    fill(MUTED)
    c.setFont("Helvetica", 10)
    issue_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    c.drawCentredString(W / 2, y, f"Receipt No: {ticket_id}-R   ·   Issued: {issue_date}")
    y -= 30

    receipt_rows = [
        ("Event",      event_name),
        ("Date",       event_date),
        ("Location",   event_loc),
        ("Time",       event_time),
        ("Attendee",   full_name),
        ("Email",      email),
        ("Phone",      phone),
        ("Ticket ID",  ticket_id),
        ("Status",     "Confirmed ✓"),
    ]

    row_h = 24
    for i, (label, value) in enumerate(receipt_rows):
        bg = ROW_ODD if i % 2 == 0 else ROW_EVEN
        r2, g2, b2 = _hex_to_rgb(bg)
        c.setFillColorRGB(r2, g2, b2)
        c.rect(MARGIN, y - row_h, CW, row_h, fill=1, stroke=0)

        fill(MUTED)
        c.setFont("Helvetica", 10)
        c.drawString(MARGIN + 12, y - row_h + 7, label)

        fill(DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MARGIN + 150, y - row_h + 7, str(value)[:80])

        y -= row_h

    # Border around the table
    table_top = y + row_h * len(receipt_rows)
    stroke(BORDER)
    c.setLineWidth(1)
    c.rect(MARGIN, y, CW, table_top - y, fill=0, stroke=1)

    y -= 20
    hr(y)
    y -= 18

    fill(SUCCESS)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(W / 2, y, "Thank you for registering! We look forward to seeing you at the event.")
    y -= 16

    fill(MUTED)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, y, "Enquiries: alumni@bualumni.org  ·  +256 700 123 400")

    c.showPage()
    c.save()

    buf.seek(0)
    return buf.read()


def _format_display_date(raw_value: str = "") -> str:
    """Return a friendly date string for certificates and letters."""
    if raw_value:
        try:
            normalized = str(raw_value).replace("Z", "+00:00")
            return datetime.fromisoformat(normalized).strftime("%B %d, %Y")
        except Exception:
            return str(raw_value)
    return datetime.now(timezone.utc).strftime("%B %d, %Y")


def _draw_wrapped_text(c, text: str, x: float, y: float, max_width: float,
                       font_name: str = "Helvetica", font_size: int = 10,
                       leading: int = 14) -> float:
    """Draw wrapped text and return the next y position."""
    from reportlab.pdfbase.pdfmetrics import stringWidth  # type: ignore

    c.setFont(font_name, font_size)
    words = str(text or "").split()
    if not words:
        return y

    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if stringWidth(candidate, font_name, font_size) <= max_width:
            line = candidate
            continue
        c.drawString(x, y, line)
        y -= leading
        line = word
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def generate_membership_certificate_pdf(
    data: dict,
    logo_path: Optional[str] = None,
) -> bytes:
    """Generate a personalized BU Alumni membership certificate PDF."""
    from reportlab.lib.pagesizes import A4, landscape  # type: ignore
    from reportlab.pdfgen.canvas import Canvas  # type: ignore

    full_name = data.get("fullName", "")
    member_id = data.get("memberId", "")
    mem_type = data.get("membershipType", "Standard")
    profession = data.get("profession", "")
    location = data.get("location", "")
    issued_on = _format_display_date(data.get("registeredAt", ""))

    buf = io.BytesIO()
    W, H = landscape(A4)
    c = Canvas(buf, pagesize=(W, H))

    def fill(hex_color: str):
        r, g, b = _hex_to_rgb(hex_color)
        c.setFillColorRGB(r, g, b)

    def stroke(hex_color: str):
        r, g, b = _hex_to_rgb(hex_color)
        c.setStrokeColorRGB(r, g, b)

    # Background and borders
    fill("#f8fafc")
    c.rect(0, 0, W, H, fill=1, stroke=0)
    fill("#eff6ff")
    c.roundRect(30, 30, W - 60, H - 60, 22, fill=1, stroke=0)
    stroke(PRIMARY)
    c.setLineWidth(3)
    c.roundRect(46, 46, W - 92, H - 92, 18, fill=0, stroke=1)
    stroke(LIGHT_BD)
    c.setLineWidth(1)
    c.roundRect(62, 62, W - 124, H - 124, 14, fill=0, stroke=1)

    # Logo and institution name
    if logo_path and os.path.exists(logo_path):
        try:
            c.drawImage(logo_path, W / 2 - 36, H - 116, width=72, height=72,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass

    fill(DARK)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(W / 2, H - 138, "Bugema University Alumni Association")
    fill(MUTED)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, H - 154, "BU Alumni Portal")

    # Certificate content
    fill(PRIMARY)
    c.setFont("Helvetica-Bold", 34)
    c.drawCentredString(W / 2, H - 210, "Certificate of Membership")

    fill(MUTED)
    c.setFont("Helvetica", 13)
    c.drawCentredString(W / 2, H - 246, "This certifies that")

    fill(DARK)
    name_size = 32 if len(full_name) <= 34 else 26
    c.setFont("Helvetica-Bold", name_size)
    c.drawCentredString(W / 2, H - 292, full_name)

    fill(MUTED)
    c.setFont("Helvetica", 13)
    c.drawCentredString(
        W / 2,
        H - 326,
        f"is a registered {mem_type} member of the BU Alumni community.",
    )

    # Detail card
    card_w = W - 210
    card_h = 92
    card_x = (W - card_w) / 2
    card_y = 132
    fill("#ffffff")
    stroke(LIGHT_BD)
    c.setLineWidth(1.2)
    c.roundRect(card_x, card_y, card_w, card_h, 12, fill=1, stroke=1)

    detail_rows = [
        ("Member ID", member_id),
        ("Membership", mem_type),
        ("Issued On", issued_on),
    ]
    col_w = card_w / 3
    for idx, (label, value) in enumerate(detail_rows):
        x = card_x + idx * col_w
        fill(MUTED)
        c.setFont("Helvetica", 9)
        c.drawCentredString(x + col_w / 2, card_y + 56, label.upper())
        fill(PRIMARY if idx == 0 else DARK)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(x + col_w / 2, card_y + 34, str(value))

    # Optional profile line
    profile = " | ".join(part for part in [profession, location] if part)
    if profile:
        fill(MUTED)
        c.setFont("Helvetica", 9)
        c.drawCentredString(W / 2, card_y - 20, profile)

    # Signature footer
    stroke(BORDER)
    c.setLineWidth(1)
    c.line(118, 86, 278, 86)
    c.line(W - 278, 86, W - 118, 86)
    fill(DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(198, 70, "Alumni Office")
    c.drawCentredString(W - 198, 70, "Registrar")
    fill(MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W / 2, 48, "Generated automatically by the BU Alumni Portal.")

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()


def generate_donation_appreciation_pdf(
    data: dict,
    logo_path: Optional[str] = None,
) -> bytes:
    """Generate a personalized donation appreciation letter PDF."""
    from reportlab.lib.pagesizes import A4  # type: ignore
    from reportlab.pdfgen.canvas import Canvas  # type: ignore

    full_name = data.get("fullName", "")
    donation_id = data.get("donationId", "")
    amount = data.get("amount", 0)
    currency = data.get("currency", "UGX")
    method = data.get("paymentMethod", "")
    donor_message = data.get("message", "")
    issued_on = _format_display_date(data.get("donatedAt", ""))

    try:
        amount_display = f"{currency} {float(amount):,.0f}"
    except Exception:
        amount_display = f"{currency} {amount}"

    buf = io.BytesIO()
    W, H = A4
    MARGIN = 54
    CW = W - (2 * MARGIN)
    c = Canvas(buf, pagesize=A4)

    def fill(hex_color: str):
        r, g, b = _hex_to_rgb(hex_color)
        c.setFillColorRGB(r, g, b)

    def stroke(hex_color: str):
        r, g, b = _hex_to_rgb(hex_color)
        c.setStrokeColorRGB(r, g, b)

    fill("#ffffff")
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Header band
    fill(PRIMARY)
    c.rect(0, H - 118, W, 118, fill=1, stroke=0)
    if logo_path and os.path.exists(logo_path):
        try:
            c.drawImage(logo_path, MARGIN, H - 94, width=54, height=54,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass

    fill("#ffffff")
    c.setFont("Helvetica-Bold", 18)
    c.drawString(MARGIN + 70, H - 64, "BU Alumni Association")
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN + 70, H - 82, "Appreciation Letter and Donation Receipt")

    # Title
    y = H - 162
    fill(PRIMARY)
    c.setFont("Helvetica-Bold", 23)
    c.drawString(MARGIN, y, "Thank You for Your Support")
    y -= 24

    fill(MUTED)
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN, y, f"Issued: {issued_on}")
    c.drawRightString(MARGIN + CW, y, f"Reference: {donation_id}")
    y -= 42

    fill(DARK)
    c.setFont("Helvetica", 11)
    c.drawString(MARGIN, y, f"Dear {full_name},")
    y -= 30

    paragraphs = [
        (
            "On behalf of the BU Alumni Association, thank you for your generous "
            f"donation of {amount_display}. Your support strengthens alumni programs, "
            "student scholarships, mentorship, and community outreach across the "
            "Bugema University network."
        ),
        (
            "We are grateful for your commitment to helping current students and "
            "fellow alumni access opportunities that create lasting impact."
        ),
    ]
    for paragraph in paragraphs:
        fill("#374151")
        y = _draw_wrapped_text(c, paragraph, MARGIN, y, CW, "Helvetica", 11, 17)
        y -= 10

    # Donation summary box
    y -= 8
    box_h = 104
    fill(LIGHT_BG)
    stroke(LIGHT_BD)
    c.setLineWidth(1.2)
    c.roundRect(MARGIN, y - box_h, CW, box_h, 10, fill=1, stroke=1)

    rows = [
        ("Donation ID", donation_id),
        ("Donor", full_name),
        ("Amount", amount_display),
        ("Payment Method", method),
    ]
    row_y = y - 24
    for label, value in rows:
        fill(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(MARGIN + 18, row_y, label)
        fill(DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MARGIN + 150, row_y, str(value)[:70])
        row_y -= 20

    y -= box_h + 32

    if donor_message:
        fill(PRIMARY)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(MARGIN, y, "Your Message")
        y -= 18
        fill("#374151")
        y = _draw_wrapped_text(c, donor_message, MARGIN, y, CW, "Helvetica", 10, 15)
        y -= 14

    fill("#374151")
    closing = (
        "With sincere appreciation, we recognize your contribution as part of the "
        "ongoing BU Alumni story."
    )
    y = _draw_wrapped_text(c, closing, MARGIN, y, CW, "Helvetica", 11, 17)
    y -= 34

    fill(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN, y, "BU Alumni Office")
    fill(MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN, y - 16, "Bugema University Alumni Association")

    # Footer
    stroke(BORDER)
    c.setLineWidth(1)
    c.line(MARGIN, 58, MARGIN + CW, 58)
    fill(MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W / 2, 40, "Generated automatically by the BU Alumni Portal.")

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()
