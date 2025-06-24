# MindfulMoney - Personal Finance Management App

MindfulMoney is a modern, full-stack personal finance management application that helps you track your income, expenses, budgets, savings goals, and recurring transactions. It features a beautiful, responsive UI, interactive analytics, and robust backend with JWT authentication.

---

## Features

- **Dashboard Overview:** Visualize your financial health with charts for income, expenses, net balance, and category breakdowns.
- **Transaction Management:** Add, edit, delete, and categorize income and expenses. View recent transactions and trends.
- **Account Transfers:** Transfer funds between accounts and cash with real-time balance updates and transaction logging.
- **Budget Tracking:** Set monthly category budgets, monitor progress, and get alerts when you approach limits.
- **Savings Goals:** Create, fund, and track progress toward savings goals with deadlines.
- **Recurring Transactions:** Automate regular income/expenses (e.g., salary, rent, subscriptions) with flexible scheduling.
- **Salary Allocator:** Use interactive sliders to apply and customize the 50-30-20 rule (Needs, Savings, Wants) with instant feedback.
- **Multi-Account Support:** Manage cash, checking, savings, and other accounts with individual balance tracking.
- **Dark Mode:** Seamless light/dark theme toggle.
- **Responsive Design:** Works great on desktop, tablet, and mobile.
- **Secure Authentication:** JWT-based login and registration.
- **PDF Reports:** Export financial summaries as PDF (backend support).
- **State Management:** Efficient state management with Zustand stores for optimal performance.

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
- Jest & Testing Library (testing)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose (ODM)
- JWT Authentication
- Node-cron (scheduled jobs)
- PDFKit (PDF generation)
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

1. **Register** a new account with your name and email.
2. **Login** to access your dashboard.
3. **Add accounts** (cash, checking, savings, etc.) and set initial balances.
4. **Transfer funds** between accounts and cash using the transfer functionality.
5. **Record transactions** (income/expense) and categorize them.
6. **Set budgets** for spending categories and track your progress.
7. **Create savings goals** and allocate funds toward them.
8. **Schedule recurring transactions** for regular income/expenses.
9. **Use the Salary Allocator** to plan your monthly allocations.
10. **Switch between light/dark mode** as you prefer.
11. **Export reports** (PDF) for your records (backend support).

### Transfer Functionality

The app now includes a powerful transfer system that allows you to:

- **Transfer between accounts:** Move money from one account to another
- **Transfer to/from cash:** Convert between cash and account balances
- **Real-time validation:** Check for sufficient funds before transfers
- **Transaction logging:** All transfers are logged as separate transactions
- **Balance updates:** Immediate balance updates across all accounts

To use transfers:
1. Go to the **Accounts** page
2. Use the **"Transfer Funds"** section
3. Select source (From) and destination (To) accounts or cash
4. Enter the amount
5. Click **"Transfer"**

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
│   ├── routes/          # API routes (auth, transactions, budgets, goals, recurring, report)
│   ├── services/        # Business logic services
│   ├── middleware/      # Custom middleware (auth, error handling)
│   └── ...
└── ...
```

---

## API Overview

- **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/preferences`, `/api/auth/transfer`
- **Transactions:** `/api/transactions` (CRUD, summary, categories, top-categories, net-worth-trend)
- **Budgets:** `/api/budgets` (CRUD, progress)
- **Goals:** `/api/goals` (CRUD, add funds)
- **Recurring:** `/api/recurring` (CRUD)
- **Reports:** `/api/report` (PDF export)

All endpoints (except registration/login) require a valid JWT token.

### Transfer API

- **POST** `/api/auth/transfer` - Transfer funds between accounts or cash
  - Body: `{ sourceType, sourceId, destType, destId, amount }`
  - Returns: Success message and updated balances

---

## Recent Updates

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

- **Data Security:** Never commit your `.env` file or secrets to version control.
- **Testing:** Use `npm run test` in the `client` directory to run frontend tests.
- **Production Build:** Use `npm run build` in `client` to generate optimized static files.
- **Extending Categories:** You can add new categories for transactions and budgets as needed.
- **Scheduled Jobs:** The backend uses `node-cron` to process recurring transactions daily at 1:00 AM.
- **Error Handling:** The app provides user-friendly error messages and handles token expiration gracefully.
- **State Management:** The app uses Zustand for efficient state management with automatic re-rendering.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT 

---

**Tested:**  
- Installation and startup scripts are standard and should work out-of-the-box with Node.js and MongoDB installed.
- The app uses efficient data fetching (React Query), optimized queries (Mongoose indexes), and modern React patterns for best performance.
- Transfer functionality has been thoroughly tested with various scenarios including insufficient funds, invalid accounts, and edge cases.

If you need more advanced deployment, Docker, or CI/CD instructions, let me know! 