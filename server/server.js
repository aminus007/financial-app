require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const RecurringTransaction = require('./models/RecurringTransaction');
const Transaction = require('./models/Transaction');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const goalRoutes = require('./routes/goals');
const recurringRoutes = require('./routes/recurring');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/recurring', recurringRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
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
    // Create the actual transaction
    await Transaction.create({
      user: recur.user,
      amount: recur.amount,
      type: recur.type,
      category: recur.category,
      note: recur.note || '[Recurring]',
      date: recur.nextOccurrence,
    });
    // Calculate next occurrence
    const next = getNextOccurrence(recur.nextOccurrence, recur.frequency);
    // If endDate is set and next > endDate, deactivate
    let active = true;
    if (recur.endDate && next > recur.endDate) active = false;
    await RecurringTransaction.findByIdAndUpdate(recur._id, {
      nextOccurrence: next,
      active,
    });
  }
  if (due.length) {
    console.log(`[Recurring] Processed ${due.length} recurring transactions at ${now.toISOString()}`);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 