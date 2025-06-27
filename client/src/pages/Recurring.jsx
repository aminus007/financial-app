import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { recurring } from '../services/api';
import useRecurringStore from '../store/useRecurringStore';
import { Play, CheckCircle, AlertCircle } from 'lucide-react';

const frequencies = ['daily', 'weekly', 'monthly', 'yearly'];

const RecurringForm = ({ onSuccess, initial }) => {
  const [form, setForm] = useState(
    initial || {
      name: '',
      amount: '',
      type: 'expense',
      category: '',
      note: '',
      frequency: 'monthly',
      startDate: '',
    }
  );
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useMutation(
    initial ? (data) => recurring.update(initial._id, data) : recurring.create,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('recurring');
        setForm({ name: '', amount: '', type: 'expense', category: '', note: '', frequency: 'monthly', startDate: '' });
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
      <input
        className="input"
        placeholder="Name"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        required
      />
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
  const [processingStatus, setProcessingStatus] = useState(null);

  // Process recurring transactions
  const { mutate: processRecurring, isLoading: processing } = useMutation(
    () => recurring.process(),
    {
      onSuccess: (data) => {
        setProcessingStatus({
          type: 'success',
          message: data.message,
          processed: data.results.processed,
          errors: data.results.errors
        });
        // Refresh the recurring transactions list
        queryClient.invalidateQueries('recurring');
        // Also refresh transactions since new ones were created
        queryClient.invalidateQueries('transactions');
        // Clear status after 5 seconds
        setTimeout(() => setProcessingStatus(null), 5000);
      },
      onError: (error) => {
        setProcessingStatus({
          type: 'error',
          message: error.message || 'Failed to process recurring transactions'
        });
        setTimeout(() => setProcessingStatus(null), 5000);
      }
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (!data?.length) return <div>No recurring transactions.</div>;
  return (
    <div>
      {/* Processing Status */}
      {processingStatus && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          processingStatus.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200'
        }`}>
          {processingStatus.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <div>
            <div className="font-medium">{processingStatus.message}</div>
            {processingStatus.processed !== undefined && (
              <div className="text-sm">
                Processed: {processingStatus.processed}, Errors: {processingStatus.errors}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Process Button */}
      <div className="mb-4">
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => processRecurring()}
          disabled={processing}
        >
          <Play size={16} />
          {processing ? 'Processing...' : 'Process Due Transactions'}
        </button>
      </div>

      <ul className="space-y-4 mt-6">
        {data.map(r => (
          <li key={r._id} className="card">
            {editId === r._id ? (
              <RecurringForm initial={r} onSuccess={() => setEditId(null)} />
            ) : (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <span className="font-medium">{r.name}</span> —
                  <span className="font-medium">{r.category}</span> —
                  <span className="ml-1">{r.type}</span> —
                  <span className="ml-1">${r.amount.toFixed(2)}</span> —
                  <span className="ml-1">{r.frequency}</span>
                  <span className="ml-1 text-xs text-gray-500">(Next: {r.nextOccurrence?.slice(0, 10)})</span>
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
    </div>
  );
};

const Recurring = () => {
  const {
    recurring,
    loading,
    error,
    fetchRecurring,
    addRecurring,
    updateRecurring,
    deleteRecurring,
  } = useRecurringStore();

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  // Auto-process recurring transactions when page loads
  useEffect(() => {
    const autoProcess = async () => {
      try {
        await recurring.process();
      } catch (error) {
        console.log('Auto-processing recurring transactions failed:', error.message);
      }
    };
    
    // Process after a short delay to ensure page is loaded
    const timer = setTimeout(autoProcess, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Recurring Transactions</h2>
        <RecurringForm />
        <RecurringList />
      </div>
    </div>
  );
};

export default Recurring; 