
import React, { useState, useEffect } from 'react';
import { User, Role, Team } from '../types';
import { dataService } from '../services/dataService';
import { isSupabaseConfigured } from '../lib/supabase';

const SUPER_ADMIN_EMAIL = 'dicafrekim@naver.com';
const TEAMS: Team[] = ['공채', '경채', '특정직', '공통'];

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
    
    // Explicitly update all fields to ensure persistence
    await dataService.updateUser(editingUser.id, {
      role: editingUser.role,
      position: editingUser.position,
      team: editingUser.team,
      totalLeave: editingUser.totalLeave,
      usedLeave: editingUser.usedLeave,
      status: editingUser.status
    });
    
    setEditingUser(null);
    await fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    if (editingUser.email === SUPER_ADMIN_EMAIL) {
      alert('최고관리자 계정은 삭제할 수 없습니다.');
      return;
    }
    
    if (window.confirm(`${editingUser.name} 님을 정말 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.`)) {
      await dataService.deleteUser(editingUser.id);
      setEditingUser(null);
      await fetchUsers();
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-10 px-2">
      {/* Database Status Bar */}
      <div className="flex justify-center">
        <div className={`px-4 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${isSupabaseConfigured ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
          {isSupabaseConfigured ? '● Cloud DB Connected' : '○ Local Storage Mode'}
        </div>
      </div>

      <div className="flex items-end justify-between px-2">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">팀원 관리</h1>
        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
          Total: {users.length}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {users.map(u => {
          const isSuperAdmin = u.email === SUPER_ADMIN_EMAIL;
          return (
            <div 
              key={u.id} 
              onClick={() => setEditingUser(u)}
              className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-50 hover:shadow-xl transition-all cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-black">
                  {u.name.charAt(0)}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 text-[9px] font-black rounded-full border tracking-widest ${
                    isSuperAdmin ? 'bg-slate-900 text-white border-slate-900' :
                    u.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {isSuperAdmin ? 'SUPER ADMIN' : u.role === 'ADMIN' ? 'PL' : 'USER'}
                  </span>
                  <span className="px-2 py-1 text-[8px] font-black bg-slate-100 text-slate-500 rounded-lg">{u.team || '공통'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-slate-900">{u.name}</h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{u.position || '팀원'}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mb-6 truncate">{u.email}</p>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl mb-6">
                <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">잔여 연차</p>
                  <p className="text-md font-black text-slate-900">{u.totalLeave - u.usedLeave} / {u.totalLeave}d</p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-white text-[9px] font-black text-indigo-600">
                  {Math.round(((u.totalLeave - (u.usedLeave || 0)) / u.totalLeave) * 100)}%
                </div>
              </div>

              <div className="flex gap-2">
                {u.status === 'PENDING' ? (
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={(e) => handleStatusChange(u.id, 'APPROVED', e)} 
                      className="flex-1 py-3 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      승인
                    </button>
                    <button 
                      onClick={(e) => handleStatusChange(u.id, 'REJECTED', e)} 
                      className="flex-1 py-3 bg-slate-100 text-slate-500 text-[10px] font-black rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      반려
                    </button>
                  </div>
                ) : (
                  <div className={`flex-1 flex items-center justify-center gap-1 py-3 text-[10px] font-black rounded-xl ${
                    u.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {u.status === 'APPROVED' ? '승인 완료' : '반려됨'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 duration-400 max-h-[90vh] flex flex-col scrollbar-hide">
            <div className="p-6 md:p-8 border-b flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-black text-slate-900">상세 설정</h3>
              <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 md:p-8 space-y-6 overflow-y-auto scrollbar-hide">
              <div className="flex items-center gap-4 p-5 bg-indigo-50 rounded-3xl">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm">{editingUser.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black text-slate-900">{editingUser.name}</p>
                    {editingUser.email === SUPER_ADMIN_EMAIL && (
                      <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-full">SUPER ADMIN</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 truncate">{editingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">직급</label>
                  <input 
                    type="text" 
                    value={editingUser.position} 
                    onChange={(e) => setEditingUser({...editingUser, position: e.target.value})}
                    placeholder="예: 대리"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">소속 팀</label>
                  <select 
                    value={editingUser.team}
                    onChange={(e) => setEditingUser({...editingUser, team: e.target.value as Team})}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-black appearance-none transition-all cursor-pointer"
                  >
                    {TEAMS.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editingUser.email !== SUPER_ADMIN_EMAIL && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">권한 설정</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setEditingUser({...editingUser, role: 'USER'})} className={`py-4 rounded-2xl border-2 text-[11px] font-black transition-all ${editingUser.role === 'USER' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>USER (팀원)</button>
                    <button type="button" onClick={() => setEditingUser({...editingUser, role: 'ADMIN'})} className={`py-4 rounded-2xl border-2 text-[11px] font-black transition-all ${editingUser.role === 'ADMIN' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>PL (팀장)</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">부여 연차</label>
                  <input type="number" value={editingUser.totalLeave} onChange={(e) => setEditingUser({...editingUser, totalLeave: Number(e.target.value)})} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none text-sm font-black text-center" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">사용량</label>
                  <input type="number" value={editingUser.usedLeave} onChange={(e) => setEditingUser({...editingUser, usedLeave: Number(e.target.value)})} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none text-sm font-black text-center" />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 shrink-0 pb-2">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 text-xs font-black text-slate-400 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">취소</button>
                  <button type="submit" className="flex-1 py-4 text-xs font-black text-white bg-indigo-600 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all">정보 저장</button>
                </div>
                
                {editingUser.email !== SUPER_ADMIN_EMAIL && (
                  <button 
                    type="button" 
                    onClick={handleDeleteUser}
                    className="w-full py-4 text-xs font-black text-red-400 border-2 border-red-50 hover:bg-red-50 hover:text-red-600 transition-all rounded-2xl mt-2 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    팀원 삭제 (퇴사 처리)
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
