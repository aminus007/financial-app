import { useState, useEffect } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function getSummary(transactions: any[]) {
  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  return {
    balance,
    income,
    expenses,
    savingsRate,
  };
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('month');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('transactions');
    if (stored) setTransactions(JSON.parse(stored));
  }, []);

  const summary = getSummary(transactions);
  const summaryCards = [
    {
      name: 'Total Balance',
      value: `$${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      change: '',
      changeType: summary.balance >= 0 ? 'increase' : 'decrease',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Monthly Income',
      value: `$${summary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      change: '',
      changeType: 'increase',
      icon: ArrowUpIcon,
    },
    {
      name: 'Monthly Expenses',
      value: `$${summary.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      change: '',
      changeType: 'decrease',
      icon: ArrowDownIcon,
    },
    {
      name: 'Savings Rate',
      value: `${summary.savingsRate.toFixed(1)}%`,
      change: '',
      changeType: summary.savingsRate >= 0 ? 'increase' : 'decrease',
      icon: TagIcon,
    },
  ];

  // Prepare chart data for the last 6 months
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
  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses',
      },
    },
  };

  // Show the 5 most recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              timeRange === 'week'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              timeRange === 'month'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              timeRange === 'year'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.name}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <card.icon
                  className={`h-6 w-6 ${
                    card.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">{card.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                    <div
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {card.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Transactions</h3>
          <div className="mt-4">
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {recentTransactions.map((transaction, idx) => (
                  <li key={transaction.id}>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                            <CurrencyDollarIcon className="h-5 w-5 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              {transaction.description}{' '}
                              <span className="font-medium text-gray-900">${Math.abs(transaction.amount).toFixed(2)}</span>
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={transaction.date}>{new Date(transaction.date).toLocaleDateString()}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 