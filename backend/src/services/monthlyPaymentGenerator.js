const cron = require('node-cron');
const Tenant = require('../models/Tenant');
const Compartment = require('../models/Compartment');
const Payment = require('../models/Payment');

/**
 * Generate monthly rent charges for all active tenants
 * Runs automatically on the 1st of each month at 12:01 AM
 */
async function generateMonthlyPayments() {
  try {
    console.log('🔄 Starting monthly payment generation...');
    
    // Get all occupied compartments with tenant information
    const occupiedCompartments = await Compartment.find({ 
      status: 'occupied',
      tenant: { $ne: null }
    }).populate('tenant');
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let created = 0;
    let skipped = 0;
    
    for (const compartment of occupiedCompartments) {
      if (!compartment.tenant) {
        skipped++;
        continue;
      }
      
      const tenant = compartment.tenant;
      
      // Check if payment already exists for this month
      const existingPayment = await Payment.findOne({
        tenantId: tenant._id,
        compartmentId: compartment._id,
        dueDate: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      });
      
      if (existingPayment) {
        skipped++;
        continue;
      }
      
      // Determine due date (use compartment's paymentDueDay, default to 1st)
      const dueDay = compartment.paymentDueDay || 1;
      const dueDate = new Date(currentYear, currentMonth, dueDay);
      
      // Create payment record
      const payment = new Payment({
        tenantId: tenant._id,
        compartmentId: compartment._id,
        propertyId: tenant.propertyId || compartment.property || null,
        amount: compartment.rentAmount,
        dueDate: dueDate,
        status: 'Pending',
        notes: `Monthly rent for ${compartment.compartmentNumber} - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`
      });
      
      await payment.save();
      created++;
      
      console.log(`✅ Created payment for ${tenant.firstName} ${tenant.lastName} - Compartment ${compartment.compartmentNumber} - $${compartment.rentAmount}`);
    }
    
    console.log(`✅ Monthly payment generation complete: ${created} created, ${skipped} skipped`);
    return { success: true, created, skipped };
    
  } catch (error) {
    console.error('❌ Error generating monthly payments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize the monthly payment generator
 * Runs on the 1st of every month at 12:01 AM
 */
function initializeMonthlyPaymentJob() {
  // Schedule: At 00:01 on day-of-month 1
  // Format: minute hour day month dayOfWeek
  const schedule = '1 0 1 * *';
  
  cron.schedule(schedule, async () => {
    console.log('🕐 Scheduled task triggered: Monthly payment generation');
    await generateMonthlyPayments();
  }, {
    timezone: "America/New_York" // Adjust to your timezone
  });
  
  console.log('✅ Monthly payment generator initialized (runs on 1st of each month at 12:01 AM)');
}

/**
 * Manual trigger for monthly payment generation
 * Can be called via API endpoint
 */
async function triggerManualGeneration() {
  console.log('🔧 Manual payment generation triggered');
  return await generateMonthlyPayments();
}

module.exports = {
  initializeMonthlyPaymentJob,
  generateMonthlyPayments,
  triggerManualGeneration
};
