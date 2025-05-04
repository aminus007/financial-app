import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Goals from './pages/Goals';
import Recurring from './pages/Recurring';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import SalaryAllocator from './pages/SalaryAllocator';
import Accounts from './pages/Accounts';
import Admin from './pages/Admin';
import Debts from './pages/Debts';

// Components
import Navbar from './components/Navbar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <PublicRoute>
          <Landing />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/transactions" element={
        <PrivateRoute>
          <Transactions />
        </PrivateRoute>
      } />
      <Route path="/goals" element={
        <PrivateRoute>
          <Goals />
        </PrivateRoute>
      } />
      <Route path="/recurring" element={
        <PrivateRoute>
          <Recurring />
        </PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute>
          <Settings />
        </PrivateRoute>
      } />
      <Route path="/salary-allocator" element={
        <PrivateRoute>
          <SalaryAllocator />
        </PrivateRoute>
      } />
      <Route path="/accounts" element={
        <PrivateRoute>
          <Accounts />
        </PrivateRoute>
      } />
      <Route path="/admin" element={
        <PrivateRoute>
          <Admin />
        </PrivateRoute>
      } />
      <Route path="/debts" element={
        <PrivateRoute>
          <Debts />
        </PrivateRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function AppLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/';
  return (
    <div className="min-h-screen">
      {!hideNavbar && <Navbar />}
      <main className="container mx-auto px-4 py-8">
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;