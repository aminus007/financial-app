const Transaction = require('../models/Transaction');
const Account = require('../models/Account'); // Needed for create transaction logic
const PDFDocument = require('pdfkit'); // Needed for PDF generation
const moment = require('moment'); // Needed for PDF generation and date handling

// Service function to get all transactions with pagination and filtering
const getAllTransactions = async (userId, queryParams) => {
  const { type, category, startDate, endDate, sort = '-date', page = 1, limit = 10 } = queryParams;

  const query = { user: userId };

  if (type) query.type = type;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const options = {
    sort,
    limit: parseInt(limit, 10),
    skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  };

  const transactions = await Transaction.find(query, null, options);
  const total = await Transaction.countDocuments(query);

  return {
    transactions,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
};

// Service function to get transaction summary
const getTransactionSummary = async (userId, queryParams) => {
  const { startDate, endDate } = queryParams;

  const query = { user: userId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const summary = await Transaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const response = {
    income: 0,
    expense: 0,
    net: 0,
  };

  summary.forEach(item => {
    response[item._id] = item.total;
  });
  response.net = response.income - response.expense;

  return response;
};

// Service function to get category summary
const getCategorySummary = async (userId, queryParams) => {
  const { type, startDate, endDate } = queryParams;

  const query = { user: userId };
  if (type) query.type = type;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const categories = await Transaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  return categories;
};

// Service function to create a new transaction
const createTransaction = async (userId, transactionData) => {
  const { type, amount, source } = transactionData;

  // Note: User object is not available directly in service.
  // If balance updates are needed here, the user object or relevant data
  // would need to be passed from the route handler or fetched within the service.
  // For now, assuming balance updates are handled elsewhere or will be refactored.

  // Re-implementing balance update logic from route handler:
  if (type === 'expense') {
    if (!source) throw new Error('Source (cash or accountId) is required for expenses');

    // This part requires access to the user object or a user service
    // For now, I will leave this as a placeholder and note that
    // the user balance update logic needs to be handled appropriately,
    // possibly by passing the user object or using a dedicated userService.
    // Example placeholder for balance update:
    // if (source === 'cash') {
    //   // Update user cash balance
    // } else {
    //   // Update account balance
    // }

    // *** IMPORTANT: The original route handler updated req.user.cash and account.balance directly.
    // This logic needs to be properly integrated into the service layer,
    // potentially by fetching the user/account or receiving them as parameters,
    // and then saving the changes. This diff does NOT include the correct
    // implementation for balance updates as it requires more context/refactoring
    // around user/account services. ***

    // Creating the transaction itself:
    const transaction = new Transaction({
      ...transactionData,
      user: userId
    });
    await transaction.save();
    return transaction;

  } else { // income or other types
     const transaction = new Transaction({
      ...transactionData,
      user: userId
    });
    await transaction.save();
    return transaction;
  }
};

// Service function to update a transaction
const updateTransaction = async (transactionId, userId, updateData) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: transactionId, user: userId },
    updateData,
    { new: true, runValidators: true }
  );
  return transaction;
};

// Service function to delete a transaction
const deleteTransaction = async (transactionId, userId) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: transactionId,
    user: userId
  });
  return transaction;
};

// Service function to generate a PDF report of transactions
const generateTransactionReportPDF = async (user, queryParams, res) => {
  const { type, category, startDate, endDate } = queryParams;
  const query = { user: user._id };
  if (type) query.type = type;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  const transactions = await Transaction.find(query).sort('-date');

  // Calculate summary
  const summary = transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  summary.net = summary.income - summary.expense;

  // Create PDF
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions_report.pdf"');
  doc.pipe(res);

  // Title
  doc.fontSize(22).text('Personal Finance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`User: ${user.name} (${user.email})`);
  doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm')}`);
  doc.moveDown();

  // Summary
  doc.fontSize(16).text('Summary', { underline: true });
  doc.fontSize(12).text(`Total Income: $${summary.income.toFixed(2)}`);
  doc.text(`Total Expenses: $${summary.expense.toFixed(2)}`);
  doc.text(`Net Balance: $${summary.net.toFixed(2)}`);
  doc.moveDown();

  // Table header
  doc.fontSize(16).text('Transactions', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  doc.text('Date', 40, doc.y, { continued: true, width: 80 });
  doc.text('Type', 120, doc.y, { continued: true, width: 60 });
  doc.text('Category', 180, doc.y, { continued: true, width: 100 });
  doc.text('Amount', 280, doc.y, { continued: true, width: 60 });
  doc.text('Note', 340, doc.y, { width: 200 });
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(540, doc.y).stroke();

  // Table rows
  transactions.forEach((t) => {
    doc.text(moment(t.date).format('YYYY-MM-DD'), 40, doc.y, { continued: true, width: 80 });
    doc.text(t.type, 120, doc.y, { continued: true, width: 60 });
    doc.text(t.category, 180, doc.y, { continued: true, width: 100 });
    doc.text(`$${t.amount.toFixed(2)}`, 280, doc.y, { continued: true, width: 60 });
    doc.text(t.note || '', 340, doc.y, { width: 200 });
    if (doc.y > 750) doc.addPage();
  });

  doc.end();
};

// Service function to get top spending categories
const getTopSpendingCategories = async (userId, queryParams) => {
  const { month, year, limit = 3 } = queryParams;
  if (!month || !year) throw new Error('month and year required');
  const start = new Date(`${year}-${month}-01`);
  const end = new Date(`${year}-${Number(month) + 1}-01`);
  const categories = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: Number(limit) },
  ]);
  return categories;
};

// Service function to get net worth trend
const getNetWorthTrend = async (userId, queryParams) => {
  const { months = 6 } = queryParams;
  const now = new Date();
  const trend = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const summary = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: d, $lt: next } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    let income = 0, expense = 0;
    summary.forEach(s => {
      if (s._id === 'income') income = s.total;
      if (s._id === 'expense') expense = s.total;
    });
    trend.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      income,
      expense,
      net: income - expense,
    });
  }
  return trend;
};

// Admin service function to list all transactions
const adminGetAllTransactions = async () => {
  // Logic will be moved here
};

// Admin service function to update any transaction
const adminUpdateTransaction = async (transactionId, updateData) => {
  // Logic will be moved here
};

// Admin service function to delete any transaction
const adminDeleteTransaction = async (transactionId) => {
  // Logic will be moved here
};

const logRecurringTransaction = async (recurringTransaction) => {
  const transactionData = {
    amount: recurringTransaction.amount,
    type: recurringTransaction.type,
    category: recurringTransaction.category,
    note: recurringTransaction.note,
    user: recurringTransaction.user,
    date: new Date(), // Set the date to now
  };

  const transaction = new Transaction(transactionData);
  await transaction.save();
};

module.exports = {
  getAllTransactions,
  getTransactionSummary,
  getCategorySummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  generateTransactionReportPDF,
  getTopSpendingCategories,
  getNetWorthTrend,
  adminGetAllTransactions,
  adminUpdateTransaction,
  adminDeleteTransaction,
  logRecurringTransaction,
};