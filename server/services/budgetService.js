const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// Get all budgets for a user (optionally filter by month/year)
const getBudgets = async (userId, query) => {
  const { month, year } = query;
  const findQuery = { user: userId };
  if (month) findQuery.month = Number(month);
  if (year) findQuery.year = Number(year);
  return Budget.find(findQuery);
};

// Create or update a budget for a category/month/year
const createOrUpdateBudget = async (userId, data) => {
  const { category, limit, month, year } = data;
  if (!category || !limit || !month || !year) {
    throw new Error('All fields are required');
  }
  return Budget.findOneAndUpdate(
    { user: userId, category, month, year },
    { $set: { limit } },
    { upsert: true, new: true, runValidators: true }
  );
};

// Delete a budget
const deleteBudget = async (userId, budgetId) => {
  const budget = await Budget.findOneAndDelete({ _id: budgetId, user: userId });
  if (!budget) throw new Error('Budget not found');
  return budget;
};

// Get budget progress for a category/month/year
const getBudgetProgress = async (userId, query) => {
  const { month, year } = query;
  if (!month || !year) throw new Error('month and year required');
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  const budgets = await Budget.find({ user: userId, month: monthNumber, year: yearNumber }).lean();
  if (budgets.length === 0) return [];
  const startDate = new Date(yearNumber, monthNumber - 1, 1);
  const endDate = new Date(yearNumber, monthNumber, 1);
  const spendingByCategory = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        category: { $in: budgets.map(b => b.category) },
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalSpent: { $sum: '$amount' }
      }
    }
  ]);
  const spendingMap = spendingByCategory.reduce((acc, item) => {
    acc[item._id] = item.totalSpent;
    return acc;
  }, {});
  return budgets.map(budget => ({
    ...budget,
    spent: spendingMap[budget.category] || 0,
  }));
};

// Admin: List all budgets
const adminGetAllBudgets = async () => {
  return Budget.find().populate('user', 'name email');
};

// Admin: Update any budget
const adminUpdateBudget = async (budgetId, data) => {
  const budget = await Budget.findByIdAndUpdate(budgetId, data, { new: true });
  if (!budget) throw new Error('Budget not found');
  return budget;
};

// Admin: Delete any budget
const adminDeleteBudget = async (budgetId) => {
  const budget = await Budget.findByIdAndDelete(budgetId);
  if (!budget) throw new Error('Budget not found');
  return { message: 'Budget deleted' };
};

module.exports = {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  getBudgetProgress,
  adminGetAllBudgets,
  adminUpdateBudget,
  adminDeleteBudget,
}; 