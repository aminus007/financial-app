import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { transactions as transactionsApi, auth as authApi } from '../services/api';
import { useState, useEffect } from 'react';
import MonthlySpendingChart from '../components/MonthlySpendingChart';
import useAuthStore from '../store/useAuthStore'; // Updated import
import useBudgetStore from '../store/useBudgetStore';

const monthNames = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthNamesShort = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF7C43',
];

// Utility for currency symbol
const currencySymbols = {
  MAD: 'MAD',
  USD: '$',
  GBP: '£',
  EUR: '€',
};
function formatCurrency(amount, currency) {
  if (currency === 'MAD') {
    return `${amount} MAD`;
  } else if (currency === 'USD' || currency === 'GBP' || currency === 'EUR') {
    return `${currencySymbols[currency] || currency}${amount}`;
  } else {
    return `${amount} ${currencySymbols[currency] || currency}`;
  }
}

const Dashboard = () => {
  const { data: summary } = useQuery(['transactions', 'summary'], () =>
    transactionsApi.getSummary()
  );

  const { data: netBalanceData } = useQuery(['user', 'netbalance'], authApi.getNetBalance);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: categories } = useQuery(['transactions', 'categories', selectedMonth, selectedYear], () =>
    transactionsApi.getCategories({ type: 'expense', month: selectedMonth, year: selectedYear })
  );

  const { data: transactions } = useQuery(['transactions'], () =>
    transactionsApi.getAll({
      limit: 30,
      sort: '-date',
    })
  );

  const { data: topCategories } = useQuery(
    ['top-categories', selectedMonth, selectedYear],
    () => transactionsApi.getTopCategories({ month: selectedMonth, year: selectedYear })
  );

  const { data: netWorthTrend } = useQuery(
    ['net-worth-trend'],
    () => transactionsApi.getNetWorthTrend({ months: 6 })
  );

  const queryClient = useQueryClient();
  const { data: accounts } = useQuery(['user', 'accounts'], authApi.getAccounts);
  const updateAccountMutation = useMutation(
    ({ id, balance }) => authApi.updateAccount(id, { balance }),
    {
      onSuccess: () => queryClient.invalidateQueries(['user', 'accounts']),
    }
  );
  const [editBalances, setEditBalances] = useState({});

  const { data: user, refetch: refetchUser } = useQuery(['user', 'profile'], authApi.getProfile);
  const updateCashMutation = useMutation(
    (cash) => authApi.updateCash(cash),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', 'netbalance']);
        refetchUser();
      },
    }
  );
  const [editCash, setEditCash] = useState(undefined);

  const { user: authUser } = useAuthStore(); // Updated usage
  const currency = authUser?.preferences?.currency; // Derived currency from store

  // Prepare data for monthly spending chart and income vs expenses chart
  const monthlySpendingData = (netWorthTrend || []).map(item => ({
    month: monthNamesShort[item.month],
    totalSpent: item.expense
  }));
  const incomeVsExpenseData = (netWorthTrend || []).map(item => ({
    month: monthNamesShort[item.month],
    income: item.income,
    expense: item.expense
  }));

  const { budgets, loading: budgetsLoading, error: budgetsError, fetchBudgets } = useBudgetStore();
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Daily expenses for the last 30 days
  const { data: dailyExpenses } = useQuery(['transactions', 'daily-expenses'], () =>
    transactionsApi.getDailyExpenses({})
  );

  return (
    <div className="space-y-10 px-2 md:px-8 py-6 max-w-7xl mx-auto">
      {/* Month/Year Selectors */}
      <div className="flex flex-wrap gap-4 items-center mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <label className="mr-2 font-medium">Month:</label>
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="input w-auto border rounded px-2 py-1">
          {monthNames.slice(1).map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </select>
        <label className="ml-4 mr-2 font-medium">Year:</label>
        <input
          type="number"
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="input w-24 border rounded px-2 py-1"
          min={2000}
          max={2100}
        />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 shadow rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Income</h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary?.income.toFixed(2) || '0.00', currency)}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 shadow rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Expenses</h3>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary?.expense.toFixed(2) || '0.00', currency)}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 shadow rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Net Balance</h3>
          <p className={`mt-2 text-3xl font-bold ${(netBalanceData?.netBalance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(netBalanceData?.netBalance?.toFixed(2) || '0.00', currency)}</p>
        </div>
      </div>
      {/* Main Analytics: Income vs Expenses & Daily Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income vs Expenses Line Chart (monthly) */}
        <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Income vs Expenses (Monthly)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeVsExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Daily Expenses Line Chart */}
        <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Daily Expenses (Last 30 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyExpenses || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => d?.slice(5)} />
                <YAxis />
                <Tooltip formatter={v => formatCurrency(v.toFixed(2), currency)} />
                <Line type="monotone" dataKey="total" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Category Analytics: Expenses by Category & Top Spending Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Expenses by Category Pie Chart (filtered) */}
        <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories || []}
                  dataKey="total"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = 25 + innerRadius + (outerRadius - innerRadius);
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#666"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        style={{ fontSize: 12 }}
                      >
                        {categories[index]._id} ({formatCurrency(value.toFixed(0), currency)})
                      </text>
                    );
                  }}
                >
                  {(categories || []).map((entry, index) => (
                    <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Top Categories (filtered) */}
        <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Spending Categories ({monthNames[selectedMonth]} {selectedYear})</h3>
          <ul className="space-y-2">
            {topCategories?.length ? topCategories.map((cat, i) => (
              <li key={cat._id} className="flex justify-between border-b pb-1 last:border-b-0">
                <span className="font-medium text-gray-700 dark:text-gray-200">{cat._id}</span>
                <span className="text-gray-500 dark:text-gray-400">{formatCurrency(cat.total.toFixed(2), currency)}</span>
              </li>
            )) : (
              <li className="text-gray-500 dark:text-gray-400">No data</li>
            )}
          </ul>
        </div>
      </div>
      {/* (Optional) Monthly Spending Chart at the bottom */}
      <div className="mt-10">
        <MonthlySpendingChart data={monthlySpendingData} currency={currency} />
      </div>
    </div>
  );
};

export default Dashboard;