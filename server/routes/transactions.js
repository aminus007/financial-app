const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const { requireAdmin } = require('./auth'); // Import admin middleware
const transactionService = require('../services/transactionService');

const router = express.Router();

// Get all transactions (admin only)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    // Logic moved to transactionService.js
    const { type, category, startDate, endDate, sort, page, limit } = req.query;
    const transactionsData = await transactionService.getAllTransactions(req.user._id, { type, category, startDate, endDate, sort, page, limit });
    res.json(transactionsData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get transaction summary (admin only)
router.get('/summary', auth, requireAdmin, async (req, res) => {
  try {
    // Logic moved to transactionService.js
    const { startDate, endDate } = req.query;
    const summaryData = await transactionService.getTransactionSummary(req.user._id, { startDate, endDate });
    res.json(summaryData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get category summary (admin only)
router.get('/categories', auth, requireAdmin, async (req, res) => {
  try {
    // Logic moved to transactionService.js
    const { type, startDate, endDate } = req.query;
    const categoriesData = await transactionService.getCategorySummary(req.user._id, { type, startDate, endDate });
    res.json(categoriesData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create new transaction (admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    // Logic moved to transactionService.js
    const transaction = await transactionService.createTransaction(req.user._id, req.body);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update transaction (admin only)
router.patch('/:id', auth, requireAdmin, async (req, res) => {
  try {
    // Logic moved to transactionService.js
    const transaction = await transactionService.updateTransaction(req.params.id, req.user._id, req.body);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete transaction (admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    // Logic moved to transactionService.js
    const transaction = await transactionService.deleteTransaction(req.params.id, req.user._id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Generate PDF report of transactions (admin only)
router.get('/pdf', auth, requireAdmin, async (req, res) => {
  try {
    await transactionService.generateTransactionReportPDF(req.user, req.query, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Top spending categories for a given month/year (admin only)
router.get('/top-categories', auth, requireAdmin, async (req, res) => {
  try {
    const categories = await transactionService.getTopSpendingCategories(req.user._id, req.query);
    res.json(categories);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Net worth trend (monthly net balance for last N months) (admin only)
router.get('/net-worth-trend', auth, requireAdmin, async (req, res) => {
  try {
    const trend = await transactionService.getNetWorthTrend(req.user._id, req.query);
    res.json(trend);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// List all transactions (admin only)
router.get('/admin/all', auth, requireAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('user', 'name email').sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update any transaction (admin only)
router.patch('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete any transaction (admin only)
router.delete('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 