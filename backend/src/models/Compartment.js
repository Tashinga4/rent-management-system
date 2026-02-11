const mongoose = require('mongoose');

const compartmentSchema = new mongoose.Schema({
  // Compartment Identification
  compartmentNumber: {
    type: String,
    required: [true, 'Compartment number is required'],
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Compartment name is required'],
    trim: true
  },
  
  // Physical Information
  type: {
    type: String,
    enum: ['room', 'suite', 'apartment', 'flat'],
    default: 'room'
  },
  floor: Number,
  squareMeters: {
    type: Number,
    min: [0, 'Square meters cannot be negative']
  },
  bedrooms: {
    type: Number,
    min: [0, 'Bedrooms cannot be negative']
  },
  bathrooms: {
    type: Number,
    min: [0, 'Bathrooms cannot be negative']
  },
  
  // Availability & Status
  status: {
    type: String,
    enum: ['vacant', 'occupied', 'maintenance', 'reserved'],
    default: 'vacant',
    index: true
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
    required: [true, 'Rent amount is required'],
    min: [0, 'Rent amount cannot be negative']
  },
  leaseStart: Date,
  leaseEnd: Date,
  
  // Property Reference (ERD Relationship)
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property reference is required'],
    index: true
  },
  
  // Amenities
  amenities: [String],
  
  // Additional Info
  description: String,
  notes: String,
  
  // Payment Information
  paymentDueDay: {
    type: Number,
    default: 1,
    min: [1, 'Payment due day must be between 1 and 31'],
    max: [31, 'Payment due day must be between 1 and 31']
  },
  lastPaymentDate: Date
}, {
  timestamps: true
});

// Index for faster queries
compartmentSchema.index({ tenant: 1 });

module.exports = mongoose.model('Compartment', compartmentSchema);
