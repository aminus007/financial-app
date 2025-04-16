const express = require('express');
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary
} = require('../controllers/budgets');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(createBudget);

router.route('/:id')
  .get(getBudget)
  .put(updateBudget)
  .delete(deleteBudget);

router.get('/summary', getBudgetSummary);

module.exports = router; 