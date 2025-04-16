import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TagIcon,
  DocumentChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Transactions', href: '/transactions', icon: CurrencyDollarIcon },
  { name: 'Budgets', href: '/budgets', icon: ChartBarIcon },
  { name: 'Goals', href: '/goals', icon: TagIcon },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
];

const quickActions = [
  { name: 'Add Transaction', event: 'open-add-transaction', icon: PlusIcon, href: '/transactions' },
  { name: 'Create Budget', event: 'open-add-budget', icon: PlusIcon, href: '/budgets' },
  { name: 'Set Goal', event: 'open-add-goal', icon: PlusIcon, href: '/goals' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function triggerEvent(eventName: string) {
  window.dispatchEvent(new CustomEvent(eventName));
}

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-800">
      <div className="flex h-16 flex-shrink-0 items-center px-4">
        <Link to="/dashboard" className="text-xl font-bold text-white">
          Finance App
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={classNames(
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                )}
              >
                <item.icon
                  className={classNames(
                    isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                    'mr-3 h-6 w-6 flex-shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex-shrink-0 border-t border-gray-700 p-4">
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Quick Actions
            </h3>
            {quickActions.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  if (location.pathname !== item.href) {
                    window.location.href = item.href;
                    setTimeout(() => triggerEvent(item.event), 100);
                  } else {
                    triggerEvent(item.event);
                  }
                }}
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
              >
                <item.icon
                  className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
                  aria-hidden="true"
                />
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 