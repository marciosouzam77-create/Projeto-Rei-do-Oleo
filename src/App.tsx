/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, User, Car, LogOut, Bell, Shield, Package, History } from 'lucide-react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import ChangePassword from './components/ChangePassword';

export interface UserState {
  role: 'admin' | 'customer';
  name?: string;
  plate?: string;
  customerId?: string;
  mustChangePassword?: boolean;
}

export default function App() {
  const [user, setUser] = useState<UserState | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (loggedUser: UserState) => {
    setUser(loggedUser);
    localStorage.setItem('user', JSON.stringify(loggedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handlePasswordChanged = () => {
    if (user) {
      const updatedUser = { ...user, mustChangePassword: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === 'customer' && user.mustChangePassword) {
    return <ChangePassword plate={user.plate!} onPasswordChanged={handlePasswordChanged} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1C1E21] font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-200">
               R
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Rei do Óleo</h1>
              <p className="text-xs text-gray-500">Santa Terezinha</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium">{user.role === 'admin' ? 'Administrador' : `Placa: ${user.plate}`}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">{user.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={user.role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {user.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <CustomerDashboard vehiclePlate={user.plate!} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <footer className="mt-auto py-8 text-center text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} Rei do Óleo - Santa Terezinha. Todos os direitos reservados.
      </footer>
    </div>
  );
}
