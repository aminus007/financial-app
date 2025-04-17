import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';

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
    return <Navigate to="/" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
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
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/transactions" element={
        <PrivateRoute>
          <Transactions />
        </PrivateRoute>
      } />
      <Route path="/budgets" element={
        <PrivateRoute>
          <Budgets />
        </PrivateRoute>
      } />
      <Route path="/goals" element={
        <PrivateRoute>
          <Goals />
        </PrivateRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <AppRoutes />
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;