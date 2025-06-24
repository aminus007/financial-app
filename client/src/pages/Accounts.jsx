import { useQuery, useMutation, useQueryClient } from 'react-query';
import { auth as authApi } from '../services/api';
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import useAccountStore from '../store/useAccountStore';

const accountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'other', label: 'Other' },
];

const Accounts = () => {
  const queryClient = useQueryClient();
  const {
    accounts,
    loading,
    error,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useAccountStore();

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const { data: user, refetch: refetchUser } = useQuery(['user', 'profile'], authApi.getProfile);
  const updateCashMutation = useMutation(
    (cash) => authApi.updateCash(cash),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', 'netbalance']);
        refetchUser();
      },
    }
  );
  const [editCash, setEditCash] = useState(undefined);

  // Add account
  const [newAccount, setNewAccount] = useState({ type: 'checking', balance: '' });
  const addAccountMutation = useMutation(authApi.addAccount, {
    onSuccess: () => {
      queryClient.invalidateQueries(['user', 'accounts']);
      setNewAccount({ type: 'checking', balance: '' });
    },
  });

  // Account history modal
  const [historyAccountId, setHistoryAccountId] = useState(null);
  const { data: accountHistory } = useQuery(
    ['account-history', historyAccountId],
    () => historyAccountId ? authApi.getAccountHistory(historyAccountId) : [],
    { enabled: !!historyAccountId }
  );

  // Transfer state
  const [transfer, setTransfer] = useState({ sourceType: 'cash', sourceId: '', destType: 'account', destId: '', amount: '' });
  const [transferError, setTransferError] = useState('');
  const transferMutation = useMutation(authApi.transfer, {
    onSuccess: () => {
      queryClient.invalidateQueries(['user', 'accounts']);
      refetchUser();
      setTransfer({ sourceType: 'cash', sourceId: '', destType: 'account', destId: '', amount: '' });
      setTransferError('');
    },
    onError: (err) => setTransferError(err?.message || 'Transfer failed'),
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-8">
      {/* Account Summary */}
      <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col items-start p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <span className="text-xs text-gray-500">Cash</span>
            <span className="font-bold text-lg">${user?.cash?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</span>
          </div>
          {(accounts || []).map(acc => (
            <div key={acc._id} className="flex flex-col items-start p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="text-xs text-gray-500">{acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}</span>
              <span className="font-bold text-lg">
                {acc.type === 'checking' && acc.name ? `${acc.name} ` : ''}${acc.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer Funds */}
      <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transfer Funds</h3>
        <form
          className="flex flex-col md:flex-row gap-2 items-end"
          onSubmit={e => {
            e.preventDefault();
            let sourceId = transfer.sourceType === 'account' ? transfer.sourceId : undefined;
            let destId = transfer.destType === 'account' ? transfer.destId : undefined;
            if (transfer.sourceType === 'account' && !sourceId) return setTransferError('Select source account');
            if (transfer.destType === 'account' && !destId) return setTransferError('Select destination account');
            if (transfer.sourceType === transfer.destType && sourceId === destId) return setTransferError('Source and destination must be different');
            transferMutation.mutate({
              sourceType: transfer.sourceType,
              sourceId,
              destType: transfer.destType,
              destId,
              amount: parseFloat(transfer.amount),
            });
          }}
        >
          <div>
            <label className="block text-xs mb-1">From</label>
            <select
              className="input"
              value={transfer.sourceType}
              onChange={e => setTransfer(t => ({ ...t, sourceType: e.target.value, sourceId: '' }))}
            >
              <option value="cash">Cash</option>
              <option value="account">Account</option>
            </select>
            {transfer.sourceType === 'account' && (
              <select
                className="input mt-1"
                value={transfer.sourceId}
                onChange={e => setTransfer(t => ({ ...t, sourceId: e.target.value }))}
              >
                <option value="">Select account</option>
                {(accounts || []).map(acc => (
                  <option key={acc._id} value={acc._id}>{acc.type} {acc.type === 'checking' && acc.name ? `(${acc.name})` : ''} (${acc.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs mb-1">To</label>
            <select
              className="input"
              value={transfer.destType}
              onChange={e => setTransfer(t => ({ ...t, destType: e.target.value, destId: '' }))}
            >
              <option value="cash">Cash</option>
              <option value="account">Account</option>
            </select>
            {transfer.destType === 'account' && (
              <select
                className="input mt-1"
                value={transfer.destId}
                onChange={e => setTransfer(t => ({ ...t, destId: e.target.value }))}
              >
                <option value="">Select account</option>
                {(accounts || []).map(acc => (
                  <option key={acc._id} value={acc._id}>{acc.type} {acc.type === 'checking' && acc.name ? `(${acc.name})` : ''} (${acc.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs mb-1">Amount</label>
            <input
              type="number"
              className="input w-28"
              min="0.01"
              step="0.01"
              value={transfer.amount}
              onChange={e => setTransfer(t => ({ ...t, amount: e.target.value }))}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={transferMutation.isLoading}>
            Transfer
          </button>
        </form>
        {transferError && <div className="text-red-500 text-sm mt-2">{transferError}</div>}
      </div>

      {/* Accounts List */}
      <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accounts List</h3>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          <li className="flex items-center justify-between py-2">
            <span className="capitalize">Cash</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input w-28"
                value={editCash !== undefined ? editCash : user?.cash || 0}
                onChange={e => setEditCash(e.target.value)}
                min="0"
                step="0.01"
              />
              {editCash !== undefined && parseFloat(editCash) !== (user?.cash || 0) && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    updateCashMutation.mutate(parseFloat(editCash));
                    setEditCash(undefined);
                  }}
                  disabled={updateCashMutation.isLoading}
                >
                  Save
                </button>
              )}
            </div>
          </li>
          {(accounts || []).map(acc => (
            <li key={acc._id} className="flex items-center justify-between py-2">
              <span className="capitalize">{acc.type}</span>
              <div className="flex items-center gap-2">
                {acc.type === 'checking' && (
                  <input
                    type="text"
                    className="input w-32"
                    placeholder="Account Name"
                    value={acc.name || ''}
                    onChange={e => updateAccount({ id: acc._id, name: e.target.value })}
                  />
                )}
                <input
                  type="number"
                  className="input w-28"
                  value={acc.balance}
                  onChange={e => updateAccount({ id: acc._id, balance: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteAccount(acc._id)}
                >
                  Delete
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setHistoryAccountId(acc._id)}
                >
                  History
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add Account */}
      <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Account</h3>
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            addAccountMutation.mutate({
              type: newAccount.type,
              balance: parseFloat(newAccount.balance) || 0,
            });
          }}
        >
          <select
            className="input"
            value={newAccount.type}
            onChange={e => setNewAccount(a => ({ ...a, type: e.target.value }))}
          >
            {accountTypes.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="number"
            className="input w-28"
            placeholder="Balance"
            min="0"
            step="0.01"
            value={newAccount.balance}
            onChange={e => setNewAccount(a => ({ ...a, balance: e.target.value }))}
          />
          <button className="btn btn-primary" type="submit" disabled={addAccountMutation.isLoading}>
            Add Account
          </button>
        </form>
      </div>

      {/* Account History Modal */}
      {historyAccountId && (
        <Modal onClose={() => setHistoryAccountId(null)}>
          <h4 className="text-lg font-bold mb-2">Account History</h4>
          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
            {(accountHistory || []).length === 0 && <li className="py-2">No transactions</li>}
            {(accountHistory || []).map(tx => (
              <li key={tx._id} className="py-2 text-sm flex justify-between">
                <span>{new Date(tx.date).toLocaleDateString()} - {tx.type} - ${tx.amount.toFixed(2)}</span>
                <span className="text-gray-500">{tx.note}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
};

export default Accounts; 