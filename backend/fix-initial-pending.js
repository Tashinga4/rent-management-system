const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentms';

const paymentSchema = new mongoose.Schema({}, { strict: false });

const Payment = mongoose.model('Payment', paymentSchema);

async function findPendingInitialPayments() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Searching for Pending initial payments...\n');

    // Find all payments with notes containing "Initial rent payment"
    const initialPayments = await Payment.find({
      notes: { $regex: 'Initial rent payment', $options: 'i' }
    }).populate('tenantId');

    console.log(`✅ Found ${initialPayments.length} initial payments total:\n`);
    
    initialPayments.forEach((p, i) => {
      const tenant = p.tenantId ? `${p.tenantId.firstName} ${p.tenantId.lastName}` : 'Unknown Tenant';
      console.log(`${i+1}. Tenant: ${tenant}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Amount: $${p.amount}`);
      console.log(`   Notes: ${p.notes}`);
      console.log();
    });

    const pending = initialPayments.filter(p => p.status === 'Pending');
    console.log(`\n❌ Pending Initial Payments: ${pending.length}`);
    pending.forEach(p => {
      console.log(`   - ${p._id}: Status=${p.status}`);
    });

    if (pending.length > 0) {
      console.log(`\n🔧 Fixing ${pending.length} Pending initial payments...\n`);
      
      const result = await Payment.updateMany(
        {
          _id: { $in: pending.map(p => p._id) }
        },
        {
          $set: {
            status: 'Paid',
            paidDate: new Date()
          }
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} payments to Paid status`);
    } else {
      console.log(`\n✅ All initial payments are already marked as Paid!`);
    }

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

findPendingInitialPayments();
