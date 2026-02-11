const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentms';

const paymentSchema = new mongoose.Schema({
  tenantId: mongoose.Schema.Types.ObjectId,
  compartmentId: mongoose.Schema.Types.ObjectId,
  propertyId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  dueDate: Date,
  paidDate: Date,
  status: String,
  paymentMethod: String,
  receiptGenerated: Boolean,
  notes: String,
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const Payment = mongoose.model('Payment', paymentSchema);

async function checkPayments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Get ALL payments to see what we have
    const allPayments = await Payment.find().sort({ createdAt: -1 }).limit(20);

    console.log(`\n📋 Last 20 Payments in Database:\n`);
    allPayments.forEach((p, i) => {
      console.log(`${i+1}. ID: ${p._id.toString().slice(-8)}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Amount: $${p.amount}`);
      console.log(`   Due Date: ${p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   Paid Date: ${p.paidDate ? new Date(p.paidDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   Notes: ${p.notes || 'N/A'}`);
      console.log();
    });

    // Count by status
    const paymentsByStatus = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('\n📊 Payments by Status:');
    paymentsByStatus.forEach(p => {
      console.log(`   ${p._id}: ${p.count}`);
    });

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkPayments();
