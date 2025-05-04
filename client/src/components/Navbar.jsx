import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { Bars3Icon, XMarkIcon, Cog6ToothIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/accounts', label: 'Accounts' },
    { to: '/transactions', label: 'Transactions' },
    { to: '/goals', label: 'Goals' },
    { to: '/debts', label: 'Debts' },
    { to: '/recurring', label: 'Recurring' },
    { to: '/salary-allocator', label: 'Salary Allocator' },
  ];

  // Toggle Switch Component with Sun/Moon icon
  const DarkModeToggle = () => (
    <button
      onClick={toggleDarkMode}
      className={`relative w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
      aria-label="Toggle dark mode"
      type="button"
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`}
      >
        {darkMode ? (
          <MoonIcon className="h-4 w-4 text-primary-600" />
        ) : (
          <SunIcon className="h-4 w-4 text-yellow-400" />
        )}
      </span>
      <span className="sr-only">Toggle dark mode</span>
    </button>
  );

  return (
    <nav className="bg-white shadow-lg dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
              MindfulMoney
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} className="nav-link" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {user.isAdmin && (
                <Link to="/admin" className="nav-link" onClick={() => setMobileOpen(false)}>
                  Admin
                </Link>
              )}
            </div>
          )}

          {/* Desktop User Actions & Dark Mode Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            <DarkModeToggle />
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  {user.name}
                </span>
                <Link to="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Settings">
                  <Cog6ToothIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-secondary"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open menu"
          >
            {mobileOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {user && (
              <div className="flex flex-col space-y-2">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to} className="nav-link" onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                ))}
                {user.isAdmin && (
                  <Link to="/admin" className="nav-link" onClick={() => setMobileOpen(false)}>
                    Admin
                  </Link>
                )}
              </div>
            )}
            <div className="flex items-center space-x-4 mt-4">
              <DarkModeToggle />
              {user ? (
                <>
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {user.name}
                  </span>
                  <Link to="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Settings" onClick={() => setMobileOpen(false)}>
                    <Cog6ToothIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="btn btn-secondary"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 