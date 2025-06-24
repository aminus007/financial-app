const express = require('express');
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const reportService = require('../services/reportService');

const router = express.Router();

router.get('/pdf', auth, async (req, res, next) => {
  try {
    await reportService.generateUserReportPDF(req.user, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 