
import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { dataService } from '../services/dataService';

interface HeaderProps {
  user: User;
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuToggle }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await dataService.getNotifications(user.id);
      setNotifications(data);
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleMarkAsRead = async (id: string) => {
    await dataService.markAsRead(id);
    const data = await dataService.getNotifications(user.id);
    setNotifications(data);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 md:h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <div className="lg:hidden flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black">F</div>
           <span className="font-black tracking-tighter text-slate-900 sm:inline hidden">Friendly</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search team..."
            className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors relative"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-[280px] md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">알림</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(notif => (
                  <div key={notif.id} onClick={() => handleMarkAsRead(notif.id)} className={`p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors ${!notif.isRead ? 'bg-indigo-50/20' : ''}`}>
                    <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                  </div>
                ))}
                {notifications.length === 0 && <div className="p-8 text-center text-slate-400 text-xs italic">새 알림 없음</div>}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-slate-100">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-900">{user.name}</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
