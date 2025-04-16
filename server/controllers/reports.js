const Transaction = require('../models/Transaction');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// @desc    Get income vs expense report
// @route   GET /api/reports/income-expense
// @access  Private
exports.getIncomeExpenseReport = async (req, res) => {
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

    const report = {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      monthlyData: {},
      categoryData: {}
    };

    transactions.forEach(transaction => {
      const month = transaction.date.toISOString().slice(0, 7);
      
      // Initialize monthly data if not exists
      if (!report.monthlyData[month]) {
        report.monthlyData[month] = {
          income: 0,
          expense: 0,
          net: 0
        };
      }

      // Initialize category data if not exists
      if (!report.categoryData[transaction.category]) {
        report.categoryData[transaction.category] = {
          income: 0,
          expense: 0
        };
      }

      // Update totals
      if (transaction.type === 'income') {
        report.totalIncome += transaction.amount;
        report.monthlyData[month].income += transaction.amount;
        report.categoryData[transaction.category].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        report.totalExpense += transaction.amount;
        report.monthlyData[month].expense += transaction.amount;
        report.categoryData[transaction.category].expense += transaction.amount;
      }

      // Update monthly net
      report.monthlyData[month].net = 
        report.monthlyData[month].income - report.monthlyData[month].expense;
    });

    report.netBalance = report.totalIncome - report.totalExpense;

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get category breakdown report
// @route   GET /api/reports/category-breakdown
// @access  Private
exports.getCategoryBreakdown = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
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

    const transactions = await Transaction.find(query);

    const breakdown = {};

    transactions.forEach(transaction => {
      if (!breakdown[transaction.category]) {
        breakdown[transaction.category] = 0;
      }
      breakdown[transaction.category] += transaction.amount;
    });

    res.status(200).json({
      success: true,
      data: breakdown
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Export transactions to PDF
// @route   GET /api/reports/export-pdf
// @access  Private
exports.exportToPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .populate('accountId', 'name');

    const doc = new PDFDocument();
    const filename = `transactions-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Transaction Report', { align: 'center' });
    doc.moveDown();

    // Add date range
    if (startDate && endDate) {
      doc.fontSize(12).text(`Date Range: ${startDate} to ${endDate}`);
      doc.moveDown();
    }

    // Add transactions
    transactions.forEach(transaction => {
      doc.fontSize(10)
        .text(`Date: ${transaction.date.toLocaleDateString()}`)
        .text(`Type: ${transaction.type}`)
        .text(`Category: ${transaction.category}`)
        .text(`Amount: ${transaction.amount}`)
        .text(`Account: ${transaction.accountId.name}`)
        .text(`Description: ${transaction.description || 'N/A'}`)
        .moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Export transactions to CSV
// @route   GET /api/reports/export-csv
// @access  Private
exports.exportToCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .populate('accountId', 'name');

    const fields = [
      'date',
      'type',
      'category',
      'amount',
      'account',
      'description'
    ];

    const data = transactions.map(transaction => ({
      date: transaction.date.toLocaleDateString(),
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      account: transaction.accountId.name,
      description: transaction.description || 'N/A'
    }));

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
}; 