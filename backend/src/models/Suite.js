const mongoose = require('mongoose');

const suiteSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  suiteNumber: { type: String, required: true },
  floor: Number,
  bedrooms: Number,
  bathrooms: Number,
  area: Number,
  rentAmount: Number,
  status: { type: String, enum: ['occupied', 'vacant', 'maintenance'], default: 'vacant' },
  currentTenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  leaseStartDate: Date,
  leaseEndDate: Date,
  description: String,
  features: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Suite', suiteSchema);
