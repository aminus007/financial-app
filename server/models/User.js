const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    unique: true,
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD',
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema); 