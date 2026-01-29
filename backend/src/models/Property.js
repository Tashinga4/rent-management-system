const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  propertyId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  type: {
    type: String,
    enum: ['Studio', '1-Bedroom', '2-Bedroom', '3-Bedroom', '4-Bedroom', 'Other'],
    required: true
  },
  bedrooms: {
    type: Number,
    required: true
  },
  bathrooms: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  roomsPerTenant: {
    type: Number,
    required: true,
    min: 1
  },
  suites: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  rent: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['vacant', 'occupied', 'maintenance'],
    default: 'vacant'
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

// Update the updatedAt timestamp before saving
propertySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Property', propertySchema);
