"""
BU Alumni Portal — Shared Utilities
Provides ID generation, validation helpers, password hashing, and timestamp utilities.
"""

import re
import secrets
from datetime import datetime, timezone
from typing import Optional


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------

def generate_id(prefix: str = "BU", length: int = 8) -> str:
    """Generate a random hex ID with the given prefix.

    Args:
        prefix: String prefix (e.g. 'BU', 'JOB', 'ACC').
        length: Number of hex characters (must be even; default 8).

    Returns:
        A string like ``BU-A1B2C3D4``.
    """
    hex_part = secrets.token_hex(length // 2).upper()
    return f"{prefix}-{hex_part}"


def generate_ticket_id() -> str:
    """Return a ticket ID in the form ``BU-XXXXXXXX``."""
    return generate_id("BU", 8)


def generate_account_id() -> str:
    """Return an account ID in the form ``ACC-XXXXXXXX``."""
    return generate_id("ACC", 8)


def generate_member_id() -> str:
    """Return a member ID in the form ``MEM-XXXXXXXX``."""
    return generate_id("MEM", 8)


def generate_job_id() -> str:
    """Return a job ID in the form ``JOB-XXXXXXXX``."""
    return generate_id("JOB", 8)


def generate_donation_id() -> str:
    """Return a donation ID in the form ``DON-XXXXXXXX``."""
    return generate_id("DON", 8)


def generate_post_id() -> str:
    """Return a community post ID in the form ``POST-XXXXXXXX``."""
    return generate_id("POST", 8)


def generate_log_id() -> str:
    """Return a MoMo log ID in the form ``LOG-XXXXXXXX``."""
    return generate_id("LOG", 8)


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def validate_email(email: str) -> bool:
    """Return True if *email* looks like a valid address."""
    return bool(_EMAIL_RE.match(email.strip()))


def sanitize(value: Optional[str], default: str = "") -> str:
    """Strip whitespace from *value*; return *default* if None/empty."""
    if value is None:
        return default
    return str(value).strip() or default


# ---------------------------------------------------------------------------
# Timestamps
# ---------------------------------------------------------------------------

def now_iso() -> str:
    """Return the current UTC time as an ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Password hashing  (bcrypt)
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash *password* with bcrypt and return the encoded string.

    Args:
        password: Plain-text password.

    Returns:
        A bcrypt hash string (UTF-8 decoded).
    """
    import bcrypt  # imported here so the module is usable without bcrypt installed
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password: str, hashed: str) -> bool:
    """Verify *password* against a bcrypt *hashed* string.

    Args:
        password: Plain-text password to verify.
        hashed:   Previously stored bcrypt hash.

    Returns:
        True if the password matches, False otherwise.
    """
    import bcrypt
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False
