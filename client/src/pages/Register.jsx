import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Calendar, UserCircle, List, Banknote, CreditCard, CheckCircle, XCircle, ChevronRight, ChevronLeft, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const INTERESTS = [
  'Technology',
  'Sports',
  'Reading',
  'Cooking',
  'Travel',
  'Music',
  'Fitness',
  'Finance',
];
const ACCOUNT_TYPES = [
  { value: 'Checking', label: 'Checking' },
  { value: 'Savings', label: 'Savings' },
  { value: 'Credit', label: 'Credit' },
];

const today = new Date();
const minBirthDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}
function validateBankAccountNumber(num) {
  return /^\d{8,12}$/.test(num);
}
function validateDateOfBirth(date) {
  if (!date) return false;
  const dob = new Date(date);
  return dob <= minBirthDate;
}

const initialState = {
  // Step 1
  email: '',
  password: '',
  confirmPassword: '',
  // Step 2
  fullName: '',
  username: '',
  dateOfBirth: '',
  // Step 3
  interests: [],
  receiveMarketing: false,
  // Step 4
  accounts: [],
  account: { bankName: '', accountType: '', accountBalance: '' },
  recurringTransactions: [],
};

const Register = () => {
  const loginStore = useAuthStore((state) => state.login);
  const { register } = useAuthStore.getState();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Recurring transaction temp state
  const [recurring, setRecurring] = useState({ name: '', amount: '' });

  // --- Step validation ---
  const validateStep = () => {
    let errs = {};
    if (step === 1) {
      if (!form.email) errs.email = 'Email is required.';
      else if (!validateEmail(form.email)) errs.email = 'Invalid email format.';
      if (!form.password) errs.password = 'Password is required.';
      else if (!validatePassword(form.password)) errs.password = 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.';
      if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
      else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    } else if (step === 2) {
      if (!form.fullName) errs.fullName = 'Full name is required.';
      if (form.dateOfBirth === '') errs.dateOfBirth = 'Birthday is required.';
      else if (!validateDateOfBirth(form.dateOfBirth)) errs.dateOfBirth = 'You must be at least 13 years old.';
    } else if (step === 4) {
      if (!form.accounts.length) {
        errs.accounts = 'Please add at least one account.';
      } else {
        form.accounts.forEach((acc, idx) => {
          if (!acc.bankName) errs[`accounts_${idx}_bankName`] = 'Bank name is required.';
          if (!acc.accountType) errs[`accounts_${idx}_accountType`] = 'Account type is required.';
          if (!acc.accountBalance) errs[`accounts_${idx}_accountBalance`] = 'Balance is required.';
          else if (isNaN(acc.accountBalance) || Number(acc.accountBalance) <= 0) errs[`accounts_${idx}_accountBalance`] = 'Balance must be a positive number.';
        });
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => s - 1);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleInterestToggle = (interest) => {
    setForm((prev) => {
      const arr = prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: arr };
    });
  };

  // Recurring transactions
  const handleRecurringChange = (e) => {
    const { name, value } = e.target;
    setRecurring((prev) => ({ ...prev, [name]: value }));
  };
  const addRecurring = () => {
    if (!recurring.name || !recurring.amount || isNaN(recurring.amount)) return;
    setForm((prev) => ({
      ...prev,
      recurringTransactions: [
        ...prev.recurringTransactions,
        { name: recurring.name, amount: Number(recurring.amount) },
      ],
    }));
    setRecurring({ name: '', amount: '' });
  };
  const removeRecurring = (idx) => {
    setForm((prev) => ({
      ...prev,
      recurringTransactions: prev.recurringTransactions.filter((_, i) => i !== idx),
    }));
  };

  // Account add/remove
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      account: { ...prev.account, [name]: value },
    }));
  };
  const addAccount = () => {
    const { bankName, accountType, accountBalance } = form.account;
    if (!bankName || !accountType || !accountBalance || isNaN(accountBalance) || Number(accountBalance) <= 0) return;
    setForm((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        { bankName, accountType, accountBalance: Number(accountBalance) },
      ],
      account: { bankName: '', accountType: '', accountBalance: '' },
    }));
  };
  const removeAccount = (idx) => {
    setForm((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((_, i) => i !== idx),
    }));
  };

  // --- Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    setErrors({});
    try {
      // Compose registration payload
      const payload = {
        name: form.fullName,
        email: form.email,
        password: form.password,
        accounts: form.accounts.map(acc => ({
          type: acc.accountType?.toLowerCase() || 'checking',
          balance: Number(acc.accountBalance) || 0,
        })),
        // Optionally, you can add 'cash' if you want to support it
        // cash: 0,
      };
      const { user, token } = await register(payload);
      localStorage.setItem('token', token);
      loginStore(user, token);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create account' });
    } finally {
      setLoading(false);
    }
  };

  // --- Stepper UI ---
  const steps = [
    'Account Information',
    'Personal Details',
    'Preferences',
    'Financial Information',
    'Review & Submit',
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-2 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-xl card">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((label, idx) => (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm mb-1
                ${step === idx + 1 ? 'bg-primary-600' : step > idx + 1 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                {step > idx + 1 ? <CheckCircle size={20} /> : idx + 1}
              </div>
              <span className="text-xs text-center text-gray-600 dark:text-gray-300 max-w-[70px]">{label}</span>
            </div>
          ))}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Step 1: Account Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Mail size={20} /> Account Information</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Email address</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    className="input pr-10"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <Mail className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={14} /> {errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={14} /> {errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowConfirmPassword((v) => !v)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={14} /> {errors.confirmPassword}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><User size={20} /> Personal Details</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <div className="relative">
                  <input
                    name="fullName"
                    type="text"
                    className="input pr-10"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                  <UserCircle className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.fullName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={14} /> {errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username <span className="text-gray-400">(optional)</span></label>
                <div className="relative">
                  <input
                    name="username"
                    type="text"
                    className="input pr-10"
                    placeholder="Preferred username"
                    value={form.username}
                    onChange={handleChange}
                  />
                  <User className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Birthday</label>
                <div className="relative">
                  <input
                    name="dateOfBirth"
                    type="date"
                    className="input pr-10"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    max={minBirthDate.toISOString().split('T')[0]}
                    required
                  />
                  <Calendar className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={14} /> {errors.dateOfBirth}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><List size={20} /> Preferences <span className="text-gray-400 text-sm">(Optional)</span></h2>
              <div>
                <label className="block text-sm font-medium mb-1">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      type="button"
                      key={interest}
                      className={`px-3 py-1 rounded-full border text-sm transition-colors ${form.interests.includes(interest) ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="receiveMarketing"
                  name="receiveMarketing"
                  type="checkbox"
                  checked={form.receiveMarketing}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="receiveMarketing" className="text-sm font-medium">I want to receive marketing emails</label>
              </div>
            </div>
          )}

          {/* Step 4: Financial Information */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Banknote size={20} /> Financial Information</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Add Account</label>
                <div className="flex flex-col md:flex-row gap-2 mb-2">
                  <input
                    name="bankName"
                    type="text"
                    className="input"
                    placeholder="Bank Name"
                    value={form.account.bankName}
                    onChange={handleAccountChange}
                  />
                  <select
                    name="accountType"
                    className="input"
                    value={form.account.accountType}
                    onChange={handleAccountChange}
                  >
                    <option value="">Type</option>
                    {ACCOUNT_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    name="accountBalance"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="Balance"
                    value={form.account.accountBalance}
                    onChange={handleAccountChange}
                  />
                  <button type="button" onClick={addAccount} className="btn btn-secondary flex items-center gap-1"><Plus size={16} /> Add</button>
                </div>
                {errors.accounts && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={14} /> {errors.accounts}</p>}
                <ul className="mb-2">
                  {form.accounts.map((acc, idx) => (
                    <li key={idx} className="flex flex-col md:flex-row justify-between items-center text-sm bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 mb-1 gap-2">
                      <span><span className="font-medium">{acc.bankName}</span> - {acc.accountType}: ${Number(acc.accountBalance).toFixed(2)}</span>
                      <button type="button" onClick={() => removeAccount(idx)} className="text-red-500 ml-2"><Trash2 size={16} /></button>
                      {errors[`accounts_${idx}_bankName`] && <span className="text-red-500 text-xs">{errors[`accounts_${idx}_bankName`]}</span>}
                      {errors[`accounts_${idx}_accountType`] && <span className="text-red-500 text-xs">{errors[`accounts_${idx}_accountType`]}</span>}
                      {errors[`accounts_${idx}_accountBalance`] && <span className="text-red-500 text-xs">{errors[`accounts_${idx}_accountBalance`]}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recurring Transactions <span className="text-gray-400">(optional)</span></label>
                <div className="flex gap-2 mb-2">
                  <input
                    name="name"
                    type="text"
                    className="input"
                    placeholder="e.g. Rent, Netflix"
                    value={recurring.name}
                    onChange={handleRecurringChange}
                  />
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="Amount"
                    value={recurring.amount}
                    onChange={handleRecurringChange}
                  />
                  <button type="button" onClick={addRecurring} className="btn btn-secondary flex items-center gap-1"><Plus size={16} /> Add</button>
                </div>
                <ul>
                  {form.recurringTransactions.map((rt, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 mb-1">
                      <span>{rt.name}: ${rt.amount.toFixed(2)}</span>
                      <button type="button" onClick={() => removeRecurring(idx)} className="text-red-500 ml-2"><Trash2 size={16} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><CheckCircle size={20} /> Review & Submit</h2>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm space-y-2">
                <div><span className="font-medium">Email:</span> {form.email}</div>
                <div><span className="font-medium">Full Name:</span> {form.fullName}</div>
                <div><span className="font-medium">Username:</span> {form.username || <span className="text-gray-400">(none)</span>}</div>
                <div><span className="font-medium">Birthday:</span> {form.dateOfBirth}</div>
                <div><span className="font-medium">Interests:</span> {form.interests.length ? form.interests.join(', ') : <span className="text-gray-400">(none)</span>}</div>
                <div><span className="font-medium">Marketing Emails:</span> {form.receiveMarketing ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Accounts:</span>
                  {form.accounts.length ? (
                    <ul className="ml-4 list-disc">
                      {form.accounts.map((acc, idx) => (
                        <li key={idx}><span className="font-medium">{acc.bankName}</span> - {acc.accountType}: ${Number(acc.accountBalance).toFixed(2)}</li>
                      ))}
                    </ul>
                  ) : <span className="text-gray-400">(none)</span>}
                </div>
              </div>
              {errors.submit && <div className="bg-red-50 dark:bg-red-900/50 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><XCircle size={16} /> {errors.submit}</div>}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 gap-2">
            {step > 1 ? (
              <button type="button" className="btn btn-secondary flex items-center gap-1" onClick={handleBack}>
                <ChevronLeft size={18} /> Back
              </button>
            ) : <div />}
            {step < 5 ? (
              <button type="button" className="btn btn-primary flex items-center gap-1 ml-auto" onClick={handleNext}>
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary flex items-center gap-1 ml-auto" disabled={loading}>
                {loading ? 'Creating Account...' : (<><CheckCircle size={18} /> Create Account</>)}
              </button>
            )}
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
