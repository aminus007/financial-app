import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [darkMode, toggleDarkMode] = useDarkMode();

  return (
    <nav className="bg-white shadow-lg dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                MindfulMoney
              </span>
            </Link>
          </div>

          {user && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                to="/transactions"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Transactions
              </Link>
              <Link
                to="/budgets"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Budgets
              </Link>
              <Link
                to="/goals"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Goals
              </Link>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <MoonIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-300">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="btn btn-secondary"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 