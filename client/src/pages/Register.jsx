import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const accountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'other', label: 'Other' },
];

const Register = () => {
  const loginStore = useAuthStore((state) => state.login);
  const { register } = useAuthStore.getState();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    accounts: [],
    cash: '',
  });
  const [account, setAccount] = useState({ type: 'checking', balance: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccount(prev => ({ ...prev, [name]: value }));
  };

  const addAccount = (e) => {
    e.preventDefault();
    if (!account.balance || isNaN(account.balance)) return;
    setFormData(prev => ({
      ...prev,
      accounts: [...prev.accounts, { ...account, balance: parseFloat(account.balance) }]
    }));
    setAccount({ type: 'checking', balance: '' });
  };

  const removeAccount = (idx) => {
    setFormData(prev => ({
      ...prev,
      accounts: prev.accounts.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Use the auth API service for registration
      const { user, token } = await register({
        name: formData.name,
        email: formData.email,
        accounts: formData.accounts,
        cash: parseFloat(formData.cash) || 0,
      });
      localStorage.setItem('token', token);
      loginStore(user, token); // Update auth store state
    } catch (err) {
      // Error handling from API service
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              sign in to your account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Add Bank Account</label>
              <div className="flex gap-2 mb-2">
                <select
                  name="type"
                  value={account.type}
                  onChange={handleAccountChange}
                  className="input"
                >
                  {accountTypes.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  name="balance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Balance"
                  value={account.balance}
                  onChange={handleAccountChange}
                  className="input"
                />
                <button onClick={addAccount} className="btn btn-secondary">Add</button>
              </div>
              <ul className="mb-2">
                {formData.accounts.map((acc, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 mb-1">
                    <span>{accountTypes.find(a => a.value === acc.type)?.label || acc.type}: ${acc.balance.toFixed(2)}</span>
                    <button type="button" onClick={() => removeAccount(idx)} className="text-red-500 ml-2">Remove</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label htmlFor="cash" className="block text-sm font-medium mb-1">Cash</label>
              <input
                id="cash"
                name="cash"
                type="number"
                min="0"
                step="0.01"
                className="input"
                placeholder="Cash amount"
                value={formData.cash}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full flex justify-center"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
