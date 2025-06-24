const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { requireAdmin } = require('./auth'); // Import admin middleware
const budgetService = require('../services/budgetService');

const router = express.Router();

// Get all budgets for the user (optionally filter by month/year)
router.get('/', auth, async (req, res, next) => {
  try {
    const budgets = await budgetService.getBudgets(req.user._id, req.query);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
});

// Create or update a budget for a category/month/year
router.post('/', auth, async (req, res, next) => {
  try {
    const budget = await budgetService.createOrUpdateBudget(req.user._id, req.body);
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
});

// Delete a budget
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const budget = await budgetService.deleteBudget(req.user._id, req.params.id);
    res.json(budget);
  } catch (error) {
    next(error);
  }
});

// Get budget progress for a category/month/year
router.get('/progress', auth, async (req, res, next) => {
  try {
    const results = await budgetService.getBudgetProgress(req.user._id, req.query);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// List all budgets (admin only)
router.get('/admin/all', auth, requireAdmin, async (req, res, next) => {
  try {
    const budgets = await budgetService.adminGetAllBudgets();
    res.json(budgets);
  } catch (error) {
    next(error);
  }
});

// Update any budget (admin only)
router.patch('/admin/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const budget = await budgetService.adminUpdateBudget(req.params.id, req.body);
    res.json(budget);
  } catch (error) {
    next(error);
  }
});

// Delete any budget (admin only)
router.delete('/admin/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const result = await budgetService.adminDeleteBudget(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 