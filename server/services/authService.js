const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Account = require('../models/Account');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const config = require('../config');

// Register new user
const registerUser = async (data) => {
  const { name, email, accounts = [], cash = 0, isAdmin = false } = data;
  // Check if user already exists by email or name
  let user = await User.findOne({ $or: [{ email }, { name }] });
  if (user) {
    throw new Error('User with this email or name already exists');
  }
  // Create new user
  user = new User({ name, email, cash, isAdmin });
  await user.save();
  // Create accounts and log initial transactions
  let hasSavings = false;
  for (const acc of accounts) {
    if (acc.type === 'savings') hasSavings = true;
    const accountDoc = await Account.create({
      user: user._id,
      type: acc.type,
      balance: acc.balance,
    });
    // Log initial transaction for this account
    if (acc.balance && acc.balance > 0) {
      await Transaction.create({
        user: user._id,
        amount: acc.balance,
        type: 'income',
        category: acc.type,
        note: 'Initial balance',
        date: new Date(),
      });
    }
  }
  // Log initial cash as a transaction
  if (cash && cash > 0) {
    await Transaction.create({
      user: user._id,
      amount: cash,
      type: 'income',
      category: 'cash',
      note: 'Initial cash balance',
      date: new Date(),
    });
  }
  // If savings account exists and no savings goal, log as 'free savings'
  if (hasSavings) {
    const existingGoal = await Goal.findOne({ user: user._id, name: 'Savings' });
    if (!existingGoal) {
      await Goal.create({
        user: user._id,
        name: 'Free Savings',
        targetAmount: 0,
        currentAmount: 0,
      });
    }
  }
  // Generate token
  const token = jwt.sign(
    { userId: user._id, isAdmin: user.isAdmin },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
  return { user, token };
};

// Login user
const loginUser = async (data) => {
  console.log('Inside loginUser service function with data:', data); // Added logging
  const { name } = data;
  console.log('Searching for user with name:', name); // Added logging
  const user = await User.findOne({ name });
  if (!user) {
    console.log('User not found for name:', name); // Added logging
    throw new Error('Invalid credentials');
  }
  console.log('User found:', user.name); // Added logging
  const token = jwt.sign(
    { userId: user._id, isAdmin: user.isAdmin },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
  console.log('Token generated successfully'); // Added logging
  return { user, token };
};

// Update user preferences
const updatePreferences = async (user, data) => {
  const { currency } = data;
  user.preferences = {
    ...user.preferences,
    ...(currency && { currency }),
  };
  await user.save();
  return user;
};

// Get user's net balance
const getNetBalance = async (userId) => {
  const accounts = await Account.find({ user: userId });
  const user = await User.findById(userId);
  const accountsTotal = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const netBalance = accountsTotal + (user.cash || 0);
  return { netBalance };
};

// Get all accounts for the user
const getUserAccounts = async (userId) => {
  return Account.find({ user: userId });
};

// Update an account's balance or name (if checking)
const updateAccount = async (userId, accountId, data) => {
  const { balance, name } = data;
  const account = await Account.findOne({ _id: accountId, user: userId });
  if (!account) throw new Error('Account not found');
  if (balance !== undefined) account.balance = balance;
  if (name !== undefined && account.type === 'checking') account.name = name;
  await account.save();
  return account;
};

// Update user's cash
const updateUserCash = async (user, cash) => {
  user.cash = cash;
  await user.save();
  return user;
};

// Add a new account
const addAccount = async (userId, data) => {
  const { type, balance } = data;
  const account = await Account.create({
    user: userId,
    type,
    balance: balance || 0,
  });
  // Log initial transaction if balance > 0
  if (balance && balance > 0) {
    await Transaction.create({
      user: userId,
      amount: balance,
      type: 'income',
      category: type,
      note: 'Initial balance',
      date: new Date(),
    });
  }
  return account;
};

module.exports = {
  registerUser,
  loginUser,
  updatePreferences,
  getNetBalance,
  getUserAccounts,
  updateAccount,
  updateUserCash,
  addAccount,
}; 