const express = require('express');
const Debt = require('../models/Debt');
const auth = require('../middleware/auth');
const { requireAdmin } = require('./auth');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

const router = express.Router();

// USER ENDPOINTS

// Get all debts for current user
router.get('/', auth, async (req, res) => {
  try {
    const debts = await Debt.find({ user: req.user._id });
    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single debt
router.get('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    res.json(debt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new debt
router.post('/', auth, async (req, res) => {
  try {
    const { name, amount, interestRate, dueDate, notes } = req.body;
    const debt = await Debt.create({
      user: req.user._id,
      name,
      amount,
      interestRate,
      dueDate,
      notes,
    });
    res.status(201).json(debt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update debt (edit, mark as paid, etc.)
router.patch('/:id', auth, async (req, res) => {
  try {
    const update = req.body;
    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true }
    );
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    res.json(debt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Make a payment toward a debt
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const { amount, accountId } = req.body;
    console.log('Pay debt:', { userId: req.user._id, accountId, amount });
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be positive' });
    if (!accountId) return res.status(400).json({ message: 'Account is required' });
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    console.log('Found account:', account);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    if (account.balance < amount) return res.status(400).json({ message: 'Insufficient funds in selected account' });
    // Subtract from account
    account.balance -= amount;
    await account.save();
    // Create transaction
    await Transaction.create({
      user: req.user._id,
      amount,
      type: 'expense',
      category: 'debt payment',
      note: `Payment for debt: ${debt.name}`,
      date: new Date(),
    });
    // Update debt
    debt.paidAmount += amount;
    if (debt.paidAmount >= debt.amount) debt.status = 'paid';
    await debt.save();
    res.json(debt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a debt
router.delete('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    res.json({ message: 'Debt deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN ENDPOINTS

// Get all debts (admin)
router.get('/admin/all', auth, requireAdmin, async (req, res) => {
  try {
    const debts = await Debt.find().populate('user', 'name email');
    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update any debt (admin)
router.patch('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const debt = await Debt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    res.json(debt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete any debt (admin)
router.delete('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const debt = await Debt.findByIdAndDelete(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    res.json({ message: 'Debt deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 