import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';

const Settings = () => {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: user?.preferences?.currency || 'USD',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Only update preferences for now (name, currency)
      await useAuthStore.getState().updatePreferences({
        currency: form.currency,
      });
      setSuccess('Preferences updated!');
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await fetch('/api/report/pdf', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to download PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MindfulMoney_Report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Settings</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 dark:bg-red-900/50 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="bg-green-50 dark:bg-green-900/50 text-green-900 dark:text-green-200 px-4 py-3 rounded-lg text-sm">{success}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                className="input"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Currency</label>
              <select
                className="input"
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="MAD">MAD</option>
                {/* Add more as needed */}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full flex justify-center"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <button
            onClick={handleDownloadPDF}
            className="btn btn-secondary"
            disabled={downloading}
          >
            {downloading ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 