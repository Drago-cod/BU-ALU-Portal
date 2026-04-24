/**
 * BU Alumni Portal – Backend Server
 *
 * Endpoints:
 *   GET  /api/stats                  – read alumni stats
 *   POST /api/stats                  – update alumni stats
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
const BASE_URL  = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

// Ensure registrations folder exists
if (!fs.existsSync(REG_DIR)) fs.mkdirSync(REG_DIR, { recursive: true });

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

// ── PDF builder ───────────────────────────────────────────────────────────────
function buildPDF(data) {
  return new Promise((resolve, reject) => {
    if (!PDFDocument) return reject(new Error('pdfkit not installed — run: npm install'));

    const doc    = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PRIMARY = '#1d4ed8';
    const MUTED   = '#6b7280';
    const BORDER  = '#e5e7eb';
    const SUCCESS = '#16a34a';
    const W       = doc.page.width - 100;

    const hr = (y, col = BORDER) =>
      doc.moveTo(50, y).lineTo(50 + W, y).strokeColor(col).lineWidth(1).stroke();

    // ── Shared header ─────────────────────────────────────────────────────────
    function pageHeader() {
      if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, 50, 45, { height: 40 });
      doc.fontSize(10).fillColor(MUTED).text('BU Alumni Portal', 100, 50, { align: 'right' });
      doc.fontSize(8).fillColor(MUTED).text('alumni@bualumni.org  ·  bualumni.org', 100, 63, { align: 'right' });
      doc.moveDown(3);
      hr(doc.y);
      doc.moveDown(1);
    }

    // ════════════════════════════════════════════════════════════════
    // PAGE 1 — EVENT TICKET
    // ════════════════════════════════════════════════════════════════
    pageHeader();

    doc.fontSize(20).fillColor(PRIMARY).font('Helvetica-Bold')
       .text('EVENT TICKET', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor(SUCCESS).font('Helvetica-Bold')
       .text(`Ticket ID: ${data.ticketId}`, { align: 'center' });
    doc.moveDown(0.8);

    // Event info box
    const boxY = doc.y;
    doc.roundedRect(50, boxY, W, 88, 8).fillAndStroke('#eff6ff', PRIMARY);
    doc.fontSize(14).fillColor(PRIMARY).font('Helvetica-Bold')
       .text(data.eventName, 70, boxY + 14, { width: W - 40 });
    doc.fontSize(10).fillColor('#1e40af').font('Helvetica')
       .text(`Date:      ${data.eventDate     || 'See event details'}`, 70, boxY + 36, { width: W - 40 })
       .text(`Location:  ${data.eventLocation || 'See event details'}`, 70, boxY + 52, { width: W - 40 })
       .text(`Time:      ${data.eventTime     || 'See event details'}`, 70, boxY + 68, { width: W - 40 });
    doc.y = boxY + 100;

    doc.moveDown(1);
    doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold').text('Attendee Details');
    doc.moveDown(0.4);

    const attendeeFields = [
      ['Full Name',    data.fullName],
      ['Email',        data.email],
      ['Phone',        data.phone],
      ['Registered',   new Date().toLocaleString('en-UG', { timeZone: 'Africa/Kampala' }) + ' EAT'],
    ];
    for (const [lbl, val] of attendeeFields) {
      doc.fontSize(10).fillColor(MUTED).font('Helvetica')
         .text(lbl + ':', 50, doc.y, { continued: true, width: 130 });
      doc.fillColor('#111827').font('Helvetica-Bold').text('  ' + val);
      doc.moveDown(0.35);
    }

    doc.moveDown(0.8);
    hr(doc.y);
    doc.moveDown(0.6);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
       .text('Present this ticket (printed or on your device) at the event entrance.', { align: 'center' });

    // ════════════════════════════════════════════════════════════════
    // PAGE 2 — REGISTRATION RECEIPT
    // ════════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader();

    doc.fontSize(20).fillColor(PRIMARY).font('Helvetica-Bold')
       .text('REGISTRATION RECEIPT', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(MUTED).font('Helvetica')
       .text(
         `Receipt No: ${data.ticketId}-R   ·   Issued: ${new Date().toLocaleDateString('en-UG', { timeZone: 'Africa/Kampala' })}`,
         { align: 'center' }
       );
    doc.moveDown(1.2);

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
       .text('Enquiries: alumni@bualumni.org  ·  +256 700 123 400', { align: 'center' });

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

      if (!fullName || !email || !phone)
        return sendJson(res, 400, { error: 'fullName, email, and phone are required.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return sendJson(res, 400, { error: 'Invalid email address.' });

      const data = { fullName, email, phone, eventName, eventDate, eventLocation, eventTime,
                     ticketId: generateTicketId() };

      // Build PDF
      const pdfBuffer = await buildPDF(data);

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
