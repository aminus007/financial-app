const Goal = require('../models/Goal');

// Get all goals for a user
const getGoals = async (userId) => {
  return Goal.find({ user: userId });
};

// Create a new goal
const createGoal = async (userId, data) => {
  const { name, targetAmount, deadline } = data;
  if (!name || !targetAmount) {
    throw new Error('Name and target amount are required');
  }
  return Goal.create({
    user: userId,
    name,
    targetAmount,
    deadline,
  });
};

// Add funds to a goal
const addFundsToGoal = async (userId, goalId, amount) => {
  if (!amount || amount <= 0) {
    throw new Error('Amount must be positive');
  }
  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, user: userId },
    { $inc: { currentAmount: amount } },
    { new: true }
  );
  if (!goal) throw new Error('Goal not found');
  return goal;
};

// Delete a goal
const deleteGoal = async (userId, goalId) => {
  const goal = await Goal.findOneAndDelete({ _id: goalId, user: userId });
  if (!goal) throw new Error('Goal not found');
  return goal;
};

// ADMIN: List all goals
const adminGetAllGoals = async () => {
  return Goal.find().populate('user', 'name email');
};

// ADMIN: Update any goal
const adminUpdateGoal = async (goalId, data) => {
  const goal = await Goal.findByIdAndUpdate(goalId, data, { new: true });
  if (!goal) throw new Error('Goal not found');
  return goal;
};

// ADMIN: Delete any goal
const adminDeleteGoal = async (goalId) => {
  const goal = await Goal.findByIdAndDelete(goalId);
  if (!goal) throw new Error('Goal not found');
  return { message: 'Goal deleted' };
};

module.exports = {
  getGoals,
  createGoal,
  addFundsToGoal,
  deleteGoal,
  adminGetAllGoals,
  adminUpdateGoal,
  adminDeleteGoal,
}; 