
import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { dataService } from '../services/dataService';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await dataService.getNotifications(user.id);
      setNotifications(data);
    };
    fetchNotifications();

    // 5초마다 새로운 알림이 있는지 체크 (간이 실시간)
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
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4 lg:hidden">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-4 hidden sm:block">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="검색어 입력..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">알림</h3>
                <span className="text-[10px] text-slate-400 font-medium">최근 알림 순</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors relative ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                  >
                    {!notif.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>}
                    <p className="text-sm font-medium text-slate-900 ml-2">{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 ml-2">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2 ml-2">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm italic">새로운 알림이 없습니다.</div>
                )}
              </div>
              <button className="w-full py-3 text-xs text-indigo-600 font-medium hover:bg-indigo-50 transition-colors border-t border-slate-50">
                모든 알림 보기
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-slate-200">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role === 'ADMIN' ? '관리자' : '사용자'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
