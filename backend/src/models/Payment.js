const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Tenant & Compartment References (ERD)
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  compartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Compartment'
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: false  // Made optional since not all compartments may have a property assigned
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: Date,
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue', 'Partial'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'check', 'credit_card', 'mobile_payment', 'Cash', 'Card', 'Bank Transfer', 'Check'],
  },
  
  // Receipt Generation
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptPath: String,
  receiptGeneratedAt: Date,
  
  // Additional Info
  notes: String,
  reference: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
paymentSchema.index({ tenantId: 1, dueDate: -1 });
paymentSchema.index({ compartmentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
