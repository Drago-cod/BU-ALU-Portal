const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const PORT = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// In-memory data stores (in production, use a real database)
const members = [];
const events = [];
const tickets = [];

// Generate unique IDs
function generateId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// PDF Generation using pdfkit
async function generateMembershipCard(member) {
  const PDFDocument = require('pdfkit');
  const QRCode = require('qrcode');
  
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  // Background
  doc.rect(0, 0, 612, 792).fill('#f0f9ff');
  
  // Header with logo placeholder
  doc.fill('#1140d9')
     .rect(0, 0, 612, 120)
     .fill();
  
  // Logo text (center of header)
  doc.fill('#ffffff')
     .fontSize(32)
     .font('Helvetica-Bold')
     .text('BU ALUMNI PORTAL', 0, 35, { align: 'center' });
  
  doc.fill('#ffffff')
     .fontSize(14)
     .font('Helvetica')
     .text('MEMBERSHIP CARD', 0, 75, { align: 'center' });
  
  // Member photo placeholder
  doc.circle(100, 200, 50).fill('#e0e7ff');
  doc.fill('#1140d9')
     .fontSize(40)
     .text(member.fullName ? member.fullName.charAt(0) : 'A', 80, 175);
  
  // Member details
  let yPos = 160;
  doc.fill('#0f172a')
     .fontSize(24)
     .font('Helvetica-Bold')
     .text(member.fullName || 'John Doe', 180, yPos);
  
  yPos += 35;
  doc.fill('#64748b')
     .fontSize(14)
     .font('Helvetica')
     .text(`Member ID: ${member.memberId}`, 180, yPos);
  
  yPos += 22;
  doc.text(`Email: ${member.email}`, 180, yPos);
  
  yPos += 22;
  doc.text(`Phone: ${member.phone}`, 180, yPos);
  
  // Membership tier badge
  const tierColors = {
    'Standard': '#64748b',
    'Premium': '#f59e0b',
    'Lifetime': '#10b981'
  };
  
  doc.fill(tierColors[member.membershipType] || '#64748b')
     .roundedRect(400, 160, 150, 40, 8)
     .fill();
  
  doc.fill('#ffffff')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text(member.membershipType.toUpperCase(), 475, 173, { align: 'center' });
  
  // QR Code
  let qrCodeDataUrl;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(member.memberId, { width: 128 });
  } catch (e) {
    console.error('QR generation failed:', e);
  }
  
  if (qrCodeDataUrl) {
    // Extract base64 data for PDF
    const qrBase64 = qrCodeDataUrl.split(',')[1];
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    doc.image(qrBuffer, 440, 250, { width: 128, height: 128 });
  }
  
  // Validity section
  yPos = 350;
  doc.fill('#0f172a')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('Membership Details', 50, yPos);
  
  yPos += 30;
  doc.fill('#334155')
     .fontSize(12)
     .font('Helvetica')
     .text(`Valid From: ${new Date(member.createdAt).toLocaleDateString()}`, 50, yPos);
  
  yPos += 20;
  doc.text(`Valid Until: ${member.membershipType === 'Lifetime' ? 'Permanent' : new Date(new Date(member.createdAt).setFullYear(new Date(member.createdAt).getFullYear() + 1)).toLocaleDateString()}`, 50, yPos);
  
  yPos += 20;
  doc.text(`Profession: ${member.profession || 'BU Alumni'}`, 50, yPos);
  
  // Footer
  doc.fill('#94a3b8')
     .fontSize(10)
     .text('This membership card is valid for all BU Alumni activities and events.', 50, 720)
     .text('Present this card at registration for priority access.', 50, 735);
  
  doc.end();
  
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Generate membership certificate
async function generateMembershipCertificate(member) {
  const PDFDocument = require('pdfkit');
  
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  // Border
  doc.rect(20, 20, 572, 752).stroke('#1140d9');
  
  // Header
  doc.fill('#1140d9')
     .fontSize(36)
     .font('Helvetica-Bold')
     .text('BUGEMA UNIVERSITY', 0, 80, { align: 'center' });
  
  doc.fill('#0f172a')
     .fontSize(24)
     .text('ALUMNI ASSOCIATION', 0, 120, { align: 'center' });
  
  // Certificate title
  doc.fill('#10b981')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('CERTIFICATE OF MEMBERSHIP', 0, 180, { align: 'center' });
  
  // Decorative line
  doc.strokeColor('#1140d9').lineWidth(2).moveTo(150, 210).lineTo(462, 210).stroke();
  
  // Content
  doc.fill('#334155')
     .fontSize(14)
     .font('Helvetica')
     .text('This is to certify that', 0, 250, { align: 'center' });
  
  doc.fill('#0f172a')
     .fontSize(32)
     .font('Helvetica-Bold')
     .text((member.fullName || 'Member Name').toUpperCase(), 0, 290, { align: 'center' });
  
  doc.fill('#334155')
     .fontSize(14)
     .font('Helvetica')
     .text(`Member ID: ${member.memberId}`, 0, 340, { align: 'center' });
  
  doc.text(`has been enrolled as a ${member.membershipType} member`, 0, 370, { align: 'center' });
  
  doc.text(`of the Bugema University Alumni Association on ${new Date(member.createdAt).toLocaleDateString()}.`, 0, 400, { align: 'center' });
  
  // Tier-specific text
  const tierBenefits = {
    'Standard': 'Access to the alumni directory, event notifications, and portal resources.',
    'Premium': 'All Standard benefits plus premium networking access and business directory listing.',
    'Lifetime': 'All Premium benefits plus mentorship matching, annual recognition, and insurance coverage.'
  };
  
  doc.fill('#64748b')
     .fontSize(12)
     .text(`Benefits: ${tierBenefits[member.membershipType] || ''}`, 100, 440, { width: 412, align: 'center' });
  
  // Signature line
  doc.moveDown(4);
  doc.strokeColor('#000000').lineWidth(1).moveTo(150, 580).lineTo(250, 580).stroke();
  doc.text('President, BU Alumni Association', 0, 590, { align: 'center' });
  
  // Date
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 0, 620, { align: 'center' });
  
  doc.end();
  
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Generate event ticket
async function generateTicket(ticket) {
  const PDFDocument = require('pdfkit');
  const QRCode = require('qrcode');
  
  const doc = new PDFDocument({ size: [400, 600], margin: 20 });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  // Background
  doc.rect(0, 0, 400, 600).fill('#ffffff');
  
  // Header
  doc.fill('#1140d9')
     .fontSize(18)
     .font('Helvetica-Bold')
     .text('BU ALUMNI EVENT TICKET', 0, 20, { align: 'center' });
  
  // Event name
  doc.fill('#0f172a')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text(ticket.eventName, 0, 60, { align: 'center' });
  
  // Details
  doc.fill('#334155')
     .fontSize(12)
     .font('Helvetica')
     .text(`Date: ${ticket.eventDate}`, 40, 110);
  
  doc.text(`Time: ${ticket.eventTime}`, 40, 130);
  
  doc.text(`Location: ${ticket.eventLocation}`, 40, 150);
  
  doc.text(`Attendee: ${ticket.fullName}`, 40, 170);
  
  doc.text(`Ticket ID: ${ticket.ticketId}`, 40, 190);
  
  // QR Code
  try {
    const qrData = await QRCode.toDataURL(ticket.ticketId, { width: 150 });
    const qrBase64 = qrData.split(',')[1];
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    doc.image(qrBuffer, 125, 220, { width: 150, height: 150 });
  } catch (e) {
    doc.text('QR Code', 125, 220);
  }
  
  // Footer
  doc.fill('#64748b')
     .fontSize(10)
     .text('Please present this ticket at the event entrance.', 0, 400, { align: 'center' });
  
  doc.end();
  
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Email sending using nodemailer
async function sendEmail(to, subject, html, attachments = []) {
  const nodemailer = require('nodemailer');
  
  // Create test account - in production, use real SMTP credentials
  let transporter;
  try {
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (e) {
    // Fallback for development
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false
    });
  }
  
  const mailOptions = {
    from: '"BU Alumni Portal" <alumni@bualumni.org>',
    to: to,
    subject: subject,
    html: html,
    attachments: attachments
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (e) {
    console.error('Email error:', e);
    return { success: false, error: e.message };
  }
}

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve(querystring.parse(body));
      }
    });
    req.on('error', reject);
  });
}

// Route handlers
async function handleRegisterMember(req, res) {
  try {
    const data = await parseBody(req);
    
    const member = {
      memberId: generateId('MEM'),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      profession: data.profession,
      location: data.location,
      membershipType: data.membershipType || 'Standard',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    members.push(member);
    
    // Generate PDF
    const pdfBuffer = await generateMembershipCard(member);
    
    // Send email
    const emailResult = await sendEmail(
      member.email,
      'BU Alumni Membership Card',
      `<h2>Welcome to BU Alumni Portal!</h2>
       <p>Dear ${member.fullName},</p>
       <p>Your membership has been successfully registered. Your membership card is attached.</p>
       <p>Member ID: ${member.memberId}</p>
       <p>Membership Type: ${member.membershipType}</p>`,
      [{
        filename: `membership-${member.memberId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    );
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        memberId: member.memberId,
        emailSent: emailResult.success
      }
    }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleRegisterEvent(req, res) {
  try {
    const data = await parseBody(req);
    
    const ticket = {
      ticketId: generateId('TKT'),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      eventId: data.eventId,
      eventName: data.eventName,
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      eventLocation: data.eventLocation,
      createdAt: new Date().toISOString()
    };
    
    tickets.push(ticket);
    
    // Generate ticket PDF
    const pdfBuffer = await generateTicket(ticket);
    
    // Send email
    const emailResult = await sendEmail(
      ticket.email,
      `Event Ticket: ${ticket.eventName}`,
      `<h2>Your Event Ticket</h2>
       <p>Dear ${ticket.fullName},</p>
       <p>Your ticket for ${ticket.eventName} is attached.</p>
       <p>Date: ${ticket.eventDate}</p>
       <p>Time: ${ticket.eventTime}</p>
       <p>Location: ${ticket.eventLocation}</p>`,
      [{
        filename: `ticket-${ticket.ticketId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    );
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        ticketId: ticket.ticketId,
        fullName: ticket.fullName,
        email: ticket.email,
        phone: ticket.phone,
        eventName: ticket.eventName,
        eventDate: ticket.eventDate,
        eventTime: ticket.eventTime,
        eventLocation: ticket.eventLocation,
        emailSent: emailResult.success,
        downloadUrl: `/api/ticket/${ticket.ticketId}`,
        message: emailResult.success 
          ? 'Registration successful! Your ticket has been sent to your email.' 
          : 'Registration successful! You can download your ticket below.'
      }
    }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleRegisterAccount(req, res) {
  try {
    const data = await parseBody(req);
    
    const account = {
      accountId: generateId('ACC'),
      username: data.username,
      email: data.email,
      password: data.password,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    // In production, hash password and store in database
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        accountId: account.accountId,
        email: account.email
      }
    }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleCertificate(req, res) {
  try {
    const memberId = req.url.split('/')[3];
    const member = members.find(m => m.memberId === memberId);
    
    if (!member) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Member not found' }));
      return;
    }
    
    const pdfBuffer = await generateMembershipCertificate(member);
    
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${memberId}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.end(pdfBuffer);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleDownloadTicket(req, res) {
  try {
    const ticketId = req.url.split('/')[3];
    const ticket = tickets.find(t => t.ticketId === ticketId);
    
    if (!ticket) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Ticket not found' }));
      return;
    }
    
    const pdfBuffer = await generateTicket(ticket);
    
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${ticketId}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.end(pdfBuffer);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleGetStats(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    data: {
      members: members.length,
      events: events.length,
      tickets: tickets.length
    }
  }));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // API Routes
  if (pathname === '/api/register-member' && req.method === 'POST') {
    return handleRegisterMember(req, res);
  }
  
  if (pathname === '/api/register-event' && req.method === 'POST') {
    return handleRegisterEvent(req, res);
  }
  
  if (pathname === '/api/register-account' && req.method === 'POST') {
    return handleRegisterAccount(req, res);
  }
  
  if (pathname.startsWith('/api/certificate/') && req.method === 'GET') {
    return handleCertificate(req, res);
  }
  
  if (pathname.startsWith('/api/ticket/') && req.method === 'GET') {
    return handleDownloadTicket(req, res);
  }
  
  if (pathname === '/api/stats' && req.method === 'GET') {
    return handleGetStats(req, res);
  }
  
  // Serve static files
  let filePath = path.join(__dirname, pathname);
  
  if (pathname === '/' || pathname === '') {
    filePath = path.join(__dirname, 'index.html');
  }
  
  fs.stat(filePath, (statError, stats) => {
    if (statError) {
      const htmlPath = filePath + '.html';
      fs.stat(htmlPath, (htmlStatError, htmlStats) => {
        if (!htmlStatError && htmlStats.isFile()) {
          fs.readFile(htmlPath, (error, content) => {
            if (error) {
              res.writeHead(500);
              res.end('Server Error');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content, 'utf-8');
            }
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 - File Not Found</h1>', 'utf-8');
        }
      });
    } else if (stats.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      fs.readFile(indexPath, (error, content) => {
        if (error) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 - File Not Found</h1>', 'utf-8');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        }
      });
    } else if (stats.isFile()) {
      const extname = String(path.extname(filePath)).toLowerCase();
      const contentType = mimeTypes[extname] || 'application/octet-stream';
      fs.readFile(filePath, (error, content) => {
        if (error) {
          res.writeHead(500);
          res.end('Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  BU Alumni Portal Server Running!`);
  console.log(`========================================`);
  console.log(`\n  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://127.0.0.1:${PORT}`);
  console.log(`\n  API Endpoints:`);
  console.log(`  POST /api/register-member - Register member + send card PDF`);
  console.log(`  POST /api/register-event  - Register event + send ticket PDF`);
  console.log(`  POST /api/register-account - Register account`);
  console.log(`  GET  /api/certificate/:id - Download membership certificate`);
  console.log(`  GET  /api/ticket/:id      - Download event ticket`);
  console.log(`  GET  /api/stats           - Get system statistics`);
  console.log(`\n  Press Ctrl+C to stop the server`);
  console.log(`========================================\n`);
});