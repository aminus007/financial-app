import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-full">
      <div className="bg-yellow-200 text-yellow-900 text-center py-2 text-sm font-semibold">
        Demo only. Do not use real passwords.
      </div>
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 