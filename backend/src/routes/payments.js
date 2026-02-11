const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { generateReceipt, sendReceiptToManagers, sendReceiptToTenant } = require('../services/receiptGenerator');

// ============================================
// SPECIFIC ROUTES (must come before generic /:id)
// ============================================

// Get pending payments
router.get('/status/pending', async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'Pending' })
      .populate('tenantId')
      .populate('propertyId');
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get overdue payments
router.get('/status/overdue', async (req, res) => {
  try {
    const today = new Date();
    const payments = await Payment.find({ 
      status: 'Overdue',
      dueDate: { $lt: today }
    })
      .populate('tenantId')
      .populate('propertyId');
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get monthly payment status for a specific tenant
router.get('/monthly-status/:tenantId', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Find payment for current month
    const payment = await Payment.findOne({
      tenantId: req.params.tenantId,
      dueDate: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });
    
    if (!payment) {
      return res.json({ 
        success: true, 
        data: { 
          status: 'unknown', 
          message: 'No payment record for current month' 
        } 
      });
    }
    
    let status = 'unknown';
    let message = '';
    
    if (payment.status === 'Paid') {
      const daysPaidEarly = Math.floor((payment.dueDate - new Date(payment.paidDate)) / (1000 * 60 * 60 * 24));
      if (daysPaidEarly > 0) {
        status = 'paid-in-advance';
        message = `Paid ${daysPaidEarly} days early`;
      } else {
        status = 'up-to-date';
        message = 'Paid on time';
      }
    } else if (payment.status === 'Partial') {
      status = 'partial';
      message = 'Partial payment received';
    } else if (payment.status === 'Overdue' || new Date() > payment.dueDate) {
      const daysOverdue = Math.floor((new Date() - payment.dueDate) / (1000 * 60 * 60 * 24));
      status = 'overdue';
      message = `${daysOverdue} days overdue`;
    } else {
      const daysUntilDue = Math.floor((payment.dueDate - new Date()) / (1000 * 60 * 60 * 24));
      status = 'due';
      message = `Due in ${daysUntilDue} days`;
    }
    
    res.json({ 
      success: true, 
      data: { status, message, payment } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get monthly payment summary (for dashboard)
router.get('/summary/monthly', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const payments = await Payment.find({
      dueDate: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });
    
    const summary = {
      total: payments.length,
      paid: payments.filter(p => p.status === 'Paid').length,
      pending: payments.filter(p => p.status === 'Pending').length,
      overdue: payments.filter(p => p.status === 'Overdue' || (p.status === 'Pending' && new Date() > p.dueDate)).length,
      partial: payments.filter(p => p.status === 'Partial').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0)
    };
    
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual trigger for monthly payment generation
router.post('/generate-monthly', async (req, res) => {
  try {
    const { triggerManualGeneration } = require('../services/monthlyPaymentGenerator');
    const result = await triggerManualGeneration();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all payments for a tenant
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const payments = await Payment.find({ tenantId: req.params.tenantId })
      .populate('tenantId')
      .populate('compartmentId')
      .populate('propertyId')
      .sort({ dueDate: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download payment receipt
router.get('/:id/download-receipt', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('tenantId')
      .populate('compartmentId')
      .populate('propertyId');
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    // Return HTML receipt that can be converted to PDF by the client
    res.json({ success: true, data: payment, receiptHtml: generateReceiptHTML(payment) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download payment receipt (PDF)
router.get('/:id/receipt', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('tenantId')
      .populate('propertyId');
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const pdfBuffer = await generateReceipt(payment);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt_${payment._id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark payment as paid and generate receipt
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const { paidDate, paymentMethod, amount } = req.body;
    
    const payment = await Payment.findById(req.params.id)
      .populate('tenantId')
      .populate('compartmentId')
      .populate('propertyId');
      
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    // Update payment record
    payment.status = 'Paid';
    payment.paidDate = paidDate || new Date();
    payment.paymentMethod = paymentMethod || payment.paymentMethod;
    if (amount) payment.amount = amount;
    payment.receiptGenerated = true;
    payment.receiptGeneratedAt = new Date();
    
    await payment.save();
    
    // Update compartment's last payment date
    if (payment.compartmentId) {
      await payment.compartmentId.constructor.findByIdAndUpdate(
        payment.compartmentId._id,
        { lastPaymentDate: payment.paidDate }
      );
    }
    
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GENERIC ROUTES (after specific ones)
// ============================================

// Get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('tenantId')
      .populate('propertyId')
      .sort({ dueDate: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    generateReceipt(payment)
      .then(pdfBuffer => Promise.all([
        sendReceiptToManagers(payment, pdfBuffer),
        sendReceiptToTenant(payment, pdfBuffer)
      ]))
      .catch(err => console.error('Receipt generation error:', err.message || err));
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('tenantId')
      .populate('compartmentId')
      .populate('propertyId');
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('tenantId').populate('compartmentId');
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// RECEIPT HTML GENERATOR FUNCTION
// ============================================

function generateReceiptHTML(payment) {
  const tenant = payment.tenantId || {};
  const receiptNumber = `RCP-${payment._id.toString().slice(-8).toUpperCase()}`;
  const date = new Date(payment.paidDate || payment.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const amount = payment.amount;
  const expected = tenant.rentAmount || amount;
  const difference = amount - expected;
  
  let analysis = '';
  let analysisColor = '';
  if (difference > 0) {
    analysis = `Paid in Advance: $${difference.toFixed(2)} will be credited to next month`;
    analysisColor = '#28a745';
  } else if (difference < 0) {
    analysis = `Partial Payment: $${Math.abs(difference).toFixed(2)} still due`;
    analysisColor = '#ff9800';
  } else {
    analysis = `Full Payment Received - Rent Paid in Full`;
    analysisColor = '#28a745';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${receiptNumber}</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none; }
        }
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .receipt-container {
          border: 2px solid #333;
          padding: 30px;
          background: white;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .receipt-header h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
          color: #333;
          letter-spacing: 2px;
        }
        .receipt-header p {
          margin: 5px 0;
          color: #666;
          font-size: 14px;
        }
        .receipt-number {
          background: #f5f5f5;
          padding: 10px;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
          border-left: 4px solid #696cff;
        }
        .info-table {
          width: 100%;
          margin-bottom: 25px;
          border-collapse: collapse;
        }
        .info-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
        }
        .info-table td:first-child {
          font-weight: bold;
          width: 180px;
          color: #555;
        }
        .amount-section {
          background: #f9f9f9;
          border: 2px solid #ddd;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }
        .amount-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 15px 0;
          padding: 10px 20px;
          background: white;
          border-radius: 5px;
        }
        .amount-label {
          font-size: 16px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .amount-value {
          font-size: 24px;
          font-weight: bold;
        }
        .expected-amount { color: #666; }
        .paid-amount { color: #28a745; }
        .analysis-box {
          background: linear-gradient(135deg, #f5f5f5 0%, #e9ecef 100%);
          border-left: 5px solid ${analysisColor};
          padding: 20px;
          margin: 25px 0;
          border-radius: 5px;
        }
        .analysis-box strong {
          display: block;
          font-size: 18px;
          color: ${analysisColor};
          margin-bottom: 5px;
        }
        .payment-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
          margin-top: 25px;
        }
        .payment-details p {
          margin: 8px 0;
          font-size: 14px;
        }
        .payment-details strong {
          color: #28a745;
          font-size: 16px;
        }
        .receipt-footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          padding-top: 20px;
        }
        .signature-box {
          text-align: center;
          width: 45%;
        }
        .signature-line {
          border-top: 2px solid #333;
          margin-top: 40px;
          padding-top: 10px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          <h1>PAYMENT RECEIPT</h1>
          <p>Rent Management System</p>
          <p>Official Receipt of Payment</p>
        </div>

        <div class="receipt-number">
          Receipt No: ${receiptNumber}
        </div>

        <table class="info-table">
          <tr>
            <td>Date of Payment:</td>
            <td>${date}</td>
          </tr>
          <tr>
            <td>Tenant Name:</td>
            <td>${tenant.firstName || tenant.name || 'N/A'} ${tenant.lastName || ''}</td>
          </tr>
          <tr>
            <td>Tenant Email:</td>
            <td>${tenant.email || 'N/A'}</td>
          </tr>
          <tr>
            <td>Tenant Phone:</td>
            <td>${tenant.phone || 'N/A'}</td>
          </tr>
          <tr>
            <td>Compartment Number:</td>
            <td><strong>${payment.compartmentId?.compartmentNumber || 'N/A'}</strong></td>
          </tr>
          <tr>
            <td>Payment Method:</td>
            <td>${payment.paymentMethod || 'Bank Transfer'}</td>
          </tr>
          <tr>
            <td>Payment Type:</td>
            <td>${payment.type || 'Rent'}</td>
          </tr>
        </table>

        <div class="amount-section">
          <div class="amount-row">
            <span class="amount-label">Expected Rent Amount</span>
            <span class="amount-value expected-amount">$${expected.toFixed(2)}</span>
          </div>
          <div class="amount-row">
            <span class="amount-label">Amount Paid</span>
            <span class="amount-value paid-amount">$${amount.toFixed(2)}</span>
          </div>
        </div>

        <div class="analysis-box">
          <strong>Payment Status:</strong>
          <p style="margin: 5px 0; font-size: 16px;">${analysis}</p>
        </div>

        <div class="payment-details">
          <p style="text-align: center; font-size: 18px;">
            Status: <strong>PAID ✓</strong>
          </p>
          <p style="text-align: center; margin-top: 10px; color: #666;">
            This is a computer-generated receipt and serves as official proof of payment.
          </p>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Tenant Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Manager Signature</div>
          </div>
        </div>

        <div class="receipt-footer">
          <p>Thank you for your payment</p>
          <p>For inquiries, please contact the management office</p>
          <p style="margin-top: 15px;">© ${new Date().getFullYear()} RentMS - Rent Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
