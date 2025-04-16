import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const timeRanges = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

const categories = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Income',
  'Healthcare',
];
const categoryColors = [
  'rgba(255, 99, 132, 0.8)',
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(153, 102, 255, 0.8)',
  'rgba(34, 197, 94, 0.8)',
  'rgba(255, 159, 64, 0.8)',
];

function getSummary(transactions: any[]) {
  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  return {
    income,
    expenses,
    savings,
    savingsRate,
  };
}

export default function Reports() {
  const [timeRange, setTimeRange] = useState('month');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('transactions');
    if (stored) setTransactions(JSON.parse(stored));
  }, []);

  // Filter transactions by time range (for demo, only 'month' is dynamic)
  const now = new Date();
  let filtered = transactions;
  if (timeRange === 'month') {
    filtered = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }
  // (You can expand for week/quarter/year as needed)

  const summary = getSummary(filtered);

  // Income vs Expenses chart (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString('default', { month: 'short' });
  });
  const incomeData = months.map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    return transactions
      .filter((t) => t.type === 'income' && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year)
      .reduce((sum, t) => sum + t.amount, 0);
  });
  const expenseData = months.map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    return transactions
      .filter((t) => t.type === 'expense' && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  });
  const incomeExpenseData = {
    labels: months,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  // Expense Categories chart
  const categoryTotals = categories.map((cat) =>
    filtered
      .filter((t) => t.category === cat && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  );
  const categoryData = {
    labels: categories,
    datasets: [
      {
        data: categoryTotals,
        backgroundColor: categoryColors,
      },
    ],
  };

  // Savings Rate Trend (last 6 months)
  const savingsRateData = months.map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthIncome = transactions
      .filter((t) => t.type === 'income' && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year)
      .reduce((sum, t) => sum + t.amount, 0);
    const monthExpenses = transactions
      .filter((t) => t.type === 'expense' && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return monthIncome > 0 ? ((monthIncome - monthExpenses) / monthIncome) * 100 : 0;
  });
  const savingsData = {
    labels: months,
    datasets: [
      {
        label: 'Savings Rate',
        data: savingsRateData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                timeRange === range.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Total Income</dt>
                <dd className="text-2xl font-semibold text-gray-900">${summary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Total Expenses</dt>
                <dd className="text-2xl font-semibold text-gray-900">${summary.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Net Savings</dt>
                <dd className="text-2xl font-semibold text-gray-900">${summary.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-primary-500" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">Savings Rate</dt>
                <dd className="text-2xl font-semibold text-gray-900">{summary.savingsRate.toFixed(1)}%</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Income vs Expenses
          </h3>
          <div className="mt-4 h-64">
            <Line data={incomeExpenseData} options={chartOptions} />
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Expense Categories
          </h3>
          <div className="mt-4 h-64">
            <Doughnut data={categoryData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Savings Rate Trend
        </h3>
        <div className="mt-4 h-64">
          <Bar data={savingsData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
} 