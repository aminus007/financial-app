import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function RequireAuth() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<string | null>(null);

  useEffect(() => {
    setSession(localStorage.getItem('session'));
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg">Checking authentication...</div>;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
} 