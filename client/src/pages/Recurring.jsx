import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { recurring } from '../services/api';

const frequencies = ['daily', 'weekly', 'monthly', 'yearly'];

const RecurringForm = ({ onSuccess, initial }) => {
  const [form, setForm] = useState(
    initial || {
      amount: '',
      type: 'expense',
      category: '',
      note: '',
      frequency: 'monthly',
      startDate: '',
      endDate: '',
    }
  );
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useMutation(
    initial ? (data) => recurring.update(initial._id, data) : recurring.create,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('recurring');
        setForm({ amount: '', type: 'expense', category: '', note: '', frequency: 'monthly', startDate: '', endDate: '' });
        onSuccess?.();
      },
    }
  );
  return (
    <form
      className="flex flex-col md:flex-row gap-4 items-end"
      onSubmit={e => {
        e.preventDefault();
        mutate({ ...form, amount: Number(form.amount) });
      }}
    >
      <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
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
        placeholder="Amount"
        value={form.amount}
        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
        min={0}
        required
      />
      <input
        className="input"
        placeholder="Note"
        value={form.note}
        onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
      />
      <select className="input" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
        {frequencies.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
      </select>
      <input
        className="input"
        type="date"
        value={form.startDate}
        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
        required
      />
      <input
        className="input"
        type="date"
        value={form.endDate}
        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
      />
      <button className="btn btn-primary" type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : (initial ? 'Update' : 'Add')}
      </button>
    </form>
  );
};

const RecurringList = () => {
  const { data, isLoading } = useQuery('recurring', recurring.getAll);
  const queryClient = useQueryClient();
  const { mutate: deleteRec } = useMutation(recurring.delete, {
    onSuccess: () => queryClient.invalidateQueries('recurring'),
  });
  const [editId, setEditId] = useState(null);
  if (isLoading) return <div>Loading...</div>;
  if (!data?.length) return <div>No recurring transactions.</div>;
  return (
    <ul className="space-y-4 mt-6">
      {data.map(r => (
        <li key={r._id} className="card">
          {editId === r._id ? (
            <RecurringForm initial={r} onSuccess={() => setEditId(null)} />
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <span className="font-medium">{r.category}</span> —
                <span className="ml-1">{r.type}</span> —
                <span className="ml-1">${r.amount.toFixed(2)}</span> —
                <span className="ml-1">{r.frequency}</span>
                <span className="ml-1 text-xs text-gray-500">(Next: {r.nextOccurrence?.slice(0, 10)})</span>
                {r.endDate && <span className="ml-1 text-xs text-gray-400">(Ends: {r.endDate.slice(0, 10)})</span>}
                {r.note && <span className="ml-2 text-xs text-gray-400">{r.note}</span>}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={() => setEditId(r._id)}>Edit</button>
                <button className="btn btn-secondary" onClick={() => deleteRec(r._id)}>Delete</button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

const Recurring = () => (
  <div className="space-y-8">
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Recurring Transactions</h2>
      <RecurringForm />
      <RecurringList />
    </div>
  </div>
);

export default Recurring; 