const express = require('express');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary
} = require('../controllers/transactions');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

router.get('/summary', getTransactionSummary);

module.exports = router; 