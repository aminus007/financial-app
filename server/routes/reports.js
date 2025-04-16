const express = require('express');
const {
  getIncomeExpenseReport,
  getCategoryBreakdown,
  exportToPDF,
  exportToCSV
} = require('../controllers/reports');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/income-expense', getIncomeExpenseReport);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/export-pdf', exportToPDF);
router.get('/export-csv', exportToCSV);

module.exports = router; 