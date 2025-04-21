const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { requireAdmin } = require('./auth'); // Import admin middleware

const router = express.Router();

// Get all budgets for the user (optionally filter by month/year)
router.get('/', auth, async (req, res) => {
  const { month, year } = req.query;
  const query = { user: req.user._id };
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);
  const budgets = await Budget.find(query);
  res.json(budgets);
});

// Create or update a budget for a category/month/year
router.post('/', auth, async (req, res) => {
  const { category, limit, month, year } = req.body;
  if (!category || !limit || !month || !year) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month, year },
      { $set: { limit } },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a budget
router.delete('/:id', auth, async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) return res.status(404).json({ message: 'Budget not found' });
  res.json(budget);
});

// Get budget progress for a category/month/year
router.get('/progress', auth, async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ message: 'month and year required' });
  const budgets = await Budget.find({ user: req.user._id, month: Number(month), year: Number(year) });
  // For each budget, calculate total spent
  const results = await Promise.all(budgets.map(async (b) => {
    const spent = await Transaction.aggregate([
      { $match: { user: req.user._id, category: b.category, type: 'expense', date: {
        $gte: new Date(`${year}-${month}-01`),
        $lt: new Date(`${year}-${Number(month) + 1}-01`)
      } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return {
      ...b.toObject(),
      spent: spent[0]?.total || 0,
    };
  }));
  res.json(results);
});

// List all budgets (admin only)
router.get('/admin/all', auth, requireAdmin, async (req, res) => {
  try {
    const budgets = await Budget.find().populate('user', 'name email');
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update any budget (admin only)
router.patch('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete any budget (admin only)
router.delete('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 