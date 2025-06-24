const RecurringTransaction = require('../models/RecurringTransaction');

// Get all recurring transactions for a user
const getRecurringTransactions = async (userId) => {
  return RecurringTransaction.find({ user: userId });
};

// Create a new recurring transaction
const createRecurringTransaction = async (userId, data) => {
  const { amount, type, category, note, frequency, startDate } = data;
  const nextOccurrence = new Date(startDate);
  return RecurringTransaction.create({
    user: userId,
    amount,
    type,
    category,
    note,
    frequency,
    startDate,
    nextOccurrence,
  });
};

// Update a recurring transaction for a user
const updateRecurringTransaction = async (userId, recurId, data) => {
  const recur = await RecurringTransaction.findOneAndUpdate(
    { _id: recurId, user: userId },
    data,
    { new: true, runValidators: true }
  );
  if (!recur) throw new Error('Not found');
  return recur;
};

// Delete a recurring transaction for a user
const deleteRecurringTransaction = async (userId, recurId) => {
  const recur = await RecurringTransaction.findOneAndDelete({ _id: recurId, user: userId });
  if (!recur) throw new Error('Not found');
  return recur;
};

// ADMIN: List all recurring transactions
const adminGetAllRecurring = async () => {
  return RecurringTransaction.find().populate('user', 'name email');
};

// ADMIN: Update any recurring transaction
const adminUpdateRecurring = async (recurId, data) => {
  const recur = await RecurringTransaction.findByIdAndUpdate(recurId, data, { new: true });
  if (!recur) throw new Error('Recurring transaction not found');
  return recur;
};

// ADMIN: Delete any recurring transaction
const adminDeleteRecurring = async (recurId) => {
  const recur = await RecurringTransaction.findByIdAndDelete(recurId);
  if (!recur) throw new Error('Recurring transaction not found');
  return { message: 'Recurring transaction deleted' };
};

module.exports = {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  adminGetAllRecurring,
  adminUpdateRecurring,
  adminDeleteRecurring,
}; 