/**
 * BU Alumni Portal – Backend Server
 *
 * Endpoints:
 *   GET  /api/stats              – read alumni stats
 *   POST /api/stats              – update alumni stats
 *   POST /api/register-event     – register for an event, generate PDF ticket
 *                                  + receipt, email both to the registrant
 *
 * Environment variables (create a .env file or set in your shell):
 *   SMTP_HOST      – e.g. smtp.gmail.com
 *   SMTP_PORT      – e.g. 587
 *   SMTP_USER      – sender email address
 *   SMTP_PASS      – sender email password / app password
 *   SMTP_FROM_NAME – display name, default "BU Alumni Portal"
 *   PORT           – HTTP port, default 8080
 */

'use strict';

const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const { URL }  = require('url');
const crypto   = require('crypto');

// ── Optional .env loader (no extra dependency) ────────────────────────────────
(function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
})();

// ── Lazy-load optional dependencies ──────────────────────────────────────────
let nodemailer, PDFDocument;
try { nodemailer   = require('nodemailer'); } catch (_) { nodemailer   = null; }
try { PDFDocument  = require('pdfkit');     } catch (_) { PDFDocument  = null; }

// ── Config ────────────────────────────────────────────────────────────────────
const PORT      = process.env.PORT || 8080;
const ROOT      = __dirname;
const DB_PATH   = path.join(ROOT, 'database', 'stats.json');
const LOGO_PATH = path.join(ROOT, 'image', 'Bugema_logo.png');

const SMTP_CONFIG = {
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};
const FROM_NAME = process.env.SMTP_FROM_NAME || 'BU Alumni Portal';
const FROM_ADDR = `"${FROM_NAME}" <${SMTP_CONFIG.auth.user}>`;

// ── MIME types ────────────────────────────────────────────────────────────────
const MIME_TYPES = {
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
function readStats() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeStats(next) {
  const payload = { ...next, updatedAt: new Date().toISOString() };
  fs.writeFileSync(DB_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

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

function safeStaticPath(urlPathname) {
  const requested  = decodeURIComponent(urlPathname === '/' ? '/index.html' : urlPathname);
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, '');
  const filePath   = path.join(ROOT, normalized);
  return filePath.startsWith(ROOT) ? filePath : null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end',  () => resolve(body));
    req.on('error', reject);
  });
}

// ── PDF generation ────────────────────────────────────────────────────────────
/**
 * Builds a PDF buffer containing both the event ticket and the receipt.
 * Returns a Promise<Buffer>.
 */
function buildPDF(data) {
  return new Promise((resolve, reject) => {
    if (!PDFDocument) {
      return reject(new Error('pdfkit is not installed. Run: npm install'));
    }

    const doc    = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PRIMARY  = '#1d4ed8';
    const MUTED    = '#6b7280';
    const BORDER   = '#e5e7eb';
    const SUCCESS  = '#16a34a';
    const pageW    = doc.page.width - 100; // usable width

    // ── Helper: horizontal rule ──────────────────────────────────────────────
    function hr(y, color = BORDER) {
      doc.moveTo(50, y).lineTo(50 + pageW, y).strokeColor(color).lineWidth(1).stroke();
    }

    // ── Logo + header ────────────────────────────────────────────────────────
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 50, 45, { height: 40 });
    }
    doc.fontSize(10).fillColor(MUTED).text('BU Alumni Portal', 100, 50, { align: 'right' });
    doc.fontSize(8).fillColor(MUTED).text('alumni@bualumni.org  |  bualumni.org', 100, 63, { align: 'right' });

    doc.moveDown(3);
    hr(doc.y);
    doc.moveDown(1);

    // ── EVENT TICKET ─────────────────────────────────────────────────────────
    doc.fontSize(18).fillColor(PRIMARY).font('Helvetica-Bold')
       .text('EVENT TICKET', { align: 'center' });
    doc.moveDown(0.4);

    // Ticket ID badge
    doc.fontSize(11).fillColor(SUCCESS).font('Helvetica-Bold')
       .text(`Ticket ID: ${data.ticketId}`, { align: 'center' });
    doc.moveDown(0.8);

    // Event info box
    doc.roundedRect(50, doc.y, pageW, 80, 8)
       .fillAndStroke('#eff6ff', PRIMARY);
    const boxTop = doc.y - 80 + 16;
    doc.fontSize(14).fillColor(PRIMARY).font('Helvetica-Bold')
       .text(data.eventName, 70, boxTop, { width: pageW - 40 });
    doc.fontSize(10).fillColor('#1e40af').font('Helvetica')
       .text(`📅  ${data.eventDate || 'See event details'}`, 70, boxTop + 24, { width: pageW - 40 });
    doc.text(`📍  ${data.eventLocation || 'See event details'}`, 70, boxTop + 40, { width: pageW - 40 });
    doc.text(`🕐  ${data.eventTime || 'See event details'}`, 70, boxTop + 56, { width: pageW - 40 });

    doc.moveDown(1.5);

    // Attendee details
    doc.fontSize(11).fillColor('#111827').font('Helvetica-Bold').text('Attendee Details');
    doc.moveDown(0.4);

    const fields = [
      ['Full Name',  data.fullName],
      ['Email',      data.email],
      ['Phone',      data.phone],
      ['Registered', new Date().toLocaleString('en-UG', { timeZone: 'Africa/Kampala' }) + ' EAT'],
    ];

    for (const [label, value] of fields) {
      doc.fontSize(10).fillColor(MUTED).font('Helvetica').text(label + ':', 50, doc.y, { continued: true, width: 120 });
      doc.fillColor('#111827').font('Helvetica-Bold').text('  ' + value);
      doc.moveDown(0.3);
    }

    doc.moveDown(0.8);
    hr(doc.y);
    doc.moveDown(0.6);

    // Note
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
       .text('Please present this ticket (printed or on your device) at the event entrance.', { align: 'center' });

    // ── PAGE BREAK → RECEIPT ─────────────────────────────────────────────────
    doc.addPage();

    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 50, 45, { height: 40 });
    }
    doc.fontSize(10).fillColor(MUTED).text('BU Alumni Portal', 100, 50, { align: 'right' });
    doc.fontSize(8).fillColor(MUTED).text('alumni@bualumni.org  |  bualumni.org', 100, 63, { align: 'right' });

    doc.moveDown(3);
    hr(doc.y);
    doc.moveDown(1);

    doc.fontSize(18).fillColor(PRIMARY).font('Helvetica-Bold')
       .text('REGISTRATION RECEIPT', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor(MUTED).font('Helvetica')
       .text(`Receipt No: ${data.ticketId}-R  |  Issued: ${new Date().toLocaleDateString('en-UG')}`, { align: 'center' });
    doc.moveDown(1.2);

    // Receipt table
    const tableRows = [
      ['Event',       data.eventName],
      ['Date',        data.eventDate || '—'],
      ['Location',    data.eventLocation || '—'],
      ['Time',        data.eventTime || '—'],
      ['Attendee',    data.fullName],
      ['Email',       data.email],
      ['Phone',       data.phone],
      ['Ticket ID',   data.ticketId],
      ['Status',      'Confirmed ✓'],
    ];

    let rowY = doc.y;
    for (let i = 0; i < tableRows.length; i++) {
      const [label, value] = tableRows[i];
      const bg = i % 2 === 0 ? '#f9fafb' : '#ffffff';
      doc.rect(50, rowY, pageW, 22).fill(bg);
      doc.fontSize(10).fillColor(MUTED).font('Helvetica')
         .text(label, 60, rowY + 6, { width: 130 });
      doc.fillColor('#111827').font('Helvetica-Bold')
         .text(value, 200, rowY + 6, { width: pageW - 155 });
      rowY += 22;
    }

    doc.rect(50, doc.y, pageW, rowY - doc.y).strokeColor(BORDER).lineWidth(1).stroke();
    doc.y = rowY + 10;

    doc.moveDown(1);
    hr(doc.y);
    doc.moveDown(0.8);

    doc.fontSize(10).fillColor(SUCCESS).font('Helvetica-Bold')
       .text('Thank you for registering! We look forward to seeing you at the event.', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
       .text('For enquiries contact alumni@bualumni.org or call +256 700 123 400', { align: 'center' });

    doc.end();
  });
}

// ── Email sender ──────────────────────────────────────────────────────────────
async function sendRegistrationEmail(data, pdfBuffer) {
  if (!nodemailer) throw new Error('nodemailer is not installed. Run: npm install');
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in your .env file.');
  }

  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#1d4ed8;padding:28px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">BU Alumni Portal</h1>
          <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px;">Event Registration Confirmation</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="color:#111827;font-size:16px;margin:0 0 8px;">Hi <strong>${data.fullName}</strong>,</p>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
            You're registered for <strong>${data.eventName}</strong>. Your ticket and receipt are attached to this email as a PDF.
          </p>

          <!-- Ticket summary box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Event</p>
              <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1d4ed8;">${data.eventName}</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#374151;padding-bottom:6px;">📅 &nbsp;<strong>${data.eventDate || 'See event details'}</strong></td>
                  <td style="font-size:13px;color:#374151;padding-bottom:6px;">📍 &nbsp;<strong>${data.eventLocation || 'See event details'}</strong></td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#374151;">🕐 &nbsp;<strong>${data.eventTime || 'See event details'}</strong></td>
                  <td style="font-size:13px;color:#374151;">🎫 &nbsp;<strong>${data.ticketId}</strong></td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px;">
            Please find your <strong>event ticket</strong> and <strong>registration receipt</strong> in the attached PDF. Present the ticket at the event entrance.
          </p>
          <p style="color:#6b7280;font-size:13px;margin:0 0 28px;">
            For any questions, reply to this email or contact us at <a href="mailto:alumni@bualumni.org" style="color:#1d4ed8;">alumni@bualumni.org</a>.
          </p>

          <div style="text-align:center;">
            <a href="https://bualumni.org/events.html" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">View All Events</a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 BU Alumni Association · Bugema University, Kampala, Uganda</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from:        FROM_ADDR,
    to:          `"${data.fullName}" <${data.email}>`,
    subject:     `Your Ticket: ${data.eventName} – ${data.ticketId}`,
    html,
    attachments: [{
      filename:    `BU-Ticket-${data.ticketId}.pdf`,
      content:     pdfBuffer,
      contentType: 'application/pdf',
    }],
  });
}

// ── HTTP Server ───────────────────────────────────────────────────────────────
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
    try {
      return sendJson(res, 200, readStats());
    } catch (_) {
      return sendJson(res, 500, { error: 'Failed to read stats database.' });
    }
  }

  // ── POST /api/stats ─────────────────────────────────────────────────────────
  if (url.pathname === '/api/stats' && req.method === 'POST') {
    try {
      const body     = await readBody(req);
      const incoming = JSON.parse(body || '{}');
      const next     = {
        alumniMembers:        Number(incoming.alumniMembers),
        jobsThisYear:         Number(incoming.jobsThisYear),
        activeChapters:       Number(incoming.activeChapters),
        mentorshipConnections: Number(incoming.mentorshipConnections),
      };
      if (Object.values(next).some((v) => Number.isNaN(v) || v < 0)) {
        return sendJson(res, 400, { error: 'All stat values must be non-negative numbers.' });
      }
      return sendJson(res, 200, writeStats(next));
    } catch (_) {
      return sendJson(res, 400, { error: 'Invalid JSON payload.' });
    }
  }

  // ── POST /api/register-event ────────────────────────────────────────────────
  if (url.pathname === '/api/register-event' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const raw  = JSON.parse(body || '{}');

      // Validate required fields
      const fullName = (raw.fullName || '').trim();
      const email    = (raw.email    || '').trim();
      const phone    = (raw.phone    || '').trim();
      const eventName = (raw.eventName || 'BU Alumni Event').trim();

      if (!fullName || !email || !phone) {
        return sendJson(res, 400, { error: 'fullName, email, and phone are required.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { error: 'Invalid email address.' });
      }

      const data = {
        fullName,
        email,
        phone,
        eventName,
        eventDate:     (raw.eventDate     || '').trim(),
        eventLocation: (raw.eventLocation || '').trim(),
        eventTime:     (raw.eventTime     || '').trim(),
        ticketId:      generateTicketId(),
      };

      // Generate PDF
      const pdfBuffer = await buildPDF(data);

      // Send email (non-blocking failure — still return ticket to client)
      let emailSent = false;
      let emailError = null;
      try {
        await sendRegistrationEmail(data, pdfBuffer);
        emailSent = true;
      } catch (err) {
        emailError = err.message;
        console.error('[email]', err.message);
      }

      return sendJson(res, 200, {
        success:    true,
        ticketId:   data.ticketId,
        emailSent,
        emailError: emailError || undefined,
        message:    emailSent
          ? `Registration confirmed! Your ticket has been sent to ${email}.`
          : `Registration confirmed (Ticket ID: ${data.ticketId}). Email delivery failed — please contact alumni@bualumni.org.`,
      });

    } catch (err) {
      console.error('[register-event]', err);
      return sendJson(res, 500, { error: 'Registration failed. Please try again.' });
    }
  }

  // ── Static file serving ─────────────────────────────────────────────────────
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  const filePath = safeStaticPath(url.pathname);
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n  BU Alumni Portal  →  http://localhost:${PORT}`);
  if (!SMTP_CONFIG.auth.user) {
    console.warn('  ⚠  SMTP not configured. Set SMTP_USER and SMTP_PASS in a .env file to enable email delivery.');
  }
  console.log('');
});
