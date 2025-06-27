import React, { lazy, Suspense, createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import useAuthStore from './store/useAuthStore';

// Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Goals = lazy(() => import('./pages/Goals'));
const Recurring = lazy(() => import('./pages/Recurring'));
const Settings = lazy(() => import('./pages/Settings'));
const Landing = lazy(() => import('./pages/Landing'));
const SalaryAllocator = lazy(() => import('./pages/SalaryAllocator'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Admin = lazy(() => import('./pages/Admin'));
const Debts = lazy(() => import('./pages/Debts'));

// Components
import Sidebar from './components/Sidebar';

// Sidebar Context
const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

const SidebarProvider = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isMobile, setIsMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PrivateRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
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
    </Suspense>
  );
};

function AppLayout() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { isExpanded, isMobile } = useSidebar();
  const hideSidebar = location.pathname === '/' || !user;
  
  return (
    <div className="min-h-screen">
      {!hideSidebar && <Sidebar />}
      <main className={`content-slide ${!hideSidebar ? (isExpanded && !isMobile ? 'ml-64' : 'ml-16') : ''}`}>
        <div className="container mx-auto px-4 py-8">
          <AppRoutes />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SidebarProvider>
          <AppLayout />
        </SidebarProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;