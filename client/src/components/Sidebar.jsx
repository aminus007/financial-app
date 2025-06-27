import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { useDarkMode } from '../hooks/useDarkMode';
import { useSidebar } from '../App';
import { 
  HomeIcon, 
  BanknotesIcon, 
  CreditCardIcon, 
  FlagIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalculatorIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [darkMode, toggleDarkMode] = useDarkMode();
  const { isExpanded, setIsExpanded, isMobile, setIsMobile } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile, setIsExpanded]);

  useEffect(() => {
    if (isMobile) {
      setIsExpanded(false);
    }
  }, [location.pathname, isMobile, setIsExpanded]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/accounts', label: 'Accounts', icon: BanknotesIcon },
    { to: '/transactions', label: 'Transactions', icon: CreditCardIcon },
    { to: '/goals', label: 'Goals', icon: FlagIcon },
    { to: '/debts', label: 'Debts', icon: ExclamationTriangleIcon },
    { to: '/recurring', label: 'Recurring', icon: ArrowPathIcon },
    { to: '/salary-allocator', label: 'Salary Allocator', icon: CalculatorIcon },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isExpanded && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden sidebar-overlay opacity-100"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-50 sidebar-transition
        ${isExpanded ? 'w-64' : 'w-16'} 
        ${isMobile ? 'sidebar-expand' : ''}
        ${isMobile && !isExpanded ? '-translate-x-full' : ''}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="flex items-center overflow-hidden">
            {isExpanded ? (
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400 sidebar-transition opacity-100">
                MindfulMoney
              </span>
            ) : (
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400 sidebar-transition opacity-100">
                MM
              </span>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 sidebar-transition flex-shrink-0 btn-hover"
          >
            {isExpanded ? (
              <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 icon-spin" />
            ) : (
              <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300 icon-spin" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {user && navLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  flex items-center px-3 py-3 rounded-lg sidebar-transition group relative btn-hover
                  ${isActive(link.to) 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0 icon-spin" />
                {isExpanded && (
                  <span className="ml-3 font-medium sidebar-transition opacity-100">
                    {link.label}
                  </span>
                )}
                {!isExpanded && (
                  <div className="tooltip">
                    {link.label}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Admin Link */}
          {user?.isAdmin && (
            <Link
              to="/admin"
              className={`
                flex items-center px-3 py-3 rounded-lg sidebar-transition group relative btn-hover
                ${isActive('/admin') 
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <UserIcon className="h-5 w-5 flex-shrink-0 icon-spin" />
              {isExpanded && (
                <span className="ml-3 font-medium sidebar-transition opacity-100">
                  Admin
                </span>
              )}
              {!isExpanded && (
                <div className="tooltip">
                  Admin
                </div>
              )}
            </Link>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center px-3 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 sidebar-transition btn-hover"
          >
            {darkMode ? (
              <MoonIcon className="h-5 w-5 flex-shrink-0 icon-spin" />
            ) : (
              <SunIcon className="h-5 w-5 flex-shrink-0 icon-spin" />
            )}
            {isExpanded && (
              <span className="ml-3 font-medium sidebar-transition opacity-100">
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            )}
          </button>

          {/* User Section */}
          {user ? (
            <>
              {/* Settings */}
              <Link
                to="/settings"
                className={`
                  flex items-center px-3 py-3 rounded-lg sidebar-transition group btn-hover
                  ${isActive('/settings') 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Cog6ToothIcon className="h-5 w-5 flex-shrink-0 icon-spin" />
                {isExpanded && (
                  <span className="ml-3 font-medium sidebar-transition opacity-100">
                    Settings
                  </span>
                )}
              </Link>

              {/* User Info */}
              <div className="px-3 py-2">
                {isExpanded ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 sidebar-transition opacity-100">
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {user.name}
                    </div>
                    <div className="text-xs">{user.email}</div>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center sidebar-transition">
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full flex items-center px-3 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 sidebar-transition btn-hover"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0 icon-spin" />
                {isExpanded && (
                  <span className="ml-3 font-medium sidebar-transition opacity-100">
                    Logout
                  </span>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className="w-full flex items-center px-3 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 sidebar-transition btn-hover"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0 icon-spin" />
                {isExpanded && (
                  <span className="ml-3 font-medium sidebar-transition opacity-100">
                    Login
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg lg:hidden sidebar-transition btn-hover"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-300 icon-spin" />
        </button>
      )}
    </>
  );
};

export default Sidebar; 