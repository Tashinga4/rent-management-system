const mongoose = require('mongoose');

const compartmentSchema = new mongoose.Schema({
  // Compartment Identification
  compartmentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Physical Information
  type: {
    type: String,
    enum: ['room', 'suite', 'apartment', 'flat'],
    default: 'room'
  },
  floor: Number,
  squareMeters: Number,
  bedrooms: Number,
  bathrooms: Number,
  
  // Availability & Status
  status: {
    type: String,
    enum: ['vacant', 'occupied', 'maintenance', 'reserved'],
    default: 'vacant'
  },
  
  // Tenant Information (ERD Relationship)
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  
  // Lease Information
  rentAmount: {
    type: Number,
    required: true
  },
  leaseStart: Date,
  leaseEnd: Date,
  
  // Property Reference (ERD Relationship)
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  
  // Amenities
  amenities: [String],
  
  // Additional Info
  description: String,
  notes: String,
  
  // Payment Information
  paymentDueDay: {
    type: Number,
    default: 1
  },
  lastPaymentDate: Date
}, {
  timestamps: true
});

// Index for faster queries
compartmentSchema.index({ status: 1 });
compartmentSchema.index({ compartmentNumber: 1 });
compartmentSchema.index({ tenant: 1 });
compartmentSchema.index({ property: 1 });

module.exports = mongoose.model('Compartment', compartmentSchema);
