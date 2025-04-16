import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '../layout/ToastProvider';

const defaultGoals = [
  {
    id: 1,
    name: 'Emergency Fund',
    target: 10000,
    current: 7500,
    deadline: '2024-12-31',
    type: 'savings',
  },
  {
    id: 2,
    name: 'New Car',
    target: 25000,
    current: 15000,
    deadline: '2025-06-30',
    type: 'purchase',
  },
  {
    id: 3,
    name: 'Vacation Fund',
    target: 5000,
    current: 3000,
    deadline: '2024-08-31',
    type: 'savings',
  },
  {
    id: 4,
    name: 'Home Down Payment',
    target: 50000,
    current: 20000,
    deadline: '2026-12-31',
    type: 'savings',
  },
];

const goalTypes = [
  { value: 'savings', label: 'Savings Goal' },
  { value: 'purchase', label: 'Purchase Goal' },
  { value: 'debt', label: 'Debt Repayment' },
  { value: 'investment', label: 'Investment Goal' },
];

const sortOptions = [
  { value: 'deadline', label: 'Deadline (Soonest)' },
  { value: 'progress-desc', label: 'Progress (High to Low)' },
  { value: 'progress-asc', label: 'Progress (Low to High)' },
  { value: 'target-desc', label: 'Target (High to Low)' },
  { value: 'target-asc', label: 'Target (Low to High)' },
];

export default function Goals() {
  const [goals, setGoals] = useState(defaultGoals);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoalId, setEditGoalId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: goalTypes[0].value,
    target: '',
    current: '',
    deadline: '',
  });
  const [sortBy, setSortBy] = useState('deadline');
  const toast = useToast();

  // Load goals from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('goals');
    if (stored) setGoals(JSON.parse(stored));
  }, []);

  // Save goals to localStorage
  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    const handler = () => setShowAddGoal(true);
    window.addEventListener('open-add-goal', handler);
    return () => window.removeEventListener('open-add-goal', handler);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateProgress = (current: number, target: number) => {
    return (current / target) * 100;
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleAddGoal = () => {
    if (!form.name || !form.target || !form.current || !form.deadline) {
      toast.showToast('Please fill in all fields', 'error');
      return;
    }
    setGoals([
      ...goals,
      {
        id: Date.now(),
        name: form.name,
        type: form.type,
        target: parseFloat(form.target),
        current: parseFloat(form.current),
        deadline: form.deadline,
      },
    ]);
    setShowAddGoal(false);
    setForm({ name: '', type: goalTypes[0].value, target: '', current: '', deadline: '' });
    toast.showToast('Goal added!');
  };

  const handleEditGoal = () => {
    if (editGoalId === null) return;
    setGoals(
      goals.map((g) =>
        g.id === editGoalId
          ? {
              ...g,
              name: form.name,
              type: form.type,
              target: parseFloat(form.target),
              current: parseFloat(form.current),
              deadline: form.deadline,
            }
          : g
      )
    );
    setShowEditGoal(false);
    setEditGoalId(null);
    setForm({ name: '', type: goalTypes[0].value, target: '', current: '', deadline: '' });
    toast.showToast('Goal updated!');
  };

  const handleDeleteGoal = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    setGoals(goals.filter((g) => g.id !== id));
    toast.showToast('Goal deleted!');
  };

  const openEditModal = (goal: any) => {
    setEditGoalId(goal.id);
    setForm({
      name: goal.name,
      type: goal.type,
      target: goal.target.toString(),
      current: goal.current.toString(),
      deadline: goal.deadline,
    });
    setShowEditGoal(true);
  };

  let sortedGoals = [...goals].sort((a, b) => {
    if (sortBy === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (sortBy === 'progress-desc') return (b.current / b.target) - (a.current / a.target);
    if (sortBy === 'progress-asc') return (a.current / a.target) - (b.current / b.target);
    if (sortBy === 'target-desc') return b.target - a.target;
    if (sortBy === 'target-asc') return a.target - b.target;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Financial Goals</h1>
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
            onClick={() => setShowAddGoal(true)}
            className="btn-primary flex items-center"
            title="Add Goal"
            aria-label="Add Goal"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sortedGoals.map((goal) => {
          const progress = calculateProgress(goal.current, goal.target);
          const daysRemaining = getDaysRemaining(goal.deadline);
          const isOnTrack = daysRemaining > 0 && progress >= (daysRemaining / 365) * 100;

          return (
            <div key={goal.id} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{goal.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {goalTypes.find((t) => t.value === goal.type)?.label || goal.type}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-900" onClick={() => openEditModal(goal)} title="Edit Goal" aria-label="Edit Goal">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteGoal(goal.id)} title="Delete Goal" aria-label="Delete Goal">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium text-gray-900">
                    ${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${
                      isOnTrack ? 'bg-primary-600' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Target Date</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(goal.deadline)}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : 'Deadline passed'}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`font-medium ${
                      isOnTrack ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {isOnTrack ? 'On Track' : 'Needs Attention'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 z-10 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="add-goal-title">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 id="add-goal-title" className="text-lg font-medium leading-6 text-gray-900">
                    Add New Goal
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Goal Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="input-field mt-1"
                        placeholder="e.g., Emergency Fund"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Goal Type
                      </label>
                      <select
                        id="type"
                        className="input-field mt-1"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        {goalTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="target" className="block text-sm font-medium text-gray-700">
                        Target Amount
                      </label>
                      <input
                        type="number"
                        id="target"
                        className="input-field mt-1"
                        placeholder="0.00"
                        value={form.target}
                        onChange={(e) => setForm({ ...form, target: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="current" className="block text-sm font-medium text-gray-700">
                        Current Amount
                      </label>
                      <input
                        type="number"
                        id="current"
                        className="input-field mt-1"
                        placeholder="0.00"
                        value={form.current}
                        onChange={(e) => setForm({ ...form, current: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                        Target Date
                      </label>
                      <input
                        type="date"
                        id="deadline"
                        className="input-field mt-1"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  className="btn-primary sm:col-start-2"
                  onClick={handleAddGoal}
                >
                  Add Goal
                </button>
                <button
                  type="button"
                  className="btn-secondary mt-3 sm:col-start-1 sm:mt-0"
                  onClick={() => setShowAddGoal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEditGoal && (
        <div className="fixed inset-0 z-10 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="edit-goal-title">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 id="edit-goal-title" className="text-lg font-medium leading-6 text-gray-900">
                    Edit Goal
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name-edit" className="block text-sm font-medium text-gray-700">
                        Goal Name
                      </label>
                      <input
                        type="text"
                        id="name-edit"
                        className="input-field mt-1"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="type-edit" className="block text-sm font-medium text-gray-700">
                        Goal Type
                      </label>
                      <select
                        id="type-edit"
                        className="input-field mt-1"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        {goalTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="target-edit" className="block text-sm font-medium text-gray-700">
                        Target Amount
                      </label>
                      <input
                        type="number"
                        id="target-edit"
                        className="input-field mt-1"
                        value={form.target}
                        onChange={(e) => setForm({ ...form, target: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="current-edit" className="block text-sm font-medium text-gray-700">
                        Current Amount
                      </label>
                      <input
                        type="number"
                        id="current-edit"
                        className="input-field mt-1"
                        value={form.current}
                        onChange={(e) => setForm({ ...form, current: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="deadline-edit" className="block text-sm font-medium text-gray-700">
                        Target Date
                      </label>
                      <input
                        type="date"
                        id="deadline-edit"
                        className="input-field mt-1"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  className="btn-primary sm:col-start-2"
                  onClick={handleEditGoal}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-secondary mt-3 sm:col-start-1 sm:mt-0"
                  onClick={() => setShowEditGoal(false)}
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