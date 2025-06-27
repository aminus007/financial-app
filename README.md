# MindfulMoney - Personal Finance Management App

MindfulMoney is a modern, full-stack personal finance management application that helps you track your income, expenses, budgets, savings goals, and recurring transactions. It features a beautiful, responsive UI, interactive analytics, and robust backend with JWT authentication.

---

## Features

### Core Financial Management
- **Dashboard Overview:** Visualize your financial health with charts for income, expenses, net balance, and category breakdowns.
- **Transaction Management:** Add, edit, delete, and categorize income and expenses. View recent transactions and trends.
- **Account Transfers:** Transfer funds between accounts and cash with real-time balance updates and transaction logging.
- **Budget Tracking:** Set monthly category budgets, monitor progress, and get alerts when you approach limits.
- **Savings Goals:** Create, fund, and track progress toward savings goals with deadlines.
- **Recurring Transactions:** Automate regular income/expenses with automatic transaction logging when due.
- **Debt Management:** Track outstanding debts, payments, and interest rates.

### Advanced Features
- **Multi-Step Signup:** Beautiful step-by-step registration process with validation and progress tracking.
- **Data Import/Export:** Backup and restore your financial data with CSV/XLSX support and selective data import.
- **Password Management:** Secure password changes for users and admin password reset functionality.
- **Recurring Transaction Processing:** Automatic creation of transactions when recurring items are due.
- **Salary Allocator:** Use interactive sliders to apply and customize the 50-30-20 rule (Needs, Savings, Wants) with instant feedback.
- **Multi-Account Support:** Manage cash, checking, savings, and other accounts with individual balance tracking.

### User Experience
- **Dark Mode:** Seamless light/dark theme toggle.
- **Responsive Design:** Works great on desktop, tablet, and mobile.
- **Secure Authentication:** JWT-based login and registration with enhanced security.
- **PDF Reports:** Export financial summaries as PDF (backend support).
- **State Management:** Efficient state management with Zustand stores for optimal performance.
- **Real-time Processing:** Automatic processing of recurring transactions with user feedback.

### Admin Features
- **User Management:** Admin panel for managing all users.
- **Password Reset:** Generate secure passwords and reset user passwords.
- **Data Processing:** Process recurring transactions across all users.
- **System Monitoring:** View and manage all financial data.

---

## Tech Stack

**Frontend:**
- React (with Hooks)
- React Router
- Tailwind CSS
- Recharts (charts/analytics)
- Axios (API calls)
- React Query (data fetching/caching)
- Zustand (state management)
- Lucide React (icons)
- Jest & Testing Library (testing)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose (ODM)
- JWT Authentication
- Node-cron (scheduled jobs)
- PDFKit (PDF generation)
- Multer (file uploads)
- XLSX (Excel/CSV processing)
- CORS, dotenv, bcryptjs

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aminus007/financial-app.git
cd financial-app
```

### 2. Install Dependencies

```bash
# Install root dependencies (if any)
npm install

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 3. Configure Environment Variables

```bash
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret
```

Example `.env`:
```
MONGODB_URI=mongodb://localhost:27017/mindfulmoney
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 4. Start Development Servers

```bash
# In one terminal (backend)
cd server
npm run dev

# In another terminal (frontend)
cd ../client
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

## Usage

### Getting Started
1. **Register** a new account using the multi-step signup process.
2. **Login** to access your dashboard.
3. **Add accounts** (cash, checking, savings, etc.) and set initial balances.
4. **Transfer funds** between accounts and cash using the transfer functionality.
5. **Record transactions** (income/expense) and categorize them.
6. **Set budgets** for spending categories and track your progress.
7. **Create savings goals** and allocate funds toward them.
8. **Schedule recurring transactions** for regular income/expenses.
9. **Use the Salary Allocator** to plan your monthly allocations.
10. **Switch between light/dark mode** as you prefer.
11. **Export reports** (PDF) for your records.

### Data Management
- **Import Data:** Upload CSV/XLSX files to restore your financial data with selective import options.
- **Export Data:** Download all your financial data as an Excel file with multiple sheets.
- **Backup Strategy:** Regularly export your data for safekeeping.

### Recurring Transactions
- **Automatic Processing:** Recurring transactions are automatically processed when due.
- **Manual Processing:** Use the "Process Due Transactions" button to manually trigger processing.
- **Transaction Logging:** All processed recurring transactions appear in your regular transaction history.
- **Frequency Support:** Daily, weekly, monthly, and yearly recurring transactions.

### Password Management
- **Change Password:** Update your password securely through the Settings page.
- **Admin Reset:** Admins can reset user passwords and generate secure passwords.

---

## Project Structure

```
financial-app/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components (Navbar, Charts, Modal, etc.)
│   │   ├── pages/       # Main app pages (Dashboard, Transactions, Budgets, Goals, etc.)
│   │   ├── services/    # API service layer (axios)
│   │   ├── store/       # Zustand state management stores
│   │   └── hooks/       # Custom React hooks
│   └── ...
├── server/              # Express backend
│   ├── models/          # Mongoose models (User, Transaction, Budget, Goal, etc.)
│   ├── routes/          # API routes (auth, transactions, budgets, goals, recurring, data)
│   ├── services/        # Business logic services
│   ├── middleware/      # Custom middleware (auth, error handling)
│   └── ...
└── ...
```

---

## API Overview

### Core Endpoints
- **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/preferences`, `/api/auth/transfer`, `/api/auth/change-password`
- **Transactions:** `/api/transactions` (CRUD, summary, categories, top-categories, net-worth-trend)
- **Budgets:** `/api/budgets` (CRUD, progress)
- **Goals:** `/api/goals` (CRUD, add funds)
- **Recurring:** `/api/recurring` (CRUD, process)
- **Debts:** `/api/debts` (CRUD, payments)
- **Reports:** `/api/report` (PDF export)

### Data Management
- **Import:** `POST /api/data/import` - Import CSV/XLSX data with selective options
- **Export:** `GET /api/data/export` - Export all data as Excel file

### Admin Endpoints
- **Users:** `/api/auth/admin/users` (CRUD, password reset)
- **Password Generation:** `/api/auth/admin/generate-password`
- **Recurring Processing:** `/api/recurring/admin/process-all`

All endpoints (except registration/login) require a valid JWT token.

---

## Recent Updates

### v3.0.0 - Comprehensive Feature Enhancement
- ✅ **Multi-step signup flow** with validation and Lucide React icons
- ✅ **CSV/XLSX import/export functionality** with data selection modal
- ✅ **Password change functionality** for users
- ✅ **Admin password reset** and generic password generation
- ✅ **Recurring transaction auto-processing** with transaction logging
- ✅ **Data import options modal** (default: transactions only)
- ✅ **Enhanced recurring transaction model** and processing logic
- ✅ **Automatic and manual recurring transaction processing**
- ✅ **Improved user experience** with better error handling and feedback

### v2.0.0 - Transfer Functionality & State Management
- ✅ **Added transfer functionality** between accounts and cash
- ✅ **Implemented Zustand state management** for better performance
- ✅ **Fixed zustand v5 compatibility** issues
- ✅ **Replaced AuthContext** with useAuthStore for consistency
- ✅ **Added comprehensive service layer** for better code organization
- ✅ **Enhanced error handling** and validation
- ✅ **Improved currency formatting** across components

---

## Tips & Best Practices

### Security
- **Data Security:** Never commit your `.env` file or secrets to version control.
- **Password Management:** Use strong passwords and change them regularly.
- **Backup Strategy:** Regularly export your data for safekeeping.

### Development
- **Testing:** Use `npm run test` in the `client` directory to run frontend tests.
- **Production Build:** Use `npm run build` in `client` to generate optimized static files.
- **Extending Categories:** You can add new categories for transactions and budgets as needed.

### Data Management
- **Import Strategy:** Use selective import to avoid overwriting existing data.
- **Recurring Transactions:** Set up recurring transactions for regular income/expenses.
- **Regular Processing:** Recurring transactions are automatically processed, but you can also manually trigger processing.

### Performance
- **State Management:** The app uses Zustand for efficient state management with automatic re-rendering.
- **Error Handling:** The app provides user-friendly error messages and handles token expiration gracefully.
- **Scheduled Jobs:** The backend processes recurring transactions automatically.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team. 