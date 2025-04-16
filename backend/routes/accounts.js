const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');

// @route   GET api/accounts
// @desc    Get all accounts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST api/accounts
// @desc    Create an account
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('type', 'Type is required').isIn(['checking', 'savings', 'credit', 'cash', 'investment']),
      check('balance', 'Balance is required').isNumeric(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // If this is the first account, set it as default
      const accountCount = await Account.countDocuments({ user: req.user.id });
      const isDefault = accountCount === 0;

      const account = await Account.create({
        ...req.body,
        user: req.user.id,
        isDefault,
      });

      res.status(201).json({
        success: true,
        data: account,
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

// @route   PUT api/accounts/:id
// @desc    Update an account
// @access  Private
router.put(
  '/:id',
  [
    protect,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('type', 'Type is required').isIn(['checking', 'savings', 'credit', 'cash', 'investment']),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let account = await Account.findById(req.params.id);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found',
        });
      }

      // Check if account belongs to user
      if (account.user.toString() !== req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized',
        });
      }

      account = await Account.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({
        success: true,
        data: account,
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

// @route   DELETE api/accounts/:id
// @desc    Delete an account
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Check if account belongs to user
    if (account.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Check if account has transactions
    const transactionCount = await Transaction.countDocuments({ account: account._id });
    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with transactions',
      });
    }

    await account.remove();

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

// @route   PUT api/accounts/:id/setdefault
// @desc    Set account as default
// @access  Private
router.put('/:id/setdefault', protect, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Check if account belongs to user
    if (account.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Set all accounts to non-default
    await Account.updateMany(
      { user: req.user.id },
      { isDefault: false }
    );

    // Set this account as default
    account.isDefault = true;
    await account.save();

    res.status(200).json({
      success: true,
      data: account,
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