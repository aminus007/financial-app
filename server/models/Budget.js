const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  month: {
    type: Number, // 1-12
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema); 