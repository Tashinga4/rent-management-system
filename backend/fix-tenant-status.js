const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentms';

const tenantSchema = new mongoose.Schema({}, { strict: false, strictPopulate: false });
const Tenant = mongoose.model('Tenant', tenantSchema);

const paymentSchema = new mongoose.Schema({}, { strict: false, strictPopulate: false });
const Payment = mongoose.model('Payment', paymentSchema);

async function fixTenantPaymentStatus() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Fixing tenant payment status fields...\n');

    // Find tenants with email addresses we know
    const tenants = await Tenant.find({
      email: { $in: ['john@gmail.com', 'dylanhove4@gmail.com', 'ta2@gmail.com'] }
    });

    console.log(`Found ${tenants.length} tenants to update\n`);

    for (const tenant of tenants) {
      // Find their most recent PAID payment
      const paidPayment = await Payment.findOne({
        tenantId: tenant._id,
        status: 'Paid'
      }).sort({ paidDate: -1 });

      if (paidPayment) {
        tenant.paymentStatus = 'paid';
        tenant.lastPaymentDate = paidPayment.paidDate || paidPayment.dueDate;
        tenant.balance = 0;
        await tenant.save();
        
        console.log(`✅ Updated ${tenant.firstName} ${tenant.lastName}:`);
        console.log(`   - paymentStatus: paid`);
        console.log(`   - lastPaymentDate: ${tenant.lastPaymentDate}`);
        console.log(`   - balance: 0`);
        console.log();
      } else {
        console.log(`⚠️  No paid payment found for ${tenant.firstName} ${tenant.lastName}`);
      }
    }

    console.log('✅ All tenant records updated!\n');

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

fixTenantPaymentStatus();
