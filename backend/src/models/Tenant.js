const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
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
    required: true
  },
  leaseEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tenant', tenantSchema);
