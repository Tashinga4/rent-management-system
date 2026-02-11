const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentms';

const paymentSchema = new mongoose.Schema({}, { strict: false, strictPopulate: false });
const Payment = mongoose.model('Payment', paymentSchema);

const tenantSchema = new mongoose.Schema({}, { strict: false, strictPopulate: false });
const Tenant = mongoose.model('Tenant', tenantSchema);

async function fixPaymentIssues() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Fixing payment issues...\n');

    // Fix John's payment - mark the Pending Feb payment as Paid
    const johnPayment = await Payment.findOne({
      _id: mongoose.Types.ObjectId('698b1243bfc98c1d12c52d85')
    });

    if (johnPayment) {
      johnPayment.status = 'Paid';
      johnPayment.paidDate = new Date('2026-02-03'); // Move-in date
      johnPayment.notes = 'Initial rent payment - retroactively marked as Paid';
      await johnPayment.save();
      console.log('✅ Fixed John\'s February payment - marked as Paid');
    } else {
      console.log('⚠️  John\'s payment not found by ID, trying alternate method...');
      
      // Find john by email
      const john = await Tenant.findOne({ email: 'john@gmail.com' });
      if (john) {
        const result = await Payment.updateOne(
          { 
            tenantId: john._id,
            dueDate: { $gte: new Date('2026-02-01'), $lt: new Date('2026-03-01') },
            status: 'Pending'
          },
          {
            $set: {
              status: 'Paid',
              paidDate: new Date('2026-02-03'),
              notes: 'Initial rent payment - retroactively marked as Paid'
            }
          }
        );
        console.log(`✅ Updated ${result.modifiedCount} payment(s) for John`);
      }
    }

    // Fix Tat's payments - create January and February payments
    const tat = await Tenant.findOne({ email: 'ta2@gmail.com' });
    if (tat) {
      console.log('\n📅 Creating missing payments for Tat...');
      
      // Check if January payment exists
      const janExists = await Payment.findOne({
        tenantId: tat._id,
        dueDate: { $gte: new Date('2026-01-01'), $lt: new Date('2026-02-01') }
      });

      if (!janExists) {
        const janPayment = new Payment({
          tenantId: tat._id,
          amount: 350,
          dueDate: new Date('2026-01-01'),
          paidDate: new Date('2026-01-01'),
          status: 'Paid',
          notes: 'Retroactive payment for January 2026'
        });
        await janPayment.save();
        console.log('  ✅ Created January 2026 payment (Paid)');
      } else {
        console.log('  ℹ️  January payment already exists');
      }

      // Check if February payment exists
      const febExists = await Payment.findOne({
        tenantId: tat._id,
        dueDate: { $gte: new Date('2026-02-01'), $lt: new Date('2026-03-01') }
      });

      if (!febExists) {
        const febPayment = new Payment({
          tenantId: tat._id,
          amount: 350,
          dueDate: new Date('2026-02-01'),
          paidDate: new Date('2026-02-01'),
          status: 'Paid',
          notes: 'Retroactive payment for February 2026'
        });
        await febPayment.save();
        console.log('  ✅ Created February 2026 payment (Paid)');
      } else {
        console.log('  ℹ️  February payment already exists');
      }
    }

    console.log('\n✅ All payment issues fixed!\n');

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
  }
}

fixPaymentIssues();
