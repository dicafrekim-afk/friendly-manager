
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LeaveRequest, LeaveType } from '../types';
import { dataService } from '../services/dataService';
import { LEAVE_TYPE_COLORS, LEAVE_TYPE_LABELS } from '../constants';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 캘린더 상태
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    const session = localStorage.getItem('friendly_current_session');
    if (session) setCurrentUser(JSON.parse(session));
    try {
      const [reqs, users] = await Promise.all([dataService.getRequests(), dataService.getUsers()]);
      // 승인된 요청만 캘린더에 표시
      setAllRequests(reqs.filter(r => r.status === 'APPROVED' || r.status === 'PENDING_FINAL' || r.status === 'PENDING_PL'));
      
      if (session) {
        const u = JSON.parse(session);
        const freshUser = users.find(x => x.id === u.id);
        if (freshUser) setCurrentUser(freshUser);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 캘린더 로직
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // 이전 달 공백
    for (let i = 0; i < firstDay; i++) days.push(null);
    // 현재 달 날짜
    for (let i = 1; i <= lastDate; i++) days.push(i);
    
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const getRequestsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allRequests.filter(req => dateStr >= req.startDate && dateStr <= req.endDate);
  };

  if (loading || !currentUser) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const remainingExtra = (currentUser.extraLeaveAvailable || 0) - (currentUser.extraLeaveUsed || 0);

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      {/* 상단 웰컴 배너 */}
      <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-indigo-600 p-8 md:p-16 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4">{currentUser.name}님, 환영합니다!</h1>
          <p className="text-indigo-100/80 mb-8 font-medium">친절한 휴가 관리를 도와드릴게요.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/apply')} className="px-8 py-4 bg-white text-indigo-600 rounded-[20px] font-black text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95">휴가 신청</button>
            <button onClick={() => navigate('/extra-work')} className="px-8 py-4 bg-indigo-500/40 text-white rounded-[20px] font-black text-sm border border-white/20 hover:bg-indigo-500/60 transition-all active:scale-95">근무 보고</button>
          </div>
        </div>
        {/* 장식용 원형 소스 */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* 요약 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">잔여 연차</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-black text-slate-900">{currentUser.totalLeave - currentUser.usedLeave}</span>
            <span className="text-sm font-bold text-slate-400">/ {currentUser.totalLeave}d</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${((currentUser.totalLeave - currentUser.usedLeave) / currentUser.totalLeave) * 100}%` }}></div>
          </div>
        </div>

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
             <div className="bg-violet-500 h-full transition-all duration-1000" style={{ width: remainingExtra > 0 ? `${(remainingExtra / (currentUser.extraLeaveAvailable || 1)) * 100}%` : '0%' }}></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">대기 중인 신청</p>
          <div className="text-5xl font-black text-slate-900 mb-6">{allRequests.filter(r => r.userId === currentUser.id && r.status.startsWith('PENDING')).length} <span className="text-sm text-slate-400">건</span></div>
          <p className="text-[10px] font-bold text-slate-400">관리자 승인 시 알림이 발송됩니다.</p>
        </div>
      </div>

      {/* 캘린더 섹션 (추가됨) */}
      <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-2xl font-black text-slate-900">월간 일정</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">팀원들의 부재 일정을 미리 확인하세요.</p>
          </div>
          <div className="flex items-center bg-slate-100 p-1.5 rounded-[20px]">
            <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-white rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg></button>
            <span className="px-6 text-sm font-black text-slate-900 min-w-[120px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button onClick={() => changeMonth(1)} className="p-3 hover:bg-white rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-4">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-400' : i === 6 ? 'text-indigo-400' : 'text-slate-300'}`}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-50 rounded-3xl overflow-hidden border border-slate-50">
          {calendarDays.map((day, idx) => {
            const reqs = day ? getRequestsForDate(day) : [];
            const isToday = day && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
            
            return (
              <div key={idx} className={`min-h-[100px] md:min-h-[140px] bg-white p-2 md:p-4 group transition-colors hover:bg-slate-50/50 ${!day ? 'bg-slate-50/30' : ''}`}>
                {day && (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-black ${isToday ? 'w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center' : 'text-slate-400 group-hover:text-slate-900'}`}>
                        {day}
                      </span>
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      {reqs.slice(0, 4).map(req => (
                        <div key={req.id} className={`px-2 py-1 rounded-md text-[9px] font-bold truncate border ${LEAVE_TYPE_COLORS[req.type]} opacity-90`}>
                          {req.userName} {req.type === 'HALF_DAY' ? (req.halfDayType === 'MORNING' ? '오전' : '오후') : ''}
                        </div>
                      ))}
                      {reqs.length > 4 && (
                        <div className="text-[8px] font-black text-slate-300 pl-1">+{reqs.length - 4} 더보기</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
