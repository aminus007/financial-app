const express = require('express');
const RecurringTransaction = require('../models/RecurringTransaction');
const auth = require('../middleware/auth');
const { requireAdmin } = require('./auth'); // Import admin middleware

const router = express.Router();

// Get all recurring transactions for the user
router.get('/', auth, async (req, res) => {
  const recurs = await RecurringTransaction.find({ user: req.user._id });
  res.json(recurs);
});

// Create a new recurring transaction
router.post('/', auth, async (req, res) => {
  try {
    const { amount, type, category, note, frequency, startDate } = req.body;
    const nextOccurrence = new Date(startDate);
    const recur = await RecurringTransaction.create({
      user: req.user._id,
      amount,
      type,
      category,
      note,
      frequency,
      startDate,
      nextOccurrence,
    });
    res.status(201).json(recur);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a recurring transaction
router.patch('/:id', auth, async (req, res) => {
  try {
    const recur = await RecurringTransaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!recur) return res.status(404).json({ message: 'Not found' });
    res.json(recur);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a recurring transaction
router.delete('/:id', auth, async (req, res) => {
  const recur = await RecurringTransaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!recur) return res.status(404).json({ message: 'Not found' });
  res.json(recur);
});

// List all recurring transactions (admin only)
router.get('/admin/all', auth, requireAdmin, async (req, res) => {
  try {
    const recurs = await RecurringTransaction.find().populate('user', 'name email');
    res.json(recurs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update any recurring transaction (admin only)
router.patch('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const recur = await RecurringTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!recur) return res.status(404).json({ message: 'Recurring transaction not found' });
    res.json(recur);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete any recurring transaction (admin only)
router.delete('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const recur = await RecurringTransaction.findByIdAndDelete(req.params.id);
    if (!recur) return res.status(404).json({ message: 'Recurring transaction not found' });
    res.json({ message: 'Recurring transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 