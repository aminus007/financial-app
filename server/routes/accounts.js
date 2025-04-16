const express = require('express');
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  transferFunds
} = require('../controllers/accounts');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getAccounts)
  .post(createAccount);

router.route('/:id')
  .get(getAccount)
  .put(updateAccount)
  .delete(deleteAccount);

router.post('/transfer', transferFunds);

module.exports = router; 