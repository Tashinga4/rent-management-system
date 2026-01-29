const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    // For development, continue without DB if not available
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Running without database connection');
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
