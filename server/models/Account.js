const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide an account name'],
    trim: true
  },
  type: {
    type: String,
    enum: ['bank', 'cash', 'credit', 'investment', 'savings'],
    required: [true, 'Please provide an account type']
  },
  balance: {
    type: Number,
    default: 0,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdated timestamp before saving
AccountSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Update lastUpdated timestamp before updating
AccountSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastUpdated: Date.now() });
  next();
});

module.exports = mongoose.model('Account', AccountSchema); 