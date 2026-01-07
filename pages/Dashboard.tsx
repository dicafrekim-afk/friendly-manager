
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LeaveRequest, Meeting } from '../types';
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_COLORS } from '../constants';
import { dataService } from '../services/dataService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const session = localStorage.getItem('friendly_current_session');
      if (session) setCurrentUser(JSON.parse(session));
      const [reqs, meetings] = await Promise.all([dataService.getRequests(), dataService.getMeetings()]);
      setAllRequests(reqs);
      setAllMeetings(meetings);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !currentUser) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const myRequests = allRequests.filter(r => r.userId === currentUser.id);
  const approvedRequests = allRequests.filter(r => r.status === 'APPROVED');
  const leavePercentage = (currentUser.usedLeave / currentUser.totalLeave) * 100;
  const remainingLeave = currentUser.totalLeave - currentUser.usedLeave;

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[48px] bg-gradient-to-br from-indigo-700 via-violet-600 to-indigo-800 p-12 md:p-16 text-white shadow-2xl shadow-indigo-200/50">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-[20px] bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-inner">
              <span className="text-2xl font-black">👋</span>
            </div>
            <div>
              <p className="text-indigo-100 font-bold uppercase tracking-[0.2em] text-[10px]">Current Status: Online</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">{currentUser.name}님, 환영합니다!</h1>
            </div>
          </div>
          <p className="text-xl text-indigo-100 font-medium opacity-80 mb-10 max-w-xl leading-relaxed">
            나의 연차를 효율적으로 관리하고 팀원들의 일정을 <br className="hidden md:block"/>실시간으로 확인하여 더 나은 라이프를 즐기세요.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/apply')} className="px-8 py-4 bg-white text-indigo-700 rounded-full font-black shadow-xl hover:scale-105 active:scale-95 transition-all">휴가 신청하기</button>
            <button onClick={() => navigate('/meetings')} className="px-8 py-4 bg-indigo-500/30 backdrop-blur-md text-white rounded-full font-black border border-white/20 hover:bg-indigo-500/50 transition-all">회의 예약</button>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
        <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-100/50 border border-slate-50 relative group">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">내 연차 현황</p>
          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-6xl font-black text-slate-900 tracking-tighter">{remainingLeave}</span>
            <span className="text-lg font-bold text-slate-400">/ {currentUser.totalLeave} days</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full shadow-lg" style={{ width: `${Math.max(10, 100 - leavePercentage)}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-100/50 border border-slate-50">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">승인 대기 건</p>
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-black text-slate-900 tracking-tighter">{myRequests.filter(r => r.status === 'PENDING').length}</span>
            <span className="text-lg font-bold text-slate-400">cases</span>
          </div>
          <div className="mt-8 flex gap-2">
             {myRequests.filter(r => r.status === 'PENDING').slice(0, 3).map((_,i) => <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>)}
          </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-100/50 border border-slate-50">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">참석 예정 회의</p>
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-black text-slate-900 tracking-tighter">{allMeetings.filter(m => m.participants.includes(currentUser.id)).length}</span>
            <span className="text-lg font-bold text-slate-400">meetings</span>
          </div>
          <div className="mt-8 flex -space-x-3">
            {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">U{i}</div>)}
          </div>
        </div>
      </div>

      {/* Main Timeline Calendar */}
      <div className="bg-white p-12 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-50">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">팀 타임라인</h2>
            <p className="text-slate-400 font-medium mt-2">서버와 동기화된 실시간 일정 정보입니다.</p>
          </div>
          <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-[24px] shadow-inner">
            <button onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="p-4 hover:bg-white hover:shadow-lg rounded-2xl transition-all text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg></button>
            <span className="text-xl font-black text-slate-900 min-w-[140px] text-center">{viewYear}. {String(viewMonth + 1).padStart(2, '0')}</span>
            <button onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="p-4 hover:bg-white hover:shadow-lg rounded-2xl transition-all text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-[40px] overflow-hidden shadow-inner">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d} className="bg-slate-50/80 py-6 text-center text-xs font-black text-slate-400 tracking-[0.2em]">{d}</div>)}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} className="bg-slate-50/20 calendar-cell"></div>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = approvedRequests.filter(r => dateStr >= r.startDate && dateStr <= r.endDate);
            const dayMeetings = allMeetings.filter(m => m.startTime.startsWith(dateStr));
            const isToday = new Date().toDateString() === new Date(viewYear, viewMonth, day).toDateString();
            return (
              <div key={i} className="bg-white calendar-cell p-4 flex flex-col gap-2 border-b border-r border-slate-50 last:border-r-0 hover:bg-indigo-50/30 transition-all group overflow-hidden">
                <span className={`text-sm font-black transition-all ${isToday ? 'bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 scale-110' : 'text-slate-400 group-hover:text-indigo-600'}`}>{day}</span>
                <div className="space-y-2 overflow-y-auto max-h-[80px] scrollbar-hide pt-1">
                  {dayEvents.map((ev, idx) => (
                    <div key={`ev-${idx}`} className={`text-[10px] px-3 py-2 rounded-2xl font-black flex items-center gap-2 shadow-sm transition-all hover:scale-105 ${LEAVE_TYPE_COLORS[ev.type].split(' border')[0]} text-opacity-90`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-60 shrink-0"></span>
                      <span className="truncate">{ev.userName}</span>
                    </div>
                  ))}
                  {dayMeetings.map((mt, idx) => (
                    <div key={`mt-${idx}`} className="text-[10px] px-3 py-2 rounded-2xl bg-violet-600 text-white truncate font-black flex items-center gap-2 shadow-lg shadow-violet-100 transition-all hover:scale-105">
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      <span className="truncate">{mt.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
