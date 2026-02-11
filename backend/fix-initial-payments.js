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
  receiptPath: String,
  receiptGeneratedAt: Date,
  notes: String,
  reference: String,
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

async function fixInitialPayments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find all initial payments that have notes about initial rent payment on tenant creation
    const initialPayments = await Payment.find({
      notes: { $regex: 'Initial rent payment on tenant creation', $options: 'i' },
      status: 'Pending'
    });

    console.log(`Found ${initialPayments.length} initial Pending payments to update`);

    if (initialPayments.length === 0) {
      console.log('No payments to update');
      await mongoose.disconnect();
      return;
    }

    // Update all to Paid status with paidDate set to dueDate
    const result = await Payment.updateMany(
      {
        notes: { $regex: 'Initial rent payment on tenant creation', $options: 'i' },
        status: 'Pending'
      },
      {
        $set: {
          status: 'Paid',
          paidDate: new Date() // Or use dueDate if you prefer
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} payments to "Paid" status`);
    
    // Show the updated payments
    const updatedPayments = await Payment.find({
      notes: { $regex: 'Initial rent payment on tenant creation', $options: 'i' }
    });

    console.log('\n✅ All initial payments are now marked as Paid:');
    updatedPayments.forEach(p => {
      console.log(`  - Payment ${p._id.toString().slice(-8)}: Status=${p.status}, Amount=$${p.amount}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done! All initial payments have been fixed.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

fixInitialPayments();
