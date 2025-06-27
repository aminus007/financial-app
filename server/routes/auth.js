const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Account = require('../models/Account');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const authService = require('../services/authService');

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    console.log('Attempting login for user:', req.body.name); // Added logging
    const result = await authService.loginUser(req.body);
    console.log('Login successful for user:', req.body.name); // Added logging
    res.json(result);
  } catch (error) {
    console.error('Login error:', error.message); // Added logging
    next(error);
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Update user preferences
router.patch('/preferences', auth, async (req, res, next) => {
  try {
    const user = await authService.updatePreferences(req.user, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Change password
router.patch('/change-password', auth, async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user._id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get user's net balance
router.get('/me/netbalance', auth, async (req, res) => {
  try {
    const result = await authService.getNetBalance(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all accounts for the user
router.get('/me/accounts', auth, async (req, res) => {
  try {
    const accounts = await authService.getUserAccounts(req.user._id);
    res.json(accounts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an account's balance or name (if checking)
router.patch('/me/accounts/:id', auth, async (req, res) => {
  try {
    const account = await authService.updateAccount(req.user._id, req.params.id, req.body);
    res.json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user's cash
router.patch('/me/cash', auth, async (req, res) => {
  try {
    const user = await authService.updateUserCash(req.user, req.body.cash);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a new account
router.post('/me/accounts', auth, async (req, res, next) => {
  try {
    const account = await authService.addAccount(req.user._id, req.body);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
});

// Delete an account
router.delete('/me/accounts/:id', auth, async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get account transaction history
router.get('/me/accounts/:id/history', auth, async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    const transactions = await Transaction.find({ user: req.user._id, category: account.type }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Transfer between accounts or to/from cash
router.post('/me/transfer', auth, async (req, res) => {
  try {
    const { sourceType, sourceId, destType, destId, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be positive' });
    if (sourceType === destType && sourceId === destId) {
      return res.status(400).json({ message: 'Source and destination must be different' });
    }
    // Withdraw from source
    if (sourceType === 'cash') {
      if (req.user.cash < amount) return res.status(400).json({ message: 'Insufficient cash balance' });
      req.user.cash -= amount;
    } else if (sourceType === 'account') {
      const sourceAcc = await Account.findOne({ _id: sourceId, user: req.user._id });
      if (!sourceAcc) return res.status(404).json({ message: 'Source account not found' });
      if (sourceAcc.balance < amount) return res.status(400).json({ message: 'Insufficient funds in source account' });
      sourceAcc.balance -= amount;
      await sourceAcc.save();
    } else {
      return res.status(400).json({ message: 'Invalid source type' });
    }
    // Deposit to destination
    if (destType === 'cash') {
      req.user.cash += amount;
    } else if (destType === 'account') {
      const destAcc = await Account.findOne({ _id: destId, user: req.user._id });
      if (!destAcc) return res.status(404).json({ message: 'Destination account not found' });
      destAcc.balance += amount;
      await destAcc.save();
    } else {
      return res.status(400).json({ message: 'Invalid destination type' });
    }
    await req.user.save();
    // Log transactions for both sides
    await Transaction.create({
      user: req.user._id,
      amount,
      type: 'expense',
      category: sourceType === 'cash' ? 'cash' : 'account',
      note: `Transfer to ${destType === 'cash' ? 'cash' : 'account'}`,
      date: new Date(),
      source: sourceType === 'cash' ? 'cash' : sourceId,
    });
    await Transaction.create({
      user: req.user._id,
      amount,
      type: 'income',
      category: destType === 'cash' ? 'cash' : 'account',
      note: `Transfer from ${sourceType === 'cash' ? 'cash' : 'account'}`,
      date: new Date(),
      source: destType === 'cash' ? 'cash' : destId,
    });
    res.json({ message: 'Transfer successful' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// List all users (admin only)
router.get('/admin/users', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-__v -password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user (promote/demote admin, etc.) (admin only)
router.patch('/admin/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin },
      { new: true }
    ).select('-__v -password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/admin/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all accounts with user info
router.get('/admin/accounts', auth, requireAdmin, async (req, res) => {
  try {
    const accounts = await Account.find().populate('user', 'name email');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin generate generic password
router.get('/admin/generate-password', auth, requireAdmin, async (req, res, next) => {
  try {
    const password = authService.generateGenericPassword();
    res.json({ password });
  } catch (error) {
    next(error);
  }
});

// Admin reset user password
router.patch('/admin/users/:id/reset-password', auth, requireAdmin, async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const result = await authService.adminResetPassword(req.user._id, req.params.id, newPassword);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { router, requireAdmin }; 