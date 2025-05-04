import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { debts } from '../services/api';
import { auth } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
}

function ProgressBar({ value, max }) {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
      <div
        className={`h-3 rounded-full ${percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

const DebtForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || { name: '', amount: '', interestRate: '', dueDate: '', notes: '' });
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={e => {
        e.preventDefault();
        onSave({
          ...form,
          amount: Number(form.amount),
          interestRate: Number(form.interestRate),
        });
      }}
    >
      <input className="input" placeholder="Debt Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      <input className="input" type="number" placeholder="Amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min={0} required />
      <input className="input" type="number" placeholder="Interest Rate (%)" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} min={0} step={0.01} />
      <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
      <textarea className="input" placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      <div className="flex gap-2 mt-2">
        <button className="btn btn-primary" type="submit">Save</button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const PayForm = ({ max, onPay, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState('');
  const { data: accounts, isLoading: accountsLoading } = useQuery('accounts', auth.getAccounts);

  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    const selected = accounts?.find(a => a._id === accountId);
    if (!selected) {
      setError('Please select an account');
      return;
    }
    if (Number(amount) > selected.balance) {
      setError('Insufficient funds in selected account');
      return;
    }
    console.log('PayForm submit', { amount, accountId });
    onPay(Number(amount), accountId);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <input className="input" type="number" placeholder="Payment Amount" value={amount} onChange={e => setAmount(e.target.value)} min={1} max={max} required />
      <select className="input" value={accountId} onChange={e => setAccountId(e.target.value)} required>
        <option value="">Select account</option>
        {accounts && accounts.map(acc => (
          <option key={acc._id} value={acc._id}>{acc.type} - {acc.balance.toFixed(2)}</option>
        ))}
      </select>
      {error && <div className="text-red-600 text-xs">{error}</div>}
      <div className="flex gap-2 mt-2">
        <button className="btn btn-primary" type="submit" disabled={accountsLoading}>Pay</button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const DebtCard = ({ debt, onEdit, onDelete, onPay }) => {
  const remaining = Math.max(0, debt.amount - debt.paidAmount);
  const overdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'paid';
  return (
    <div className={`w-80 p-5 rounded-xl shadow-lg bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col gap-3 border border-gray-200 dark:border-gray-700 transition-all duration-200 ${overdue ? 'border-red-500' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-lg text-red-700 dark:text-red-300 truncate">{debt.name}</span>
        <span className={`text-xs font-mono ${debt.status === 'paid' ? 'text-green-600' : overdue ? 'text-red-600' : 'text-gray-500'}`}>{debt.status === 'paid' ? 'Paid' : overdue ? 'Overdue' : 'Active'}</span>
      </div>
      <ProgressBar value={debt.paidAmount} max={debt.amount} />
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
        <span>Owed: <span className="font-semibold">{debt.amount.toFixed(2)}</span></span>
        <span>Paid: <span className="font-semibold">{debt.paidAmount.toFixed(2)}</span></span>
      </div>
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
        <span>Interest: <span className="font-semibold">{debt.interestRate || 0}%</span></span>
        <span>Due: <span className={`font-semibold ${overdue ? 'text-red-600' : ''}`}>{formatDate(debt.dueDate)}</span></span>
      </div>
      {debt.notes && <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{debt.notes}</div>}
      <div className="flex gap-2 items-center mt-auto">
        {debt.status !== 'paid' && (
          <button className="btn btn-xs btn-success flex items-center gap-1" onClick={onPay}><CurrencyDollarIcon className="h-4 w-4" />Pay</button>
        )}
        <button className="btn btn-xs btn-secondary flex items-center gap-1" onClick={onEdit}><PencilIcon className="h-4 w-4" />Edit</button>
        <button className="btn btn-xs btn-danger flex items-center gap-1 ml-auto" onClick={onDelete}><TrashIcon className="h-4 w-4" />Delete</button>
      </div>
    </div>
  );
};

const Debts = () => {
  const queryClient = useQueryClient();
  const { data: debtsList, isLoading } = useQuery('debts', debts.getAll);
  const { mutate: createDebt } = useMutation(debts.create, {
    onSuccess: () => queryClient.invalidateQueries('debts'),
  });
  const { mutate: updateDebt } = useMutation((args) => debts.update(args.id, args.data), {
    onSuccess: () => queryClient.invalidateQueries('debts'),
  });
  const { mutate: deleteDebt } = useMutation(debts.delete, {
    onSuccess: () => queryClient.invalidateQueries('debts'),
  });
  const { mutate: payDebt } = useMutation(
    ({ id, amount, accountId }) => debts.pay(id, amount, accountId),
    {
      onSuccess: () => queryClient.invalidateQueries('debts'),
    }
  );

  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState(null);
  const [payDebtId, setPayDebtId] = useState(null);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">My Debts</h2>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => { setEditDebt(null); setShowForm(true); }}><PlusIcon className="h-5 w-5" />Add Debt</button>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md">
            <DebtForm
              initial={editDebt}
              onSave={data => {
                if (editDebt) {
                  updateDebt({ id: editDebt._id, data });
                } else {
                  createDebt(data);
                }
                setShowForm(false);
                setEditDebt(null);
              }}
              onCancel={() => { setShowForm(false); setEditDebt(null); }}
            />
          </div>
        </div>
      )}
      {payDebtId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md">
            <PayForm
              max={Math.max(0, debtsList.find(d => d._id === payDebtId)?.amount - debtsList.find(d => d._id === payDebtId)?.paidAmount)}
              onPay={(amount, accountId) => {
                payDebt({ id: payDebtId, amount, accountId });
                setPayDebtId(null);
              }}
              onCancel={() => setPayDebtId(null)}
            />
          </div>
        </div>
      )}
      {(!debtsList || debtsList.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <span className="text-5xl mb-4">💸</span>
          <span className="text-lg">You have no debts. Add your first debt to start tracking!</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {debtsList.map(debt => (
            <DebtCard
              key={debt._id}
              debt={debt}
              onEdit={() => { setEditDebt(debt); setShowForm(true); }}
              onDelete={() => { if (window.confirm('Delete this debt?')) deleteDebt(debt._id); }}
              onPay={() => setPayDebtId(debt._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Debts; 