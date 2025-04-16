const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');

// @route   GET api/transactions
// @desc    Get all transactions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ date: -1 })
      .populate('account', 'name type');

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST api/transactions
// @desc    Create a transaction
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('type', 'Type is required').isIn(['income', 'expense']),
      check('amount', 'Amount is required').isNumeric(),
      check('category', 'Category is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('account', 'Account is required').isMongoId(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if account exists and belongs to user
      const account = await Account.findOne({
        _id: req.body.account,
        user: req.user.id,
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found',
        });
      }

      // Create transaction
      const transaction = await Transaction.create({
        ...req.body,
        user: req.user.id,
      });

      // Update account balance
      const amount = req.body.type === 'income' ? req.body.amount : -req.body.amount;
      account.balance += amount;
      await account.save();

      res.status(201).json({
        success: true,
        data: transaction,
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

// @route   PUT api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put(
  '/:id',
  [
    protect,
    [
      check('type', 'Type is required').isIn(['income', 'expense']),
      check('amount', 'Amount is required').isNumeric(),
      check('category', 'Category is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let transaction = await Transaction.findById(req.params.id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
      }

      // Check if transaction belongs to user
      if (transaction.user.toString() !== req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized',
        });
      }

      // Get old account and update its balance
      const oldAccount = await Account.findById(transaction.account);
      const oldAmount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      oldAccount.balance -= oldAmount;
      await oldAccount.save();

      // Update transaction
      transaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Update new account balance
      const newAccount = await Account.findById(transaction.account);
      const newAmount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      newAccount.balance += newAmount;
      await newAccount.save();

      res.status(200).json({
        success: true,
        data: transaction,
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

// @route   DELETE api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check if transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Update account balance
    const account = await Account.findById(transaction.account);
    const amount = transaction.type === 'income' ? -transaction.amount : transaction.amount;
    account.balance += amount;
    await account.save();

    await transaction.remove();

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

module.exports = router; 