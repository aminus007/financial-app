require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const RecurringTransaction = require('./models/RecurringTransaction');
const Transaction = require('./models/Transaction');
const Account = require('./models/Account');
const config = require('./config');

console.log('MONGO_URI loaded:', config.mongoUri ? 'Yes' : 'No'); // Added logging
console.log('JWT_SECRET loaded:', config.jwtSecret ? 'Yes' : 'No'); // Added logging

const { router: authRoutes } = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const goalRoutes = require('./routes/goals');
const recurringRoutes = require('./routes/recurring');
const reportRouter = require('./routes/report');
const debtsRoutes = require('./routes/debts');
const dataRoutes = require('./routes/data');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/report', reportRouter);
app.use('/api/debts', debtsRoutes);
app.use('/api/data', dataRoutes);

// Serve static files in production
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function getNextOccurrence(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

// Run every day at 1:00 AM
cron.schedule('0 1 * * *', async () => {
  const now = new Date();
  const due = await RecurringTransaction.find({ active: true, nextOccurrence: { $lte: now } });
  for (const recur of due) {
    // Check if a transaction already exists for this recurring entry on the same day
    const startOfDay = new Date(recur.nextOccurrence);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recur.nextOccurrence);
    endOfDay.setHours(23, 59, 59, 999);
    const exists = await Transaction.findOne({
      user: recur.user,
      amount: recur.amount,
      type: recur.type,
      category: recur.category,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!exists) {
      // Create the actual transaction
      await Transaction.create({
        user: recur.user,
        amount: recur.amount,
        type: recur.type,
        category: recur.category,
        note: recur.note || '[Recurring]',
        date: recur.nextOccurrence,
        source: recur.type === 'expense' ? 'cash' : undefined,
      });
    }
    // Calculate next occurrence
    const next = getNextOccurrence(recur.nextOccurrence, recur.frequency);
    await RecurringTransaction.findByIdAndUpdate(recur._id, {
      nextOccurrence: next,
    });
  }
  if (due.length) {
    console.log(`[Recurring] Processed ${due.length} recurring transactions at ${now.toISOString()}`);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong!',
    code: status,
    details: err.details || undefined,
  });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 