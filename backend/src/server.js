const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const emailService = require('./services/emailService');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Server status tracking
const serverStatus = {
  startTime: Date.now(),
  isReady: false,
  lastError: null,
  connectionAttempts: 0,
  maxRetries: 5,
  retryDelay: 2000
};

// MongoDB Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentms';

// Function to connect with retry logic
async function connectToMongoDB(attempt = 1) {
  try {
    serverStatus.connectionAttempts = attempt;
    console.log(`⏳ MongoDB Connection Attempt ${attempt}/${serverStatus.maxRetries}...`);
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');
    serverStatus.isReady = true;
    serverStatus.lastError = null;
    return true;
  } catch (err) {
    serverStatus.lastError = err.message;
    console.error(`❌ MongoDB connection error (Attempt ${attempt}/${serverStatus.maxRetries}):`, err.message);
    
    if (attempt < serverStatus.maxRetries) {
      console.log(`⏱️  Retrying in ${serverStatus.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, serverStatus.retryDelay));
      return connectToMongoDB(attempt + 1);
    } else {
      console.error('❌ Max retry attempts reached. Starting in degraded mode.');
      serverStatus.isReady = true; // Allow server to run but mark DB as unavailable
      return false;
    }
  }
}

// Function to initialize 80 compartments
async function initializeCompartments() {
  try {
    const Compartment = require('./models/Compartment');
    const existingCount = await Compartment.countDocuments();
    
    if (existingCount === 0) {
      console.log('⏳ Initializing 80 default compartments...');
      
      const compartmentsToCreate = Array.from({ length: 80 }, (_, index) => ({
        compartmentNumber: `C${String(index + 1).padStart(3, '0')}`,
        name: `Compartment ${index + 1}`,
        type: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        status: 'vacant',
        rentAmount: 350,
        paymentDueDay: 1,
        description: '2 Bedroom, 1 Bathroom Apartment',
        amenities: ['Bedroom 1', 'Bedroom 2', 'Bathroom']
      }));
      
      await Compartment.insertMany(compartmentsToCreate);
      console.log('✅ Successfully created 80 compartments');
    } else {
      console.log(`✅ ${existingCount} compartments already exist`);
    }
  } catch (error) {
    console.error('❌ Error initializing compartments:', error.message);
  }
}

// Function to ensure all compartments have fixed $350 rent
async function normalizeCompartmentRent() {
  try {
    const Compartment = require('./models/Compartment');
    const result = await Compartment.updateMany(
      { rentAmount: { $ne: 350 } },  // Update all compartments where rent is NOT 350
      { rentAmount: 350 }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Updated ${result.modifiedCount} compartments to fixed $350 rent`);
    } else {
      console.log('✅ All compartments already have $350 rent');
    }
  } catch (error) {
    console.error('❌ Error normalizing compartment rent:', error.message);
  }
}

// Initialize MongoDB connection on startup (non-blocking)
connectToMongoDB().then(async () => {
  await initializeCompartments();
  await normalizeCompartmentRent();
  
  // Initialize monthly payment generator
  const { initializeMonthlyPaymentJob } = require('./services/monthlyPaymentGenerator');
  initializeMonthlyPaymentJob();
}).catch(err => {
  console.warn('⚠️  MongoDB connection failed, continuing with degraded mode:', err.message);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
const frontendPath = path.join(__dirname, '../../');
app.use(express.static(frontendPath));

// Root endpoint - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Routes - Using MongoDB
// Improved error handling for route initialization
const routePaths = [
  ['/api/properties', './routes/properties'],
  ['/api/suites', './routes/suites'],
  ['/api/rooms', './routes/rooms'],
  ['/api/compartments', './routes/compartments'],
  ['/api/tenants', './routes/tenants'],
  ['/api/payments', './routes/payments'],
  ['/api/maintenance', './routes/maintenance'],
  ['/api/auth', './routes/auth'], // Authentication route
  ['/api/profile', './routes/profile'],
  ['/api/import', './routes/import-local']
];
routePaths.forEach(([path, module]) => {
  try {
    app.use(path, require(module));
    // For authentication, ensure /api/auth is enabled and configured
    // You can use JWT, Passport.js, or similar for login/register
  } catch (routeError) {
    console.error(`❌ Route initialization error for ${path}:`, routeError.message);
    console.error('Stack:', routeError.stack);
  }
});

// Add POST /api/tenants error logging middleware
app.use('/api/tenants', (req, res, next) => {
  if (req.method === 'POST') {
    // Log incoming POST body for debugging
    console.log('POST /api/tenants body:', req.body);
    // Validate email format (allow real emails)
    const email = req.body.email;
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format. Please enter a real email address.' });
    }
    // Example: send welcome email or receipt after tenant creation
    // This is just a demonstration; actual sending should be after payment
    if (email) {
      emailService.sendPaymentReceipt(email, req.body.firstName + ' ' + req.body.lastName, 350, new Date().toISOString())
        .then(() => {
          console.log('✅ Payment receipt email sent to tenant:', email);
        })
        .catch(err => {
          console.error('❌ Failed to send payment receipt email:', err.message);
        });
    }
  }
  next();
});

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
  const dbStatus = mongoose.connection.readyState;
  const dbConnected = dbStatus === 1;
  
  res.status(dbConnected ? 200 : 503).json({ 
    status: serverStatus.isReady ? 'ready' : 'initializing',
    message: serverStatus.isReady ? 'Backend is operational' : 'Backend is starting up',
    database: dbConnected ? 'Connected' : 'Disconnected',
    connectionAttempts: serverStatus.connectionAttempts,
    uptime: Math.floor((Date.now() - serverStatus.startTime) / 1000),
    lastError: serverStatus.lastError,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found', 
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Starting graceful shutdown...');
  mongoose.disconnect().then(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received. Starting graceful shutdown...');
  mongoose.disconnect().then(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  🚀 RentMS Backend Server Running (MongoDB)       ║');
  console.log(`║  📍 Port: ${PORT}                                     ║`);
  console.log(`║  📡 API: http://localhost:${PORT}/api              ║`);
  console.log(`║  🗄️  Database: ${dbStatus}                         ║`);
  console.log(`║  🔄 Connection Attempts: ${serverStatus.connectionAttempts}/${serverStatus.maxRetries}           ║`);
  console.log('║  ✅ Status: Ready to accept requests              ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Available endpoints:');
  console.log('  - Health Check: GET /api/health');
  console.log('  - Properties: /api/properties');
  console.log('  - Tenants: /api/tenants');
  console.log('  - Payments: /api/payments');
  console.log('  - Maintenance: /api/maintenance');
  console.log('  - Bulk Import: /api/import');
  console.log('');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please free the port or use a different one.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
