import React, { useEffect, useState } from 'react';
import { useToast } from '../layout/ToastProvider';

const currencyOptions = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
];
const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
];

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [message, setMessage] = useState('');
  const toast = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    setDarkMode(!!settings.darkMode);
    setNotifications(!!settings.notifications);
    setCurrency(settings.currency || 'USD');
    setLanguage(settings.language || 'en');
  }, []);

  useEffect(() => {
    // Apply dark mode class to body
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSave = () => {
    localStorage.setItem('settings', JSON.stringify({ darkMode, notifications, currency, language }));
    setMessage('Settings saved!');
    toast.showToast('Settings saved!');
    setTimeout(() => setMessage(''), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Settings</h1>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Dark Mode</span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode((v) => !v)}
            className="h-5 w-5"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Notifications</span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications((v) => !v)}
            className="h-5 w-5"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Currency</span>
          <select
            className="input-field w-40"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
          >
            {currencyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Language</span>
          <select
            className="input-field w-40"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            {languageOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary w-full" onClick={handleSave}>
          Save Settings
        </button>
        {message && <div className="text-green-600 mt-2">{message}</div>}
      </div>
    </div>
  );
} 