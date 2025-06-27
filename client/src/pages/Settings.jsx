import { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { data as dataApi } from '../services/api';
import { auth as authApi } from '../services/api';

const Settings = () => {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: user?.preferences?.currency || 'USD',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importOptions, setImportOptions] = useState({
    transactions: true,
    accounts: false,
    goals: false,
    budgets: false,
    debts: false,
    recurring: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccess('');
  };

  const validatePassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!passwordForm.currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!passwordForm.newPassword) {
      setError('New password is required');
      return;
    }

    if (!validatePassword(passwordForm.newPassword)) {
      setError('New password must be at least 8 characters and include uppercase, lowercase, number, and special character');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid CSV or Excel file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setShowImportModal(true);
    }
  };

  const handleImportOptionChange = (option) => {
    setImportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleImportConfirm = async () => {
    // Check if at least one option is selected
    if (!Object.values(importOptions).some(option => option)) {
      setError('Please select at least one data type to import');
      return;
    }

    setShowImportModal(false);
    await handleImport();
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('importOptions', JSON.stringify(importOptions));

      const result = await dataApi.import(formData);
      setImportResults(result.results);
      setSuccess(`Data imported successfully! ${result.message}`);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setDownloading(true);
    setError('');
    try {
      const blob = await dataApi.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindfulMoney_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully!');
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setDownloading(false);
    }
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
          {error && <div className="bg-red-50 dark:bg-red-900/50 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
          {success && <div className="bg-green-50 dark:bg-green-900/50 text-green-900 dark:text-green-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}
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

        {/* Change Password Section */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock size={20} /> Change Password
          </h3>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  className="input pr-10"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-400"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  className="input pr-10"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-400"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="input pr-10"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="btn btn-secondary w-full flex justify-center"
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Data Import/Export Section */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Data Management</h3>
          
          {/* Import Section */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2 flex items-center gap-2">
              <Upload size={16} /> Import Data
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload a CSV or Excel file to import your financial data. Supported formats: .csv, .xlsx, .xls
            </p>
            <div className="space-y-3">
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {selectedFile && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              <button
                type="button"
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="btn btn-secondary flex items-center gap-2"
              >
                {importing ? 'Importing...' : 'Import Data'}
              </button>
            </div>
            
            {/* Import Results */}
            {importResults && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Import Results:</h5>
                <div className="text-xs space-y-1">
                  {importOptions.accounts && <div>Accounts: {importResults.accounts.created} created, {importResults.accounts.errors} errors</div>}
                  {importOptions.transactions && <div>Transactions: {importResults.transactions.created} created, {importResults.transactions.errors} errors</div>}
                  {importOptions.goals && <div>Goals: {importResults.goals.created} created, {importResults.goals.errors} errors</div>}
                  {importOptions.budgets && <div>Budgets: {importResults.budgets.created} created, {importResults.budgets.errors} errors</div>}
                  {importOptions.debts && <div>Debts: {importResults.debts.created} created, {importResults.debts.errors} errors</div>}
                  {importOptions.recurring && <div>Recurring Transactions: {importResults.recurring.created} created, {importResults.recurring.errors} errors</div>}
                </div>
              </div>
            )}
          </div>

          {/* Export Section */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2 flex items-center gap-2">
              <Download size={16} /> Export Data
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Download all your financial data as an Excel file with multiple sheets.
            </p>
            <button
              onClick={handleExport}
              className="btn btn-secondary flex items-center gap-2"
              disabled={downloading}
            >
              {downloading ? 'Generating...' : 'Download All My Data'}
            </button>
          </div>
        </div>

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

      {/* Import Options Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Upload size={20} /> Select Data to Import
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Choose which data types you want to import from your backup file:
              </p>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.transactions}
                    onChange={() => handleImportOptionChange('transactions')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div>
                    <div className="font-medium">Transactions</div>
                    <div className="text-xs text-gray-500">Income and expense records</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.accounts}
                    onChange={() => handleImportOptionChange('accounts')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div>
                    <div className="font-medium">Accounts</div>
                    <div className="text-xs text-gray-500">Bank accounts and balances</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.goals}
                    onChange={() => handleImportOptionChange('goals')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div>
                    <div className="font-medium">Goals</div>
                    <div className="text-xs text-gray-500">Savings goals and targets</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.budgets}
                    onChange={() => handleImportOptionChange('budgets')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div>
                    <div className="font-medium">Budgets</div>
                    <div className="text-xs text-gray-500">Budget categories and limits</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.debts}
                    onChange={() => handleImportOptionChange('debts')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div>
                    <div className="font-medium">Debts</div>
                    <div className="text-xs text-gray-500">Outstanding debts and loans</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.recurring}
                    onChange={() => handleImportOptionChange('recurring')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div>
                    <div className="font-medium">Recurring Transactions</div>
                    <div className="text-xs text-gray-500">Regular payments and subscriptions</div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                  const fileInput = document.getElementById('file-input');
                  if (fileInput) fileInput.value = '';
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImportConfirm}
                disabled={!Object.values(importOptions).some(option => option)}
              >
                Import Selected Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 