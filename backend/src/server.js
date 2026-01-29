const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// MongoDB Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentms';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - Using MongoDB
app.use('/api/properties', require('./routes/properties'));
app.use('/api/suites', require('./routes/suites'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'RentMS API is running (MongoDB)',
    version: '1.0.0',
    database: 'MongoDB',
    endpoints: {
      properties: '/api/properties',
      suites: '/api/suites',
      rooms: '/api/rooms',
      tenants: '/api/tenants',
      payments: '/api/payments',
      maintenance: '/api/maintenance',
      auth: '/api/auth',
      health: '/api/health'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'RentMS API is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  🚀 RentMS Backend Server Running (MongoDB)       ║');
  console.log(`║  📍 Port: ${PORT}                                     ║`);
  console.log(`║  📡 API: http://localhost:${PORT}/api              ║`);
  console.log(`║  🗄️  Database: ${MONGODB_URI.substring(0, 40)}...   ║`);
  console.log('║  ✅ Status: Ready to accept requests              ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
