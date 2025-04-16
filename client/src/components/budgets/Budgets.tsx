import { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useToast } from '../layout/ToastProvider';

ChartJS.register(ArcElement, Tooltip, Legend);

const defaultBudgets = [
  {
    id: 1,
    category: 'Food & Dining',
    budget: 500,
    spent: 375,
    color: '#3B82F6',
  },
  {
    id: 2,
    category: 'Transportation',
    budget: 300,
    spent: 250,
    color: '#10B981',
  },
  {
    id: 3,
    category: 'Entertainment',
    budget: 200,
    spent: 150,
    color: '#F59E0B',
  },
  {
    id: 4,
    category: 'Utilities',
    budget: 400,
    spent: 350,
    color: '#8B5CF6',
  },
  {
    id: 5,
    category: 'Shopping',
    budget: 300,
    spent: 400,
    color: '#EC4899',
  },
];

const categoryOptions = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Shopping',
];

const sortOptions = [
  { value: 'category', label: 'Category' },
  { value: 'budget-desc', label: 'Budget (High to Low)' },
  { value: 'budget-asc', label: 'Budget (Low to High)' },
  { value: 'spent-desc', label: 'Spent (High to Low)' },
  { value: 'spent-asc', label: 'Spent (Low to High)' },
];

export default function Budgets() {
  const [budgets, setBudgets] = useState(defaultBudgets);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState<number | null>(null);
  const [form, setForm] = useState({
    category: categoryOptions[0],
    budget: '',
    spent: '',
    color: '#3B82F6',
  });
  const [sortBy, setSortBy] = useState('category');
  const toast = useToast();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const firstAddInputRef = useRef<HTMLInputElement>(null);
  const firstEditInputRef = useRef<HTMLInputElement>(null);

  // Load budgets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('budgets');
    if (stored) setBudgets(JSON.parse(stored));
  }, []);

  // Save budgets to localStorage
  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    const handler = () => setShowAddBudget(true);
    window.addEventListener('open-add-budget', handler);
    return () => window.removeEventListener('open-add-budget', handler);
  }, []);

  useEffect(() => {
    if (showAddBudget) {
      setTimeout(() => firstAddInputRef.current?.focus(), 0);
      const trap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        const modal = document.getElementById('add-budget-modal');
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
  }, [showAddBudget]);

  useEffect(() => {
    if (showEditBudget) {
      setTimeout(() => firstEditInputRef.current?.focus(), 0);
      const trap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        const modal = document.getElementById('edit-budget-modal');
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
  }, [showEditBudget]);

  let sortedBudgets = [...budgets].sort((a, b) => {
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    if (sortBy === 'budget-desc') return b.budget - a.budget;
    if (sortBy === 'budget-asc') return a.budget - b.budget;
    if (sortBy === 'spent-desc') return b.spent - a.spent;
    if (sortBy === 'spent-asc') return a.spent - b.spent;
    return 0;
  });

  const chartData = {
    labels: budgets.map((budget) => budget.category),
    datasets: [
      {
        data: budgets.map((budget) => budget.spent),
        backgroundColor: budgets.map((budget) => budget.color),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const handleAddBudget = () => {
    if (!form.category || !form.budget || !form.spent) {
      toast.showToast('Please fill in all fields', 'error');
      return;
    }
    setBudgets([
      ...budgets,
      {
        id: Date.now(),
        category: form.category,
        budget: parseFloat(form.budget),
        spent: parseFloat(form.spent),
        color: form.color,
      },
    ]);
    setShowAddBudget(false);
    setForm({ category: categoryOptions[0], budget: '', spent: '', color: '#3B82F6' });
    toast.showToast('Budget added!');
  };

  const handleEditBudget = () => {
    if (editBudgetId === null) return;
    setBudgets(
      budgets.map((b) =>
        b.id === editBudgetId
          ? {
              ...b,
              category: form.category,
              budget: parseFloat(form.budget),
              spent: parseFloat(form.spent),
              color: form.color,
            }
          : b
      )
    );
    setShowEditBudget(false);
    setEditBudgetId(null);
    setForm({ category: categoryOptions[0], budget: '', spent: '', color: '#3B82F6' });
    toast.showToast('Budget updated!');
  };

  const handleDeleteBudget = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    setBudgets(budgets.filter((b) => b.id !== id));
    toast.showToast('Budget deleted!');
  };

  const openEditModal = (budget: any) => {
    setEditBudgetId(budget.id);
    setForm({
      category: budget.category,
      budget: budget.budget.toString(),
      spent: budget.spent.toString(),
      color: budget.color,
    });
    setShowEditBudget(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Budgets</h1>
        <div className="flex space-x-2">
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
            ref={addButtonRef}
            onClick={() => setShowAddBudget(true)}
            className="btn-primary flex items-center"
            title="Add Budget"
            aria-label="Add Budget"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Budget
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Budget Overview</h3>
          <div className="mt-4 h-64">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="space-y-6">
          {sortedBudgets.map((budget) => {
            const percentage = (budget.spent / budget.budget) * 100;
            const isOverBudget = budget.spent > budget.budget;

            return (
              <div key={budget.id} className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{budget.category}</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      ${budget.spent.toFixed(2)} of ${budget.budget.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-primary-600 hover:text-primary-900" onClick={() => openEditModal(budget)} title="Edit Budget" aria-label="Edit Budget">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteBudget(budget.id)} title="Delete Budget" aria-label="Delete Budget">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span
                      className={`font-medium ${
                        isOverBudget ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${
                        isOverBudget ? 'bg-red-500' : 'bg-primary-600'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Budget Modal */}
      {showAddBudget && (
        <div id="add-budget-modal" className="fixed inset-0 z-10 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="add-budget-title">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 id="add-budget-title" className="text-lg font-medium leading-6 text-gray-900">
                    Add New Budget
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        id="category"
                        className="input-field mt-1"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Budget Amount
                      </label>
                      <input
                        ref={firstAddInputRef}
                        type="number"
                        id="amount"
                        className="input-field mt-1"
                        placeholder="0.00"
                        value={form.budget}
                        onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="spent" className="block text-sm font-medium text-gray-700">
                        Amount Spent
                      </label>
                      <input
                        type="number"
                        id="spent"
                        className="input-field mt-1"
                        placeholder="0.00"
                        value={form.spent}
                        onChange={(e) => setForm({ ...form, spent: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                        Color
                      </label>
                      <input
                        type="color"
                        id="color"
                        className="input-field mt-1"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  className="btn-primary sm:col-start-2"
                  onClick={handleAddBudget}
                >
                  Add Budget
                </button>
                <button
                  type="button"
                  className="btn-secondary mt-3 sm:col-start-1 sm:mt-0"
                  onClick={() => setShowAddBudget(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {showEditBudget && (
        <div id="edit-budget-modal" className="fixed inset-0 z-10 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="edit-budget-title">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 id="edit-budget-title" className="text-lg font-medium leading-6 text-gray-900">
                    Edit Budget
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="category-edit" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        id="category-edit"
                        className="input-field mt-1"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="amount-edit" className="block text-sm font-medium text-gray-700">
                        Budget Amount
                      </label>
                      <input
                        ref={firstEditInputRef}
                        type="number"
                        id="amount-edit"
                        className="input-field mt-1"
                        placeholder="0.00"
                        value={form.budget}
                        onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="spent-edit" className="block text-sm font-medium text-gray-700">
                        Amount Spent
                      </label>
                      <input
                        type="number"
                        id="spent-edit"
                        className="input-field mt-1"
                        placeholder="0.00"
                        value={form.spent}
                        onChange={(e) => setForm({ ...form, spent: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="color-edit" className="block text-sm font-medium text-gray-700">
                        Color
                      </label>
                      <input
                        type="color"
                        id="color-edit"
                        className="input-field mt-1"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  className="btn-primary sm:col-start-2"
                  onClick={handleEditBudget}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-secondary mt-3 sm:col-start-1 sm:mt-0"
                  onClick={() => setShowEditBudget(false)}
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