
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LeaveRequest, Meeting } from '../types';
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_COLORS } from '../constants';
import { dataService } from '../services/dataService';
import { isSupabaseConfigured } from '../lib/supabase';

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
      
      try {
        const [reqs, meetings] = await Promise.all([dataService.getRequests(), dataService.getMeetings()]);
        setAllRequests(reqs);
        setAllMeetings(meetings);
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
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

  // 다가오는 일정 필터링 (오늘 이후 5건)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = approvedRequests
    .filter(r => r.endDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5);

  const myPendingCount = allRequests.filter(r => r.userId === currentUser.id && r.status.startsWith('PENDING')).length;

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      {/* Cloud Sync Status */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-center animate-pulse">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-amber-600 uppercase">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Offline Local Mode
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-indigo-600 p-8 md:p-16 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{currentUser.name}님, 환영합니다!</h1>
          <p className="text-indigo-100/80 text-sm md:text-lg mb-8 max-w-md leading-relaxed">오늘은 어떤 계획이 있으신가요? <br/>동료들의 부재 정보를 한눈에 확인해보세요.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/apply')} className="px-8 py-3 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg">신청하기</button>
            <button onClick={() => navigate('/meetings')} className="px-8 py-3 bg-indigo-500/40 text-white rounded-2xl font-black text-sm border border-white/20 hover:bg-indigo-500/60 transition-all">회의 예약</button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Stats Section */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">잔여 연차</p>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg">YEARLY</span>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{remainingLeave}</span>
              <span className="text-xs font-bold text-slate-400">/ {currentUser.totalLeave} days</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${(remainingLeave / currentUser.totalLeave) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">진행 중인 신청</p>
              <div className={`w-2 h-2 rounded-full ${myPendingCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'}`}></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{myPendingCount}</span>
              <span className="text-xs font-bold text-slate-400">건의 대기 내역</span>
            </div>
            <p className="mt-4 text-[11px] font-bold text-slate-400">승인이 완료되면 알림으로 알려드릴게요.</p>
          </div>
        </div>

        {/* Quick List Section */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            다가오는 팀 일정
          </h3>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
              <div key={event.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${LEAVE_TYPE_COLORS[event.type].split(' border')[0]}`}>
                  {event.userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">{event.userName}</p>
                  <p className="text-[10px] font-bold text-slate-400">{event.startDate} ~ {event.endDate}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[8px] font-black border tracking-tighter whitespace-nowrap ${LEAVE_TYPE_COLORS[event.type]}`}>
                  {LEAVE_TYPE_LABELS[event.type]}
                </span>
              </div>
            )) : (
              <div className="py-10 text-center text-[11px] font-bold text-slate-300 italic">현재 다가오는 일정이 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Calendar View */}
      <div className="bg-white p-6 md:p-12 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">팀 타임라인</h2>
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
            <button onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg></button>
            <span className="text-sm font-black text-slate-900 min-w-[100px] text-center">{viewYear}년 {viewMonth + 1}월</span>
            <button onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
          <div className="min-w-[700px] grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} className={`bg-slate-50/80 py-4 text-center text-[9px] font-black tracking-[0.2em] border-b border-slate-100 ${d === 'SUN' ? 'text-red-300' : d === 'SAT' ? 'text-blue-300' : 'text-slate-400'}`}>
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} className="bg-slate-50/20 h-24 sm:h-32"></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = approvedRequests.filter(r => dateStr >= r.startDate && dateStr <= r.endDate);
              const dayMeetings = allMeetings.filter(m => m.startTime.startsWith(dateStr));
              const isToday = new Date().toDateString() === new Date(viewYear, viewMonth, day).toDateString();
              
              return (
                <div key={i} className={`bg-white h-24 sm:h-32 p-2 flex flex-col gap-1.5 border-b border-r border-slate-50 last:border-r-0 hover:bg-indigo-50/30 transition-all duration-300`}>
                  <span className={`text-[10px] font-black transition-all ${isToday ? 'bg-indigo-600 text-white w-6 h-6 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  <div className="space-y-1 overflow-y-auto max-h-[60px] md:max-h-[85px] scrollbar-hide">
                    {dayEvents.map((ev, idx) => (
                      <div key={`ev-${idx}`} className={`text-[8px] md:text-[9px] px-2 py-1 rounded-lg font-black truncate leading-tight shadow-sm border border-white/50 ${LEAVE_TYPE_COLORS[ev.type].split(' border')[0]}`}>
                        {ev.userName}
                      </div>
                    ))}
                    {dayMeetings.map((mt, idx) => (
                      <div key={`mt-${idx}`} className="text-[8px] md:text-[9px] px-2 py-1 rounded-lg bg-violet-600 text-white truncate font-black leading-tight shadow-sm flex items-center gap-1">
                        <span className="shrink-0">●</span> {mt.title}
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
