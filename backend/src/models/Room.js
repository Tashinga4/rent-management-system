const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Suite', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  roomNumber: { type: String, required: true },
  type: { type: String, enum: ['bedroom', 'bathroom', 'kitchen', 'living_room', 'other'], default: 'bedroom' },
  area: Number,
  description: String,
  condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
  lastInspectionDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
