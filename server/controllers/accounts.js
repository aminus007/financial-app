const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// @desc    Get all accounts
// @route   GET /api/accounts
// @access  Private
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Private
exports.getAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create account
// @route   POST /api/accounts
// @access  Private
exports.createAccount = async (req, res) => {
  try {
    req.body.userId = req.user.id;
    const account = await Account.create(req.body);

    res.status(201).json({
      success: true,
      data: account
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
exports.updateAccount = async (req, res) => {
  try {
    let account = await Account.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    account = await Account.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Check if account has transactions
    const transactions = await Transaction.find({ accountId: req.params.id });
    if (transactions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete account with existing transactions'
      });
    }

    await account.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Transfer funds between accounts
// @route   POST /api/accounts/transfer
// @access  Private
exports.transferFunds = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    // Validate accounts
    const fromAccount = await Account.findOne({
      _id: fromAccountId,
      userId: req.user.id
    });
    const toAccount = await Account.findOne({
      _id: toAccountId,
      userId: req.user.id
    });

    if (!fromAccount || !toAccount) {
      return res.status(404).json({
        success: false,
        error: 'One or both accounts not found'
      });
    }

    if (fromAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient funds'
      });
    }

    // Update account balances
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await fromAccount.save();
    await toAccount.save();

    // Create transfer transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      accountId: fromAccountId,
      type: 'transfer',
      amount,
      category: 'transfer',
      description: description || 'Account transfer',
      transferDetails: {
        fromAccount: fromAccountId,
        toAccount: toAccountId
      }
    });

    res.status(200).json({
      success: true,
      data: {
        transaction,
        fromAccount,
        toAccount
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
}; 