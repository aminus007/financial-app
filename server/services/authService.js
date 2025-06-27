console.log('Loading authService.js'); // Log at the very beginning of the file
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Account = require('../models/Account');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const config = require('../config');
const bcrypt = require('bcryptjs');

// Register new user
const registerUser = async (data) => {
  console.log('Attempting to register user...'); // Log start of function
  console.log('Registering user with data:', data); // Log input data
  const { name, email, password, accounts = [], cash = 0, isAdmin = false } = data;
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters');
  console.log('Attempting password hashing...'); // Log before hashing
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Password hashed'); // Log after hashing
  console.log('Attempting to check for existing user...'); // Log before user check
  // Check if user already exists by email or name
  let user = await User.findOne({ $or: [{ email }, { name }] });
  console.log('Existing user check result:', user); // Log existing user check result
  if (user) {
    throw new Error('User with this email or name already exists');
  }
  // Create new user
  user = new User({ name, email, password: hashedPassword, cash, isAdmin });
  await user.save();
  console.log('New user saved:', user._id); // Log after saving user
  // Create accounts and log initial transactions
  let hasSavings = false;
  for (const acc of accounts) {
    if (acc.type === 'savings') hasSavings = true;
    const accountDoc = await Account.create({
      user: user._id,
      type: acc.type,
      balance: acc.balance,
    });
    console.log('Account created:', accountDoc._id); // Log after creating account
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
      console.log('Initial account transaction logged'); // Log after logging account transaction
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
    console.log('Initial cash transaction logged'); // Log after logging cash transaction
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
      console.log('Free Savings goal created'); // Log after creating goal
    }
  }
  // Generate token
  const token = jwt.sign(
    { userId: user._id, isAdmin: user.isAdmin },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
  console.log('JWT token generated'); // Log after token generation
  return { user, token };
};

// Login user
const loginUser = async (data) => {
  console.log('Inside loginUser service function with data:', data); // Added logging
  const { name, password } = data;
  const user = await User.findOne({ name });
  if (!user) throw new Error('Invalid credentials');
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');
  const token = jwt.sign(
    { userId: user._id, isAdmin: user.isAdmin },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
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

// Change user password
const changePassword = async (userId, data) => {
  const { currentPassword, newPassword } = data;
  
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }
  
  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
  // Update password
  user.password = hashedNewPassword;
  await user.save();
  
  return { message: 'Password changed successfully' };
};

// Generate a generic password
const generateGenericPassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Admin reset user password
const adminResetPassword = async (adminUserId, targetUserId, newPassword = null) => {
  // Verify admin permissions
  const admin = await User.findById(adminUserId);
  if (!admin || !admin.isAdmin) {
    throw new Error('Admin access required');
  }
  
  // Find target user
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new Error('User not found');
  }
  
  // Generate password if not provided
  const passwordToSet = newPassword || generateGenericPassword();
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(passwordToSet, 10);
  
  // Update user password
  targetUser.password = hashedPassword;
  await targetUser.save();
  
  return {
    message: 'Password reset successfully',
    newPassword: passwordToSet, // Return the plain password for admin to share
    user: {
      id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
    },
  };
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
  changePassword,
  generateGenericPassword,
  adminResetPassword,
};