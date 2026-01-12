
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

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = approvedRequests
    .filter(r => r.endDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5);

  const myPendingCount = allRequests.filter(r => r.userId === currentUser.id && r.status.startsWith('PENDING')).length;

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-center animate-pulse">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-amber-600 uppercase">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Offline Local Mode
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-indigo-600 p-8 md:p-16 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{currentUser.name}님, 환영합니다!</h1>
          <p className="text-indigo-100/80 text-sm md:text-lg mb-8 md:mb-10 max-w-lg leading-relaxed">오늘은 어떤 계획이 있으신가요? <br/>동료들의 부재 정보를 타임라인에서 확인해보세요.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/apply')} className="px-8 md:px-10 py-4 bg-white text-indigo-600 rounded-[20px] font-black text-sm md:text-base hover:scale-105 transition-all shadow-xl">신청하기</button>
            <button onClick={() => navigate('/meetings')} className="px-8 md:px-10 py-4 bg-indigo-500/40 text-white rounded-[20px] font-black text-sm md:text-base border border-white/20 hover:bg-indigo-500/60 transition-all">회의 예약</button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">잔여 연차</p>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full">YEARLY PLAN</span>
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">{remainingLeave}</span>
                <span className="text-sm font-bold text-slate-400">/ {currentUser.totalLeave} days</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(remainingLeave / currentUser.totalLeave) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">진행 중인 신청</p>
              <div className={`w-3 h-3 rounded-full ${myPendingCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'}`}></div>
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">{myPendingCount}</span>
                <span className="text-sm font-bold text-slate-400">건의 대기 중</span>
              </div>
              <p className="mt-4 text-[12px] font-bold text-slate-400 leading-relaxed">관리자 승인이 완료되면 <br/>푸시 알림으로 알려드려요.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="text-base font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            다가오는 팀 일정
          </h3>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
              <div key={event.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[24px] transition-all group border border-transparent hover:border-slate-100">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-sm ${LEAVE_TYPE_COLORS[event.type].split(' border')[0]}`}>
                  {event.userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{event.userName}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">{event.startDate.replace(/-/g, '.')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black border tracking-tighter whitespace-nowrap ${LEAVE_TYPE_COLORS[event.type]}`}>
                  {LEAVE_TYPE_LABELS[event.type]}
                </span>
              </div>
            )) : (
              <div className="py-14 text-center">
                <p className="text-sm font-bold text-slate-300 italic">현재 잡힌 일정이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Timeline Calendar */}
      <div className="bg-white p-6 md:p-12 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">팀 타임라인</h2>
          </div>
          
          <div className="flex items-center gap-6 bg-slate-50 p-2.5 rounded-[24px] border border-slate-100">
            <button onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg></button>
            <span className="text-base font-black text-slate-900 min-w-[120px] text-center">{viewYear}년 {viewMonth + 1}월</span>
            <button onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 bg-slate-100">
          <div className="grid grid-cols-7 gap-px">
            {/* Calendar Week Headers */}
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
              <div key={d} className={`bg-slate-50/90 py-5 text-center text-[10px] md:text-[11px] font-black tracking-[0.2em] border-b border-slate-100 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'}`}>
                {d}
              </div>
            ))}

            {/* Empty Cells for First Week */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50/30 min-h-[140px]"></div>
            ))}

            {/* Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = approvedRequests.filter(r => dateStr >= r.startDate && dateStr <= r.endDate);
              const dayMeetings = allMeetings.filter(m => m.startTime.startsWith(dateStr));
              const isToday = new Date().toDateString() === new Date(viewYear, viewMonth, day).toDateString();
              const isWeekend = (firstDayOfMonth + i) % 7 === 0 || (firstDayOfMonth + i) % 7 === 6;
              
              return (
                <div key={i} className={`bg-white min-h-[140px] p-3 md:p-4 flex flex-col gap-3 border-b border-r border-slate-50 last:border-r-0 hover:bg-indigo-50/20 transition-all duration-300 group ${isWeekend ? 'bg-slate-50/20' : ''}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-xs md:text-sm font-black transition-all flex items-center justify-center ${
                      isToday 
                        ? 'bg-indigo-600 text-white w-7 h-7 md:w-9 md:h-9 rounded-xl shadow-lg shadow-indigo-200 scale-110' 
                        : (firstDayOfMonth + i) % 7 === 0 ? 'text-red-400' : (firstDayOfMonth + i) % 7 === 6 ? 'text-blue-400' : 'text-slate-300 group-hover:text-slate-900'
                    }`}>
                      {day}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 overflow-hidden">
                    {/* Approved Requests (Vacation/Trip) */}
                    {dayEvents.map((ev, idx) => (
                      <div 
                        key={`ev-${idx}`} 
                        className={`text-[9px] md:text-[11px] px-2.5 py-1.5 rounded-xl font-black truncate leading-none shadow-sm border border-white/50 transition-transform hover:scale-[1.02] cursor-default ${LEAVE_TYPE_COLORS[ev.type].split(' border')[0]}`}
                      >
                        <span className="opacity-60 mr-1">●</span> {ev.userName}
                      </div>
                    ))}
                    
                    {/* Meetings */}
                    {dayMeetings.map((mt, idx) => (
                      <div 
                        key={`mt-${idx}`} 
                        className="text-[9px] md:text-[11px] px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white truncate font-black leading-none shadow-md shadow-indigo-100 flex items-center gap-1.5 hover:bg-indigo-700 transition-colors cursor-default"
                        title={mt.title}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></div>
                        <span className="truncate">{mt.title.includes(']') ? mt.title.split(']')[1].trim() : mt.title}</span>
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
