const express = require('express');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const { requireAdmin } = require('./auth'); // Import admin middleware

const router = express.Router();

// Get all goals for the user
router.get('/', auth, async (req, res) => {
  const goals = await Goal.find({ user: req.user._id });
  res.json(goals);
});

// Create a new goal
router.post('/', auth, async (req, res) => {
  const { name, targetAmount, deadline } = req.body;
  if (!name || !targetAmount) {
    return res.status(400).json({ message: 'Name and target amount are required' });
  }
  try {
    const goal = await Goal.create({
      user: req.user._id,
      name,
      targetAmount,
      deadline,
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add funds to a goal
router.post('/:id/add', auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be positive' });
  }
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $inc: { currentAmount: amount } },
    { new: true }
  );
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json(goal);
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json(goal);
});

// List all goals (admin only)
router.get('/admin/all', auth, requireAdmin, async (req, res) => {
  try {
    const goals = await Goal.find().populate('user', 'name email');
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update any goal (admin only)
router.patch('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete any goal (admin only)
router.delete('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const goal = await Goal.findByIdAndDelete(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 