const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

// @route   GET api/reports/summary
// @desc    Get financial summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await Transaction.find(query);

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = income - expenses;

    res.status(200).json({
      success: true,
      data: {
        income,
        expenses,
        savings,
        balance: income - expenses,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET api/reports/cashflow
// @desc    Get cash flow data
// @access  Private
router.get('/cashflow', protect, async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const transactions = await Transaction.find({
      user: req.user.id,
      date: {
        $gte: new Date(currentYear, 0, 1),
        $lt: new Date(currentYear + 1, 0, 1),
      },
    });

    const monthlyData = Array(12).fill().map((_, i) => ({
      month: i + 1,
      income: 0,
      expenses: 0,
    }));

    transactions.forEach(transaction => {
      const month = transaction.date.getMonth();
      if (transaction.type === 'income') {
        monthlyData[month].income += transaction.amount;
      } else {
        monthlyData[month].expenses += transaction.amount;
      }
    });

    res.status(200).json({
      success: true,
      data: monthlyData,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET api/reports/categories
// @desc    Get category breakdown
// @access  Private
router.get('/categories', protect, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const query = { user: req.user.id };

    if (type) {
      query.type = type;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await Transaction.find(query);

    const categoryData = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = 0;
      }
      acc[transaction.category] += transaction.amount;
      return acc;
    }, {});

    const total = Object.values(categoryData).reduce((sum, amount) => sum + amount, 0);

    const breakdown = Object.entries(categoryData).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100,
    }));

    res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET api/reports/insights
// @desc    Get financial insights
// @access  Private
router.get('/insights', protect, async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get current month transactions
    const currentTransactions = await Transaction.find({
      user: req.user.id,
      date: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1),
      },
    });

    // Get last month transactions
    const lastTransactions = await Transaction.find({
      user: req.user.id,
      date: {
        $gte: new Date(lastYear, lastMonth - 1, 1),
        $lt: new Date(lastYear, lastMonth, 1),
      },
    });

    // Calculate current month totals
    const currentIncome = currentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpenses = currentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate last month totals
    const lastIncome = lastTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastExpenses = lastTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate insights
    const insights = [];

    // Income change
    if (lastIncome > 0) {
      const incomeChange = ((currentIncome - lastIncome) / lastIncome) * 100;
      insights.push({
        type: 'income',
        message: `Your income has ${incomeChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(1)}% compared to last month.`,
      });
    }

    // Expense change
    if (lastExpenses > 0) {
      const expenseChange = ((currentExpenses - lastExpenses) / lastExpenses) * 100;
      insights.push({
        type: 'expense',
        message: `Your expenses have ${expenseChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(expenseChange).toFixed(1)}% compared to last month.`,
      });
    }

    // Category insights
    const currentCategories = currentTransactions.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
      return acc;
    }, {});

    const lastCategories = lastTransactions.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
      return acc;
    }, {});

    Object.entries(currentCategories).forEach(([category, amount]) => {
      if (lastCategories[category]) {
        const change = ((amount - lastCategories[category]) / lastCategories[category]) * 100;
        if (Math.abs(change) > 20) {
          insights.push({
            type: 'category',
            category,
            message: `You spent ${Math.abs(change).toFixed(1)}% ${change >= 0 ? 'more' : 'less'} on ${category} this month.`,
          });
        }
      }
    });

    // Budget insights
    const budgets = await Budget.find({
      user: req.user.id,
      month: currentMonth,
      year: currentYear,
    });

    budgets.forEach(budget => {
      if (budget.isExceeded()) {
        insights.push({
          type: 'budget',
          category: budget.category,
          message: `You have exceeded your ${budget.category} budget by ${(budget.spent - budget.amount).toFixed(2)}.`,
        });
      } else if (budget.isNearLimit()) {
        insights.push({
          type: 'budget',
          category: budget.category,
          message: `You are close to reaching your ${budget.category} budget limit (${budget.percentageSpent.toFixed(1)}% used).`,
        });
      }
    });

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router; 