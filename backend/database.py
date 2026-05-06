"""
BU Alumni Portal — SQLite Database Layer
Handles schema creation and all CRUD operations.
"""

import json
import logging
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Path ──────────────────────────────────────────────────────────────────────
DB_PATH = Path(__file__).parent / "data" / "bu_alumni.db"


@contextmanager
def get_conn():
    """Yield a SQLite connection with row_factory set to Row."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ── Schema ────────────────────────────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS accounts (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    account_type  TEXT NOT NULL DEFAULT 'Alumni',
    profession    TEXT,
    program       TEXT,
    graduation_year TEXT,
    service_interest TEXT,
    payment_method TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
    id               TEXT PRIMARY KEY,
    full_name        TEXT NOT NULL,
    email            TEXT NOT NULL,
    phone            TEXT NOT NULL,
    profession       TEXT NOT NULL,
    location         TEXT,
    membership_type  TEXT NOT NULL,
    payment_method   TEXT,
    momo_phone       TEXT,
    registration_fee TEXT NOT NULL DEFAULT 'UGX 10,000',
    registered_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id             TEXT PRIMARY KEY,
    full_name      TEXT NOT NULL,
    email          TEXT NOT NULL,
    phone          TEXT NOT NULL,
    event_name     TEXT NOT NULL,
    event_date     TEXT,
    event_location TEXT,
    event_time     TEXT,
    registered_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    company       TEXT NOT NULL,
    type          TEXT NOT NULL,
    location      TEXT NOT NULL,
    salary        TEXT,
    deadline      TEXT,
    description   TEXT NOT NULL,
    requirements  TEXT,
    contact_email TEXT NOT NULL,
    website       TEXT,
    posted_by     TEXT,
    status        TEXT NOT NULL DEFAULT 'pending_review',
    posted_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS donations (
    id             TEXT PRIMARY KEY,
    full_name      TEXT NOT NULL,
    email          TEXT NOT NULL,
    amount         REAL NOT NULL,
    currency       TEXT NOT NULL DEFAULT 'UGX',
    payment_method TEXT NOT NULL,
    momo_phone     TEXT,
    message        TEXT,
    status         TEXT NOT NULL DEFAULT 'pending',
    donated_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS momo_logs (
    id             TEXT PRIMARY KEY,
    provider       TEXT NOT NULL,
    phone          TEXT NOT NULL,
    amount         REAL NOT NULL,
    currency       TEXT NOT NULL DEFAULT 'UGX',
    reference      TEXT,
    status         TEXT NOT NULL DEFAULT 'prompt_sent',
    transaction_id TEXT,
    requested_at   TEXT NOT NULL,
    confirmed_at   TEXT
);

CREATE TABLE IF NOT EXISTS community_posts (
    id         TEXT PRIMARY KEY,
    author_id  TEXT,
    author_name TEXT NOT NULL,
    profession TEXT,
    content    TEXT NOT NULL,
    post_type  TEXT NOT NULL DEFAULT 'update',
    badge      TEXT,
    link_url   TEXT,
    link_text  TEXT,
    likes      INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS post_likes (
    post_id    TEXT NOT NULL,
    user_email TEXT NOT NULL,
    PRIMARY KEY (post_id, user_email)
);

CREATE TABLE IF NOT EXISTS comments (
    id         TEXT PRIMARY KEY,
    post_id    TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES community_posts(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id               TEXT PRIMARY KEY,
    title            TEXT NOT NULL,
    description      TEXT NOT NULL,
    category         TEXT NOT NULL,
    duration_hours   INTEGER,
    points            INTEGER NOT NULL DEFAULT 0,
    certificate      BOOLEAN DEFAULT 1,
    requires_feedback BOOLEAN DEFAULT 1,
    status           TEXT NOT NULL DEFAULT 'active',
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task_registrations (
    id               TEXT PRIMARY KEY,
    task_id          TEXT NOT NULL,
    user_email       TEXT NOT NULL,
    full_name        TEXT NOT NULL,
    phone            TEXT,
    registered_at    TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS task_completions (
    id               TEXT PRIMARY KEY,
    task_id          TEXT NOT NULL,
    registration_id  TEXT NOT NULL,
    user_email       TEXT NOT NULL,
    full_name        TEXT NOT NULL,
    completion_date  TEXT NOT NULL,
    completion_hours REAL,
    points_earned    INTEGER,
    certificate_id   TEXT,
    ticket_id        TEXT,
    receipt_id       TEXT,
    status           TEXT NOT NULL DEFAULT 'completed',
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (registration_id) REFERENCES task_registrations(id)
);

CREATE TABLE IF NOT EXISTS task_certificates (
    id               TEXT PRIMARY KEY,
    completion_id    TEXT NOT NULL,
    task_id          TEXT NOT NULL,
    user_email       TEXT NOT NULL,
    full_name        TEXT NOT NULL,
    issue_date       TEXT NOT NULL,
    certificate_number TEXT NOT NULL,
    file_path        TEXT,
    FOREIGN KEY (completion_id) REFERENCES task_completions(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS task_tickets (
    id               TEXT PRIMARY KEY,
    completion_id    TEXT NOT NULL,
    task_id          TEXT NOT NULL,
    user_email       TEXT NOT NULL,
    full_name        TEXT NOT NULL,
    ticket_number    TEXT NOT NULL,
    issue_date       TEXT NOT NULL,
    file_path        TEXT,
    FOREIGN KEY (completion_id) REFERENCES task_completions(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS task_receipts (
    id               TEXT PRIMARY KEY,
    completion_id    TEXT NOT NULL,
    task_id          TEXT NOT NULL,
    user_email       TEXT NOT NULL,
    full_name        TEXT NOT NULL,
    receipt_number   TEXT NOT NULL,
    issue_date       TEXT NOT NULL,
    amount           REAL DEFAULT 0,
    currency         TEXT DEFAULT 'UGX',
    file_path        TEXT,
    FOREIGN KEY (completion_id) REFERENCES task_completions(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS task_feedbacks (
    id               TEXT PRIMARY KEY,
    completion_id    TEXT NOT NULL,
    task_id          TEXT NOT NULL,
    user_email       TEXT NOT NULL,
    full_name        TEXT NOT NULL,
    rating           INTEGER,
    comments         TEXT,
    would_recommend  BOOLEAN,
    submitted_at     TEXT NOT NULL,
    FOREIGN KEY (completion_id) REFERENCES task_completions(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS stats (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO stats (key, value) VALUES
    ('alumniMembers',        '389000'),
    ('jobsThisYear',         '2500'),
    ('activeChapters',       '72'),
    ('mentorshipConnections','18000'),
    ('updatedAt',            datetime('now'));
"""


def init_db():
    """Create all tables if they don't exist."""
    with get_conn() as conn:
        conn.executescript(SCHEMA)
    logger.info("[db] Database initialised at %s", DB_PATH)


# ── Stats ─────────────────────────────────────────────────────────────────────

def get_stats() -> Dict[str, Any]:
    with get_conn() as conn:
        rows = conn.execute("SELECT key, value FROM stats").fetchall()
    return {r["key"]: r["value"] for r in rows}


def update_stats(data: Dict[str, Any]) -> Dict[str, Any]:
    from utils import now_iso
    with get_conn() as conn:
        for key, value in data.items():
            conn.execute(
                "INSERT INTO stats (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (key, str(value)),
            )
        conn.execute(
            "INSERT INTO stats (key, value) VALUES ('updatedAt', ?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (now_iso(),),
        )
    return get_stats()


# ── Accounts ──────────────────────────────────────────────────────────────────

def create_account(data: Dict[str, Any]) -> Dict[str, Any]:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO accounts
               (id, email, password_hash, full_name, account_type, profession,
                program, graduation_year, service_interest, payment_method,
                payment_status, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                data["id"], data["email"], data["password_hash"],
                data["fullName"], data.get("accountType", "Alumni"),
                data.get("profession"), data.get("program"),
                data.get("graduationYear"), data.get("serviceInterest"),
                data.get("paymentMethod"), data.get("paymentStatus", "pending"),
                data["createdAt"],
            ),
        )
    return get_account_by_email(data["email"])


def get_account_by_email(email: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM accounts WHERE email = ?", (email.lower(),)
        ).fetchone()
    return dict(row) if row else None


def get_account_by_id(account_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM accounts WHERE id = ?", (account_id,)
        ).fetchone()
    return dict(row) if row else None


# ── Members ───────────────────────────────────────────────────────────────────

def create_member(data: Dict[str, Any]) -> Dict[str, Any]:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO members
               (id, full_name, email, phone, profession, location,
                membership_type, payment_method, momo_phone,
                registration_fee, registered_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (
                data["id"], data["fullName"], data["email"], data["phone"],
                data["profession"], data.get("location"),
                data["membershipType"], data.get("paymentMethod"),
                data.get("momoPhone"), data.get("registrationFee", "UGX 10,000"),
                data["registeredAt"],
            ),
        )
    return get_member_by_id(data["id"])


def get_member_by_id(member_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM members WHERE id = ?", (member_id,)
        ).fetchone()
    return dict(row) if row else None


def get_member_by_email(email: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM members WHERE email = ?", (email.lower(),)
        ).fetchone()
    return dict(row) if row else None


# ── Event registrations ───────────────────────────────────────────────────────

def create_event_registration(data: Dict[str, Any]) -> Dict[str, Any]:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO event_registrations
               (id, full_name, email, phone, event_name, event_date,
                event_location, event_time, registered_at)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                data["id"], data["fullName"], data["email"], data["phone"],
                data["eventName"], data.get("eventDate"),
                data.get("eventLocation"), data.get("eventTime"),
                data["registeredAt"],
            ),
        )
    return get_event_registration_by_id(data["id"])


def get_event_registration_by_id(reg_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM event_registrations WHERE id = ?", (reg_id,)
        ).fetchone()
    return dict(row) if row else None


# ── Jobs ──────────────────────────────────────────────────────────────────────

def create_job(data: Dict[str, Any]) -> Dict[str, Any]:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO jobs
               (id, title, company, type, location, salary, deadline,
                description, requirements, contact_email, website,
                posted_by, status, posted_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                data["id"], data["title"], data["company"], data["type"],
                data["location"], data.get("salary"), data.get("deadline"),
                data["description"], data.get("requirements"),
                data["contactEmail"], data.get("website"),
                data.get("postedBy"), data.get("status", "pending_review"),
                data["postedAt"],
            ),
        )
    return get_job_by_id(data["id"])


def get_job_by_id(job_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    return dict(row) if row else None


def list_jobs(status: str = "approved") -> List[Dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM jobs WHERE status = ? ORDER BY posted_at DESC", (status,)
        ).fetchall()
    return [dict(r) for r in rows]


# ── Donations ─────────────────────────────────────────────────────────────────

def create_donation(data: Dict[str, Any]) -> Dict[str, Any]:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO donations
               (id, full_name, email, amount, currency, payment_method,
                momo_phone, message, status, donated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (
                data["id"], data["fullName"], data["email"],
                data["amount"], data.get("currency", "UGX"),
                data["paymentMethod"], data.get("momoPhone"),
                data.get("message"), data.get("status", "pending"),
                data["donatedAt"],
            ),
        )
    return get_donation_by_id(data["id"])


def get_donation_by_id(donation_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM donations WHERE id = ?", (donation_id,)
        ).fetchone()
    return dict(row) if row else None


# ── MoMo logs ─────────────────────────────────────────────────────────────────

def create_momo_log(data: Dict[str, Any]) -> str:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO momo_logs
               (id, provider, phone, amount, currency, reference,
                status, transaction_id, requested_at, confirmed_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (
                data["id"], data["provider"], data["phone"],
                data["amount"], data.get("currency", "UGX"),
                data.get("reference"), data.get("status", "prompt_sent"),
                data.get("transactionId"), data["requestedAt"],
                data.get("confirmedAt"),
            ),
        )
    return data["id"]


def update_momo_log(log_id: str, status: str, transaction_id: str, confirmed_at: str):
    with get_conn() as conn:
        conn.execute(
            """UPDATE momo_logs
               SET status=?, transaction_id=?, confirmed_at=?
               WHERE id=?""",
            (status, transaction_id, confirmed_at, log_id),
        )


# ── Community posts ───────────────────────────────────────────────────────────

def create_post(data: Dict[str, Any]) -> Dict[str, Any]:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO community_posts
               (id, author_id, author_name, profession, content, post_type,
                badge, link_url, link_text, likes, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (
                data["id"], data.get("authorId"), data["authorName"],
                data.get("profession"), data["content"],
                data.get("postType", "update"), data.get("badge"),
                data.get("linkUrl"), data.get("linkText"),
                0, data["createdAt"],
            ),
        )
    return get_post_by_id(data["id"])


def get_post_by_id(post_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM community_posts WHERE id = ?", (post_id,)
        ).fetchone()
    return dict(row) if row else None


def list_posts(limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM community_posts ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
    return [dict(r) for r in rows]


def toggle_like(post_id: str, user_email: str) -> Dict[str, Any]:
    """Toggle a like on a post. Returns {liked: bool, likes: int}."""
    with get_conn() as conn:
        existing = conn.execute(
            "SELECT 1 FROM post_likes WHERE post_id=? AND user_email=?",
            (post_id, user_email),
        ).fetchone()
        if existing:
            conn.execute(
                "DELETE FROM post_likes WHERE post_id=? AND user_email=?",
                (post_id, user_email),
            )
            conn.execute(
                "UPDATE community_posts SET likes = MAX(0, likes-1) WHERE id=?",
                (post_id,),
            )
            liked = False
        else:
            conn.execute(
                "INSERT INTO post_likes (post_id, user_email) VALUES (?,?)",
                (post_id, user_email),
            )
            conn.execute(
                "UPDATE community_posts SET likes = likes+1 WHERE id=?",
                (post_id,),
            )
            liked = True
        row = conn.execute(
            "SELECT likes FROM community_posts WHERE id=?", (post_id,)
        ).fetchone()
    return {"liked": liked, "likes": row["likes"] if row else 0}


def create_comment(data: Dict[str, Any]) -> Dict[str, Any]:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO comments (id, post_id, author_name, content, created_at)
               VALUES (?,?,?,?,?)""",
            (data["id"], data["postId"], data["authorName"],
             data["content"], data["createdAt"]),
        )
        row = conn.execute(
            "SELECT * FROM comments WHERE id=?", (data["id"],)
        ).fetchone()
    return dict(row)


def list_comments(post_id: str) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM comments WHERE post_id=? ORDER BY created_at ASC",
            (post_id,),
        ).fetchall()
    return [dict(r) for r in rows]


# ── Tasks ────────────────────────────────────────────────────────────────────

def create_task(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new task."""
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO tasks (id, title, description, category, duration_hours, points, certificate, requires_feedback, status, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (data["id"], data["title"], data["description"], data["category"],
             data.get("durationHours", 0), data.get("points", 0),
             data.get("certificate", 1), data.get("requiresFeedback", 1),
             data.get("status", "active"), data["createdAt"], data["updatedAt"]),
        )
        row = conn.execute("SELECT * FROM tasks WHERE id=?", (data["id"],)).fetchone()
    return dict(row)


def get_task_by_id(task_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a task by ID."""
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
    return dict(row) if row else None


def list_tasks(status: str = "active") -> List[Dict[str, Any]]:
    """List all tasks with optional status filter."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM tasks WHERE status=? ORDER BY created_at DESC", (status,)
        ).fetchall()
    return [dict(r) for r in rows]


def register_task(data: Dict[str, Any]) -> Dict[str, Any]:
    """Register a user for a task."""
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO task_registrations (id, task_id, user_email, full_name, phone, registered_at)
               VALUES (?,?,?,?,?,?)""",
            (data["id"], data["taskId"], data["userEmail"], data["fullName"],
             data.get("phone", ""), data["registeredAt"]),
        )
        row = conn.execute(
            "SELECT * FROM task_registrations WHERE id=?", (data["id"],)
        ).fetchone()
    return dict(row)


def get_task_registration(registration_id: str) -> Optional[Dict[str, Any]]:
    """Get a task registration by ID."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM task_registrations WHERE id=?", (registration_id,)
        ).fetchone()
    return dict(row) if row else None


def complete_task(data: Dict[str, Any]) -> Dict[str, Any]:
    """Mark a task as completed."""
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO task_completions (id, task_id, registration_id, user_email, full_name, completion_date, completion_hours, points_earned, certificate_id, ticket_id, receipt_id, status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (data["id"], data["taskId"], data["registrationId"], data["userEmail"],
             data["fullName"], data["completionDate"], data.get("completionHours", 0),
             data.get("pointsEarned", 0), data.get("certificateId", ""),
             data.get("ticketId", ""), data.get("receiptId", ""), "completed"),
        )
        row = conn.execute(
            "SELECT * FROM task_completions WHERE id=?", (data["id"],)
        ).fetchone()
    return dict(row)


def get_task_completion(completion_id: str) -> Optional[Dict[str, Any]]:
    """Get a task completion record."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM task_completions WHERE id=?", (completion_id,)
        ).fetchone()
    return dict(row) if row else None


def create_certificate(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a certificate record."""
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO task_certificates (id, completion_id, task_id, user_email, full_name, issue_date, certificate_number, file_path)
               VALUES (?,?,?,?,?,?,?,?)""",
            (data["id"], data["completionId"], data["taskId"], data["userEmail"],
             data["fullName"], data["issueDate"], data["certificateNumber"], data.get("filePath", "")),
        )
        row = conn.execute(
            "SELECT * FROM task_certificates WHERE id=?", (data["id"],)
        ).fetchone()
    return dict(row)


def create_ticket(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a ticket record."""
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO task_tickets (id, completion_id, task_id, user_email, full_name, ticket_number, issue_date, file_path)
               VALUES (?,?,?,?,?,?,?,?)""",
            (data["id"], data["completionId"], data["taskId"], data["userEmail"],
             data["fullName"], data["ticketNumber"], data["issueDate"], data.get("filePath", "")),
        )
        row = conn.execute(
            "SELECT * FROM task_tickets WHERE id=?", (data["id"],)
        ).fetchone()
    return dict(row)


def create_receipt(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a receipt record."""
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO task_receipts (id, completion_id, task_id, user_email, full_name, receipt_number, issue_date, amount, currency, file_path)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (data["id"], data["completionId"], data["taskId"], data["userEmail"],
             data["fullName"], data["receiptNumber"], data["issueDate"],
             data.get("amount", 0), data.get("currency", "UGX"), data.get("filePath", "")),
        )
        row = conn.execute(
            "SELECT * FROM task_receipts WHERE id=?", (data["id"],)
        ).fetchone()
    return dict(row)


def submit_feedback(data: Dict[str, Any]) -> Dict[str, Any]:
    """Submit feedback for a completed task."""
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO task_feedbacks (id, completion_id, task_id, user_email, full_name, rating, comments, would_recommend, submitted_at)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (data["id"], data["completionId"], data["taskId"], data["userEmail"],
             data["fullName"], data.get("rating", 0), data.get("comments", ""),
             data.get("wouldRecommend", False), data["submittedAt"]),
        )
        row = conn.execute(
            "SELECT * FROM task_feedbacks WHERE id=?", (data["id"],)
        ).fetchone()
    return dict(row)


def get_feedback_by_completion(completion_id: str) -> Optional[Dict[str, Any]]:
    """Get feedback for a specific task completion."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM task_feedbacks WHERE completion_id=?", (completion_id,)
        ).fetchone()
    return dict(row) if row else None


def list_user_tasks(user_email: str) -> List[Dict[str, Any]]:
    """List all tasks a user has registered for."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM task_registrations WHERE user_email=? ORDER BY registered_at DESC",
            (user_email,)
        ).fetchall()
    return [dict(r) for r in rows]


def list_user_completions(user_email: str) -> List[Dict[str, Any]]:
    """List all completed tasks for a user."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM task_completions WHERE user_email=? ORDER BY completion_date DESC",
            (user_email,)
        ).fetchall()
    return [dict(r) for r in rows]
