const express = require('express');
const RecurringTransaction = require('../models/RecurringTransaction');
const auth = require('../middleware/auth');
const { requireAdmin } = require('./auth'); // Import admin middleware
const recurringService = require('../services/recurringService');

const router = express.Router();

// Get all recurring transactions for the user
router.get('/', auth, async (req, res, next) => {
  try {
    const recurs = await recurringService.getRecurringTransactions(req.user._id);
    res.json(recurs);
  } catch (error) {
    next(error);
  }
});

// Create a new recurring transaction
router.post('/', auth, async (req, res, next) => {
  try {
    const recur = await recurringService.createRecurringTransaction(req.user._id, req.body);
    res.status(201).json(recur);
  } catch (error) {
    next(error);
  }
});

// Update a recurring transaction
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const recur = await recurringService.updateRecurringTransaction(req.user._id, req.params.id, req.body);
    res.json(recur);
  } catch (error) {
    next(error);
  }
});

// Delete a recurring transaction
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const recur = await recurringService.deleteRecurringTransaction(req.user._id, req.params.id);
    res.json(recur);
  } catch (error) {
    next(error);
  }
});

// List all recurring transactions (admin only)
router.get('/admin/all', auth, requireAdmin, async (req, res, next) => {
  try {
    const recurs = await recurringService.adminGetAllRecurring();
    res.json(recurs);
  } catch (error) {
    next(error);
  }
});

// Update any recurring transaction (admin only)
router.patch('/admin/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const recur = await recurringService.adminUpdateRecurring(req.params.id, req.body);
    res.json(recur);
  } catch (error) {
    next(error);
  }
});

// Delete any recurring transaction (admin only)
router.delete('/admin/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const result = await recurringService.adminDeleteRecurring(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Process recurring transactions for the current user
router.post('/process', auth, async (req, res, next) => {
  try {
    const results = await recurringService.processUserRecurringTransactions(req.user._id);
    res.json({
      message: `Processed ${results.processed} recurring transactions`,
      results
    });
  } catch (error) {
    next(error);
  }
});

// Process all recurring transactions (admin only)
router.post('/admin/process-all', auth, requireAdmin, async (req, res, next) => {
  try {
    const results = await recurringService.processDueRecurringTransactions();
    res.json({
      message: `Processed ${results.processed} recurring transactions across all users`,
      results
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 