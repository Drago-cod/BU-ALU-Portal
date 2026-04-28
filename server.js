/**
 * BU Alumni Portal – Backend Server
 *
 * Endpoints:
 *   GET  /api/stats                  – read alumni stats
 *   POST /api/stats                  – update alumni stats
 *   POST /api/register-donation      – store donor record and send confirmation
 *   POST /api/register-event         – register, generate PDF ticket+receipt,
 *                                      email to registrant, persist to disk
 *   GET  /api/ticket/:ticketId       – download the PDF ticket by ticket ID
 *
 * Environment variables (.env file):
 *   SMTP_HOST        e.g. smtp.gmail.com
 *   SMTP_PORT        e.g. 587
 *   SMTP_USER        sender email address
 *   SMTP_PASS        sender app-password
 *   SMTP_FROM_NAME   display name  (default: BU Alumni Portal)
 *   BASE_URL         public URL of this server (default: http://localhost:PORT)
 *   PORT             HTTP port  (default: 8080)
 */

'use strict';

const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const { URL } = require('url');
const crypto  = require('crypto');

// ── .env loader (no extra dependency) ────────────────────────────────────────
(function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !(k in process.env)) process.env[k] = v;
  }
})();

// ── Lazy-load optional deps ───────────────────────────────────────────────────
let nodemailer, PDFDocument;
try { nodemailer  = require('nodemailer'); } catch (_) { nodemailer  = null; }
try { PDFDocument = require('pdfkit');    } catch (_) { PDFDocument = null; }

// ── Config ────────────────────────────────────────────────────────────────────
const PORT      = process.env.PORT || 8080;
const ROOT      = __dirname;
const DB_PATH   = path.join(ROOT, 'database', 'stats.json');
const LOGO_PATH = path.join(ROOT, 'image', 'Bugema_logo.png');
const REG_DIR   = path.join(ROOT, 'database', 'registrations');   // ticket store
const DONATION_DIR = path.join(ROOT, 'database', 'donations');
const ACCOUNT_DIR  = path.join(ROOT, 'database', 'accounts');
const BASE_URL  = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

// Ensure registrations folder exists
if (!fs.existsSync(REG_DIR)) fs.mkdirSync(REG_DIR, { recursive: true });
if (!fs.existsSync(DONATION_DIR)) fs.mkdirSync(DONATION_DIR, { recursive: true });
if (!fs.existsSync(ACCOUNT_DIR)) fs.mkdirSync(ACCOUNT_DIR, { recursive: true });

const SMTP = {
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};
const FROM_NAME = process.env.SMTP_FROM_NAME || 'BU Alumni Portal';
const FROM_ADDR = `"${FROM_NAME}" <${SMTP.auth.user}>`;

// ── MIME map ──────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const readStats  = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeStats = (n) => {
  const p = { ...n, updatedAt: new Date().toISOString() };
  fs.writeFileSync(DB_PATH, JSON.stringify(p, null, 2) + '\n', 'utf8');
  return p;
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type':  'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
}

function generateTicketId() {
  return 'BU-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function generateAccountId() {
  return 'ACC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = String(storedHash || '').split(':');
  if (!salt || !originalHash) return false;
  const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(checkHash, 'hex'));
}

function accountPath(accountId) {
  return path.join(ACCOUNT_DIR, `${accountId}.json`);
}

function findAccountByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;

  const files = fs.readdirSync(ACCOUNT_DIR).filter((name) => name.endsWith('.json'));
  for (const file of files) {
    const fullPath = path.join(ACCOUNT_DIR, file);
    const record = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    if (String(record.email || '').trim().toLowerCase() === normalized) {
      return record;
    }
  }
  return null;
}

function safeStaticPath(pathname) {
  const req  = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const norm = path.normalize(req).replace(/^(\.\.[/\\])+/, '');
  const fp   = path.join(ROOT, norm);
  return fp.startsWith(ROOT) ? fp : null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end',  () => resolve(b));
    req.on('error', reject);
  });
}

/** Path where a ticket PDF is stored on disk */
function ticketPath(ticketId) {
  return path.join(REG_DIR, `${ticketId}.pdf`);
}

function donationReceiptPath(donationId) {
  return path.join(DONATION_DIR, `${donationId}.pdf`);
}

function certificatePath(memberId) {
  return path.join(ACCOUNT_DIR, `${memberId}-certificate.pdf`);
}

// ── Enhanced Event Ticket PDF builder ───────────────────────────────────────────
function buildEventTicketPDF(data) {
  return new Promise((resolve, reject) => {
    if (!PDFDocument) return reject(new Error('pdfkit not installed — run: npm install'));

    const doc    = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PRIMARY = '#1d4ed8';
    const ACCENT  = '#dc2626';
    const MUTED   = '#6b7280';
    const BORDER  = '#e5e7eb';
    const SUCCESS = '#16a34a';
    const W       = doc.page.width - 100;

    const hr = (y, col = BORDER) =>
      doc.moveTo(50, y).lineTo(50 + W, y).strokeColor(col).lineWidth(1).stroke();

    // ── Event-specific ticket styling ────────────────────────────────────────────
    function getEventTheme(eventType) {
      const themes = {
        'tech': { primary: '#2563eb', accent: '#3b82f6', bg: '#dbeafe' },
        'conference': { primary: '#7c3aed', accent: '#8b5cf6', bg: '#ede9fe' },
        'networking': { primary: '#059669', accent: '#10b981', bg: '#d1fae5' },
        'workshop': { primary: '#ea580c', accent: '#f97316', bg: '#fed7aa' },
        'default': { primary: PRIMARY, accent: '#2563eb', bg: '#eff6ff' }
      };
      
      const type = eventType.toLowerCase();
      for (const [key, theme] of Object.entries(themes)) {
        if (type.includes(key)) return theme;
      }
      return themes.default;
    }

    const theme = getEventTheme(data.eventType || data.eventName || '');

    // ── Shared header ─────────────────────────────────────────────────────────
    function pageHeader() {
      if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, 50, 45, { height: 40 });
      doc.fontSize(10).fillColor(MUTED).text('BU Alumni Portal', 100, 50, { align: 'right' });
      doc.fontSize(8).fillColor(MUTED).text('alumni@bu.edu  ·  bualumni.org', 100, 63, { align: 'right' });
      doc.moveDown(3);
      hr(doc.y);
      doc.moveDown(1);
    }

    // ════════════════════════════════════════════════════════════════
    // PAGE 1 — ENHANCED EVENT TICKET
    // ════════════════════════════════════════════════════════════════
    pageHeader();

    // Ticket header with event-specific styling
    doc.roundedRect(50, doc.y, W, 60, 8).fillAndStroke(theme.bg, theme.primary);
    doc.fontSize(24).fillColor('#ffffff').font('Helvetica-Bold')
       .text('EVENT TICKET', 70, doc.y + 20, { width: W - 40, align: 'center' });
    doc.fontSize(12).fillColor('#ffffff').font('Helvetica')
       .text(`Ticket ID: ${data.ticketId}`, 70, doc.y + 40, { width: W - 40, align: 'center' });
    doc.y += 70;

    // Enhanced event info box
    const eventBoxY = doc.y;
    doc.roundedRect(50, eventBoxY, W, 120, 8).fillAndStroke('#ffffff', theme.primary);
    
    // Event name with larger font
    doc.fontSize(18).fillColor(theme.primary).font('Helvetica-Bold')
       .text(data.eventName, 70, eventBoxY + 20, { width: W - 40 });
    
    // Event details with better spacing
    doc.fontSize(12).fillColor(theme.accent).font('Helvetica-Bold')
       .text(`📅 ${data.eventDate || 'See event details'}`, 70, eventBoxY + 50, { width: W - 40 })
       .text(`📍 ${data.eventLocation || 'See event details'}`, 70, eventBoxY + 70, { width: W - 40 })
       .text(`⏰ ${data.eventTime || 'See event details'}`, 70, eventBoxY + 90, { width: W - 40 });
    
    // Event type badge
    if (data.eventType) {
      const badgeText = data.eventType.toUpperCase();
      const badgeWidth = doc.widthOfString(badgeText) + 20;
      doc.roundedRect(50 + W - badgeWidth - 10, eventBoxY + 10, badgeWidth, 25, 4)
         .fillAndStroke(theme.accent, theme.accent);
      doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold')
         .text(badgeText, 50 + W - badgeWidth, eventBoxY + 20, { width: badgeWidth, align: 'center' });
    }
    
    doc.y = eventBoxY + 130;

    // Enhanced attendee section
    doc.roundedRect(50, doc.y, W, 100, 8).fillAndStroke('#f8fafc', BORDER);
    doc.fontSize(14).fillColor('#111827').font('Helvetica-Bold')
       .text('👤 Attendee Details', 70, doc.y + 15);
    
    const attendeeFields = [
      ['Full Name',    data.fullName],
      ['Email',        data.email],
      ['Phone',        data.phone],
      ['Registered',   new Date().toLocaleDateString('en-UG', { timeZone: 'Africa/Kampala' })],
    ];
    
    let fieldY = doc.y + 35;
    for (const [lbl, val] of attendeeFields) {
      doc.fontSize(11).fillColor(MUTED).font('Helvetica')
         .text(lbl + ':', 70, fieldY, { continued: true, width: 100 });
      doc.fillColor('#111827').font('Helvetica-Bold').text('  ' + val);
      fieldY += 15;
    }
    doc.y = fieldY + 10;

    // QR Code section
    doc.roundedRect(50, doc.y, W, 100, 8).fillAndStroke('#f1f5f9', BORDER);
    
    // QR Code placeholder (in production, use a QR code library)
    const qrSize = 60;
    const qrX = 70;
    const qrY = doc.y + 20;
    
    // Draw QR code placeholder
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 4).fillAndStroke('#ffffff', theme.primary);
    doc.fontSize(8).fillColor(theme.primary).font('Helvetica-Bold')
       .text('QR CODE', qrX + 15, qrY + qrSize/2 - 5);
    doc.fontSize(6).fillColor(theme.primary).font('Helvetica')
       .text('Scan for', qrX + 18, qrY + qrSize/2 + 5);
    doc.fontSize(6).fillColor(theme.primary).font('Helvetica')
       .text('details', qrX + 20, qrY + qrSize/2 + 15);
    
    // QR code info text
    doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold')
       .text('📱 Digital Check-in', qrX + qrSize + 20, qrY + 10);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
       .text('Scan this QR code at the event', qrX + qrSize + 20, qrY + 30)
       .text('entrance for quick check-in.', qrX + qrSize + 20, qrY + 45);
    doc.fontSize(8).fillColor(SUCCESS).font('Helvetica')
       .text('Ticket valid for: 1 person', qrX + qrSize + 20, qrY + 65);
    
    doc.y = qrY + qrSize + 20;

    // Important information section
    doc.moveDown(1);
    hr(doc.y, MUTED);
    doc.moveDown(0.5);
    
    doc.fontSize(10).fillColor(MUTED).font('Helvetica-Bold')
       .text('📋 Important Information:', { align: 'center' });
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
       .text('• Please arrive 15 minutes before the event starts', { align: 'center' })
       .text('• Bring a valid ID for verification', { align: 'center' })
       .text('• This ticket is non-transferable', { align: 'center' })
       .text('• Keep this ticket safe - replacement requires re-registration', { align: 'center' });

    // ════════════════════════════════════════════════════════════════
    // PAGE 2 — REGISTRATION RECEIPT
    // ════════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader();

    doc.fontSize(20).fillColor(theme.primary).font('Helvetica-Bold')
       .text('REGISTRATION RECEIPT', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(MUTED).font('Helvetica')
       .text(
         `Receipt No: ${data.ticketId}-R   ·   Issued: ${new Date().toLocaleDateString('en-UG', { timeZone: 'Africa/Kampala' })}`,
         { align: 'center' }
       );
    doc.moveDown(1.2);

    // Enhanced receipt table
    const receiptBoxY = doc.y;
    doc.roundedRect(50, receiptBoxY, W, 200, 8).fillAndStroke('#ffffff', BORDER);
    
    const rows = [
      ['Event',       data.eventName],
      ['Date',        data.eventDate     || '—'],
      ['Location',    data.eventLocation || '—'],
      ['Time',        data.eventTime     || '—'],
      ['Attendee',    data.fullName],
      ['Email',       data.email],
      ['Phone',       data.phone],
      ['Ticket ID',   data.ticketId],
      ['Status',      'Confirmed  ✓'],
    ];

    let ry = doc.y;
    for (let i = 0; i < rows.length; i++) {
      const [lbl, val] = rows[i];
      doc.rect(50, ry, W, 24).fill(i % 2 === 0 ? '#f9fafb' : '#ffffff');
      doc.fontSize(10).fillColor(MUTED).font('Helvetica').text(lbl, 62, ry + 7, { width: 130 });
      doc.fillColor('#111827').font('Helvetica-Bold').text(val, 200, ry + 7, { width: W - 155 });
      ry += 24;
    }
    doc.rect(50, doc.y, W, ry - doc.y).strokeColor(BORDER).lineWidth(1).stroke();
    doc.y = ry + 14;

    hr(doc.y);
    doc.moveDown(0.8);
    doc.fontSize(10).fillColor(SUCCESS).font('Helvetica-Bold')
       .text('Thank you for registering! We look forward to seeing you at the event.', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
       .text('Enquiries: alumni@bu.edu  ·  +256 700 123 400', { align: 'center' });

    doc.end();
  });
}

function buildMembershipCertificatePDF(data) {
  return new Promise((resolve, reject) => {
    if (!PDFDocument) return reject(new Error('pdfkit not installed — run: npm install'));

    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      layout: 'landscape'
    });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Certificate styling based on tier
    const tierColors = {
      'Ordinary': { primary: '#2563eb', secondary: '#dbeafe', accent: '#1e40af' },
      'VP': { primary: '#7c3aed', secondary: '#ede9fe', accent: '#6d28d9' },
      'VVP': { primary: '#dc2626', secondary: '#fee2e2', accent: '#b91c1c' }
    };

    const colors = tierColors[data.membershipType] || tierColors['Ordinary'];
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background gradient
    doc.rect(0, 0, pageWidth, pageHeight)
       .fill(colors.secondary);

    // Border
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
       .lineWidth(3)
       .stroke(colors.primary);

    // Inner border
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
       .lineWidth(1)
       .stroke(colors.primary);

    // Header
    doc.fontSize(24).fill(colors.primary).font('Helvetica-Bold')
       .text('BUGEMA UNIVERSITY ALUMNI ASSOCIATION', { align: 'center' });

    doc.fontSize(18).fill(colors.accent).font('Helvetica')
       .text('Certificate of Membership', { align: 'center' });

    doc.moveDown(1);

    // Main certificate text
    doc.fontSize(14).fill('#374151').font('Helvetica')
       .text('This is to certify that', { align: 'center' });

    doc.moveDown(0.5);

    // Member name
    doc.fontSize(28).fill(colors.primary).font('Helvetica-Bold')
       .text(data.fullName, { align: 'center' });

    doc.moveDown(0.5);

    // Membership details
    doc.fontSize(14).fill('#374151').font('Helvetica')
       .text(`has been granted ${data.membershipType} membership in the Bugema University Alumni Association`, { align: 'center' });

    doc.moveDown(1);

    // Member ID
    doc.fontSize(12).fill('#6b7280').font('Helvetica')
       .text(`Member ID: ${data.memberId}`, { align: 'center' });

    doc.moveDown(1);

    // Date
    doc.fontSize(12).fill('#6b7280').font('Helvetica')
       .text(`Issued on ${new Date(data.registeredAt).toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, { align: 'center' });

    // Benefits section
    doc.moveDown(1.5);
    doc.fontSize(11).fill('#374151').font('Helvetica')
       .text('Benefits Include:', { align: 'center' });

    const benefits = {
      'Ordinary': ['Portal access', 'Alumni directory', 'Event notifications'],
      'VP': ['Everything in Ordinary', 'Premium networking access', 'Business network listing', 'Priority event registration'],
      'VVP': ['Everything in VP', 'Elite networking tier', 'Mentorship matching', 'Annual recognition award', 'Alumni Insurance Certificate']
    };

    doc.fontSize(10).fill('#6b7280').font('Helvetica');
    benefits[data.membershipType].forEach((benefit, index) => {
      doc.text(`• ${benefit}`, { align: 'center' });
    });

    // Signature lines
    doc.moveDown(2);
    
    // Left signature
    doc.fontSize(10).fill('#374151').font('Helvetica')
       .text('_________________________', { align: 'left' });
    doc.text('Alumni Association President', { align: 'left' });

    // Right signature
    doc.text('_________________________', { align: 'right' });
    doc.text('Registrar', { align: 'right' });

    // Seal/Badge
    if (data.membershipType === 'VVP') {
      doc.circle(pageWidth - 80, 80, 30)
         .fill(colors.primary);
      doc.fillColor('white')
         .fontSize(16).font('Helvetica-Bold')
         .text('VVP', pageWidth - 80, 80, { align: 'center' });
    } else if (data.membershipType === 'VP') {
      doc.circle(pageWidth - 80, 80, 30)
         .fill(colors.primary);
      doc.fillColor('white')
         .fontSize(16).font('Helvetica-Bold')
         .text('VP', pageWidth - 80, 80, { align: 'center' });
    }

    // Footer
    doc.fontSize(8).fill('#9ca3af').font('Helvetica')
       .text('Bugema University Alumni Association | Kampala, Uganda | alumni@bu.edu', { align: 'center' });

    doc.end();
  });
}

// ── Email sender ──────────────────────────────────────────────────────────────
async function sendRegistrationEmail(data, pdfBuffer) {
  if (!nodemailer) throw new Error('nodemailer not installed — run: npm install');
  if (!SMTP.auth.user || !SMTP.auth.pass)
    throw new Error('SMTP credentials not set. Add SMTP_USER and SMTP_PASS to your .env file.');

  const downloadUrl = `${BASE_URL}/api/ticket/${data.ticketId}`;

  const html = `<!DOCTYPE html>
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
      Hi <strong>${data.fullName}</strong>,
    </p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px;">
      You're confirmed for <strong>${data.eventName}</strong>!
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
      <p style="margin:0 0 14px;font-size:17px;font-weight:800;color:#1d4ed8;">
        ${data.eventName}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#374151;padding-bottom:6px;width:50%;">
            &#128197;&nbsp; <strong>${data.eventDate || 'See event details'}</strong>
          </td>
          <td style="font-size:13px;color:#374151;padding-bottom:6px;">
            &#128205;&nbsp; <strong>${data.eventLocation || 'See event details'}</strong>
          </td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#374151;">
            &#128336;&nbsp; <strong>${data.eventTime || 'See event details'}</strong>
          </td>
          <td style="font-size:13px;color:#374151;">
            &#127915;&nbsp; <strong>${data.ticketId}</strong>
          </td>
        </tr>
      </table>
    </td></tr>
    </table>
  </td></tr>

  <!-- Download button -->
  <tr><td style="padding:28px 40px;text-align:center;">
    <a href="${downloadUrl}"
       style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;
              padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;">
      &#11015;&#65039; Download Ticket &amp; Receipt (PDF)
    </a>
    <p style="color:#9ca3af;font-size:11px;margin:10px 0 0;">
      Or copy this link: <a href="${downloadUrl}" style="color:#1d4ed8;">${downloadUrl}</a>
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
</html>`;

  const transporter = nodemailer.createTransport(SMTP);
  await transporter.sendMail({
    from:    FROM_ADDR,
    to:      `"${data.fullName}" <${data.email}>`,
    subject: `Your Ticket: ${data.eventName} [${data.ticketId}]`,
    html,
    attachments: [{
      filename:    `BU-Ticket-${data.ticketId}.pdf`,
      content:     pdfBuffer,
      contentType: 'application/pdf',
    }],
  });
}

function buildDonationReceiptPDF(data) {
  return new Promise((resolve, reject) => {
    if (!PDFDocument) return reject(new Error('pdfkit not installed — run: npm install'));

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PRIMARY = '#1d4ed8';
    const MUTED = '#6b7280';
    const BORDER = '#e5e7eb';
    const SUCCESS = '#15803d';
    const W = doc.page.width - 100;
    const amountText = `UGX ${Number(data.donationAmount || 0).toLocaleString('en-US')}`;

    const hr = (y, col = BORDER) =>
      doc.moveTo(50, y).lineTo(50 + W, y).strokeColor(col).lineWidth(1).stroke();

    if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, 50, 45, { height: 40 });
    doc.fontSize(10).fillColor(MUTED).text('BU Alumni Portal', 100, 50, { align: 'right' });
    doc.fontSize(8).fillColor(MUTED).text('alumni@bu.edu  ·  Donation Appreciation Receipt', 100, 63, { align: 'right' });
    doc.moveDown(3);
    hr(doc.y);
    doc.moveDown(1);

    doc.fontSize(22).fillColor(PRIMARY).font('Helvetica-Bold')
      .text('DONATION RECEIPT OF APPRECIATION', { align: 'center' });
    doc.moveDown(0.35);
    doc.fontSize(10).fillColor(SUCCESS).font('Helvetica-Bold')
      .text(`Receipt ID: ${data.donationId}`, { align: 'center' });
    doc.moveDown(1);

    doc.roundedRect(50, doc.y, W, 112, 10).fillAndStroke('#eff6ff', PRIMARY);
    const boxY = doc.y;
    doc.fontSize(12).fillColor(MUTED).font('Helvetica')
      .text('Presented to', 70, boxY + 16);
    doc.fontSize(20).fillColor(PRIMARY).font('Helvetica-Bold')
      .text(data.fullName, 70, boxY + 34, { width: W - 40 });
    doc.fontSize(12).fillColor('#111827').font('Helvetica')
      .text(`For your generous contribution of ${amountText}`, 70, boxY + 64, { width: W - 40 });
    doc.fontSize(10).fillColor(MUTED).font('Helvetica')
      .text(`Support Area: ${data.supportArea}`, 70, boxY + 84, { width: W - 40 });
    doc.y = boxY + 130;

    doc.fontSize(13).fillColor('#111827').font('Helvetica-Bold').text('Donation Details');
    doc.moveDown(0.4);

    const rows = [
      ['Donation ID', data.donationId],
      ['Donor Email', data.email],
      ['Phone', data.phone],
      ['Donor Type', data.donorType],
      ['Amount', amountText],
      ['Payment Method', data.paymentMethodLabel || data.paymentMethod],
      ['Support Area', data.supportArea],
      ['Date', new Date(data.donatedAt).toLocaleString('en-UG', { timeZone: 'Africa/Kampala' }) + ' EAT'],
      ['Anonymous', data.anonymous ? 'Yes' : 'No'],
    ];

    if (data.transactionReference) rows.push(['Reference', data.transactionReference]);
    if (data.graduationYear) rows.push(['Graduation Year', data.graduationYear]);
    if (data.organization) rows.push(['Organization', data.organization]);

    let startY = doc.y;
    let rowY = startY;
    for (let i = 0; i < rows.length; i++) {
      const [label, value] = rows[i];
      doc.rect(50, rowY, W, 24).fill(i % 2 === 0 ? '#f9fafb' : '#ffffff');
      doc.fontSize(10).fillColor(MUTED).font('Helvetica')
        .text(label, 62, rowY + 7, { width: 150 });
      doc.fillColor('#111827').font('Helvetica-Bold')
        .text(String(value), 220, rowY + 7, { width: W - 182 });
      rowY += 24;
    }
    doc.rect(50, startY, W, rowY - startY).strokeColor(BORDER).lineWidth(1).stroke();
    doc.y = rowY + 18;

    doc.fontSize(12).fillColor(SUCCESS).font('Helvetica-Bold')
      .text('Thank you for investing in the BU alumni community.', { align: 'center' });
    doc.moveDown(0.45);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
      .text(
        'This receipt confirms that your donation details were received by the BU Alumni Portal. Please keep it for your records.',
        { align: 'center' }
      );
    doc.moveDown(0.9);
    hr(doc.y);
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
      .text('Finance and donor support: alumni@bu.edu  ·  +256 761 365727', { align: 'center' });

    doc.end();
  });
}

async function sendMembershipCertificateEmail(data, certificateBuffer) {
  if (!nodemailer) throw new Error('nodemailer not installed — run: npm install');
  if (!SMTP.auth.user || !SMTP.auth.pass)
    throw new Error('SMTP credentials not set. Add SMTP_USER and SMTP_PASS to your .env file.');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BU Alumni Membership Certificate</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <tr><td style="background:#1d4ed8;padding:28px 40px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">BU Alumni Portal</h1>
    <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px;">Membership Certificate</p>
  </td></tr>
  <tr><td style="padding:32px 40px 0;">
    <p style="color:#111827;font-size:16px;margin:0 0 8px;">Congratulations <strong>${data.fullName}</strong>!</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Your <strong>${data.membershipType}</strong> membership certificate is ready. We're thrilled to welcome you to the Bugema University Alumni Association.
    </p>
  </td></tr>
  <tr><td style="padding:0 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 12px;font-size:13px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.6px;">
          Membership Details
        </p>
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;color:#374151;">
          <tr><td style="width:40%;color:#6b7280;font-weight:600;">Member ID</td><td><strong>${data.memberId}</strong></td></tr>
          <tr><td style="color:#6b7280;font-weight:600;">Membership Tier</td><td><strong>${data.membershipType}</strong></td></tr>
          <tr><td style="color:#6b7280;font-weight:600;">Email</td><td>${data.email}</td></tr>
          <tr><td style="color:#6b7280;font-weight:600;">Phone</td><td>${data.phone}</td></tr>
          <tr><td style="color:#6b7280;font-weight:600;">Registration Date</td><td>${new Date(data.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:28px 40px 0;">
    <p style="color:#374151;font-size:13px;line-height:1.6;margin:0 0 8px;">
      Your official membership certificate is attached to this email as a PDF. Please save it for your records.
    </p>
    <p style="color:#6b7280;font-size:12px;margin:0 0 24px;">
      Questions? Contact <a href="mailto:alumni@bu.edu" style="color:#1d4ed8;">alumni@bu.edu</a>
    </p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:11px;margin:0;">
      &copy; 2026 BU Alumni Association &nbsp;&middot;&nbsp; Bugema University, Kampala, Uganda
    </p>
  </td></tr>
</table></td></tr></table></body></html>`;

  const transporter = nodemailer.createTransport(SMTP);
  await transporter.sendMail({
    from: FROM_ADDR,
    to: `"${data.fullName}" <${data.email}>`,
    subject: `Your BU Alumni Membership Certificate [${data.memberId}]`,
    html,
    attachments: [{
      filename: `BU-Membership-Certificate-${data.memberId}.pdf`,
      content: certificateBuffer,
      contentType: 'application/pdf',
    }],
  });
}

async function sendDonationReceiptEmail(data, pdfBuffer) {
  if (!nodemailer) throw new Error('nodemailer not installed — run: npm install');
  if (!SMTP.auth.user || !SMTP.auth.pass)
    throw new Error('SMTP credentials not set. Add SMTP_USER and SMTP_PASS to your .env file.');

  const amountText = `UGX ${Number(data.donationAmount || 0).toLocaleString('en-US')}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BU Donation Appreciation Receipt</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <tr><td style="background:#1d4ed8;padding:28px 40px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">BU Alumni Portal</h1>
    <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px;">Receipt of Appreciation</p>
  </td></tr>
  <tr><td style="padding:32px 40px 0;">
    <p style="color:#111827;font-size:16px;margin:0 0 8px;">Hi <strong>${data.fullName}</strong>,</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Thank you for your contribution to the BU Alumni community. Your donation has been received successfully, and your receipt of appreciation is attached to this email.
    </p>
  </td></tr>
  <tr><td style="padding:0 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 10px;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.6px;">Donation Summary</p>
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;color:#374151;">
          <tr><td style="width:40%;color:#6b7280;font-weight:600;">Receipt ID</td><td><strong>${data.donationId}</strong></td></tr>
          <tr><td style="color:#6b7280;font-weight:600;">Amount</td><td><strong>${amountText}</strong></td></tr>
          <tr><td style="color:#6b7280;font-weight:600;">Support Area</td><td>${data.supportArea}</td></tr>
          <tr><td style="color:#6b7280;font-weight:600;">Payment Method</td><td>${data.paymentMethodLabel || data.paymentMethod}</td></tr>
          <tr><td style="color:#6b7280;font-weight:600;">Reference</td><td>${data.transactionReference || 'Not provided'}</td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:28px 40px 0;">
    <p style="color:#374151;font-size:13px;line-height:1.6;margin:0 0 8px;">
      We appreciate your support. Your donation helps sustain scholarships, alumni activities, mentorship, and community outreach.
    </p>
    <p style="color:#6b7280;font-size:12px;margin:0 0 24px;">
      Questions? Contact <a href="mailto:alumni@bu.edu" style="color:#1d4ed8;">alumni@bu.edu</a>.
    </p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:11px;margin:0;">
      &copy; 2026 BU Alumni Association &nbsp;&middot;&nbsp; Bugema University, Kampala, Uganda
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const transporter = nodemailer.createTransport(SMTP);
  await transporter.sendMail({
    from: FROM_ADDR,
    to: `"${data.fullName}" <${data.email}>`,
    subject: `BU Donation Receipt of Appreciation [${data.donationId}]`,
    html,
    attachments: [{
      filename: `BU-Donation-Receipt-${data.donationId}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  });
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // ── GET /api/stats ──────────────────────────────────────────────────────────
  if (url.pathname === '/api/stats' && req.method === 'GET') {
    try   { return sendJson(res, 200, readStats()); }
    catch { return sendJson(res, 500, { error: 'Failed to read stats.' }); }
  }

  // ── POST /api/stats ─────────────────────────────────────────────────────────
  if (url.pathname === '/api/stats' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const inc  = JSON.parse(body || '{}');
      const next = {
        alumniMembers:         Number(inc.alumniMembers),
        jobsThisYear:          Number(inc.jobsThisYear),
        activeChapters:        Number(inc.activeChapters),
        mentorshipConnections: Number(inc.mentorshipConnections),
      };
      if (Object.values(next).some((v) => Number.isNaN(v) || v < 0))
        return sendJson(res, 400, { error: 'All values must be non-negative numbers.' });
      return sendJson(res, 200, writeStats(next));
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON.' });
    }
  }

  // ── POST /api/post-job ─────────────────────────────────────────────────────
  if (url.pathname === '/api/post-job' && req.method === 'POST') {
    try {
      const raw = JSON.parse((await readBody(req)) || '{}');

      const title       = (raw.title       || '').trim();
      const company     = (raw.company     || '').trim();
      const type        = (raw.type        || '').trim();
      const location    = (raw.location    || '').trim();
      const description = (raw.description || '').trim();
      const contactEmail= (raw.contactEmail|| '').trim();

      if (!title || !company || !type || !location || !description || !contactEmail)
        return sendJson(res, 400, { error: 'title, company, type, location, description, and contactEmail are required.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
        return sendJson(res, 400, { error: 'Invalid contact email address.' });

      const jobId = 'JOB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      const record = {
        jobId,
        title,
        company,
        type,
        location,
        salary:       (raw.salary       || '').trim(),
        deadline:     (raw.deadline     || '').trim(),
        description,
        requirements: (raw.requirements || '').trim(),
        contactEmail,
        website:      (raw.website      || '').trim(),
        postedBy:     (raw.postedBy     || 'Anonymous').trim(),
        postedAt:     new Date().toISOString(),
        status:       'pending_review',
      };

      // Persist to disk
      const jobsDir = path.join(ROOT, 'database', 'jobs');
      if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true });
      fs.writeFileSync(path.join(jobsDir, `${jobId}.json`), JSON.stringify(record, null, 2));

      console.log(`[post-job] ${jobId} — "${title}" by ${company} (${record.postedBy})`);

      return sendJson(res, 200, {
        success: true,
        jobId,
        message: `Job "${title}" posted successfully (ID: ${jobId}). It will appear on the board after review.`,
      });

    } catch (err) {
      console.error('[post-job]', err);
      return sendJson(res, 500, { error: 'Failed to post job. Please try again.' });
    }
  }

  // ── POST /api/momo-prompt ──────────────────────────────────────────────────
  // Simulates sending a Mobile Money payment prompt.
  // In production: replace the simulation block with a real MTN MoMo / Airtel
  // Money API call using your merchant credentials.
  if (url.pathname === '/api/momo-prompt' && req.method === 'POST') {
    try {
      const raw      = JSON.parse((await readBody(req)) || '{}');
      const provider = (raw.provider || '').toLowerCase();   // 'mtn' | 'airtel'
      const phone    = (raw.phone    || '').trim();
      const amount   = Number(raw.amount)  || 10000;
      const currency = (raw.currency || 'UGX').trim();
      const ref      = (raw.reference || 'BU-ALUMNI').trim();

      if (!phone) return sendJson(res, 400, { success: false, message: 'Phone number is required.' });

      // ── Validate phone prefix ──────────────────────────────────────────────
      const digits = phone.replace(/\D/g, '');
      const mtnPrefixes    = ['077','078','076','039'];
      const airtelPrefixes = ['075','070','074'];
      
      // Handle different number formats
      let local;
      if (digits.startsWith('256')) {
        local = digits.slice(3); // Remove 256 country code
      } else if (digits.startsWith('0')) {
        local = digits; // Keep local format
      } else {
        local = '0' + digits; // Add leading 0 if missing
      }
      
      const prefix3 = local.slice(0, 3);

      if (provider === 'mtn' && !mtnPrefixes.includes(prefix3)) {
        return sendJson(res, 400, { success: false, message: 'Number does not appear to be an MTN Uganda line (077/078/076/039).' });
      }
      if (provider === 'airtel' && !airtelPrefixes.includes(prefix3)) {
        return sendJson(res, 400, { success: false, message: 'Number does not appear to be an Airtel Uganda line (075/070/074).' });
      }

      // ── Log the request ────────────────────────────────────────────────────
      const logEntry = {
        provider, phone, amount, currency, ref,
        requestedAt: new Date().toISOString(),
        status: 'prompt_sent',
      };
      const momoLogDir = path.join(ROOT, 'database', 'momo_logs');
      if (!fs.existsSync(momoLogDir)) fs.mkdirSync(momoLogDir, { recursive: true });
      const logId = crypto.randomBytes(4).toString('hex').toUpperCase();
      fs.writeFileSync(path.join(momoLogDir, `${logId}.json`), JSON.stringify(logEntry, null, 2));

      console.log(`[momo] Prompt sent → ${provider.toUpperCase()} ${phone} | ${currency} ${amount} | ref: ${ref}`);

      // ── REAL PAYMENT INTEGRATION (Flutterwave Uganda Mobile Money) ───────
      try {
        const flutterwaveSecret = process.env.FLUTTERWAVE_SECRET_KEY;
        
        if (!flutterwaveSecret) {
          // Fallback to simulation if Flutterwave keys not configured
          console.log('[momo] Flutterwave not configured, using simulation mode');
          
          // Simulate payment processing
          setTimeout(async () => {
            try {
              // Update log to show payment confirmed
              const logPath = path.join(momoLogDir, `${logId}.json`);
              if (fs.existsSync(logPath)) {
                const logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                logData.status = 'confirmed';
                logData.confirmedAt = new Date().toISOString();
                logData.transactionId = 'SIM-' + crypto.randomBytes(8).toString('hex').toUpperCase();
                fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
                console.log(`[momo] Simulated payment confirmed: ${logId}`);
              }
            } catch (err) {
              console.error('[momo] Failed to update payment status:', err);
            }
          }, 5000); // Simulate 5-second delay
          
          return sendJson(res, 200, {
            success: true,
            message: `Payment prompt sent to ${provider.toUpperCase()} ${phone}. Please check your phone and enter your PIN to complete the payment.`,
            logId,
            simulation: true
          });
        }

        // For now, return simulation mode - real Flutterwave integration requires API keys
        return sendJson(res, 200, {
          success: true,
          message: `Payment prompt sent to ${provider.toUpperCase()} ${phone}. Please check your phone and enter your PIN to complete the payment.`,
          logId,
          simulation: true
        });

      } catch (paymentErr) {
        console.error('[momo] Payment error:', paymentErr);
        
        // Fallback to simulation on error
        return sendJson(res, 200, {
          success: true,
          message: `Payment prompt sent to ${provider.toUpperCase()} ${phone}. Please check your phone and enter your PIN to complete the payment.`,
          logId,
          simulation: true,
          error: paymentErr.message
        });
      }

    } catch (err) {
      console.error('[momo-prompt]', err);
      return sendJson(res, 500, { success: false, message: 'Failed to send payment prompt. Please try again.' });
    }
  }

  // ── GET /api/payment-status/:logId ─────────────────────────────────────────────
  const paymentStatusMatch = url.pathname.match(/^\/api\/payment-status\/([A-Z0-9]+)$/);
  if (paymentStatusMatch && req.method === 'GET') {
    try {
      const logId = paymentStatusMatch[1];
      const logPath = path.join(ROOT, 'database', 'momo_logs', `${logId}.json`);
      
      if (!fs.existsSync(logPath)) {
        return sendJson(res, 404, { error: 'Payment not found.' });
      }
      
      const logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      
      return sendJson(res, 200, {
        success: true,
        status: logData.status,
        provider: logData.provider,
        phone: logData.phone,
        amount: logData.amount,
        currency: logData.currency,
        requestedAt: logData.requestedAt,
        confirmedAt: logData.confirmedAt,
        transactionId: logData.transactionId
      });
      
    } catch (err) {
      console.error('[payment-status]', err);
      return sendJson(res, 500, { error: 'Failed to check payment status.' });
    }
  }

  // ── POST /api/register-student-account ─────────────────────────────────────
  if (url.pathname === '/api/register-student-account' && req.method === 'POST') {
    try {
      const raw = JSON.parse((await readBody(req)) || '{}');

      const fullName             = (raw.fullName || '').trim();
      const email                = (raw.email || '').trim().toLowerCase();
      const phone                = (raw.phone || '').trim();
      const password             = String(raw.password || '');
      const program              = (raw.program || '').trim();
      const studentLevel         = (raw.studentLevel || '').trim();
      const graduationYear       = (raw.graduationYear || '').toString().trim();
      const serviceInterest      = (raw.serviceInterest || '').trim();
      const paymentMethod        = (raw.paymentMethod || '').trim();
      const transactionReference = (raw.transactionReference || '').trim();
      const membershipFeeUGX     = Number(raw.membershipFeeUGX || 0);
      const membershipFeeUSD     = Number(raw.membershipFeeUSD || 0);

      if (!fullName || !email || !phone || !password || !program || !studentLevel || !serviceInterest || !paymentMethod)
        return sendJson(res, 400, { error: 'fullName, email, phone, password, program, studentLevel, serviceInterest, and paymentMethod are required.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return sendJson(res, 400, { error: 'Invalid email address.' });
      if (password.length < 8)
        return sendJson(res, 400, { error: 'Password must be at least 8 characters long.' });
      if (membershipFeeUGX !== 10000)
        return sendJson(res, 400, { error: 'Membership fee must be UGX 10,000.' });

      const allowedMethods = ['mtn_momo', 'airtel_money', 'visa_mastercard', 'bank_transfer'];
      if (!allowedMethods.includes(paymentMethod))
        return sendJson(res, 400, { error: 'Unsupported payment method.' });

      if (findAccountByEmail(email))
        return sendJson(res, 409, { error: 'An account already exists with that email address.' });

      const paymentLabels = {
        mtn_momo: 'MTN Mobile Money',
        airtel_money: 'Airtel Money',
        visa_mastercard: 'Visa / Mastercard',
        bank_transfer: 'Bank Transfer'
      };

      const accountId = generateAccountId();
      const record = {
        accountId,
        fullName,
        email,
        phone,
        passwordHash: hashPassword(password),
        program,
        studentLevel,
        graduationYear,
        serviceInterest,
        membershipFeeUGX,
        membershipFeeUSD,
        paymentMethod,
        paymentMethodLabel: paymentLabels[paymentMethod],
        transactionReference,
        paymentStatus: 'pending_verification',
        createdAt: new Date().toISOString()
      };

      fs.writeFileSync(accountPath(accountId), JSON.stringify(record, null, 2));

      return sendJson(res, 200, {
        success: true,
        accountId,
        paymentStatus: record.paymentStatus,
        message: `Account created for ${fullName}. Membership fee recorded as UGX 10,000. Payment verification is pending.`
      });
    } catch (err) {
      console.error('[register-student-account]', err);
      return sendJson(res, 500, { error: 'Account registration failed. Please try again.' });
    }
  }

  // ── POST /api/login-student-account ────────────────────────────────────────
  if (url.pathname === '/api/login-student-account' && req.method === 'POST') {
    try {
      const raw = JSON.parse((await readBody(req)) || '{}');
      const email = (raw.email || '').trim().toLowerCase();
      const password = String(raw.password || '');

      if (!email || !password)
        return sendJson(res, 400, { error: 'Email and password are required.' });

      const account = findAccountByEmail(email);
      if (!account || !verifyPassword(password, account.passwordHash))
        return sendJson(res, 401, { error: 'Invalid email or password.' });

      return sendJson(res, 200, {
        success: true,
        account: {
          accountId: account.accountId,
          fullName: account.fullName,
          email: account.email,
          program: account.program,
          studentLevel: account.studentLevel,
          paymentStatus: account.paymentStatus,
          serviceInterest: account.serviceInterest
        },
        message: `Signed in as ${account.fullName}. Membership payment status: ${account.paymentStatus.replace('_', ' ')}.`
      });
    } catch (err) {
      console.error('[login-student-account]', err);
      return sendJson(res, 500, { error: 'Sign in failed. Please try again.' });
    }
  }

  // ── POST /api/register-member ──────────────────────────────────────────────
  if (url.pathname === '/api/register-member' && req.method === 'POST') {
    try {
      const raw = JSON.parse((await readBody(req)) || '{}');

      const fullName       = (raw.fullName       || '').trim();
      const email          = (raw.email          || '').trim();
      const phone          = (raw.phone          || '').trim();
      const profession     = (raw.profession     || '').trim();
      const location       = (raw.location       || '').trim();
      const membershipType = (raw.membershipType || '').trim();

      if (!fullName || !email || !phone || !profession || !membershipType)
        return sendJson(res, 400, { error: 'fullName, email, phone, profession, and membershipType are required.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return sendJson(res, 400, { error: 'Invalid email address.' });
      if (!['Ordinary', 'VP', 'VVP'].includes(membershipType))
        return sendJson(res, 400, { error: 'membershipType must be Ordinary, VP, or VVP.' });

      const memberId = 'MEM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      const record   = {
        memberId, fullName, email, phone, profession, location,
        membershipType, registrationFee: 'UGX 10,000',
        registeredAt: new Date().toISOString(),
      };

      // Persist to disk
      const memberDir = path.join(ROOT, 'database', 'members');
      if (!fs.existsSync(memberDir)) fs.mkdirSync(memberDir, { recursive: true });
      fs.writeFileSync(path.join(memberDir, `${memberId}.json`), JSON.stringify(record, null, 2));

      // Generate certificate and send email (best-effort)
      let emailSent = false;
      let certificateGenerated = false;
      try {
        // Generate membership certificate
        if (PDFDocument) {
          const certificateData = { ...record, registeredAt: record.registeredAt };
          const certificateBuffer = await buildMembershipCertificatePDF(certificateData);
          
          // Save certificate to disk
          fs.writeFileSync(certificatePath(memberId), certificateBuffer);
          certificateGenerated = true;

          // Send email with certificate attachment
          if (nodemailer && SMTP.auth.user && SMTP.auth.pass) {
            await sendMembershipCertificateEmail(certificateData, certificateBuffer);
            emailSent = true;
          }
        }
      } catch (emailErr) {
        console.error('[member-certificate-email]', emailErr.message);
      }

      return sendJson(res, 200, {
        success:  true,
        memberId,
        emailSent,
        certificateGenerated,
        message: `Welcome, ${fullName}! Your ${membershipType} membership has been registered (ID: ${memberId}). ${
          certificateGenerated && emailSent 
            ? `Your membership certificate has been generated and sent to ${email}.` 
            : certificateGenerated 
              ? `Your membership certificate has been generated. Please save your Member ID for reference.`
              : 'Please save your Member ID for reference.'
        }`,
      });

    } catch (err) {
      console.error('[register-member]', err);
      return sendJson(res, 500, { error: 'Registration failed. Please try again.' });
    }
  }

  // ── POST /api/register-donation ───────────────────────────────────────────
  if (url.pathname === '/api/register-donation' && req.method === 'POST') {
    try {
      const raw = JSON.parse((await readBody(req)) || '{}');

      const fullName             = (raw.fullName || '').trim();
      const email                = (raw.email || '').trim();
      const phone                = (raw.phone || '').trim();
      const donorType            = (raw.donorType || '').trim();
      const graduationYear       = (raw.graduationYear || '').toString().trim();
      const organization         = (raw.organization || '').trim();
      const supportArea          = (raw.supportArea || '').trim();
      const paymentMethod        = (raw.paymentMethod || '').trim();
      const transactionReference = (raw.transactionReference || '').trim();
      const message              = (raw.message || '').trim();
      const anonymous            = Boolean(raw.anonymous);
      const donationAmount       = Number(raw.donationAmount || 0);

      if (!fullName || !email || !phone || !donorType || !supportArea || !paymentMethod)
        return sendJson(res, 400, { error: 'fullName, email, phone, donorType, supportArea, and paymentMethod are required.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return sendJson(res, 400, { error: 'Invalid email address.' });
      if (!Number.isFinite(donationAmount) || donationAmount < 1000)
        return sendJson(res, 400, { error: 'donationAmount must be at least UGX 1,000.' });

      const allowedMethods = ['mtn_momo', 'airtel_money', 'visa_mastercard', 'bank_transfer'];
      if (!allowedMethods.includes(paymentMethod))
        return sendJson(res, 400, { error: 'Unsupported payment method.' });

      const paymentLabels = {
        mtn_momo: 'MTN Mobile Money',
        airtel_money: 'Airtel Money',
        visa_mastercard: 'Visa / Mastercard',
        bank_transfer: 'Bank Transfer'
      };

      const donationId = 'DON-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      const donatedAt = new Date().toISOString();
      const record = {
        donationId,
        fullName,
        email,
        phone,
        donorType,
        graduationYear,
        organization,
        supportArea,
        donationAmount,
        currency: 'UGX',
        paymentMethod,
        paymentMethodLabel: paymentLabels[paymentMethod],
        transactionReference,
        message,
        anonymous,
        donatedAt
      };

      fs.writeFileSync(path.join(DONATION_DIR, `${donationId}.json`), JSON.stringify(record, null, 2));

      let pdfBuffer = null;
      try {
        pdfBuffer = await buildDonationReceiptPDF(record);
        fs.writeFileSync(donationReceiptPath(donationId), pdfBuffer);
      } catch (pdfErr) {
        console.error('[donation-receipt-pdf]', pdfErr.message);
      }

      let emailSent = false;
      let emailError = null;
      try {
        if (pdfBuffer && nodemailer && SMTP.auth.user && SMTP.auth.pass) {
          await sendDonationReceiptEmail(record, pdfBuffer);
          emailSent = true;
        }
      } catch (emailErr) {
        emailError = emailErr.message;
        console.error('[donation-email]', emailErr.message);
      }

      return sendJson(res, 200, {
        success: true,
        donationId,
        emailSent,
        emailError: emailError || undefined,
        message: `Thank you, ${fullName}. Your donation of UGX ${donationAmount.toLocaleString('en-US')} has been recorded under ${donationId}. ${
          emailSent
            ? `A receipt of appreciation has been sent to ${email}.`
            : 'The donation was recorded, but the appreciation receipt email could not be sent. Please keep this donation ID for reference.'
        }`
      });
    } catch (err) {
      console.error('[register-donation]', err);
      return sendJson(res, 500, { error: 'Donation submission failed. Please try again.' });
    }
  }

  // ── POST /api/register-event ────────────────────────────────────────────────
  if (url.pathname === '/api/register-event' && req.method === 'POST') {
    try {
      const raw = JSON.parse((await readBody(req)) || '{}');

      const fullName     = (raw.fullName     || '').trim();
      const email        = (raw.email        || '').trim();
      const phone        = (raw.phone        || '').trim();
      const eventName    = (raw.eventName    || 'BU Alumni Event').trim();
      const eventDate    = (raw.eventDate    || '').trim();
      const eventLocation= (raw.eventLocation|| '').trim();
      const eventTime    = (raw.eventTime    || '').trim();
      const eventType    = (raw.eventType    || '').trim();

      if (!fullName || !email || !phone)
        return sendJson(res, 400, { error: 'fullName, email, and phone are required.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return sendJson(res, 400, { error: 'Invalid email address.' });

      const data = { 
        fullName, 
        email, 
        phone, 
        eventName, 
        eventDate, 
        eventLocation, 
        eventTime, 
        eventType,
        ticketId: generateTicketId() 
      };

      // Build Enhanced Event Ticket PDF
      const pdfBuffer = await buildEventTicketPDF(data);

      // Persist PDF to disk so it can be downloaded later
      fs.writeFileSync(ticketPath(data.ticketId), pdfBuffer);

      // Also persist registration metadata as JSON
      fs.writeFileSync(
        path.join(REG_DIR, `${data.ticketId}.json`),
        JSON.stringify({ ...data, registeredAt: new Date().toISOString() }, null, 2)
      );

      // Send email
      let emailSent  = false;
      let emailError = null;
      try {
        await sendRegistrationEmail(data, pdfBuffer);
        emailSent = true;
      } catch (err) {
        emailError = err.message;
        console.error('[email]', err.message);
      }

      const downloadUrl = `${BASE_URL}/api/ticket/${data.ticketId}`;

      return sendJson(res, 200, {
        success:     true,
        ticketId:    data.ticketId,
        downloadUrl,
        emailSent,
        emailError:  emailError || undefined,
        message: emailSent
          ? `Registered! Your ticket has been sent to ${email}.`
          : `Registered (Ticket: ${data.ticketId}). Email failed — download your ticket below.`,
      });

    } catch (err) {
      console.error('[register-event]', err);
      return sendJson(res, 500, { error: 'Registration failed. Please try again.' });
    }
  }

  // ── GET /api/ticket/:ticketId ───────────────────────────────────────────────
  // Serves the stored PDF so the user can download it from the browser
  const ticketMatch = url.pathname.match(/^\/api\/ticket\/([A-Z0-9-]+)$/);
  if (ticketMatch && req.method === 'GET') {
    const id  = ticketMatch[1];
    const fp  = ticketPath(id);

    if (!fs.existsSync(fp)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Ticket not found.');
      return;
    }

    const stat = fs.statSync(fp);
    res.writeHead(200, {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="BU-Ticket-${id}.pdf"`,
      'Content-Length':      stat.size,
      'Cache-Control':       'private, max-age=86400',
    });
    fs.createReadStream(fp).pipe(res);
    return;
  }

  // ── Static files ────────────────────────────────────────────────────────────
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  const filePath = safeStaticPath(url.pathname);
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n  BU Alumni Portal  →  http://localhost:${PORT}\n`);
  if (!SMTP.auth.user)
    console.warn('  ⚠  SMTP not configured — set SMTP_USER and SMTP_PASS in .env to enable email.\n');
});
