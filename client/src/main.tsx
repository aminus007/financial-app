import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './components/layout/ToastProvider';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
); 