import { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../layout/ToastProvider';

const initialTransactions = [
  {
    id: 1,
    date: '2024-01-01',
    description: 'Grocery Shopping',
    category: 'Food & Dining',
    amount: -123.45,
    type: 'expense',
  },
  {
    id: 2,
    date: '2024-01-02',
    description: 'Salary',
    category: 'Income',
    amount: 4000.0,
    type: 'income',
  },
  {
    id: 3,
    date: '2024-01-03',
    description: 'Netflix Subscription',
    category: 'Entertainment',
    amount: -15.99,
    type: 'expense',
  },
  {
    id: 4,
    date: '2024-01-04',
    description: 'Electric Bill',
    category: 'Utilities',
    amount: -85.0,
    type: 'expense',
  },
  {
    id: 5,
    date: '2024-01-05',
    description: 'Freelance Work',
    category: 'Income',
    amount: 500.0,
    type: 'income',
  },
];

const categories = [
  'All Categories',
  'Food & Dining',
  'Income',
  'Entertainment',
  'Utilities',
  'Transportation',
  'Shopping',
  'Healthcare',
];

const sortOptions = [
  { value: 'date-desc', label: 'Date (Newest)' },
  { value: 'date-asc', label: 'Date (Oldest)' },
  { value: 'amount-desc', label: 'Amount (High to Low)' },
  { value: 'amount-asc', label: 'Amount (Low to High)' },
  { value: 'type', label: 'Type (Income/Expense)' },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: '',
    description: '',
    category: 'Food & Dining',
    amount: '',
    type: 'expense',
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const toast = useToast();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All Categories' || transaction.category === selectedCategory;
    const matchesDateFrom = !dateFrom || new Date(transaction.date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(transaction.date) <= new Date(dateTo);
    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  // Sorting
  let sortedTransactions = filteredTransactions.sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount-desc') return Math.abs(b.amount) - Math.abs(a.amount);
    if (sortBy === 'amount-asc') return Math.abs(a.amount) - Math.abs(b.amount);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return 0;
  });

  const handleAddTransaction = () => {
    if (!newTransaction.date || !newTransaction.description || !newTransaction.amount) {
      toast.showToast('Please fill in all fields', 'error');
      return;
    }
    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        ...newTransaction,
        amount: parseFloat(newTransaction.amount) * (newTransaction.type === 'expense' ? -1 : 1),
      },
    ]);
    setShowAddModal(false);
    setNewTransaction({
      date: '',
      description: '',
      category: 'Food & Dining',
      amount: '',
      type: 'expense',
    });
    toast.showToast('Transaction added!');
  };

  const handleDeleteTransaction = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setTransactions(transactions.filter((t) => t.id !== id));
    toast.showToast('Transaction deleted!');
  };

  useEffect(() => {
    const handler = () => setShowAddModal(true);
    window.addEventListener('open-add-transaction', handler);
    return () => window.removeEventListener('open-add-transaction', handler);
  }, []);

  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => firstInputRef.current?.focus(), 0);
      const trap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        const modal = document.getElementById('add-transaction-modal');
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'input, select, button, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener('keydown', trap);
      return () => {
        window.removeEventListener('keydown', trap);
        addButtonRef.current?.focus();
      };
    }
  }, [showAddModal]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
        <button ref={addButtonRef} className="btn-primary flex items-center" onClick={() => setShowAddModal(true)} title="Add Transaction" aria-label="Add Transaction">
          <PlusIcon className="mr-2 h-5 w-5" />
          Add Transaction
        </button>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
            placeholder="Search transactions..."
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input-field"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="mr-2 h-5 w-5" />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700">
                Date From
              </label>
              <input
                type="date"
                id="date-from"
                className="input-field mt-1"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700">
                Date To
              </label>
              <input
                type="date"
                id="date-to"
                className="input-field mt-1"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="amount-range" className="block text-sm font-medium text-gray-700">
                Amount Range
              </label>
              <select id="amount-range" className="input-field mt-1">
                <option>Any Amount</option>
                <option>Less than $100</option>
                <option>$100 - $500</option>
                <option>$500 - $1000</option>
                <option>More than $1000</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Amount
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {transaction.category}
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}$
                  {Math.abs(transaction.amount).toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900" /* onClick={...} */ title="Edit Transaction" aria-label="Edit Transaction">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="ml-4 text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    title="Delete Transaction"
                    aria-label="Delete Transaction"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div id="add-transaction-modal" className="fixed inset-0 z-10 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="add-transaction-title">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 id="add-transaction-title" className="text-lg font-medium leading-6 text-gray-900">
                    Add Transaction
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        ref={firstInputRef}
                        type="date"
                        id="date"
                        className="input-field mt-1"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <input
                        type="text"
                        id="description"
                        className="input-field mt-1"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                        placeholder="e.g., Grocery Shopping"
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        id="category"
                        className="input-field mt-1"
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      >
                        {categories.filter((c) => c !== 'All Categories').map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        id="type"
                        className="input-field mt-1"
                        value={newTransaction.type}
                        onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <input
                        type="number"
                        id="amount"
                        className="input-field mt-1"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  className="btn-primary sm:col-start-2"
                  onClick={handleAddTransaction}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="btn-secondary mt-3 sm:col-start-1 sm:mt-0"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 