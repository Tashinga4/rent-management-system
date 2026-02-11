const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentms';

const paymentSchema = new mongoose.Schema({}, { strict: false, strictPopulate: false });
const Payment = mongoose.model('Payment', paymentSchema);

const tenantSchema = new mongoose.Schema({}, { strict: false, strictPopulate: false });
const Tenant = mongoose.model('Tenant', tenantSchema);

async function checkTenantsPayments() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Looking up tenants and their payments...\n');

    // Find the specific tenants
    const tenants = await Tenant.find({
      email: { $in: ['john@gmail.com', 'dylanhove4@gmail.com', 'ta2@gmail.com'] }
    });

    console.log(`Found ${tenants.length} tenants\n`);

    for (const tenant of tenants) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TENANT: ${tenant.firstName} ${tenant.lastName} (${tenant.email})`);
      console.log(`ID: ${tenant._id}`);
      console.log(`Move-in: ${tenant.leaseStart ? new Date(tenant.leaseStart).toLocaleDateString() : 'N/A'}`);
      console.log(`${'='.repeat(60)}`);

      // Find ALL payments for this tenant
      const payments = await Payment.find({ tenantId: tenant._id }).sort({ dueDate: 1 });
      
      console.log(`\nTotal Payments: ${payments.length}\n`);

      payments.forEach((p, i) => {
        console.log(`Payment ${i+1}:`);
        console.log(`  ID: ${p._id.toString().slice(-8)}`);
        console.log(`  Status: ${p.status}`);
        console.log(`  Amount: $${p.amount}`);
        console.log(`  Due Date: ${p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'N/A'}`);
        console.log(`  Paid Date: ${p.paidDate ? new Date(p.paidDate).toLocaleDateString() : 'N/A'}`);
        console.log(`  Notes: ${p.notes || 'N/A'}`);
        console.log();
      });

      // Check what monthly-status would find
      const now = new Date();
      const currentMonth = now.getMonth(); // February = 1
      const currentYear = now.getFullYear(); // 2026
      
      const febPayment = await Payment.findOne({
        tenantId: tenant._id,
        dueDate: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      });

      console.log(`Query for February 2026 payment found:`);
      if (febPayment) {
        console.log(`  ✓ Payment ID: ${febPayment._id.toString().slice(-8)}`);
        console.log(`  ✓ Status: ${febPayment.status}`);
        console.log(`  ✓ Due: ${new Date(febPayment.dueDate).toLocaleDateString()}`);
      } else {
        console.log(`  ✗ No payment found for February 2026`);
      }
    }

    await mongoose.disconnect();
    console.log('\n\nDone!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkTenantsPayments();
