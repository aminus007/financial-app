const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Account = require('../models/Account');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, accounts = [], cash = 0 } = req.body;

    // Check if user already exists by email or name
    let user = await User.findOne({ $or: [{ email }, { name }] });
    if (user) {
      return res.status(400).json({ message: 'User with this email or name already exists' });
    }

    // Create new user with cash and email
    user = new User({ name, email, cash });
    await user.save();

    // Create accounts and log initial transactions
    let hasSavings = false;
    for (const acc of accounts) {
      if (acc.type === 'savings') hasSavings = true;
      const accountDoc = await Account.create({
        user: user._id,
        type: acc.type,
        balance: acc.balance,
      });
      // Log initial transaction for this account
      if (acc.balance && acc.balance > 0) {
        await Transaction.create({
          user: user._id,
          amount: acc.balance,
          type: 'income',
          category: acc.type,
          note: 'Initial balance',
          date: new Date(),
        });
      }
    }

    // Log initial cash as a transaction
    if (cash && cash > 0) {
      await Transaction.create({
        user: user._id,
        amount: cash,
        type: 'income',
        category: 'cash',
        note: 'Initial cash balance',
        date: new Date(),
      });
    }

    // If savings account exists and no savings goal, log as 'free savings'
    if (hasSavings) {
      const existingGoal = await Goal.findOne({ user: user._id, name: 'Savings' });
      if (!existingGoal) {
        // Create a 'free savings' goal with 0 target and the balance will be tracked as free
        await Goal.create({
          user: user._id,
          name: 'Free Savings',
          targetAmount: 0,
          currentAmount: 0,
        });
      }
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { name } = req.body;

    // Find user
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Update user preferences
router.patch('/preferences', auth, async (req, res) => {
  try {
    const { currency } = req.body;
    
    req.user.preferences = {
      ...req.user.preferences,
      ...(currency && { currency }),
    };

    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's net balance
router.get('/me/netbalance', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id });
    const accountsTotal = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const netBalance = accountsTotal + (req.user.cash || 0);
    res.json({ netBalance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all accounts for the user
router.get('/me/accounts', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id });
    res.json(accounts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an account's balance
router.patch('/me/accounts/:id', auth, async (req, res) => {
  try {
    const { balance } = req.body;
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { balance },
      { new: true }
    );
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user's cash
router.patch('/me/cash', auth, async (req, res) => {
  try {
    const { cash } = req.body;
    req.user.cash = cash;
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a new account
router.post('/me/accounts', auth, async (req, res) => {
  try {
    const { type, balance } = req.body;
    const account = await Account.create({
      user: req.user._id,
      type,
      balance: balance || 0,
    });
    // Log initial transaction if balance > 0
    if (balance && balance > 0) {
      await Transaction.create({
        user: req.user._id,
        amount: balance,
        type: 'income',
        category: type,
        note: 'Initial balance',
        date: new Date(),
      });
    }
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

module.exports = router; 