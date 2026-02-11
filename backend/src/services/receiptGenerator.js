const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const User = require('../models/User');

const transporter = (() => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE || 'gmail';
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service,
    auth: { user, pass }
  });
})();

async function generateReceipt(payment) {
  return new Promise(async (resolve, reject) => {
    try {
      const tenant = await Tenant.findById(payment.tenantId);
      const property = await Property.findById(payment.propertyId);

      if (!tenant) {
        return reject(new Error('Tenant not found'));
      }

      const propertyRent = property ? property.rent || 0 : 0;
      const paidAmount = payment.amount || 0;
      const difference = propertyRent ? paidAmount - propertyRent : 0;

      let status = 'RECEIVED';
      let statusMessage = 'Payment received.';

      if (propertyRent) {
        if (difference > 0) {
          status = 'EXCESS PAYMENT';
          statusMessage = `Excess amount of $${difference.toFixed(2)} has been credited to next month's rent.`;
        } else if (difference < 0) {
          status = 'PARTIAL PAYMENT';
          statusMessage = `Remaining balance of $${Math.abs(difference).toFixed(2)} is still owed.`;
        } else {
          status = 'UP TO DATE';
          statusMessage = `Payment matches the monthly rent amount of $${propertyRent.toFixed(2)}.`;
        }
      }

      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('RENT PAYMENT RECEIPT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Receipt #: ${payment._id}`, { align: 'center' });
      doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Tenant Information
      doc.fontSize(14).font('Helvetica-Bold').text('Tenant Information');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${tenant.firstName} ${tenant.lastName}`);
      doc.text(`Email: ${tenant.email}`);
      doc.text(`Phone: ${tenant.phone}`);
      doc.moveDown(1.5);

      // Property Information
      if (property) {
        doc.fontSize(14).font('Helvetica-Bold').text('Property Information');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Property: ${property.name}`);
        if (property.address) {
          doc.text(`Address: ${property.address}`);
        }
        doc.moveDown(1.5);
      }

      // Payment Details
      doc.fontSize(14).font('Helvetica-Bold').text('Payment Details');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Payment Date: ${payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : new Date().toLocaleDateString()}`);
      doc.text(`Due Date: ${payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}`);
      if (propertyRent) {
        doc.text(`Monthly Rent: $${propertyRent.toFixed(2)}`);
      }
      doc.text(`Amount Paid: $${paidAmount.toFixed(2)}`);
      doc.text(`Payment Method: ${payment.paymentMethod || 'N/A'}`);
      if (payment.notes) {
        doc.text(`Notes: ${payment.notes}`);
      }
      doc.moveDown(2);

      // Status Section
      doc.fontSize(14).font('Helvetica-Bold').text('Payment Status');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold');

      if (status === 'UP TO DATE') {
        doc.fillColor('green').text(status);
      } else if (status === 'EXCESS PAYMENT') {
        doc.fillColor('blue').text(status);
      } else if (status === 'PARTIAL PAYMENT') {
        doc.fillColor('red').text(status);
      } else {
        doc.fillColor('black').text(status);
      }

      doc.fillColor('black').fontSize(10).font('Helvetica');
      doc.moveDown(0.5);
      doc.text(statusMessage);

      if (propertyRent && difference < 0) {
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text(`Outstanding Balance: $${Math.abs(difference).toFixed(2)}`, { underline: true });
      }

      doc.moveDown(3);

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('gray');
      doc.text('This is a computer-generated receipt and is valid without signature.', { align: 'center' });
      doc.text('For any inquiries, please contact your property manager.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function sendReceiptToManagers(payment, pdfBuffer) {
  if (!transporter) {
    console.log('Email transporter not configured');
    return;
  }

  try {
    const managers = await User.find({ role: 'manager' });
    const tenant = await Tenant.findById(payment.tenantId);

    if (!tenant) return;

    const to = managers.map(m => m.email).filter(Boolean);
    if (!to.length) {
      console.log('No manager emails found');
      return;
    }

    const subject = `Payment Receipt - ${tenant.firstName} ${tenant.lastName}`;
    const text = `Payment of $${payment.amount} has been recorded for ${tenant.firstName} ${tenant.lastName}.\n\nPlease see the attached receipt for details.`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      attachments: [{
        filename: `receipt_${payment._id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    console.log('Receipt sent to managers:', to.join(', '));
  } catch (err) {
    console.error('sendReceiptToManagers error:', err);
  }
}

async function sendReceiptToTenant(payment, pdfBuffer) {
  if (!transporter) {
    console.log('Email transporter not configured');
    return;
  }

  try {
    const tenant = await Tenant.findById(payment.tenantId);
    if (!tenant || !tenant.email) {
      console.log('Tenant email not found');
      return;
    }

    const subject = `Payment Receipt - ${tenant.firstName} ${tenant.lastName}`;
    const text = `Thank you for your payment of $${payment.amount}. Please find your receipt attached.`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: tenant.email,
      subject,
      text,
      attachments: [{
        filename: `receipt_${payment._id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    console.log('Receipt sent to tenant:', tenant.email);
  } catch (err) {
    console.error('sendReceiptToTenant error:', err);
  }
}

module.exports = { generateReceipt, sendReceiptToManagers, sendReceiptToTenant };
