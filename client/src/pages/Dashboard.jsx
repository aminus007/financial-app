import { useQuery } from 'react-query';
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
import { transactions as transactionsApi } from '../services/api';
import { useState } from 'react';

const monthNames = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

const Dashboard = () => {
  const { data: summary } = useQuery(['transactions', 'summary'], () =>
    transactionsApi.getSummary()
  );

  const { data: categories } = useQuery(['transactions', 'categories'], () =>
    transactionsApi.getCategories({ type: 'expense' })
  );

  const { data: transactions } = useQuery(['transactions'], () =>
    transactionsApi.getAll({
      limit: 30,
      sort: '-date',
    })
  );

  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());

  const { data: topCategories } = useQuery(
    ['top-categories', selectedMonth, selectedYear],
    () => transactionsApi.getTopCategories({ month: selectedMonth, year: selectedYear })
  );

  const { data: netWorthTrend } = useQuery(
    ['net-worth-trend'],
    () => transactionsApi.getNetWorthTrend({ months: 6 })
  );

  // Prepare data for line chart
  const lineChartData = transactions
    ? transactions.reduce((acc, transaction) => {
        const date = format(new Date(transaction.date), 'MMM dd');
        const existingDay = acc.find((d) => d.date === date);

        if (existingDay) {
          if (transaction.type === 'income') {
            existingDay.income += transaction.amount;
          } else {
            existingDay.expense += transaction.amount;
          }
        } else {
          acc.push({
            date,
            income: transaction.type === 'income' ? transaction.amount : 0,
            expense: transaction.type === 'expense' ? transaction.amount : 0,
          });
        }

        return acc;
      }, [])
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Income
          </h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            ${summary?.income.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Expenses
          </h3>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
            ${summary?.expense.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Net Balance
          </h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              (summary?.net || 0) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            ${summary?.net.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Income vs Expenses
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#EF4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Expenses by Category
          </h3>
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
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value,
                    index,
                  }) => {
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
                      >
                        {categories[index]._id} (${value.toFixed(0)})
                      </text>
                    );
                  }}
                >
                  {(categories || []).map((entry, index) => (
                    <Cell
                      key={entry._id}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Top Spending Categories ({monthNames[selectedMonth]} {selectedYear})
            </h3>
            <ul className="space-y-2">
              {topCategories?.length ? topCategories.map((cat, i) => (
                <li key={cat._id} className="flex justify-between">
                  <span>{i + 1}. {cat._id}</span>
                  <span className="font-bold text-red-600 dark:text-red-400">${cat.total.toFixed(2)}</span>
                </li>
              )) : <li>No data</li>}
            </ul>
          </div>
          {/* Net Worth Trend */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Net Worth Trend (Last 6 Months)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={netWorthTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={m => monthNames[m]} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="net" stroke="#0ea5e9" strokeWidth={2} name="Net" />
                  <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 