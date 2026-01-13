
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeaveApplication from './pages/LeaveApplication';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSession = () => {
      const savedUser = localStorage.getItem('friendly_current_session');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    };
    fetchSession();
    window.addEventListener('storage', fetchSession);
    return () => window.removeEventListener('storage', fetchSession);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const checkReminders = async () => {
      await dataService.checkMeetingReminders();
    };
    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

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
    if (!currentUser) return <Navigate to="/login" replace />;
    
    if (currentUser.status === 'PENDING') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <h1 className="text-2xl font-bold mb-4">승인 대기 중</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">관리자가 가입을 승인하면<br/>모든 기능을 이용하실 수 있습니다.</p>
            <button onClick={logout} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold">로그아웃</button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <Sidebar user={currentUser} logout={logout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header user={currentUser} onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
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
        <Route path="/meetings" element={<AuthenticatedLayout><MeetingSchedule /></AuthenticatedLayout>} />
        <Route path="/profile" element={<AuthenticatedLayout><Profile /></AuthenticatedLayout>} />
        <Route path="/admin/users" element={<AuthenticatedLayout><AdminUserManagement /></AuthenticatedLayout>} />
        <Route path="/admin/requests" element={<AuthenticatedLayout><AdminRequests /></AuthenticatedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
