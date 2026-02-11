const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  firstName: String,
  lastName: String,
  role: { 
    type: String, 
    enum: ['admin', 'landlord', 'manager', 'viewer'], 
    default: 'viewer' 
  },
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  profileImage: String,
  bio: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
// Note: email and username already have unique indexes from the unique: true constraint
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual property for getting user's full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Update timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
