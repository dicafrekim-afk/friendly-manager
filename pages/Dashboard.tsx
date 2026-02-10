
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LeaveRequest, Meeting } from '../types';
import { dataService } from '../services/dataService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const session = localStorage.getItem('friendly_current_session');
    if (session) setCurrentUser(JSON.parse(session));
    try {
      const [reqs, users] = await Promise.all([dataService.getRequests(), dataService.getUsers()]);
      setAllRequests(reqs);
      setAllUsers(users);
      // 최신 사용자 정보 동기화
      if (session) {
        const u = JSON.parse(session);
        const freshUser = users.find(x => x.id === u.id);
        if (freshUser) setCurrentUser(freshUser);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading || !currentUser) return <div className="p-20 text-center">로딩 중...</div>;

  const remainingExtra = (currentUser.extraLeaveAvailable || 0) - (currentUser.extraLeaveUsed || 0);

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-indigo-600 p-8 md:p-16 text-white shadow-2xl">
        <h1 className="text-3xl md:text-5xl font-black mb-4">{currentUser.name}님, 환영합니다!</h1>
        <p className="text-indigo-100/80 mb-8">친절한 휴가 관리를 도와드릴게요.</p>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => navigate('/apply')} className="px-8 py-4 bg-white text-indigo-600 rounded-[20px] font-black text-sm shadow-xl">휴가 신청</button>
          <button onClick={() => navigate('/extra-work')} className="px-8 py-4 bg-indigo-500/40 text-white rounded-[20px] font-black text-sm border border-white/20 hover:bg-indigo-500/60">근무 보고</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 일반 연차 */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">잔여 연차</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-black text-slate-900">{currentUser.totalLeave - currentUser.usedLeave}</span>
            <span className="text-sm font-bold text-slate-400">/ {currentUser.totalLeave}d</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-indigo-600 h-full" style={{ width: `${((currentUser.totalLeave - currentUser.usedLeave) / currentUser.totalLeave) * 100}%` }}></div>
          </div>
        </div>

        {/* 보상 휴가 (신규) */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
             <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">보상 휴가 잔여</p>
             <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[8px] font-black rounded-full uppercase">Reward</span>
          </div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-black text-slate-900">{remainingExtra}</span>
            <span className="text-sm font-bold text-slate-400">/ {currentUser.extraLeaveAvailable || 0}d</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-violet-500 h-full" style={{ width: remainingExtra > 0 ? `${(remainingExtra / (currentUser.extraLeaveAvailable || 1)) * 100}%` : '0%' }}></div>
          </div>
        </div>

        {/* 대기 건수 */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">대기 중인 신청</p>
          <div className="text-5xl font-black text-slate-900 mb-6">{allRequests.filter(r => r.userId === currentUser.id && r.status.startsWith('PENDING')).length} <span className="text-sm text-slate-400">건</span></div>
          <p className="text-[10px] font-bold text-slate-400">관리자 승인 시 알림이 발송됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
