import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../layout/ToastProvider';

export default function Profile() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    avatar: '',
  });
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Load current user from session/localStorage
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === session.email);
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: user.password || '',
        avatar: user.avatar || '',
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update user in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    const idx = users.findIndex((u: any) => u.email === session.email);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...formData };
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('session', JSON.stringify({ email: formData.email }));
      setMessage('Profile updated!');
      toast.showToast('Profile updated!');
    }
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.filter((u: any) => u.email !== session.email);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.removeItem('session');
    toast.showToast('Account deleted!', 'success');
    navigate('/register');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <div>
            {formData.avatar ? (
              <img src={formData.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl">
                ?
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Avatar
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="input-field w-full"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="input-field w-full"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-field w-full"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input-field w-full"
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">Save Changes</button>
        {message && <div className="text-green-600 mt-2">{message}</div>}
      </form>
      <button
        className="btn-secondary w-full mt-6 text-red-600 border-red-300 hover:bg-red-50"
        onClick={handleDeleteAccount}
      >
        Delete Account
      </button>
    </div>
  );
} 