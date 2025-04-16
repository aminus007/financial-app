const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide an account name'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['checking', 'savings', 'credit', 'cash', 'investment'],
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure only one default account per user
AccountSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Indexes for better query performance
AccountSchema.index({ user: 1 });
AccountSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model('Account', AccountSchema); 