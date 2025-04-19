import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { budgets } from '../services/api';
import BudgetPieChart from '../components/BudgetPieChart';

const monthNames = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BudgetForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    category: '',
    limit: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useMutation(budgets.createOrUpdate, {
    onSuccess: () => {
      queryClient.invalidateQueries('budgets');
      queryClient.invalidateQueries('budget-progress');
      setForm({ ...form, category: '', limit: '' });
      onSuccess?.();
    },
  });
  return (
    <form
      className="flex flex-col md:flex-row gap-4 items-end"
      onSubmit={e => {
        e.preventDefault();
        mutate({ ...form, limit: Number(form.limit) });
      }}
    >
      <input
        className="input"
        placeholder="Category"
        value={form.category}
        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        required
      />
      <input
        className="input"
        type="number"
        placeholder="Monthly Limit"
        value={form.limit}
        onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
        min={0}
        required
      />
      <select
        className="input"
        value={form.month}
        onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}
      >
        {monthNames.slice(1).map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
      <input
        className="input"
        type="number"
        value={form.year}
        onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
        min={2000}
        max={2100}
        required
      />
      <button className="btn btn-primary" type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};

const BudgetProgress = ({ month, year }) => {
  const { data, isLoading } = useQuery(
    ['budget-progress', month, year],
    () => budgets.getProgress({ month, year })
  );
  if (isLoading) return <div>Loading...</div>;
  if (!data?.length) return <div>No budgets set for this month.</div>;
  return (
    <div className="space-y-4 mt-6">
      {data.map(b => (
        <div key={b._id} className="card">
          <div className="flex justify-between mb-2">
            <span className="font-medium">{b.category}</span>
            <span>
              ${b.spent.toFixed(2)} / ${b.limit.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${b.spent > b.limit ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ width: `${Math.min(100, (b.spent / b.limit) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const Budgets = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: budgetsList, isLoading } = useQuery(
    ['budgets', month, year],
    () => budgets.getAll({ month, year })
  );
  const queryClient = useQueryClient();
  const { mutate: deleteBudget } = useMutation(budgets.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('budgets');
      queryClient.invalidateQueries('budget-progress');
    },
  });
  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Budgets</h2>
        <BudgetForm />
        <div className="mt-6">
          <label className="mr-2">Month:</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input w-auto inline-block">
            {monthNames.slice(1).map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
          <label className="ml-4 mr-2">Year:</label>
          <input
            type="number"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="input w-24 inline-block"
            min={2000}
            max={2100}
          />
        </div>
        {isLoading ? <div>Loading...</div> : (
          <>
            <ul className="mt-4 space-y-2">
              {budgetsList?.map(b => (
                <li key={b._id} className="flex justify-between items-center">
                  <span>{b.category} ({monthNames[b.month]} {b.year}): ${b.limit.toFixed(2)}</span>
                  <button className="btn btn-secondary" onClick={() => deleteBudget(b._id)}>Delete</button>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Budget Allocation</h3>
              <BudgetPieChart data={budgetsList} />
            </div>
          </>
        )}
      </div>
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Budget Progress</h2>
        <BudgetProgress month={month} year={year} />
      </div>
    </div>
  );
};

export default Budgets; 