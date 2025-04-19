import { Link } from 'react-router-dom';

const HeroIllustration = () => (
  <svg viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-8 w-full max-w-xl h-32">
    <ellipse cx="200" cy="100" rx="180" ry="15" fill="#e0e7ff" className="dark:fill-gray-800" />
    <rect x="60" y="30" width="80" height="50" rx="10" fill="#6366f1" opacity="0.9" />
    <rect x="160" y="20" width="80" height="60" rx="10" fill="#a5b4fc" opacity="0.8" />
    <rect x="260" y="40" width="60" height="40" rx="10" fill="#818cf8" opacity="0.7" />
    <circle cx="100" cy="55" r="8" fill="#fff" />
    <circle cx="200" cy="50" r="8" fill="#fff" />
    <circle cx="290" cy="60" r="8" fill="#fff" />
    <rect x="90" y="70" width="20" height="6" rx="3" fill="#fff" />
    <rect x="190" y="65" width="20" height="6" rx="3" fill="#fff" />
    <rect x="280" y="75" width="20" height="6" rx="3" fill="#fff" />
  </svg>
);

const FeatureIcon1 = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 36 36" className="mx-auto mb-2">
    <rect x="5" y="10" width="26" height="16" rx="5" fill="#6366f1" />
    <rect x="7" y="14" width="22" height="8" rx="3" fill="#fff" />
    <circle cx="11" cy="18" r="2" fill="#6366f1" />
    <rect x="20" y="17" width="7" height="2" rx="1" fill="#6366f1" />
  </svg>
);
const FeatureIcon2 = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 36 36" className="mx-auto mb-2">
    <circle cx="18" cy="18" r="14" fill="#a5b4fc" />
    <circle cx="18" cy="18" r="9" fill="#fff" />
    <circle cx="18" cy="18" r="4" fill="#6366f1" />
    <rect x="17" y="6" width="2" height="6" rx="1" fill="#6366f1" />
    <rect x="17" y="24" width="2" height="6" rx="1" fill="#6366f1" />
    <rect x="6" y="17" width="6" height="2" rx="1" fill="#6366f1" />
    <rect x="24" y="17" width="6" height="2" rx="1" fill="#6366f1" />
  </svg>
);
const FeatureIcon3 = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 36 36" className="mx-auto mb-2">
    <circle cx="18" cy="18" r="14" fill="#e0e7ff" />
    <path d="M18 18V6a12 12 0 0 1 12 12h-12z" fill="#6366f1" />
    <path d="M18 18h12a12 12 0 0 1-12 12V18z" fill="#a5b4fc" />
    <circle cx="18" cy="18" r="5" fill="#fff" />
  </svg>
);

const Landing = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <HeroIllustration />
        <div>
          <h1 className="text-5xl font-extrabold text-primary-600 dark:text-primary-400 mb-4">
            Welcome to MindfulMoney
          </h1>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-200 max-w-xl mx-auto">
            Take control of your finances with ease. MindfulMoney helps you track your spending, set budgets, achieve your goals, and visualize your financial journey—all in a beautiful, distraction-free interface.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card">
            <FeatureIcon1 />
            <h3 className="text-lg font-semibold mb-2 text-primary-600 dark:text-primary-400">Track Transactions</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Easily log and categorize your income and expenses. See where your money goes at a glance.</p>
          </div>
          <div className="card">
            <FeatureIcon2 />
            <h3 className="text-lg font-semibold mb-2 text-primary-600 dark:text-primary-400">Set Budgets & Goals</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Create budgets, set savings goals, and monitor your progress with intuitive charts and summaries.</p>
          </div>
          <div className="card">
            <FeatureIcon3 />
            <h3 className="text-lg font-semibold mb-2 text-primary-600 dark:text-primary-400">Visualize & Analyze</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Get insights with beautiful graphs and reports. Make smarter decisions for your financial future.</p>
          </div>
        </div>
        <div className="mt-10">
          <Link
            to="/login"
            className="btn btn-primary text-lg px-8 py-3"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing; 