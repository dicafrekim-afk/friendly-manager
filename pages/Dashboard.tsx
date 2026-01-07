
import React, { useState, useEffect } from 'react';
import { User, LeaveRequest, Meeting } from '../types';
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_COLORS } from '../constants';
import { dataService } from '../services/dataService';

const Dashboard: React.FC = () => {
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
      
      const [reqs, meetings] = await Promise.all([
        dataService.getRequests(),
        dataService.getMeetings()
      ]);
      setAllRequests(reqs);
      setAllMeetings(meetings);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const myRequests = allRequests.filter(r => r.userId === currentUser.id);
  const approvedRequests = allRequests.filter(r => r.status === 'APPROVED');

  const leavePercentage = (currentUser.usedLeave / currentUser.totalLeave) * 100;
  const remainingLeave = currentUser.totalLeave - currentUser.usedLeave;

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-indigo-700 via-violet-600 to-indigo-800 p-10 md:p-14 text-white shadow-2xl shadow-indigo-200/50">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            Welcome Back
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
            Life is Better with <br/>{currentUser.name}님
          </h1>
          <p className="text-indigo-100 text-lg font-medium opacity-90 mb-8">
            오늘은 {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}입니다. <br className="hidden md:block"/>
            팀원들과 함께 더 생산적인 하루를 만들어보세요.
          </p>
          <div className="flex gap-4">
            <div className="px-6 py-3 bg-white text-indigo-700 rounded-full font-bold shadow-lg hover:scale-105 transition-transform cursor-pointer">
              연차 신청하기
            </div>
            <div className="px-6 py-3 bg-indigo-500/30 backdrop-blur-sm text-white rounded-full font-bold border border-white/20 hover:bg-indigo-500/50 transition-all cursor-pointer">
              팀 일정 보기
            </div>
          </div>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-floating"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-100/50 border border-slate-50 flex flex-col justify-between group hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500">
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">남은 연차</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{remainingLeave}</span>
              <span className="text-slate-400 font-bold">days</span>
            </div>
          </div>
          <div className="mt-8">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.max(10, 100 - leavePercentage)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-100/50 border border-slate-50 group hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">진행 중인 신청</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-slate-900 tracking-tighter">{myRequests.filter(r => r.status === 'PENDING').length}</span>
            <span className="text-slate-400 font-bold">cases</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-100/50 border border-slate-50 group hover:shadow-2xl hover:shadow-violet-100/50 transition-all duration-500">
          <div className="w-12 h-12 bg-violet-50 text-violet-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">예정된 회의</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-slate-900 tracking-tighter">
              {allMeetings.filter(m => m.participants.includes(currentUser.id)).length}
            </span>
            <span className="text-slate-400 font-bold">meetings</span>
          </div>
        </div>
      </div>

      {/* Main Calendar Section */}
      <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">팀 타임라인</h2>
            <p className="text-slate-400 font-medium mt-1">{viewYear}년 {viewMonth + 1}월의 전체 팀 일정입니다.</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
            <button onClick={handlePrevMonth} className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="text-lg font-black text-slate-900 min-w-[120px] text-center">{viewYear}. {String(viewMonth + 1).padStart(2, '0')}</span>
            <button onClick={handleNextMonth} className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-[32px] overflow-hidden shadow-inner">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} className="bg-slate-50 py-4 text-center text-[11px] font-black text-slate-400 tracking-widest">{d}</div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`e-${i}`} className="bg-slate-50/20 calendar-cell"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = approvedRequests.filter(r => dateStr >= r.startDate && dateStr <= r.endDate);
            const dayMeetings = allMeetings.filter(m => m.startTime.startsWith(dateStr));
            const isToday = new Date().toDateString() === new Date(viewYear, viewMonth, day).toDateString();

            return (
              <div key={i} className="bg-white calendar-cell p-3 flex flex-col gap-1.5 border-b border-r border-slate-50 last:border-r-0 hover:bg-indigo-50/30 transition-all group overflow-hidden">
                <span className={`text-xs font-black ${isToday ? 'bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200' : 'text-slate-400 group-hover:text-indigo-600'}`}>{day}</span>
                <div className="space-y-1.5 overflow-y-auto max-h-[70px] scrollbar-hide pt-1">
                  {dayEvents.map((ev, idx) => (
                    <div 
                      key={`ev-${idx}`} 
                      className={`text-[10px] px-2 py-1.5 rounded-xl border-none truncate font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 ${LEAVE_TYPE_COLORS[ev.type].split(' border')[0]} text-opacity-90`}
                      title={`${ev.userName} (${LEAVE_TYPE_LABELS[ev.type]})`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0"></span>
                      <span className="truncate">{ev.userName}</span>
                    </div>
                  ))}
                  {dayMeetings.map((mt, idx) => (
                    <div 
                      key={`mt-${idx}`} 
                      className="text-[10px] px-2 py-1.5 rounded-xl bg-violet-600 text-white truncate font-bold flex items-center gap-1.5 shadow-md shadow-violet-100 transition-all hover:scale-105"
                      title={`Meeting: ${mt.title}`}
                    >
                      <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      <span className="truncate">{mt.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-6 justify-center">
          <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm"></div>
            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">휴가</span>
          </div>
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm"></div>
            <span className="text-[11px] font-black text-blue-700 uppercase tracking-widest">출장</span>
          </div>
          <div className="flex items-center gap-3 bg-violet-50 px-4 py-2 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm"></div>
            <span className="text-[11px] font-black text-violet-700 uppercase tracking-widest">회의</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
