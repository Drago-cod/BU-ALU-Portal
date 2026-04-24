const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, 'database', 'stats.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function readStats() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeStats(nextStats) {
  const payload = {
    ...nextStats,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(DB_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function safeStaticPath(urlPathname) {
  const requested = decodeURIComponent(urlPathname === '/' ? '/index.html' : urlPathname);
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT, normalized);
  if (!filePath.startsWith(ROOT)) return null;
  return filePath;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/stats' && req.method === 'GET') {
    try {
      return sendJson(res, 200, readStats());
    } catch (error) {
      return sendJson(res, 500, { error: 'Failed to read stats database.' });
    }
  }

  if (url.pathname === '/api/stats' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body || '{}');
        const nextStats = {
          alumniMembers: Number(incoming.alumniMembers),
          jobsThisYear: Number(incoming.jobsThisYear),
          activeChapters: Number(incoming.activeChapters),
          mentorshipConnections: Number(incoming.mentorshipConnections)
        };
        const hasInvalid = Object.values(nextStats).some((value) => Number.isNaN(value) || value < 0);
        if (hasInvalid) {
          return sendJson(res, 400, { error: 'All stat values must be non-negative numbers.' });
        }
        return sendJson(res, 200, writeStats(nextStats));
      } catch (_) {
        return sendJson(res, 400, { error: 'Invalid JSON payload.' });
      }
    });
    return;
  }

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

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`BU Alumni Portal running at http://localhost:${PORT}`);
});
