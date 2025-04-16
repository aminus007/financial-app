const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// @route   GET api/budgets
// @desc    Get all budgets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({ month: -1, year: -1 });

    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST api/budgets
// @desc    Create a budget
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('category', 'Category is required').not().isEmpty(),
      check('amount', 'Amount is required').isNumeric(),
      check('month', 'Month is required').isInt({ min: 1, max: 12 }),
      check('year', 'Year is required').isInt({ min: 2000, max: 2100 }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if budget already exists for this category and month
      const existingBudget = await Budget.findOne({
        user: req.user.id,
        category: req.body.category,
        month: req.body.month,
        year: req.body.year,
      });

      if (existingBudget) {
        return res.status(400).json({
          success: false,
          message: 'Budget already exists for this category and month',
        });
      }

      // Calculate spent amount from transactions
      const transactions = await Transaction.find({
        user: req.user.id,
        type: 'expense',
        category: req.body.category,
        date: {
          $gte: new Date(req.body.year, req.body.month - 1, 1),
          $lt: new Date(req.body.year, req.body.month, 1),
        },
      });

      const spent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

      const budget = await Budget.create({
        ...req.body,
        user: req.user.id,
        spent,
      });

      res.status(201).json({
        success: true,
        data: budget,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT api/budgets/:id
// @desc    Update a budget
// @access  Private
router.put(
  '/:id',
  [
    protect,
    [
      check('amount', 'Amount is required').isNumeric(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let budget = await Budget.findById(req.params.id);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
        });
      }

      // Check if budget belongs to user
      if (budget.user.toString() !== req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized',
        });
      }

      budget = await Budget.findByIdAndUpdate(
        req.params.id,
        { amount: req.body.amount },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        data: budget,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   DELETE api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    // Check if budget belongs to user
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await budget.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET api/budgets/summary
// @desc    Get budget summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const budgets = await Budget.find({
      user: req.user.id,
      month: currentMonth,
      year: currentYear,
    });

    const summary = budgets.map(budget => ({
      category: budget.category,
      amount: budget.amount,
      spent: budget.spent,
      remaining: budget.remaining,
      percentageSpent: budget.percentageSpent,
      isExceeded: budget.isExceeded(),
      isNearLimit: budget.isNearLimit(),
    }));

    res.status(200).json({
      success: true,
      data: summary,
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