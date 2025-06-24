const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  interestRate: {
    type: Number,
    default: 0,
  },
  dueDate: {
    type: Date,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['active', 'paid'],
    default: 'active',
  },
}, {
  timestamps: true,
});

debtSchema.index({ user: 1 });

module.exports = mongoose.model('Debt', debtSchema);