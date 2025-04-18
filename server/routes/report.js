const express = require('express');
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const router = express.Router();

router.get('/pdf', auth, async (req, res) => {
  try {
    // Fetch user data
    const userId = req.user._id;
    const userName = req.user.name;
    const [transactions, budgets, goals] = await Promise.all([
      Transaction.find({ user: userId }).sort({ date: -1 }).limit(20),
      Budget.find({ user: userId }),
      Goal.find({ user: userId }),
    ]);

    // Calculate summary
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;

    // PDF setup
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="MindfulMoney_Report.pdf"');
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // Title
    doc.fontSize(22).fillColor('#6366f1').text('MindfulMoney Financial Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('black').text(`User: ${userName}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Summary
    doc.fontSize(16).fillColor('#6366f1').text('Summary', { underline: true });
    doc.fontSize(12).fillColor('black').text(`Total Income: $${income.toFixed(2)}`);
    doc.text(`Total Expenses: $${expense.toFixed(2)}`);
    doc.text(`Net Balance: $${net.toFixed(2)}`);
    doc.moveDown();

    // Recent Transactions
    doc.fontSize(16).fillColor('#6366f1').text('Recent Transactions', { underline: true });
    if (transactions.length === 0) {
      doc.fontSize(12).fillColor('black').text('No transactions found.');
    } else {
      transactions.forEach(t => {
        doc.fontSize(12).fillColor(t.type === 'income' ? '#10B981' : '#EF4444')
          .text(`${t.date.toISOString().slice(0, 10)} | ${t.type.toUpperCase()} | ${t.category} | $${t.amount.toFixed(2)} | ${t.note || ''}`);
      });
    }
    doc.moveDown();

    // Budgets
    doc.fontSize(16).fillColor('#6366f1').text('Budgets', { underline: true });
    if (budgets.length === 0) {
      doc.fontSize(12).fillColor('black').text('No budgets set.');
    } else {
      budgets.forEach(b => {
        doc.fontSize(12).fillColor('black')
          .text(`${b.category} | Limit: $${b.limit.toFixed(2)} | Month: ${b.month}/${b.year}`);
      });
    }
    doc.moveDown();

    // Goals
    doc.fontSize(16).fillColor('#6366f1').text('Goals', { underline: true });
    if (goals.length === 0) {
      doc.fontSize(12).fillColor('black').text('No goals set.');
    } else {
      goals.forEach(g => {
        doc.fontSize(12).fillColor('black')
          .text(`${g.name} | Target: $${g.targetAmount.toFixed(2)} | Current: $${g.currentAmount.toFixed(2)}${g.deadline ? ` | Deadline: ${g.deadline.toISOString().slice(0, 10)}` : ''}`);
      });
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 