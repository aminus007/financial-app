const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
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
  amount: {
    type: Number,
    required: [true, 'Please provide a budget amount'],
    min: [0, 'Budget amount must be positive']
  },
  period: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 80, // Percentage
      min: 0,
      max: 100
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
BudgetSchema.index({ userId: 1, category: 1 });
BudgetSchema.index({ userId: 1, startDate: -1 });

// Virtual field to calculate remaining budget
BudgetSchema.virtual('remaining').get(function() {
  return this.amount - this.spent;
});

// Virtual field to calculate percentage used
BudgetSchema.virtual('percentageUsed').get(function() {
  return (this.spent / this.amount) * 100;
});

module.exports = mongoose.model('Budget', BudgetSchema); 