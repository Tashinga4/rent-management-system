const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_DIR = path.resolve(__dirname);

process.stdout.write('\n=================================\n');
process.stdout.write('Starting RentMS Dashboard Server\n');
process.stdout.write('Base directory: ' + BASE_DIR + '\n');
process.stdout.write('=================================\n\n');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  process.stdout.write(req.method + ' ' + req.url + '\n');

  let filePath = req.url;
  if (filePath === '/') {
    filePath = '/html/index.html';
  }

  filePath = filePath.split('?')[0];
  filePath = path.join(BASE_DIR, filePath);
  
  process.stdout.write('Attempting to serve: ' + filePath + '\n');

  // Check if file/directory exists
  fs.stat(filePath, (statErr, stats) => {
    if (statErr) {
      if (statErr.code === 'ENOENT') {
        console.log('File not found:', filePath);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<h1>404 Not Found</h1><p>File: ${filePath}</p>`, 'utf-8');
        return;
      } else {
        console.error('Stat error:', statErr);
        res.writeHead(500);
        res.end(`Server Error: ${statErr.code}`, 'utf-8');
        return;
      }
    }

    // If it's a directory, serve index.html
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      console.log('Directory detected, serving:', filePath);
    }

    // Now read the file
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        if (readErr.code === 'ENOENT') {
          console.log('File not found:', filePath);
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(`<h1>404 Not Found</h1><p>File: ${filePath}</p>`, 'utf-8');
        } else {
          console.error('Read error:', readErr);
          res.writeHead(500);
          res.end(`Server Error: ${readErr.code}`, 'utf-8');
        }
      } else {
        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  process.stdout.write('=================================\n');
  process.stdout.write('✅ Server running at http://localhost:' + PORT + '/\n');
  process.stdout.write('📊 Dashboard: http://localhost:' + PORT + '/html/index.html\n');
  process.stdout.write('=================================\n\n');
});

