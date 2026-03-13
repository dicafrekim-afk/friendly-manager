
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeaveApplication from './pages/LeaveApplication';
import ExtraWorkReportPage from './pages/ExtraWorkReport'; // 신규 추가
import MeetingSchedule from './pages/MeetingSchedule';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminRequests from './pages/AdminRequests';
import Profile from './pages/Profile'; 
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { User } from './types';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('friendly_current_session');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
    }
    setSessionChecked(true);

    const onStorage = () => {
      const updated = localStorage.getItem('friendly_current_session');
      setCurrentUser(updated ? JSON.parse(updated) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('friendly_current_session', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('friendly_current_session');
    setIsSidebarOpen(false);
  };

  const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!sessionChecked) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    if (!currentUser) return <Navigate to="/login" replace />;
    if (currentUser.status === 'PENDING') return <div className="min-h-screen flex items-center justify-center bg-slate-50">승인 대기 중...</div>;
    return (
      <div className="flex min-h-screen bg-slate-50 relative">
        <Sidebar user={currentUser} logout={logout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header user={currentUser} onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    );
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
        <Route path="/apply" element={<AuthenticatedLayout><LeaveApplication /></AuthenticatedLayout>} />
        <Route path="/extra-work" element={<AuthenticatedLayout><ExtraWorkReportPage /></AuthenticatedLayout>} />
        <Route path="/meetings" element={<AuthenticatedLayout><MeetingSchedule /></AuthenticatedLayout>} />
        <Route path="/profile" element={<AuthenticatedLayout><Profile /></AuthenticatedLayout>} />
        <Route path="/admin/users" element={<AuthenticatedLayout><AdminUserManagement /></AuthenticatedLayout>} />
        <Route path="/admin/requests" element={<AuthenticatedLayout><AdminRequests /></AuthenticatedLayout>} />
      </Routes>
    </HashRouter>
  );
};

export default App;
