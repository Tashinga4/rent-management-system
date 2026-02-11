const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  propertyId: {
    type: String,
    unique: true,
    sparse: true
  },
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Landlord ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Property address is required'],
    trim: true
  },
  totalUnits: {
    type: Number,
    min: [0, 'Total units cannot be negative'],
    default: 0
  },
  type: {
    type: String,
    enum: ['Studio', '1-Bedroom', '2-Bedroom', '3-Bedroom', '4-Bedroom', 'Other'],
    required: true
  },
  bedrooms: {
    type: Number,
    required: true,
    min: [0, 'Bedrooms cannot be negative']
  },
  bathrooms: {
    type: Number,
    required: true,
    min: [0, 'Bathrooms cannot be negative']
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1']
  },
  roomsPerTenant: {
    type: Number,
    required: true,
    min: [1, 'Rooms per tenant must be at least 1']
  },
  suites: {
    type: Number,
    required: true,
    min: [0, 'Suites cannot be negative'],
    default: 0
  },
  rent: {
    type: Number,
    required: [true, 'Rent amount is required'],
    min: [0, 'Rent cannot be negative']
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['vacant', 'occupied', 'maintenance'],
    default: 'vacant',
    index: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
// Note: landlordId and status already have inline index definitions
propertySchema.index({ name: 1 });

// Update the updatedAt timestamp before saving
propertySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Property', propertySchema);
