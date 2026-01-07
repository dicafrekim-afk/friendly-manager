
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { dataService } from '../services/dataService';
import { isSupabaseConfigured } from '../lib/supabase';

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await dataService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (id: string, newStatus: 'APPROVED' | 'REJECTED', e: React.MouseEvent) => {
    e.stopPropagation();
    await dataService.updateUserStatus(id, newStatus);
    await fetchUsers();
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    await dataService.updateUser(editingUser.id, {
      role: editingUser.role,
      totalLeave: editingUser.totalLeave,
      usedLeave: editingUser.usedLeave
    });
    
    setEditingUser(null);
    await fetchUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-4">
      {/* Database Connection Status Bar */}
      <div className="flex items-center justify-center">
        {isSupabaseConfigured ? (
          <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Database: Cloud (Supabase) Connected</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-8 py-4 bg-amber-50 border border-amber-100 rounded-[24px]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-xs font-black text-amber-700 uppercase tracking-widest">Database: Local Storage Mode</span>
            </div>
            <p className="text-[10px] text-amber-600 font-medium text-center">
              현재 브라우저에만 데이터가 저장됩니다. 팀 공유를 위해 Vercel에 환경 변수를 설정하세요.
            </p>
          </div>
        )}
      </div>

      {/* Invite Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[40px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black mb-4 tracking-tight">팀원들을 초대하세요! 🚀</h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              아래 주소를 팀원들에게 공유하고 가입을 요청하세요. <br className="hidden md:block"/>
              팀원들이 가입하면 이 페이지 하단에서 승인할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 pl-6 rounded-2xl border border-white/10 min-w-[300px]">
              <span className="text-xs font-mono text-slate-300 truncate max-w-[180px]">{window.location.origin}</span>
              <button 
                onClick={handleCopyLink}
                className={`ml-auto px-6 py-3 rounded-xl font-black text-xs transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-indigo-50'}`}
              >
                {copied ? '복사됨!' : '링크 복사'}
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">팀원 관리</h1>
          <p className="text-slate-400 font-medium mt-2">전체 팀원의 프로필, 권한 및 연차 현황을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-emerald-500 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Active Users: {users.filter(u => u.status === 'APPROVED').length}명
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map(u => (
          <div 
            key={u.id} 
            onClick={() => setEditingUser(u)}
            className="group bg-white p-8 rounded-[32px] shadow-xl shadow-slate-100/50 border border-slate-50 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-500 cursor-pointer relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                  {u.name.charAt(0)}
                </div>
                {u.role === 'ADMIN' ? (
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100 uppercase tracking-widest">Admin</span>
                ) : (
                  <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-full border border-slate-100 uppercase tracking-widest">User</span>
                )}
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-1">{u.name}</h3>
              <p className="text-xs font-bold text-slate-400 mb-6">{u.email}</p>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">잔여 연차</p>
                  <p className="text-lg font-black text-slate-900">{u.totalLeave - u.usedLeave} / {u.totalLeave} <span className="text-xs opacity-50">days</span></p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-white shadow-sm flex items-center justify-center bg-white">
                  <span className="text-[10px] font-black text-indigo-600">{Math.round(((u.totalLeave - u.usedLeave) / u.totalLeave) * 100)}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                {u.status === 'PENDING' ? (
                  <button 
                    onClick={(e) => handleStatusChange(u.id, 'APPROVED', e)} 
                    className="flex-1 py-3 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    가입 승인
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl border border-emerald-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    활동 중
                  </div>
                )}
                <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-400">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">상세 프로필 설정</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">팀원 정보 및 연차 한도를 조정합니다.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-3 bg-white shadow-md rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-10 space-y-8">
              <div className="flex items-center gap-6 p-6 bg-indigo-50 rounded-[32px]">
                <div className="w-20 h-20 rounded-[24px] bg-white flex items-center justify-center text-indigo-600 font-black text-3xl shadow-lg shadow-indigo-100">
                  {editingUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{editingUser.name}</p>
                  <p className="text-sm font-bold text-slate-400">{editingUser.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">계정 권한 설정</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setEditingUser({...editingUser, role: 'USER'})}
                    className={`p-5 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${
                      editingUser.role === 'USER' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-400'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="font-black text-sm">일반 사용자</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingUser({...editingUser, role: 'ADMIN'})}
                    className={`p-5 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${
                      editingUser.role === 'ADMIN' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 bg-white text-slate-400'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944a11.955 11.955 0 01-8.618 3.04m17.236 0L12 21l-8.618-14.96" /></svg>
                    <span className="font-black text-sm">시스템 관리자</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">전체 연차 부여</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={editingUser.totalLeave}
                      onChange={(e) => setEditingUser({...editingUser, totalLeave: Number(e.target.value)})}
                      className="w-full px-6 py-5 rounded-[24px] border-2 border-slate-100 bg-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-black text-xl text-center"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">DAYS</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">현재 사용량 수정</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={editingUser.usedLeave}
                      onChange={(e) => setEditingUser({...editingUser, usedLeave: Number(e.target.value)})}
                      className="w-full px-6 py-5 rounded-[24px] border-2 border-slate-100 bg-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-black text-xl text-center"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">USED</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-5 text-sm font-black text-slate-400 bg-slate-100 rounded-[24px] hover:bg-slate-200 transition-all"
                >
                  취소하기
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 text-sm font-black text-white bg-indigo-600 rounded-[24px] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                >
                  설정 완료 및 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
