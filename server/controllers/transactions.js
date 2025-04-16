const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type, category, accountId } = req.query;
    const query = { userId: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (accountId) {
      query.accountId = accountId;
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .populate('accountId', 'name type');

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('accountId', 'name type');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    req.body.userId = req.user.id;
    const transaction = await Transaction.create(req.body);

    // Update account balance
    const account = await Account.findById(req.body.accountId);
    if (account) {
      if (req.body.type === 'income') {
        account.balance += req.body.amount;
      } else if (req.body.type === 'expense') {
        account.balance -= req.body.amount;
      }
      await account.save();
    }

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Store old amount and type for balance adjustment
    const oldAmount = transaction.amount;
    const oldType = transaction.type;

    // Update transaction
    transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update account balance
    const account = await Account.findById(transaction.accountId);
    if (account) {
      // Revert old transaction
      if (oldType === 'income') {
        account.balance -= oldAmount;
      } else if (oldType === 'expense') {
        account.balance += oldAmount;
      }

      // Apply new transaction
      if (transaction.type === 'income') {
        account.balance += transaction.amount;
      } else if (transaction.type === 'expense') {
        account.balance -= transaction.amount;
      }

      await account.save();
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Update account balance
    const account = await Account.findById(transaction.accountId);
    if (account) {
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else if (transaction.type === 'expense') {
        account.balance += transaction.amount;
      }
      await account.save();
    }

    await transaction.remove();

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

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Private
exports.getTransactionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query);

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      categoryBreakdown: {},
      monthlyBreakdown: {}
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        summary.totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        summary.totalExpense += transaction.amount;
      }

      // Category breakdown
      if (!summary.categoryBreakdown[transaction.category]) {
        summary.categoryBreakdown[transaction.category] = {
          income: 0,
          expense: 0
        };
      }
      summary.categoryBreakdown[transaction.category][transaction.type] += transaction.amount;

      // Monthly breakdown
      const month = transaction.date.toISOString().slice(0, 7);
      if (!summary.monthlyBreakdown[month]) {
        summary.monthlyBreakdown[month] = {
          income: 0,
          expense: 0
        };
      }
      summary.monthlyBreakdown[month][transaction.type] += transaction.amount;
    });

    summary.netBalance = summary.totalIncome - summary.totalExpense;

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
}; 