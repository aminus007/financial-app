const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const Budget = require('../models/Budget');
const Debt = require('../models/Debt');
const RecurringTransaction = require('../models/RecurringTransaction');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  },
});

// Import data from CSV/Excel file
router.post('/import', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { buffer, originalname } = req.file;
    const importOptions = req.body.importOptions ? JSON.parse(req.body.importOptions) : {
      transactions: true,
      accounts: false,
      goals: false,
      budgets: false,
      debts: false,
      recurring: false,
    };

    if (!Object.values(importOptions).some(option => option)) {
      return res.status(400).json({ message: 'Please select at least one data type to import' });
    }

    let data = [];

    // Parse file based on type
    if (originalname.endsWith('.csv')) {
      const csvString = buffer.toString('utf-8');
      const workbook = XLSX.read(csvString, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'No data found in file' });
    }

    // Process imported data
    const results = await processImportedData(req.user._id, data, importOptions);
    
    res.json({
      message: 'Data imported successfully',
      results,
    });
  } catch (error) {
    next(error);
  }
});

// Export all user data
router.get('/export', auth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Fetch all user data
    const [accounts, transactions, goals, budgets, debts, recurring] = await Promise.all([
      Account.find({ user: userId }),
      Transaction.find({ user: userId }).sort({ date: -1 }),
      Goal.find({ user: userId }),
      Budget.find({ user: userId }),
      Debt.find({ user: userId }),
      RecurringTransaction.find({ user: userId }),
    ]);

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Accounts sheet
    const accountsData = accounts.map(acc => ({
      'Account ID': acc._id,
      'Bank Name': acc.name || 'N/A',
      'Account Type': acc.type,
      'Balance': acc.balance,
      'Created': acc.createdAt,
      'Updated': acc.updatedAt,
    }));
    const accountsSheet = XLSX.utils.json_to_sheet(accountsData);
    XLSX.utils.book_append_sheet(workbook, accountsSheet, 'Accounts');

    // Transactions sheet
    const transactionsData = transactions.map(t => ({
      'Transaction ID': t._id,
      'Amount': t.amount,
      'Type': t.type,
      'Category': t.category,
      'Note': t.note || '',
      'Date': t.date,
      'Created': t.createdAt,
    }));
    const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

    // Goals sheet
    const goalsData = goals.map(g => ({
      'Goal ID': g._id,
      'Name': g.name,
      'Target Amount': g.targetAmount,
      'Current Amount': g.currentAmount,
      'Progress': g.currentAmount / g.targetAmount * 100,
      'Created': g.createdAt,
      'Updated': g.updatedAt,
    }));
    const goalsSheet = XLSX.utils.json_to_sheet(goalsData);
    XLSX.utils.book_append_sheet(workbook, goalsSheet, 'Goals');

    // Budgets sheet
    const budgetsData = budgets.map(b => ({
      'Budget ID': b._id,
      'Category': b.category,
      'Amount': b.amount,
      'Spent': b.spent || 0,
      'Remaining': (b.amount - (b.spent || 0)),
      'Period': b.period,
      'Created': b.createdAt,
      'Updated': b.updatedAt,
    }));
    const budgetsSheet = XLSX.utils.json_to_sheet(budgetsData);
    XLSX.utils.book_append_sheet(workbook, budgetsSheet, 'Budgets');

    // Debts sheet
    const debtsData = debts.map(d => ({
      'Debt ID': d._id,
      'Name': d.name,
      'Amount': d.amount,
      'Paid': d.paid || 0,
      'Remaining': d.amount - (d.paid || 0),
      'Interest Rate': d.interestRate || 0,
      'Due Date': d.dueDate,
      'Created': d.createdAt,
      'Updated': d.updatedAt,
    }));
    const debtsSheet = XLSX.utils.json_to_sheet(debtsData);
    XLSX.utils.book_append_sheet(workbook, debtsSheet, 'Debts');

    // Recurring Transactions sheet
    const recurringData = recurring.map(r => ({
      'Recurring ID': r._id,
      'Name': r.name,
      'Amount': r.amount,
      'Type': r.type,
      'Category': r.category,
      'Frequency': r.frequency,
      'Start Date': r.startDate,
      'Next Occurrence': r.nextOccurrence,
      'Created': r.createdAt,
      'Updated': r.updatedAt,
    }));
    const recurringSheet = XLSX.utils.json_to_sheet(recurringData);
    XLSX.utils.book_append_sheet(workbook, recurringSheet, 'Recurring Transactions');

    // User Info sheet
    const userData = [{
      'User ID': req.user._id,
      'Name': req.user.name,
      'Email': req.user.email,
      'Currency': req.user.preferences?.currency || 'USD',
      'Cash Balance': req.user.cash || 0,
      'Total Accounts': accounts.length,
      'Total Transactions': transactions.length,
      'Total Goals': goals.length,
      'Total Budgets': budgets.length,
      'Total Debts': debts.length,
      'Total Recurring': recurring.length,
      'Account Created': req.user.createdAt,
      'Last Updated': req.user.updatedAt,
    }];
    const userSheet = XLSX.utils.json_to_sheet(userData);
    XLSX.utils.book_append_sheet(workbook, userSheet, 'User Info');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="MindfulMoney_Data_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Helper function to process imported data
async function processImportedData(userId, data, importOptions) {
  const results = {
    accounts: { created: 0, updated: 0, errors: 0 },
    transactions: { created: 0, updated: 0, errors: 0 },
    goals: { created: 0, updated: 0, errors: 0 },
    budgets: { created: 0, updated: 0, errors: 0 },
    debts: { created: 0, updated: 0, errors: 0 },
    recurring: { created: 0, updated: 0, errors: 0 },
  };

  for (const row of data) {
    try {
      // Determine data type based on headers or structure
      if (row['Account Type'] || row['AccountType'] || row['Type']) {
        if (!importOptions.accounts) continue;

        // Process account data
        const accountData = {
          type: (row['Account Type'] || row['AccountType'] || row['Type']).toLowerCase(),
          balance: parseFloat(row['Balance'] || row['Amount'] || 0),
          name: row['Bank Name'] || row['BankName'] || row['Name'] || '',
        };

        if (accountData.type && ['checking', 'savings', 'other'].includes(accountData.type)) {
          await Account.create({
            user: userId,
            ...accountData,
          });
          results.accounts.created++;
        }
      } else if (row['Transaction Type'] || row['TransactionType'] || row['Type']) {
        if (!importOptions.transactions) continue;

        // Process transaction data
        const transactionData = {
          amount: parseFloat(row['Amount'] || 0),
          type: (row['Transaction Type'] || row['TransactionType'] || row['Type']).toLowerCase(),
          category: row['Category'] || 'other',
          note: row['Note'] || row['Description'] || '',
          date: row['Date'] ? new Date(row['Date']) : new Date(),
        };

        if (transactionData.amount && ['income', 'expense'].includes(transactionData.type)) {
          await Transaction.create({
            user: userId,
            ...transactionData,
          });
          results.transactions.created++;
        }
      } else if (row['Goal Name'] || row['GoalName'] || row['Name']) {
        if (!importOptions.goals) continue;

        // Process goal data
        const goalData = {
          name: row['Goal Name'] || row['GoalName'] || row['Name'],
          targetAmount: parseFloat(row['Target Amount'] || row['TargetAmount'] || 0),
          currentAmount: parseFloat(row['Current Amount'] || row['CurrentAmount'] || 0),
        };

        if (goalData.name && goalData.targetAmount > 0) {
          await Goal.create({
            user: userId,
            ...goalData,
          });
          results.goals.created++;
        }
      } else if (row['Budget Category'] || row['BudgetCategory'] || row['Category']) {
        if (!importOptions.budgets) continue;

        // Process budget data
        const budgetData = {
          category: row['Budget Category'] || row['BudgetCategory'] || row['Category'],
          amount: parseFloat(row['Amount'] || row['Budget Amount'] || 0),
          period: row['Period'] || 'monthly',
        };

        if (budgetData.category && budgetData.amount > 0) {
          await Budget.create({
            user: userId,
            ...budgetData,
          });
          results.budgets.created++;
        }
      } else if (row['Debt Name'] || row['DebtName'] || row['Name']) {
        if (!importOptions.debts) continue;

        // Process debt data
        const debtData = {
          name: row['Debt Name'] || row['DebtName'] || row['Name'],
          amount: parseFloat(row['Amount'] || row['Debt Amount'] || 0),
          paid: parseFloat(row['Paid'] || row['Amount Paid'] || 0),
          interestRate: parseFloat(row['Interest Rate'] || row['InterestRate'] || 0),
          dueDate: row['Due Date'] || row['DueDate'] ? new Date(row['Due Date'] || row['DueDate']) : null,
        };

        if (debtData.name && debtData.amount > 0) {
          await Debt.create({
            user: userId,
            ...debtData,
          });
          results.debts.created++;
        }
      } else if (row['Recurring Name'] || row['RecurringName'] || row['Name']) {
        // Only process recurring transactions if selected
        if (!importOptions.recurring) continue;

        // Process recurring transaction data
        const recurringData = {
          name: row['Recurring Name'] || row['RecurringName'] || row['Name'],
          amount: parseFloat(row['Amount'] || 0),
          type: (row['Transaction Type'] || row['Type'] || 'expense').toLowerCase(),
          category: row['Category'] || 'other',
          frequency: row['Frequency'] || 'monthly',
          startDate: row['Start Date'] || row['StartDate'] ? new Date(row['Start Date'] || row['StartDate']) : new Date(),
          nextOccurrence: row['Next Occurrence'] || row['NextOccurrence'] || row['Next Due'] || row['NextDue'] ? new Date(row['Next Occurrence'] || row['NextOccurrence'] || row['Next Due'] || row['NextDue']) : new Date(),
          active: true,
        };

        if (recurringData.name && recurringData.amount > 0 && ['income', 'expense'].includes(recurringData.type)) {
          await RecurringTransaction.create({
            user: userId,
            ...recurringData,
          });
          results.recurring.created++;
        }
      }
    } catch (error) {
      console.error('Error processing row:', row, error);
      // Determine which category had the error
      if (row['Account Type'] || row['AccountType']) {
        if (importOptions.accounts) {
          results.accounts.errors++;
        }
      } else if (row['Transaction Type'] || row['TransactionType']) {
        if (importOptions.transactions) {
          results.transactions.errors++;
        }
      } else if (row['Goal Name'] || row['GoalName']) {
        if (importOptions.goals) {
          results.goals.errors++;
        }
      } else if (row['Budget Category'] || row['BudgetCategory']) {
        if (importOptions.budgets) {
          results.budgets.errors++;
        }
      } else if (row['Debt Name'] || row['DebtName']) {
        if (importOptions.debts) {
          results.debts.errors++;
        }
      } else if (row['Recurring Name'] || row['RecurringName']) {
        if (importOptions.recurring) {
          results.recurring.errors++;
        }
      }
    }
  }

  return results;
}

module.exports = router; 