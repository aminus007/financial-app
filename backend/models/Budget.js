const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'food',
      'transport',
      'housing',
      'utilities',
      'entertainment',
      'shopping',
      'health',
      'education',
      'other',
    ],
  },
  amount: {
    type: Number,
    required: [true, 'Please provide a budget amount'],
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  spent: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique budget per category per month
BudgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

// Virtual for remaining budget
BudgetSchema.virtual('remaining').get(function () {
  return this.amount - this.spent;
});

// Virtual for percentage spent
BudgetSchema.virtual('percentageSpent').get(function () {
  return (this.spent / this.amount) * 100;
});

// Method to check if budget is exceeded
BudgetSchema.methods.isExceeded = function () {
  return this.spent > this.amount;
};

// Method to check if budget is near limit (80%)
BudgetSchema.methods.isNearLimit = function () {
  return this.percentageSpent >= 80;
};

module.exports = mongoose.model('Budget', BudgetSchema); 