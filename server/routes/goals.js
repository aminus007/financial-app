const express = require('express');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const { requireAdmin } = require('./auth'); // Import admin middleware
const goalService = require('../services/goalService');

const router = express.Router();

// Get all goals for the user
router.get('/', auth, async (req, res, next) => {
  try {
    const goals = await goalService.getGoals(req.user._id);
    res.json(goals);
  } catch (error) {
    next(error);
  }
});

// Create a new goal
router.post('/', auth, async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.user._id, req.body);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
});

// Add funds to a goal
router.post('/:id/add', auth, async (req, res, next) => {
  try {
    const goal = await goalService.addFundsToGoal(req.user._id, req.params.id, req.body.amount);
    res.json(goal);
  } catch (error) {
    next(error);
  }
});

// Delete a goal
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const goal = await goalService.deleteGoal(req.user._id, req.params.id);
    res.json(goal);
  } catch (error) {
    next(error);
  }
});

// List all goals (admin only)
router.get('/admin/all', auth, requireAdmin, async (req, res, next) => {
  try {
    const goals = await goalService.adminGetAllGoals();
    res.json(goals);
  } catch (error) {
    next(error);
  }
});

// Update any goal (admin only)
router.patch('/admin/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const goal = await goalService.adminUpdateGoal(req.params.id, req.body);
    res.json(goal);
  } catch (error) {
    next(error);
  }
});

// Delete any goal (admin only)
router.delete('/admin/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const result = await goalService.adminDeleteGoal(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 