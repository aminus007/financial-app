const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id });
    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
exports.getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res) => {
  try {
    req.body.userId = req.user.id;
    const budget = await Budget.create(req.body);

    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    await budget.remove();

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

// @desc    Get budget summary
// @route   GET /api/budgets/summary
// @access  Private
exports.getBudgetSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };

    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const budgets = await Budget.find(query);
    const transactions = await Transaction.find({
      userId: req.user.id,
      type: 'expense',
      date: {
        $gte: new Date(startDate || new Date().setMonth(new Date().getMonth() - 1)),
        $lte: new Date(endDate || new Date())
      }
    });

    const summary = budgets.map(budget => {
      const spent = transactions
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...budget.toObject(),
        spent,
        remaining: budget.amount - spent,
        percentageUsed: (spent / budget.amount) * 100
      };
    });

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