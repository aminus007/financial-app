const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  nextOccurrence: {
    type: Date,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

recurringTransactionSchema.index({ user: 1, nextOccurrence: 1, active: 1 });

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema); 