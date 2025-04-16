import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Load user
  const loadUser = async () => {
    if (token) {
      setAuthToken(token);
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);
      const { token } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setAuthToken(token);
      await loadUser();
      toast.success('Registration successful');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post('/api/auth/login', formData);
      const { token } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setAuthToken(token);
      await loadUser();
      toast.success('Login successful');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await axios.post('/api/auth/forgotpassword', { email });
      toast.success('Password reset email sent');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
      return false;
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await axios.put(`/api/auth/resetpassword/${token}`, { password });
      toast.success('Password reset successful');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
      return false;
    }
  };

  // Check if token is expired
  const isTokenExpired = () => {
    if (!token) return true;
    const decoded = jwt_decode(token);
    return decoded.exp < Date.now() / 1000;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
        isTokenExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 