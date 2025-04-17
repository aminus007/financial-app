import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { goals } from '../services/api';

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
  const queryClient = useQueryClient();
  const { mutate: deleteGoal } = useMutation(goals.delete, {
    onSuccess: () => queryClient.invalidateQueries('goals'),
  });
  const { mutate: addFunds } = useMutation(({ id, amount }) => goals.addFunds(id, amount), {
    onSuccess: () => queryClient.invalidateQueries('goals'),
  });
  const [addAmount, setAddAmount] = useState({});
  if (isLoading) return <div>Loading...</div>;
  if (!goalsList?.length) return <div>No goals yet.</div>;
  return (
    <div className="space-y-6 mt-6">
      {goalsList.map(g => {
        const progress = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
        return (
          <div key={g._id} className="card">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{g.name}</span>
              <span>
                ${g.currentAmount.toFixed(2)} / ${g.targetAmount.toFixed(2)}
                {g.deadline && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(by {g.deadline.slice(0, 10)})</span>
                )}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div
                className="h-3 rounded-full bg-primary-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-2 items-center">
              <input
                className="input w-32"
                type="number"
                min={1}
                placeholder="Add funds"
                value={addAmount[g._id] || ''}
                onChange={e => setAddAmount(a => ({ ...a, [g._id]: e.target.value }))}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (addAmount[g._id] > 0) {
                    addFunds({ id: g._id, amount: Number(addAmount[g._id]) });
                    setAddAmount(a => ({ ...a, [g._id]: '' }));
                  }
                }}
              >
                Add
              </button>
              <button className="btn btn-secondary ml-auto" onClick={() => deleteGoal(g._id)}>
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
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