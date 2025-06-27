const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');

// Get all recurring transactions for a user
const getRecurringTransactions = async (userId) => {
  return RecurringTransaction.find({ user: userId });
};

// Create a new recurring transaction
const createRecurringTransaction = async (userId, data) => {
  const { name, amount, type, category, note, frequency, startDate } = data;
  const nextOccurrence = new Date(startDate);
  return RecurringTransaction.create({
    user: userId,
    name,
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

// Process recurring transactions that are due
const processDueRecurringTransactions = async () => {
  const now = new Date();
  const dueRecurring = await RecurringTransaction.find({
    nextOccurrence: { $lte: now },
    active: true
  }).populate('user');

  const results = {
    processed: 0,
    errors: 0,
    transactions: []
  };

  for (const recurring of dueRecurring) {
    try {
      // Create the transaction
      const transactionData = {
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        note: recurring.note ? `${recurring.note} (Recurring)` : 'Recurring transaction',
        date: recurring.nextOccurrence,
        user: recurring.user._id,
        source: 'cash', // Default to cash, can be updated later
      };

      const transaction = await Transaction.create(transactionData);
      results.transactions.push(transaction);
      results.processed++;

      // Calculate next occurrence
      const nextOccurrence = calculateNextOccurrence(recurring.nextOccurrence, recurring.frequency);

      // Update the recurring transaction with new next occurrence
      await RecurringTransaction.findByIdAndUpdate(recurring._id, {
        nextOccurrence: nextOccurrence
      });

    } catch (error) {
      console.error(`Error processing recurring transaction ${recurring._id}:`, error);
      results.errors++;
    }
  }

  return results;
};

// Calculate next occurrence based on frequency
const calculateNextOccurrence = (currentDate, frequency) => {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1); // Default to monthly
  }
  
  return date;
};

// Process recurring transactions for a specific user
const processUserRecurringTransactions = async (userId) => {
  const now = new Date();
  const dueRecurring = await RecurringTransaction.find({
    user: userId,
    nextOccurrence: { $lte: now },
    active: true
  });

  const results = {
    processed: 0,
    errors: 0,
    transactions: []
  };

  for (const recurring of dueRecurring) {
    try {
      // Check if transaction already exists for this occurrence
      const existingTransaction = await Transaction.findOne({
        user: userId,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        date: {
          $gte: new Date(recurring.nextOccurrence.getTime() - 24 * 60 * 60 * 1000), // Within 24 hours
          $lte: new Date(recurring.nextOccurrence.getTime() + 24 * 60 * 60 * 1000)
        },
        note: { $regex: /Recurring/, $options: 'i' }
      });

      if (existingTransaction) {
        // Transaction already exists, just update next occurrence
        const nextOccurrence = calculateNextOccurrence(recurring.nextOccurrence, recurring.frequency);
        await RecurringTransaction.findByIdAndUpdate(recurring._id, {
          nextOccurrence: nextOccurrence
        });
        continue;
      }

      // Create the transaction
      const transactionData = {
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        note: recurring.note ? `${recurring.note} (Recurring)` : 'Recurring transaction',
        date: recurring.nextOccurrence,
        user: userId,
        source: 'cash', // Default to cash, can be updated later
      };

      const transaction = await Transaction.create(transactionData);
      results.transactions.push(transaction);
      results.processed++;

      // Calculate and update next occurrence
      const nextOccurrence = calculateNextOccurrence(recurring.nextOccurrence, recurring.frequency);
      await RecurringTransaction.findByIdAndUpdate(recurring._id, {
        nextOccurrence: nextOccurrence
      });

    } catch (error) {
      console.error(`Error processing recurring transaction ${recurring._id}:`, error);
      results.errors++;
    }
  }

  return results;
};

module.exports = {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  adminGetAllRecurring,
  adminUpdateRecurring,
  adminDeleteRecurring,
  processDueRecurringTransactions,
  processUserRecurringTransactions,
  calculateNextOccurrence,
}; 