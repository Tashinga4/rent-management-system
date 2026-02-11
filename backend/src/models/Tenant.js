const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  compartmentNumber: {
    type: String
  },
  
  // ERD Relationship: Compartment Reference (One-to-One)
  compartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Compartment',
    default: null,
    sparse: true,  // Allow multiple null values, but unique non-null values
    unique: true   // Only one tenant per compartment
  },
  
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  leaseStart: {
    type: Date,
    required: [true, 'Lease start date is required']
  },
  leaseEnd: {
    type: Date,
    required: [true, 'Lease end date is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
tenantSchema.index({ propertyId: 1 });

// Virtual property for getting tenant's full name
tenantSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Validation to ensure lease end is after lease start
tenantSchema.pre('save', function(next) {
  if (this.leaseEnd <= this.leaseStart) {
    next(new Error('Lease end date must be after lease start date'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Tenant', tenantSchema);
