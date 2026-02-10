
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LeaveRequest, LeaveType, Meeting } from '../types';
import { dataService } from '../services/dataService';
import { LEAVE_TYPE_COLORS, LEAVE_TYPE_LABELS } from '../constants';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const fetchData = async () => {
    const session = localStorage.getItem('friendly_current_session');
    if (session) {
      try {
        setCurrentUser(JSON.parse(session));
      } catch (e) { console.error("Session parse error"); }
    }
    
    setLoading(true);
    try {
      const reqs = await dataService.getRequests().catch(() => []);
      const users = await dataService.getUsers().catch(() => []);
      const meetings = await dataService.getMeetings().catch(() => []);
      
      setAllRequests(reqs.filter(r => r.status === 'APPROVED' || r.status === 'PENDING_FINAL' || r.status === 'PENDING_PL'));
      setAllMeetings(meetings || []);
      
      if (session) {
        const u = JSON.parse(session);
        const freshUser = users.find(x => x.id === u.id);
        if (freshUser) setCurrentUser(freshUser);
      }
    } catch (err) { 
      console.error('Dashboard data fetch failed', err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    if (window.innerWidth < 1024) {
      setShowMobileDetail(true);
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(i);
    
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDay(null);
    setShowMobileDetail(false);
  };

  const getEventsForDate = useCallback((day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dailyRequests = allRequests.filter(req => dateStr >= req.startDate && dateStr <= req.endDate);
    const dailyMeetings = (allMeetings || []).filter(m => m.startTime && m.startTime.startsWith(dateStr));
    return { requests: dailyRequests, meetings: dailyMeetings };
  }, [currentDate, allRequests, allMeetings]);

  if (loading && !currentUser) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const user = currentUser || { totalLeave: 15, usedLeave: 0, extraLeaveAvailable: 0, extraLeaveUsed: 0, name: '사용자' };
  const remainingExtra = (user.extraLeaveAvailable || 0) - (user.extraLeaveUsed || 0);
  const selectedDateEvents = selectedDay ? getEventsForDate(selectedDay) : { requests: [], meetings: [] };

  return (
    <div className="space-y-6 md:space-y-10 pb-20 relative">
      {/* 웰컴 섹션 */}
      <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-indigo-600 p-8 md:p-16 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4">{user.name}님, 환영합니다!</h1>
          <p className="text-indigo-100/80 mb-8 font-medium">친절한 휴가 관리를 도와드릴게요.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/apply')} className="px-8 py-4 bg-white text-indigo-600 rounded-[20px] font-black text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95">휴가 신청</button>
            <button onClick={() => navigate('/extra-work')} className="px-8 py-4 bg-indigo-500/40 text-white rounded-[20px] font-black text-sm border border-white/20 hover:bg-indigo-500/60 transition-all active:scale-95">근무 보고</button>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">잔여 연차</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-black text-slate-900">{user.totalLeave - user.usedLeave}</span>
            <span className="text-sm font-bold text-slate-400">/ {user.totalLeave}d</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${((user.totalLeave - user.usedLeave) / (user.totalLeave || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
             <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">보상 휴가 잔여</p>
             <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[8px] font-black rounded-full uppercase">Reward</span>
          </div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-black text-slate-900">{remainingExtra}</span>
            <span className="text-sm font-bold text-slate-400">/ {user.extraLeaveAvailable || 0}d</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-violet-500 h-full transition-all duration-1000" style={{ width: remainingExtra > 0 ? `${(remainingExtra / (user.extraLeaveAvailable || 1)) * 100}%` : '0%' }}></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">대기 중인 신청</p>
          <div className="text-5xl font-black text-slate-900 mb-6">{allRequests.filter(r => r.userId === user.id && r.status.startsWith('PENDING')).length} <span className="text-sm text-slate-400">건</span></div>
          <p className="text-[10px] font-bold text-slate-400">관리자 승인 시 알림이 발송됩니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 캘린더 영역 */}
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[40px] md:rounded-[48px] shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <h2 className="text-2xl font-black text-slate-900">월간 일정</h2>
            <div className="flex items-center bg-slate-100 p-1.5 rounded-[20px]">
              <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-white rounded-xl transition-all shadow-sm md:shadow-none"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg></button>
              <span className="px-6 text-sm font-black text-slate-900 min-w-[120px] text-center">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </span>
              <button onClick={() => changeMonth(1)} className="p-3 hover:bg-white rounded-xl transition-all shadow-sm md:shadow-none"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg></button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4 px-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`text-center text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-400' : i === 6 ? 'text-indigo-400' : 'text-slate-300'}`}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
            {calendarDays.map((day, idx) => {
              const { requests, meetings } = day ? getEventsForDate(day) : { requests: [], meetings: [] };
              const isToday = day && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              const isSelected = day === selectedDay;
              
              return (
                <div 
                  key={idx} 
                  onClick={() => { if(day) handleDayClick(day); }}
                  className={`min-h-[80px] md:min-h-[120px] bg-white p-1.5 md:p-3 group transition-all cursor-pointer relative ${!day ? 'bg-slate-50/50' : ''} ${isSelected ? 'ring-2 ring-inset ring-indigo-600 bg-indigo-50/30 z-10 scale-[1.02]' : 'hover:bg-slate-50/80'}`}
                >
                  {day && (
                    <>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] md:text-xs font-black ${isToday ? 'w-5 h-5 md:w-6 md:h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg' : isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-900'}`}>
                          {day}
                        </span>
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {requests.slice(0, 2).map(req => (
                          <div key={req.id} className={`px-1 py-0.5 rounded-[4px] text-[7px] md:text-[8px] font-bold truncate border ${LEAVE_TYPE_COLORS[req.type]} opacity-90`}>
                            {req.userName}
                          </div>
                        ))}
                        {(meetings || []).slice(0, 1).map(m => (
                          <div key={m.id} className="px-1 py-0.5 rounded-[4px] text-[7px] md:text-[8px] font-bold truncate bg-slate-900 text-white">
                            {m.title.split(']')[1] || m.title}
                          </div>
                        ))}
                        {(requests.length + meetings.length) > 3 && (
                          <div className="text-[6px] md:text-[7px] font-black text-slate-300 pl-1">+{requests.length + meetings.length - 3}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 상세 일정 영역 (데스크톱 전용 사이드 패널) */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 min-h-[400px] lg:sticky lg:top-24">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{selectedDay ? `${currentDate.getMonth() + 1}월 ${selectedDay}일 상세 일정` : '일자를 선택하세요'}</h3>
                <p className="text-[10px] font-bold text-slate-400">부재 현황 및 회의 목록</p>
              </div>
            </div>

            <div className="space-y-4">
              {selectedDay ? (
                <>
                  {selectedDateEvents.requests.length === 0 && selectedDateEvents.meetings.length === 0 ? (
                    <div className="py-20 text-center">
                       <p className="text-xs font-bold text-slate-300 italic">등록된 일정이 없습니다.</p>
                    </div>
                  ) : (
                    <>
                      {selectedDateEvents.requests.map(req => (
                        <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-xs font-black text-slate-900">{req.userName} <span className="text-[10px] text-slate-400 font-bold">({req.userTeam})</span></span>
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${LEAVE_TYPE_COLORS[req.type]}`}>{LEAVE_TYPE_LABELS[req.type]}</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 leading-relaxed line-clamp-2">{req.reason}</p>
                        </div>
                      ))}
                      {selectedDateEvents.meetings.map(m => (
                        <div key={m.id} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Meeting</span>
                             <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded">{m.startTime && m.startTime.includes('T') ? m.startTime.split('T')[1].substring(0, 5) : '시간미정'}</span>
                          </div>
                          <p className="text-xs font-black mb-1">{m.title}</p>
                          <p className="text-[9px] font-bold opacity-70 line-clamp-1">{m.description}</p>
                        </div>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>
                   </div>
                   <p className="text-[11px] font-black text-slate-300">캘린더의 날짜를 클릭하면<br/>상세 일정을 볼 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 상세 일정 바텀 시트 (팝업) */}
      {showMobileDetail && selectedDay && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center lg:hidden">
          {/* 백드롭 (배경 클릭 시 닫기) */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setShowMobileDetail(false)}
          />
          
          {/* 바텀 시트 본체 */}
          <div className="relative w-full max-w-xl bg-white rounded-t-[40px] shadow-2xl p-6 md:p-10 animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto scrollbar-hide">
            {/* 상단 닫기 핸들 바 */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full cursor-pointer" onClick={() => setShowMobileDetail(false)} />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{currentDate.getMonth() + 1}월 {selectedDay}일 상세</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Schedule</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMobileDetail(false)}
                className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4 pb-10">
              {selectedDateEvents.requests.length === 0 && selectedDateEvents.meetings.length === 0 ? (
                <div className="py-20 text-center">
                   <p className="text-sm font-bold text-slate-300 italic">등록된 일정이 없습니다.</p>
                </div>
              ) : (
                <>
                  {selectedDateEvents.requests.map(req => (
                    <div key={req.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                         <span className="text-sm font-black text-slate-900">{req.userName} <span className="text-xs text-slate-400 font-bold">({req.userTeam})</span></span>
                         <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${LEAVE_TYPE_COLORS[req.type]}`}>{LEAVE_TYPE_LABELS[req.type]}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed">{req.reason}</p>
                    </div>
                  ))}
                  {selectedDateEvents.meetings.map(m => (
                    <div key={m.id} className="p-5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                      <div className="flex justify-between items-start mb-3">
                         <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-md">Meeting</span>
                         <span className="text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-md">{m.startTime && m.startTime.includes('T') ? m.startTime.split('T')[1].substring(0, 5) : '시간미정'}</span>
                      </div>
                      <p className="text-sm font-black mb-1">{m.title}</p>
                      <p className="text-xs font-bold opacity-70 leading-snug">{m.description}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            <button 
              onClick={() => setShowMobileDetail(false)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl mt-4"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
