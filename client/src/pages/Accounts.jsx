import { useQuery, useMutation, useQueryClient } from 'react-query';
import { auth as authApi } from '../services/api';
import { useState } from 'react';
import Modal from '../components/Modal';

const accountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'other', label: 'Other' },
];

const Accounts = () => {
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery(['user', 'accounts'], authApi.getAccounts);
  const updateAccountMutation = useMutation(
    ({ id, balance }) => authApi.updateAccount(id, { balance }),
    {
      onSuccess: () => queryClient.invalidateQueries(['user', 'accounts']),
    }
  );
  const [editBalances, setEditBalances] = useState({});

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

  // Delete account
  const deleteAccountMutation = useMutation(authApi.deleteAccount, {
    onSuccess: () => queryClient.invalidateQueries(['user', 'accounts']),
  });

  // Account history modal
  const [historyAccountId, setHistoryAccountId] = useState(null);
  const { data: accountHistory } = useQuery(
    ['account-history', historyAccountId],
    () => historyAccountId ? authApi.getAccountHistory(historyAccountId) : [],
    { enabled: !!historyAccountId }
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="card bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Accounts</h3>
        {/* Add Account Form */}
        <form
          className="flex gap-2 mb-4"
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
                <input
                  type="number"
                  className="input w-28"
                  value={editBalances[acc._id] !== undefined ? editBalances[acc._id] : acc.balance}
                  onChange={e => setEditBalances(b => ({ ...b, [acc._id]: e.target.value }))}
                  min="0"
                  step="0.01"
                />
                {editBalances[acc._id] !== undefined && parseFloat(editBalances[acc._id]) !== acc.balance && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      updateAccountMutation.mutate({ id: acc._id, balance: parseFloat(editBalances[acc._id]) });
                      setEditBalances(b => ({ ...b, [acc._id]: undefined }));
                    }}
                    disabled={updateAccountMutation.isLoading}
                  >
                    Save
                  </button>
                )}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteAccountMutation.mutate(acc._id)}
                  disabled={deleteAccountMutation.isLoading}
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