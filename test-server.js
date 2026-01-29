const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is running!');
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
