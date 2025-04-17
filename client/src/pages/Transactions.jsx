import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { transactions as transactionsApi } from '../services/api';

const TRANSACTION_CATEGORIES = {
  income: [
    'Salary',
    'Freelance',
    'Investments',
    'Other Income',
  ],
  expense: [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Health & Fitness',
    'Travel',
    'Other Expenses',
  ],
};

const TransactionForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation(
    (data) => transactionsApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('transactions');
        setFormData({
          type: 'expense',
          amount: '',
          category: '',
          note: '',
          date: format(new Date(), 'yyyy-MM-dd'),
        });
        onSuccess?.();
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({
      ...formData,
      amount: Number(formData.amount),
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="input mt-1"
            required
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="input mt-1"
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input mt-1"
            required
          >
            <option value="">Select a category</option>
            {TRANSACTION_CATEGORIES[formData.type].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="input mt-1"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Note
        </label>
        <input
          type="text"
          name="note"
          value={formData.note}
          onChange={handleChange}
          className="input mt-1"
          placeholder="Add a note"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full"
      >
        {isLoading ? 'Adding...' : 'Add Transaction'}
      </button>
    </form>
  );
};

const TransactionList = () => {
  const [filters, setFilters] = useState({
    type: '',
    category: '',
  });

  const { data: transactions, isLoading } = useQuery(
    ['transactions', filters],
    () => transactionsApi.getAll(filters)
  );

  const queryClient = useQueryClient();
  const { mutate: deleteTransaction } = useMutation(
    (id) => transactionsApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('transactions');
      },
    }
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          className="input"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="input"
        >
          <option value="">All Categories</option>
          {TRANSACTION_CATEGORIES.income.concat(TRANSACTION_CATEGORIES.expense).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Note
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions?.map((transaction) => (
              <tr key={transaction._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {transaction.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {transaction.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  ${transaction.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {transaction.note}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => deleteTransaction(transaction._id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Transactions = () => {
  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Add Transaction
        </h2>
        <TransactionForm />
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Transaction History
        </h2>
        <TransactionList />
      </div>
    </div>
  );
};

export default Transactions; 