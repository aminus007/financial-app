import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { admin } from '../services/api';
import Modal from '../components/Modal';
import useAuthStore from '../store/useAuthStore';
import { Key, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';

const TransactionEditForm = ({ transaction, accounts, onSave, onCancel }) => {
  const [form, setForm] = React.useState({ ...transaction });
  const [error, setError] = React.useState('');
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleSubmit = e => {
    e.preventDefault();
    if (form.type === 'expense' && !form.source) {
      setError('Source is required for expenses');
      return;
    }
    onSave(form);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="input" required>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input name="amount" type="number" value={form.amount} onChange={handleChange} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <input name="category" value={form.category} onChange={handleChange} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input name="date" type="date" value={form.date?.slice(0,10)} onChange={handleChange} className="input" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Note</label>
          <input name="note" value={form.note || ''} onChange={handleChange} className="input" />
        </div>
        {form.type === 'expense' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Source</label>
            <select name="source" value={form.source} onChange={handleChange} className="input" required>
              <option value="">Select source</option>
              <option value="cash">Cash</option>
              {(accounts || []).map(acc => (
                <option key={acc._id} value={acc._id}>{acc.type} ({acc.balance})</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save</button>
      </div>
    </form>
  );
};

const Admin = () => {
  const user = useAuthStore((state) => state.user);
  console.log('Admin page user:', user);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTx, setEditTx] = useState(null);
  const [resetPasswordModal, setResetPasswordModal] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Fetch all admin data
  useEffect(() => {
    if (!user?.isAdmin) return;
    setLoading(true);
    setError('');
    Promise.all([
      admin.getUsers(),
      admin.getTransactions(),
      admin.getBudgets(),
      admin.getGoals(),
      admin.getRecurring(),
      admin.getAccounts(),
    ])
      .then(([users, transactions, budgets, goals, recurring, accounts]) => {
        setUsers(users);
        setTransactions(transactions);
        setBudgets(budgets);
        setGoals(goals);
        setRecurring(recurring);
        setAccounts(accounts);
      })
      .catch((err) => setError(err.message || 'Failed to load admin data'))
      .finally(() => setLoading(false));
  }, [user]);

  // Helper: get savings account balance for a user
  const getSavingsBalance = (userId) => {
    const acc = accounts.find(a => a.user?._id === userId && a.type === 'savings');
    return acc ? acc.balance : 0;
  };

  // Helper: calculate allocations for a user's goals
  const getAllocations = (userId, userGoals) => {
    let remaining = getSavingsBalance(userId);
    return userGoals.map(g => {
      const needed = Math.max(0, g.targetAmount - g.currentAmount);
      const allocated = Math.min(needed, remaining);
      remaining -= allocated;
      return { goalId: g._id, allocated };
    });
  };

  // User actions
  const handlePromote = async (id, isAdmin) => {
    try {
      await admin.updateUser(id, { isAdmin: !isAdmin });
      setUsers((prev) => prev.map(u => u._id === id ? { ...u, isAdmin: !isAdmin } : u));
    } catch (err) {
      alert('Failed to update user');
    }
  };
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await admin.deleteUser(id);
      setUsers((prev) => prev.filter(u => u._id !== id));
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  // Generic delete handlers
  const handleDelete = async (type, id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'transaction') {
        await admin.deleteTransaction(id);
        setTransactions((prev) => prev.filter(t => t._id !== id));
      } else if (type === 'budget') {
        await admin.deleteBudget(id);
        setBudgets((prev) => prev.filter(b => b._id !== id));
      } else if (type === 'goal') {
        await admin.deleteGoal(id);
        setGoals((prev) => prev.filter(g => g._id !== id));
      } else if (type === 'recurring') {
        await admin.deleteRecurring(id);
        setRecurring((prev) => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  // Password reset handlers
  const handleGeneratePassword = async () => {
    try {
      const { password } = await admin.generatePassword();
      setGeneratedPassword(password);
      setUseCustomPassword(false);
    } catch (err) {
      alert('Failed to generate password');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordModal) return;
    
    const passwordToUse = useCustomPassword ? customPassword : generatedPassword;
    if (!passwordToUse) {
      alert('Please generate a password or enter a custom one');
      return;
    }

    setResettingPassword(true);
    try {
      const result = await admin.resetUserPassword(resetPasswordModal._id, passwordToUse);
      alert(`Password reset successfully!\n\nNew password: ${result.newPassword}\n\nPlease share this password securely with the user.`);
      setResetPasswordModal(null);
      setGeneratedPassword('');
      setCustomPassword('');
      setUseCustomPassword(false);
    } catch (err) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Password copied to clipboard!');
  };

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) return <div className="p-8 text-center">Loading admin data...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 md:px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {/* Users */}
      <section className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">User Management</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Admin</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-b">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.isAdmin ? 'Yes' : 'No'}</td>
                <td className="p-2">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="p-2 space-x-2">
                  <button className="btn btn-xs btn-secondary" onClick={() => handlePromote(u._id, u.isAdmin)}>
                    {u.isAdmin ? 'Demote' : 'Promote'}
                  </button>
                  <button className="btn btn-xs btn-secondary" onClick={() => setResetPasswordModal(u)}>
                    <Key size={12} className="mr-1" />
                    Reset Password
                  </button>
                  <button className="btn btn-xs btn-danger" onClick={() => handleDeleteUser(u._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Transactions */}
      <section className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Transactions</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">ID</th>
              <th className="p-2">User</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Type</th>
              <th className="p-2">Category</th>
              <th className="p-2">Date</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t._id} className="border-b">
                <td className="p-2 font-mono text-xs">{t._id}</td>
                <td className="p-2">{t.user?.name || 'N/A'}</td>
                <td className="p-2">${t.amount.toFixed(2)}</td>
                <td className="p-2">{t.type}</td>
                <td className="p-2">{t.category}</td>
                <td className="p-2">{new Date(t.date).toLocaleString()}</td>
                <td className="p-2">
                  <button className="btn btn-xs btn-secondary mr-2" onClick={() => setEditTx(t)}>Edit</button>
                  <button className="btn btn-xs btn-danger" onClick={() => handleDelete('transaction', t._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {editTx && (
          <Modal onClose={() => setEditTx(null)}>
            <h3 className="text-lg font-bold mb-4">Edit Transaction</h3>
            <TransactionEditForm
              transaction={editTx}
              accounts={accounts}
              onSave={async (data) => {
                try {
                  const updated = await admin.updateTransaction(editTx._id, data);
                  setTransactions(ts => ts.map(t => t._id === editTx._id ? updated : t));
                  setEditTx(null);
                } catch (err) {
                  alert(err.message || 'Failed to update transaction');
                }
              }}
              onCancel={() => setEditTx(null)}
            />
          </Modal>
        )}
      </section>
      {/* Budgets */}
      <section className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Budgets</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">User</th>
              <th className="p-2">Category</th>
              <th className="p-2">Limit</th>
              <th className="p-2">Month</th>
              <th className="p-2">Year</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map(b => (
              <tr key={b._id} className="border-b">
                <td className="p-2">{b.user?.name || 'N/A'}</td>
                <td className="p-2">{b.category}</td>
                <td className="p-2">${b.limit.toFixed(2)}</td>
                <td className="p-2">{b.month}</td>
                <td className="p-2">{b.year}</td>
                <td className="p-2">
                  <button className="btn btn-xs btn-danger" onClick={() => handleDelete('budget', b._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Goals */}
      <section className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Goals</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">User</th>
              <th className="p-2">Name</th>
              <th className="p-2">Target</th>
              <th className="p-2">Current</th>
              <th className="p-2">Deadline</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.flatMap(u => {
              const userGoals = goals.filter(g => g.user?._id === u._id);
              const allocations = getAllocations(u._id, userGoals);
              return userGoals.map((g, idx) => {
                const allocation = allocations.find(a => a.goalId === g._id)?.allocated || 0;
                return (
                  <tr key={g._id} className="border-b">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{g.name}</td>
                    <td className="p-2">${g.targetAmount.toFixed(2)}</td>
                    <td className="p-2">
                      ${ (g.currentAmount + allocation).toFixed(2) }
                      {allocation > 0 && (
                        <span className="text-green-700 dark:text-green-300 text-xs"> +{allocation.toFixed(2)} funded</span>
                      )}
                    </td>
                    <td className="p-2">{g.deadline ? new Date(g.deadline).toLocaleDateString() : '-'}</td>
                    <td className="p-2">
                      <button className="btn btn-xs btn-danger" onClick={() => handleDelete('goal', g._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </section>
      {/* Recurring Transactions */}
      <section className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Recurring Transactions</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">User</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Type</th>
              <th className="p-2">Category</th>
              <th className="p-2">Frequency</th>
              <th className="p-2">Next</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recurring.map(r => (
              <tr key={r._id} className="border-b">
                <td className="p-2">{r.user?.name || 'N/A'}</td>
                <td className="p-2">${r.amount.toFixed(2)}</td>
                <td className="p-2">{r.type}</td>
                <td className="p-2">{r.category}</td>
                <td className="p-2">{r.frequency}</td>
                <td className="p-2">{r.nextOccurrence ? new Date(r.nextOccurrence).toLocaleDateString() : '-'}</td>
                <td className="p-2">
                  <button className="btn btn-xs btn-danger" onClick={() => handleDelete('recurring', r._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Password Reset Modal */}
      {resetPasswordModal && (
        <Modal onClose={() => setResetPasswordModal(null)}>
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Key size={20} /> Reset Password for {resetPasswordModal.name}
            </h3>
            
            <div className="space-y-4">
              {/* Generate Password Option */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!useCustomPassword}
                      onChange={() => setUseCustomPassword(false)}
                      className="mr-2"
                    />
                    Generate Generic Password
                  </label>
                  <button
                    onClick={handleGeneratePassword}
                    className="btn btn-xs btn-secondary flex items-center gap-1"
                    disabled={resettingPassword}
                  >
                    <RefreshCw size={12} />
                    Generate
                  </button>
                </div>
                {generatedPassword && (
                  <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <code className="flex-1 font-mono text-sm">{generatedPassword}</code>
                    <button
                      onClick={() => copyToClipboard(generatedPassword)}
                      className="btn btn-xs btn-secondary"
                      title="Copy to clipboard"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Password Option */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={useCustomPassword}
                      onChange={() => setUseCustomPassword(true)}
                      className="mr-2"
                    />
                    Set Custom Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showCustomPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Enter custom password"
                    className="input pr-10"
                    disabled={!useCustomPassword || resettingPassword}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-400"
                    onClick={() => setShowCustomPassword(!showCustomPassword)}
                    disabled={!useCustomPassword}
                  >
                    {showCustomPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button
                className="btn btn-secondary"
                onClick={() => setResetPasswordModal(null)}
                disabled={resettingPassword}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary flex items-center gap-2"
                onClick={handleResetPassword}
                disabled={resettingPassword}
              >
                {resettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Admin; 