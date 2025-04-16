const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0, 'Amount must be positive']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'salary',
      'freelance',
      'investment',
      'other_income',
      'food',
      'transportation',
      'housing',
      'utilities',
      'entertainment',
      'shopping',
      'healthcare',
      'education',
      'travel',
      'other_expense'
    ]
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    endDate: Date
  },
  transferDetails: {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    type: String // URLs to stored files
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ userId: 1, accountId: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema); 