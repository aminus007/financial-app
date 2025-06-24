const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['income', 'expense'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  note: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  source: {
    type: String, // 'cash' or accountId
    required: function() { return this.type === 'expense'; },
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, date: 1, type: 1, category: 1 }); // Index for recurring transaction check

module.exports = mongoose.model('Transaction', transactionSchema);