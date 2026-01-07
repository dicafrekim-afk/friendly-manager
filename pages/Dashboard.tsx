
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

  if (loading || !currentUser) return <div className="flex items-center justify-center h-full pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const approvedRequests = allRequests.filter(r => r.status === 'APPROVED');
  const remainingLeave = currentUser.totalLeave - currentUser.usedLeave;

  return (
    <div className="space-y-6 md:space-y-12 pb-10">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl md:rounded-[48px] bg-gradient-to-br from-indigo-700 to-indigo-900 p-6 md:p-16 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">👋</div>
            <h1 className="text-2xl md:text-5xl font-black tracking-tight">{currentUser.name}님!</h1>
          </div>
          <p className="text-sm md:text-xl text-indigo-100 opacity-80 mb-8 max-w-lg">팀원들의 일정을 확인하고 <br/> 효율적인 휴가 관리를 시작하세요.</p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/apply')} className="px-6 py-3 bg-white text-indigo-700 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-transform">신청하기</button>
            <button onClick={() => navigate('/meetings')} className="px-6 py-3 bg-indigo-500/30 text-white rounded-2xl font-black text-sm border border-white/20 hover:bg-indigo-500/50">회의 예약</button>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">남은 연차</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{remainingLeave}</span>
            <span className="text-xs font-bold text-slate-400">/ {currentUser.totalLeave} days</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(remainingLeave / currentUser.totalLeave) * 100}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">내 신청 내역</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{allRequests.filter(r => r.userId === currentUser.id).length}</span>
            <span className="text-xs font-bold text-slate-400">건</span>
          </div>
        </div>
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">참석 예정 회의</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{allMeetings.filter(m => m.participants.includes(currentUser.id)).length}</span>
            <span className="text-xs font-bold text-slate-400">meetings</span>
          </div>
        </div>
      </div>

      {/* Timeline Calendar - Mobile Friendly with Horizontal Scroll */}
      <div className="bg-white p-4 md:p-12 rounded-3xl md:rounded-[48px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h2 className="text-xl md:text-3xl font-black text-slate-900">팀 타임라인</h2>
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
            <button onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="p-2 hover:bg-white rounded-xl text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg></button>
            <span className="text-sm md:text-lg font-black text-slate-900">{viewYear}. {String(viewMonth + 1).padStart(2, '0')}</span>
            <button onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="p-2 hover:bg-white rounded-xl text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>
        
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          <div className="min-w-[800px] grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d} className="bg-slate-50/80 py-4 text-center text-[10px] font-black text-slate-400 tracking-widest">{d}</div>)}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} className="bg-slate-50/20 h-24 md:h-32"></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = approvedRequests.filter(r => dateStr >= r.startDate && dateStr <= r.endDate);
              const dayMeetings = allMeetings.filter(m => m.startTime.startsWith(dateStr));
              const isToday = new Date().toDateString() === new Date(viewYear, viewMonth, day).toDateString();
              return (
                <div key={i} className="bg-white h-24 md:h-32 p-2 flex flex-col gap-1 border-b border-r border-slate-50 last:border-r-0 hover:bg-slate-50 transition-colors">
                  <span className={`text-[11px] font-black ${isToday ? 'bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center' : 'text-slate-400'}`}>{day}</span>
                  <div className="space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px] scrollbar-hide">
                    {dayEvents.map((ev, idx) => (
                      <div key={`ev-${idx}`} className={`text-[8px] md:text-[9px] px-2 py-1 rounded-md font-bold truncate ${LEAVE_TYPE_COLORS[ev.type].split(' border')[0]}`}>
                        {ev.userName}
                      </div>
                    ))}
                    {dayMeetings.map((mt, idx) => (
                      <div key={`mt-${idx}`} className="text-[8px] md:text-[9px] px-2 py-1 rounded-md bg-violet-600 text-white truncate font-bold">
                        🎥 {mt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
