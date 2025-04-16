import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Transactions from './components/transactions/Transactions';
import Budgets from './components/budgets/Budgets';
import Goals from './components/goals/Goals';
import Reports from './components/reports/Reports';
import Settings from './components/settings/Settings';
import Profile from './components/profile/Profile';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import RequireAuth from './components/auth/RequireAuth';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="goals" element={<Goals />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
