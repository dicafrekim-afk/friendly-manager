
import React from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../types';

interface SidebarProps {
  user: User;
  logout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, logout }) => {
  const navItems = [
    { to: '/', label: '대시보드', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { to: '/apply', label: '휴가/출장 신청', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    { to: '/meetings', label: '회의 예약', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
  ];

  const adminItems = [
    { to: '/admin/requests', label: '신청 승인 관리', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { to: '/admin/users', label: '팀원 관리', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col h-screen sticky top-0 p-8">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <span className="text-2xl font-black tracking-tighter text-slate-900 block leading-none">Friendly</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Better Life</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 px-4">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-300 group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {item.icon}
            </svg>
            <span className="font-bold text-sm">{item.label}</span>
          </NavLink>
        ))}

        {user.role === 'ADMIN' && (
          <>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-10 mb-4 px-4">Admin</div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-300 group ${
                    isActive 
                      ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-50 shadow-emerald-100 translate-x-1' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                <span className="font-bold text-sm">{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="pt-8 border-t border-slate-50">
        <button
          onClick={logout}
          className="flex items-center gap-4 px-6 py-4 w-full rounded-[20px] text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-bold text-sm">로그아웃</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
