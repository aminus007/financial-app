const express = require('express');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

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

module.exports = router; 