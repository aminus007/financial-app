const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['checking', 'savings', 'other'],
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Account', accountSchema); 