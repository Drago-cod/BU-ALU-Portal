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
const accounts = [];
const communityPosts = [];
const postLikes = {}; // { postId: { userEmail: true } }
const postComments = {}; // { postId: [comments] }
const connections = {}; // { userEmail: [connectedEmails] }
const messages = {}; // { chatKey: [messages] }

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
    
    // Check if email already exists
    const existingAccount = accounts.find(a => a.email === data.email);
    if (existingAccount) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Email already registered' }));
      return;
    }
    
    const account = {
      accountId: generateId('ACC'),
      fullName: data.fullName || data.username,
      email: data.email,
      password: data.password, // In production, hash this!
      phone: data.phone || '',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    accounts.push(account);
    
    // Generate a simple token
    const token = Buffer.from(`${account.accountId}:${Date.now()}`).toString('base64');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        accountId: account.accountId,
        email: account.email,
        fullName: account.fullName,
        token: token
      },
      token: token,
      account: {
        accountId: account.accountId,
        email: account.email,
        fullName: account.fullName
      }
    }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleLoginAccount(req, res) {
  try {
    const data = await parseBody(req);
    
    console.log('Login attempt:', data.email);
    console.log('Available accounts:', accounts.map(a => a.email));
    
    // Find account by email
    const account = accounts.find(a => a.email === data.email);
    
    if (!account) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid email or password' }));
      return;
    }
    
    // Check password (in production, use proper password hashing!)
    if (account.password !== data.password) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid email or password' }));
      return;
    }
    
    // Generate a simple token
    const token = Buffer.from(`${account.accountId}:${Date.now()}`).toString('base64');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        accountId: account.accountId,
        email: account.email,
        fullName: account.fullName,
        token: token
      },
      token: token,
      account: {
        accountId: account.accountId,
        email: account.email,
        fullName: account.fullName
      }
    }));
    
    console.log('Login successful for:', account.email);
  } catch (e) {
    console.error('Login error:', e);
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
    console.log('Download ticket request for:', ticketId);
    console.log('Available tickets:', tickets.map(t => t.ticketId));
    
    const ticket = tickets.find(t => t.ticketId === ticketId);
    
    if (!ticket) {
      console.log('Ticket not found:', ticketId);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Ticket Not Found</h1><p>The ticket you are looking for does not exist.</p>');
      return;
    }
    
    console.log('Generating PDF for ticket:', ticket);
    const pdfBuffer = await generateTicket(ticket);
    
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="BU-Ticket-${ticketId}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.end(pdfBuffer);
    console.log('Ticket PDF sent successfully');
  } catch (e) {
    console.error('Error downloading ticket:', e);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>500 - Server Error</h1><p>${e.message}</p>`);
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

async function handleRegisterDonation(req, res) {
  try {
    const data = await parseBody(req);
    
    const donation = {
      donationId: generateId('DON'),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      amount: data.amount,
      currency: data.currency || 'UGX',
      paymentMethod: data.paymentMethod,
      message: data.message || '',
      createdAt: new Date().toISOString(),
      status: 'pending' // In demo mode, we'll mark as completed
    };
    
    console.log('Donation received:', donation);
    
    // DEMO MODE: Simulate successful payment
    // In production, you would integrate with actual payment APIs
    const paymentMethodNames = {
      'mtn_momo': 'MTN Mobile Money',
      'airtel_money': 'Airtel Money',
      'visa_mastercard': 'Visa/Mastercard',
      'bank_transfer': 'Bank Transfer'
    };
    
    const paymentName = paymentMethodNames[data.paymentMethod] || 'Mobile Money';
    
    // Simulate payment success after 2 seconds
    donation.status = 'completed';
    donation.transactionRef = generateId('TXN');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        donationId: donation.donationId,
        transactionRef: donation.transactionRef,
        amount: donation.amount,
        currency: donation.currency,
        paymentMethod: paymentName,
        message: `✅ Thank you for your donation of ${donation.currency} ${donation.amount.toLocaleString()}! Your ${paymentName} payment has been processed successfully. (Demo Mode - No actual payment was made)`
      }
    }));
    
    console.log('Donation processed (demo mode):', donation.donationId);
  } catch (e) {
    console.error('Donation error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

// Community API handlers
async function handleGetPosts(req, res) {
  try {
    const parsedUrl = url.parse(req.url, true);
    const limit = parseInt(parsedUrl.query.limit) || 20;
    const offset = parseInt(parsedUrl.query.offset) || 0;
    
    // Return posts with like counts and comment counts
    const postsWithStats = communityPosts.slice(offset, offset + limit).map(post => {
      const likes = postLikes[post.id] || {};
      const comments = postComments[post.id] || [];
      
      return {
        ...post,
        likes: Object.keys(likes).length,
        commentCount: comments.length,
        comments: comments
      };
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        posts: postsWithStats,
        total: communityPosts.length,
        limit: limit,
        offset: offset
      }
    }));
  } catch (e) {
    console.error('Get posts error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleCreatePost(req, res) {
  try {
    const data = await parseBody(req);
    
    const post = {
      id: generateId('POST'),
      author: data.author || 'Anonymous',
      authorEmail: data.authorEmail || '',
      profession: data.profession || 'BU Alumni',
      avatar: data.avatar || '',
      photo: data.photo || '',
      content: data.content,
      photos: data.photos || [],
      type: data.type || 'update',
      badge: data.badge || '',
      link: data.link || null,
      time: 'Just now',
      createdAt: new Date().toISOString()
    };
    
    communityPosts.unshift(post);
    postLikes[post.id] = {};
    postComments[post.id] = [];
    
    console.log('Post created:', post.id, 'with', post.photos?.length || 0, 'photos');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        post: {
          ...post,
          likes: 0,
          commentCount: 0,
          comments: []
        }
      }
    }));
  } catch (e) {
    console.error('Create post error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleToggleLike(req, res) {
  try {
    const data = await parseBody(req);
    const postId = data.postId;
    const userEmail = data.userEmail;
    
    if (!postId || !userEmail) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing postId or userEmail' }));
      return;
    }
    
    if (!postLikes[postId]) {
      postLikes[postId] = {};
    }
    
    const isLiked = postLikes[postId][userEmail];
    
    if (isLiked) {
      delete postLikes[postId][userEmail];
    } else {
      postLikes[postId][userEmail] = true;
    }
    
    const likeCount = Object.keys(postLikes[postId]).length;
    
    console.log(`Post ${postId} ${isLiked ? 'unliked' : 'liked'} by ${userEmail}. Total likes: ${likeCount}`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        postId: postId,
        liked: !isLiked,
        likeCount: likeCount
      }
    }));
  } catch (e) {
    console.error('Toggle like error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleAddComment(req, res) {
  try {
    const data = await parseBody(req);
    const postId = data.postId;
    const authorName = data.authorName;
    const content = data.content;
    
    if (!postId || !authorName || !content) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
      return;
    }
    
    if (!postComments[postId]) {
      postComments[postId] = [];
    }
    
    const comment = {
      id: generateId('COMMENT'),
      author: authorName,
      avatar: data.avatar || '',
      text: content,
      createdAt: new Date().toISOString()
    };
    
    postComments[postId].push(comment);
    
    console.log(`Comment added to post ${postId} by ${authorName}`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        comment: comment,
        commentCount: postComments[postId].length
      }
    }));
  } catch (e) {
    console.error('Add comment error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

// Connection API handlers
async function handleSendConnection(req, res) {
  try {
    const data = await parseBody(req);
    const fromEmail = data.fromEmail;
    const toEmail = data.toEmail;
    
    if (!fromEmail || !toEmail) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
      return;
    }
    
    if (!connections[fromEmail]) {
      connections[fromEmail] = [];
    }
    
    if (!connections[fromEmail].includes(toEmail)) {
      connections[fromEmail].push(toEmail);
    }
    
    // Add reverse connection
    if (!connections[toEmail]) {
      connections[toEmail] = [];
    }
    
    if (!connections[toEmail].includes(fromEmail)) {
      connections[toEmail].push(fromEmail);
    }
    
    console.log(`Connection created between ${fromEmail} and ${toEmail}`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        connected: true,
        connectionCount: connections[fromEmail].length
      }
    }));
  } catch (e) {
    console.error('Send connection error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleGetConnections(req, res) {
  try {
    const parsedUrl = url.parse(req.url, true);
    const userEmail = parsedUrl.query.email;
    
    if (!userEmail) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing email parameter' }));
      return;
    }
    
    const userConnections = connections[userEmail] || [];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        connections: userConnections,
        count: userConnections.length
      }
    }));
  } catch (e) {
    console.error('Get connections error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

// Messaging API handlers
async function handleSendMessage(req, res) {
  try {
    const data = await parseBody(req);
    const fromEmail = data.fromEmail;
    const toEmail = data.toEmail;
    const text = data.text;
    
    if (!fromEmail || !toEmail || !text) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
      return;
    }
    
    // Create chat key (sorted emails)
    const chatKey = [fromEmail, toEmail].sort().join(':');
    
    if (!messages[chatKey]) {
      messages[chatKey] = [];
    }
    
    const message = {
      id: generateId('MSG'),
      sender: fromEmail,
      text: text,
      timestamp: new Date().toISOString()
    };
    
    messages[chatKey].push(message);
    
    console.log(`Message sent from ${fromEmail} to ${toEmail}`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        message: message,
        chatKey: chatKey
      }
    }));
  } catch (e) {
    console.error('Send message error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

async function handleGetMessages(req, res) {
  try {
    const parsedUrl = url.parse(req.url, true);
    const email1 = parsedUrl.query.email1;
    const email2 = parsedUrl.query.email2;
    
    if (!email1 || !email2) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing email parameters' }));
      return;
    }
    
    const chatKey = [email1, email2].sort().join(':');
    const chatMessages = messages[chatKey] || [];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        messages: chatMessages,
        chatKey: chatKey,
        count: chatMessages.length
      }
    }));
  } catch (e) {
    console.error('Get messages error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Add CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
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
  
  if (pathname === '/api/login-account' && req.method === 'POST') {
    return handleLoginAccount(req, res);
  }
  
  if (pathname === '/api/register-donation' && req.method === 'POST') {
    return handleRegisterDonation(req, res);
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
  
  // Community API Routes
  if (pathname === '/api/community/posts' && req.method === 'GET') {
    return handleGetPosts(req, res);
  }
  
  if (pathname === '/api/community/post' && req.method === 'POST') {
    return handleCreatePost(req, res);
  }
  
  if (pathname === '/api/community/like' && req.method === 'POST') {
    return handleToggleLike(req, res);
  }
  
  if (pathname === '/api/community/comment' && req.method === 'POST') {
    return handleAddComment(req, res);
  }
  
  // Connection API Routes
  if (pathname === '/api/connections/send' && req.method === 'POST') {
    return handleSendConnection(req, res);
  }
  
  if (pathname === '/api/connections/list' && req.method === 'GET') {
    return handleGetConnections(req, res);
  }
  
  // Messaging API Routes
  if (pathname === '/api/messages/send' && req.method === 'POST') {
    return handleSendMessage(req, res);
  }
  
  if (pathname === '/api/messages/list' && req.method === 'GET') {
    return handleGetMessages(req, res);
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
  console.log(`  POST /api/login-account    - Login to account`);
  console.log(`  POST /api/register-donation - Process donation (demo mode)`);
  console.log(`  GET  /api/certificate/:id - Download membership certificate`);
  console.log(`  GET  /api/ticket/:id      - Download event ticket`);
  console.log(`  GET  /api/stats           - Get system statistics`);
  console.log(`  GET  /api/community/posts - Get community posts`);
  console.log(`  POST /api/community/post  - Create new post`);
  console.log(`  POST /api/community/like  - Toggle like on post`);
  console.log(`  POST /api/community/comment - Add comment to post`);
  console.log(`  POST /api/connections/send - Send connection request`);
  console.log(`  GET  /api/connections/list - Get user connections`);
  console.log(`  POST /api/messages/send    - Send direct message`);
  console.log(`  GET  /api/messages/list    - Get chat messages`);
  console.log(`\n  Press Ctrl+C to stop the server`);
  console.log(`========================================\n`);
});