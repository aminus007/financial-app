import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { auth as authApi } from '../services/api';

const DEFAULTS = { needs: 50, savings: 30, wants: 20 };

const SalaryAllocator = () => {
  const [salary, setSalary] = useState('');
  const [alloc, setAlloc] = useState({ ...DEFAULTS });
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery(['user', 'accounts'], authApi.getAccounts);
  const { data: user, refetch: refetchUser } = useQuery(['user', 'profile'], authApi.getProfile);
  const updateAccountMutation = useMutation(
    ({ id, balance }) => authApi.updateAccount(id, { balance }),
    { onSuccess: () => queryClient.invalidateQueries(['user', 'accounts']) }
  );
  const updateCashMutation = useMutation(
    (cash) => authApi.updateCash(cash),
    { onSuccess: () => refetchUser() }
  );
  const [successMsg, setSuccessMsg] = useState('');

  // Helper to keep allocations sum to 100 and auto-adjust others
  const handleSlider = (type, value) => {
    value = Math.max(0, Math.min(100, Number(value)));
    // Prevent setting one to 100%
    if (value >= 100) value = 99;
    let other1, other2;
    if (type === 'needs') {
      other1 = 'savings';
      other2 = 'wants';
    } else if (type === 'savings') {
      other1 = 'needs';
      other2 = 'wants';
    } else {
      other1 = 'needs';
      other2 = 'savings';
    }
    const rest = 100 - value;
    const sumOthers = alloc[other1] + alloc[other2];
    let newOther1 = Math.round((alloc[other1] / sumOthers) * rest);
    let newOther2 = rest - newOther1;
    // Correction for rounding
    if (newOther1 < 0) newOther1 = 0;
    if (newOther2 < 0) newOther2 = 0;
    // Prevent both from being 0
    if (newOther1 === 0 && newOther2 === 0) {
      newOther1 = Math.floor(rest / 2);
      newOther2 = rest - newOther1;
    }
    setAlloc({
      ...alloc,
      [type]: value,
      [other1]: newOther1,
      [other2]: newOther2,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numSalary = parseFloat(salary);
    if (isNaN(numSalary) || numSalary <= 0) {
      setResult(null);
      return;
    }
    setResult({
      needs: (numSalary * alloc.needs / 100).toFixed(2),
      savings: (numSalary * alloc.savings / 100).toFixed(2),
      wants: (numSalary * alloc.wants / 100).toFixed(2),
    });
  };

  return (
    <div className="card max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">50-30-20 Salary Allocator</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="font-medium">
          Enter your monthly salary:
          <input
            type="number"
            className="input mt-1"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            min="0"
            step="0.01"
            required
          />
        </label>
        <div className="space-y-4 mt-2">
          <div>
            <label className="block font-medium mb-1">Needs: <span className="font-bold">{alloc.needs}%</span> <span className="text-xs text-gray-500">(suggested: 50%)</span></label>
            <input type="range" min="0" max="100" value={alloc.needs} onChange={e => handleSlider('needs', e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block font-medium mb-1">Savings & Investments: <span className="font-bold">{alloc.savings}%</span> <span className="text-xs text-gray-500">(suggested: 30%)</span></label>
            <input type="range" min="0" max="100" value={alloc.savings} onChange={e => handleSlider('savings', e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block font-medium mb-1">Wants: <span className="font-bold">{alloc.wants}%</span> <span className="text-xs text-gray-500">(suggested: 20%)</span></label>
            <input type="range" min="0" max="100" value={alloc.wants} onChange={e => handleSlider('wants', e.target.value)} className="w-full" />
          </div>
          <div className="text-right text-xs text-gray-500">Total: {alloc.needs + alloc.savings + alloc.wants}%</div>
        </div>
        <button type="submit" className="btn btn-primary">Calculate</button>
      </form>
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Allocation:</h3>
          <ul className="space-y-1">
            <li><strong>Needs ({alloc.needs}%):</strong> ${result.needs}</li>
            <li><strong>Savings & Investments ({alloc.savings}%):</strong> ${result.savings}</li>
            <li><strong>Wants ({alloc.wants}%):</strong> ${result.wants}</li>
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <button
              className="btn btn-primary"
              onClick={async () => {
                // Needs to checking
                const checking = (accounts || []).find(a => a.type === 'checking');
                if (checking) {
                  const newBalance = parseFloat(checking.balance) + parseFloat(result.needs);
                  updateAccountMutation.mutate({ id: checking._id, balance: newBalance });
                  setSuccessMsg('Allocated Needs to Checking');
                } else {
                  setSuccessMsg('No checking account found');
                }
              }}
            >
              Allocate Needs to Checking
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                // Savings & Investments to savings
                const savings = (accounts || []).find(a => a.type === 'savings');
                if (savings) {
                  const newBalance = parseFloat(savings.balance) + parseFloat(result.savings);
                  updateAccountMutation.mutate({ id: savings._id, balance: newBalance });
                  setSuccessMsg('Allocated Savings & Investments to Savings');
                } else {
                  setSuccessMsg('No savings account found');
                }
              }}
            >
              Allocate Savings & Investments to Savings
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                // Wants to cash
                if (user) {
                  const newCash = parseFloat(user.cash || 0) + parseFloat(result.wants);
                  updateCashMutation.mutate(newCash);
                  setSuccessMsg('Allocated Wants to Cash');
                }
              }}
            >
              Allocate Wants to Cash
            </button>
            {successMsg && <div className="text-green-600 mt-2">{successMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryAllocator; 