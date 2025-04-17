const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const moment = require('moment');

const router = express.Router();

// Get all transactions
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, startDate, endDate, sort = '-date' } = req.query;
    
    const query = { user: req.user._id };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort(sort)
      .limit(parseInt(req.query.limit) || 50);

    res.json(transactions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get transaction summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { user: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const response = {
      income: 0,
      expense: 0,
      net: 0,
    };

    summary.forEach(item => {
      response[item._id] = item.total;
    });
    response.net = response.income - response.expense;

    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get category summary
router.get('/categories', auth, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    const query = { user: req.user._id };
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const categories = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create new transaction
router.post('/', auth, async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      user: req.user._id
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update transaction
router.patch('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Generate PDF report of transactions
router.get('/pdf', auth, async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const transactions = await Transaction.find(query).sort('-date');

    // Calculate summary
    const summary = transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
    summary.net = summary.income - summary.expense;

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_report.pdf"');
    doc.pipe(res);

    // Title
    doc.fontSize(22).text('Personal Finance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`User: ${req.user.name} (${req.user.email})`);
    doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm')}`);
    doc.moveDown();

    // Summary
    doc.fontSize(16).text('Summary', { underline: true });
    doc.fontSize(12).text(`Total Income: $${summary.income.toFixed(2)}`);
    doc.text(`Total Expenses: $${summary.expense.toFixed(2)}`);
    doc.text(`Net Balance: $${summary.net.toFixed(2)}`);
    doc.moveDown();

    // Table header
    doc.fontSize(16).text('Transactions', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text('Date', 40, doc.y, { continued: true, width: 80 });
    doc.text('Type', 120, doc.y, { continued: true, width: 60 });
    doc.text('Category', 180, doc.y, { continued: true, width: 100 });
    doc.text('Amount', 280, doc.y, { continued: true, width: 60 });
    doc.text('Note', 340, doc.y, { width: 200 });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(540, doc.y).stroke();

    // Table rows
    transactions.forEach((t) => {
      doc.text(moment(t.date).format('YYYY-MM-DD'), 40, doc.y, { continued: true, width: 80 });
      doc.text(t.type, 120, doc.y, { continued: true, width: 60 });
      doc.text(t.category, 180, doc.y, { continued: true, width: 100 });
      doc.text(`$${t.amount.toFixed(2)}`, 280, doc.y, { continued: true, width: 60 });
      doc.text(t.note || '', 340, doc.y, { width: 200 });
      if (doc.y > 750) doc.addPage();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Top spending categories for a given month/year
router.get('/top-categories', auth, async (req, res) => {
  const { month, year, limit = 3 } = req.query;
  if (!month || !year) return res.status(400).json({ message: 'month and year required' });
  const start = new Date(`${year}-${month}-01`);
  const end = new Date(`${year}-${Number(month) + 1}-01`);
  const categories = await Transaction.aggregate([
    { $match: { user: req.user._id, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: Number(limit) },
  ]);
  res.json(categories);
});

// Net worth trend (monthly net balance for last N months)
router.get('/net-worth-trend', auth, async (req, res) => {
  const { months = 6 } = req.query;
  const now = new Date();
  const trend = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const summary = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: d, $lt: next } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    let income = 0, expense = 0;
    summary.forEach(s => {
      if (s._id === 'income') income = s.total;
      if (s._id === 'expense') expense = s.total;
    });
    trend.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      income,
      expense,
      net: income - expense,
    });
  }
  res.json(trend);
});

module.exports = router; 