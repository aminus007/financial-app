import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { goals, auth } from '../services/api';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuth, getPreferredCurrency } from '../contexts/AuthContext';

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

const GoalForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: '', targetAmount: '', deadline: '' });
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useMutation(goals.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('goals');
      setForm({ name: '', targetAmount: '', deadline: '' });
      onSuccess?.();
    },
  });
  return (
    <form
      className="flex flex-col md:flex-row gap-4 items-end"
      onSubmit={e => {
        e.preventDefault();
        mutate({ ...form, targetAmount: Number(form.targetAmount) });
      }}
    >
      <input
        className="input"
        placeholder="Goal Name"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        required
      />
      <input
        className="input"
        type="number"
        placeholder="Target Amount"
        value={form.targetAmount}
        onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
        min={0}
        required
      />
      <input
        className="input"
        type="date"
        value={form.deadline}
        onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
      />
      <button className="btn btn-primary" type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};

const GoalList = () => {
  const { data: goalsList, isLoading } = useQuery('goals', goals.getAll);
  const { data: accounts, isLoading: accountsLoading } = useQuery('accounts', auth.getAccounts);
  const { user: authUser } = useAuth();
  const currency = getPreferredCurrency(authUser);
  const savingsAccount = accounts?.find(acc => acc.type === 'savings');
  const savingsBalance = savingsAccount?.balance || 0;
  const queryClient = useQueryClient();
  const { mutate: deleteGoal } = useMutation(goals.delete, {
    onSuccess: () => queryClient.invalidateQueries('goals'),
  });
  const { mutate: addFunds } = useMutation(({ id, amount }) => goals.addFunds(id, amount), {
    onSuccess: () => queryClient.invalidateQueries('goals'),
  });
  const [addAmount, setAddAmount] = useState({});

  // Allocate savings to goals in order
  let remaining = savingsBalance;
  const allocations = (goalsList || []).map(g => {
    const needed = Math.max(0, g.targetAmount - g.currentAmount);
    const allocated = Math.min(needed, remaining);
    remaining -= allocated;
    return { goalId: g._id, allocated };
  });

  if (isLoading || accountsLoading) return <div>Loading...</div>;
  if (!goalsList?.length) return <div>No goals yet.</div>;
  return (
    <>
      <div className="mb-2 text-sm text-blue-700 dark:text-blue-300 font-medium">
        Savings account balance: <span className="font-bold">{formatCurrency(savingsBalance.toFixed(2), currency)}</span>
      </div>
      <div className="flex gap-4 mt-6 overflow-x-auto">
        {goalsList.map((g, idx) => {
          const allocation = allocations.find(a => a.goalId === g._id)?.allocated || 0;
          const progress = Math.min(100, ((g.currentAmount + allocation) / g.targetAmount) * 100);
          return (
            <div
              key={g._id}
              className={`w-72 p-5 rounded-xl shadow-lg bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col gap-3 border border-gray-200 dark:border-gray-700 transition-all duration-200`}
            >
              {/* Title */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-lg text-primary-700 dark:text-primary-300 truncate">{g.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">#{idx + 1}</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-1">
                <div
                  className="h-3 rounded-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
                <span>Current: <span className="font-semibold">{formatCurrency((g.currentAmount + allocation).toFixed(2), currency)}</span></span>
                <span>Target: <span className="font-semibold">{formatCurrency(g.targetAmount.toFixed(2), currency)}</span></span>
              </div>
              {/* Deadline */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Deadline: {g.deadline ? new Date(g.deadline).toLocaleDateString() : <span className="italic">No deadline</span>}
              </div>
              {/* Funded from savings */}
              <div className="text-xs text-green-700 dark:text-green-300 mb-2">
                Funded from savings: <span className="font-bold">{formatCurrency(allocation.toFixed(2), currency)}</span>
              </div>
              {/* Actions */}
              <div className="flex gap-2 items-center mb-2">
                <input
                  className="input w-20 h-8 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                  type="number"
                  min={1}
                  placeholder="Add funds"
                  value={addAmount[g._id] || ''}
                  onChange={e => setAddAmount(a => ({ ...a, [g._id]: e.target.value }))}
                />
                <button
                  className="btn btn-primary flex items-center justify-center h-8 w-8 p-0"
                  onClick={() => {
                    if (addAmount[g._id] > 0) {
                      addFunds({ id: g._id, amount: Number(addAmount[g._id]) });
                      setAddAmount(a => ({ ...a, [g._id]: '' }));
                    }
                  }}
                  title="Add funds"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
                <button className="btn btn-secondary flex items-center justify-center h-8 w-8 p-0 ml-auto" onClick={() => deleteGoal(g._id)} title="Delete goal">
                  <TrashIcon className="h-5 w-5 text-red-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Goals = () => (
  <div className="space-y-8">
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Savings Goals</h2>
      <GoalForm />
      <GoalList />
    </div>
  </div>
);

export default Goals; 