const express = require('express');
const Debt = require('../models/Debt');
const auth = require('../middleware/auth');
const { requireAdmin } = require('./auth');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const debtService = require('../services/debtService');

const router = express.Router();

// USER ENDPOINTS

// Get all debts for current user
router.get('/', auth, async (req, res, next) => {
  try {
    const debts = await debtService.getDebts(req.user._id);
    res.json(debts);
  } catch (error) {
    next(error);
  }
});

// Get single debt
router.get('/:id', auth, async (req, res, next) => {
  try {
    const debt = await debtService.getDebtById(req.user._id, req.params.id);
    res.json(debt);
  } catch (error) {
    next(error);
  }
});

// Create new debt
router.post('/', auth, async (req, res, next) => {
  try {
    const debt = await debtService.createDebt(req.user._id, req.body);
    res.status(201).json(debt);
  } catch (error) {
    next(error);
  }
});

// Update debt (edit, mark as paid, etc.)
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const debt = await debtService.updateDebt(req.user._id, req.params.id, req.body);
    res.json(debt);
  } catch (error) {
    next(error);
  }
});

// Make a payment toward a debt
router.post('/:id/pay', auth, async (req, res, next) => {
  try {
    const debt = await debtService.payDebt(req.user._id, req.params.id, req.body);
    res.json(debt);
  } catch (error) {
    next(error);
  }
});

// Delete a debt
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const result = await debtService.deleteDebt(req.user._id, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ADMIN ENDPOINTS

// Get all debts (admin)
router.get('/admin/all', auth, requireAdmin, async (req, res, next) => {
  try {
    const debts = await debtService.adminGetAllDebts();
    res.json(debts);
  } catch (error) {
    next(error);
  }
});

// Update any debt (admin)
router.patch('/admin/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const debt = await debtService.adminUpdateDebt(req.params.id, req.body);
    res.json(debt);
  } catch (error) {
    next(error);
  }
});

// Delete any debt (admin)
router.delete('/admin/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const result = await debtService.adminDeleteDebt(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 