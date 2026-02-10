
import React from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../types';
import { isSuperAdmin } from '../services/dataService';

interface SidebarProps {
  user: User;
  logout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, logout, isOpen, onClose }) => {
  const navItems = [
    { to: '/', label: '대시보드', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { to: '/apply', label: '휴가/출장 신청', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    { to: '/extra-work', label: '추가 근무 보고', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { to: '/meetings', label: '회의 예약', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
  ];

  const adminItems = [
    { to: '/admin/requests', label: '신청 승인 관리', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { to: '/admin/users', label: '팀원 관리', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />, superOnly: true },
  ];

  const showAdminMenu = user.role === 'ADMIN' || isSuperAdmin(user.email);

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col h-screen p-8 transition-transform duration-300 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-[14px] flex items-center justify-center text-white shadow-lg">F</div>
          <span className="text-xl font-black text-slate-900 tracking-tighter">Friendly</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-400">닫기</button>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
            <span className="font-bold text-sm">{item.label}</span>
          </NavLink>
        ))}
        {showAdminMenu && adminItems.map(item => {
            if (item.superOnly && !isSuperAdmin(user.email)) return null;
            return (
              <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all ${isActive ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                <span className="font-bold text-sm">{item.label}</span>
              </NavLink>
            );
        })}
      </nav>
      <div className="pt-8 border-t border-slate-50">
        <button onClick={logout} className="flex items-center gap-4 px-6 py-4 w-full rounded-[20px] text-slate-400 hover:bg-red-50 hover:text-red-600">로그아웃</button>
      </div>
    </aside>
  );
};

export default Sidebar;
